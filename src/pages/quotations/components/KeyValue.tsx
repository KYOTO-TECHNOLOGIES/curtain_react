import type { ReactNode } from 'react';
import CopyButton from './CopyButton';

interface Props {
  label: string;
  value?: ReactNode;
  copyable?: boolean;
  copyValue?: string;
  href?: string;
  className?: string;
}

export default function KeyValue({
  label,
  value,
  copyable = false,
  copyValue,
  href,
  className = '',
}: Props) {
  const displayVal = value ?? '—';
  const textToCopy = copyValue ?? (typeof value === 'string' ? value : undefined);

  return (
    <div className={`qd-kv-group ${className}`}>
      <dt className="qd-kv-label">{label}</dt>
      <dd className="qd-kv-value">
        {href ? (
          <a href={href} className="qd-link">
            {displayVal}
          </a>
        ) : (
          <span>{displayVal}</span>
        )}
        {copyable && textToCopy && textToCopy !== '—' && (
          <CopyButton value={textToCopy} ariaLabel={`Copy ${label}`} inline />
        )}
      </dd>
    </div>
  );
}
