import { useEffect, type RefObject } from 'react';

/**
 * Hook to focus a target input when the user presses '/' anywhere on the page,
 * ignoring keypresses if the user is currently typing in another input/textarea.
 */
export function useSlashShortcut(targetRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;

      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active as HTMLElement | null)?.isContentEditable;

      if (isInput) return;

      // Prevent the "/" character from being inserted into the newly focused input
      e.preventDefault();
      if (targetRef.current) {
        targetRef.current.focus();
        targetRef.current.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetRef]);
}
