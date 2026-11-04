import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Banknote,
  ChevronDown,
  Layers3,
  Mic,
  PanelTop,
  Pencil,
  PlusSquare,
  Receipt,
  SlidersHorizontal,
  Tag,
  Trash2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { SelectMenu, type SelectOption } from '../../../components/ui/SelectMenu';
import type {
  CatalogItem,
  CatalogModel,
  ChargeTemplate,
  FabricType,
  MotorType,
  WorkTypeFeatures,
} from '../../../api/catalog';
import type { SurfaceSpec } from '../../../api/quotations';
import {
  chargeAmount as calcChargeAmount,
  chargeUnitText as unitTextFor,
  isOtherCharge,
  resolveOtherCharges,
  toNum,
} from '../utils/pricing';

export interface BuilderSurface {
  tempId: string;
  surface_name: string;
  surface_type: string;
  width_cm: number;
  height_cm: number;
  opening_direction?: string;
  special_requirements?: string;
  spec: SurfaceSpec;
}

interface Props {
  surface: BuilderSurface;
  fabricTypes: FabricType[];
  models: CatalogModel[];
  items: CatalogItem[];
  motors: MotorType[];
  features?: Partial<WorkTypeFeatures>;
  workTypeName?: string;
  pricingUnit?: string;
  charges?: ChargeTemplate[];
  /** B2B quotations allow prices to be edited inline; B2C always uses catalog rates. */
  isB2B?: boolean;
  fieldErrors?: Record<string, string>;
  onDelete: () => void;
  onUpdateSpec: (updates: Partial<SurfaceSpec>) => void;
  onUpdateSurface?: (updates: Partial<BuilderSurface>) => void;
  calculateTotal: (spec: SurfaceSpec, widthCm: number, heightCm: number) => string;
}

function getModelFabricTypeId(model: CatalogModel): number {
  const raw = typeof model.fabric_type === 'object' && model.fabric_type !== null
    ? (model.fabric_type as any).id
    : model.fabric_type;
  return Number(raw) || 0;
}

function getItemModelId(item: CatalogItem): number {
  const raw = typeof item.model === 'object' && item.model !== null
    ? (item.model as any).id
    : item.model;
  return Number(raw) || 0;
}

function capitalizeDisplay(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="qbc-field">
      <div className="flex items-baseline justify-between mb-1">
        <label className="qbc-field-label" htmlFor={id}>{label}</label>
        {hint && <span className="text-[11px] text-slate-400 font-normal">{hint}</span>}
      </div>
      {children}
      {error && <span className="text-xs text-rose-500 font-medium mt-1 block">{error}</span>}
    </div>
  );
}

/** Money input that keeps raw text while focused so formatted values don't fight typing. */
function MoneyInput({
  id,
  value,
  onChange,
  step = '0.01',
  readOnly = false,
  editable = false,
  className = '',
  ariaLabel,
}: {
  id: string;
  value: string | number;
  onChange?: (val: string) => void;
  step?: string;
  readOnly?: boolean;
  editable?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? '' : String(value));
  return (
    <div
      className={`qbc-price-control${readOnly ? ' is-readonly' : ''}${editable && !readOnly ? ' is-editable' : ''} ${className}`.trim()}
    >
      <span className="qbc-currency" aria-hidden="true">AED</span>
      <input
        id={id}
        type="number"
        step={step}
        min="0"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        value={shown}
        readOnly={readOnly}
        onFocus={() => !readOnly && setDraft(value == null ? '' : String(value))}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          if (readOnly) return;
          setDraft(event.target.value);
          onChange?.(event.target.value);
        }}
        className="qbc-price-input"
      />
      {readOnly && <Lock size={12} className="qbc-price-lock" aria-hidden="true" />}
    </div>
  );
}

function PriceField({
  id,
  label,
  value,
  onChange,
  step = '0.01',
  readOnly = false,
  editable = false,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange?: (val: string) => void;
  step?: string;
  readOnly?: boolean;
  editable?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <MoneyInput id={id} value={value} onChange={onChange} step={step} readOnly={readOnly} editable={editable} />
    </Field>
  );
}

function OptionTile({
  id,
  checked,
  onChange,
  label,
  icon: Icon,
  disabled = false,
  tooltip,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon: typeof Mic;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <label
      className={`qbc-option-tile${checked ? ' is-checked' : ''}${disabled ? ' opacity-55 cursor-not-allowed' : ''}`}
      htmlFor={id}
      title={tooltip}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          onChange(event.target.checked);
        }}
        className="qbc-option-input"
      />
      <span className="qbc-option-icon">
        {disabled ? <Lock size={15} className="text-amber-600" /> : <Icon size={16} aria-hidden="true" />}
      </span>
      <span className="qbc-option-label">{label}</span>
      <span className="qbc-switch" aria-hidden="true"><span /></span>
    </label>
  );
}

