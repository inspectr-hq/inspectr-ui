// src/components/RuleApplyHistoryDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';

export default function RuleApplyHistoryDialog({
  open,
  rule,
  onClose,
  onPreview,
  onApply,
  loading,
  applying,
  error,
  preview
}) {
  const [filters, setFilters] = useState({
    since: '',
    until: '',
    method: '',
    path: '',
    host: '',
    tagsAll: '',
    tagsAny: '',
    statuses: ''
  });

  useEffect(() => {
    if (!open) return;
    // reset filters and preview when opening
    setFilters({
      since: '',
      until: '',
      method: '',
      path: '',
      host: '',
      tagsAll: '',
      tagsAny: '',
      statuses: ''
    });
  }, [open, rule?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const parseArrays = () => {
    const toArray = (v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const toNums = (v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
    return {
      since: filters.since ? new Date(filters.since) : undefined,
      until: filters.until ? new Date(filters.until) : undefined,
      method: filters.method || undefined,
      path: filters.path || undefined,
      host: filters.host || undefined,
      tagsAll: filters.tagsAll ? toArray(filters.tagsAll) : undefined,
      tagsAny: filters.tagsAny ? toArray(filters.tagsAny) : undefined,
      statuses: filters.statuses ? toNums(filters.statuses) : undefined
    };
  };

  const previewList = useMemo(() => {
    if (!preview) return [];
    const candidates =
      preview.matches ||
      preview.operations ||
      preview.items ||
      preview.sample ||
      preview.sampled ||
      preview.preview ||
      [];
    return Array.isArray(candidates) ? candidates.slice(0, 5) : [];
  }, [preview]);

  const renderItem = (item, idx) => {
    const method = item.method || item.req_method || item.http_method;
    const path = item.path || item.req_path || item.url || item.request_path;
    const status = item.status || item.res_status || item.http_status;
    const at = item.time || item.ts || item.timestamp || item.at;
    return (
      <li
        key={idx}
        className="rounded border border-gray-200 bg-white p-3 text-xs dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-wrap items-center gap-2">
          {method && (
            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {method}
            </span>
          )}
          {path && <span className="truncate text-gray-800 dark:text-gray-200">{path}</span>}
          {status != null && (
            <span className="ml-auto inline-flex items-center rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {String(status)}
            </span>
          )}
        </div>
        {at && <div className="mt-1 text-gray-500 dark:text-gray-400">{String(at)}</div>}
        {!method && !path && !status && (
          <pre className="mt-2 overflow-auto text-[10px] leading-tight text-gray-600 dark:text-gray-400">
            {JSON.stringify(item, null, 2)}
          </pre>
        )}
      </li>
    );
  };

  return !open ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Apply “{rule?.name}” to history
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optionally set filters, preview the top 5 matches, then apply.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Since
              <input
                type="datetime-local"
                name="since"
                value={filters.since}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Until
              <input
                type="datetime-local"
                name="until"
                value={filters.until}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Method
              <input
                type="text"
                name="method"
                placeholder="GET"
                value={filters.method}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Path contains
              <input
                type="text"
                name="path"
                placeholder="/api/users"
                value={filters.path}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Host
              <input
                type="text"
                name="host"
                placeholder="api.example.com"
                value={filters.host}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Tags (all)
              <input
                type="text"
                name="tagsAll"
                placeholder="tag1,tag2"
                value={filters.tagsAll}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Tags (any)
              <input
                type="text"
                name="tagsAny"
                placeholder="tagA,tagB"
                value={filters.tagsAny}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Status codes
              <input
                type="text"
                name="statuses"
                placeholder="200,404"
                value={filters.statuses}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPreview(parseArrays())}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-50 dark:hover:bg-gray-800"
            >
              {loading ? 'Previewing…' : 'Preview top 5'}
            </button>
            <button
              type="button"
              onClick={() => onApply(parseArrays())}
              disabled={applying}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {applying ? 'Applying…' : 'Apply now'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>

          {previewList.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Top 5 preview
              </h4>
              <ul className="mt-2 space-y-2">{previewList.map(renderItem)}</ul>
            </div>
          )}

          {!loading && preview && previewList.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No matching operations found for the selected filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const RuleTemplateDialog = ({
  open,
  groupedTemplates,
  loading,
  error,
  onClose,
  onRetry,
  onSelect
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Start from a template
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a starter rule and customise it to fit your automation workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close template dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-6 sm:px-6">
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading templates…</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Try again
              </button>
            </div>
          ) : groupedTemplates.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No templates available right now.
            </p>
          ) : (
            <div className="space-y-6">
              {groupedTemplates.map((group) => (
                <section key={group.id} className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {group.label}
                    </h4>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.items.map((template) => (
                      <div
                        key={template.id}
                        className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="space-y-2">
                          <h5 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                            {template.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                          <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                            <p>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Event:
                              </span>{' '}
                              {template.event}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Actions:
                              </span>{' '}
                              {template.actions?.length || 0}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelect(template)}
                          className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          Use template
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
