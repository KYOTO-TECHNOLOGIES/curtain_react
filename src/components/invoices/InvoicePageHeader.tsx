import React from 'react';
import { Download, Plus, ChevronRight } from 'lucide-react';
import '../appointments/AppointmentHeader.css';

interface InvoicePageHeaderProps {
  onExport?: () => void;
  onGenerateInvoice: () => void;
}

export const InvoicePageHeader: React.FC<InvoicePageHeaderProps> = ({
  onExport,
  onGenerateInvoice,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title & Breadcrumb Block */}
      <div className="flex flex-col gap-1.5">
        <h1 className="header-stagger-item header-stagger-1 text-[32px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.1]">
          Invoice Management
        </h1>

        <nav
          aria-label="Breadcrumb"
          className="header-stagger-item header-stagger-2 flex items-center gap-1.5 text-[13px] text-slate-500"
        >
          <a
            href="/"
            className="cm-breadcrumb-link"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                // soft navigation
              }
            }}
          >
            Curtain Master.
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#2F5D8F]">
            Invoice List View
          </span>
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="header-stagger-item header-stagger-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          className="btn-export-list"
          title="Export invoices to CSV/Excel"
        >
          <Download className="export-icon" strokeWidth={2.2} />
          <span className="hidden sm:inline">Export List</span>
        </button>

        <button
          type="button"
          onClick={onGenerateInvoice}
          className="btn-schedule-primary"
        >
          <Plus className="schedule-icon" strokeWidth={2.5} />
          <span className="hidden sm:inline">Generate Invoice</span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>
    </header>
  );
};

export default InvoicePageHeader;
