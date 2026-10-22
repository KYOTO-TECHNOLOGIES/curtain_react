import { useState, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Search, SearchX, Pencil, Trash2, Loader2, MapPin, User, UserRound, UserPlus, Mail,
  Globe, Building2, CheckCircle2, UsersRound, X, Copy, Check, ContactRound, Keyboard, AlertCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { customersApi } from '../../api/customers';
import type { Customer, UpdateCustomerRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { FlagAE } from '../../components/appointments/countryData';
import { useToast } from '../../components/ui/Toast';
import { customerSchema, type CustomerFormValues } from '../../lib/validationSchemas';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePagination } from '../../hooks/usePagination';
import './CustomersPage.css';
import './CustomerFormModal.css';

interface CustomerFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  edited?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

function CustomerFormField({
  id,
  label,
  required = false,
  edited = false,
  error,
  className = '',
  children,
}: CustomerFormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className={`customer-form-field${className ? ` ${className}` : ''}${error ? ' has-error' : ''}`}>
      <div className="customer-form-field__label-row">
        <label htmlFor={id}>
          {label}{required && <span className="customer-form-field__required" aria-hidden="true">*</span>}
        </label>
        {edited && <span className="customer-form-field__edited"><i aria-hidden="true" />Edited</span>}
        {!required && <span className="customer-form-field__optional">Optional</span>}
      </div>
      {children}
      {error && <p className="customer-form-field__error" id={errorId} role="alert"><AlertCircle aria-hidden="true" />{error}</p>}
    </div>
  );
}

const customerAvatarPalette = [
  { color: '#2F5D8F', tint: '#EEF4FA', ink: '#2F5D8F' },
  { color: '#10B981', tint: '#E8F8F2', ink: '#047857' },
  { color: '#F97316', tint: '#FFF4EA', ink: '#C2410C' },
  { color: '#8B5CF6', tint: '#F5F3FF', ink: '#6D28D9' },
  { color: '#F59E0B', tint: '#FFFBEB', ink: '#B45309' },
  { color: '#14B8A6', tint: '#E0F7F4', ink: '#0F766E' },
  { color: '#6366F1', tint: '#EEF2FF', ink: '#4338CA' },
  { color: '#EC4899', tint: '#FDF2F8', ink: '#BE185D' },
];

function getCustomerColor(id: number) {
  const hash = String(id).split('').reduce((value, character) => (
    (value * 31 + character.charCodeAt(0)) | 0
  ), 0);
  return customerAvatarPalette[Math.abs(hash) % customerAvatarPalette.length];
}

