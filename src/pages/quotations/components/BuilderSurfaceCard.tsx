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
} from 'lucide-react';
import { SelectMenu, type SelectOption } from '../../../components/ui/SelectMenu';
import type {
  CatalogItem,
  CatalogModel,
  FabricType,
  MotorType,
} from '../../../api/catalog';
import type { SurfaceSpec } from '../../../api/quotations';

interface BuilderSurface {
  tempId: string;
  surface_name: string;
  surface_type: string;
  width_cm: number;
  height_cm: number;
  spec: SurfaceSpec;
}

interface Props {
  surface: BuilderSurface;
  fabricTypes: FabricType[];
  models: CatalogModel[];
  items: CatalogItem[];
  motors: MotorType[];
  onDelete: () => void;
  onUpdateSpec: (updates: Partial<SurfaceSpec>) => void;
  calculateTotal: (spec: SurfaceSpec, widthCm: number, heightCm: number) => string;
}

function capitalizeDisplay(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="qbc-field">
      <label className="qbc-field-label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function PriceField({
  id,
  label,
  value,
  onChange,
  step,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <Field id={id} label={label}>
      <div className="qbc-price-control">
        <span className="qbc-currency" aria-hidden="true">AED</span>
        <input
          id={id}
          type="number"
          step={step}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="qbc-price-input"
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
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon: typeof Mic;
}) {
  return (
    <label className={`qbc-option-tile${checked ? ' is-checked' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="qbc-option-input"
      />
      <span className="qbc-option-icon"><Icon size={16} aria-hidden="true" /></span>
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
            <line x1={x + width / 2} y1={y + 2} x2={x + width / 2} y2={y + height - 2} className="qbc-sketch-cross" />
            <line x1={x + 2} y1={y + height / 2} x2={x + width - 2} y2={y + height / 2} className="qbc-sketch-cross" />
          </>
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
  onDelete,
  onUpdateSpec,
  calculateTotal,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [announcedTotal, setAnnouncedTotal] = useState('');
  const firstTotal = useRef(true);
  const totalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = Number(calculateTotal(surface.spec, surface.width_cm, surface.height_cm)) || 0;
  const safeId = surface.tempId.replace(/[^a-zA-Z0-9_-]/g, '');
  const surfaceLabel = capitalizeDisplay(surface.surface_name);
  const areaM2 = ((surface.width_cm * surface.height_cm) / 10000).toFixed(2);

  useEffect(() => {
    if (firstTotal.current) {
      firstTotal.current = false;
      setDisplayTotal(total);
      setAnnouncedTotal(`Line total AED ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }

    const start = displayTotal;
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / 300, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayTotal(start + (total - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    setIsPulsing(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setIsPulsing(false), 400);
    if (totalTimer.current) clearTimeout(totalTimer.current);
    totalTimer.current = setTimeout(() => {
      setAnnouncedTotal(`Line total AED ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }, 400);

    return () => cancelAnimationFrame(frame);
  }, [total]);

  useEffect(() => () => {
    if (totalTimer.current) clearTimeout(totalTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  const fabricName = fabricTypes.find((item) => item.id === surface.spec.fabric_type)?.name;
  const modelName = models.find((item) => item.id === surface.spec.model)?.name;
  const itemName = items.find((item) => item.id === surface.spec.catalog_item)?.name;
  const controlName = surface.spec.motor_control_type === 'motorized' ? 'Motorized' : 'Manual';
  const summaries = [fabricName, modelName, itemName, controlName].filter(Boolean);
  const totalDisplay = displayTotal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const motorOptions: SelectOption[] = motors.map((item) => ({
    value: String(item.id),
    label: item.name,
    suffix: item.price_per_m2 == null ? undefined : String(item.price_per_m2),
  }));
  const controlOptions: SelectOption[] = [
    { value: 'manual', label: 'Manual' },
    { value: 'motorized', label: 'Motorized' },
  ];

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
          <section className="qbc-section" role="group" aria-labelledby={`product-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--product" id={`product-heading-${safeId}`}>
              <span className="qbc-section-icon"><Layers3 size={14} aria-hidden="true" /></span>
              <span>Product</span>
            </h3>
            <div className="qbc-product-grid">
              <Field id={`fabric-${safeId}`} label="Fabric Type">
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
              <Field id={`model-${safeId}`} label="Model">
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
              <Field id={`item-${safeId}`} label="Item">
                <SelectMenu
                  id={`item-${safeId}`}
                  value={String(surface.spec.catalog_item)}
                  options={itemOptions}
                  onChange={(value) => {
                    const selectedItem = items.find((item) => item.id === Number(value));
                    onUpdateSpec({
                      catalog_item: Number(value),
                      unit_price_per_m2: selectedItem?.price_per_unit || surface.spec.unit_price_per_m2,
                    });
                  }}
                  ariaLabel="Item"
                  showOptionSuffix
                  disabled={itemOptions.length === 0}
                  placeholder={itemOptions.length ? 'Select item' : 'No options'}
                />
              </Field>
            </div>
          </section>

          <section className="qbc-section" role="group" aria-labelledby={`control-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--control" id={`control-heading-${safeId}`}>
              <span className="qbc-section-icon"><SlidersHorizontal size={14} aria-hidden="true" /></span>
              <span>Control and options</span>
            </h3>
            <div className="qbc-control-grid">
              <Field id={`control-${safeId}`} label="Control">
                <SelectMenu
                  id={`control-${safeId}`}
                  value={surface.spec.motor_control_type}
                  options={controlOptions}
                  onChange={(value) => onUpdateSpec({ motor_control_type: value as 'manual' | 'motorized' })}
                  ariaLabel="Control"
                />
              </Field>
              <div className="qbc-option-grid">
                <OptionTile
                  id={`alexa-${safeId}`}
                  checked={surface.spec.smart_integration}
                  onChange={(checked) => onUpdateSpec({ smart_integration: checked })}
                  label="Smart Integration (Alexa)"
                  icon={Mic}
                />
                <OptionTile
                  id={`pelmet-${safeId}`}
                  checked={surface.spec.pelmet_enabled}
                  onChange={(checked) => onUpdateSpec({ pelmet_enabled: checked })}
                  label="Add Pelmet"
                  icon={PanelTop}
                />
              </div>
            </div>
            {(surface.spec.motor_control_type === 'motorized' || surface.spec.smart_integration || surface.spec.pelmet_enabled) && (
              <div className="qbc-extra-fields">
                {surface.spec.motor_control_type === 'motorized' && (
                  <Field id={`motor-${safeId}`} label="Motor Type">
                    <SelectMenu
                      id={`motor-${safeId}`}
                      value={surface.spec.motor_type == null ? '' : String(surface.spec.motor_type)}
                      options={[{ value: '', label: 'Select' }, ...motorOptions]}
                      onChange={(value) => {
                        const motorId = value ? Number(value) : null;
                        const selectedMotor = motorId ? motors.find((motor) => motor.id === motorId) : null;
                        onUpdateSpec({
                          motor_type: motorId,
                          motor_price_per_unit: selectedMotor?.price_per_m2 || '0',
                        });
                      }}
                      ariaLabel="Motor Type"
                      showOptionSuffix
                      disabled={motors.length === 0}
                      placeholder={motors.length ? 'Select motor' : 'No options'}
                    />
                  </Field>
                )}
                {surface.spec.smart_integration && (
                  <>
                    <Field id={`alexa-quantity-${safeId}`} label="Qty">
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
                    />
                  </>
                )}
                {surface.spec.pelmet_enabled && (
                  <>
                    <Field id={`pelmet-width-${safeId}`} label="Width (cm)">
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
                    />
                  </>
                )}
              </div>
            )}
          </section>

          <section className="qbc-section" role="group" aria-labelledby={`pricing-heading-${safeId}`}>
            <h3 className="qbc-section-heading qbc-section-heading--pricing" id={`pricing-heading-${safeId}`}>
              <span className="qbc-section-icon"><Banknote size={14} aria-hidden="true" /></span>
              <span>Pricing</span>
            </h3>
            <div className="qbc-pricing-grid">
              <PriceField
                id={`surface-price-${safeId}`}
                label="Surface Price (AED)"
                value={(() => {
                  const areaM2 = (Number(surface.width_cm) * Number(surface.height_cm)) / 10000;
                  const unitPrice = parseFloat(String(surface.spec.unit_price_per_m2)) || 0;
                  return areaM2 > 0 ? (areaM2 * unitPrice).toFixed(2) : '0.00';
                })()}
                onChange={(value) => {
                  const areaM2 = (Number(surface.width_cm) * Number(surface.height_cm)) / 10000;
                  const newSurfacePrice = parseFloat(value) || 0;
                  const newUnitPrice = areaM2 > 0 ? (newSurfacePrice / areaM2).toFixed(4) : '0';
                  onUpdateSpec({ unit_price_per_m2: newUnitPrice });
                }}
                step="0.01"
              />
              <PriceField
                id={`motor-price-${safeId}`}
                label="Motor Price (AED)"
                value={surface.spec.motor_price_per_unit}
                onChange={(value) => onUpdateSpec({ motor_price_per_unit: value })}
                step="0.01"
              />
            </div>
          </section>

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
