import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Edit2,
  DollarSign,
  Package,
  Layers,
  Zap,
  Grid3X3,
  FileText,
  Tags,
  Search,
  SearchX,
  X,
  Tag,
  Lock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  catalogApi,
  type WorkType,
  type FabricType,
  type CatalogModel,
  type CatalogItem,
  type MotorType,
  type ChargeTemplate,
  type ChargeKind,
} from '../../api/catalog';
import {
  FEATURE_METAS,
  type FeatureKey,
  type FeatureFlags,
  normalizeFeatures,
  isChargeEligible,
  formatChargeUnit,
  normalizeChargeUnit,
  KIND_METAS,
  CHARGE_KINDS,
  formatMoney,
  buildWorkTypePatch,
} from '../../lib/catalogHelpers';
import { useToast } from '../../components/ui/Toast';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { FormInput } from '../../components/ui/FormInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SelectMenu, type SelectOption } from '../../components/ui/SelectMenu';
import './CatalogPage.css';

type TabType = 'work-types' | 'fabric-types' | 'models' | 'items' | 'motors' | 'charges';
const catalogTabs: TabType[] = ['work-types', 'fabric-types', 'models', 'items', 'motors', 'charges'];

const nameColors = ['#2F5D8F', '#10B981', '#F97316', '#8B5CF6', '#F59E0B', '#14B8A6', '#6366F1', '#EC4899'];
const stableNameColor = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return nameColors[Math.abs(hash) % nameColors.length];
};

const formatColumnLabel = (column: string) =>
  column.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

