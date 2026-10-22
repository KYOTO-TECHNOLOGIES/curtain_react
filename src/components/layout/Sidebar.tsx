import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  CreditCard,
  Activity,
  Package,
  Users,
  UserCog,
  Tag,
  LogOut,
  X,
  Settings,
  Factory,
  Wrench,
  Warehouse,
  ChevronsLeft,
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useSidebar } from './SidebarContext';
import SidebarTooltip from './SidebarTooltip';
import './Sidebar.css';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navSections = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/appointments', label: 'Appointments', icon: Calendar },
      { to: '/quotations', label: 'Quotations', icon: FileText },
      { to: '/orders', label: 'Orders', icon: Package },
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/activities', label: 'Activities', icon: Activity },
      { to: '/production', label: 'Production', icon: Factory },
      { to: '/installation', label: 'Installation', icon: Wrench },
      { to: '/inventory', label: 'Inventory', icon: Warehouse },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/catalog', label: 'Catalog & Pricing', icon: Tag },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/users', label: 'Users', icon: UserCog },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// Module-level flag to ensure the 25ms staggered entrance animation only plays once on first session load
let hasPlayedEntranceAnimation = false;

export default function Sidebar({ open, onClose }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isCollapsed,
    toggleCollapse,
    isMobile,
    isTabletOverlayOpen,
    closeOverlay,
  } = useSidebar();

  const navRef = useRef<HTMLElement | null>(null);
  const navInnerRef = useRef<HTMLDivElement | null>(null);
  const linksMapRef = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // Detect Mac for shortcut display in tooltip
  const [isMac, setIsMac] = useState<boolean>(false);
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform || ''));
    }
  }, []);

  // Entrance animation on first session mount only
  const [shouldAnimateEntrance] = useState<boolean>(() => !hasPlayedEntranceAnimation);
  useEffect(() => {
    if (shouldAnimateEntrance) {
      const timer = setTimeout(() => {
        hasPlayedEntranceAnimation = true;
      }, 360 + 14 * 25 + 50);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimateEntrance]);

  // Logout handler
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  // Shared sliding active highlight measurement
  const [highlightStyle, setHighlightStyle] = useState<{
    left: number;
    top: number;
    height: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    height: 44,
    width: 0,
    opacity: 0,
  });

  // Calculate active route key
  const getActiveItemKey = useCallback(() => {
    const currentPath = location.pathname;
    const allItems = navSections.flatMap((s) => s.items);

    // Exact match or prefix match for the current navigation item.
    const matched = allItems.find((item) => {
      return currentPath === item.to || currentPath.startsWith(item.to + '/');
    });

    return matched ? matched.to : null;
  }, [location.pathname]);

  const activeKey = getActiveItemKey();

  const updateHighlight = useCallback(() => {
    const navInner = navInnerRef.current;
    if (!activeKey || !navInner) {
      setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const el = linksMapRef.current.get(activeKey);
    if (!el) {
      setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const linkRect = el.getBoundingClientRect();
    const navRect = navInner.getBoundingClientRect();

    setHighlightStyle({
      left: linkRect.left - navRect.left,
      top: linkRect.top - navRect.top,
      height: el.offsetHeight,
      width: el.offsetWidth,
      opacity: 1,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updateHighlight();
  }, [updateHighlight, isCollapsed, location.pathname]);

  // Re-measure highlight on resize
  useEffect(() => {
    const navEl = navRef.current;
    const navInner = navInnerRef.current;
    const activeLink = activeKey ? linksMapRef.current.get(activeKey) : null;
    if (!navEl || !navInner) return;
    const ro = new ResizeObserver(() => {
      updateHighlight();
    });
    ro.observe(navEl);
    ro.observe(navInner);
    if (activeLink) ro.observe(activeLink);
    navInner.addEventListener('animationend', updateHighlight);
    document.fonts?.ready.then(updateHighlight);
    return () => {
      ro.disconnect();
      navInner.removeEventListener('animationend', updateHighlight);
    };
  }, [activeKey, updateHighlight]);

  // Scroll active item into view on initial mount
  useEffect(() => {
    if (activeKey) {
      const el = linksMapRef.current.get(activeKey);
      el?.scrollIntoView({ block: 'nearest' });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scroll fade masks
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [canScrollBottom, setCanScrollBottom] = useState(false);

  const checkScrollFades = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollTop(scrollTop > 2);
    setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 2);
  }, []);

  useEffect(() => {
    checkScrollFades();
  }, [checkScrollFades, isCollapsed]);

  // Mouse spotlight coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
  };

  const handleLinkClick = () => {
    if (isMobile && open) {
      onClose();
    }
    if (isTabletOverlayOpen) {
      closeOverlay();
    }
  };

  // Determine aside classes
  const isAsideCollapsed = isMobile ? false : isCollapsed;
  const asideClasses = [
    'cm-sidebar-aside',
    isAsideCollapsed ? 'cm-sidebar--collapsed' : 'cm-sidebar--expanded',
    isTabletOverlayOpen ? 'cm-sidebar--tablet-overlay' : '',
    // Mobile transform
    isMobile
      ? open
        ? 'translate-x-0'
        : '-translate-x-full'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  let globalItemIndex = 0;

  return (
    <aside
      id="app-sidebar"
      aria-label="Application sidebar"
      className={asideClasses}
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="cm-sidebar-header">
        <div className="cm-header-layout">
          {/* Expanded Wordmark */}
          <div
            className={`cm-wordmark-wrapper ${
              isAsideCollapsed ? 'cm-wordmark--hidden' : 'cm-wordmark--visible'
            }`}
            aria-hidden={isAsideCollapsed}
          >
            <Link
              to="/dashboard"
              className="cm-logo-link group"
              onClick={handleLinkClick}
              aria-label="CurtainMaster Enterprise Suite"
            >
              <h1 className="cm-logo-title">
                CurtainMaster<span className="cm-logo-dot">.</span>
              </h1>
              <span className="cm-logo-caption">ENTERPRISE SUITE</span>
            </Link>
          </div>

          {/* Collapsed Monogram */}
          <div
            className={`cm-monogram-wrapper ${
              isAsideCollapsed ? 'cm-monogram--visible' : 'cm-monogram--hidden'
            }`}
            aria-hidden={!isAsideCollapsed}
          >
            <SidebarTooltip content="CurtainMaster Dashboard" disabled={!isAsideCollapsed}>
              <Link
                to="/dashboard"
                className="cm-monogram-tile"
                onClick={handleLinkClick}
                aria-label="CurtainMaster Enterprise Suite"
              >
                <span className="cm-monogram-text">C</span>
                <span className="cm-logo-dot cm-monogram-dot">.</span>
              </Link>
            </SidebarTooltip>
          </div>

          {/* Desktop/Tablet Collapse Toggle */}
          {!isMobile && (
            <div
              className={`cm-toggle-wrapper ${
                isAsideCollapsed
                  ? 'cm-toggle-wrapper--collapsed'
                  : 'cm-toggle-wrapper--expanded'
              }`}
            >
              <SidebarTooltip
                content={isAsideCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                shortcut={isMac ? '⌘ B' : 'Ctrl B'}
              >
                <button
                  type="button"
                  onClick={toggleCollapse}
                  aria-expanded={!isAsideCollapsed}
                  aria-controls="app-sidebar"
                  aria-label={isAsideCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="cm-collapse-btn"
                >
                  <ChevronsLeft
                    size={16}
                    className={`cm-collapse-icon ${
                      isAsideCollapsed ? 'cm-collapse-icon--flipped' : ''
                    }`}
                  />
                </button>
              </SidebarTooltip>
            </div>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="cm-mobile-close-btn"
              aria-label="Close navigation"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* ── NAVIGATION ────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="cm-nav-scroll"
        ref={navRef}
        onScroll={checkScrollFades}
        data-mask-top={canScrollTop ? 'true' : undefined}
        data-mask-bottom={canScrollBottom ? 'true' : undefined}
      >
        <div className="cm-nav-inner" ref={navInnerRef}>
          {/* Shared Sliding Active Highlight */}
          {Boolean(activeKey) && (
            <div
              className="cm-active-highlight"
              style={{
                transform: `translate(${highlightStyle.left}px, ${highlightStyle.top}px)`,
                height: `${highlightStyle.height}px`,
                width: `${highlightStyle.width}px`,
                opacity: highlightStyle.opacity,
              }}
              aria-hidden="true"
            >
              {/* Flush left 3px x 20px accent bar */}
              <span className="cm-active-accent-bar" />
            </div>
          )}

          {navSections.map((section, sectionIdx) => {
            const sectionHeaderId = `cm-section-label-${sectionIdx}`;

            return (
              <div
                key={sectionIdx}
                className="cm-section-group"
                role={section.label ? 'group' : undefined}
                aria-labelledby={section.label ? sectionHeaderId : undefined}
              >
                {/* Section Header */}
                {section.label && (
                  <div
                    className={`cm-section-header ${
                      isAsideCollapsed
                        ? 'cm-section-header--collapsed'
                        : 'cm-section-header--expanded'
                    }`}
                  >
                    <span
                      id={sectionHeaderId}
                      className={isAsideCollapsed ? 'cm-sr-only' : 'cm-section-title'}
                    >
                      {section.label}
                    </span>
                    {isAsideCollapsed ? (
                      <div className="cm-section-divider-collapsed" aria-hidden="true" />
                    ) : (
                      <span className="cm-section-line" aria-hidden="true" />
                    )}
                  </div>
                )}

                {/* Section Items */}
                <ul className="cm-items-list">
                  {section.items.map((item) => {
                    const itemIdx = globalItemIndex++;
                    const IconComponent = item.icon;

                    const entranceStyle = shouldAnimateEntrance
                      ? {
                          animation:
                            'cm-item-entrance 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
                          animationDelay: `${Math.min(itemIdx, 14) * 25}ms`,
                        }
                      : undefined;

                    return (
                      <li key={item.to} className="cm-nav-item" style={entranceStyle}>
                        <SidebarTooltip
                          content={item.label}
                          disabled={!isAsideCollapsed}
                        >
                          <NavLink
                            to={item.to}
                            onClick={handleLinkClick}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className={({ isActive }) =>
                              `cm-nav-link ${isActive ? 'active' : ''}`
                            }
                            ref={(el) => {
                              if (el) linksMapRef.current.set(item.to, el);
                              else linksMapRef.current.delete(item.to);
                            }}
                          >
                            <span className="cm-item-icon-wrapper">
                              <IconComponent
                                size={20}
                                strokeWidth={1.75}
                                className="cm-item-icon"
                              />
                            </span>
                            <span
                              className={`cm-item-label ${
                                isAsideCollapsed ? 'cm-item-label--collapsed' : ''
                              }`}
                            >
                              {item.label}
                            </span>
                          </NavLink>
                        </SidebarTooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── PINNED FOOTER (SIGN OUT) ───────────────────────── */}
      <div className="cm-sidebar-footer">
        <SidebarTooltip content="Sign Out" disabled={!isAsideCollapsed}>
          <button
            type="button"
            onClick={handleLogout}
            className={`cm-nav-link cm-signout-btn ${
              isAsideCollapsed ? 'cm-signout-btn--collapsed' : ''
            }`}
            aria-label="Sign out"
          >
            <span className="cm-item-icon-wrapper">
              <LogOut size={20} strokeWidth={1.75} className="cm-item-icon cm-signout-icon" />
            </span>
            <span
              className={`cm-item-label ${
                isAsideCollapsed ? 'cm-item-label--collapsed' : ''
              }`}
            >
              Sign Out
            </span>
          </button>
        </SidebarTooltip>
      </div>
    </aside>
  );
}
