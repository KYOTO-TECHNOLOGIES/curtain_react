import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronRight,
  Home,
  Info,
  Layers3,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { normalizeFeatures } from '../../lib/catalogHelpers';
import {
  calculateCatalogSurfaceTotal,
  resolvedChargeIds,
} from '../../lib/quotationPricing';
import { appointmentsApi } from '../../api/appointments';
import {
  catalogApi,
  type FabricType,
  type CatalogModel,
  type CatalogItem,
  type MotorType,
  type WorkType,
  type ChargeTemplate,
} from '../../api/catalog';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import { DatePicker } from '../../components/ui/DatePicker';
import { AppointmentPicker } from '../../components/quotations/AppointmentPicker';
import BuilderSurfaceCard from './components/BuilderSurfaceCard';
import {
  CustomerSummary,
  QuotationTypeCards,
  StickyActionBar,
} from './components/QuotationBuilderComponents';
import AddAreaModal from './components/AddAreaModal';
import AddSurfaceModal from './components/AddSurfaceModal';
import { useSurfaceTypes } from './hooks/useSurfaceTypes';
import QuotationHeader from './components/QuotationHeader';
import './QuotationBuilderPage.css';

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

function capitalizeDisplay(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function getValidityMessage(value: string) {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (daysRemaining < 0) return { text: 'Date has passed', variant: 'expired' };
  if (daysRemaining <= 7) return { text: `Expires in ${daysRemaining} days`, variant: 'warn' };
  return { text: `Valid for ${daysRemaining} days`, variant: 'ok' };
}

export default function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const isEditing = Boolean(editId);
  const initializedEditRef = useRef(false);

  const appointmentParam = searchParams.get('appointment') || '';
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(appointmentParam);

  useEffect(() => {
    const param = searchParams.get('appointment');
    if (param && param !== selectedAppointmentId) {
      setSelectedAppointmentId(param);
    }
  }, [searchParams]);

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
    surface_type: 'window_curtain_path',
    width_cm: '',
    height_cm: '',
    opening_direction: 'one_way',
    special_requirements: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [surfaceFieldErrors, setSurfaceFieldErrors] = useState<Record<string, Record<string, string>>>({});
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  // Fetch Data - load appointments so selected appointment is available in picker
  const { data: appointmentsRes, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  });

  const { data: selectedAppointmentRes, isLoading: selectedAppointmentLoading } = useQuery({
    queryKey: ['appointment', selectedAppointmentId],
    queryFn: () => appointmentsApi.get(selectedAppointmentId),
    enabled: !!selectedAppointmentId,
  });

  const { data: editQuotationRes, isLoading: editQuotationLoading, isError: editQuotationError } = useQuery({
    queryKey: ['quotation', editId, 'edit'],
    queryFn: () => quotationsApi.get(editId!),
    enabled: isEditing,
  });

  const { data: workTypesRes } = useQuery({
    queryKey: ['work_types'],
    queryFn: () => catalogApi.workTypes(),
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
    queryKey: ['motors', quotationSettings.work_type],
    queryFn: () => catalogApi.motors({ work_type: quotationSettings.work_type }),
    enabled: !!quotationSettings.work_type,
  });

  const { data: chargesRes } = useQuery({
    queryKey: ['charges', quotationSettings.work_type],
    queryFn: () => catalogApi.charges({ work_type: quotationSettings.work_type }),
    enabled: !!quotationSettings.work_type,
  });

  const { data: quotationsRes } = useQuery({
    queryKey: ['quotations', 'for-duplicate-check'],
    queryFn: () => quotationsApi.list(),
  });
  const surfaceTypes = useSurfaceTypes();

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const fabricTypes = toArray<FabricType>(fabricTypesRes);
  const models = toArray<CatalogModel>(modelsRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motors = toArray<MotorType>(motorsRes);
  const workTypes = toArray<WorkType>(workTypesRes);
  const includedCharges = toArray<ChargeTemplate>(chargesRes);
  const selectedWorkType = workTypes.find((workType) => workType.id === quotationSettings.work_type) || workTypes[0];
  const workTypeFeatures = selectedWorkType ? normalizeFeatures(selectedWorkType.features) : undefined;
  const availableFabricTypes = fabricTypes.filter(
    (fabricType) => Number(fabricType.work_type) === Number(selectedWorkType?.id),
  );

  useEffect(() => {
    if (workTypes.length > 0 && !workTypes.some((workType) => workType.id === quotationSettings.work_type)) {
      setQuotationSettings((current) => ({ ...current, work_type: workTypes[0].id }));
    }
  }, [workTypes, quotationSettings.work_type]);

  useEffect(() => {
    const quotation = editQuotationRes?.data;
    if (!quotation || initializedEditRef.current) return;
    initializedEditRef.current = true;
    setSelectedAppointmentId(String(quotation.appointment_id ?? quotation.appointment ?? ''));
    setQuotationSettings({
      quote_type: quotation.quote_type,
      work_type: Number(quotation.work_type),
      valid_until: quotation.valid_until.slice(0, 10),
      discount_percentage: Number(quotation.discount_percentage) || 0,
    });
    setAreas((quotation.areas || []).map((area, areaIndex) => ({
      tempId: String(area.id ?? `edit-area-${areaIndex}`),
      area_type: area.area_type,
      display_name: area.display_name,
      sort_order: area.sort_order ?? areaIndex,
      surfaces: (area.surfaces || []).map((surface, surfaceIndex) => ({
        tempId: String(surface.id ?? `edit-surface-${areaIndex}-${surfaceIndex}`),
        surface_name: surface.surface_name,
        surface_type: surface.surface_type,
        width_cm: Number(surface.width_cm) || 0,
        height_cm: Number(surface.height_cm) || 0,
        opening_direction: surface.opening_direction || 'one_way',
        special_requirements: surface.special_requirements || '',
        sort_order: surface.sort_order ?? surfaceIndex,
        spec: { ...surface.spec },
      })),
    })));
  }, [editQuotationRes]);

  const quotedAppointmentIds = useMemo(() => {
    const ids = new Set<string>();
    toArray<any>(quotationsRes).forEach((q) => {
      if (editId && String(q?.id) === String(editId)) return;
      if (q?.status === 'cancelled') return;
      const apptId = q?.appointment_id ?? q?.appointment;
      if (apptId !== undefined && apptId !== null && apptId !== '') ids.add(String(apptId));
    });
    return ids;
  }, [quotationsRes, editId]);
  const isAppointmentQuoted = (a?: { id: number | string; status?: string; has_quotation?: boolean; quotation_id?: number | string | null } | null) =>
    !!a && (!!a.has_quotation || !!a.quotation_id || a.status === 'quoted' || quotedAppointmentIds.has(String(a.id)));

  const fetchedAppointments: AppointmentListItem[] = toArray<AppointmentListItem>(appointmentsRes);
  const selectedAppointment: AppointmentDetail | null = selectedAppointmentRes?.data || null;

  const appointments: AppointmentListItem[] = useMemo(() => {
    if (!selectedAppointment) return fetchedAppointments;
    const exists = fetchedAppointments.some((a) => String(a.id) === String(selectedAppointment.id));
    if (exists) return fetchedAppointments;
    const synthItem: AppointmentListItem = {
      id: selectedAppointment.id,
      customer: selectedAppointment.customer?.id ?? 0,
      customer_name: selectedAppointment.customer?.full_name || `${selectedAppointment.customer?.first_name || ''} ${selectedAppointment.customer?.last_name || ''}`.trim(),
      customer_phone: selectedAppointment.customer?.phone || '',
      title: selectedAppointment.title,
      description: selectedAppointment.description,
      appointment_date: selectedAppointment.appointment_date,
      appointment_time: selectedAppointment.appointment_time,
      end_time: selectedAppointment.end_time,
      job_type: selectedAppointment.job_type,
      status: selectedAppointment.status,
      assigned_to: selectedAppointment.assigned_to,
      assigned_to_name: selectedAppointment.assignee_name || selectedAppointment.assigned_to_name,
      assigned_to_username: selectedAppointment.assignee_username || selectedAppointment.assigned_to_username,
      location_building: selectedAppointment.location?.building_name || '',
      location_unit: selectedAppointment.location?.unit_number || '',
      location_full_address: selectedAppointment.location?.full_address || '',
      created_at: selectedAppointment.created_at,
      updated_at: selectedAppointment.updated_at,
    };
    return [synthItem, ...fetchedAppointments];
  }, [fetchedAppointments, selectedAppointment]);

  const selectedAppointmentSummary = appointments.find(
    (appointment) => String(appointment.id) === selectedAppointmentId
  );
  const selectableAppointments = appointments.filter(
    (appointment) => appointment.status !== 'cancelled' && !isAppointmentQuoted(appointment)
  );
  const selectedAlreadyQuoted = !isEditing &&
    !!selectedAppointmentId && (isAppointmentQuoted(selectedAppointment) || isAppointmentQuoted(selectedAppointmentSummary));
  const pickerAppointments = appointments.filter(
    (appointment) => String(appointment.id) === selectedAppointmentId || selectableAppointments.includes(appointment)
  );
  const editQuotation = editQuotationRes?.data;
  const selectedCustomerId = selectedAppointment?.customer?.id ?? selectedAppointmentSummary?.customer ?? editQuotation?.customer;
  const selectedCustomerName =
    selectedAppointment?.customer?.full_name || selectedAppointmentSummary?.customer_name || editQuotation?.customer_name || '';
  const selectedCustomerEmail = selectedAppointment?.customer?.email || editQuotation?.customer_email || '';
  const selectedCustomerPhone =
    selectedAppointment?.customer?.phone || selectedAppointmentSummary?.customer_phone || editQuotation?.customer_phone || '';
  const validityMessage = getValidityMessage(quotationSettings.valid_until);
  const surfaceCount = areas.reduce((count, area) => count + area.surfaces.length, 0);

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

    const defaultFabricId = availableFabricTypes[0]?.id || 0;
    const defaultModels = models.filter(
      (m: any) => Number(m.fabric_type?.id ?? m.fabric_type ?? m.fabric_type_id ?? 0) === Number(defaultFabricId)
    );
    const defaultModelId = defaultModels[0]?.id || 0;
    const defaultItems = items.filter(
      (i: any) => Number(i.model?.id ?? i.model ?? i.model_id ?? 0) === Number(defaultModelId)
    );
    const defaultItem = defaultItems[0] as any;
    const defaultControlCharge = includedCharges.find((charge) => charge.kind === 'manual');
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
        fabric_type: defaultFabricId,
        model: defaultModelId,
        catalog_item: defaultItem?.id || 0,
        fabric_code: defaultItem?.code || '',
        unit_price_per_m2: defaultItem?.price_per_unit || defaultItem?.unit_price_per_m2 || '0',
        motor_control_type: 'manual',
        motor_type: null,
        motor_price_per_unit: '0',
        selected_charge_ids: defaultControlCharge ? [defaultControlCharge.id] : [],
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
      surface_type: 'window_curtain_path',
      width_cm: '',
      height_cm: '',
      opening_direction: 'one_way',
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

  const handleUpdateSurface = (
    areaId: string,
    surfaceId: string,
    updates: Partial<BuilderSurface>
  ) => {
    setAreas(
      areas.map((a) =>
        a.tempId === areaId
          ? {
            ...a,
            surfaces: a.surfaces.map((s) =>
              s.tempId === surfaceId
                ? { ...s, ...updates }
                : s
            ),
          }
          : a
      )
    );
  };

  const handleSaveQuotation = async () => {
    if (!selectedAppointmentId && !isEditing) {
      showToast('Please select an appointment', 'error');
      return;
    }

    if (selectedAlreadyQuoted) {
      showToast('A quotation already exists for this appointment', 'error');
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
    setSurfaceFieldErrors({});
    setConfigurationError(null);
    try {
      const payload = {
        customer: selectedCustomerId,
        appointment: selectedAppointment?.id ?? (selectedAppointmentId || editQuotation?.appointment || null),
        status: editQuotation?.status ?? 'draft',
        quote_type: quotationSettings.quote_type,
        work_type: quotationSettings.work_type,
        valid_until: quotationSettings.valid_until,
        discount_percentage: quotationSettings.discount_percentage,
        areas_data: areas.map((area) => ({
          area_type: area.area_type,
          display_name: area.display_name,
          sort_order: area.sort_order,
          surfaces: area.surfaces.map((surface) => {
            const spec = { ...surface.spec };
            const selectedItem = items.find((item) => item.id === Number(spec.catalog_item));
            const selectedMotor = motors.find((motor) => motor.id === Number(spec.motor_type));
            spec.unit_price_per_m2 = selectedItem?.price_per_unit ?? spec.unit_price_per_m2;
            spec.fabric_code = selectedItem?.name ?? spec.fabric_code;
            spec.motor_price_per_unit = selectedMotor?.price_per_m2 ?? 0;
            spec.selected_charge_ids = resolvedChargeIds(spec, includedCharges);
            if (spec.motor_control_type !== 'motorized') {
              spec.motor_type = null;
              spec.motor_price_per_unit = 0;
              spec.smart_integration = false;
              spec.alexa_quantity = 0;
            }
            const selectedCharges = resolvedChargeIds(spec, includedCharges)
              .map((chargeId) => includedCharges.find((charge) => charge.id === chargeId))
              .filter((charge): charge is ChargeTemplate => Boolean(charge));
            spec.alexa_unit_price = selectedCharges.find((charge) => charge.kind === 'alexa')?.price ?? 0;
            spec.pelmet_price_per_metre = selectedCharges.find((charge) => charge.kind === 'pelmet')?.price ?? 0;
            const extras = selectedCharges.filter((charge) => charge.kind === 'other');
            spec.addon_label = extras.map((charge) => charge.name).join(', ');
            spec.addon_amount = 0;
            return {
              surface_name: surface.surface_name,
              surface_type: surface.surface_type,
              width_cm: surface.width_cm,
              height_cm: surface.height_cm,
              opening_direction: surface.opening_direction || 'one_way',
              special_requirements: surface.special_requirements,
              sort_order: surface.sort_order,
              spec,
            };
          }),
        })),
      };

      const res = isEditing && editId
        ? await quotationsApi.update(editId, payload)
        : await quotationsApi.create(payload);

      if (!isEditing && selectedAppointmentId) {
        try {
          if (selectedAppointment?.status !== 'cancelled') {
            await appointmentsApi.update(selectedAppointmentId, { status: 'quoted' as any });
          }
        } catch (statusErr) {
          console.warn('Could not auto-update appointment status to quoted:', statusErr);
        }
      }

      showToast(isEditing ? 'Quotation updated successfully' : 'Quotation created successfully', 'success');
      navigate(`/quotations/${res.data.id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      const mappedSurfaceErrors: Record<string, Record<string, string>> = {};
      let unmappedError = '';

      if (data && typeof data === 'object') {
        if (Array.isArray(data.areas_data)) {
          data.areas_data.forEach((areaErr: any, aIdx: number) => {
            if (areaErr?.surfaces && Array.isArray(areaErr.surfaces)) {
              const areaObj = areas[aIdx];
              areaErr.surfaces.forEach((surfErr: any, sIdx: number) => {
                const surfaceObj = areaObj?.surfaces?.[sIdx];
                if (surfaceObj && surfErr) {
                  const errorsForSurface: Record<string, string> = {};
                  if (surfErr.opening_direction) {
                    errorsForSurface.opening_direction = Array.isArray(surfErr.opening_direction) ? surfErr.opening_direction.join(' ') : String(surfErr.opening_direction);
                  }
                  if (surfErr.spec && typeof surfErr.spec === 'object') {
                    Object.entries(surfErr.spec).forEach(([k, v]) => {
                      errorsForSurface[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
                    });
                  }
                  mappedSurfaceErrors[surfaceObj.tempId] = errorsForSurface;
                }
              });
            }
          });
        }

        if (data.detail) {
          unmappedError = String(data.detail);
        } else if (data.non_field_errors) {
          unmappedError = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : String(data.non_field_errors);
        } else if (Object.keys(mappedSurfaceErrors).length === 0) {
          unmappedError = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else {
        unmappedError = err?.message || 'Failed to create quotation';
      }

      setSurfaceFieldErrors(mappedSurfaceErrors);
      setConfigurationError(unmappedError || null);
      showToast(unmappedError || 'Validation error on one or more surfaces. Please review the highlighted fields.', 'error');
      console.error('Quotation save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSurfaceTotal = (spec: SurfaceSpec, widthCm: number, heightCm: number) => {
    return calculateCatalogSurfaceTotal(
      spec,
      widthCm,
      heightCm,
      selectedWorkType?.pricing_unit,
      includedCharges,
    ).toFixed(2);
  };

  if (isEditing && editQuotationError) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-600 mb-4">Could not load this quotation for editing.</p>
        <button
          type="button"
          onClick={() => navigate(`/quotations/${editId}`)}
          className="px-4 py-2 rounded-xl bg-[#2F5D8F] text-white text-sm font-semibold"
        >
          Back to quotation
        </button>
      </div>
    );
  }

  if (isEditing && (editQuotationLoading || !initializedEditRef.current)) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f]" />
      </div>
    );
  }

  return (
    <div className="quotation-builder-page">
      <main className="quotation-builder-content">
        <QuotationHeader
          title={isEditing ? `Edit Quotation ${editId}` : 'Create New Quotation'}
          subtitle="Configure your bespoke atelier request by defining areas, surfaces, and product specifics."
        />

      <section className="qb-card qb-general-card">
        <header className="qb-card-header">
          <span className="qb-card-icon qb-card-icon--brand"><Info size={18} /></span>
          <div className="qb-card-heading">
            <h2>General Information</h2>
          </div>
        </header>

        <div className="qb-general-grid">
          <div className="qb-general-column">
            <div className="qb-field">
              <div className="relative">
                {appointmentsLoading ? (
                  <div className="qb-appointment-loading flex items-center justify-center py-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5442f6]" />
                  </div>
                ) : (
                  <AppointmentPicker
                    id="quotation-appointment"
                    value={selectedAppointmentId}
                    appointments={pickerAppointments}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  />
                )}
              </div>
            </div>

            {selectedAlreadyQuoted && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2" role="alert">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>A quotation already exists for this appointment. Choose a different appointment.</span>
              </div>
            )}

            {selectedAppointmentId && (
              <CustomerSummary
                customerName={selectedCustomerName}
                customerEmail={selectedCustomerEmail}
                customerPhone={selectedCustomerPhone}
                isLoading={selectedAppointmentLoading}
              />
            )}
          </div>

          <div className="qb-general-column">
            <div className="qb-field">
              <label id="quotation-work-type-label" className="qb-field-label block text-[15px] font-bold text-slate-700 mb-2">
                Work Type
              </label>
              <SelectMenu
                id="quotation-work-type"
                value={String(selectedWorkType?.id || quotationSettings.work_type)}
                options={workTypes.map((wt) => ({
                  value: String(wt.id),
                  label: wt.name,
                  suffix: `#${wt.id}`,
                }))}
                onChange={(val) => {
                  setQuotationSettings({ ...quotationSettings, work_type: Number(val) });
                  setAreas((currentAreas) => currentAreas.map((area) => ({
                    ...area,
                    surfaces: area.surfaces.map((surface) => ({
                      ...surface,
                      spec: {
                        ...surface.spec,
                        fabric_type: 0,
                        model: 0,
                        catalog_item: 0,
                        unit_price_per_m2: 0,
                        motor_type: null,
                        motor_price_per_unit: 0,
                        selected_charge_ids: [],
                        smart_integration: false,
                        alexa_quantity: 0,
                        alexa_unit_price: 0,
                        pelmet_enabled: false,
                        pelmet_width_cm: 0,
                        pelmet_price_per_metre: 0,
                        addon_label: '',
                        addon_amount: 0,
                      },
                    })),
                  })));
                  setSurfaceFieldErrors({});
                  setConfigurationError(null);
                }}
                ariaLabel="Work Type"
                ariaLabelledBy="quotation-work-type-label"
              />
            </div>
            <div className="qb-field">
              <span className="qb-field-label block text-[15px] font-bold text-slate-700 mb-2">Quotation Type</span>
              <QuotationTypeCards
                value={quotationSettings.quote_type}
                onChange={(quote_type) => setQuotationSettings({ ...quotationSettings, quote_type })}
              />
            </div>

            <div className="qb-date-discount-grid">
              <div className="qb-field">
                <label htmlFor="quotation-valid-until" className="qb-field-label block text-[15px] font-bold text-slate-700 mb-2">
                  Valid Until <span className="text-[#ef4444]">*</span>
                </label>
                <DatePicker
                  id="quotation-valid-until"
                  value={quotationSettings.valid_until}
                  onChange={(event) => setQuotationSettings({ ...quotationSettings, valid_until: event.target.value })}
                  className="w-full"
                />
                {validityMessage && (
                  <p className={`qb-validity-hint is-${validityMessage.variant}`}>
                    <CalendarDays size={14} aria-hidden="true" />
                    {validityMessage.text}
                  </p>
                )}
              </div>
              <div className="qb-field">
                <label htmlFor="quotation-discount" className="qb-field-label qb-field-label--optional block text-[15px] font-bold text-slate-700 mb-2">
                  <span>Discount (%)</span>
                  <span className="qb-optional-tag">Optional</span>
                </label>
                <div className="qb-discount-control">
                  <input
                    id="quotation-discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    autoComplete="off"
                    value={quotationSettings.discount_percentage}
                    onChange={(e) => setQuotationSettings({ ...quotationSettings, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#5442f6] focus:ring-2 focus:ring-[#5442f6]/20 transition-all font-medium text-slate-700"
                  />
                  <span className="qb-discount-suffix">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Areas and Surfaces */}
      {(selectedAppointmentId || isEditing) && (
        <>
          {configurationError && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block font-semibold">Quotation Validation Failed</strong>
                  <span>{configurationError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigurationError(null)}
                className="text-rose-400 hover:text-rose-600 p-1"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <section className="qb-card qb-configuration-card qbc-configuration">
            <header className="qbc-configuration-header">
              <span className="qbc-configuration-icon"><Layers3 size={18} aria-hidden="true" /></span>
              <div className="qbc-configuration-heading">
                <h2>Configuration</h2>
                <p>Define the areas and surfaces for this quotation</p>
              </div>
              <div className="qbc-configuration-tools">
                <span className="qbc-count-chip">
                  {areas.length} {areas.length === 1 ? 'area' : 'areas'} · {surfaceCount} {surfaceCount === 1 ? 'surface' : 'surfaces'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAreaModal(true)}
                  className="qbc-add-area-button"
                >
                  <Plus size={17} aria-hidden="true" />
                  <span>Add New Area</span>
                </button>
              </div>
            </header>

            {areas.length === 0 ? (
              <div className="qbc-empty-areas">
                <span className="qbc-empty-icon"><Home size={19} aria-hidden="true" /></span>
                <span className="qbc-empty-title">No areas added yet</span>
                <span className="qbc-empty-hint">Add an area to get started.</span>
              </div>
            ) : (
              <div className="qbc-area-list">
                {areas.map((area) => {
                  const isAreaExpanded = expandedAreaId === area.tempId;
                  const areaTitle = capitalizeDisplay(area.display_name);
                  return (
                    <article key={area.tempId} className="qbc-area-card">
                      <header className="qbc-area-header">
                        <button
                          type="button"
                          onClick={() => setExpandedAreaId(isAreaExpanded ? null : area.tempId)}
                          className="qbc-area-toggle"
                          aria-expanded={isAreaExpanded}
                          aria-controls={`area-panel-${area.tempId}`}
                          aria-label={`${isAreaExpanded ? 'Collapse' : 'Expand'} ${areaTitle}`}
                        >
                          <span className="qbc-area-icon"><Layers3 size={19} aria-hidden="true" /></span>
                          <span className="qbc-area-title" title={areaTitle}>{areaTitle}</span>
                          <span className="qbc-area-surface-count">
                            {area.surfaces.length} {area.surfaces.length === 1 ? 'surface' : 'surfaces'}
                          </span>
                          <ChevronRight className={`qbc-area-chevron${isAreaExpanded ? ' is-open' : ''}`} aria-hidden="true" />
                        </button>
                        <div className="qbc-area-actions">
                          <div className="qbc-area-type-field">
                            <Home size={16} aria-hidden="true" />
                            <select
                              value={area.area_type}
                              onChange={(event) => {
                                const newAreas = [...areas];
                                const index = newAreas.findIndex((item) => item.tempId === area.tempId);
                                if (index !== -1) newAreas[index].area_type = event.target.value;
                                setAreas(newAreas);
                              }}
                              aria-label={`Area type for ${areaTitle}`}
                            >
                              <option value={area.area_type}>{area.area_type}</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteArea(area.tempId)}
                            className="qbc-delete-button qbc-delete-button--area"
                            aria-label={`Remove area ${areaTitle}`}
                            title="Remove area"
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </header>
                      <div
                        id={`area-panel-${area.tempId}`}
                        className={`qbc-area-panel${isAreaExpanded ? ' is-expanded' : ''}`}
                        aria-hidden={!isAreaExpanded}
                        inert={!isAreaExpanded}
                      >
                        <div className="qbc-area-panel-inner">
                          {area.surfaces.length === 0 ? (
                            <div className="qbc-empty-surfaces">
                              <span className="qbc-empty-icon"><Layers3 size={18} aria-hidden="true" /></span>
                              <span className="qbc-empty-title">No surfaces yet</span>
                              <span className="qbc-empty-hint">Add a surface to configure this area.</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAreaForSurface(area.tempId);
                                  setShowAddSurfaceModal(true);
                                }}
                                className="qbc-add-surface-button"
                              >
                                <Plus size={16} aria-hidden="true" /> Add Surface
                              </button>
                            </div>
                          ) : (
                            <div className="qbc-surface-list">
                              {area.surfaces.map((surface) => (
                                <BuilderSurfaceCard
                                  key={surface.tempId}
                                  surface={surface}
                                  fabricTypes={availableFabricTypes}
                                  models={models}
                                  items={items}
                                  motors={motors}
                                  features={workTypeFeatures}
                                  workTypeName={selectedWorkType?.name}
                                  pricingUnit={selectedWorkType?.pricing_unit}
                                  charges={includedCharges}
                                  fieldErrors={surfaceFieldErrors[surface.tempId]}
                                  onDelete={() => handleDeleteSurface(area.tempId, surface.tempId)}
                                  onUpdateSpec={(updates) => handleUpdateSurfaceSpec(area.tempId, surface.tempId, updates)}
                                  onUpdateSurface={(updates) => handleUpdateSurface(area.tempId, surface.tempId, updates)}
                                  calculateTotal={calculateSurfaceTotal}
                                />
                              ))}
                            </div>
                          )}
                          {area.surfaces.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAreaForSurface(area.tempId);
                                setShowAddSurfaceModal(true);
                              }}
                              className="qbc-add-surface-button"
                            >
                              <Plus size={16} aria-hidden="true" /> Add Surface
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Save Button */}
          <StickyActionBar
            isSaving={isSaving}
            canSave={!isSaving && !selectedAlreadyQuoted && (!!selectedAppointmentId || isEditing) && !!selectedCustomerId && areas.length > 0}
            onCancel={() => navigate(isEditing && editId ? `/quotations/${editId}` : '/quotations')}
            onSave={handleSaveQuotation}
          />
        </>
      )}

      </main>

      {/* Add Area Modal */}
      <AddAreaModal
        open={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        onAdd={handleAddArea}
        areaType={newAreaData.type}
        areaName={newAreaData.display_name}
        onAreaTypeChange={(type) => setNewAreaData({ ...newAreaData, type })}
        onAreaNameChange={(display_name) => setNewAreaData({ ...newAreaData, display_name })}
        areaTypePlaceholder="e.g., Master Bedroom"
        areaNamePlaceholder="e.g., Windows"
      />

      {/* Add Surface Modal */}
      <AddSurfaceModal
        open={showAddSurfaceModal}
        onClose={() => setShowAddSurfaceModal(false)}
        onAdd={handleAddSurface}
        name={newSurfaceData.surface_name}
        type={newSurfaceData.surface_type}
        width={newSurfaceData.width_cm}
        height={newSurfaceData.height_cm}
        onNameChange={(surface_name) => setNewSurfaceData({ ...newSurfaceData, surface_name })}
        onTypeChange={(surface_type) => setNewSurfaceData({ ...newSurfaceData, surface_type })}
        onWidthChange={(width_cm) => setNewSurfaceData({ ...newSurfaceData, width_cm })}
        onHeightChange={(height_cm) => setNewSurfaceData({ ...newSurfaceData, height_cm })}
        typeOptions={surfaceTypes.options}
        widthPlaceholder="240"
        heightPlaceholder="310"
        widthMin={0}
        heightMin={0}
      />
    </div>
  );
}
