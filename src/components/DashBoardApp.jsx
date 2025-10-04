// src/components/DashBoardApp.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Select, SelectItem, Button } from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';

import DashBoardKpi from './DashBoardKpi.jsx';
import DashBoardBarChart from './DashBoardBarChart.jsx';
import DashBoardLineChart from './DashBoardLineChart.jsx';
import DashBoardBarList from './DashBoardBarList.jsx';
import DashBoardDonutChart from './DashBoardDonutChart.jsx';
import DialogConfirmClearAll from './DialogConfirmClearAll.jsx';
import DashBoardPercentileChart from './DashBoardPercentileChart.jsx';

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

function ContentPlaceholder() {
  return (
    <div className="relative h-full overflow-hidden rounded bg-gray-50 dark:bg-dark-tremor-background-subtle">
      <svg
        className="absolute inset-0 h-full w-full stroke-gray-200 dark:stroke-gray-700"
        fill="none"
      >
        <defs>
          <pattern id="pattern-1" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
          </pattern>
        </defs>
        <rect stroke="none" fill="url(#pattern-1)" width="100%" height="100%"></rect>
      </svg>
    </div>
  );
}

export default function DashBoardApp() {
  const { client } = useInspectr();

  // Stats payload
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState('hour');

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

  // Fetch statistics
  const fetchStats = () => client.stats.getOperations({ group, start, end });

  // Handler for refresh button
  const handleLoadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all operation stats.
  const clearStats = async () => {
    try {
      // Clear operations from Inspectr
      await client.stats.deleteOperations();
      await handleLoadStats();
    } catch (err) {
      console.error('Error clearing all operation stats:', err);
    }
  };

  // Trigger fetching of statistics on component mount
  useEffect(() => {
    handleLoadStats();
  }, [group, start, end]);

  // Format dates in by_interval data for chart display
  const formattedIntervalData = useMemo(() => {
    if (!stats?.by_interval) return [];

    return stats.by_interval.map((item) => {
      const mapped = {
        ...item,
        date: formatDateForChart(item.date)
      };
      // Map backend percentile keys to chart-friendly keys
      if (item.median_response_time != null) mapped.p50 = item.median_response_time;
      if (item.p90_response_time != null) mapped.p90 = item.p90_response_time;
      if (item.p95_response_time != null) mapped.p95 = item.p95_response_time;
      if (item.p99_response_time != null) mapped.p99 = item.p99_response_time;
      return mapped;
    });
  }, [stats?.by_interval]);

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
          {/* Date Range Display */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Range:</span> {formatDateForDisplay(start)} -{' '}
            {formatDateForDisplay(end)}
          </div>
          <div className="mt-4 sm:mt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              {/* Date Range Buttons */}
              <DateRangeButtons
                selectedRange={selectedRange}
                onSelect={handleDateRangeSelect}
                onCustomClick={handleCustomDateClick}
              />
              {/* Grouping Selectn */}
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

              {/* Refresh Button */}
              <Button onClick={handleLoadStats} className="mt-2 sm:mt-0">
                {loading ? 'Loading' : 'Refresh'}
              </Button>

              <button
                className="px-2 py-2 bg-red-500 text-white rounded text-xs cursor-pointer"
                onClick={() => setIsDialogOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>

            {/* Custom Date Range Picker - Absolutely positioned */}
            {showCustomDatePicker && (
              <div className="absolute top-full right-0 mt-2 z-10 flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded shadow">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Start Time</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">End Time</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-tremor-brand dark:bg-gray-700 dark:border-gray-600"
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
          {error && <p className="mt-2 text-red-600 dark:text-red-400">Error: {error}</p>}
        </div>
      </header>

      <main>
        <div className="mt-6">
          <DashBoardKpi overall={stats?.overall} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <DashBoardBarChart title="Traffic Volume" data={formattedIntervalData} />
          <DashBoardLineChart
            title="Average Response Times"
            data={formattedIntervalData}
            metricKey={['min_response_time', 'average_response_time', 'max_response_time']}
            metricUnit="ms"
            highlightValue={stats?.overall?.average_response_time}
            highlightLabel="Average Response Time"
          />
        </div>

        {/* HTTP Request duration percentiles */}
        <div className="mt-6 grid grid-cols-1">
          <DashBoardPercentileChart
            title="HTTP Request duration: p50, p90, p95, p99"
            data={formattedIntervalData}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 items-stretch">
          <div className="col-span-2">
            <DashBoardLineChart
              title="Success / Error Rate"
              data={formattedIntervalData}
              metricKey={['success', 'errors']}
              metricUnit=""
              highlightValue={stats?.overall?.average_errors}
              highlightLabel="Average Errors"
            />
          </div>
          <div className="col-span-1">
            <DashBoardBarList
              title="Top Endpoints"
              data={stats?.top_endpoints?.all}
              toggleable={false}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">
          <DashBoardDonutChart
            title="Method Ratio"
            description="Distribution of HTTP methods"
            data={stats?.totals?.method}
          />
          <DashBoardDonutChart
            title="Status Ratio"
            description="Distribution of HTTP status codes"
            data={stats?.totals?.status}
          />
          {/*<DashBoardDonutChart />*/}
          {/*</div>*/}
          {/*<div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">*/}
          <DashBoardBarList
            title="Top Failed Endpoints"
            data={stats?.top_endpoints?.error}
            toggleable={false}
          />
        </div>

        {/* Fastest and Slowest Endpoints by P95 */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <DashBoardBarList
            title="Top Fastest Endpoints (P95)"
            data={stats?.top_endpoints?.fastest}
            toggleable={false}
          />
          <DashBoardBarList
            title="Top Slowest Endpoints (P95)"
            data={stats?.top_endpoints?.slowest}
            toggleable={false}
          />
        </div>
        {/*<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">*/}
        {/*  <Card className="h-36 rounded-tremor-small p-2">*/}
        {/*    <ContentPlaceholder />*/}
        {/*  </Card>*/}
        {/*  <Card className="h-36 rounded-tremor-small p-2">*/}
        {/*    <ContentPlaceholder />*/}
        {/*  </Card>*/}
        {/*  <Card className="h-36 rounded-tremor-small p-2">*/}
        {/*    <ContentPlaceholder />*/}
        {/*  </Card>*/}
        {/*</div>*/}
      </main>

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
