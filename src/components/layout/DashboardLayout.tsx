import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, Search, Bell, HelpCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import type { RootState } from '../../store';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.full_name?.split(' ')[0] || 'Basheer';
  const roleName = user?.role?.name || 'Administrator';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Desktop & Mobile Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 h-[80px] shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-slate-50 rounded-full px-4 py-2.5 w-full max-w-[400px] border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Search orders, clients, textiles..." 
                className="bg-transparent border-none outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 w-full"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-700 transition-colors relative">
                <Bell className="w-[22px] h-[22px]" strokeWidth={2} />
              </button>
              <button className="text-slate-400 hover:text-slate-700 transition-colors">
                <HelpCircle className="w-[22px] h-[22px]" strokeWidth={2} />
              </button>
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
            
            {/* User Profile */}
            <Link to="/profile" className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-colors -mr-2">
              <div className="hidden sm:block text-right">
                <p className="text-[14px] font-bold text-slate-800 leading-tight group-hover:text-[#2b5c8f] transition-colors">
                  {firstName}
                </p>
                <p className="text-[11px] font-semibold text-slate-400">
                  {roleName}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#2b5c8f] text-white flex items-center justify-center font-bold text-[15px] shadow-sm group-hover:bg-[#1f456e] group-hover:scale-105 transition-all">
                {initial}
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
