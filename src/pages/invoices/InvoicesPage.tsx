import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search, 
  Loader2, 
  ChevronRight, 
  Download, 
  ChevronDown, 
  Receipt,
  Eye,
  Plus,
  AlertCircle
} from 'lucide-react';
import { invoicesApi } from '../../api/invoices';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { paymentSchema, type PaymentFormValues } from '../../lib/validationSchemas';

const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {message}
    </p>
  ) : null;

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    }
  });

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesApi.list(statusFilter ? { status: statusFilter } : {})
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['invoices_stats', statusFilter],
    queryFn: () => invoicesApi.stats().catch(() => ({ data: null }))
  });

  const invoices = listRes?.data || [];
  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = invoices.filter((i) =>
    (i.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.quotation_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#10b981] text-white';
      case 'partially_paid': return 'bg-[#0ea5e9] text-white';
      case 'sent': return 'bg-[#2b5c8f] text-white';
      case 'overdue': return 'bg-[#ef4444] text-white';
      case 'draft': return 'bg-[#f97316] text-white';
      case 'cancelled': return 'bg-slate-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };
  
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
  };

  const openPaymentModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    paymentForm.reset({
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!selectedInvoiceId) return;
    setIsSubmittingPayment(true);
    try {
      await invoicesApi.addPayment(selectedInvoiceId, {
        amount: parseFloat(data.amount),
        method: data.method,
        payment_date: data.payment_date,
        reference: data.reference,
        notes: data.notes
      });
      showToast('Payment logged successfully', 'success');
      setPaymentModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to log payment', 'error');
    }
    setIsSubmittingPayment(false);
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Invoice Management
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span>Curtain Master.</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">Invoice List View</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" strokeWidth={2.5} /> Export List
          </button>
          <button onClick={() => showToast('Invoices are auto-generated from Orders', 'success')} className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Generate Invoice
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
                placeholder="Search invoices, quotes, or customers..."
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
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl px-6 py-2.5 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-[15px] font-extrabold text-slate-800">
            {stats?.total_paid ? formatCurrency(stats.total_paid) : 'AED 0.00'}
          </span>
          <span className="text-[11px] font-medium text-emerald-500">Total Collected</span>
        </div>
      </div>

      {/* Indicators Row */}
      <div className="flex flex-wrap items-center gap-4 mt-2 mb-6">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.paid || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Paid</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.partially_paid || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Partially Paid</span>
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
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.overdue || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Overdue</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice / Quote #</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total / Balance</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No invoices found.
                  </td>
                </tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-extrabold text-slate-800">{i.id}</span>
                      </div>
                      <span className="text-[12px] text-slate-400 font-medium pl-6">
                        Quote: {i.quotation_id || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-slate-700">{i.customer_name}</span>
                      <span className="text-sm font-medium text-slate-500">{i.customer_phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-extrabold text-slate-800 tracking-tight">
                        {formatCurrency(i.total_amount)}
                      </span>
                      <span className="text-[12px] font-bold text-[#ef4444]">
                        Due: {formatCurrency(i.balance_due)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">Issued:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{i.issued_date || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">Due:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{i.due_date || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(i.status)}`}>
                      {i.status_display || i.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      {i.status !== 'paid' && i.status !== 'cancelled' && (
                        <button 
                          onClick={() => openPaymentModal(i.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0f4f8] text-[#2b5c8f] hover:bg-[#e1e9f1] font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Log Payment
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/invoices/${i.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-700 font-bold text-[11px] rounded-lg transition-colors"
                      >
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

      {/* Log Payment Modal */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Log Payment">
        <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (AED) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              {...paymentForm.register('amount')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
              placeholder="e.g. 500.00"
            />
            <ErrorMsg message={paymentForm.formState.errors.amount?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
            <select
              {...paymentForm.register('method')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.method ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
            >
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
            <ErrorMsg message={paymentForm.formState.errors.method?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              {...paymentForm.register('payment_date')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.payment_date ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
            />
            <ErrorMsg message={paymentForm.formState.errors.payment_date?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Number <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <input
              type="text"
              {...paymentForm.register('reference')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm"
              placeholder="e.g. TXN-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <textarea
              {...paymentForm.register('notes')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm resize-none h-24"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmittingPayment} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmittingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmittingPayment ? 'Saving...' : 'Log Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
