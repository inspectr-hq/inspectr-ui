// src/components/RuleExportDialog.jsx
import React, { useMemo } from 'react';
import { serializeRuleForExport, stringifyRuleExport } from '../utils/rulesHelpers.js';
import { CopyButton } from './index.jsx';

export default function RuleExportDialog({ open, rule, onClose }) {
  const exportObject = useMemo(() => serializeRuleForExport(rule), [rule]);
  const exportText = useMemo(() => stringifyRuleExport(rule), [rule]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
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
              <CopyButton
                textToCopy={exportText}
                showLabel
                labelText="Copy"
                copiedText="Copied"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              />
            </label>
            <textarea
              value={exportText}
              readOnly
              rows={14}
              className="mt-2 block w-full resize-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#0B101F] dark:text-gray-100 dark:focus:border-blue-700 dark:focus:ring-blue-800/50"
            />
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
