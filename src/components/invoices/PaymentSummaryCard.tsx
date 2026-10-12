import { ReceiptText } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { formatAedMinor, type PaymentSummaryValues } from './money';

interface PaymentSummaryCardProps {
  summary: PaymentSummaryValues;
  enteredMinor: number;
}

export function PaymentSummaryCard({ summary, enteredMinor }: PaymentSummaryCardProps) {
  const isPaid = summary.totalMinor > 0 && summary.outstandingMinor <= 0;
  const isUnpaid = summary.paidMinor <= 0 && !isPaid;
  const status = isPaid ? 'paid' : isUnpaid ? 'unpaid' : 'partially_paid';
  const statusLabel = isPaid ? 'Paid in full' : isUnpaid ? 'Unpaid' : 'Partially paid';
  const paymentSegment = Math.max(0, Math.min(enteredMinor, summary.outstandingMinor));
  const paidPercent = summary.totalMinor > 0
    ? Math.max(0, Math.min(100, Math.round((summary.paidMinor / summary.totalMinor) * 100)))
    : 0;
  const paymentPercent = summary.totalMinor > 0
    ? Math.max(0, Math.min(100, Math.round((paymentSegment / summary.totalMinor) * 100)))
    : 0;
  const remainingPercent = summary.totalMinor > 0
    ? Math.max(0, Math.min(100, Math.round(((summary.outstandingMinor - paymentSegment) / summary.totalMinor) * 100)))
    : 0;
  const totalPercent = summary.totalMinor > 0 ? summary.totalMinor : 0;
  const willSettle = enteredMinor > 0 && summary.outstandingMinor > 0 && enteredMinor >= summary.outstandingMinor;
  const progressLabel = `${paidPercent}% paid${enteredMinor > 0 ? `, this payment ${paymentPercent}%` : ''}, ${remainingPercent}% remaining`;

  return (
    <section className="payment-summary-card" aria-label="Payment summary">
      <div className="payment-summary-header">
        <div className="payment-summary-title">
          <ReceiptText aria-hidden="true" />
          <span>Payment summary</span>
        </div>
        <StatusBadge status={status} label={statusLabel} className={`payment-summary-status status-${status}`} />
      </div>

      <div className="payment-summary-compact">
        <span><strong>Outstanding</strong> {formatAedMinor(summary.outstandingMinor)}</span>
        <span aria-hidden="true">·</span>
        <span>{paidPercent}% paid</span>
      </div>

      <dl className="payment-summary-stats">
        <div className="payment-summary-stat stat-total">
          <dt><span className="payment-summary-dot" />Total</dt>
          <dd><span className="payment-summary-currency">AED</span>{formatAedMinor(summary.totalMinor).replace('AED ', '')}</dd>
        </div>
        <div className="payment-summary-stat stat-paid">
          <dt><span className="payment-summary-dot" />Paid</dt>
          <dd><span className="payment-summary-currency">AED</span>{formatAedMinor(summary.paidMinor).replace('AED ', '')}</dd>
        </div>
        <div className={`payment-summary-stat stat-outstanding ${summary.outstandingMinor <= 0 ? 'is-settled' : ''}`}>
          <dt><span className="payment-summary-dot" />Outstanding</dt>
          <dd>
            <span className="payment-summary-currency">AED</span>
            {formatAedMinor(Math.max(0, summary.outstandingMinor)).replace('AED ', '')}
            {summary.outstandingMinor <= 0 && <span className="payment-summary-settled">Settled</span>}
          </dd>
        </div>
      </dl>

      {totalPercent > 0 && (
        <>
          <div
            className={`payment-summary-progress ${willSettle ? 'will-settle' : ''}`}
            role="img"
            aria-label={progressLabel}
          >
            <span className="payment-progress-paid" style={{ width: `${paidPercent}%` }} />
            <span className="payment-progress-current" style={{ width: `${paymentPercent}%` }} />
            <span className="payment-progress-sheen" aria-hidden="true" />
          </div>
          <div className="payment-summary-legend" aria-hidden="true">
            <span><i className="legend-paid" />Paid {paidPercent}%</span>
            {enteredMinor > 0 && <span><i className="legend-current" />This payment {paymentPercent}%</span>}
            <span><i className="legend-remaining" />Left {remainingPercent}%</span>
          </div>
        </>
      )}
    </section>
  );
}