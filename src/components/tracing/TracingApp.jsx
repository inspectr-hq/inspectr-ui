// src/components/tracing/TracingApp.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TraceTimelineMode from './TraceTimelineMode.jsx';

const buildTraceHash = (traceId, operationId) => {
  let hash = '#traces';
  if (traceId) {
    hash += `/${encodeURIComponent(traceId)}`;
    if (operationId) {
      hash += `/${encodeURIComponent(operationId)}`;
    }
  }
  return hash;
};

const navigateToHash = (nextHash) => {
  if (!nextHash) return;
  if (window.location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = nextHash;
  }
};

export default function TracingApp({ route }) {
  const initialTraceId = route?.operationId || route?.params?.trace || null;
  const initialOperationId = route?.subTab || route?.params?.operation || null;

  const [currentTraceId, setCurrentTraceId] = useState(initialTraceId);
  const [currentOperationId, setCurrentOperationId] = useState(initialOperationId);
  const [originOperationId, setOriginOperationId] = useState(initialOperationId || null);

  const traceRef = useRef(currentTraceId);
  const operationRef = useRef(currentOperationId);
  const originOperationIdRef = useRef(originOperationId);
  const previousRouteRef = useRef({ traceId: initialTraceId, operationId: initialOperationId });

  useEffect(() => {
    traceRef.current = currentTraceId;
  }, [currentTraceId]);

  useEffect(() => {
    operationRef.current = currentOperationId;
  }, [currentOperationId]);

  useEffect(() => {
    originOperationIdRef.current = originOperationId;
  }, [originOperationId]);

  useEffect(() => {
    const prev = previousRouteRef.current;
    const routeChanged = initialTraceId !== prev.traceId || initialOperationId !== prev.operationId;

    if (routeChanged) {
      previousRouteRef.current = { traceId: initialTraceId, operationId: initialOperationId };
      setCurrentTraceId(initialTraceId || null);
      setCurrentOperationId(initialOperationId || null);
      setOriginOperationId(initialOperationId || null);
      return;
    }

    if (initialTraceId !== currentTraceId) {
      setCurrentTraceId(initialTraceId || null);
    }

    if (initialOperationId !== currentOperationId) {
      setCurrentOperationId(initialOperationId || null);
    }

    if (!originOperationIdRef.current && initialOperationId) {
      setOriginOperationId(initialOperationId);
    }
  }, [initialTraceId, initialOperationId, currentTraceId, currentOperationId]);

  const handleTraceChange = useCallback((nextTraceId) => {
    if (!nextTraceId) return;
    setCurrentTraceId(nextTraceId);
    if (nextTraceId !== traceRef.current) {
      setOriginOperationId(null);
      setCurrentOperationId(null);
      operationRef.current = null;
    }
    const nextHash = buildTraceHash(
      nextTraceId,
      nextTraceId === traceRef.current ? operationRef.current : null
    );
    navigateToHash(nextHash);
  }, []);

  const handleOperationChange = useCallback((nextOperationId) => {
    if (!nextOperationId) return;
    setCurrentOperationId(nextOperationId);
    const traceId = traceRef.current;
    if (!traceId) return;
    if (!originOperationIdRef.current) {
      setOriginOperationId(nextOperationId);
    }
    const nextHash = buildTraceHash(traceId, nextOperationId);
    navigateToHash(nextHash);
  }, []);

  const traceSummaryLabel = useMemo(() => currentTraceId || '—', [currentTraceId]);
  const backOperationId =
    originOperationIdRef.current || initialOperationId || operationRef.current || '';
  const backHref = backOperationId ? `#inspectr/${backOperationId}/request` : '#inspectr';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={backHref}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-dark-tremor-background-subtle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 0-1.06l4-4a.75.75 0 0 1 1.06 1.06L4.56 9H16a.75.75 0 0 1 0 1.5H4.56l2.65 2.65a.75.75 0 0 1 0 1.06Z"
              clipRule="evenodd"
            />
          </svg>
          Back to request
        </a>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Trace {traceSummaryLabel}
        </div>
      </div>

      <TraceTimelineMode
        initialTraceId={initialTraceId}
        initialOperationId={initialOperationId}
        onTraceChange={handleTraceChange}
        onOperationChange={handleOperationChange}
        isActive
      />
    </div>
  );
}
