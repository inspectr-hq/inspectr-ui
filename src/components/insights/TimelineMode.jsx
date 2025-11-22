// src/components/insights/TimelineMode.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@tremor/react';
import TagPill from '../TagPill.jsx';
import TagFilterDropdown from '../TagFilterDropdown.jsx';
import DateRangeButtons from '../DateRangeButtons.jsx';
import { normalizeTag } from '../../utils/normalizeTags.js';
import { findPresetByLabel, getEndOfDay, getStartOfDay } from '../../utils/timeRange.js';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { getMethodTextClass } from '../../utils/getMethodClass.js';
import EmptyState from './EmptyState.jsx';

const formatAxisTimestamp = (timestampMs) => {
  if (!Number.isFinite(timestampMs)) return '—';
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const getTimelineStatusColor = (status) => {
  if (status >= 500) return 'bg-rose-500/80';
  if (status >= 400 && status < 500) return 'bg-amber-500/80';
  if (status >= 300 && status < 400) return 'bg-blue-500/70';
  if (status >= 200 && status < 300) return 'bg-emerald-500/80';
  return 'bg-slate-400/70';
};

const clampPercent = (value) => Math.min(Math.max(value, 0), 100);

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const TARGET_TICK_COUNT = 7;
const TICK_INTERVALS_MS = [
  1000,
  2000,
  5000,
  15000,
  30000,
  MINUTE_IN_MS,
  5 * MINUTE_IN_MS,
  15 * MINUTE_IN_MS,
  30 * MINUTE_IN_MS,
  HOUR_IN_MS,
  2 * HOUR_IN_MS,
  3 * HOUR_IN_MS,
  6 * HOUR_IN_MS,
  12 * HOUR_IN_MS,
  DAY_IN_MS,
  2 * DAY_IN_MS,
  7 * DAY_IN_MS,
  14 * DAY_IN_MS,
  30 * DAY_IN_MS,
  90 * DAY_IN_MS
];

const formatterTime = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
const formatterTimeWithSeconds = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
const formatterDay = new Intl.DateTimeFormat([], { month: 'short', day: 'numeric' });
const formatterDayWithWeekday = new Intl.DateTimeFormat([], {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});
const formatterDayWithYear = new Intl.DateTimeFormat([], {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
const formatterDayTime = new Intl.DateTimeFormat([], {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const formatTickLabel = (timestampMs, interval, totalDuration) => {
  const date = new Date(timestampMs);
  if (interval >= DAY_IN_MS) {
    if (totalDuration > 180 * DAY_IN_MS) {
      return formatterDayWithYear.format(date);
    }
    return formatterDay.format(date);
  }
  if (interval >= HOUR_IN_MS) {
    if (totalDuration > 2 * DAY_IN_MS) {
      return formatterDayTime.format(date);
    }
    return formatterTime.format(date);
  }
  if (interval >= MINUTE_IN_MS) {
    if (totalDuration > DAY_IN_MS) {
      return formatterDayTime.format(date);
    }
    return formatterTime.format(date);
  }
  return formatterTimeWithSeconds.format(date);
};

const formatDaySegmentLabel = (timestampMs, totalDuration) => {
  const date = new Date(timestampMs);
  if (totalDuration > 180 * DAY_IN_MS) {
    return formatterDayWithYear.format(date);
  }
  if (totalDuration > 14 * DAY_IN_MS) {
    return formatterDay.format(date);
  }
  return formatterDayWithWeekday.format(date);
};

const generateTimelineScale = (startMs, endMs) => {
  const duration = endMs - startMs;
  if (!Number.isFinite(duration) || duration <= 0) {
    return {
      interval: null,
      ticks: [],
      daySegments: [],
      startLabel: formatAxisTimestamp(startMs),
      endLabel: formatAxisTimestamp(endMs)
    };
  }

  const interval =
    TICK_INTERVALS_MS.find((candidate) => duration / candidate <= TARGET_TICK_COUNT) ??
    TICK_INTERVALS_MS[TICK_INTERVALS_MS.length - 1];

  const ticks = [];
  const firstTick = Math.ceil(startMs / interval) * interval;
  for (let current = firstTick; current < endMs; current += interval) {
    if (current <= startMs || current >= endMs) {
      continue;
    }
    const percent = clampPercent(((current - startMs) / duration) * 100);
    ticks.push({
      key: `tick-${current}`,
      value: current,
      percent,
      label: formatTickLabel(current, interval, duration)
    });
  }

  const daySegments = [];
  let cursor = startMs;
  let safety = 0;
  while (cursor < endMs && safety < 730) {
    const nextBoundaryDate = new Date(cursor);
    nextBoundaryDate.setHours(24, 0, 0, 0);
    const nextBoundary = nextBoundaryDate.getTime();
    const segmentEnd = Math.min(endMs, nextBoundary);
    const leftPercent = clampPercent(((cursor - startMs) / duration) * 100);
    const rawWidthPercent = ((segmentEnd - cursor) / duration) * 100;
    const cappedWidth = Math.min(Math.max(rawWidthPercent, 0), 100 - leftPercent);
    const widthPercent =
      rawWidthPercent > 0 && cappedWidth < 0.3 ? Math.min(0.3, 100 - leftPercent) : cappedWidth;

    daySegments.push({
      key: `segment-${cursor}`,
      start: cursor,
      end: segmentEnd,
      leftPercent,
      widthPercent,
      label: formatDaySegmentLabel(cursor, duration)
    });

    if (segmentEnd === cursor) {
      break;
    }

    cursor = segmentEnd;
    safety += 1;
  }

  return {
    interval,
    ticks,
    daySegments,
    startLabel: formatAxisTimestamp(startMs),
    endLabel: formatAxisTimestamp(endMs)
  };
};

export default function TimelineMode({ operations }) {
  const referenceDate = useMemo(() => new Date(), []);
  const defaultPreset = useMemo(() => findPresetByLabel('Today', referenceDate), [referenceDate]);
  const defaultStart = defaultPreset?.start ?? getStartOfDay(referenceDate);
  const defaultEnd = defaultPreset?.end ?? getEndOfDay(referenceDate);

  const [selectedRange, setSelectedRange] = useState(defaultPreset?.label ?? 'Custom');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customStartTime, setCustomStartTime] = useState('00:00');
  const [customEndDate, setCustomEndDate] = useState(referenceDate.toISOString().split('T')[0]);
  const [customEndTime, setCustomEndTime] = useState('23:59');
  const [selectedTag, setSelectedTag] = useState(null);
  const [groupByTags, setGroupByTags] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const tagOptions = useMemo(() => {
    const lookup = new Map();
    operations.forEach((operation) => {
      operation.tags.forEach((tag) => {
        if (!lookup.has(tag.raw)) {
          lookup.set(tag.raw, tag);
        }
      });
    });
    return Array.from(lookup.keys()).sort((a, b) => a.localeCompare(b));
  }, [operations]);

  useEffect(() => {
    if (!selectedTag) return;
    if (!tagOptions.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [tagOptions, selectedTag]);

  useEffect(() => {
    if (tagOptions.length) return;
    if (!groupByTags) return;
    setGroupByTags(false);
  }, [tagOptions, groupByTags]);

  useEffect(() => {
    if (!showCustomPicker) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime())) {
      setCustomStartDate(startDate.toISOString().split('T')[0]);
      setCustomStartTime(startDate.toISOString().split('T')[1]?.slice(0, 5) || '00:00');
    }
    if (!Number.isNaN(endDate.getTime())) {
      setCustomEndDate(endDate.toISOString().split('T')[0]);
      setCustomEndTime(endDate.toISOString().split('T')[1]?.slice(0, 5) || '00:00');
    }
  }, [showCustomPicker, start, end]);

  const selectedTagToken = useMemo(
    () => (selectedTag ? normalizeTag(selectedTag)?.token || null : null),
    [selectedTag]
  );

  const startMs = useMemo(() => Date.parse(start), [start]);
  const endMs = useMemo(() => Date.parse(end), [end]);
  const hasValidRange = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const rangeDuration = hasValidRange ? endMs - startMs : 1;

  const filteredOperations = useMemo(() => {
    if (!hasValidRange) return [];
    const filtered = operations.filter((operation) => {
      if (!operation.timestampMs) return false;
      if (operation.timestampMs < startMs || operation.timestampMs > endMs) return false;
      if (!selectedTagToken) return true;
      return operation.tags.some((tag) => tag.token === selectedTagToken);
    });
    return filtered.sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));
  }, [operations, hasValidRange, startMs, endMs, selectedTagToken]);

  const rows = useMemo(() => {
    if (!filteredOperations.length) return [];
    if (!groupByTags) {
      return [
        {
          key: 'all',
          label: null,
          operations: filteredOperations.map((operation) => ({ operation }))
        }
      ];
    }

    const buckets = new Map();
    filteredOperations.forEach((operation) => {
      if (!operation.tags.length) {
        const bucket = buckets.get('__untagged__') || {
          key: '__untagged__',
          label: null,
          operations: []
        };
        bucket.operations.push({ operation });
        buckets.set('__untagged__', bucket);
        return;
      }

      operation.tags.forEach((tag) => {
        const key = tag.token;
        if (!buckets.has(key)) {
          buckets.set(key, { key, label: tag, operations: [] });
        }
        buckets.get(key).operations.push({ operation, tag });
      });
    });

    return Array.from(buckets.values()).sort((a, b) => {
      const aLabel = a.label?.display || 'Untagged';
      const bLabel = b.label?.display || 'Untagged';
      return aLabel.localeCompare(bLabel);
    });
  }, [filteredOperations, groupByTags]);

  const {
    ticks: timelineTicks,
    daySegments,
    startLabel,
    endLabel
  } = useMemo(() => {
    if (!hasValidRange) {
      return { ticks: [], daySegments: [], startLabel: '', endLabel: '' };
    }
    return generateTimelineScale(startMs, endMs);
  }, [hasValidRange, startMs, endMs]);

  const handlePresetSelect = (item) => {
    setSelectedRange(item.label);
    setStart(item.start);
    setEnd(item.end);
    setShowCustomPicker(false);
    setRangeError('');
  };

  const handleCustomClick = () => {
    setShowCustomPicker((prev) => !prev);
    if (!showCustomPicker) {
      setSelectedRange('Custom');
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setRangeError('Select start and end dates.');
      return;
    }

    const startDate = new Date(`${customStartDate}T${customStartTime || '00:00'}:00`);
    const endDate = new Date(`${customEndDate}T${customEndTime || '00:00'}:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setRangeError('Unable to parse custom range.');
      return;
    }

    if (startDate > endDate) {
      setRangeError('Start must be before end.');
      return;
    }

    setStart(startDate.toISOString());
    setEnd(endDate.toISOString());
    setSelectedRange('Custom');
    setShowCustomPicker(false);
    setRangeError('');
  };

  const rangeSummary = `${formatTimestamp(start)} – ${formatTimestamp(end)}`;
  const canGroupByTags = tagOptions.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="relative flex flex-wrap items-center gap-3">
          <DateRangeButtons
            selectedRange={selectedRange}
            onSelect={handlePresetSelect}
            onCustomClick={handleCustomClick}
          />
          {showCustomPicker ? (
            <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-md border border-tremor-border bg-tremor-background p-3 shadow-xl dark:border-dark-tremor-border dark:bg-gray-950">
              <div className="flex flex-col gap-3 text-xs text-tremor-content dark:text-dark-tremor-content">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide">Start</span>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(event) => {
                        setCustomStartDate(event.target.value);
                        setRangeError('');
                      }}
                      className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                    />
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(event) => {
                        setCustomStartTime(event.target.value);
                        setRangeError('');
                      }}
                      className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide">End</span>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(event) => {
                        setCustomEndDate(event.target.value);
                        setRangeError('');
                      }}
                      className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                    />
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(event) => {
                        setCustomEndTime(event.target.value);
                        setRangeError('');
                      }}
                      className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border border-tremor-border px-2 py-1 text-xs font-medium text-tremor-content hover:bg-tremor-background-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-subtle"
                    onClick={() => setShowCustomPicker(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded bg-tremor-brand px-3 py-1 text-xs font-medium text-white hover:bg-tremor-brand-emphasis"
                    onClick={handleApplyCustomRange}
                  >
                    Apply range
                  </button>
                </div>
                {rangeError ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{rangeError}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <TagFilterDropdown
            options={tagOptions}
            selected={selectedTag}
            onSelect={setSelectedTag}
            placeholder="Filter by tag"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-tremor-content dark:text-dark-tremor-content">
            <input
              type="checkbox"
              className="size-4 rounded border-tremor-border text-tremor-brand focus:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
              checked={groupByTags}
              disabled={!canGroupByTags}
              onChange={(event) => setGroupByTags(event.target.checked)}
            />
            Group by tags
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
        <span>{rangeSummary}</span>
        <span>{filteredOperations.length} operations</span>
      </div>
      {rangeError ? <p className="text-xs text-rose-600 dark:text-rose-400">{rangeError}</p> : null}
      <Card className="rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
        {!hasValidRange ? (
          <EmptyState message="Select a valid time range to view the timeline." />
        ) : rows.length === 0 ? (
          <EmptyState message="No operations captured in the selected range." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="hidden md:block md:w-1/3 lg:w-1/5" />
              <div className="w-full md:w-2/3 lg:w-4/5">
                <div className="relative h-20">
                  <div className="absolute inset-x-0 top-0 h-7">
                    <div className="relative h-full overflow-hidden rounded-tremor-small border border-tremor-border bg-tremor-background-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                      {daySegments.map((segment, index) => {
                        const left = clampPercent(segment.leftPercent);
                        const cappedWidth = Math.min(Math.max(segment.widthPercent, 0), 100 - left);
                        const width =
                          segment.widthPercent > 0 && cappedWidth < 0.3
                            ? Math.min(0.3, 100 - left)
                            : cappedWidth;
                        return (
                          <div
                            key={segment.key}
                            className={`absolute flex h-full items-center justify-center px-2 text-[10px] font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content-subtle ${
                              index > 0
                                ? 'border-l border-tremor-border dark:border-dark-tremor-border'
                                : ''
                            }`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          >
                            <span className="pointer-events-none truncate">{segment.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-6">
                    <div className="relative h-8">
                      <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-tremor-border dark:border-dark-tremor-border" />
                      {timelineTicks.map((tick) => (
                        <div
                          key={tick.key}
                          className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center text-[11px] font-medium text-tremor-content-subtle dark:text-dark-tremor-content"
                          style={{ left: `${clampPercent(tick.percent)}%` }}
                        >
                          <span className="mb-1 whitespace-nowrap">{tick.label}</span>
                          <span className="block h-2 border-l border-tremor-border dark:border-dark-tremor-border" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-tremor-content-subtle dark:text-dark-tremor-content">
                    <span>{startLabel || formatAxisTimestamp(startMs)}</span>
                    <span>{endLabel || formatAxisTimestamp(endMs)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.key} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    <div className="flex items-center gap-2">
                      {groupByTags ? (
                        row.label ? (
                          <TagPill tag={row.label} />
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
                            Untagged
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                          All operations
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">
                      {row.operations.length} ops
                    </span>
                  </div>
                  <div className="space-y-3">
                    {row.operations.map(({ operation, tag }, index) => {
                      const opStart = operation.timestampMs ?? 0;
                      const duration = Number.isFinite(operation.duration) ? operation.duration : 0;
                      const rawEnd = duration > 0 ? opStart + duration : opStart;
                      const clampedStart = Math.max(opStart, startMs);
                      const clampedEnd = Math.max(clampedStart, Math.min(rawEnd, endMs));
                      const offsetPercent = ((clampedStart - startMs) / rangeDuration) * 100;
                      const widthPercent = ((clampedEnd - clampedStart) / rangeDuration) * 100;
                      const left = clampPercent(offsetPercent);
                      const widthValue =
                        widthPercent > 0 ? `${Math.max(widthPercent, 0.8)}%` : '6px';
                      const transform = widthPercent > 0 ? undefined : 'translateX(-50%)';
                      const tooltip = `${operation.method} ${operation.path}\n${formatTimestamp(operation.timestamp)}\nDuration ${formatDuration(operation.duration)}`;
                      const colorClass = getTimelineStatusColor(operation.status);
                      const operationKey = `${operation.id || operation.operationId || operation.timestampMs || 'op'}-${
                        tag?.token || 'all'
                      }-${index}`;
                      return (
                        <div
                          key={operationKey}
                          className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-4"
                        >
                          <div className="w-full min-w-0 md:w-1/3 lg:w-1/5">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span
                                className={`font-semibold uppercase ${getMethodTextClass(operation.method)}`}
                              >
                                {operation.method}
                              </span>
                              <span className="max-w-md truncate text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                {operation.path || '/'}
                              </span>
                              <span className="max-w-md truncate text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">
                                ({formatDuration(operation.duration)})
                              </span>
                            </div>
                            <div className="text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">
                              {formatTimestamp(operation.timestamp)}
                            </div>
                          </div>

                          <div className="w-full md:w-2/3 lg:w-4/5">
                            <div className="relative h-10 overflow-hidden rounded-tremor-small border border-dashed border-tremor-border bg-tremor-background-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                              <div className="absolute inset-0 pointer-events-none">
                                {daySegments.slice(1).map((segment) => (
                                  <div
                                    key={`day-boundary-${segment.key}`}
                                    className="absolute top-0 bottom-0 border-l border-tremor-border dark:border-dark-tremor-border"
                                    style={{ left: `${segment.leftPercent}%` }}
                                  />
                                ))}
                                {timelineTicks
                                  .filter((tick) => tick.percent > 0 && tick.percent < 100)
                                  .map((tick) => (
                                    <div
                                      key={`grid-${tick.key}`}
                                      className="absolute top-1 bottom-1 border-l border-tremor-border opacity-40 dark:border-dark-tremor-border dark:opacity-50"
                                      style={{ left: `${clampPercent(tick.percent)}%` }}
                                    />
                                  ))}
                              </div>
                              <div
                                className={`absolute inset-y-1 z-10 flex items-center overflow-hidden rounded ${colorClass} text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm`}
                                style={{ left: `${left}%`, width: widthValue, transform }}
                                title={tooltip}
                              >
                                <span className="px-2 truncate">{operation.method}</span>
                                <span className="px-2 truncate">
                                  Duration {formatDuration(operation.duration)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
