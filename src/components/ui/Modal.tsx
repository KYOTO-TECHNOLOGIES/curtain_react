import React, { useEffect, useId, useRef, useState } from 'react';
import { Layers3, PanelTop, WalletCards, X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  variant?: 'default' | 'payment' | 'area' | 'surface';
  subtitle?: string;
  context?: string;
  isBusy?: boolean;
  footer?: React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  variant = 'default',
  subtitle,
  context,
  isBusy = false,
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOpenedRef = useRef(false);
  const titleId = useId();
  const subtitleId = useId();
  const [isMounted, setIsMounted] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [staggerFields, setStaggerFields] = useState(false);

  useEffect(() => {
    if (variant === 'payment' || variant === 'area' || variant === 'surface') {
      if (!open) return;
      const previousOverflow = document.body.style.overflow;
      const previousPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      };
    }
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open, variant]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsMounted(true);
      setIsClosing(false);
      if ((variant === 'payment' || variant === 'area' || variant === 'surface') && !hasOpenedRef.current) {
        hasOpenedRef.current = true;
        setStaggerFields(true);
        staggerTimerRef.current = setTimeout(() => setStaggerFields(false), 500);
      }
    } else if ((variant === 'payment' || variant === 'area' || variant === 'surface') && isMounted) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 140);
    } else {
      setIsMounted(false);
    }
  }, [open, variant, isMounted]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (staggerTimerRef.current) clearTimeout(staggerTimerRef.current);
  }, []);

  useEffect(() => {
    if (variant !== 'payment' && variant !== 'area' && variant !== 'surface') return;
    if (open && isMounted) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      cardRef.current?.querySelector<HTMLElement>(
        variant === 'area'
          ? '[data-area-autofocus]'
          : variant === 'surface'
            ? '[data-surface-autofocus]'
            : '[data-payment-autofocus]'
      )?.focus();
    } else if (!open) {
      returnFocusRef.current?.focus();
    }
  }, [open, isMounted, variant]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        (variant === 'default' || ((variant === 'area' || variant === 'surface') && !isBusy))
      ) {
        onClose();
      }
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose, variant, isBusy]);

  const handlePaymentKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!isBusy) onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isMounted) return null;

  if (variant === 'payment') {
    return (
      <div
        ref={overlayRef}
        className={`payment-modal-overlay ${isClosing ? 'is-closing' : ''}`}
        onClick={(event) => {
          if (!isBusy && event.target === overlayRef.current) onClose();
        }}
        role="presentation"
      >
        <div
          ref={cardRef}
          className={`payment-modal-card ${isClosing ? 'is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitleId}
          aria-busy={isBusy}
          onKeyDown={handlePaymentKeyDown}
        >
          <div className="payment-modal-drag-handle" aria-hidden="true" />
          <header className="payment-modal-header">
            <span className="payment-modal-icon-badge" aria-hidden="true">
              <WalletCards />
            </span>
            <div className="payment-modal-heading">
              <h2 id={titleId}>{title}</h2>
              <div className="payment-modal-subtitle-row">
                <p id={subtitleId}>{subtitle}</p>
                {context && <span className="payment-context-chip">{context}</span>}
              </div>
            </div>
            <button
              type="button"
              className="payment-modal-close"
              onClick={onClose}
              disabled={isBusy}
              aria-label="Close payment dialog"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={`payment-modal-content ${staggerFields ? 'is-first-open' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'area' || variant === 'surface') {
    const isSurface = variant === 'surface';
    return (
      <div
        ref={overlayRef}
        className={`${isSurface ? 'surface-modal-overlay' : 'area-modal-overlay'} ${isClosing ? 'is-closing' : ''}`}
        onClick={(event) => {
          if (!isBusy && event.target === overlayRef.current) onClose();
        }}
        role="presentation"
      >
        <div
          ref={cardRef}
          className={`${isSurface ? 'surface-modal-card' : 'area-modal-card'} ${isClosing ? 'is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitleId}
          aria-busy={isBusy}
          onKeyDown={handlePaymentKeyDown}
        >
          <div className={isSurface ? 'surface-modal-drag-handle' : 'area-modal-drag-handle'} aria-hidden="true" />
          <header className={isSurface ? 'surface-modal-header' : 'area-modal-header'}>
            <span className={isSurface ? 'surface-modal-icon-badge' : 'area-modal-icon-badge'} aria-hidden="true">
              {isSurface ? <PanelTop /> : <Layers3 />}
            </span>
            <div className={isSurface ? 'surface-modal-heading' : 'area-modal-heading'}>
              <h2 id={titleId}>{title}</h2>
              <p id={subtitleId}>{subtitle}</p>
            </div>
            <button
              type="button"
              className={isSurface ? 'surface-modal-close' : 'area-modal-close'}
              onClick={onClose}
              disabled={isBusy}
              aria-label={`Close ${title.toLowerCase()} dialog`}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className={`${isSurface ? 'surface-modal-body' : 'area-modal-body'} ${staggerFields ? 'is-first-open' : ''}`}>
            {children}
          </div>
          {footer && (
            <footer className={`${isSurface ? 'surface-modal-footer' : 'area-modal-footer'} ${staggerFields ? 'is-first-open' : ''}`}>
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl animate-modal-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Confirm variant ─────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', isLoading }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-slate-600 text-[15px] leading-relaxed">{message}</p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
