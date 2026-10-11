import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  Receipt,
  Send,
} from 'lucide-react';
import { invoicesApi } from '../../api/invoices';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { paymentSchema, type PaymentFormValues } from '../../lib/validationSchemas';
import type { InvoiceListItem } from '../../types';

const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {message}
    </p>
  ) : null;

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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendVia, setSendVia] = useState('email');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    },
  });

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const invoice = (res?.data || null) as InvoiceListItem | null;

  const openPaymentModal = () => {
    paymentForm.reset({
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!id) return;
    setIsSubmittingPayment(true);
    try {
      await invoicesApi.addPayment(id, {
        amount: parseFloat(data.amount),
        method: data.method,
        payment_date: data.payment_date,
        reference: data.reference,
        notes: data.notes,
      });
      showToast('Payment logged successfully', 'success');
      setPaymentModalOpen(false);
      refetch();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.amount?.[0] || 'Failed to log payment';
      showToast(detail, 'error');
    }
    setIsSubmittingPayment(false);
  };

  const handleSend = async () => {
    if (!id) return;
    setIsSending(true);
    try {
      await invoicesApi.send(id, sendVia);
      showToast('Invoice sent successfully', 'success');
      setSendModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to send invoice', 'error');
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4 py-10">
        <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b5c8f]">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>
        <p className="text-slate-500 font-medium">Invoice not found.</p>
      </div>
    );
  }

  const canPay = invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const canSend = invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2b5c8f] mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#2b5c8f]/10">
              <Receipt className="w-6 h-6 text-[#2b5c8f]" />
            </div>
            <div>
              <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">{invoice.id}</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{invoice.customer_name}</p>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(invoice.status)}`}>
          {invoice.status_display || invoice.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-extrabold text-slate-800">{formatCurrency(invoice.total_amount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid</p>
          <p className="text-xl font-extrabold text-[#10b981]">{formatCurrency(invoice.amount_paid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Balance Due</p>
          <p className="text-xl font-extrabold text-[#ef4444]">{formatCurrency(invoice.balance_due)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Customer</h2>
          <button
            onClick={() => navigate(`/customers/${invoice.customer}`)}
            className="text-sm font-bold text-[#2b5c8f] hover:underline"
          >
            {invoice.customer_name}
          </button>
          <p className="text-sm font-medium text-slate-500">{invoice.customer_phone || '—'}</p>
          <p className="text-sm font-medium text-slate-500">{invoice.customer_email || '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Timeline</h2>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-500">Issued</span>
            <span className="font-semibold text-slate-800">{invoice.issued_date || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-500">Due</span>
            <span className="font-semibold text-slate-800">{invoice.due_date || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-500">Order</span>
            <button
              onClick={() => navigate(`/orders/${invoice.order_id || invoice.order}`)}
              className="font-bold text-[#2b5c8f] hover:underline"
            >
              #{invoice.order_id || invoice.order}
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-500">Quotation</span>
            <button
              onClick={() => invoice.quotation_id && navigate(`/quotations/${invoice.quotation_id}`)}
              className="font-bold text-[#2b5c8f] hover:underline"
            >
              {invoice.quotation_id || '—'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canPay && (
          <button
            onClick={openPaymentModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl hover:bg-[#1f456e] transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Payment
          </button>
        )}
        {canSend && (
          <button
            onClick={() => setSendModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Send className="w-4 h-4" /> Send Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Payments</h2>
        </div>
        {(invoice.payments || []).length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-medium text-slate-400">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-3 text-sm font-medium text-slate-700">{p.payment_date}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700 capitalize">{p.method.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-500">{p.reference || '—'}</td>
                    <td className="px-6 py-3 text-sm font-extrabold text-[#10b981] text-right">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Log Payment">
        <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (AED) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              {...paymentForm.register('amount')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <input
              type="text"
              {...paymentForm.register('reference')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <textarea
              {...paymentForm.register('notes')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm resize-none h-24"
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

      <Modal open={sendModalOpen} onClose={() => setSendModalOpen(false)} title="Send Invoice">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Send via</label>
            <select
              value={sendVia}
              onChange={(e) => setSendVia(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSendModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSend} disabled={isSending} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
