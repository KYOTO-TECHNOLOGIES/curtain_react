import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Loader2, MapPin, AlertCircle, User, Mail, Globe, Building2, CheckCircle2 } from 'lucide-react';
import { customersApi } from '../../api/customers';
import type { Customer, UpdateCustomerRequest } from '../../types';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { FormInput } from '../../components/ui/FormInput';
import { useToast } from '../../components/ui/Toast';
import { customerSchema, type CustomerFormValues } from '../../lib/validationSchemas';



export default function CustomersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search for backend call
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone_number: '',
      company_name: '', address_line_1: '', address_line_2: '', city: '', country: '', notes: ''
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = form;

  const { data: customersRes, isLoading, refetch } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => customersApi.list(debouncedSearch || undefined)
  });

  const customers = customersRes?.data || [];
  const loading = isLoading;

  const load = () => {
    refetch();
  };

  const openCreate = () => {
    setEditingCustomer(null);
    reset({
      first_name: '', last_name: '', email: '', phone_number: '',
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
      phone_number: c.phone_number || '',
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

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'customer' : 'customers'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No customers found.
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-extrabold text-slate-800">#{c.id}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-[11px] font-bold">
                        {c.first_name?.charAt(0)?.toUpperCase() || 'C'}{c.last_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-700">{c.full_name}</span>
                        <span className="text-[12px] text-slate-400 font-medium">{c.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-600">{c.company_name || 'Individual'}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{c.phone_number || '—'}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-600 truncate max-w-[220px] inline-block">{c.email || '—'}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[12px] rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[12px] rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Create Customer'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#2b5c8f]">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">Personal Information</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput label="First Name" icon={User} required error={errors.first_name?.message} {...register('first_name')} placeholder="e.g. Abdullah" />
              <FormInput label="Last Name" icon={User} required error={errors.last_name?.message} {...register('last_name')} placeholder="e.g. Ahmed" />
              <FormInput label="Email Address" type="email" icon={Mail} error={errors.email?.message} {...register('email')} placeholder="customer@example.com" />
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Phone Number</label>
                <div className={`flex border ${errors.phone_number ? 'border-red-300' : 'border-slate-200'} rounded-xl overflow-hidden focus-within:border-[#2b5c8f] focus-within:ring-2 focus-within:ring-[#2b5c8f]/10 transition-all bg-white`}>
                  <div className="flex items-center gap-1.5 px-3 bg-slate-50/80 border-r border-slate-200">
                    <span className="text-base">🇦🇪</span>
                    <span className="text-[13px] font-bold text-slate-700">+971</span>
                  </div>
                  <input type="tel" {...register('phone_number')} placeholder="50 000 0000" className="flex-1 px-4 py-3 bg-transparent text-slate-800 text-[14px] font-semibold outline-none" />
                </div>
                {errors.phone_number && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.phone_number.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <FormInput label="Company Name" icon={Building2} error={errors.company_name?.message} {...register('company_name')} placeholder="e.g. ACME LLC" />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">Location Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FormInput label="Address Line 1" icon={MapPin} error={errors.address_line_1?.message} {...register('address_line_1')} placeholder="Street address" />
              </div>
              <div className="sm:col-span-2">
                <FormInput label="Address Line 2" icon={MapPin} error={errors.address_line_2?.message} {...register('address_line_2')} placeholder="Apartment, suite, building, etc." />
              </div>
              <FormInput label="City" icon={Globe} error={errors.city?.message} {...register('city')} placeholder="Dubai" />
              <FormInput label="Country" icon={Globe} error={errors.country?.message} {...register('country')} placeholder="UAE" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <button type="button" onClick={() => setFormOpen(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-[#2b5c8f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2b5c8f]/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : editingCustomer ? 'Update Customer' : 'Create Customer'}
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