function getCustomerInitials(firstName: string, lastName: string) {
  const first = firstName.trim().split(/\s+/)[0] || '';
  const last = lastName.trim().split(/\s+/)[0] || '';
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || 'C';
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialCustomerIds = useRef<Set<number>>(new Set());
  const initialRowsCaptured = useRef(false);
  const initialRowsTimer = useRef<number | undefined>(undefined);
  const [tableScrollPosition, setTableScrollPosition] = useState({ hasScrolled: false, atEnd: true });
  const [initialRowsFinished, setInitialRowsFinished] = useState(false);
  const [copiedValue, setCopiedValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pagination = usePagination();

  useEffect(() => {
    const element = tableScrollRef.current;
    if (!element) return;
    const updateScrollPosition = () => setTableScrollPosition({
      hasScrolled: element.scrollLeft > 0,
      atEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    });
    updateScrollPosition();
    element.addEventListener('scroll', updateScrollPosition, { passive: true });
    window.addEventListener('resize', updateScrollPosition);
    return () => {
      element.removeEventListener('scroll', updateScrollPosition);
      window.removeEventListener('resize', updateScrollPosition);
    };
  }, []);

  // Debounce search for backend call
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    pagination.resetPage();
  }, [debouncedSearch]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '',
      company_name: '', address_line_1: '', address_line_2: '', city: '', country: '', notes: ''
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = form;
  const currentFormValues = form.watch();

  const { data: customersRes, isLoading, refetch } = useQuery({
    queryKey: ['customers', debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => customersApi.list({
      search: debouncedSearch || undefined,
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { items: customers, totalCount }: { items: Customer[]; totalCount: number } = useMemo(() => {
    const raw = customersRes?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as Customer[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw as Customer[], totalCount: raw.length };
    if (Array.isArray(customersRes)) return { items: customersRes as unknown as Customer[], totalCount: (customersRes as any).length };
    return { items: [] as Customer[], totalCount: 0 };
  }, [customersRes]);
  const loading = isLoading;

  useEffect(() => {
    if (!loading && customersRes && !initialRowsCaptured.current) {
      initialRowsCaptured.current = true;
      initialCustomerIds.current = new Set(customers.map((customer) => customer.id));
      initialRowsTimer.current = window.setTimeout(() => setInitialRowsFinished(true), 800);
    }
  }, [customers, customersRes, loading]);

  useEffect(() => () => {
    if (initialRowsTimer.current !== undefined) window.clearTimeout(initialRowsTimer.current);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const copyCustomerValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      showToast('Copied');
      window.setTimeout(() => setCopiedValue((current) => current === value ? '' : current), 1400);
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const load = () => {
    refetch();
  };

  const openCreate = () => {
    setEditingCustomer(null);
    reset({
      first_name: '', last_name: '', email: '', phone: '',
      company_name: '', address_line_1: '', address_line_2: '', city: '', country: '', notes: ''
    });
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    reset({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email || '',
      phone: c.phone || '',
      company_name: c.company_name || '',
      address_line_1: c.address_line_1 || '',
      address_line_2: c.address_line_2 || '',
      city: c.city || '',
      country: c.country || '',
      notes: c.notes || ''
    });
    setFormOpen(true);
  };

  const onSubmit = async (data: CustomerFormValues) => {
    setSaving(true);
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, data as UpdateCustomerRequest);
        showToast('Customer updated successfully');
      } else {
        await customersApi.create(data);
        showToast('Customer created successfully');
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Operation failed', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customersApi.delete(deleteTarget.id);
      showToast('Customer deleted');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Failed to delete customer', 'error');
    }
    setDeleting(false);
  };

  const filtered = customers;
  const isSearchActive = Boolean(debouncedSearch.trim());
  const customerCountLabel = isSearchActive
    ? `Showing ${filtered.length} of ${totalCount}`
    : `${totalCount} ${totalCount === 1 ? 'customer' : 'customers'}`;
  const modalAvatarColor = editingCustomer ? getCustomerColor(editingCustomer.id) : null;
  const customerModalBadge = editingCustomer && modalAvatarColor ? (
    <span
      className="customer-modal-avatar"
      style={{
        '--customer-accent': modalAvatarColor.color,
        '--customer-tint': modalAvatarColor.tint,
        '--customer-ink': modalAvatarColor.ink,
      } as CSSProperties}
      aria-hidden="true"
    >
      {getCustomerInitials(editingCustomer.first_name, editingCustomer.last_name) || <UserRound />}
    </span>
  ) : (
    <span className="customer-modal-icon-badge" aria-hidden="true"><UserPlus /></span>
  );

  return (
    <div className="customers-page">
      <header className="customers-page__header customers-page__enter">
        <div className="customers-page__title-row">
          <span className="customers-page__title-icon" aria-hidden="true">
            <ContactRound />
          </span>
          <div className="customers-page__title-copy">
            <h1>Customers</h1>
            <p>Manage customer directory and details</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="customers-page__add-button">
          <Plus aria-hidden="true" /> <span>Add Customer</span>
        </button>
      </header>

      <section className="customers-table-card customers-page__enter" aria-label="Customer directory">
        <div className="customers-toolbar">
          <div className="customers-toolbar__search-control">
            <Search className="customers-toolbar__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search customers"
              className="customers-toolbar__search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                className="customers-toolbar__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            ) : (
              <span className="customers-toolbar__shortcut" aria-hidden="true">
                <Keyboard /> /
              </span>
            )}
          </div>
          <div className={`customers-count${isSearchActive ? ' is-searching' : ''}`} aria-live="polite" aria-atomic="true">
            {isSearchActive && <span className="customers-count__dot" aria-hidden="true" />}
            <UsersRound aria-hidden="true" />
            <span key={customerCountLabel} className="customers-count__label">{customerCountLabel}</span>
          </div>
        </div>

        <div
          ref={tableScrollRef}
          className={`customers-table-scroll${tableScrollPosition.hasScrolled ? ' is-scrolled' : ''}`}
        >
          <table className="customers-data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Company</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col">Location</th>
                <th scope="col">Created</th>
                <th scope="col" className="customers-actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr className="customers-skeleton-row" key={`customer-skeleton-${index}`} aria-hidden="true">
                    <td><span className="customers-skeleton customers-skeleton--id" /></td>
                    <td><span className="customers-skeleton-customer"><i /><span><b /><em /></span></span></td>
                    <td><span className="customers-skeleton customers-skeleton--company" /></td>
                    <td><span className="customers-skeleton customers-skeleton--phone" /></td>
                    <td><span className="customers-skeleton customers-skeleton--email" /></td>
                    <td><span className="customers-skeleton customers-skeleton--location" /></td>
                    <td><span className="customers-skeleton customers-skeleton--date" /></td>
                    <td><span className="customers-skeleton customers-skeleton--actions" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="customers-table-state">
                    <span className="customers-empty__icon" aria-hidden="true">
                      {isSearchActive ? <SearchX /> : <UsersRound />}
                    </span>
                    <strong>{isSearchActive ? 'No customers found' : 'No customers yet'}</strong>
                    <span>
                      {isSearchActive
                        ? 'Try a different name, phone or email'
                        : 'Customers will appear here once they are added.'}
                    </span>
                    {isSearchActive && (
                      <button type="button" className="customers-empty__clear" onClick={() => setSearchQuery('')}>
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map((c, index) => {
                const avatarColor = getCustomerColor(c.id);
                const location = [c.city, c.country].filter(Boolean).join(', ');
                const createdAt = c.created_at ? new Date(c.created_at) : null;
                const rowStyle = {
                  '--customer-accent': avatarColor.color,
                  '--customer-tint': avatarColor.tint,
                  '--customer-ink': avatarColor.ink,
                  '--row-index': Math.min(index, 11),
                } as CSSProperties;
                const rowAnimation = !initialRowsFinished && initialCustomerIds.current.has(c.id);
                return (
                <tr
                  key={c.id}
                  className={`customers-data-row${rowAnimation ? ' customers-data-row--enter' : ''}`}
                  style={rowStyle}
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td data-label="ID">
                    <span className="customers-id-chip">#{c.id}</span>
                  </td>
                  <td data-label="Customer" className="customers-customer-cell">
                    <div className="customers-customer">
                      <span className="customers-avatar" aria-hidden="true">{getCustomerInitials(c.first_name, c.last_name)}</span>
                      <span className="customers-customer__details">
                        <span className="customers-customer__name" title={c.full_name}>{c.full_name}</span>
                        <StatusBadge
                          status={c.is_active ? 'active' : 'inactive'}
                          label={c.is_active ? 'Active' : 'Inactive'}
                          className="customers-status-badge"
                        />
                      </span>
                    </div>
                  </td>
                  <td data-label="Company">
                    {c.company_name ? (
                      <span className="customers-company" title={c.company_name}>
                        <Building2 aria-hidden="true" /> <span>{c.company_name}</span>
                      </span>
                    ) : (
                      <span className="customers-individual">
                        <User aria-hidden="true" /> Individual
                      </span>
                    )}
                  </td>
                  <td data-label="Phone">
                    {c.phone ? (
                      <span className="customers-copy-cell customers-phone">
                        <span title={c.phone}>{c.phone}</span>
                        <button
                          type="button"
                          className="customers-copy-button"
                          aria-label={`Copy phone number for ${c.full_name}`}
                          title={copiedValue === c.phone ? 'Copied' : 'Copy phone number'}
                          onClick={(event) => {
                            event.stopPropagation();
                            void copyCustomerValue(c.phone);
                          }}
                        >
                          {copiedValue === c.phone ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                        </button>
                      </span>
                    ) : <span className="customers-empty-value">—</span>}
                  </td>
                  <td data-label="Email">
                    {c.email ? (
                      <span className="customers-copy-cell customers-email">
                        <span className="customers-email__value" title={c.email}>{c.email}</span>
                        <button
                          type="button"
                          className="customers-copy-button"
                          aria-label={`Copy email for ${c.full_name}`}
                          title={copiedValue === c.email ? 'Copied' : 'Copy email'}
                          onClick={(event) => {
                            event.stopPropagation();
                            void copyCustomerValue(c.email);
                          }}
                        >
                          {copiedValue === c.email ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                        </button>
                      </span>
                    ) : (
                      <span className="customers-empty-value">—<span className="customers-visually-hidden">Not provided</span></span>
                    )}
                  </td>
                  <td data-label="Location">
                    {location ? (
                      <span className="customers-location" title={location}>
                        <MapPin aria-hidden="true" /> <span>{location}</span>
                      </span>
                    ) : <span className="customers-empty-value">—</span>}
                  </td>
                  <td data-label="Created">
                    {createdAt && !Number.isNaN(createdAt.getTime()) ? (
                      <time className="customers-created" dateTime={c.created_at}>
                        {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(createdAt)}
                      </time>
                    ) : <span className="customers-empty-value">—</span>}
                  </td>
                  <td data-label="Actions" className="customers-actions-cell" onClick={(event) => event.stopPropagation()}>
                    <div className="customers-actions">
                      <button type="button" onClick={() => openEdit(c)} aria-label={`Edit ${c.full_name}`} title="Edit customer">
                        <Pencil aria-hidden="true" /><span>Edit</span>
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.full_name}`} title="Delete customer">
                        <Trash2 aria-hidden="true" /><span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          totalCount={totalCount}
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          loading={isLoading}
        />
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Create Customer'}
        subtitle={editingCustomer ? 'Update contact details and company information' : 'Add a customer to your directory'}
        context={editingCustomer ? `#${editingCustomer.id}` : undefined}
        headerMeta={editingCustomer && (
          <StatusBadge
            status={editingCustomer.is_active ? 'active' : 'inactive'}
            label={editingCustomer.is_active ? 'Active' : 'Inactive'}
            className="customer-modal-status"
          />
        )}
        headerBadgeContent={customerModalBadge}
        variant="customer"
        isBusy={saving}
        footer={(
          <div className="customer-modal-footer-content">
            <div className="customer-modal-footer-buttons">
              <button
                type="button"
                className="customer-modal-cancel"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="customer-form"
                className="customer-modal-submit"
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? <Loader2 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                <span>{saving ? 'Saving…' : editingCustomer ? 'Update Customer' : 'Create Customer'}</span>
              </button>
            </div>
            <span className="customer-modal-submit-hint" aria-hidden="true"><kbd>↵</kbd> Enter to save</span>
          </div>
        )}
      >
        <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="customer-modal-form" noValidate>
          <section className="customer-form-section">
            <div className="customer-form-section__heading">
              <span className="customer-form-section__icon customer-form-section__icon--personal"><User aria-hidden="true" /></span>
              <h3>Personal Information</h3>
              <span aria-hidden="true" />
            </div>
            <div className="customer-form-grid">
              <CustomerFormField
                id="customer-first-name"
                label="First Name"
                required
                edited={Boolean(editingCustomer && (currentFormValues.first_name ?? '') !== editingCustomer.first_name)}
                error={errors.first_name?.message}
              >
                <div className="customer-modal-control">
                  <UserRound className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('first_name')}
                    id="customer-first-name"
                    data-customer-autofocus
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    readOnly={saving}
                    aria-invalid={Boolean(errors.first_name)}
                    aria-describedby={errors.first_name ? 'customer-first-name-error' : undefined}
                    placeholder="e.g. Abdullah"
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-last-name"
                label="Last Name"
                required
                edited={Boolean(editingCustomer && (currentFormValues.last_name ?? '') !== editingCustomer.last_name)}
                error={errors.last_name?.message}
              >
                <div className="customer-modal-control">
                  <UserRound className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('last_name')}
                    id="customer-last-name"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    readOnly={saving}
                    aria-invalid={Boolean(errors.last_name)}
                    aria-describedby={errors.last_name ? 'customer-last-name-error' : undefined}
                    placeholder="e.g. Ahmed"
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-email"
                label="Email Address"
                edited={Boolean(editingCustomer && (currentFormValues.email ?? '') !== (editingCustomer.email || ''))}
                error={errors.email?.message}
              >
                <div className="customer-modal-control">
                  <Mail className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('email')}
                    id="customer-email"
                    type="email"
                    inputMode="email"
                    autoCapitalize="off"
                    spellCheck={false}
                    readOnly={saving}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'customer-email-error' : undefined}
                    placeholder="customer@example.com"
                  />
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormValues.email || '') && (
                    <Check className="customer-modal-email-check" aria-label="Email format looks valid" />
                  )}
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-phone"
                label="Phone Number"
                edited={Boolean(editingCustomer && (currentFormValues.phone ?? '') !== (editingCustomer.phone || ''))}
                error={errors.phone?.message}
              >
                <div className={`customer-modal-control customer-modal-phone${errors.phone ? ' has-error' : ''}`}>
                  <span className="customer-modal-phone__country" aria-hidden="true">
                    <FlagAE />
                    <span>+971</span>
                  </span>
                  <input
                    {...register('phone')}
                    id="customer-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'customer-phone-error' : undefined}
                    placeholder="50 000 0000"
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-company"
                label="Company Name"
                className="customer-form-field--full"
                edited={Boolean(editingCustomer && (currentFormValues.company_name ?? '') !== (editingCustomer.company_name || ''))}
                error={errors.company_name?.message}
              >
                <div className="customer-modal-control">
                  <Building2 className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('company_name')}
                    id="customer-company"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.company_name)}
                    aria-describedby={errors.company_name ? 'customer-company-error' : undefined}
                    placeholder="e.g. ACME LLC"
                  />
                </div>
              </CustomerFormField>
            </div>
          </section>

          <section className="customer-form-section">
            <div className="customer-form-section__heading">
              <span className="customer-form-section__icon customer-form-section__icon--location"><MapPin aria-hidden="true" /></span>
              <h3>Location Details</h3>
              <span aria-hidden="true" />
            </div>
            <div className="customer-form-grid">
              <CustomerFormField
                id="customer-address-1"
                label="Address Line 1"
                className="customer-form-field--full"
                edited={Boolean(editingCustomer && (currentFormValues.address_line_1 ?? '') !== (editingCustomer.address_line_1 || ''))}
                error={errors.address_line_1?.message}
              >
                <div className="customer-modal-control">
                  <MapPin className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('address_line_1')}
                    id="customer-address-1"
                    type="text"
                    autoComplete="off"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.address_line_1)}
                    aria-describedby={errors.address_line_1 ? 'customer-address-1-error' : undefined}
                    placeholder="Street address"
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-address-2"
                label="Address Line 2"
                className="customer-form-field--full"
                edited={Boolean(editingCustomer && (currentFormValues.address_line_2 ?? '') !== (editingCustomer.address_line_2 || ''))}
                error={errors.address_line_2?.message}
              >
                <div className="customer-modal-control">
                  <MapPin className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('address_line_2')}
                    id="customer-address-2"
                    type="text"
                    autoComplete="off"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.address_line_2)}
                    aria-describedby={errors.address_line_2 ? 'customer-address-2-error' : undefined}
                    placeholder="Apartment, suite, building, etc."
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-city"
                label="City"
                edited={Boolean(editingCustomer && (currentFormValues.city ?? '') !== (editingCustomer.city || ''))}
                error={errors.city?.message}
              >
                <div className="customer-modal-control">
                  <Globe className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('city')}
                    id="customer-city"
                    type="text"
                    autoComplete="address-level2"
                    autoCapitalize="words"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? 'customer-city-error' : undefined}
                    placeholder="Dubai"
                  />
                </div>
              </CustomerFormField>
              <CustomerFormField
                id="customer-country"
                label="Country"
                edited={Boolean(editingCustomer && (currentFormValues.country ?? '') !== (editingCustomer.country || ''))}
                error={errors.country?.message}
              >
                <div className="customer-modal-control">
                  <Globe className="customer-modal-control__icon" aria-hidden="true" />
                  <input
                    {...register('country')}
                    id="customer-country"
                    type="text"
                    autoComplete="country-name"
                    autoCapitalize="words"
                    readOnly={saving}
                    aria-invalid={Boolean(errors.country)}
                    aria-describedby={errors.country ? 'customer-country-error' : undefined}
                    placeholder="UAE"
                  />
                </div>
              </CustomerFormField>
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"?`}
        isLoading={deleting}
      />
    </div>
  );
}
