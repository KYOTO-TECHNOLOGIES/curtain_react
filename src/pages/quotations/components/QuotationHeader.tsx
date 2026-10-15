import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuotationHeaderProps {
  title: string;
  subtitle: string;
}

export const QuotationHeader: React.FC<QuotationHeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  return (
    <header className="qb-page-header">
      <nav className="qb-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="qb-breadcrumb-link" onClick={() => navigate('/quotations')}>
          Quotations
        </button>
        <span className="qb-breadcrumb-separator" aria-hidden="true">›</span>
        <span className="qb-breadcrumb-current">New Quotation</span>
      </nav>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
};
export default QuotationHeader;
