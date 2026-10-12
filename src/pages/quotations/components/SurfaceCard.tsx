import {
  ArrowRight,
  ArrowLeft,
  Columns,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { formatAreaM2, formatDimensions, sentenceCase, formatMoney } from './helpers';

export interface Surface {
  surface_name?: string;
  width_cm?: number | string;
  height_cm?: number | string;
  surface_type?: string;
  opening_direction?: string;
  special_requirements?: string;
  spec?: {
    fabric_code?: string;
    catalog_item_name?: string;
    line_item_total?: string | number;
    motor_control_type?: string;
    smart_integration?: boolean;
    pelmet_enabled?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Props {
  surface: Surface;
  isEditing?: boolean;
  onDelete?: () => void;
  className?: string;
}

export default function SurfaceCard({
  surface,
  isEditing = false,
  onDelete,
  className = '',
}: Props) {
  const dims = formatDimensions(surface.width_cm, surface.height_cm);
  const area = formatAreaM2(surface.width_cm, surface.height_cm);
  const opening = sentenceCase(surface.opening_direction || 'left_to_right');
  const isLeftToRight = (surface.opening_direction || '').toLowerCase().includes('left_to_right');
  const isCenter = (surface.opening_direction || '').toLowerCase().includes('center');

  return (
    <div className={`qd-surface ${className}`}>
      <div className="qd-surface-top">
        {/* Architectural curtain sketch thumbnail */}
        <div className="qd-surface-sketch" aria-hidden="true">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#2F5D8F]"
          >
            {/* Window frame backdrop */}
            <rect
              x="6"
              y="8"
              width="44"
              height="40"
              rx="6"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Curtain rod */}
            <line
              x1="4"
              y1="12"
              x2="52"
              y2="12"
              stroke="#2F5D8F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left finial & right finial */}
            <circle cx="4" cy="12" r="2" fill="#2F5D8F" />
            <circle cx="52" cy="12" r="2" fill="#2F5D8F" />
            {/* Curtain drapery waves */}
            <path
              d="M10 13 C12 24 10 36 12 44 C13 44 14 44 15 44 C13 36 15 24 13 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.18"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            <path
              d="M16 13 C18 24 16 36 18 44 C19 44 20 44 21 44 C19 36 21 24 19 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.28"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            {/* Right curtain drapery waves */}
            <path
              d="M35 13 C37 24 35 36 37 44 C38 44 39 44 40 44 C38 36 40 24 38 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.28"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
            <path
              d="M41 13 C43 24 41 36 43 44 C44 44 45 44 46 44 C44 36 46 24 44 13 Z"
              fill="#2F5D8F"
              fillOpacity="0.18"
              stroke="#2F5D8F"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Info content */}
        <div className="qd-surface-info">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="qd-surface-name-row">
              <span className="qd-surface-name">
                {surface.surface_name || 'Unnamed Surface'}
              </span>
              {dims && <span className="qd-dim-chip">{dims}</span>}
            </div>

            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                aria-label="Remove surface"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="qd-surface-meta">
            {area && (
              <span className="qd-meta-pill">
                <Maximize2 />
                <span>{area}</span>
              </span>
            )}
            <span className="qd-meta-pill">
              <span>{sentenceCase(surface.surface_type || 'Window')}</span>
            </span>
            <span className="qd-meta-pill">
              {isCenter ? (
                <Columns />
              ) : isLeftToRight ? (
                <ArrowRight />
              ) : (
                <ArrowLeft />
              )}
              <span>{opening}</span>
            </span>
            {surface.spec?.motor_control_type === 'motorized' && (
              <span className="qd-meta-pill bg-purple-50 text-purple-700 font-medium">
                ⚡ Motorized
              </span>
            )}
          </div>

          {/* Spec breakdown box */}
          <div className="qd-surface-footer">
            <div>
              <div className="qd-surface-footer-label">Fabric Code</div>
              <div className="qd-surface-footer-value">
                {surface.spec?.fabric_code || '—'}
              </div>
            </div>
            <div>
              <div className="qd-surface-footer-label">Catalog Item</div>
              <div className="qd-surface-footer-value truncate">
                {surface.spec?.catalog_item_name || 'Standard'}
              </div>
            </div>

            <div className="qd-surface-total-row">
              <span className="qd-surface-total-label">Line Total</span>
              <span className="qd-surface-total-value">
                <span className="qd-surface-total-prefix">AED</span>
                {formatMoney(surface.spec?.line_item_total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
