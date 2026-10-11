import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Loader2, 
  ChevronRight, 
  Download, 
  ChevronDown, 
  CreditCard,
  Eye,
  Plus
} from 'lucide-react';
import { paymentsApi } from '../../api/payments';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const { data: listRes, isLoading } = useQuery({
    queryKey: ['payments', methodFilter],
    queryFn: () => paymentsApi.list(methodFilter ? { method: methodFilter } : {})
  });

  const payments = listRes?.data || [];
  const loading = isLoading;

  const filtered = payments.filter((p) =>
    (p.invoice || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.created_by_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getMethodStyle = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'bg-[#2b5c8f] text-white';
      case 'card': return 'bg-[#10b981] text-white';
      case 'cash': return 'bg-[#f59e0b] text-white';
      case 'cheque': return 'bg-[#8b5cf6] text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };
  
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
  };

  const totalCollected = filtered.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Payments Log
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span>Curtain Master.</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">Payments Received</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" strokeWidth={2.5} /> Export Ledger
          </button>
          <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Log Payment
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
                placeholder="Search invoice or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl outline-none focus:border-[#2b5c8f] transition-colors"
              />
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</span>
            <div className="relative">
              <select 
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-44"
              >
                <option value="">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl px-6 py-2.5 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-[15px] font-extrabold text-slate-800">
            {formatCurrency(totalCollected)}
          </span>
          <span className="text-[11px] font-medium text-emerald-500">Filtered Total</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice / Ref</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
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
                    No payments found.
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-extrabold text-slate-800">#{p.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-slate-700">{p.invoice_number || p.invoice}</span>
                      <span className="text-sm font-medium text-slate-500">Ref: {p.reference || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-[15px] font-extrabold text-[#10b981] tracking-tight">
                      + {formatCurrency(p.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getMethodStyle(p.method)}`}>
                      {p.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">Date:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{p.payment_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700">By:</span>
                        <span className="text-[12px] text-slate-500 font-medium">{p.created_by_name || 'System'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <button
                      onClick={() => navigate(`/invoices/${p.invoice_number || p.invoice}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#f0f4f8] text-[#2b5c8f] hover:bg-[#e1e9f1] font-bold text-[12px] rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Invoice
                    </button>
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
