import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthYearPanelProps {
  displayedMonth: Date;
  selectedDate: Date | null;
  today: Date;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onDone: () => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthYearPanel({
  displayedMonth,
  selectedDate,
  today,
  onSelectMonth,
  onSelectYear,
  onDone,
}: MonthYearPanelProps) {
  const [showYears, setShowYears] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor(displayedMonth.getFullYear() / 12) * 12);
  const year = displayedMonth.getFullYear();
  const yearOptions = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  const handleSelectYear = (nextYear: number) => {
    onSelectYear(nextYear);
    setShowYears(false);
  };

  return (
    <div className="date-month-year-panel">
      <div className="date-month-year-toolbar">
        <button
          type="button"
          className="date-calendar-nav-button"
          aria-label={showYears ? 'Previous 12 years' : 'Previous year'}
          onClick={() => showYears ? setYearPageStart((start) => start - 12) : onSelectYear(year - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className="date-year-switch-button"
          aria-label={showYears ? 'Show months' : 'Choose year'}
          onClick={() => {
            if (showYears) setShowYears(false);
            else {
              setYearPageStart(Math.floor(year / 12) * 12);
              setShowYears(true);
            }
          }}
        >
          {showYears ? `${yearPageStart}–${yearPageStart + 11}` : year}
        </button>
        <button
          type="button"
          className="date-calendar-nav-button"
          aria-label={showYears ? 'Next 12 years' : 'Next year'}
          onClick={() => showYears ? setYearPageStart((start) => start + 12) : onSelectYear(year + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {showYears ? (
        <div className="date-period-grid date-year-grid">
          {yearOptions.map((optionYear) => {
            const isSelected = optionYear === (selectedDate?.getFullYear() ?? year);
            const isCurrent = optionYear === today.getFullYear();
            return (
              <button
                type="button"
                key={optionYear}
                className={`date-period-button ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-current' : ''}`}
                aria-pressed={isSelected}
                onClick={() => handleSelectYear(optionYear)}
              >
                {optionYear}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="date-period-grid date-month-grid">
          {monthNames.map((month, monthIndex) => {
            const isSelected = monthIndex === (selectedDate?.getMonth() ?? -1)
              && year === selectedDate?.getFullYear();
            const isCurrent = monthIndex === today.getMonth() && year === today.getFullYear();
            return (
              <button
                type="button"
                key={month}
                className={`date-period-button ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-current' : ''}`}
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectMonth(monthIndex);
                  onDone();
                }}
              >
                {month}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}