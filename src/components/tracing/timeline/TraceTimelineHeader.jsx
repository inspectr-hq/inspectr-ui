// src/components/tracing/timeline/TraceTimelineHeader.jsx

import React from 'react';
import { Badge, Flex, Title } from '@tremor/react';

const TraceIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-chart-gantt-icon lucide-chart-gantt ${className}`}
    aria-hidden="true"
    {...props}
  >
    <path d="M10 6h8" />
    <path d="M12 16h6" />
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M8 11h7" />
  </svg>
);

export default function TraceTimelineHeader({
  operationCount,
  onRefresh,
  isRefreshing,
  hasError,
  traceSources,
  onOpenFilters,
  activeFiltersCount = 0
}) {
  return (
    <Flex justifyContent="between" alignItems="start">
      <div>
        <Title className="flex items-center gap-2 text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
          <TraceIcon className="h-4 w-4" />
          <span>Trace timeline</span>
        </Title>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onOpenFilters ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative inline-flex items-center gap-2 rounded px-3 py-1 text-xs cursor-pointer bg-blue-500 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-white"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
            Filters
            {activeFiltersCount > 0 ? (
              <span className="absolute -top-1 -right-1 bg-blue-700 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh trace"
          className="inline-flex items-center gap-1 rounded-tremor-small border border-tremor-border px-3 py-1.5 text-sm font-medium text-tremor-content-strong shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-tremor-border dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background-subtle"
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        {traceSources?.length ? (
          <div className="flex flex-wrap gap-2">
            {traceSources.map((source) => (
              <Badge key={source} color="blue">
                {source}
              </Badge>
            ))}
          </div>
        ) : null}
        <Badge color={hasError ? 'rose' : 'slate'}>
          {`${operationCount} ${operationCount === 1 ? 'step' : 'steps'}`}
        </Badge>
      </div>
    </Flex>
  );
}
