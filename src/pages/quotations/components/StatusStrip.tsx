import { formatDate, getValidityHint } from './helpers';
import StatusBadge from '../../../components/ui/StatusBadge';
import { DatePicker } from '../../../components/ui/DatePicker';

interface Props {
  status?: string;
  typeLabel?: string;
  validUntil?: string | null;
  created?: string | null;
  className?: string;
  isEditing?: boolean;
  editQuoteType?: string;
  editValidUntil?: string;
  onQuoteTypeChange?: (value: string) => void;
  onValidUntilChange?: (value: string) => void;
}

export default function StatusStrip({
  status = 'draft',
  typeLabel,
  validUntil,
  created,
  className = '',
  isEditing = false,
  editQuoteType,
  editValidUntil,
  onQuoteTypeChange,
  onValidUntilChange,
}: Props) {
  const validity = getValidityHint(validUntil, status);

  return (
    <section className={`qd-card qd-stagger qd-stagger-1 ${className}`} aria-label="Quotation Metadata">
      <dl className="qd-strip m-0">
        <div className="qd-strip-cell">
          <dt className="qd-strip-label">Status</dt>
          <dd className="m-0 mt-1">
            <StatusBadge status={status} />
          </dd>
        </div>

        <div className="qd-strip-cell">
          <dt className="qd-strip-label">Type</dt>
          <dd className="m-0 mt-1">
            {isEditing && onQuoteTypeChange ? (
              <div className="flex gap-2">
                {['b2c', 'b2b'].map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => onQuoteTypeChange(qt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      editQuoteType === qt
                        ? 'bg-[#2F5D8F] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {qt === 'b2c' ? 'B2C (Retail)' : 'B2B (Business)'}
                  </button>
                ))}
              </div>
            ) : (
              <span className="qd-strip-value">{typeLabel || 'B2C (Retail)'}</span>
            )}
          </dd>
        </div>

        <div className="qd-strip-cell">
          <dt className="qd-strip-label">Valid Until</dt>
          <dd className="m-0 mt-1">
            {isEditing && onValidUntilChange ? (
              <DatePicker
                value={editValidUntil || ''}
                onChange={(e) => onValidUntilChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            ) : (
              <>
                <div className="qd-strip-value">
                  {validUntil ? formatDate(validUntil) : '—'}
                </div>
                {validity && (
                  <div className={`qd-valid-hint qd-valid-hint--${validity.variant}`}>
                    {validity.text}
                  </div>
                )}
              </>
            )}
          </dd>
        </div>

        <div className="qd-strip-cell">
          <dt className="qd-strip-label">Created</dt>
          <dd className="m-0 mt-1 qd-strip-value">
            {created ? formatDate(created) : '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
