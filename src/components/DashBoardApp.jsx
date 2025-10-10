// src/components/DashBoardApp.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Select,
  SelectItem,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';

import DashBoardKpi from './dashboards/DashBoardKpi.jsx';
import DashBoardBarChart from './dashboards/DashBoardBarChart.jsx';
import DashBoardLineChart from './dashboards/DashBoardLineChart.jsx';
import DashBoardBarList from './dashboards/DashBoardBarList.jsx';
import DashBoardDonutChart from './dashboards/DashBoardDonutChart.jsx';
import DialogConfirmClearAll from './DialogConfirmClearAll.jsx';
import DashBoardPercentileChart from './dashboards/DashBoardPercentileChart.jsx';
import TagFilterDropdown from './TagFilterDropdown.jsx';
import TagPill from './TagPill.jsx';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Helper: Get the start of a day (UTC) as an ISO string.
function getStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

// Helper: Get the end of a day (UTC) as an ISO string.
function getEndOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  ).toISOString();
}

// Helper: Format date for range display
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Helper: Format date for chart display
function formatDateForChart(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Component for rendering date-range buttons with tooltips.
function DateRangeButtons({ selectedRange, onSelect, onCustomClick }) {
  const today = new Date();
  const options = [
    {
      label: 'Today',
      start: getStartOfDay(today),
      end: getEndOfDay(today),
      tooltip: `${getStartOfDay(today)} – ${getEndOfDay(today)}`
    },
    {
      label: '7D',
      start: getStartOfDay(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
      end: getEndOfDay(today),
      tooltip: `${getStartOfDay(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))} – ${getEndOfDay(today)}`
    },
    {
      label: '30D',
      start: getStartOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
      end: getEndOfDay(today),
      tooltip: `${getStartOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))} – ${getEndOfDay(today)}`
    },
    {
      label: '3M',
      start: getStartOfDay(
        new Date(today.getUTCFullYear(), today.getUTCMonth() - 3, today.getUTCDate())
      ),
      end: getEndOfDay(today),
      tooltip: `${getStartOfDay(new Date(today.getUTCFullYear(), today.getUTCMonth() - 3, today.getUTCDate()))} – ${getEndOfDay(today)}`
    },
    {
      label: '6M',
      start: getStartOfDay(
        new Date(today.getUTCFullYear(), today.getUTCMonth() - 6, today.getUTCDate())
      ),
      end: getEndOfDay(today),
      tooltip: `${getStartOfDay(new Date(today.getUTCFullYear(), today.getUTCMonth() - 6, today.getUTCDate()))} – ${getEndOfDay(today)}`
    }
  ];

  return (
    <div className="inline-flex items-center rounded shadow">
      {options.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(item)}
          title={item.tooltip}
          className={joinClassNames(
            idx === 0 ? 'rounded-l' : idx === options.length - 1 ? '-ml-px rounded-r' : '-ml-px',
            'px-3 py-1 border focus:outline-none',
            selectedRange === item.label
              ? 'bg-tremor-brand dark:bg-dark-tremor-brand text-tremor-brand-inverted dark:text-dark-tremor-brand-inverted'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          {item.label}
        </button>
      ))}
      <button
        onClick={onCustomClick}
        title="Set custom date range"
        className={joinClassNames(
          '-ml-px rounded-r',
          'px-3 py-1 border focus:outline-none',
          selectedRange === 'Custom'
            ? 'bg-tremor-brand dark:bg-dark-tremor-brand text-tremor-brand-inverted dark:text-dark-tremor-brand-inverted'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        )}
      >
        Custom
      </button>
    </div>
  );
}

function formatIntervalData(intervals) {
  if (!Array.isArray(intervals)) return [];

  return intervals.map((item) => {
    const mapped = {
      ...item,
      date: formatDateForChart(item.date)
    };

    if (item.median_response_time != null) mapped.p50 = item.median_response_time;
    if (item.p90_response_time != null) mapped.p90 = item.p90_response_time;
    if (item.p95_response_time != null) mapped.p95 = item.p95_response_time;
    if (item.p99_response_time != null) mapped.p99 = item.p99_response_time;

    return mapped;
  });
}

function DatasetLabel({ tag }) {
  if (!tag) {
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        All operations
      </span>
    );
  }

  return <TagPill tag={tag} />;
}

