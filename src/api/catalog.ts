import { api } from './client';

export interface WorkTypeFeatures {
  motor: boolean;
  charges: boolean;
  images: boolean;
  draw: boolean;
  pelmet: boolean;
}

export interface WorkType {
  id: number;
  name: string;
  pricing_unit: string;
  features: WorkTypeFeatures;
  motor_ids?: number[];
  motors?: MotorType[];
  charge_ids?: number[];
  charges?: ChargeTemplate[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkTypeWrite {
  name?: string;
  pricing_unit?: string;
  features?: Partial<WorkTypeFeatures>;
  motor_ids?: number[];
  charge_ids?: number[];
}

export interface FabricType {
  id: number;
  work_type: number;
  work_type_name: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogModel {
  id: number;
  fabric_type: number;
  fabric_type_name: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface MotorType {
  id: number;
  name: string;
  price_per_m2: string;
  created_at?: string;
  updated_at?: string;
}

export type ChargeKind = 'manual' | 'motorized' | 'alexa' | 'pelmet' | 'other';
export type ChargeUnit = 'm2' | 'm' | 'flat';

export interface ChargeTemplate {
  id: number;
  name: string;
  price: string;
  unit: ChargeUnit | string;
  kind?: ChargeKind;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogItem {
  id: number;
  model: number;
  model_name: string;
  name: string;
  price_per_unit: string;
  image: string | null;
  created_at?: string;
  updated_at?: string;
}

export const catalogApi = {
  // Work Types
  workTypes: (params?: { feature?: string }) =>
    api.get<WorkType[]>('catalog/work-types/', { params }),

  createWorkType: (data: WorkTypeWrite) =>
    api.post<WorkType>('catalog/work-types/', data),

  updateWorkType: (id: number, data: WorkTypeWrite) =>
    api.patch<WorkType>(`catalog/work-types/${id}/`, data),

  deleteWorkType: (id: number) =>
    api.delete(`catalog/work-types/${id}/`),

  // Fabric Types
  fabricTypes: () =>
    api.get<FabricType[]>('catalog/fabric-types/'),

  createFabricType: (data: Partial<FabricType>) =>
    api.post<FabricType>('catalog/fabric-types/', data),

  updateFabricType: (id: number, data: Partial<FabricType>) =>
    api.patch<FabricType>(`catalog/fabric-types/${id}/`, data),

  deleteFabricType: (id: number) =>
    api.delete(`catalog/fabric-types/${id}/`),

  // Models
  models: () =>
    api.get<CatalogModel[]>('catalog/models/'),

  createModel: (data: Partial<CatalogModel>) =>
    api.post<CatalogModel>('catalog/models/', data),

  updateModel: (id: number, data: Partial<CatalogModel>) =>
    api.patch<CatalogModel>(`catalog/models/${id}/`, data),

  deleteModel: (id: number) =>
    api.delete(`catalog/models/${id}/`),

  // Catalog Items
  items: () =>
    api.get<CatalogItem[]>('catalog/items/'),

  createItem: (data: Partial<CatalogItem>) =>
    api.post<CatalogItem>('catalog/items/', data),

  updateItem: (id: number, data: Partial<CatalogItem>) =>
    api.patch<CatalogItem>(`catalog/items/${id}/`, data),

  deleteItem: (id: number) =>
    api.delete(`catalog/items/${id}/`),

  // Motor Types
  motors: (params?: { work_type?: number }) =>
    api.get<MotorType[]>('catalog/motors/', { params }),

  createMotor: (data: Partial<MotorType>) =>
    api.post<MotorType>('catalog/motors/', data),

  updateMotor: (id: number, data: Partial<MotorType>) =>
    api.patch<MotorType>(`catalog/motors/${id}/`, data),

  deleteMotor: (id: number) =>
    api.delete(`catalog/motors/${id}/`),

  // Charge Templates
  charges: (params?: { work_type?: number; search?: string; unit?: string; kind?: string }) =>
    api.get<ChargeTemplate[]>('catalog/charges/', { params }),

  createCharge: (data: Partial<ChargeTemplate>) =>
    api.post<ChargeTemplate>('catalog/charges/', data),

  updateCharge: (id: number, data: Partial<ChargeTemplate>) =>
    api.patch<ChargeTemplate>(`catalog/charges/${id}/`, data),

  deleteCharge: (id: number) =>
    api.delete(`catalog/charges/${id}/`),
};
