import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import './SelectMenu.css';

export interface SelectOption {
  value: string;
  label: string;
  dotColor?: string;
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
  disabled?: boolean;
}

export const SelectMenu: React.FC<SelectMenuProps> = ({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  ariaLabel,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Detect mobile viewport (<640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || options[0];
  }, [options, value]);

  const isNonDefaultSelected = useMemo(() => {
    return Boolean(value && value !== '' && value !== 'all');
  }, [value]);

  // Show inline search if more than 6 options
  const isSearchable = options.length > 6;

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  // Calculate popover position with collision-aware flipping
  const updatePosition = () => {
    if (!triggerRef.current || isMobile) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 220);

    const estimatedHeight = Math.min(
      filteredOptions.length * 40 + (isSearchable ? 50 : 0) + 16,
      320
    );

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const willOpenUp = spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;
    setPlacement(willOpenUp ? 'top' : 'bottom');

    const topPos = willOpenUp
      ? rect.top - estimatedHeight - 8
      : rect.bottom + 8;

    let leftPos = rect.left;
    if (leftPos + minWidth > window.innerWidth - 12) {
      leftPos = window.innerWidth - minWidth - 12;
    }
    if (leftPos < 12) leftPos = 12;

    setPopoverStyle({
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: `${minWidth}px`,
      maxHeight: `${estimatedHeight}px`,
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
  }, [isOpen, filteredOptions.length, isMobile]);

  // Reset search and highlight on open/close
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);

      // Focus search if searchable on desktop
      if (isSearchable && !isMobile) {
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
      setIsOpen(false);
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
        setIsOpen(true);
      }
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
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
      default: {
        // First-letter jump if not typing in search
        if (
          !isSearchable &&
          e.key.length === 1 &&
          /[a-zA-Z0-9]/.test(e.key)
        ) {
          const char = e.key.toLowerCase();
          const matchIdx = filteredOptions.findIndex((opt) =>
            opt.label.toLowerCase().startsWith(char)
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
      className={`select-menu-popover placement-${placement}`}
      style={popoverStyle}
      role="listbox"
      aria-label={ariaLabel || placeholder}
      onKeyDown={handleKeyDown}
    >
      {isSearchable && (
        <div className="select-menu-search-wrapper">
          <Search className="select-menu-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="select-menu-search-input"
            placeholder="Search..."
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
                className={`select-menu-option ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                style={
                  {
                    '--opt-idx': idx,
                    backgroundColor: selectedBg,
                  } as React.CSSProperties
                }
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {renderIndicator(opt)}

                <span className="truncate flex-1">{opt.label}</span>

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
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={popoverRef}
        className="select-menu-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || placeholder}
      >
        <div className="select-menu-drag-handle" />
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800">
            {ariaLabel || placeholder}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSearchable && (
          <div className="select-menu-search-wrapper mb-3">
            <Search className="select-menu-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="select-menu-search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <ul className="select-menu-options-list flex-1 overflow-y-auto">
          {filteredOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`select-menu-option ${isSelected ? 'is-selected' : ''}`}
                style={{
                  backgroundColor: isSelected
                    ? opt.dotColor
                      ? `${opt.dotColor}14`
                      : 'rgba(47, 93, 143, 0.08)'
                    : undefined,
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {renderIndicator(opt)}
                <span className="truncate flex-1">{opt.label}</span>
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
    <div className={`relative inline-block w-full ${className}`}>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${selectId}-popover`}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
        }
        aria-label={ariaLabel}
        className={`select-menu-trigger ${isOpen ? 'is-open' : ''}`}
        style={getTriggerTintStyle()}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selectedOption && renderIndicator(selectedOption)}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown className="select-menu-chevron" aria-hidden="true" />
      </button>

      {isOpen &&
        createPortal(
          isMobile ? mobileSheetContent : popoverContent,
          document.body
        )}
    </div>
  );
};

export default SelectMenu;
