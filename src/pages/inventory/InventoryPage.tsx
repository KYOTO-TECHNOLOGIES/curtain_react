import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Truck,
  Warehouse,
} from 'lucide-react';
import { inventoryApi } from '../../api/inventory';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type {
  CreateInventoryItemRequest,
  CreateSupplierRequest,
  InventoryCategory,
  InventoryItem,
  InventoryUnit,
  ReorderRequest,
  ReorderStatus,
  StockMovementType,
  Supplier,
} from '../../types';

type TabType = 'items' | 'suppliers' | 'reorders' | 'movements';

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'fabric', label: 'Fabric' },
  { value: 'track', label: 'Track' },
  { value: 'motor', label: 'Motor' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'other', label: 'Other' },
];

const UNITS: { value: InventoryUnit; label: string }[] = [
  { value: 'roll', label: 'Roll' },
  { value: 'm', label: 'Metre' },
  { value: 'm2', label: 'm²' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'box', label: 'Box' },
  { value: 'set', label: 'Set' },
];

const emptyItemForm: CreateInventoryItemRequest = {
  sku: '',
  name: '',
  category: 'fabric',
  unit: 'pcs',
  quantity_on_hand: '0',
  reorder_level: '0',
  reorder_quantity: '0',
  unit_cost: '0',
  location: '',
  supplier: null,
  notes: '',
};

const emptySupplierForm: CreateSupplierRequest = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
};

