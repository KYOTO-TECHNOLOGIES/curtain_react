import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  CreditCard,
  Activity,
  Wrench,
  Package,
  Users,
  Tag,
  LogOut,
  X,
  Settings
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

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
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/orders', label: 'Orders', icon: Activity },
      { to: '/installation', label: 'Installation', icon: Wrench },
      { to: '/inventory', label: 'Inventory', icon: Package },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/catalog', label: 'Catalog & Pricing', icon: Tag },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  }
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3.5 px-4 py-3 mx-4 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-white/10 text-white shadow-sm'
        : 'text-white/70 hover:bg-white/5 hover:text-white'
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
          fixed top-0 left-0 z-50 h-screen w-[250px] flex flex-col
          bg-[#2b5c8f]
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8">
          <div>
            <h1 className="text-white font-extrabold text-[22px] tracking-tight leading-none mb-1">
              CurtainMaster
            </h1>
            <span className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase">
              Enterprise Suite
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 space-y-6 overflow-y-auto scrollbar-none">
          {navSections.map((section, i) => (
            <div key={i}>
              {section.label && (
                <p className="px-6 mb-3 text-[11px] font-bold tracking-[0.15em] text-white/50 uppercase">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item: any, j: number) => (
                  <li key={j}>
                    <NavLink to={item.to} className={linkClass} onClick={onClose}>
                      <item.icon className="w-[18px] h-[18px] shrink-0 opacity-80" strokeWidth={2.5} />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User logout section */}
        <div className="px-4 pb-6 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px] opacity-80" strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
