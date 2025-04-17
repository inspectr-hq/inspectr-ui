// src/components/DashBoardApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, SelectItem, Button } from '@tremor/react';

import DashBoardKpi from './DashBoardKpi.jsx';
import DashBoardBarChart from './DashBoardBarChart.jsx';
import DashBoardLineChart from './DashBoardLineChart.jsx';
import DashBoardBarList from './DashBoardBarList.jsx';
import DashBoardDonutChart from './DashBoardDonutChart.jsx';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Helper: Get the start of a day (UTC) as an ISO string.
function getStartOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

// Helper: Get the end of a day (UTC) as an ISO string.
function getEndOfDayUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  ).toISOString();
}

// Component for rendering date-range buttons with tooltips.
function DateRangeButtons({ selectedRange, onSelect }) {
  const today = new Date();
  const options = [
    {
      label: 'Today',
      start: getStartOfDayUTC(today),
      end: getEndOfDayUTC(today),
      tooltip: `${getStartOfDayUTC(today)} – ${getEndOfDayUTC(today)}`
    },
    {
      label: '7D',
      start: getStartOfDayUTC(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
      end: getEndOfDayUTC(today),
      tooltip: `${getStartOfDayUTC(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))} – ${getEndOfDayUTC(today)}`
    },
    {
      label: '30D',
      start: getStartOfDayUTC(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
      end: getEndOfDayUTC(today),
      tooltip: `${getStartOfDayUTC(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))} – ${getEndOfDayUTC(today)}`
    },
    {
      label: '3M',
      start: getStartOfDayUTC(new Date(today.getUTCFullYear(), today.getUTCMonth() - 3, today.getUTCDate())),
      end: getEndOfDayUTC(today),
      tooltip: `${getStartOfDayUTC(new Date(today.getUTCFullYear(), today.getUTCMonth() - 3, today.getUTCDate()))} – ${getEndOfDayUTC(today)}`
    },
    {
      label: '6M',
      start: getStartOfDayUTC(new Date(today.getUTCFullYear(), today.getUTCMonth() - 6, today.getUTCDate())),
      end: getEndOfDayUTC(today),
      tooltip: `${getStartOfDayUTC(new Date(today.getUTCFullYear(), today.getUTCMonth() - 6, today.getUTCDate()))} – ${getEndOfDayUTC(today)}`
    }
  ];

  return (
    <div className="inline-flex items-center rounded shadow">
      {options.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item)}
          title={item.tooltip}
          className={joinClassNames(
            index === 0 ? 'rounded-l' : index === options.length - 1 ? '-ml-px rounded-r' : '-ml-px',
            'px-3 py-1 border focus:outline-none',
            selectedRange === item.label
              ? 'bg-tremor-brand dark:bg-dark-tremor-brand text-tremor-brand-inverted dark:text-dark-tremor-brand-inverted'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          {item.label}
        </button>
      ))}
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
          <pattern
            id="pattern-1"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3"></path>
          </pattern>
        </defs>
        <rect
          stroke="none"
          fill="url(#pattern-1)"
          width="100%"
          height="100%"
        ></rect>
      </svg>
    </div>
  );
}

export default function DashBoardApp() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:4004/api');
  const [group, setGroup] = useState('hour');

  // Default date range: Today
  const today = new Date();
  // Set defaultStart to the start of Today and defaultEnd to the end of Today.
  const defaultStart = getStartOfDayUTC(today);
  const defaultEnd = getEndOfDayUTC(today);
  const [selectedRange, setSelectedRange] = useState('Today');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // Get operation statistics via REST API
  const getStatsOperationsApi = async () => {
    const url = `${apiEndpoint}/stats/operations?group=${group}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats operations: ${response.status}`);
    }
    return await response.json();
  };

  // Handler for refresh button
  const handleLoadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStatsOperationsApi();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetching of statistics on component mount
  useEffect(() => {
    handleLoadStats();
  }, [group, start, end]);

  // Update start and end when a date range button is clicked.
  const handleDateRangeSelect = (item) => {
    setSelectedRange(item.label);
    setStart(item.start);
    setEnd(item.end);
  };

  return (
    <>
      <header>
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3
            className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Inspectr Statistics
          </h3>
          <div className="mt-4 flex items-center space-x-2 sm:mt-0">
            {/* Date Range Buttons on the left */}
            <DateRangeButtons selectedRange={selectedRange} onSelect={handleDateRangeSelect} />
            {/* Grouping Select */}
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
          </div>
          {error && (
            <p className="mt-2 text-red-600 dark:text-red-400">
              Error: {error}
            </p>
          )}
        </div>
      </header>
      <main>
        <div className="mt-6">
          <DashBoardKpi overall={stats?.overall} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <DashBoardBarChart
            title="Traffic Volume"
            data={stats?.by_interval}
          />
          <DashBoardLineChart
            title="Average Response Times"
            data={stats?.by_interval}
            metricKey={['min_response_time', 'average_response_time', 'max_response_time']}
            metricUnit="ms"
            highlightValue={stats?.overall?.average_response_time}
            highlightLabel="Average Response Time"
          />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 items-stretch">
          <div className="col-span-2">
            <DashBoardLineChart
              title="Success / Error Rate"
              data={stats?.by_interval}
              metricKey={['success', 'errors']}
              metricUnit=""
              highlightValue={stats?.overall?.average_errors}
              highlightLabel="Average Errors"
            />
          </div>
          <div className="col-span-1">
            <DashBoardBarList title="Top Endpoints" data={stats?.top_endpoints?.all} toggleable={false} />
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
          <DashBoardBarList title="Top Failed Endpoints" data={stats?.top_endpoints?.error} toggleable={false} />
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
    </>
  );
}