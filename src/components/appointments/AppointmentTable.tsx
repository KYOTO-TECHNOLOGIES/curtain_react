import React, { useState, useMemo } from 'react';
import type { AppointmentListItem, AppointmentStats } from '../../types';
import { CustomerCell } from './CustomerCell';
import { BookingCell } from './BookingCell';
import { AssigneeCell } from './AssigneeCell';
import { StatusBadge } from './StatusBadge';
import { RowActions } from './RowActions';
import { StatusHeaderFilter } from '../ui/StatusHeaderFilter';
import { MobileStatusFilter } from '../ui/MobileStatusFilter';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './AppointmentTable.css';

export interface AppointmentTableProps {
  appointments: AppointmentListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectAppointment: (appointment: AppointmentListItem) => void;
  onAssign: (appointment: AppointmentListItem) => void;
  onQuote: (appointment: AppointmentListItem) => void;
  onReschedule: (appointment: AppointmentListItem) => void;
  onClearFilters?: () => void;
  onCopyPhone?: (phone: string) => void;
  totalCount?: number;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  stats?: AppointmentStats | null;
  recentlyUpdatedId?: number | string | null;
}

const STATUS_ACCENT_COLORS: Record<string, string> = {
  scheduled: '#2F5D8F',
  quoted: '#009688',
  rescheduled: '#8B5CF6',
  cancelled: '#EF4444',
};

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  loading = false,
  error = null,
  onRetry,
  onSelectAppointment,
  onAssign,
  onQuote,
  onReschedule,
  onClearFilters,
  onCopyPhone,
  totalCount,
  statusFilter,
  onStatusChange,
  stats,
  recentlyUpdatedId,
}) => {
  // Sort state (client-side)
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  // Sorted appointments
  const sortedAppointments = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return appointments;
    }

    return [...appointments].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = Number(a.id) - Number(b.id);
          break;
        case 'customer':
          comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'booking': {
          const timeA = new Date(`${a.appointment_date || ''} ${a.appointment_time || ''}`).getTime();
          const timeB = new Date(`${b.appointment_date || ''} ${b.appointment_time || ''}`).getTime();
          if (isNaN(timeA) || isNaN(timeB)) {
            comparison = (a.appointment_date || '').localeCompare(b.appointment_date || '');
          } else {
            comparison = timeA - timeB;
          }
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [appointments, sortKey, sortDirection]);

  const statusCounts = {
    '': stats?.total ?? totalCount ?? appointments.length,
    scheduled: stats?.by_status?.scheduled ?? 0,
    quoted: stats?.by_status?.quoted ?? 0,
    rescheduled: stats?.by_status?.rescheduled ?? 0,
    cancelled: stats?.by_status?.cancelled ?? 0,
  };

  // Column definitions
  const columns: DataTableColumn<AppointmentListItem>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      size: 'fit',
      className: 'apt-col-id',
      render: (a) => (
        <span className="apt-id-chip" title={`Appointment #${a.id}`}>
          #{a.id}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer Name',
      sortable: true,
      size: 'flex',
      className: 'apt-col-customer',
      render: (a) => (
        <CustomerCell
          name={a.customer_name}
          phone={a.customer_phone}
          onCopyPhone={onCopyPhone}
        />
      ),
    },
    {
      key: 'booking',
      label: 'Booking Date & Time',
      sortable: true,
      size: 'fit',
      className: 'apt-col-booking',
      render: (a) => (
        <BookingCell
          date={a.appointment_date}
          time={a.appointment_time}
        />
      ),
    },
    {
      key: 'assignee',
      label: 'Assignee',
      sortable: false,
      size: 'cap',
      className: 'apt-col-assignee',
      render: (a) => <AssigneeCell assigneeName={a.assigned_to_name} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      size: 'fit',
      className: 'apt-col-status',
      headerAddonOnly: true,
      headerAddon: (
        <StatusHeaderFilter
          page="appointments"
          entityName="appointments"
          value={statusFilter}
          onChange={onStatusChange}
          counts={statusCounts}
        />
      ),
      render: (a) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <StatusBadge status={a.status} />
          {a.has_quotation && a.status !== 'quoted' && (
            <StatusBadge status="quoted" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      size: 'fit',
      className: 'apt-col-actions',
      render: (a) => (
        <RowActions
          appointmentId={a.id}
          isAssigned={Boolean(a.assigned_to_name || a.assigned_to)}
          hasQuotation={Boolean(a.has_quotation)}
          onAssign={() => onAssign(a)}
          onQuote={() => onQuote(a)}
          onReschedule={() => onReschedule(a)}
        />
      ),
    },
  ];

  // Skeleton rows matching real layout
  const renderSkeletonRow = (idx: number) => (
    <tr key={`apt-skeleton-${idx}`} className="apt-table-row">
      <td className="apt-col-id dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '64px', height: '26px', borderRadius: '8px' }} />
      </td>
      <td className="apt-col-customer dt-col-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="apt-skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="apt-skeleton-block" style={{ width: '130px', height: '14px' }} />
            <div className="apt-skeleton-block" style={{ width: '85px', height: '11px' }} />
          </div>
        </div>
      </td>
      <td className="apt-col-booking dt-col-fit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '95px', height: '14px' }} />
          <div className="apt-skeleton-block" style={{ width: '60px', height: '11px' }} />
        </div>
      </td>
      <td className="apt-col-assignee dt-col-cap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="apt-skeleton-block" style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
          <div className="apt-skeleton-block" style={{ width: '80px', height: '14px' }} />
        </div>
      </td>
      <td className="apt-col-status dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '84px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td className="apt-col-actions dt-col-fit dt-col-actions text-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '74px', height: '34px', borderRadius: '10px' }} />
          <div className="apt-skeleton-block" style={{ width: '70px', height: '34px', borderRadius: '10px' }} />
        </div>
      </td>
    </tr>
  );

  // Footer: Showing X of Y
  const displayedCount = sortedAppointments.length;
  const grandTotal = totalCount !== undefined ? totalCount : displayedCount;

  const footer = (
    <div className="apt-footer-count">
      Showing <strong>{displayedCount}</strong> of <strong>{grandTotal}</strong> appointment{grandTotal === 1 ? '' : 's'}
    </div>
  );

  return (
    <DataTable<AppointmentListItem>
      columns={columns}
      data={sortedAppointments}
      keyExtractor={(a) => a.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={onSelectAppointment}
      rowClassName={(a) => (recentlyUpdatedId === a.id ? 'apt-row-flash' : '')}
      rowStyle={(a) => {
        const accentColor = STATUS_ACCENT_COLORS[a.status] || '#94A3B8';
        return {
          ['--row-status-color' as any]: accentColor,
        };
      }}
      emptyTitle="No appointments found"
      emptyDescription="Try adjusting your search or filters to find what you're looking for."
      onClearFilters={onClearFilters}
      footer={footer}
      mobileToolbar={(
        <MobileStatusFilter
          page="appointments"
          entityName="appointments"
          value={statusFilter}
          onChange={onStatusChange}
          counts={statusCounts}
          className="apt-status-filter-trigger"
        />
      )}
      renderSkeletonRow={renderSkeletonRow}
      skeletonCount={6}
    />
  );
};

export default AppointmentTable;
