import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Loader2, KeyRound } from 'lucide-react';
import { permissionsApi } from '../../api/permissions';
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function PermissionsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<CreatePermissionRequest>({ name: '', description: '' });
  const { data: permissionsRes, isLoading, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.list()
  });

  const permissions: Permission[] = Array.isArray(permissionsRes?.data)
    ? (permissionsRes.data as Permission[])
    : Array.isArray((permissionsRes?.data as any)?.results)
    ? ((permissionsRes?.data as any).results as Permission[])
    : [];
  const loading = isLoading;

  const load = () => {
    refetch();
  };

  const openCreate = () => {
    setEditingPermission(null);
    setForm({ name: '', description: '' });
    setFormOpen(true);
  };

  const openEdit = (p: Permission) => {
    setEditingPermission(p);
    setForm({ name: p.name, description: p.description });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPermission) {
        await permissionsApi.update(editingPermission.id, form as UpdatePermissionRequest);
        showToast('Permission updated');
      } else {
        await permissionsApi.create(form);
        showToast('Permission created');
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
      await permissionsApi.delete(deleteTarget.id);
      showToast('Permission deleted');
      setDeleteTarget(null);
      load();
    } catch { showToast('Failed to delete permission', 'error'); }
    setDeleting(false);
  };

  const filtered = permissions.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-[32px] md:text-[42px] font-bold text-[#1e293b] tracking-tight leading-none">Permissions</h1>
          <p className="mt-3 text-slate-500 font-medium text-[16px]">Manage system permissions for access control</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 md:py-4 bg-[#2b5c8f] text-white text-[16px] font-semibold rounded-2xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]">
          <Plus className="w-5 h-5" /> Add Permission
        </button>
      </div>

      <div className="relative mb-6 group">
        <div className="flex items-center bg-white rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 transition-all duration-300 w-full sm:w-[400px]">
          <Search className="w-[22px] h-[22px] text-slate-600 mr-4 group-focus-within:text-[#2b5c8f] transition-colors" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400/80 font-medium text-[16px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/60 text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs w-[35%]">Permission Key</th>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Description</th>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-16 text-center text-slate-400">No permissions found</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><KeyRound className="w-4 h-4" /></div>
                    <span className="font-mono text-sm font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{p.description}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingPermission ? 'Edit Permission' : 'Create Permission'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[15px] font-bold text-[#1e293b] mb-2">Permission Key <span className="text-red-500">*</span></label>
            <div className="group relative flex items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
              <input type="text" required placeholder="e.g. view_reports" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400/80 font-medium text-[16px] font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-[15px] font-bold text-[#1e293b] mb-2">Description <span className="text-red-500">*</span></label>
            <div className="group relative flex items-start bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm focus-within:shadow-[0_4px_25px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 focus-within:border-[#2b5c8f] transition-all duration-300">
              <textarea required rows={3} placeholder="Describe the permission..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400/80 font-medium text-[16px] resize-none" />
            </div>
          </div>
          <div className="flex gap-4 pt-4 mt-8">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-[16px] hover:bg-slate-50 hover:text-slate-800 transition-colors active:scale-[0.98]">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center px-6 py-4 rounded-2xl bg-[#2b5c8f] text-white font-semibold text-[16px] hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPermission ? 'Update Permission' : 'Create Permission'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Permission" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} isLoading={deleting} />
    </div>
  );
}
