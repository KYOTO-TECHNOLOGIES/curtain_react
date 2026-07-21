import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { customersApi } from '../../api/customers';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields
  const [form, setForm] = useState<CreateCustomerRequest>({
    first_name: '', last_name: '', email: '', phone_number: '', company_name: '',
    address_line_1: '', city: '', country: '', notes: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await customersApi.list();
      setCustomers(res.data);
    } catch { showToast('Failed to load customers', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({
      first_name: '', last_name: '', email: '', phone_number: '', company_name: '',
      address_line_1: '', city: '', country: '', notes: ''
    });
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      first_name: c.first_name, last_name: c.last_name, email: c.email || '', 
      phone_number: c.phone_number || '', company_name: c.company_name || '',
      address_line_1: c.address_line_1 || '', city: c.city || '', 
      country: c.country || '', notes: c.notes || ''
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, form as UpdateCustomerRequest);
        showToast('Customer updated successfully');
      } else {
        await customersApi.create(form);
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
    } catch { showToast('Failed to delete customer', 'error'); }
    setDeleting(false);
  };

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage customer directory and details</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">No customers found.</div>
        ) : filtered.map((c) => (
          <div key={c.id} className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                  {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{c.full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{c.company_name || 'Individual'}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <div className="space-y-2 mt-auto text-sm text-slate-600">
              {c.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><span className="truncate">{c.email}</span></div>}
              {c.phone_number && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><span>{c.phone_number}</span></div>}
              {(c.city || c.country) && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span>{[c.city, c.country].filter(Boolean).join(', ')}</span></div>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Create Customer'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
              <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
              <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input type="text" value={form.address_line_1} onChange={(e) => setForm({ ...form, address_line_1: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : editingCustomer ? 'Update' : 'Create'}
            </button>
          </div>
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
