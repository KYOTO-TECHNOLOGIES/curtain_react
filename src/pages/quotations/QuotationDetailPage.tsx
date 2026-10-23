import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, User, Tag, Info } from 'lucide-react';
import './quotationDetail.css';
import DetailHeader from './components/DetailHeader';
import StatusStrip from './components/StatusStrip';
import AreaAccordion from './components/AreaAccordion';
import PricingSummary from './components/PricingSummary';
import ActionsCard from './components/ActionsCard';
import Timeline from './components/Timeline';
import InfoCard from './components/InfoCard';
import KeyValue from './components/KeyValue';
import { getInitials, formatMoney, formatDate } from './components/helpers';
import {
  catalogApi,
  type FabricType,
  type CatalogModel,
  type CatalogItem,
  type MotorType,
} from '../../api/catalog';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import AddAreaModal from './components/AddAreaModal';
import AddSurfaceModal from './components/AddSurfaceModal';
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

  const workTypeId = res?.data?.work_type;



  const { data: motorsRes } = useQuery({
    queryKey: ['motors', workTypeId],
    queryFn: () => catalogApi.motors(workTypeId ? { work_type: workTypeId } : undefined),
    enabled: !!workTypeId,
  });

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const quotation: QuotationDetail | null = res?.data || null;
  const fabricTypes = toArray<FabricType>(fabricTypesRes);
  const models = toArray<CatalogModel>(modelsRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motors = toArray<MotorType>(motorsRes);

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
    <div className="qd-page">
      <DetailHeader
        id={quotation.id}
        customer={quotation.customer_name}
        project={quotation.work_type_name}
        onBack={() => navigate('/quotations')}
        onEdit={() => setIsEditing(true)}
        isEditing={isEditing}
        onSave={handleSave}
        onCancelEdit={() => setIsEditing(false)}
        isSaving={isSaving}
      />

      <StatusStrip
        status={quotation.status}
        typeLabel={quotation.quote_type === 'b2c' ? 'B2C (Retail)' : 'B2B (Business)'}
        validUntil={quotation.valid_until}
        created={quotation.created_at}
      />

      {/* Main Content */}
      <div className="qd-grid mt-6">
        {/* Left Column */}
        <div className="qd-main">
          {/* Customer Section */}
          <InfoCard
            title="Customer Information"
            icon={<User />}
            iconVariant="brand"
            className="qd-stagger qd-stagger-2"
          >
            <div className="qd-identity">
              <div className="qd-avatar" aria-hidden="true">
                {getInitials(quotation.customer_name)}
              </div>
              <div>
                <div className="qd-avatar-name">{quotation.customer_name}</div>
                <div className="qd-avatar-sub">
                  {quotation.quote_type === 'b2c' ? 'Retail Client' : 'Business Client'}
                </div>
              </div>
            </div>

            <div className="qd-kv-grid">
              <KeyValue
                label="Full Name"
                value={quotation.customer_name}
                copyable
              />
              <KeyValue
                label="Email Address"
                value={quotation.customer_email || '—'}
                href={quotation.customer_email ? `mailto:${quotation.customer_email}` : undefined}
                copyable={Boolean(quotation.customer_email)}
              />
              <KeyValue
                label="Phone Number"
                value={quotation.customer_phone || '—'}
                href={quotation.customer_phone ? `tel:${quotation.customer_phone}` : undefined}
                copyable={Boolean(quotation.customer_phone)}
              />
              <KeyValue
                label="Appointment ID"
                value={quotation.appointment_id ? `#${quotation.appointment_id}` : '—'}
                copyable={Boolean(quotation.appointment_id)}
                copyValue={quotation.appointment_id ? String(quotation.appointment_id) : undefined}
              />
            </div>
          </InfoCard>

          {/* Discount Section */}
          <InfoCard
            title="Discount & Details"
            icon={<Tag />}
            iconVariant="amber"
            className="qd-stagger qd-stagger-3"
          >
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Discount Percentage (%)
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2F5D8F]/20 text-sm font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="qd-stat-tiles">
                <div className="qd-stat-tile">
                  <div className="qd-stat-tile-label">
                    <Tag />
                    <span>Discount Rate</span>
                  </div>
                  <div
                    className={`qd-stat-tile-value ${
                      Number(quotation.discount_percentage || 0) === 0
                        ? 'qd-stat-tile-value--zero'
                        : 'qd-stat-tile-value--emerald'
                    }`}
                  >
                    {quotation.discount_percentage || 0}%
                  </div>
                </div>

                <div className="qd-stat-tile">
                  <div className="qd-stat-tile-label">
                    <span>Discount Amount</span>
                  </div>
                  <div
                    className={`qd-stat-tile-value ${
                      Number(quotation.discount_amount || 0) === 0
                        ? 'qd-stat-tile-value--zero'
                        : 'qd-stat-tile-value--emerald'
                    }`}
                  >
                    AED {formatMoney(quotation.discount_amount)}
                  </div>
                </div>
              </div>
            )}
          </InfoCard>

          {/* Areas & Surfaces Accordion */}
          <div className="qd-stagger qd-stagger-4">
            <AreaAccordion
              areas={displayAreas}
              isEditing={isEditing}
              onAddArea={() => setShowAddAreaModal(true)}
              onAddSurface={(areaIndex) => {
                setSelectedAreaIndex(areaIndex);
                setShowAddSurfaceModal(true);
              }}
              onDeleteArea={handleDeleteArea}
              onDeleteSurface={handleDeleteSurface}
              onChangeArea={handleAreaChange}
              onChangeSurface={handleSurfaceChange}
              onUpdateSpec={handleUpdateSurfaceSpec}
              fabricTypes={fabricTypes}
              models={models}
              items={items}
              motors={motors}
            />
          </div>
        </div>

        {/* Right Column - Summary, Actions, Timeline, Additional Info */}
        <div className="qd-aside">
          <PricingSummary quotation={quotation} />

          <ActionsCard
            quotation={quotation}
            onSend={() => setShowSendModal(true)}
            onCancel={handleCancel}
            onAccept={handleAccept}
            onDelete={() => setShowDeleteConfirm(true)}
            isProcessing={isProcessing}
          />

          <Timeline quotation={quotation} />

          <InfoCard
            title="Additional Info"
            icon={<Info />}
            iconVariant="slate"
            className="qd-stagger qd-stagger-5"
          >
            <div className="space-y-3.5">
              <KeyValue
                label="Prepared By"
                value={quotation.prepared_by_name || 'System'}
              />
              {quotation.sent_date && (
                <KeyValue
                  label="Sent On"
                  value={`${formatDate(quotation.sent_date)} via ${quotation.sent_via || 'email'}`}
                />
              )}
              {quotation.accepted_date && (
                <KeyValue
                  label="Accepted On"
                  value={formatDate(quotation.accepted_date)}
                />
              )}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Send Modal */}
      <AddAreaModal
        open={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        onAdd={handleAddArea}
        areaType={newAreaData.type}
        areaName={newAreaData.display_name}
        onAreaTypeChange={(type) => setNewAreaData({ ...newAreaData, type })}
        onAreaNameChange={(display_name) => setNewAreaData({ ...newAreaData, display_name })}
        areaTypePlaceholder="e.g. Living Room"
        areaNamePlaceholder="Area name"
      />

      <AddSurfaceModal
        open={showAddSurfaceModal}
        onClose={() => {
          setShowAddSurfaceModal(false);
          setSelectedAreaIndex(null);
        }}
        onAdd={handleAddSurface}
        name={newSurfaceData.surface_name}
        type={newSurfaceData.surface_type}
        width={newSurfaceData.width_cm}
        height={newSurfaceData.height_cm}
        nameLabel="Surface Name"
        typeLabel="Surface Type"
        onNameChange={(surface_name) => setNewSurfaceData({ ...newSurfaceData, surface_name })}
        onTypeChange={(surface_type) => setNewSurfaceData({ ...newSurfaceData, surface_type })}
        onWidthChange={(width_cm) => setNewSurfaceData({ ...newSurfaceData, width_cm })}
        onHeightChange={(height_cm) => setNewSurfaceData({ ...newSurfaceData, height_cm })}
        typeOptions={[
          { value: 'window', label: 'Window' },
          { value: 'door', label: 'Door' },
          { value: 'wall', label: 'Wall' },
          { value: 'other', label: 'Other' },
        ]}
        openingDirection={newSurfaceData.opening_direction}
        onOpeningDirectionChange={(opening_direction) => setNewSurfaceData({ ...newSurfaceData, opening_direction })}
        openingDirectionOptions={[
          { value: 'left_to_right', label: 'Left to Right' },
          { value: 'right_to_left', label: 'Right to Left' },
          { value: 'center_open', label: 'Center Open' },
          { value: 'fixed', label: 'Fixed' },
        ]}
        specialRequirements={newSurfaceData.special_requirements}
        onSpecialRequirementsChange={(special_requirements) => setNewSurfaceData({ ...newSurfaceData, special_requirements })}
        widthMin={0}
        heightMin={0}
      />

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
