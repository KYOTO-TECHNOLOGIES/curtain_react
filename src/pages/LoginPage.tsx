import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';
import loginImage from '../assets/WhatsApp Image 2026-07-14 at 10.27.47 PM.jpeg';
import { NetworkError, ServerError, NotFoundError } from '../components/errors/ErrorStates';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';
import { loginSchema, type LoginFormValues } from '../lib/validationSchemas';
import './login.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [errorState, setErrorState] = useState<'network' | 'server' | 'notFound' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailShowCheck, setEmailShowCheck] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setErrorState(null);
    try {
      await dispatch(loginUser({ email: data.email, password: data.password })).unwrap();
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 0)                               setErrorState('network');
      else if (err.status !== undefined && err.status >= 500) setErrorState('server');
      else if (err.status === 404)                        setErrorState('notFound');
      else setApiError('Invalid email or password. Please try again.');
    }
  };

  if (errorState === 'network') return <NetworkError actionButton={{ label: 'Try Again', onClick: () => setErrorState(null) }} />;
  if (errorState === 'server')  return <ServerError  actionButton={{ label: 'Go Back',   onClick: () => setErrorState(null) }} />;
  if (errorState === 'notFound') return <NotFoundError actionButton={{ label: 'Go Back', onClick: () => setErrorState(null) }} />;

  // Destructure RHF's onBlur so we can merge it with our email check
  const { onBlur: rhfEmailBlur, ...emailRest } = register('email');

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: '#F6F8FB' }}>

      {/* ── Left Illustration (Preserved) ───────────────── */}
      <div className="relative w-full h-[45vh] md:h-screen md:w-1/2 lg:w-[55%] overflow-hidden">
        <img
          src={loginImage}
          alt="Curtain Installation"
          className="w-full h-full object-cover object-top md:object-center animate-slow-pan"
        />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent to-[#F6F8FB]/50 mix-blend-overlay pointer-events-none" />
      </div>

      {/* ── Right Panel: Ink & Soft Depth ───────────────── */}
      <div className="ink-panel md:w-1/2 lg:w-[45%]">
        <div className="ink-form-wrap">

          {/* ── Eyebrow Pill ────────────────────────────── */}
          <div className="ink-motion ink-s0" style={{ marginBottom: 24 }}>
            <div className="ink-eyebrow-pill">
              <span className="ink-eyebrow-dot" aria-hidden="true" />
              Curtain Master Portal
            </div>

            {/* ── Heading & Subtext ────────────────────── */}
            <h1 className="ink-heading">
              Welcome back<span className="ink-heading-period">.</span>
            </h1>
            <p className="ink-subtext">
              Sign in to manage your orders and installations.
            </p>
          </div>

          {/* ── API Error Banner ─────────────────────────── */}
          {apiError && (
            <div className="ink-error-banner ink-motion" role="alert" aria-live="polite">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Email Field */}
            <div
              className={`ink-field-group ink-motion ink-s1 ${errors.email ? 'ink-field-error ink-field-shake' : ''}`}
              style={{ marginBottom: 20 }}
            >
              <label htmlFor="ink-email" className="ink-label">Email address</label>

              <div className="ink-input-shell">
                <Mail
                  className="ink-leading-icon"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                <input
                  id="ink-email"
                  type="email"
                  inputMode="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'ink-email-err' : undefined}
                  className="ink-input"
                  {...emailRest}
                  onFocus={() => setEmailShowCheck(false)}
                  onBlur={(e) => {
                    rhfEmailBlur(e);
                    setEmailShowCheck(EMAIL_REGEX.test(e.target.value.trim()) && !errors.email);
                  }}
                />

                {/* Right slot: green check ONLY after blur with valid email */}
                {emailShowCheck && !errors.email && (
                  <div className="ink-right-slot" aria-hidden="true">
                    <span className="ink-valid-check">
                      <Check strokeWidth={2.2} />
                    </span>
                  </div>
                )}
              </div>

              {errors.email && (
                <p id="ink-email-err" className="ink-error-caption" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div
              className={`ink-field-group ink-motion ink-s2 ${errors.password ? 'ink-field-error ink-field-shake' : ''}`}
              style={{ marginBottom: 0 }}
            >
              <label htmlFor="ink-password" className="ink-label">Password</label>

              <div className="ink-input-shell">
                <Lock
                  className="ink-leading-icon"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                <input
                  id="ink-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'ink-password-err' : undefined}
                  className="ink-input"
                  {...register('password')}
                />

                {/* Right slot: eye toggle ONLY */}
                <div className="ink-right-slot">
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="ink-eye-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword
                      ? <EyeOff strokeWidth={1.5} aria-hidden="true" />
                      : <Eye    strokeWidth={1.5} aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>

              {errors.password && (
                <p id="ink-password-err" className="ink-error-caption" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Remember / Forgot row */}
            <div
              className="ink-meta-row ink-motion ink-s3"
              style={{ marginTop: 14 }}
            >
              <label className="ink-checkbox-label" htmlFor="ink-remember">
                <input
                  id="ink-remember"
                  type="checkbox"
                  className="ink-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  aria-label="Remember me"
                />
                Remember me
              </label>

              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                className="ink-forgot-link"
              >
                Forgot password?
              </a>
            </div>

            {/* Dark Ink Button */}
            <div className="ink-motion ink-s4" style={{ marginTop: 24 }}>
              <button
                id="ink-login-btn"
                type="submit"
                disabled={isLoading}
                className="ink-submit-btn"
                aria-label="Log in to Curtain Master"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="ink-btn-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="ink-btn-arrow" strokeWidth={2} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Thin Divider ─────────────────────────────── */}
          <div className="ink-divider ink-motion ink-s5" style={{ marginTop: 32 }}>
            <span className="ink-divider-line" />
            <span className="ink-divider-label">Secure access</span>
            <span className="ink-divider-line" />
          </div>

          {/* ── Footer ───────────────────────────────────── */}
          <div className="ink-footer ink-motion ink-s6" style={{ marginTop: 16 }}>
            <ShieldCheck strokeWidth={1.5} aria-hidden="true" />
            <span>Encrypted &amp; protected login</span>
          </div>

        </div>
      </div>
    </div>
  );
}
