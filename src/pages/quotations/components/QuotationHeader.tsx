import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuotationHeaderProps {
  title: string;
  subtitle: string;
}

export const QuotationHeader: React.FC<QuotationHeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <nav className="flex items-center gap-2 text-sm font-bold text-[#5442f6] uppercase tracking-wider mb-2">
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/quotations')}>Quotations</span>
        <span className="text-slate-400">&gt;</span>
        <span>{title}</span>
      </nav>
      <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">{title}</h1>
      <p className="text-base font-medium text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
};
export default QuotationHeader;
