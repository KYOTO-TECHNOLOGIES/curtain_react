import { Receipt, ShieldCheck } from 'lucide-react';

interface Props {
  totals: { subtotal: number; discountAmount: number; vat: number; total: number };
  discountPercentage: number;
  areaCount: number;
  surfaceCount: number;
  loading?: boolean;
  error?: boolean;
}

const money = (value: number) => value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DraftPricingSummary({ totals, discountPercentage, areaCount, surfaceCount, loading, error }: Props) {
  return (
    <aside className="qb-draft-summary" aria-label="Quotation pricing summary" aria-busy={loading}>
      <div className="qb-draft-summary-heading"><Receipt size={19} /><h2>Quotation summary</h2></div>
      <p className="qb-draft-summary-count">{areaCount} {areaCount === 1 ? 'area' : 'areas'} · {surfaceCount} {surfaceCount === 1 ? 'surface' : 'surfaces'}</p>
      {loading ? <p role="status">Loading catalog prices…</p> : error ? <p role="alert">Prices could not be loaded. Refresh the page to try again.</p> : (
        <div aria-live="polite" aria-atomic="true">
          <dl className="qb-summary-lines">
            <div><dt>Subtotal</dt><dd>AED {money(totals.subtotal)}</dd></div>
            <div className="qb-summary-discount"><dt>Discount ({discountPercentage}%)</dt><dd>− AED {money(totals.discountAmount)}</dd></div>
            <div><dt>VAT (5%)</dt><dd>AED {money(totals.vat)}</dd></div>
          </dl>
          <div className="qb-summary-grand-total"><span>Total amount</span><strong><small>AED</small> {money(totals.total)}</strong></div>
        </div>
      )}
      <p className="qb-summary-note"><ShieldCheck size={15} />Includes selected motors, pelmet, and add-ons.</p>
    </aside>
  );
}
