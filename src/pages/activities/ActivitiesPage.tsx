import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, Loader2, Search } from 'lucide-react';
import { activitiesApi } from '../../api/activities';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import type { ActivityLog } from '../../types';

const targetTypeOptions = ['all', 'worktype', 'fabrictype', 'model', 'item', 'motor', 'charge'];

export default function ActivitiesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const pagination = usePagination();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    pagination.resetPage();
  }, [selectedType, debouncedSearch]);

  const activitiesQuery = useQuery({
    queryKey: ['activities', 'logs', selectedType, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => activitiesApi.list({
      ...(selectedType !== 'all' ? { content_type: selectedType } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: pagination.limit,
      offset: pagination.offset,
    }),
  });

  const { logs, totalCount }: { logs: ActivityLog[]; totalCount: number } = useMemo(() => {
    const raw = activitiesQuery.data?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { logs: (raw as any).results as ActivityLog[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { logs: raw as ActivityLog[], totalCount: raw.length };
    if (Array.isArray(activitiesQuery.data)) return { logs: activitiesQuery.data as unknown as ActivityLog[], totalCount: (activitiesQuery.data as any).length };
    return { logs: [] as ActivityLog[], totalCount: 0 };
  }, [activitiesQuery.data]);

  const filteredLogs = logs;

  const isLoading = activitiesQuery.isLoading;
  const isError = activitiesQuery.isError;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Activity</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Recent Activity</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity logs"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
            >
              {targetTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All targets' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading activity logs…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center gap-2 py-16 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Unable to load activity logs.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No activity logs match your filters.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{log.target_type}</div>
                        <div className="text-xs text-slate-500">#{log.target_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{log.user_email}</div>
                        <div className="text-xs text-slate-500">User #{log.user}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{JSON.stringify(log.details ?? {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          totalCount={totalCount}
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
