import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Search,
  X,
  Phone,
  Mail,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus
} from 'lucide-react';
import { type Country, DEFAULT_COUNTRY, sanitizeDigits, parsePastedPhone } from './countryData';
import { CountrySelect } from './CountrySelect';
import './CustomerLookupModal.css';

export interface CustomerLookupModalProps {
  open: boolean;
  onClose: () => void;
  lookupQuery?: string;
  setLookupQuery?: (val: string) => void;
  lookupType?: 'phone' | 'email';
  setLookupType?: (type: 'phone' | 'email') => void;
  isLookingUp?: boolean;
  lookupError?: string | null;
  setLookupError?: (err: string | null) => void;
  onSearch?: (
    e: React.FormEvent,
    payload?: { type: 'phone' | 'email'; query: string; fullPhone?: string }
  ) => void | Promise<void>;
  onCreateNewCustomer?: () => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({
  open,
  onClose,
  lookupQuery: controlledQuery,
  setLookupQuery: controlledSetQuery,
  lookupType: controlledType,
  setLookupType: controlledSetType,
  isLookingUp = false,
  lookupError = null,
  setLookupError,
  onSearch,
  onCreateNewCustomer,
}) => {
  // Mode state: 'phone' | 'email'
  const [mode, setMode] = useState<'phone' | 'email'>(controlledType || 'phone');
  const [slideDir, setSlideDir] = useState<'8px' | '-8px'>('8px');

  // Input states per mode
  const [phoneDigits, setPhoneDigits] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  // Focus and typing interaction states
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInvalidState, setIsInvalidState] = useState(false);
  const [wasEnabled, setWasEnabled] = useState(false);
  const [showSheen, setShowSheen] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const subtitleId = useId();
  const hintId = useId();
  const inputId = useId();

  // Sync mode with parent if controlled
  useEffect(() => {
    if (controlledType && controlledType !== mode) {
      setMode(controlledType);
    }
  }, [controlledType]);

  // Sync initial controlledQuery on open
  useEffect(() => {
    if (open) {
      // Remember trigger element to return focus
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;

      if (controlledQuery) {
        if (mode === 'email') {
          setEmailValue(controlledQuery);
        } else {
          const { country, digits } = parsePastedPhone(controlledQuery);
          if (country) setSelectedCountry(country);
          setPhoneDigits(digits);
        }
      } else {
        setPhoneDigits('');
        setEmailValue('');
      }

      setHasInteracted(false);
      setIsInvalidState(false);
      setWasEnabled(false);
      setShowSheen(false);

      // Lock body scroll without layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Initial focus
      setTimeout(() => {
        if (mode === 'phone') {
          phoneInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 60);
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // Handle typing activity to pause concentric pulse ring
  const handleTypingActivity = useCallback(() => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 600);
  }, []);

  // Validation calculations
  const isPhoneValid = phoneDigits.length === selectedCountry.digits;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim());
  const isValid = mode === 'phone' ? isPhoneValid : isEmailValid;

  // Sync formatted values with parent's controlled query
  useEffect(() => {
    if (mode === 'phone') {
      const fullPhone = phoneDigits ? `${selectedCountry.dialCode}${phoneDigits}` : '';
      controlledSetQuery?.(fullPhone || phoneDigits);
    } else {
      controlledSetQuery?.(emailValue.trim());
    }
  }, [phoneDigits, emailValue, mode, selectedCountry]);

  // Sheen animation trigger when transitioning from disabled -> enabled
  useEffect(() => {
    if (isValid && !wasEnabled) {
      setWasEnabled(true);
      setShowSheen(true);
      const timer = setTimeout(() => setShowSheen(false), 700);
      return () => clearTimeout(timer);
    } else if (!isValid && wasEnabled) {
      setWasEnabled(false);
    }
  }, [isValid, wasEnabled]);

  // Switch mode handler
  const handleSwitchMode = (newMode: 'phone' | 'email') => {
    if (newMode === mode || isLookingUp) return;
    setSlideDir(newMode === 'email' ? '8px' : '-8px');
    setMode(newMode);
    controlledSetType?.(newMode);
    setIsInvalidState(false);
    setLookupError?.(null);

    setTimeout(() => {
      if (newMode === 'phone') {
        phoneInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }, 50);
  };

  // Keyboard navigation for tablist
  const handleModeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleSwitchMode('email');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleSwitchMode('phone');
    }
  };

  // Phone input changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTypingActivity();
    setHasInteracted(true);
    setIsInvalidState(false);
    setLookupError?.(null);

    const raw = e.target.value;
    const sanitized = sanitizeDigits(raw);
    // Limit to country digits length
    setPhoneDigits(sanitized.slice(0, selectedCountry.digits));
  };

  // Phone paste handler
  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleTypingActivity();
    setHasInteracted(true);
    setIsInvalidState(false);
    setLookupError?.(null);

