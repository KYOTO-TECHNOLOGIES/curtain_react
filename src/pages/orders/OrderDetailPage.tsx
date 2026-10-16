import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Link2,
  Loader2,
  Package,
  Phone,
  Receipt,
  SlidersHorizontal,
  Timer,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../components/ui/Toast';
import { SelectMenu, type SelectOption } from '../../components/ui/SelectMenu';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { STATUS_CONFIGS } from '../../components/ui/statusConfig';
import type { OrderDetail, OrderStatus } from '../../types';
import './OrderDetailPage.css';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending_production',
  'in_production',
  'shipped',
  'installed',
  'closed',
  'cancelled',
];

const ORDER_STATUS_CONFIG = STATUS_CONFIGS.orders;
const ORDER_PROGRESS_STATUSES = STATUS_OPTIONS.filter((status) => status !== 'cancelled');

const displayStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());

const statusOptions: SelectOption[] = STATUS_OPTIONS.map((value) => {
  const config = ORDER_STATUS_CONFIG.find((option) => option.value === value);
  return {
    value,
    label: displayStatus(value),
    dotColor: config?.color,
    textColor: config?.textColor,
    tintColor: config?.tint,
  };
});

const parseCalendarDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) return date;
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace(/^0/, '');

const dateDifferenceInDays = (from: Date, to: Date) => {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86_400_000);
};

const relativeDate = (date: Date) => {
  const difference = dateDifferenceInDays(date, new Date());
  if (difference === 0) return 'Today';
  if (difference === 1) return 'Yesterday';
  if (difference > 1) return `${difference} days ago`;
  if (difference === -1) return 'Tomorrow';
  return `In ${Math.abs(difference)} days`;
};

const customerInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '—';

const statusColor = (status: string) =>
  ORDER_STATUS_CONFIG.find((option) => option.value === status)?.color || '#64748B';

function CopyButton({
  value,
  label,
  onCopied,
  onError,
}: {
  value: string;
  label: string;
  onCopied: () => void;
  onError: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      onCopied();
    } catch {
      onError();
    }
  };

  return (
    <button
      type="button"
      className="order-copy-button"
      aria-label={label}
      title={label}
      onClick={() => void handleCopy()}
    >
      <Copy aria-hidden="true" />
    </button>
  );
}

function CardHeader({
  title,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  subtitle?: string;
  icon: typeof ClipboardList;
  tone: 'blue' | 'violet' | 'amber';
}) {
  return (
    <header className="order-card-header">
      <span className={`order-card-icon order-card-icon--${tone}`}>
        <Icon aria-hidden="true" />
      </span>
      <span className="order-card-heading">
        <h2>{title}</h2>
        {subtitle && <span className="order-card-subtitle">{subtitle}</span>}
      </span>
    </header>
  );
}

