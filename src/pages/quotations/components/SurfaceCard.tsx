import { useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Columns,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { formatAreaM2, formatDimensions, sentenceCase, formatMoney } from './helpers';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import type { SurfaceSpec } from '../../../api/quotations';
import type { ChargeTemplate } from '../../../api/catalog';
import {
  replaceChargeKind,
  resolvedChargeIds,
  selectedChargeIds,
} from '../../../lib/quotationPricing';

export interface Surface {
  surface_name?: string;
  width_cm?: number | string;
  height_cm?: number | string;
  surface_type?: string;
  opening_direction?: string;
  special_requirements?: string;
  spec?: {
    fabric_code?: string;
    catalog_item_name?: string;
    line_item_total?: string | number;
    motor_control_type?: string;
    smart_integration?: boolean;
    pelmet_enabled?: boolean;
    fabric_type?: number;
    model?: number;
    catalog_item?: number;
    unit_price_per_m2?: string | number;
    motor_type?: number | null;
    motor_price_per_unit?: string | number;
    alexa_quantity?: number;
    alexa_unit_price?: string | number;
    pelmet_width_cm?: string | number;
    pelmet_price_per_metre?: string | number;
    addon_label?: string;
    addon_amount?: string | number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Props {
  surface: Surface;
  isEditing?: boolean;
  onDelete?: () => void;
  onChangeSurface?: (
    field: 'surface_name' | 'surface_type' | 'width_cm' | 'height_cm' | 'opening_direction' | 'special_requirements',
    value: string
  ) => void;
  onUpdateSpec?: (specUpdates: Partial<SurfaceSpec>) => void;
  fabricTypes?: any[];
  models?: any[];
  items?: any[];
  motors?: any[];
  charges?: ChargeTemplate[];
  pricingUnit?: string;
  className?: string;
}

function getModelFabricTypeId(model: any): number {
  const raw = typeof model?.fabric_type === 'object' && model?.fabric_type !== null
    ? model.fabric_type.id
    : model?.fabric_type;
  return Number(raw) || 0;
}

function getItemModelId(item: any): number {
  const raw = typeof item?.model === 'object' && item?.model !== null
    ? item.model.id
    : item?.model;
  return Number(raw) || 0;
}

export default function SurfaceCard({
  surface,
  isEditing = false,
  onDelete,
  onChangeSurface,
  onUpdateSpec,
  fabricTypes = [],
  models = [],
  items = [],
  motors = [],
  charges = [],
  pricingUnit,
  className = '',
}: Props) {
  const dims = formatDimensions(surface.width_cm, surface.height_cm);
  const area = formatAreaM2(surface.width_cm, surface.height_cm);
  const opening = sentenceCase(surface.opening_direction || 'one_way');
  const isLeftToRight = (surface.opening_direction || 'one_way') === 'one_way';
  const isCenter = surface.opening_direction === 'two_way';

  // Compute area in m² for price calculations
  const w = Number(surface.width_cm) || 0;
  const h = Number(surface.height_cm) || 0;
  const areaM2 = (w * h) / 10000;

  const spec = surface.spec || {};
  const selectedFabricId = Number(spec.fabric_type) || 0;
  const filteredModels = selectedFabricId
    ? models.filter((m: any) => getModelFabricTypeId(m) === selectedFabricId)
    : [];
  const activeModel = filteredModels.find((m: any) => Number(m.id) === Number(spec.model));
  const selectedModelId = activeModel ? Number(activeModel.id) : 0;
  const filteredItems = selectedModelId
    ? items.filter((i: any) => getItemModelId(i) === selectedModelId)
    : [];
  const activeItem = filteredItems.find((i: any) => Number(i.id) === Number(spec.catalog_item));
  const selectedItemId = activeItem ? Number(activeItem.id) : 0;
  const selectedIds = resolvedChargeIds(spec as SurfaceSpec, charges);
  const selectedCharges = selectedIds
    .map((chargeId) => charges.find((charge) => charge.id === chargeId))
    .filter((charge): charge is ChargeTemplate => Boolean(charge));
  const selectedCharge = (kind: string) => selectedCharges.find((charge) => charge.kind === kind);
  const controlKind = spec.motor_control_type === 'motorized' ? 'motorized' : 'manual';
  const controlCharge = selectedCharge(controlKind);
  const alexaCharge = selectedCharge('alexa');
  const pelmetCharge = selectedCharge('pelmet');
  const extraCharges = charges.filter((charge) => charge.kind === 'other');
  const chargeOptions = (kind: string) => charges
    .filter((charge) => charge.kind === kind)
    .map((charge) => ({
      value: String(charge.id),
      label: charge.name,
      suffix: `AED ${Number(charge.price).toFixed(2)} ${charge.unit === 'flat' ? 'flat' : charge.unit === 'm' ? '/ m' : '/ m²'}`,
    }));

  const setSingleCharge = (kind: 'manual' | 'motorized' | 'alexa' | 'pelmet', chargeId: number | null) => {
    const charge = chargeId ? charges.find((item) => item.id === chargeId) : undefined;
    onUpdateSpec?.({
      selected_charge_ids: replaceChargeKind(spec as SurfaceSpec, charges, kind, chargeId),
      ...(kind === 'alexa' ? { alexa_unit_price: charge?.price ?? 0 } : {}),
      ...(kind === 'pelmet' ? { pelmet_price_per_metre: charge?.price ?? 0 } : {}),
    });
  };

  useEffect(() => {
    if (!isEditing || !onUpdateSpec || !selectedFabricId || models.length === 0) return;

    if (filteredModels.length === 0) {
      if (Number(spec.model) !== 0 || Number(spec.catalog_item) !== 0) {
        onUpdateSpec({ model: 0, catalog_item: 0 });
      }
      return;
    }

    if (!activeModel) {
      const nextModel =
        filteredModels.find((m: any) => items.some((i: any) => getItemModelId(i) === Number(m.id))) ||
        filteredModels[0];
      const nextItems = nextModel
        ? items.filter((i: any) => getItemModelId(i) === Number(nextModel.id))
        : [];
      const nextItem = nextItems[0];
      onUpdateSpec({
        model: nextModel ? Number(nextModel.id) : 0,
        catalog_item: nextItem ? Number(nextItem.id) : 0,
        unit_price_per_m2: nextItem ? String(nextItem.price_per_unit ?? spec.unit_price_per_m2 ?? '0') : '0',
      });
      return;
    }

    if (filteredItems.length === 0) {
      if (Number(spec.catalog_item) !== 0) {
        onUpdateSpec({ catalog_item: 0 });
      }
      return;
    }

    if (!activeItem) {
      const nextItem = filteredItems[0];
      onUpdateSpec({
        catalog_item: Number(nextItem.id),
        unit_price_per_m2: String(nextItem.price_per_unit ?? spec.unit_price_per_m2 ?? '0'),
      });
    }
  }, [
    isEditing,
    selectedFabricId,
    spec.model,
    spec.catalog_item,
    models,
    items,
    filteredModels.length,
    filteredItems.length,
    activeModel,
    activeItem,
  ]);

  if (isEditing && onChangeSurface && onUpdateSpec) {
    // Build select options filtered by current Fabric Type -> Model
    const fabricOptions = fabricTypes.map((f: any) => ({
      value: String(f.id),
      label: f.name,
    }));
    const modelOptions = filteredModels.map((m: any) => ({
      value: String(m.id),
      label: m.name,
    }));
    const itemOptions = filteredItems.map((i: any) => ({
      value: String(i.id),
      label: i.name,
      suffix: i.price_per_unit != null ? String(i.price_per_unit) : undefined,
    }));
    const motorOptions = motors.map((m: any) => ({
      value: String(m.id),
      label: m.name,
      suffix: m.price_per_m2 != null ? `AED ${m.price_per_m2} / m²` : undefined,
    }));

    const controlOptions = [
      { value: 'manual', label: 'Manual' },
      { value: 'motorized', label: 'Motorized' },
    ];

    const surfaceTypeOptions = [
      { value: 'window_curtain_path', label: 'Window (Curtain Path)' },
      { value: 'wall_to_wall_track', label: 'Wall-to-Wall Track' },
      { value: 'bay_window', label: 'Bay Window' },
      { value: 'sliding_door', label: 'Sliding Door' },
    ];

    const openingOptions = [
      { value: 'one_way', label: '1 Way (One-way draw)' },
      { value: 'two_way', label: '2 Way (Split draw)' },
    ];

    return (
      <div className={`qd-surface qd-surface--editing ${className}`}>
        <div className="space-y-4 p-1">
          {/* Surface Name & Delete */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Surface Name</label>
              <input
                type="text"
                value={surface.surface_name || ''}
                onChange={(e) => onChangeSurface('surface_name', e.target.value)}
                placeholder="Surface name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="mt-6 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-2 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                aria-label="Remove surface"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Surface Type & Opening Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Surface Type</label>
              <SelectMenu
                value={surface.surface_type || 'window_curtain_path'}
                options={surfaceTypeOptions}
                onChange={(val) => onChangeSurface('surface_type', val)}
                ariaLabel="Surface Type"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Opening Direction</label>
              <SelectMenu
                value={surface.opening_direction || 'one_way'}
                options={openingOptions}
                onChange={(val) => onChangeSurface('opening_direction', val)}
                ariaLabel="Opening Direction"
              />
            </div>
          </div>

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Width (cm)</label>
              <input
                type="number"
                value={surface.width_cm || ''}
                onChange={(e) => onChangeSurface('width_cm', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] text-sm font-medium text-slate-800 transition-all"
                placeholder="240"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={surface.height_cm || ''}
                onChange={(e) => onChangeSurface('height_cm', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] text-sm font-medium text-slate-800 transition-all"
                placeholder="310"
                min="0"
              />
            </div>
          </div>

          {/* Area Display */}
          <div className="flex items-center justify-between bg-[#EEF4FA] px-4 py-2.5 rounded-xl border border-[#D6E4F0]">
            <span className="text-xs font-semibold text-[#2F5D8F] uppercase tracking-wider">Calculated Area</span>
            <span className="text-sm font-bold text-slate-800">{areaM2.toFixed(2)} m²</span>
          </div>

          {/* Spec: Fabric Type, Model, Item */}
          <div className="border-t border-dashed border-slate-200 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D8F]"></span>
              Product Specification
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Fabric Type</label>
                <SelectMenu
                  value={selectedFabricId ? String(selectedFabricId) : ''}
                  options={fabricOptions}
                  onChange={(val) => {
                    const nextFabricId = Number(val);
                    const nextModels = models.filter((m: any) => getModelFabricTypeId(m) === nextFabricId);
                    const nextModel =
                      nextModels.find((m: any) => items.some((i: any) => getItemModelId(i) === Number(m.id))) ||
                      nextModels[0];
                    const nextItems = nextModel
                      ? items.filter((i: any) => getItemModelId(i) === Number(nextModel.id))
                      : [];
                    const nextItem = nextItems[0];
                    onUpdateSpec({
                      fabric_type: nextFabricId,
                      model: nextModel ? Number(nextModel.id) : 0,
                      catalog_item: nextItem ? Number(nextItem.id) : 0,
                      unit_price_per_m2: nextItem ? String(nextItem.price_per_unit ?? '0') : '0',
                    });
                  }}
                  ariaLabel="Fabric Type"
                  showPlaceholderOnEmpty
                  disabled={fabricOptions.length === 0}
                  placeholder={fabricOptions.length ? 'Select' : 'No fabric types available'}
                  emptyMessage="No fabric types available"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Model</label>
                <SelectMenu
                  value={selectedModelId ? String(selectedModelId) : ''}
                  options={modelOptions}
                  onChange={(val) => {
                    const nextModelId = Number(val);
                    const nextItems = items.filter((i: any) => getItemModelId(i) === nextModelId);
                    const nextItem = nextItems[0];
                    onUpdateSpec({
                      model: nextModelId,
                      catalog_item: nextItem ? Number(nextItem.id) : 0,
                      unit_price_per_m2: nextItem ? String(nextItem.price_per_unit ?? '0') : '0',
                    });
                  }}
                  ariaLabel="Model"
                  showPlaceholderOnEmpty
                  placeholder={modelOptions.length ? 'Select' : 'No model available'}
                  emptyMessage="No model available under this fabric type"
                />
                {selectedFabricId > 0 && modelOptions.length === 0 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    No model available under this fabric type
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Item</label>
                <SelectMenu
                  value={selectedItemId ? String(selectedItemId) : ''}
                  options={itemOptions}
                  onChange={(val) => {
                    const chosen = filteredItems.find((i: any) => Number(i.id) === Number(val));
                    onUpdateSpec({
                      catalog_item: Number(val),
                      unit_price_per_m2: chosen?.price_per_unit || spec.unit_price_per_m2,
                    });
                  }}
                  ariaLabel="Item"
                  showOptionSuffix
                  showPlaceholderOnEmpty
                  placeholder={itemOptions.length ? 'Select' : 'No item available'}
                  emptyMessage={
                    modelOptions.length === 0
                      ? 'No model or item available under this fabric type'
                      : 'No item available under this model'
                  }
                />
                {selectedFabricId > 0 && itemOptions.length === 0 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    {modelOptions.length === 0
                      ? 'No item available under this fabric type'
                      : 'No item available under this model'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Spec: Control Type & Motor */}
          <div className="border-t border-dashed border-slate-200 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Control & Options
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Control Type</label>
                <SelectMenu
                  value={spec.motor_control_type || 'manual'}
                  options={controlOptions}
                  onChange={(val) => {
                    const next = val as 'manual' | 'motorized';
                    const nextCharge = charges.find((charge) => charge.kind === next);
                    const ids = selectedChargeIds(spec as SurfaceSpec).filter((id) => {
                      const kind = charges.find((charge) => charge.id === id)?.kind;
                      return kind !== 'manual' && kind !== 'motorized' && (next === 'motorized' || kind !== 'alexa');
                    });
                    onUpdateSpec({
                      motor_control_type: next,
                      ...(next === 'manual' ? {
                        motor_type: null,
                        motor_price_per_unit: 0,
                        smart_integration: false,
                        alexa_quantity: 0,
                      } : {}),
                      selected_charge_ids: [...ids, ...(nextCharge ? [nextCharge.id] : [])],
                    });
                  }}
                  ariaLabel="Control Type"
                />
              </div>
              {spec.motor_control_type === 'motorized' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Motor Type</label>
                  <SelectMenu
                    value={spec.motor_type != null ? String(spec.motor_type) : ''}
                    options={[{ value: '', label: 'Select Motor' }, ...motorOptions]}
                    onChange={(val) => {
                      const motorId = val ? Number(val) : null;
                      const chosenMotor = motorId ? motors.find((m: any) => m.id === motorId) : null;
                      onUpdateSpec({
                        motor_type: motorId,
                        motor_price_per_unit: chosenMotor?.price_per_m2 ?? '0',
                      });
                    }}
                    ariaLabel="Motor Type"
                    showOptionSuffix
                    disabled={motorOptions.length === 0}
                    placeholder={motorOptions.length ? 'Select motor' : 'No motors'}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Control Charge</label>
                <SelectMenu
                  value={controlCharge ? String(controlCharge.id) : ''}
                  options={[
                    { value: '', label: 'No catalog charge' },
                    ...chargeOptions(controlKind),
                  ]}
                  onChange={(val) => setSingleCharge(controlKind, val ? Number(val) : null)}
                  ariaLabel="Control Charge"
                  showOptionSuffix
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={spec.smart_integration || false}
                  onChange={(e) => {
                    const fallback = alexaCharge ?? charges.find((charge) => charge.kind === 'alexa');
                    onUpdateSpec({
                      smart_integration: e.target.checked,
                      alexa_quantity: e.target.checked ? Math.max(1, Number(spec.alexa_quantity) || 1) : 0,
                      alexa_unit_price: e.target.checked ? fallback?.price ?? 0 : 0,
                      selected_charge_ids: replaceChargeKind(
                        spec as SurfaceSpec,
                        charges,
                        'alexa',
                        e.target.checked ? fallback?.id ?? null : null,
                      ),
                    });
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-[#2F5D8F] focus:ring-[#2F5D8F]"
                />
                <span className="text-xs font-semibold text-slate-700">Smart (Alexa)</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={spec.pelmet_enabled || false}
                  onChange={(e) => {
                    const fallback = pelmetCharge ?? charges.find((charge) => charge.kind === 'pelmet');
                    onUpdateSpec({
                      pelmet_enabled: e.target.checked,
                      pelmet_width_cm: e.target.checked && !Number(spec.pelmet_width_cm) ? w : spec.pelmet_width_cm,
                      pelmet_price_per_metre: e.target.checked ? fallback?.price ?? 0 : 0,
                      selected_charge_ids: replaceChargeKind(
                        spec as SurfaceSpec,
                        charges,
                        'pelmet',
                        e.target.checked ? fallback?.id ?? null : null,
                      ),
                    });
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-[#2F5D8F] focus:ring-[#2F5D8F]"
                />
                <span className="text-xs font-semibold text-slate-700">Add Pelmet</span>
              </label>
            </div>

            {/* Alexa fields */}
            {spec.smart_integration && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Alexa Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={spec.alexa_quantity || 0}
                    onChange={(e) => onUpdateSpec({ alexa_quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Alexa Option</label>
                  <SelectMenu
                    value={alexaCharge ? String(alexaCharge.id) : ''}
                    options={chargeOptions('alexa')}
                    onChange={(val) => setSingleCharge('alexa', Number(val))}
                    ariaLabel="Alexa Option"
                    showOptionSuffix
                  />
                </div>
              </div>
            )}

            {/* Pelmet fields */}
            {spec.pelmet_enabled && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Pelmet Width (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={spec.pelmet_width_cm || 0}
                    onChange={(e) => onUpdateSpec({ pelmet_width_cm: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Pelmet Option</label>
                  <SelectMenu
                    value={pelmetCharge ? String(pelmetCharge.id) : ''}
                    options={chargeOptions('pelmet')}
                    onChange={(val) => setSingleCharge('pelmet', Number(val))}
                    ariaLabel="Pelmet Option"
                    showOptionSuffix
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spec: Pricing */}
          <div className="border-t border-dashed border-slate-200 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Pricing
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Unit Price {pricingUnit === 'm' ? '/ m' : '/ m²'} (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={spec.unit_price_per_m2 || ''}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Fabric Code</label>
                <input
                  type="text"
                  value={spec.fabric_code || ''}
                  onChange={(e) => onUpdateSpec({ fabric_code: e.target.value })}
                  placeholder="e.g., FC-001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 text-sm font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Add-on */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {extraCharges.length === 0 ? (
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                  No additional catalog charges.
                </div>
              ) : extraCharges.map((charge) => (
                <label key={charge.id} className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <span className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(charge.id)}
                      onChange={(event) => {
                        const ids = selectedChargeIds(spec as SurfaceSpec);
                        onUpdateSpec({
                          selected_charge_ids: event.target.checked
                            ? Array.from(new Set([...ids, charge.id]))
                            : ids.filter((id) => id !== charge.id),
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#2F5D8F] focus:ring-[#2F5D8F]"
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate">{charge.name}</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">AED {Number(charge.price).toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Special Requirements</label>
            <textarea
              rows={2}
              value={surface.special_requirements || ''}
              onChange={(e) => onChangeSurface('special_requirements', e.target.value)}
              placeholder="e.g., Needs blackout lining..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 text-sm font-medium resize-none placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>
      </div>
    );
  }

  // Read-only mode (unchanged)
  return (
    <div className={`qd-surface ${className}`}>
      <div className="qd-surface-top">
        {/* Architectural curtain sketch thumbnail */}
        <div className="qd-surface-sketch" aria-hidden="true">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#2F5D8F]"
          >
            {/* Window frame backdrop */}
            <rect
              x="6"
              y="8"
              width="44"
              height="40"
              rx="6"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Curtain rod */}
            <line
              x1="4"
              y1="12"
              x2="52"
              y2="12"
              stroke="#2F5D8F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left finial & right finial */}
            <circle cx="4" cy="12" r="2" fill="#2F5D8F" />
            <circle cx="52" cy="12" r="2" fill="#2F5D8F" />
            {/* Curtain drapery waves */}
            <path
              d="M10 13 C12 24 10 36 12 44 C13 44 14 44 15 44 C13 36 15 24 13 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.18"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            <path
              d="M16 13 C18 24 16 36 18 44 C19 44 20 44 21 44 C19 36 21 24 19 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.28"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            {/* Right curtain drapery waves */}
            <path
              d="M35 13 C37 24 35 36 37 44 C38 44 39 44 40 44 C38 36 40 24 38 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.28"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            <path
              d="M41 13 C43 24 41 36 43 44 C44 44 45 44 46 44 C44 36 46 24 44 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.18"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Info content */}
        <div className="qd-surface-info">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="qd-surface-name-row">
              <span className="qd-surface-name">
                {surface.surface_name || 'Unnamed Surface'}
              </span>
              {dims && <span className="qd-dim-chip">{dims}</span>}
            </div>

            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                aria-label="Remove surface"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="qd-surface-meta">
            {area && (
              <span className="qd-meta-pill">
                <Maximize2 />
                <span>{area}</span>
              </span>
            )}
            <span className="qd-meta-pill">
              <span>{sentenceCase(surface.surface_type || 'Window')}</span>
            </span>
            <span className="qd-meta-pill">
              {isCenter ? (
                <Columns />
              ) : isLeftToRight ? (
                <ArrowRight />
              ) : (
                <ArrowLeft />
              )}
              <span>{opening}</span>
            </span>
            {surface.spec?.motor_control_type === 'motorized' && (
              <span className="qd-meta-pill bg-purple-50 text-purple-700 font-medium">
                ⚡ Motorized
              </span>
            )}
          </div>

          {/* Spec breakdown box */}
          <div className="qd-surface-footer">
            <div>
              <div className="qd-surface-footer-label">Fabric Code</div>
              <div className="qd-surface-footer-value">
                {surface.spec?.fabric_code || '—'}
              </div>
            </div>
            <div>
              <div className="qd-surface-footer-label">Catalog Item</div>
              <div className="qd-surface-footer-value truncate">
                {surface.spec?.catalog_item_name || 'Standard'}
              </div>
            </div>

            <div className="qd-surface-total-row">
              <span className="qd-surface-total-label">Line Total</span>
              <span className="qd-surface-total-value">
                <span className="qd-surface-total-prefix">AED</span>
                {formatMoney(surface.spec?.line_item_total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
