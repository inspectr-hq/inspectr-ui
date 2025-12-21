// src/components/DashBoardApp.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectItem,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card
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
import DateRangeButtons from './DateRangeButtons.jsx';
import { getStartOfDay, getEndOfDay } from '../utils/timeRange.js';
import useFeaturePreview from '../hooks/useFeaturePreview.jsx';
import DashBoardMcpSummary from './dashboards/DashBoardMcpSummary.jsx';
import DashBoardMcpBarList from './dashboards/DashBoardMcpBarList.jsx';
import NoDataPlaceholder from './NoDataPlaceholder.jsx';

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

const formatNumber = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0';
  return Intl.NumberFormat('us').format(numeric);
};

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

function buildMcpGroup(group, limit = 10) {
  if (!group || typeof group !== 'object') return [];

  return Object.entries(group)
    .map(([name, stats]) => {
      const count = Number(stats?.count ?? 0);
      const requestTokens = Number(stats?.request_tokens ?? 0);
      const responseTokens = Number(stats?.response_tokens ?? 0);
      const totalTokens =
        stats?.total_tokens != null ? Number(stats.total_tokens) : requestTokens + responseTokens;

      return {
        name,
        count,
        totalTokens
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildMcpSeriesData(buckets, limit = 5) {
  const rows = Array.isArray(buckets) ? buckets : [];
  if (!rows.length) {
    return { data: [], keys: [], topLabel: '' };
  }

  const totals = new Map();
  rows.forEach((item) => {
    const series = item?.series;
    if (!series || typeof series !== 'object') return;
    Object.entries(series).forEach(([name, stats]) => {
      const count = Number(stats?.count ?? 0);
      totals.set(name, (totals.get(name) ?? 0) + count);
    });
  });

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const keys = sorted.map(([name]) => name);
  const topEntry = sorted[0];
  const topLabel = topEntry ? `${topEntry[0]} (${formatNumber(topEntry[1])})` : '';

  const data = rows.map((item) => {
    const row = {
      date: formatDateForChart(item.timestamp)
    };
    keys.forEach((key) => {
      row[key] = Number(item?.series?.[key]?.count ?? 0);
    });
    return row;
  });

  return { data, keys, topLabel };
}

function McpTrendCard({ title, data, keys, highlightLabel, highlightValue }) {
  if (!Array.isArray(data) || data.length === 0 || !Array.isArray(keys) || keys.length === 0) {
    return (
      <Card className="mt-4 rounded-tremor-small p-2">
        <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </h3>
        <div className="p-6">
          <NoDataPlaceholder className="min-h-[180px]" />
        </div>
      </Card>
    );
  }

  return (
    <DashBoardLineChart
      title={title}
      data={data}
      metricKey={keys}
      metricUnit=""
      highlightLabel={highlightLabel}
      highlightValue={highlightValue}
    />
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

  // Deprecate old features
  useFeaturePreview('feat_statistics_compare', false, true);

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
  const [mcpStats, setMcpStats] = useState(null);
  const [mcpBuckets, setMcpBuckets] = useState(null);
  const [mcpGroupedBuckets, setMcpGroupedBuckets] = useState({
    tool: null,
    prompt: null,
    resource: null
  });
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpError, setMcpError] = useState(null);

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

  const fetchStatsForTag = async (tag) => {
    const common = {
      from: start,
      to: end,
      interval: group,
      tag: tag || undefined
    };

    const [overview, buckets, byMethod, byStatus, topAll, topError, topFastest, topSlowest] =
      await Promise.all([
        client.stats.getOverview(common),
        client.stats.getBuckets(common),
        client.stats.aggregateBy('method', { ...common, order: '-count', metrics: ['count'] }),
        client.stats.aggregateBy('status', { ...common, order: '-count', metrics: ['count'] }),
        client.stats.aggregateBy('path', {
          ...common,
          order: '-count',
          metrics: ['count'],
          limit: 10
        }),
        client.stats.aggregateBy('path', {
          ...common,
          statusClass: ['4xx', '5xx'],
          order: '-count',
          metrics: ['count'],
          limit: 10
        }),
        client.stats.aggregateBy('path', {
          ...common,
          order: '+p95_ms',
          metrics: ['count', 'p95_ms'],
          limit: 10
        }),
        client.stats.aggregateBy('path', {
          ...common,
          order: '-p95_ms',
          metrics: ['count', 'p95_ms'],
          limit: 10
        })
      ]);

    const overall = overview?.data ?? overview?.overall ?? overview ?? null;

    const by_interval = (buckets?.data ?? []).map((it) => {
      const series = it?.series ?? {};
      const twoXX = Number(series['2xx'] ?? 0);
      const threeXX = Number(series['3xx'] ?? 0);
      const fourXX = Number(series['4xx'] ?? 0);
      const fiveXX = Number(series['5xx'] ?? 0);

      const total_requests =
        (typeof it.requests === 'number' ? it.requests : it.total_requests) ??
        twoXX + threeXX + fourXX + fiveXX;

      const success = (typeof it.success === 'number' ? it.success : undefined) ?? twoXX + threeXX;

      const errors = (typeof it.errors === 'number' ? it.errors : undefined) ?? fourXX + fiveXX;

      return {
        date: it.timestamp || it.date,
        total_requests,
        success,
        errors,
        '2xx': twoXX,
        '4xx': fourXX,
        '5xx': fiveXX,
        average_response_time: it.avg_ms ?? it.average_response_time,
        min_response_time: it.min_ms ?? it.min_response_time,
        max_response_time: it.max_ms ?? it.max_response_time,
        median_response_time: it.p50_ms ?? it.median_response_time,
        p90_response_time: it.p90_ms ?? it.p90_response_time,
        p95_response_time: it.p95_ms ?? it.p95_response_time,
        p99_response_time: it.p99_ms ?? it.p99_response_time
      };
    });

    const totals = {
      method: Object.fromEntries((byMethod?.data?.rows ?? []).map((r) => [r.method, r.count])),
      status: Object.fromEntries(
        (byStatus?.data?.rows ?? []).map((r) => [String(r.status), r.count])
      )
    };

    const mapPaths = (rows) =>
      (rows ?? []).map((r) => ({
        path: r.path,
        count: r.count,
        p95_response_time: r.p95_ms ?? r.p95_response_time
      }));

    const top_endpoints = {
      all: mapPaths(topAll?.data?.rows),
      error: mapPaths(topError?.data?.rows),
      fastest: mapPaths(topFastest?.data?.rows),
      slowest: mapPaths(topSlowest?.data?.rows)
    };

    return {
      overall,
      by_interval,
      totals,
      top_endpoints
    };
  };

  const loadPrimaryStats = async () => {
    if (!client?.stats?.getOverview) return;
    const canLoadMcpOps = Boolean(client?.stats?.getMcpOperations);
    const canLoadMcpBuckets = Boolean(client?.stats?.getMcpBuckets);
    const shouldLoadMcp = canLoadMcpOps || canLoadMcpBuckets;
    setPrimaryLoading(true);
    setPrimaryError(null);
    if (shouldLoadMcp) {
      setMcpLoading(true);
      setMcpError(null);
      setMcpStats(null);
      setMcpBuckets(null);
      setMcpGroupedBuckets({ tool: null, prompt: null, resource: null });
    }
    try {
      const statsPromise = fetchStatsForTag(selectedTag);

      if (shouldLoadMcp) {
        const mcpRequests = [];
        if (canLoadMcpOps) {
          mcpRequests.push({
            key: 'ops',
            promise: client.stats.getMcpOperations({ from: start, to: end })
          });
        }
        if (canLoadMcpBuckets) {
          mcpRequests.push({
            key: 'buckets',
            promise: client.stats.getMcpBuckets({ from: start, to: end, interval: group })
          });
          mcpRequests.push({
            key: 'tool',
            promise: client.stats.getMcpBuckets({
              from: start,
              to: end,
              interval: group,
              group: 'tool'
            })
          });
          mcpRequests.push({
            key: 'prompt',
            promise: client.stats.getMcpBuckets({
              from: start,
              to: end,
              interval: group,
              group: 'prompt'
            })
          });
          mcpRequests.push({
            key: 'resource',
            promise: client.stats.getMcpBuckets({
              from: start,
              to: end,
              interval: group,
              group: 'resource'
            })
          });
        }

        (async () => {
          const settled = await Promise.allSettled(mcpRequests.map((req) => req.promise));
          const grouped = { tool: null, prompt: null, resource: null };
          let hasGrouped = false;

          settled.forEach((result, index) => {
            const key = mcpRequests[index]?.key;
            if (result.status === 'fulfilled') {
              if (key === 'ops') setMcpStats(result.value);
              if (key === 'buckets') setMcpBuckets(result.value);
              if (key === 'tool') {
                grouped.tool = result.value;
                hasGrouped = true;
              }
              if (key === 'prompt') {
                grouped.prompt = result.value;
                hasGrouped = true;
              }
              if (key === 'resource') {
                grouped.resource = result.value;
                hasGrouped = true;
              }
            } else if (result.reason) {
              console.error(result.reason);
              setMcpError(
                (prev) => prev || result.reason?.message || 'Failed to load MCP statistics'
              );
            }
          });

          if (hasGrouped) {
            setMcpGroupedBuckets(grouped);
          }

          setMcpLoading(false);
        })();
      }

      const statsResult = await statsPromise;
      setStats(statsResult);
    } catch (err) {
      console.error(err);
      setPrimaryError(err?.message || 'Failed to load statistics');
    } finally {
      setPrimaryLoading(false);
    }
  };

  const loadCompareStats = async () => {
    if (!client?.stats?.getOverview) return;
    if (compareRightTag === undefined) return;

    setCompareLoading(true);
    setCompareError(null);
    try {
      const leftPromise = fetchStatsForTag(compareLeftTag).then((left) => {
        setCompareLeftStats(left);
        return left;
      });
      const rightPromise = fetchStatsForTag(compareRightTag).then((right) => {
        setCompareRightStats(right);
        return right;
      });

      const [leftResult, rightResult] = await Promise.allSettled([leftPromise, rightPromise]);
      const firstError =
        leftResult.status === 'rejected'
          ? leftResult.reason
          : rightResult.status === 'rejected'
            ? rightResult.reason
            : null;
      if (firstError) {
        console.error(firstError);
        setCompareError(firstError?.message || 'Failed to load comparison data');
      }
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
  const mcpData = mcpStats?.data ?? null;
  const mcpTrendData = useMemo(() => {
    const rows = Array.isArray(mcpBuckets?.data) ? mcpBuckets.data : [];
    return rows.map((item) => ({
      date: formatDateForChart(item.timestamp),
      mcp_count: item.count ?? 0,
      mcp_request_tokens: item.request_tokens ?? 0,
      mcp_response_tokens: item.response_tokens ?? 0,
      mcp_total_tokens:
        item.total_tokens != null
          ? item.total_tokens
          : (item.request_tokens ?? 0) + (item.response_tokens ?? 0)
    }));
  }, [mcpBuckets]);
  const mcpToolTrend = useMemo(
    () => buildMcpSeriesData(mcpGroupedBuckets.tool?.data),
    [mcpGroupedBuckets.tool]
  );
  const mcpPromptTrend = useMemo(
    () => buildMcpSeriesData(mcpGroupedBuckets.prompt?.data),
    [mcpGroupedBuckets.prompt]
  );
  const mcpResourceTrend = useMemo(
    () => buildMcpSeriesData(mcpGroupedBuckets.resource?.data),
    [mcpGroupedBuckets.resource]
  );
  const hasMcpUsage = useMemo(() => {
    const totalCount = Number(mcpData?.total?.count ?? 0);
    const groupTotals =
      mcpToolTrend.keys.length || mcpPromptTrend.keys.length || mcpResourceTrend.keys.length;
    const trendPoints = mcpTrendData.length > 0;
    return totalCount > 0 || groupTotals || trendPoints;
  }, [mcpData, mcpToolTrend, mcpPromptTrend, mcpResourceTrend, mcpTrendData]);
  const mcpGroups = useMemo(
    () => ({
      byTool: buildMcpGroup(mcpData?.by_tool),
      byResource: buildMcpGroup(mcpData?.by_resource),
      byPrompt: buildMcpGroup(mcpData?.by_prompt),
      byMethod: buildMcpGroup(mcpData?.by_method),
      byCategory: buildMcpGroup(mcpData?.by_category),
      bySession: buildMcpGroup(mcpData?.by_session)
    }),
    [mcpData]
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
            {mcpLoading || mcpError || hasMcpUsage ? (
              <section className="mt-10">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    MCP Usage
                  </h4>
                  {mcpLoading ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Loading MCP stats…
                    </span>
                  ) : null}
                </div>
                {mcpError ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    MCP stats error: {mcpError}
                  </p>
                ) : null}
                {!mcpLoading && !mcpError && hasMcpUsage ? (
                  <>
                    <div className="mt-4">
                      <DashBoardMcpSummary total={mcpData.total} />
                    </div>
                    <div className="mt-6">
                      <McpTrendCard
                        title="MCP Usage Trend"
                        data={mcpTrendData}
                        keys={['mcp_count', 'mcp_total_tokens']}
                        highlightValue={formatNumber(mcpData?.total?.count)}
                        highlightLabel="Total MCP Requests"
                      />
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <McpTrendCard
                        title="Tools Usage Over Time"
                        data={mcpToolTrend.data}
                        keys={mcpToolTrend.keys}
                        highlightLabel="Top Tool"
                        highlightValue={mcpToolTrend.topLabel}
                      />
                      <McpTrendCard
                        title="Prompts Usage Over Time"
                        data={mcpPromptTrend.data}
                        keys={mcpPromptTrend.keys}
                        highlightLabel="Top Prompt"
                        highlightValue={mcpPromptTrend.topLabel}
                      />
                      <McpTrendCard
                        title="Resources Usage Over Time"
                        data={mcpResourceTrend.data}
                        keys={mcpResourceTrend.keys}
                        highlightLabel="Top Resource"
                        highlightValue={mcpResourceTrend.topLabel}
                      />
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <DashBoardMcpBarList title="By Tool" items={mcpGroups.byTool} />
                      <DashBoardMcpBarList title="By Resource" items={mcpGroups.byResource} />
                      <DashBoardMcpBarList title="By Prompt" items={mcpGroups.byPrompt} />
                      <DashBoardMcpBarList title="By Method" items={mcpGroups.byMethod} />
                      <DashBoardMcpBarList title="By Category" items={mcpGroups.byCategory} />
                      <DashBoardMcpBarList title="By Session" items={mcpGroups.bySession} />
                    </div>
                  </>
                ) : null}
              </section>
            ) : null}
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