export default function CatalogPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Charges Tab Server-Side Filters
  const [chargeKindFilter, setChargeKindFilter] = useState<string>('all');
  const [chargeUnitFilter, setChargeUnitFilter] = useState<string>('all');

  // Work Type Modal State
  const [workTypeFeatures, setWorkTypeFeatures] = useState<FeatureFlags>({
    motor: false,
    charges: false,
    images: false,
    draw: false,
    pelmet: false,
  });
  const [workTypeMotorIds, setWorkTypeMotorIds] = useState<number[]>([]);
  const [workTypeChargeIds, setWorkTypeChargeIds] = useState<number[]>([]);
  const [motorSearchQuery, setMotorSearchQuery] = useState('');
  const [chargeSearchQuery, setChargeSearchQuery] = useState('');
  const [workTypeWarning, setWorkTypeWarning] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<any>({});
  const initialValuesRef = useRef<Record<string, unknown> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<TabType, HTMLButtonElement>>>({});
  const [tabThumb, setTabThumb] = useState({ left: 0, width: 0 });
  const [tabDirection, setTabDirection] = useState(1);
  const [tabEdges, setTabEdges] = useState({ left: false, right: false });
  const [focusedTab, setFocusedTab] = useState<TabType>('items');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data: workTypesRes, refetch: refetchWorkTypes, isLoading: workTypesLoading } = useQuery({
    queryKey: ['work-types', debouncedSearch],
    queryFn: () => catalogApi.workTypes(),
  });

  const { data: fabricTypesRes, refetch: refetchFabricTypes, isLoading: fabricTypesLoading } = useQuery({
    queryKey: ['fabric-types', debouncedSearch],
    queryFn: () => catalogApi.fabricTypes(),
  });

  const { data: modelsRes, refetch: refetchModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['models', debouncedSearch],
    queryFn: () => catalogApi.models(),
  });

  const { data: itemsRes, refetch: refetchItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: () => catalogApi.items(),
  });

  const { data: motorsRes, refetch: refetchMotors, isLoading: motorsLoading } = useQuery({
    queryKey: ['motors', debouncedSearch],
    queryFn: () => catalogApi.motors(),
  });

  // Global charges query (with server filters if on charges tab)
  const { data: chargesRes, refetch: refetchCharges, isLoading: chargesLoading } = useQuery({
    queryKey: ['charges', debouncedSearch, chargeKindFilter, chargeUnitFilter, activeTab],
    queryFn: () => {
      const params: { search?: string; kind?: string; unit?: string } = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (activeTab === 'charges') {
        if (chargeKindFilter !== 'all') params.kind = chargeKindFilter;
        if (chargeUnitFilter !== 'all') params.unit = chargeUnitFilter;
      }
      return catalogApi.charges(params);
    },
  });

  // Unfiltered global charges for work type modal checklist resolution
  const { data: allChargesRes } = useQuery({
    queryKey: ['all-charges'],
    queryFn: () => catalogApi.charges(),
  });

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const rawWorkTypes = toArray<WorkType>(workTypesRes);
  const fabricTypes = toArray<FabricType>(fabricTypesRes);
  const models = toArray<CatalogModel>(modelsRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motors = toArray<MotorType>(motorsRes);
  const charges = toArray<ChargeTemplate>(chargesRes);
  const allCharges = toArray<ChargeTemplate>(allChargesRes);

  // Normalize Work Types for Table Display
  const workTypes = useMemo(() => {
    return rawWorkTypes.map((wt) => {
      const features = normalizeFeatures(wt.features);
      const motorCount = wt.motor_ids?.length ?? (wt.motors?.length || 0);
      const chargeCount = wt.charge_ids?.length ?? (wt.charges?.length || 0);
      return {
        ...wt,
        features,
        motor_count: motorCount,
        charge_count: chargeCount,
        includes: `${motorCount} motor${motorCount === 1 ? '' : 's'} · ${chargeCount} charge${chargeCount === 1 ? '' : 's'}`,
      };
    });
  }, [rawWorkTypes]);

  // Motors with "Used by N work types" count
  const motorsWithUsage = useMemo(() => {
    return motors.map((motor) => {
      const usageCount = rawWorkTypes.filter((wt) =>
        (wt.motor_ids || []).includes(motor.id) || (wt.motors || []).some((m) => m.id === motor.id)
      ).length;
      return {
        ...motor,
        used_by_count: usageCount,
        used_by: usageCount > 0 ? `Used by ${usageCount} work type${usageCount === 1 ? '' : 's'}` : 'Not used',
      };
    });
  }, [motors, rawWorkTypes]);

  const tabData: Record<TabType, any[]> = {
    'work-types': workTypes,
    'fabric-types': fabricTypes,
    models,
    items,
    motors: motorsWithUsage,
    charges,
  };

  const tabColumns: Record<TabType, string[]> = {
    'work-types': ['id', 'name', 'pricing_unit', 'features', 'includes'],
    'fabric-types': ['id', 'work_type_name', 'name'],
    models: ['id', 'fabric_type_name', 'name'],
    items: ['id', 'model_name', 'name', 'price_per_unit'],
    motors: ['id', 'name', 'price_per_m2', 'used_by'],
    charges: ['id', 'name', 'kind', 'unit', 'price', 'description'],
  };

  const tabLoading: Record<TabType, boolean> = {
    'work-types': workTypesLoading,
    'fabric-types': fabricTypesLoading,
    models: modelsLoading,
    items: itemsLoading,
    motors: motorsLoading,
    charges: chargesLoading,
  };

  const dataArray = tabData[activeTab];
  const columns = tabColumns[activeTab];
  const primaryColumn = activeTab === 'items' ? 'model_name' : 'name';

  // Select Options
  const unitOptions: SelectOption[] = useMemo(() => [
    { value: 'm2', label: 'Per m² (m2)', icon: <FileText aria-hidden="true" /> },
    { value: 'm', label: 'Per metre (m)', icon: <FileText aria-hidden="true" /> },
    { value: 'flat', label: 'Flat (flat)', icon: <DollarSign aria-hidden="true" /> },
  ], []);

  const chargeKindOptions: SelectOption[] = useMemo(() => {
    return CHARGE_KINDS.map((kind) => {
      const meta = KIND_METAS[kind];
      const Icon = meta.icon;
      return {
        value: kind,
        label: meta.label,
        icon: <Icon size={14} aria-hidden="true" />,
      };
    });
  }, []);

  const kindFilterOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: 'All Kinds' },
    ...chargeKindOptions,
  ], [chargeKindOptions]);

  const unitFilterOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: 'All Units' },
    ...unitOptions,
  ], [unitOptions]);

  // Preview for Catalog Item modal
  const previewModel = models.find((model) => String(model.id) === String(formData.model ?? ''));
  const previewName = String(formData.name ?? '');
  const previewPrice = String(formData.price_per_unit ?? '');
  const previewPriceText = previewPrice ? formatMoney(previewPrice) : '0.00';

  const isFieldEdited = (key: string, value: unknown) => {
    if (!editingItem || !initialValuesRef.current) return false;
    const initial = initialValuesRef.current[key];
    return String(initial ?? '') !== String(value ?? '');
  };

  // Shortcut Listener
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !target?.matches('input, textarea, select, [contenteditable="true"]')
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  // Tab Slide Animation Indicator
  useEffect(() => {
    const updateThumb = () => {
      const tabElement = tabButtonRefs.current[activeTab];
      const tabList = tabListRef.current;
      if (!tabElement || !tabList) return;
      setTabThumb({ left: tabElement.offsetLeft, width: tabElement.offsetWidth });
      setTabEdges({
        left: tabList.scrollLeft > 0,
        right: tabList.scrollLeft + tabList.clientWidth < tabList.scrollWidth - 1,
      });
    };
    updateThumb();
    window.addEventListener('resize', updateThumb);
    return () => window.removeEventListener('resize', updateThumb);
  }, [activeTab]);

  const handleTabSelect = (tab: TabType) => {
    const oldIndex = catalogTabs.indexOf(activeTab);
    const newIndex = catalogTabs.indexOf(tab);
    setTabDirection(newIndex >= oldIndex ? 1 : -1);
    setActiveTab(tab);
    setFocusedTab(tab);
    setSearchQuery('');
  };

  const getTabLabel = (tab: TabType) => {
    const labels: Record<TabType, string> = {
      'work-types': 'Work Types',
      'fabric-types': 'Fabric Types',
      models: 'Models',
      items: 'Catalog Items',
      motors: 'Motors',
      charges: 'Charges',
    };
    return labels[tab];
  };

  const getTabIcon = (tab: TabType) => {
    const icons: Record<TabType, React.ReactNode> = {
      'work-types': <Layers className="w-4 h-4" />,
      'fabric-types': <Package className="w-4 h-4" />,
      models: <Grid3X3 className="w-4 h-4" />,
      items: <FileText className="w-4 h-4" />,
      motors: <Zap className="w-4 h-4" />,
      charges: <DollarSign className="w-4 h-4" />,
    };
    return icons[tab];
  };

  // Open Create Modal
  const openCreate = () => {
    setEditingItem(null);
    setFieldErrors({});
    setWorkTypeWarning(null);
    setMotorSearchQuery('');
    setChargeSearchQuery('');

    if (activeTab === 'work-types') {
      const initialFeatures: FeatureFlags = {
        motor: false,
        charges: false,
        images: true,
        draw: true,
        pelmet: false,
      };
      setWorkTypeFeatures(initialFeatures);
      setWorkTypeMotorIds([]);
      setWorkTypeChargeIds([]);
      setFormData({ name: '', pricing_unit: 'm2' });
      initialValuesRef.current = { name: '', pricing_unit: 'm2', features: initialFeatures };
    } else if (activeTab === 'charges') {
      setFormData({ name: '', price: '', unit: 'flat', kind: 'other', description: '' });
      initialValuesRef.current = { name: '', price: '', unit: 'flat', kind: 'other', description: '' };
    } else if (activeTab === 'motors') {
      setFormData({ name: '', price_per_m2: '' });
      initialValuesRef.current = { name: '', price_per_m2: '' };
    } else {
      setFormData({});
      initialValuesRef.current = {};
    }
    setFormOpen(true);
  };

  // Open Edit Modal
  const openEdit = (item: any) => {
    setEditingItem(item);
    setFieldErrors({});
    setWorkTypeWarning(null);
    setMotorSearchQuery('');
    setChargeSearchQuery('');

    if (activeTab === 'work-types') {
      const features = normalizeFeatures(item.features);
      const motorIds = item.motor_ids ?? (item.motors?.map((m: any) => m.id) || []);
      const chargeIds = item.charge_ids ?? (item.charges?.map((c: any) => c.id) || []);
      setWorkTypeFeatures(features);
      setWorkTypeMotorIds(motorIds);
      setWorkTypeChargeIds(chargeIds);
      setFormData({
        name: item.name || '',
        pricing_unit: item.pricing_unit || 'm2',
      });
      initialValuesRef.current = {
        name: item.name,
        pricing_unit: item.pricing_unit,
        features,
        motor_ids: motorIds,
        charge_ids: chargeIds,
      };
    } else if (activeTab === 'charges') {
      setFormData({
        name: item.name || '',
        price: item.price || '',
        unit: normalizeChargeUnit(item.unit),
        kind: item.kind || 'other',
        description: item.description || '',
      });
      initialValuesRef.current = { ...item, unit: normalizeChargeUnit(item.unit) };
    } else if (activeTab === 'motors') {
      setFormData({
        name: item.name || '',
        price_per_m2: item.price_per_m2 || '',
      });
      initialValuesRef.current = { ...item };
    } else {
      setFormData({ ...item });
      initialValuesRef.current = { ...item };
    }
    setFormOpen(true);
  };

  // Toggle a feature key in Work Type modal
  const handleFeatureToggle = (key: FeatureKey, checked: boolean) => {
    const nextFeatures: FeatureFlags = {
      ...workTypeFeatures,
      [key]: checked,
    };
    setWorkTypeFeatures(nextFeatures);
    setWorkTypeWarning(null);

    // Rule: turning motor off removes motors
    if (key === 'motor' && !checked) {
      if (workTypeMotorIds.length > 0) {
        setWorkTypeWarning(`Turning this off removes the ${workTypeMotorIds.length} selected motor${workTypeMotorIds.length === 1 ? '' : 's'}.`);
        setWorkTypeMotorIds([]);
      }
    }

    // Rule: turning charges or pelmet off removes ineligible charges
    if ((key === 'charges' || key === 'pelmet') && !checked) {
      const currentSelected = workTypeChargeIds;
      const chargesToTest = allCharges.length ? allCharges : charges;
      const stillEligible = currentSelected.filter((id) => {
        const c = chargesToTest.find((item) => item.id === id);
        if (!c) return true;
        return isChargeEligible(c, nextFeatures);
      });
      const removedCount = currentSelected.length - stillEligible.length;
      if (removedCount > 0) {
        const flagName = key === 'pelmet' ? 'Pelmet' : 'Control & Charges';
        setWorkTypeWarning(`${removedCount} charge${removedCount === 1 ? '' : 's'} removed because ${flagName} is off.`);
        setWorkTypeChargeIds(stillEligible);
      }
    }
  };

  // Save handler for all tabs
  const handleSave = async () => {
    setFieldErrors({});
    setSaving(true);
    try {
      if (activeTab === 'work-types') {
        if (!formData.name?.trim()) {
          setFieldErrors((prev) => ({ ...prev, name: 'Name is required' }));
          setSaving(false);
          return;
        }

        const payload = buildWorkTypePatch(
          {
            id: editingItem?.id,
            name: formData.name,
            pricing_unit: formData.pricing_unit || 'm2',
            features: workTypeFeatures,
            motor_ids: workTypeMotorIds,
            charge_ids: workTypeChargeIds,
            originalFeatures: editingItem?.features,
          },
          allCharges.length ? allCharges : charges
        );

        if (editingItem) {
          await catalogApi.updateWorkType(editingItem.id, payload);
          showToast('Saved', 'success');
        } else {
          await catalogApi.createWorkType(payload);
          showToast('Saved', 'success');
        }
        refetchWorkTypes();
      } else if (activeTab === 'motors') {
        if (!formData.name?.trim()) {
          setFieldErrors((prev) => ({ ...prev, name: 'Motor name is required' }));
          setSaving(false);
          return;
        }
        const payload = {
          name: formData.name.trim(),
          price_per_m2: formData.price_per_m2 ? String(formData.price_per_m2) : '0.00',
        };
        if (editingItem) {
          await catalogApi.updateMotor(editingItem.id, payload);
          showToast('Saved', 'success');
        } else {
          await catalogApi.createMotor(payload);
          showToast('Saved', 'success');
        }
        refetchMotors();
      } else if (activeTab === 'charges') {
        if (!formData.name?.trim()) {
          setFieldErrors((prev) => ({ ...prev, name: 'Charge name is required' }));
          setSaving(false);
          return;
        }
        const payload = {
          name: formData.name.trim(),
          price: formData.price ? String(formData.price) : '0.00',
          unit: normalizeChargeUnit(formData.unit),
          kind: (formData.kind || 'other') as ChargeKind,
          description: formData.description?.trim() || '',
        };
        if (editingItem) {
          await catalogApi.updateCharge(editingItem.id, payload);
          showToast('Saved', 'success');
        } else {
          await catalogApi.createCharge(payload);
          showToast('Saved', 'success');
        }
        refetchCharges();
      } else if (activeTab === 'fabric-types') {
        if (!formData.name?.trim()) {
          showToast('Name is required', 'error');
          setSaving(false);
          return;
        }
        if (editingItem) {
          await catalogApi.updateFabricType(editingItem.id, { work_type: formData.work_type, name: formData.name });
          showToast('Saved', 'success');
        } else {
          await catalogApi.createFabricType({ work_type: formData.work_type, name: formData.name });
          showToast('Saved', 'success');
        }
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        if (!formData.name?.trim()) {
          showToast('Name is required', 'error');
          setSaving(false);
          return;
        }
        if (editingItem) {
          await catalogApi.updateModel(editingItem.id, { fabric_type: formData.fabric_type, name: formData.name });
          showToast('Saved', 'success');
        } else {
          await catalogApi.createModel({ fabric_type: formData.fabric_type, name: formData.name });
          showToast('Saved', 'success');
        }
        refetchModels();
      } else if (activeTab === 'items') {
        if (!formData.name?.trim()) {
          showToast('Name is required', 'error');
          setSaving(false);
          return;
        }
        if (!formData.price_per_unit) {
          showToast('Price Per Unit is required', 'error');
          setSaving(false);
          return;
        }
        if (editingItem) {
          await catalogApi.updateItem(editingItem.id, {
            model: formData.model,
            name: formData.name,
            price_per_unit: formData.price_per_unit,
          });
          showToast('Saved', 'success');
        } else {
          await catalogApi.createItem({
            model: formData.model,
            name: formData.name,
            price_per_unit: formData.price_per_unit,
          });
          showToast('Saved', 'success');
        }
        refetchItems();
      }

      setFormOpen(false);
      setFormData({});
      setFieldErrors({});
      setWorkTypeWarning(null);
    } catch (err: any) {
      console.error('Save error:', err);
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const errors: Record<string, string> = {};
        if (data.features) errors.features = Array.isArray(data.features) ? data.features.join(' ') : String(data.features);
        if (data.motor_ids) errors.motor_ids = Array.isArray(data.motor_ids) ? data.motor_ids.join(' ') : String(data.motor_ids);
        if (data.charge_ids) errors.charge_ids = Array.isArray(data.charge_ids) ? data.charge_ids.join(' ') : String(data.charge_ids);
        if (data.name) errors.name = Array.isArray(data.name) ? data.name.join(' ') : String(data.name);
        if (data.price) errors.price = Array.isArray(data.price) ? data.price.join(' ') : String(data.price);
        if (data.price_per_m2) errors.price_per_m2 = Array.isArray(data.price_per_m2) ? data.price_per_m2.join(' ') : String(data.price_per_m2);
        if (data.detail) errors.general = String(data.detail);

        setFieldErrors(errors);
        showToast(data.detail || 'Validation error. Please check the marked sections.', 'error');
      } else {
        showToast(err?.message || 'Operation failed', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (activeTab === 'work-types') {
        await catalogApi.deleteWorkType(deleteTarget.id);
        showToast('Work type deleted', 'success');
        refetchWorkTypes();
      } else if (activeTab === 'fabric-types') {
        await catalogApi.deleteFabricType(deleteTarget.id);
        showToast('Fabric type deleted', 'success');
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        await catalogApi.deleteModel(deleteTarget.id);
        showToast('Model deleted', 'success');
        refetchModels();
      } else if (activeTab === 'items') {
        await catalogApi.deleteItem(deleteTarget.id);
        showToast('Item deleted', 'success');
        refetchItems();
      } else if (activeTab === 'motors') {
        await catalogApi.deleteMotor(deleteTarget.id);
        showToast('Motor deleted', 'success');
        refetchMotors();
      } else if (activeTab === 'charges') {
        await catalogApi.deleteCharge(deleteTarget.id);
        showToast('Charge deleted', 'success');
        refetchCharges();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete', 'error');
    }
  };

  // Filtered motors list for modal checklist
  const filteredModalMotors = useMemo(() => {
    if (!motorSearchQuery.trim()) return motors;
    const q = motorSearchQuery.toLowerCase();
    return motors.filter((m) => m.name.toLowerCase().includes(q));
  }, [motors, motorSearchQuery]);

  // Filtered charges list for modal checklist, grouped by kind
  const filteredModalChargesByKind = useMemo(() => {
    const list = allCharges.length ? allCharges : charges;
    const query = chargeSearchQuery.toLowerCase().trim();
    const filtered = query ? list.filter((c) => c.name.toLowerCase().includes(query) || (c.description || '').toLowerCase().includes(query)) : list;

    const grouped: Record<ChargeKind, ChargeTemplate[]> = {
      manual: [],
      motorized: [],
      alexa: [],
      pelmet: [],
      other: [],
    };

    filtered.forEach((c) => {
      const k = (c.kind || 'other') as ChargeKind;
      if (grouped[k]) grouped[k].push(c);
      else grouped.other.push(c);
    });

    return grouped;
  }, [allCharges, charges, chargeSearchQuery]);

  // Render Table Content
  const renderContent = () => {
    return (
      <div className={`catalog__table-transition catalog__table-transition--${tabDirection}`} key={activeTab}>
        {tabLoading[activeTab] ? (
          <div
            className="catalog__scroll"
            onScroll={(event) => {
              event.currentTarget.dataset.scrolled = String(event.currentTarget.scrollLeft > 0);
            }}
          >
            <table className="catalog__table" aria-label={`${getTabLabel(activeTab)} loading`}>
              <thead>
                <tr>
                  {columns.map((column) => <th key={column} scope="col">{formatColumnLabel(column)}</th>)}
                  <th scope="col" className="catalog__actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, index) => (
                  <tr className="catalog__skeleton-row" key={`skeleton-${activeTab}-${index}`} aria-hidden="true">
                    {columns.map((column) => (
                      <td key={column} className={column === primaryColumn ? 'catalog__cell--primary' : ''}>
                        <span className="catalog__skeleton-block" />
                      </td>
                    ))}
                    <td><span className="catalog__skeleton-actions"><i /><i /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            {dataArray.length === 0 ? (
              <div className="catalog__empty" role="status">
                <span className="catalog__empty-icon" aria-hidden="true">
                  {searchQuery.trim() ? <SearchX /> : getTabIcon(activeTab)}
                </span>
                <strong>{searchQuery.trim() ? 'No results found' : `No ${getTabLabel(activeTab).toLowerCase()} yet`}</strong>
                <span>{searchQuery.trim() ? 'Try a different search or filter' : `Add your first ${getTabLabel(activeTab).toLowerCase()} to get started`}</span>
                {searchQuery.trim() ? (
                  <button type="button" onClick={() => setSearchQuery('')}>Clear search</button>
                ) : (
                  <button type="button" onClick={openCreate}>Add {getTabLabel(activeTab)}</button>
                )}
              </div>
            ) : (
              <div className="catalog__scroll">
                <table className="catalog__table" aria-label={getTabLabel(activeTab)}>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className={[
                            /price|rate|amount|charge|cost/i.test(column) ? 'catalog__heading--money' : '',
                            column === primaryColumn ? 'catalog__heading--primary' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {formatColumnLabel(column)}
                        </th>
                      ))}
                      <th scope="col" className="catalog__actions-heading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataArray.map((item, rowIndex) => (
                      <tr
                        key={`${activeTab}-${item.id}`}
                        className="catalog__row"
                        style={{ '--row-index': Math.min(rowIndex, 11) } as React.CSSProperties}
                      >
                        {columns.map((column) => {
                          const value = item[column];
                          const text = value == null || value === '' ? '—' : String(value);
                          const isMoney = /price|rate|amount|charge|cost/i.test(column);
                          const isPrimary = column === primaryColumn;
                          const isCategory = column === 'name' && activeTab === 'items';
                          const isRelation = column === 'work_type_name' || column === 'fabric_type_name';
                          const cellClasses = [
                            column === 'id' ? 'catalog__cell--id' : '',
                            isPrimary ? 'catalog__cell--primary' : '',
                            isMoney ? 'catalog__cell--money' : '',
                            column === 'unit' || column === 'pricing_unit' ? 'catalog__cell--unit' : '',
                          ].filter(Boolean).join(' ');

                          return (
                            <td key={column} className={cellClasses} data-label={column.replaceAll('_', ' ')}>
                              <span className="catalog__cell-label">{column.replaceAll('_', ' ')}</span>

                              {/* Work Types Features Chips */}
                              {activeTab === 'work-types' && column === 'features' ? (
                                <div className="catalog__features-cell">
                                  {FEATURE_METAS.map((meta) => {
                                    const isEnabled = Boolean(item.features?.[meta.key]);
                                    const Icon = meta.icon;
                                    return (
                                      <span
                                        key={meta.key}
                                        className={`catalog__feature-chip${isEnabled ? ' is-enabled' : ''}`}
                                        title={`${meta.label}: ${isEnabled ? 'Enabled' : 'Disabled'}`}
                                        aria-label={`${meta.label}: ${isEnabled ? 'Enabled' : 'Disabled'}`}
                                      >
                                        <Icon size={14} />
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : activeTab === 'work-types' && column === 'includes' ? (
                                <span className="catalog__includes-badge">
                                  {item.includes}
                                </span>
                              ) : activeTab === 'motors' && column === 'price_per_m2' ? (
                                <span className="catalog__money">
                                  <span className="catalog__currency">AED</span>
                                  <strong>{formatMoney(item.price_per_m2)}</strong>
                                  <span className="text-xs text-slate-400 font-normal ml-1">/ m²</span>
                                </span>
                              ) : activeTab === 'motors' && column === 'used_by' ? (
                                <span className="catalog__used-by-chip">
                                  {item.used_by}
                                </span>
                              ) : activeTab === 'charges' && column === 'kind' ? (
                                (() => {
                                  const kindKey = (item.kind || 'other') as ChargeKind;
                                  const meta = KIND_METAS[kindKey] || KIND_METAS.other;
                                  const Icon = meta.icon;
                                  return (
                                    <span className={`kind-pill ${meta.badgeClass}`}>
                                      <Icon size={13} />
                                      <span>{meta.label}</span>
                                    </span>
                                  );
                                })()
                              ) : activeTab === 'charges' && column === 'unit' ? (
                                <span className="catalog__unit-pill">
                                  {formatChargeUnit(item.unit)}
                                </span>
                              ) : activeTab === 'charges' && column === 'description' ? (
                                <span className="catalog__plain-value catalog__truncate" title={text}>
                                  {text}
                                </span>
                              ) : column === 'id' ? (
                                <span className="catalog__id-chip">{text}</span>
                              ) : isPrimary ? (
                                <span className="catalog__primary-cell" title={text}>
                                  <span className="catalog__row-icon" aria-hidden="true">{getTabIcon(activeTab)}</span>
                                  <span className="catalog__truncate">{text}</span>
                                </span>
                              ) : isMoney ? (
                                <span className="catalog__money">
                                  <span className="catalog__currency">AED</span>
                                  <strong>{formatMoney(value)}</strong>
                                </span>
                              ) : isCategory || isRelation ? (
                                <span
                                  className="catalog__value-pill"
                                  style={{
                                    color: stableNameColor(text),
                                    backgroundColor: `${stableNameColor(text)}14`,
                                    borderColor: `${stableNameColor(text)}33`,
                                  }}
                                  title={text}
                                >
                                  {text}
                                </span>
                              ) : typeof value === 'boolean' ? (
                                <StatusBadge
                                  status={value ? 'active' : 'inactive'}
                                  label={value ? 'Active' : 'Inactive'}
                                  className={value ? 'catalog__status--active' : 'catalog__status--inactive'}
                                />
                              ) : column === 'unit' || column === 'pricing_unit' ? (
                                <span className="catalog__unit-value">{formatChargeUnit(text)}</span>
                              ) : (
                                <span className="catalog__plain-value catalog__truncate" title={text}>{text}</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="catalog__actions-cell" data-label="Actions" onClick={(event) => event.stopPropagation()}>
                          <span className="catalog__cell-label">Actions</span>
                          <div className="catalog__actions">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="catalog__action catalog__action--edit"
                              title="Edit"
                              aria-label={`Edit ${item.name ?? getTabLabel(activeTab)}`}
                            >
                              <Edit2 aria-hidden="true" /><span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="catalog__action catalog__action--delete"
                              title="Delete"
                              aria-label={`Delete ${item.name ?? getTabLabel(activeTab)}`}
                            >
                              <Trash2 aria-hidden="true" /><span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <footer className="catalog__footer">
          <span>
            Showing <strong>{dataArray.length ? '1' : '0'}{dataArray.length > 1 ? `-${dataArray.length}` : ''}</strong> of <strong>{dataArray.length}</strong>
          </span>
        </footer>
      </div>
    );
  };

  return (
    <div className="catalog-page">
      <header className="catalog__header">
        <div className="catalog__heading">
          <span className="catalog__heading-icon" aria-hidden="true"><Tags /></span>
          <div>
            <h1>Catalog &amp; Pricing</h1>
            <p>Manage catalog items, work types, motors, charges, and pricing options</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="catalog__add-button"
        >
          <Plus aria-hidden="true" /> <span>Add {getTabLabel(activeTab)}</span>
        </button>
      </header>

      <div className="catalog__card">
        {/* Navigation Tabs */}
        <nav
          className="catalog__tabs-wrap"
          aria-label="Catalog Sections"
          data-edge-left={tabEdges.left}
          data-edge-right={tabEdges.right}
        >
          <div className="catalog__tabs" ref={tabListRef} role="tablist">
            <span
              className="catalog__tab-thumb"
              style={{
                transform: `translateX(${tabThumb.left}px)`,
                width: `${tabThumb.width}px`,
              }}
              aria-hidden="true"
            />
            {catalogTabs.map((tab) => {
              const isCurrent = activeTab === tab;
              const count = tabData[tab]?.length;
              return (
                <button
                  key={tab}
                  ref={(element) => {
                    tabButtonRefs.current[tab] = element || undefined;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  tabIndex={focusedTab === tab ? 0 : -1}
                  className={`catalog__tab${isCurrent ? ' catalog__tab--active' : ''}`}
                  onClick={() => handleTabSelect(tab)}
                >
                  <span className="catalog__tab-icon">{getTabIcon(tab)}</span>
                  <span>{getTabLabel(tab)}</span>
                  {typeof count === 'number' && (
                    <span className="catalog__tab-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Toolbar with Search and Server Filters */}
        <div className="catalog__toolbar">
          <div className="catalog__search-wrap">
            <Search className="catalog__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder={`Search ${getTabLabel(activeTab).toLowerCase()}...`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="catalog__search-input"
              aria-label={`Search ${getTabLabel(activeTab).toLowerCase()}`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="catalog__clear-btn"
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            ) : (
              <kbd className="catalog__shortcut" aria-hidden="true">/</kbd>
            )}
          </div>

          {/* Charges Tab Kind & Unit Filters */}
          {activeTab === 'charges' && (
            <div className="flex items-center gap-2">
              <div className="w-36">
                <SelectMenu
                  id="charges-kind-filter"
                  value={chargeKindFilter}
                  options={kindFilterOptions}
                  onChange={(val) => setChargeKindFilter(val)}
                  placeholder="All Kinds"
                  ariaLabel="Filter by Kind"
                  className="catalog-model-select"
                  menuClassName="catalog-model-menu catalog-select-menu"
                />
              </div>
              <div className="w-36">
                <SelectMenu
                  id="charges-unit-filter"
                  value={chargeUnitFilter}
                  options={unitFilterOptions}
                  onChange={(val) => setChargeUnitFilter(val)}
                  placeholder="All Units"
                  ariaLabel="Filter by Unit"
                  className="catalog-model-select"
                  menuClassName="catalog-model-menu catalog-select-menu"
                />
              </div>
            </div>
          )}

          {dataArray.length > 0 && (
            <span className="catalog__result-count" aria-live="polite">
              {dataArray.length} {dataArray.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Table Content */}
        {renderContent()}
      </div>

      {/* Main Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setFormData({});
            setFieldErrors({});
            setWorkTypeWarning(null);
          }
        }}
        title={`${editingItem ? 'Edit' : 'Add'} ${getTabLabel(activeTab)}`}
        maxWidth={activeTab === 'work-types' ? 'max-w-2xl' : 'max-w-lg'}
      >
        {activeTab === 'items' ? (
          /* Catalog Item Form with Realtime Preview */
          <form
            id="catalog-item-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="catalog-item-form"
          >
            <div className="catalog-item-field catalog-item-model-field">
              <div className="catalog-item-label-row">
                <label id="catalog-item-model-label">Model<span className="catalog-item-required" aria-hidden="true">*</span></label>
                {isFieldEdited('model', formData.model) && <span className="catalog-item-edited"><i />Edited</span>}
              </div>
              <SelectMenu
                id="catalog-item-model"
                value={String(formData.model ?? '')}
                options={models.map((m) => ({ value: String(m.id), label: m.name, suffix: `#${m.id}` }))}
                onChange={(value) => setFormData({ ...formData, model: Number(value) })}
                placeholder="Choose model"
                ariaLabel="Model"
                disabled={saving}
              />
            </div>

            <div className="catalog-item-fields-grid">
              <div className="catalog-item-field">
                <div className="catalog-item-label-row">
                  <label htmlFor="catalog-item-name">Name<span className="catalog-item-required" aria-hidden="true">*</span></label>
                  {isFieldEdited('name', formData.name) && <span className="catalog-item-edited"><i />Edited</span>}
                </div>
                <div className="catalog-item-control">
                  <Tag className="catalog-item-control-icon" aria-hidden="true" />
                  <input
                    id="catalog-item-name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="e.g. Premium Shade"
                    readOnly={saving}
                  />
                </div>
              </div>

              <div className="catalog-item-field">
                <div className="catalog-item-label-row">
                  <label htmlFor="catalog-item-price">Price Per Unit<span className="catalog-item-required" aria-hidden="true">*</span></label>
                  {isFieldEdited('price_per_unit', formData.price_per_unit) && <span className="catalog-item-edited"><i />Edited</span>}
                </div>
                <div className="catalog-item-price-control">
                  <span className="catalog-item-currency-prefix">AED</span>
                  <input
                    id="catalog-item-price"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit || ''}
                    onChange={(event) => setFormData({ ...formData, price_per_unit: event.target.value })}
                    placeholder="e.g. 150.00"
                    readOnly={saving}
                  />
                </div>
              </div>
            </div>

            <div className="catalog-item-preview" aria-live="polite" aria-atomic="true">
              <span className="catalog-item-preview-label">Preview</span>
              <div className="catalog-item-preview-row" aria-hidden="true">
                <span className="catalog-item-preview-model">
                  <span className="catalog-item-preview-model-icon"><Grid3X3 /></span>
                  <span className={previewModel ? '' : 'is-placeholder'}>{previewModel?.name || 'Model'}</span>
                </span>
                {previewName ? (
                  <span
                    className="catalog-item-preview-pill"
                    style={{
                      color: stableNameColor(previewName),
                      backgroundColor: `${stableNameColor(previewName)}14`,
                      borderColor: `${stableNameColor(previewName)}33`,
                    }}
                  >
                    {previewName}
                  </span>
                ) : <span className="catalog-item-preview-placeholder">Name</span>}
                <span className="catalog-item-preview-price">
                  <span>AED</span>
                  <strong className={previewPrice ? '' : 'is-placeholder'}>{previewPriceText}</strong>
                </span>
              </div>
            </div>
          </form>
        ) : (
          /* General Form for Work Types, Motors, Charges, etc. */
          <form
            id="catalog-general-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            {/* ── WORK TYPES MODAL ───────────────────────── */}
            {activeTab === 'work-types' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FormInput
                      label="Name"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Roller Blinds"
                    />
                    {fieldErrors.name && <span className="catalog-field-error">{fieldErrors.name}</span>}
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                      Pricing Unit
                    </label>
                    <SelectMenu
                      id="work-type-unit"
                      value={formData.pricing_unit || 'm2'}
                      options={unitOptions}
                      onChange={(val) => setFormData({ ...formData, pricing_unit: val })}
                      placeholder="Pricing unit"
                      ariaLabel="Pricing Unit"
                    />
                  </div>
                </div>

                {/* Section 1: Features Toggle Switch Tiles */}
                <div className="catalog-modal__section">
                  <div className="catalog-modal__section-header">
                    <span className="catalog-modal__section-title">Features &amp; Flags</span>
                    <span className="catalog-modal__section-helper">Saving writes all five flags.</span>
                  </div>
                  {fieldErrors.features && <span className="catalog-field-error">{fieldErrors.features}</span>}

                  <div className="catalog-toggle-grid">
                    {FEATURE_METAS.map((meta) => {
                      const isChecked = Boolean(workTypeFeatures[meta.key]);
                      const Icon = meta.icon;
                      return (
                        <label
                          key={meta.key}
                          className={`catalog-toggle-tile${isChecked ? ' is-checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleFeatureToggle(meta.key, e.target.checked)}
                            className="catalog-toggle-input"
                          />
                          <span className="catalog-toggle-icon">
                            <Icon size={16} />
                          </span>
                          <span className="catalog-toggle-text">
                            <span className="catalog-toggle-label">{meta.label}</span>
                            <span className="catalog-toggle-sub">{meta.helper}</span>
                          </span>
                          <span className="catalog-toggle-switch" aria-hidden="true" />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Notice if feature changes removed selections */}
                {workTypeWarning && (
                  <div className="catalog-notice--amber">
                    <AlertTriangle size={15} />
                    <span>{workTypeWarning}</span>
                  </div>
                )}

                {/* Section 2: Motors Checklist (Visible only when motor feature is enabled) */}
                {workTypeFeatures.motor && (
                  <div className="catalog-modal__section">
                    <div className="catalog-modal__section-header">
                      <span className="catalog-modal__section-title">Included Motors</span>
                      <span className="catalog-picker-count">{workTypeMotorIds.length} selected</span>
                    </div>
                    {fieldErrors.motor_ids && <span className="catalog-field-error">{fieldErrors.motor_ids}</span>}

                    <div className="catalog-picker">
                      <div className="catalog-picker-toolbar">
                        <div className="catalog-picker-search">
                          <Search size={14} />
                          <input
                            type="text"
                            placeholder="Search motors..."
                            value={motorSearchQuery}
                            onChange={(e) => setMotorSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="catalog-picker-actions">
                          <button
                            type="button"
                            className="catalog-picker-btn"
                            onClick={() => setWorkTypeMotorIds(motors.map((m) => m.id))}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="catalog-picker-btn"
                            onClick={() => setWorkTypeMotorIds([])}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="catalog-picker-list">
                        {motors.length === 0 ? (
                          <div className="catalog-picker-empty">
                            <span>No motors in the catalog yet.</span>
                            <button
                              type="button"
                              className="catalog-picker-empty-btn"
                              onClick={() => {
                                setFormOpen(false);
                                handleTabSelect('motors');
                              }}
                            >
                              Go to Motors tab <ArrowRight size={13} />
                            </button>
                          </div>
                        ) : filteredModalMotors.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No motors matching "{motorSearchQuery}"
                          </div>
                        ) : (
                          filteredModalMotors.map((motor) => {
                            const isSelected = workTypeMotorIds.includes(motor.id);
                            return (
                              <label
                                key={motor.id}
                                className={`catalog-picker-row${isSelected ? ' is-selected' : ''}`}
                              >
                                <span className="catalog-picker-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setWorkTypeMotorIds((prev) => [...prev, motor.id]);
                                      } else {
                                        setWorkTypeMotorIds((prev) => prev.filter((id) => id !== motor.id));
                                      }
                                    }}
                                  />
                                  <span className="catalog-picker-row-title">{motor.name}</span>
                                </span>
                                <span className="catalog-picker-row-meta">
                                  <span className="catalog-picker-row-price">
                                    AED {formatMoney(motor.price_per_m2)} / m²
                                  </span>
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Charges Checklist (Visible when charges or pelmet is enabled) */}
                {(workTypeFeatures.charges || workTypeFeatures.pelmet) && (
                  <div className="catalog-modal__section">
                    <div className="catalog-modal__section-header">
                      <span className="catalog-modal__section-title">Included Charges</span>
                      <span className="catalog-picker-count">{workTypeChargeIds.length} selected</span>
                    </div>
                    {fieldErrors.charge_ids && <span className="catalog-field-error">{fieldErrors.charge_ids}</span>}

                    <div className="catalog-picker">
                      <div className="catalog-picker-toolbar">
                        <div className="catalog-picker-search">
                          <Search size={14} />
                          <input
                            type="text"
                            placeholder="Search charges..."
                            value={chargeSearchQuery}
                            onChange={(e) => setChargeSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="catalog-picker-actions">
                          <button
                            type="button"
                            className="catalog-picker-btn"
                            onClick={() => {
                              const list = allCharges.length ? allCharges : charges;
                              const eligible = list
                                .filter((c) => isChargeEligible(c, workTypeFeatures))
                                .map((c) => c.id);
                              setWorkTypeChargeIds(eligible);
                            }}
                          >
                            Select Eligible
                          </button>
                          <button
                            type="button"
                            className="catalog-picker-btn"
                            onClick={() => setWorkTypeChargeIds([])}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="catalog-picker-list">
                        {(allCharges.length ? allCharges : charges).length === 0 ? (
                          <div className="catalog-picker-empty">
                            <span>No charges in the catalog yet.</span>
                            <button
                              type="button"
                              className="catalog-picker-empty-btn"
                              onClick={() => {
                                setFormOpen(false);
                                handleTabSelect('charges');
                              }}
                            >
                              Go to Charges tab <ArrowRight size={13} />
                            </button>
                          </div>
                        ) : (
                          CHARGE_KINDS.map((kind) => {
                            const groupItems = filteredModalChargesByKind[kind];
                            if (!groupItems || groupItems.length === 0) return null;
                            const kindMeta = KIND_METAS[kind];
                            const Icon = kindMeta.icon;

                            return (
                              <div key={kind} className="catalog-picker-group">
                                <div className="catalog-picker-group-heading">
                                  <Icon size={12} />
                                  <span>{kindMeta.label}</span>
                                </div>
                                {groupItems.map((charge) => {
                                  const eligible = isChargeEligible(charge, workTypeFeatures);
                                  const isSelected = workTypeChargeIds.includes(charge.id);
                                  const lockReason = charge.kind === 'pelmet'
                                    ? 'Needs Pelmet'
                                    : 'Needs Control & Charges';

                                  return (
                                    <label
                                      key={charge.id}
                                      className={`catalog-picker-row${isSelected ? ' is-selected' : ''}${!eligible ? ' is-disabled' : ''}`}
                                      title={!eligible ? lockReason : undefined}
                                    >
                                      <span className="catalog-picker-checkbox">
                                        <input
                                          type="checkbox"
                                          checked={isSelected && eligible}
                                          disabled={!eligible}
                                          onChange={(e) => {
                                            if (!eligible) return;
                                            if (e.target.checked) {
                                              setWorkTypeChargeIds((prev) => [...prev, charge.id]);
                                            } else {
                                              setWorkTypeChargeIds((prev) => prev.filter((id) => id !== charge.id));
                                            }
                                          }}
                                        />
                                        <span className="catalog-picker-row-title">{charge.name}</span>
                                      </span>
                                      <span className="catalog-picker-row-meta">
                                        {!eligible ? (
                                          <span className="catalog-picker-lock-pill">
                                            <Lock size={10} /> {lockReason}
                                          </span>
                                        ) : (
                                          <>
                                            <span className="catalog__unit-pill">
                                              {formatChargeUnit(charge.unit)}
                                            </span>
                                            <span className="catalog-picker-row-price">
                                              AED {formatMoney(charge.price)}
                                            </span>
                                          </>
                                        )}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MOTORS MODAL ───────────────────────────── */}
            {activeTab === 'motors' && (
              <div className="space-y-3">
                <div>
                  <FormInput
                    label="Motor Name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. American Battery Motor"
                  />
                  {fieldErrors.name && <span className="catalog-field-error">{fieldErrors.name}</span>}
                </div>
                <div>
                  <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                    Price per m² <span className="text-rose-500">*</span>
                  </label>
                  <div className="catalog-item-price-control">
                    <span className="catalog-item-currency-prefix">AED</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_per_m2 || ''}
                      onChange={(e) => setFormData({ ...formData, price_per_m2: e.target.value })}
                      placeholder="180.00"
                    />
                    <span className="pr-3 text-xs text-slate-400 font-semibold select-none">/ m²</span>
                  </div>
                  {fieldErrors.price_per_m2 && <span className="catalog-field-error">{fieldErrors.price_per_m2}</span>}
                </div>
              </div>
            )}

            {/* ── CHARGES MODAL ──────────────────────────── */}
            {activeTab === 'charges' && (
              <div className="space-y-3">
                <div>
                  <FormInput
                    label="Charge Name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Manual Control"
                  />
                  {fieldErrors.name && <span className="catalog-field-error">{fieldErrors.name}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                      Price <span className="text-rose-500">*</span>
                    </label>
                    <div className="catalog-item-price-control">
                      <span className="catalog-item-currency-prefix">AED</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="60.00"
                      />
                    </div>
                    {fieldErrors.price && <span className="catalog-field-error">{fieldErrors.price}</span>}
                  </div>

                  <div>
                    <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                      Unit
                    </label>
                    <SelectMenu
                      id="charge-unit"
                      value={normalizeChargeUnit(formData.unit)}
                      options={unitOptions}
                      onChange={(val) => setFormData({ ...formData, unit: val })}
                      placeholder="Select unit"
                      ariaLabel="Charge Unit"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                    Kind
                  </label>
                  <SelectMenu
                    id="charge-kind"
                    value={formData.kind || 'other'}
                    options={chargeKindOptions}
                    onChange={(val) => setFormData({ ...formData, kind: val })}
                    placeholder="Select kind"
                    ariaLabel="Charge Kind"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                    Description <span className="text-xs text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="When this charge applies (e.g. Charged per m² for manual control)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2F5D8F] focus:ring-4 focus:ring-[#2F5D8F]/10 text-sm text-slate-800 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── FABRIC TYPES MODAL ─────────────────────── */}
            {activeTab === 'fabric-types' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                    Work Type <span className="text-rose-500">*</span>
                  </label>
                  <SelectMenu
                    id="fabric-type-work-type"
                    value={String(formData.work_type ?? '')}
                    options={workTypes.map((wt) => ({ value: String(wt.id), label: wt.name }))}
                    onChange={(val) => setFormData({ ...formData, work_type: Number(val) })}
                    placeholder="Select Work Type"
                    ariaLabel="Work Type"
                  />
                </div>
                <div>
                  <FormInput
                    label="Name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Linen"
                  />
                </div>
              </div>
            )}

            {/* ── MODELS MODAL ───────────────────────────── */}
            {activeTab === 'models' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
                    Fabric Type <span className="text-rose-500">*</span>
                  </label>
                  <SelectMenu
                    id="model-fabric-type"
                    value={String(formData.fabric_type ?? '')}
                    options={fabricTypes.map((ft) => ({ value: String(ft.id), label: ft.name }))}
                    onChange={(val) => setFormData({ ...formData, fabric_type: Number(val) })}
                    placeholder="Select Fabric Type"
                    ariaLabel="Fabric Type"
                  />
                </div>
                <div>
                  <FormInput
                    label="Name"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Blackout"
                  />
                </div>
              </div>
            )}
          </form>
        )}

        {/* Modal Footer */}
        <div className="catalog-item-form-footer mt-6">
          <button
            type="button"
            onClick={() => {
              if (!saving) {
                setFormOpen(false);
                setFormData({});
                setFieldErrors({});
                setWorkTypeWarning(null);
              }
            }}
            disabled={saving}
            className="catalog-item-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={activeTab === 'items' ? 'catalog-item-form' : 'catalog-general-form'}
            disabled={saving}
            className="catalog-item-submit"
          >
            {saving ? (
              <>
                <Loader2 className="catalog-item-submit-spinner" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{editingItem ? 'Save Changes' : 'Create'}</span>
            )}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${getTabLabel(activeTab)}`}
        message={`Are you sure you want to delete "${deleteTarget?.name || 'this item'}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
