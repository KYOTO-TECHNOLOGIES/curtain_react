import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, FileText, Loader2, Plus } from 'lucide-react';
import { quotationsApi } from '../../../api/quotations';
import type { QuotationListItem } from '../../../types';
import { StatusBadge } from '../../ui/StatusBadge';
import { Card } from './DetailPrimitives';

const money = new Intl.NumberFormat('en-AE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (value?: string) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toArray = (response: any): QuotationListItem[] => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export function AppointmentQuotationsCard({
  appointmentId,
}: {
  appointmentId: string | number;
}) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointment-quotations', String(appointmentId)],
    queryFn: () => quotationsApi.list({ appointment: appointmentId, limit: 500 }),
    retry: false,
  });

  const quotations = useMemo(
    () => toArray(data).sort((left, right) => {
      const leftTime = new Date(left.created_at || left.issued_date || 0).getTime();
      const rightTime = new Date(right.created_at || right.issued_date || 0).getTime();
      return rightTime - leftTime;
    }),
    [data],
  );

  return (
    <Card
      icon={FileText}
      tone="teal"
      title="Quotations"
      right={
        !isLoading && !isError ? (
          <span className="text-xs font-semibold text-slate-500">
            {quotations.length} {quotations.length === 1 ? 'quotation' : 'quotations'}
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Loading quotations…
        </div>
      ) : isError ? (
        <p className="py-6 text-center text-sm text-rose-600">
          Quotations could not be loaded.
        </p>
      ) : quotations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-7 text-center">
          <p className="text-sm text-slate-500">No quotation has been created for this appointment.</p>
          <button
            type="button"
            onClick={() => navigate(`/quotations/create?appointment=${appointmentId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2F5D8F] hover:bg-[#1B3A5E] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Create quotation
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{quotation.id}</span>
                  <StatusBadge status={quotation.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500">
                  <span>{quotation.work_type_name || 'Quotation'}</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatDate(quotation.issued_date || quotation.created_at)}</span>
                  <span aria-hidden="true">•</span>
                  <span className="font-semibold text-slate-700">
                    AED {money.format(Number(quotation.total) || 0)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/quotations/${quotation.id}`)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-[#2F5D8F] text-xs font-semibold transition-colors shrink-0"
                aria-label={`View quotation ${quotation.id}`}
              >
                View quotation
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
