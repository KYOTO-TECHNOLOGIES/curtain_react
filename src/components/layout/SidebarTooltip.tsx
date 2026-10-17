import React, { useState, useRef, useEffect, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  children: React.ReactElement<any>;
}

// Global timestamp to support instant warm tooltips when moving between items
let lastTooltipCloseTime = 0;

export default function SidebarTooltip({
  content,
  shortcut,
  disabled = false,
  children,
}: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const calculateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Position to the right with 12px gap, vertically centered
    setCoords({
      left: Math.round(rect.right + 12),
      top: Math.round(rect.top + rect.height / 2),
    });
  }, []);

  const openTooltip = useCallback((immediate = false) => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const now = Date.now();
    const isWarm = now - lastTooltipCloseTime < 300;
    const delay = immediate || isWarm ? 0 : 150;

    if (delay === 0) {
      calculateCoords();
      setIsVisible(true);
    } else {
      timerRef.current = window.setTimeout(() => {
        calculateCoords();
        setIsVisible(true);
      }, delay);
    }
  }, [disabled, calculateCoords]);

  const closeTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isVisible) {
      setIsVisible(false);
      lastTooltipCloseTime = Date.now();
    }
  }, [isVisible]);

  // Handle scroll or resize while open
  useEffect(() => {
    if (!isVisible) return;
    const handleReposition = () => {
      calculateCoords();
    };
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isVisible, calculateCoords]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Clone child with event listeners
  const child = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // Preserve any existing ref on the child
      const childRef = (children as any).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && 'current' in childRef) {
        childRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      openTooltip(false);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      closeTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      openTooltip(true);
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      closeTooltip();
    },
  });

  return (
    <>
      {child}
      {isVisible && coords && !disabled && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            aria-hidden="true"
            className="cm-portal-tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: 'translateY(-50%)',
            }}
          >
            {/* Small caret pointing left */}
            <span className="cm-tooltip-caret" />
            
            <span className="cm-tooltip-text">{content}</span>

            {shortcut && (
              <kbd className="cm-tooltip-chip">
                {shortcut}
              </kbd>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
