import { api } from './client';
import type {
  CatalogChargeTemplate,
  CatalogFabricType,
  CatalogItem,
  CatalogModel,
  CatalogMotorType,
  CatalogWorkType,
} from '../types';

const endpoints = {
  workTypes: '/catalog/work-types/',
  fabricTypes: '/catalog/fabric-types/',
  models: '/catalog/models/',
  items: '/catalog/items/',
  motors: '/catalog/motors/',
  charges: '/catalog/charges/',
};

export const catalogApi = {
  workTypes: {
    list: () => api.get<CatalogWorkType[]>(endpoints.workTypes),
    get: (id: number) => api.get<CatalogWorkType>(`${endpoints.workTypes}${id}/`),
    create: (payload: Partial<CatalogWorkType>) => api.post<CatalogWorkType>(endpoints.workTypes, payload),
    update: (id: number, payload: Partial<CatalogWorkType>) => api.patch<CatalogWorkType>(`${endpoints.workTypes}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.workTypes}${id}/`),
  },
  fabricTypes: {
    list: () => api.get<CatalogFabricType[]>(endpoints.fabricTypes),
    get: (id: number) => api.get<CatalogFabricType>(`${endpoints.fabricTypes}${id}/`),
    create: (payload: Partial<CatalogFabricType>) => api.post<CatalogFabricType>(endpoints.fabricTypes, payload),
    update: (id: number, payload: Partial<CatalogFabricType>) => api.patch<CatalogFabricType>(`${endpoints.fabricTypes}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.fabricTypes}${id}/`),
  },
  models: {
    list: () => api.get<CatalogModel[]>(endpoints.models),
    get: (id: number) => api.get<CatalogModel>(`${endpoints.models}${id}/`),
    create: (payload: Partial<CatalogModel>) => api.post<CatalogModel>(endpoints.models, payload),
    update: (id: number, payload: Partial<CatalogModel>) => api.patch<CatalogModel>(`${endpoints.models}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.models}${id}/`),
  },
  items: {
    list: () => api.get<CatalogItem[]>(endpoints.items),
    get: (id: number) => api.get<CatalogItem>(`${endpoints.items}${id}/`),
    create: (payload: Partial<CatalogItem>) => api.post<CatalogItem>(endpoints.items, payload),
    update: (id: number, payload: Partial<CatalogItem>) => api.patch<CatalogItem>(`${endpoints.items}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.items}${id}/`),
  },
  motors: {
    list: () => api.get<CatalogMotorType[]>(endpoints.motors),
    get: (id: number) => api.get<CatalogMotorType>(`${endpoints.motors}${id}/`),
    create: (payload: Partial<CatalogMotorType>) => api.post<CatalogMotorType>(endpoints.motors, payload),
    update: (id: number, payload: Partial<CatalogMotorType>) => api.patch<CatalogMotorType>(`${endpoints.motors}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.motors}${id}/`),
  },
  charges: {
    list: () => api.get<CatalogChargeTemplate[]>(endpoints.charges),
    get: (id: number) => api.get<CatalogChargeTemplate>(`${endpoints.charges}${id}/`),
    create: (payload: Partial<CatalogChargeTemplate>) => api.post<CatalogChargeTemplate>(endpoints.charges, payload),
    update: (id: number, payload: Partial<CatalogChargeTemplate>) => api.patch<CatalogChargeTemplate>(`${endpoints.charges}${id}/`, payload),
    remove: (id: number) => api.delete(`${endpoints.charges}${id}/`),
  },
};

export type CatalogResourceKey = keyof typeof catalogApi;
