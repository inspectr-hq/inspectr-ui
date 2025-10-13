// src/components/workspace/WorkspaceOperationsApp.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Flex,
  Grid,
  LineChart,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from '@tremor/react';
import { useLiveQuery } from 'dexie-react-hooks';
import eventDB from '../../utils/eventDB.js';
import { getMethodTagClass, getMethodTextClass } from '../../utils/getMethodClass.js';
import { getStatusClass } from '../../utils/getStatusClass.js';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { normalizeTag, normalizeTags } from '../../utils/normalizeTags.js';
import { findPresetByLabel, getEndOfDay, getStartOfDay } from '../../utils/timeRange.js';
import TagPill from '../TagPill.jsx';
import TagFilterDropdown from '../TagFilterDropdown.jsx';
import DateRangeButtons from '../DateRangeButtons.jsx';
import { useInspectr } from '../../context/InspectrContext.jsx';

const MAX_LIST_ITEMS = 100;
const MAX_CHART_POINTS = 40;

const endpointKey = (m, p) => `${m} ${p}`;

const MethodBadge = ({ method }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getMethodTagClass(method)}`}
  >
    {method || 'N/A'}
  </span>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
      typeof status === 'number' ? status : Number(status)
    )}`}
  >
    {status ?? '—'}
  </span>
);

const EmptyState = ({ message = 'No operations captured yet.' }) => (
  <div className="flex items-center justify-center rounded-tremor-small border border-dashed border-tremor-border py-16 text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
    {message}
  </div>
);

const normalizeOperation = (record) => {
  if (!record) return null;

  const raw = record.raw?.data || {};
  const request = raw.request || {};
  const response = raw.response || {};
  const timing = raw.timing || {};

  const method = (record.method || request.method || 'GET').toUpperCase();
  const status = record.status_code ?? response.status ?? null;
  const durationValue = record.duration ?? timing.duration;
  const duration = Number.isFinite(Number(durationValue)) ? Number(durationValue) : null;
  const timestamp = record.time || request.timestamp || null;
  const parsedUrl = safeParseUrl(request.url || record.url || '');
  const path =
    request.path || record.path || parsedUrl?.pathname || request.url || record.url || '/';
  const host = request.server || parsedUrl?.host || '';

  const tagsSource = Array.isArray(raw.meta?.tags)
    ? raw.meta.tags
    : Array.isArray(record.tags)
      ? record.tags
      : [];
  const tags = normalizeTags(tagsSource);

  return {
    id: record.id,
    operationId: record.operation_id,
    method,
    status,
    duration,
    timestamp,
    timestampMs: timestamp ? Date.parse(timestamp) : null,
    path,
    host,
    url: request.url || record.url || '',
    request,
    response,
    timing,
    tags,
    raw
  };
};

const safeParseUrl = (value) => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch (err) {
    return null;
  }
};

const formatChartLabel = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

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

const getHealthMeta = (successRate) => {
  const sr = Number(successRate) || 0;
  if (sr >= 95) {
    return { label: 'Healthy', color: 'bg-emerald-500' };
  }
  if (sr >= 80) {
    return { label: 'Warning', color: 'bg-amber-500' };
  }
  return { label: 'Critical', color: 'bg-rose-500' };
};

