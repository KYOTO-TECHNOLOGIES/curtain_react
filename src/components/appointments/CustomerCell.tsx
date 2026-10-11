import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CustomerCellProps {
  name: string;
  phone?: string;
  onCopyPhone?: (phone: string) => void;
}

const AVATAR_PALETTES = [
  { bg: '#EFF6FF', text: '#2563EB', border: 'rgba(37, 99, 235, 0.18)' },
  { bg: '#F0FDF4', text: '#16A34A', border: 'rgba(22, 163, 74, 0.18)' },
  { bg: '#EEF2FF', text: '#4F46E5', border: 'rgba(79, 70, 229, 0.18)' },
  { bg: '#FFF7ED', text: '#EA580C', border: 'rgba(234, 88, 12, 0.18)' },
  { bg: '#FAF5FF', text: '#9333EA', border: 'rgba(147, 51, 234, 0.18)' },
  { bg: '#FDF2F8', text: '#DB2777', border: 'rgba(219, 39, 119, 0.18)' },
  { bg: '#F0FDFA', text: '#0D9488', border: 'rgba(13, 148, 136, 0.18)' },
  { bg: '#FEFCE8', text: '#CA8A04', border: 'rgba(202, 138, 4, 0.18)' },
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name: string): string {
  if (!name) return 'CU';
  const clean = name.replace(/[^\w\s]/gi, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const CustomerCell: React.FC<CustomerCellProps> = ({
  name,
  phone,
  onCopyPhone,
}) => {
  const [copied, setCopied] = useState(false);
  const cleanName = (name || '').trim();
  const displayName = cleanName || (phone ? 'Customer' : 'Unknown');
  const palette = getPalette(displayName);
  const initials = getInitials(cleanName);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(phone);
    }
    setCopied(true);
    onCopyPhone?.(phone);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="apt-customer-cell">
      {/* 36px initials avatar with soft tint */}
      <div
        className="apt-avatar"
        style={{
          backgroundColor: palette.bg,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Customer Info */}
      <div className="apt-customer-info">
        <span className="apt-customer-name" title={displayName}>
          {displayName}
        </span>

        {phone && (
          <div
            className="apt-customer-phone-row"
            onClick={handleCopy}
            role="button"
            tabIndex={-1}
            title="Click to copy phone number"
          >
            <span className="apt-customer-phone">{phone}</span>

            <button
              type="button"
              className="apt-copy-btn"
              onClick={handleCopy}
              aria-label={`Copy phone number ${phone}`}
              title={copied ? 'Copied!' : 'Copy phone number'}
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600 animate-in zoom-in-50" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {copied && (
              <span className="text-[11px] font-bold text-emerald-600 ml-1 animate-in fade-in duration-150">
                Copied!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCell;
