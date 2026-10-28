import { useCallback, useMemo, useState } from 'react';

export interface SurfaceTypeOption {
  value: string;
  label: string;
}

const STORAGE_KEY = 'curtain.customSurfaceTypes';

const BUILT_IN: SurfaceTypeOption[] = [
  { value: 'window', label: 'Window' },
  { value: 'wall', label: 'Wall' },
  { value: 'door', label: 'Door' },
];

const slug = (label: string) => label.trim().toLowerCase().replace(/\s+/g, '_');

function load(): SurfaceTypeOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((o) => o && typeof o.value === 'string' && typeof o.label === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Built-in surface types plus user-defined ones (add / rename / remove). */
export function useSurfaceTypes() {
  const [custom, setCustom] = useState<SurfaceTypeOption[]>(load);

  const persist = (next: SurfaceTypeOption[]) => {
    setCustom(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable; keep in-memory only */
    }
  };

  const options = useMemo(() => [...BUILT_IN, ...custom], [custom]);

  const isCustom = useCallback((value: string) => custom.some((o) => o.value === value), [custom]);

  /** Returns the new option's value, or null if invalid/duplicate. */
  const add = (label: string): string | null => {
    const clean = label.trim();
    const value = slug(clean);
    if (!clean || options.some((o) => o.value === value)) return null;
    persist([...custom, { value, label: clean }]);
    return value;
  };

  /** Renames only the label; the stored value stays stable for existing surfaces. */
  const rename = (value: string, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    persist(custom.map((o) => (o.value === value ? { ...o, label: clean } : o)));
  };

  const remove = (value: string) => persist(custom.filter((o) => o.value !== value));

  return { options, add, rename, remove, isCustom };
}
