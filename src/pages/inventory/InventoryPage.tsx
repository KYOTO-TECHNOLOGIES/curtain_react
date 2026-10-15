import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  X,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Warehouse,
  RotateCcw,
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
  StockMovement,
  StockMovementType,
  Supplier,
} from '../../types';

// Design Spells Components
import { InventoryPageHeader } from '../../components/inventory/InventoryPageHeader';
import { InventoryStatCards } from '../../components/inventory/InventoryStatCards';
import { InventoryTabs, type InventoryTabType } from '../../components/inventory/InventoryTabs';
import { InventoryFilterBar } from '../../components/inventory/InventoryFilterBar';
import { InventoryItemsTable } from '../../components/inventory/InventoryItemsTable';
import { InventorySuppliersTable } from '../../components/inventory/InventorySuppliersTable';
import { InventoryReordersTable } from '../../components/inventory/InventoryReordersTable';
import { InventoryMovementsTable } from '../../components/inventory/InventoryMovementsTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import '../../components/appointments/FilterBar.css';
import { COLUMN_FILTER_CONFIG, INVENTORY_CATEGORIES as CATEGORIES } from '../../components/ui/filterConfig.js';

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

function formatQty(qty: number | string): string {
  const num = typeof qty === 'string' ? parseFloat(qty || '0') : qty;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

export default function InventoryPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<InventoryTabType>('items');

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [lowStockCardActive, setLowStockCardActive] = useState<boolean>(false);

  // Pagination for tabs
  const itemsPagination = usePagination();
  const suppliersPagination = usePagination();
  const reordersPagination = usePagination();
  const movementsPagination = usePagination();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    itemsPagination.resetPage();
  }, [categoryFilter, stockStatusFilter, supplierFilter, lowStockCardActive, debouncedSearch]);

  useEffect(() => {
    suppliersPagination.resetPage();
  }, [debouncedSearch]);

  useEffect(() => {
    reordersPagination.resetPage();
  }, [debouncedSearch]);

  useEffect(() => {
    movementsPagination.resetPage();
  }, [debouncedSearch]);

  // Modals state
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
  const [reorderForm, setReorderForm] = useState({
    item: 0,
    quantity: '',
    supplier: null as number | null,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [isReorderingLowStock, setIsReorderingLowStock] = useState(false);

  // Queries
  const itemsQuery = useQuery({
    queryKey: ['inventory-items', categoryFilter, lowStockCardActive || stockStatusFilter === 'low', supplierFilter, debouncedSearch, itemsPagination.currentPage, itemsPagination.pageSize],
    queryFn: () =>
      inventoryApi.listItems({
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(lowStockCardActive || stockStatusFilter === 'low' ? { low_stock: true } : {}),
        ...(supplierFilter ? { supplier: supplierFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        limit: itemsPagination.limit,
        offset: itemsPagination.offset,
      }),
  });

  const suppliersQuery = useQuery({
    queryKey: ['inventory-suppliers', debouncedSearch, suppliersPagination.currentPage, suppliersPagination.pageSize],
    queryFn: () => inventoryApi.listSuppliers({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: suppliersPagination.limit,
      offset: suppliersPagination.offset,
    }),
  });

  const reordersQuery = useQuery({
    queryKey: ['inventory-reorders', debouncedSearch, reordersPagination.currentPage, reordersPagination.pageSize],
    queryFn: () => inventoryApi.listReorders({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: reordersPagination.limit,
      offset: reordersPagination.offset,
    }),
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements', debouncedSearch, movementsPagination.currentPage, movementsPagination.pageSize],
    queryFn: () => inventoryApi.listMovements({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: movementsPagination.limit,
      offset: movementsPagination.offset,
    }),
  });

  const statsQuery = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryApi.stats(),
  });

  const { items, paginatedItemsTotal }: { items: InventoryItem[]; paginatedItemsTotal: number } = useMemo(() => {
    const raw = itemsQuery.data?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as InventoryItem[], paginatedItemsTotal: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw as InventoryItem[], paginatedItemsTotal: raw.length };
    if (Array.isArray(itemsQuery.data)) return { items: itemsQuery.data as unknown as InventoryItem[], paginatedItemsTotal: (itemsQuery.data as any).length };
    return { items: [] as InventoryItem[], paginatedItemsTotal: 0 };
  }, [itemsQuery.data]);

  const { suppliers, paginatedSuppliersTotal }: { suppliers: Supplier[]; paginatedSuppliersTotal: number } = useMemo(() => {
    const raw = suppliersQuery.data?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { suppliers: (raw as any).results as Supplier[], paginatedSuppliersTotal: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { suppliers: raw as Supplier[], paginatedSuppliersTotal: raw.length };
    if (Array.isArray(suppliersQuery.data)) return { suppliers: suppliersQuery.data as unknown as Supplier[], paginatedSuppliersTotal: (suppliersQuery.data as any).length };
    return { suppliers: [] as Supplier[], paginatedSuppliersTotal: 0 };
  }, [suppliersQuery.data]);

  const { reorders, paginatedReordersTotal }: { reorders: ReorderRequest[]; paginatedReordersTotal: number } = useMemo(() => {
    const raw = reordersQuery.data?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { reorders: (raw as any).results as ReorderRequest[], paginatedReordersTotal: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { reorders: raw as ReorderRequest[], paginatedReordersTotal: raw.length };
    if (Array.isArray(reordersQuery.data)) return { reorders: reordersQuery.data as unknown as ReorderRequest[], paginatedReordersTotal: (reordersQuery.data as any).length };
    return { reorders: [] as ReorderRequest[], paginatedReordersTotal: 0 };
  }, [reordersQuery.data]);

  const { movements, paginatedMovementsTotal }: { movements: StockMovement[]; paginatedMovementsTotal: number } = useMemo(() => {
    const raw = movementsQuery.data?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { movements: (raw as any).results as StockMovement[], paginatedMovementsTotal: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { movements: raw as StockMovement[], paginatedMovementsTotal: raw.length };
    if (Array.isArray(movementsQuery.data)) return { movements: movementsQuery.data as unknown as StockMovement[], paginatedMovementsTotal: (movementsQuery.data as any).length };
    return { movements: [] as StockMovement[], paginatedMovementsTotal: 0 };
  }, [movementsQuery.data]);

  const stats = statsQuery.data?.data || null;
  const categoryCounts = useMemo(() => ({
    '': stats?.total_items ?? items.length,
    ...Object.fromEntries(COLUMN_FILTER_CONFIG.inventory.options.map(({ value }) => [
      value,
      stats?.by_category?.[value] ?? items.filter((item) => item.category === value).length,
    ])),
  }), [stats, items]);

  const refreshAll = () => {
    itemsQuery.refetch();
    suppliersQuery.refetch();
    reordersQuery.refetch();
    movementsQuery.refetch();
    statsQuery.refetch();
  };

  const totalItemsCount = paginatedItemsTotal || stats?.total_items || items.length;
  const totalSuppliersCount = paginatedSuppliersTotal || suppliers.length;
  const totalReordersCount = paginatedReordersTotal || reorders.length;
  const totalMovementsCount = paginatedMovementsTotal || movements.length;

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    let result = items;

    // Search query
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (i) =>
          i.sku.toLowerCase().includes(term) ||
          i.name.toLowerCase().includes(term) ||
          (i.location || '').toLowerCase().includes(term) ||
          (i.supplier_name || '').toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((i) => i.category === categoryFilter);
    }

    // Stock Status filter
    if (stockStatusFilter === 'low' || lowStockCardActive) {
      result = result.filter((i) => i.is_low_stock);
    } else if (stockStatusFilter === 'out_of_stock') {
      result = result.filter((i) => parseFloat(i.quantity_on_hand || '0') <= 0);
    } else if (stockStatusFilter === 'in_stock') {
      result = result.filter((i) => !i.is_low_stock && parseFloat(i.quantity_on_hand || '0') > 0);
    }

    // Supplier filter
    if (supplierFilter) {
      result = result.filter((i) => String(i.supplier) === String(supplierFilter));
    }

    return result;
  }, [items, search, categoryFilter, stockStatusFilter, lowStockCardActive, supplierFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.contact_person || '').toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.address || '').toLowerCase().includes(term)
    );
  }, [suppliers, search]);

  // Filtered Reorders
  const filteredReorders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reorders;
    return reorders.filter(
      (r) =>
        r.item_sku.toLowerCase().includes(term) ||
        r.item_name.toLowerCase().includes(term) ||
        (r.supplier_name || '').toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
  }, [reorders, search]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return movements;
    return movements.filter(
      (m) =>
        m.item_sku.toLowerCase().includes(term) ||
        m.item_name.toLowerCase().includes(term) ||
        (m.reference || '').toLowerCase().includes(term) ||
        (m.notes || '').toLowerCase().includes(term) ||
        (m.created_by_name || '').toLowerCase().includes(term)
    );
  }, [movements, search]);

  // Item Modal Handlers
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
        showToast('Item updated successfully', 'success');
      } else {
        await inventoryApi.createItem(itemForm);
        showToast('Stock item created successfully', 'success');
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
      showToast('Item deleted successfully', 'success');
      setDeleteItem(null);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete item', 'error');
    }
    setSaving(false);
  };

  // Supplier Modal Handlers
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
        showToast('Supplier updated successfully', 'success');
      } else {
        await inventoryApi.createSupplier(supplierForm);
        showToast('Supplier added successfully', 'success');
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
      showToast('Supplier deleted successfully', 'success');
      setDeleteSupplier(null);
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete supplier', 'error');
    }
    setSaving(false);
  };

  // Adjust Stock Handlers
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
      showToast('Stock level updated successfully', 'success');
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

  // Reorder Handlers
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
      showToast('Reorder request submitted successfully', 'success');
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
      showToast(`Reorder status updated to ${status}`, 'success');
      refreshAll();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update reorder status', 'error');
    }
  };

  const createFromLowStock = async () => {
    setIsReorderingLowStock(true);
    try {
      const res = await inventoryApi.createReordersFromLowStock();
      const count = res.data?.length || 0;
      showToast(count ? `${count} reorder(s) generated for low stock` : 'No new reorders needed', 'success');
      refreshAll();
      setTab('reorders');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create reorders', 'error');
    }
    setIsReorderingLowStock(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredItems.length) {
      showToast('No items to export', 'info');
      return;
    }

    const headers = [
      'SKU',
      'Item Name',
      'Category',
      'Unit',
      'On Hand',
      'Reorder Level',
      'Reorder Qty',
      'Unit Cost (AED)',
      'Stock Value (AED)',
      'Location',
      'Supplier',
    ];

    const rows = filteredItems.map((i) => [
      `"${i.sku}"`,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      i.category,
      i.unit,
      i.quantity_on_hand,
      i.reorder_level,
      i.reorder_quantity,
      i.unit_cost,
      i.stock_value,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      `"${(i.supplier_name || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredItems.length} items to CSV`, 'success');
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockStatusFilter('');
    setSupplierFilter('');
    setLowStockCardActive(false);
  };

  // Live calculation for Stock Adjustment Modal
  const currentAdjustQty = adjustItem ? parseFloat(adjustItem.quantity_on_hand || '0') : 0;
  const inputDelta = parseFloat(adjustForm.quantity || '0');
  const calculatedNewQty = useMemo(() => {
    if (isNaN(inputDelta)) return currentAdjustQty;
    if (adjustForm.movement_type === 'in') return currentAdjustQty + inputDelta;
    if (adjustForm.movement_type === 'out') return Math.max(0, currentAdjustQty - inputDelta);
    return inputDelta;
  }, [currentAdjustQty, inputDelta, adjustForm.movement_type]);

  const loading =
    (tab === 'items' && itemsQuery.isLoading) ||
    (tab === 'suppliers' && suppliersQuery.isLoading) ||
    (tab === 'reorders' && reordersQuery.isLoading) ||
    (tab === 'movements' && movementsQuery.isLoading);

  return (
    <div className="space-y-6 animate-page-in font-sans pb-12">
      {/* 1. Modern Page Header (Design Spells Style) */}
      <InventoryPageHeader
        activeTab={tab}
        lowStockCount={stats?.low_stock_count ?? 0}
        onExport={handleExportCSV}
        onReorderLowStock={createFromLowStock}
        onAddItem={openCreateItem}
        onAddSupplier={openCreateSupplier}
        onNewReorder={() => openReorder()}
        onRefresh={refreshAll}
        isReorderingLowStock={isReorderingLowStock}
      />

      {/* 2. Interactive KPI Stat Cards (Design Spells Micro-interactions) */}
      <InventoryStatCards
        stats={stats}
        loading={statsQuery.isLoading}
        activeFilter={lowStockCardActive ? 'low_stock' : 'all'}
        onFilterChange={(f) => {
          if (f === 'low_stock') {
            setLowStockCardActive(true);
            setStockStatusFilter('low');
          } else {
            setLowStockCardActive(false);
            setStockStatusFilter('');
          }
        }}
        onTabChange={(t) => {
          setTab(t);
          if (t !== 'items') {
            setLowStockCardActive(false);
          }
        }}
        activeTab={tab}
      />

      {/* 3. Floating Pill Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <InventoryTabs
          activeTab={tab}
          onTabChange={(newTab) => {
            setTab(newTab);
            setSearch('');
          }}
          stats={stats}
          itemsCount={items.length}
          suppliersCount={suppliers.length}
          reordersCount={reorders.length}
          movementsCount={movements.length}
        />
      </div>

      {/* 4. Filter Bar */}
      {tab === 'items' ? (
        <InventoryFilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          stockStatusFilter={stockStatusFilter}
          onStockStatusChange={(status) => {
            setStockStatusFilter(status);
            setLowStockCardActive(status === 'low');
          }}
          supplierFilter={supplierFilter}
          onSupplierChange={setSupplierFilter}
          onClearFilters={clearAllFilters}
          totalCount={stats?.total_items ?? items.length}
          filteredCount={filteredItems.length}
          stats={stats}
          suppliers={suppliers}
          items={items}
        />
      ) : (
        /* Streamlined Search Bar for other tabs */
        <div className="cm-filter-card">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === 'suppliers'
                    ? 'Search suppliers by name, phone, email...'
                    : tab === 'reorders'
                    ? 'Search reorders by SKU, item, or status...'
                    : 'Search movement audit records...'
                }
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 text-sm font-semibold rounded-xl outline-none focus:border-[#2F5D8F] focus:ring-2 focus:ring-[#2F5D8F]/15 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#2F5D8F] bg-[#EEF4FA] hover:bg-[#E2ECF6] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <div className="ml-auto text-xs font-semibold text-slate-500">
              {tab === 'suppliers' && `${filteredSuppliers.length} suppliers`}
              {tab === 'reorders' && `${filteredReorders.length} requests`}
              {tab === 'movements' && `${filteredMovements.length} log events`}
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Content Tables */}
      {tab === 'items' && (
        <div className="space-y-4">
          <InventoryItemsTable
            items={filteredItems}
            loading={loading}
            totalCount={totalItemsCount}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryCounts={categoryCounts}
            onAdjustStock={openAdjust}
            onReorder={openReorder}
            onEditItem={openEditItem}
            onDeleteItem={(item) => setDeleteItem(item)}
            onClearFilters={clearAllFilters}
            onRetry={refreshAll}
          />
          <Pagination
            totalCount={totalItemsCount}
            currentPage={itemsPagination.currentPage}
            pageSize={itemsPagination.pageSize}
            onPageChange={itemsPagination.goToPage}
            onPageSizeChange={itemsPagination.setPageSize}
            loading={itemsQuery.isLoading}
          />
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          <InventorySuppliersTable
            suppliers={filteredSuppliers}
            loading={loading}
            totalCount={totalSuppliersCount}
            onEditSupplier={openEditSupplier}
            onDeleteSupplier={(s) => setDeleteSupplier(s)}
            onClearFilters={() => setSearch('')}
            onRetry={refreshAll}
          />
          <Pagination
            totalCount={totalSuppliersCount}
            currentPage={suppliersPagination.currentPage}
            pageSize={suppliersPagination.pageSize}
            onPageChange={suppliersPagination.goToPage}
            onPageSizeChange={suppliersPagination.setPageSize}
            loading={suppliersQuery.isLoading}
          />
        </div>
      )}

      {tab === 'reorders' && (
        <div className="space-y-4">
          <InventoryReordersTable
            reorders={filteredReorders}
            loading={loading}
            onUpdateStatus={updateReorderStatus}
            onClearFilters={() => setSearch('')}
            onRetry={refreshAll}
          />
          <Pagination
            totalCount={totalReordersCount}
            currentPage={reordersPagination.currentPage}
            pageSize={reordersPagination.pageSize}
            onPageChange={reordersPagination.goToPage}
            onPageSizeChange={reordersPagination.setPageSize}
            loading={reordersQuery.isLoading}
          />
        </div>
      )}

      {tab === 'movements' && (
        <div className="space-y-4">
          <InventoryMovementsTable
            movements={filteredMovements}
            loading={loading}
            onClearFilters={() => setSearch('')}
            onRetry={refreshAll}
          />
          <Pagination
            totalCount={totalMovementsCount}
            currentPage={movementsPagination.currentPage}
            pageSize={movementsPagination.pageSize}
            onPageChange={movementsPagination.goToPage}
            onPageSizeChange={movementsPagination.setPageSize}
            loading={movementsQuery.isLoading}
          />
        </div>
      )}

      {/* ── Modal: Add / Edit Item ─────────────────────────────────── */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.sku}` : 'Add New Stock Item'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section: Basic Identity */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Item Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  SKU Code *
                </label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    placeholder="e.g. FAB-LINEN-01"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Belgian Pure Linen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Stock Unit
                </label>
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value as InventoryUnit })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label} ({u.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Stock Levels & Limits */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              2. Stock Levels & Thresholds
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {!editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.quantity_on_hand}
                    onChange={(e) => setItemForm({ ...itemForm, quantity_on_hand: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reorder Level (Min)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.reorder_level}
                  onChange={(e) => setItemForm({ ...itemForm, reorder_level: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard Reorder Qty
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.reorder_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, reorder_quantity: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing, Storage & Supplier */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              3. Procurement & Storage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unit Cost (AED)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    AED
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.unit_cost}
                    onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Warehouse Location
                </label>
                <input
                  type="text"
                  value={itemForm.location || ''}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="e.g. Aisle 4, Shelf B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Supplier
                </label>
                <select
                  value={itemForm.supplier ?? ''}
                  onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all bg-white"
                >
                  <option value="">None / Open Market</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Item Notes & Specs
            </label>
            <textarea
              value={itemForm.notes || ''}
              onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              placeholder="Width, weight, color code, washing instructions..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setItemModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveItem}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2F5D8F] text-white text-sm font-bold hover:bg-[#23476E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingItem ? 'Save Item Changes' : 'Create Stock Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Adjust Stock Level (Design Spells Micro-interactions) ── */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${adjustItem?.sku || ''}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Item details card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Target Item</p>
              <p className="text-sm font-bold text-slate-900">{adjustItem?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">Current On Hand</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">
                {adjustItem ? `${formatQty(adjustItem.quantity_on_hand)} ${adjustItem.unit}` : '—'}
              </p>
            </div>
          </div>

          {/* Interactive Movement Type Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Adjustment Mode
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAdjustForm({ ...adjustForm, movement_type: 'in' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  adjustForm.movement_type === 'in'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stock In (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustForm({ ...adjustForm, movement_type: 'out' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  adjustForm.movement_type === 'out'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>Stock Out (−)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustForm({ ...adjustForm, movement_type: 'adjust' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  adjustForm.movement_type === 'adjust'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Set Exact (=)</span>
              </button>
            </div>
          </div>

          {/* Quantity & Live Calculated Result Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {adjustForm.movement_type === 'adjust' ? 'New Total Quantity *' : 'Quantity Delta *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all font-mono"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {adjustItem?.unit}
                </span>
              </div>
            </div>

            {/* Design Spells Live Result Preview */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Resulting Balance
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-slate-900 font-mono">
                  {formatQty(calculatedNewQty)} {adjustItem?.unit}
                </span>
                {adjustForm.quantity && (
                  <span
                    className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded ${
                      adjustForm.movement_type === 'in'
                        ? 'bg-emerald-100 text-emerald-800'
                        : adjustForm.movement_type === 'out'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {adjustForm.movement_type === 'in'
                      ? `+${adjustForm.quantity}`
                      : adjustForm.movement_type === 'out'
                      ? `−${adjustForm.quantity}`
                      : 'Reset'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reference / PO # (Optional)
            </label>
            <input
              type="text"
              value={adjustForm.reference}
              onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })}
              placeholder="e.g. PO-2026-042 or Delivery Note #982"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Adjustment Reason / Note
            </label>
            <textarea
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              placeholder="e.g. Damaged fabric discarded or received from supplier roll"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all h-16 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveAdjust}
              disabled={saving || !adjustForm.quantity}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2F5D8F] text-white text-sm font-bold hover:bg-[#23476E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: New Reorder ─────────────────────────────────────── */}
      <Modal
        open={reorderModalOpen}
        onClose={() => setReorderModalOpen(false)}
        title="Create Reorder Request"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Item *
            </label>
            <select
              value={reorderForm.item}
              onChange={(e) => {
                const id = Number(e.target.value);
                const selected = items.find((i) => i.id === id);
                setReorderForm({
                  ...reorderForm,
                  item: id,
                  quantity: selected?.reorder_quantity || reorderForm.quantity,
                  supplier: selected?.supplier || null,
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all bg-white"
            >
              <option value={0}>Choose a stock item...</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sku} — {i.name} (On Hand: {formatQty(i.quantity_on_hand)} {i.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reorder Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={reorderForm.quantity}
                onChange={(e) => setReorderForm({ ...reorderForm, quantity: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Supplier Vendor
              </label>
              <select
                value={reorderForm.supplier ?? ''}
                onChange={(e) => setReorderForm({ ...reorderForm, supplier: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all bg-white"
              >
                <option value="">None / Open Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reorder Notes / Priority
            </label>
            <textarea
              value={reorderForm.notes}
              onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })}
              placeholder="Urgent for job #104, requested expedited shipment..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReorderModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveReorder}
              disabled={saving || !reorderForm.item || !reorderForm.quantity}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2F5D8F] text-white text-sm font-bold hover:bg-[#23476E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Reorder
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Add / Edit Supplier ─────────────────────────────── */}
      <Modal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Supplier / Mill Name *
            </label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Al Habtoor Textiles LLC"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contact Person
            </label>
            <input
              type="text"
              value={supplierForm.contact_person || ''}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
              placeholder="e.g. Tariq Mansoor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={supplierForm.phone || ''}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="+971 4 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={supplierForm.email || ''}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="sales@supplier.ae"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Warehouse / Factory Address
            </label>
            <textarea
              value={supplierForm.address || ''}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="Warehouse #14, Al Quoz Industrial Area 3, Dubai"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 focus:border-[#2F5D8F] transition-all h-16 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSupplierModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveSupplier}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2F5D8F] text-white text-sm font-bold hover:bg-[#23476E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSupplier ? 'Save Supplier' : 'Add Supplier'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Modals ─────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
        title="Delete Stock Item"
        message={`Are you sure you want to delete "${deleteItem?.sku} — ${deleteItem?.name}"? This action cannot be undone.`}
        isLoading={saving}
      />

      <ConfirmModal
        open={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        onConfirm={confirmDeleteSupplier}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${deleteSupplier?.name}"?`}
        isLoading={saving}
      />
    </div>
  );
}
