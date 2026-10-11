import React, { useEffect, useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowUp, ArrowDown } from 'lucide-react';

/* ── Design Tokens ─────────────────────────────────────────── */
// Card Background: #FFFFFF
// Card Border:     #E6EBF2 (Hover: #D3DBE7)
// Card Radius:     20px (Padding: 20px 22px)
// Shadow:          0 1px 2px rgba(10,18,32,0.04), 0 8px 24px -12px rgba(10,18,32,0.08)
// Label:           14px, weight 500, #5B6B80, sentence case
// Value:           36px, weight 600, letter-spacing -0.03em, #0A1220, tabular-nums
// Meta / Status:   13px, weight 500 / 600
// Sparkline:       80x28px, 1.5px stroke, 8% gradient fill
// Accent Colors:   Sales #16A34A · Appointments #F59E0B · Quotes #E5484D · Installs #2F6FDB

export interface TrendConfig {
  value: number;
  label?: string;
  isPositive?: boolean;
}

export interface StatusConfig {
  label: string;
  color?: string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  rawValue?: number;
  prefix?: string;
  trend?: TrendConfig | null;
  status?: StatusConfig | null;
  sparklineData?: number[];
  accent: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  href: string;
  loading?: boolean;
  emptyText?: string;
  index?: number;
  ariaLabel?: string;
}

/* ── Sparkline Helper (Smooth cubic bezier SVG curve) ────────── */
function generateSmoothPath(data: number[], width = 80, height = 28): { linePath: string; areaPath: string } {
  if (!data || data.length < 2) return { linePath: '', areaPath: '' };
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 3;
  const usableHeight = height - paddingY * 2;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return { linePath: path, areaPath: area };
}

