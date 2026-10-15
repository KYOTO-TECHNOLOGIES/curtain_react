import { SelectMenu, type SelectOption } from './SelectMenu';
import { StatusFilterPill } from './StatusFilterPill';
import './StatusHeaderFilter.css';

export interface ColumnFilterOption {
  value: string;
  label: string;
  color?: string;
  textColor?: string;
  tint?: string;
}

export interface ColumnHeaderFilterProps {
  options: ColumnFilterOption[];
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number | undefined>;
  label: string;
  allLabel: string;
  entityName: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  maxPillWidth?: number;
  className?: string;
  mobile?: boolean;
}

export function ColumnHeaderFilter({
  options,
  value,
  onChange,
  counts,
  label,
  allLabel,
  entityName,
  searchable = false,
  searchPlaceholder,
  maxPillWidth,
  className = '',
  mobile = false,
}: ColumnHeaderFilterProps) {
  const allCount = counts?.[''];
  const selectOptions: SelectOption[] = [
    {
      value: '',
      label: allLabel,
      isDotCluster: true,
      ...(allCount === undefined ? {} : { count: allCount }),
    },
    ...options.filter((option) => option.value !== '').map((option) => {
      const count = counts?.[option.value];
      return {
        value: option.value,
        label: option.label,
        dotColor: option.color,
        textColor: option.textColor || option.color,
        tintColor: option.tint,
        wrapLabel: maxPillWidth !== undefined,
        ...(count === undefined ? {} : { count }),
      };
    }),
  ];
  const selected = selectOptions.find((option) => option.value === value);

  return (
    <SelectMenu
      value={value}
      options={selectOptions}
      onChange={onChange}
      size="header"
      headerLabel={label}
      headerActiveContent={selected?.value ? (
        <StatusFilterPill
          key={selected.value}
          label={selected.label}
          title={selected.label}
          maxWidth={maxPillWidth}
        />
      ) : undefined}
      headerMaxPillWidth={maxPillWidth}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder || `Search ${label.toLowerCase()}s`}
      placeholder={allLabel}
      ariaLabel={`Filter ${entityName} by ${label}, currently ${selected?.label || allLabel}`}
      className={`${mobile ? 'column-header-filter--mobile' : ''} ${className}`}
    />
  );
}