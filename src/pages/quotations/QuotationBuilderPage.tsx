import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { catalogApi } from '../../api/catalog';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
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
    selectedAppointment?.customer?.phone_number || selectedAppointmentSummary?.customer_phone || '';

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
        unit_price_per_m2: defaultItem?.unit_price_per_m2 || '0',
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
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/quotations')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b]">Build Quotation</h1>
          <p className="text-sm text-slate-500">Create a new quotation with areas and surfaces</p>
        </div>
      </div>

      {/* Step 1: Select Appointment */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Step 1: Select Appointment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Appointment</label>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2b5c8f]" />
              </div>
            ) : (
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/20"
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

          {selectedAppointmentId && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={selectedCustomerName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={selectedAppointmentLoading ? 'Loading...' : selectedCustomerEmail}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={selectedCustomerPhone}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quotation Settings */}
      {selectedAppointmentId && (
        <>
          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quotation Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quote Type</label>
                <select
                  value={quotationSettings.quote_type}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      quote_type: e.target.value as 'b2c' | 'b2b',
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
                >
                  <option value="b2c">B2C (Retail)</option>
                  <option value="b2b">B2B (Business)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valid Until</label>
                <input
                  type="date"
                  value={quotationSettings.valid_until}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      valid_until: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={quotationSettings.discount_percentage}
                  onChange={(e) =>
                    setQuotationSettings({
                      ...quotationSettings,
                      discount_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Areas and Surfaces */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Step 2: Areas & Surfaces</h2>
              <button
                onClick={() => setShowAddAreaModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2b5c8f] text-white font-medium rounded-lg hover:bg-[#1f456e] transition"
              >
                <Plus className="w-4 h-4" /> Add Area
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
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() =>
                          setExpandedAreaId(expandedAreaId === area.tempId ? null : area.tempId)
                        }
                        className="flex items-center gap-3 flex-1 hover:text-[#2b5c8f] transition"
                      >
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${
                            expandedAreaId === area.tempId ? 'rotate-90' : ''
                          }`}
                        />
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">{area.display_name}</p>
                          <p className="text-xs text-slate-500">{area.area_type}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                          {area.surfaces.length} surfaces
                        </span>
                        <button
                          onClick={() => handleDeleteArea(area.tempId)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
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
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            catalog_item: Number(e.target.value),
                                          })
                                        }
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
                                        Price/m² (AED)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.unit_price_per_m2}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                            unit_price_per_m2: e.target.value,
                                          })
                                        }
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
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(area.tempId, surface.tempId, {
                                              motor_type: e.target.value ? Number(e.target.value) : null,
                                            })
                                          }
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2b5c8f] text-white font-semibold rounded-lg hover:bg-[#1f456e] transition disabled:opacity-60"
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
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
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
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
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
              className="flex-1 px-4 py-2 rounded-lg bg-[#2b5c8f] text-white font-medium hover:bg-[#1f456e]"
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
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select
              value={newSurfaceData.surface_type}
              onChange={(e) =>
                setNewSurfaceData({ ...newSurfaceData, surface_type: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
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
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
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
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-[#2b5c8f]"
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
              className="flex-1 px-4 py-2 rounded-lg bg-[#2b5c8f] text-white font-medium hover:bg-[#1f456e]"
            >
              Add Surface
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
