/**
 * Catalog helpers for Work-Type ↔ Motor / Charge integration.
 *
 * All five feature keys guaranteed by the backend contract:
 *   motor   – "Motor / Control Types"
 *   charges – "Control & Charges"
 *   images  – "Item Images"
 *   draw    – "Opening Direction (1 way / 2 way)"
 *   pelmet  – "Pelmet (per metre)"
 */

import React from 'react';
import {
  Zap,
  SlidersHorizontal,
  ImageIcon,
  ArrowLeftRight,
  PanelTop,
  Hand,
  Cpu,
  Mic,
  Tag,
} from 'lucide-react';
import type { ChargeTemplate, ChargeKind, ChargeUnit } from '../api/catalog';

// ── Feature Definitions & Helpers ───────────────────────

export type FeatureKey = 'motor' | 'charges' | 'images' | 'draw' | 'pelmet';

export const FEATURE_KEYS: FeatureKey[] = ['motor', 'charges', 'images', 'draw', 'pelmet'];

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const FEATURE_METAS: FeatureMeta[] = [
  {
    key: 'motor',
    label: 'Motor / Control Types',
    helper: 'Enables motorization options and motor catalog selections',
    icon: Zap,
  },
  {
    key: 'charges',
    label: 'Control & Charges',
    helper: 'Enables smart home (Alexa), manual, and add-on charges',
    icon: SlidersHorizontal,
  },
  {
    key: 'images',
    label: 'Item Images',
    helper: 'Displays catalog and fabric reference photos',
    icon: ImageIcon,
  },
  {
    key: 'draw',
    label: 'Opening Direction (1 way / 2 way)',
    helper: 'Allows selecting split or one-way draw configurations',
    icon: ArrowLeftRight,
  },
  {
    key: 'pelmet',
    label: 'Pelmet (per metre)',
    helper: 'Enables pelmet dimensions and per-metre pelmet charges',
    icon: PanelTop,
  },
];

export interface FeatureFlags extends Record<string, unknown> {
  motor: boolean;
  charges: boolean;
  images: boolean;
  draw: boolean;
  pelmet: boolean;
}

/**
 * Normalizes features guaranteeing all five keys exist as booleans,
 * while preserving any extra keys previously stored.
 */
export function normalizeFeatures(features?: Record<string, unknown> | null): FeatureFlags {
  const extra = features ? { ...features } : {};
  return {
    ...extra,
    motor: Boolean(features?.motor),
    charges: Boolean(features?.charges),
    images: Boolean(features?.images),
    draw: Boolean(features?.draw),
    pelmet: Boolean(features?.pelmet),
  };
}

/**
 * Checks whether a given charge is eligible under current feature flags:
 * - kind "pelmet" requires features.pelmet === true
 * - every other kind requires features.charges === true
 */
export function isChargeEligible(
  charge: { kind?: ChargeKind | string | null },
  features: { charges: boolean; pelmet: boolean }
): boolean {
  if (charge.kind === 'pelmet') {
    return Boolean(features.pelmet);
  }
  return Boolean(features.charges);
}

// ── Display Maps & Unit Helpers ─────────────────────────

export const UNIT_LABELS: Record<string, string> = {
  m2: 'per m²',
  m: 'per metre',
  flat: 'Flat',
};

export function formatChargeUnit(unit?: string | null): string {
  const normalized = normalizeChargeUnit(unit);
  return UNIT_LABELS[normalized] || normalized;
}

export function normalizeChargeUnit(unit?: string | null): ChargeUnit {
  const clean = String(unit || '').toLowerCase().trim();
  if (clean === 'm2' || clean === '/m²' || clean === 'per m²' || clean === 'sqm') return 'm2';
  if (clean === 'm' || clean === '/m' || clean === 'per m' || clean === 'per metre' || clean === 'metre') return 'm';
  return 'flat';
}

export interface KindMeta {
  kind: ChargeKind;
  label: string;
  badgeClass: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const KIND_METAS: Record<ChargeKind, KindMeta> = {
  manual: {
    kind: 'manual',
    label: 'Manual',
    badgeClass: 'kind-pill--manual',
    color: '#0F766E',
    bgColor: '#E6F8F6',
    icon: Hand,
  },
  motorized: {
    kind: 'motorized',
    label: 'Motorized',
    badgeClass: 'kind-pill--motorized',
    color: '#6D28D9',
    bgColor: '#F3EFFE',
    icon: Cpu,
  },
  alexa: {
    kind: 'alexa',
    label: 'Alexa',
    badgeClass: 'kind-pill--alexa',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    icon: Mic,
  },
  pelmet: {
    kind: 'pelmet',
    label: 'Pelmet',
    badgeClass: 'kind-pill--pelmet',
    color: '#B45309',
    bgColor: '#FFFBEB',
    icon: PanelTop,
  },
  other: {
    kind: 'other',
    label: 'Other',
    badgeClass: 'kind-pill--other',
    color: '#475569',
    bgColor: '#F1F5F9',
    icon: Tag,
  },
};

export const CHARGE_KINDS: ChargeKind[] = ['manual', 'motorized', 'alexa', 'pelmet', 'other'];

export function formatMoney(amount: unknown): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount ?? '0'));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── WorkType Patch Builder ──────────────────────────────

export interface WorkTypeFormState {
  id?: number;
  name: string;
  pricing_unit: string;
  features: FeatureFlags;
  motor_ids: number[];
  charge_ids: number[];
  originalFeatures?: Record<string, unknown>;
}

/**
 * Builds the exact PATCH/POST payload matching the backend rules:
 * 1. Spreads existing loaded features first, then the 5 flags (keeps extra keys).
 * 2. Sends motor_ids ONLY when features.motor is true.
 * 3. Sends charge_ids ONLY when features.charges or features.pelmet is true,
 *    and filters down to eligible charge IDs against the global charges catalog.
 * 4. Never sends `motors` or `charges`.
 */
export function buildWorkTypePatch(
  state: WorkTypeFormState,
  globalCharges: ChargeTemplate[] = []
): {
  name: string;
  pricing_unit: string;
  features: FeatureFlags;
  motor_ids?: number[];
  charge_ids?: number[];
} {
  const normalized = normalizeFeatures({
    ...(state.originalFeatures || {}),
    ...state.features,
  });

  const payload: {
    name: string;
    pricing_unit: string;
    features: FeatureFlags;
    motor_ids?: number[];
    charge_ids?: number[];
  } = {
    name: state.name.trim(),
    pricing_unit: state.pricing_unit || 'm2',
    features: normalized,
  };

  if (normalized.motor) {
    payload.motor_ids = Array.from(new Set(state.motor_ids || []));
  }

  if (normalized.charges || normalized.pelmet) {
    const eligibleIds = (state.charge_ids || []).filter((id) => {
      const charge = globalCharges.find((c) => c.id === id);
      if (!charge) return true; // if not loaded, preserve
      return isChargeEligible(charge, normalized);
    });
    payload.charge_ids = Array.from(new Set(eligibleIds));
  }

  return payload;
}
