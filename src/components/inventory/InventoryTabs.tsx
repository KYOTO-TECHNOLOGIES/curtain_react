import React from 'react';
import { Warehouse, Building2, Truck, ArrowUpDown } from 'lucide-react';
import type { InventoryStats } from '../../types';

export type InventoryTabType = 'items' | 'suppliers' | 'reorders' | 'movements';

interface InventoryTabsProps {
  activeTab: InventoryTabType;
  onTabChange: (tab: InventoryTabType) => void;
  stats?: InventoryStats | null;
  itemsCount?: number;
  suppliersCount?: number;
  reordersCount?: number;
  movementsCount?: number;
}

export const InventoryTabs: React.FC<InventoryTabsProps> = ({
  activeTab,
  onTabChange,
  stats,
  itemsCount = 0,
  suppliersCount = 0,
  reordersCount = 0,
  movementsCount = 0,
}) => {
  const tabs = [
    {
      id: 'items' as InventoryTabType,
      label: 'Stock Items',
      icon: Warehouse,
      count: stats?.total_items ?? itemsCount,
      alertCount: stats?.low_stock_count,
    },
    {
      id: 'suppliers' as InventoryTabType,
      label: 'Suppliers',
      icon: Building2,
      count: stats?.active_suppliers ?? suppliersCount,
    },
    {
      id: 'reorders' as InventoryTabType,
      label: 'Reorder Requests',
      icon: Truck,
      count: reordersCount,
      badge: stats?.pending_reorders ? `${stats.pending_reorders} pending` : undefined,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'movements' as InventoryTabType,
      label: 'Stock Movements',
      icon: ArrowUpDown,
      count: movementsCount,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit max-w-full overflow-x-auto shadow-inner border border-slate-200/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 select-none whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.08)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-transform duration-200 ${
                isActive ? 'text-[#2F5D8F] scale-105' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span>{tab.label}</span>

            {/* Alert / Pending Badge */}
            {tab.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}

            {/* Item alert count */}
            {!tab.badge && tab.alertCount !== undefined && tab.alertCount > 0 && tab.id === 'items' && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-800"
                title={`${tab.alertCount} items low in stock`}
              >
                {tab.alertCount} low
              </span>
            )}

            {/* Standard Count chip */}
            {!tab.badge && (!tab.alertCount || tab.id !== 'items') && tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-200/70 text-slate-500 group-hover:bg-slate-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default InventoryTabs;
