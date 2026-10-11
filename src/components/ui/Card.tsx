import React from 'react';
import { X } from 'lucide-react';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[#5442f6] w-5 h-5">{icon}</span>}
        <h2 className="text-sm font-bold text-[#5442f6] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
};
