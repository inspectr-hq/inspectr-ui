// src/components/tracing/timeline/TraceTimelineHeader.jsx

import React from 'react';
import { Badge, Flex, Title } from '@tremor/react';

export default function TraceTimelineHeader({ operationCount, onRefresh, isRefreshing, hasError }) {
  return (
    <Flex justifyContent="between" alignItems="start">
      <div>
        <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Trace timeline
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
