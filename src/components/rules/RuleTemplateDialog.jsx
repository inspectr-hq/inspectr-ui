// src/components/rules/RuleTemplateDialog.jsx
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
  const [selectedGroupId, setSelectedGroupId] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setSelectedGroupId(null);
      setSearchTerm('');
      return;
    }

    if (groupedTemplates.length === 0) {
      setSelectedGroupId(null);
      return;
    }

    const hasSelectedGroup = groupedTemplates.some((group) => group.id === selectedGroupId);

    if (!hasSelectedGroup) {
      setSelectedGroupId(groupedTemplates[0]?.id ?? null);
    }
  }, [open, groupedTemplates, selectedGroupId]);

  const selectedGroup = React.useMemo(
    () => groupedTemplates.find((group) => group.id === selectedGroupId) ?? null,
    [groupedTemplates, selectedGroupId]
  );

  const filteredTemplates = React.useMemo(() => {
    if (!selectedGroup) return [];

    if (!searchTerm.trim()) {
      return selectedGroup.items;
    }

    const lowerSearch = searchTerm.toLowerCase();

    return selectedGroup.items.filter((template) => {
      const name = template.name?.toLowerCase() ?? '';
      const description = template.description?.toLowerCase() ?? '';

      return name.includes(lowerSearch) || description.includes(lowerSearch);
    });
  }, [selectedGroup, searchTerm]);

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
            <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
              <aside className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Template groups
                </h4>
                <div className="space-y-2">
                  {groupedTemplates.map((group) => {
                    const isSelected = group.id === selectedGroupId;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setSearchTerm('');
                        }}
                        className={`w-full rounded-md border px-4 py-3 text-left transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-100'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-blue-500/70 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{group.label}</p>
                            {group.description && (
                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {group.description}
                              </p>
                            )}
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {group.items.length}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {selectedGroup?.label ?? 'Select a group'}
                    </h4>
                    {selectedGroup?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedGroup.description}
                      </p>
                    )}
                  </div>
                  {selectedGroup && (
                    <div className="relative w-full sm:w-64">
                      <label htmlFor="template-search" className="sr-only">
                        Search templates
                      </label>
                      <input
                        id="template-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search templates"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-3.6-3.6" />
                      </svg>
                    </div>
                  )}
                </div>
                {!selectedGroup ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select a group to view its templates.
                  </p>
                ) : filteredTemplates.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                    No templates match your search in this group.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredTemplates.map((template) => (
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
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
