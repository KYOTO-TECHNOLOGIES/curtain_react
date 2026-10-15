export type MoneyValue = number | string | null | undefined;

export interface PaymentSummaryValues {
  totalMinor: number;
  paidMinor: number;
  outstandingMinor: number;
}

const amountFormatter = new Intl.NumberFormat('en-AE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toMinor(value: MoneyValue): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export function parseEnteredMinor(value: string): number | null {
  if (value.trim() === '') return 0;
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function formatAedMinor(value: number): string {
  return `AED ${amountFormatter.format(value / 100)}`;
}

export function formatMinorForInput(value: number): string {
  const whole = Math.floor(value / 100);
  const fraction = Math.abs(value % 100).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

export function getPaymentSummaryValues(
  totalValue: MoneyValue,
  paidValue: MoneyValue,
  outstandingValue: MoneyValue,
): PaymentSummaryValues | null {
  let totalMinor = toMinor(totalValue);
  const paidInputMinor = toMinor(paidValue);
  const outstandingInputMinor = toMinor(outstandingValue);

  if (totalMinor === null && paidInputMinor !== null && outstandingInputMinor !== null) {
    totalMinor = paidInputMinor + outstandingInputMinor;
  }
  if (totalMinor === null) return null;

  if (outstandingInputMinor !== null) {
    return {
      totalMinor,
      paidMinor: totalMinor - outstandingInputMinor,
      outstandingMinor: outstandingInputMinor,
    };
  }
  if (paidInputMinor !== null) {
    return {
      totalMinor,
      paidMinor: paidInputMinor,
      outstandingMinor: totalMinor - paidInputMinor,
    };
  }
  return null;
}