const EndpointCard = ({ endpoint }) => {
  const {
    method,
    path,
    host,
    count,
    successRate,
    averageDuration,
    p95Duration,
    chartData,
    latestStatus,
    seriesLoading,
    seriesError
  } = endpoint;
  const numberFmt = useMemo(() => new Intl.NumberFormat(), []);
  const health = getHealthMeta(successRate);
  const showLoadingState = seriesLoading && !chartData.length;
  const showErrorState = seriesError && !chartData.length;

  return (
    <Card className="h-full rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MethodBadge method={method} />
              <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {path}
              </Title>
            </div>
            {host ? (
              <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                {host}
              </Text>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge color="slate">Requests {numberFmt.format(count)}</Badge>
            <StatusBadge status={latestStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {showLoadingState ? (
              <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-tremor-border text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                Loading series…
              </div>
            ) : showErrorState ? (
              <div className="flex h-36 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
                Failed to load series
              </div>
            ) : chartData.length ? (
              <LineChart
                data={chartData}
                index="time"
                categories={['duration', 'baseline']}
                colors={['cyan', 'gray']}
                showYAxis={false}
                showLegend={false}
                className="h-36"
              />
            ) : (
              <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-tremor-border text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                No recent series data
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-tremor-small bg-gray-50 p-4 dark:bg-dark-tremor-background">
            <div>
              <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
                Success rate
              </Text>
              <div className="mt-1 flex items-center gap-2">
                <Metric className="!text-xl">{successRate}%</Metric>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${health.color}`}
                >
                  {health.label}
                </span>
              </div>
            </div>

            <div>
              <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
                Avg duration
              </Text>
              <Metric className="!text-xl">
                {averageDuration ? `${averageDuration}ms` : 'N/A'}
              </Metric>
              <Text className="mt-1 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                p95 {p95Duration ? `${p95Duration}ms` : 'N/A'}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const EndpointMode = ({ endpoints, loading, error }) => {
  if (loading) {
    return (
      <Card className="rounded-tremor-small border border-dashed border-tremor-border py-12 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        Loading endpoint summary…
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-tremor-small border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
        Failed to load endpoint summary: {error.message || 'Unexpected error'}
      </Card>
    );
  }

  if (!endpoints.length) {
    return <EmptyState message="No endpoint activity to display yet." />;
  }

  return (
    // <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
    <Grid>
      {endpoints.map((endpoint) => (
        <EndpointCard key={endpoint.key} endpoint={endpoint} />
      ))}
    </Grid>
  );
};

const OperationCard = ({ operation }) => {
  return (
    <Card className="h-full rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MethodBadge method={operation.method} />
              <Text className={`text-xs font-semibold ${getMethodTextClass(operation.method)}`}>
                {operation.method}
              </Text>
            </div>
            <Title className="text-base text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {operation.path}
            </Title>
            <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              {formatTimestamp(operation.timestamp)}
            </Text>
            {operation.host ? (
              <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                Host {operation.host}
              </Text>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={operation.status} />
            <Badge color="blue">{formatDuration(operation.duration)}</Badge>
          </div>
        </div>

        {operation.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {operation.tags.slice(0, 6).map((tag) => (
              <TagPill key={tag.token} tag={tag} />
            ))}
            {operation.tags.length > 6 ? (
              <span className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                +{operation.tags.length - 6} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

const ListMode = ({ operations }) => {
  if (!operations.length) {
    return <EmptyState message="Operations will appear here once traffic flows." />;
  }

  return (
    <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
      {operations.slice(0, MAX_LIST_ITEMS).map((operation) => (
        <OperationCard key={operation.id} operation={operation} />
      ))}
    </Grid>
  );
};

const TableMode = ({ operations }) => {
  if (!operations.length) {
    return <EmptyState message="No operations available for tabular view." />;
  }

  return (
    <Card className="rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Method</TableHeaderCell>
              <TableHeaderCell>Path</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Host</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell>
                  <StatusBadge status={operation.status} />
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${getMethodTextClass(operation.method)}`}>
                    {operation.method}
                  </span>
                </TableCell>
                <TableCell className="max-w-md truncate">{operation.path}</TableCell>
                <TableCell>{formatDuration(operation.duration)}</TableCell>
                <TableCell className="min-w-[160px]">
                  {formatTimestamp(operation.timestamp)}
                </TableCell>
                <TableCell>{operation.host || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

const TimelineMode = ({ operations }) => {
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
                    className="rounded border border-tremor-border px-2 py-1 text-xs font-medium text-tremor-content hover:bg-tremor-background-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background"
                    onClick={() => setShowCustomPicker(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded bg-tremor-brand px-2 py-1 text-xs font-semibold text-tremor-brand-inverted hover:bg-tremor-brand/90 dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted"
                    onClick={handleApplyCustomRange}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TagFilterDropdown
            tags={tagOptions}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
            disabled={!tagOptions.length}
            loading={false}
            error={tagOptions.length ? undefined : 'No tags available'}
          />
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-tremor-content dark:text-dark-tremor-content ${
              canGroupByTags ? '' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-tremor-border text-tremor-brand focus:ring-tremor-brand dark:border-dark-tremor-border"
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
                        <div key={operationKey} className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">
                            <span className="flex items-center gap-2 font-medium text-tremor-content dark:text-dark-tremor-content">
                              <span
                                className={`font-semibold uppercase ${getMethodTextClass(operation.method)}`}
                              >
                                {operation.method}
                              </span>
                              <span className="max-w-md truncate text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                {operation.path || '/'}
                              </span>
                               <span className="max-w-md truncate text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">({formatDuration(operation.duration)})</span>
                            {/*<span className="max-w-md truncate  text-[11px] text-tremor-content-subtle dark:text-dark-tremor-content">{operation.host || '—'}</span>*/}
                            </span>
                            <span>{formatTimestamp(operation.timestamp)}</span>
                          </div>
                          <div className="relative h-10 rounded-tremor-small border border-dashed border-tremor-border bg-tremor-background-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                            <div
                              className={`absolute inset-y-1 flex items-center overflow-hidden rounded ${colorClass} text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm`}
                              style={{ left: `${left}%`, width: widthValue, transform }}
                              title={tooltip}
                            >
                              <span className="px-2 truncate">{operation.method}</span>
                              <span className="px-2 truncate">Duration {formatDuration(operation.duration)}</span>
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
};

export default function WorkspaceOperationsApp() {
  const { client } = useInspectr();
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [seriesState, setSeriesState] = useState({});

  const latestEventMeta =
    useLiveQuery(() => eventDB.db.events.orderBy('time').last(), [], null, { throttle: 300 }) ||
    null;

  const records =
    useLiveQuery(() => eventDB.db.events.orderBy('time').reverse().toArray(), [], [], {
      throttle: 200
    }) || [];

  const operations = useMemo(() => {
    return records
      .map((record) => normalizeOperation(record))
      .filter(Boolean)
      .sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  }, [records]);

  useEffect(() => {
    if (!client?.operations?.summarize) return;

    let isMounted = true;
    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      setSummaryError(null);
      try {
        const result = await client.operations.summarize();
        if (isMounted) {
          setSummary(result);
          setSeriesState({});
        }
      } catch (err) {
        if (isMounted) {
          setSummaryError(err);
        }
      } finally {
        if (isMounted) {
          setIsSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [client, latestEventMeta?.id]);

  useEffect(() => {
    if (!client?.operations?.getSeries) return;
    if (!summary?.summaries?.length) return;

    let isMounted = true;

    const loadAllSeries = async () => {
      const endpoints = summary.summaries;

      await Promise.all(
        endpoints.map(async (ep) => {
          const key = endpointKey(ep.method, ep.path);

          // Mark as loading for this key
          setSeriesState((prev) => ({
            ...prev,
            [key]: { ...(prev[key] || {}), loading: true, error: null }
          }));

          try {
            const data = await client.operations.getSeries({
              method: ep.method,
              path: ep.path,
              seriesLimit: MAX_CHART_POINTS
            });

            if (!isMounted) return;
            setSeriesState((prev) => ({
              ...prev,
              [key]: { ...(prev[key] || {}), loading: false, data, error: null }
            }));
          } catch (err) {
            if (!isMounted) return;
            setSeriesState((prev) => ({
              ...prev,
              [key]: { ...(prev[key] || {}), loading: false, error: err }
            }));
          }
        })
      );
    };

    loadAllSeries();

    return () => {
      isMounted = false;
    };
  }, [client, summary?.summaries]);

  const endpoints = useMemo(() => {
    if (!summary?.summaries?.length) return [];
    return summary.summaries.map((endpoint) => {
      const key = endpointKey(endpoint.method, endpoint.path);
      const seriesEntry = seriesState[key] || {};
      const chartData = (seriesEntry.data?.series || []).slice(-MAX_CHART_POINTS).map((point) => ({
        time: formatChartLabel(point.ts),
        duration: point.duration ?? 0,
        baseline: point.baseline ?? endpoint.averageDuration ?? 0
      }));
      return {
        ...endpoint,
        key,
        chartData,
        seriesLoading: seriesEntry.loading ?? false,
        seriesError: seriesEntry.error || null
      };
    });
  }, [summary, seriesState]);

  const totalOperations = summary?.totals?.totalOperations ?? operations.length;
  const totalEndpoints = summary?.totals?.totalEndpoints;
  const errorCount = summary?.totals?.errorCount;
  const averageDuration = summary?.totals?.averageDuration;

  return (
    <div className="space-y-6">
      <Card className="rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Workspace Explorer
            </Title>
            <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              Inspect captured operations by endpoint, as rich cards, or in a compact table.
            </Text>
          </div>
          <Badge color={summaryError ? 'rose' : 'slate'}>
            {isSummaryLoading ? 'Loading…' : `Total ${totalOperations}`}
          </Badge>
        </Flex>

        <Grid numItemsSm={1} numItemsLg={3} className="mt-6 gap-4">
          <Card className="bg-gray-50 shadow-none dark:bg-dark-tremor-background">
            <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
              Unique endpoints
            </Text>
            <Metric className="mt-2">{totalEndpoints}</Metric>
          </Card>
          <Card className="bg-gray-50 shadow-none dark:bg-dark-tremor-background">
            <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
              Errors
            </Text>
            <Metric className="mt-2">
              {errorCount}{' '}
              <span className="text-base font-normal text-tremor-content-subtle dark:text-dark-tremor-content">
                ({totalOperations ? Math.round((errorCount / totalOperations) * 100) : 0}%)
              </span>
            </Metric>
          </Card>
          <Card className="bg-gray-50 shadow-none dark:bg-dark-tremor-background">
            <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
              Avg duration
            </Text>
            <Metric className="mt-2">{averageDuration ? `${averageDuration}ms` : 'N/A'}</Metric>
          </Card>
        </Grid>
      </Card>

      <TabGroup>
        <TabList>
          <Tab>Endpoint mode</Tab>
          <Tab>List mode</Tab>
          <Tab>Table mode</Tab>
          <Tab>Timeline mode</Tab>
        </TabList>
        <TabPanels className="mt-6 space-y-6">
          <TabPanel>
            <EndpointMode endpoints={endpoints} loading={isSummaryLoading} error={summaryError} />
          </TabPanel>
          <TabPanel>
            <ListMode operations={operations} />
          </TabPanel>
          <TabPanel>
            <TableMode operations={operations} />
          </TabPanel>
          <TabPanel>
            <TimelineMode operations={operations} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
