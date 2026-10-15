import { useId } from 'react';
import { Home, Plus, Tag } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import './AddAreaModal.css';

const AREA_TYPE_SUGGESTIONS = [
  'Master Bedroom',
  'Living Room',
  'Kitchen',
  'Bathroom',
  'Office',
];

interface AddAreaModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  areaType: string;
  areaName: string;
  onAreaTypeChange: (value: string) => void;
  onAreaNameChange: (value: string) => void;
  areaTypePlaceholder: string;
  areaNamePlaceholder: string;
}

export default function AddAreaModal({
  open,
  onClose,
  onAdd,
  areaType,
  areaName,
  onAreaTypeChange,
  onAreaNameChange,
  areaTypePlaceholder,
  areaNamePlaceholder,
}: AddAreaModalProps) {
  const id = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Area"
      subtitle="Add a room or space to this quotation"
      maxWidth="max-w-md"
      variant="area"
      footer={(
        <div className="add-area-actions">
          <button type="button" className="add-area-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="add-area-submit" onClick={onAdd}>
            <Plus size={17} aria-hidden="true" />
            <span>Add Area</span>
          </button>
        </div>
      )}
    >
      <div className="add-area-field">
        <label htmlFor={`${id}-type`}>
          <span>Area Type <span className="add-area-required" aria-hidden="true">*</span></span>
        </label>
        <div className="add-area-input">
          <Home size={18} aria-hidden="true" />
          <input
            id={`${id}-type`}
            data-area-autofocus
            type="text"
            value={areaType}
            placeholder={areaTypePlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => onAreaTypeChange(event.target.value)}
          />
        </div>
        <div className="add-area-suggestions" aria-label="Suggested area types">
          {AREA_TYPE_SUGGESTIONS.map((suggestion) => {
            const selected = areaType.trim().toLowerCase() === suggestion.toLowerCase();
            return (
              <button
                key={suggestion}
                type="button"
                className={`add-area-suggestion ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onAreaTypeChange(suggestion)}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      <div className="add-area-field">
        <label htmlFor={`${id}-name`}>
          <span>Area Name <span className="add-area-required" aria-hidden="true">*</span></span>
        </label>
        <div className="add-area-input">
          <Tag size={18} aria-hidden="true" />
          <input
            id={`${id}-name`}
            type="text"
            value={areaName}
            placeholder={areaNamePlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => onAreaNameChange(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
