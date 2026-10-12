import { ArrowLeft, Edit2, Save, X, Loader2 } from 'lucide-react';
import CopyButton from './CopyButton';

interface Props {
  id?: string;
  customer?: string;
  project?: string;
  onBack: () => void;
  onEdit: () => void;
  isEditing?: boolean;
  onSave?: () => void;
  onCancelEdit?: () => void;
  isSaving?: boolean;
}

export default function DetailHeader({
  id,
  customer,
  project,
  onBack,
  onEdit,
  isEditing = false,
  onSave,
  onCancelEdit,
  isSaving = false,
}: Props) {
  return (
    <header className="qd-header qd-stagger qd-stagger-0">
      <div className="qd-header-left">
        <button
          type="button"
          onClick={onBack}
          className="qd-back-btn"
          aria-label="Back to Quotations"
          title="Back to Quotations"
        >
          <ArrowLeft />
        </button>
        <div>
          <div className="qd-h1-row group">
            <h1 className="qd-h1">{id || 'Quotation'}</h1>
            {id && <CopyButton value={id} ariaLabel="Copy quotation ID" />}
          </div>
          <p className="qd-subtitle">
            <span>{customer || 'Client'}</span>
            {project && (
              <>
                <span className="qd-subtitle-sep">•</span>
                <span>{project}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#2F5D8F] hover:bg-[#1B3A5E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="qd-edit-btn"
            aria-label="Edit Quotation"
            title="Edit Quotation"
          >
            <Edit2 />
            <span className="qd-edit-btn-label">Edit</span>
          </button>
        )}
      </div>
    </header>
  );
}
