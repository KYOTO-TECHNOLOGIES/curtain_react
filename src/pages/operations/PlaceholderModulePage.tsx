import { Package } from 'lucide-react';

interface PlaceholderModulePageProps {
  title: string;
  description: string;
  planned: string[];
}

export default function PlaceholderModulePage({
  title,
  description,
  planned,
}: PlaceholderModulePageProps) {
  return (
    <div className="space-y-6 animate-page-in font-sans pb-10 max-w-3xl">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] font-medium text-slate-500">{description}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] px-8 py-14 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2b5c8f]/10">
          <Package className="h-7 w-7 text-[#2b5c8f]" />
        </div>
        <h2 className="text-xl font-bold text-[#1e293b] mb-2">{title} screen</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
          This area matches the admin demo navigation. Backend APIs for this module are not built yet —
          once available, stock levels, suppliers, and reorders will be wired here.
        </p>
        <div className="mt-6 inline-flex items-center rounded-full bg-[#f0f4f8] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2b5c8f]">
          Planned module
        </div>
      </div>

      {planned.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Planned capabilities</h3>
          <ul className="space-y-2">
            {planned.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2b5c8f] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
