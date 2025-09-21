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
          {/* filter inputs */}
          {/* ... same form inputs as before ... */}
          {/* buttons + preview list */}
        </div>
      </div>
    </div>
  );
}
