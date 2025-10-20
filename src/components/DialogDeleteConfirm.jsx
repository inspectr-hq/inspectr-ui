// src/components/DialogDeleteConfirm.jsx
import React from 'react';

export default function DialogDeleteConfirm({
  open,
  rule,
  isDeleting,
  error,
  onCancel,
  onConfirm,
  // Optional overrides for generic confirmations
  title,
  description,
  confirmLabel
}) {
  if (!open) return null;

  const finalTitle = title || 'Delete rule?';
  const finalDescription = description || (
    <>
      This will permanently remove <span className="font-medium">{rule?.name || 'this rule'}</span>.
      Actions triggered by this rule will no longer run.
    </>
  );
  const finalConfirm = confirmLabel || 'Delete Rule';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{finalTitle}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{finalDescription}</p>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-red-500 dark:hover:bg-red-400"
          >
            {isDeleting ? 'Deleting…' : finalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
