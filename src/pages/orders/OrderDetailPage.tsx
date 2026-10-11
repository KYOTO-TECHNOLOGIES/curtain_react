import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Loader2,
  Package,
  Receipt,
} from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../components/ui/Toast';
import type { OrderDetail, OrderStatus } from '../../types';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending_production',
  'in_production',
  'shipped',
  'installed',
  'closed',
  'cancelled',
];

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });

  const order = (res?.data || null) as OrderDetail | null;

  const handleStatusChange = async (status: string) => {
    if (!id || !order || status === order.order_status) return;
    setUpdatingStatus(true);
    try {
      await ordersApi.updateStatus(id, status);
      showToast('Order status updated', 'success');
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update status', 'error');
    }
    setUpdatingStatus(false);
  };

  const handleGenerateInvoice = async () => {
    if (!id) return;
    setGeneratingInvoice(true);
    try {
      const result = await ordersApi.generateInvoice(id);
      showToast('Invoice generated successfully', 'success');
      refetch();
      const invoiceId = result?.data?.id;
      if (invoiceId) navigate(`/invoices/${invoiceId}`);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to generate invoice', 'error');
    }
    setGeneratingInvoice(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4 py-10">
        <button onClick={() => navigate('/orders')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b5c8f]">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <p className="text-slate-500 font-medium">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2b5c8f] mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#2b5c8f]/10">
              <Package className="w-6 h-6 text-[#2b5c8f]" />
            </div>
            <div>
              <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">Order #{order.id}</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{order.customer_name}</p>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(order.order_status)}`}>
          {order.order_status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">Customer</span>
              <button
                onClick={() => navigate(`/customers/${order.customer}`)}
                className="text-sm font-bold text-[#2b5c8f] hover:underline"
              >
                {order.customer_name}
              </button>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">Phone</span>
              <span className="text-sm font-semibold text-slate-800">{order.customer_phone || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">Est. Production</span>
              <span className="text-sm font-semibold text-slate-800">{order.estimated_production_days} days</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">Created</span>
              <span className="text-sm font-semibold text-slate-800">
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Linked Records</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/quotations/${order.quotation_id || order.quotation}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#f0f4f8] transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-[#2b5c8f]" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Quotation</p>
                <p className="text-sm font-bold text-slate-800">{order.quotation_id || order.quotation}</p>
              </div>
            </button>
            {order.invoice_id ? (
              <button
                onClick={() => navigate(`/invoices/${order.invoice_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#f0f4f8] transition-colors text-left"
              >
                <Receipt className="w-4 h-4 text-[#2b5c8f]" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Invoice</p>
                  <p className="text-sm font-bold text-slate-800">{order.invoice_id}</p>
                  {order.invoice_status && (
                    <p className="text-xs font-medium text-slate-500 capitalize mt-0.5">
                      {order.invoice_status.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              </button>
            ) : (
              <p className="text-sm font-medium text-slate-400 px-1">No invoice generated yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <select
              value={order.order_status}
              disabled={updatingStatus || order.order_status === 'cancelled' || order.order_status === 'closed'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none w-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#2b5c8f] disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {!order.invoice_id && order.order_status !== 'cancelled' && (
            <button
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl hover:bg-[#1f456e] disabled:opacity-60 transition-colors"
            >
              {generatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              Generate Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
