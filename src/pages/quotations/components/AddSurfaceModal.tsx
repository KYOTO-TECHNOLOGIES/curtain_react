import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AppWindow,
  BrickWall,
  Check,
  ChevronDown,
  DoorOpen,
  MoveHorizontal,
  MoveVertical,
  Plus,
  Square,
  Tag,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import './AddSurfaceModal.css';

interface SurfaceTypeOption {
  value: string;
  label: string;
}

interface AddSurfaceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  name: string;
  type: string;
  width: string;
  height: string;
  onNameChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  typeOptions: SurfaceTypeOption[];
  namePlaceholder?: string;
  nameLabel?: string;
  typeLabel?: string;
  widthPlaceholder?: string;
  heightPlaceholder?: string;
  widthMin?: number;
  heightMin?: number;
  areaName?: string;
  openingDirection?: string;
  onOpeningDirectionChange?: (value: string) => void;
  openingDirectionOptions?: SurfaceTypeOption[];
  specialRequirements?: string;
  onSpecialRequirementsChange?: (value: string) => void;
  onAddType?: (label: string) => string | null;
  onRenameType?: (value: string, label: string) => void;
  onRemoveType?: (value: string) => void;
  isCustomType?: (value: string) => boolean;
}

function typeIcon(type: string, size = 16) {
  switch (type.toLowerCase()) {
    case 'window': return <AppWindow size={size} aria-hidden="true" />;
    case 'door': return <DoorOpen size={size} aria-hidden="true" />;
    case 'wall': return <BrickWall size={size} aria-hidden="true" />;
    default: return <Square size={size} aria-hidden="true" />;
  }
}

