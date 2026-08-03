import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, icon: Icon, error, required, ...props }: FormInputProps) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          {...props}
          className={`w-full ${
            Icon ? 'pl-11' : 'pl-4'
          } pr-4 py-3 bg-slate-50/50 border ${
            error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[#2b5c8f]'
          } rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all`}
        />
      </div>
      {error && <p className="text-[12px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
