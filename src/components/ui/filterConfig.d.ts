import type { InventoryCategory, PaymentMethod } from '../../types';

interface FilterOptionConfig {
  value: string;
  label: string;
  color: string;
  textColor: string;
  tint: string;
}

interface ColumnFilterConfig {
  label: string;
  allLabel: string;
  entityName: string;
  searchable: boolean;
  searchPlaceholder?: string;
  options: FilterOptionConfig[];
}

export const COLUMN_FILTER_CONFIG: {
  payments: ColumnFilterConfig & {
    options: (FilterOptionConfig & { value: PaymentMethod })[];
  };
  inventory: ColumnFilterConfig & {
    options: (FilterOptionConfig & { value: InventoryCategory })[];
  };
};

export const INVENTORY_CATEGORIES: { value: InventoryCategory; label: string }[];