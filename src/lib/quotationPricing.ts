import type { ChargeTemplate, ChargeKind } from '../api/catalog';
import type { SurfaceSpec } from '../api/quotations';

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
    if (enabled && !existing && fallback) ids.push(fallback.id);
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

export function chargeAmount(
  charge: ChargeTemplate,
  widthCm: number,
  heightCm: number,
): number {
  const price = toNumber(charge.price);
  if (charge.unit === 'm') return price * (toNumber(widthCm) / 100);
  if (charge.unit === 'm2') {
    return price * ((toNumber(widthCm) * toNumber(heightCm)) / 10000);
  }
  return price;
}

export function calculateCatalogSurfaceTotal(
  spec: SurfaceSpec,
  widthCm: number,
  heightCm: number,
  pricingUnit: string | undefined,
  charges: ChargeTemplate[],
): number {
  const areaM2 = (toNumber(widthCm) * toNumber(heightCm)) / 10000;
  const widthM = toNumber(widthCm) / 100;
  const fabricQuantity = pricingUnit === 'flat' ? 1 : pricingUnit === 'm' ? widthM : areaM2;
  const fabricTotal = toNumber(spec.unit_price_per_m2) * fabricQuantity;
  const selected = resolvedChargeIds(spec, charges)
    .map((id) => charges.find((charge) => charge.id === id))
    .filter((charge): charge is ChargeTemplate => Boolean(charge));
  const controlKind = spec.motor_control_type === 'motorized' ? 'motorized' : 'manual';
  const controlTotal = selected
    .filter((charge) => charge.kind === controlKind)
    .reduce((sum, charge) => sum + chargeAmount(charge, widthCm, heightCm), 0);
  const motorTotal = spec.motor_control_type === 'motorized'
    ? areaM2 * toNumber(spec.motor_price_per_unit)
    : 0;
  const alexaCharge = selected.find((charge) => charge.kind === 'alexa');
  const alexaTotal = spec.smart_integration && alexaCharge
    ? toNumber(alexaCharge.price) * Math.max(0, toNumber(spec.alexa_quantity))
    : 0;
  const pelmetCharge = selected.find((charge) => charge.kind === 'pelmet');
  const pelmetTotal = spec.pelmet_enabled && pelmetCharge
    ? toNumber(pelmetCharge.price) * (toNumber(spec.pelmet_width_cm) / 100)
    : 0;
  const extrasTotal = selected
    .filter((charge) => charge.kind === 'other')
    .reduce((sum, charge) => sum + chargeAmount(charge, widthCm, heightCm), 0);

  return fabricTotal + controlTotal + motorTotal + alexaTotal + pelmetTotal + extrasTotal;
}
