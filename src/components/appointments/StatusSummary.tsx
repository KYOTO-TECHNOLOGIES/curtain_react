import React from 'react';
import {
  Calendar,
  RotateCw,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  FileText,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { StatusStatCard, type StatusConfigItem } from './StatusStatCard';
import './StatusSummary.css';

/* ── Appointment Status Configurations ──────────────────────────── */
export const APPOINTMENT_STATUS_CONFIGS: StatusConfigItem[] = [
  {
    key: 'scheduled',
    label: 'Scheduled',
    color: '#2F5D8F',
    tintBg: '#EEF4FA',
    borderHover: 'rgba(47, 93, 143, 0.32)',
    glow: 'rgba(47, 93, 143, 0.22)',
    icon: Calendar,
    ariaLabel: 'scheduled',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    color: '#F97316',
    tintBg: '#FFF4EA',
    borderHover: 'rgba(249, 115, 22, 0.32)',
    glow: 'rgba(249, 115, 22, 0.22)',
    icon: RotateCw,
    ariaLabel: 'in progress',
  },
  {
    key: 'completed',
    label: 'Completed',
    color: '#10B981',
    tintBg: '#E8F8F2',
    borderHover: 'rgba(16, 185, 129, 0.32)',
    glow: 'rgba(16, 185, 129, 0.22)',
    icon: CheckCircle2,
    ariaLabel: 'completed',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    color: '#EF4444',
    tintBg: '#FEEFEF',
    borderHover: 'rgba(239, 68, 68, 0.32)',
    glow: 'rgba(239, 68, 68, 0.22)',
    icon: XCircle,
    ariaLabel: 'cancelled',
  },
];

/* Default alias for backwards-compatibility */
export const STATUS_CARD_CONFIGS = APPOINTMENT_STATUS_CONFIGS;

/* ── Quotation Status Configurations ────────────────────────────── */
export const QUOTATION_STATUS_CONFIGS: StatusConfigItem[] = [
  {
    key: 'accepted',
    label: 'Accepted',
    color: '#10B981',
    tintBg: '#E8F8F2',
    borderHover: 'rgba(16, 185, 129, 0.32)',
    glow: 'rgba(16, 185, 129, 0.22)',
    icon: CheckCircle2,
    ariaLabel: 'accepted',
  },
  {
    key: 'sent',
    label: 'Sent',
    color: '#2F5D8F',
    tintBg: '#EEF4FA',
    borderHover: 'rgba(47, 93, 143, 0.32)',
    glow: 'rgba(47, 93, 143, 0.22)',
    icon: Send,
    ariaLabel: 'sent',
  },
  {
    key: 'pending',
    label: 'Pending',
    color: '#8B5CF6',
    tintBg: '#F3EEFD',
    borderHover: 'rgba(139, 92, 246, 0.32)',
    glow: 'rgba(139, 92, 246, 0.22)',
    icon: Clock,
    ariaLabel: 'pending',
  },
  {
    key: 'draft',
    label: 'Draft',
    color: '#F97316',
    tintBg: '#FFF4EA',
    borderHover: 'rgba(249, 115, 22, 0.32)',
    glow: 'rgba(249, 115, 22, 0.22)',
    icon: FileText,
    ariaLabel: 'draft',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    color: '#EF4444',
    tintBg: '#FEEFEF',
    borderHover: 'rgba(239, 68, 68, 0.32)',
    glow: 'rgba(239, 68, 68, 0.22)',
    icon: XCircle,
    ariaLabel: 'cancelled',
  },
];

/* ── Order Status Configurations ────────────────────────────────── */
export const ORDER_STATUS_CONFIGS: StatusConfigItem[] = [
  {
    key: 'pending_production',
    label: 'Pending',
    color: '#F97316',
    tintBg: '#FFF4EA',
    borderHover: 'rgba(249, 115, 22, 0.32)',
    glow: 'rgba(249, 115, 22, 0.22)',
    icon: Clock,
    ariaLabel: 'pending production',
  },
  {
    key: 'in_production',
    label: 'Production',
    color: '#0EA5E9',
    tintBg: '#E0F2FE',
    borderHover: 'rgba(14, 165, 233, 0.32)',
    glow: 'rgba(14, 165, 233, 0.22)',
    icon: RotateCw,
    ariaLabel: 'in production',
  },
  {
    key: 'installed',
    label: 'Installed',
    color: '#10B981',
    tintBg: '#E8F8F2',
    borderHover: 'rgba(16, 185, 129, 0.32)',
    glow: 'rgba(16, 185, 129, 0.22)',
    icon: CheckCircle2,
    ariaLabel: 'installed',
  },
];

/* ── Invoice Status Configurations ──────────────────────────────── */
export const INVOICE_STATUS_CONFIGS: StatusConfigItem[] = [
  {
    key: 'paid',
    label: 'Paid',
    color: '#10B981',
    tintBg: '#E8F8F2',
    borderHover: 'rgba(16, 185, 129, 0.32)',
    glow: 'rgba(16, 185, 129, 0.22)',
    icon: CheckCircle2,
    ariaLabel: 'paid',
  },
  {
    key: 'partially_paid',
    label: 'Partially Paid',
    color: '#0EA5E9',
    tintBg: '#E0F2FE',
    borderHover: 'rgba(14, 165, 233, 0.32)',
    glow: 'rgba(14, 165, 233, 0.22)',
    icon: CreditCard,
    ariaLabel: 'partially paid',
  },
  {
    key: 'sent',
    label: 'Sent',
    color: '#2F5D8F',
    tintBg: '#EEF4FA',
    borderHover: 'rgba(47, 93, 143, 0.32)',
    glow: 'rgba(47, 93, 143, 0.22)',
    icon: Send,
    ariaLabel: 'sent',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    color: '#EF4444',
    tintBg: '#FEEFEF',
    borderHover: 'rgba(239, 68, 68, 0.32)',
    glow: 'rgba(239, 68, 68, 0.22)',
    icon: AlertCircle,
    ariaLabel: 'overdue',
  },
];

export interface StatusSummaryProps {
  stats: {
    total?: number;
    by_status?: Record<string, number>;
  } | null;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  loading?: boolean;
  configs?: StatusConfigItem[];
  className?: string;
}

/* ── Skeleton Shimmer State ─────────────────────────────────────── */
export function StatusSummarySkeleton({ count = 4 }: { count?: number }) {
  const gridClass =
    count === 3
      ? 'status-summary-grid-3'
      : count === 5
      ? 'status-summary-grid-5'
      : 'status-summary-grid-4';
  return (
    <div className={`${gridClass} my-4`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-[12px] px-[14px] py-[10px] h-[74px] rounded-[15px] bg-white border border-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,.04)] animate-pulse select-none"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {/* Skeleton Icon Badge (36px) */}
          <div className="w-[36px] h-[36px] rounded-[11px] bg-slate-100 shrink-0" />

          {/* Skeleton Stack (Label & Count) */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="w-14 h-2.5 rounded bg-slate-100 mb-1" />
            <div className="w-16 h-5 rounded bg-slate-100" />
          </div>

          {/* Skeleton Ring (36px) */}
          <div className="w-[36px] h-[36px] rounded-full bg-slate-100 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ── Main StatusSummary Component ───────────────────────────────── */
export function StatusSummary({
  stats,
  selectedStatus = '',
  onSelectStatus,
  loading = false,
  configs = STATUS_CARD_CONFIGS,
  className = '',
}: StatusSummaryProps) {
  if (loading) {
    return <StatusSummarySkeleton count={configs.length} />;
  }

  // Calculate total: prefer stats.total if available, or compute sum of statuses
  const total =
    stats?.total !== undefined && stats?.total !== null
      ? stats.total
      : configs.reduce((sum, cfg) => sum + (stats?.by_status?.[cfg.key] || 0), 0);

  const gridClass =
    configs.length === 3
      ? 'status-summary-grid-3'
      : configs.length === 5
      ? 'status-summary-grid-5'
      : 'status-summary-grid-4';

  return (
    <div
      className={`${gridClass} my-4 ${className}`}
      role="region"
      aria-label="Status summary filters"
    >
      {configs.map((config, index) => {
        const count = stats?.by_status?.[config.key] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const isActive = selectedStatus === config.key;

        const handleClick = () => {
          if (!onSelectStatus) return;
          // Toggle filter: clicking active clears it, clicking inactive activates it
          onSelectStatus(isActive ? '' : config.key);
        };

        return (
          <StatusStatCard
            key={config.key}
            config={config}
            count={count}
            total={total}
            percentage={percentage}
            isActive={isActive}
            onClick={handleClick}
            index={index}
          />
        );
      })}
    </div>
  );
}

export default StatusSummary;
