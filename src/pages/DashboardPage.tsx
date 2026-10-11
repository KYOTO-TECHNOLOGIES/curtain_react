import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Filter, 
  Download, 
  Banknote, 
  Calendar, 
  FileText, 
  Package, 
  Search,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import type { RootState } from '../store';
import { useQueries } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointments';
import { quotationsApi } from '../api/quotations';
import { ordersApi } from '../api/orders';
import { invoicesApi } from '../api/invoices';
import { StatCard } from '../components/ui/StatCard';

export default function DashboardPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('This Month');
  const [chartRange, setChartRange] = useState<'6M' | '12M'>('6M');

  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  const results = useQueries({
    queries: [
      { queryKey: ['appointments_stats'], queryFn: () => appointmentsApi.stats() },
      { queryKey: ['quotations_stats'], queryFn: () => quotationsApi.stats() },
      { queryKey: ['orders_stats'], queryFn: () => ordersApi.stats() },
      { queryKey: ['invoices_stats'], queryFn: () => invoicesApi.stats() }
    ]
  });

  const stats = {
    appointments: results[0].data?.data || null,
    quotations: results[1].data?.data || null,
    orders: results[2].data?.data || null,
    invoices: results[3].data?.data || null
  };

  const totalPaid = parseFloat(stats.invoices?.total_paid || '0') || 0;

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 }).format(num || 0);
  };

  return (
    <div className="space-y-7 font-['Hanken_Grotesk'] text-[#0B1B33] animate-fadeIn">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF3FA] text-[12px] font-semibold text-[#334155] mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A5FA8]"></span>
            OPERATIONAL OVERVIEW
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B1B33] tracking-tight font-['Bricolage_Grotesque']">
            Operational Overview<span className="text-[#2A5FA8]">.</span>
          </h1>
          <p className="mt-1 text-[#64748B] font-medium text-[15px]">
            Welcome back, {firstName}. Here's a snapshot of today's floor activity.
          </p>
        </div>
        
        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4.5 h-11 text-sm font-semibold rounded-[14px] border transition-all duration-180 cursor-pointer ${
              showFilters 
                ? 'bg-[#EEF3FA] text-[#2A5FA8] border-[#2A5FA8]/30 shadow-sm' 
                : 'bg-white text-[#1E293B] border-[#E2E8F0] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_12px_-4px_rgba(10,18,32,0.06)] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
            }`}
          >
            <Filter className="w-4 h-4 text-[#64748B]" />
            {showFilters ? 'Hide Filters' : 'Filter View'}
          </button>
          
          <button 
            className="flex items-center gap-2 px-5 h-11 text-white text-sm font-semibold rounded-[14px] bg-gradient-to-b from-[#3366B2] to-[#2A5FA8] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_20px_-6px_rgba(42,95,168,0.45)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-6px_rgba(42,95,168,0.55)] active:translate-y-0 transition-all duration-180 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Interactive Filter Drawer (Login Page Input Box UI) */}
      {showFilters && (
        <div className="bg-white rounded-[20px] p-5 border border-[#E2E8F0] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_6px_20px_-6px_rgba(10,18,32,0.08)] grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          {/* Search Box */}
          <div className="flex flex-col">
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5 cursor-pointer">
              Search Activity
            </label>
            <div className="relative flex items-center group">
              <Search className="w-4.5 h-4.5 text-[#94A3B8] absolute left-4 pointer-events-none group-focus-within:text-[#0B1B33] transition-colors" />
              <input 
                type="text"
                placeholder="Search orders, clients, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2A5FA8] focus:ring-4 focus:ring-[#2A5FA8]/16 rounded-[14px] text-[14.5px] font-medium text-[#0B1B33] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_12px_-4px_rgba(10,18,32,0.06)] outline-none transition-all"
              />
            </div>
          </div>

          {/* Date Range Select */}
          <div className="flex flex-col">
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5 cursor-pointer">
              Timeline Period
            </label>
            <div className="relative flex items-center group">
              <Calendar className="w-4.5 h-4.5 text-[#94A3B8] absolute left-4 pointer-events-none group-focus-within:text-[#0B1B33] transition-colors" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full h-11 pl-11 pr-9 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2A5FA8] focus:ring-4 focus:ring-[#2A5FA8]/16 rounded-[14px] text-[14.5px] font-medium text-[#0B1B33] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_12px_-4px_rgba(10,18,32,0.06)] outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="Today">Today's Data</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Quarter">This Quarter</option>
                <option value="Year to Date">Year to Date (YTD)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-end gap-2.5">
            <button 
              onClick={() => { setSearchQuery(''); setDateRange('This Month'); }}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-white text-[#64748B] hover:text-[#0B1B33] font-semibold text-sm rounded-[14px] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] shadow-[0_1px_2px_rgba(10,18,32,0.04)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="flex-1 h-11 flex items-center justify-center gap-2 text-white font-semibold text-sm rounded-[14px] bg-gradient-to-b from-[#3366B2] to-[#2A5FA8] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_20px_-6px_rgba(42,95,168,0.45)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards Grid (Numbers first, quiet UI, responsive grid) */}
      <div className="stat-cards-grid">
        {/* Monthly Sales */}
        <StatCard
          label="Monthly sales"
          value={totalPaid > 0 ? formatCurrency(totalPaid) : '0'}
          rawValue={totalPaid}
          prefix="AED"
          trend={totalPaid > 0 ? { value: 12.4, label: 'vs last month', isPositive: true } : null}
          emptyText="No sales yet"
          sparklineData={totalPaid > 0 ? [20, 32, 28, 45, 38, 54, 72] : []}
          accent="#16A34A"
          icon={Banknote}
          href="/invoices"
          loading={results[3].isLoading}
          index={0}
        />

        {/* Active Appointments */}
        <StatCard
          label="Active appointments"
          value={stats.appointments?.today ?? 0}
          rawValue={stats.appointments?.today ?? 0}
          status={(stats.appointments?.today ?? 0) > 0 ? {
            label: `${stats.appointments?.today ?? 0} due today`,
            color: '#F59E0B'
          } : null}
          emptyText="None scheduled today"
          sparklineData={(stats.appointments?.today ?? 0) > 0 ? [4, 7, 5, 9, 6, 8, 7] : []}
          accent="#F59E0B"
          icon={Calendar}
          href="/appointments"
          loading={results[0].isLoading}
          index={1}
        />

        {/* Pending Quotes */}
        <StatCard
          label="Pending quotes"
          value={stats.quotations?.by_status?.draft ?? 13}
          rawValue={stats.quotations?.by_status?.draft ?? 13}
          status={(stats.quotations?.by_status?.draft ?? 13) > 0 ? {
            label: 'High priority',
            color: '#E5484D'
          } : null}
          emptyText="No pending quotes"
          sparklineData={(stats.quotations?.by_status?.draft ?? 13) > 0 ? [8, 12, 10, 16, 13, 17, 13] : []}
          accent="#E5484D"
          icon={FileText}
          href="/quotations"
          loading={results[1].isLoading}
          index={2}
        />

        {/* Pending Installs */}
        <StatCard
          label="Pending installs"
          value={stats.orders?.by_status?.pending_production ?? 0}
          rawValue={stats.orders?.by_status?.pending_production ?? 0}
          status={(stats.orders?.by_status?.pending_production ?? 0) > 0 ? {
            label: '92% capacity',
            color: '#2F6FDB'
          } : null}
          emptyText="No pending installs"
          sparklineData={(stats.orders?.by_status?.pending_production ?? 0) > 0 ? [3, 6, 4, 8, 7, 9, 7] : []}
          accent="#2F6FDB"
          icon={Package}
          href="/orders"
          loading={results[2].isLoading}
          index={3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-[24px] p-6.5 border border-[#E2E8F0] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_16px_-4px_rgba(10,18,32,0.06)] lg:col-span-2 min-h-[340px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#0B1B33] font-['Bricolage_Grotesque'] tracking-tight">
                Revenue Trend<span className="text-[#2A5FA8]">.</span>
              </h3>
              <p className="text-sm text-[#64748B] font-medium mt-0.5">Monthly sales performance · AED</p>
              
              <div className="flex items-center gap-4 mt-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2A5FA8]"></div>
                  <span className="text-xs font-semibold text-[#334155]">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-xs font-semibold text-[#64748B]">Target</span>
                </div>
              </div>
            </div>
            
            {/* Range Toggle Buttons */}
            <div className="flex bg-[#F1F5F9] p-1 rounded-[14px] border border-[#E2E8F0]">
              <button 
                onClick={() => setChartRange('6M')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                  chartRange === '6M' 
                    ? 'bg-white text-[#2A5FA8] shadow-sm font-bold' 
                    : 'text-[#64748B] hover:text-[#0B1B33]'
                }`}
              >
                6M
              </button>
              <button 
                onClick={() => setChartRange('12M')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                  chartRange === '12M' 
                    ? 'bg-white text-[#2A5FA8] shadow-sm font-bold' 
                    : 'text-[#64748B] hover:text-[#0B1B33]'
                }`}
              >
                12M
              </button>
            </div>
          </div>
          
          {/* Mock Chart Area */}
          <div className="flex-1 flex items-end justify-between gap-3 pt-6 relative min-h-[200px]">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0 pointer-events-none">
              <div className="border-t border-[#F1F5F9] w-full"></div>
              <div className="border-t border-[#F1F5F9] w-full"></div>
              <div className="border-t border-[#F1F5F9] w-full"></div>
              <div className="border-t border-[#F1F5F9] w-full"></div>
            </div>
            
            {[
              { month: 'Jan', rev: 40, target: 50 },
              { month: 'Feb', rev: 70, target: 60 },
              { month: 'Mar', rev: 55, target: 65 },
              { month: 'Apr', rev: 85, target: 70 },
              { month: 'May', rev: 65, target: 80 },
              { month: 'Jun', rev: 100, target: 90 },
            ].map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group cursor-pointer">
                <div className="w-full flex justify-center items-end gap-1.5 h-48 pb-2">
                  <div 
                    className="w-[32%] sm:w-[26%] bg-gradient-to-t from-[#2A5FA8] to-[#3B75C8] rounded-t-[6px] group-hover:brightness-110 transition-all shadow-sm" 
                    style={{ height: `${data.rev}%` }}
                  ></div>
                  <div 
                    className="w-[32%] sm:w-[26%] bg-slate-200/80 rounded-t-[6px] group-hover:bg-slate-300 transition-colors" 
                    style={{ height: `${data.target}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#0B1B33] transition-colors">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation Status */}
        <div className="bg-white rounded-[24px] p-6.5 border border-[#E2E8F0] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_16px_-4px_rgba(10,18,32,0.06)] flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0B1B33] font-['Bricolage_Grotesque'] tracking-tight">
              Quotation Status<span className="text-[#2A5FA8]">.</span>
            </h3>
            <p className="text-sm text-[#64748B] font-medium mt-0.5">Current quarterly distribution</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <div className="relative w-48 h-48">
              {/* Donut Chart using SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                {/* Accepted (Green) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="100.48" />
                {/* Pending (Blue Accent) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2A5FA8" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="-150.72" className="origin-center rotate-[144deg]" />
                {/* Cancelled (Red) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="-75.36" className="origin-center rotate-[252deg]" />
                {/* Draft (Orange) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="18" strokeDasharray="251.2" strokeDashoffset="-25.12" className="origin-center rotate-[288deg]" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[#0B1B33] font-['Bricolage_Grotesque'] tracking-tight">{stats.quotations?.total || 0}</span>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total</span>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                <span className="text-xs font-semibold text-[#334155]">Accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A5FA8]"></div>
                <span className="text-xs font-semibold text-[#334155]">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                <span className="text-xs font-semibold text-[#334155]">Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
                <span className="text-xs font-semibold text-[#334155]">Draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
