// src/components/insights/TraceMode.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Flex, Select, SelectItem, Text, Title } from '@tremor/react';
import MethodBadge from './MethodBadge.jsx';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const getBarColorClass = (status) => {
  if (status >= 500) return 'bg-rose-500/80';
  if (status >= 400) return 'bg-amber-500/80';
  if (status >= 300) return 'bg-blue-500/70';
  if (status >= 200) return 'bg-emerald-500/80';
  return 'bg-slate-400/70';
};

const getDotColorClass = (status) => {
  if (status >= 500) return 'bg-rose-500';
  if (status >= 400) return 'bg-amber-500';
  if (status >= 300) return 'bg-blue-500';
  if (status >= 200) return 'bg-emerald-500';
  return 'bg-slate-400';
};

const formatTraceLabel = (trace) => {
  if (!trace) return 'Unknown trace';
  if (trace.label) return trace.label;
  return trace.traceId || 'Trace';
};

const MIN_BAR_WIDTH_PERCENT = 2;

const toDisplayString = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const pickAgentLabel = (operation) => {
  if (!operation?.tags?.length) return null;
  const agentTag =
    operation.tags.find((tag) => tag.keyToken === 'agent') ||
    operation.tags.find((tag) => tag.key === 'agent');
  if (!agentTag) return null;
  return agentTag.value || agentTag.display || null;
};

const TRACE_GROUP_FALLBACK = 'Ungrouped';

