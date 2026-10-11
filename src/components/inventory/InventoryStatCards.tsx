import React, { useEffect, useRef, useState } from 'react';
import {
  Warehouse,
  AlertTriangle,
  Coins,
  Truck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import type { InventoryStats } from '../../types';
import './InventoryStatCards.css';

interface InventoryStatCardsProps {
  stats: InventoryStats | null;
  loading?: boolean;
  activeFilter?: 'all' | 'low_stock' | null;
  onFilterChange: (filter: 'all' | 'low_stock') => void;
  onTabChange: (tab: 'items' | 'suppliers' | 'reorders' | 'movements') => void;
  activeTab: 'items' | 'suppliers' | 'reorders' | 'movements';
}

function useCountUp(target: number, duration = 650): number {
  const [val, setVal] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target);
      return;
    }

    const start = prevRef.current;
    if (start === target) {
      setVal(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animId: number;

    const step = (ts: number) => {
      if (!startTimestamp) startTimestamp = ts;
      const progress = Math.min((ts - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + (target - start) * easeOut));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setVal(target);
        prevRef.current = target;
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return val;
}

function formatAED(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

export const InventoryStatCards: React.FC<InventoryStatCardsProps> = ({
  stats,
  loading = false,
  activeFilter,
  onFilterChange,
  onTabChange,
  activeTab,
}) => {
  const totalItemsCount = useCountUp(stats?.total_items ?? 0);
  const lowStockCount = useCountUp(stats?.low_stock_count ?? 0);
  const pendingReordersCount = useCountUp(stats?.pending_reorders ?? 0);
  const activeSuppliersCount = useCountUp(stats?.active_suppliers ?? 0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mx', `${x}px`);
    e.currentTarget.style.setProperty('--my', `${y}px`);
  };

  const isLowStockActive = activeFilter === 'low_stock' && activeTab === 'items';
  const isTotalItemsActive = activeTab === 'items' && activeFilter !== 'low_stock';
  const isPendingReordersActive = activeTab === 'reorders';
  const isSuppliersActive = activeTab === 'suppliers';

  return (
    <div className="inv-stat-grid" role="region" aria-label="Inventory Metrics Summary">
      {/* 1. Total Items */}
      <button
        type="button"
        onClick={() => {
          onTabChange('items');
          onFilterChange('all');
        }}
        onMouseMove={handleMouseMove}
        className={`inv-stat-card inv-stat-enter ${isTotalItemsActive ? 'is-active' : ''}`}
        style={
          {
            '--card-color': '#2F5D8F',
            '--card-tint-bg': '#EEF4FA',
            '--card-border-hover': 'rgba(47, 93, 143, 0.35)',
            '--card-glow': 'rgba(47, 93, 143, 0.22)',
            '--card-spotlight': 'rgba(47, 93, 143, 0.12)',
            animationDelay: '0ms',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Items
          </span>
          <div className="inv-stat-icon-wrapper">
            <Warehouse className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between w-full">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {loading && !stats ? '—' : totalItemsCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#2F5D8F] flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </button>

      {/* 2. Low Stock Alerts */}
      <button
        type="button"
        onClick={() => {
          onTabChange('items');
          onFilterChange(activeFilter === 'low_stock' ? 'all' : 'low_stock');
        }}
        onMouseMove={handleMouseMove}
        className={`inv-stat-card inv-stat-enter ${isLowStockActive ? 'is-active' : ''}`}
        style={
          {
            '--card-color': '#F59E0B',
            '--card-tint-bg': '#FEF3C7',
            '--card-border-hover': 'rgba(245, 158, 11, 0.4)',
            '--card-glow': 'rgba(245, 158, 11, 0.25)',
            '--card-spotlight': 'rgba(245, 158, 11, 0.15)',
            animationDelay: '60ms',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Low Stock
            </span>
            {(stats?.low_stock_count ?? 0) > 0 && <span className="inv-stat-pulse-dot" />}
          </div>
          <div className="inv-stat-icon-wrapper">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between w-full">
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            {loading && !stats ? '—' : lowStockCount}
          </div>
          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-0.5">
            {isLowStockActive ? 'Filtered' : 'Filter low'}
          </span>
        </div>
      </button>

      {/* 3. Total Stock Value */}
      <div
        className="inv-stat-card inv-stat-enter cursor-default"
        style={
          {
            '--card-color': '#10B981',
            '--card-tint-bg': '#E8F8F2',
            '--card-border-hover': 'rgba(16, 185, 129, 0.35)',
            '--card-glow': 'rgba(16, 185, 129, 0.22)',
            '--card-spotlight': 'rgba(16, 185, 129, 0.12)',
            animationDelay: '120ms',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Stock Value
          </span>
          <div className="inv-stat-icon-wrapper">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between w-full">
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {loading && !stats ? '—' : formatAED(stats?.total_stock_value || 0)}
          </div>
          <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
            Asset
          </span>
        </div>
      </div>

      {/* 4. Pending Reorders */}
      <button
        type="button"
        onClick={() => onTabChange('reorders')}
        onMouseMove={handleMouseMove}
        className={`inv-stat-card inv-stat-enter ${isPendingReordersActive ? 'is-active' : ''}`}
        style={
          {
            '--card-color': '#8B5CF6',
            '--card-tint-bg': '#F3EEFD',
            '--card-border-hover': 'rgba(139, 92, 246, 0.35)',
            '--card-glow': 'rgba(139, 92, 246, 0.22)',
            '--card-spotlight': 'rgba(139, 92, 246, 0.12)',
            animationDelay: '180ms',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
            Reorders
          </span>
          <div className="inv-stat-icon-wrapper">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between w-full">
          <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {loading && !stats ? '—' : pendingReordersCount}
          </div>
          <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-0.5">
            Pending <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </button>

      {/* 5. Active Suppliers */}
      <button
        type="button"
        onClick={() => onTabChange('suppliers')}
        onMouseMove={handleMouseMove}
        className={`inv-stat-card inv-stat-enter ${isSuppliersActive ? 'is-active' : ''}`}
        style={
          {
            '--card-color': '#0EA5E9',
            '--card-tint-bg': '#E0F2FE',
            '--card-border-hover': 'rgba(14, 165, 233, 0.35)',
            '--card-glow': 'rgba(14, 165, 233, 0.22)',
            '--card-spotlight': 'rgba(14, 165, 233, 0.12)',
            animationDelay: '240ms',
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
            Suppliers
          </span>
          <div className="inv-stat-icon-wrapper">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between w-full">
          <div className="text-2xl font-extrabold text-sky-800 tracking-tight">
            {loading && !stats ? '—' : activeSuppliersCount}
          </div>
          <span className="text-[11px] font-semibold text-sky-600 flex items-center gap-0.5">
            Directory <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </button>
    </div>
  );
};

export default InventoryStatCards;
