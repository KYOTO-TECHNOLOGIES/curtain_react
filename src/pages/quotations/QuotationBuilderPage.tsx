import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Save, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { catalogApi } from '../../api/catalog';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import QuotationHeader from './components/QuotationHeader';

import type { SurfaceSpec } from '../../api/quotations';
import type { AppointmentDetail, AppointmentListItem } from '../../types';

interface BuilderSurface {
  tempId: string;
  surface_name: string;
  surface_type: string;
  width_cm: number;
  height_cm: number;
  opening_direction: string;
  special_requirements?: string;
  sort_order: number;
  spec: SurfaceSpec;
}

interface BuilderArea {
  tempId: string;
  area_type: string;
  display_name: string;
  sort_order: number;
  surfaces: BuilderSurface[];
}

export default function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [quotationSettings, setQuotationSettings] = useState({
    quote_type: 'b2c' as 'b2c' | 'b2b',
    work_type: 1,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    discount_percentage: 0,
  });

  const [areas, setAreas] = useState<BuilderArea[]>([]);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddSurfaceModal, setShowAddSurfaceModal] = useState(false);
  const [selectedAreaForSurface, setSelectedAreaForSurface] = useState<string | null>(null);
  const [newAreaData, setNewAreaData] = useState({ type: '', display_name: '' });
  const [newSurfaceData, setNewSurfaceData] = useState({
    surface_name: '',
    surface_type: 'window',
    width_cm: '',
    height_cm: '',
    opening_direction: 'left_to_right',
    special_requirements: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data
  const { data: appointmentsRes, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list({ status: 'completed' } as any),
  });

  const { data: selectedAppointmentRes, isLoading: selectedAppointmentLoading } = useQuery({
    queryKey: ['appointment', selectedAppointmentId],
    queryFn: () => appointmentsApi.get(selectedAppointmentId),
    enabled: !!selectedAppointmentId,
  });

  const { data: fabricTypesRes } = useQuery({
    queryKey: ['fabric_types'],
    queryFn: () => catalogApi.fabricTypes(),
  });

  const { data: modelsRes } = useQuery({
    queryKey: ['models'],
    queryFn: () => catalogApi.models(),
  });

  const { data: itemsRes } = useQuery({
    queryKey: ['items'],
    queryFn: () => catalogApi.items(),
  });

  const { data: motorsRes } = useQuery({
    queryKey: ['motors'],
    queryFn: () => catalogApi.motors(),
  });

  const appointments: AppointmentListItem[] = appointmentsRes?.data || [];
  const fabricTypes = fabricTypesRes?.data || [];
  const models = modelsRes?.data || [];
  const items = itemsRes?.data || [];
  const motors = motorsRes?.data || [];

  const selectedAppointmentSummary = appointments.find(
    (appointment) => String(appointment.id) === selectedAppointmentId
  );
  const selectedAppointment: AppointmentDetail | null = selectedAppointmentRes?.data || null;
  const selectedCustomerId = selectedAppointment?.customer?.id ?? selectedAppointmentSummary?.customer;
  const selectedCustomerName =
    selectedAppointment?.customer?.full_name || selectedAppointmentSummary?.customer_name || '';
  const selectedCustomerEmail = selectedAppointment?.customer?.email || '';
  const selectedCustomerPhone =
    selectedAppointment?.customer?.phone || selectedAppointmentSummary?.customer_phone || '';

  const handleAddArea = () => {
    if (!newAreaData.type || !newAreaData.display_name) {
      showToast('Area type and name are required', 'error');
      return;
    }

    const newArea: BuilderArea = {
      tempId: Date.now().toString(),
      area_type: newAreaData.type,
      display_name: newAreaData.display_name,
      sort_order: areas.length,
      surfaces: [],
    };

    setAreas([...areas, newArea]);
    setNewAreaData({ type: '', display_name: '' });
    setShowAddAreaModal(false);
    showToast('Area added successfully', 'success');
  };

  const handleDeleteArea = (tempId: string) => {
    setAreas(areas.filter((a) => a.tempId !== tempId));
    showToast('Area removed', 'success');
  };

  const handleAddSurface = () => {
    if (!selectedAreaForSurface) return;
    if (!newSurfaceData.surface_name || !newSurfaceData.width_cm || !newSurfaceData.height_cm) {
      showToast('Surface name and dimensions are required', 'error');
      return;
    }

    const defaultItem = items[0] as any;
    const newSurface: BuilderSurface = {
      tempId: Date.now().toString(),
      surface_name: newSurfaceData.surface_name,
      surface_type: newSurfaceData.surface_type,
      width_cm: parseFloat(newSurfaceData.width_cm),
      height_cm: parseFloat(newSurfaceData.height_cm),
      opening_direction: newSurfaceData.opening_direction,
      special_requirements: newSurfaceData.special_requirements,
      sort_order: 0,
      spec: {
        fabric_type: fabricTypes[0]?.id || 0,
        model: models[0]?.id || 0,
        catalog_item: items[0]?.id || 0,
        fabric_code: defaultItem?.code || '',
        unit_price_per_m2: defaultItem?.price_per_unit || '0',
        motor_control_type: 'manual',
        motor_type: null,
        motor_price_per_unit: '0',
        smart_integration: false,
        alexa_quantity: 0,
        alexa_unit_price: '0',
        pelmet_enabled: false,
        pelmet_width_cm: '0',
        pelmet_price_per_metre: '0',
        addon_label: '',
        addon_amount: '0',
      },
    };

    setAreas(
      areas.map((a) =>
        a.tempId === selectedAreaForSurface
          ? { ...a, surfaces: [...a.surfaces, newSurface] }
          : a
      )
    );

    setNewSurfaceData({
      surface_name: '',
      surface_type: 'window',
      width_cm: '',
      height_cm: '',
      opening_direction: 'left_to_right',
      special_requirements: '',
    });
    setShowAddSurfaceModal(false);
    setSelectedAreaForSurface(null);
    showToast('Surface added successfully', 'success');
  };

  const handleDeleteSurface = (areaId: string, surfaceTempId: string) => {
    setAreas(
      areas.map((a) =>
        a.tempId === areaId
          ? { ...a, surfaces: a.surfaces.filter((s) => s.tempId !== surfaceTempId) }
          : a
      )
    );
    showToast('Surface removed', 'success');
  };

  const handleUpdateSurfaceSpec = (
    areaId: string,
    surfaceId: string,
    specUpdates: Partial<SurfaceSpec>
  ) => {
    setAreas(
      areas.map((a) =>
        a.tempId === areaId
          ? {
            ...a,
            surfaces: a.surfaces.map((s) =>
              s.tempId === surfaceId
                ? { ...s, spec: { ...s.spec, ...specUpdates } }
                : s
            ),
          }
          : a
      )
    );
  };

  const handleSaveQuotation = async () => {
    if (!selectedAppointmentId) {
      showToast('Please select an appointment', 'error');
      return;
    }

    if (!selectedCustomerId) {
      showToast('Unable to load the selected customer details', 'error');
      return;
    }

    if (areas.length === 0) {
      showToast('Please add at least one area', 'error');
      return;
    }

    const hasEmptySurfaces = areas.some((a) => a.surfaces.length === 0);
    if (hasEmptySurfaces) {
      showToast('All areas must have at least one surface', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        customer: selectedCustomerId,
        appointment: selectedAppointment?.id ?? selectedAppointmentId,
        status: 'draft',
        quote_type: quotationSettings.quote_type,
        work_type: quotationSettings.work_type,
        valid_until: quotationSettings.valid_until,
        discount_percentage: quotationSettings.discount_percentage,
        areas_data: areas.map((area) => ({
          area_type: area.area_type,
          display_name: area.display_name,
          sort_order: area.sort_order,
          surfaces: area.surfaces.map((surface) => ({
            surface_name: surface.surface_name,
            surface_type: surface.surface_type,
            width_cm: surface.width_cm,
            height_cm: surface.height_cm,
            opening_direction: surface.opening_direction,
            special_requirements: surface.special_requirements,
            sort_order: surface.sort_order,
            spec: surface.spec,
          })),
        })),
      };

      const res = await quotationsApi.create(payload);
      showToast('Quotation created successfully', 'success');
      navigate(`/quotations/${res.data.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create quotation';
      showToast(msg, 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAreaM2 = (width: number, height: number) => {
    return ((width * height) / 10000).toFixed(2);
  };

  const calculateSurfaceTotal = (spec: SurfaceSpec, widthCm: number, heightCm: number) => {
    const areaM2 = (widthCm * heightCm) / 10000;
    const fabricTotal = parseFloat(String(spec.unit_price_per_m2)) * areaM2;
    const motorTotal =
      spec.motor_control_type === 'motorized'
        ? parseFloat(String(spec.motor_price_per_unit))
        : 0;
    const alexaTotal = spec.smart_integration
      ? parseFloat(String(spec.alexa_unit_price)) * spec.alexa_quantity
      : 0;
    const pelmetTotal = spec.pelmet_enabled
      ? parseFloat(String(spec.pelmet_price_per_metre)) *
      (parseFloat(String(spec.pelmet_width_cm)) / 100)
      : 0;
    const addonTotal = parseFloat(String(spec.addon_amount));

    return (fabricTotal + motorTotal + alexaTotal + pelmetTotal + addonTotal).toFixed(2);
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-20">
      {/* Header */}
      <QuotationHeader title="Create New Quotation" subtitle="Configure your bespoke atelier request by defining areas, surfaces, and product specifics." />

      {/* General Information */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-[#5442f6]" />
          <h2 className="text-[13px] font-bold text-[#5442f6] uppercase tracking-wider">General Information</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-2">Choose Appointment</label>
              <div className="relative">
                {appointmentsLoading ? (
                  <div className="flex items-center justify-center py-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5442f6]" />
                  </div>
                ) : (
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#5442f6] focus:ring-2 focus:ring-[#5442f6]/20 transition-all font-medium text-slate-700"
                  >
                    <option value="">-- Select Appointment --</option>
                    {appointments.map((appt) => (
                      <option key={appt.id} value={String(appt.id)}>
                        #{appt.id} - {appt.customer_name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedAppointmentId && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-500">Customer:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedCustomerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-500">Email:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedAppointmentLoading ? 'Loading...' : selectedCustomerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-500">Phone:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedCustomerPhone}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-2">Quotation Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setQuotationSettings({ ...quotationSettings, quote_type: 'b2c' })}
                  className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all ${quotationSettings.quote_type === 'b2c'
                      ? 'border-[#5442f6] bg-[#eef2ff]'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${quotationSettings.quote_type === 'b2c' ? 'border-[#5442f6]' : 'border-slate-300'
                    }`}>
                    {quotationSettings.quote_type === 'b2c' && <div className="w-2.5 h-2.5 rounded-full bg-[#5442f6]" />}
                  </div>
                  <span className={`font-bold text-[15px] ${quotationSettings.quote_type === 'b2c' ? 'text-[#1e293b]' : 'text-slate-700'}`}>
                    B2C (Retail)
                  </span>
                </button>

                <button
                  onClick={() => setQuotationSettings({ ...quotationSettings, quote_type: 'b2b' })}
                  className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all ${quotationSettings.quote_type === 'b2b'
                      ? 'border-[#5442f6] bg-[#eef2ff]'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${quotationSettings.quote_type === 'b2b' ? 'border-[#5442f6]' : 'border-slate-300'
                    }`}>
                    {quotationSettings.quote_type === 'b2b' && <div className="w-2.5 h-2.5 rounded-full bg-[#5442f6]" />}
                  </div>
                  <span className={`font-bold text-[15px] ${quotationSettings.quote_type === 'b2b' ? 'text-[#1e293b]' : 'text-slate-700'}`}>
                    B2B (Business)
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-bold text-slate-700 mb-2">
                  Valid Until <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="date"
                  value={quotationSettings.valid_until}
                  onChange={(e) => setQuotationSettings({ ...quotationSettings, valid_until: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#5442f6] focus:ring-2 focus:ring-[#5442f6]/20 transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[15px] font-bold text-slate-700 mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={quotationSettings.discount_percentage}
                  onChange={(e) => setQuotationSettings({ ...quotationSettings, discount_percentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#5442f6] focus:ring-2 focus:ring-[#5442f6]/20 transition-all font-medium text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Areas and Surfaces */}
      {selectedAppointmentId && (
        <>
          <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-extrabold text-[#1e293b]">Configuration</h2>
              <button
                onClick={() => setShowAddAreaModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#22c55e] text-slate-900 font-extrabold text-[14px] rounded-full shadow-sm hover:bg-[#16a34a] transition-all"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-slate-900">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                Add New Area
              </button>
            </div>

            {areas.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">No areas added yet. Add an area to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {areas.map((area) => (
                  <div key={area.tempId} className="border border-slate-200 rounded-lg p-4">
                    {/* Area Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                      <button
                        onClick={() =>
                          setExpandedAreaId(expandedAreaId === area.tempId ? null : area.tempId)
                        }
                        className="flex items-center gap-4 flex-1 hover:opacity-80 transition"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#eef2ff] text-[#5442f6] flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-current rounded-sm"></div>
                        </div>
                        <div className="text-left flex items-center gap-3">
                          <h3 className="text-[22px] font-extrabold text-[#1e293b]">{area.display_name}</h3>
                          <ChevronRight
                            className={`w-5 h-5 text-slate-400 transition-transform ${expandedAreaId === area.tempId ? 'rotate-90' : ''
                              }`}
                          />
                        </div>
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <select
                            value={area.area_type}
                            onChange={(e) => {
                              const newAreas = [...areas];
                              const idx = newAreas.findIndex(a => a.tempId === area.tempId);
                              if (idx !== -1) newAreas[idx].area_type = e.target.value;
                              setAreas(newAreas);
                            }}
                            className="appearance-none bg-white border border-slate-200 text-slate-700 text-[15px] font-medium rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-[#5442f6] min-w-[180px]"
                          >
                            <option value={area.area_type}>{area.area_type}</option>
                          </select>
                        </div>
                        <button
                          onClick={() => handleDeleteArea(area.tempId)}
                          className="p-3 bg-[#fef2f2] text-[#ef4444] rounded-xl hover:bg-[#fee2e2] transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Area Content */}
                    {expandedAreaId === area.tempId && (
                      <div className="pl-8 space-y-4 border-t border-slate-200 pt-4">
                        {/* Surfaces */}
                        {area.surfaces.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No surfaces added</p>
                        ) : (
                          <div className="space-y-3">
                            {area.surfaces.map((surface) => (
                              <div
                                key={surface.tempId}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
                              >
                                {/* Surface Dimensions */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {surface.surface_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {surface.width_cm}cm × {surface.height_cm}cm (
                                      {calculateAreaM2(surface.width_cm, surface.height_cm)}m²)
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteSurface(area.tempId, surface.tempId)
                                    }
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Surface Spec Configuration */}
                                {surface.spec && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                                    {/* Fabric */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Fabric Type
                                      </label>
                                      <select
                                        value={surface.spec.fabric_type}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            fabric_type: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {fabricTypes.map((ft: any) => (
                                          <option key={ft.id} value={ft.id}>
                                            {ft.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Model
                                      </label>
                                      <select
                                        value={surface.spec.model}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            model: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {models.map((m: any) => (
                                          <option key={m.id} value={m.id}>
                                            {m.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Item
                                      </label>
                                      <select
                                        value={surface.spec.catalog_item}
                                        onChange={(e) => {
                                          const selectedItemId = Number(e.target.value);
                                          const selectedItem = items.find((i: any) => i.id === selectedItemId) as any;
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            catalog_item: selectedItemId,
                                            unit_price_per_m2: selectedItem?.price_per_unit || surface.spec.unit_price_per_m2,
                                          });
                                        }}
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {items.map((item: any) => (
                                          <option key={item.id} value={item.id}>
                                            {item.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Surface Price (AED)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={(() => {
                                          const areaM2 = (Number(surface.width_cm) * Number(surface.height_cm)) / 10000;
                                          const unitPrice = parseFloat(String(surface.spec.unit_price_per_m2)) || 0;
                                          return areaM2 > 0 ? (areaM2 * unitPrice).toFixed(2) : '0.00';
                                        })()}
                                        onChange={(e) => {
                                          const areaM2 = (Number(surface.width_cm) * Number(surface.height_cm)) / 10000;
                                          const newSurfacePrice = parseFloat(e.target.value) || 0;
                                          const newUnitPrice = areaM2 > 0 ? (newSurfacePrice / areaM2).toFixed(4) : '0';
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            unit_price_per_m2: newUnitPrice,
                                          });
                                        }}
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>

                                    {/* Motor */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Control
                                      </label>
                                      <select
                                        value={surface.spec.motor_control_type}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            motor_control_type: e.target.value as 'manual' | 'motorized',
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        <option value="manual">Manual</option>
                                        <option value="motorized">Motorized</option>
                                      </select>
                                    </div>

                                    {surface.spec.motor_control_type === 'motorized' && (
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          Motor Type
                                        </label>
                                        <select
                                          value={surface.spec.motor_type || ''}
                                          onChange={(e) => {
                                            const selectedMotorId = e.target.value ? Number(e.target.value) : null;
                                            const selectedMotor = selectedMotorId ? motors.find((m: any) => m.id === selectedMotorId) as any : null;
                                            handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                              motor_type: selectedMotorId,
                                              motor_price_per_unit: selectedMotor?.price_per_m2 || '0',
                                            });
                                          }}
                                          className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                        >
                                          <option value="">Select</option>
                                          {motors.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                              {m.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Motor Price (AED)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.motor_price_per_unit}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            motor_price_per_unit: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>

                                    {/* Smart Integration */}
                                    <div className="col-span-1 sm:col-span-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={surface.spec.smart_integration}
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                              smart_integration: e.target.checked,
                                            })
                                          }
                                          className="rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-600">
                                          Smart Integration (Alexa)
                                        </span>
                                      </label>
                                    </div>

                                    {surface.spec.smart_integration && (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Qty
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={surface.spec.alexa_quantity}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                                alexa_quantity: Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Unit Price (AED)
                                          </label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.alexa_unit_price}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                                alexa_unit_price: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {/* Pelmet */}
                                    <div className="col-span-1 sm:col-span-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={surface.spec.pelmet_enabled}
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                              pelmet_enabled: e.target.checked,
                                            })
                                          }
                                          className="rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-600">
                                          Add Pelmet
                                        </span>
                                      </label>
                                    </div>

                                    {surface.spec.pelmet_enabled && (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Width (cm)
                                          </label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.pelmet_width_cm}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                                pelmet_width_cm: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Price/m (AED)
                                          </label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.pelmet_price_per_metre}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                                pelmet_price_per_metre: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {/* Addon */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Addon Label
                                      </label>
                                      <input
                                        type="text"
                                        value={surface.spec.addon_label || ''}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            addon_label: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., Install"
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Addon Amount (AED)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.addon_amount}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            addon_amount: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-1 sm:col-span-2 bg-blue-50 p-2 rounded border border-blue-200">
                                      <p className="text-xs font-medium text-blue-700">
                                        Line Total: AED{' '}
                                        {calculateSurfaceTotal(
                                          surface.spec,
                                          surface.width_cm,
                                          surface.height_cm
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Surface Button */}
                        <button
                          onClick={() => {
                            setSelectedAreaForSurface(area.tempId);
                            setShowAddSurfaceModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition"
                        >
                          <Plus className="w-4 h-4" /> Add Surface
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-3 sticky bottom-0 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <button
              onClick={() => navigate('/quotations')}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuotation}
              disabled={isSaving || !selectedAppointmentId || !selectedCustomerId || areas.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#5442f6] text-white font-semibold rounded-lg hover:bg-[#1f456e] transition disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Quotation
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Add Area Modal */}
      <Modal
        open={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        title="Add Area"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Area Type</label>
            <input
              type="text"
              placeholder="e.g., Master Bedroom"
              value={newAreaData.type}
              onChange={(e) => setNewAreaData({ ...newAreaData, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Area Name</label>
            <input
              type="text"
              placeholder="e.g., Windows"
              value={newAreaData.display_name}
              onChange={(e) =>
                setNewAreaData({ ...newAreaData, display_name: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddAreaModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddArea}
              className="flex-1 px-4 py-2 rounded-lg bg-[#5442f6] text-white font-medium hover:bg-[#1f456e]"
            >
              Add Area
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Surface Modal */}
      <Modal
        open={showAddSurfaceModal}
        onClose={() => setShowAddSurfaceModal(false)}
        title="Add Surface"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              placeholder="e.g., Window 1"
              value={newSurfaceData.surface_name}
              onChange={(e) =>
                setNewSurfaceData({ ...newSurfaceData, surface_name: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select
              value={newSurfaceData.surface_type}
              onChange={(e) =>
                setNewSurfaceData({ ...newSurfaceData, surface_type: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
            >
              <option value="window">Window</option>
              <option value="wall">Wall</option>
              <option value="door">Door</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Width (cm)</label>
              <input
                type="number"
                placeholder="240"
                value={newSurfaceData.width_cm}
                onChange={(e) =>
                  setNewSurfaceData({ ...newSurfaceData, width_cm: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
              <input
                type="number"
                placeholder="310"
                value={newSurfaceData.height_cm}
                onChange={(e) =>
                  setNewSurfaceData({ ...newSurfaceData, height_cm: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#5442f6]"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddSurfaceModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSurface}
              className="flex-1 px-4 py-2 rounded-lg bg-[#5442f6] text-white font-medium hover:bg-[#1f456e]"
            >
              Add Surface
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
