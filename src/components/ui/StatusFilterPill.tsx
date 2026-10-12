interface StatusFilterPillProps {
  label: string;
  title?: string;
  maxWidth?: number;
}

export function StatusFilterPill({ label, title, maxWidth }: StatusFilterPillProps) {
  return (
    <span
      className="status-filter-pill-content"
      title={title}
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
    >
      <span className="status-filter-pill-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}