function renderStatisticsContent(
  statsData,
  intervalData,
  { includeTopMargin = true, layout = 'overview' } = {}
) {
  const isCompareLayout = layout === 'compare';
  const singleColumnGrid = 'mt-6 grid grid-cols-1 gap-4';

  return (
    <>
      <div className={includeTopMargin ? 'mt-6' : ''}>
        <DashBoardKpi overall={statsData?.overall} />
      </div>
      <div
        className={
          isCompareLayout
            ? singleColumnGrid
            : 'mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2'
        }
      >
        <DashBoardBarChart title="Traffic Volume" data={intervalData} />
        <DashBoardLineChart
          title="Average Response Times"
          data={intervalData}
          metricKey={['min_response_time', 'average_response_time', 'max_response_time']}
          metricUnit="ms"
          highlightValue={statsData?.overall?.average_response_time}
          highlightLabel="Average Response Time"
        />
      </div>
      <div className="mt-6 grid grid-cols-1">
        <DashBoardPercentileChart
          title="HTTP Request duration: p50, p90, p95, p99"
          data={intervalData}
        />
      </div>
      {isCompareLayout ? (
        <>
          <div className={singleColumnGrid}>
            <DashBoardLineChart
              title="Success / Error Rate"
              data={intervalData}
              metricKey={['success', 'errors']}
              metricUnit=""
              highlightValue={statsData?.overall?.average_errors}
              highlightLabel="Average Errors"
            />
            <DashBoardBarList
              title="Top Endpoints"
              data={statsData?.top_endpoints?.all}
              toggleable={false}
            />
          </div>
          <div className={singleColumnGrid}>
            <DashBoardDonutChart
              title="Method Ratio"
              description="Distribution of HTTP methods"
              data={statsData?.totals?.method}
            />
            <DashBoardDonutChart
              title="Status Ratio"
              description="Distribution of HTTP status codes"
              data={statsData?.totals?.status}
            />
            <DashBoardBarList
              title="Top Failed Endpoints"
              data={statsData?.top_endpoints?.error}
              toggleable={false}
            />
          </div>
          <div className={singleColumnGrid}>
            <DashBoardBarList
              title="Top Fastest Endpoints (P95)"
              data={statsData?.top_endpoints?.fastest}
              toggleable={false}
            />
            <DashBoardBarList
              title="Top Slowest Endpoints (P95)"
              data={statsData?.top_endpoints?.slowest}
              toggleable={false}
            />
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4 items-stretch">
            <div className="col-span-2">
              <DashBoardLineChart
                title="Success / Error Rate"
                data={intervalData}
                metricKey={['success', 'errors']}
                metricUnit=""
                highlightValue={statsData?.overall?.average_errors}
                highlightLabel="Average Errors"
              />
            </div>
            <div className="col-span-1">
              <DashBoardBarList
                title="Top Endpoints"
                data={statsData?.top_endpoints?.all}
                toggleable={false}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">
            <DashBoardDonutChart
              title="Method Ratio"
              description="Distribution of HTTP methods"
              data={statsData?.totals?.method}
            />
            <DashBoardDonutChart
              title="Status Ratio"
              description="Distribution of HTTP status codes"
              data={statsData?.totals?.status}
            />
            <DashBoardBarList
              title="Top Failed Endpoints"
              data={statsData?.top_endpoints?.error}
              toggleable={false}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
            <DashBoardBarList
              title="Top Fastest Endpoints (P95)"
              data={statsData?.top_endpoints?.fastest}
              toggleable={false}
            />
            <DashBoardBarList
              title="Top Slowest Endpoints (P95)"
              data={statsData?.top_endpoints?.slowest}
              toggleable={false}
            />
          </div>
        </>
      )}
    </>
  );
}

