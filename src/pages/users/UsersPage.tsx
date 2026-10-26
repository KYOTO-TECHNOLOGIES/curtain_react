import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Search, SearchX, UsersRound, Pencil, Trash2, Copy, Check,
  X, ShieldCheck, Headset, BriefcaseBusiness, UserCog,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import type { User, Role, UpdateUserRequest } from '../../types';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { createUserSchema, editUserSchema, type CreateUserFormValues, type EditUserFormValues } from '../../lib/validationSchemas';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import UserFormModal from './UserFormModal';
import './UsersPage.css';

export const userPalette = [
  { color: '#2F5D8F', tint: '#EEF4FA', ink: '#2F5D8F', ring: 'rgba(47, 93, 143, 0.18)' },
  { color: '#10B981', tint: '#E8F8F2', ink: '#047857', ring: 'rgba(16, 185, 129, 0.18)' },
  { color: '#F97316', tint: '#FFF4EA', ink: '#C2410C', ring: 'rgba(249, 115, 22, 0.18)' },
  { color: '#8B5CF6', tint: '#F5F3FF', ink: '#6D28D9', ring: 'rgba(139, 92, 246, 0.18)' },
  { color: '#F59E0B', tint: '#FFFBEB', ink: '#B45309', ring: 'rgba(245, 158, 11, 0.18)' },
  { color: '#14B8A6', tint: '#E0F7F4', ink: '#0F766E', ring: 'rgba(20, 184, 166, 0.18)' },
  { color: '#6366F1', tint: '#EEF2FF', ink: '#4338CA', ring: 'rgba(99, 102, 241, 0.18)' },
  { color: '#EC4899', tint: '#FDF2F8', ink: '#BE185D', ring: 'rgba(236, 72, 153, 0.18)' },
];

export function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getUserColor(user: User) {
  return userPalette[stableHash(String(user.id || user.full_name)) % userPalette.length];
}

export function getRolePresentation(roleName: string) {
  const normalized = roleName.trim().toLowerCase();
  if (normalized === 'administrator') {
    return { ...userPalette[0], Icon: ShieldCheck };
  }
  if (normalized === 'receptionist') {
    return { ...userPalette[3], Icon: Headset };
  }
  if (normalized === 'salesman') {
    return { ...userPalette[5], Icon: BriefcaseBusiness };
  }
  return {
    ...userPalette[stableHash(normalized || 'role') % userPalette.length],
    Icon: UserCog,
  };
}

