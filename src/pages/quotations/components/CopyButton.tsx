import { Copy } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

interface Props {
  value?: string;
  ariaLabel?: string;
  inline?: boolean;
  className?: string;
}

export default function CopyButton({
  value = '',
  ariaLabel = 'Copy',
  inline = false,
  className = '',
}: Props) {
  const { showToast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(value));
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleCopy}
      className={
        inline
          ? `qd-copy-inline ${className}`
          : `opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 cursor-pointer ${className}`
      }
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}
