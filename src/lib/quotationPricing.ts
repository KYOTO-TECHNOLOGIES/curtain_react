import type { ChargeTemplate, ChargeKind } from '../api/catalog';
import type { ChargeLine, SurfaceSpec } from '../api/quotations';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function selectedChargeIds(spec: SurfaceSpec): number[] {
  return Array.from(
    new Set(
      (spec.selected_charge_ids || [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

export function resolvedChargeIds(
  spec: SurfaceSpec,
  charges: ChargeTemplate[],
): number[] {
  if (charges.length === 0) return selectedChargeIds(spec);
  const availableIds = new Set(charges.map((charge) => charge.id));
  const ids = selectedChargeIds(spec).filter((id) => availableIds.has(id));

  const ensureKind = (kind: ChargeKind, enabled = true) => {
    const existing = ids.some((id) => charges.find((charge) => charge.id === id)?.kind === kind);
    const fallback = charges.find((charge) => charge.kind === kind);
    if (enabled && !existing && fallback && (kind === 'alexa' || kind === 'pelmet' || spec.selected_charge_ids === undefined)) ids.push(fallback.id);
  };

  ensureKind(spec.motor_control_type === 'motorized' ? 'motorized' : 'manual');
  ensureKind('alexa', spec.smart_integration);
  ensureKind('pelmet', spec.pelmet_enabled);
  return Array.from(new Set(ids));
}

export function replaceChargeKind(
  spec: SurfaceSpec,
  charges: ChargeTemplate[],
  kind: ChargeKind,
  chargeId: number | null,
): number[] {
  const ids = selectedChargeIds(spec).filter(
    (id) => charges.find((charge) => charge.id === id)?.kind !== kind,
  );
  if (chargeId) ids.push(chargeId);
  return Array.from(new Set(ids));
}

// Decimal multiplication keeps half-cent boundaries consistent with Python Decimal.
function decimalFraction(value: unknown): [bigint, bigint] {
  const text = String(value ?? 0).trim();
  const match = /^(-?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) return [0n, 1n];
  const fraction = match[3] || '';
  const scale = fraction.length - Number(match[4] || 0);
  const sign = match[1] ? -1n : 1n;
  const digits = sign * BigInt(match[2] + fraction);
  return scale < 0 ? [digits * 10n ** BigInt(-scale), 1n] : [digits, 10n ** BigInt(scale)];
}

function moneyProduct(values: unknown[], divisor = 1): number {
  let numerator = 1n;
  let denominator = BigInt(divisor);
  for (const value of values) {
    const [digits, scale] = decimalFraction(value);
    numerator *= digits;
    denominator *= scale;
  }
  const sign = numerator < 0n ? -1n : 1n;
  const cents = ((numerator < 0n ? -numerator : numerator) * 100n + denominator / 2n) / denominator;
  return Number(sign * cents) / 100;
}

export const roundMoney = (value: number) => moneyProduct([value]);

export function pricingRate(spec: SurfaceSpec, key: string, defaultRate: unknown, isB2B = false): number {
  return toNumber(isB2B ? spec.price_overrides?.[key] ?? defaultRate : defaultRate);
}

export function chargeQuantity(spec: SurfaceSpec, id: number): number {
  return toNumber(spec.charge_lines?.find((line) => line.id === id)?.quantity ?? 1);
}

export function chargeAmount(charge: ChargeTemplate, widthCm: number, heightCm: number): number {
  return charge.unit === 'm' ? moneyProduct([charge.price, widthCm], 100)
    : charge.unit === 'm2' ? moneyProduct([charge.price, widthCm, heightCm], 10000) : moneyProduct([charge.price]);
}

export function calculateSurfacePricing(
  spec: SurfaceSpec,
  widthCm: number,
  heightCm: number,
  pricingUnit: string | undefined,
  charges: ChargeTemplate[],
  isB2B = false,
) {
  const areaM2 = toNumber(widthCm) * toNumber(heightCm) / 10000;
  const widthM = toNumber(widthCm) / 100;
  const fabricRate = pricingRate(spec, 'fabric', spec.unit_price_per_m2, isB2B);
  const fabric = pricingUnit === 'flat' ? moneyProduct([fabricRate]) : pricingUnit === 'm'
    ? moneyProduct([fabricRate, widthCm], 100) : moneyProduct([fabricRate, widthCm, heightCm], 10000);
  const motorRate = pricingRate(spec, 'motor', spec.motor_price_per_unit, isB2B);
  const motor = spec.motor_control_type === 'motorized' && spec.motor_type
    ? spec.motor_pricing_unit === 'unit' ? moneyProduct([motorRate, spec.motor_quantity ?? 1])
      : moneyProduct([motorRate, spec.motor_quantity ?? 1, widthCm, heightCm], 10000) : 0;
  const controlKind = spec.motor_control_type === 'motorized' ? 'motorized' : 'manual';
  const lines: ChargeLine[] = resolvedChargeIds(spec, charges)
    .map((id) => charges.find((charge) => charge.id === id))
    .filter((charge): charge is ChargeTemplate => Boolean(charge))
    .filter((charge) => !['manual', 'motorized'].includes(charge.kind || 'other') || charge.kind === controlKind)
    .filter((charge) => charge.kind !== 'alexa' || spec.smart_integration)
    .filter((charge) => charge.kind !== 'pelmet' || spec.pelmet_enabled)
    .map((charge) => {
      const price = pricingRate(spec, `charge:${charge.id}`, charge.price, isB2B);
      const quantity = charge.kind === 'alexa' ? toNumber(spec.alexa_quantity)
        : charge.kind === 'pelmet' ? 1 : chargeQuantity(spec, charge.id);
      const measure = charge.kind === 'alexa' ? 1
        : charge.kind === 'pelmet' ? toNumber(spec.pelmet_width_cm) / 100
        : charge.unit === 'm' ? widthM : charge.unit === 'm2' ? areaM2 : 1;
      const total = charge.kind === 'alexa' ? moneyProduct([price, quantity])
        : charge.kind === 'pelmet' ? moneyProduct([price, spec.pelmet_width_cm], 100)
        : charge.unit === 'm' ? moneyProduct([price, quantity, widthCm], 100)
        : charge.unit === 'm2' ? moneyProduct([price, quantity, widthCm, heightCm], 10000)
        : moneyProduct([price, quantity]);
      return { ...charge, price, quantity, billable_quantity: measure * quantity, total };
    });
  const totalFor = (kind: string) => roundMoney(lines.filter((line) => line.kind === kind).reduce((sum, line) => sum + toNumber(line.total), 0));
  const hasCatalogCharges = (spec.selected_charge_ids?.length || 0) > 0 || (spec.charge_lines?.length || 0) > 0 || lines.length > 0;
  const control = hasCatalogCharges ? totalFor(controlKind) : toNumber(spec.manual_control_total);
  const alexa = hasCatalogCharges ? totalFor('alexa') : spec.smart_integration
    ? moneyProduct([spec.alexa_quantity, pricingRate(spec, 'alexa', spec.alexa_unit_price, isB2B)]) : 0;
  const pelmet = hasCatalogCharges ? totalFor('pelmet') : spec.pelmet_enabled
    ? moneyProduct([spec.pelmet_width_cm, pricingRate(spec, 'pelmet', spec.pelmet_price_per_metre, isB2B)], 100) : 0;
  const addons = hasCatalogCharges ? totalFor('other') : toNumber(spec.addon_amount);
  return { fabric, motor, control, alexa, pelmet, addons, lines, total: roundMoney(fabric + motor + control + alexa + pelmet + addons) };
}

export function calculateCatalogSurfaceTotal(
  spec: SurfaceSpec, widthCm: number, heightCm: number,
  pricingUnit: string | undefined, charges: ChargeTemplate[], isB2B = false,
): number {
  return calculateSurfacePricing(spec, widthCm, heightCm, pricingUnit, charges, isB2B).total;
}

export function calculateQuotationTotals(subtotal: number, discountPercentage: number) {
  subtotal = roundMoney(subtotal);
  const discountAmount = moneyProduct([subtotal, discountPercentage], 100);
  const net = roundMoney(subtotal - discountAmount);
  const vat = moneyProduct([net, '0.05']);
  return { subtotal, discountAmount, vat, total: roundMoney(net + vat) };
}
