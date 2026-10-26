import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Copy } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { hasValue } from './helpers';

/** Copy-to-clipboard icon button; fades in via CSS on row hover / focus. */
export function CopyButton({ value, label, className = '' }: { value: string; label: string; className?: string }) {
  const { showToast } = useToast();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      showToast('Copied', 'success');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1400);
    } catch {
      showToast('Unable to copy', 'error');
    }
  };

  return (
    <button type="button" className={`ad-copy ${done ? 'is-done' : ''} ${className}`} aria-label={label} onClick={copy}>
      {done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
  );
}

export type CardTone = 'brand' | 'violet' | 'emerald' | 'teal' | 'amber';

export function Card({
  icon: Icon,
  tone,
  title,
  right,
  children,
  className = '',
}: {
  icon: LucideIcon;
  tone: CardTone;
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = useId();
  return (
    <section className={`ad-card ${className}`} aria-labelledby={headingId}>
      <header className="ad-card__hdr">
        <span className={`ad-card__icon ad-card__icon--${tone}`} aria-hidden="true">
          <Icon />
        </span>
        <h2 className="ad-card__title" id={headingId}>{title}</h2>
        {right && <div className="ad-card__right">{right}</div>}
      </header>
      {children}
    </section>
  );
}

/** Read-only value, with a muted dash + SR text when empty. */
export function Value({ children }: { children: ReactNode }) {
  const empty = children === null || children === undefined || (typeof children === 'string' && !hasValue(children));
  if (empty) {
    return (
      <>
        <span className="ad-dash" aria-hidden="true">—</span>
        <span className="ad-sr">Not provided</span>
      </>
    );
  }
  return <>{children}</>;
}

/** Edit-mode control wrapper: shared label style + amber "Edited" tag. */
export function EditShell({
  label,
  edited,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  edited?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ad-edit ${className}`}>
      <div className="ad-edit__head">
        <label className="ad-label" htmlFor={htmlFor}>{label}</label>
        {edited && <span className="ad-edited">Edited</span>}
      </div>
      {children}
    </div>
  );
}

export function EditField({
  label,
  value,
  original,
  onChange,
  type = 'text',
  textarea = false,
  className = '',
}: {
  label: string;
  value: string;
  original?: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  className?: string;
}) {
  const id = useId();
  const edited = original !== undefined && original !== value;
  return (
    <EditShell label={label} edited={edited} htmlFor={id} className={className}>
      {textarea ? (
        <textarea id={id} className="ad-control ad-control--area" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="ad-control" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </EditShell>
  );
}
