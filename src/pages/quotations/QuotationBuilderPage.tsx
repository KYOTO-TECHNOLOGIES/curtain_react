import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import {
  catalogApi,
  type FabricType,
  type CatalogModel,
  type CatalogItem,
  type MotorType,
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
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

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
    surface_type: 'window',
    width_cm: '',
    height_cm: '',
    opening_direction: 'left_to_right',
    special_requirements: '',
  });
  const [isSaving, setIsSaving] = useState(false);

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
  const selectedCustomerId = selectedAppointment?.customer?.id ?? selectedAppointmentSummary?.customer;
  const selectedCustomerName =
    selectedAppointment?.customer?.full_name || selectedAppointmentSummary?.customer_name || '';
  const selectedCustomerEmail = selectedAppointment?.customer?.email || '';
  const selectedCustomerPhone =
    selectedAppointment?.customer?.phone || selectedAppointmentSummary?.customer_phone || '';
  const selectedCustomerLocation =
    selectedAppointment?.location?.full_address ||
    selectedAppointmentSummary?.location_full_address ||
    (selectedAppointment?.location?.building_name
      ? `${selectedAppointment.location.building_name}${selectedAppointment.location.unit_number ? ` Unit ${selectedAppointment.location.unit_number}` : ''}`
      : '');
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

      if (selectedAppointmentId) {
        try {
          if (selectedAppointment?.status !== 'cancelled') {
            await appointmentsApi.update(selectedAppointmentId, { status: 'quoted' as any });
          }
        } catch (statusErr) {
          console.warn('Could not auto-update appointment status to quoted:', statusErr);
        }
      }

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
    <div className="quotation-builder-page">
      <main className="quotation-builder-content">
        <QuotationHeader title="Create New Quotation" subtitle="Configure your bespoke atelier request by defining areas, surfaces, and product specifics." />

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
                    appointments={appointments}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  />
                )}
              </div>
            </div>

            {selectedAppointmentId && (
              <CustomerSummary
                customerName={selectedCustomerName}
                customerEmail={selectedCustomerEmail}
                customerPhone={selectedCustomerPhone}
                customerLocation={selectedCustomerLocation}
                isLoading={selectedAppointmentLoading}
              />
            )}
          </div>

          <div className="qb-general-column">
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
      {selectedAppointmentId && (
        <>
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
                                  fabricTypes={fabricTypes}
                                  models={models}
                                  items={items}
                                  motors={motors}
                                  onDelete={() => handleDeleteSurface(area.tempId, surface.tempId)}
                                  onUpdateSpec={(updates) => handleUpdateSurfaceSpec(area.tempId, surface.tempId, updates)}
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
            canSave={!isSaving && !!selectedAppointmentId && !!selectedCustomerId && areas.length > 0}
            onCancel={() => navigate('/quotations')}
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
        typeOptions={[
          { value: 'window', label: 'Window' },
          { value: 'wall', label: 'Wall' },
          { value: 'door', label: 'Door' },
        ]}
        widthPlaceholder="240"
        heightPlaceholder="310"
        widthMin={0}
        heightMin={0}
      />
    </div>
  );
}
