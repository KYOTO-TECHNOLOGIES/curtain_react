import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  KeyRound,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';
import type { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navSections = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/customers', label: 'Customers', icon: Building2 },
    ],
  },
  {
    label: 'ACCESS CONTROL',
    items: [
      { to: '/roles', label: 'Roles', icon: Shield },
      { to: '/permissions', label: 'Permissions', icon: KeyRound },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/10 text-white shadow-sm'
        : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[272px] flex flex-col
          bg-gradient-to-b from-[#0f172a] to-[#162033]
          border-r border-white/[0.06]
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
              CM
            </div>
            <div>
              <h1 className="text-white font-semibold text-[15px] leading-tight">Curtain Master</h1>
              <span className="text-slate-500 text-[11px] font-medium tracking-wider uppercase">CRM</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto scrollbar-thin">
          {navSections.map((section, i) => (
            <div key={i}>
              {section.label && (
                <p className="px-4 mb-2 text-[11px] font-semibold tracking-[0.1em] text-slate-600 uppercase">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className={linkClass} onClick={onClose}>
                      <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 pb-5 mt-auto">
          <div className="border-t border-white/[0.06] pt-4 mb-3" />
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-semibold shadow-md">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
