import { useEffect, useMemo, useState } from 'react';

export function parseISODate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(left: Date | null, right: Date): boolean {
  return Boolean(left && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate());
}

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

export function getCalendarDays(displayedMonth: Date, weekStartsOn = 0): CalendarDay[] {
  const firstOfMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
  const offset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const firstDay = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + index);
    return { date, inCurrentMonth: date.getMonth() === displayedMonth.getMonth() };
  });
}

export function useCalendar(value: string, weekStartsOn = 0) {
  const selectedDate = parseISODate(value);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const initialDate = selectedDate || new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const [direction, setDirection] = useState<'next' | 'previous'>('next');

  useEffect(() => {
    if (!value) return;
    const date = parseISODate(value);
    if (date) setDisplayedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [value]);

  const days = useMemo(() => getCalendarDays(displayedMonth, weekStartsOn), [displayedMonth, weekStartsOn]);
  const monthLabel = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToDate = (date: Date) => {
    setDirection(date.getTime() >= displayedMonth.getTime() ? 'next' : 'previous');
    setDisplayedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const changeMonth = (amount: number) => {
    setDirection(amount >= 0 ? 'next' : 'previous');
    setDisplayedMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const changeYear = (amount: number) => {
    setDirection(amount >= 0 ? 'next' : 'previous');
    setDisplayedMonth((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
  };

  const selectMonth = (month: number) => {
    setDirection(month >= displayedMonth.getMonth() ? 'next' : 'previous');
    setDisplayedMonth((current) => new Date(current.getFullYear(), month, 1));
  };

  const selectYear = (year: number) => {
    setDirection(year >= displayedMonth.getFullYear() ? 'next' : 'previous');
    setDisplayedMonth((current) => new Date(year, current.getMonth(), 1));
  };

  return {
    selectedDate,
    displayedMonth,
    days,
    direction,
    monthLabel,
    goToDate,
    changeMonth,
    changeYear,
    selectMonth,
    selectYear,
  };
}