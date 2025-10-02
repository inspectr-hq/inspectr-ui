// src/components/RuleImportDialog.jsx
import React, { useEffect, useState } from 'react';
import { parseRuleImport } from '../utils/rulesHelpers.js';

export default function RuleImportDialog({ open, onCancel, onImport }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setInput('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleImport = () => {
    try {
      const parsed = parseRuleImport(input);
      onImport?.(parsed);
    } catch (err) {
      setError(
        err?.message || 'Failed to import rule. Confirm the JSON matches the export format.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Import rule</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Paste the JSON that was generated from the rule export dialog. You can review and
              modify everything before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close import dialog"
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
          <div>
            <label
              htmlFor="rule-import-json"
              className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Paste exported JSON
            </label>
            <textarea
              id="rule-import-json"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={14}
              placeholder={`{\n  "name": "Large transaction alert",\n  "aggregator": "and",\n  ...\n}`}
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#0B101F] dark:text-gray-100 dark:focus:border-blue-700 dark:focus:ring-blue-800/50"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              The importer accepts the same structure produced by the export dialog (name,
              aggregator, conditions, and actions).
            </p>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Import and edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
