import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, KeyRound } from 'lucide-react';
import { permissionsApi } from '../../api/permissions';
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function PermissionsPage() {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<CreatePermissionRequest>({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await permissionsApi.list();
      setPermissions(res.data);
    } catch { showToast('Failed to load permissions', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Permissions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage system permissions for access control</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" /> Add Permission
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search permissions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
        />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Permission Key *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm font-mono" placeholder="e.g. view_reports" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">{saving ? 'Saving…' : editingPermission ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Permission" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} isLoading={deleting} />
    </div>
  );
}
