import { useEffect, useId, useRef } from 'react';
import type { FormEventHandler, CSSProperties, ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  AlertCircle,
  ArrowDownCircle,
  Banknote,
  Check,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  Loader2,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { BalancePreview } from './BalancePreview';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { formatMinorForInput, getPaymentSummaryValues, parseEnteredMinor } from './money';
import type { PaymentFormValues } from '../../lib/validationSchemas';
import './LogPaymentModal.css';

interface LogPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<PaymentFormValues>;
  isSubmitting: boolean;
  context?: string;
  invoiceTotal?: number | string;
  paidToDate?: number | string;
  outstandingBalance?: number | string;
}

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer', color: '#2F5D8F', Icon: Landmark },
  { value: 'card', label: 'Credit/Debit Card', color: '#10B981', Icon: CreditCard },
  { value: 'cash', label: 'Cash', color: '#F59E0B', Icon: Banknote },
  { value: 'cheque', label: 'Cheque', color: '#8B5CF6', Icon: FileText },
] as const;

function relativeDateHint(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const difference = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (difference === 0) return 'Today';
  if (difference === -1) return 'Yesterday';
  if (difference < 0) return `${Math.abs(difference)} days ago`;
  return `In ${difference} days`;
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
  rightContent,
}: {
  htmlFor: string;
  children: string;
  required?: boolean;
  rightContent?: ReactNode;
}) {
  return (
    <div className="payment-field-label-row">
      <label className="payment-field-label" htmlFor={htmlFor}>
        {children}
        {required && <span className="payment-required-mark" aria-hidden="true">*</span>}
      </label>
      {rightContent || (!required && <span className="payment-optional-tag">Optional</span>)}
    </div>
  );
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="payment-error-message">
      <AlertCircle aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export function LogPaymentModal({
  open,
  onClose,
  onSubmit,
  form,
  isSubmitting,
  context,
  invoiceTotal,
  paidToDate,
  outstandingBalance,
}: LogPaymentModalProps) {
  const id = useId();
  const dateRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const methodValue = form.watch('method');
  const amountValue = form.watch('amount');
  const paymentDate = form.watch('payment_date');
  const notesValue = form.watch('notes');
  const dateHint = relativeDateHint(paymentDate || '');
  const selectedMethodIndex = Math.max(
    0,
    paymentMethods.findIndex((method) => method.value === methodValue)
  );
  const selectedMethod = paymentMethods[selectedMethodIndex] || paymentMethods[0];

  const amountError = form.formState.errors.amount?.message;
  const methodError = form.formState.errors.method?.message;
  const dateError = form.formState.errors.payment_date?.message;
  const paymentSummary = getPaymentSummaryValues(invoiceTotal, paidToDate, outstandingBalance);
  const enteredAmountMinor = parseEnteredMinor(amountValue || '');
  const canShowBalancePreview = Boolean(paymentSummary && enteredAmountMinor !== null && !amountError);
  const amountMatchesBalance = Boolean(
    paymentSummary && enteredAmountMinor === paymentSummary.outstandingMinor
  );

  useEffect(() => {
    const textarea = notesRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
  }, [notesValue]);

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    const body = bodyRef.current;
    const syncEdges = () => {
      body.parentElement?.classList.toggle('has-top-scroll', body.scrollTop > 0);
      body.parentElement?.classList.toggle(
        'has-bottom-scroll',
        body.scrollHeight - body.clientHeight - body.scrollTop > 1
      );
    };
    const frame = requestAnimationFrame(syncEdges);
    body.addEventListener('scroll', syncEdges, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      body.removeEventListener('scroll', syncEdges);
    };
  }, [open]);

  const onMethodKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    const current = event.target as HTMLInputElement;
    if (current.type !== 'radio') return;
    event.preventDefault();
    current.click();
  };

  const dateRegistration = form.register('payment_date');
  const notesRegistration = form.register('notes');

  /** Fill the amount field with the full outstanding balance without submitting. */
  const handlePayFullBalance = () => {
    if (!paymentSummary) return;
    form.setValue(
      'amount',
      formatMinorForInput(paymentSummary.outstandingMinor),
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Payment"
      subtitle="Record a payment received"
      context={context}
      variant="payment"
      isBusy={isSubmitting}
    >
      <form
        className="payment-modal-form"
        onSubmit={onSubmit}
        aria-busy={isSubmitting}
      >
        <div className="payment-modal-body-shell">
          <div
            ref={bodyRef}
            className="payment-modal-body"
            onScroll={(event) => {
              const element = event.currentTarget;
              element.parentElement?.classList.toggle('has-top-scroll', element.scrollTop > 0);
              element.parentElement?.classList.toggle(
                'has-bottom-scroll',
                element.scrollHeight - element.clientHeight - element.scrollTop > 1
              );
            }}
          >
            {paymentSummary && (
              <PaymentSummaryCard
                summary={paymentSummary}
                enteredMinor={enteredAmountMinor ?? 0}
              />
            )}

            {/* Amount */}
            <section className="payment-field payment-amount-field">
              <FieldLabel
                htmlFor={`${id}-amount`}
                required
                rightContent={paymentSummary && paymentSummary.outstandingMinor > 0 ? (
                  amountMatchesBalance ? (
                    <span className="payment-full-balance-state">Full balance <Check aria-hidden="true" /></span>
                  ) : (
                    <button
                      type="button"
                      className="payment-full-balance-button"
                      onClick={handlePayFullBalance}
                    >
                      Pay full balance
                    </button>
                  )
                ) : undefined}
              >
                Amount (AED)
              </FieldLabel>
              <div className={`payment-amount-control ${amountError ? 'is-invalid' : ''}`}>
                <span className="payment-currency-prefix" aria-hidden="true">AED</span>
                <input
                  {...form.register('amount')}
                  id={`${id}-amount`}
                  data-payment-autofocus
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  autoComplete="off"
                  readOnly={isSubmitting}
                  aria-invalid={Boolean(amountError)}
                  aria-describedby={amountError ? `${id}-amount-error` : undefined}
                  className="payment-amount-input"
                  placeholder="e.g. 500.00"
                />
              </div>
              {paymentSummary && (
                <BalancePreview
                  summary={paymentSummary}
                  enteredMinor={enteredAmountMinor ?? 0}
                  invalid={!canShowBalancePreview}
                />
              )}
              <ErrorMessage id={`${id}-amount-error`} message={amountError} />
            </section>

            {/* Payment Method */}
            <section className="payment-field">
              <FieldLabel htmlFor={`${id}-method-bank_transfer`} required>Payment Method</FieldLabel>
              <div
                className={`payment-method-picker ${methodError ? 'is-invalid' : ''}`}
                role="radiogroup"
                aria-label="Payment Method"
                aria-invalid={Boolean(methodError)}
                aria-describedby={methodError ? `${id}-method-error` : undefined}
                onKeyDown={onMethodKeyDown}
                style={{
                  '--payment-highlight-x': selectedMethodIndex % 2
                    ? 'calc(100% + var(--cm-payment-method-gap))'
                    : '0px',
                  '--payment-highlight-y': selectedMethodIndex > 1
                    ? 'calc(100% + var(--cm-payment-method-gap))'
                    : '0px',
                  '--payment-method-color': selectedMethod.color,
                } as CSSProperties}
              >
                <span className="payment-method-highlight" aria-hidden="true" />
                {paymentMethods.map(({ value, label, color, Icon }) => {
                  const checked = methodValue === value;
                  const inputId = `${id}-method-${value}`;
                  const methodRegistration = form.register('method');
                  return (
                    <label
                      key={value}
                      className={`payment-method-tile ${checked ? 'is-selected' : ''}`}
                      htmlFor={inputId}
                      style={{ '--payment-method-color': color } as CSSProperties}
                    >
                      <input
                        {...methodRegistration}
                        id={inputId}
                        type="radio"
                        role="radio"
                        value={value}
                        checked={checked}
                        aria-checked={checked}
                        disabled={isSubmitting}
                      />
                      <span className="payment-method-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="payment-method-label">{label}</span>
                      {checked && (
                        <span className="payment-method-check" aria-hidden="true">
                          <Check />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <ErrorMessage id={`${id}-method-error`} message={methodError} />
            </section>

            {/* Date + Reference — side-by-side on wider modal */}
            <div className="payment-date-reference-row">
              <section className="payment-field">
                <FieldLabel htmlFor={`${id}-date`} required>Payment Date</FieldLabel>
                <DatePicker
                  {...dateRegistration}
                  ref={(element) => {
                    dateRegistration.ref(element);
                    dateRef.current = element;
                  }}
                  id={`${id}-date`}
                  value={paymentDate || ''}
                  required
                  readOnly={isSubmitting}
                  aria-invalid={Boolean(dateError)}
                  aria-describedby={dateError ? `${id}-date-error` : undefined}
                />
                <p className={`payment-date-hint ${dateHint && new Date(`${paymentDate}T00:00:00`).getTime() > new Date().setHours(0, 0, 0, 0) ? 'is-future' : ''}`}>
                  <span key={paymentDate}>{dateHint}</span>
                </p>
                <ErrorMessage id={`${id}-date-error`} message={dateError} />
              </section>

              <section className="payment-field">
                <FieldLabel htmlFor={`${id}-reference`}>Reference Number</FieldLabel>
                <div className="payment-icon-control">
                  <Hash className="payment-leading-icon" aria-hidden="true" />
                  <input
                    {...form.register('reference')}
                    id={`${id}-reference`}
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    readOnly={isSubmitting}
                    className="payment-standard-input payment-reference-input"
                    placeholder="e.g. TXN-12345"
                  />
                </div>
              </section>
            </div>

            {/* Notes */}
            <section className="payment-field">
              <FieldLabel htmlFor={`${id}-notes`}>Notes</FieldLabel>
              <textarea
                {...notesRegistration}
                ref={(element) => {
                  notesRegistration.ref(element);
                  notesRef.current = element;
                }}
                id={`${id}-notes`}
                readOnly={isSubmitting}
                className="payment-notes-input"
                placeholder="Any additional notes..."
                rows={2}
                onInput={() => {
                  const textarea = notesRef.current;
                  if (!textarea) return;
                  textarea.style.height = 'auto';
                  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
                  textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
                }}
              />
            </section>
          </div>
          <span className="payment-body-fade payment-body-fade-top" aria-hidden="true" />
          <span className="payment-body-fade payment-body-fade-bottom" aria-hidden="true" />
        </div>

        <footer className="payment-modal-footer">
          <button
            type="button"
            className="payment-cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="payment-submit-button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="payment-submit-spinner" aria-hidden="true" /> : <ArrowDownCircle className="payment-submit-icon" aria-hidden="true" />}
            <span>{isSubmitting ? 'Saving…' : 'Log Payment'}</span>
          </button>
          <span className="payment-enter-hint"><kbd>↵</kbd> Enter to save</span>
        </footer>
      </form>
    </Modal>
  );
}

export default LogPaymentModal;
