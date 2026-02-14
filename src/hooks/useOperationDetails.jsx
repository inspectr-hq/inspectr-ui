import { useCallback, useEffect, useRef, useState } from 'react';
import { useInspectr } from '../context/InspectrContext.jsx';

const CACHE_LIMIT = 25;
const toId = (value) => (value == null ? null : String(value));
const HTTP_COMPLETED_EVENT = 'dev.inspectr.operation.http.v1.completed';

const isTerminalStreamEvent = (eventType, payload) => {
  if (eventType === HTTP_COMPLETED_EVENT) return true;
  if (typeof eventType === 'string' && eventType.includes('.error')) return true;
  const status = Number(payload?.response?.status);
  return Number.isFinite(status) && status >= 400;
};

const mergeFrames = (prevFrames, nextFrames) => {
  const prev = Array.isArray(prevFrames) ? prevFrames : [];
  const next = Array.isArray(nextFrames) ? nextFrames : [];
  if (!next.length) return prev;
  const merged = [...prev];
  const seen = new Set(
    prev.map((frame) => `${frame?.id || ''}|${frame?.event || ''}|${frame?.timestamp || ''}`)
  );
  next.forEach((frame) => {
    const key = `${frame?.id || ''}|${frame?.event || ''}|${frame?.timestamp || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(frame);
    }
  });
  return merged.sort((a, b) => {
    const aMs = new Date(a?.timestamp || a?.time || 0).getTime();
    const bMs = new Date(b?.timestamp || b?.time || 0).getTime();
    const safeAMs = Number.isFinite(aMs) ? aMs : 0;
    const safeBMs = Number.isFinite(bMs) ? bMs : 0;
    return safeAMs - safeBMs;
  });
};

const mergeOperationDetails = (current, incoming, operationId, streamMeta = {}) => {
  const base = current && typeof current === 'object' ? current : {};
  const next = incoming && typeof incoming === 'object' ? incoming : {};

  const mergedResponse = {
    ...(base.response || {}),
    ...(next.response || {})
  };
  mergedResponse.event_frames = mergeFrames(
    base?.response?.event_frames,
    next?.response?.event_frames
  );

  const merged = {
    ...base,
    ...next,
    operation_id: next.operation_id || base.operation_id || operationId,
    id: next.id || base.id || operationId,
    request: {
      ...(base.request || {}),
      ...(next.request || {})
    },
    response: mergedResponse,
    timing: {
      ...(base.timing || {}),
      ...(next.timing || {})
    },
    meta: {
      ...(base.meta || {}),
      ...(next.meta || {})
    },
    __streamEventType: streamMeta.eventType || base.__streamEventType || null,
    __streamEventTime: streamMeta.eventTime || base.__streamEventTime || null
  };

  return merged;
};

export default function useOperationDetails(operationId, liveOperation = null) {
  const { client, setToast } = useInspectr();
  const [detailOperation, setDetailOperation] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());
  const cacheOrderRef = useRef([]);
  const reconciledOperationIdsRef = useRef(new Set());

  const cacheGet = (id) => {
    if (!id) return null;
    const cache = cacheRef.current;
    if (!cache.has(id)) return null;
    const order = cacheOrderRef.current;
    const index = order.indexOf(id);
    if (index >= 0) {
      order.splice(index, 1);
    }
    order.unshift(id);
    return cache.get(id);
  };

  const cacheSet = (id, value) => {
    if (!id) return;
    const cache = cacheRef.current;
    const order = cacheOrderRef.current;
    const exists = cache.has(id);
    cache.set(id, value);
    if (exists) {
      const index = order.indexOf(id);
      if (index >= 0) {
        order.splice(index, 1);
      }
    }
    order.unshift(id);
    while (order.length > CACHE_LIMIT) {
      const evictedId = order.pop();
      cache.delete(evictedId);
    }
  };

  const fetchDetail = useCallback(
    async (id, { force } = {}) => {
      if (!id || !client?.operations?.getOperation) {
        setDetailOperation(null);
        return;
      }

      const cached = force ? null : cacheGet(id);
      if (cached) {
        setDetailOperation(cached);
        setIsFetching(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsFetching(true);

      try {
        const result = await client.operations.getOperation(id);
        if (requestIdRef.current !== requestId) return;
        const existing = cacheRef.current.get(id);
        const hydrated = {
          ...result,
          __streamEventType: result?.__streamEventType || existing?.__streamEventType || null,
          __streamEventTime: result?.__streamEventTime || existing?.__streamEventTime || null
        };
        setDetailOperation(hydrated);
        cacheSet(id, hydrated);
        setIsFetching(false);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        setIsFetching(false);
        setToast({
          message: 'Failed to load request',
          subMessage: error?.message || 'Unable to fetch the operation details.',
          type: 'error'
        });
      }
    },
    [client, setToast]
  );

  useEffect(() => {
    if (!operationId) {
      setDetailOperation(null);
      return;
    }
    fetchDetail(operationId);
  }, [operationId, fetchDetail]);

  // Keep details view in sync with live operation updates from Dexie/list selection.
  useEffect(() => {
    if (!operationId || !liveOperation) return;
    if (toId(liveOperation.id) !== toId(operationId)) return;
    // Only replace detail state when the incoming live record has full operation shape.
    // List records from Dexie are flattened and may not include request/response objects.
    if (!liveOperation.request || !liveOperation.response) return;
    setDetailOperation(liveOperation);
    cacheSet(operationId, liveOperation);
  }, [liveOperation, operationId]);

  useEffect(() => {
    reconciledOperationIdsRef.current.clear();
  }, [client]);

  useEffect(() => {
    const handleStreamUpdate = (evt) => {
      const streamOperationId = toId(evt?.detail?.operationId);
      const currentOperationId = toId(operationId);
      if (!streamOperationId || !currentOperationId || streamOperationId !== currentOperationId) {
        return;
      }
      const payload = evt?.detail?.payload;
      const streamMeta = {
        eventType: evt?.detail?.eventType || null,
        eventTime: evt?.detail?.eventTime || null
      };
      if (!payload || typeof payload !== 'object') return;

      setDetailOperation((prev) => {
        const merged = mergeOperationDetails(prev, payload, streamOperationId, streamMeta);
        cacheSet(currentOperationId, merged);
        return merged;
      });

      if (isTerminalStreamEvent(streamMeta.eventType, payload)) {
        const reconciled = reconciledOperationIdsRef.current;
        if (!reconciled.has(currentOperationId)) {
          reconciled.add(currentOperationId);
          fetchDetail(currentOperationId, { force: true });
        }
      }
    };

    window.addEventListener('inspectr:operation-stream-update', handleStreamUpdate);
    return () => window.removeEventListener('inspectr:operation-stream-update', handleStreamUpdate);
  }, [fetchDetail, operationId]);

  return { detailOperation, fetchDetail, isFetching };
}
