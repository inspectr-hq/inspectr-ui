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

export default function TraceTimelineHeader({ operationCount, onRefresh, isRefreshing, hasError }) {
  return (
    <Flex justifyContent="between" alignItems="start">
      <div>
        <Title className="flex items-center gap-2 text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
          <TraceIcon className="h-4 w-4" />
          <span>Trace timeline</span>
        </Title>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh trace"
          className="inline-flex items-center gap-1 rounded-tremor-small border border-tremor-border px-3 py-1.5 text-sm font-medium text-tremor-content-strong shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-tremor-border dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background-subtle"
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <Badge color={hasError ? 'rose' : 'slate'}>
          {`${operationCount} ${operationCount === 1 ? 'step' : 'steps'}`}
        </Badge>
      </div>
    </Flex>
  );
}
