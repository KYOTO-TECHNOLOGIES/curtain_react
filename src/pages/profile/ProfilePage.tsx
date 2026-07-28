import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, Lock, Mail, Shield, Loader2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/auth';
import type { RootState } from '../../store';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingProfile(true);
    try {
      await usersApi.update(user.id, { full_name: profileForm.full_name });
      showToast('Profile updated successfully! Changes will reflect on next login.');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to update profile', 'error');
    }
    setSavingProfile(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return showToast('New passwords do not match', 'error');
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      showToast('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to change password', 'error');
    }
    setSavingPassword(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-page-in font-sans pb-10 max-w-4xl mx-auto mt-4">
      <div className="mb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-[#2b5c8f] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-[32px] md:text-[42px] font-bold text-[#1e293b] tracking-tight">My Profile</h1>
        <p className="mt-3 text-slate-500 font-medium text-[16px]">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#2b5c8f] text-white flex items-center justify-center font-bold text-[36px] shadow-lg mb-6">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-[20px] font-bold text-slate-800 mb-1">{user.full_name}</h2>
            <p className="text-[14px] font-medium text-slate-500 mb-4">{user.email}</p>
            
            <div className="w-full h-px bg-slate-100 my-4"></div>
            
            <div className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-[#2b5c8f] bg-[#e6ebf0] py-2 px-4 rounded-xl">
              <Shield className="w-4 h-4" />
              {user.role?.name || 'User'}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Profile Form */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-[18px] font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2b5c8f]" /> Personal Information
            </h3>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Full Name</label>
                <div className="group relative flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
                  <User className="w-[20px] h-[20px] text-slate-400 mr-3 group-focus-within:text-[#2b5c8f] transition-colors" />
                  <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ full_name: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 font-medium text-[15px]" />
                </div>
              </div>
              
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Email Address</label>
                <div className="flex items-center bg-slate-50 rounded-2xl px-5 py-3.5 border border-slate-200 cursor-not-allowed">
                  <Mail className="w-[20px] h-[20px] text-slate-400 mr-3" />
                  <input type="email" value={user.email} disabled className="flex-1 bg-transparent outline-none text-slate-500 font-medium text-[15px] cursor-not-allowed" />
                </div>
                <p className="text-[12px] text-slate-400 mt-2 font-medium">Email address cannot be changed.</p>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={savingProfile} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2b5c8f] text-white font-semibold rounded-2xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0">
                  {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-[18px] font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2b5c8f]" /> Change Password
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Current Password</label>
                <div className="group relative flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
                  <Lock className="w-[20px] h-[20px] text-slate-400 mr-3 group-focus-within:text-[#2b5c8f] transition-colors" />
                  <input type="password" placeholder="••••••••" required value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 font-medium text-[15px] placeholder-slate-300" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-2">New Password</label>
                  <div className="group relative flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
                    <Lock className="w-[20px] h-[20px] text-slate-400 mr-3 group-focus-within:text-[#2b5c8f] transition-colors" />
                    <input type="password" placeholder="••••••••" required minLength={8} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 font-medium text-[15px] placeholder-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-2">Confirm Password</label>
                  <div className="group relative flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
                    <Lock className="w-[20px] h-[20px] text-slate-400 mr-3 group-focus-within:text-[#2b5c8f] transition-colors" />
                    <input type="password" placeholder="••••••••" required minLength={8} value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 font-medium text-[15px] placeholder-slate-300" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={savingPassword} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 text-white font-semibold rounded-2xl hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0">
                  {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
