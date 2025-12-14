// src/components/tracing/timeline/TraceMetadata.jsx

import React from 'react';
import { Badge } from '@tremor/react';
import { formatDuration, formatTimestamp } from '../../../utils/formatters.js';
import { formatTraceLabel } from '../traceUtils.js';

export default function TraceMetadata({
  traceSummary,
  traceDurationMs,
  traceDetailMeta,
  traceListMeta,
  isTraceDetailLoading,
  operationCount,
  tokenTotals
}) {
  const formatTokens = (value) =>
    value === null || value === undefined ? '—' : value.toLocaleString();

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Trace label */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Trace
          </span>
          <span className="text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {formatTraceLabel(traceSummary)}
          </span>
        </div>
        {/* Total tokens */}
        {tokenTotals ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-4 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
            <div className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              Estimated total tokens for {operationCount} operations:
            </div>
            <div className="flex flex-wrap items-center gap-2 text-right text-tremor-content dark:text-dark-tremor-content">
              <Badge color="indigo" size="xs">
                Request {formatTokens(tokenTotals.request)}
              </Badge>
              <Badge color="indigo" size="xs">
                Response {formatTokens(tokenTotals.response)}
              </Badge>
              <Badge color="indigo" size="xs">
                Total {formatTokens(tokenTotals.total)}
              </Badge>
            </div>
          </div>
        ) : null}
        {/* Step info */}
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
      {/* Page info */}
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
