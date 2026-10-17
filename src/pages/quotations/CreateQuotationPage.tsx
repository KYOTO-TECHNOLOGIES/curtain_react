import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Info, 
  Search, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { quotationsApi } from '../../api/quotations';
import { DatePicker } from '../../components/ui/DatePicker';

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Default valid_until = 30 days from today
  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
  const validUntilStr = defaultValidUntil.toISOString().split('T')[0];

  const [general, setGeneral] = useState({
    appointment: '',
    workType: 'Curtain&Blinds',
    quoteType: 'b2c',
    valid_until: validUntilStr,
    discount_percentage: '0'
  });

  const [areas] = useState([
    {
      id: '1',
      name: 'Room of Fatima',
      type: 'Master Bedroom',
      surfaces: [
        {
          id: '1',
          type: 'Window (Curtain Path)',
          fabricType: 'Curtains',
          modal: 'American',
          item: 'Sheer',
          openingDirection: 'one_way',
          width: 240,
          height: 310,
          specialReqs: '',
          pricePerUnit: 95.00,
          customCode: '',
          controlType: 'manual',
          controlCharge: 60,
          controlNotes: '',
          addPelmet: false,
          addCustomCharge: false
        }
      ]
    }
  ]);

  // Calculations
  const totalArea = areas.reduce((acc, area) => {
    return acc + area.surfaces.reduce((sAcc, s) => sAcc + ((s.width * s.height) / 10000), 0);
  }, 0);

  const subtotal = areas.reduce((acc, area) => {
    return acc + area.surfaces.reduce((sAcc, s) => {
      const areaM2 = (s.width * s.height) / 10000;
      const fabricTotal = areaM2 * s.pricePerUnit;
      const controlTotal = s.controlType === 'manual' ? (areaM2 * s.controlCharge) : s.controlCharge;
      return sAcc + fabricTotal + controlTotal;
    }, 0);
  }, 0);

  const vat = subtotal * 0.05;
  const grandTotal = subtotal + vat;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customer: 1,
        quote_type: general.quoteType,
        work_type: general.workType === 'Curtain&Blinds' ? 1 : 2,
        status: 'draft',
        valid_until: general.valid_until,
        discount_percentage: parseFloat(general.discount_percentage) || 0,
        areas_data: areas.map(a => ({
          name: a.name,
          type: a.type,
          items: a.surfaces.map(s => ({
            surface_type: s.type,
            fabric_type: s.fabricType,
            model: s.modal,
            width: s.width,
            height: s.height,
            price_per_unit: s.pricePerUnit,
            control_type: s.controlType,
            control_charge: s.controlCharge
          }))
        }))
      };
      await quotationsApi.create(payload);
      showToast('Quotation generated successfully', 'success');
      navigate('/quotations');
    } catch (err: any) {
      // Extract and display detailed API validation errors
      const errData = err?.response?.data;
      let msg = 'Failed to generate quotation';
      if (errData) {
        if (typeof errData === 'string') {
          msg = errData;
        } else if (errData.detail) {
          msg = errData.detail;
        } else {
          // Flatten field-level errors like {valid_until: ["This field is required."]}
          const firstKey = Object.keys(errData)[0];
          if (firstKey && Array.isArray(errData[firstKey])) {
            msg = `${firstKey}: ${errData[firstKey][0]}`;
          }
        }
      }
      showToast(msg, 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="animate-page-in font-sans pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2b5c8f] uppercase tracking-wider mb-2">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/quotations')}>QUOTATIONS</span>
          <span className="text-slate-400">&gt;</span>
          <span>NEW QUOTATION</span>
        </div>
        <h1 className="text-[36px] font-extrabold text-[#1e293b] tracking-tight leading-tight">
          Create New Quotation
        </h1>
        <p className="text-[15px] font-medium text-slate-500 mt-1">
          Configure your bespoke atelier request by defining areas, surfaces, and product specifics.
        </p>
      </div>

      {/* General Information */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-[#2b5c8f]" />
          <h2 className="text-[13px] font-bold text-[#2b5c8f] uppercase tracking-wider">General Information</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-2">Choose Appointment</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search client or appointment ID..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-2">Work Type</label>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {['Curtain&Blinds', 'Carpet', 'Sofa', 'Wallpaper'].map(type => (
                  <button
                    key={type}
                    onClick={() => setGeneral({...general, workType: type})}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-[14px] font-bold transition-all ${
                      general.workType === type 
                        ? 'bg-white text-[#2b5c8f] shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Valid Until + Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-bold text-slate-700 mb-2">
                  Valid Until <span className="text-[#ef4444]">*</span>
                </label>
                <DatePicker
                  value={general.valid_until}
                  onChange={(event) => setGeneral({...general, valid_until: event.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-slate-700 mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={general.discount_percentage}
                  onChange={(e) => setGeneral({...general, discount_percentage: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all font-medium text-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-bold text-slate-700 mb-2">Quotation Type</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setGeneral({...general, quoteType: 'b2c'})}
                className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all ${
                  general.quoteType === 'b2c' 
                    ? 'border-[#2b5c8f] bg-[#eef2ff]' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  general.quoteType === 'b2c' ? 'border-[#2b5c8f]' : 'border-slate-300'
                }`}>
                  {general.quoteType === 'b2c' && <div className="w-2.5 h-2.5 rounded-full bg-[#2b5c8f]" />}
                </div>
                <span className={`font-bold text-[15px] ${general.quoteType === 'b2c' ? 'text-[#1e293b]' : 'text-slate-700'}`}>
                  B2C (Retail)
                </span>
              </button>
              
              <button 
                onClick={() => setGeneral({...general, quoteType: 'b2b'})}
                className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all ${
                  general.quoteType === 'b2b' 
                    ? 'border-[#2b5c8f] bg-[#eef2ff]' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  general.quoteType === 'b2b' ? 'border-[#2b5c8f]' : 'border-slate-300'
                }`}>
                  {general.quoteType === 'b2b' && <div className="w-2.5 h-2.5 rounded-full bg-[#2b5c8f]" />}
                </div>
                <span className={`font-bold text-[15px] ${general.quoteType === 'b2b' ? 'text-[#1e293b]' : 'text-slate-700'}`}>
                  B2B (Business)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-extrabold text-[#1e293b]">Configuration</h2>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#10b981] text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 hover:bg-[#059669] transition-all">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Add New Area
        </button>
      </div>

      {/* Areas List */}
      <div className="space-y-6">
        {areas.map((area) => (
          <div key={area.id} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            {/* Area Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#eef2ff] text-[#2b5c8f] flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current rounded-sm"></div>
                </div>
                <h3 className="text-[22px] font-extrabold text-[#1e293b]">{area.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-[15px] font-medium rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#2b5c8f] min-w-[180px]">
                    <option>{area.type}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button className="p-2.5 text-[#ef4444] border border-[#fca5a5] rounded-xl hover:bg-[#fef2f2] transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Surfaces inside Area */}
            <div className="space-y-8">
              {area.surfaces.map((surface, surfaceIdx) => {
                const surfaceAreaM2 = (surface.width * surface.height) / 10000;
                const fabricTotal = surfaceAreaM2 * surface.pricePerUnit;
                
                return (
                  <div key={surface.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[12px] font-extrabold text-slate-400 tracking-[0.1em] uppercase">
                        SURFACE 0{surfaceIdx + 1}
                      </span>
                      <button className="flex items-center gap-1.5 text-[#2b5c8f] font-bold text-[14px] hover:text-[#4338ca] transition-colors">
                        <Plus className="w-4 h-4" /> Add Surface
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-2">
                            <label className="block text-[14px] font-bold text-slate-700 mb-2">Surface Type</label>
                            <div className="relative">
                              <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl pl-4 pr-10 py-3 outline-none focus:border-[#2b5c8f]">
                                <option>{surface.type}</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-slate-700 mb-2">Type of Fabric</label>
                            <div className="relative">
                              <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl pl-4 pr-10 py-3 outline-none focus:border-[#2b5c8f]">
                                <option>{surface.fabricType}</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-slate-700 mb-2">Modal</label>
                            <div className="relative">
                              <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl pl-4 pr-10 py-3 outline-none focus:border-[#2b5c8f]">
                                <option>{surface.modal}</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[14px] font-bold text-slate-700 mb-2">
                            Opening Direction <span className="text-slate-400 font-medium">— install info, no price effect</span>
                          </label>
                          <div className="flex gap-3">
                            <button className="px-6 py-2.5 bg-[#10b981] text-white font-bold text-sm rounded-xl shadow-sm">
                              One Way
                            </button>
                            <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:border-slate-300">
                              Two Way
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[14px] font-bold text-slate-700 mb-2">Width (cm)</label>
                            <input type="number" defaultValue={surface.width} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#2b5c8f] font-medium" />
                          </div>
                          <div>
                            <label className="block text-[14px] font-bold text-slate-700 mb-2">Height (cm)</label>
                            <input type="number" defaultValue={surface.height} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#2b5c8f] font-medium" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-[#eef2ff] px-5 py-4 rounded-xl border border-[#e0e7ff]">
                          <div className="flex items-center gap-2 text-[#2b5c8f] font-bold text-[13px] tracking-wider uppercase">
                            <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                            Converted Area
                          </div>
                          <div className="text-[18px] font-extrabold text-[#1e293b]">
                            {surfaceAreaM2.toFixed(2)} m²
                          </div>
                        </div>

                        <div>
                          <label className="block text-[14px] font-bold text-slate-700 mb-2">Special Requirements</label>
                          <textarea 
                            rows={3}
                            placeholder="e.g. Needs blackout lining..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#2b5c8f] font-medium resize-none placeholder:text-slate-400"
                          ></textarea>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="lg:col-span-5 space-y-6">
                        <div>
                          <label className="block text-[14px] font-bold text-slate-700 mb-2 opacity-0">Choose Item</label>
                          <div className="relative mb-4">
                            <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl pl-4 pr-10 py-3 outline-none focus:border-[#2b5c8f]">
                              <option>{surface.item}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                          <div className="bg-white border border-slate-200 p-3 rounded-xl flex gap-4 items-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8 opacity-50" />
                            </div>
                            <span className="font-bold text-slate-700 text-[15px]">Item image</span>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-32">
                            <label className="block text-[14px] font-bold text-slate-700 mb-1">Price per Unit (AED)</label>
                            <span className="block text-[11px] font-medium text-slate-400 mb-2">from catalog</span>
                            <div className="bg-slate-100 px-4 py-3 rounded-xl font-extrabold text-slate-700 text-[16px]">
                              {surface.pricePerUnit.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[14px] font-bold text-slate-700 mb-1">Custom Codes</label>
                            <span className="block text-[11px] font-medium text-slate-400 mb-2 opacity-0">spacer</span>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-0.5">
                                {[1,2,3,4].map(i => <div key={i} className="w-0.5 h-3.5 bg-slate-300"></div>)}
                              </div>
                              <input type="text" placeholder="Type a code, press Enter" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-baseline gap-2 pt-4 border-t border-slate-200 border-dashed">
                          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                            Fabric Total <span className="lowercase normal-case font-medium">({surfaceAreaM2.toFixed(2)} m² × AED {surface.pricePerUnit.toFixed(2)})</span>
                          </span>
                          <span className="text-[22px] font-extrabold text-[#2b5c8f]">
                            AED {fabricTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Motorization Block */}
            <div className="mt-6 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#10b981] font-bold text-[13px] tracking-wider uppercase mb-5">
                <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                Motorization & Control
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[15px] font-bold text-slate-700 mb-3">Type of Control</label>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-white border border-[#10b981] text-[#10b981] font-bold text-sm rounded-xl shadow-sm">
                      Manual
                    </button>
                    <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:border-slate-300">
                      Motorized
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-bold text-slate-700 mb-3">Charges</label>
                  <div className="bg-white border border-[#bbf7d0] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-[15px]">Manual Control</span>
                        <span className="text-slate-400 text-[13px] font-medium">(7.44 m² × AED <input type="number" defaultValue="60" className="w-12 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-center text-slate-700" />)</span>
                      </div>
                      <span className="font-extrabold text-[#1e293b] text-[16px]">AED 446.40</span>
                    </div>
                    <div className="h-px bg-[#bbf7d0] w-full mb-4"></div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#10b981] text-[14px] uppercase tracking-wider">Control Total</span>
                      <span className="font-extrabold text-[#10b981] text-[18px]">AED 446.40</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-bold text-slate-700 mb-3">Additional Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Motor side: left / right, remote channels, warranty terms, wiring notes..."
                    className="w-full bg-white border border-[#bbf7d0] rounded-xl px-4 py-3 outline-none focus:border-[#10b981] font-medium resize-none placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#2b5c8f] focus:ring-[#2b5c8f]" />
                <span className="font-bold text-slate-700 text-[15px]">Add Pelmet <span className="font-medium text-slate-400 text-[13px]">(optional — priced per running metre from a separate width)</span></span>
              </label>
              
              <label className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-colors">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#2b5c8f] focus:ring-[#2b5c8f]" />
                <span className="font-bold text-slate-700 text-[15px]">Add custom charge <span className="font-medium text-slate-400 text-[13px]">(optional — e.g. customization, service charge)</span></span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--sidebar-w,264px)] transition-[left] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgb(0,0,0,0.05)] z-40 p-4 md:px-8 md:py-5 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md bg-white/90">
        
        <div className="flex items-center gap-8 md:gap-12 w-full md:w-auto overflow-x-auto">
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Area</span>
            <span className="text-[20px] font-extrabold text-[#1e293b]">{totalArea.toFixed(2)} m²</span>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <span className="text-[14px] font-bold text-slate-500">Subtotal</span>
            <span className="text-[14px] font-bold text-[#1e293b] text-right">AED {subtotal.toFixed(2)}</span>
            
            <span className="text-[14px] font-bold text-slate-500">VAT (5%)</span>
            <span className="text-[14px] font-bold text-[#1e293b] text-right">AED {vat.toFixed(2)}</span>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quotation Total (Incl. VAT)</span>
            <span className="text-[28px] font-black text-[#2b5c8f] tracking-tight">AED {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold text-[15px] rounded-full shadow-sm hover:bg-slate-50 transition-colors">
            Save Draft
          </button>
          <button disabled={isSubmitting} onClick={handleGenerate} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#2b5c8f] text-white font-bold text-[15px] rounded-full shadow-md shadow-indigo-500/20 hover:bg-[#4338ca] hover:-translate-y-0.5 transition-all disabled:opacity-60">
            <FileText className="w-5 h-5" /> {isSubmitting ? 'Generating...' : 'Generate Quotation'}
          </button>
        </div>

      </div>
    </div>
  );
}
