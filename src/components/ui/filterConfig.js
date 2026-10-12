const INVENTORY_CATEGORY_OPTIONS = [
  { value: 'fabric', label: 'Fabric', color: '#6366F1', textColor: '#4338CA', tint: '#EEF2FF' },
  { value: 'track', label: 'Track', color: '#10B981', textColor: '#065F46', tint: '#ECFDF5' },
  { value: 'motor', label: 'Motor', color: '#F59E0B', textColor: '#92400E', tint: '#FEF3C7' },
  { value: 'accessory', label: 'Accessory', color: '#3B82F6', textColor: '#1E40AF', tint: '#EFF6FF' },
  { value: 'other', label: 'Other', color: '#64748B', textColor: '#475569', tint: '#F1F5F9' },
];

export const INVENTORY_CATEGORIES = INVENTORY_CATEGORY_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

export const COLUMN_FILTER_CONFIG = {
  payments: {
    label: 'Method',
    allLabel: 'All Methods',
    entityName: 'payments',
    searchable: false,
    options: [
      { value: 'bank_transfer', label: 'Bank Transfer', color: '#2F5D8F', textColor: '#2F5D8F', tint: '#EEF4FA' },
      { value: 'card', label: 'Card', color: '#10B981', textColor: '#059669', tint: '#E8F8F2' },
      { value: 'cash', label: 'Cash', color: '#F59E0B', textColor: '#D97706', tint: '#FFFBEB' },
      { value: 'cheque', label: 'Cheque', color: '#8B5CF6', textColor: '#7C3AED', tint: '#F5F3FF' },
    ],
  },
  inventory: {
    label: 'Category',
    allLabel: 'All Categories',
    entityName: 'inventory',
    searchable: INVENTORY_CATEGORY_OPTIONS.length > 6,
    searchPlaceholder: 'Search categories',
    options: INVENTORY_CATEGORY_OPTIONS,
  },
};