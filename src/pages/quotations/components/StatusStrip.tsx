import { formatDate, getValidityHint } from './helpers';
import StatusBadge from '../../../components/ui/StatusBadge';

interface Props {
  status?: string;
  typeLabel?: string;
  validUntil?: string | null;
  created?: string | null;
  className?: string;
}

export default function StatusStrip({
  status = 'draft',
  typeLabel,
  validUntil,
  created,
  className = '',
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
          <dd className="m-0 mt-1 qd-strip-value">
            {typeLabel || 'B2C (Retail)'}
          </dd>
        </div>

        <div className="qd-strip-cell">
          <dt className="qd-strip-label">Valid Until</dt>
          <dd className="m-0 mt-1">
            <div className="qd-strip-value">
              {validUntil ? formatDate(validUntil) : '—'}
            </div>
            {validity && (
              <div className={`qd-valid-hint qd-valid-hint--${validity.variant}`}>
                {validity.text}
              </div>
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
