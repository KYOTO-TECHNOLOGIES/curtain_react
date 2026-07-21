import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { rolesApi } from '../../api/roles';
import { permissionsApi } from '../../api/permissions';
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function RolesPage() {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<CreateRoleRequest>({ name: '', description: '', permission_ids: [] });

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(rRes.data);
      setPermissions(pRes.data);
    } catch { showToast('Failed to load roles', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '', permission_ids: [] });
    setFormOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditingRole(r);
    setForm({ name: r.name, description: r.description, permission_ids: r.permissions.map((p) => p.id) });
    setFormOpen(true);
  };

  const togglePermission = (id: number) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids?.includes(id)
        ? prev.permission_ids.filter((p) => p !== id)
        : [...(prev.permission_ids || []), id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, form as UpdateRoleRequest);
        showToast('Role updated');
      } else {
        await rolesApi.create(form);
        showToast('Role created');
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
      await rolesApi.delete(deleteTarget.id);
      showToast('Role deleted');
      setDeleteTarget(null);
      load();
    } catch { showToast('Failed to delete role', 'error'); }
    setDeleting(false);
  };

  const filtered = roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
          <p className="text-slate-500 text-sm mt-0.5">Define user roles and assign permissions</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search roles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/60 text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Role Name</th>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Permissions</th>
              <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-16 text-center text-slate-400">No roles found</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-50 text-violet-600"><ShieldAlert className="w-4 h-4" /></div>
                    <div>
                      <p className="font-semibold text-slate-800">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map((p) => (
                      <span key={p.id} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{p.name}</span>
                    ))}
                    {r.permissions.length === 0 && <span className="text-slate-400 text-xs italic">No permissions</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(r)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingRole ? 'Edit Role' : 'Create Role'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={form.permission_ids?.includes(p.id) || false} onChange={() => togglePermission(p.id)} className="w-4 h-4 text-[#2b5c8f] rounded border-slate-300 focus:ring-[#2b5c8f]" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">{saving ? 'Saving…' : editingRole ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Role" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} isLoading={deleting} />
    </div>
  );
}
