import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  iconVariant?: 'brand' | 'amber' | 'emerald' | 'slate';
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function InfoCard({
  title,
  icon,
  iconVariant = 'brand',
  headerRight,
  children,
  className = '',
}: Props) {
  return (
    <section className={`qd-card ${className}`}>
      <div className="qd-card-hdr">
        {icon && (
          <div className={`qd-card-icon qd-card-icon--${iconVariant}`}>
            {icon}
          </div>
        )}
        <h2 className="qd-card-title">{title}</h2>
        {headerRight && <div className="qd-card-hdr-right">{headerRight}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
