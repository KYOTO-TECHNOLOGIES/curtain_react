import type { SurfaceSpec } from '../../../api/quotations';
import { formatMoney } from './helpers';

export default function SavedSurfacePricing({ spec }: { spec: Partial<SurfaceSpec> }) {
  const lines = spec.charge_lines || [];
  const extras = lines.filter((line) => line.kind === 'other');
  const row = (label: string, amount: unknown, key = label) => <div key={key}><dt>{label}</dt><dd>AED {formatMoney(amount as string | number)}</dd></div>;
  return (
    <div className="qd-line-breakdown" aria-label="Surface pricing breakdown">
      <dl>
        {row('Fabric', spec.fabric_total)}
        {spec.motor_control_type === 'motorized' && row(`Motor${spec.motor_type_name ? ` · ${spec.motor_type_name}` : ''} (${spec.motor_quantity ?? 1} × ${spec.motor_pricing_unit === 'unit' ? 'per motor' : 'per m²'})`, spec.motor_charge_total)}
        {lines.filter((line) => line.kind !== 'other').map((line) => row(`${line.name} · ${Number(line.billable_quantity ?? line.quantity).toLocaleString('en-AE', { maximumFractionDigits: 4 })} ${line.kind === 'alexa' || line.unit === 'flat' ? 'units' : line.unit === 'm2' ? 'm²' : 'm'} × AED ${formatMoney(line.price)}`, line.total, String(line.id)))}
        {lines.length === 0 && <>
          {Number(spec.manual_control_total) > 0 && row('Control charge', spec.manual_control_total)}
          {spec.smart_integration && row(`Alexa (${spec.alexa_quantity ?? 0} units)`, spec.alexa_total)}
          {spec.pelmet_enabled && row(`Pelmet (${Number(spec.pelmet_width_cm || 0) / 100} m)`, spec.pelmet_total)}
        </>}
      </dl>
      {(extras.length > 0 || Number(spec.addon_amount) > 0) && <>
        <h4>Add-ons</h4>
        <dl>
          {extras.map((line) => row(`${line.name} · Qty ${line.quantity} · AED ${formatMoney(line.price)} ${line.unit === 'flat' ? 'each' : line.unit === 'm2' ? '/ m²' : '/ m'}`, line.total, String(line.id)))}
          {extras.length === 0 && row(spec.addon_label || 'Other charges', spec.addon_amount)}
        </dl>
      </>}
    </div>
  );
}
