// src/components/insights/TraceMode.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Flex, Select, SelectItem, Text, Title } from '@tremor/react';
import { useInspectr } from '../../context/InspectrContext.jsx';
import MethodBadge from './MethodBadge.jsx';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { normalizeTags } from '../../utils/normalizeTags.js';

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

const MIN_BAR_WIDTH_PERCENT = 2;

const safeParseUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const parseTimestamp = (value, fallback) => {
  if (!value) return fallback ?? null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback ?? null;
};

const toDisplayString = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatTraceLabel = (trace) => {
  if (!trace) return 'Unknown trace';
  return trace.trace_id || trace.traceId || 'Trace';
};

const computeTraceDuration = (traceSummary, operations) => {
  if (traceSummary?.first_seen && traceSummary?.last_seen) {
    const first = Date.parse(traceSummary.first_seen);
    const last = Date.parse(traceSummary.last_seen);
    if (Number.isFinite(first) && Number.isFinite(last) && last >= first) {
      return last - first;
    }
  }

  if (!operations?.length) return null;
  let min = null;
  let max = null;
  operations.forEach((operation, index) => {
    const startMs = Number.isFinite(operation.timestampMs) ? operation.timestampMs : index;
    const duration = Number.isFinite(operation.duration) ? operation.duration : 0;
    const opStart = startMs;
    const opEnd = opStart + duration;
    min = min === null ? opStart : Math.min(min, opStart);
    max = max === null ? opEnd : Math.max(max, opEnd);
  });
  if (min === null || max === null || max < min) return null;
  return max - min;
};

const normalizeTraceOperation = (operation, index) => {
  if (!operation) return null;

  const request = operation.request || {};
  const response = operation.response || {};
  const timing = operation.timing || {};
  const meta = operation.meta || {};
  const url = request.url || '';
  const parsedUrl = safeParseUrl(url);
  const timestamp =
    request.timestamp ||
    response.timestamp ||
    meta.timestamp ||
    operation.timestamp ||
    null;
  const timestampMs = parseTimestamp(timestamp, index);
  const durationValue = Number.isFinite(Number(timing.duration))
    ? Number(timing.duration)
    : Number.isFinite(Number(operation.duration))
      ? Number(operation.duration)
      : null;

  return {
    id: operation.operation_id || operation.operationId || `operation-${index}`,
    method: (request.method || operation.method || 'GET').toUpperCase(),
    status: response.status ?? operation.status ?? null,
    duration: durationValue,
    timestamp,
    timestampMs,
    path: request.path || parsedUrl?.pathname || url || '/',
    host: request.server || parsedUrl?.host || '',
    url,
    request,
    response,
    timing,
    tags: normalizeTags(meta.tags),
    correlationId: operation.correlation_id || null,
    traceInfo: meta.trace || null,
    raw: operation
  };
};

