// src/components/insights/insightsUtils.js

import { normalizeTags } from '../../utils/normalizeTags.js';

const safeParseUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch (err) {
    return null;
  }
};

export const normalizeOperation = (record) => {
  if (!record) return null;

  const raw = record.raw?.data || {};
  const request = raw.request || {};
  const response = raw.response || {};
  const timing = raw.timing || {};

  const method = (record.method || request.method || 'GET').toUpperCase();
  const status = record.status_code ?? response.status ?? null;
  const durationValue = record.duration ?? timing.duration;
  const duration = Number.isFinite(Number(durationValue)) ? Number(durationValue) : null;
  const timestamp = record.time || request.timestamp || null;
  const parsedUrl = safeParseUrl(request.url || record.url || '');
  const path =
    request.path || record.path || parsedUrl?.pathname || request.url || record.url || '/';
  const host = request.server || parsedUrl?.host || '';

  const tagsSource = Array.isArray(raw.meta?.tags)
    ? raw.meta.tags
    : Array.isArray(record.tags)
      ? record.tags
      : [];
  const tags = normalizeTags(tagsSource);

  return {
    id: record.id,
    operationId: record.operation_id,
    method,
    status,
    duration,
    timestamp,
    timestampMs: timestamp ? Date.parse(timestamp) : null,
    path,
    host,
    url: request.url || record.url || '',
    request,
    response,
    timing,
    tags,
    raw
  };
};

export const formatChartLabel = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const endpointKey = (method, path) => `${method} ${path}`;
