import { useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
  AlertCircle, BriefcaseBusiness, Check, Eye, EyeOff, Headset, Loader2, LockKeyhole, Mail,
  Save, ShieldCheck, UserCog, UserPlus, UserRound,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { SelectMenu, type SelectOption } from '../../components/ui/SelectMenu';
import type { Role, User } from '../../types';
import { createUserSchema, type CreateUserFormValues, type EditUserFormValues } from '../../lib/validationSchemas';
import './UserFormModal.css';

const palette = [
  { color: '#2F5D8F', tint: '#EEF4FA', ink: '#2F5D8F', ring: 'rgba(47, 93, 143, 0.18)' },
  { color: '#10B981', tint: '#E8F8F2', ink: '#047857', ring: 'rgba(16, 185, 129, 0.18)' },
  { color: '#F97316', tint: '#FFF4EA', ink: '#C2410C', ring: 'rgba(249, 115, 22, 0.18)' },
  { color: '#8B5CF6', tint: '#F5F3FF', ink: '#6D28D9', ring: 'rgba(139, 92, 246, 0.18)' },
  { color: '#F59E0B', tint: '#FFFBEB', ink: '#B45309', ring: 'rgba(245, 158, 11, 0.18)' },
  { color: '#14B8A6', tint: '#E0F7F4', ink: '#0F766E', ring: 'rgba(20, 184, 129, 0.18)' },
  { color: '#6366F1', tint: '#EEF2FF', ink: '#4338CA', ring: 'rgba(99, 102, 241, 0.18)' },
  { color: '#EC4899', tint: '#FDF2F8', ink: '#BE185D', ring: 'rgba(236, 72, 153, 0.18)' },
];
const passwordMinimum = createUserSchema.shape.password.minLength ?? 0;

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

function rolePresentation(role: Role) {
  const normalized = role.name.trim().toLowerCase();
  if (normalized === 'administrator' || normalized === 'admin') return { ...palette[0], Icon: ShieldCheck };
  if (normalized === 'receptionist') return { ...palette[3], Icon: Headset };
  if (normalized === 'salesman') return { ...palette[5], Icon: BriefcaseBusiness };
  return { ...palette[hash(normalized || 'role') % palette.length], Icon: UserCog };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  roles: Role[];
  saving: boolean;
  createForm: UseFormReturn<CreateUserFormValues>;
  editForm: UseFormReturn<EditUserFormValues>;
  onClose: () => void;
  onCreate: (values: CreateUserFormValues) => void;
  onEdit: (values: EditUserFormValues) => void;
}

function UserField({
  id,
  label,
  labelId,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  labelId?: string;
  error?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={`user-form-field${error ? ' has-error' : ''}`}>
      <div className="user-form-label-row">
        <label id={labelId} htmlFor={id} className="user-form-label">
          {label}<span className="user-form-required" aria-hidden="true">*</span>
        </label>
        {hint}
      </div>
      {children}
      {error && (
        <p className="user-form-error" id={errorId} role="alert">
          <AlertCircle aria-hidden="true" />{error}
        </p>
      )}
    </div>
  );
}

export default function UserFormModal({
  open,
  editingUser,
  roles,
  saving,
  createForm,
  editForm,
  onClose,
  onCreate,
  onEdit,
}: UserFormModalProps) {
  const ids = useId();
  const createFormId = `${ids}-create-form`;
  const editFormId = `${ids}-edit-form`;
  const emailId = `${ids}-email`;
  const fullNameId = `${ids}-full-name`;
  const passwordId = `${ids}-password`;
  const roleId = `${ids}-role`;
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const createValues = useWatch({ control: createForm.control });
  const editName = useWatch({ control: editForm.control, name: 'full_name' });
  const createRoleValue = useWatch({ control: createForm.control, name: 'role_id' });
  const editRoleValue = useWatch({ control: editForm.control, name: 'role_id' });
  const roleValue = editingUser ? editRoleValue : createRoleValue;
  const selectedRole = roles.find((role) => role.id === roleValue);
  const selectedPresentation = selectedRole ? rolePresentation(selectedRole) : null;
  const email = createValues.email || '';
  const fullName = editingUser ? editName || '' : createValues.full_name || '';
  const password = createValues.password || '';
  const passwordMeetsMinimum = password.length >= passwordMinimum;
  const [announcedPasswordStatus, setAnnouncedPasswordStatus] = useState(passwordMeetsMinimum);
  const passwordRegistration = createForm.register('password');

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setPasswordFocused(false);
      setCapsLock(false);
    }
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncedPasswordStatus(passwordMeetsMinimum), 400);
    return () => window.clearTimeout(timer);
  }, [passwordMeetsMinimum]);

  const roleOptions = useMemo<SelectOption[]>(() => roles.map((role) => {
    const presentation = rolePresentation(role);
    const Icon = presentation.Icon;
    return {
      value: String(role.id),
      label: role.name,
      dotColor: presentation.color,
      icon: (
        <span
          className="user-role-option-badge"
          style={{ color: presentation.ink, backgroundColor: presentation.tint }}
        >
          <Icon />
        </span>
      ),
    };
  }), [roles]);

  const closeModal = () => {
    if (!saving) onClose();
  };

  const roleError = editingUser
    ? editForm.formState.errors.role_id?.message
    : createForm.formState.errors.role_id?.message;
  const roleSelect = (
    <div className={`user-form-role${roleError ? ' has-error' : ''}`}>
      <input
        type="hidden"
        {...(editingUser
          ? editForm.register('role_id', { valueAsNumber: true })
          : createForm.register('role_id', { valueAsNumber: true }))}
      />
      <SelectMenu
        id={roleId}
        value={roleValue ? String(roleValue) : ''}
        options={roleOptions}
        onChange={(value) => {
          const numericValue = Number(value);
          if (editingUser) {
            editForm.setValue('role_id', numericValue, {
              shouldDirty: true,
              shouldValidate: editForm.formState.isSubmitted,
            });
          } else {
            createForm.setValue('role_id', numericValue, {
              shouldDirty: true,
              shouldValidate: createForm.formState.isSubmitted,
            });
          }
        }}
        placeholder="Select a role..."
        ariaLabelledBy={`${roleId}-label`}
        ariaInvalid={Boolean(roleError)}
        ariaDescribedBy={roleError ? `${roleId}-error` : undefined}
        className="user-role-select"
        menuClassName="user-role-menu"
        showPlaceholderOnEmpty
        showTriggerTitle
        stopEscapePropagation
        disabled={saving}
        required
      />
    </div>
  );

  const selectedRolePill = selectedRole && selectedPresentation ? (
    <span
      className="user-preview-role"
      style={{
        color: selectedPresentation.ink,
        backgroundColor: selectedPresentation.tint,
        borderColor: selectedPresentation.ring,
      }}
    >
      <selectedPresentation.Icon aria-hidden="true" />
      {selectedRole.name}
    </span>
  ) : (
    <span className="user-preview-role is-placeholder">Select a role</span>
  );

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={editingUser ? 'Edit User' : 'Create User'}
      subtitle={editingUser ? 'Update this team member’s details and role' : 'Add a team member and choose their role'}
      variant="user"
      isBusy={saving}
      footer={(
        <>
          <div className="user-form-actions">
            <button type="button" className="user-form-cancel" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              form={editingUser ? editFormId : createFormId}
              className="user-form-submit"
              disabled={saving}
              aria-busy={saving}
            >
              {saving
                ? <Loader2 className="user-form-submit-spinner" aria-hidden="true" />
                : editingUser
                  ? <Save className="user-form-submit-icon" aria-hidden="true" />
                  : <UserPlus className="user-form-submit-icon" aria-hidden="true" />}
              <span>{saving ? (editingUser ? 'Saving…' : 'Creating…') : (editingUser ? 'Update' : 'Create')}</span>
            </button>
          </div>
          <span className="user-form-submit-hint" aria-hidden="true">
            <kbd>↵</kbd> Enter to {editingUser ? 'update' : 'create'}
          </span>
        </>
      )}
    >
      {editingUser ? (
        <form
          id={editFormId}
          onSubmit={editForm.handleSubmit(onEdit)}
          className="user-form"
          noValidate
        >
          <UserField
            id={fullNameId}
            label="Full Name"
            error={editForm.formState.errors.full_name?.message}
          >
            <span className="user-form-control">
              <UserRound className="user-form-leading-icon" aria-hidden="true" />
              <input
                id={fullNameId}
                data-user-autofocus
                type="text"
                placeholder="John Doe"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                readOnly={saving}
                aria-invalid={Boolean(editForm.formState.errors.full_name)}
                aria-required="true"
                aria-describedby={editForm.formState.errors.full_name ? `${fullNameId}-error` : undefined}
                {...editForm.register('full_name')}
              />
            </span>
          </UserField>
          <UserField
            id={roleId}
            labelId={`${roleId}-label`}
            label="Role"
            error={editForm.formState.errors.role_id?.message}
          >
            {roleSelect}
          </UserField>
        </form>
      ) : (
        <form
          id={createFormId}
          onSubmit={createForm.handleSubmit(onCreate)}
          className="user-form"
          noValidate
        >
          <UserField
            id={emailId}
            label="Email"
            error={createForm.formState.errors.email?.message}
          >
            <span className="user-form-control">
              <Mail className="user-form-leading-icon" aria-hidden="true" />
              <input
                id={emailId}
                data-user-autofocus
                type="email"
                inputMode="email"
                placeholder="user@example.com"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                readOnly={saving}
                aria-invalid={Boolean(createForm.formState.errors.email)}
                aria-required="true"
                aria-describedby={createForm.formState.errors.email ? `${emailId}-error` : undefined}
                {...createForm.register('email')}
              />
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                <Check className="user-form-email-check" aria-label="Email format looks valid" />
              )}
            </span>
          </UserField>
          <UserField
            id={fullNameId}
            label="Full Name"
            error={createForm.formState.errors.full_name?.message}
          >
            <span className="user-form-control">
              <UserRound className="user-form-leading-icon" aria-hidden="true" />
              <input
                id={fullNameId}
                type="text"
                placeholder="John Doe"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                readOnly={saving}
                aria-invalid={Boolean(createForm.formState.errors.full_name)}
                aria-required="true"
                aria-describedby={createForm.formState.errors.full_name ? `${fullNameId}-error` : undefined}
                {...createForm.register('full_name')}
              />
            </span>
          </UserField>
          <UserField
            id={passwordId}
            label="Password"
            error={createForm.formState.errors.password?.message}
            hint={capsLock && passwordFocused ? <span className="user-form-caps-hint">Caps Lock is on</span> : undefined}
          >
            <span className="user-form-control">
              <LockKeyhole className="user-form-leading-icon" aria-hidden="true" />
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                placeholder={`Min. ${passwordMinimum} characters`}
                autoComplete="new-password"
                autoCapitalize="off"
                spellCheck={false}
                readOnly={saving}
                aria-invalid={Boolean(createForm.formState.errors.password)}
                aria-required="true"
                aria-describedby={createForm.formState.errors.password ? `${passwordId}-error` : undefined}
                {...passwordRegistration}
                onFocus={() => setPasswordFocused(true)}
                onBlur={(event) => {
                  passwordRegistration.onBlur(event);
                  setPasswordFocused(false);
                }}
                onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
              />
              <button
                type="button"
                className="user-form-password-toggle"
                disabled={saving}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Eye className={!showPassword ? 'is-visible' : ''} aria-hidden="true" />
                <EyeOff className={showPassword ? 'is-visible' : ''} aria-hidden="true" />
              </button>
            </span>
            <div className={`user-password-progress${passwordMeetsMinimum ? ' is-complete' : ''}`} aria-live="off">
              <span className="user-password-ring" style={{ '--password-progress': `${Math.min(password.length / passwordMinimum, 1) * 100}%` } as CSSProperties}>
                {passwordMeetsMinimum && <Check aria-hidden="true" />}
              </span>
              <span>{passwordMeetsMinimum ? 'Meets the minimum length' : `Min. ${passwordMinimum} characters`}</span>
            </div>
            <span className="user-password-live" aria-live="polite" aria-atomic="true">
              {announcedPasswordStatus ? 'Meets the minimum length' : `Min. ${passwordMinimum} characters`}
            </span>
          </UserField>
          <UserField
            id={roleId}
            labelId={`${roleId}-label`}
            label="Role"
            error={createForm.formState.errors.role_id?.message}
          >
            {roleSelect}
          </UserField>
          <div className="user-preview" aria-hidden="true">
            <span className="user-preview-caption">Will appear as</span>
            <div className="user-preview-row">
              <span className="user-preview-avatar" key={`avatar-${initials(fullName)}`}>
                {initials(fullName) || <UserRound />}
              </span>
              <div className="user-preview-identity">
                <span key={`name-${fullName}`} className={`user-preview-name${fullName ? '' : ' is-placeholder'}`}>{fullName || 'Full name'}</span>
                <span key={`email-${email}`} className={`user-preview-email${email ? '' : ' is-placeholder'}`}>{email || 'email@example.com'}</span>
              </div>
              {selectedRolePill}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
