import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, icon: Icon, error, required, className = '', ...props }: FormInputProps) {
  return (
    <div className="flex flex-col font-['Hanken_Grotesk']">
      <label className="block text-[13px] font-semibold text-[#334155] mb-2 cursor-pointer">
        {label} {required && <span className="text-[#DC3B41] font-bold">*</span>}
      </label>
      <div className="relative flex items-center group">
        {Icon && (
          <div className="absolute left-4.5 pointer-events-none text-[#94A3B8] group-focus-within:text-[#0B1B33] transition-colors duration-150 z-10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
        )}
        <input
          {...props}
          className={`w-full ${
            Icon ? 'pl-12' : 'pl-4'
          } pr-4 h-12 bg-white border ${
            error
              ? 'border-[#DC3B41] focus:border-[#DC3B41] focus:ring-4 focus:ring-[#DC3B41]/14'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2A5FA8] focus:ring-4 focus:ring-[#2A5FA8]/16'
          } rounded-[14px] text-[15px] font-medium text-[#0B1B33] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(10,18,32,0.04),0_4px_12px_-4px_rgba(10,18,32,0.06)] outline-none transition-all duration-180 ${className}`}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-[#DC3B41] font-medium mt-1.5 animate-fadeIn">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
