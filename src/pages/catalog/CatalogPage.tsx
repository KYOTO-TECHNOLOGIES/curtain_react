import { useState } from 'react';
import React from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Edit2,
  DollarSign,
  Package,
  Layers,
  Zap,
  Grid3X3,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/catalog';
import { useToast } from '../../components/ui/Toast';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { FormInput } from '../../components/ui/FormInput';

type TabType = 'work-types' | 'fabric-types' | 'models' | 'items' | 'motors' | 'charges';

export default function CatalogPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState<any>({});

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all data
  const { data: workTypesRes, refetch: refetchWorkTypes } = useQuery({
    queryKey: ['work-types', debouncedSearch],
    queryFn: () => catalogApi.workTypes(),
  });

  const { data: fabricTypesRes, refetch: refetchFabricTypes } = useQuery({
    queryKey: ['fabric-types', debouncedSearch],
    queryFn: () => catalogApi.fabricTypes(),
  });

  const { data: modelsRes, refetch: refetchModels } = useQuery({
    queryKey: ['models', debouncedSearch],
    queryFn: () => catalogApi.models(),
  });

  const { data: itemsRes, refetch: refetchItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: () => catalogApi.items(),
  });

  const { data: motorsRes, refetch: refetchMotors } = useQuery({
    queryKey: ['motors', debouncedSearch],
    queryFn: () => catalogApi.motors(),
  });

  const { data: chargesRes, refetch: refetchCharges } = useQuery({
    queryKey: ['charges', debouncedSearch],
    queryFn: () => catalogApi.charges(),
  });

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const workTypes = toArray<WorkType>(workTypesRes);
  const fabricTypes = toArray<FabricType>(fabricTypesRes);
  const models = toArray<CatalogModel>(modelsRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motors = toArray<MotorType>(motorsRes);
  const charges = toArray<ChargeTemplate>(chargesRes);

  const openCreate = () => {
    if (activeTab === 'items' && models.length === 0) {
      showToast('Please add models first', 'error');
      return;
    }
    if (activeTab === 'fabric-types' && workTypes.length === 0) {
      showToast('Please add work types first', 'error');
      return;
    }
    if (activeTab === 'models' && fabricTypes.length === 0) {
      showToast('Please add fabric types first', 'error');
      return;
    }
    setEditingItem(null);
    setFormData({});
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleSave = async () => {
    // Validate required fields based on active tab
    if (!formData.name || formData.name.trim() === '') {
      showToast('Name is required', 'error');
      return;
    }

    if (activeTab === 'fabric-types' && !formData.work_type) {
      showToast('Work Type is required', 'error');
      return;
    }

    if (activeTab === 'models' && !formData.fabric_type) {
      showToast('Fabric Type is required', 'error');
      return;
    }

    if (activeTab === 'items' && !formData.model) {
      showToast('Model is required', 'error');
      return;
    }

    if (activeTab === 'items' && (!formData.price_per_unit || formData.price_per_unit === '')) {
      showToast('Price Per Unit is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (activeTab === 'work-types') {
        if (editingItem) {
          await catalogApi.updateWorkType(editingItem.id, { name: formData.name, pricing_unit: formData.pricing_unit || 'm2', features: formData.features || { motor: false, charges: false, images: false } });
          showToast('Work type updated successfully', 'success');
        } else {
          await catalogApi.createWorkType({ name: formData.name, pricing_unit: formData.pricing_unit || 'm2', features: formData.features || { motor: false, charges: false, images: false } });
          showToast('Work type created successfully', 'success');
        }
        refetchWorkTypes();
      } else if (activeTab === 'fabric-types') {
        if (editingItem) {
          await catalogApi.updateFabricType(editingItem.id, { work_type: formData.work_type, name: formData.name });
          showToast('Fabric type updated successfully', 'success');
        } else {
          await catalogApi.createFabricType({ work_type: formData.work_type, name: formData.name });
          showToast('Fabric type created successfully', 'success');
        }
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        if (editingItem) {
          await catalogApi.updateModel(editingItem.id, { fabric_type: formData.fabric_type, name: formData.name });
          showToast('Model updated successfully', 'success');
        } else {
          await catalogApi.createModel({ fabric_type: formData.fabric_type, name: formData.name });
          showToast('Model created successfully', 'success');
        }
        refetchModels();
      } else if (activeTab === 'items') {
        if (editingItem) {
          await catalogApi.updateItem(editingItem.id, { model: formData.model, name: formData.name, price_per_unit: formData.price_per_unit });
          showToast('Item updated successfully', 'success');
        } else {
          await catalogApi.createItem({ model: formData.model, name: formData.name, price_per_unit: formData.price_per_unit });
          showToast('Item created successfully', 'success');
        }
        refetchItems();
      } else if (activeTab === 'motors') {
        if (editingItem) {
          await catalogApi.updateMotor(editingItem.id, { name: formData.name, price_per_m2: formData.price_per_m2 || '0' });
          showToast('Motor type updated successfully', 'success');
        } else {
          await catalogApi.createMotor({ name: formData.name, price_per_m2: formData.price_per_m2 || '0' });
          showToast('Motor type created successfully', 'success');
        }
        refetchMotors();
      } else if (activeTab === 'charges') {
        if (editingItem) {
          await catalogApi.updateCharge(editingItem.id, { name: formData.name, price: formData.price || '0', unit: formData.unit || 'flat' });
          showToast('Charge template updated successfully', 'success');
        } else {
          await catalogApi.createCharge({ name: formData.name, price: formData.price || '0', unit: formData.unit || 'flat' });
          showToast('Charge template created successfully', 'success');
        }
        refetchCharges();
      }
      setFormOpen(false);
      setFormData({});
    } catch (err: any) {
      console.error('Error saving:', err);
      showToast(err?.response?.data?.detail || err?.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (activeTab === 'work-types') {
        await catalogApi.deleteWorkType(deleteTarget.id);
        showToast('Work type deleted successfully', 'success');
        refetchWorkTypes();
      } else if (activeTab === 'fabric-types') {
        await catalogApi.deleteFabricType(deleteTarget.id);
        showToast('Fabric type deleted successfully', 'success');
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        await catalogApi.deleteModel(deleteTarget.id);
        showToast('Model deleted successfully', 'success');
        refetchModels();
      } else if (activeTab === 'items') {
        await catalogApi.deleteItem(deleteTarget.id);
        showToast('Item deleted successfully', 'success');
        refetchItems();
      } else if (activeTab === 'motors') {
        await catalogApi.deleteMotor(deleteTarget.id);
        showToast('Motor type deleted successfully', 'success');
        refetchMotors();
      } else if (activeTab === 'charges') {
        await catalogApi.deleteCharge(deleteTarget.id);
        showToast('Charge template deleted successfully', 'success');
        refetchCharges();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete', 'error');
    }
  };

  const getTabLabel = (tab: TabType) => {
    const labels: Record<TabType, string> = {
      'work-types': 'Work Types',
      'fabric-types': 'Fabric Types',
      'models': 'Models',
      'items': 'Catalog Items',
      'motors': 'Motors',
      'charges': 'Charges',
    };
    return labels[tab];
  };

  const getTabIcon = (tab: TabType) => {
    const icons: Record<TabType, React.ReactNode> = {
      'work-types': <Layers className="w-4 h-4" />,
      'fabric-types': <Package className="w-4 h-4" />,
      'models': <Grid3X3 className="w-4 h-4" />,
      'items': <FileText className="w-4 h-4" />,
      'motors': <Zap className="w-4 h-4" />,
      'charges': <DollarSign className="w-4 h-4" />,
    };
    return icons[tab];
  };

  const renderContent = () => {
    let dataArray: any[] = [];
    let columns: string[] = [];

    if (activeTab === 'work-types') {
      dataArray = workTypes;
      columns = ['id', 'name', 'pricing_unit'];
    } else if (activeTab === 'fabric-types') {
      dataArray = fabricTypes;
      columns = ['id', 'work_type_name', 'name'];
    } else if (activeTab === 'models') {
      dataArray = models;
      columns = ['id', 'fabric_type_name', 'name'];
    } else if (activeTab === 'items') {
      dataArray = items;
      columns = ['id', 'model_name', 'name', 'price_per_unit'];
    } else if (activeTab === 'motors') {
      dataArray = motors;
      columns = ['id', 'name', 'price_per_m2'];
    } else if (activeTab === 'charges') {
      dataArray = charges;
      columns = ['id', 'name', 'price', 'unit'];
    }

    return (
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    {col.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </th>
                ))}
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataArray.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No {getTabLabel(activeTab).toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                dataArray.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-5 align-middle">
                        <span className="text-sm font-medium text-slate-700">
                          {item[col] || '—'}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[12px] rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[12px] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catalog & Pricing</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage catalog items, work types, and pricing</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Add {getTabLabel(activeTab)}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {(['work-types', 'fabric-types', 'models', 'items', 'motors', 'charges'] as TabType[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#2b5c8f] text-[#2b5c8f]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {getTabIcon(tab)}
                {getTabLabel(tab)}
              </button>
            )
          )}
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <input
            type="text"
            placeholder={`Search ${getTabLabel(activeTab).toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {itemsLoading && activeTab === 'items' ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingItem ? `Edit ${getTabLabel(activeTab)}` : `Create ${getTabLabel(activeTab)}`}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#2b5c8f]">
                {getTabIcon(activeTab)}
              </div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">{getTabLabel(activeTab)} Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeTab === 'work-types' && (
                <>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Roller" />
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Pricing Unit" value={formData.pricing_unit || ''} onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })} placeholder="e.g. m2" />
                  </div>
                </>
              )}

              {activeTab === 'fabric-types' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Work Type <span className="text-red-500">*</span></label>
                    <select
                      value={formData.work_type || ''}
                      onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-[#2b5c8f] rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                    >
                      <option value="">Select work type</option>
                      {workTypes.map((wt) => (
                        <option key={wt.id} value={wt.id}>{wt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Blackout" />
                  </div>
                </>
              )}

              {activeTab === 'models' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Fabric Type <span className="text-red-500">*</span></label>
                    <select
                      value={formData.fabric_type || ''}
                      onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-[#2b5c8f] rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                    >
                      <option value="">Select fabric type</option>
                      {fabricTypes.map((ft) => (
                        <option key={ft.id} value={ft.id}>{ft.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Classic" />
                  </div>
                </>
              )}

              {activeTab === 'items' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Model <span className="text-red-500">*</span></label>
                    <select
                      value={formData.model || ''}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-[#2b5c8f] rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                    >
                      <option value="">Select model</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Shade" />
                  </div>
                  <div>
                    <FormInput type="number" step="0.01" label="Price Per Unit" required value={formData.price_per_unit || ''} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} placeholder="e.g. 150.00" />
                  </div>
                </>
              )}

              {activeTab === 'motors' && (
                <>
                  <div>
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Tubular" />
                  </div>
                  <div>
                    <FormInput type="number" step="0.01" label="Price Per m2" value={formData.price_per_m2 || ''} onChange={(e) => setFormData({ ...formData, price_per_m2: e.target.value })} placeholder="e.g. 120.00" />
                  </div>
                </>
              )}

              {activeTab === 'charges' && (
                <>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Manual Control" />
                  </div>
                  <div>
                    <FormInput type="number" step="0.01" label="Price" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g. 50.00" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Unit</label>
                    <select
                      value={formData.unit || 'flat'}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-[#2b5c8f] rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                    >
                      <option value="flat">Flat</option>
                      <option value="per_m2">Per m2</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#2b5c8f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2b5c8f]/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget ? getTabLabel(activeTab) : 'Item'}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
}
