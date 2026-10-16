import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  Building2,
  Check,
  Factory,
  Mail,
  MapPin,
  Phone,
  Plus,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Modal from '../ui/Modal';
import './SupplierModal.css';

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  isBusy: boolean;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  onNameChange: (value: string) => void;
  onContactPersonChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
}

function SupplierField({
  id,
  label,
  icon: Icon,
  required = false,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="supplier-field">
      <div className="supplier-field-label-row">
        <label htmlFor={id}>
          {label}
          {required && <span className="supplier-required-mark" aria-hidden="true">*</span>}
        </label>
        {!required && <span className="supplier-optional-tag">Optional</span>}
      </div>
      <div className="supplier-control">
        <Icon aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export default function SupplierModal({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  isBusy,
  name,
  contactPerson,
  phone,
  email,
  address,
  onNameChange,
  onContactPersonChange,
  onPhoneChange,
  onEmailChange,
  onAddressChange,
}: SupplierModalProps) {
  const id = useId();
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const hasInitials = name.trim().length >= 2;
  const initials = initialsFor(name);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const textarea = addressRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 200 ? 'auto' : 'hidden';
  }, [address]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={title === 'Add New Supplier' ? 'Add a mill or supplier you buy from' : 'Update supplier details'}
      maxWidth="max-w-xl"
      variant="supplier"
      isBusy={isBusy}
      headerBadgeContent={(
        <>
          <span className={`supplier-modal-badge-icon${hasInitials ? ' is-hidden' : ''}`}>
            <Factory aria-hidden="true" />
          </span>
          <span className={`supplier-modal-badge-initials${hasInitials ? ' is-visible' : ''}`} aria-hidden="true">
            {initials}
          </span>
        </>
      )}
      footer={(
        <div className="supplier-modal-actions">
          <button type="button" className="supplier-modal-cancel" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button type="button" className="supplier-modal-submit" onClick={onSubmit} disabled={isBusy}>
            {isBusy ? (
              <>
                <span className="supplier-modal-spinner" aria-hidden="true" />
                <span>{submitLabel === 'Save Supplier' ? 'Saving…' : 'Adding…'}</span>
              </>
            ) : (
              <>
                <Plus aria-hidden="true" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      )}
    >
      <div className="supplier-form-fields">
        <SupplierField id={`${id}-name`} label="Supplier / Mill Name" icon={Building2} required>
          <input
            id={`${id}-name`}
            data-supplier-autofocus
            type="text"
            required
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Al Habtoor Textiles LLC"
            autoComplete="organization"
            autoCapitalize="words"
          />
        </SupplierField>

        <SupplierField id={`${id}-contact`} label="Contact Person" icon={UserRound}>
          <input
            id={`${id}-contact`}
            type="text"
            value={contactPerson}
            onChange={(event) => onContactPersonChange(event.target.value)}
            placeholder="e.g. Tariq Mansoor"
            autoComplete="name"
            autoCapitalize="words"
          />
        </SupplierField>

        <div className="supplier-contact-grid">
          <SupplierField id={`${id}-phone`} label="Phone Number" icon={Phone}>
            <input
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="+971 4 000 0000"
              autoComplete="tel"
            />
          </SupplierField>

          <SupplierField id={`${id}-email`} label="Email Address" icon={Mail}>
            <input
              id={`${id}-email`}
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="sales@supplier.ae"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
            />
            <span className={`supplier-email-check${validEmail ? ' is-valid' : ''}`} aria-hidden={!validEmail}>
              <Check aria-hidden="true" />
            </span>
          </SupplierField>
        </div>

        <div className="supplier-field">
          <div className="supplier-field-label-row">
            <label htmlFor={`${id}-address`}>Warehouse / Factory Address</label>
            <span className="supplier-optional-tag">Optional</span>
          </div>
          <div className="supplier-control supplier-control--textarea">
            <MapPin aria-hidden="true" />
            <textarea
              ref={addressRef}
              id={`${id}-address`}
              value={address}
              onChange={(event) => onAddressChange(event.target.value)}
              placeholder="Warehouse #14, Al Quoz Industrial Area 3, Dubai"
              rows={3}
              autoComplete="street-address"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
