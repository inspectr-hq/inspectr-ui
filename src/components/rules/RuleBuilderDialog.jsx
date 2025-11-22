// src/components/rules/RuleBuilderDialog.jsx
import React from 'react';

export default function RuleBuilderDialog({
  open,
  title,
  description,
  onClose,
  children,
  footer = null,
  showFooter = true,
  onReset,
  onSave,
  saving = false,
  isEditing = false,
  formId
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
      <div className="flex max-h-[94vh] w-full max-w-[70%] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close builder dialog"
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
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {(footer || showFooter) && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
            {footer || (
              <div className="flex items-center justify-end gap-3">
                {onReset ? (
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                  >
                    {isEditing ? 'Cancel edit' : 'Reset'}
                  </button>
                ) : null}
                <button
                  type={formId ? 'submit' : 'button'}
                  form={formId}
                  onClick={!formId ? onSave : undefined}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  {saving ? 'Saving…' : isEditing ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
