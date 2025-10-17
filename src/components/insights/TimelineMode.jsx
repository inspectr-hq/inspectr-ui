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

  const ticks = useMemo(() => {
    if (!hasValidRange) return [];
    const segments = 4;
    const labels = [];
    for (let i = 0; i <= segments; i += 1) {
      const ratio = i / segments;
      labels.push({
        key: i,
        percent: ratio * 100,
        label: formatAxisTimestamp(startMs + ratio * rangeDuration)
      });
    }
    return labels;
  }, [hasValidRange, startMs, rangeDuration]);

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
                <div className="relative h-12">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-tremor-border dark:border-dark-tremor-border" />
                  {ticks.map((tick) => (
                    <div
                      key={tick.key}
                      className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-tremor-content-subtle dark:text-dark-tremor-content"
                      style={{ left: `${clampPercent(tick.percent)}%` }}
                    >
                      {tick.label}
                    </div>
                  ))}
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
                            <div className="relative h-10 rounded-tremor-small border border-dashed border-tremor-border bg-tremor-background-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                              <div
                                className={`absolute inset-y-1 flex items-center overflow-hidden rounded ${colorClass} text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm`}
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
