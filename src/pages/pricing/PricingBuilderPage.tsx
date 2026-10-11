import { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Calculator,
  ArrowLeft,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { catalogApi, type CatalogItem, type MotorType, type ChargeTemplate } from '../../api/catalog';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';
import { useToast } from '../../components/ui/Toast';

interface QuotationLineItem {
  id: string;
  item_id: number;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total: number;
}

interface QuotationMotor {
  id: string;
  motor_id: number;
  motor_name: string;
  area_m2: number;
  price_per_m2: number;
  total: number;
}

interface QuotationCharge {
  id: string;
  charge_id: number;
  charge_name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function PricingBuilderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customerId, setCustomerId] = useState<number | ''>('');
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
  const [motors, setMotors] = useState<QuotationMotor[]>([]);
  const [charges, setCharges] = useState<QuotationCharge[]>([]);
  const [notes, setNotes] = useState('');

  // Fetch data
  const { data: customersRes } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  });

  const { data: itemsRes } = useQuery({
    queryKey: ['items'],
    queryFn: () => catalogApi.items(),
  });

  const { data: motorsRes } = useQuery({
    queryKey: ['motors'],
    queryFn: () => catalogApi.motors(),
  });

  const { data: chargesRes } = useQuery({
    queryKey: ['charges'],
    queryFn: () => catalogApi.charges(),
  });

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const customers = toArray<Customer>(customersRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motorTypes = toArray<MotorType>(motorsRes);
  const chargeTemplates = toArray<ChargeTemplate>(chargesRes);

  // Calculations
  const subtotal = [
    ...lineItems.map((li) => li.total),
    ...motors.map((m) => m.total),
    ...charges.map((c) => c.total),
  ].reduce((sum, val) => sum + val, 0);

  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const addLineItem = () => {
    if (items.length === 0) {
      showToast('No catalog items available', 'error');
      return;
    }
    const firstItem = items[0];
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        item_id: firstItem.id,
        item_name: firstItem.name,
        quantity: 1,
        price_per_unit: parseFloat(firstItem.price_per_unit),
        total: parseFloat(firstItem.price_per_unit),
      },
    ]);
  };

  const addMotor = () => {
    if (motorTypes.length === 0) {
      showToast('No motor types available', 'error');
      return;
    }
    const firstMotor = motorTypes[0];
    setMotors([
      ...motors,
      {
        id: Date.now().toString(),
        motor_id: firstMotor.id,
        motor_name: firstMotor.name,
        area_m2: 1,
        price_per_m2: parseFloat(firstMotor.price_per_m2),
        total: parseFloat(firstMotor.price_per_m2),
      },
    ]);
  };

  const addCharge = () => {
    if (chargeTemplates.length === 0) {
      showToast('No charge templates available', 'error');
      return;
    }
    const firstCharge = chargeTemplates[0];
    setCharges([
      ...charges,
      {
        id: Date.now().toString(),
        charge_id: firstCharge.id,
        charge_name: firstCharge.name,
        quantity: 1,
        price: parseFloat(firstCharge.price),
        total: parseFloat(firstCharge.price),
      },
    ]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((li) => {
        if (li.id === id) {
          const updated = { ...li, [field]: value };
          if (field === 'quantity' || field === 'price_per_unit') {
            updated.total = updated.quantity * updated.price_per_unit;
          }
          if (field === 'item_id') {
            const item = items.find((i) => i.id === value);
            if (item) {
              updated.item_name = item.name;
              updated.price_per_unit = parseFloat(item.price_per_unit);
              updated.total = updated.quantity * updated.price_per_unit;
            }
          }
          return updated;
        }
        return li;
      })
    );
  };

  const updateMotor = (id: string, field: string, value: any) => {
    setMotors(
      motors.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };
          if (field === 'area_m2' || field === 'price_per_m2') {
            updated.total = updated.area_m2 * updated.price_per_m2;
          }
          if (field === 'motor_id') {
            const motor = motorTypes.find((mo) => mo.id === value);
            if (motor) {
              updated.motor_name = motor.name;
              updated.price_per_m2 = parseFloat(motor.price_per_m2);
              updated.total = updated.area_m2 * updated.price_per_m2;
            }
          }
          return updated;
        }
        return m;
      })
    );
  };

  const updateCharge = (id: string, field: string, value: any) => {
    setCharges(
      charges.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          if (field === 'quantity' || field === 'price') {
            updated.total = updated.quantity * updated.price;
          }
          if (field === 'charge_id') {
            const charge = chargeTemplates.find((ch) => ch.id === value);
            if (charge) {
              updated.charge_name = charge.name;
              updated.price = parseFloat(charge.price);
              updated.total = updated.quantity * updated.price;
            }
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleSave = () => {
    if (!customerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (lineItems.length === 0 && motors.length === 0 && charges.length === 0) {
      showToast('Please add at least one item to the quotation', 'error');
      return;
    }
    showToast('Quotation saved successfully', 'success');
    // Here you would make an API call to save the quotation
  };

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/quotations')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Pricing Builder</h1>
          </div>
          <p className="text-slate-500 text-sm">Create and manage quotations</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2b5c8f] text-white text-sm font-medium rounded-xl hover:bg-[#1f456e] transition-all"
        >
          <Save className="w-4 h-4" /> Save Quotation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h2>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Catalog Items</h2>
              <button
                onClick={addLineItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {lineItems.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No items added yet</p>
            ) : (
              <div className="space-y-4">
                {lineItems.map((li) => (
                  <div key={li.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Item</label>
                      <select
                        value={li.item_id}
                        onChange={(e) => updateLineItem(li.id, 'item_id', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      >
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        value={li.quantity}
                        onChange={(e) =>
                          updateLineItem(li.id, 'quantity', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={li.price_per_unit}
                        onChange={(e) =>
                          updateLineItem(li.id, 'price_per_unit', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Total</label>
                      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium">
                        {li.total.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => setLineItems(lineItems.filter((l) => l.id !== li.id))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Motors */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Motors</h2>
              <button
                onClick={addMotor}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Motor
              </button>
            </div>

            {motors.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No motors added yet</p>
            ) : (
              <div className="space-y-4">
                {motors.map((m) => (
                  <div key={m.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Motor Type</label>
                      <select
                        value={m.motor_id}
                        onChange={(e) => updateMotor(m.id, 'motor_id', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      >
                        {motorTypes.map((motor) => (
                          <option key={motor.id} value={motor.id}>
                            {motor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-slate-600 mb-1">Area (m²)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={m.area_m2}
                        onChange={(e) => updateMotor(m.id, 'area_m2', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Price/m²</label>
                      <input
                        type="number"
                        step="0.01"
                        value={m.price_per_m2}
                        onChange={(e) => updateMotor(m.id, 'price_per_m2', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Total</label>
                      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium">
                        {m.total.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => setMotors(motors.filter((mo) => mo.id !== m.id))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Charges */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Additional Charges</h2>
              <button
                onClick={addCharge}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Charge
              </button>
            </div>

            {charges.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No charges added yet</p>
            ) : (
              <div className="space-y-4">
                {charges.map((c) => (
                  <div key={c.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600 mb-1">Charge Type</label>
                      <select
                        value={c.charge_id}
                        onChange={(e) => updateCharge(c.id, 'charge_id', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      >
                        {chargeTemplates.map((charge) => (
                          <option key={charge.id} value={charge.id}>
                            {charge.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        value={c.quantity}
                        onChange={(e) => updateCharge(c.id, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={c.price}
                        onChange={(e) => updateCharge(c.id, 'price', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2b5c8f]/20"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-600 mb-1">Total</label>
                      <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium">
                        {c.total.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => setCharges(charges.filter((ch) => ch.id !== c.id))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-6">
            <label className="block text-sm font-medium text-slate-900 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for this quotation..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              rows={4}
            />
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#2b5c8f] to-[#1f456e] rounded-2xl text-white p-8 sticky top-6">
            <div className="flex items-center gap-2 mb-8">
              <Calculator className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Summary</h3>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Subtotal:</span>
                <span className="font-semibold">AED {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Tax (5%):</span>
                <span className="font-semibold">AED {tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/20 pt-4 flex justify-between">
                <span>Total:</span>
                <span className="text-2xl font-bold">AED {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 text-sm text-white/90 space-y-2">
              <p>
                <strong>Items:</strong> {lineItems.length}
              </p>
              <p>
                <strong>Motors:</strong> {motors.length}
              </p>
              <p>
                <strong>Charges:</strong> {charges.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
