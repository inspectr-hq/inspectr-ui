// src/components/RuleTemplateDialog.jsx
import React from 'react';

export default function RuleTemplateDialog({
  open,
  groupedTemplates,
  loading,
  error,
  onClose,
  onRetry,
  onSelect
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
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
}
