// src/components/tracing/timeline/TraceMetadata.jsx

import React from 'react';
import { Badge, Text } from '@tremor/react';
import { formatDuration, formatTimestamp } from '../../../utils/formatters.js';
import { formatTraceLabel } from '../traceUtils.js';

export default function TraceMetadata({
  traceSummary,
  traceSources,
  traceDurationMs,
  traceDetailMeta,
  traceListMeta,
  isTraceDetailLoading,
  operationCount
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Trace
            </Text>
            <Text className="text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {formatTraceLabel(traceSummary)}
            </Text>
          </div>
          {traceSources?.length ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {traceSources.map((source) => (
                <Badge key={source} color="blue">
                  {source}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="w-full flex flex-wrap items-center justify-between gap-4 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
          {traceSummary?.first_seen ? (
            <div>First step: {formatTimestamp(traceSummary.first_seen)}</div>
          ) : null}
          {traceSummary?.last_seen ? (
            <div>Last step: {formatTimestamp(traceSummary.last_seen)}</div>
          ) : null}
          {traceDurationMs != null ? (
            <div>Observed duration: {formatDuration(traceDurationMs)}</div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
        <span>
          Page {traceDetailMeta?.page || traceListMeta?.page || 1} of{' '}
          {traceListMeta?.total_pages || traceDetailMeta?.total_pages || 1}
        </span>
        <span>
          {isTraceDetailLoading ? 'Refreshing trace…' : `Total operations: ${operationCount}`}
        </span>
      </div>
    </>
  );
}
