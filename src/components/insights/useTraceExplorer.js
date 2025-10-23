// src/components/insights/useTraceExplorer.js

import { useEffect, useMemo, useState } from 'react';
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

  const [selectedOperationId, setSelectedOperationId] = useState(initialOperationId ?? null);

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
    if (!supportsTraces) return;

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
  }, [supportsTraces, client, listLimit]);

  useEffect(() => {
    if (!traceList.length) {
      if (selectedTraceId !== null) {
        setSelectedTraceId(null);
      }
      return;
    }

    if (selectedTraceId && traceList.some((trace) => trace.trace_id === selectedTraceId)) {
      return;
    }

    const initialExists = initialTraceId && traceList.some((trace) => trace.trace_id === initialTraceId);
    const fallbackTraceId = initialExists ? initialTraceId : traceList[0].trace_id;

    if (fallbackTraceId !== selectedTraceId) {
      setSelectedTraceId(fallbackTraceId);
    }
  }, [traceList, selectedTraceId, initialTraceId]);

  useEffect(() => {
    if (!supportsTraces || !selectedTraceId) {
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
  }, [supportsTraces, client, selectedTraceId, detailLimit]);

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
    const fallbackOperationId = initialExists
      ? initialOperationId
      : normalizedOperations[0].id;

    if (fallbackOperationId !== selectedOperationId) {
      setSelectedOperationId(fallbackOperationId);
    }
  }, [normalizedOperations, selectedOperationId, initialOperationId]);

  const selectedOperation = useMemo(() => {
    if (!selectedOperationId) return null;
    return (
      normalizedOperations.find((operation) => operation.id === selectedOperationId) || null
    );
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
    if (!isActive || typeof onTraceChange !== 'function') return;
    onTraceChange(selectedTraceId || null);
  }, [selectedTraceId, onTraceChange, isActive]);

  useEffect(() => {
    if (!isActive || typeof onOperationChange !== 'function') return;
    onOperationChange(selectedOperationId || null);
  }, [selectedOperationId, onOperationChange, isActive]);

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
    selectedOperation
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
