import React from 'react';
import { ErrorState, type ErrorStateProps } from '../ui/ErrorState';

type ErrorComponentProps = Omit<ErrorStateProps, 'icon' | 'title' | 'description'> & {
  title?: string;
  description?: string;
};

/* ─── Network Error: Wi-Fi icon with a slash ────────────────────── */
function NetworkErrorIcon() {
  return (
    <div className="w-48 h-48 md:w-56 md:h-56 relative">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="url(#networkGrad)" opacity="0.1" />
        
        {/* Phone body */}
        <rect x="65" y="35" width="70" height="130" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="71" y="48" width="58" height="100" rx="4" fill="#e2e8f0" />
        {/* Home button */}
        <circle cx="100" cy="157" r="5" fill="#475569" />
        {/* Screen highlight */}
        <rect x="71" y="48" width="58" height="100" rx="4" fill="url(#screenGrad)" opacity="0.3" />
        
        {/* Wi-Fi icon on screen */}
        <g transform="translate(100, 88)">
          {/* Wi-Fi arcs */}
          <path d="M-30,-10 Q0,-35 30,-10" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M-20,-3 Q0,-20 20,-3" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M-10,4 Q0,-6 10,4" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Center dot */}
          <circle cx="0" cy="12" r="4" fill="#94a3b8" />
        </g>
        
        {/* Exclamation triangle */}
        <g transform="translate(145, 45)">
          <path d="M0,-18 L20,16 L-20,16 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="0" y1="-8" x2="0" y2="4" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="10" r="2" fill="white" />
        </g>

        {/* Red slash through wifi */}
        <line x1="75" y1="55" x2="125" y2="105" stroke="#ef4444" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </line>
        
        {/* Person silhouette leaning */}
        <g transform="translate(40, 100)">
          {/* Head */}
          <circle cx="8" cy="-10" r="9" fill="#64748b" />
          {/* Body */}
          <path d="M8,0 L8,35" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          {/* Arms */}
          <path d="M8,12 L25,5" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <path d="M8,12 L-5,22" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          {/* Legs */}
          <path d="M8,35 L-2,58" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <path d="M8,35 L18,58" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Small plant */}
        <g transform="translate(155, 130)">
          <rect x="-8" y="5" width="16" height="18" rx="3" fill="#2b5c8f" opacity="0.6" />
          <path d="M0,5 C-5,-5 -15,-3 -10,2" stroke="#22c55e" strokeWidth="2" fill="#22c55e" opacity="0.7" />
          <path d="M0,2 C5,-8 15,-5 8,0" stroke="#22c55e" strokeWidth="2" fill="#22c55e" opacity="0.7" />
          <path d="M0,0 C-3,-10 -12,-8 -6,-2" stroke="#16a34a" strokeWidth="2" fill="#16a34a" opacity="0.7" />
        </g>

        {/* Animated signal dots */}
        <circle cx="155" cy="80" r="3" fill="#ef4444" opacity="0.6">
          <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="165" cy="70" r="2" fill="#ef4444" opacity="0.4">
          <animate attributeName="r" values="1;3;1" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.8s" repeatCount="indefinite" />
        </circle>
        
        <defs>
          <linearGradient id="networkGrad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#2b5c8f" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="71" y1="48" x2="129" y2="148">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Server Error: Broken server rack ──────────────────────────── */
