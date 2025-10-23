// src/components/insights/TraceTimelineMode.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Flex, Select, SelectItem, Text, Title } from '@tremor/react';
import EmptyState from './EmptyState.jsx';
import TraceOperationDetail from './TraceOperationDetail.jsx';
import StatusBadge from './StatusBadge.jsx';
import MethodBadge from './MethodBadge.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import {
  classNames,
  formatTraceLabel,
  getBarColorClass,
  getDotColorClass,
  getOperationTiming,
  pickAgentLabel
} from './traceUtils.js';
import { useTraceExplorer } from './useTraceExplorer.js';

const MIN_BAR_WIDTH_PERCENT = 3;
const TIMELINE_TICK_COUNT = 4;

const deriveGroupLabel = (operations) => {
  if (!operations.length) return 'Trace group';
  const primary = operations[0];
  return (
    pickAgentLabel(primary) ||
    primary.traceInfo?.source ||
    (primary.correlationId ? `Correlation ${primary.correlationId}` : null) ||
    `${primary.method} ${primary.path}`
  );
};

const deriveGroupSubtitle = (operations) => {
  if (!operations.length) return '';
  const primary = operations[0];
  return primary.path || primary.url || '';
};

const deriveGroupStatus = (operations) => {
  if (!operations.length) return null;
  return operations.reduce((max, op) => Math.max(max, op.status ?? 0), 0);
};

