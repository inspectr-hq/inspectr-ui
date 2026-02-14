// src/components/tracing/traceUtils.js

import { normalizeTags } from '../../utils/normalizeTags.js';

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const safeParseUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const parseTimestamp = (value, fallback) => {
  if (!value) return fallback ?? null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : (fallback ?? null);
};

export const toDisplayString = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const formatTraceLabel = (trace) => {
  if (!trace) return 'Unknown trace';
  return trace.trace_id || trace.traceId || 'Trace';
};

export const normalizeTraceOperation = (operation, index = 0) => {
  if (!operation) return null;

  const request = operation.request || {};
  const response = operation.response || {};
  const timing = operation.timing || {};
  const meta = operation.meta || {};
  const url = request.url || '';
  const parsedUrl = safeParseUrl(url);
  const timestamp =
    request.timestamp || response.timestamp || meta.timestamp || operation.timestamp || null;
  const timestampMs = parseTimestamp(timestamp, index);
  const durationValue = Number.isFinite(Number(timing.duration))
    ? Number(timing.duration)
    : Number.isFinite(Number(operation.duration))
      ? Number(operation.duration)
      : null;

  const tagsSource = Array.isArray(meta.tags)
    ? meta.tags
    : Array.isArray(operation.tags)
      ? operation.tags
      : [];

  const rawOperationId = operation.operation_id || operation.operationId || operation.id || null;

  return {
    id: rawOperationId != null ? String(rawOperationId) : `operation-${index}`,
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
    tags: normalizeTags(tagsSource),
    correlationId: operation.correlation_id || null,
    traceInfo: meta.trace || null,
    raw: operation
  };
};

export const computeTraceDuration = (traceSummary, operations) => {
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
    const { start, end } = getOperationTiming(operation, index);
    min = min === null ? start : Math.min(min, start);
    max = max === null ? end : Math.max(max, end);
  });

  if (min === null || max === null || max < min) return null;
  return max - min;
};

export const getOperationTiming = (operation, fallbackIndex = 0) => {
  const start = Number.isFinite(operation.timestampMs) ? operation.timestampMs : fallbackIndex;
  const duration = Number.isFinite(operation.duration) ? operation.duration : 0;
  const end = start + duration;
  return { start, duration, end };
};

export const buildTimelineBounds = (operations) => {
  if (!operations?.length) {
    return { start: 0, end: 1, duration: 1 };
  }

  let min = null;
  let max = null;
  operations.forEach((operation, index) => {
    const { start, end } = getOperationTiming(operation, index);
    min = min === null ? start : Math.min(min, start);
    max = max === null ? end : Math.max(max, end);
  });

  if (min === null || max === null) {
    return { start: 0, end: 1, duration: 1 };
  }

  const duration = Math.max(max - min, 1);
  return { start: min, end: max, duration };
};

export const getBarColorClass = (status) => {
  if (status >= 500) return 'bg-rose-500/80';
  if (status >= 400) return 'bg-amber-500/80';
  if (status >= 300) return 'bg-blue-500/70';
  if (status >= 200) return 'bg-emerald-500/80';
  return 'bg-slate-400/70';
};

export const getDotColorClass = (status) => {
  if (status >= 500) return 'bg-rose-500';
  if (status >= 400) return 'bg-amber-500';
  if (status >= 300) return 'bg-blue-500';
  if (status >= 200) return 'bg-emerald-500';
  return 'bg-slate-400';
};

export const extractMetaEntries = (operation) => {
  if (!operation?.raw?.meta) return [];
  return Object.entries(operation.raw.meta)
    .filter(([key]) => key !== 'tags' && key !== 'trace')
    .map(([key, value]) => ({ key, value: toDisplayString(value) }));
};

export const extractGenericTraceEntries = (operation) => {
  const generic = operation?.traceInfo?.generic;
  if (!generic || typeof generic !== 'object') return [];
  return Object.entries(generic).map(([key, value]) => ({ key, value: toDisplayString(value) }));
};

export const pickAgentLabel = (operation) => {
  if (!operation?.tags?.length) return null;
  const agentTag =
    operation.tags.find((tag) => tag.keyToken === 'agent') ||
    operation.tags.find((tag) => tag.key === 'agent');
  if (!agentTag) return null;
  return agentTag.value || agentTag.display || null;
};
