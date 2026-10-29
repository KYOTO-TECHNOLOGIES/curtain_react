import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type ChangeEvent,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CalendarGrid } from './CalendarGrid';
import { MonthYearPanel } from './MonthYearPanel';
import { formatISODate, parseISODate, startOfDay, useCalendar } from './useCalendar';
import './DatePicker.css';

export interface DatePickerChangeEvent {
  target: { name: string; value: string; type: 'date' };
}

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'> {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  min?: string | number;
  max?: string | number;
  weekStartsOn?: number;
}

function shiftMonth(date: Date, months: number): Date {
  const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker({
  value,
  onChange,
  name = '',
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  readOnly = false,
  required = false,
  weekStartsOn = 0,
  className = '',
  id,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  ...inputAttributes
}, forwardedRef) {
  const generatedId = useId();
  const pickerId = id || generatedId;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOpenedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'sheet'>('bottom');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [showPeriodPanel, setShowPeriodPanel] = useState(false);
  const [animateRows, setAnimateRows] = useState(false);
  const [focusedDate, setFocusedDate] = useState(() => parseISODate(value) || startOfDay(new Date()));
  const calendar = useCalendar(value, weekStartsOn);
  const today = startOfDay(new Date());
  const minDate = parseISODate(typeof min === 'string' ? min : undefined);
  const maxDate = parseISODate(typeof max === 'string' ? max : undefined);
  const isDisabled = disabled || readOnly;
  const selectedDate = calendar.selectedDate;
  const displayValue = selectedDate?.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const assignNativeRef = useCallback((element: HTMLInputElement | null) => {
    nativeInputRef.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }, [forwardedRef]);

  const emitChange = useCallback((nextValue: string) => {
    if (nativeInputRef.current) nativeInputRef.current.value = nextValue;
    onChange({ target: { name, value: nextValue, type: 'date' } } as unknown as ChangeEvent<HTMLInputElement>);
  }, [name, onChange]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    if (window.innerWidth < 480) {
      setPlacement('sheet');
      setPopoverStyle({});
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const bounds = popover.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom - 8;
    const roomAbove = rect.top - 8;
    const opensAbove = bounds.height > roomBelow && roomAbove > roomBelow;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - bounds.width - 8));
    const top = opensAbove ? rect.top - bounds.height - 8 : rect.bottom + 8;
    setPlacement(opensAbove ? 'top' : 'bottom');
    setPopoverStyle({ top, left, width: Math.min(300, window.innerWidth - 16) });
  }, []);

  const openPicker = () => {
    if (isDisabled) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    let initialFocus = selectedDate || today;
    if (minDate && initialFocus < minDate) initialFocus = minDate;
    if (maxDate && initialFocus > maxDate) initialFocus = maxDate;
    setFocusedDate(initialFocus);
    calendar.goToDate(initialFocus);
    setShowPeriodPanel(false);
    const animateFirstOpen = !hasOpenedRef.current;
    setAnimateRows(animateFirstOpen);
    hasOpenedRef.current = true;
    if (rowAnimationTimerRef.current) clearTimeout(rowAnimationTimerRef.current);
    if (animateFirstOpen) {
      rowAnimationTimerRef.current = setTimeout(() => setAnimateRows(false), 300);
    }
    setIsClosing(false);
    setIsRendered(true);
    setIsOpen(true);
  };

  const closePicker = useCallback((returnFocus = true) => {
    setIsOpen(false);
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      setShowPeriodPanel(false);
    }, 110);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const selectDate = useCallback((date: Date) => {
    const nextValue = formatISODate(date);
    calendar.goToDate(date);
    setFocusedDate(date);
    emitChange(nextValue);
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => closePicker(), 120);
  }, [calendar, closePicker, emitChange]);

  useLayoutEffect(() => {
    if (!isRendered) return;
    updatePosition();
    const onViewportChange = () => updatePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isRendered, updatePosition, calendar.displayedMonth, showPeriodPanel]);

  useEffect(() => {
    if (!isOpen || showPeriodPanel) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`${pickerId}-day-${formatISODate(focusedDate)}`)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, showPeriodPanel, focusedDate, pickerId, calendar.displayedMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      closePicker(false);
    };
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closePicker(true);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onPointerDown as EventListener, true);
    document.addEventListener('keydown', onDocumentKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onPointerDown as EventListener, true);
      document.removeEventListener('keydown', onDocumentKeyDown, true);
    };
  }, [isOpen, closePicker]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    if (rowAnimationTimerRef.current) clearTimeout(rowAnimationTimerRef.current);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePicker();
      return;
    }
    if (showPeriodPanel) return;
    const current = focusedDate;
    let nextDate: Date | null = null;
    switch (event.key) {
      case 'ArrowLeft': nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1); break;
      case 'ArrowRight': nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1); break;
      case 'ArrowUp': nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7); break;
      case 'ArrowDown': nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7); break;
      case 'Home': {
        const offset = (current.getDay() - weekStartsOn + 7) % 7;
        nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() - offset);
        break;
      }
      case 'End': {
        const offset = (current.getDay() - weekStartsOn + 7) % 7;
        nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6 - offset);
        break;
      }
      case 'PageUp': nextDate = shiftMonth(current, event.shiftKey ? -12 : -1); break;
      case 'PageDown': nextDate = shiftMonth(current, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    setFocusedDate(nextDate);
    calendar.goToDate(nextDate);
  };

  const todayDisabled = Boolean((minDate && today < minDate) || (maxDate && today > maxDate));
  const classes = ['date-picker', value && !required ? 'has-clear' : '', className].filter(Boolean).join(' ');
  const triggerLabel = `${ariaLabel ? `${ariaLabel}, ` : 'Choose date'}${displayValue ? `, ${displayValue}` : ''}`;

  return (
    <div className={classes}>
      <input
        {...inputAttributes}
        ref={assignNativeRef}
        id={`${pickerId}-native`}
        type="date"
        name={name}
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={isDisabled}
        onChange={() => undefined}
        onBlur={onBlur as FocusEventHandler<HTMLInputElement> | undefined}
        tabIndex={-1}
        aria-hidden="true"
        className="date-picker-native-input"
      />
      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        className={`date-picker-trigger ${isOpen ? 'is-open' : ''} ${ariaInvalid ? 'is-invalid' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${pickerId}-dialog`}
        aria-label={triggerLabel}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => isOpen ? closePicker(false) : openPicker()}
        onFocus={onFocus as FocusEventHandler<HTMLButtonElement> | undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            closePicker(true);
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
      >
        <CalendarDays className="date-picker-leading-icon" aria-hidden="true" />
        <span className={`date-picker-value ${displayValue ? '' : 'is-placeholder'}`}>
          {displayValue || placeholder}
        </span>
      </button>
      {value && !required && (
          <button
            type="button"
            className="date-picker-clear-button"
            aria-label="Clear date"
            onClick={(event) => {
              event.stopPropagation();
              emitChange('');
            }}
          >
            <X aria-hidden="true" />
          </button>
        )}

      {isRendered && createPortal(
        <>
          {placement === 'sheet' && (
            <button
              type="button"
              className="date-picker-backdrop"
              aria-label="Close date picker"
              onClick={() => closePicker()}
            />
          )}
          <div
            ref={popoverRef}
            id={`${pickerId}-dialog`}
            className={`date-picker-popover placement-${placement} ${isClosing ? 'is-closing' : ''}`}
            style={popoverStyle}
            role="dialog"
            aria-label="Choose date"
            onKeyDown={handleKeyDown}
          >
            {placement === 'sheet' && <span className="date-picker-drag-handle" aria-hidden="true" />}
            <div className="date-picker-header">
              <button
                type="button"
                className={`date-picker-month-button ${showPeriodPanel ? 'is-open' : ''}`}
                aria-expanded={showPeriodPanel}
                aria-label={`Choose month and year, ${calendar.monthLabel}`}
                aria-live="polite"
                onClick={() => setShowPeriodPanel((open) => !open)}
              >
                <span key={calendar.monthLabel}>{calendar.monthLabel}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              <div className="date-picker-navigation">
                <button type="button" className="date-calendar-nav-button" aria-label="Previous month" onClick={() => calendar.changeMonth(-1)}>
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button type="button" className="date-calendar-nav-button" aria-label="Next month" onClick={() => calendar.changeMonth(1)}>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={`date-picker-content ${showPeriodPanel ? 'showing-periods' : ''}`}>
              {showPeriodPanel ? (
                <MonthYearPanel
                  displayedMonth={calendar.displayedMonth}
                  selectedDate={selectedDate}
                  today={today}
                  onSelectMonth={calendar.selectMonth}
                  onSelectYear={calendar.selectYear}
                  onDone={() => setShowPeriodPanel(false)}
                />
              ) : (
                <div key={`${calendar.displayedMonth.getFullYear()}-${calendar.displayedMonth.getMonth()}`} className={`date-calendar-transition direction-${calendar.direction}`}>
                  <CalendarGrid
                    days={calendar.days}
                    displayedMonth={calendar.displayedMonth}
                    selectedDate={selectedDate}
                    focusedDate={focusedDate}
                    today={today}
                    minDate={minDate}
                    maxDate={maxDate}
                    weekStartsOn={weekStartsOn}
                    animateRows={animateRows}
                    onFocusDate={setFocusedDate}
                    onSelect={selectDate}
                  />
                </div>
              )}
            </div>

            <div className="date-picker-footer">
              <button
                type="button"
                className="date-picker-clear-action"
                hidden={required || !value}
                onClick={() => emitChange('')}
              >
                Clear
              </button>
              <button
                type="button"
                className="date-picker-today-action"
                aria-disabled={todayDisabled}
                onClick={() => {
                  if (!todayDisabled) selectDate(today);
                  else calendar.goToDate(today);
                }}
              >
                Today
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
});

export default DatePicker;
