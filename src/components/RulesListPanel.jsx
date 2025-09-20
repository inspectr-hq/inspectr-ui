// src/components/RulesListPanel.jsx
import React, { useMemo } from 'react';
import {
  aggregatorHints,
  extractConditions,
  operatorLabelMap,
  formatConditionValue,
  getActionDisplayName,
  formatActionParams,
  formatUpdateLabel
} from '../utils/rulesHelpers.js';

const StepIcon = ({ variant }) => {
  if (variant === 'event') {
    return (
      <span
        className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-orange-600 dark:bg-orange-500"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-white"
          aria-hidden="true"
        >
          <path d="M12 2v14" />
          <path d="m19 9-7 7-7-7" />
          <circle cx="12" cy="21" r="1" />
        </svg>
      </span>
    );
  }

  if (variant === 'condition') {
    return (
      <span
        className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-sky-500 dark:bg-sky-500"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-white"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
          <path d="M9 11.2h5.7" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-emerald-500 dark:bg-emerald-500"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 shrink-0 text-white"
        aria-hidden="true"
      >
        <path d="M22 12A10 10 0 1 1 12 2" />
        <path d="M22 2 12 12" />
        <path d="M16 2h6v6" />
      </svg>
    </span>
  );
};

const buildRuleSteps = (rule, eventMap) => {
  const aggregator = String(rule.expression?.op || 'and').toLowerCase();
  const aggregatorText = aggregatorHints[aggregator];
  const eventMeta = eventMap[rule.event] || {};
  const eventTitle = eventMeta.name || rule.event;
  const eventDescriptionParts = [rule.description, eventMeta.description, aggregatorText].filter(
    Boolean
  );

  const steps = [
    {
      variant: 'event',
      title: eventTitle,
      description: eventDescriptionParts.join(' · ')
    }
  ];

  const conditions = extractConditions(rule.expression);
  conditions.forEach((condition, index) => {
    const operatorLabel = operatorLabelMap[condition.op] || condition.op;
    const valueText = formatConditionValue(condition.right);
    const descriptionParts = [];
    if (condition.left?.path) descriptionParts.push(condition.left.path);
    if (condition.right?.path) descriptionParts.push(`Compare to ${condition.right.path}`);
    steps.push({
      variant: 'condition',
      title: `Condition ${index + 1}: ${operatorLabel} ${valueText}`,
      description: descriptionParts.join(' · ')
    });
  });

  (rule.actions || []).forEach((action, index) => {
    steps.push({
      variant: 'action',
      title: `Action ${index + 1}: ${getActionDisplayName(action.type)}`,
      description: formatActionParams(action.params)
    });
  });

  return steps;
};

const RulesListPanel = ({
  rules,
  events,
  loading,
  error,
  isRefreshing,
  openRuleId,
  onToggleRule,
  onRefresh,
  onEditRule,
  onDeleteRule
}) => {
  const eventMap = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.type] = event;
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#090E1A]">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Applied Rules</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of automation rules currently available on your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || loading}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading rules…</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : rules.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            No rules have been defined yet. Create a new rule using the builder.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => {
              const isOpen = openRuleId === rule.id;
              const steps = buildRuleSteps(rule, eventMap);
              const updatedLabel = formatUpdateLabel(rule.updated_at || rule.created_at);

              return (
                <div
                  key={rule.id || rule.name}
                  className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800"
                >
                  <button
                    type="button"
                    onClick={() => onToggleRule(isOpen ? null : rule.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900/40"
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="truncate">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                          {rule.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                          {rule.description || 'No description provided'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${rule.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
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
                            aria-hidden="true"
                          >
                            {rule.active ? (
                              <>
                                <path d="m9 11 3 3L22 4" />
                                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                              </>
                            ) : (
                              <circle cx="12" cy="12" r="10" />
                            )}
                          </svg>
                          {rule.active ? 'Live' : 'Inactive'}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`size-5 shrink-0 transition-transform duration-150 text-gray-400 dark:text-gray-600 ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                      <div className="overflow-hidden pb-4 text-sm text-gray-700 dark:text-gray-200">
                        <div className="mx-auto flex w-full items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-500">
                          <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800" />
                        </div>
                        <ul role="list" className="mt-6 space-y-6" aria-label="Rule steps">
                          {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;
                            return (
                              <li
                                key={`${rule.id}-step-${index}`}
                                className="relative flex gap-x-4"
                              >
                                {!isLast && (
                                  <div className="-bottom-6 absolute left-0 top-0 flex w-9 justify-center">
                                    <div className="w-px bg-gray-200 dark:bg-gray-800" />
                                  </div>
                                )}
                                <StepIcon variant={step.variant} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                    {index + 1}. {step.title}
                                  </p>
                                  {step.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {step.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                          <time className="flex-none text-xs leading-5 text-gray-500 dark:text-gray-500">
                            {updatedLabel ? `Updated ${updatedLabel}` : 'Updated recently'}
                          </time>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEditRule(rule)}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/30"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-settings -ml-0.5 size-4 shrink-0"
                                aria-hidden="true"
                              >
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRule(rule)}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-rose-500 dark:hover:bg-gray-800/30"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-trash2 -ml-0.5 size-4 shrink-0"
                                aria-hidden="true"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleRule(null)}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/30"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesListPanel;
