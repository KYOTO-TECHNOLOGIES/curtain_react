import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import './SelectMenu.css';

export interface SelectOption {
  value: string;
  label: string;
  suffix?: string;
  dotColor?: string;
  textColor?: string;
  tintColor?: string;
  wrapLabel?: boolean;
  isDotCluster?: boolean;
  avatarText?: string;
  count?: number;
}

export interface SelectMenuProps {
  id?: string;
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'header';
  placement?: 'auto' | 'top-start';
  headerLabel?: string;
  headerActiveContent?: React.ReactNode;
  headerMaxPillWidth?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const SelectMenu: React.FC<SelectMenuProps> = ({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  ariaLabel,
  className = '',
  menuClassName = '',
  disabled = false,
  size = 'default',
  placement: preferredPlacement = 'auto',
  headerLabel = 'Status',
  headerActiveContent,
  headerMaxPillWidth,
  searchable,
  searchPlaceholder = 'Search...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const generatedId = useId();
  const selectId = id || generatedId;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const optionsListRef = useRef<HTMLUListElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsRendered(true);
    setIsClosing(false);
    setIsOpen(true);
  };

  const closeMenu = (returnFocus = false) => {
    setIsOpen(false);
    if ((size === 'sm' || size === 'header') && isRendered) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 110);
    } else {
      setIsRendered(false);
    }
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  // Detect mobile viewport (<640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < (size === 'header' ? 768 : 640));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [size]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || options[0];
  }, [options, value]);

  const isNonDefaultSelected = useMemo(() => {
    return Boolean(value && value !== '' && value !== 'all');
  }, [value]);

  // Show inline search if more than 6 options
  const isSearchable = searchable ?? (size === 'default' && options.length > 6);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  // Calculate popover position with collision-aware flipping
  const updatePosition = () => {
    if (!triggerRef.current || (isMobile && size === 'default')) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const minWidth = size === 'sm'
      ? Math.min(Math.max(rect.width, 140), window.innerWidth - 16)
      : Math.min(Math.max(rect.width, 220), window.innerWidth - 16);

    const maxPopoverHeight = size === 'sm' || (size === 'header' && isSearchable) ? 280 : 320;
    const estimatedHeight = Math.min(
      filteredOptions.length * 40 + (isSearchable ? 50 : 0) + (size === 'sm' ? 12 : 16),
      maxPopoverHeight
    );

    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const willOpenUp = preferredPlacement === 'top-start'
      ? spaceAbove >= estimatedHeight || spaceAbove >= spaceBelow
      : spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(0, willOpenUp ? spaceAbove : spaceBelow);
    const popoverHeight = Math.min(estimatedHeight, availableHeight);
    setPlacement(willOpenUp ? 'top' : 'bottom');

    const topPos = willOpenUp ? rect.top - popoverHeight - 8 : rect.bottom + 8;

    let leftPos = rect.left;
    if (leftPos + minWidth > window.innerWidth - 8) {
      leftPos = window.innerWidth - minWidth - 8;
    }
    if (leftPos < 8) leftPos = 8;

    setPopoverStyle({
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: `${minWidth}px`,
      maxHeight: `${popoverHeight}px`,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, filteredOptions.length, isMobile, size, preferredPlacement, isSearchable]);

  // Reset search and highlight on open/close
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);

      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (isSearchable && e.key === 'ArrowDown' && document.activeElement === searchInputRef.current) {
      e.preventDefault();
      const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
      const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
      setHighlightedIndex(nextIndex);
      (optionsListRef.current?.children[nextIndex] as HTMLElement | undefined)?.focus();
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      }
      case 'Home': {
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        // If typing in search, space should be typed normally
        if (e.key === ' ' && document.activeElement === searchInputRef.current) {
          return;
        }
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          closeMenu(true);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeMenu(true);
        break;
      }
      case 'Tab': {
        closeMenu();
        break;
      }
      default: {
        // First-letter jump if not typing in search
        if (!isSearchable && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          if (size === 'sm' && /\d/.test(e.key)) {
            typeaheadRef.current += e.key;
            if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
            typeaheadTimerRef.current = setTimeout(() => {
              typeaheadRef.current = '';
            }, 500);
          } else {
            typeaheadRef.current = e.key.toLowerCase();
          }
          const searchValue = typeaheadRef.current;
          const matchIdx = filteredOptions.findIndex((opt) =>
            opt.label.toLowerCase().startsWith(searchValue)
          );
          if (matchIdx !== -1) {
            setHighlightedIndex(matchIdx);
          }
        }
        break;
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Subtle tint on trigger when non-default is selected
  const getTriggerTintStyle = (): React.CSSProperties => {
    if (!isNonDefaultSelected || !selectedOption) return {};

    if (selectedOption.dotColor) {
      return {
        backgroundColor: `${selectedOption.dotColor}0D`, // ~5% tint
        borderColor: `${selectedOption.dotColor}44`,     // ~27% tint
      };
    }

    if (selectedOption.avatarText) {
      return {
        backgroundColor: 'rgba(47, 93, 143, 0.05)',
        borderColor: 'rgba(47, 93, 143, 0.28)',
      };
    }

    return {};
  };

  const renderIndicator = (option: SelectOption) => {
    if (option.isDotCluster) {
      return (
        <span className="dot-cluster" aria-hidden="true">
          <span className="dot-cluster-pip bg-[#2F5D8F]" />
          <span className="dot-cluster-pip bg-[#F97316]" />
          <span className="dot-cluster-pip bg-[#10B981]" />
          <span className="dot-cluster-pip bg-[#EF4444]" />
        </span>
      );
    }

    if (option.avatarText) {
      return (
        <span className="staff-avatar-chip" aria-hidden="true">
          {option.avatarText}
        </span>
      );
    }

    if (option.dotColor) {
      return (
        <span
          className="select-menu-option-dot"
          style={{ backgroundColor: option.dotColor }}
          aria-hidden="true"
        />
      );
    }

    return null;
  };

  // Options popover content
  const popoverContent = (
    <div
      ref={popoverRef}
      id={`${selectId}-popover`}
      className={`select-menu-popover ${size === 'sm' ? 'select-menu-popover--compact' : ''} ${size === 'header' ? 'select-menu-popover--header' : ''} ${menuClassName} placement-${placement} ${isClosing ? 'is-closing' : ''}`}
      style={popoverStyle}
      role="listbox"
      aria-label={ariaLabel || placeholder}
      aria-activedescendant={highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined}
      onKeyDown={handleKeyDown}
    >
      {isSearchable && (
        <div className="select-menu-search-wrapper select-menu-search-wrapper--sticky">
          <Search className="select-menu-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="select-menu-search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      <ul ref={optionsListRef} className="select-menu-options-list">
        {filteredOptions.length === 0 ? (
          <li className="px-3 py-2 text-xs text-slate-400 text-center">No options found</li>
        ) : (
          filteredOptions.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            // Option background when selected
            const selectedBg = isSelected
              ? opt.dotColor
                ? `${opt.dotColor}14`
                : 'rgba(47, 93, 143, 0.08)'
              : undefined;

            return (
              <li
                key={opt.value}
                id={`${selectId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSearchable && idx === highlightedIndex ? 0 : -1}
                className={`select-menu-option ${size === 'sm' ? 'select-menu-option--compact' : ''} ${size === 'header' ? 'select-menu-option--header' : ''} ${opt.wrapLabel ? 'select-menu-option--wrap' : ''} ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                style={
                  {
                    '--opt-idx': Math.min(idx, 10),
                    backgroundColor: size === 'sm' || size === 'header' ? undefined : selectedBg,
                  } as React.CSSProperties
                }
                onClick={() => {
                  onChange(opt.value);
                  closeMenu(true);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onKeyDown={handleKeyDown}
              >
                {size === 'sm' ? (
                  <span className={`select-menu-compact-dot ${isSelected ? 'is-selected' : ''}`} aria-hidden="true" />
                ) : renderIndicator(opt)}

                <span className={`truncate flex-1 ${opt.wrapLabel ? 'select-menu-option-label--wrap' : ''}`} title={opt.wrapLabel ? opt.label : undefined}>
                  {opt.label}
                  {size === 'sm' && opt.suffix && (
                    <span className="select-menu-option-suffix"> {opt.suffix}</span>
                  )}
                </span>

                {opt.count !== undefined && (size === 'sm' ? (
                  <span className={`select-menu-page-count ${isSelected ? 'is-selected' : ''}`}>
                    {opt.count} {opt.count === 1 ? 'page' : 'pages'}
                  </span>
                ) : (
                  <span className="select-menu-count-badge">{opt.count}</span>
                ))}

                {isSelected && (
                  <svg
                    className="select-menu-check-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline
                      className="select-menu-check-path"
                      points="20 6 9 17 4 12"
                    />
                  </svg>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  // Mobile Bottom Sheet Portal Content
  const mobileSheetContent = (
    <>
      <div
        className="select-menu-backdrop"
        onClick={() => closeMenu(true)}
        aria-hidden="true"
      />
      <div
        ref={popoverRef}
        id={`${selectId}-dialog`}
        className={`select-menu-bottom-sheet ${size === 'header' ? 'select-menu-bottom-sheet--header' : ''} ${menuClassName} ${isClosing ? 'is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || placeholder}
        onKeyDown={handleKeyDown}
      >
        <div className="select-menu-drag-handle" />
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800">
            {ariaLabel || placeholder}
          </span>
          <button
            type="button"
            onClick={() => closeMenu(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSearchable && (
          <div className="select-menu-search-wrapper select-menu-search-wrapper--sticky mb-3">
            <Search className="select-menu-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="select-menu-search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        <ul
          id={`${selectId}-popover`}
          className="select-menu-options-list flex-1 overflow-y-auto"
          role="listbox"
          aria-label={ariaLabel || placeholder}
          aria-activedescendant={highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined}
        >
          {filteredOptions.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                id={`${selectId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSearchable && idx === highlightedIndex ? 0 : -1}
                className={`select-menu-option ${size === 'header' ? 'select-menu-option--header' : ''} ${opt.wrapLabel ? 'select-menu-option--wrap' : ''} ${isSelected ? 'is-selected' : ''} ${idx === highlightedIndex ? 'is-highlighted' : ''}`}
                style={{
                  backgroundColor: isSelected && size !== 'header'
                    ? opt.dotColor
                      ? `${opt.dotColor}14`
                      : 'rgba(47, 93, 143, 0.08)'
                    : undefined,
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onKeyDown={handleKeyDown}
                onClick={() => {
                  onChange(opt.value);
                  closeMenu(true);
                }}
              >
                {renderIndicator(opt)}
                <span className={`truncate flex-1 ${opt.wrapLabel ? 'select-menu-option-label--wrap' : ''}`} title={opt.wrapLabel ? opt.label : undefined}>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="select-menu-count-badge">{opt.count}</span>
                )}
                {isSelected && (
                  <svg
                    className="select-menu-check-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline
                      className="select-menu-check-path"
                      points="20 6 9 17 4 12"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );

  return (
    <div className={`relative inline-block ${size === 'default' ? 'w-full' : ''} ${size === 'header' ? 'select-menu-header-root' : ''} ${className}`}>
      {size === 'header' ? (
        <div
          className={`select-menu-header-control ${selectedOption?.value ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
          style={{
            ...(selectedOption?.value ? {
              '--select-status-color': selectedOption.textColor || selectedOption.dotColor,
              '--select-status-tint': selectedOption.tintColor || '#EEF4FA',
              '--select-status-dot': selectedOption.dotColor,
            } : {}),
            ...(headerMaxPillWidth ? { '--column-filter-max-width': `${headerMaxPillWidth}px` } : {}),
          } as React.CSSProperties}
        >
          <button
            ref={triggerRef}
            id={selectId}
            type="button"
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${selectId}-popover`}
            aria-label={ariaLabel}
            aria-activedescendant={highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined}
            className="select-menu-header-trigger"
            onClick={() => isOpen ? closeMenu() : openMenu()}
            onKeyDown={handleKeyDown}
          >
            {selectedOption?.value ? (
              headerActiveContent || (
                <>
                  <span className="select-menu-header-dot" style={{ backgroundColor: selectedOption.dotColor }} aria-hidden="true" />
                  <span key={selectedOption.value} className="select-menu-header-value">{selectedOption.label}</span>
                </>
              )
            ) : (
              <>
                <span>{headerLabel}</span>
                <ChevronDown className="select-menu-header-chevron" aria-hidden="true" />
              </>
            )}
          </button>
          {selectedOption?.value && (
            <button
              type="button"
              className="select-menu-header-clear"
              aria-label={`Clear ${headerLabel.toLowerCase()} filter, currently ${selectedOption.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${selectId}-popover`}
          aria-label={ariaLabel}
          aria-activedescendant={highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined}
          className={`select-menu-trigger ${size === 'sm' ? 'select-menu-trigger--compact' : ''} ${isOpen ? 'is-open' : ''}`}
          style={getTriggerTintStyle()}
          onClick={() => isOpen ? closeMenu() : openMenu()}
          onKeyDown={handleKeyDown}
        >
        {size === 'sm' ? (
          <span key={selectedOption?.value} className="select-menu-compact-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        ) : (
          <span className="flex items-center gap-2.5 truncate">
            {selectedOption && renderIndicator(selectedOption)}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
        )}
        <ChevronDown className="select-menu-chevron" aria-hidden="true" />
        </button>
      )}

      {isRendered &&
        createPortal(
          isMobile && size !== 'sm' ? mobileSheetContent : popoverContent,
          document.body
        )}
    </div>
  );
};

export default SelectMenu;
