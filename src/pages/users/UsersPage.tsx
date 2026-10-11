import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import type { User, UpdateUserRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { createUserSchema, editUserSchema, type CreateUserFormValues, type EditUserFormValues } from '../../lib/validationSchemas';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

// Shared field styles
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`;

const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {message}
    </p>
  ) : null;

export default function UsersPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pagination = usePagination();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const { items: users, totalCount } = useMemo(() => {
    const raw = usersRes?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as User[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(usersRes)) return { items: usersRes as any, totalCount: (usersRes as any).length };
    return { items: [] as User[], totalCount: 0 };
  }, [usersRes]);

  const roles = Array.isArray(rolesRes?.data)
    ? rolesRes.data
    : Array.isArray((rolesRes?.data as any)?.results)
    ? (rolesRes?.data as any).results
    : [];
  const loading = loadingUsers || loadingRoles;

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

  const filtered = users;

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage system users and their roles</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2b5c8f] to-[#1f456e] flex items-center justify-center text-white text-xs font-semibold">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">{u.role?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        totalCount={totalCount}
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.setPageSize}
        loading={loadingUsers}
      />

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        {editingUser ? (
          /* ── Edit Form ── */
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="John Doe"
                {...editForm.register('full_name')}
                className={inputCls(!!editForm.formState.errors.full_name)}
              />
              <ErrorMsg message={editForm.formState.errors.full_name?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <select
                {...editForm.register('role_id', { valueAsNumber: true })}
                className={inputCls(!!editForm.formState.errors.role_id)}
              >
                <option value={0}>Select a role...</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ErrorMsg message={editForm.formState.errors.role_id?.message} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        ) : (
          /* ── Create Form ── */
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                placeholder="user@example.com"
                {...createForm.register('email')}
                className={inputCls(!!createForm.formState.errors.email)}
              />
              <ErrorMsg message={createForm.formState.errors.email?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="John Doe"
                {...createForm.register('full_name')}
                className={inputCls(!!createForm.formState.errors.full_name)}
              />
              <ErrorMsg message={createForm.formState.errors.full_name?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                {...createForm.register('password')}
                className={inputCls(!!createForm.formState.errors.password)}
              />
              <ErrorMsg message={createForm.formState.errors.password?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <select
                {...createForm.register('role_id', { valueAsNumber: true })}
                className={inputCls(!!createForm.formState.errors.role_id)}
              >
                <option value={0}>Select a role...</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ErrorMsg message={createForm.formState.errors.role_id?.message} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </Modal>

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
