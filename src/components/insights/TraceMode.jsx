// src/components/insights/TraceMode.jsx

import React from 'react';
import { Badge, Card, Flex, Select, SelectItem, Text, Title } from '@tremor/react';
import MethodBadge from './MethodBadge.jsx';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import TraceOperationDetail from '../tracing/TraceOperationDetail.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import {
  classNames,
  formatTraceLabel,
  getBarColorClass,
  getDotColorClass
} from '../tracing/traceUtils.js';
import { useTraceExplorer } from '../tracing/useTraceExplorer.js';

const MIN_BAR_WIDTH_PERCENT = 2;

export default function TraceMode({
  operations: _legacyOperations = [],
  initialTraceId = null,
  initialOperationId = null,
  onTraceChange,
  onOperationChange,
  isActive = true
}) {
  const {
    supportsTraces,
    traceList,
    traceListMeta,
    isTraceListLoading,
    traceListError,
    traceDetailError,
    traceDetailMeta,
    isTraceDetailLoading,
    selectedTraceId,
    setSelectedTraceId,
    traceSummary,
    traceSources,
    traceDurationMs,
    normalizedOperations,
    timeline,
    selectedOperationId,
    setSelectedOperationId,
    selectedOperation
  } = useTraceExplorer({
    initialTraceId,
    initialOperationId,
    onTraceChange,
    onOperationChange,
    isActive
  });

  const baseStart = timeline.start;
  const baseDuration = timeline.duration;

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

  const operationCount = traceSummary?.operation_count || normalizedOperations.length;

  const renderOperation = (operation) => {
    const startMs = Number.isFinite(operation.timestampMs) ? operation.timestampMs : baseStart;
    const duration = Number.isFinite(operation.duration) ? operation.duration : 0;
    const rawOffset = ((startMs - baseStart) / baseDuration) * 100;
    const offset = Math.min(Math.max(rawOffset, 0), 100);
    const widthRaw = (duration / baseDuration) * 100;
    const width = Math.min(
      Math.max(Number.isFinite(widthRaw) ? widthRaw : MIN_BAR_WIDTH_PERCENT, MIN_BAR_WIDTH_PERCENT),
      100 - offset
    );
    const isActiveOperation = selectedOperationId === operation.id;
    const title = `${operation.method} ${operation.path}`;

    return (
      <button
        key={operation.id}
        type="button"
        onClick={() => setSelectedOperationId(operation.id)}
        className={classNames(
          'w-full rounded-tremor-small border px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-dark-tremor-border',
          isActiveOperation
            ? 'border-tremor-brand bg-tremor-brand-faint ring-0 dark:border-tremor-brand'
            : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-dark-tremor-background-subtle'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                'h-2.5 w-2.5 rounded-full',
                getDotColorClass(operation.status ?? null)
              )}
            />
            <span className="truncate text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {title}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
            <span>{formatDuration(operation.duration)}</span>
            <span>{formatTimestamp(operation.timestamp)}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
          <MethodBadge method={operation.method} />
          <StatusBadge status={operation.status} />
          {operation.traceInfo?.source ? (
            <Badge color="blue">{operation.traceInfo.source}</Badge>
          ) : null}
          {operation.host ? <span className="truncate">{operation.host}</span> : null}
        </div>
        <div className="relative mt-3 h-2 rounded-full bg-slate-100 dark:bg-dark-tremor-background-subtle">
          <span
            className={classNames(
              'absolute top-0 h-2 rounded-full transition-all',
              getBarColorClass(operation.status ?? null)
            )}
            style={{
              left: `${offset}%`,
              width: `${width}%`
            }}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Trace explorer
            </Title>
            <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              Inspect spans collected for a trace and explore downstream requests.
            </Text>
          </div>
          <Badge color={traceDetailError ? 'rose' : 'slate'}>
            {`${operationCount} ${operationCount === 1 ? 'step' : 'steps'}`}
          </Badge>
        </Flex>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div>
                <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                  Trace
                </Text>
                <Text className="text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {formatTraceLabel(traceSummary)}
                </Text>
              </div>
              {traceSources?.length ? (
                <div className="flex flex-wrap gap-2">
                  {traceSources.map((source) => (
                    <Badge key={source} color="blue">
                      {source}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                {traceSummary?.first_seen ? (
                  <div>First seen: {formatTimestamp(traceSummary.first_seen)}</div>
                ) : null}
                {traceSummary?.last_seen ? (
                  <div>Last seen: {formatTimestamp(traceSummary.last_seen)}</div>
                ) : null}
                {traceDurationMs != null ? (
                  <div>Observed duration: {formatDuration(traceDurationMs)}</div>
                ) : null}
              </div>
            </div>
            <Select
              className="w-full sm:w-72 [&>button]:rounded-tremor-small"
              enableClear={false}
              value={selectedTraceId ?? traceSummary?.trace_id ?? ''}
              onValueChange={setSelectedTraceId}
            >
              {traceList.map((trace) => (
                <SelectItem key={trace.trace_id} value={trace.trace_id}>
                  {formatTraceLabel(trace)}
                </SelectItem>
              ))}
            </Select>
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

          {traceDetailError ? (
            <Card className="rounded-tremor-small border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
              Failed to load trace details: {traceDetailError.message || 'Unexpected error'}
            </Card>
          ) : null}

          <div className="space-y-4">
            {normalizedOperations.length ? (
              normalizedOperations.map((operation) => renderOperation(operation))
            ) : (
              <Card className="rounded-tremor-small border border-dashed border-tremor-border p-6 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                No operations recorded for this trace.
              </Card>
            )}
          </div>
        </div>
      </Card>

      <Card className="rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border">
        <TraceOperationDetail operation={selectedOperation} isLoading={isTraceDetailLoading} />
      </Card>
    </div>
  );
}
