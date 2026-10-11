import { api } from './client';
import type {
  CreateInventoryItemRequest,
  CreateReorderRequest,
  CreateStockMovementRequest,
  CreateSupplierRequest,
  InventoryItem,
  InventoryStats,
  ReorderRequest,
  ReorderStatus,
  StockMovement,
  Supplier,
  UpdateInventoryItemRequest,
  UpdateSupplierRequest,
} from '../types';

export const inventoryApi = {
  // Items
  listItems: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<InventoryItem[]>('inventory/items/', { params }),
  getItem: (id: number) => api.get<InventoryItem>(`inventory/items/${id}/`),
  createItem: (data: CreateInventoryItemRequest) =>
    api.post<InventoryItem>('inventory/items/', data),
  updateItem: (id: number, data: UpdateInventoryItemRequest) =>
    api.patch<InventoryItem>(`inventory/items/${id}/`, data),
  deleteItem: (id: number) => api.delete(`inventory/items/${id}/`),
  lowStock: () => api.get<InventoryItem[]>('inventory/items/low-stock/'),
  stats: () => api.get<InventoryStats>('inventory/items/stats/'),
  adjustStock: (id: number, data: Omit<CreateStockMovementRequest, 'item'>) =>
    api.post<{ movement: StockMovement; item: InventoryItem }>(`inventory/items/${id}/adjust-stock/`, data),

  // Suppliers
  listSuppliers: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<Supplier[]>('inventory/suppliers/', { params }),
  createSupplier: (data: CreateSupplierRequest) =>
    api.post<Supplier>('inventory/suppliers/', data),
  updateSupplier: (id: number, data: UpdateSupplierRequest) =>
    api.patch<Supplier>(`inventory/suppliers/${id}/`, data),
  deleteSupplier: (id: number) => api.delete(`inventory/suppliers/${id}/`),

  // Movements
  listMovements: (params?: Record<string, string | number | undefined>) =>
    api.get<StockMovement[]>('inventory/movements/', { params }),
  createMovement: (data: CreateStockMovementRequest) =>
    api.post<StockMovement>('inventory/movements/', data),

  // Reorders
  listReorders: (params?: Record<string, string | number | undefined>) =>
    api.get<ReorderRequest[]>('inventory/reorders/', { params }),
  createReorder: (data: CreateReorderRequest) =>
    api.post<ReorderRequest>('inventory/reorders/', data),
  updateReorderStatus: (id: number, status: ReorderStatus) =>
    api.patch<ReorderRequest>(`inventory/reorders/${id}/status/`, { status }),
  deleteReorder: (id: number) => api.delete(`inventory/reorders/${id}/`),
  createReordersFromLowStock: () =>
    api.post<ReorderRequest[]>('inventory/reorders/from-low-stock/'),
};
