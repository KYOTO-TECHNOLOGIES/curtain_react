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
  CheckCircle2,
  Tags,
  Search,
  SearchX,
  X,
  Tag,
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
} from '../../api/catalog';
import { useToast } from '../../components/ui/Toast';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { FormInput } from '../../components/ui/FormInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SelectMenu } from '../../components/ui/SelectMenu';
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

const formatMoney = (value: unknown) => {
  const raw = String(value ?? '');
  const numericValue = Number(raw);
  if (!Number.isFinite(numericValue)) return raw || '—';
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue);
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
  const [formData, setFormData] = useState<any>({});
  const initialValuesRef = useRef<Record<string, unknown> | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<TabType, HTMLButtonElement>>>({});
  const [tabThumb, setTabThumb] = useState({ left: 0, width: 0 });
  const [tabDirection, setTabDirection] = useState(1);
  const [tabEdges, setTabEdges] = useState({ left: false, right: false });
  const [announcedCount, setAnnouncedCount] = useState('');
  const [focusedTab, setFocusedTab] = useState<TabType>('items');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all data
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

  const { data: chargesRes, refetch: refetchCharges, isLoading: chargesLoading } = useQuery({
    queryKey: ['charges', debouncedSearch],
    queryFn: () => catalogApi.charges(),
  });

  const toArray = <T,>(res: any): T[] => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(res)) return res;
    return [];
  };

  const workTypes = toArray<WorkType>(workTypesRes);
  const fabricTypes = toArray<FabricType>(fabricTypesRes);
  const models = toArray<CatalogModel>(modelsRes);
  const items = toArray<CatalogItem>(itemsRes);
  const motors = toArray<MotorType>(motorsRes);
  const charges = toArray<ChargeTemplate>(chargesRes);
  const tabData: Record<TabType, any[]> = {
    'work-types': workTypes,
    'fabric-types': fabricTypes,
    models,
    items,
    motors,
    charges,
  };
  const tabColumns: Record<TabType, string[]> = {
    'work-types': ['id', 'name', 'pricing_unit'],
    'fabric-types': ['id', 'work_type_name', 'name'],
    models: ['id', 'fabric_type_name', 'name'],
    items: ['id', 'model_name', 'name', 'price_per_unit'],
    motors: ['id', 'name', 'price_per_m2'],
    charges: ['id', 'name', 'price', 'unit'],
  };
  const tabLoading: Record<TabType, boolean> = {
    'work-types': workTypesLoading,
    'fabric-types': fabricTypesLoading,
    models: modelsLoading,
    items: itemsLoading,
    motors: motorsLoading,
    charges: chargesLoading,
  };
  const tabCounts: Partial<Record<TabType, number>> = {
    'work-types': workTypesRes == null ? undefined : workTypes.length,
    'fabric-types': fabricTypesRes == null ? undefined : fabricTypes.length,
    models: modelsRes == null ? undefined : models.length,
    items: itemsRes == null ? undefined : items.length,
    motors: motorsRes == null ? undefined : motors.length,
    charges: chargesRes == null ? undefined : charges.length,
  };
  const dataArray = tabData[activeTab];
  const columns = tabColumns[activeTab];
  const primaryColumn = activeTab === 'items' ? 'model_name' : 'name';
  const modelOptions = useMemo(() => models.map((model) => ({
    value: String(model.id),
    label: model.name,
    suffix: `#${model.id}`,
    icon: <Grid3X3 aria-hidden="true" />,
  })), [models]);
  const workTypeOptions = useMemo(() => workTypes.map((workType) => ({
    value: String(workType.id),
    label: workType.name,
    suffix: `#${workType.id}`,
    icon: <Layers aria-hidden="true" />,
  })), [workTypes]);
  const fabricTypeOptions = useMemo(() => fabricTypes.map((fabricType) => ({
    value: String(fabricType.id),
    label: fabricType.name,
    suffix: `#${fabricType.id}`,
    icon: <Package aria-hidden="true" />,
  })), [fabricTypes]);
  const unitOptions = useMemo(() => [
    { value: 'flat', label: 'Flat', icon: <DollarSign aria-hidden="true" /> },
    { value: 'per_m2', label: 'Per m2', icon: <FileText aria-hidden="true" /> },
  ], []);
  const previewModel = models.find((model) => String(model.id) === String(formData.model ?? ''));
  const previewName = String(formData.name ?? '');
  const previewPrice = String(formData.price_per_unit ?? '');
  const previewPriceText = previewPrice ? formatMoney(previewPrice) : '0.00';
  const previewSummary = `${previewModel?.name || 'Model'}, ${previewName || 'Name'}, AED ${previewPriceText}`;
  const visibleCountLabel = searchQuery.trim()
    ? `Showing ${dataArray.length} of ${dataArray.length}`
    : `${dataArray.length} ${dataArray.length === 1 ? 'item' : 'items'}`;

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedCount(visibleCountLabel), 400);
    return () => clearTimeout(timer);
  }, [visibleCountLabel]);

  useEffect(() => {
    if (!formOpen || activeTab !== 'items') return;
    const timer = setTimeout(() => setPreviewAnnouncement(previewSummary), 400);
    return () => clearTimeout(timer);
  }, [formOpen, activeTab, previewSummary]);

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
      tabElement.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    };
    updateThumb();
    const observer = new ResizeObserver(updateThumb);
    if (tabListRef.current) observer.observe(tabListRef.current);
    Object.values(tabButtonRefs.current).forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [activeTab]);

  const handleTabScroll = () => {
    const tabList = tabListRef.current;
    if (!tabList) return;
    setTabEdges({
      left: tabList.scrollLeft > 0,
      right: tabList.scrollLeft + tabList.clientWidth < tabList.scrollWidth - 1,
    });
  };

  const activateTab = (tab: TabType) => {
    setTabDirection(catalogTabs.indexOf(tab) >= catalogTabs.indexOf(activeTab) ? 1 : -1);
    setFocusedTab(tab);
    setActiveTab(tab);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tab: TabType) => {
    const currentIndex = catalogTabs.indexOf(tab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % catalogTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + catalogTabs.length) % catalogTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = catalogTabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = catalogTabs[nextIndex];
    setFocusedTab(nextTab);
    tabButtonRefs.current[nextTab]?.focus();
    tabButtonRefs.current[nextTab]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  const isFieldEdited = (field: string, value: unknown) => {
    if (!editingItem || !initialValuesRef.current) return false;
    const initialValue = initialValuesRef.current[field];
    return field === 'model'
      ? String(value ?? '') !== String(initialValue ?? '')
      : value !== initialValue;
  };

  const openCreate = () => {
    if (activeTab === 'items' && models.length === 0) {
      showToast('Please add models first', 'error');
      return;
    }
    if (activeTab === 'fabric-types' && workTypes.length === 0) {
      showToast('Please add work types first', 'error');
      return;
    }
    if (activeTab === 'models' && fabricTypes.length === 0) {
      showToast('Please add fabric types first', 'error');
      return;
    }
    setEditingItem(null);
    initialValuesRef.current = null;
    setFormData({});
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    initialValuesRef.current = {
      model: item.model,
      name: item.name,
      price_per_unit: item.price_per_unit,
    };
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleSave = async () => {
    // Validate required fields based on active tab
    if (!formData.name || formData.name.trim() === '') {
      showToast('Name is required', 'error');
      return;
    }

    if (activeTab === 'fabric-types' && !formData.work_type) {
      showToast('Work Type is required', 'error');
      return;
    }

    if (activeTab === 'models' && !formData.fabric_type) {
      showToast('Fabric Type is required', 'error');
      return;
    }

    if (activeTab === 'items' && !formData.model) {
      showToast('Model is required', 'error');
      return;
    }

    if (activeTab === 'items' && (!formData.price_per_unit || formData.price_per_unit === '')) {
      showToast('Price Per Unit is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (activeTab === 'work-types') {
        if (editingItem) {
          await catalogApi.updateWorkType(editingItem.id, { name: formData.name, pricing_unit: formData.pricing_unit || 'm2', features: formData.features || { motor: false, charges: false, images: false } });
          showToast('Work type updated successfully', 'success');
        } else {
          await catalogApi.createWorkType({ name: formData.name, pricing_unit: formData.pricing_unit || 'm2', features: formData.features || { motor: false, charges: false, images: false } });
          showToast('Work type created successfully', 'success');
        }
        refetchWorkTypes();
      } else if (activeTab === 'fabric-types') {
        if (editingItem) {
          await catalogApi.updateFabricType(editingItem.id, { work_type: formData.work_type, name: formData.name });
          showToast('Fabric type updated successfully', 'success');
        } else {
          await catalogApi.createFabricType({ work_type: formData.work_type, name: formData.name });
          showToast('Fabric type created successfully', 'success');
        }
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        if (editingItem) {
          await catalogApi.updateModel(editingItem.id, { fabric_type: formData.fabric_type, name: formData.name });
          showToast('Model updated successfully', 'success');
        } else {
          await catalogApi.createModel({ fabric_type: formData.fabric_type, name: formData.name });
          showToast('Model created successfully', 'success');
        }
        refetchModels();
      } else if (activeTab === 'items') {
        if (editingItem) {
          await catalogApi.updateItem(editingItem.id, { model: formData.model, name: formData.name, price_per_unit: formData.price_per_unit });
          showToast('Item updated successfully', 'success');
        } else {
          await catalogApi.createItem({ model: formData.model, name: formData.name, price_per_unit: formData.price_per_unit });
          showToast('Item created successfully', 'success');
        }
        refetchItems();
      } else if (activeTab === 'motors') {
        if (editingItem) {
          await catalogApi.updateMotor(editingItem.id, { name: formData.name, price_per_m2: formData.price_per_m2 || '0' });
          showToast('Motor type updated successfully', 'success');
        } else {
          await catalogApi.createMotor({ name: formData.name, price_per_m2: formData.price_per_m2 || '0' });
          showToast('Motor type created successfully', 'success');
        }
        refetchMotors();
      } else if (activeTab === 'charges') {
        if (editingItem) {
          await catalogApi.updateCharge(editingItem.id, { name: formData.name, price: formData.price || '0', unit: formData.unit || 'flat' });
          showToast('Charge template updated successfully', 'success');
        } else {
          await catalogApi.createCharge({ name: formData.name, price: formData.price || '0', unit: formData.unit || 'flat' });
          showToast('Charge template created successfully', 'success');
        }
        refetchCharges();
      }
      setFormOpen(false);
      setFormData({});
    } catch (err: any) {
      console.error('Error saving:', err);
      showToast(err?.response?.data?.detail || err?.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (activeTab === 'work-types') {
        await catalogApi.deleteWorkType(deleteTarget.id);
        showToast('Work type deleted successfully', 'success');
        refetchWorkTypes();
      } else if (activeTab === 'fabric-types') {
        await catalogApi.deleteFabricType(deleteTarget.id);
        showToast('Fabric type deleted successfully', 'success');
        refetchFabricTypes();
      } else if (activeTab === 'models') {
        await catalogApi.deleteModel(deleteTarget.id);
        showToast('Model deleted successfully', 'success');
        refetchModels();
      } else if (activeTab === 'items') {
        await catalogApi.deleteItem(deleteTarget.id);
        showToast('Item deleted successfully', 'success');
        refetchItems();
      } else if (activeTab === 'motors') {
        await catalogApi.deleteMotor(deleteTarget.id);
        showToast('Motor type deleted successfully', 'success');
        refetchMotors();
      } else if (activeTab === 'charges') {
        await catalogApi.deleteCharge(deleteTarget.id);
        showToast('Charge template deleted successfully', 'success');
        refetchCharges();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete', 'error');
    }
  };

  const getTabLabel = (tab: TabType) => {
    const labels: Record<TabType, string> = {
      'work-types': 'Work Types',
      'fabric-types': 'Fabric Types',
      'models': 'Models',
      'items': 'Catalog Items',
      'motors': 'Motors',
      'charges': 'Charges',
    };
    return labels[tab];
  };

  const getTabIcon = (tab: TabType) => {
    const icons: Record<TabType, React.ReactNode> = {
      'work-types': <Layers className="w-4 h-4" />,
      'fabric-types': <Package className="w-4 h-4" />,
      'models': <Grid3X3 className="w-4 h-4" />,
      'items': <FileText className="w-4 h-4" />,
      'motors': <Zap className="w-4 h-4" />,
      'charges': <DollarSign className="w-4 h-4" />,
    };
    return icons[tab];
  };

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
                <span>{searchQuery.trim() ? 'Try a different search' : `Add your first ${getTabLabel(activeTab).toLowerCase()} to get started`}</span>
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
                              {column === 'id' ? (
                                <span className="catalog__id-chip">{text}</span>
                              ) : isPrimary ? (
                                <span className="catalog__primary-cell" title={text}>
                                  <span className="catalog__row-icon" aria-hidden="true">{getTabIcon(activeTab)}</span>
                                  <span className="catalog__truncate">{text}</span>
                                </span>
                              ) : isMoney ? (
                                <span className="catalog__money"><span className="catalog__currency">AED</span><strong>{formatMoney(value)}</strong></span>
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
                                <span className="catalog__unit-value">{text}</span>
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
            <p>Manage catalog items, work types, and pricing</p>
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

      <div className={`catalog__tab-frame${tabEdges.left ? ' catalog__tab-frame--left' : ''}${tabEdges.right ? ' catalog__tab-frame--right' : ''}`}>
        <div
          className="catalog__tablist"
          ref={tabListRef}
          role="tablist"
          aria-label="Catalog categories"
          onScroll={handleTabScroll}
        >
          <span
            className="catalog__tab-thumb"
            aria-hidden="true"
            style={{ width: tabThumb.width, transform: `translateX(${tabThumb.left}px)` }}
          />
          {catalogTabs.map((tab) => (
              <button
                key={tab}
                ref={(element) => {
                  if (element) tabButtonRefs.current[tab] = element;
                }}
                id={`catalog-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls="catalog-tabpanel"
                tabIndex={focusedTab === tab ? 0 : -1}
                className={`catalog__tab${activeTab === tab ? ' catalog__tab--active' : ''}`}
                onClick={() => activateTab(tab)}
                onFocus={() => setFocusedTab(tab)}
                onKeyDown={(event) => handleTabKeyDown(event, tab)}
              >
                <span className="catalog__tab-icon">{getTabIcon(tab)}</span>
                <span>{getTabLabel(tab)}</span>
                {tabCounts[tab] !== undefined && <span className="catalog__tab-count">{tabCounts[tab]}</span>}
              </button>
          ))}
        </div>
      </div>

      <section className="catalog__card" id="catalog-tabpanel" role="tabpanel" aria-labelledby={`catalog-tab-${activeTab}`}>
        <div className="catalog__toolbar">
          <div className="catalog__search-wrap">
            <Search className="catalog__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${getTabLabel(activeTab).toLowerCase()}...`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="catalog__search"
              aria-label={`Search ${getTabLabel(activeTab).toLowerCase()}`}
            />
            <kbd className="catalog__shortcut" aria-hidden="true">/</kbd>
            <button
              type="button"
              className={`catalog__clear-search${searchQuery ? ' catalog__clear-search--visible' : ''}`}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              tabIndex={searchQuery ? 0 : -1}
              aria-hidden={!searchQuery}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className={`catalog__result-count${searchQuery.trim() ? ' catalog__result-count--searching' : ''}`}>
            {searchQuery.trim() && <i aria-hidden="true" />}
            <span>{visibleCountLabel}</span>
          </div>
          <span className="catalog__live-count" aria-live="polite" aria-atomic="true">{announcedCount}</span>
        </div>
        <div className="catalog__content" key={`content-${activeTab}`}>
          {renderContent()}
        </div>
      </section>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingItem ? `Edit ${getTabLabel(activeTab)}` : `Create ${getTabLabel(activeTab)}`}
        maxWidth="max-w-2xl"
        variant="catalog-item"
        subtitle={activeTab === 'items'
          ? `${editingItem ? 'Update' : 'Add'} the model, name and price`
          : `${editingItem ? 'Update' : 'Add'} ${getTabLabel(activeTab).toLowerCase()} details`}
        isBusy={saving}
        headerBadgeContent={getTabIcon(activeTab)}
        footer={
          <div className="catalog-item-form-footer">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="catalog-item-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={activeTab === 'items' ? 'catalog-item-form' : 'catalog-general-form'}
              disabled={saving}
              aria-busy={saving}
              className="catalog-item-submit"
            >
              {saving ? <Loader2 className="catalog-item-submit-spinner" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              <span>{saving ? 'Saving…' : editingItem ? 'Update' : 'Create'}</span>
            </button>
            {activeTab === 'items' && (
              <span className="catalog-item-submit-hint"><kbd>↵</kbd> Enter to {editingItem ? 'update' : 'create'}</span>
            )}
          </div>
        }
      >
        {activeTab === 'items' ? (
          <form
            id="catalog-item-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
            className="catalog-item-form"
          >
            <div className="catalog-item-field catalog-item-model-field">
              <div className="catalog-item-label-row">
                <label id="catalog-model-label">Model<span className="catalog-item-required" aria-hidden="true">*</span></label>
                {isFieldEdited('model', formData.model) && <span className="catalog-item-edited"><i />Edited</span>}
              </div>
              <SelectMenu
                id="catalog-model-select"
                value={String(formData.model ?? '')}
                options={modelOptions}
                onChange={(value) => setFormData({ ...formData, model: value })}
                placeholder="Select model"
                ariaLabel="Model"
                ariaLabelledBy="catalog-model-label"
                searchable={models.length > 6}
                searchPlaceholder="Search models"
                showOptionSuffix
                showSearchClear
                showPlaceholderOnEmpty
                required
                emptyMessage={models.length === 0 ? 'No models available' : 'No matching models'}
                mobileTitle="Model"
                className="catalog-model-select"
                menuClassName="catalog-model-menu catalog-select-menu"
                autoFocus
                portalZIndex={1300}
                maxListHeight={320}
                preventScrollFocus
                preserveScrollLock
                positionBeforePaint
                keepMountedOnClose
                outsidePointerDown
                stopEscapePropagation
                selectionCloseDelayMs={120}
                showTriggerTitle
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
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
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
                    inputMode="decimal"
                    value={formData.price_per_unit || ''}
                    onChange={(event) => setFormData({ ...formData, price_per_unit: event.target.value })}
                    placeholder="e.g. 150.00"
                    autoComplete="off"
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
                  <span className={previewModel ? '' : 'is-placeholder'} title={previewModel?.name || 'Model'}>
                    {previewModel?.name || 'Model'}
                  </span>
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
              <span className="catalog-item-preview-announcement">{previewAnnouncement}</span>
            </div>
          </form>
        ) : (
        <form
          id="catalog-general-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="catalog-general-form"
        >
            <div className="catalog-modal-fields-grid">
              {activeTab === 'work-types' && (
                <>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Roller" />
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Pricing Unit" value={formData.pricing_unit || ''} onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })} placeholder="e.g. m2" />
                  </div>
                </>
              )}

              {activeTab === 'fabric-types' && (
                <>
                  <div className="sm:col-span-2">
                    <div className="catalog-select-field">
                      <label id="catalog-work-type-label">Work Type<span className="catalog-select-required" aria-hidden="true">*</span></label>
                      <SelectMenu
                        id="catalog-work-type"
                        value={String(formData.work_type || '')}
                        options={workTypeOptions}
                        onChange={(value) => setFormData({ ...formData, work_type: value })}
                        placeholder="Select work type"
                        ariaLabel="Work Type"
                        ariaLabelledBy="catalog-work-type-label"
                        required
                        searchable={workTypeOptions.length > 6}
                        showPlaceholderOnEmpty
                        emptyMessage={workTypeOptions.length ? 'No matching options' : 'No options available'}
                        mobileTitle="Work Type"
                        className="catalog-model-select"
                        menuClassName="catalog-model-menu catalog-select-menu"
                        portalZIndex={1300}
                        maxListHeight={320}
                        preventScrollFocus
                        preserveScrollLock
                        positionBeforePaint
                        keepMountedOnClose
                        outsidePointerDown
                        stopEscapePropagation
                        selectionCloseDelayMs={120}
                        showTriggerTitle
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Blackout" />
                  </div>
                </>
              )}

              {activeTab === 'models' && (
                <>
                  <div className="sm:col-span-2">
                    <div className="catalog-select-field">
                      <label id="catalog-fabric-type-label">Fabric Type<span className="catalog-select-required" aria-hidden="true">*</span></label>
                      <SelectMenu
                        id="catalog-fabric-type"
                        value={String(formData.fabric_type || '')}
                        options={fabricTypeOptions}
                        onChange={(value) => setFormData({ ...formData, fabric_type: value })}
                        placeholder="Select fabric type"
                        ariaLabel="Fabric Type"
                        ariaLabelledBy="catalog-fabric-type-label"
                        required
                        searchable={fabricTypeOptions.length > 6}
                        showPlaceholderOnEmpty
                        emptyMessage={fabricTypeOptions.length ? 'No matching options' : 'No options available'}
                        mobileTitle="Fabric Type"
                        className="catalog-model-select"
                        menuClassName="catalog-model-menu catalog-select-menu"
                        portalZIndex={1300}
                        maxListHeight={320}
                        preventScrollFocus
                        preserveScrollLock
                        positionBeforePaint
                        keepMountedOnClose
                        outsidePointerDown
                        stopEscapePropagation
                        selectionCloseDelayMs={120}
                        showTriggerTitle
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Classic" />
                  </div>
                </>
              )}

              {activeTab === 'motors' && (
                <>
                  <div>
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Tubular" />
                  </div>
                  <div>
                    <FormInput type="number" step="0.01" label="Price Per m2" value={formData.price_per_m2 || ''} onChange={(e) => setFormData({ ...formData, price_per_m2: e.target.value })} placeholder="e.g. 120.00" />
                  </div>
                </>
              )}

              {activeTab === 'charges' && (
                <>
                  <div className="sm:col-span-2">
                    <FormInput label="Name" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Manual Control" />
                  </div>
                  <div>
                    <FormInput type="number" step="0.01" label="Price" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g. 50.00" />
                  </div>
                  <div>
                    <div className="catalog-select-field">
                      <label id="catalog-charge-unit-label">Unit</label>
                      <SelectMenu
                        id="catalog-charge-unit"
                        value={String(formData.unit || 'flat')}
                        options={unitOptions}
                        onChange={(value) => setFormData({ ...formData, unit: value })}
                        placeholder="Unit"
                        ariaLabel="Unit"
                        ariaLabelledBy="catalog-charge-unit-label"
                        mobileTitle="Unit"
                        className="catalog-model-select"
                        menuClassName="catalog-model-menu catalog-select-menu"
                        portalZIndex={1300}
                        maxListHeight={320}
                        preventScrollFocus
                        preserveScrollLock
                        positionBeforePaint
                        keepMountedOnClose
                        outsidePointerDown
                        stopEscapePropagation
                        selectionCloseDelayMs={120}
                        showTriggerTitle
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
        </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget ? getTabLabel(activeTab) : 'Item'}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
}
