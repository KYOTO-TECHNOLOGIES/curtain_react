import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  Layers3,
  Box,
  Tag,
  Coins,
  Database,
} from 'lucide-react';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { catalogApi } from '../../api/catalog';

type CatalogTabKey = 'workTypes' | 'fabricTypes' | 'models' | 'items' | 'motors' | 'charges';

type CatalogFormState = {
  name?: string;
  work_type?: number | string;
  fabric_type?: number | string;
  model?: number | string;
  price_per_unit?: string;
  price_per_m2?: string;
  price?: string;
  unit?: string;
  pricing_unit?: string;
  features?: {
    motor: boolean;
    charges: boolean;
    images: boolean;
  };
};

const tabConfig: Array<{
  key: CatalogTabKey;
  label: string;
  icon: typeof Database;
}> = [
  { key: 'workTypes', label: 'Work Types', icon: Wrench },
  { key: 'fabricTypes', label: 'Fabric Types', icon: Layers3 },
  { key: 'models', label: 'Models', icon: Box },
  { key: 'items', label: 'Items', icon: Tag },
  { key: 'motors', label: 'Motors', icon: Database },
  { key: 'charges', label: 'Charges', icon: Coins },
];

const initialForm: CatalogFormState = {
  name: '',
  work_type: '',
  fabric_type: '',
  model: '',
  price_per_unit: '',
  price_per_m2: '',
  price: '',
  unit: '',
  pricing_unit: 'm2',
  features: {
    motor: false,
    charges: false,
    images: false,
  },
};

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogTabKey>('workTypes');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ key: CatalogTabKey; id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formState, setFormState] = useState<CatalogFormState>(initialForm);

  const workTypesQuery = useQuery({
    queryKey: ['catalog', 'workTypes'],
    queryFn: () => catalogApi.workTypes.list(),
  });

  const fabricTypesQuery = useQuery({
    queryKey: ['catalog', 'fabricTypes'],
    queryFn: () => catalogApi.fabricTypes.list(),
  });

  const modelsQuery = useQuery({
    queryKey: ['catalog', 'models'],
    queryFn: () => catalogApi.models.list(),
  });

  const itemsQuery = useQuery({
    queryKey: ['catalog', 'items'],
    queryFn: () => catalogApi.items.list(),
  });

  const motorsQuery = useQuery({
    queryKey: ['catalog', 'motors'],
    queryFn: () => catalogApi.motors.list(),
  });

  const chargesQuery = useQuery({
    queryKey: ['catalog', 'charges'],
    queryFn: () => catalogApi.charges.list(),
  });

  const resourceDataMap = {
    workTypes: workTypesQuery.data?.data ?? [],
    fabricTypes: fabricTypesQuery.data?.data ?? [],
    models: modelsQuery.data?.data ?? [],
    items: itemsQuery.data?.data ?? [],
    motors: motorsQuery.data?.data ?? [],
    charges: chargesQuery.data?.data ?? [],
  } as const;

  const currentData = (resourceDataMap[activeTab] ?? []) as unknown as Array<Record<string, unknown>>;

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? currentData.filter((item) => JSON.stringify(item).toLowerCase().includes(normalizedSearch))
      : currentData;

    return [...filtered].sort((a, b) => {
      const left = a[sortBy] ?? '';
      const right = b[sortBy] ?? '';
      const dir = sortDir === 'asc' ? 1 : -1;

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * dir;
      }

      return String(left).localeCompare(String(right)) * dir;
    });
  }, [currentData, search, sortBy, sortDir]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPageData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const openCreateForm = () => {
    setFormState(initialForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (item: Record<string, unknown>) => {
    const nextState: CatalogFormState = {
      name: typeof item.name === 'string' ? item.name : '',
      work_type:
        typeof item.work_type === 'number' || typeof item.work_type === 'string' ? item.work_type : '',
      fabric_type:
        typeof item.fabric_type === 'number' || typeof item.fabric_type === 'string' ? item.fabric_type : '',
      model:
        typeof item.model === 'number' || typeof item.model === 'string' ? item.model : '',
      price_per_unit: typeof item.price_per_unit === 'string' ? item.price_per_unit : '',
      price_per_m2: typeof item.price_per_m2 === 'string' ? item.price_per_m2 : '',
      price: typeof item.price === 'string' ? item.price : '',
      unit: typeof item.unit === 'string' ? item.unit : '',
      pricing_unit: typeof item.pricing_unit === 'string' ? item.pricing_unit : 'm2',
      features: {
        motor: Boolean((item.features as { motor?: boolean } | undefined)?.motor),
        charges: Boolean((item.features as { charges?: boolean } | undefined)?.charges),
        images: Boolean((item.features as { images?: boolean } | undefined)?.images),
      },
    };

    setFormState(nextState);
    setEditingId(Number(item.id));
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {};
      const name = formState.name?.trim();

      if (!name) {
        throw new Error('Name is required.');
      }

      payload.name = name;

      if (activeTab === 'fabricTypes' || activeTab === 'models' || activeTab === 'items') {
        if (!formState.work_type && activeTab === 'fabricTypes') {
          throw new Error('Work type is required.');
        }
        if (!formState.fabric_type && activeTab === 'models') {
          throw new Error('Fabric type is required.');
        }
        if (!formState.model && activeTab === 'items') {
          throw new Error('Model is required.');
        }
      }

      if (activeTab === 'workTypes') {
        payload.pricing_unit = formState.pricing_unit ?? 'm2';
        payload.features = formState.features ?? { motor: false, charges: false, images: false };
      }

      if (activeTab === 'fabricTypes' && formState.work_type) {
        payload.work_type = Number(formState.work_type);
      }

      if (activeTab === 'models' && formState.fabric_type) {
        payload.fabric_type = Number(formState.fabric_type);
      }

      if (activeTab === 'items') {
        if (!formState.model) {
          throw new Error('Model is required.');
        }
        payload.model = Number(formState.model);
        if (formState.price_per_unit) {
          payload.price_per_unit = formState.price_per_unit;
        }
      }

      if (activeTab === 'motors') {
        payload.price_per_m2 = formState.price_per_m2 ?? '';
      }

      if (activeTab === 'charges') {
        payload.price = formState.price ?? '';
        payload.unit = formState.unit ?? 'unit';
      }

      if (editingId !== null) {
        switch (activeTab) {
          case 'workTypes':
            await catalogApi.workTypes.update(editingId, payload);
            break;
          case 'fabricTypes':
            await catalogApi.fabricTypes.update(editingId, payload);
            break;
          case 'models':
            await catalogApi.models.update(editingId, payload);
            break;
          case 'items':
            await catalogApi.items.update(editingId, payload);
            break;
          case 'motors':
            await catalogApi.motors.update(editingId, payload);
            break;
          case 'charges':
            await catalogApi.charges.update(editingId, payload);
            break;
          default:
            break;
        }
      } else {
        switch (activeTab) {
          case 'workTypes':
            await catalogApi.workTypes.create(payload);
            break;
          case 'fabricTypes':
            await catalogApi.fabricTypes.create(payload);
            break;
          case 'models':
            await catalogApi.models.create(payload);
            break;
          case 'items':
            await catalogApi.items.create(payload);
            break;
          case 'motors':
            await catalogApi.motors.create(payload);
            break;
          case 'charges':
            await catalogApi.charges.create(payload);
            break;
          default:
            break;
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['catalog', 'workTypes'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'fabricTypes'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'models'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'motors'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'charges'] }),
      ]);

      setFormOpen(false);
      setFormState(initialForm);
      setEditingId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save catalog entry.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      switch (deleteTarget.key) {
        case 'workTypes':
          await catalogApi.workTypes.remove(deleteTarget.id);
          break;
        case 'fabricTypes':
          await catalogApi.fabricTypes.remove(deleteTarget.id);
          break;
        case 'models':
          await catalogApi.models.remove(deleteTarget.id);
          break;
        case 'items':
          await catalogApi.items.remove(deleteTarget.id);
          break;
        case 'motors':
          await catalogApi.motors.remove(deleteTarget.id);
          break;
        case 'charges':
          await catalogApi.charges.remove(deleteTarget.id);
          break;
        default:
          break;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['catalog', 'workTypes'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'fabricTypes'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'models'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'motors'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'charges'] }),
      ]);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const totals = {
    workTypes: workTypesQuery.data?.data?.length ?? 0,
    fabricTypes: fabricTypesQuery.data?.data?.length ?? 0,
    models: modelsQuery.data?.data?.length ?? 0,
    items: itemsQuery.data?.data?.length ?? 0,
    motors: motorsQuery.data?.data?.length ?? 0,
    charges: chargesQuery.data?.data?.length ?? 0,
  };

  const hasAnyError = [workTypesQuery, fabricTypesQuery, modelsQuery, itemsQuery, motorsQuery, chargesQuery].some(
    ({ isError }) => isError,
  );

  const isLoading = [workTypesQuery, fabricTypesQuery, modelsQuery, itemsQuery, motorsQuery, chargesQuery].some(
    ({ isLoading }) => isLoading,
  );

  const renderTable = () => {
    if (isLoading && !currentData.length) {
      return (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading catalog data…
        </div>
      );
    }

    if (hasAnyError && !currentData.length) {
      return (
        <div className="flex items-center justify-center gap-2 py-16 text-red-600">
          <AlertCircle className="w-5 h-5" />
          Unable to load catalog data.
        </div>
      );
    }

    const rows = currentPageData as Array<Record<string, unknown>>;

    if (!rows.length) {
      return (
        <div className="py-16 text-center text-slate-500">
          No catalog records found for this section.
        </div>
      );
    }

    const keyName = activeTab === 'items' ? 'name' : 'name';

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                {activeTab === 'fabricTypes' && <th className="px-4 py-3">Work Type</th>}
                {activeTab === 'models' && <th className="px-4 py-3">Fabric Type</th>}
                {activeTab === 'items' && <th className="px-4 py-3">Model</th>}
                {activeTab === 'workTypes' && <th className="px-4 py-3">Pricing Unit</th>}
                {activeTab === 'motors' && <th className="px-4 py-3">Price / m²</th>}
                {activeTab === 'charges' && <th className="px-4 py-3">Unit</th>}
                {activeTab === 'charges' && <th className="px-4 py-3">Price</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
              {rows.map((item) => (
                <tr key={String(item.id)} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{formatDisplayValue(item[keyName])}</td>
                  {activeTab === 'fabricTypes' && <td className="px-4 py-3">{formatDisplayValue(item.work_type_name ?? item.work_type)}</td>}
                  {activeTab === 'models' && <td className="px-4 py-3">{formatDisplayValue(item.fabric_type_name ?? item.fabric_type)}</td>}
                  {activeTab === 'items' && <td className="px-4 py-3">{formatDisplayValue(item.model_name ?? item.model)}</td>}
                  {activeTab === 'workTypes' && <td className="px-4 py-3">{formatDisplayValue(item.pricing_unit)}</td>}
                  {activeTab === 'motors' && <td className="px-4 py-3">{formatDisplayValue(item.price_per_m2)}</td>}
                  {activeTab === 'charges' && <td className="px-4 py-3">{formatDisplayValue(item.unit)}</td>}
                  {activeTab === 'charges' && <td className="px-4 py-3">{formatDisplayValue(item.price)}</td>}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ key: activeTab, id: Number(item.id), label: String(item.name || 'record') })}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFormFields = () => {
    const sharedNameField = (
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Name</span>
        <input
          value={formState.name ?? ''}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-0 transition focus:border-indigo-500"
          placeholder={`Enter ${tabConfig.find((tab) => tab.key === activeTab)?.label ?? 'record'} name`}
          required
        />
      </label>
    );

    if (activeTab === 'workTypes') {
      return (
        <div className="space-y-4">
          {sharedNameField}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Pricing Unit</span>
            <select
              value={formState.pricing_unit ?? 'm2'}
              onChange={(event) => setFormState((prev) => ({ ...prev, pricing_unit: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
            >
              <option value="m2">m²</option>
              <option value="item">Item</option>
              <option value="flat">Flat</option>
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Features</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'motor', label: 'Motor' },
                { key: 'charges', label: 'Charges' },
                { key: 'images', label: 'Images' },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formState.features?.[feature.key as keyof NonNullable<CatalogFormState['features']>])}
                    onChange={(event) =>
                      setFormState((prev) => {
                        const nextFeatures = {
                          motor: prev.features?.motor ?? false,
                          charges: prev.features?.charges ?? false,
                          images: prev.features?.images ?? false,
                        };
                        nextFeatures[feature.key as keyof typeof nextFeatures] = event.target.checked;

                        return {
                          ...prev,
                          features: nextFeatures,
                        };
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'fabricTypes') {
      return (
        <div className="space-y-4">
          {sharedNameField}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Work Type</span>
            <input
              type="number"
              value={formState.work_type ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, work_type: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="Work type ID"
              required
            />
          </label>
        </div>
      );
    }

    if (activeTab === 'models') {
      return (
        <div className="space-y-4">
          {sharedNameField}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Fabric Type</span>
            <input
              type="number"
              value={formState.fabric_type ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, fabric_type: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="Fabric type ID"
              required
            />
          </label>
        </div>
      );
    }

    if (activeTab === 'items') {
      return (
        <div className="space-y-4">
          {sharedNameField}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Model</span>
            <input
              type="number"
              value={formState.model ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, model: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="Model ID"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Price per unit</span>
            <input
              value={formState.price_per_unit ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, price_per_unit: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="e.g. 1250.00"
            />
          </label>
        </div>
      );
    }

    if (activeTab === 'motors') {
      return (
        <div className="space-y-4">
          {sharedNameField}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Price / m²</span>
            <input
              value={formState.price_per_m2 ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, price_per_m2: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="e.g. 180.00"
            />
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sharedNameField}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Price</span>
            <input
              value={formState.price ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="e.g. 75.00"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Unit</span>
            <input
              value={formState.unit ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500"
              placeholder="e.g. per item"
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Catalog</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Catalog & Pricing</h1>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add {tabConfig.find((tab) => tab.key === activeTab)?.label ?? 'Record'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tabConfig.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveTab(key);
              setPage(1);
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              activeTab === key
                ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">{label}</div>
                  <div className="text-2xl font-bold text-slate-900">{totals[key]}</div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search records"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Sort</label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="name">Name</option>
              {activeTab === 'items' && <option value="price_per_unit">Price</option>}
              {activeTab === 'motors' && <option value="price_per_m2">Price / m²</option>}
              {activeTab === 'charges' && <option value="price">Price</option>}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {sortDir === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>

        {renderTable()}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Showing {Math.min((page - 1) * pageSize + 1, filteredData.length)}-{Math.min(page * pageSize, filteredData.length)} of {filteredData.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-sm text-slate-600">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId !== null ? 'Edit catalog item' : 'Create catalog item'} maxWidth="max-w-lg">
        <form onSubmit={submitForm} className="space-y-5">
          {renderFormFields()}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {saving ? 'Saving…' : editingId !== null ? 'Save changes' : 'Create entry'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete catalog entry"
        message={`Are you sure you want to remove ${deleteTarget?.label ?? 'this record'}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </div>
  );
}
