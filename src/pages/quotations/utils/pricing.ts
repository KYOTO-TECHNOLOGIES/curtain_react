import type { ChargeTemplate } from '../../../api/catalog';
import type { SurfaceSpec } from '../../../api/quotations';

/** VAT rate applied on the discounted subtotal (mirrors the backend summary). */
export const VAT_RATE = 0.05;

/** Safe numeric parse: '', null, undefined and NaN all become 0. */
export function toNum(value: unknown): number {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatAED(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Amount of a catalog charge template for a surface of the given size. */
export function chargeAmount(charge: ChargeTemplate | undefined, widthCm: number, heightCm: number): number {
  if (!charge) return 0;
  const price = toNum(charge.price);
  if (charge.unit === 'flat') return price;
  if (charge.unit === 'm') return price * (widthCm / 100);
  return price * ((widthCm * heightCm) / 10000);
}

export function chargeUnitText(unit: string | undefined): string {
  if (unit === 'flat') return 'flat';
  if (unit === 'm') return 'per m';
  return 'per m²';
}

/** Catalog charges that are not tied to control/alexa/pelmet are offered as add-on "other charges". */
export function isOtherCharge(charge: ChargeTemplate): boolean {
  return !charge.kind || charge.kind === 'other';
}

export interface ResolvedOtherCharge {
  id: number;
  name: string;
  /** Amount for a single unit (before quantity multiplication). */
  unitAmount: number;
  /** Quantity chosen by the user (defaults to 1). */
  quantity: number;
  /** Final amount = unitAmount × quantity. */
  amount: number;
  catalogAmount: number;
  overridden: boolean;
}

/**
 * Resolves the other charges selected on a surface into concrete amounts.
 * Custom amounts are only honoured when `allowOverride` is true (B2B quotations);
 * otherwise the catalog rate is always used.
 */
export function resolveOtherCharges(
  spec: SurfaceSpec,
  charges: ChargeTemplate[],
  widthCm: number,
  heightCm: number,
  allowOverride: boolean
): ResolvedOtherCharge[] {
  return (spec.other_charges || [])
    .map((selection) => {
      const template = charges.find((charge) => Number(charge.id) === Number(selection.id));
      if (!template) return null;
      const catalogAmount = chargeAmount(template, widthCm, heightCm);
      const overridden =
        allowOverride && selection.amount !== undefined && selection.amount !== null && selection.amount !== '';
      const unitAmount = overridden ? toNum(selection.amount) : catalogAmount;
      const quantity = Math.max(1, Math.floor(Number(selection.quantity) || 1));
      return {
        id: Number(template.id),
        name: template.name,
        unitAmount,
        quantity,
        amount: unitAmount * quantity,
        catalogAmount,
        overridden,
      };
    })
    .filter((charge): charge is ResolvedOtherCharge => charge !== null);
}

