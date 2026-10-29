import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search, ChevronDown } from 'lucide-react';
import { type Country, COUNTRIES, SUGGESTED_CODES } from './countryData';

interface CountrySelectProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  disabled?: boolean;
  isGroupFocused?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  selectedCountry,
  onSelectCountry,
  disabled = false,
  isGroupFocused = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; placement: 'bottom' | 'top' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  // Split countries into Suggested and Alphabetical (Others)
  const suggestedCountries = useMemo(() => {
    return SUGGESTED_CODES.map((code) => COUNTRIES.find((c) => c.code === code)).filter(Boolean) as Country[];
  }, []);

  const otherCountries = useMemo(() => {
    return COUNTRIES.filter((c) => !SUGGESTED_CODES.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter based on search query
  const filteredSuggested = useMemo(() => {
    if (!searchTerm.trim()) return suggestedCountries;
    const term = searchTerm.toLowerCase().trim();
    return suggestedCountries.filter(
      (c) => c.name.toLowerCase().includes(term) || c.dialCode.includes(term) || c.code.toLowerCase().includes(term)
    );
  }, [suggestedCountries, searchTerm]);

  const filteredOthers = useMemo(() => {
    if (!searchTerm.trim()) return otherCountries;
    const term = searchTerm.toLowerCase().trim();
    return otherCountries.filter(
      (c) => c.name.toLowerCase().includes(term) || c.dialCode.includes(term) || c.code.toLowerCase().includes(term)
    );
  }, [otherCountries, searchTerm]);

  const allVisibleCountries = useMemo(() => {
    return [...filteredSuggested, ...filteredOthers];
  }, [filteredSuggested, filteredOthers]);

  // Update Popover Position with collision detection
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 300;
    const estimatedHeight = 320; // 40px search + padding + list (max 280px)

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const willOpenUp = spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;
    const placement = willOpenUp ? 'top' : 'bottom';

    let top = willOpenUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8;
    // Keep top within viewport
    if (willOpenUp && top < 8) top = 8;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) left = 12;

    setPopoverCoords({ top, left, placement });
  };

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setSearchTerm('');
    setIsOpen(true);
    // Highlight the currently selected country
    const idx = allVisibleCountries.findIndex((c) => c.code === selectedCountry.code);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Recalculate position on resize/scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('resize', handleScroll);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Auto-focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside and Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleDocumentKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation inside popover
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allVisibleCountries.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allVisibleCountries.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (allVisibleCountries[highlightedIndex]) {
        onSelectCountry(allVisibleCountries[highlightedIndex]);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
      return;
    }
  };

  const renderCountryRow = (country: Country, globalIdx: number) => {
    const isSelected = country.code === selectedCountry.code;
    const isHighlighted = globalIdx === highlightedIndex;

    return (
      <button
        key={country.code}
        type="button"
        role="option"
        aria-selected={isSelected}
        data-index={globalIdx}
        className={`cm-country-item ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
        onClick={() => {
          onSelectCountry(country);
          setIsOpen(false);
          buttonRef.current?.focus();
        }}
        onMouseEnter={() => setHighlightedIndex(globalIdx)}
      >
        <span className="cm-country-flag-wrap">{country.flagSvg}</span>
        <span className="cm-country-name truncate">{country.name}</span>
        <span className="cm-country-dial-code">{country.dialCode}</span>
        <span className="cm-country-check-wrap" aria-hidden="true">
          {isSelected && <Check className="cm-country-check-icon animate-check-draw" />}
        </span>
      </button>
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={isOpen ? handleClose : handleOpen}
        className={`cm-country-segment ${isOpen ? 'is-open' : ''} ${isGroupFocused ? 'group-focused' : ''}`}
        title={`Country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        <span className="cm-country-flag-wrap">{selectedCountry.flagSvg}</span>
        <span className="cm-country-code-text">{selectedCountry.dialCode}</span>
        <ChevronDown className={`cm-country-chevron ${isOpen ? 'is-rotated' : ''}`} aria-hidden="true" />
        <span className="cm-country-segment-divider" aria-hidden="true" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            style={{
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
            }}
            className={`cm-country-popover is-open placement-${popoverCoords.placement}`}
          >
            {/* Sticky Search Header */}
            <div className="cm-country-search-header">
              <Search className="cm-country-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search country or code"
                className="cm-country-search-input"
                aria-label="Search country or dial code"
              />
            </div>

            {/* Scrollable list of countries */}
            <div ref={listRef} className="cm-country-list-scroll">
              {allVisibleCountries.length === 0 ? (
                <div className="cm-country-empty">No countries found</div>
              ) : (
                <>
                  {filteredSuggested.length > 0 && (
                    <div className="cm-country-group">
                      <div className="cm-country-group-label">Suggested</div>
                      {filteredSuggested.map((country, idx) => renderCountryRow(country, idx))}
                    </div>
                  )}

                  {filteredOthers.length > 0 && (
                    <div className="cm-country-group">
                      {filteredSuggested.length > 0 && (
                        <div className="cm-country-group-label">All Countries</div>
                      )}
                      {filteredOthers.map((country, idx) =>
                        renderCountryRow(country, filteredSuggested.length + idx)
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
