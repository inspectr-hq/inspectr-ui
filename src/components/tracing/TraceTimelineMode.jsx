// src/components/tracing/TraceTimelineMode.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@tremor/react';
import TraceOperationDetail from './TraceOperationDetail.jsx';
import TraceOperationMcpDetail from './TraceOperationMcpDetail.jsx';
import { pickAgentLabel } from './traceUtils.js';
import { useTraceExplorer } from './useTraceExplorer.js';
import useLocalStorage from '../../hooks/useLocalStorage.jsx';
import TraceGroupRow from './timeline/TraceGroupRow.jsx';
import PanelResizer from './timeline/PanelResizer.jsx';
import TraceTimelineHeader from './timeline/TraceTimelineHeader.jsx';
import TraceMetadata from './timeline/TraceMetadata.jsx';
import TraceEmptyStates from './timeline/TraceEmptyStates.jsx';
import { getOperationTiming } from './traceUtils.js';

const DEFAULT_TIMELINE_WIDTH = 56;
const MIN_TIMELINE_WIDTH = 30;
const MAX_TIMELINE_WIDTH = 75;
const TIMELINE_WIDTH_STORAGE_KEY = 'traceTimelineWidth';
const PANEL_MAX_HEIGHT = 'calc(100vh - 64px)';

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

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
    selectedOperation,
    refreshTraceList,
    refreshTraceDetail
  } = useTraceExplorer({
    initialTraceId,
    initialOperationId,
    onTraceChange,
    onOperationChange,
    isActive
  });

  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [timelineWidthRaw, setTimelineWidthRaw] = useLocalStorage(
    TIMELINE_WIDTH_STORAGE_KEY,
    String(DEFAULT_TIMELINE_WIDTH)
  );
  const timelineWidth = useMemo(() => {
    const parsed = Number(timelineWidthRaw);
    if (Number.isFinite(parsed) && parsed >= MIN_TIMELINE_WIDTH && parsed <= MAX_TIMELINE_WIDTH) {
      return parsed;
    }
    return DEFAULT_TIMELINE_WIDTH;
  }, [timelineWidthRaw]);
  const isResizingRef = useRef(false);
  const panelContainerRef = useRef(null);
  const selectedOperationRef = useRef(null);
  const lastScrolledOperationIdRef = useRef(null);

  const baseStart = timeline.start;
  const baseDuration = timeline.duration;

  const allGroups = useMemo(() => {
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
          group.startMs != null && group.endMs != null
            ? Math.max(group.endMs - group.startMs, 0)
            : 0,
        maxStatus: deriveGroupStatus(group.operations)
      }))
      .sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  }, [normalizedOperations]);

  const groups = allGroups;

  const isRefreshingTrace = isTraceDetailLoading || isTraceListLoading;

  const handleRefresh = () => {
    refreshTraceList();
    refreshTraceDetail();
  };

  useEffect(() => {
    if (!groups.length) {
      setExpandedGroups(new Set());
      return;
    }
    setExpandedGroups(new Set(groups.map((group) => group.id)));
  }, [selectedTraceId, groups]);

  // Ensure the group containing the selected operation is expanded
  useEffect(() => {
    if (!selectedOperationId || !groups.length) return;

    const groupContainingOperation = groups.find((group) =>
      group.operations.some((op) => op.id === selectedOperationId)
    );

    if (groupContainingOperation && !expandedGroups.has(groupContainingOperation.id)) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.add(groupContainingOperation.id);
        return next;
      });
    }
  }, [selectedOperationId, groups, expandedGroups]);

  // Auto-scroll to selected operation
  useEffect(() => {
    if (!selectedOperationId) return;

    // Use a small timeout to allow the DOM to update after group expansion
    const timeoutId = setTimeout(() => {
      if (
        selectedOperationRef.current &&
        lastScrolledOperationIdRef.current !== selectedOperationId
      ) {
        selectedOperationRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        lastScrolledOperationIdRef.current = selectedOperationId;
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [selectedOperationId, expandedGroups]);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (event) => {
      if (!isResizingRef.current || !panelContainerRef.current) return;
      const rect = panelContainerRef.current.getBoundingClientRect();
      if (!rect.width) return;
      const rawPercent = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(rawPercent, MIN_TIMELINE_WIDTH), MAX_TIMELINE_WIDTH);
      setTimelineWidthRaw(String(clamped));
    },
    [setTimelineWidthRaw]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  const tokenTotals = useMemo(() => {
    let requestSum = 0;
    let responseSum = 0;
    let totalSum = 0;
    let hasRequest = false;
    let hasResponse = false;
    let hasTotal = false;

    normalizedOperations.forEach((operation) => {
      if (!operation) return;
      const meta =
        operation?.meta?.mcp ||
        operation?.raw?.meta?.mcp ||
        operation?.meta?.trace?.mcp ||
        operation?.raw?.meta?.trace?.mcp;
      const tokens = meta?.tokens;
      if (!tokens) return;

      const req = toFiniteNumber(tokens.request);
      const res = toFiniteNumber(tokens.response);
      const tot = toFiniteNumber(tokens.total);

      if (req !== null) {
        hasRequest = true;
        requestSum += req;
      }
      if (res !== null) {
        hasResponse = true;
        responseSum += res;
      }
      if (tot !== null) {
        hasTotal = true;
        totalSum += tot;
      } else if (req !== null || res !== null) {
        hasTotal = true;
        totalSum += (req ?? 0) + (res ?? 0);
      }
    });

    const hasAny = hasRequest || hasResponse || hasTotal;
    if (!hasAny) return null;

    return {
      request: hasRequest ? requestSum : null,
      response: hasResponse ? responseSum : null,
      total: hasTotal ? totalSum : null
    };
  }, [normalizedOperations]);

  // Check if we should show an empty state
  if (
    !supportsTraces ||
    (isTraceListLoading && !traceList.length) ||
    (traceListError && !traceList.length) ||
    !traceList.length
  ) {
    return (
      <TraceEmptyStates
        supportsTraces={supportsTraces}
        isTraceListLoading={isTraceListLoading}
        traceList={traceList}
        traceListError={traceListError}
      />
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

  const isMcpOperation = (op) => {
    if (!op) return false;
    const meta = op.meta || {};
    const rawMeta = op.raw?.meta || {};
    const traceMeta = meta.trace || rawMeta.trace || {};
    const mcpMeta = meta.mcp || rawMeta.mcp || traceMeta.mcp;
    const hasProtocol = meta.protocol === 'mcp' || rawMeta.protocol === 'mcp';
    return Boolean((mcpMeta && Object.keys(mcpMeta).length) || hasProtocol);
  };

  return (
    <div
      ref={panelContainerRef}
      className="flex flex-col gap-4 lg:flex-row"
      style={{ maxHeight: PANEL_MAX_HEIGHT }}
    >
      <Card
        id="trace-timeline"
        className="w-full overflow-y-auto rounded-tremor-small border border-tremor-border p-6 dark:border-dark-tremor-border"
        style={{ width: `${timelineWidth}%`, maxHeight: PANEL_MAX_HEIGHT }}
      >
        <TraceTimelineHeader
          operationCount={operationCount}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshingTrace}
          hasError={!!traceDetailError}
          traceSources={traceSources}
        />

        <div className="mt-6 flex flex-col gap-4 min-w-0">
          <TraceMetadata
            traceSummary={traceSummary}
            traceDurationMs={traceDurationMs}
            traceDetailMeta={traceDetailMeta}
            traceListMeta={traceListMeta}
            isTraceDetailLoading={isTraceDetailLoading}
            operationCount={operationCount}
            tokenTotals={tokenTotals}
          />

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
              groups.map((group) => (
                <TraceGroupRow
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggle={handleToggleGroup}
                  selectedOperationId={selectedOperationId}
                  onOperationSelect={setSelectedOperationId}
                  timelineWidth={timelineWidth}
                  baseStart={baseStart}
                  baseDuration={baseDuration}
                  selectedOperationRef={selectedOperationRef}
                />
              ))
            ) : (
              <Card className="rounded-tremor-small border border-dashed border-tremor-border p-6 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                No operations recorded for this trace.
              </Card>
            )}
          </div>
        </div>
      </Card>

      <PanelResizer
        onMouseDown={() => {
          isResizingRef.current = true;
        }}
        onDoubleClick={() => {
          setTimelineWidthRaw(String(DEFAULT_TIMELINE_WIDTH));
        }}
      />

      <Card
        id="trace-details"
        className="w-full overflow-y-auto rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border"
        style={{ width: `${100 - timelineWidth}%`, maxHeight: PANEL_MAX_HEIGHT }}
      >
        {isMcpOperation(selectedOperation) ? (
          <TraceOperationMcpDetail operation={selectedOperation} isLoading={isTraceDetailLoading} />
        ) : (
          <TraceOperationDetail operation={selectedOperation} isLoading={isTraceDetailLoading} />
        )}
      </Card>
    </div>
  );
}
