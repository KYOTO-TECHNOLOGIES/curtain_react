import React from 'react';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  digits: number; // typical phone number length excluding leading 0 and country code
  placeholder: string;
  format: (digits: string) => string;
  flagSvg: React.ReactNode;
}

// ── Accurate, crisp 20x14 inline SVG flags with 3px border radius ────────────

export const FlagAE: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="ae-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#ae-clip)">
      <rect width="20" height="4.67" fill="#00732F" />
      <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
      <rect y="9.33" width="20" height="4.67" fill="#000000" />
      <rect width="5.5" height="14" fill="#FF0000" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagGB: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="gb-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#gb-clip)">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M10 0V14M0 7H20" stroke="#FFFFFF" strokeWidth="4.2" />
      <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.5" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagIN: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="in-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#in-clip)">
      <rect width="20" height="4.67" fill="#FF9933" />
      <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
      <rect y="9.33" width="20" height="4.67" fill="#138808" />
      <circle cx="10" cy="7" r="1.8" stroke="#000080" strokeWidth="0.6" fill="none" />
      <circle cx="10" cy="7" r="0.5" fill="#000080" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagSA: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="sa-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#sa-clip)">
      <rect width="20" height="14" fill="#006C35" />
      {/* Simplified script bar & sword */}
      <path d="M5 5.5H15M6 7H14" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
      <path d="M5 9.5H15M6.5 8.5V10.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagQA: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="qa-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#qa-clip)">
      <rect width="20" height="14" fill="#8D1B3D" />
      <path d="M0 0H6.5L8 1.5L6.5 3L8 4.5L6.5 6L8 7.5L6.5 9L8 10.5L6.5 12L8 13.5L6.5 14H0V0Z" fill="#FFFFFF" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagOM: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="om-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#om-clip)">
      <rect width="20" height="4.67" fill="#FFFFFF" />
      <rect y="4.67" width="20" height="4.67" fill="#DB161B" />
      <rect y="9.33" width="20" height="4.67" fill="#008000" />
      <rect width="5.5" height="14" fill="#DB161B" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagKW: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="kw-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#kw-clip)">
      <rect width="20" height="4.67" fill="#007A3D" />
      <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
      <rect y="9.33" width="20" height="4.67" fill="#CE1126" />
      <path d="M0 0L5.5 4.67V9.33L0 14V0Z" fill="#000000" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagBH: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="bh-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#bh-clip)">
      <rect width="20" height="14" fill="#CE1126" />
      <path d="M0 0H5.5L7.5 1.4L5.5 2.8L7.5 4.2L5.5 5.6L7.5 7L5.5 8.4L7.5 9.8L5.5 11.2L7.5 12.6L5.5 14H0V0Z" fill="#FFFFFF" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagUS: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="us-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#us-clip)">
      <rect width="20" height="14" fill="#B22234" />
      <path d="M0 2H20M0 4.15H20M0 6.3H20M0 8.46H20M0 10.61H20M0 12.77H20" stroke="#FFFFFF" strokeWidth="1.07" />
      <rect width="8" height="7.5" fill="#3C3B6E" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagCA: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="ca-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#ca-clip)">
      <rect width="5" height="14" fill="#FF0000" />
      <rect x="5" width="10" height="14" fill="#FFFFFF" />
      <rect x="15" width="5" height="14" fill="#FF0000" />
      <path d="M10 4L9 6.5H8L9 7.5L8.5 9L10 8L11.5 9L11 7.5L12 6.5H11L10 4Z" fill="#FF0000" />
      <rect x="9.7" y="8" width="0.6" height="2" fill="#FF0000" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagAU: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="au-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#au-clip)">
      <rect width="20" height="14" fill="#00008B" />
      {/* Canton Union Jack */}
      <rect width="8" height="6" fill="#012169" />
      <path d="M0 0L8 6M8 0L0 6" stroke="#FFFFFF" strokeWidth="1" />
      <path d="M4 0V6M0 3H8" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M4 0V6M0 3H8" stroke="#E4002B" strokeWidth="1" />
      {/* Stars */}
      <circle cx="15" cy="4" r="0.8" fill="#FFFFFF" />
      <circle cx="16.5" cy="6" r="0.8" fill="#FFFFFF" />
      <circle cx="14" cy="8" r="0.8" fill="#FFFFFF" />
      <circle cx="16" cy="10" r="0.8" fill="#FFFFFF" />
      <circle cx="4" cy="10" r="1.3" fill="#FFFFFF" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagDE: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="de-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#de-clip)">
      <rect width="20" height="4.67" fill="#000000" />
      <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
      <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagFR: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="fr-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#fr-clip)">
      <rect width="6.67" height="14" fill="#002395" />
      <rect x="6.67" width="6.67" height="14" fill="#FFFFFF" />
      <rect x="13.34" width="6.67" height="14" fill="#ED2939" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagEG: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="eg-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#eg-clip)">
      <rect width="20" height="4.67" fill="#CE1126" />
      <rect y="4.67" width="20" height="4.67" fill="#FFFFFF" />
      <rect y="9.33" width="20" height="4.67" fill="#000000" />
      <circle cx="10" cy="7" r="1.2" fill="#C09A3E" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagPK: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="pk-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#pk-clip)">
      <rect width="20" height="14" fill="#01411C" />
      <rect width="5" height="14" fill="#FFFFFF" />
      <circle cx="12" cy="7" r="2.8" fill="#FFFFFF" />
      <circle cx="13" cy="6.6" r="2.5" fill="#01411C" />
      <polygon points="13.5,5 14,6.2 15.2,6.2 14.2,7 14.6,8.2 13.5,7.4 12.4,8.2 12.8,7 11.8,6.2 13,6.2" fill="#FFFFFF" transform="scale(0.7) translate(5, 2)" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

