// src/components/RuleExportDialog.jsx
import React, { useMemo, useState } from 'react';
import { useInspectr } from '../context/InspectrContext.jsx';

export default function RuleExportDialog({ open, rule, onClose }) {
  const { client, setToast } = useInspectr();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const ruleName = useMemo(() => rule?.name || 'All rules', [rule]);

  if (!open) return null;

  const handleDownload = async () => {
    if (!client?.rules?.export) return;
    setDownloading(true);
    setError('');
    try {
      const { blob, filename } = await client.rules.export({ id: rule?.id });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'rules.yaml';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast?.({ type: 'success', message: `Downloaded ${filename || 'rules.yaml'}` });
      onClose?.();
    } catch (err) {
      console.error('Export download failed', err);
      setError(err?.message || 'Failed to export rules');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Export rules</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download YAML export{rule?.name ? ` for "${ruleName}"` : ''}.
            </p>
            {rule?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-500">Rule: {ruleName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close export dialog"
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
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {downloading ? 'Preparing…' : 'Download rules.yaml'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