    const pasted = e.clipboardData.getData('text');
    const { country, digits } = parsePastedPhone(pasted);
    if (country) {
      setSelectedCountry(country);
      setPhoneDigits(digits.slice(0, country.digits));
    } else {
      setPhoneDigits(digits.slice(0, selectedCountry.digits));
    }
  };

  // Email input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTypingActivity();
    setHasInteracted(true);
    setIsInvalidState(false);
    setLookupError?.(null);
    setEmailValue(e.target.value);
  };

  // Submit search handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLookingUp) return;

    if (!isValid) {
      setHasInteracted(true);
      setIsInvalidState(true);
      // Re-trigger shake animation
      const control = modalCardRef.current?.querySelector('.cl-control-group');
      if (control) {
        control.classList.remove('is-invalid');
        void (control as HTMLElement).offsetWidth;
        control.classList.add('is-invalid');
      }
      return;
    }

    setIsInvalidState(false);
    const query = mode === 'phone' ? `${selectedCountry.dialCode}${phoneDigits}` : emailValue.trim().toLowerCase();
    const fullPhone = mode === 'phone' ? `${selectedCountry.dialCode}${phoneDigits}` : undefined;

    if (onSearch) {
      onSearch(e, { type: mode, query, fullPhone });
    }
  };

  // Focus trap inside modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!isLookingUp) {
        e.preventDefault();
        onClose();
      }
      return;
    }

    if (e.key === 'Tab') {
      const modal = modalCardRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Calculate live helper hint
  const renderHint = () => {
    if (lookupError) {
      return null; // Handled by the dedicated result note below
    }

    if (mode === 'phone') {
      if (!hasInteracted || !phoneDigits) {
        return (
          <div className="cl-hint-row is-idle">
            <Info className="cl-hint-icon" aria-hidden="true" />
            <span>We'll look up existing customers by phone number.</span>
          </div>
        );
      }

      if (isInvalidState) {
        return (
          <div id={hintId} className="cl-hint-row is-error">
            <AlertCircle className="cl-hint-icon" aria-hidden="true" />
            <span>
              Please enter a complete {selectedCountry.name} number ({selectedCountry.digits} digits).
            </span>
          </div>
        );
      }

      if (isPhoneValid) {
        return (
          <div className="cl-hint-row is-valid">
            <CheckCircle2 className="cl-hint-icon" aria-hidden="true" />
            <span>Looks good. Press Enter to search.</span>
          </div>
        );
      }

      const remaining = selectedCountry.digits - phoneDigits.length;
      return (
        <div className="cl-hint-row is-incomplete">
          <Clock className="cl-hint-icon" aria-hidden="true" />
          <span>
            {selectedCountry.name} numbers have {selectedCountry.digits} digits. {remaining} more to go.
          </span>
        </div>
      );
    }

    // Email Mode
    if (!hasInteracted || !emailValue) {
      return (
        <div className="cl-hint-row is-idle">
          <Info className="cl-hint-icon" aria-hidden="true" />
          <span>We'll look up existing customers by email address.</span>
        </div>
      );
    }

    if (isInvalidState) {
      return (
        <div id={hintId} className="cl-hint-row is-error">
          <AlertCircle className="cl-hint-icon" aria-hidden="true" />
          <span>Please enter a valid email address (e.g. name@company.com).</span>
        </div>
      );
    }

    if (isEmailValid) {
      return (
        <div className="cl-hint-row is-valid">
          <CheckCircle2 className="cl-hint-icon" aria-hidden="true" />
          <span>Looks good. Press Enter to search.</span>
        </div>
      );
    }

    return (
      <div className="cl-hint-row is-incomplete">
        <Clock className="cl-hint-icon" aria-hidden="true" />
        <span>Enter a valid email address.</span>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className="cl-modal-overlay"
      onClick={(e) => {
        if (!isLookingUp && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalCardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        onKeyDown={handleModalKeyDown}
        className="cl-modal-card"
        style={{ '--cl-slide-dir': slideDir } as React.CSSProperties}
      >
        {/* Mobile Drag Handle */}
        <div className="cl-drag-handle" aria-hidden="true" />

        {/* Absolute Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLookingUp}
          className="cl-close-btn"
          aria-label="Close customer lookup modal"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Hero Section */}
        <div className="cl-hero">
          {/* Badge with Slow Concentric Pulse */}
          <div className="cl-icon-badge-wrap cl-stagger-1">
            <div className={`cl-pulse-ring ${isTyping || isLookingUp ? 'is-paused' : ''}`} aria-hidden="true" />
            <div className="cl-icon-badge">
              <Search className={`cl-magnifier-icon ${isLookingUp ? 'is-scanning' : ''}`} aria-hidden="true" />
            </div>
          </div>

          <h2 id={titleId} className="cl-title cl-stagger-2">
            Customer Lookup
          </h2>
          <p id={subtitleId} className="cl-subtitle cl-stagger-3">
            {mode === 'phone' ? 'Search by phone number to continue' : 'Search by email address to continue'}
          </p>
        </div>

        {/* Mode Toggle (Segmented Control) */}
        <div
          role="tablist"
          aria-label="Customer search mode"
          onKeyDown={handleModeKeyDown}
          className="cl-mode-toggle cl-stagger-4"
        >
          <div className={`cl-mode-thumb ${mode === 'email' ? 'is-email' : ''}`} aria-hidden="true" />

          <button
            type="button"
            role="tab"
            id="tab-phone"
            aria-selected={mode === 'phone'}
            aria-controls="panel-lookup-input"
            tabIndex={mode === 'phone' ? 0 : -1}
            disabled={isLookingUp}
            onClick={() => handleSwitchMode('phone')}
            className={`cl-mode-tab ${mode === 'phone' ? 'is-active' : ''}`}
          >
            <Phone className="cl-mode-icon" aria-hidden="true" />
            <span>Phone</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-email"
            aria-selected={mode === 'email'}
            aria-controls="panel-lookup-input"
            tabIndex={mode === 'email' ? 0 : -1}
            disabled={isLookingUp}
            onClick={() => handleSwitchMode('email')}
            className={`cl-mode-tab ${mode === 'email' ? 'is-active' : ''}`}
          >
            <Mail className="cl-mode-icon" aria-hidden="true" />
            <span>Email</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} noValidate className="cl-stagger-5">
          <div className="cl-field-wrap" id="panel-lookup-input" role="tabpanel" aria-labelledby={`tab-${mode}`}>
            {/* Label */}
            <div className="cl-field-label-row">
              <label htmlFor={inputId} className={`cl-field-label ${isFocused ? 'is-focused' : ''}`}>
                <span>{mode === 'phone' ? 'Phone Number' : 'Email Address'}</span>
                <span className="cl-field-required" aria-hidden="true">
                  *
                </span>
              </label>
            </div>

            {/* Input Control Container */}
            <div
              className={`cl-control-group ${isFocused ? 'is-focused' : ''} ${isInvalidState ? 'is-invalid' : ''}`}
            >
              {mode === 'phone' ? (
                <div key="phone-mode" className="cl-mode-anim-wrap flex items-center w-full h-full">
                  <CountrySelect
                    selectedCountry={selectedCountry}
                    onSelectCountry={(country) => {
                      setSelectedCountry(country);
                      // Adjust phone digits length if target country is shorter
                      setPhoneDigits((prev) => prev.slice(0, country.digits));
                      phoneInputRef.current?.focus();
                    }}
                    disabled={isLookingUp}
                    isGroupFocused={isFocused}
                  />

                  <input
                    ref={phoneInputRef}
                    id={inputId}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    disabled={isLookingUp}
                    readOnly={isLookingUp}
                    value={selectedCountry.format(phoneDigits)}
                    onChange={handlePhoneChange}
                    onPaste={handlePhonePaste}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      if (phoneDigits && !isPhoneValid) {
                        setIsInvalidState(true);
                      }
                    }}
                    placeholder={selectedCountry.placeholder}
                    aria-required="true"
                    aria-invalid={isInvalidState}
                    aria-describedby={isInvalidState ? hintId : undefined}
                    className="cl-input cl-input-phone"
                  />
                </div>
              ) : (
                <div key="email-mode" className="cl-mode-anim-wrap cl-input-email-wrap">
                  <Mail className="cl-input-email-icon" aria-hidden="true" />
                  <input
                    ref={emailInputRef}
                    id={inputId}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    spellCheck="false"
                    disabled={isLookingUp}
                    readOnly={isLookingUp}
                    value={emailValue}
                    onChange={handleEmailChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      if (emailValue && !isEmailValid) {
                        setIsInvalidState(true);
                      }
                    }}
                    placeholder="name@company.com"
                    aria-required="true"
                    aria-invalid={isInvalidState}
                    aria-describedby={isInvalidState ? hintId : undefined}
                    className="cl-input"
                  />
                </div>
              )}

              {/* Right-Side Validity Indicator */}
              {isValid && !isLookingUp && (
                <div className="cl-valid-badge" aria-label="Valid input">
                  <svg className="cl-check-svg" viewBox="0 0 16 16" aria-hidden="true">
                    <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Live Helper Hint Row */}
          <div aria-live="polite" aria-atomic="true">
            {renderHint()}
          </div>

          {/* Result / Error Note Card (Smoothly sliding in) */}
          {lookupError && (
            <div className="cl-result-note is-not-found" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900 leading-tight">Customer not found</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    No customer matches this {mode === 'phone' ? 'phone number' : 'email'}. You can create a new profile.
                  </p>
                </div>
              </div>

              {onCreateNewCustomer && (
                <button
                  type="button"
                  onClick={onCreateNewCustomer}
                  className="cl-create-btn"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Create New Customer</span>
                </button>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          <div className="mt-4 cl-stagger-6">
            <button
              type="submit"
              disabled={!isValid || isLookingUp}
              aria-busy={isLookingUp}
              className={`cl-submit-btn ${isValid ? 'is-enabled' : 'is-disabled'} ${
                showSheen ? 'cl-sheen-sweep' : ''
              }`}
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="cl-submit-icon" aria-hidden="true" />
                  <span>Search Customer</span>
                </>
              )}
            </button>

            {/* Enter Shortcut Hint (Desktop only) */}
            <div className="cl-enter-hint" aria-hidden="true">
              <kbd className="cl-kbd-enter">↵</kbd>
              <span>Press Enter to search</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerLookupModal;
