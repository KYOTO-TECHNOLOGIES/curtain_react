import { useSelector } from 'react-redux';
import { 
  Filter, 
  Download, 
  Banknote, 
  Calendar, 
  FileText, 
  Package, 
  ArrowUpRight
} from 'lucide-react';
import type { RootState } from '../store';
import { useState, useEffect } from 'react';
import { appointmentsApi } from '../api/appointments';
import { quotationsApi } from '../api/quotations';
import { ordersApi } from '../api/orders';
import { invoicesApi } from '../api/invoices';
export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  const [stats, setStats] = useState({
    appointments: null as any,
    quotations: null as any,
    orders: null as any,
    invoices: null as any
  });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appRes, quoteRes, orderRes, invRes] = await Promise.all([
          appointmentsApi.stats().catch(() => ({ data: null })),
          quotationsApi.stats().catch(() => ({ data: null })),
          ordersApi.stats().catch(() => ({ data: null })),
          invoicesApi.stats().catch(() => ({ data: null }))
        ]);
        setStats({
          appointments: appRes.data,
          quotations: quoteRes.data,
          orders: orderRes.data,
          invoices: invRes.data
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="space-y-8 animate-page-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Operational Overview
          </h1>
          <p className="mt-1.5 text-slate-500 font-medium text-[15px]">
            Welcome back, {firstName}. Here's a snapshot of today's floor activity.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:shadow transition-all duration-200">
            <Filter className="w-4 h-4 text-slate-500" />
            Filter View
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all duration-200">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Monthly Sales */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-emerald-500" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50/50 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-4 h-4" />
              12.4%
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Monthly Sales
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-slate-500 font-bold text-sm">AED</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.invoices ? formatCurrency(stats.invoices.total_paid || 0) : '0.00'}
              </h2>
            </div>
          </div>
        </div>

        {/* Active Appts */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-400" strokeWidth={2} />
            </div>
            <div className="text-[11px] font-bold text-slate-500 tracking-wider">
              TODAY
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Appts
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.appointments?.today || 0}
            </h2>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-500" strokeWidth={2} />
            </div>
            <div className="text-[11px] font-bold text-red-500 tracking-wider">
              HIGH PRIORITY
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pending Quotes
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.quotations?.by_status?.draft || 0}
            </h2>
          </div>
        </div>

        {/* Pending Installs */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-500" strokeWidth={2} />
            </div>
            <div className="text-[11px] font-bold text-slate-800 tracking-wider">
              92% CAPACITY
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pending Installs
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.orders?.by_status?.pending_production || 0}
            </h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] lg:col-span-2 min-h-[320px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-500 font-medium">Monthly sales performance · AED</p>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#2b5c8f]"></div>
                  <span className="text-sm font-semibold text-slate-600">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-slate-200"></div>
                  <span className="text-sm font-semibold text-slate-600">Target</span>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="px-3 py-1.5 bg-white text-[#2b5c8f] text-xs font-bold rounded-lg shadow-sm">
                6M
              </button>
              <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-lg transition-colors">
                12M
              </button>
            </div>
          </div>
          
          {/* Mock Chart Area */}
          <div className="flex-1 flex items-end justify-between gap-2 pt-4 relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
              <div className="border-t border-slate-100 w-full h-0"></div>
            </div>
            
            {[
              { month: 'Jan', rev: 40, target: 50 },
              { month: 'Feb', rev: 70, target: 60 },
              { month: 'Mar', rev: 55, target: 65 },
              { month: 'Apr', rev: 85, target: 70 },
              { month: 'May', rev: 65, target: 80 },
              { month: 'Jun', rev: 100, target: 90 },
            ].map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group">
                <div className="w-full flex justify-center items-end gap-1.5 h-48 pb-2">
                  <div 
                    className="w-[30%] sm:w-[25%] bg-[#2b5c8f] rounded-t-sm group-hover:opacity-90 transition-opacity" 
                    style={{ height: `${data.rev}%` }}
                  ></div>
                  <div 
                    className="w-[30%] sm:w-[25%] bg-slate-200 rounded-t-sm" 
                    style={{ height: `${data.target}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-slate-400">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation Status */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quotation Status</h3>
            <p className="text-sm text-slate-500 font-medium">This quarter</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center mt-6">
            <div className="relative w-48 h-48">
              {/* Mock Donut Chart using SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                {/* Accepted (Green) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="100.48" />
                {/* Pending (Purple) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2b5c8f" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="-150.72" className="origin-center rotate-[144deg]" />
                {/* Cancelled (Red) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="-75.36" className="origin-center rotate-[252deg]" />
                {/* Draft (Orange) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="-25.12" className="origin-center rotate-[288deg]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900">{stats.quotations?.total || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full mt-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-sm font-semibold text-slate-600">Accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2b5c8f]"></div>
                <span className="text-sm font-semibold text-slate-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <span className="text-sm font-semibold text-slate-600">Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
                <span className="text-sm font-semibold text-slate-600">Draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
