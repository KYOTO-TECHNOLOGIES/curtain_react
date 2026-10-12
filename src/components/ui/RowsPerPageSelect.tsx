import { SelectMenu, type SelectOption } from './SelectMenu';

export interface RowsPerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  total?: number;
  disabled?: boolean;
}

export function RowsPerPageSelect({
  value,
  onChange,
  options,
  total,
  disabled = false,
}: RowsPerPageSelectProps) {
  const selectOptions: SelectOption[] = options.map((size) => ({
    value: String(size),
    label: String(size),
    suffix: 'rows',
    count: total === undefined ? undefined : Math.ceil(total / size),
  }));

  return (
    <div className="rows-per-page-select">
      <span className="rows-per-page-label" aria-hidden="true">
        <span className="rows-per-page-label-full">Rows per page</span>
        <span className="rows-per-page-label-short">Rows</span>
      </span>
      <SelectMenu
        value={String(value)}
        options={selectOptions}
        onChange={(nextValue) => onChange(Number(nextValue))}
        ariaLabel="Rows per page"
        placeholder="Rows per page"
        size="sm"
        placement="top-start"
        disabled={disabled}
        className="rows-per-page-menu"
      />
    </div>
  );
}