function TypeDropdown({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: SurfaceTypeOption[];
  onChange: (value: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const [position, setPosition] = useState<React.CSSProperties>({});
  const selected = options.find((option) => option.value === value) || options[0];
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 640);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 16);
    const estimated = Math.min(options.length * 48 + 12, 320);
    const above = rect.top - 8;
    const below = window.innerHeight - rect.bottom - 8;
    const flipped = below < estimated && above > below;
    setPosition({
      top: flipped ? Math.max(8, rect.top - Math.min(estimated, above) - 8) : rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.min(320, flipped ? above : below),
      transformOrigin: flipped ? 'bottom center' : 'top center',
    });
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    const reposition = () => {
      if (!triggerRef.current) return;
      const nextRect = triggerRef.current.getBoundingClientRect();
      setPosition((current) => ({ ...current, top: nextRect.bottom + 8, left: nextRect.left }));
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open) {
      const current = options.findIndex((option) => option.value === value);
      setActiveIndex(current >= 0 ? current : 0);
    }
  }, [open, value, options]);

  const choose = (option: SurfaceTypeOption) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((index) => event.key === 'ArrowDown'
        ? (index + 1) % options.length
        : (index - 1 + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
    } else if (!open && event.key.length === 1) {
      const index = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index >= 0) {
        setActiveIndex(index);
        setOpen(true);
      }
    }
  };

  const menu = open ? createPortal(
    <>
      {mobile && <button type="button" className="surface-type-backdrop" aria-label="Close type options" onClick={() => setOpen(false)} />}
      <div
        ref={menuRef}
        id={listboxId}
        className={`surface-type-popover ${mobile ? 'is-mobile' : ''}`}
        style={mobile ? undefined : position}
        role="listbox"
        aria-label="Type"
        aria-activedescendant={`${listboxId}-option-${activeIndex}`}
        onKeyDown={onKeyDown}
      >
        {mobile && (
          <>
            <span className="surface-type-handle" aria-hidden="true" />
            <span className="surface-type-title">Type</span>
          </>
        )}
        {options.map((option, index) => (
          <div
            key={`${option.value}-${index}`}
            id={`${listboxId}-option-${index}`}
            className={`surface-type-option ${option.value === value ? 'is-selected' : ''} ${index === activeIndex ? 'is-active' : ''}`}
            role="option"
            aria-selected={option.value === value}
            tabIndex={-1}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => choose(option)}
          >
            <span className="surface-type-option-icon">{typeIcon(option.value)}</span>
            <span>{option.label}</span>
            <Check className="surface-type-check" size={17} aria-hidden="true" />
          </div>
        ))}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`surface-type-trigger ${open ? 'is-open' : ''}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        <span className="surface-type-trigger-icon">{typeIcon(selected?.value || value)}</span>
        <span className="surface-type-trigger-label">{selected?.label || value}</span>
        <ChevronDown className="surface-type-chevron" size={16} aria-hidden="true" />
      </button>
      {menu}
    </>
  );
}

export default function AddSurfaceModal({
  open,
  onClose,
  onAdd,
  name,
  type,
  width,
  height,
  onNameChange,
  onTypeChange,
  onWidthChange,
  onHeightChange,
  typeOptions,
  namePlaceholder = 'e.g., Window 1',
  nameLabel = 'Name',
  typeLabel = 'Type',
  widthPlaceholder = '240',
  heightPlaceholder = '310',
  widthMin,
  heightMin,
  areaName,
  openingDirection,
  onOpeningDirectionChange,
  openingDirectionOptions,
  specialRequirements,
  onSpecialRequirementsChange,
  onAddType,
  onRenameType,
  onRemoveType,
  isCustomType,
}: AddSurfaceModalProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const canManage = Boolean(onAddType && onRenameType && onRemoveType && isCustomType);
  const customOptions = canManage ? typeOptions.filter((option) => isCustomType!(option.value)) : [];

  const submitNewType = () => {
    if (!onAddType) return;
    const value = onAddType(newTypeLabel);
    if (value) {
      onTypeChange(value);
      setNewTypeLabel('');
    }
  };

  const commitRename = () => {
    if (editingType && onRenameType) onRenameType(editingType, editingLabel);
    setEditingType(null);
  };

  const removeType = (value: string) => {
    onRemoveType?.(value);
    if (type === value) onTypeChange('window');
  };
  const id = useId();
  const previewRef = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState({ width: 0, height: 0, area: 0 });
  const [announcement, setAnnouncement] = useState('');
  const numericWidth = Number(width);
  const numericHeight = Number(height);
  const hasDimensions = Number.isFinite(numericWidth) && numericWidth > 0
    && Number.isFinite(numericHeight) && numericHeight > 0;
  const area = hasDimensions ? numericWidth * numericHeight / 10000 : 0;
  const ratio = hasDimensions
    ? Math.max(0.4, Math.min(2.5, numericWidth / numericHeight))
    : 1;
  const rectWidth = ratio >= 1 ? 68 : 68 * ratio;
  const rectHeight = ratio >= 1 ? 68 / ratio : 68;
  const currentType = type.toLowerCase();
  const hasRangeIssue = (widthMin !== undefined && width !== '' && Number(width) < widthMin)
    || (heightMin !== undefined && height !== '' && Number(height) < heightMin);

  useEffect(() => {
    if (!hasDimensions) {
      setPreview({ width: 0, height: 0, area: 0 });
      setAnnouncement('');
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = previewRef.current ? preview : { width: 0, height: 0, area: 0 };
    const to = { width: rectWidth, height: rectHeight, area };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPreview(to);
      return;
    }
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 250);
      const eased = 1 - (1 - progress) ** 3;
      setPreview({
        width: from.width + (to.width - from.width) * eased,
        height: from.height + (to.height - from.height) * eased,
        area: from.area + (to.area - from.area) * eased,
      });
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [width, height, rectWidth, rectHeight, area, hasDimensions, numericWidth, numericHeight]);

  useEffect(() => {
    if (!hasDimensions) return;
    const timer = setTimeout(() => {
      setAnnouncement(`Surface size ${numericWidth} by ${numericHeight} centimeters, ${area.toFixed(2)} square meters`);
    }, 400);
    return () => clearTimeout(timer);
  }, [width, height, hasDimensions, numericWidth, numericHeight, area]);

  const displayWidth = preview.width;
  const displayHeight = preview.height;
  const previewSizeText = hasDimensions
    ? `${numericWidth} × ${numericHeight} cm`
    : '';
  const compactText = hasDimensions
    ? `${previewSizeText} · ${area.toFixed(2)} m²`
    : 'Enter width and height to preview';
  const previewClass = useMemo(
    () => `surface-preview ${hasRangeIssue ? 'has-range-warning' : ''} ${hasDimensions ? 'has-dimensions' : 'is-empty'}`,
    [hasRangeIssue, hasDimensions]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Surface"
      subtitle="Add a window, door or wall to this area"
      context={areaName}
      maxWidth="max-w-lg"
      variant="surface"
      footer={(
        <div className="add-surface-actions">
          <button type="button" className="add-surface-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="add-surface-submit" onClick={onAdd}>
            <Plus size={17} aria-hidden="true" />
            <span>Add Surface</span>
          </button>
        </div>
      )}
    >
      <div className="add-surface-field">
        <label htmlFor={`${id}-name`}>{nameLabel} <span className="add-surface-required" aria-hidden="true">*</span></label>
        <div className="add-surface-input">
          <Tag size={18} aria-hidden="true" />
          <input
            id={`${id}-name`}
            data-surface-autofocus
            type="text"
            value={name}
            placeholder={namePlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
      </div>
      <div className="add-surface-field">
        <label htmlFor={`${id}-type`}>{typeLabel}</label>
        <TypeDropdown
          id={`${id}-type`}
          value={type}
          options={typeOptions}
          onChange={onTypeChange}
        />
        {canManage && (
          <div className="surface-type-manager">
            <button
              type="button"
              className="surface-type-manager-toggle"
              aria-expanded={manageOpen}
              onClick={() => setManageOpen((current) => !current)}
            >
              {manageOpen ? 'Hide custom types' : '+ Customize types'}
            </button>
            {manageOpen && (
              <div className="surface-type-manager-body">
                <div className="surface-type-manager-add">
                  <input
                    type="text"
                    value={newTypeLabel}
                    placeholder="New type, e.g. Balcony"
                    aria-label="New surface type name"
                    onChange={(event) => setNewTypeLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitNewType();
                      }
                    }}
                  />
                  <button type="button" onClick={submitNewType} disabled={!newTypeLabel.trim()}>Add</button>
                </div>
                {customOptions.length === 0 ? (
                  <p className="surface-type-manager-empty">No custom types yet. Window, Wall and Door are built in.</p>
                ) : (
                  <ul className="surface-type-manager-list">
                    {customOptions.map((option) => (
                      <li key={option.value}>
                        {editingType === option.value ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingLabel}
                            aria-label={`Rename ${option.label}`}
                            onChange={(event) => setEditingLabel(event.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') commitRename();
                              if (event.key === 'Escape') setEditingType(null);
                            }}
                          />
                        ) : (
                          <span>{option.label}</span>
                        )}
                        <span className="surface-type-manager-actions">
                          <button type="button" onClick={() => { setEditingType(option.value); setEditingLabel(option.label); }}>Rename</button>
                          <button type="button" onClick={() => removeType(option.value)}>Delete</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {openingDirection !== undefined && onOpeningDirectionChange && openingDirectionOptions && (
        <div className="add-surface-field">
          <label htmlFor={`${id}-opening`}>Opening Direction</label>
          <TypeDropdown
            id={`${id}-opening`}
            value={openingDirection}
            options={openingDirectionOptions}
            onChange={onOpeningDirectionChange}
          />
        </div>
      )}
      <div className="add-surface-dimensions">
        <div className="add-surface-field">
          <label htmlFor={`${id}-width`}>Width (cm) <span className="add-surface-required" aria-hidden="true">*</span></label>
          <div className="add-surface-dimension-control">
            <MoveHorizontal size={18} aria-hidden="true" />
            <input
              id={`${id}-width`}
              type="number"
              inputMode="decimal"
              value={width}
              placeholder={widthPlaceholder}
              min={widthMin}
              autoComplete="off"
              onChange={(event) => onWidthChange(event.target.value)}
            />
              <span>cm</span>
            </div>
          </div>
          <div className="add-surface-field">
            <label htmlFor={`${id}-height`}>Height (cm) <span className="add-surface-required" aria-hidden="true">*</span></label>
          <div className="add-surface-dimension-control">
            <MoveVertical size={18} aria-hidden="true" />
            <input
              id={`${id}-height`}
              type="number"
              inputMode="decimal"
              value={height}
              placeholder={heightPlaceholder}
              min={heightMin}
              autoComplete="off"
              onChange={(event) => onHeightChange(event.target.value)}
            />
            <span>cm</span>
          </div>
        </div>
      </div>
      {specialRequirements !== undefined && onSpecialRequirementsChange && (
        <div className="add-surface-field add-surface-notes-field">
          <label htmlFor={`${id}-requirements`}>Special Requirements <span className="add-surface-optional">Optional</span></label>
          <textarea
            id={`${id}-requirements`}
            rows={3}
            value={specialRequirements}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => onSpecialRequirementsChange(event.target.value)}
          />
        </div>
      )}
      <section
        ref={previewRef}
        className={previewClass}
        aria-label="Surface size preview"
        aria-live="off"
      >
        <svg className="surface-preview-sketch" viewBox="0 0 92 92" aria-hidden="true">
          {hasDimensions ? (
            <>
              <line x1="12" y1="10" x2="12" y2="18" className="surface-preview-tick" />
              <line x1="12" y1="10" x2="80" y2="10" className="surface-preview-tick" />
              <rect
                x={(92 - displayWidth) / 2}
                y={(92 - displayHeight) / 2}
                width={displayWidth}
                height={displayHeight}
                rx="3"
                className="surface-preview-rect"
              />
              <line
                x1={(92 - displayWidth) / 2 + 3}
                y1={(92 - displayHeight) / 2 + 5}
                x2={(92 + displayWidth) / 2 - 3}
                y2={(92 - displayHeight) / 2 + 5}
                className="surface-preview-rail"
              />
              {currentType === 'window' && (
                <>
                  <line x1="46" y1={(92 - displayHeight) / 2 + 6} x2="46" y2={(92 + displayHeight) / 2 - 3} className="surface-preview-frame" />
                  <line x1={(92 - displayWidth) / 2 + 3} y1="46" x2={(92 + displayWidth) / 2 - 3} y2="46" className="surface-preview-frame" />
                </>
              )}
              {currentType === 'door' && (
                <circle cx={(92 + displayWidth) / 2 - 8} cy="47" r="2" className="surface-preview-handle" />
              )}
            </>
          ) : (
            <rect x="19" y="19" width="54" height="54" rx="4" className="surface-preview-empty-rect" />
          )}
        </svg>
        <div className="surface-preview-stats">
          {hasDimensions ? (
            <dl>
              <div><dt>Size</dt><dd>{previewSizeText}</dd></div>
              <div><dt>Area</dt><dd className="surface-preview-area">{preview.area.toFixed(2)} m<sup>2</sup></dd></div>
            </dl>
          ) : (
            <p>Enter width and height to preview</p>
          )}
          {hasRangeIssue && (
            <span className="surface-preview-warning">
              <AlertCircle size={14} /> Dimensions must be at least {Math.max(widthMin || 0, heightMin || 0)} cm
            </span>
          )}
        </div>
        <p className="surface-preview-compact">{compactText}</p>
      </section>
      <span className="surface-preview-announcement" aria-live="polite">{announcement}</span>
    </Modal>
  );
}
