import { AlertCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../../ui/StatusBadge';
import { displayCase, getSourceMeta, jobTypeIcon, overdueDays } from './helpers';

export function JobTypeChip({ jobType }: { jobType: string }) {
  const Icon = jobTypeIcon(jobType);
  return (
    <span className="ad-jobchip">
      <Icon aria-hidden="true" />
      {displayCase(jobType)}
    </span>
  );
}

/** Renders nothing when no source was provided. */
export function SourceChip({ source }: { source?: string | null }) {
  const meta = getSourceMeta(source);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className="ad-sourcechip">
      <Icon aria-hidden="true" />
      {meta.label}
    </span>
  );
}

interface StatusStripProps {
  status: string;
  jobType: string;
  source?: string | null;
  appointmentDate: string;
  updatedAt: string;
  updatedLabel: string;
}

/**
 * Status / job type / source / updated strip.
 * The optional progress stepper is intentionally omitted: the existing statuses
 * (scheduled, quoted, rescheduled, cancelled) are not a linear sequence.
 */
export function StatusStrip({ status, jobType, source, appointmentDate, updatedAt, updatedLabel }: StatusStripProps) {
  const overdue = overdueDays(status, appointmentDate);
  return (
    <section className="ad-card ad-strip ad-reveal" style={{ '--i': 1 } as React.CSSProperties} aria-label="Appointment status">
      <div className="ad-strip__item">
        <span className="ad-caption">Status</span>
        <div className="ad-strip__status">
          <StatusBadge status={status} />
          {overdue !== null && (
            <span className="ad-overdue">
              <AlertCircle aria-hidden="true" />
              Overdue · {overdue} {overdue === 1 ? 'day' : 'days'} ago
            </span>
          )}
        </div>
      </div>

      <div className="ad-strip__item">
        <span className="ad-caption">Job type</span>
        <JobTypeChip jobType={jobType} />
      </div>

      {getSourceMeta(source) && (
        <div className="ad-strip__item">
          <span className="ad-caption">Source</span>
          <SourceChip source={source} />
        </div>
      )}

      <div className="ad-strip__item ad-strip__item--end">
        <span className="ad-strip__updated">
          <Clock aria-hidden="true" />
          Updated <time dateTime={updatedAt}>{updatedLabel}</time>
        </span>
      </div>
    </section>
  );
}
