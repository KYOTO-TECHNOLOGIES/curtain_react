export interface StatusOptionConfig {
  value: string;
  label: string;
  color?: string;
  textColor?: string;
  tint?: string;
}

export const STATUS_CONFIGS: Record<string, StatusOptionConfig[]> = {
  appointments: [
    { value: '', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled', color: '#2F5D8F', textColor: '#2F5D8F', tint: '#EEF4FA' },
    { value: 'quoted', label: 'Quoted', color: '#009688', textColor: '#00897B', tint: '#E0F7FA' },
    { value: 'rescheduled', label: 'Rescheduled', color: '#8B5CF6', textColor: '#7C3AED', tint: '#F3E8FD' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444', textColor: '#DC2626', tint: '#FEEFEF' },
  ],
  quotations: [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft', color: '#F97316', textColor: '#EA580C', tint: '#FFF4EA' },
    { value: 'pending', label: 'Pending', color: '#8B5CF6', textColor: '#7C3AED', tint: '#F5F3FF' },
    { value: 'sent', label: 'Sent', color: '#2F5D8F', textColor: '#2F5D8F', tint: '#EEF4FA' },
    { value: 'accepted', label: 'Accepted', color: '#10B981', textColor: '#059669', tint: '#E8F8F2' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444', textColor: '#DC2626', tint: '#FEEFEF' },
  ],
  orders: [
    { value: '', label: 'All Status' },
    { value: 'pending_production', label: 'Pending Production', color: '#F97316', textColor: '#EA580C', tint: '#FFF4EA' },
    { value: 'in_production', label: 'In Production', color: '#0EA5E9', textColor: '#0284C7', tint: '#E0F2FE' },
    { value: 'shipped', label: 'Shipped', color: '#8B5CF6', textColor: '#7C3AED', tint: '#F5F3FF' },
    { value: 'installed', label: 'Installed', color: '#10B981', textColor: '#059669', tint: '#E8F8F2' },
    { value: 'closed', label: 'Closed', color: '#64748B', textColor: '#475569', tint: '#F1F5F9' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444', textColor: '#DC2626', tint: '#FEEFEF' },
  ],
  invoices: [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid', color: '#10B981', textColor: '#059669', tint: '#E8F8F2' },
    { value: 'partially_paid', label: 'Partially Paid', color: '#0EA5E9', textColor: '#0284C7', tint: '#E0F2FE' },
    { value: 'sent', label: 'Sent', color: '#2F5D8F', textColor: '#2F5D8F', tint: '#EEF4FA' },
    { value: 'overdue', label: 'Overdue', color: '#EF4444', textColor: '#DC2626', tint: '#FEEFEF' },
    { value: 'draft', label: 'Draft', color: '#F97316', textColor: '#EA580C', tint: '#FFF4EA' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444', textColor: '#DC2626', tint: '#FEEFEF' },
  ],
};