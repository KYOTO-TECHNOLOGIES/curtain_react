import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, Ref } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronDown, Search, UserPlus, X, Check } from 'lucide-react';
import './StaffAssignmentPicker.css';

export interface StaffAssignmentOption {
  value: string;
  label?: string;
  name?: string;
  email?: string;
  role?: string;
  count?: number;
}

interface StaffAssignmentChangeEvent {
  target: { name: string; value: string; type: string };
  type: 'change' | 'blur';
}

interface StaffAssignmentPickerProps {
  id: string;
  label: string;
  value: string;
  options: StaffAssignmentOption[];
  onChange: (event: StaffAssignmentChangeEvent) => void;
  onBlur?: (event: StaffAssignmentChangeEvent) => void;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  allowUnassigned?: boolean;
}

function getNameAndEmail(option: StaffAssignmentOption) {
  if (option.name !== undefined || option.email !== undefined) {
    return { name: option.name || option.email || 'Unknown', email: option.email || '' };
  }
  const label = option.label || '';
  const parsed = label.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  return parsed
    ? { name: parsed[1].trim() || 'Unknown', email: parsed[2].trim() }
    : { name: label || 'Unknown', email: '' };
}

function getInitials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const value = query.trim();
  if (!value) return <>{text}</>;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    <>
      {text.split(new RegExp(`(${escaped})`, 'ig')).map((part, index) =>
        part.toLowerCase() === value.toLowerCase()
          ? <mark className="staff-picker__match" key={`${part}-${index}`}>{part}</mark>
          : part
      )}
    </>
  );
}