function DetailTile({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <div className="order-detail-tile">
      <span className="order-detail-icon"><Icon aria-hidden="true" /></span>
      <div className="order-detail-copy">
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function OrderPageSkeleton() {
  return (
    <div className="order-detail-page order-detail-skeleton" aria-label="Loading order details" aria-busy="true">
      <div className="order-skeleton-back" />
      <div className="order-skeleton-header" />
      <div className="order-detail-grid">
        <div className="order-skeleton-card" />
        <div className="order-skeleton-card" />
        <div className="order-skeleton-actions" />
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [statusFlash, setStatusFlash] = useState(false);
  const previousStatus = useRef<OrderStatus | null>(null);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });

  const order = (res?.data || null) as OrderDetail | null;

  useEffect(() => {
    if (!order) return;
    if (previousStatus.current !== null && previousStatus.current !== order.order_status) {
      setStatusFlash(true);
      const timer = window.setTimeout(() => setStatusFlash(false), 1200);
      previousStatus.current = order.order_status;
      return () => window.clearTimeout(timer);
    }
    previousStatus.current = order.order_status;
  }, [order?.order_status]);

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

  if (isLoading) return <OrderPageSkeleton />;

  if (isError || !order) {
    return (
      <main className="order-detail-page order-error-page">
        <Link to="/orders" className="order-back-link"><ArrowLeft aria-hidden="true" />Back to Orders</Link>
        <section className="order-error-card">
          <span className="order-error-icon"><Package aria-hidden="true" /></span>
          <h1>Order not found</h1>
          <p>We couldn’t find this order. Return to your orders to continue.</p>
          <button type="button" className="order-error-action" onClick={() => navigate('/orders')}>Back to Orders</button>
        </section>
      </main>
    );
  }

  const createdDate = parseCalendarDate(order.created_at);
  const productionDays = Number(order.estimated_production_days);
  const expectedDate = createdDate && Number.isFinite(productionDays)
    ? new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + productionDays)
    : null;
  const quotationNumber = order.quotation_id || order.quotation;
  const currentProgressIndex = ORDER_PROGRESS_STATUSES.indexOf(order.order_status);
  const progressPercent = currentProgressIndex < 0
    ? 0
    : (currentProgressIndex / (ORDER_PROGRESS_STATUSES.length - 1)) * 100;

  return (
    <main className="order-detail-page">
      <nav className="order-breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders" className="order-back-link"><ArrowLeft aria-hidden="true" />Back to Orders</Link>
      </nav>

      <section className="order-page-header" aria-label={`Order ${order.id}`}>
        <div className="order-heading">
          <span className="order-heading-icon"><Package aria-hidden="true" /></span>
          <div className="order-heading-copy">
            <div className="order-title-line">
              <h1>Order #{order.id}</h1>
              <CopyButton
                value={`Order #${order.id}`}
                label="Copy order number"
                onCopied={() => showToast('Copied', 'success')}
                onError={() => showToast('Could not copy to clipboard', 'error')}
              />
            </div>
            <div className="order-customer-line">
              <span className="order-customer-avatar" aria-hidden="true">{customerInitials(order.customer_name)}</span>
              <Link to={`/customers/${order.customer}`} className="order-customer-name" title={order.customer_name}>
                {order.customer_name}
                <span className="order-customer-underline" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <div key={order.order_status} className="order-header-status">
          <StatusBadge status={order.order_status} label={displayStatus(order.order_status)} />
        </div>
      </section>

      <div className="order-detail-grid">
        <section className="order-card order-info-card">
          <CardHeader title="Order Details" icon={ClipboardList} tone="blue" />
          <dl className="order-details-list">
            <DetailTile label="Customer" icon={UserRound}>
              <Link to={`/customers/${order.customer}`} className="order-detail-link" title={order.customer_name}>
                <span>{order.customer_name}</span><ArrowUpRight aria-hidden="true" />
              </Link>
            </DetailTile>
            <DetailTile label="Phone" icon={Phone}>
              {order.customer_phone ? (
                <span className="order-phone-value">
                  <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                  <CopyButton
                    value={order.customer_phone}
                    label="Copy phone number"
                    onCopied={() => showToast('Copied', 'success')}
                    onError={() => showToast('Could not copy to clipboard', 'error')}
                  />
                </span>
              ) : '—'}
            </DetailTile>
            <DetailTile label="Est. Production" icon={Timer}>
              <span>{order.estimated_production_days} days</span>
              {expectedDate && Number.isFinite(productionDays) && (
                <span className="order-detail-hint">Approx. ready by {formatDate(expectedDate)}</span>
              )}
            </DetailTile>
            <DetailTile label="Created" icon={CalendarDays}>
              {createdDate ? (
                <>
                  <time dateTime={order.created_at}>{formatDate(createdDate)}</time>
                  <span className="order-detail-hint">{relativeDate(createdDate)}</span>
                </>
              ) : '—'}
            </DetailTile>
          </dl>
        </section>

        <section className="order-card order-linked-card">
          <CardHeader title="Linked Records" icon={Link2} tone="violet" />
          <div className="order-record-list">
            {quotationNumber ? (
              <Link to={`/quotations/${order.quotation_id || order.quotation}`} className="order-record order-record--quotation">
                <span className="order-record-icon"><FileText aria-hidden="true" /></span>
                <span className="order-record-copy">
                  <span className="order-record-label">Quotation</span>
                  <span className="order-record-number" title={quotationNumber}>{quotationNumber}</span>
                </span>
                <ArrowUpRight className="order-record-arrow" aria-hidden="true" />
              </Link>
            ) : (
              <div className="order-record-empty"><span className="order-record-icon"><FileText aria-hidden="true" /></span><span>No quotation linked</span></div>
            )}
            {order.invoice_id ? (
              <Link to={`/invoices/${order.invoice_id}`} className="order-record order-record--invoice">
                <span className="order-record-icon"><Receipt aria-hidden="true" /></span>
                <span className="order-record-copy">
                  <span className="order-record-label">Invoice</span>
                  <span className="order-record-number" title={order.invoice_id}>{order.invoice_id}</span>
                </span>
                {order.invoice_status && <StatusBadge status={order.invoice_status} label={displayStatus(order.invoice_status)} className="order-invoice-status" />}
                <ArrowUpRight className="order-record-arrow" aria-hidden="true" />
              </Link>
            ) : (
              <div className="order-record-empty"><span className="order-record-icon"><Receipt aria-hidden="true" /></span><span>No invoice generated yet</span></div>
            )}
          </div>
        </section>

        <section className={`order-card order-actions-card${statusFlash ? ' is-flashing' : ''}`} style={{ '--order-status-color': statusColor(order.order_status) } as React.CSSProperties}>
          <CardHeader
            title="Actions"
            subtitle="Update the production status of this order"
            icon={SlidersHorizontal}
            tone="amber"
          />
          <div className="order-action-body">
            <div className="order-status-field">
              <label htmlFor="order-status-control">Order status</label>
              <SelectMenu
                id="order-status-control"
                value={order.order_status}
                options={statusOptions}
                onChange={handleStatusChange}
                disabled={updatingStatus || order.order_status === 'cancelled' || order.order_status === 'closed'}
                ariaLabel="Order status"
                className="order-status-select"
                menuClassName="order-status-menu"
              />
            </div>
            {!order.invoice_id && order.order_status !== 'cancelled' && (
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="order-generate-invoice"
              >
                {generatingInvoice ? <Loader2 aria-hidden="true" /> : <Receipt aria-hidden="true" />}
                Generate Invoice
              </button>
            )}
          </div>
          <div className="order-progress" style={{ '--order-progress': `${progressPercent}%` } as React.CSSProperties}>
            <div className="order-progress-steps" aria-hidden="true">
              <span className="order-progress-track" />
              {ORDER_PROGRESS_STATUSES.map((status, index) => {
                const isCurrent = index === currentProgressIndex;
                const isComplete = currentProgressIndex >= 0 && index < currentProgressIndex;
                return (
                  <span className={`order-progress-step${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`} key={status}>
                    <span className="order-progress-marker">
                      {isComplete && <Check aria-hidden="true" />}
                    </span>
                    <span className="order-progress-label">{displayStatus(status)}</span>
                  </span>
                );
              })}
            </div>
            <p className="order-progress-announcement" aria-live="polite">
              {currentProgressIndex >= 0
                ? `Step ${currentProgressIndex + 1} of ${ORDER_PROGRESS_STATUSES.length} · ${displayStatus(order.order_status)}`
                : `Order status: ${displayStatus(order.order_status)}`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