function ServerErrorIcon() {
  return (
    <div className="w-48 h-48 md:w-56 md:h-56 relative">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="url(#serverGrad)" opacity="0.08" />
        
        {/* Server rack */}
        <rect x="45" y="40" width="110" height="40" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <rect x="45" y="85" width="110" height="40" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <rect x="45" y="130" width="110" height="40" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        
        {/* Server details - top */}
        <circle cx="65" cy="60" r="4" fill="#22c55e">
          <animate attributeName="fill" values="#22c55e;#ef4444;#22c55e" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="60" r="4" fill="#22c55e" />
        <rect x="95" y="55" width="45" height="4" rx="2" fill="#334155" />
        <rect x="95" y="62" width="30" height="3" rx="1.5" fill="#475569" />
        
        {/* Server details - middle (broken) */}
        <circle cx="65" cy="105" r="4" fill="#ef4444">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="105" r="4" fill="#ef4444">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <rect x="95" y="100" width="45" height="4" rx="2" fill="#334155" />
        <rect x="95" y="107" width="30" height="3" rx="1.5" fill="#475569" />
        
        {/* Server details - bottom */}
        <circle cx="65" cy="150" r="4" fill="#f59e0b">
          <animate attributeName="fill" values="#f59e0b;#ef4444;#f59e0b" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="150" r="4" fill="#22c55e" />
        <rect x="95" y="145" width="45" height="4" rx="2" fill="#334155" />
        <rect x="95" y="152" width="30" height="3" rx="1.5" fill="#475569" />
        
        {/* Smoke/error particles from middle server */}
        <g opacity="0.6">
          <circle cx="120" cy="90" r="3" fill="#94a3b8">
            <animate attributeName="cy" values="90;70;50" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.3;0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;5;2" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="135" cy="88" r="2" fill="#94a3b8">
            <animate attributeName="cy" values="88;65;45" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="2;4;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="145" cy="85" r="2.5" fill="#94a3b8">
            <animate attributeName="cy" values="85;60;40" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.2;0" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.5;4.5;1.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Error badge */}
        <g transform="translate(155, 90)">
          <circle cx="0" cy="0" r="14" fill="#ef4444" />
          <line x1="-6" y1="-6" x2="6" y2="6" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="6" y1="-6" x2="-6" y2="6" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
        
        {/* Lightning bolt */}
        <g transform="translate(30, 80)" opacity="0.7">
          <path d="M15,0 L5,18 L12,18 L8,32 L20,12 L13,12 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1">
            <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
          </path>
        </g>
        
        <defs>
          <linearGradient id="serverGrad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Not Found Error: 404 with magnifying glass ────────────────── */
function NotFoundIcon() {
  return (
    <div className="w-48 h-48 md:w-56 md:h-56 relative">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="url(#notFoundGrad)" opacity="0.08" />
        
        {/* Big 404 text */}
        <text x="100" y="95" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="56" fontWeight="800" fill="#1e293b" opacity="0.12">
          404
        </text>
        
        {/* Document/page */}
        <g transform="translate(55, 30)">
          <rect x="0" y="0" width="90" height="115" rx="8" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Page fold */}
          <path d="M65,0 L90,25 L65,25 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Text lines */}
          <rect x="15" y="38" width="60" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="15" y="50" width="45" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="15" y="62" width="55" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="15" y="74" width="35" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="15" y="86" width="50" height="5" rx="2.5" fill="#e2e8f0" />
          <rect x="15" y="98" width="40" height="5" rx="2.5" fill="#e2e8f0" />
        </g>
        
        {/* Magnifying glass */}
        <g transform="translate(125, 115)">
          <circle cx="0" cy="0" r="22" fill="none" stroke="#2b5c8f" strokeWidth="4" />
          <circle cx="0" cy="0" r="16" fill="#2b5c8f" opacity="0.08" />
          <line x1="16" y1="16" x2="32" y2="32" stroke="#2b5c8f" strokeWidth="5" strokeLinecap="round" />
          {/* Question mark inside */}
          <text x="0" y="6" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="700" fill="#2b5c8f" opacity="0.7">
            ?
          </text>
          {/* Shine */}
          <path d="M-10,-14 Q-5,-18 -2,-14" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>
        
        {/* Floating question marks */}
        <text x="35" y="60" fontFamily="system-ui, sans-serif" fontSize="18" fill="#94a3b8" opacity="0.5">
          ?
          <animate attributeName="y" values="60;50;60" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
        </text>
        <text x="165" y="50" fontFamily="system-ui, sans-serif" fontSize="14" fill="#94a3b8" opacity="0.4">
          ?
          <animate attributeName="y" values="50;40;50" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
        </text>
        
        {/* Small decorative elements */}
        <circle cx="40" cy="160" r="3" fill="#2b5c8f" opacity="0.15">
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="170" cy="170" r="2" fill="#2b5c8f" opacity="0.1">
          <animate attributeName="r" values="1.5;3;1.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
        
        <defs>
          <linearGradient id="notFoundGrad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#2b5c8f" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Empty State: Empty box ────────────────────────────────────── */
function EmptyStateIcon() {
  return (
    <div className="w-48 h-48 md:w-56 md:h-56 relative">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" opacity="0.06" />
        
        {/* Open box */}
        <g transform="translate(100, 100)">
          {/* Box body */}
          <path d="M-45,10 L-45,50 L45,50 L45,10 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Box front panel */}
          <path d="M-45,10 L-45,50 L0,55 L0,15 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <path d="M0,15 L0,55 L45,50 L45,10 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          {/* Box flaps (open) */}
          <path d="M-45,10 L-55,-10 L-10,-5 L0,15 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M45,10 L55,-10 L10,-5 L0,15 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Tape/center line */}
          <line x1="0" y1="15" x2="0" y2="55" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
        </g>
        
        {/* Dust particles floating out of box */}
        <circle cx="85" cy="85" r="2" fill="#94a3b8" opacity="0.4">
          <animate attributeName="cy" values="85;65;50" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.2;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="105" cy="80" r="1.5" fill="#94a3b8" opacity="0.3">
          <animate attributeName="cy" values="80;55;35" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.15;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="115" cy="88" r="2.5" fill="#94a3b8" opacity="0.35">
          <animate attributeName="cy" values="88;70;55" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.15;0" dur="2.8s" repeatCount="indefinite" />
        </circle>
        
        {/* Small sparkle elements */}
        <g transform="translate(70, 60)" opacity="0.5">
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0;0.5;0" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0;0.5;0" dur="2s" repeatCount="indefinite" />
          </line>
        </g>
        <g transform="translate(135, 65)" opacity="0.4">
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Ground shadow */}
        <ellipse cx="100" cy="165" rx="50" ry="6" fill="#94a3b8" opacity="0.1" />
        
        <defs>
          <linearGradient id="emptyGrad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Exported Wrapper Components ───────────────────────────────── */

export function NetworkError({
  title = "Connection Lost",
  description = "No Internet Connection found. Check your connection.",
  ...props
}: ErrorComponentProps) {
  return (
    <ErrorState
      icon={<NetworkErrorIcon />}
      title={title}
      description={description}
      {...props}
    />
  );
}

export function ServerError({
  title = "Internal Server Error",
  description = "Something went wrong on our end. We're working hard to fix it. Please try again later.",
  ...props
}: ErrorComponentProps) {
  return (
    <ErrorState
      icon={<ServerErrorIcon />}
      title={title}
      description={description}
      {...props}
    />
  );
}

export function NotFoundError({
  title = "Page Not Found",
  description = "The page you are looking for doesn't exist or has been moved.",
  ...props
}: ErrorComponentProps) {
  return (
    <ErrorState
      icon={<NotFoundIcon />}
      title={title}
      description={description}
      {...props}
    />
  );
}

export function EmptyState({
  title = "Nothing Here Yet",
  description = "There is currently no data to display in this section.",
  ...props
}: ErrorComponentProps) {
  return (
    <ErrorState
      icon={<EmptyStateIcon />}
      title={title}
      description={description}
      {...props}
    />
  );
}