function ComparisonColumn({ label, tag, stats, intervalData, loading }) {
  const hasData = Boolean(stats);

  return (
    <div className="rounded-tremor-small border border-tremor-border bg-tremor-background p-4 shadow-sm dark:border-dark-tremor-border dark:bg-gray-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {label}
          </p>
          <div className="mt-1">
            <DatasetLabel tag={tag} />
          </div>
        </div>
        {loading ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">Loading…</span>
        ) : null}
      </div>
      {hasData ? (
        <div className="mt-4">
          {renderStatisticsContent(stats, intervalData, {
            includeTopMargin: false,
            layout: 'compare'
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Loading statistics…' : 'No data available for this selection.'}
        </p>
      )}
    </div>
  );
}

export default function DashBoardApp() {
  const { client } = useInspectr();

  // Stats payload
  const [stats, setStats] = useState(null);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryError, setPrimaryError] = useState(null);
  const [group, setGroup] = useState('hour');
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [compareLeftTag, setCompareLeftTag] = useState(null);
  const [compareRightTag, setCompareRightTag] = useState(undefined);
  const [compareLeftStats, setCompareLeftStats] = useState(null);
  const [compareRightStats, setCompareRightStats] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);

  // Date range
  const today = new Date();
  // Set defaultStart to the start of Today and defaultEnd to the end of Today.
  const defaultStart = getStartOfDay(today);
  const defaultEnd = getEndOfDay(today);
  const [selectedRange, setSelectedRange] = useState('Today');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // Custom date range
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customStartTime, setCustomStartTime] = useState('00:00');
  const [customEndDate, setCustomEndDate] = useState(today.toISOString().split('T')[0]);
  const [customEndTime, setCustomEndTime] = useState('23:59');

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchStatsForTag = (tag) =>
    client.stats.getOperations({
      group,
      start,
      end,
      tag: tag || undefined
    });

  const loadPrimaryStats = async () => {
    if (!client?.stats?.getOperations) return;
    setPrimaryLoading(true);
    setPrimaryError(null);
    try {
      const data = await fetchStatsForTag(selectedTag);
      setStats(data);
    } catch (err) {
      console.error(err);
      setPrimaryError(err?.message || 'Failed to load statistics');
    } finally {
      setPrimaryLoading(false);
    }
  };

  const loadCompareStats = async () => {
    if (!client?.stats?.getOperations) return;
    if (compareRightTag === undefined) return;

    setCompareLoading(true);
    setCompareError(null);
    try {
      const [left, right] = await Promise.all([
        fetchStatsForTag(compareLeftTag),
        fetchStatsForTag(compareRightTag)
      ]);
      setCompareLeftStats(left);
      setCompareRightStats(right);
    } catch (err) {
      console.error(err);
      setCompareError(err?.message || 'Failed to load comparison data');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleRefresh = () => {
    if (viewMode === 'compare') {
      return loadCompareStats();
    }
    return loadPrimaryStats();
  };

  // Clear all operation stats.
  const clearStats = async () => {
    try {
      // Clear operations from Inspectr
      await client.stats.deleteOperations();
      await loadPrimaryStats();
      if (viewMode === 'compare') {
        await loadCompareStats();
      }
    } catch (err) {
      console.error('Error clearing all operation stats:', err);
    }
  };

  // Trigger fetching of statistics on dependency changes
  useEffect(() => {
    loadPrimaryStats();
  }, [client, group, start, end, selectedTag]);

  useEffect(() => {
    if (viewMode !== 'compare') return;
    loadCompareStats();
  }, [client, viewMode, group, start, end, compareLeftTag, compareRightTag]);

  useEffect(() => {
    if (!client?.operations?.listTags) return;
    let cancelled = false;
    (async () => {
      try {
        setTagsLoading(true);
        setTagsError('');
        const response = await client.operations.listTags();
        if (cancelled) return;
        const list = Array.isArray(response?.tags) ? [...response.tags] : [];
        list.sort((a, b) => a.localeCompare(b));
        setAvailableTags(list);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load tags', err);
        setAvailableTags([]);
        setTagsError(err?.message || 'Failed to load tags');
      } finally {
        if (!cancelled) {
          setTagsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (!selectedTag) return;
    if (!availableTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [availableTags, selectedTag]);

  useEffect(() => {
    if (!compareLeftTag) return;
    if (!availableTags.includes(compareLeftTag)) {
      setCompareLeftTag(null);
    }
  }, [availableTags, compareLeftTag]);

  useEffect(() => {
    if (compareRightTag === undefined) return;
    if (compareRightTag === null) return;
    if (!availableTags.includes(compareRightTag)) {
      const fallback = availableTags.find((tag) => tag !== compareLeftTag) ?? null;
      setCompareRightTag(fallback);
    }
  }, [availableTags, compareLeftTag, compareRightTag]);

  useEffect(() => {
    if (compareRightTag !== undefined) return;
    if (availableTags.length === 0) {
      setCompareRightTag(null);
      return;
    }
    const fallback = availableTags.find((tag) => tag !== compareLeftTag) ?? availableTags[0];
    setCompareRightTag(fallback ?? null);
  }, [availableTags, compareLeftTag, compareRightTag]);

  // Format dates in by_interval data for chart display
  const formattedIntervalData = useMemo(
    () => formatIntervalData(stats?.by_interval),
    [stats?.by_interval]
  );
  const compareLeftIntervalData = useMemo(
    () => formatIntervalData(compareLeftStats?.by_interval),
    [compareLeftStats?.by_interval]
  );
  const compareRightIntervalData = useMemo(
    () => formatIntervalData(compareRightStats?.by_interval),
    [compareRightStats?.by_interval]
  );

  const tabIndex = viewMode === 'compare' ? 1 : 0;
  const currentLoading = viewMode === 'compare' ? compareLoading : primaryLoading;
  const normalizedRightTag = compareRightTag === undefined ? null : compareRightTag;

  const handleTabChange = (index) => {
    setViewMode(index === 1 ? 'compare' : 'overview');
  };

  // Update start and end when a date range button is clicked.
  const handleDateRangeSelect = (item) => {
    setSelectedRange(item.label);
    setStart(item.start);
    setEnd(item.end);
    setShowCustomDatePicker(false);
  };

  // Toggle custom date picker visibility
  const handleCustomDateClick = () => {
    setShowCustomDatePicker(!showCustomDatePicker);
    if (!showCustomDatePicker) {
      setSelectedRange('Custom');
    }
  };

  // Apply custom date range
  const handleApplyCustomDate = () => {
    // Create Date objects from local time inputs (without Z suffix)
    const customStartLocal = new Date(`${customStartDate}T${customStartTime}:00`);
    const customEndLocal = new Date(`${customEndDate}T${customEndTime}:00`);

    // Convert to UTC ISO strings
    setStart(customStartLocal.toISOString());
    setEnd(customEndLocal.toISOString());
    setSelectedRange('Custom');
    setShowCustomDatePicker(false);
  };

  return (
    <>
      <header>
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Inspectr Statistics
          </h3>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:mt-0">
            <span className="font-medium">Range:</span> {formatDateForDisplay(start)} -{' '}
            {formatDateForDisplay(end)}
          </div>
        </div>
      </header>

      <TabGroup index={tabIndex} onIndexChange={handleTabChange}>
        <div className="relative mt-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <TabList className="w-auto">
                <Tab>Overview</Tab>
                <Tab>Compare</Tab>
              </TabList>
              {viewMode === 'overview' ? (
                <TagFilterDropdown
                  tags={availableTags}
                  selectedTag={selectedTag}
                  onSelect={setSelectedTag}
                  disabled={currentLoading}
                  loading={tagsLoading}
                  error={tagsError}
                />
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-row gap-1 items-center">
                    {/*<span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">*/}
                    {/*  Compare*/}
                    {/*</span>*/}
                    <TagFilterDropdown
                      tags={availableTags}
                      selectedTag={compareLeftTag}
                      onSelect={setCompareLeftTag}
                      disabled={currentLoading}
                      loading={tagsLoading}
                      error={tagsError}
                    />
                    {/*</div>*/}
                    {/*<div className="flex flex-col gap-1">*/}
                    {/*<span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">*/}
                    {/*  Right*/}
                    {/*</span>*/}
                    <TagFilterDropdown
                      tags={availableTags}
                      selectedTag={normalizedRightTag}
                      onSelect={setCompareRightTag}
                      disabled={currentLoading}
                      loading={tagsLoading}
                      error={tagsError}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DateRangeButtons
                selectedRange={selectedRange}
                onSelect={handleDateRangeSelect}
                onCustomClick={handleCustomDateClick}
              />
              <Select
                className="w-full sm:w-fit [&>button]:rounded-tremor-small"
                enableClear={false}
                value={group}
                onValueChange={(value) => setGroup(value)}
              >
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </Select>
              <Button onClick={handleRefresh} disabled={currentLoading}>
                {currentLoading ? 'Loading' : 'Refresh'}
              </Button>
              <button
                type="button"
                className="rounded bg-red-500 px-2 py-2 text-xs text-white"
                onClick={() => setIsDialogOpen(true)}
              >
                <span className="sr-only">Clear all operation stats</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>
          {tagsError && !tagsLoading ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Tag filter unavailable: {tagsError}
            </p>
          ) : null}

          {showCustomDatePicker && (
            <div className="absolute top-full right-0 z-10 mt-2 flex flex-wrap items-center gap-2 rounded bg-gray-50 p-3 shadow dark:bg-gray-800">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400">Start Time</label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400">End Time</label>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleApplyCustomDate} className="ml-2">
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabPanels>
          <TabPanel>
            {primaryError ? (
              <p className="mt-4 text-red-600 dark:text-red-400">Error: {primaryError}</p>
            ) : null}
            <main className="mt-6">{renderStatisticsContent(stats, formattedIntervalData)}</main>
          </TabPanel>
          <TabPanel>
            {compareError ? (
              <p className="mt-4 text-red-600 dark:text-red-400">
                Comparison error: {compareError}
              </p>
            ) : null}
            <main className="mt-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ComparisonColumn
                  label="Input A"
                  tag={compareLeftTag}
                  stats={compareLeftStats}
                  intervalData={compareLeftIntervalData}
                  loading={compareLoading}
                />
                <ComparisonColumn
                  label="Input B"
                  tag={normalizedRightTag}
                  stats={compareRightStats}
                  intervalData={compareRightIntervalData}
                  loading={compareLoading}
                />
              </div>
            </main>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Clear All Dialog */}
      <DialogConfirmClearAll
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={'Clear All Operation Stats?'}
        message={
          'Are you sure you want to clear all operation stats? This action cannot be undone.'
        }
        onConfirm={clearStats}
      />
    </>
  );
}
