import { Receipt } from 'lucide-react';
import { formatMoney } from './helpers';
import type { QuotationDetail } from '../../../api/quotations';

interface Props {
  subtotal?: string | number;
  discountPercentage?: number | string;
  discountAmount?: string | number;
  vat?: string | number;
  total?: string | number;
  quotation?: QuotationDetail | null;
  /** When set (edit mode), discount/VAT/total are previewed live from this percentage. */
  previewDiscountPercentage?: number | null;
  className?: string;
}

export default function PricingSummary({
  subtotal: propSubtotal,
  discountPercentage: propDiscountPercentage,
  discountAmount: propDiscountAmount,
  vat: propVat,
  total: propTotal,
  quotation,
  previewDiscountPercentage = null,
  className = '',
}: Props) {
  const subtotal = quotation ? quotation.subtotal : propSubtotal;
  let discountPercentage = quotation
    ? quotation.discount_percentage
    : propDiscountPercentage;
  let discountAmount = quotation
    ? quotation.discount_amount
    : propDiscountAmount;
  let vat = quotation ? quotation.vat : propVat;
  let total = quotation ? quotation.total : propTotal;

  const isPreview =
    previewDiscountPercentage !== null &&
    Number.isFinite(previewDiscountPercentage) &&
    Number(previewDiscountPercentage) !== Number(quotation?.discount_percentage || 0);
  if (isPreview) {
    const pct = Math.min(100, Math.max(0, Number(previewDiscountPercentage)));
    const base = Number(subtotal || 0);
    const disc = (base * pct) / 100;
    const vatAmt = (base - disc) * 0.05;
    discountPercentage = pct;
    discountAmount = disc.toFixed(2);
    vat = vatAmt.toFixed(2);
    total = (base - disc + vatAmt).toFixed(2);
  }

  const hasDiscount = Number(discountPercentage || 0) > 0 || Number(discountAmount || 0) > 0;

  return (
    <aside
      className={`qd-pricing qd-stagger qd-stagger-2 ${className}`}
      aria-label="Pricing Summary"
    >
      <div className="qd-pricing-sheen" aria-hidden="true" />

      <div className="qd-pricing-hdr">
        <div className="qd-pricing-icon" aria-hidden="true">
          <Receipt />
        </div>
        <h3 className="qd-pricing-title">Pricing Summary</h3>
        {isPreview && <span className="qd-pricing-preview">Preview · unsaved</span>}
      </div>

      <div className="qd-pricing-rows">
        <div className="qd-pricing-row">
          <span className="qd-pricing-row-label">Subtotal</span>
          <span className="qd-pricing-row-value">
            <span className="qd-pricing-prefix">AED</span>
            {formatMoney(subtotal)}
          </span>
        </div>

        <div className="qd-pricing-row">
          <span className="qd-pricing-row-label">
            Discount {hasDiscount ? `(${discountPercentage || 0}%)` : ''}
          </span>
          <span
            className={`qd-pricing-row-value ${
              hasDiscount
                ? 'qd-pricing-row-value--discount'
                : 'qd-pricing-row-value--zero'
            }`}
          >
            {hasDiscount ? '- ' : ''}
            <span className="qd-pricing-prefix">AED</span>
            {formatMoney(discountAmount)}
          </span>
        </div>

        <div className="qd-pricing-row">
          <span className="qd-pricing-row-label">VAT (5%)</span>
          <span className="qd-pricing-row-value">
            <span className="qd-pricing-prefix">AED</span>
            {formatMoney(vat)}
          </span>
        </div>

        <hr className="qd-pricing-divider qd-pricing-divider--heavy" />

        <div className="qd-pricing-total">
          <span className="qd-pricing-total-label">Total</span>
          <div className="text-right">
            <span className="qd-pricing-total-value">
              <span className="qd-pricing-total-prefix">AED</span>
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
