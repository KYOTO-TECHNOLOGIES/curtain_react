import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, Building2, Shield, KeyRound, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import type { RootState } from '../store';
import { usersApi } from '../api/users';
import { customersApi } from '../api/customers';
import { rolesApi } from '../api/roles';
import { permissionsApi } from '../api/permissions';

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
  bg: string;
  link: string;
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState({ users: null as number | null, customers: null as number | null, roles: null as number | null, permissions: null as number | null });

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c, r, p] = await Promise.allSettled([
          usersApi.list(),
          customersApi.list(),
          rolesApi.list(),
          permissionsApi.list(),
        ]);
        setStats({
          users: u.status === 'fulfilled' ? u.value.data.length : 0,
          customers: c.status === 'fulfilled' ? c.value.data.length : 0,
          roles: r.status === 'fulfilled' ? r.value.data.length : 0,
          permissions: p.status === 'fulfilled' ? p.value.data.length : 0,
        });
      } catch { /* handled by allSettled */ }
    };
    load();
  }, []);

  const cards: StatCard[] = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/users' },
    { label: 'Customers', value: stats.customers, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/customers' },
    { label: 'Roles', value: stats.roles, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50', link: '/roles' },
    { label: 'Permissions', value: stats.permissions, icon: KeyRound, color: 'text-amber-600', bg: 'bg-amber-50', link: '/permissions' },
  ];

  const quickLinks = [
    { label: 'Add New User', to: '/users', color: 'from-blue-500 to-blue-600' },
    { label: 'Add Customer', to: '/customers', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Manage Roles', to: '/roles', color: 'from-violet-500 to-violet-600' },
    { label: 'Manage Permissions', to: '/permissions', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-page-in">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Welcome back, <span className="text-[#2b5c8f]">{user?.full_name?.split(' ')[0] || 'Admin'}</span> 👋
        </h1>
        <p className="mt-1.5 text-slate-500 text-[15px]">Here's what's happening with your CRM today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {card.value === null ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-[#2b5c8f] transition-colors">
              <TrendingUp className="w-3.5 h-3.5" />
              View details
              <ArrowRight className="w-3 h-3 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`group flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r ${link.color} text-white font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
            >
              <span className="flex-1">{link.label}</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="px-4 py-3 rounded-xl bg-slate-50">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Email</span>
            <p className="mt-1 text-slate-800 font-medium">{user?.email}</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Role</span>
            <p className="mt-1 text-slate-800 font-medium">{user?.role?.name || '—'}</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Status</span>
            <p className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
