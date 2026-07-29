import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Shield, KeyRound, Settings as SettingsIcon } from 'lucide-react';

const settingsNav = [
  { to: '/settings/roles', label: 'Roles', icon: Shield, description: 'Manage user roles and system access levels' },
  { to: '/settings/permissions', label: 'Permissions', icon: KeyRound, description: 'Define granular permissions for roles' },
];

export default function SettingsLayout() {
  const location = useLocation();

  // If we are exactly at /settings, redirect to the first tab
  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to="/settings/roles" replace />;
  }

  return (
    <div className="space-y-6 animate-page-in h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#2b5c8f]" /> Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure your system preferences and access control</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <nav className="flex flex-col gap-2">
            {settingsNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border ${
                    isActive
                      ? 'bg-white border-[#2b5c8f]/20 shadow-sm ring-1 ring-[#2b5c8f]/10'
                      : 'bg-transparent border-transparent hover:bg-white/50 text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-[#2b5c8f]/10 text-[#2b5c8f]' : 'bg-slate-100 text-slate-500'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isActive ? 'text-[#2b5c8f]' : 'text-slate-700'}`}>{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 overflow-y-auto pb-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
