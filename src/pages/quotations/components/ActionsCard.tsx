import { Send, CheckCircle, XCircle, Trash2, Zap } from 'lucide-react';
import type { QuotationDetail } from '../../../api/quotations';

interface Props {
  status?: string;
  quotation?: QuotationDetail | null;
  onSend?: () => void;
  onCancel?: () => void;
  onAccept?: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export default function ActionsCard({
  status: propStatus,
  quotation,
  onSend,
  onCancel,
  onAccept,
  onDelete,
  isProcessing = false,
  className = '',
}: Props) {
  const currentStatus = quotation ? quotation.status : propStatus;

  return (
    <div
      className={`qd-card qd-stagger qd-stagger-3 ${className}`}
      aria-label="Actions"
    >
      <div className="qd-card-hdr">
        <div className="qd-card-icon qd-card-icon--brand">
          <Zap />
        </div>
        <h3 className="qd-card-title">Actions</h3>
      </div>

      <div className="flex flex-col gap-3">
        {currentStatus === 'draft' && onSend && (
          <button
            type="button"
            onClick={onSend}
            disabled={isProcessing}
            className="w-full h-11 rounded-[12px] bg-[#2F5D8F] hover:bg-[#1B3A5E] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.985] disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Quotation</span>
          </button>
        )}

        {currentStatus === 'sent' && onAccept && (
          <button
            type="button"
            onClick={onAccept}
            disabled={isProcessing}
            className="w-full h-11 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.985] disabled:opacity-60 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Accept Quotation</span>
          </button>
        )}

        {(currentStatus === 'draft' || currentStatus === 'sent') && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full h-11 rounded-[12px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.985] disabled:opacity-60 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Cancel Quotation</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isProcessing}
            className="qd-delete-btn"
            aria-label="Delete quotation"
          >
            <Trash2 className="qd-delete-icon" />
            <span>Delete Quotation</span>
          </button>
        )}
      </div>
    </div>
  );
}
