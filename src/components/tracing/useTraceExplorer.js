// src/components/tracing/useTraceExplorer.js

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInspectr } from '../../context/InspectrContext.jsx';
import {
  buildTimelineBounds,
  computeTraceDuration,
  formatTraceLabel,
  normalizeTraceOperation
} from './traceUtils.js';

const DEFAULT_LIMIT = 50;

export const useTraceExplorer = ({
  initialTraceId = null,
  initialOperationId = null,
  onTraceChange,
  onOperationChange,
  isActive = true,
  listLimit = DEFAULT_LIMIT,
  detailLimit = DEFAULT_LIMIT
} = {}) => {
  const { client } = useInspectr();
  const supportsTraces = Boolean(client?.traces?.list && client?.traces?.get);

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

  const [traceListRefreshKey, setTraceListRefreshKey] = useState(0);

  const [selectedOperationId, setSelectedOperationId] = useState(initialOperationId ?? null);

  const traceChangeCallbackRef = useRef(onTraceChange);
  const operationChangeCallbackRef = useRef(onOperationChange);
  const lastTraceNotificationRef = useRef(undefined);
  const lastOperationNotificationRef = useRef(undefined);

  useEffect(() => {
    traceChangeCallbackRef.current = onTraceChange;
  }, [onTraceChange]);

  useEffect(() => {
    operationChangeCallbackRef.current = onOperationChange;
  }, [onOperationChange]);

  useEffect(() => {
    if (initialTraceId && initialTraceId !== selectedTraceId) {
      setSelectedTraceId(initialTraceId);
    }
  }, [initialTraceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialOperationId && initialOperationId !== selectedOperationId) {
      setSelectedOperationId(initialOperationId);
    }
  }, [initialOperationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supportsTraces || !isActive) return;

    let alive = true;
    setIsTraceListLoading(true);
    setTraceListError(null);

    client.traces
      .list({ limit: listLimit })
      .then((result) => {
        if (!alive) return;
        setTraceList(Array.isArray(result?.traces) ? result.traces : []);
        setTraceListMeta(result?.meta || null);
      })
      .catch((err) => {
        if (!alive) return;
        setTraceListError(err);
        setTraceList([]);
        setTraceListMeta(null);
      })
      .finally(() => {
        if (!alive) return;
        setIsTraceListLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [supportsTraces, client, listLimit, isActive, traceListRefreshKey]);

  useEffect(() => {
    if (!traceList.length) return;

    if (selectedTraceId) {
      return;
    }

    const initialExists =
      initialTraceId && traceList.some((trace) => trace.trace_id === initialTraceId);
    const fallbackTraceId = initialExists ? initialTraceId : (traceList[0]?.trace_id ?? null);

    if (fallbackTraceId && fallbackTraceId !== selectedTraceId) {
      setSelectedTraceId(fallbackTraceId);
    }
  }, [traceList, selectedTraceId, initialTraceId]);

  useEffect(() => {
    if (!supportsTraces || !isActive || !selectedTraceId) {
      setTraceDetail(null);
      setTraceDetailMeta(null);
      setTraceOperations([]);
      setTraceDetailError(null);
      return;
    }

    let alive = true;
    setIsTraceDetailLoading(true);
    setTraceDetailError(null);

    client.traces
      .get(selectedTraceId, { limit: detailLimit })
      .then((result) => {
        if (!alive) return;
        setTraceDetail(result?.trace || null);
        setTraceDetailMeta(result?.meta || null);
        setTraceOperations(Array.isArray(result?.operations) ? result.operations : []);
      })
      .catch((err) => {
        if (!alive) return;
        setTraceDetailError(err);
        setTraceDetail(null);
        setTraceDetailMeta(null);
        setTraceOperations([]);
      })
      .finally(() => {
        if (!alive) return;
        setIsTraceDetailLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [supportsTraces, client, selectedTraceId, detailLimit, isActive]);

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

    if (
      selectedOperationId &&
      normalizedOperations.some((operation) => operation.id === selectedOperationId)
    ) {
      return;
    }

    const initialExists =
      initialOperationId &&
      normalizedOperations.some((operation) => operation.id === initialOperationId);
    const fallbackOperationId = initialExists ? initialOperationId : normalizedOperations[0].id;

    if (fallbackOperationId !== selectedOperationId) {
      setSelectedOperationId(fallbackOperationId);
    }
  }, [normalizedOperations, selectedOperationId, initialOperationId]);

  const selectedOperation = useMemo(() => {
    if (!selectedOperationId) return null;
    return normalizedOperations.find((operation) => operation.id === selectedOperationId) || null;
  }, [normalizedOperations, selectedOperationId]);

  const traceSummary = useMemo(() => {
    if (traceDetail) return traceDetail;
    return traceList.find((trace) => trace.trace_id === selectedTraceId) || null;
  }, [traceDetail, traceList, selectedTraceId]);

  const traceSources = traceSummary?.sources || traceDetail?.sources || [];
  const traceDurationMs = useMemo(
    () => computeTraceDuration(traceSummary, normalizedOperations),
    [traceSummary, normalizedOperations]
  );

  const timeline = useMemo(() => buildTimelineBounds(normalizedOperations), [normalizedOperations]);

  useEffect(() => {
    if (!isActive || typeof traceChangeCallbackRef.current !== 'function') return;
    if (lastTraceNotificationRef.current === selectedTraceId) return;
    lastTraceNotificationRef.current = selectedTraceId;
    traceChangeCallbackRef.current(selectedTraceId || null);
  }, [selectedTraceId, isActive]);

  useEffect(() => {
    if (!isActive || typeof operationChangeCallbackRef.current !== 'function') return;
    if (lastOperationNotificationRef.current === selectedOperationId) return;
    lastOperationNotificationRef.current = selectedOperationId;
    operationChangeCallbackRef.current(selectedOperationId || null);
  }, [selectedOperationId, isActive]);

  useEffect(() => {
    if (isActive) return;
    setIsTraceListLoading(false);
    setIsTraceDetailLoading(false);
  }, [isActive]);

  const selectTrace = (traceId) => {
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

  const selectOperation = (operationId) => {
    setSelectedOperationId(operationId);
  };

  const refreshTraceList = () => setTraceListRefreshKey((value) => value + 1);
  return {
    supportsTraces,
    traceList,
    traceListMeta,
    isTraceListLoading,
    traceListError,
    traceDetail,
    traceDetailMeta,
    traceDetailError,
    isTraceDetailLoading,
    selectedTraceId,
    setSelectedTraceId: selectTrace,
    traceSummary,
    traceSources,
    traceDurationMs,
    normalizedOperations,
    timeline,
    selectedOperationId,
    setSelectedOperationId: selectOperation,
    selectedOperation,
    refreshTraceList
  };
};

export const ensureTraceViewIndex = (traceList, traceId, fallbackIndex = 0) => {
  if (!traceList?.length) return null;
  if (traceId && traceList.some((trace) => trace.trace_id === traceId)) {
    return traceId;
  }
  return traceList[Math.max(0, Math.min(traceList.length - 1, fallbackIndex))]?.trace_id ?? null;
};

export const getTraceDisplayName = (trace) => formatTraceLabel(trace);
