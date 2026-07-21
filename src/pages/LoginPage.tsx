import React, { useState } from 'react';
import { User, Lock, Laptop, Loader2, Eye, EyeOff } from 'lucide-react';
import loginImage from '../assets/WhatsApp Image 2026-07-14 at 10.27.47 PM.jpeg';
import { api } from '../api/client';
import { NetworkError, ServerError, NotFoundError, EmptyState } from '../components/errors/ErrorStates';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState<'network' | 'server' | 'notFound' | 'empty' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);

    try {
      const resultAction = await dispatch(loginUser({ email, password })).unwrap();

      console.log('Login successful:', resultAction);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      
      if (error.status === 0) {
        setErrorState('network');
      } else if (error.status >= 500) {
        setErrorState('server');
      } else if (error.status === 404) {
        setErrorState('notFound');
      } else {
        alert("Invalid email or password"); // Basic fallback for 400 errors
      }
    }
  };

  if (errorState === 'network') {
    return <NetworkError actionButton={{ label: 'Try Again', onClick: () => setErrorState(null) }} />;
  }

  if (errorState === 'server') {
    return <ServerError actionButton={{ label: 'Go Back', onClick: () => setErrorState(null) }} />;
  }

  if (errorState === 'notFound') {
    return <NotFoundError actionButton={{ label: 'Go Back', onClick: () => setErrorState(null) }} />;
  }

  if (errorState === 'empty') {
    return <EmptyState actionButton={{ label: 'Go Back', onClick: () => setErrorState(null) }} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f4f7f9] font-sans overflow-hidden">
      {/* Illustration Area */}
      <div className="relative w-full h-[45vh] md:h-screen md:w-1/2 lg:w-[55%] overflow-hidden">
        <img 
          src={loginImage} 
          alt="Curtain Installation" 
          className="w-full h-full object-cover object-top md:object-center animate-slow-pan"
        />
        {/* Subtle overlay for desktop premium feel */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent to-[#f4f7f9]/60 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* Login Form Area */}
      <div className="flex-1 -mt-8 md:mt-0 bg-[#f4f7f9] rounded-t-[2.5rem] md:rounded-none relative z-10 flex flex-col justify-center items-center px-6 pt-10 pb-8 md:w-1/2 lg:w-[45%] md:px-12 lg:px-24">
        
        {/* Desktop-only subtle decorative elements */}
        <div className="hidden md:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[100px]"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-slate-200/50 blur-[100px]"></div>
        </div>

        <div className="w-full max-w-sm md:max-w-md relative z-10 animate-fade-in-up">
          <div className="text-center mb-10">
            <h1 className="text-[32px] md:text-[42px] font-bold text-[#1e293b] tracking-tight">Login</h1>
            <p className="hidden md:block mt-3 text-slate-500 font-medium">Welcome back! Please enter your details.</p>
          </div>

          <form className="space-y-4 md:space-y-5" onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="group relative flex items-center bg-white rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 transition-all duration-300">
              <User className="w-[22px] h-[22px] text-slate-600 mr-4 group-focus-within:text-[#2b5c8f] transition-colors" strokeWidth={2} />
              <input 
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400/80 font-medium text-[16px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="group relative flex items-center bg-white rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 transition-all duration-300">
              <Lock className="w-[22px] h-[22px] text-slate-600 mr-4 group-focus-within:text-[#2b5c8f] transition-colors" strokeWidth={2} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400/80 font-medium text-[16px] pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Buttons */}
            <div className="mt-8 md:mt-10 pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-[#2b5c8f] rounded-2xl py-3.5 md:py-4 text-white font-semibold text-[16px] hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-auto md:absolute md:bottom-8 pt-12 md:pt-0 flex items-center justify-center text-[13px] md:text-[14px] font-semibold text-[#334155] animate-fade-in-up" style={{animationDelay: '0.2s', animationFillMode: 'both'}}>
          <Laptop className="w-[18px] h-[18px] mr-2 text-[#1e293b]" strokeWidth={2.5} />
          Secured Data, Assured Future
        </div>
      </div>
    </div>
  );
}
