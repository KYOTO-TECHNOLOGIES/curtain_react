import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Save,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import CopyButton from './CopyButton';
import { formatAED } from '../utils/pricing';

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

export type BuilderStepState = 'done' | 'active' | 'upcoming';

export function BuilderProgress({
  steps,
  quoteType,
}: {
  steps: { label: string; description: string; state: BuilderStepState }[];
  quoteType: QuotationType;
}) {
  return (
    <div className="qb-progress" aria-label="Quotation progress">
      <ol className="qb-progress-steps">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={`qb-progress-step is-${step.state}`}
            aria-current={step.state === 'active' ? 'step' : undefined}
          >
            <span className="qb-progress-marker" aria-hidden="true">
              {step.state === 'done' ? <Check size={13} strokeWidth={3} /> : index + 1}
            </span>
            <span className="qb-progress-copy">
              <span className="qb-progress-label">{step.label}</span>
              <span className="qb-progress-desc">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="qb-progress-badges">
        <span className="qb-badge qb-badge--draft">Draft</span>
        <span className={`qb-badge ${quoteType === 'b2b' ? 'qb-badge--b2b' : 'qb-badge--b2c'}`}>
          {quoteType === 'b2b' ? 'B2B' : 'B2C'}
        </span>
      </div>
    </div>
  );
}

export interface SummaryLine {
  key: string;
  areaName: string;
  surfaceName: string;
  dimensions: string;
  total: number;
}

export function QuotationSummaryCard({
  lines,
  subtotal,
  discountPercentage,
  discountAmount,
  vatRate,
  vatAmount,
  grandTotal,
  isB2B,
}: {
  lines: SummaryLine[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  isB2B: boolean;
}) {
  const hasMultiple = lines.length > 1;
  const [showBreakdown, setShowBreakdown] = useState(true);
  const areaCount = new Set(lines.map((line) => line.areaName)).size;

  return (
    <section className="qb-card qb-summary-card" aria-labelledby="qb-summary-title">
      <header className="qb-summary-header">
        <span className="qb-card-icon qb-card-icon--brand"><Receipt size={18} aria-hidden="true" /></span>
        <div className="qb-summary-heading">
          <h2 id="qb-summary-title">Quotation Summary</h2>
          <p>
            {lines.length} {lines.length === 1 ? 'surface' : 'surfaces'} across {areaCount} {areaCount === 1 ? 'area' : 'areas'}
            {' · '}
            {isB2B ? 'B2B custom pricing' : 'Catalog pricing'}
          </p>
        </div>
        {hasMultiple && (
          <button
            type="button"
            className={`qb-summary-toggle${showBreakdown ? ' is-open' : ''}`}
            onClick={() => setShowBreakdown((open) => !open)}
            aria-expanded={showBreakdown}
            aria-controls="qb-summary-lines"
          >
            {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="qb-summary-body">
        {hasMultiple && showBreakdown && (
          <div className="qb-summary-lines" id="qb-summary-lines">
            <table>
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Surface</th>
                  <th scope="col">Size</th>
                  <th scope="col" className="is-num">Line total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.key}>
                    <td>{line.areaName}</td>
                    <td className="is-strong">{line.surfaceName}</td>
                    <td className="is-muted">{line.dimensions}</td>
                    <td className="is-num">AED {formatAED(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <dl className={`qb-summary-totals${hasMultiple && showBreakdown ? '' : ' is-full'}`}>
          <div>
            <dt>Subtotal</dt>
            <dd>AED {formatAED(subtotal)}</dd>
          </div>
          <div className={discountAmount > 0 ? 'is-discount' : 'is-zero'}>
            <dt>Discount{discountPercentage > 0 ? ` (${discountPercentage}%)` : ''}</dt>
            <dd>{discountAmount > 0 ? '− ' : ''}AED {formatAED(discountAmount)}</dd>
          </div>
          <div>
            <dt>VAT ({Math.round(vatRate * 100)}%)</dt>
            <dd>AED {formatAED(vatAmount)}</dd>
          </div>
          <div className="is-grand">
            <dt>Grand total</dt>
            <dd>AED {formatAED(grandTotal)}</dd>
          </div>
          <p className="qb-summary-note">Estimate based on current selections. Final totals are confirmed on save.</p>
        </dl>
      </div>
    </section>
  );
}

export function StickyActionBar({
  isSaving,
  canSave,
  onCancel,
  onSave,
  total,
  surfaceCount = 0,
}: {
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
  total?: number;
  surfaceCount?: number;
}) {
  return (
    <div className="qb-sticky-action-bar">
      <div className="qb-sticky-action-content">
        <button type="button" onClick={onCancel} className="qb-cancel-button">
          <ArrowLeft size={16} /> Cancel
        </button>
        {surfaceCount > 0 && total !== undefined && (
          <div className="qb-sticky-total" aria-live="polite">
            <span className="qb-sticky-total-label">
              Grand total · {surfaceCount} {surfaceCount === 1 ? 'surface' : 'surfaces'}
            </span>
            <strong className="qb-sticky-total-value">AED {formatAED(total)}</strong>
          </div>
        )}
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
