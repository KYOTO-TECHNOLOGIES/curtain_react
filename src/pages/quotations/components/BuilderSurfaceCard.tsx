import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Banknote,
  ChevronDown,
  Layers3,
  Mic,
  PanelTop,
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
  fieldErrors?: Record<string, string>;
  onDelete: () => void;
  onUpdateSpec: (updates: Partial<SurfaceSpec>) => void;
  onUpdateSurface?: (updates: Partial<BuilderSurface>) => void;
  calculateTotal: (spec: SurfaceSpec, widthCm: number, heightCm: number) => string;
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

function PriceField({
  id,
  label,
  value,
  onChange,
  step = '0.01',
  readOnly = false,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange?: (val: string) => void;
  step?: string;
  readOnly?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={`qbc-price-control${readOnly ? ' bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}>
        <span className="qbc-currency" aria-hidden="true">AED</span>
        <input
          id={id}
          type="number"
          step={step}
          inputMode="decimal"
          autoComplete="off"
          value={value == null ? '' : value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className={`qbc-price-input${readOnly ? ' bg-transparent cursor-not-allowed font-semibold text-slate-600' : ''}`}
        />
      </div>
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

  const selectedFabric = fabricTypes.find((f) => f.id === surface.spec.fabric_type);
  const selectedModel = models.find((m) => m.id === surface.spec.model);
  const selectedItem = items.find((i) => i.id === surface.spec.catalog_item);
  const selectedMotor = surface.spec.motor_type ? motors.find((m) => m.id === surface.spec.motor_type) : null;

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
  const modelOptions: SelectOption[] = models.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
  const itemOptions: SelectOption[] = items.map((item) => ({
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

  // Estimated Motor Total
  const estimatedMotorTotal = selectedMotor
    ? (areaM2 * Number(selectedMotor.price_per_m2 || 0)).toFixed(2)
    : '0.00';

  // Catalog charge templates (set up in Catalog > Charges)
  const chargeFor = (kind: string) => charges.find((charge) => charge.kind === kind);
  const manualCharge = chargeFor('manual');
  const motorizedCharge = chargeFor('motorized');
  const alexaCharge = chargeFor('alexa');
  const pelmetCharge = chargeFor('pelmet');
  const chargeAmount = (charge: ChargeTemplate | undefined, widthCm: number) => {
    if (!charge) return 0;
    const price = Number(charge.price) || 0;
    if (charge.unit === 'flat') return price;
    if (charge.unit === 'm') return price * (widthCm / 100);
    return price * areaM2;
  };
  const chargeUnitText = (charge: ChargeTemplate) =>
    charge.unit === 'flat' ? 'flat' : charge.unit === 'm' ? 'per m' : 'per m²';
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

  // Catalog fabric pricing (respects the work type's pricing unit)
  const catalogUnitPrice = parseFloat(String(surface.spec.unit_price_per_m2)) || 0;
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
                  value={String(surface.spec.fabric_type)}
                  options={fabricOptions}
                  onChange={(value) => onUpdateSpec({ fabric_type: Number(value) })}
                  ariaLabel="Fabric Type"
                  disabled={fabricOptions.length === 0}
                  placeholder={fabricOptions.length ? 'Select fabric type' : 'No options'}
                />
              </Field>
              <Field id={`model-${safeId}`} label="Model" error={fieldErrors.model}>
                <SelectMenu
                  id={`model-${safeId}`}
                  value={String(surface.spec.model)}
                  options={modelOptions}
                  onChange={(value) => onUpdateSpec({ model: Number(value) })}
                  ariaLabel="Model"
                  disabled={modelOptions.length === 0}
                  placeholder={modelOptions.length ? 'Select model' : 'No options'}
                />
              </Field>
              <Field id={`item-${safeId}`} label="Item" error={fieldErrors.catalog_item}>
                <SelectMenu
                  id={`item-${safeId}`}
                  value={String(surface.spec.catalog_item)}
                  options={itemOptions}
                  onChange={(value) => {
                    const chosen = items.find((item) => item.id === Number(value));
                    onUpdateSpec({
                      catalog_item: Number(value),
                      unit_price_per_m2: chosen?.price_per_unit || surface.spec.unit_price_per_m2,
                    });
                  }}
                  ariaLabel="Item"
                  showOptionSuffix
                  disabled={itemOptions.length === 0}
                  placeholder={itemOptions.length ? 'Select item' : 'No options'}
                />
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
              <Field id={`catalog-unit-price-${safeId}`} label={`Unit Price (${unitLabel})`} hint="From catalog">
                <div className="qbc-price-control bg-slate-50 border-slate-200">
                  <span className="qbc-currency" aria-hidden="true">AED</span>
                  <input
                    id={`catalog-unit-price-${safeId}`}
                    type="text"
                    readOnly
                    value={catalogUnitPrice.toFixed(2)}
                    className="qbc-price-input bg-transparent font-semibold text-slate-600"
                  />
                </div>
              </Field>
              <Field id={`fabric-total-${safeId}`} label="Fabric Total" hint={fabricFormula}>
                <div className="qbc-price-control bg-slate-50 border-slate-200">
                  <span className="qbc-currency" aria-hidden="true">AED</span>
                  <input
                    id={`fabric-total-${safeId}`}
                    type="text"
                    readOnly
                    value={fabricTotal.toFixed(2)}
                    className="qbc-price-input bg-transparent font-semibold text-slate-600"
                  />
                </div>
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
                  onChange={(checked) => onUpdateSpec({ pelmet_enabled: checked })}
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
                      value={surface.spec.alexa_unit_price}
                      onChange={(value) => onUpdateSpec({ alexa_unit_price: value })}
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
                      value={surface.spec.pelmet_price_per_metre}
                      onChange={(value) => onUpdateSpec({ pelmet_price_per_metre: value })}
                      step="0.01"
                      error={fieldErrors.pelmet_price_per_metre}
                    />
                  </>
                )}
              </div>
            )}

            {/* Catalog-driven charge breakdown */}
            <dl className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm grid gap-1.5" aria-label="Control and charge breakdown">
              <div className="flex justify-between">
                <dt className="text-slate-600">
                  {isMotorized ? 'Motorized control charge' : 'Manual control charge'}
                  {controlCharge && <span className="text-slate-400"> (AED {Number(controlCharge.price).toFixed(2)} {chargeUnitText(controlCharge)})</span>}
                </dt>
                <dd className="font-semibold">{controlCharge ? `AED ${money(controlChargeTotal)}` : 'Not set in catalog'}</dd>
              </div>
              {isMotorized && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Motor{selectedMotor ? ` (${selectedMotor.name} × ${motorQuantity})` : ''}</dt>
                  <dd className="font-semibold">AED {money(motorUnitTotal * motorQuantity)}</dd>
                </div>
              )}
              {isMotorized && surface.spec.smart_integration && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Alexa ({surface.spec.alexa_quantity} × AED {Number(surface.spec.alexa_unit_price || 0).toFixed(2)})</dt>
                  <dd className="font-semibold">AED {money(alexaTotal)}</dd>
                </div>
              )}
              {surface.spec.pelmet_enabled && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    Pelmet charge
                    {pelmetCharge && <span className="text-slate-400"> (AED {Number(pelmetCharge.price).toFixed(2)} per m)</span>}
                  </dt>
                  <dd className="font-semibold">AED {money(pelmetTotal)}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Section: Pricing */}
          <section className="qbc-section" role="group" aria-labelledby={`pricing-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--pricing" id={`pricing-heading-${safeId}`}>
              <span className="qbc-section-icon"><Banknote size={14} aria-hidden="true" /></span>
              <span>Pricing</span>
            </h3>
            <div className="qbc-pricing-grid">
              <PriceField
                id={`surface-price-${safeId}`}
                label="Surface Price (AED)"
                value={fabricTotal.toFixed(2)}
                onChange={(value) => {
                  const newSurfacePrice = parseFloat(value) || 0;
                  const newUnitPrice = fabricQuantity > 0 ? (newSurfacePrice / fabricQuantity).toFixed(4) : '0';
                  onUpdateSpec({ unit_price_per_m2: newUnitPrice });
                }}
                step="0.01"
                error={fieldErrors.unit_price_per_m2}
              />

              {/* Motor Price (Read-only, calculated on save from motor_type.price_per_m2) */}
              <Field
                id={`motor-price-${safeId}`}
                label="Motor Price (AED)"
                hint="Calculated on save"
                error={fieldErrors.motor_price_per_unit}
              >
                <div className="qbc-price-control bg-slate-50 border-slate-200 cursor-not-allowed">
                  <span className="qbc-currency" aria-hidden="true">AED</span>
                  <input
                    id={`motor-price-${safeId}`}
                    type="text"
                    readOnly
                    value={surface.spec.motor_price_per_unit || '0.00'}
                    className="qbc-price-input bg-transparent cursor-not-allowed font-semibold text-slate-600"
                    title="Calculated from the motor price on save"
                  />
                </div>
                {selectedMotor && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Estimate: AED {estimatedMotorTotal} ({areaM2} m² × AED {selectedMotor.price_per_m2})
                  </span>
                )}
              </Field>
            </div>
          </section>

          {/* Section: Add-on */}
          <section className="qbc-section" role="group" aria-labelledby={`addon-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--addon" id={`addon-heading-${safeId}`}>
              <span className="qbc-section-icon"><PlusSquare size={14} aria-hidden="true" /></span>
              <span>Add-on</span>
            </h3>
            <div className="qbc-addon-grid">
              <Field id={`addon-label-${safeId}`} label="Addon Label">
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
                step="0.01"
              />
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