export function StatCard({
  label,
  value,
  rawValue,
  prefix,
  trend,
  status,
  sparklineData,
  accent,
  icon: Icon,
  href,
  loading = false,
  emptyText,
  index = 0,
  ariaLabel,
}: StatCardProps) {
  const gradientId = useId();
  const [animatedValue, setAnimatedValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Determine numeric target value
  const targetNum = typeof rawValue === 'number' 
    ? rawValue 
    : (typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0);

  const isZero = targetNum === 0;

  // Number count-up animation over 700ms on mount
  useEffect(() => {
    if (loading || hasAnimated) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimatedValue(targetNum);
      setHasAnimated(true);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 700;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(targetNum * easeOut));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimatedValue(targetNum);
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(step);
  }, [targetNum, loading, hasAnimated]);

  // Only calculate sparkline if value > 0 and at least 2 data points exist
  const hasRealSparkline = !isZero && Array.isArray(sparklineData) && sparklineData.length >= 2;
  const { linePath, areaPath } = hasRealSparkline 
    ? generateSmoothPath(sparklineData, 80, 28) 
    : { linePath: '', areaPath: '' };

  // Formatted display value
  const displayValue = hasAnimated
    ? (typeof value === 'string' && value !== '0' && value !== '0.00' ? value : targetNum.toLocaleString('en-US'))
    : animatedValue.toLocaleString('en-US');

  // Accessible Label
  const accessibleLabel = ariaLabel || `${label}: ${prefix ? prefix + ' ' : ''}${displayValue}${!isZero && status ? ', ' + status.label : ''}${!isZero && trend ? ', ' + trend.value + '%' : ''}`;

  /* ── Skeleton Loading State ───────────────────────────────── */
  if (loading) {
    return (
      <div 
        className="bg-white rounded-[20px] p-[20px_22px] border border-[#E6EBF2] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_8px_24px_-12px_rgba(10,18,32,0.08)] flex flex-col justify-between h-[166px] w-auto min-w-0 overflow-hidden animate-pulse box-border"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
          <div className="w-[18px] h-[18px] bg-slate-100 rounded-full shrink-0"></div>
        </div>
        <div className="h-9 w-28 bg-slate-100 rounded-lg my-auto"></div>
        <div className="flex items-end justify-between gap-3 pt-0.5">
          <div className="h-3.5 w-20 bg-slate-100 rounded-md flex-1"></div>
          <div className="h-6 w-16 bg-slate-100 rounded-md shrink-0"></div>
        </div>
      </div>
    );
  }

  /* ── Render Card ──────────────────────────────────────────── */
  return (
    <Link
      to={href}
      aria-label={accessibleLabel}
      style={{
        animationDelay: `${index * 60}ms`,
      }}
      className="group relative bg-white rounded-[20px] p-[20px_22px] border border-[#E6EBF2] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_8px_24px_-12px_rgba(10,18,32,0.08)] flex flex-col justify-between h-[166px] w-auto min-w-0 overflow-hidden box-border text-left no-underline transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#D3DBE7] hover:shadow-[0_4px_6px_-1px_rgba(10,18,32,0.06),0_14px_28px_-12px_rgba(10,18,32,0.12)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2F6FDB]/20 focus-visible:ring-offset-2 animate-[statCardRise_500ms_cubic-bezier(0.22,1,0.36,1)_backwards]"
    >
      {/* ── 1. Top Row: Label (Sentence case) + Static Icon / Arrow on Hover ── */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span 
          title={label}
          className="text-[14px] font-[500] text-[#5B6B80] leading-none select-none min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {label}
        </span>
        
        <div className="relative w-[18px] h-[18px] shrink-0 flex items-center justify-center text-[#8A97AB]">
          {/* Static Icon */}
          <Icon 
            size={18} 
            strokeWidth={1.75}
            className="transition-opacity duration-150 group-hover:opacity-0" 
          />
          {/* Action Arrow Icon (fades and glides in on hover) */}
          <ArrowUpRight 
            size={18} 
            strokeWidth={2}
            className="absolute inset-0 text-[#2F6FDB] opacity-0 -translate-x-0.5 translate-y-0.5 transition-all duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" 
          />
        </div>
      </div>

      {/* ── 2. Value: 36px, Weight 600, tabular-nums ───────────── */}
      <div className="my-auto py-0.5 min-w-0">
        <div className="flex items-baseline gap-1.5 font-['Hanken_Grotesk'] text-[#0A1220] tabular-nums tracking-[-0.03em] leading-none select-none min-w-0">
          {prefix && (
            <span className="text-[16px] font-[500] text-[#5B6B80] tracking-normal shrink-0">
              {prefix}
            </span>
          )}
          <span className="text-[36px] font-[600] truncate">
            {displayValue}
          </span>
        </div>
      </div>

      {/* ── 3. Bottom Row: Trend or Status (Left) + Sparkline (Right) ── */}
      <div className="flex items-end justify-between gap-3 pt-0.5 min-w-0">
        {/* Trend or Status or Empty Notice */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isZero ? (
            <span className="text-[13px] font-[400] text-[#8A97AB] leading-snug whitespace-normal line-clamp-2">
              {emptyText || 'No data'}
            </span>
          ) : trend ? (
            <div className="flex items-center gap-1.5 text-[13px] leading-snug whitespace-normal">
              {trend.isPositive !== false ? (
                <span className="inline-flex items-center gap-0.5 font-[600] text-[#15803D] shrink-0">
                  <ArrowUp size={13} strokeWidth={2.5} />
                  +{trend.value}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 font-[600] text-[#B91C1C] shrink-0">
                  <ArrowDown size={13} strokeWidth={2.5} />
                  -{Math.abs(trend.value)}%
                </span>
              )}
              {trend.label && (
                <span className="font-[400] text-[#8A97AB] truncate">
                  {trend.label}
                </span>
              )}
            </div>
          ) : status ? (
            <div className="flex items-center gap-2 text-[13px] leading-snug whitespace-normal min-w-0">
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: status.color || accent }}
              />
              <span className="font-[500] text-[#5B6B80] leading-snug whitespace-normal line-clamp-2">
                {status.label}
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-[#8A97AB]">·</span>
          )}
        </div>

        {/* 80x28px Sparkline Container */}
        <div className="w-[80px] h-[28px] shrink-0 flex items-center justify-end overflow-hidden">
          {!hasRealSparkline ? (
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 80 28" 
              preserveAspectRatio="none"
              fill="none" 
              aria-hidden="true"
            >
              <line 
                x1="0" 
                y1="14" 
                x2="80" 
                y2="14" 
                stroke="#D1D9E4" 
                strokeWidth="1.5" 
                strokeDasharray="3 3" 
              />
            </svg>
          ) : (
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 80 28" 
              preserveAspectRatio="none"
              fill="none" 
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {areaPath && (
                <path d={areaPath} fill={`url(#${gradientId})`} />
              )}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke={accent} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}
