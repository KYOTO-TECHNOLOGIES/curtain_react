import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ChevronRight } from 'lucide-react';

export default function SettingsDashboard() {
  const navigate = useNavigate();

  const settingsItems = [
    {
      title: 'Roles Management',
      description: 'Manage user roles and system access levels',
      icon: Shield,
      to: '/settings/roles',
      color: 'text-[#2b5c8f]',
      bg: 'bg-[#2b5c8f]/10'
    },
    {
      title: 'Permissions Management',
      description: 'Define granular permissions for roles',
      icon: KeyRound,
      to: '/settings/permissions',
      color: 'text-[#2b5c8f]',
      bg: 'bg-[#2b5c8f]/10'
    }
  ];

  return (
    <div className="space-y-8 animate-page-in font-sans pb-10 max-w-5xl mx-auto mt-4">
      <div className="text-center md:text-left mb-10">
        <h1 className="text-[32px] md:text-[42px] font-bold text-[#1e293b] tracking-tight">System Settings</h1>
        <p className="mt-3 text-slate-500 font-medium text-[16px]">Configure your system preferences and access control.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsItems.map((item) => (
          <div 
            key={item.title}
            onClick={() => navigate(item.to)}
            className="group relative flex flex-col bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] hover:ring-2 hover:ring-[#2b5c8f]/20 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${item.bg} group-hover:scale-105 transition-transform duration-300`}>
                <item.icon className={`w-8 h-8 ${item.color}`} strokeWidth={1.5} />
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f4f7f9] flex items-center justify-center group-hover:bg-[#2b5c8f] transition-colors duration-300">
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            <h3 className="text-[20px] font-bold text-[#1e293b] mb-2">{item.title}</h3>
            <p className="text-[15px] font-medium text-slate-500 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
