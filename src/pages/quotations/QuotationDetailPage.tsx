import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Send,
  CheckCircle,
  XCircle,
  Save,
  X,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { catalogApi } from '../../api/catalog';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import type { QuotationDetail, SurfaceSpec } from '../../api/quotations';

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendVia, setSendVia] = useState('email');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddSurfaceModal, setShowAddSurfaceModal] = useState(false);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(null);
  const [newAreaData, setNewAreaData] = useState({ type: '', display_name: '' });
  const [newSurfaceData, setNewSurfaceData] = useState({
    surface_name: '',
    surface_type: 'window',
    width_cm: '',
    height_cm: '',
    opening_direction: 'left_to_right',
    special_requirements: '',
  });

  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.get(id!),
    enabled: !!id,
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

  const quotation: QuotationDetail | null = res?.data || null;
  const fabricTypes = fabricTypesRes?.data || [];
  const models = modelsRes?.data || [];
  const items = itemsRes?.data || [];
  const motors = motorsRes?.data || [];

  const [formData, setFormData] = useState<Partial<QuotationDetail>>({});

  useEffect(() => {
    if (quotation) {
      setFormData({
        ...quotation,
        areas: quotation.areas?.map((area) => ({
          ...area,
          surfaces: area.surfaces.map((surface) => ({
            ...surface,
            spec: { ...surface.spec },
          })),
        })),
      });
    }
  }, [quotation]);

  const handleAreaChange = (
    areaIndex: number,
    field: 'area_type' | 'display_name',
    value: string
  ) => {
    setFormData((prev) => {
      const areas = [...(prev.areas || [])];
      const area = areas[areaIndex];
      if (!area) return prev;

      areas[areaIndex] = { ...area, [field]: value };
      return { ...prev, areas };
    });
  };

  const handleSurfaceChange = (
    areaIndex: number,
    surfaceIndex: number,
    field: 'surface_name' | 'surface_type' | 'width_cm' | 'height_cm' | 'opening_direction' | 'special_requirements',
    value: string
  ) => {
    setFormData((prev) => {
      const areas = [...(prev.areas || [])];
      const area = areas[areaIndex];
      const surface = area?.surfaces[surfaceIndex];
      if (!area || !surface) return prev;

      const nextValue = field === 'width_cm' || field === 'height_cm'
        ? Number(value) || 0
        : value;

      const surfaces = [...area.surfaces];
      surfaces[surfaceIndex] = { ...surface, [field]: nextValue };
      areas[areaIndex] = { ...area, surfaces };

      return { ...prev, areas };
    });
  };

  const handleUpdateSurfaceSpec = (
    areaIndex: number,
    surfaceIndex: number,
    specUpdates: Partial<SurfaceSpec>
  ) => {
    setFormData((prev) => {
      const areas = [...(prev.areas || [])];
      const area = areas[areaIndex];
      const surface = area?.surfaces[surfaceIndex];
      if (!area || !surface) return prev;

      const surfaces = [...area.surfaces];
      surfaces[surfaceIndex] = {
        ...surface,
        spec: { ...surface.spec, ...specUpdates },
      };
      areas[areaIndex] = { ...area, surfaces };

      return { ...prev, areas };
    });
  };

  const handleAddArea = () => {
    if (!newAreaData.type || !newAreaData.display_name) {
      showToast('Area type and name are required', 'error');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      areas: [
        ...(prev.areas || []),
        {
          area_type: newAreaData.type,
          display_name: newAreaData.display_name,
          sort_order: (prev.areas || []).length,
          surfaces: [],
        },
      ],
    }));

    setNewAreaData({ type: '', display_name: '' });
    setShowAddAreaModal(false);
    showToast('Area added successfully', 'success');
  };

  const handleDeleteArea = (areaIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      areas: (prev.areas || []).filter((_, index) => index !== areaIndex).map((area, index) => ({
        ...area,
        sort_order: index,
      })),
    }));
    showToast('Area removed', 'success');
  };

  const handleAddSurface = () => {
    if (selectedAreaIndex === null) return;
    if (!newSurfaceData.surface_name || !newSurfaceData.width_cm || !newSurfaceData.height_cm) {
      showToast('Surface name and dimensions are required', 'error');
      return;
    }

    const defaultItem = items[0] as any;
    setFormData((prev) => {
      const areas = [...(prev.areas || [])];
      const area = areas[selectedAreaIndex];
      if (!area) return prev;

      const newSurface = {
        surface_name: newSurfaceData.surface_name,
        surface_type: newSurfaceData.surface_type,
        width_cm: parseFloat(newSurfaceData.width_cm),
        height_cm: parseFloat(newSurfaceData.height_cm),
        opening_direction: newSurfaceData.opening_direction,
        special_requirements: newSurfaceData.special_requirements,
        sort_order: area.surfaces.length,
        spec: {
          fabric_type: fabricTypes[0]?.id || 0,
          model: models[0]?.id || 0,
          catalog_item: items[0]?.id || 0,
          fabric_code: defaultItem?.code || '',
          unit_price_per_m2: defaultItem?.unit_price_per_m2 || '0',
          motor_control_type: 'manual' as const,
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

      areas[selectedAreaIndex] = {
        ...area,
        surfaces: [...area.surfaces, newSurface],
      };

      return { ...prev, areas };
    });

    setNewSurfaceData({
      surface_name: '',
      surface_type: 'window',
      width_cm: '',
      height_cm: '',
      opening_direction: 'left_to_right',
      special_requirements: '',
    });
    setShowAddSurfaceModal(false);
    setSelectedAreaIndex(null);
    showToast('Surface added successfully', 'success');
  };

  const handleDeleteSurface = (areaIndex: number, surfaceIndex: number) => {
    setFormData((prev) => {
      const areas = [...(prev.areas || [])];
      const area = areas[areaIndex];
      if (!area) return prev;

      areas[areaIndex] = {
        ...area,
        surfaces: area.surfaces
          .filter((_, index) => index !== surfaceIndex)
          .map((surface, index) => ({ ...surface, sort_order: index })),
      };

      return { ...prev, areas };
    });
    showToast('Surface removed', 'success');
  };

  const calculateAreaM2 = (width: number | string, height: number | string) => {
    return ((Number(width) * Number(height)) / 10000).toFixed(2);
  };

  const calculateSurfaceTotal = (spec: SurfaceSpec, widthCm: number | string, heightCm: number | string) => {
    const areaM2 = (Number(widthCm) * Number(heightCm)) / 10000;
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
    const addonTotal = parseFloat(String(spec.addon_amount || 0));

    return (fabricTotal + motorTotal + alexaTotal + pelmetTotal + addonTotal).toFixed(2);
  };

  const handleSave = async () => {
    if (!id || !quotation) return;
    setSaving(true);
    try {
      await quotationsApi.update(id, {
        ...formData,
        discount_percentage: formData.discount_percentage || 0,
      } as any);
      showToast('Quotation updated successfully', 'success');
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to update quotation',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuotation = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await quotationsApi.send(id, sendVia);
      showToast(`Quotation sent via ${sendVia}`, 'success');
      setShowSendModal(false);
      refetch();
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to send quotation',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await quotationsApi.accept(id);
      showToast('Quotation accepted', 'success');
      refetch();
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to accept quotation',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await quotationsApi.cancel(id);
      showToast('Quotation cancelled', 'success');
      navigate('/quotations');
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to cancel quotation',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await quotationsApi.delete(id);
      showToast('Quotation deleted', 'success');
      navigate('/quotations');
    } catch (err: any) {
      showToast(
        err?.response?.data?.detail || 'Failed to delete quotation',
        'error'
      );
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Quotation not found</p>
        <button
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2b5c8f] text-white rounded-lg hover:bg-[#1f456e]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>
      </div>
    );
  }

  const displayAreas = formData.areas || quotation.areas || [];

  return (
    <div className="space-y-6 animate-page-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
              {quotation.id}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {quotation.customer_name} • {quotation.work_type_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(quotation);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-300 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md hover:bg-[#1f456e] transition-all disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              {quotation.status === 'draft' && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-200 transition-all"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              )}
              {quotation.status === 'sent' && (
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 font-semibold text-sm rounded-xl hover:bg-green-200 transition-all disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Status</p>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase ${getStatusBadgeClass(quotation.status)}`}
            >
              {quotation.status}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Type</p>
            <p className="text-sm font-bold text-slate-800">
              {quotation.quote_type === 'b2c' ? 'B2C (Retail)' : 'B2B (Business)'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Valid Until</p>
            <p className="text-sm font-bold text-slate-800">{quotation.valid_until}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Created</p>
            <p className="text-sm font-bold text-slate-800">
              {quotation.created_at?.split('T')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Section */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Name</p>
                <p className="text-sm font-bold text-slate-800">{quotation.customer_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Email</p>
                <p className="text-sm font-bold text-slate-800">
                  {quotation.customer_email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Phone</p>
                <p className="text-sm font-bold text-slate-800">
                  {quotation.customer_phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Appointment</p>
                <p className="text-sm font-bold text-slate-800">
                  {quotation.appointment_id || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Discount & Details</h2>
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Discount
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {quotation.discount_percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Discount Amount
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    AED {quotation.discount_amount || '0.00'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Areas Section */}
          {(displayAreas.length > 0 || isEditing) && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Areas & Surfaces</h2>
                {isEditing && (
                  <button
                    onClick={() => setShowAddAreaModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Area
                  </button>
                )}
              </div>

              {displayAreas.length === 0 ? (
                <p className="text-sm text-slate-500">No areas added yet.</p>
              ) : (
                <div className="space-y-6">
                  {displayAreas.map((area, aIdx) => (
                    <div key={aIdx} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={area.area_type}
                                onChange={(e) => handleAreaChange(aIdx, 'area_type', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
                                placeholder="Area type"
                              />
                              <input
                                type="text"
                                value={area.display_name}
                                onChange={(e) => handleAreaChange(aIdx, 'display_name', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
                                placeholder="Area name"
                              />
                            </div>
                          ) : (
                            <h3 className="font-semibold text-slate-800">
                              {area.area_type} - {area.display_name}
                            </h3>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteArea(aIdx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {area.surfaces.map((surface, sIdx) => (
                          <div key={sIdx} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {surface.surface_name || `Surface ${sIdx + 1}`}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {surface.width_cm}cm × {surface.height_cm}cm ({calculateAreaM2(surface.width_cm, surface.height_cm)}m²)
                                </p>
                              </div>
                              {isEditing && (
                                <button
                                  onClick={() => handleDeleteSurface(aIdx, sIdx)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-3 mb-3">
                                <input
                                  type="text"
                                  value={surface.surface_name}
                                  onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'surface_name', e.target.value)}
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                  placeholder="Surface name"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    value={surface.surface_type}
                                    onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'surface_type', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                    placeholder="Surface type"
                                  />
                                  <input
                                    type="text"
                                    value={surface.opening_direction}
                                    onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'opening_direction', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                    placeholder="Opening direction"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={surface.width_cm}
                                    onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'width_cm', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                    placeholder="Width (cm)"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    value={surface.height_cm}
                                    onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'height_cm', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                    placeholder="Height (cm)"
                                  />
                                </div>
                                <textarea
                                  value={surface.special_requirements || ''}
                                  onChange={(e) => handleSurfaceChange(aIdx, sIdx, 'special_requirements', e.target.value)}
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm bg-white"
                                  rows={2}
                                  placeholder="Special requirements"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
                                <div>
                                  <span className="text-slate-500">Dimensions:</span>{' '}
                                  <span className="font-medium">{surface.width_cm}cm × {surface.height_cm}cm</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Area:</span>{' '}
                                  <span className="font-medium">{surface.calculated_area_m2 || calculateAreaM2(surface.width_cm, surface.height_cm)}m²</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Type:</span>{' '}
                                  <span className="font-medium">{surface.surface_type}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Opening:</span>{' '}
                                  <span className="font-medium">{surface.opening_direction}</span>
                                </div>
                              </div>
                            )}

                            {surface.spec && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100">
                                {isEditing ? (
                                  <>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Fabric Type</label>
                                      <select
                                        value={surface.spec.fabric_type}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            fabric_type: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {fabricTypes.map((ft: any) => (
                                          <option key={ft.id} value={ft.id}>{ft.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Model</label>
                                      <select
                                        value={surface.spec.model}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            model: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {models.map((model: any) => (
                                          <option key={model.id} value={model.id}>{model.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Item</label>
                                      <select
                                        value={surface.spec.catalog_item}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            catalog_item: Number(e.target.value),
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      >
                                        {items.map((item: any) => (
                                          <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Price/m² (AED)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.unit_price_per_m2}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            unit_price_per_m2: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Control</label>
                                      <select
                                        value={surface.spec.motor_control_type}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
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
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Motor Type</label>
                                        <select
                                          value={surface.spec.motor_type || ''}
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(aIdx, sIdx, {
                                              motor_type: e.target.value ? Number(e.target.value) : null,
                                            })
                                          }
                                          className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                        >
                                          <option value="">Select</option>
                                          {motors.map((motor: any) => (
                                            <option key={motor.id} value={motor.id}>{motor.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Motor Price (AED)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.motor_price_per_unit}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            motor_price_per_unit: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={surface.spec.smart_integration}
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(aIdx, sIdx, {
                                              smart_integration: e.target.checked,
                                            })
                                          }
                                          className="rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-600">Smart Integration (Alexa)</span>
                                      </label>
                                    </div>
                                    {surface.spec.smart_integration && (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={surface.spec.alexa_quantity}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(aIdx, sIdx, {
                                                alexa_quantity: Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price (AED)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.alexa_unit_price}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(aIdx, sIdx, {
                                                alexa_unit_price: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div className="col-span-1 sm:col-span-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={surface.spec.pelmet_enabled}
                                          onChange={(e) =>
                                            handleUpdateSurfaceSpec(aIdx, sIdx, {
                                              pelmet_enabled: e.target.checked,
                                            })
                                          }
                                          className="rounded"
                                        />
                                        <span className="text-xs font-medium text-slate-600">Add Pelmet</span>
                                      </label>
                                    </div>
                                    {surface.spec.pelmet_enabled && (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Width (cm)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.pelmet_width_cm}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(aIdx, sIdx, {
                                                pelmet_width_cm: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Price/m (AED)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={surface.spec.pelmet_price_per_metre}
                                            onChange={(e) =>
                                              handleUpdateSurfaceSpec(aIdx, sIdx, {
                                                pelmet_price_per_metre: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Addon Label</label>
                                      <input
                                        type="text"
                                        value={surface.spec.addon_label || ''}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            addon_label: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Addon Amount (AED)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={surface.spec.addon_amount}
                                        onChange={(e) =>
                                          handleUpdateSurfaceSpec(aIdx, sIdx, {
                                            addon_amount: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1.5 rounded text-sm border border-slate-200"
                                      />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 bg-blue-50 p-2 rounded border border-blue-200">
                                      <p className="text-xs font-medium text-blue-700">
                                        Line Total: AED {calculateSurfaceTotal(surface.spec, surface.width_cm, surface.height_cm)}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <span className="text-slate-500">Fabric:</span>{' '}
                                      <span className="font-medium">{surface.spec.fabric_type_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Item:</span>{' '}
                                      <span className="font-medium">{surface.spec.catalog_item_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Fabric Total:</span>{' '}
                                      <span className="font-bold">AED {surface.spec.fabric_total}</span>
                                    </div>
                                    {surface.spec.motor_control_type === 'motorized' && (
                                      <div>
                                        <span className="text-slate-500">Motor Total:</span>{' '}
                                        <span className="font-bold">AED {surface.spec.motor_charge_total}</span>
                                      </div>
                                    )}
                                    {surface.spec.smart_integration && (
                                      <div>
                                        <span className="text-slate-500">Alexa:</span>{' '}
                                        <span className="font-bold">AED {surface.spec.alexa_total}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-slate-500 font-bold">Line Total:</span>{' '}
                                      <span className="font-bold text-[#2b5c8f]">AED {surface.spec.line_item_total}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => {
                            setSelectedAreaIndex(aIdx);
                            setShowAddSurfaceModal(true);
                          }}
                          className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition"
                        >
                          <Plus className="w-4 h-4" /> Add Surface
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <div className="bg-gradient-to-br from-[#2b5c8f] to-[#1f456e] rounded-2xl shadow-md p-6 text-white">
            <h2 className="text-lg font-semibold mb-6">Pricing Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/20">
                <span className="text-sm">Subtotal</span>
                <span className="font-bold">AED {quotation.subtotal || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/20">
                <span className="text-sm">Discount ({quotation.discount_percentage}%)</span>
                <span className="font-bold">-AED {quotation.discount_amount || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/20">
                <span className="text-sm">VAT (5%)</span>
                <span className="font-bold">AED {quotation.vat || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-extrabold">AED {quotation.total || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions</h2>
            {quotation.status === 'draft' && (
              <>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
                >
                  <Send className="w-4 h-4" /> Send Quotation
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
            {quotation.status === 'sent' && (
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" /> Accept Quotation
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all"
            >
              <XCircle className="w-4 h-4" /> Delete
            </button>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Info</h2>
            <div className="space-y-3 text-sm">
              {quotation.prepared_by_name && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Prepared By</p>
                  <p className="font-medium text-slate-800">{quotation.prepared_by_name}</p>
                </div>
              )}
              {quotation.sent_date && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Sent On</p>
                  <p className="font-medium text-slate-800">
                    {quotation.sent_date.split('T')[0]} via {quotation.sent_via}
                  </p>
                </div>
              )}
              {quotation.accepted_date && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Accepted On</p>
                  <p className="font-medium text-slate-800">{quotation.accepted_date.split('T')[0]}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Modal */}
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
              value={newAreaData.type}
              onChange={(e) => setNewAreaData({ ...newAreaData, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              placeholder="e.g. Living Room"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
            <input
              type="text"
              value={newAreaData.display_name}
              onChange={(e) => setNewAreaData({ ...newAreaData, display_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              placeholder="Area name"
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

      <Modal
        open={showAddSurfaceModal}
        onClose={() => {
          setShowAddSurfaceModal(false);
          setSelectedAreaIndex(null);
        }}
        title="Add Surface"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Surface Name</label>
            <input
              type="text"
              value={newSurfaceData.surface_name}
              onChange={(e) => setNewSurfaceData({ ...newSurfaceData, surface_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Surface Type</label>
              <select
                value={newSurfaceData.surface_type}
                onChange={(e) => setNewSurfaceData({ ...newSurfaceData, surface_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              >
                <option value="window">Window</option>
                <option value="door">Door</option>
                <option value="wall">Wall</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Opening Direction</label>
              <select
                value={newSurfaceData.opening_direction}
                onChange={(e) => setNewSurfaceData({ ...newSurfaceData, opening_direction: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              >
                <option value="left_to_right">Left to Right</option>
                <option value="right_to_left">Right to Left</option>
                <option value="center_open">Center Open</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Width (cm)</label>
              <input
                type="number"
                min="0"
                value={newSurfaceData.width_cm}
                onChange={(e) => setNewSurfaceData({ ...newSurfaceData, width_cm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
              <input
                type="number"
                min="0"
                value={newSurfaceData.height_cm}
                onChange={(e) => setNewSurfaceData({ ...newSurfaceData, height_cm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Special Requirements</label>
            <textarea
              rows={3}
              value={newSurfaceData.special_requirements}
              onChange={(e) => setNewSurfaceData({ ...newSurfaceData, special_requirements: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowAddSurfaceModal(false);
                setSelectedAreaIndex(null);
              }}
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

      {/* Send Modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Quotation"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">How would you like to send this quotation?</p>
          <div className="space-y-2">
            <button
              onClick={() => setSendVia('email')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                sendVia === 'email'
                  ? 'border-[#2b5c8f] bg-blue-50 text-[#2b5c8f]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setSendVia('whatsapp')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                sendVia === 'whatsapp'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              💬 WhatsApp
            </button>
            <button
              onClick={() => setSendVia('sms')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                sendVia === 'sms'
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              📱 SMS
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowSendModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendQuotation}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded-lg bg-[#2b5c8f] text-white font-medium hover:bg-[#1f456e] disabled:opacity-60"
            >
              {isProcessing ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Quotation"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete this quotation? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
