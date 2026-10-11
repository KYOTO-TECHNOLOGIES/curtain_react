import { api } from './client';

export interface WorkType {
  id: number;
  name: string;
  pricing_unit: string;
  features: {
    motor: boolean;
    charges: boolean;
    images: boolean;
  };
  created_at?: string;
  updated_at?: string;
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

export interface ChargeTemplate {
  id: number;
  name: string;
  price: string;
  unit: string;
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
  workTypes: () =>
    api.get<WorkType[]>('catalog/work-types/'),

  createWorkType: (data: Partial<WorkType>) =>
    api.post<WorkType>('catalog/work-types/', data),

  updateWorkType: (id: number, data: Partial<WorkType>) =>
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
  motors: () =>
    api.get<MotorType[]>('catalog/motors/'),

  createMotor: (data: Partial<MotorType>) =>
    api.post<MotorType>('catalog/motors/', data),

  updateMotor: (id: number, data: Partial<MotorType>) =>
    api.patch<MotorType>(`catalog/motors/${id}/`, data),

  deleteMotor: (id: number) =>
    api.delete(`catalog/motors/${id}/`),

  // Charge Templates
  charges: () =>
    api.get<ChargeTemplate[]>('catalog/charges/'),

  createCharge: (data: Partial<ChargeTemplate>) =>
    api.post<ChargeTemplate>('catalog/charges/', data),

  updateCharge: (id: number, data: Partial<ChargeTemplate>) =>
    api.patch<ChargeTemplate>(`catalog/charges/${id}/`, data),

  deleteCharge: (id: number) =>
    api.delete(`catalog/charges/${id}/`),
};
