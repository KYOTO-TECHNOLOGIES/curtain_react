import React from 'react';
import { Download, Calendar, ChevronRight } from 'lucide-react';
import './AppointmentHeader.css';

interface AppointmentHeaderProps {
  onExport?: () => void;
  onSchedule: () => void;
}

export const AppointmentHeader: React.FC<AppointmentHeaderProps> = ({
  onExport,
  onSchedule,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title & Breadcrumb Block */}
      <div className="flex flex-col gap-1.5">
        <h1
          className="header-stagger-item header-stagger-1 text-[32px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.1]"
        >
          Appointment Management
        </h1>

        <nav
          aria-label="Breadcrumb"
          className="header-stagger-item header-stagger-2 flex items-center gap-1.5 text-[13px] text-slate-500"
        >
          <a
            href="/"
            className="cm-breadcrumb-link"
            onClick={(e) => {
              // Soft link behavior if standard navigation
              if (!e.metaKey && !e.ctrlKey) {
                // Allows staying in app or link navigation
              }
            }}
          >
            Curtain Master.
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#2F5D8F]">
            Appointment List View
          </span>
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="header-stagger-item header-stagger-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          className="btn-export-list"
          title="Export appointments to CSV/Excel"
        >
          <Download className="export-icon" strokeWidth={2.2} />
          <span className="hidden sm:inline">Export List</span>
        </button>

        <button
          type="button"
          onClick={onSchedule}
          className="btn-schedule-primary"
        >
          <Calendar className="schedule-icon" strokeWidth={2.2} />
          <span className="hidden sm:inline">Schedule New Appointment</span>
          <span className="sm:hidden">Schedule</span>
        </button>
      </div>
    </header>
  );
};

export default AppointmentHeader;
