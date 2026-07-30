import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Loader2, 
  ChevronRight, 
  Download, 
  ChevronDown, 
  Package,
  Eye,
  Plus
} from 'lucide-react';
import { ordersApi } from '../../api/orders';
import type { OrderListItem, OrderStats } from '../../types';
import { useToast } from '../../components/ui/Toast';

export default function OrdersPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.list(statusFilter ? { status: statusFilter } : {})
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['orders_stats', statusFilter],
    queryFn: () => ordersApi.stats().catch(() => ({ data: null }))
  });

  const orders = listRes?.data || [];
  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = orders.filter((o) =>
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.quotation_id || '').toLowerCase().includes(search.toLowerCase()) ||
    o.id.toString().includes(search)
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending_production': return 'bg-[#f97316] text-white';
      case 'in_production': return 'bg-[#0ea5e9] text-white';
      case 'shipped': return 'bg-[#8b5cf6] text-white';
      case 'installed': return 'bg-[#10b981] text-white';
      case 'closed': return 'bg-slate-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };
  
  const handleGenerateInvoice = async (id: number) => {
    try {
      await ordersApi.generateInvoice(id);
      showToast('Invoice generated successfully', 'success');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to generate invoice', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Orders
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span>Curtain Master.</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">Orders List</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" strokeWidth={2.5} /> Export List
          </button>
          <button onClick={() => showToast('Orders are automatically generated from accepted quotations.', 'success')} className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Create Order
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-slate-700">View:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button className="px-4 py-1.5 text-slate-500 text-sm font-semibold rounded-lg hover:text-slate-700 transition-colors">
              Grid View
            </button>
            <button className="px-4 py-1.5 bg-white text-[#2b5c8f] text-sm font-bold rounded-lg shadow-sm">
              Table View
            </button>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search orders, quotes, or customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl outline-none focus:border-[#2b5c8f] transition-colors"
              />
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</span>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-44"
              >
                <option value="">All Status</option>
                <option value="pending_production">Pending Production</option>
                <option value="in_production">In Production</option>
                <option value="shipped">Shipped</option>
                <option value="installed">Installed</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl px-6 py-2.5 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-[15px] font-extrabold text-slate-800">
            {stats?.total || 0}
          </span>
          <span className="text-[11px] font-medium text-slate-500">Total Orders</span>
        </div>
      </div>

      {/* Indicators Row */}
      <div className="flex flex-wrap items-center gap-4 mt-2 mb-6">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.pending_production || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Pending</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.in_production || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Production</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.installed || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Installed</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quote / Customer</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Est. Production</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No orders found.
                  </td>
                </tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-extrabold text-slate-800">#{o.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-slate-700">{o.customer_name}</span>
                      <span className="text-[12px] font-medium text-slate-500">Quote: {o.quotation_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-[13px] font-bold text-slate-700">{o.estimated_production_days} days</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(o.order_status)}`}>
                      {o.order_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!o.invoice_id && (
                        <button 
                          onClick={() => handleGenerateInvoice(o.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0f4f8] text-[#2b5c8f] hover:bg-[#e1e9f1] font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Generate Invoice
                        </button>
                      )}
                      <button className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-700 font-bold text-[11px] rounded-lg transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
