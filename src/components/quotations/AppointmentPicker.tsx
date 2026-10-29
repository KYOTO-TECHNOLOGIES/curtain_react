import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CalendarPlus, Check, ChevronDown, Search, X } from 'lucide-react';
import type { AppointmentListItem } from '../../types';
import './AppointmentPicker.css';

interface AppointmentPickerProps {
  id: string;
  value: string;
  appointments: AppointmentListItem[];
  onChange: (event: { target: { name: string; value: string } }) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

function formatAppointmentId(id: AppointmentListItem['id']) {
  const value = String(id).replace(/^#/, '');
  return /^APT-/i.test(value) ? value : `APT-${value}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatAppointmentDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#2F5D8F',
  quoted: '#009688',
  rescheduled: '#8B5CF6',
  cancelled: '#EF4444',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return <>{text}</>;

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'ig'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase()
          ? <mark className="appointment-picker__match" key={`${part}-${index}`}>{part}</mark>
          : part
      )}
    </>
  );
}

export function AppointmentPicker({
  id,
  value,
  appointments,
  onChange,
  label = 'Choose Appointment',
  required = false,
  disabled = false,
  error,
}: AppointmentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const listboxId = `${id}-${generatedId}-listbox`;
  const errorId = `${id}-${generatedId}-error`;
  const isSearchable = appointments.length > 6;

  const selectedAppointment = appointments.find((appointment) => String(appointment.id) === value);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((appointment) => (
      `#${formatAppointmentId(appointment.id)}`.toLowerCase().includes(query)
      || (appointment.customer_name || 'Unknown').toLowerCase().includes(query)
    ));
  }, [appointments, searchTerm]);

  const focusInitialControl = () => {
    requestAnimationFrame(() => {
      if (isSearchable) searchInputRef.current?.focus();
      else listboxRef.current?.focus();
    });
  };

  const openMenu = () => {
    if (disabled) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const selectedIndex = appointments.findIndex((appointment) => String(appointment.id) === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setSearchTerm('');
    setIsClosing(false);
    setIsRendered(true);
    setIsOpen(true);
  };

  const closeMenu = (returnFocus = false) => {
    setIsOpen(false);
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
    }, 110);
    if (returnFocus) triggerRef.current?.focus();
  };

  const chooseAppointment = (appointment: AppointmentListItem) => {
    onChange({ target: { name: '', value: String(appointment.id) } });
    closeMenu(true);
  };

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (window.innerWidth < 640) {
      setPopoverStyle({});
      return;
    }
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 16);
    const hasSearch = appointments.length > 6;
    const desiredHeight = appointments.length === 0 || filteredAppointments.length === 0
      ? 180
      : Math.min(filteredAppointments.length * 52 + (hasSearch ? 56 : 12) + 12, 320);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const placement = spaceBelow < desiredHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const availableHeight = Math.max(120, placement === 'top' ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(desiredHeight, availableHeight, 320);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    left = Math.max(8, left);
    const top = placement === 'top' ? rect.top - maxHeight - 8 : rect.bottom + 8;
    setPopoverStyle({
      top: `${Math.max(8, top)}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      transformOrigin: `${Math.min(100, Math.max(0, ((rect.left + rect.width / 2 - left) / width) * 100))}% ${placement === 'top' ? '100%' : '0%'}`,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    focusInitialControl();
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      closeMenu(false);
    };
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleDocumentKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleDocumentKeyDown, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isSearchable) return;
    const selectedIndex = filteredAppointments.findIndex((appointment) => String(appointment.id) === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, isSearchable, filteredAppointments, value]);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [filteredAppointments.length]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (event.key === 'Tab') {
      closeMenu(false);
      return;
    }
    if (isSearchable && event.key === 'ArrowDown' && document.activeElement === searchInputRef.current) {
      event.preventDefault();
      listboxRef.current?.focus();
      setHighlightedIndex(filteredAppointments.length ? 0 : -1);
      return;
    }
    if (document.activeElement === searchInputRef.current) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredAppointments.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((previous) => (previous + direction + filteredAppointments.length) % filteredAppointments.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(event.key === 'Home' ? 0 : filteredAppointments.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const appointment = filteredAppointments[highlightedIndex];
      if (appointment) chooseAppointment(appointment);
    } else if (!isSearchable && event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key)) {
      typeaheadRef.current += event.key.toLowerCase();
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ''; }, 500);
      const matchIndex = filteredAppointments.findIndex((appointment) =>
        (appointment.customer_name || 'Unknown').toLowerCase().startsWith(typeaheadRef.current)
      );
      if (matchIndex >= 0) setHighlightedIndex(matchIndex);
    }
  };

  const renderAppointment = (appointment: AppointmentListItem, index: number) => {
    const appointmentId = formatAppointmentId(appointment.id);
    const customerName = appointment.customer_name || 'Unknown';
    const date = formatAppointmentDate(appointment.appointment_date);
    const status = appointment.status;
    const isSelected = String(appointment.id) === value;
    const isHighlighted = index === highlightedIndex;

    return (
      <div
        key={String(appointment.id)}
        id={`${listboxId}-option-${index}`}
        className={`appointment-picker__option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
        role="option"
        aria-selected={isSelected}
        onMouseEnter={() => setHighlightedIndex(index)}
        onClick={() => chooseAppointment(appointment)}
        style={{ '--option-index': Math.min(index, 9) } as CSSProperties}
      >
        <span className="appointment-picker__avatar appointment-picker__avatar--row" aria-hidden="true">
          {getInitials(customerName)}
        </span>
        <span className="appointment-picker__option-copy">
          <span className="appointment-picker__customer">
            <HighlightedText text={customerName} query={searchTerm} />
          </span>
          <span className="appointment-picker__metadata">
            <span className="appointment-picker__id">#<HighlightedText text={appointmentId} query={searchTerm} /></span>
            {date && <><span className="appointment-picker__separator" aria-hidden="true" /><span>{date}</span></>}
            {status && (
              <>
                {(date || appointmentId) && <span className="appointment-picker__separator" aria-hidden="true" />}
                <span className="appointment-picker__status">
                  <span className="appointment-picker__status-dot" style={{ backgroundColor: STATUS_COLORS[status] || '#64748B' }} />
                  {formatStatus(status)}
                </span>
              </>
            )}
          </span>
        </span>
        {isSelected && <Check className="appointment-picker__check" aria-hidden="true" />}
      </div>
    );
  };

  const popover = isRendered && createPortal(
    <div className="appointment-picker__portal">
      <div className="appointment-picker__backdrop" aria-hidden="true" onClick={() => closeMenu(false)} />
      <div
        ref={popoverRef}
        className={`appointment-picker__popover ${isClosing ? 'is-closing' : ''}`}
        style={popoverStyle}
        onKeyDown={handleKeyDown}
      >
        <div className="appointment-picker__mobile-heading">
          <span className="appointment-picker__drag-handle" aria-hidden="true" />
          <span>{label}</span>
        </div>
        {isSearchable && (
          <div className="appointment-picker__search-wrap">
            <Search className="appointment-picker__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              className="appointment-picker__search"
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search by ID or customer"
              aria-label="Search appointments by ID or customer"
            />
            {searchTerm && (
              <button
                type="button"
                className="appointment-picker__search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div
          ref={listboxRef}
          className="appointment-picker__options"
          role="listbox"
          id={listboxId}
          aria-label={label}
          aria-activedescendant={filteredAppointments[highlightedIndex] ? `${listboxId}-option-${highlightedIndex}` : undefined}
          tabIndex={-1}
        >
          {appointments.length === 0 ? (
            <div className="appointment-picker__empty">
              <span className="appointment-picker__empty-icon"><CalendarPlus aria-hidden="true" /></span>
              <strong>No appointments available</strong>
              <span>There are no appointments to choose from.</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="appointment-picker__empty appointment-picker__empty--search">
              <span className="appointment-picker__empty-icon"><Search aria-hidden="true" /></span>
              <strong>No matching appointments</strong>
            </div>
          ) : (
            filteredAppointments.map(renderAppointment)
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`appointment-picker ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${error ? 'is-invalid' : ''}`}>
      <label className="appointment-picker__label" htmlFor={id}>
        {label}{required && <span className="appointment-picker__required" aria-hidden="true"> *</span>}
      </label>
      <div className="appointment-picker__control">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className="appointment-picker__trigger"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onClick={() => isOpen ? closeMenu() : openMenu()}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isOpen) {
              event.preventDefault();
              event.stopPropagation();
              closeMenu(true);
              return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (!isOpen) openMenu();
            }
          }}
        >
          {selectedAppointment ? (
            <span className="appointment-picker__selected" key={String(selectedAppointment.id)}>
              <span className="appointment-picker__avatar" aria-hidden="true">{getInitials(selectedAppointment.customer_name || 'Unknown')}</span>
              <span className="appointment-picker__selected-id">{formatAppointmentId(selectedAppointment.id)}</span>
              <span className="appointment-picker__selected-name" title={selectedAppointment.customer_name || 'Unknown'}>
                {selectedAppointment.customer_name || 'Unknown'}
              </span>
            </span>
          ) : (
            <span className="appointment-picker__placeholder">
              <span className="appointment-picker__placeholder-icon"><CalendarPlus aria-hidden="true" /></span>
              <span>Select an appointment</span>
            </span>
          )}
          {!disabled && <ChevronDown className="appointment-picker__chevron" aria-hidden="true" />}
        </button>
        {selectedAppointment && !required && !disabled && (
          <button
            type="button"
            className="appointment-picker__clear"
            aria-label="Clear selected appointment"
            onClick={(event) => {
              event.stopPropagation();
              onChange({ target: { name: '', value: '' } });
              if (isOpen) closeMenu();
            }}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <span className="appointment-picker__error" id={errorId}>
          <AlertCircle aria-hidden="true" />
          {error}
        </span>
      )}
      {popover}
    </div>
  );
}
