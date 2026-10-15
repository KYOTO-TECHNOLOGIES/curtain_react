import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from './helpers';
import type { QuotationDetail } from '../../../api/quotations';

interface Props {
  preparedBy?: string;
  created?: string | null;
  sentDate?: string | null;
  sentVia?: string | null;
  acceptedDate?: string | null;
  quotation?: QuotationDetail | null;
  className?: string;
}

export default function Timeline({
  preparedBy: propPreparedBy,
  created: propCreated,
  sentDate: propSentDate,
  sentVia: propSentVia,
  acceptedDate: propAcceptedDate,
  quotation,
  className = '',
}: Props) {
  const preparedBy = quotation ? quotation.prepared_by_name : propPreparedBy;
  const created = quotation ? quotation.created_at : propCreated;
  const sentDate = quotation ? quotation.sent_date : propSentDate;
  const sentVia = quotation ? quotation.sent_via : propSentVia;
  const acceptedDate = quotation ? quotation.accepted_date : propAcceptedDate;

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`qd-card qd-stagger qd-stagger-4 ${className}`}
      aria-label="Quotation Timeline"
    >
      <div className="qd-card-hdr">
        <div className="qd-card-icon qd-card-icon--slate">
          <Clock />
        </div>
        <h3 className="qd-card-title">Timeline</h3>
      </div>

      <div
        className={`qd-timeline ${animated ? 'qd-timeline--animated' : ''}`}
      >
        {/* Step 1: Prepared */}
        <div className="qd-timeline-node">
          <div
            className={`qd-timeline-dot ${
              created ? 'qd-timeline-dot--complete' : 'qd-timeline-dot--pending'
            }`}
          />
          <div className="qd-timeline-connector" />
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Prepared
            </div>
            <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
              {created ? formatDate(created) : 'Draft'}
            </div>
            {preparedBy && (
              <div className="text-[12.5px] text-slate-500 mt-0.5">
                by {preparedBy}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Sent */}
        <div className="qd-timeline-node">
          <div
            className={`qd-timeline-dot ${
              sentDate ? 'qd-timeline-dot--complete' : 'qd-timeline-dot--pending'
            }`}
          />
          <div className="qd-timeline-connector" />
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Sent
            </div>
            <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
              {sentDate ? formatDate(sentDate) : 'Not sent yet'}
            </div>
            {sentDate && sentVia && (
              <div className="text-[12.5px] text-slate-500 mt-0.5">
                via {sentVia.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Accepted */}
        <div className="qd-timeline-node">
          {acceptedDate ? (
            <svg
              className="qd-timeline-check"
              viewBox="0 0 14 14"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6.5" className="qd-timeline-check-circle" />
              <polyline points="4 7 6 9 10 5" className="qd-timeline-check-path" />
            </svg>
          ) : (
            <div className="qd-timeline-dot qd-timeline-dot--pending" />
          )}
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Accepted
            </div>
            <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
              {acceptedDate ? formatDate(acceptedDate) : 'Pending acceptance'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
