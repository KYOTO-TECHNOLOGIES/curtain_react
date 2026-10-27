import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  Phone,
  Save,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import CopyButton from './CopyButton';

interface CustomerSummaryProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isLoading: boolean;
}

export function CustomerSummary({
  customerName,
  customerEmail,
  customerPhone,
  isLoading,
}: CustomerSummaryProps) {
  return (
    <section className={`qb-customer-summary ${isLoading ? 'is-loading' : ''}`} aria-label="Customer details">
      <header className="qb-customer-heading">
        <span className="qb-customer-avatar" aria-hidden="true">
          {customerName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '?'}
        </span>
        <span className="qb-customer-title">Customer details</span>
        <span className="qb-customer-source">From appointment</span>
      </header>
      {isLoading ? (
        <div className="qb-customer-skeleton" aria-label="Loading customer details">
          {[0, 1, 2].map((index) => <span key={index} />)}
        </div>
      ) : (
        <dl className="qb-customer-rows">
          <div className="qb-customer-row group">
            <span className="qb-customer-row-icon"><UserRound size={15} /></span>
            <div className="qb-customer-row-copy">
              <dt>Customer</dt>
              <dd>{customerName || '—'}</dd>
            </div>
            {customerName && (
              <CopyButton value={customerName} ariaLabel="Copy customer name" className="qb-copy-button" />
            )}
          </div>
          <div className="qb-customer-row group">
            <span className="qb-customer-row-icon"><Mail size={15} /></span>
            <div className="qb-customer-row-copy">
              <dt>Email</dt>
              <dd>{customerEmail ? <a href={`mailto:${customerEmail}`}>{customerEmail}</a> : '—'}</dd>
            </div>
            {customerEmail && (
              <CopyButton value={customerEmail} ariaLabel="Copy customer email" className="qb-copy-button" />
            )}
          </div>
          <div className="qb-customer-row group">
            <span className="qb-customer-row-icon"><Phone size={15} /></span>
            <div className="qb-customer-row-copy">
              <dt>Phone</dt>
              <dd className="qb-tabular">
                {customerPhone ? <a href={`tel:${customerPhone}`}>{customerPhone}</a> : '—'}
              </dd>
            </div>
            {customerPhone && (
              <CopyButton value={customerPhone} ariaLabel="Copy customer phone" className="qb-copy-button" />
            )}
          </div>
        </dl>
      )}
    </section>
  );
}

type QuotationType = 'b2c' | 'b2b';

export function QuotationTypeCards({
  value,
  onChange,
}: {
  value: QuotationType;
  onChange: (value: QuotationType) => void;
}) {
  const options: { value: QuotationType; label: string; icon: LucideIcon }[] = [
    { value: 'b2c', label: 'B2C (Retail)', icon: UserRound },
    { value: 'b2b', label: 'B2B (Business)', icon: Building2 },
  ];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, next: QuotationType) => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    onChange(next);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[next === 'b2c' ? 0 : 1]?.focus();
  };

  return (
    <div className="qb-type-radio-group" role="radiogroup" aria-label="Quotation Type" data-selected={value}>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(optionValue)}
            onKeyDown={(event) => handleKeyDown(event, optionValue === 'b2c' ? 'b2b' : 'b2c')}
            className={`qb-type-card ${selected ? 'is-selected' : ''}`}
          >
            <span className="qb-type-icon"><Icon size={17} /></span>
            <span className="qb-type-label">{label}</span>
            <span className="qb-radio-dot" aria-hidden="true"><span /></span>
          </button>
        );
      })}
    </div>
  );
}

export function StickyActionBar({
  isSaving,
  canSave,
  onCancel,
  onSave,
}: {
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="qb-sticky-action-bar">
      <div className="qb-sticky-action-content">
        <button type="button" onClick={onCancel} className="qb-cancel-button">
          <ArrowLeft size={16} /> Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="qb-save-button"
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Quotation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
