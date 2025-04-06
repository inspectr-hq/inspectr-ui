// src/components/DashBoardApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, SelectItem, Button } from '@tremor/react';
import DashBoardKpi from './DashBoardKpi.jsx';
import DashBoardVolume from './DashBoardVolume.jsx';
import DashBoardResponseTimes from './DashBoardResponseTimes.jsx';
import DashBoardBarList from './DashBoardBarList.jsx';
import DashBoardDonutChart from './DashBoardDonutChart.jsx';

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

  // Get operation statistics via REST API
  const getStatsOperationsApi = async () => {
    const response = await fetch(`${apiEndpoint}/stats/operations`);
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
      console.log('Fetched stats operations:', data);
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
  }, []);

  return (
    <>
      <header>
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Inspectr Dashboard
          </h3>
          <div className="mt-4 items-center sm:mt-0 sm:flex sm:space-x-2">
            <Select
              className="w-full sm:w-fit [&>button]:rounded-tremor-small"
              enableClear={false}
              defaultValue="1"
            >
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="2">Last 7 days</SelectItem>
              <SelectItem value="3">Last 4 weeks</SelectItem>
              <SelectItem value="4">Last 12 months</SelectItem>
            </Select>
            <Select
              className="mt-2 w-full sm:mt-0 sm:w-fit [&>button]:rounded-tremor-small"
              enableClear={false}
              defaultValue="1"
            >
              <SelectItem value="1">US-West</SelectItem>
              <SelectItem value="2">US-East</SelectItem>
              <SelectItem value="3">EU-Central-1</SelectItem>
            </Select>
            {/* Refresh Button */}
            <Button onClick={handleLoadStats} className="mt-2 sm:mt-0">
              {loading ? 'Refreshing...' : 'Refresh'}
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
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="h-36 rounded-tremor-small p-2">
            <ContentPlaceholder />
          </Card>
          <Card className="h-36 rounded-tremor-small p-2">
            <ContentPlaceholder />
          </Card>
          <Card className="h-36 rounded-tremor-small p-2">
            <ContentPlaceholder />
          </Card>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <DashBoardVolume />
          <DashBoardResponseTimes />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 items-stretch">
          <div className="col-span-2">
            <DashBoardResponseTimes />
          </div>
          <div className="col-span-1">
            <DashBoardBarList title="Top Endpoints" data={stats?.top_endpoints} toggleable={false} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">
          <DashBoardDonutChart />
          <DashBoardDonutChart />
          <DashBoardDonutChart />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3 lg:grid-cols-3">
          <DashBoardBarList title="Top Failed Endpoints" data={stats?.top_failed_endpoints} toggleable={false} />
        </div>
      </main>
    </>
  );
}