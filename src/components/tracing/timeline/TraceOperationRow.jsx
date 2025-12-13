// src/components/tracing/timeline/TraceOperationRow.jsx

import React from 'react';
import { Text } from '@tremor/react';
import StatusBadge from '../../insights/StatusBadge.jsx';
import MethodBadge from '../../insights/MethodBadge.jsx';
import McpBadge from '../../mcp/McpBadge.jsx';
import { formatDuration, formatTimestamp } from '../../../utils/formatters.js';
import { classNames, getDotColorClass, getOperationTiming } from '../traceUtils.js';
import TraceTimelineBar from './TraceTimelineBar.jsx';

export default function TraceOperationRow({
  operation,
  index,
  isSelected,
  onSelect,
  timelineWidth,
  baseStart,
  baseDuration,
  selectedOperationRef
}) {
  const { start, duration } = getOperationTiming(operation, index);
  const mcpMeta =
    operation?.meta?.mcp ||
    operation?.raw?.meta?.mcp ||
    operation?.meta?.trace?.mcp ||
    operation?.raw?.meta?.trace?.mcp;
  const mcpLabel = mcpMeta?.name || mcpMeta?.method || null;

  return (
    <button
      ref={isSelected ? selectedOperationRef : null}
      key={operation.id}
      type="button"
      onClick={onSelect}
      className={classNames(
        'flex w-full items-center gap-3 rounded-tremor-small px-0 py-1.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isSelected
          ? 'bg-tremor-brand-faint text-tremor-content-strong ring-0 dark:bg-tremor-brand-faint/40'
          : 'hover:bg-slate-100 dark:hover:bg-dark-tremor-background-subtle'
      )}
    >
      <div
        className={classNames(
          'grid w-full items-center gap-2 pl-0',
          timelineWidth < 45
            ? 'sm:grid-cols-[1.5rem_minmax(0,1fr)]'
            : 'sm:grid-cols-[1.5rem_minmax(0,1fr)_65%]'
        )}
      >
        {/* Column 0: status dot */}
        <div className="flex justify-center">
          <span
            className={classNames(
              'h-2 w-2 rounded-full',
              getDotColorClass(operation.status ?? null)
            )}
          />
        </div>

        {/* Column 1: label + timestamp */}
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            <MethodBadge method={operation.method} />
            <span className="truncate">{operation.path}</span>
            {mcpLabel ? <McpBadge method={mcpMeta?.method || ''}>{mcpLabel}</McpBadge> : null}
          </div>
          <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
            {formatTimestamp(operation.timestamp, { includeMilliseconds: true })}
          </Text>
        </div>

        {/* Column 2: duration + bar (flex-1) + status badge */}
        <div
          className={classNames(
            'min-w-0 items-center gap-3',
            timelineWidth < 45 ? 'hidden' : 'flex'
          )}
        >
          <Text className="w-20 shrink-0 text-right text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {formatDuration(operation.duration)}
          </Text>
          <div className="flex-1 min-w-0">
            <TraceTimelineBar
              start={start}
              duration={duration}
              status={operation.status}
              total={baseDuration}
              baseStart={baseStart}
              baseDuration={baseDuration}
            />
          </div>
          <div className="w-10 shrink-0 flex justify-center">
            <StatusBadge status={operation.status} />
          </div>
        </div>
      </div>
    </button>
  );
}
