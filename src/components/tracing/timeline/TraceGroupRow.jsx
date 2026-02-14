// src/components/tracing/timeline/TraceGroupRow.jsx

import React from 'react';
import { Badge, Text } from '@tremor/react';
import { formatDuration } from '../../../utils/formatters.js';
import { classNames } from '../traceUtils.js';
import TraceTimelineBar from './TraceTimelineBar.jsx';
import TraceOperationRow from './TraceOperationRow.jsx';

const toId = (value) => (value == null ? null : String(value));

export default function TraceGroupRow({
  group,
  isExpanded,
  onToggle,
  selectedOperationId,
  onOperationSelect,
  timelineWidth,
  baseStart,
  baseDuration,
  selectedOperationRef
}) {
  const isGroupSelected = group.operations.some((op) => toId(op.id) === selectedOperationId);
  const { startMs, durationMs } = group;

  return (
    <div
      key={group.id}
      className={classNames(
        'rounded-tremor-small border border-transparent bg-white/60 shadow-sm transition dark:bg-dark-tremor-background',
        isGroupSelected
          ? 'border-tremor-brand shadow-tremor-card dark:border-tremor-brand'
          : 'hover:border-slate-200 hover:shadow-tremor-card dark:hover:border-slate-700'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(group.id)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div
          className={classNames(
            'grid w-full items-center gap-2 pl-0',
            timelineWidth < 45
              ? 'sm:grid-cols-[1.5rem_minmax(0,1fr)]'
              : 'sm:grid-cols-[1.5rem_minmax(0,1fr)_65%]'
          )}
        >
          {/* Column 0: caret/icon */}
          <div className="flex justify-center">
            <span
              className={classNames(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                isExpanded
                  ? 'border-tremor-brand text-tremor-brand'
                  : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
              )}
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={classNames(
                  'h-3.5 w-3.5 transition-transform',
                  isExpanded ? 'rotate-180' : 'rotate-0'
                )}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>

          {/* Column 1: flexible (label + optional subtitle) */}
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2 truncate">
              <Text className="truncate text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {group.label}
              </Text>
            </div>
            {group.subtitle ? (
              <Text className="truncate text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                {group.subtitle}
              </Text>
            ) : null}
          </div>

          {/* Column 2: duration + bar (flex-1) + badge */}
          <div
            className={classNames(
              'min-w-0 items-center gap-3',
              timelineWidth < 45 ? 'hidden' : 'flex'
            )}
          >
            <Text className="w-20 shrink-0 text-right text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {formatDuration(durationMs)}
            </Text>
            <div className="flex-1 min-w-0">
              <TraceTimelineBar
                start={startMs ?? baseStart}
                duration={durationMs}
                total={baseDuration}
                baseStart={baseStart}
                baseDuration={baseDuration}
                variant="brand"
              />
            </div>
            <div className="w-10 shrink-0 flex justify-center">
              <Badge color="slate">{group.operations.length}</Badge>
            </div>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-tremor-border px-3 py-2 dark:border-dark-tremor-border">
          <div className="space-y-1">
            {group.operations.map((operation, index) => (
              <TraceOperationRow
                key={operation.id}
                operation={operation}
                index={index}
                isSelected={selectedOperationId === toId(operation.id)}
                onSelect={() => onOperationSelect(operation.id)}
                timelineWidth={timelineWidth}
                baseStart={baseStart}
                baseDuration={baseDuration}
                selectedOperationRef={selectedOperationRef}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
