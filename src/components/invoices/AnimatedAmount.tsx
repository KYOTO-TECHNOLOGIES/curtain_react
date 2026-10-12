import { useEffect, useRef, useState } from 'react';
import { formatAedMinor } from './money';

interface AnimatedAmountProps {
  amountMinor: number;
  className?: string;
}

export function AnimatedAmount({ amountMinor, className = '' }: AnimatedAmountProps) {
  const [displayedMinor, setDisplayedMinor] = useState(amountMinor);
  const displayedRef = useRef(amountMinor);

  useEffect(() => {
    let frame = 0;
    const startMinor = displayedRef.current;
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || startMinor === amountMinor) {
      displayedRef.current = amountMinor;
      setDisplayedMinor(amountMinor);
      return undefined;
    }

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / 250, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextMinor = Math.round(startMinor + (amountMinor - startMinor) * easedProgress);
      displayedRef.current = nextMinor;
      setDisplayedMinor(nextMinor);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [amountMinor]);

  return <span className={`payment-animated-amount ${className}`}>{formatAedMinor(displayedMinor)}</span>;
}