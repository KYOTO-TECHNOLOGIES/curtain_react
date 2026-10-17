import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isReady: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTabletOverlayOpen: boolean;
  closeOverlay: () => void;
  sidebarWidth: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'cm.sidebar.collapsed';

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === '1';
    }
    // Default based on screen width:
    // 1280px and above: expanded (false)
    // 768px to 1279px: collapsed rail (true)
    // below 768px: expanded (false)
    const w = window.innerWidth;
    if (w >= 768 && w < 1280) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsed);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // Responsive flags
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1280;
  const isDesktop = windowWidth >= 1280;

  // In tablet mode, if expanded, it acts as an overlay
  const isTabletOverlayOpen = isTablet && !isCollapsed;

  // Mark data-ready after first render to prevent initial animation flash
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist collapse state
  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  const closeOverlay = useCallback(() => {
    if (isTablet && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [isTablet, isCollapsed]);

  // Dispatch window resize event 270ms after transition ends so tables, charts and sticky elements update
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 270);
    return () => clearTimeout(timer);
  }, [isCollapsed, isReady]);

  // Keyboard shortcut: Ctrl/Cmd + B & Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = document.activeElement;
        if (target) {
          const tagName = target.tagName.toLowerCase();
          if (['input', 'textarea', 'select'].includes(tagName)) return;
          if ((target as HTMLElement).isContentEditable) return;
        }
        if (document.querySelector('[role="dialog"], [aria-modal="true"], .modal')) {
          return;
        }
        e.preventDefault();
        toggleCollapse();
      } else if (e.key === 'Escape') {
        if (isTablet && !isCollapsed) {
          closeOverlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse, isTablet, isCollapsed, closeOverlay]);

  // Sidebar CSS width value
  const sidebarWidth = isMobile
    ? '0px'
    : isTablet
    ? '72px'
    : isCollapsed
    ? '72px'
    : '264px';

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setCollapsed,
        isReady,
        isMobile,
        isTablet,
        isDesktop,
        isTabletOverlayOpen,
        closeOverlay,
        sidebarWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