export default function TraceTimelineMode({
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

  const timelineTicks = useMemo(() => {
    if (!Number.isFinite(baseDuration) || baseDuration <= 0) return [];
    return Array.from({ length: TIMELINE_TICK_COUNT + 1 }, (_, index) => {
      const fraction = index / TIMELINE_TICK_COUNT;
      return {
        id: index,
        position: fraction * 100,
        label: formatDuration(baseDuration * fraction)
      };
    });
  }, [baseDuration]);

  const groups = useMemo(() => {
    if (!normalizedOperations.length) return [];
    const bucket = new Map();

    normalizedOperations.forEach((operation, index) => {
      const key = operation.correlationId || `__group-${index}`;
      if (!bucket.has(key)) {
        bucket.set(key, {
          id: key,
          operations: [],
          startMs: null,
          endMs: null,
          order: index
        });
      }
      const group = bucket.get(key);
      group.operations.push(operation);
      const { start, end } = getOperationTiming(operation, index);
      group.startMs = group.startMs === null ? start : Math.min(group.startMs, start);
      group.endMs = group.endMs === null ? end : Math.max(group.endMs, end);
    });

    return Array.from(bucket.values())
      .map((group) => ({
        ...group,
        label: deriveGroupLabel(group.operations),
        subtitle: deriveGroupSubtitle(group.operations),
        durationMs:
          group.startMs != null && group.endMs != null ? Math.max(group.endMs - group.startMs, 0) : 0,
        maxStatus: deriveGroupStatus(group.operations)
      }))
      .sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  }, [normalizedOperations]);

  const [expandedGroups, setExpandedGroups] = useState(() => new Set());

  useEffect(() => {
    setExpandedGroups(new Set(groups.map((group) => group.id)));
  }, [selectedTraceId, groups]);

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

  const handleToggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderBar = ({ start, duration, status, total = baseDuration, variant = 'status' }) => {
    if (!Number.isFinite(total) || total <= 0) {
      return <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle" />;
    }
    // Use `total` (not baseDuration) and compute right edge to avoid 0px widths at ~100% offsets
    const denom = Number.isFinite(total) && total > 0 ? total : baseDuration;
    const rawOffset = ((start - baseStart) / denom) * 100;
    const rawWidth = (duration / denom) * 100;

    // Clamp helper
    const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);

    // Clamp offset, then clamp the right edge
    let offset = clamp(rawOffset);
    let right = clamp(offset + rawWidth);

    // Derive width and enforce a minimum visible width
    let width = right - offset;
    if (!Number.isFinite(width) || width <= 0) {
      width = MIN_BAR_WIDTH_PERCENT;
      if (offset >= 100) offset = 100 - width; // pull left if at the edge
    } else if (width < MIN_BAR_WIDTH_PERCENT) {
      // Expand to minimum width while keeping inside the container
      const desiredRight = Math.min(100, offset + MIN_BAR_WIDTH_PERCENT);
      width = desiredRight - offset;
      if (width < MIN_BAR_WIDTH_PERCENT) {
        offset = Math.max(0, 100 - MIN_BAR_WIDTH_PERCENT);
        width = MIN_BAR_WIDTH_PERCENT;
      }
    }

    return (
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle">
        <span
          className={classNames(
            'absolute top-0 h-2 rounded-full transition-all',
            variant === 'brand'
              ? 'bg-tremor-brand/80 dark:bg-tremor-brand/60'
              : getBarColorClass(status ?? null)
          )}
          style={{ left: `${offset}%`, width: `${width}%` }}
        />
      </div>
    );
  };

  const renderGroupRow = (group) => {
    const isExpanded = expandedGroups.has(group.id);
    const isGroupSelected = group.operations.some((op) => op.id === selectedOperationId);
    const { startMs, durationMs } = group;

    return (
      <div
        key={group.id}
        className={classNames(
          'rounded-tremor-small border border-transparent bg-white/60 shadow-sm transition dark:bg-dark-tremor-background',
          isGroupSelected
            ? 'border-tremor-brand shadow-tremor-card dark:border-tremor-brand'
            : 'hover:border-slate-200 hover:shadow-tremor-card dark:hover:border-slate-700'
        )}
      >
        <button
          type="button"
          onClick={() => handleToggleGroup(group.id)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="grid w-full items-center gap-3 pl-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_70%]">
            {/* Column 0: caret/icon */}
            <div className="flex justify-center">
              <span
                className={classNames(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  isExpanded
                    ? 'border-tremor-brand text-tremor-brand'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                )}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={classNames('h-3.5 w-3.5 transition-transform', isExpanded ? 'rotate-180' : 'rotate-0')}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>

            {/* Column 1: flexible (label + optional subtitle) */}
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 truncate">
                <Text className="truncate text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {group.label}
                </Text>
              </div>
              {group.subtitle ? (
                <Text className="truncate text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                  {group.subtitle}
                </Text>
              ) : null}
            </div>

            {/* Column 2: duration + bar (flex-1) + badge */}
            <div className="min-w-0 flex items-center gap-3">
              <Text className="w-20 shrink-0 text-right text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {formatDuration(traceDurationMs)}
              </Text>
              <div className="flex-1 min-w-0">
                {renderBar({ start: startMs ?? baseStart, duration: traceDurationMs, variant: 'brand' })}
              </div>
              <div className="w-10 shrink-0 flex justify-center">
                <Badge color="slate">{group.operations.length}</Badge>
              </div>
            </div>
          </div>
        </button>

        {isExpanded ? (
          <div className="border-t border-tremor-border px-3 py-2 dark:border-dark-tremor-border">
            <div className="space-y-1">
              {group.operations.map((operation, index) => renderOperationRow(operation, index))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderOperationRow = (operation, index) => {
    const { start, duration } = getOperationTiming(operation, index);
    const isSelected = selectedOperationId === operation.id;

    return (
      <button
        key={operation.id}
        type="button"
        onClick={() => setSelectedOperationId(operation.id)}
        className={classNames(
          'flex w-full items-center gap-3 rounded-tremor-small px-2 py-1.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          isSelected
            ? 'bg-tremor-brand-faint text-tremor-content-strong ring-0 dark:bg-tremor-brand-faint/40'
            : 'hover:bg-slate-100 dark:hover:bg-dark-tremor-background-subtle'
        )}
      >
        <div className="grid w-full items-center gap-3 pl-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_70%]">
          {/* Column 0: status dot */}
          <div className="flex justify-center">
            <span
              className={classNames(
                'h-2 w-2 rounded-full',
                getDotColorClass(operation.status ?? null)
              )}
            />
          </div>

          {/* Column 1: label + timestamp */}
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2 text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              <MethodBadge method={operation.method} />
              <span className="truncate">{operation.traceInfo?.source || operation.path}</span>
            </div>
            <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              {formatTimestamp(operation.timestamp)}
            </Text>
          </div>

          {/* Column 2: duration + bar (flex-1) + status badge */}
          <div className="min-w-0 flex items-center gap-3">
            <Text className="w-20 shrink-0 text-right text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {formatDuration(operation.duration)}
            </Text>
            <div className="flex-1 min-w-0">
              {renderBar({ start, duration, status: operation.status })}
            </div>
            <div className="w-10 shrink-0 flex justify-center">
              <StatusBadge status={operation.status} />
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderTimelineTrack = () => {
    if (!normalizedOperations.length) return null;
    return (
      <div className="hidden items-center gap-4 rounded-tremor-small border border-slate-200 px-3 py-2 text-xs text-tremor-content-subtle dark:border-slate-700 dark:text-dark-tremor-content lg:flex">
        <span className="w-20 text-right">Timeline</span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle">
          {normalizedOperations.map((operation, index) => {
            const { start, duration } = getOperationTiming(operation, index);
            const rawOffset = ((start - baseStart) / baseDuration) * 100;
            const offset = Math.min(Math.max(rawOffset, 0), 100);
            const widthRaw = (duration / baseDuration) * 100;
            const width = Math.min(
              Math.max(Number.isFinite(widthRaw) ? widthRaw : MIN_BAR_WIDTH_PERCENT, MIN_BAR_WIDTH_PERCENT),
              100 - offset
            );
            return (
              <span
                key={operation.id}
                className={classNames(
                  'absolute top-0 h-2 rounded-full opacity-90',
                  getBarColorClass(operation.status ?? null)
                )}
                style={{ left: `${offset}%`, width: `${width}%` }}
                title={`${operation.method} ${operation.path} • ${formatDuration(operation.duration)}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderTraceSummaryBar = () => {
    if (!Number.isFinite(baseDuration) || baseDuration <= 0) return null;

    return (
      <div className="flex items-center gap-4 rounded-tremor-small border border-slate-200 px-3 py-2 text-xs text-tremor-content-subtle dark:border-slate-700 dark:text-dark-tremor-content">
        <span className="w-20 text-right font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {traceDurationMs != null ? formatDuration(traceDurationMs) : '—'} HERE
        </span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle">
          <span
            className="absolute top-0 h-2 w-full rounded-full bg-tremor-brand/80 transition-all dark:bg-tremor-brand/60"
            style={{ left: '0%', width: '100%' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Trace timeline
            </Title>
            <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              Review trace spans as a nested timeline, grouped by correlation across the conversation.
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

          <div className="space-y-3">
            {/*{renderTraceSummaryBar()}*/}
            {/*{renderTimelineTrack()}*/}
            {/*<div className="relative hidden h-8 w-full items-center justify-between rounded-tremor-small border border-dashed border-slate-200 px-3 text-xs text-tremor-content-subtle dark:border-slate-700 dark:text-dark-tremor-content lg:flex">*/}
            {/*  {timelineTicks.map((tick) => (*/}
            {/*    <div key={tick.id} className="relative flex-1">*/}
            {/*      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">*/}
            {/*        {tick.label}*/}
            {/*      </span>*/}
            {/*      {tick.id > 0 && tick.id < timelineTicks.length - 1 ? (*/}
            {/*        <span className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-slate-300 dark:bg-slate-700" />*/}
            {/*      ) : null}*/}
            {/*    </div>*/}
            {/*  ))}*/}
            {/*</div>*/}
            {groups.length ? (
              groups.map((group) => renderGroupRow(group))
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
