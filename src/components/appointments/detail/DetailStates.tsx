import { AlertCircle, ArrowLeft, Save, X } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function DetailSkeleton() {
  return (
    <div className="ad-page" aria-busy="true" aria-label="Loading appointment details">
      <div className="ad-skel ad-skel--crumb" />
      <div className="ad-skel-row">
        <div className="ad-skel ad-skel--badge" />
        <div className="ad-skel-col">
          <div className="ad-skel ad-skel--title" />
          <div className="ad-skel ad-skel--chip" />
        </div>
        <div className="ad-skel ad-skel--actions" />
      </div>
      <div className="ad-skel ad-skel--strip" />
      <div className="ad-grid">
        <div className="ad-main">
          <div className="ad-skel ad-skel--card ad-skel--tall" />
          <div className="ad-skel ad-skel--card" />
        </div>
        <div className="ad-aside">
          <div className="ad-skel ad-skel--card ad-skel--tall" />
          <div className="ad-skel ad-skel--card" />
        </div>
      </div>
    </div>
  );
}

export function DetailError({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="ad-page">
      <div className="ad-card ad-state">
        <span className="ad-state__icon ad-state__icon--error" aria-hidden="true"><AlertCircle /></span>
        <h1 className="ad-state__title">Unable to load appointment</h1>
        <p className="ad-state__hint">{message}</p>
        <button type="button" className="ad-btn ad-btn--primary" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          <span>Back to appointments</span>
        </button>
      </div>
    </div>
  );
}

export function EditBar({ isSaving, onCancel, onSave }: { isSaving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="ad-editbar">
      <div className="ad-editbar__inner">
        <button type="button" className="ad-btn ad-btn--ghost" onClick={onCancel}>
          <X aria-hidden="true" />
          <span>Cancel</span>
        </button>
        <button type="button" className="ad-btn ad-btn--primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="ad-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