export const FlagPH: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className={`cm-country-flag ${className}`} aria-hidden="true">
    <clipPath id="ph-clip"><rect width="20" height="14" rx="3" /></clipPath>
    <g clipPath="url(#ph-clip)">
      <rect width="20" height="7" fill="#0038A8" />
      <rect y="7" width="20" height="7" fill="#CE1126" />
      <polygon points="0,0 9,7 0,14" fill="#FFFFFF" />
      <circle cx="3" cy="7" r="1.3" fill="#FCD116" />
    </g>
    <rect width="20" height="14" rx="3" stroke="rgba(15,23,42,0.12)" strokeWidth="1" fill="none" />
  </svg>
);

// ── Country Catalog ──────────────────────────────────────────────────────────

export const COUNTRIES: Country[] = [
  // ── Suggested Countries First ──
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    digits: 9,
    placeholder: '50 123 4567',
    format: (d) => {
      // 50 123 4567 (2 + 3 + 4)
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`;
    },
    flagSvg: <FlagAE />,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    digits: 10,
    placeholder: '7400 123456',
    format: (d) => {
      // 7400 123456 (4 + 6)
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 10)}`;
    },
    flagSvg: <FlagGB />,
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    digits: 10,
    placeholder: '98765 43210',
    format: (d) => {
      // 98765 43210 (5 + 5)
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)} ${d.slice(5, 10)}`;
    },
    flagSvg: <FlagIN />,
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    digits: 9,
    placeholder: '50 123 4567',
    format: (d) => {
      // 50 123 4567 (2 + 3 + 4)
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`;
    },
    flagSvg: <FlagSA />,
  },
  {
    code: 'QA',
    name: 'Qatar',
    dialCode: '+974',
    digits: 8,
    placeholder: '3312 3456',
    format: (d) => {
      // 3312 3456 (4 + 4)
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    flagSvg: <FlagQA />,
  },
  {
    code: 'OM',
    name: 'Oman',
    dialCode: '+968',
    digits: 8,
    placeholder: '9123 4567',
    format: (d) => {
      // 9123 4567 (4 + 4)
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    flagSvg: <FlagOM />,
  },
  {
    code: 'KW',
    name: 'Kuwait',
    dialCode: '+965',
    digits: 8,
    placeholder: '5123 4567',
    format: (d) => {
      // 5123 4567 (4 + 4)
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    flagSvg: <FlagKW />,
  },
  {
    code: 'BH',
    name: 'Bahrain',
    dialCode: '+973',
    digits: 8,
    placeholder: '3912 3456',
    format: (d) => {
      // 3912 3456 (4 + 4)
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    },
    flagSvg: <FlagBH />,
  },

  // ── Alphabetical Additional Countries ──
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    digits: 9,
    placeholder: '412 345 678',
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
    },
    flagSvg: <FlagAU />,
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    digits: 10,
    placeholder: '416 123 4567',
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
    flagSvg: <FlagCA />,
  },
  {
    code: 'EG',
    name: 'Egypt',
    dialCode: '+20',
    digits: 10,
    placeholder: '10 1234 5678',
    format: (d) => {
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    },
    flagSvg: <FlagEG />,
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    digits: 9,
    placeholder: '6 12 34 56 78',
    format: (d) => {
      if (d.length <= 1) return d;
      if (d.length <= 3) return `${d.slice(0, 1)} ${d.slice(1)}`;
      if (d.length <= 5) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3)}`;
      if (d.length <= 7) return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 1)} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    },
    flagSvg: <FlagFR />,
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    digits: 10,
    placeholder: '151 12345678',
    format: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${d.slice(3, 10)}`;
    },
    flagSvg: <FlagDE />,
  },
  {
    code: 'PK',
    name: 'Pakistan',
    dialCode: '+92',
    digits: 10,
    placeholder: '300 1234567',
    format: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${d.slice(3, 10)}`;
    },
    flagSvg: <FlagPK />,
  },
  {
    code: 'PH',
    name: 'Philippines',
    dialCode: '+63',
    digits: 10,
    placeholder: '917 123 4567',
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
    flagSvg: <FlagPH />,
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    digits: 10,
    placeholder: '555 123 4567',
    format: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    },
    flagSvg: <FlagUS />,
  },
];

export const SUGGESTED_CODES = ['AE', 'GB', 'IN', 'SA', 'QA', 'OM', 'KW', 'BH'];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // UAE (+971)

/**
 * Strips non-digits and removes a single leading zero (e.g. 050 -> 50)
 */
export function sanitizeDigits(raw: string): string {
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Detects if a pasted phone string starts with '+' or '00'
 * and matches the corresponding country dial code.
 */
export function parsePastedPhone(raw: string): { country: Country | null; digits: string } {
  const trimmed = raw.trim();
  let normalized = trimmed;

  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  if (normalized.startsWith('+')) {
    // Sort countries by longest dial code first to avoid matching +1 before +123
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (normalized.startsWith(c.dialCode)) {
        const remaining = normalized.slice(c.dialCode.length);
        const digits = sanitizeDigits(remaining);
        return { country: c, digits };
      }
    }
  }

  return { country: null, digits: sanitizeDigits(raw) };
}