export default function TraceMode({
  operations: _legacyOperations = [],
  initialTraceId = null,
  initialOperationId = null,
  onTraceChange,
  onOperationChange,
  isActive = true
}) {
  const { client } = useInspectr();
  const [traceList, setTraceList] = useState([]);
  const [traceListMeta, setTraceListMeta] = useState(null);
  const [isTraceListLoading, setIsTraceListLoading] = useState(false);
  const [traceListError, setTraceListError] = useState(null);

  const [selectedTraceId, setSelectedTraceId] = useState(initialTraceId ?? null);

  const [traceDetail, setTraceDetail] = useState(null);
  const [traceDetailMeta, setTraceDetailMeta] = useState(null);
  const [traceOperations, setTraceOperations] = useState([]);
  const [isTraceDetailLoading, setIsTraceDetailLoading] = useState(false);
  const [traceDetailError, setTraceDetailError] = useState(null);

  const [selectedOperationId, setSelectedOperationId] = useState(initialOperationId ?? null);

  useEffect(() => {
    if (!client?.traces?.list) return;

    let isActive = true;
    setIsTraceListLoading(true);
    setTraceListError(null);

    client.traces
      .list({ limit: 50 })
      .then((result) => {
        if (!isActive) return;
        setTraceList(Array.isArray(result?.traces) ? result.traces : []);
        setTraceListMeta(result?.meta || null);
      })
      .catch((err) => {
        if (!isActive) return;
        setTraceListError(err);
        setTraceList([]);
        setTraceListMeta(null);
      })
      .finally(() => {
        if (!isActive) return;
        setIsTraceListLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [client]);

  useEffect(() => {
    if (!traceList.length) {
      if (selectedTraceId !== null) {
        setSelectedTraceId(null);
      }
      return;
    }

    const hasInitial =
      initialTraceId && traceList.some((trace) => trace.trace_id === initialTraceId);
    const hasSelected =
      selectedTraceId && traceList.some((trace) => trace.trace_id === selectedTraceId);

    const preferredTraceId = hasInitial
      ? initialTraceId
      : hasSelected
        ? selectedTraceId
        : traceList[0].trace_id;

    if (preferredTraceId !== selectedTraceId) {
      setSelectedTraceId(preferredTraceId);
    }
  }, [traceList, initialTraceId, selectedTraceId]);

  useEffect(() => {
    if (!client?.traces?.get || !selectedTraceId) {
      setTraceDetail(null);
      setTraceDetailMeta(null);
      setTraceOperations([]);
      setSelectedOperationId(null);
      return;
    }

    let isActive = true;
    setIsTraceDetailLoading(true);
    setTraceDetailError(null);

    client.traces
      .get(selectedTraceId, { limit: 50 })
      .then((result) => {
        if (!isActive) return;
        setTraceDetail(result?.trace || null);
        setTraceDetailMeta(result?.meta || null);
        setTraceOperations(Array.isArray(result?.operations) ? result.operations : []);
      })
      .catch((err) => {
        if (!isActive) return;
        setTraceDetailError(err);
        setTraceDetail(null);
        setTraceDetailMeta(null);
        setTraceOperations([]);
      })
      .finally(() => {
        if (!isActive) return;
        setIsTraceDetailLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [client, selectedTraceId]);

  const normalizedOperations = useMemo(() => {
    if (!Array.isArray(traceOperations)) return [];
    return traceOperations
      .map((operation, index) => normalizeTraceOperation(operation, index))
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = Number.isFinite(a.timestampMs) ? a.timestampMs : 0;
        const bTime = Number.isFinite(b.timestampMs) ? b.timestampMs : 0;
        return aTime - bTime;
      });
  }, [traceOperations]);

  useEffect(() => {
    if (!normalizedOperations.length) {
      if (selectedOperationId !== null) {
        setSelectedOperationId(null);
      }
      return;
    }

    const hasInitial =
      initialOperationId &&
      normalizedOperations.some((operation) => operation.id === initialOperationId);
    const hasSelected =
      selectedOperationId &&
      normalizedOperations.some((operation) => operation.id === selectedOperationId);

    const preferredOperationId = hasInitial
      ? initialOperationId
      : hasSelected
        ? selectedOperationId
        : normalizedOperations[0].id;

    if (preferredOperationId !== selectedOperationId) {
      setSelectedOperationId(preferredOperationId);
    }
  }, [normalizedOperations, initialOperationId, selectedOperationId]);

  const selectedOperation = useMemo(() => {
    if (!selectedOperationId) return null;
    return (
      normalizedOperations.find((operation) => operation.id === selectedOperationId) || null
    );
  }, [normalizedOperations, selectedOperationId]);

  useEffect(() => {
    if (!isActive || typeof onTraceChange !== 'function') return;
    onTraceChange(selectedTraceId || null);
  }, [selectedTraceId, onTraceChange, isActive]);

  useEffect(() => {
    if (!isActive || typeof onOperationChange !== 'function') return;
    onOperationChange(selectedOperationId || null);
  }, [selectedOperationId, onOperationChange, isActive]);

  const traceSummary = useMemo(() => {
    if (traceDetail) return traceDetail;
    return traceList.find((trace) => trace.trace_id === selectedTraceId) || null;
  }, [traceDetail, traceList, selectedTraceId]);

  const traceDurationMs = useMemo(
    () => computeTraceDuration(traceSummary, normalizedOperations),
    [traceSummary, normalizedOperations]
  );

  const timelineBounds = useMemo(() => {
    if (!normalizedOperations.length) {
      return { start: 0, end: 1 };
    }
    let min = null;
    let max = null;
    normalizedOperations.forEach((operation, index) => {
      const startMs = Number.isFinite(operation.timestampMs) ? operation.timestampMs : index;
      const duration = Number.isFinite(operation.duration) ? operation.duration : 0;
      const opStart = startMs;
      const opEnd = opStart + duration;
      min = min === null ? opStart : Math.min(min, opStart);
      max = max === null ? opEnd : Math.max(max, opEnd);
    });
    if (min === null || max === null) {
      return { start: 0, end: 1 };
    }
    if (max <= min) {
      return { start: min, end: min + 1 };
    }
    return { start: min, end: max };
  }, [normalizedOperations]);

  const baseStart = timelineBounds.start;
  const baseEnd = timelineBounds.end;
  const baseDuration = Math.max(baseEnd - baseStart, 1);

  const handleTraceSelect = (traceId) => {
    if (!traceId) {
      setSelectedTraceId(null);
      setSelectedOperationId(null);
      return;
    }
    if (traceId !== selectedTraceId) {
      setSelectedOperationId(null);
    }
    setSelectedTraceId(traceId);
  };

  const handleOperationSelect = (operationId) => {
    setSelectedOperationId(operationId);
  };

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
    const isActive = selectedOperationId === operation.id;
    const title = `${operation.method} ${operation.path}`;

    return (
      <button
        key={operation.id}
        type="button"
        onClick={() => handleOperationSelect(operation.id)}
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

  if (!client?.traces?.list || !client?.traces?.get) {
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
    return <EmptyState message="No traces recorded yet. Start sending traffic to populate this view." />;
  }

  const traceSources = traceSummary?.sources || traceDetail?.sources || [];
  const operationCount = traceSummary?.operation_count || normalizedOperations.length;

  const metaEntries = (() => {
    if (!selectedOperation?.raw?.meta) return [];
    return Object.entries(selectedOperation.raw.meta)
      .filter(([key]) => key !== 'tags' && key !== 'trace')
      .map(([key, value]) => ({ key, value: toDisplayString(value) }));
  })();

  const genericTraceEntries = (() => {
    const generic = selectedOperation?.traceInfo?.generic;
    if (!generic || typeof generic !== 'object') return [];
    return Object.entries(generic).map(([key, value]) => ({ key, value: toDisplayString(value) }));
  })();

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
              onValueChange={handleTraceSelect}
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
        {selectedOperation ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {`${selectedOperation.method} ${selectedOperation.path}`}
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
                      Request time
                    </dt>
                    <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                      {formatTimestamp(selectedOperation.timestamp)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Operation ID
                    </dt>
                    <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.id}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Correlation ID
                    </dt>
                    <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.correlationId || '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Trace ID
                    </dt>
                    <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.traceInfo?.trace_id || '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                      Trace source
                    </dt>
                    <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                      {selectedOperation.traceInfo?.source || '—'}
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

              {selectedOperation.traceInfo?.generic && genericTraceEntries.length ? (
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                    Trace metadata
                  </Text>
                  <div className="mt-2 space-y-3">
                    {genericTraceEntries.map((entry) => (
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
            {isTraceDetailLoading ? 'Loading trace details…' : 'Select a span to inspect its details.'}
          </div>
        )}
      </Card>
    </div>
  );
}
