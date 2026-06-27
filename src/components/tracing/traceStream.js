const TRACE_ID_KEYS = ['trace_id', 'traceId', 'traceID'];
const OPERATION_ID_KEYS = ['operationId', 'operation_id', 'id'];
const HTTP_COMPLETED_EVENT = 'dev.inspectr.operation.http.v1.completed';

const normalizeTraceId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const getTraceMetadata = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  return payload?.meta?.trace || payload?.data?.meta?.trace || null;
};

export const getOperationStreamTraceId = (payload) => {
  const trace = getTraceMetadata(payload);
  if (!trace || typeof trace !== 'object') return null;

  for (const key of TRACE_ID_KEYS) {
    const traceId = normalizeTraceId(trace[key]);
    if (traceId) return traceId;
  }

  return null;
};

export const getOperationStreamOperationId = (streamDetail) => {
  if (!streamDetail || typeof streamDetail !== 'object') return null;

  for (const key of OPERATION_ID_KEYS) {
    const operationId = normalizeTraceId(streamDetail[key]);
    if (operationId) return operationId;
  }

  const payload = streamDetail.payload;
  if (!payload || typeof payload !== 'object') return null;

  for (const key of OPERATION_ID_KEYS) {
    const operationId = normalizeTraceId(payload[key]);
    if (operationId) return operationId;
  }

  return null;
};

export const isTerminalOperationStreamEvent = (eventType) => {
  if (eventType === HTTP_COMPLETED_EVENT) return true;
  return typeof eventType === 'string' && eventType.includes('.error');
};

export const shouldRefreshTraceFromOperationStream = (activeTraceId, payload, options = {}) => {
  const normalizedActiveTraceId = normalizeTraceId(activeTraceId);
  if (!normalizedActiveTraceId) return false;
  if (getOperationStreamTraceId(payload) !== normalizedActiveTraceId) return false;

  const operationId = normalizeTraceId(options.operationId);
  if (!operationId) return false;

  const knownOperationIds = options.knownOperationIds;
  const isKnownOperation =
    knownOperationIds instanceof Set
      ? knownOperationIds.has(operationId)
      : Array.isArray(knownOperationIds) && knownOperationIds.includes(operationId);

  if (!isKnownOperation) return true;
  return isTerminalOperationStreamEvent(options.eventType);
};
