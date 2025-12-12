// src/components/tracing/timeline/TraceTimelineBar.jsx

import React from 'react';
import { classNames, getBarColorClass } from '../traceUtils.js';

const MIN_BAR_WIDTH_PERCENT = 3;

export default function TraceTimelineBar({
  start,
  duration,
  status,
  total,
  baseStart,
  baseDuration,
  variant = 'status'
}) {
  if (!Number.isFinite(total) || total <= 0) {
    return (
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle" />
    );
  }

  // Use `total` (not baseDuration) and compute right edge to avoid 0px widths at ~100% offsets
  const denom = Number.isFinite(total) && total > 0 ? total : baseDuration;
  const rawOffset = ((start - baseStart) / denom) * 100;
  const rawWidth = (duration / denom) * 100;

  // Clamp helper
  const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);

  // Clamp offset, then clamp the right edge
  let offset = clamp(rawOffset);
  let right = clamp(offset + rawWidth);

  // Derive width and enforce a minimum visible width
  let width = right - offset;
  if (!Number.isFinite(width) || width <= 0) {
    width = MIN_BAR_WIDTH_PERCENT;
    if (offset >= 100) offset = 100 - width; // pull left if at the edge
  } else if (width < MIN_BAR_WIDTH_PERCENT) {
    // Expand to minimum width while keeping inside the container
    const desiredRight = Math.min(100, offset + MIN_BAR_WIDTH_PERCENT);
    width = desiredRight - offset;
    if (width < MIN_BAR_WIDTH_PERCENT) {
      offset = Math.max(0, 100 - MIN_BAR_WIDTH_PERCENT);
      width = MIN_BAR_WIDTH_PERCENT;
    }
  }

  return (
    <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-dark-tremor-background-subtle">
      <span
        className={classNames(
          'absolute top-0 h-2 rounded-full transition-all',
          variant === 'brand'
            ? 'bg-tremor-brand/80 dark:bg-tremor-brand/60'
            : getBarColorClass(status ?? null)
        )}
        style={{ left: `${offset}%`, width: `${width}%` }}
      />
    </div>
  );
}
