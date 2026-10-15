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
  className?: string;
}

export default function PricingSummary({
  subtotal: propSubtotal,
  discountPercentage: propDiscountPercentage,
  discountAmount: propDiscountAmount,
  vat: propVat,
  total: propTotal,
  quotation,
  className = '',
}: Props) {
  const subtotal = quotation ? quotation.subtotal : propSubtotal;
  const discountPercentage = quotation
    ? quotation.discount_percentage
    : propDiscountPercentage;
  const discountAmount = quotation
    ? quotation.discount_amount
    : propDiscountAmount;
  const vat = quotation ? quotation.vat : propVat;
  const total = quotation ? quotation.total : propTotal;

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
