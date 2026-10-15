import { useEffect, useState } from 'react';
import { AlertCircle, Check, WalletCards } from 'lucide-react';
import { AnimatedAmount } from './AnimatedAmount';
import { formatAedMinor, type PaymentSummaryValues } from './money';

interface BalancePreviewProps {
  summary: PaymentSummaryValues;
  enteredMinor: number;
  invalid?: boolean;
}

type PreviewState = 'empty' | 'partial' | 'exact' | 'over';

export function BalancePreview({ summary, enteredMinor, invalid = false }: BalancePreviewProps) {
  const [announcement, setAnnouncement] = useState('');
  const outstandingMinor = summary.outstandingMinor;
  const balanceAfterMinor = outstandingMinor - enteredMinor;
  const state: PreviewState = enteredMinor <= 0
    ? 'empty'
    : balanceAfterMinor < 0
      ? 'over'
      : balanceAfterMinor === 0
        ? 'exact'
        : 'partial';
  const amountMinor = state === 'over'
    ? Math.abs(balanceAfterMinor)
    : state === 'empty'
      ? outstandingMinor
      : Math.max(0, balanceAfterMinor);
  const label = state === 'empty'
    ? 'Outstanding balance'
    : state === 'over'
      ? 'Exceeds outstanding by'
      : 'Balance after this payment';
  const announcementValue = state === 'over'
    ? `${label}: ${formatAedMinor(amountMinor)}`
    : `${label}: ${formatAedMinor(amountMinor)}`;

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(announcementValue), 400);
    return () => window.clearTimeout(timer);
  }, [announcementValue]);

  if (invalid) return null;

  return (
    <div className={`payment-balance-preview state-${state}`} aria-live="polite" aria-atomic="true">
      <div className="payment-balance-visible" aria-hidden="true">
        <span className="payment-balance-icon">
          {state === 'exact' ? <Check /> : state === 'over' ? <AlertCircle /> : <WalletCards />}
        </span>
        <span className="payment-balance-label">{label}</span>
        <AnimatedAmount amountMinor={amountMinor} className="payment-balance-value" />
        {(state === 'partial' || state === 'exact' || state === 'over') && (
          <span className="payment-balance-chip">
            {state === 'partial' ? 'Partial payment' : state === 'exact' ? 'Settles in full' : 'Overpayment'}
          </span>
        )}
      </div>
      <span className="sr-only">{announcement}</span>
    </div>
  );
}