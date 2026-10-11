import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

export interface StatusConfigItem {
  key: string;
  label: string;
  color: string;
  tintBg: string;
  borderHover: string;
  glow: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  ariaLabel: string;
}

export interface StatusStatCardProps {
  config: StatusConfigItem;
  count: number;
  total: number;
  percentage: number;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

/* ── Hex to RGBA Helper ─────────────────────────────────────────── */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ── Custom Count-Up Hook with smooth ease-out and re-animation ── */
function useCountUp(targetValue: number, duration = 800): number {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    const startValue = isFirstRender.current ? 0 : prevValueRef.current;
    isFirstRender.current = false;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out curve: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration]);

  return displayValue;
}

/* ── Completed Check with SVG stroke-dashoffset drawing animation ── */
function AnimatedCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" strokeWidth="1.8" />
      <path
        d="M8.5 12.2l2.4 2.4 4.8-5"
        className="completed-check-path"
      />
    </svg>
  );
}

export function StatusStatCard({
  config,
  count,
  total,
  percentage,
  isActive,
  onClick,
  index,
}: StatusStatCardProps) {
  const displayCount = useCountUp(count, 800);
  const isZero = count === 0;

  // Circular ring geometry (36px diameter, 3px stroke -> radius = 16.5px)
  const radius = 16.5;
  const circumference = 2 * Math.PI * radius; // ~103.67
  const [ringPercent, setRingPercent] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setRingPercent(percentage);
      return;
    }

    // Draw ring starting 150ms after card entrance
    const timer = setTimeout(() => {
      setRingPercent(percentage);
    }, index * 60 + 150);

    return () => clearTimeout(timer);
  }, [percentage, index]);

  const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

  // Cursor spotlight handler
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${(e.clientX - rect.left).toFixed(1)}px`);
    e.currentTarget.style.setProperty('--my', `${(e.clientY - rect.top).toFixed(1)}px`);
  };

  const IconComponent = config.icon;

  const accessibleLabel = `${count} ${config.ariaLabel} appointments, ${
    isZero ? '0' : percentage
  } percent of total. ${isActive ? 'Filter active, click to clear' : 'Click to filter'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      aria-pressed={isActive}
      aria-label={accessibleLabel}
      className={`status-stat-card status-stat-card-enter group w-full text-left cursor-pointer select-none ${
        isActive ? 'is-active' : ''
      }`}
      style={
        {
          '--status-color': config.color,
          '--status-tint': config.tintBg,
          '--status-inner-ring': hexToRgba(config.color, 0.15),
          '--status-wash': hexToRgba(config.color, 0.08),
          '--status-spotlight': hexToRgba(config.color, 0.10),
          '--status-active-glow': hexToRgba(config.color, 0.12),
          '--status-active-bg': hexToRgba(config.color, 0.06),
          animationDelay: `${index * 60}ms`,
        } as React.CSSProperties
      }
    >
      {/* ── Active 3px Left Edge Bar ─────────────────────────── */}
      <div
        className="status-active-bar"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />

      {/* ── Soft Status-Tint Radial Wash behind Icon ─────────── */}
      <div
        className="status-icon-wash"
        style={{
          background: `radial-gradient(75px circle at 32px 50%, var(--status-wash), transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* ── 1. Left: 36px Icon Badge ─────────────────────────── */}
      <div
        className="status-icon-badge"
        style={{
          backgroundColor: config.tintBg,
          color: config.color,
        }}
      >
        {/* Gentle pulsing activity ring for In Progress / Production */}
        {(config.key === 'in_progress' || config.key === 'in_production') && (
          <span
            className="status-pulse-ring"
            style={{ color: config.color }}
            aria-hidden="true"
          />
        )}

        {/* Icon Component (16px) */}
        {config.key === 'completed' || config.key === 'accepted' || config.key === 'installed' || config.key === 'paid' ? (
          <AnimatedCheckIcon className="w-4 h-4 text-[#10B981]" />
        ) : config.key === 'in_progress' || config.key === 'in_production' ? (
          <RotateCw
            className="w-4 h-4 animate-slow-spin text-[#0ea5e9]"
            strokeWidth={2.2}
          />
        ) : (
          <IconComponent className="w-4 h-4" strokeWidth={2.2} />
        )}
      </div>

      {/* ── 2. Middle: Two-line stack (Label + Count of Total) ─ */}
      <div className="flex flex-col justify-center min-w-0 z-10 text-left">
        <span className="text-[11.5px] font-[500] text-slate-500 tracking-[0.01em] truncate leading-tight">
          {config.label}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5 leading-none">
          <span
            className={`text-[23px] font-[700] tabular-nums tracking-[-0.02em] leading-none font-['Hanken_Grotesk'] transition-colors ${
              isZero
                ? 'opacity-45 text-slate-400'
                : isActive
                ? 'text-[var(--status-color)]'
                : 'text-slate-900'
            }`}
          >
            {displayCount}
          </span>
          <span className="text-[11px] font-normal text-slate-400 tracking-normal select-none">
            of {total}
          </span>
        </div>
      </div>

      {/* ── 3. Right: 36px Circular Progress Ring ───────────── */}
      <div className="relative w-[36px] h-[36px] shrink-0 flex items-center justify-center z-10">
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          className="-rotate-90 block"
          aria-hidden="true"
        >
          {/* Background Track Circle */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke={isZero ? '#E2E8F0' : config.tintBg}
            strokeWidth="3"
            strokeDasharray={isZero ? '2.5 2.5' : undefined}
          />
          {/* Animated Progress Circle */}
          {!isZero && (
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          )}
        </svg>

        {/* Centered Percentage Value */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`text-[10px] font-[600] tabular-nums leading-none select-none ${
              isZero ? 'text-slate-400' : 'text-slate-700'
            }`}
          >
            {isZero ? '0%' : `${percentage}%`}
          </span>
        </div>
      </div>
    </button>
  );
}