const formatQty = (qty: number | string) => {
  const num = typeof qty === 'string' ? parseFloat(qty || '0') : qty;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

export default function InventoryPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabType>('items');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState<CreateInventoryItemRequest>(emptyItemForm);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<CreateSupplierRequest>(emptySupplierForm);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    movement_type: 'in' as StockMovementType,
    quantity: '',
    reference: '',
    notes: '',
  });

  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderForm, setReorderForm] = useState({ item: 0, quantity: '', supplier: null as number | null, notes: '' });
  const [saving, setSaving] = useState(false);

  const itemsQuery = useQuery({
    queryKey: ['inventory-items', categoryFilter, lowStockOnly],
    queryFn: () =>
      inventoryApi.listItems({
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(lowStockOnly ? { low_stock: true } : {}),
      }),
  });

  const suppliersQuery = useQuery({
    queryKey: ['inventory-suppliers'],
    queryFn: () => inventoryApi.listSuppliers(),
  });

  const reordersQuery = useQuery({
    queryKey: ['inventory-reorders'],
    queryFn: () => inventoryApi.listReorders(),
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryApi.listMovements(),
  });

  const statsQuery = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryApi.stats(),
  });

  const items = itemsQuery.data?.data || [];
  const suppliers = suppliersQuery.data?.data || [];
  const reorders = reordersQuery.data?.data || [];
  const movements = movementsQuery.data?.data || [];
  const stats = statsQuery.data?.data || null;

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.sku.toLowerCase().includes(term) ||
        i.name.toLowerCase().includes(term) ||
        (i.location || '').toLowerCase().includes(term) ||
        (i.supplier_name || '').toLowerCase().includes(term)
    );
  }, [items, search]);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.contact_person || '').toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term)
    );
  }, [suppliers, search]);

  const refreshAll = () => {
    itemsQuery.refetch();
    suppliersQuery.refetch();
    reordersQuery.refetch();
    movementsQuery.refetch();
    statsQuery.refetch();
  };

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm(emptyItemForm);
    setItemModalOpen(true);
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity_on_hand: item.quantity_on_hand,
      reorder_level: item.reorder_level,
      reorder_quantity: item.reorder_quantity,
      unit_cost: item.unit_cost,
      location: item.location || '',
      supplier: item.supplier,
      notes: item.notes || '',
    });
    setItemModalOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.sku.trim() || !itemForm.name.trim()) {
      showToast('SKU and name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const { quantity_on_hand: _q, ...rest } = itemForm;
        await inventoryApi.updateItem(editingItem.id, rest);
        showToast('Item updated', 'success');
      } else {
        await inventoryApi.createItem(itemForm);
        showToast('Item created', 'success');
      }
      setItemModalOpen(false);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.sku?.[0] || err?.response?.data?.detail || 'Failed to save item', 'error');
    }
    setSaving(false);
  };

  const confirmDeleteItem = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await inventoryApi.deleteItem(deleteItem.id);
      showToast('Item deleted', 'success');
      setDeleteItem(null);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete item', 'error');
    }
    setSaving(false);
  };

  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setSupplierModalOpen(true);
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingSupplier) {
        await inventoryApi.updateSupplier(editingSupplier.id, supplierForm);
        showToast('Supplier updated', 'success');
      } else {
        await inventoryApi.createSupplier(supplierForm);
        showToast('Supplier created', 'success');
      }
      setSupplierModalOpen(false);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save supplier', 'error');
    }
    setSaving(false);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteSupplier) return;
    setSaving(true);
    try {
      await inventoryApi.deleteSupplier(deleteSupplier.id);
      showToast('Supplier deleted', 'success');
      setDeleteSupplier(null);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete supplier', 'error');
    }
    setSaving(false);
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustForm({ movement_type: 'in', quantity: '', reference: '', notes: '' });
    setAdjustModalOpen(true);
  };

  const saveAdjust = async () => {
    if (!adjustItem || !adjustForm.quantity) {
      showToast('Quantity is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjustStock(adjustItem.id, {
        movement_type: adjustForm.movement_type,
        quantity: adjustForm.quantity,
        reference: adjustForm.reference,
        notes: adjustForm.notes,
      });
      showToast('Stock updated', 'success');
      setAdjustModalOpen(false);
      refreshAll();
    } catch (err: any) {
      showToast(
        err?.response?.data?.quantity?.[0] || err?.response?.data?.detail || 'Failed to adjust stock',
        'error'
      );
    }
    setSaving(false);
  };

  const openReorder = (item?: InventoryItem) => {
    setReorderForm({
      item: item?.id || items[0]?.id || 0,
      quantity: item?.reorder_quantity || '1',
      supplier: item?.supplier || null,
      notes: '',
    });
    setReorderModalOpen(true);
  };

  const saveReorder = async () => {
    if (!reorderForm.item || !reorderForm.quantity) {
      showToast('Item and quantity are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createReorder({
        item: reorderForm.item,
        quantity: reorderForm.quantity,
        supplier: reorderForm.supplier,
        notes: reorderForm.notes,
      });
      showToast('Reorder created', 'success');
      setReorderModalOpen(false);
      refreshAll();
      setTab('reorders');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create reorder', 'error');
    }
    setSaving(false);
  };

  const updateReorderStatus = async (reorder: ReorderRequest, status: ReorderStatus) => {
    try {
      await inventoryApi.updateReorderStatus(reorder.id, status);
      showToast(`Reorder marked as ${status}`, 'success');
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update reorder', 'error');
    }
  };

  const createFromLowStock = async () => {
    setSaving(true);
    try {
      const res = await inventoryApi.createReordersFromLowStock();
      const count = res.data?.length || 0;
      showToast(count ? `${count} reorder(s) created` : 'No new reorders needed', 'success');
      refreshAll();
      setTab('reorders');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create reorders', 'error');
    }
    setSaving(false);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'items', label: 'Stock Items' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'reorders', label: 'Reorders' },
    { id: 'movements', label: 'Movements' },
  ];

  const loading =
    (tab === 'items' && itemsQuery.isLoading) ||
    (tab === 'suppliers' && suppliersQuery.isLoading) ||
    (tab === 'reorders' && reordersQuery.isLoading) ||
    (tab === 'movements' && movementsQuery.isLoading);

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">Inventory</h1>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Textile stock levels, suppliers and reorders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'items' && (
            <>
              <button
                onClick={createFromLowStock}
                disabled={saving || !(stats?.low_stock_count)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Reorder Low Stock
              </button>
              <button
                onClick={openCreateItem}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl hover:bg-[#1f456e]"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </>
          )}
          {tab === 'suppliers' && (
            <button
              onClick={openCreateSupplier}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl hover:bg-[#1f456e]"
            >
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          )}
          {tab === 'reorders' && (
            <button
              onClick={() => openReorder()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl hover:bg-[#1f456e]"
            >
              <Plus className="w-4 h-4" /> New Reorder
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Items</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.total_items ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{stats?.low_stock_count ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Value</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {stats ? formatCurrency(stats.total_stock_value) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Reorders</p>
          <p className="text-2xl font-extrabold text-[#2b5c8f] mt-1">{stats?.pending_reorders ?? '—'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id
                ? 'bg-[#2b5c8f] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'items' || tab === 'suppliers') && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'items' ? 'Search SKU, name, location…' : 'Search suppliers…'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-xl outline-none focus:border-[#2b5c8f]"
            />
          </div>
          {tab === 'items' && (
            <>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f]"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Low stock only
              </label>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
          </div>
        ) : tab === 'items' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">SKU / Item</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">On Hand</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Reorder At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Supplier</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                      No inventory items yet. Add fabric, tracks, motors, or accessories.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[#2b5c8f]/10">
                            <Warehouse className="w-4 h-4 text-[#2b5c8f]" />
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-800">{item.sku}</p>
                            <p className="text-xs font-medium text-slate-500">{item.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-sm font-semibold text-slate-700">{item.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold ${item.is_low_stock ? 'text-amber-500' : 'text-slate-800'}`}>
                            {formatQty(item.quantity_on_hand)} {item.unit}
                          </span>
                          {item.is_low_stock && (
                            <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatQty(item.reorder_level)} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.supplier_name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openAdjust(item)} className="px-2.5 py-1.5 text-[11px] font-bold text-[#2b5c8f] bg-[#f0f4f8] rounded-lg hover:bg-[#e1e9f1]">
                            Adjust
                          </button>
                          <button onClick={() => openReorder(item)} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                            Reorder
                          </button>
                          <button onClick={() => openEditItem(item)} className="p-1.5 text-slate-500 hover:text-[#2b5c8f]">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteItem(item)} className="p-1.5 text-slate-500 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'suppliers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Supplier</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Items</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-medium">No suppliers yet.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[#2b5c8f]/10">
                            <Truck className="w-4 h-4 text-[#2b5c8f]" />
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-800">{s.name}</p>
                            <p className="text-xs font-medium text-slate-500">{s.email || s.phone || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {s.contact_person || '—'}
                        {s.phone ? <span className="block text-xs text-slate-400">{s.phone}</span> : null}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{s.items_count ?? 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditSupplier(s)} className="p-1.5 text-slate-500 hover:text-[#2b5c8f]">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteSupplier(s)} className="p-1.5 text-slate-500 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'reorders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Item</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Supplier</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reorders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium">No reorder requests yet.</td>
                  </tr>
                ) : (
                  reorders.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-extrabold text-slate-800">{r.item_sku}</p>
                        <p className="text-xs font-medium text-slate-500">{r.item_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatQty(r.quantity)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{r.supplier_name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'pending' && (
                            <button onClick={() => updateReorderStatus(r, 'ordered')} className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#2b5c8f] rounded-lg">
                              Mark Ordered
                            </button>
                          )}
                          {r.status === 'ordered' && (
                            <button onClick={() => updateReorderStatus(r, 'received')} className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 rounded-lg">
                              Mark Received
                            </button>
                          )}
                          {(r.status === 'pending' || r.status === 'ordered') && (
                            <button onClick={() => updateReorderStatus(r, 'cancelled')} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-lg">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Item</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-medium">No stock movements yet.</td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-extrabold text-slate-800">{m.item_sku}</p>
                        <p className="text-xs font-medium text-slate-500">{m.item_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          m.movement_type === 'in' ? 'bg-emerald-100 text-emerald-700' :
                          m.movement_type === 'out' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatQty(m.quantity)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{m.created_by_name || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal */}
      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
              <input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value as InventoryUnit })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            {!editingItem && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Qty</label>
                <input type="number" step="0.01" value={itemForm.quantity_on_hand} onChange={(e) => setItemForm({ ...itemForm, quantity_on_hand: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input type="number" step="0.01" value={itemForm.reorder_level} onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Qty</label>
              <input type="number" step="0.01" value={itemForm.reorder_quantity} onChange={(e) => setItemForm({ ...itemForm, reorder_quantity: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (AED)</label>
              <input type="number" step="0.01" value={itemForm.unit_cost} onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input value={itemForm.location || ''} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select value={itemForm.supplier ?? ''} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={itemForm.notes || ''} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f] h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setItemModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
            <button onClick={saveItem} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Supplier Modal */}
      <Modal open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
            <input value={supplierForm.contact_person || ''} onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input value={supplierForm.phone || ''} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={supplierForm.email || ''} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea value={supplierForm.address || ''} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f] h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSupplierModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
            <button onClick={saveSupplier} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title={`Adjust Stock — ${adjustItem?.sku || ''}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-500 font-medium">
            Current: <span className="font-bold text-slate-800">{adjustItem ? `${formatQty(adjustItem.quantity_on_hand)} ${adjustItem.unit}` : '—'}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Movement Type</label>
            <select value={adjustForm.movement_type} onChange={(e) => setAdjustForm({ ...adjustForm, movement_type: e.target.value as StockMovementType })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (−)</option>
              <option value="adjust">Set Absolute Qty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
            <input type="number" step="0.01" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
            <input value={adjustForm.reference} onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" placeholder="PO / job ref" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f] h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAdjustModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
            <button onClick={saveAdjust} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Stock
            </button>
          </div>
        </div>
      </Modal>

      {/* Reorder Modal */}
      <Modal open={reorderModalOpen} onClose={() => setReorderModalOpen(false)} title="New Reorder">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item *</label>
            <select value={reorderForm.item} onChange={(e) => {
              const id = Number(e.target.value);
              const item = items.find((i) => i.id === id);
              setReorderForm({
                ...reorderForm,
                item: id,
                quantity: item?.reorder_quantity || reorderForm.quantity,
                supplier: item?.supplier || null,
              });
            }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
              <option value={0}>Select item</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
            <input type="number" step="0.01" value={reorderForm.quantity} onChange={(e) => setReorderForm({ ...reorderForm, quantity: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <select value={reorderForm.supplier ?? ''} onChange={(e) => setReorderForm({ ...reorderForm, supplier: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f]">
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={reorderForm.notes} onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#2b5c8f] h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setReorderModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
            <button onClick={saveReorder} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Reorder
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
        title="Delete Item"
        message={`Delete ${deleteItem?.sku} — ${deleteItem?.name}? This cannot be undone.`}
        isLoading={saving}
      />
      <ConfirmModal
        open={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        onConfirm={confirmDeleteSupplier}
        title="Delete Supplier"
        message={`Delete supplier ${deleteSupplier?.name}?`}
        isLoading={saving}
      />
    </div>
  );
}