export default function UsersPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [announcedSearch, setAnnouncedSearch] = useState('');
  const [allUsersCount, setAllUsersCount] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [initialRowsEntering, setInitialRowsEntering] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagination = usePagination();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnnouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (search) setInitialRowsEntering(false);
  }, [search]);

  useEffect(() => {
    const focusSearchOnSlash = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key !== '/' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target instanceof HTMLElement && (
          target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        )
      ) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearchOnSlash);
    return () => window.removeEventListener('keydown', focusSearchOnSlash);
  }, []);

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
  }, []);

  // Reset page when search changes
  useEffect(() => {
    pagination.resetPage();
  }, [debouncedSearch]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Create form
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', full_name: '', password: '', role_id: 0 },
  });

  // Edit form
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: '', role_id: 0 },
  });

  const { data: usersRes, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => usersApi.list({
      search: debouncedSearch || undefined,
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { data: rolesRes, isLoading: loadingRoles, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list()
  });

  const { items: users, totalCount }: { items: User[]; totalCount: number } = useMemo(() => {
    const raw = usersRes?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as User[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw as User[], totalCount: raw.length };
    if (Array.isArray(usersRes)) return { items: usersRes as unknown as User[], totalCount: (usersRes as any).length };
    return { items: [] as User[], totalCount: 0 };
  }, [usersRes]);

  const roles: Role[] = Array.isArray(rolesRes?.data)
    ? (rolesRes.data as Role[])
    : Array.isArray((rolesRes?.data as any)?.results)
    ? ((rolesRes?.data as any).results as Role[])
    : [];
  const loading = loadingUsers || loadingRoles;

  useEffect(() => {
    if (!debouncedSearch) setAllUsersCount(totalCount);
  }, [debouncedSearch, totalCount]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setInitialRowsEntering(false), 900);
    return () => clearTimeout(timer);
  }, [loading]);

  const load = () => {
    refetchUsers();
    refetchRoles();
  };

  const openCreate = () => {
    setEditingUser(null);
    createForm.reset({ email: '', full_name: '', password: '', role_id: roles[0]?.id || 0 });
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    editForm.reset({ full_name: u.full_name, role_id: u.role.id });
    setFormOpen(true);
  };

  const handleCreate = async (data: CreateUserFormValues) => {
    setSaving(true);
    try {
      await usersApi.create({ email: data.email, full_name: data.full_name, password: data.password, role_id: data.role_id });
      showToast('User created successfully');
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create user', 'error');
    }
    setSaving(false);
  };

  const handleEdit = async (data: EditUserFormValues) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload: UpdateUserRequest = { full_name: data.full_name, role_id: data.role_id };
      await usersApi.update(editingUser.id, payload);
      showToast('User updated successfully');
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update user', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      showToast('User deleted');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Failed to delete user', 'error');
    }
    setDeleting(false);
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedEmail(null), 1400);
      showToast('Copied');
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const filtered = users;
  const isSearchActive = Boolean(announcedSearch.trim());
  const visibleStart = totalCount === 0 ? 0 : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const visibleEnd = Math.min(pagination.currentPage * pagination.pageSize, totalCount);
  const userColumns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      size: 'flex',
      className: 'users-table__name-cell',
      render: (user) => (
        <div className="users-table__user">
          <span
            className="users-table__avatar"
            aria-hidden="true"
            style={{
              backgroundColor: getUserColor(user).tint,
              color: getUserColor(user).ink,
              boxShadow: `inset 0 0 0 1px ${getUserColor(user).ring}`,
            }}
          >
            {getInitials(user.full_name)}
          </span>
          <span className="users-table__name" title={user.full_name}>{user.full_name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      size: 'cap',
      className: 'users-table__email-cell',
      render: (user) => (
        <>
          <span className="users-table__email" title={user.email}>{user.email}</span>
          <button
            type="button"
            className="users-table__copy-button"
            aria-label={`Copy email for ${user.full_name}`}
            title={copiedEmail === user.email ? 'Copied' : 'Copy email'}
            onClick={() => void copyEmail(user.email)}
          >
            {copiedEmail === user.email ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      size: 'fit',
      className: 'users-table__role-cell',
      render: (user) => {
        const role = getRolePresentation(user.role?.name || '');
        const RoleIcon = role.Icon;
        return (
          <span
            className="users-table__role"
            style={{
              color: role.ink,
              backgroundColor: role.tint,
              borderColor: role.ring,
            }}
          >
            <RoleIcon aria-hidden="true" />
            {user.role?.name}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      size: 'fit',
      className: 'users-table__status-cell',
      render: (user) => (
        <StatusBadge
          status={user.is_active ? 'active' : 'inactive'}
          label={user.is_active ? 'Active' : 'Inactive'}
          className="users-table__status"
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      size: 'fit',
      align: 'right',
      className: 'users-table__actions-cell',
      render: (user) => (
        <div className="users-table__actions">
          <button
            type="button"
            onClick={() => openEdit(user)}
            className="users-table__action users-table__action--edit"
            title="Edit user"
            aria-label={`Edit ${user.full_name}`}
          >
            <Pencil aria-hidden="true" /><span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(user)}
            className="users-table__action users-table__action--delete"
            title="Delete user"
            aria-label={`Delete ${user.full_name}`}
          >
            <Trash2 aria-hidden="true" /><span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="users-page animate-page-in">
      {/* Header */}
      <div className="users-page__header">
        <div className="users-page__heading">
          <span className="users-page__icon-badge" aria-hidden="true"><UsersRound /></span>
          <div>
            <h1>Users</h1>
            <p>Manage system users and their roles</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="users-page__add-button">
          <Plus aria-hidden="true" /> <span>Add User</span>
        </button>
      </div>

      {/* Search and result count */}
      <div className="users-page__toolbar">
        <div className="users-page__search-wrap">
          <Search className="users-page__search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="users-page__search"
            aria-label="Search users"
          />
          {search && (
            <button
              type="button"
              className="users-page__clear-search"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X aria-hidden="true" />
            </button>
          )}
          {!search && <kbd className="users-page__shortcut" aria-hidden="true">/</kbd>}
        </div>
        <div className={`users-page__count${isSearchActive ? ' is-searching' : ''}`} aria-live="polite" aria-atomic="true">
          {isSearchActive && <span className="users-page__count-dot" aria-hidden="true" />}
          {!isSearchActive && <UsersRound className="users-page__count-icon" aria-hidden="true" />}
          <span className="users-page__count-value" key={`${isSearchActive}-${filtered.length}-${totalCount}`}>
            {isSearchActive
              ? `Showing ${totalCount.toLocaleString()} of ${allUsersCount.toLocaleString()}`
              : `${totalCount.toLocaleString()} ${totalCount === 1 ? 'user' : 'users'}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={userColumns}
        data={filtered}
        keyExtractor={(user) => user.id}
        loading={loading}
        className={`users-table-card${initialRowsEntering && !loading ? ' is-first-load' : ''}`}
        tableClassName="users-table"
        scrollClassName="users-table-scroll"
        animateRows={initialRowsEntering}
        animateDataChanges
        rowClassName={() => 'users-table__row'}
        rowStyle={(user) => ({
          '--user-accent': getRolePresentation(user.role?.name || '').color,
        }) as CSSProperties}
        skeletonCount={5}
        renderSkeletonRow={() => (
          <tr className="users-table__skeleton" aria-hidden="true">
            <td className="dt-col-flex"><span className="users-skeleton__name"><i /><b /></span></td>
            <td className="dt-col-cap"><span className="users-skeleton__line" /></td>
            <td className="dt-col-fit"><span className="users-skeleton__pill" /></td>
            <td className="dt-col-fit"><span className="users-skeleton__pill users-skeleton__pill--status" /></td>
            <td className="dt-col-fit dt-col-actions"><span className="users-skeleton__actions"><i /><i /></span></td>
          </tr>
        )}
        emptyContent={
          <div className="users-table__empty">
            <span className="users-table__empty-icon" aria-hidden="true">
              {isSearchActive ? <SearchX /> : <UsersRound />}
            </span>
            <strong>No users found</strong>
            {isSearchActive && (
              <>
                <span>Try a different name or email</span>
                <button type="button" onClick={() => setSearch('')}>Clear search</button>
              </>
            )}
          </div>
        }
        footer={(
          <span className="apt-footer-count users-table__footer">
            Showing <strong>{visibleStart}–{visibleEnd}</strong> of <strong>{totalCount.toLocaleString()}</strong>
          </span>
        )}
      />

      {/* Pagination */}
      <div className="users-page__pagination">
        <Pagination
          totalCount={totalCount}
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          loading={loadingUsers}
        />
      </div>

      {/* Form Modal */}
      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        roles={roles}
        saving={saving}
        createForm={createForm}
        editForm={editForm}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onEdit={handleEdit}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
