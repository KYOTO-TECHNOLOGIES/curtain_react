import { ColumnHeaderFilter } from './ColumnHeaderFilter';
import type { ColumnFilterOption } from './ColumnHeaderFilter';
import { STATUS_CONFIGS } from './statusConfig';

export type StatusConfigPage = keyof typeof STATUS_CONFIGS;

export interface StatusHeaderFilterProps {
  page: StatusConfigPage;
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number | undefined>;
  label?: string;
  entityName: string;
  className?: string;
  mobile?: boolean;
}

export function StatusHeaderFilter({
  page,
  value,
  onChange,
  counts,
  label = 'Status',
  entityName,
  className = '',
  mobile = false,
}: StatusHeaderFilterProps) {
  const options = STATUS_CONFIGS[page] as ColumnFilterOption[];

  return (
    <ColumnHeaderFilter
      options={options}
      value={value}
      onChange={onChange}
      counts={counts}
      label={label}
      allLabel={`All ${label}`}
      entityName={entityName}
      searchable={false}
      className={className}
      mobile={mobile}
    />
  );
}