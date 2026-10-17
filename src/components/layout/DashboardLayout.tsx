import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import type { RootState } from '../../store';

function DashboardLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarWidth, isReady, isTabletOverlayOpen, closeOverlay } = useSidebar();

  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.full_name?.split(' ')[0] || 'Basheer';
  const roleName = user?.role?.name || 'Administrator';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div
      className="flex h-screen bg-[#F6F8FB] overflow-hidden font-['Hanken_Grotesk'] text-[#0B1B33]"
      style={{ '--sidebar-w': sidebarWidth } as React.CSSProperties}
      data-ready={isReady ? 'true' : undefined}
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tablet Overlay Backdrop (768px - 1279px when expanded) */}
      {isTabletOverlayOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/35 backdrop-blur-[2px] transition-opacity duration-260"
          onClick={closeOverlay}
          aria-hidden="true"
        />
      )}

      {/* Redesigned Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop & Mobile Topbar */}
        <header className="flex items-center justify-between px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] h-[76px] shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar - Login Page Input Styling */}
            <div className="hidden sm:flex items-center relative w-full max-w-[420px] group">
              <Search
                className="w-4.5 h-4.5 text-[#94A3B8] absolute left-3.5 pointer-events-none group-focus-within:text-[#0B1B33] transition-colors duration-150"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="Search orders, clients, textiles..."
                className="w-full h-11 pl-10.5 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2A5FA8] focus:ring-4 focus:ring-[#2A5FA8]/16 rounded-[14px] text-[14px] font-medium text-[#0B1B33] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_12px_-4px_rgba(10,18,32,0.06)] outline-none transition-all duration-180"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <button
                title="Notifications"
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F1F5F9] transition-colors relative"
              >
                <Bell className="w-5 h-5" strokeWidth={2} />
                <span className="w-2 h-2 rounded-full bg-[#2A5FA8] absolute top-2.5 right-2.5"></span>
              </button>
              <button
                title="Help & Documentation"
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[#64748B] hover:text-[#0B1B33] hover:bg-[#F1F5F9] transition-colors"
              >
                <HelpCircle className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="h-6 w-px bg-[#E2E8F0] hidden sm:block"></div>

            {/* User Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50/80 p-1.5 pr-3 rounded-2xl border border-transparent hover:border-[#E2E8F0] transition-all"
            >
              <div
                className="w-9.5 h-9.5 rounded-xl bg-gradient-to-b from-[#3366B2] to-[#2A5FA8] text-white flex items-center justify-center font-bold text-[14px] shadow-[0_2px_8px_-2px_rgba(42,95,168,0.5)] group-hover:scale-105 transition-all"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {initial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[13.5px] font-bold text-[#0B1B33] leading-tight group-hover:text-[#2A5FA8] transition-colors">
                  {firstName}
                </p>
                <p className="text-[11px] font-medium text-[#64748B]">
                  {roleName}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F6F8FB] w-full min-w-0">
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
