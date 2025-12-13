// src/components/rules/RulesListPanel.jsx
import React, { useMemo } from 'react';
import boltIcon from '../../assets/icons/bolt.svg';
import {
  aggregatorHints,
  extractConditions,
  formatConditionValue,
  getActionDisplayName,
  formatActionParams,
  formatUpdateLabel
} from '../../utils/rulesHelpers.js';
import ListPagination from '../ListPagination.jsx';

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

const buildRuleSteps = (rule, eventMap, operatorLabelMap) => {
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
    const operatorLabel = operatorLabelMap?.[condition.op] || condition.op;
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

// Prepare a duplicated rule: drop id, rename, and default to inactive
const makeCopyForCreate = (rule) => {
  if (!rule || typeof rule !== 'object') return null;
  const { id, updated_at, created_at, ...rest } = rule;
  const baseName = rule.name || 'Untitled rule';
  const copyName = `Copy of ${baseName}`;
  return { ...rest, name: copyName, active: false };
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
  onDeleteRule,
  onCreateRule,
  onStartFromTemplate,
  onApplyHistory,
  actionsDisabled = false,
  onDuplicateRule,
  onPauseRule,
  onExportRule,
  onImportRule,
  meta,
  licenseUsage = null,
  onPageChange,
  paginationAlwaysShow = false,
  operatorLabelMap = {}
}) => {
  const eventMap = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.type] = event;
      return acc;
    }, {});
  }, [events]);

  const totalRulesCount = typeof meta?.total === 'number' ? meta.total : rules.length;
  const limitFromLicense =
    typeof licenseUsage?.limit === 'number' && !Number.isNaN(licenseUsage.limit)
      ? licenseUsage.limit
      : null;
  const usedFromLicense =
    typeof licenseUsage?.used === 'number' && !Number.isNaN(licenseUsage.used)
      ? licenseUsage.used
      : null;
  const usedCount = Number.isFinite(usedFromLicense) ? usedFromLicense : totalRulesCount;
  const usageBadgeText =
    limitFromLicense !== null ? `${usedCount}/${limitFromLicense}` : `${usedCount}`;
  const limitReached =
    limitFromLicense !== null && Number.isFinite(usedCount) && usedCount >= limitFromLicense;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <img
              src={boltIcon}
              width={24}
              height={24}
              alt=""
              aria-hidden="true"
              className="inline-block"
            />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Rules</h2>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {usageBadgeText}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of automation rules currently available on your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onImportRule}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Import rule
          </button>
          <button
            type="button"
            onClick={onStartFromTemplate}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Start from template
          </button>
          <button
            type="button"
            onClick={onCreateRule}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Add rule
          </button>
          <button
            type="button"
            onClick={() => onRefresh && onRefresh()}
            title="Refresh rules"
            disabled={isRefreshing || loading}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {limitReached ? (
          <div className="my-2 flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800">
            {/* Left: icon + stacked text */}
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 dark:bg-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  />
                </svg>
              </span>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Rules limit reached
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  You have used all available rules within your plan. View available plans to unlock
                  more capacity.
                </p>
              </div>
            </div>

            <a
              href="https://inspectr.dev/pricing"
              target="_blank"
              rel="noreferrer noopener"
              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-center text-sm font-medium shadow-sm transition-all duration-100 ease-in-out disabled:pointer-events-none disabled:shadow-none outline outline-offset-2 outline-0 focus-visible:outline-2 outline-blue-500 dark:outline-blue-500 border-transparent text-white dark:text-white bg-yellow-500 dark:bg-yellow-500 hover:bg-yellow-600 dark:hover:bg-blue-600 disabled:bg-blue-300 disabled:text-white disabled:dark:bg-blue-800 disabled:dark:text-blue-400"
            >
              Discover Plans
            </a>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading rules…</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : rules.length === 0 ? (
          <div className="mt-8 flex h-96 min-h-full flex-1 flex-col justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Get started with rules
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Automate how Inspectr responds to captured operations. Add your first rule or choose a
              template to jump-start your automation flow.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreateRule}
                disabled={actionsDisabled || loading}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
              >
                Add rule
              </button>
              <button
                type="button"
                onClick={onStartFromTemplate}
                disabled={actionsDisabled || loading}
                className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/60 sm:w-auto"
              >
                Start from template
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => {
              const isOpen = openRuleId === rule.id;
              const steps = buildRuleSteps(rule, eventMap, operatorLabelMap);
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
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
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
                              onClick={() => onApplyHistory && onApplyHistory(rule)}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4 -ml-0.5 mr-1.5"
                                aria-hidden="true"
                              >
                                <path d="M19.3788 15.1057C20.9258 11.4421 19.5373 7.11431 16.0042 5.0745C13.4511 3.60046 10.4232 3.69365 8.03452 5.0556L7.04216 3.31879C10.028 1.61639 13.8128 1.4999 17.0042 3.34245C21.4949 5.93513 23.2139 11.4848 21.1217 16.112L22.4635 16.8867L18.2984 19.1008L18.1334 14.3867L19.3788 15.1057ZM4.62961 8.89968C3.08263 12.5633 4.47116 16.8911 8.00421 18.9309C10.5573 20.4049 13.5851 20.3118 15.9737 18.9499L16.9661 20.6867C13.9803 22.389 10.1956 22.5055 7.00421 20.663C2.51357 18.0703 0.794565 12.5206 2.88672 7.89342L1.54492 7.11873L5.70999 4.90463L5.87505 9.61873L4.62961 8.89968ZM13.4184 14.8311L10.59 12.0027L7.76157 14.8311L6.34736 13.4169L10.59 9.17428L13.4184 12.0027L16.2469 9.17428L17.6611 10.5885L13.4184 14.8311Z"></path>
                              </svg>
                              Apply to history
                            </button>
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
                                className="lucide lucide-settings -ml-0.5 mr-1.5 size-4 shrink-0"
                                aria-hidden="true"
                              >
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = makeCopyForCreate(rule);
                                if (!copy) return;
                                if (onDuplicateRule) {
                                  onDuplicateRule(copy);
                                } else if (onCreateRule) {
                                  // Fallback: open create flow prefilled with the copy
                                  onCreateRule(copy);
                                }
                              }}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/30"
                              title="Duplicate rule"
                              aria-label="Duplicate rule"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4 -ml-0.5 mr-1.5"
                              >
                                <path d="M9 7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V7z"></path>
                                <path d="M5 9a2 2 0 0 1 2-2h1v7a4 4 0 0 0 4 4h7v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9z"></path>
                              </svg>
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => onExportRule && onExportRule(rule)}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/30"
                              title="Export rule"
                              aria-label="Export rule"
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
                                className="-ml-0.5 mr-1.5 size-4"
                              >
                                <path d="M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                                <path d="M12 3v12" />
                                <path d="m8 11 4 4 4-4" />
                              </svg>
                              Export
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRule(rule)}
                              className="inline-flex items-center gap-1 rounded-md border border-grey-300 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950"
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
                                className="-ms-0.5"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => onPauseRule && onPauseRule(rule)}
                              disabled={actionsDisabled || loading}
                              className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/30"
                              title={rule.active ? 'Pause rule' : 'Activate rule'}
                            >
                              {rule.active ? (
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
                                  className="lucide lucide-circle-pause -ml-0.5 mr-1.5 size-4 shrink-0"
                                  aria-hidden="true"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="10" x2="10" y1="15" y2="9"></line>
                                  <line x1="14" x2="14" y1="15" y2="9"></line>
                                </svg>
                              ) : (
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
                                  className="lucide lucide-circle-play -ml-0.5 mr-1.5 size-4 shrink-0"
                                  aria-hidden="true"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polygon points="10 8 16 12 10 16"></polygon>
                                </svg>
                              )}
                              {rule.active ? 'Pause' : 'Play'}
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
        {meta && (
          <ListPagination
            meta={meta}
            onPageChange={onPageChange}
            alwaysShow={paginationAlwaysShow}
          />
        )}
      </div>
    </div>
  );
};

export default RulesListPanel;