function SurfaceSketch({ surface }: { surface: BuilderSurface }) {
  const ratio = Math.min(2.5, Math.max(0.4, surface.width_cm / (surface.height_cm || 1)));
  const width = ratio >= 1 ? 34 : 34 * ratio;
  const height = ratio >= 1 ? 34 / ratio : 34;
  const x = (52 - width) / 2;
  const y = (52 - height) / 2 + 2;

  return (
    <span className="qbc-sketch" aria-hidden="true">
      <svg viewBox="0 0 52 52">
        <line x1="8" y1="8" x2="44" y2="8" className="qbc-sketch-rail" />
        <rect x={x} y={y} width={width} height={height} rx="3" className="qbc-sketch-frame" />
        {surface.surface_type === 'window' && (
          <>
            <line x1={x} y1={y + height / 2} x2={x + width} y2={y + height / 2} className="qbc-sketch-mullion" />
            <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} className="qbc-sketch-mullion" />
          </>
        )}
        {surface.surface_type === 'door' && (
          <circle cx={x + width - 4} cy={y + height / 2} r="1.5" className="qbc-sketch-knob" />
        )}
      </svg>
    </span>
  );
}

export default function BuilderSurfaceCard({
  surface,
  fabricTypes,
  models,
  items,
  motors,
  features,
  workTypeName,
  pricingUnit,
  charges = [],
  isB2B = false,
  fieldErrors = {},
  onDelete,
  onUpdateSpec,
  onUpdateSurface,
  calculateTotal,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [announcedTotal, setAnnouncedTotal] = useState('');
  const prevTotalRef = useRef<number | null>(null);

  const safeId = surface.tempId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const areaM2 = Number(((surface.width_cm * surface.height_cm) / 10000).toFixed(2));
  const rawTotal = calculateTotal(surface.spec, surface.width_cm, surface.height_cm);
  const total = parseFloat(rawTotal) || 0;
  const totalDisplay = Number(rawTotal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    if (prevTotalRef.current !== null && prevTotalRef.current !== total) {
      setIsPulsing(true);
      const pulseTimer = setTimeout(() => setIsPulsing(false), 240);
      const announceTimer = setTimeout(() => {
        setAnnouncedTotal(`Line total updated to AED ${totalDisplay}`);
      }, 400);
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(announceTimer);
      };
    }
    prevTotalRef.current = total;
  }, [total, totalDisplay]);

  const surfaceLabel = surface.surface_name
    ? `${surface.surface_name} (${capitalizeDisplay(surface.surface_type)})`
    : capitalizeDisplay(surface.surface_type);

  const selectedFabricId = Number(surface.spec.fabric_type) || 0;
  const selectedFabric = fabricTypes.find((f) => Number(f.id) === selectedFabricId);
  const filteredModels = selectedFabricId
    ? models.filter((m) => getModelFabricTypeId(m) === selectedFabricId)
    : [];
  const selectedModel = filteredModels.find((m) => Number(m.id) === Number(surface.spec.model));
  const selectedModelId = selectedModel ? Number(selectedModel.id) : 0;
  const filteredItems = selectedModelId
    ? items.filter((i) => getItemModelId(i) === selectedModelId)
    : [];
  const selectedItem = filteredItems.find((i) => Number(i.id) === Number(surface.spec.catalog_item));
  const selectedItemId = selectedItem ? Number(selectedItem.id) : 0;
  const selectedMotor = surface.spec.motor_type ? motors.find((m) => m.id === surface.spec.motor_type) : null;

  useEffect(() => {
    if (!selectedFabricId || models.length === 0) return;

    if (filteredModels.length === 0) {
      if (Number(surface.spec.model) !== 0 || Number(surface.spec.catalog_item) !== 0) {
        onUpdateSpec({ model: 0, catalog_item: 0, unit_price_per_m2: '0' });
      }
      return;
    }

    if (!selectedModel) {
      const nextModel =
        filteredModels.find((m) => items.some((i) => getItemModelId(i) === Number(m.id))) ||
        filteredModels[0];
      const nextItems = nextModel
        ? items.filter((i) => getItemModelId(i) === Number(nextModel.id))
        : [];
      const nextItem = nextItems[0];
      onUpdateSpec({
        model: nextModel ? Number(nextModel.id) : 0,
        catalog_item: nextItem ? Number(nextItem.id) : 0,
        unit_price_per_m2: nextItem ? String(nextItem.price_per_unit ?? '0') : '0',
      });
      return;
    }

    if (filteredItems.length === 0) {
      if (Number(surface.spec.catalog_item) !== 0) {
        onUpdateSpec({ catalog_item: 0, unit_price_per_m2: '0' });
      }
      return;
    }

    if (!selectedItem) {
      const nextItem = filteredItems[0];
      onUpdateSpec({
        catalog_item: Number(nextItem.id),
        unit_price_per_m2: String(nextItem.price_per_unit ?? '0'),
      });
    }
  }, [
    selectedFabricId,
    surface.spec.model,
    surface.spec.catalog_item,
    models,
    items,
    filteredModels.length,
    filteredItems.length,
    selectedModel,
    selectedItem,
  ]);

  const summaries = [
    selectedFabric?.name || selectedModel?.name || selectedItem?.name,
    capitalizeDisplay(surface.spec.motor_control_type),
    surface.spec.smart_integration ? 'Smart' : null,
    surface.spec.pelmet_enabled ? 'Pelmet' : null,
    surface.spec.addon_label ? `+${surface.spec.addon_label}` : null,
  ].filter(Boolean) as string[];

  const fabricOptions: SelectOption[] = fabricTypes.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
  const modelOptions: SelectOption[] = filteredModels.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
  const itemOptions: SelectOption[] = filteredItems.map((item) => ({
    value: String(item.id),
    label: item.name,
    suffix: item.price_per_unit == null ? undefined : String(item.price_per_unit),
  }));

  // Work type feature allowances
  const allowMotor = features?.motor !== false;
  const allowCharges = features?.charges !== false;
  const allowPelmet = features?.pelmet !== false;
  const allowDraw = features?.draw !== false;

  // Control Options (Motorized disabled with lock & tooltip if motor is off)
  const controlOptions: SelectOption[] = [
    { value: 'manual', label: 'Manual' },
    {
      value: 'motorized',
      label: 'Motorized',
      disabled: !allowMotor,
      icon: !allowMotor ? <Lock size={13} className="text-rose-500" /> : undefined,
      suffix: !allowMotor ? 'Locked' : undefined,
      tooltip: !allowMotor ? `Motors aren't enabled for ${workTypeName || 'this work type'}` : undefined,
    },
  ];

  // Motor Options
  const motorOptions: SelectOption[] = motors.map((item) => ({
    value: String(item.id),
    label: item.name,
    suffix: item.price_per_m2 == null ? undefined : `AED ${item.price_per_m2} / m²`,
  }));

  // Opening Direction Options
  const drawOptions: SelectOption[] = [
    { value: 'one_way', label: '1 Way (One-way draw)' },
    {
      value: 'two_way',
      label: '2 Way (Split draw)',
      disabled: !allowDraw,
      icon: !allowDraw ? <Lock size={13} className="text-rose-500" /> : undefined,
      suffix: !allowDraw ? 'Locked' : undefined,
      tooltip: !allowDraw ? `Opening direction is locked to 1 way for ${workTypeName || 'this work type'}` : undefined,
    },
  ];

  // Catalog charge templates (set up in Catalog > Charges)
  const chargeFor = (kind: string) => charges.find((charge) => charge.kind === kind);
  const manualCharge = chargeFor('manual');
  const motorizedCharge = chargeFor('motorized');
  const alexaCharge = chargeFor('alexa');
  const pelmetCharge = chargeFor('pelmet');
  const chargeAmount = (charge: ChargeTemplate | undefined, widthCm: number) =>
    calcChargeAmount(charge, widthCm, surface.height_cm);
  const chargeUnitText = (charge: ChargeTemplate) => unitTextFor(charge.unit);
  const isMotorized = surface.spec.motor_control_type === 'motorized';
  const motorQuantity = Math.max(1, Number(surface.spec.motor_quantity) || 1);
  const motorUnitTotal = selectedMotor ? areaM2 * Number(selectedMotor.price_per_m2 || 0) : 0;
  const controlCharge = isMotorized ? motorizedCharge : manualCharge;
  const controlChargeTotal = chargeAmount(controlCharge, surface.width_cm);
  const alexaTotal = surface.spec.smart_integration
    ? (Number(surface.spec.alexa_unit_price) || 0) * (Number(surface.spec.alexa_quantity) || 0)
    : 0;
  const pelmetTotal = surface.spec.pelmet_enabled
    ? (Number(surface.spec.pelmet_price_per_metre) || 0) * ((Number(surface.spec.pelmet_width_cm) || 0) / 100)
    : 0;
  const money = (value: number) => value.toFixed(2);
  const motorPriceTotal = isMotorized ? toNum(surface.spec.motor_price_per_unit) : 0;

  // Other charges (catalog charges of kind "other") shown in the Add-on section
  const otherChargeTemplates = charges.filter(isOtherCharge);
  const selectedOtherCharges = surface.spec.other_charges || [];
  const resolvedOtherCharges = resolveOtherCharges(surface.spec, charges, surface.width_cm, surface.height_cm, isB2B);
  const otherChargesTotal = resolvedOtherCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const customAddonAmount = toNum(surface.spec.addon_amount);
  const toggleOtherCharge = (template: ChargeTemplate, checked: boolean) => {
    const rest = selectedOtherCharges.filter((charge) => Number(charge.id) !== Number(template.id));
    onUpdateSpec({
      other_charges: checked ? [...rest, { id: Number(template.id), name: template.name }] : rest,
    });
  };
  const setOtherChargeAmount = (id: number, amount: string) => {
    onUpdateSpec({
      other_charges: selectedOtherCharges.map((charge) =>
        Number(charge.id) === id ? { ...charge, amount } : charge
      ),
    });
  };

  // Catalog fabric pricing (respects the work type's pricing unit)
  const catalogUnitPrice = parseFloat(String(surface.spec.unit_price_per_m2)) || 0;
  const catalogItemPrice = toNum(selectedItem?.price_per_unit);
  const isCustomUnitPrice = isB2B && !!selectedItem && Math.abs(catalogItemPrice - catalogUnitPrice) > 0.0001;
  const isFlat = pricingUnit === 'flat';
  const isPerMetre = pricingUnit === 'm';
  const unitLabel = isFlat ? 'flat' : isPerMetre ? 'per m' : 'per m²';
  const fabricQuantity = isFlat ? 1 : isPerMetre ? surface.width_cm / 100 : areaM2;
  const fabricTotal = catalogUnitPrice * fabricQuantity;
  const fabricFormula = isFlat
    ? 'Flat rate'
    : `${Number(fabricQuantity.toFixed(2))} ${isPerMetre ? 'm' : 'm²'} × AED ${catalogUnitPrice.toFixed(2)}`;

  return (
    <article className="qbc-surface-card">
      <header className="qbc-surface-header">
        <SurfaceSketch surface={surface} />
        <div className="qbc-surface-title-block">
          <h3 className="qbc-surface-name" title={surfaceLabel}>{surfaceLabel}</h3>
          <div className="qbc-surface-chips">
            <span className="qbc-dimension-chip">
              {surface.width_cm} × {surface.height_cm} cm
            </span>
            <span className="qbc-area-chip">{areaM2} m<sup>2</sup></span>
          </div>
          {!isExpanded && (
            <div className="qbc-collapsed-summary">
              {summaries.map((summary, index) => <span key={`${summary}-${index}`}>{summary}</span>)}
            </div>
          )}
        </div>
        <div className="qbc-surface-actions">
          <button
            type="button"
            className="qbc-delete-button qbc-delete-button--surface"
            onClick={onDelete}
            aria-label={`Remove surface ${surfaceLabel}`}
            title="Remove surface"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`qbc-collapse-button${isExpanded ? ' is-open' : ''}`}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-controls={`surface-panel-${safeId}`}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${surfaceLabel}`}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
        {!isExpanded && (
          <div className="qbc-collapsed-total">
            <span>Line total</span>
            <strong>AED {Number(calculateTotal(surface.spec, surface.width_cm, surface.height_cm)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        )}
      </header>

      <div
        id={`surface-panel-${safeId}`}
        className={`qbc-surface-panel${isExpanded ? ' is-expanded' : ''}`}
        aria-hidden={!isExpanded}
        inert={!isExpanded}
      >
        <div className="qbc-surface-panel-inner">
          {/* Section: Product */}
          <section className="qbc-section" role="group" aria-labelledby={`product-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--product" id={`product-heading-${safeId}`}>
              <span className="qbc-section-icon"><Layers3 size={14} aria-hidden="true" /></span>
              <span>Product</span>
            </h3>
            <div className="qbc-product-grid">
              <Field id={`fabric-${safeId}`} label="Fabric Type" error={fieldErrors.fabric_type}>
                <SelectMenu
                  id={`fabric-${safeId}`}
                  value={selectedFabricId ? String(selectedFabricId) : ''}
                  options={fabricOptions}
                  onChange={(value) => {
                    const nextFabricId = Number(value);
                    const nextModels = models.filter((m) => getModelFabricTypeId(m) === nextFabricId);
                    const nextModel =
                      nextModels.find((m) => items.some((i) => getItemModelId(i) === Number(m.id))) ||
                      nextModels[0];
                    const nextItems = nextModel
                      ? items.filter((i) => getItemModelId(i) === Number(nextModel.id))
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
                  placeholder={fabricOptions.length ? 'Select fabric type' : 'No fabric types available'}
                  emptyMessage="No fabric types available"
                />
              </Field>
              <Field id={`model-${safeId}`} label="Model" error={fieldErrors.model}>
                <SelectMenu
                  id={`model-${safeId}`}
                  value={selectedModelId ? String(selectedModelId) : ''}
                  options={modelOptions}
                  onChange={(value) => {
                    const nextModelId = Number(value);
                    const nextItems = items.filter((i) => getItemModelId(i) === nextModelId);
                    const nextItem = nextItems[0];
                    onUpdateSpec({
                      model: nextModelId,
                      catalog_item: nextItem ? Number(nextItem.id) : 0,
                      unit_price_per_m2: nextItem ? String(nextItem.price_per_unit ?? '0') : '0',
                    });
                  }}
                  ariaLabel="Model"
                  showPlaceholderOnEmpty
                  placeholder={modelOptions.length ? 'Select model' : 'No model available'}
                  emptyMessage="No model available under this fabric type"
                />
                {selectedFabricId > 0 && modelOptions.length === 0 && (
                  <span className="text-xs text-amber-600 font-medium mt-1 block">
                    No model available under this fabric type
                  </span>
                )}
              </Field>
              <Field id={`item-${safeId}`} label="Item" error={fieldErrors.catalog_item}>
                <SelectMenu
                  id={`item-${safeId}`}
                  value={selectedItemId ? String(selectedItemId) : ''}
                  options={itemOptions}
                  onChange={(value) => {
                    const chosen = filteredItems.find((item) => Number(item.id) === Number(value));
                    onUpdateSpec({
                      catalog_item: Number(value),
                      unit_price_per_m2: chosen?.price_per_unit || surface.spec.unit_price_per_m2,
                    });
                  }}
                  ariaLabel="Item"
                  showOptionSuffix
                  showPlaceholderOnEmpty
                  placeholder={itemOptions.length ? 'Select item' : 'No item available'}
                  emptyMessage={
                    modelOptions.length === 0
                      ? 'No model or item available under this fabric type'
                      : 'No item available under this model'
                  }
                />
                {selectedFabricId > 0 && itemOptions.length === 0 && (
                  <span className="text-xs text-amber-600 font-medium mt-1 block">
                    {modelOptions.length === 0
                      ? 'No item available under this fabric type'
                      : 'No item available under this model'}
                  </span>
                )}
              </Field>
            </div>

            {/* Fabric pricing from catalog, optional custom code, special requirements */}
            <div className="qbc-product-grid mt-3">
              <Field
                id={`fabric-code-${safeId}`}
                label="Custom Fabric Code"
                hint="Optional"
                error={fieldErrors.fabric_code}
              >
                <input
                  id={`fabric-code-${safeId}`}
                  type="text"
                  autoComplete="off"
                  value={surface.spec.fabric_code || ''}
                  onChange={(event) => onUpdateSpec({ fabric_code: event.target.value })}
                  placeholder="e.g. FB-2041"
                  className="qbc-input"
                />
              </Field>
              <Field
                id={`catalog-unit-price-${safeId}`}
                label={`Unit Price (${unitLabel})`}
                hint={isB2B ? (isCustomUnitPrice ? `Catalog AED ${catalogItemPrice.toFixed(2)}` : 'Editable · B2B') : 'From catalog'}
                error={fieldErrors.unit_price_per_m2}
              >
                <MoneyInput
                  id={`catalog-unit-price-${safeId}`}
                  value={isB2B ? surface.spec.unit_price_per_m2 : catalogUnitPrice.toFixed(2)}
                  readOnly={!isB2B}
                  editable={isB2B}
                  onChange={(value) => onUpdateSpec({ unit_price_per_m2: value })}
                />
                {isCustomUnitPrice && (
                  <button
                    type="button"
                    className="qbc-reset-link"
                    onClick={() => onUpdateSpec({ unit_price_per_m2: String(selectedItem?.price_per_unit ?? '0') })}
                  >
                    Reset to catalog price
                  </button>
                )}
              </Field>
              <Field id={`fabric-total-${safeId}`} label="Fabric Total" hint={fabricFormula}>
                <MoneyInput id={`fabric-total-${safeId}`} value={fabricTotal.toFixed(2)} readOnly />
              </Field>
            </div>
            <div className="mt-3">
              <Field id={`special-requirements-${safeId}`} label="Special Requirements" hint="Optional">
                <textarea
                  id={`special-requirements-${safeId}`}
                  rows={3}
                  value={surface.special_requirements || ''}
                  onChange={(event) => onUpdateSurface?.({ special_requirements: event.target.value })}
                  placeholder="e.g. Needs blackout lining..."
                  className="qbc-input"
                  style={{ resize: 'vertical' }}
                />
              </Field>
            </div>
          </section>

          {/* Section: Control & Options */}
          <section className="qbc-section" role="group" aria-labelledby={`control-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--control" id={`control-heading-${safeId}`}>
              <span className="qbc-section-icon"><SlidersHorizontal size={14} aria-hidden="true" /></span>
              <span>Control and options</span>
            </h3>

            {/* Incompatible Existing Values Amber Warnings */}
            {surface.spec.motor_control_type === 'motorized' && !allowMotor && (
              <div className="catalog-notice--amber mb-3">
                <AlertTriangle size={15} />
                <span>Motorized control is selected, but Motors are disabled for {workTypeName || 'this work type'}.</span>
              </div>
            )}
            {surface.spec.smart_integration && !allowCharges && (
              <div className="catalog-notice--amber mb-3">
                <AlertTriangle size={15} />
                <span>Smart Integration (Alexa) is selected, but Control &amp; Charges are disabled for {workTypeName || 'this work type'}.</span>
              </div>
            )}
            {surface.spec.pelmet_enabled && !allowPelmet && (
              <div className="catalog-notice--amber mb-3">
                <AlertTriangle size={15} />
                <span>Pelmet is enabled, but Pelmet feature is disabled for {workTypeName || 'this work type'}.</span>
              </div>
            )}
            {surface.opening_direction && surface.opening_direction !== 'one_way' && !allowDraw && (
              <div className="catalog-notice--amber mb-3">
                <AlertTriangle size={15} />
                <span>Opening direction is set to {surface.opening_direction}, but Opening Direction is disabled for {workTypeName || 'this work type'}.</span>
              </div>
            )}

            <div className="qbc-control-grid">
              <Field id={`control-${safeId}`} label="Control" error={fieldErrors.motor_control_type}>
                <SelectMenu
                  id={`control-${safeId}`}
                  value={surface.spec.motor_control_type}
                  options={controlOptions}
                  onChange={(value) => {
                    const next = value as 'manual' | 'motorized';
                    // Alexa / smart integration only applies to motorized control
                    onUpdateSpec(
                      next === 'manual'
                        ? { motor_control_type: next, smart_integration: false, alexa_quantity: 0, motor_quantity: 1 }
                        : { motor_control_type: next }
                    );
                  }}
                  ariaLabel="Control"
                />
              </Field>

              {/* Option Tiles (Alexa & Pelmet disabled with lock tooltip if feature is off) */}
              <div className="qbc-option-grid">
                {isMotorized && (
                  <OptionTile
                    id={`alexa-${safeId}`}
                    checked={surface.spec.smart_integration}
                    disabled={!allowCharges}
                    tooltip={!allowCharges ? `Control & Charges aren't enabled for ${workTypeName || 'this work type'}` : undefined}
                    onChange={(checked) =>
                      onUpdateSpec(
                        checked
                          ? {
                            smart_integration: true,
                            alexa_quantity: Math.max(1, Number(surface.spec.alexa_quantity) || 1),
                            alexa_unit_price:
                              Number(surface.spec.alexa_unit_price) > 0 ? surface.spec.alexa_unit_price : alexaCharge?.price ?? '0',
                          }
                          : { smart_integration: false, alexa_quantity: 0 }
                      )
                    }
                    label="Smart Integration (Alexa)"
                    icon={Mic}
                  />
                )}
                <OptionTile
                  id={`pelmet-${safeId}`}
                  checked={surface.spec.pelmet_enabled}
                  disabled={!allowPelmet}
                  tooltip={!allowPelmet ? `Pelmet isn't enabled for ${workTypeName || 'this work type'}` : undefined}
                  onChange={(checked) =>
                    onUpdateSpec(
                      checked
                        ? {
                          pelmet_enabled: true,
                          pelmet_width_cm:
                            toNum(surface.spec.pelmet_width_cm) > 0 ? surface.spec.pelmet_width_cm : String(surface.width_cm),
                          pelmet_price_per_metre:
                            toNum(surface.spec.pelmet_price_per_metre) > 0
                              ? surface.spec.pelmet_price_per_metre
                              : pelmetCharge?.price ?? '0',
                        }
                        : { pelmet_enabled: false }
                    )
                  }
                  label="Add Pelmet"
                  icon={PanelTop}
                />
              </div>
            </div>

            {/* Opening Direction (draw feature) */}
            <div className="mt-3">
              <Field id={`draw-${safeId}`} label="Opening Direction" error={fieldErrors.opening_direction}>
                <SelectMenu
                  id={`draw-${safeId}`}
                  value={surface.opening_direction || 'one_way'}
                  options={drawOptions}
                  onChange={(val) => onUpdateSurface?.({ opening_direction: val })}
                  ariaLabel="Opening Direction"
                />
              </Field>
            </div>

            {/* Extra Fields for Motor, Alexa, Pelmet */}
            {(surface.spec.motor_control_type === 'motorized' || surface.spec.smart_integration || surface.spec.pelmet_enabled) && (
              <div className="qbc-extra-fields mt-3">
                {/* Motor Type Selection */}
                {surface.spec.motor_control_type === 'motorized' && (
                  <div className="col-span-full">
                    <Field id={`motor-${safeId}`} label="Motor Type" error={fieldErrors.motor_type}>
                      {allowMotor && motors.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                          No motors selected for this work type yet.
                        </div>
                      ) : (
                        <SelectMenu
                          id={`motor-${safeId}`}
                          value={surface.spec.motor_type == null ? '' : String(surface.spec.motor_type)}
                          options={[{ value: '', label: 'Select Motor' }, ...motorOptions]}
                          onChange={(value) => {
                            const motorId = value ? Number(value) : null;
                            const chosenMotor = motorId ? motors.find((m) => m.id === motorId) : null;
                            const calculatedMotorPrice = chosenMotor
                              ? (areaM2 * Number(chosenMotor.price_per_m2 || 0) * motorQuantity).toFixed(2)
                              : '0';
                            onUpdateSpec({
                              motor_type: motorId,
                              motor_price_per_unit: calculatedMotorPrice,
                            });
                          }}
                          ariaLabel="Motor Type"
                          showOptionSuffix
                          disabled={motors.length === 0}
                          placeholder={motors.length ? 'Select motor' : 'No motors available'}
                        />
                      )}
                    </Field>
                    {selectedMotor && (
                      <div className="mt-3">
                        <Field id={`motor-quantity-${safeId}`} label="Motor Quantity" hint={`AED ${money(motorUnitTotal)} each`}>
                          <input
                            id={`motor-quantity-${safeId}`}
                            type="number"
                            min="1"
                            step="1"
                            value={motorQuantity}
                            onChange={(event) => {
                              const qty = Math.max(1, Math.floor(Number(event.target.value) || 1));
                              onUpdateSpec({
                                motor_quantity: qty,
                                motor_price_per_unit: (motorUnitTotal * qty).toFixed(2),
                              });
                            }}
                            className="qbc-input"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                {/* Alexa Controls */}
                {surface.spec.smart_integration && (
                  <>
                    <Field id={`alexa-quantity-${safeId}`} label="Qty" error={fieldErrors.alexa_quantity}>
                      <input
                        id={`alexa-quantity-${safeId}`}
                        type="number"
                        min="0"
                        value={surface.spec.alexa_quantity}
                        onChange={(event) => onUpdateSpec({ alexa_quantity: Number(event.target.value) })}
                        className="qbc-input"
                      />
                    </Field>
                    <PriceField
                      id={`alexa-price-${safeId}`}
                      label="Unit Price (AED)"
                      hint={isB2B ? 'Editable · B2B' : 'From catalog'}
                      value={surface.spec.alexa_unit_price}
                      onChange={(value) => onUpdateSpec({ alexa_unit_price: value })}
                      readOnly={!isB2B}
                      editable={isB2B}
                      step="0.01"
                      error={fieldErrors.alexa_unit_price}
                    />
                  </>
                )}

                {/* Pelmet Controls */}
                {surface.spec.pelmet_enabled && (
                  <>
                    <Field id={`pelmet-width-${safeId}`} label="Width (cm)" error={fieldErrors.pelmet_width_cm}>
                      <input
                        id={`pelmet-width-${safeId}`}
                        type="number"
                        step="0.01"
                        value={surface.spec.pelmet_width_cm}
                        onChange={(event) => onUpdateSpec({ pelmet_width_cm: event.target.value })}
                        className="qbc-input"
                      />
                    </Field>
                    <PriceField
                      id={`pelmet-price-${safeId}`}
                      label="Price/m (AED)"
                      hint={isB2B ? 'Editable · B2B' : 'From catalog'}
                      value={surface.spec.pelmet_price_per_metre}
                      onChange={(value) => onUpdateSpec({ pelmet_price_per_metre: value })}
                      readOnly={!isB2B}
                      editable={isB2B}
                      step="0.01"
                      error={fieldErrors.pelmet_price_per_metre}
                    />
                  </>
                )}
              </div>
            )}

          </section>

          {/* Section: Pricing */}
          <section className="qbc-section" role="group" aria-labelledby={`pricing-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--pricing" id={`pricing-heading-${safeId}`}>
              <span className="qbc-section-icon"><Banknote size={14} aria-hidden="true" /></span>
              <span>Pricing</span>
              <span className={`qbc-pricing-mode${isB2B ? ' is-b2b' : ''}`}>
                {isB2B ? <Pencil size={11} aria-hidden="true" /> : <Lock size={11} aria-hidden="true" />}
                {isB2B ? 'B2B · Editable' : 'Catalog rates'}
              </span>
            </h3>
            <div className="qbc-pricing-grid">
              <PriceField
                id={`surface-price-${safeId}`}
                label="Surface Price (AED)"
                hint={isB2B ? fabricFormula : 'From catalog'}
                value={fabricTotal.toFixed(2)}
                readOnly={!isB2B}
                editable={isB2B}
                onChange={(value) => {
                  const newSurfacePrice = parseFloat(value) || 0;
                  const newUnitPrice = fabricQuantity > 0 ? (newSurfacePrice / fabricQuantity).toFixed(4) : '0';
                  onUpdateSpec({ unit_price_per_m2: newUnitPrice });
                }}
                step="0.01"
                error={fieldErrors.unit_price_per_m2}
              />

              <Field
                id={`motor-price-${safeId}`}
                label="Motor Price (AED)"
                hint={
                  !isMotorized
                    ? 'Manual control'
                    : isB2B
                      ? 'Editable · B2B'
                      : 'Calculated from motor'
                }
                error={fieldErrors.motor_price_per_unit}
              >
                <MoneyInput
                  id={`motor-price-${safeId}`}
                  value={isMotorized ? surface.spec.motor_price_per_unit ?? '0' : '0.00'}
                  readOnly={!isB2B || !isMotorized}
                  editable={isB2B && isMotorized}
                  onChange={(value) => onUpdateSpec({ motor_price_per_unit: value })}
                />
                {isMotorized && selectedMotor && (
                  <span className="qbc-field-note">
                    Catalog: AED {money(motorUnitTotal * motorQuantity)} ({areaM2} m² × AED {selectedMotor.price_per_m2}
                    {motorQuantity > 1 ? ` × ${motorQuantity}` : ''})
                  </span>
                )}
              </Field>
            </div>
          </section>

          {/* Section: Add-ons & Other Charges */}
          <section className="qbc-section" role="group" aria-labelledby={`addon-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--addon" id={`addon-heading-${safeId}`}>
              <span className="qbc-section-icon"><PlusSquare size={14} aria-hidden="true" /></span>
              <span>Add-ons &amp; Other Charges</span>
            </h3>

            <div className="qbc-subsection">
              <div className="qbc-subsection-head">
                <span className="qbc-subsection-title">Other charges</span>
                {otherChargeTemplates.length > 0 && (
                  <span className="qbc-subsection-meta">
                    {resolvedOtherCharges.length} of {otherChargeTemplates.length} applied
                  </span>
                )}
              </div>
              {otherChargeTemplates.length === 0 ? (
                <p className="qbc-muted-note">
                  No other charges are configured for {workTypeName || 'this work type'}. Add them in Catalog → Charges.
                </p>
              ) : (
                <ul className="qbc-charge-list">
                  {otherChargeTemplates.map((template) => {
                    const templateId = Number(template.id);
                    const selection = selectedOtherCharges.find((charge) => Number(charge.id) === templateId);
                    const resolved = resolvedOtherCharges.find((charge) => charge.id === templateId);
                    const catalogAmount = calcChargeAmount(template, surface.width_cm, surface.height_cm);
                    const checkboxId = `other-charge-${safeId}-${templateId}`;
                    return (
                      <li key={templateId} className={`qbc-charge-row${selection ? ' is-selected' : ''}`}>
                        <label className="qbc-charge-check" htmlFor={checkboxId}>
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={!!selection}
                            onChange={(event) => toggleOtherCharge(template, event.target.checked)}
                          />
                          <span className="qbc-charge-text">
                            <span className="qbc-charge-name">{template.name}</span>
                            <span className="qbc-charge-meta">
                              AED {toNum(template.price).toFixed(2)} {chargeUnitText(template)}
                              {template.description ? ` · ${template.description}` : ''}
                            </span>
                          </span>
                        </label>
                        {selection && isB2B ? (
                          <MoneyInput
                            id={`${checkboxId}-amount`}
                            ariaLabel={`${template.name} amount`}
                            className="qbc-charge-amount"
                            editable
                            value={
                              selection.amount !== undefined && selection.amount !== ''
                                ? selection.amount
                                : catalogAmount.toFixed(2)
                            }
                            onChange={(value) => setOtherChargeAmount(templateId, value)}
                          />
                        ) : (
                          <span className={`qbc-charge-value${selection ? '' : ' is-muted'}`}>
                            AED {money(selection ? resolved?.amount ?? catalogAmount : catalogAmount)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="qbc-subsection">
              <div className="qbc-subsection-head">
                <span className="qbc-subsection-title">Custom add-on</span>
                <span className="qbc-subsection-meta">Optional</span>
              </div>
              <div className="qbc-addon-grid">
                <Field id={`addon-label-${safeId}`} label="Addon Label" error={fieldErrors.addon_label}>
                  <span className="qbc-leading-input">
                    <Tag size={15} aria-hidden="true" />
                    <input
                      id={`addon-label-${safeId}`}
                      type="text"
                      value={surface.spec.addon_label || ''}
                      onChange={(event) => onUpdateSpec({ addon_label: event.target.value })}
                      placeholder="e.g., Install"
                      className="qbc-input qbc-input--with-icon"
                    />
                  </span>
                </Field>
                <PriceField
                  id={`addon-amount-${safeId}`}
                  label="Addon Amount (AED)"
                  value={surface.spec.addon_amount}
                  onChange={(value) => onUpdateSpec({ addon_amount: value })}
                  editable
                  step="0.01"
                  error={fieldErrors.addon_amount}
                />
              </div>
            </div>

            {/* Line item breakdown */}
            <div className="qbc-subsection">
              <div className="qbc-subsection-head">
                <span className="qbc-subsection-title">Charges breakdown</span>
              </div>
              <dl className="qbc-breakdown" aria-label="Line item breakdown">
                <div>
                  <dt>Fabric <span>{fabricFormula}</span></dt>
                  <dd>AED {money(fabricTotal)}</dd>
                </div>
                <div>
                  <dt>
                    {isMotorized ? 'Motorized control charge' : 'Manual control charge'}
                    {controlCharge && <span>AED {Number(controlCharge.price).toFixed(2)} {chargeUnitText(controlCharge)}</span>}
                  </dt>
                  <dd className={controlCharge ? '' : 'is-muted'}>
                    {controlCharge ? `AED ${money(controlChargeTotal)}` : 'Not set in catalog'}
                  </dd>
                </div>
                {isMotorized && (
                  <div>
                    <dt>Motor{selectedMotor && <span>{selectedMotor.name} × {motorQuantity}</span>}</dt>
                    <dd>AED {money(motorPriceTotal)}</dd>
                  </div>
                )}
                {isMotorized && surface.spec.smart_integration && (
                  <div>
                    <dt>Alexa<span>{surface.spec.alexa_quantity} × AED {toNum(surface.spec.alexa_unit_price).toFixed(2)}</span></dt>
                    <dd>AED {money(alexaTotal)}</dd>
                  </div>
                )}
                {surface.spec.pelmet_enabled && (
                  <div>
                    <dt>
                      Pelmet
                      <span>
                        {(toNum(surface.spec.pelmet_width_cm) / 100).toFixed(2)} m × AED {toNum(surface.spec.pelmet_price_per_metre).toFixed(2)}
                      </span>
                    </dt>
                    <dd>AED {money(pelmetTotal)}</dd>
                  </div>
                )}
                {resolvedOtherCharges.map((charge) => (
                  <div key={`breakdown-other-${charge.id}`}>
                    <dt>{charge.name}{charge.overridden && <span>Custom price</span>}</dt>
                    <dd>AED {money(charge.amount)}</dd>
                  </div>
                ))}
                {customAddonAmount !== 0 && (
                  <div>
                    <dt>{surface.spec.addon_label || 'Custom add-on'}</dt>
                    <dd>AED {money(customAddonAmount)}</dd>
                  </div>
                )}
                {otherChargesTotal + customAddonAmount !== 0 && (
                  <div className="is-subtotal">
                    <dt>Add-ons subtotal</dt>
                    <dd>AED {money(otherChargesTotal + customAddonAmount)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          {/* Total Row */}
          <div className={`qbc-total-row${isPulsing ? ' is-pulsing' : ''}`} aria-live="off">
            <span className="qbc-total-label"><Receipt size={17} aria-hidden="true" />Line total</span>
            <span className={`qbc-total-value${total === 0 ? ' is-zero' : ''}`}>
              <span>AED</span>
              <strong>{totalDisplay}</strong>
            </span>
          </div>
          <span className="qbc-visually-hidden" aria-live="polite">{announcedTotal}</span>
        </div>
      </div>
    </article>
  );
}
