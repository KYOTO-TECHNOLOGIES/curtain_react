import { useMemo } from 'react';
import { formatISODate, sameDay, type CalendarDay } from './useCalendar';

interface CalendarGridProps {
  days: CalendarDay[];
  displayedMonth: Date;
  selectedDate: Date | null;
  focusedDate: Date;
  today: Date;
  minDate: Date | null;
  maxDate: Date | null;
  weekStartsOn: number;
  animateRows: boolean;
  onFocusDate: (date: Date) => void;
  onSelect: (date: Date) => void;
}

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CalendarGrid({
  days,
  displayedMonth,
  selectedDate,
  focusedDate,
  today,
  minDate,
  maxDate,
  weekStartsOn,
  animateRows,
  onFocusDate,
  onSelect,
}: CalendarGridProps) {
  const weekdayLabels = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const dayIndex = (weekStartsOn + index) % 7;
    return { short: weekdayNames[dayIndex].slice(0, 2), full: weekdayNames[dayIndex] };
  }), [weekStartsOn]);
  const selectedIndex = days.findIndex(({ date }) => sameDay(selectedDate, date));
  const selectedRow = Math.floor(selectedIndex / 7);
  const selectedColumn = selectedIndex % 7;

  return (
    <div className="date-calendar-grid" role="grid" aria-label="Calendar dates">
      <div className="date-weekday-row" role="row">
        {weekdayLabels.map((day, index) => (
          <div className="date-weekday" role="columnheader" key={`${day.full}-${index}`}>
            <abbr title={day.full}>{day.short}</abbr>
          </div>
        ))}
      </div>
      <div className="date-grid-days" data-animate-rows={animateRows || undefined}>
        {selectedIndex >= 0 && (
          <span
            className="date-selection-highlight"
            style={{ gridColumn: selectedColumn + 1, gridRow: selectedRow + 1 }}
            aria-hidden="true"
          />
        )}
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div className="date-calendar-row" role="row" key={rowIndex}>
            {days.slice(rowIndex * 7, rowIndex * 7 + 7).map(({ date, inCurrentMonth }, columnIndex) => {
              const isSelected = sameDay(selectedDate, date);
              const isToday = sameDay(today, date);
              const isDisabled = Boolean(
                (minDate && date < minDate) || (maxDate && date > maxDate)
              );
              const isoDate = formatISODate(date);
              const fullLabel = date.toLocaleDateString('en-US', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              });
              return (
                <div
                  className="date-calendar-cell"
                  role="gridcell"
                  aria-selected={isSelected}
                  key={isoDate}
                  style={{ gridColumn: columnIndex + 1, gridRow: rowIndex + 1, '--row-delay': `${rowIndex * 20}ms` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className={`date-day-button ${!inCurrentMonth ? 'is-outside-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    aria-label={fullLabel}
                    aria-selected={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    tabIndex={sameDay(focusedDate, date) && !isDisabled ? 0 : -1}
                    disabled={isDisabled}
                    onFocus={() => onFocusDate(date)}
                    onClick={() => onSelect(date)}
                  >
                    <span>{date.getDate()}</span>
                    {isToday && !isSelected && <span className="date-today-dot" aria-hidden="true" />}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>
    </div>
  );
}