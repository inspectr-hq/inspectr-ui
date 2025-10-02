// src/components/RuleExportDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { serializeRuleForExport, stringifyRuleExport } from '../utils/rulesHelpers.js';

export default function RuleExportDialog({ open, rule, onClose }) {
  const exportObject = useMemo(() => serializeRuleForExport(rule), [rule]);
  const exportText = useMemo(() => stringifyRuleExport(rule), [rule]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (!open) {
      setCopyStatus('');
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      console.error('Failed to copy rule export', error);
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Export rule</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Copy the JSON representation below to move this rule between workspaces or share with
              a teammate.
            </p>
            {exportObject?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-500">Rule: {exportObject.name}</p>
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
          <div>
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span>Rule export JSON</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                >
                  <rect width="12" height="12" x="9" y="9" rx="2" ry="2" />
                  <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                </svg>
                Copy
              </button>
            </label>
            <textarea
              value={exportText}
              readOnly
              rows={14}
              className="mt-2 block w-full resize-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#0B101F] dark:text-gray-100 dark:focus:border-blue-700 dark:focus:ring-blue-800/50"
            />
            {copyStatus && (
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">{copyStatus}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