export function StaffAssignmentPicker({
  id,
  label,
  value,
  options,
  onChange,
  onBlur,
  name = '',
  inputRef,
  required = false,
  optional = false,
  disabled = false,
  error,
  placeholder = 'Select a staff member...',
  allowUnassigned = false,
}: StaffAssignmentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const listboxId = `${id}-${generatedId}-listbox`;
  const errorId = `${id}-${generatedId}-error`;
  const isSearchable = options.length > 6;
  const selectedOption = options.find((option) => option.value === value);
  const selectedDetails = selectedOption ? getNameAndEmail(selectedOption) : null;
  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      const { name: staffName, email } = getNameAndEmail(option);
      return staffName.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    });
  }, [options, searchTerm]);
  const hasUnassigned = allowUnassigned;
  const optionCount = filteredOptions.length + (hasUnassigned ? 1 : 0);
  const activeOption = hasUnassigned
    ? activeIndex === 0 ? null : filteredOptions[activeIndex - 1]
    : filteredOptions[activeIndex];

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (window.innerWidth < 640) {
      setPopoverStyle({});
      return;
    }
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 16);
    const rowsHeight = filteredOptions.length * 52 + (hasUnassigned ? 64 : 0);
    const desiredHeight = Math.min(rowsHeight + (isSearchable ? 50 : 12), 320);
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const placement = below < desiredHeight && above > below ? 'top' : 'bottom';
    const available = Math.max(120, placement === 'top' ? above : below);
    const height = Math.min(desiredHeight, available, 320);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = placement === 'top' ? rect.top - height - 8 : rect.bottom + 8;
    setPopoverStyle({
      top: `${Math.max(8, top)}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${height}px`,
      transformOrigin: `${Math.max(0, Math.min(100, ((rect.left + rect.width / 2 - left) / width) * 100))}% ${placement === 'top' ? '100%' : '0%'}`,
    });
  };

  const emitBlur = () => onBlur?.({ target: { name, value, type: 'hidden' }, type: 'blur' });

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

  const openMenu = () => {
    if (disabled) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(hasUnassigned ? (selectedIndex >= 0 ? selectedIndex + 1 : 0) : Math.max(0, selectedIndex));
    setSearchTerm('');
    setIsClosing(false);
    setIsRendered(true);
    setIsOpen(true);
  };

  const selectValue = (nextValue: string) => {
    onChange({ target: { name, value: nextValue, type: 'hidden' }, type: 'change' });
    emitBlur();
    closeMenu(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    requestAnimationFrame(() => {
      if (isSearchable) searchInputRef.current?.focus();
      else listboxRef.current?.focus();
    });
    const handleResizeOrScroll = () => updatePosition();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [filteredOptions.length]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      emitBlur();
      closeMenu();
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [isOpen, value, onBlur]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (isSearchable && event.key === 'ArrowDown' && document.activeElement === searchInputRef.current) {
      event.preventDefault();
      listboxRef.current?.focus();
      setActiveIndex(0);
      return;
    }
    if (document.activeElement === searchInputRef.current && event.key !== 'Tab') return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (optionCount === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + optionCount) % optionCount);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : optionCount - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (hasUnassigned && activeIndex === 0) selectValue('');
      else if (activeOption) selectValue(activeOption.value);
    } else if (!isSearchable && event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key)) {
      typeaheadRef.current += event.key.toLowerCase();
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ''; }, 500);
      const match = filteredOptions.findIndex((option) =>
        getNameAndEmail(option).name.toLowerCase().startsWith(typeaheadRef.current)
      );
      if (match >= 0) setActiveIndex(match + (hasUnassigned ? 1 : 0));
    }
  };

  const renderStaffRow = (option: StaffAssignmentOption, index: number) => {
    const { name: staffName, email } = getNameAndEmail(option);
    const selected = option.value === value;
    const active = index === activeIndex;
    return (
      <div
        key={option.value}
        id={`${listboxId}-option-${index + (hasUnassigned ? 1 : 0)}`}
        className={`staff-picker__option ${selected ? 'is-selected' : ''} ${active ? 'is-highlighted' : ''}`}
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActiveIndex(index + (hasUnassigned ? 1 : 0))}
        onClick={() => selectValue(option.value)}
        style={{ '--staff-option-index': Math.min(index, 9) } as CSSProperties}
      >
        <span className="staff-picker__avatar staff-picker__avatar--row" aria-hidden="true">{getInitials(staffName)}</span>
        <span className="staff-picker__copy">
          <span className="staff-picker__name">
            <HighlightedText text={staffName} query={searchTerm} />
            {option.role && <span className="staff-picker__role">{option.role}</span>}
          </span>
          {email && <span className="staff-picker__email" title={email}><HighlightedText text={email} query={searchTerm} /></span>}
        </span>
        {typeof option.count === 'number' && <span className="staff-picker__count">{option.count}</span>}
        {selected && <Check className="staff-picker__check" aria-hidden="true" />}
      </div>
    );
  };

  const popover = isRendered && createPortal(
    <div className="staff-picker__portal">
      <div className="staff-picker__backdrop" aria-hidden="true" onClick={() => { emitBlur(); closeMenu(); }} />
      <div
        ref={popoverRef}
        className={`staff-picker__popover ${isClosing ? 'is-closing' : ''}`}
        style={popoverStyle}
        onKeyDown={handleKeyDown}
      >
        <div className="staff-picker__mobile-heading">
          <span className="staff-picker__drag-handle" aria-hidden="true" />
          <span>{label}</span>
        </div>
        {isSearchable && (
          <div className="staff-picker__search-wrap">
            <Search className="staff-picker__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="staff-picker__search"
              placeholder="Search by name or email"
              value={searchTerm}
              aria-label="Search by name or email"
              onKeyDown={handleKeyDown}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setActiveIndex(0);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="staff-picker__search-clear"
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
          className="staff-picker__options"
          role="listbox"
          id={listboxId}
          aria-label={label}
          aria-activedescendant={activeOption ? `${listboxId}-option-${activeIndex}` : hasUnassigned && activeIndex === 0 ? `${listboxId}-unassigned` : undefined}
          tabIndex={-1}
        >
          {hasUnassigned && (
            <>
              <div
                id={`${listboxId}-unassigned`}
                className={`staff-picker__option staff-picker__unassigned ${value === '' ? 'is-selected' : ''} ${activeIndex === 0 ? 'is-highlighted' : ''}`}
                role="option"
                aria-selected={value === ''}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => selectValue('')}
              >
                <span className="staff-picker__unassigned-icon"><UserPlus aria-hidden="true" /></span>
                <span className="staff-picker__copy">
                  <span className="staff-picker__name">Unassigned</span>
                  <span className="staff-picker__email">No one assigned yet</span>
                </span>
                {value === '' && <Check className="staff-picker__check" aria-hidden="true" />}
              </div>
              <div className="staff-picker__divider" aria-hidden="true" />
            </>
          )}
          {filteredOptions.length === 0 && options.length > 0 ? (
            <div className="staff-picker__empty">
              <span className="staff-picker__empty-icon"><Search aria-hidden="true" /></span>
              <strong>No matching staff</strong>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map(renderStaffRow)
          ) : (
            <p className="staff-picker__no-staff">No staff available</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`staff-picker ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${error ? 'is-invalid' : ''}`}>
      <div className="staff-picker__label-row">
        <label htmlFor={id} className="staff-picker__label">
          {label}{required && <span className="staff-picker__required"> *</span>}
        </label>
        {optional && <span className="staff-picker__optional">Optional</span>}
      </div>
      <div className="staff-picker__control">
        <input type="hidden" name={name || undefined} value={value} ref={inputRef} readOnly />
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className="staff-picker__trigger"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onClick={() => isOpen ? closeMenu() : openMenu()}
          onBlur={() => {
            if (!isOpen) emitBlur();
          }}
          onKeyDown={(event) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
              event.preventDefault();
              if (!isOpen) openMenu();
            }
          }}
        >
          {selectedDetails ? (
            <span className="staff-picker__selected" key={value}>
              <span className="staff-picker__avatar" aria-hidden="true">{getInitials(selectedDetails.name)}</span>
              <span className="staff-picker__selected-copy">
                <span className="staff-picker__selected-name" title={selectedDetails.name}>{selectedDetails.name}</span>
                {selectedDetails.email && <span className="staff-picker__selected-email" title={selectedDetails.email}>{selectedDetails.email}</span>}
              </span>
            </span>
          ) : (
            <span className={`staff-picker__placeholder ${allowUnassigned && value === '' ? 'is-unassigned' : ''}`}>
              <span className="staff-picker__unassigned-icon"><UserPlus aria-hidden="true" /></span>
              {allowUnassigned && value === '' ? 'Unassigned' : placeholder}
            </span>
          )}
          {!disabled && <ChevronDown className="staff-picker__chevron" aria-hidden="true" />}
        </button>
      </div>
      {error && <span className="staff-picker__error" id={errorId}><AlertCircle aria-hidden="true" />{error}</span>}
      {popover}
    </div>
  );
}