export default function TraceMode({ operations }) {
  const traces = useMemo(() => {
    if (!Array.isArray(operations) || operations.length === 0) return [];

    const grouped = new Map();

    operations.forEach((operation, index) => {
      if (!operation) return;
      const traceId = operation.operationId || operation.id || `trace-${index}`;
      if (!grouped.has(traceId)) {
        grouped.set(traceId, []);
      }
      const normalizedOperation = {
        ...operation,
        _internalId: operation.id || `${traceId}-${grouped.get(traceId).length}`
      };
      grouped.get(traceId).push(normalizedOperation);
    });

    return Array.from(grouped.entries())
      .map(([traceId, traceOperations]) => {
        const sortedOperations = [...traceOperations].sort((a, b) => {
          const aTime = Number.isFinite(a.timestampMs) ? a.timestampMs : 0;
          const bTime = Number.isFinite(b.timestampMs) ? b.timestampMs : 0;
          return aTime - bTime;
        });

        const traceStart = sortedOperations.reduce((acc, operation) => {
          if (!Number.isFinite(operation.timestampMs)) return acc;
          if (acc === null) return operation.timestampMs;
          return Math.min(acc, operation.timestampMs);
        }, null);

        const traceEnd = sortedOperations.reduce((acc, operation) => {
          const startMs = Number.isFinite(operation.timestampMs)
            ? operation.timestampMs
            : traceStart ?? 0;
          const durationMs = Number.isFinite(operation.duration) ? operation.duration : 0;
          const operationEnd = startMs + durationMs;
          if (acc === null) return operationEnd;
          return Math.max(acc, operationEnd);
        }, traceStart);

        const agentBuckets = new Map();
        sortedOperations.forEach((operation) => {
          const agentLabel = pickAgentLabel(operation);
          const key = agentLabel ? agentLabel.toLowerCase() : '__default__';
          const label = agentLabel || TRACE_GROUP_FALLBACK;

          if (!agentBuckets.has(key)) {
            agentBuckets.set(key, { key, label, operations: [] });
          }
          agentBuckets.get(key).operations.push(operation);
        });

        const groups = Array.from(agentBuckets.values()).map((group) => ({
          ...group,
          operations: [...group.operations].sort((a, b) => {
            const aTime = Number.isFinite(a.timestampMs) ? a.timestampMs : 0;
            const bTime = Number.isFinite(b.timestampMs) ? b.timestampMs : 0;
            return aTime - bTime;
          })
        }));

        const primaryOperation = sortedOperations.find(
          (operation) => operation.raw?.data?.meta?.trace_name
        );
        const label =
          primaryOperation?.raw?.data?.meta?.trace_name ||
          sortedOperations[0]?.raw?.data?.meta?.name ||
          traceId;

        return {
          traceId,
          label,
          startMs: traceStart,
          endMs: traceEnd,
          durationMs:
            traceStart != null && traceEnd != null ? Math.max(traceEnd - traceStart, 0) : null,
          operations: sortedOperations,
          groups
        };
      })
      .sort((a, b) => {
        const aStart = Number.isFinite(a.startMs) ? a.startMs : 0;
        const bStart = Number.isFinite(b.startMs) ? b.startMs : 0;
        return bStart - aStart;
      });
  }, [operations]);

  const [selectedTraceId, setSelectedTraceId] = useState(() =>
    traces.length ? traces[0].traceId : null
  );

  useEffect(() => {
    if (!traces.length) {
      setSelectedTraceId(null);
      return;
    }
    if (selectedTraceId && traces.some((trace) => trace.traceId === selectedTraceId)) {
      return;
    }
    setSelectedTraceId(traces[0]?.traceId ?? null);
  }, [traces, selectedTraceId]);

  const selectedTrace = useMemo(() => {
    if (!selectedTraceId) return traces[0] || null;
    return traces.find((trace) => trace.traceId === selectedTraceId) || traces[0] || null;
  }, [traces, selectedTraceId]);

  const [selectedOperationId, setSelectedOperationId] = useState(null);

  useEffect(() => {
    if (!selectedTrace?.operations?.length) {
      setSelectedOperationId(null);
      return;
    }
    if (
      selectedOperationId &&
      selectedTrace.operations.some((operation) => operation._internalId === selectedOperationId)
    ) {
      return;
    }
    setSelectedOperationId(selectedTrace.operations[0]._internalId);
  }, [selectedTrace, selectedOperationId]);

  const selectedOperation = useMemo(() => {
    if (!selectedTrace?.operations?.length || !selectedOperationId) return null;
    return (
      selectedTrace.operations.find(
        (operation) => operation._internalId === selectedOperationId
      ) || null
    );
  }, [selectedTrace, selectedOperationId]);

  const [expandedGroups, setExpandedGroups] = useState(() => new Set());

  useEffect(() => {
    if (!selectedTrace?.groups?.length) {
      setExpandedGroups(new Set());
      return;
    }
    setExpandedGroups(new Set(selectedTrace.groups.map((group) => group.key)));
  }, [selectedTraceId, selectedTrace?.groups]);

  const baseStart = Number.isFinite(selectedTrace?.startMs) ? selectedTrace.startMs : 0;
  const baseEnd = Number.isFinite(selectedTrace?.endMs) ? selectedTrace.endMs : baseStart;
  const baseDuration = Math.max(baseEnd - baseStart, 1);

  const renderOperation = (operation) => {
    const startMs = Number.isFinite(operation.timestampMs) ? operation.timestampMs : baseStart;
    const durationMs = Number.isFinite(operation.duration) ? operation.duration : 0;
    const rawOffset = ((startMs - baseStart) / baseDuration) * 100;
    const offset = Math.min(Math.max(rawOffset, 0), 100);
    const widthRaw = (durationMs / baseDuration) * 100;
    const width = Math.min(
      Math.max(Number.isFinite(widthRaw) ? widthRaw : MIN_BAR_WIDTH_PERCENT, MIN_BAR_WIDTH_PERCENT),
      100 - offset
    );
    const isActive = selectedOperationId === operation._internalId;
    const title =
      operation.raw?.data?.meta?.name ||
      `${operation.method || 'REQUEST'} ${operation.path || operation.host || '/'}`;

    return (
      <button
        key={operation._internalId}
        type="button"
        onClick={() => setSelectedOperationId(operation._internalId)}
        className={classNames(
          'w-full rounded-tremor-small border px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-dark-tremor-border',
          isActive
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

  if (!operations.length) {
    return <EmptyState message="No operations available for trace view." />;
  }

  if (!traces.length || !selectedTrace) {
    return (
      <Card className="rounded-tremor-small border border-dashed border-tremor-border p-6 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        Start streaming operations to explore traces.
      </Card>
    );
  }

  const metaEntries = selectedOperation?.raw?.data?.meta
    ? Object.entries(selectedOperation.raw.data.meta)
        .filter(([key]) => key !== 'tags')
        .map(([key, value]) => ({ key, value: toDisplayString(value) }))
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card className="rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Trace explorer
            </Title>
            <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              Inspect a single operation across its downstream calls and agent handoffs.
            </Text>
          </div>
          <Badge color="slate">{`${selectedTrace?.operations?.length ?? 0} steps`}</Badge>
        </Flex>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                Trace
              </Text>
              <Text className="text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {formatTraceLabel(selectedTrace)}
              </Text>
            </div>
            <Select
              className="w-full sm:w-64 [&>button]:rounded-tremor-small"
              enableClear={false}
              value={selectedTraceId ?? selectedTrace.traceId}
              onValueChange={setSelectedTraceId}
            >
              {traces.map((trace) => (
                <SelectItem key={trace.traceId} value={trace.traceId}>
                  {formatTraceLabel(trace)}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
            <span>{selectedTrace?.operations?.length ?? 0} recorded steps</span>
            <span>
              {selectedTrace?.durationMs != null ? formatDuration(selectedTrace.durationMs) : 'N/A'}
            </span>
          </div>

          <div className="space-y-4">
            {selectedTrace.groups.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              return (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.key)) {
                          next.delete(group.key);
                        } else {
                          next.add(group.key);
                        }
                        return next;
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-tremor-content-strong transition hover:bg-gray-100 dark:bg-dark-tremor-background dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background-subtle"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-tremor-content-strong shadow-sm dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
                        {group.label.slice(0, 2).toUpperCase()}
                      </span>
                      <span>{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-normal text-tremor-content-subtle dark:text-dark-tremor-content">
                      <span>{group.operations.length} steps</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={classNames(
                          'h-3.5 w-3.5 transition-transform',
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                  {isExpanded ? (
                    <div className="divide-y divide-tremor-border dark:divide-dark-tremor-border">
                      {group.operations.map((operation) => renderOperation(operation))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border">
        {selectedOperation ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {selectedOperation.raw?.data?.meta?.name ||
                    `${selectedOperation.method} ${selectedOperation.path}`}
                </Title>
                <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
                  {selectedOperation.host || selectedOperation.request?.server || 'Unspecified host'}
                </Text>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={selectedOperation.status} />
                <Badge color="blue">{formatDuration(selectedOperation.duration)}</Badge>
              </div>
            </div>

            <div className="mt-6 space-y-5 overflow-y-auto">
              <div>
                <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                  Properties
                </Text>
                <dl className="mt-3 divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Created
                    </dt>
                    <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                      {formatTimestamp(selectedOperation.timestamp)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Trace ID
                    </dt>
                    <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.operationId || '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Request
                    </dt>
                    <dd className="flex flex-col items-end gap-1 text-right text-tremor-content dark:text-dark-tremor-content">
                      <span className="font-medium">{selectedOperation.method}</span>
                      <span className="truncate text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                        {selectedOperation.path || selectedOperation.url || '/'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Status
                    </dt>
                    <dd>
                      <StatusBadge status={selectedOperation.status} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Duration
                    </dt>
                    <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                      {formatDuration(selectedOperation.duration)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Client
                    </dt>
                    <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.request?.client_ip || '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedOperation.tags?.length ? (
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                    Tags
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedOperation.tags.map((tag) => (
                      <span
                        key={tag.token}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content"
                      >
                        {tag.display}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {metaEntries.length ? (
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                    Metadata
                  </Text>
                  <div className="mt-2 space-y-3">
                    {metaEntries.map((entry) => (
                      <div key={entry.key}>
                        <Text className="text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          {entry.key}
                        </Text>
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
                          {entry.value}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedOperation.response?.body ? (
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                    Response body
                  </Text>
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
                    {toDisplayString(selectedOperation.response.body)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
            Select a step to inspect its details.
          </div>
        )}
      </Card>
    </div>
  );
}
