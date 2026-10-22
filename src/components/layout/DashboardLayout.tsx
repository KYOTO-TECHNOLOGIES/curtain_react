import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Bell, BriefcaseBusiness, ConciergeBell, HelpCircle, Menu, Search, ShieldCheck,
  UserCog, X,
} from 'lucide-react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import type { RootState } from '../../store';
import './DashboardLayout.css';

const rolePalette = [
  { color: '#2F5D8F', tint: '#EEF4FA', ink: '#2F5D8F' },
  { color: '#10B981', tint: '#E8F8F2', ink: '#047857' },
  { color: '#F97316', tint: '#FFF4EA', ink: '#C2410C' },
  { color: '#8B5CF6', tint: '#F3EFFE', ink: '#6D28D9' },
  { color: '#F59E0B', tint: '#FFFBEB', ink: '#B45309' },
  { color: '#14B8A6', tint: '#E6F8F6', ink: '#0F766E' },
  { color: '#6366F1', tint: '#EEF2FF', ink: '#4338CA' },
  { color: '#EC4899', tint: '#FDF2F8', ink: '#BE185D' },
];

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function getRolePresentation(role: string) {
  const normalized = role.trim().toLowerCase();
  if (normalized === 'administrator' || normalized === 'admin') {
    return { ...rolePalette[0], Icon: ShieldCheck };
  }
  if (normalized === 'receptionist') {
    return { ...rolePalette[3], Icon: ConciergeBell };
  }
  if (normalized === 'salesman') {
    return { ...rolePalette[5], Icon: BriefcaseBusiness };
  }
  return {
    ...rolePalette[stableHash(normalized || 'role') % rolePalette.length],
    Icon: UserCog,
  };
}

function TopbarTooltip({ content, children, className = '', tooltipClassName = '' }: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  tooltipClassName?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: Math.round(rect.bottom + 8),
      left: Math.round(rect.left + rect.width / 2),
    });
  }, []);

  const show = useCallback((immediate: boolean) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const open = () => {
      updatePosition();
      setVisible(true);
    };
    if (immediate) open();
    else timerRef.current = window.setTimeout(open, 150);
  }, [updatePosition]);

  const hide = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    hide();
  };
  const handleMouseLeave = () => hide();

  useEffect(() => {
    if (!visible) return undefined;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, updatePosition]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <span
        ref={anchorRef}
        className={`cm-topbar-tooltip-anchor ${className}`}
        onMouseEnter={() => show(false)}
        onMouseLeave={handleMouseLeave}
        onFocus={() => show(true)}
        onBlur={handleBlur}
      >
        {children}
      </span>
      {visible && position && typeof document !== 'undefined' && createPortal(
        <span
          role="tooltip"
          className={`cm-topbar-tooltip ${tooltipClassName}`}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}

function DashboardLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { sidebarWidth, isReady, isTabletOverlayOpen, closeOverlay } = useSidebar();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const scrollSentinelRef = useRef<HTMLSpanElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.full_name || 'Basheer';
  const roleName = user?.role?.name || 'Administrator';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'B';
  const rolePresentation = getRolePresentation(roleName);
  const RoleIcon = rolePresentation.Icon;

  useEffect(() => {
    const root = mainRef.current;
    const sentinel = scrollSentinelRef.current;
    if (!root || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      const target = event.target;
      if (
        target instanceof HTMLElement
        && target.closest('input, textarea, select, [contenteditable="true"]')
      ) return;
      if (document.querySelector('[aria-modal="true"], [role="dialog"]')) return;

      event.preventDefault();
      setMobileSearchOpen(true);
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const collapseMobileSearch = () => {
    if (searchValue) return;
    setMobileSearchOpen(false);
  };

  const handleSearchBlur = () => {
    window.requestAnimationFrame(collapseMobileSearch);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setMobileSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <div
      className="cm-dashboard-shell flex h-screen overflow-hidden font-['Hanken_Grotesk']"
      style={{ '--sidebar-w': sidebarWidth } as CSSProperties}
      data-ready={isReady ? 'true' : undefined}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {isTabletOverlayOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/35 backdrop-blur-[2px] transition-opacity duration-260"
          onClick={closeOverlay}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="cm-dashboard-main flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`cm-topbar${isScrolled ? ' is-scrolled' : ''}`}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="cm-topbar-menu"
            aria-label="Open navigation menu"
          >
            <Menu aria-hidden="true" />
          </button>

          <div className={`cm-topbar-search-region${mobileSearchOpen ? ' is-mobile-open' : ''}`}>
            <button
              type="button"
              className="cm-topbar-search-mobile-trigger"
              aria-label="Open search"
              onClick={() => {
                setMobileSearchOpen(true);
                window.requestAnimationFrame(() => searchInputRef.current?.focus());
              }}
            >
              <Search aria-hidden="true" />
            </button>

            <div
              role="search"
              aria-label="Global search"
              className={`cm-topbar-search-control${searchValue ? ' has-value' : ''}`}
            >
              <Search className="cm-topbar-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search orders, clients, textiles..."
                aria-label="Search orders, clients, textiles"
              />
              {searchValue && (
                <button
                  type="button"
                  className="cm-topbar-search-clear"
                  aria-label="Clear search"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSearchValue('');
                    searchInputRef.current?.focus();
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              )}
              <kbd className="cm-topbar-search-shortcut" aria-hidden="true">/</kbd>
            </div>
          </div>

          <div className="cm-topbar-spacer" />

          <div className="cm-topbar-actions">
            <div className="cm-topbar-icon-group">
              <TopbarTooltip content="Notifications">
                <button type="button" className="cm-topbar-icon-button cm-topbar-bell" aria-label="Notifications">
                  <Bell aria-hidden="true" />
                </button>
              </TopbarTooltip>
              <TopbarTooltip content="Help">
                <button type="button" className="cm-topbar-icon-button cm-topbar-help" aria-label="Help">
                  <HelpCircle aria-hidden="true" />
                </button>
              </TopbarTooltip>
            </div>

            <div className="cm-topbar-divider" aria-hidden="true" />

            <TopbarTooltip
              content={`${displayName} · ${roleName}`}
              className="cm-topbar-user-tooltip-anchor"
              tooltipClassName="cm-topbar-tooltip-user"
            >
              <Link to="/profile" className="cm-topbar-user" aria-label={`${displayName}, ${roleName}`}>
                <span className="cm-topbar-avatar" aria-hidden="true">{initial}</span>
                <span className="cm-topbar-user-copy">
                  <span className="cm-topbar-user-name" title={displayName}>{displayName}</span>
                  <span
                    className="cm-topbar-role"
                    style={{
                      '--role-color': rolePresentation.color,
                      '--role-tint': rolePresentation.tint,
                      '--role-ink': rolePresentation.ink,
                    } as CSSProperties}
                  >
                    <RoleIcon aria-hidden="true" />
                    {roleName}
                  </span>
                </span>
              </Link>
            </TopbarTooltip>
          </div>
        </header>

        <main ref={mainRef} className="cm-dashboard-scroll flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0">
          <span ref={scrollSentinelRef} className="cm-topbar-scroll-sentinel" aria-hidden="true" />
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
}
