import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Loader2, 
  ChevronRight, 
  Download, 
  ChevronDown, 
  FileText,
  Eye
} from 'lucide-react';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quoteTypeFilter, setQuoteTypeFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    appointment: '',
    work_type: 1,
    quote_type: 'b2c',
    valid_until: '',
    discount_percentage: 0
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await quotationsApi.create({
        ...form,
        customer: Number(form.customer),
        appointment: form.appointment ? Number(form.appointment) : undefined,
        status: 'draft',
        areas_data: [] // Simplified scaffold
      });
      showToast('Quotation drafted successfully', 'success');
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create quotation', 'error');
    }
    setSaving(false);
  };

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['quotations', statusFilter, quoteTypeFilter, debouncedSearch],
    queryFn: () => quotationsApi.list({
      status: statusFilter || undefined,
      quote_type: quoteTypeFilter || undefined,
      search: debouncedSearch || undefined,
    })
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['quotations_stats'],
    queryFn: () => quotationsApi.stats().catch(() => ({ data: null }))
  });

  const quotations = listRes?.data || [];
  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = quotations;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-[#10b981] text-white';
      case 'sent': return 'bg-[#2b5c8f] text-white';
      case 'pending': return 'bg-[#8b5cf6] text-white';
      case 'cancelled': return 'bg-[#ef4444] text-white';
      case 'draft': return 'bg-[#f97316] text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-page-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Quotation Management
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span>Curtain Master.</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">Quotation List View</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" strokeWidth={2.5} /> Export List
          </button>
          <button onClick={() => navigate('/quotations/create')} className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> New Quotation
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-40"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</span>
            <div className="relative">
              <select 
                value={quoteTypeFilter}
                onChange={(e) => setQuoteTypeFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-40"
              >
                <option value="">All Types</option>
                <option value="b2c">B2C (Retail)</option>
                <option value="b2b">B2B (Business)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl px-6 py-2.5 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-[15px] font-extrabold text-slate-800">Total: {stats?.total || filtered.length}</span>
          <span className="text-[11px] font-medium text-slate-500">Quotations</span>
        </div>
      </div>

      {/* Indicators Row */}
      <div className="flex flex-wrap items-center gap-4 mt-2 mb-6">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.accepted || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Accepted</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2b5c8f]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.sent || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Sent</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.pending || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Pending</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.draft || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Draft</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.cancelled || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quote #</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No quotations found. Try adjusting your filters.
                  </td>
                </tr>
              ) : filtered.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-extrabold text-slate-800">{q.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-[14px] font-bold text-slate-700">{q.customer_name}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{q.customer_phone || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-[15px] font-extrabold text-slate-800 tracking-tight">
                      {formatCurrency(parseFloat(q.total || '0'))}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">Created:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{q.created_at?.split('T')[0] || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">Valid Till:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{q.valid_until?.split('T')[0] || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <button onClick={() => navigate(`/quotations/${q.id}`)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#f0f4f8] text-[#2b5c8f] hover:bg-[#e1e9f1] font-bold text-[12px] rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create Draft Quotation" maxWidth="max-w-xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer ID *</label>
              <input type="number" required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment ID (Optional)</label>
              <input type="number" value={form.appointment} onChange={(e) => setForm({ ...form, appointment: e.target.value })} placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quote Type *</label>
              <select required value={form.quote_type} onChange={(e) => setForm({ ...form, quote_type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all text-sm">
                <option value="b2c">B2C (Retail)</option>
                <option value="b2b">B2B (Business)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Type ID *</label>
              <input type="number" required value={form.work_type} onChange={(e) => setForm({ ...form, work_type: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valid Until *</label>
              <input type="date" required value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
            <p className="text-[13px] text-slate-500 font-medium">
              Note: This will create a <strong className="text-slate-700">Draft</strong> quotation. You can add areas and specific item calculations later from the Quotation Detail view.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
