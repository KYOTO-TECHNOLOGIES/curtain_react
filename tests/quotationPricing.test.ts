import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SurfaceSpec } from '../src/api/quotations';
import type { ChargeTemplate } from '../src/api/catalog';
import { calculateQuotationTotals, calculateSurfacePricing, resolvedChargeIds } from '../src/lib/quotationPricing.ts';

const charges: ChargeTemplate[] = [
  { id: 1, name: 'Fitting', kind: 'motorized', unit: 'm', price: '10' },
  { id: 2, name: 'Alexa', kind: 'alexa', unit: 'flat', price: '50' },
  { id: 3, name: 'Pelmet', kind: 'pelmet', unit: 'm', price: '90' },
  { id: 4, name: 'Delivery', kind: 'other', unit: 'flat', price: '25' },
];
const spec: SurfaceSpec = {
  fabric_type: 1, model: 1, catalog_item: 1, fabric_code: '', unit_price_per_m2: '120',
  motor_type: 1, motor_control_type: 'motorized', motor_price_per_unit: '180', motor_quantity: 2, motor_pricing_unit: 'unit',
  selected_charge_ids: [1, 2, 3, 4], charge_lines: [{ id: 4, quantity: 3 }],
  smart_integration: true, alexa_quantity: 2, alexa_unit_price: '50',
  pelmet_enabled: true, pelmet_width_cm: '200', pelmet_price_per_metre: '90', addon_amount: 0,
  price_overrides: { fabric: '90', motor: '100', 'charge:2': '40', 'charge:3': '70', 'charge:4': '20' },
};

test('B2B preview matches server totals for rates, quantities, pelmet, and discount', () => {
  const result = calculateSurfacePricing(spec, 200, 300, 'm2', charges, true);
  assert.equal(result.fabric, 540);
  assert.equal(result.motor, 200);
  assert.equal(result.pelmet, 140);
  assert.equal(result.addons, 60);
  assert.equal(result.total, 1040);
  assert.deepEqual(calculateQuotationTotals(result.total, 10), { subtotal: 1040, discountAmount: 104, vat: 46.8, total: 982.8 });
});

test('B2C uses catalog prices even when overrides are present', () => {
  assert.equal(calculateSurfacePricing(spec, 200, 300, 'm2', charges, false).total, 1455);
});

test('running metre fabric uses length while motor and area charges use true m²', () => {
  const areaCharge: ChargeTemplate = { id: 5, name: 'Area charge', kind: 'other', unit: 'm2', price: '5' };
  const result = calculateSurfacePricing({ ...spec, motor_quantity: 1, motor_pricing_unit: 'm2', selected_charge_ids: [5], charge_lines: [{ id: 5, quantity: 2 }], smart_integration: false, pelmet_enabled: false, price_overrides: {} }, 200, 300, 'm', [areaCharge]);
  assert.equal(result.fabric, 240);
  assert.equal(result.motor, 1080);
  assert.equal(result.addons, 60);
  assert.equal(result.total, 1380);
});

test('currency lines round before discount and VAT', () => {
  const result = calculateSurfacePricing({ ...spec, motor_control_type: 'manual', motor_type: null, selected_charge_ids: [], charge_lines: [], smart_integration: false, pelmet_enabled: false, price_overrides: { fabric: '1.01' } }, 100, 50, 'm2', [], true);
  assert.equal(result.total, 0.51);
  assert.deepEqual(calculateQuotationTotals(result.total, 10), { subtotal: 0.51, discountAmount: 0.05, vat: 0.02, total: 0.48 });
});

test('zero-price B2B overrides are respected', () => {
  const result = calculateSurfacePricing({ ...spec, price_overrides: { fabric: '0', motor: '0', 'charge:1': '0', 'charge:2': '0', 'charge:3': '0', 'charge:4': '0' } }, 200, 300, 'm2', charges, true);
  assert.equal(result.total, 0);
});

test('quantity and discount changes update quotation totals', () => {
  assert.equal(calculateSurfacePricing({ ...spec, motor_quantity: 3 }, 200, 300, 'm2', charges, true).total, 1140);
  assert.equal(calculateQuotationTotals(2080, 0).total, 2184);
  assert.equal(calculateQuotationTotals(2080, 100).total, 0);
});

test('an explicitly removed control charge is not silently reselected', () => {
  assert.deepEqual(resolvedChargeIds({ ...spec, selected_charge_ids: [], smart_integration: false, pelmet_enabled: false }, charges), []);
});

test('removing an addon removes its amount', () => {
  const result = calculateSurfacePricing({ ...spec, selected_charge_ids: [1, 2, 3], charge_lines: [] }, 200, 300, 'm2', charges, true);
  assert.equal(result.addons, 0);
  assert.equal(result.total, 980);
});
