// src/components/tracing/timeline/TraceEmptyStates.jsx

import React from 'react';
import { Card } from '@tremor/react';
import EmptyState from '../../insights/EmptyState.jsx';

export default function TraceEmptyStates({
  supportsTraces,
  isTraceListLoading,
  traceList,
  traceListError
}) {
  if (!supportsTraces) {
    return (
      <Card className="rounded-tremor-small border border-dashed border-tremor-border p-6 text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        Trace exploration requires an Inspectr API version that exposes the /api/traces endpoints.
      </Card>
    );
  }

  if (isTraceListLoading && !traceList.length) {
    return (
      <Card className="rounded-tremor-small border border-tremor-border p-6 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        Loading traces…
      </Card>
    );
  }

  if (traceListError && !traceList.length) {
    return (
      <Card className="rounded-tremor-small border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
        Failed to load traces: {traceListError.message || 'Unexpected error'}
      </Card>
    );
  }

  if (!traceList.length) {
    return (
      <EmptyState message="No traces recorded yet. Start sending traffic to populate this view." />
    );
  }

  return null;
}
