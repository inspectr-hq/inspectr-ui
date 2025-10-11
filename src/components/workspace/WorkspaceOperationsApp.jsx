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
import { normalizeTags } from '../../utils/normalizeTags.js';
import TagPill from '../TagPill.jsx';
import { useInspectr } from '../../context/InspectrContext.jsx';

const MAX_LIST_ITEMS = 100;
const MAX_CHART_POINTS = 40;

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
  const path = request.path || record.path || parsedUrl?.pathname || request.url || record.url || '/';
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

const getHealthMeta = (successRate) => {
  if (successRate >= 95) {
    return { label: 'Healthy', color: 'bg-emerald-500' };
  }
  if (successRate >= 80) {
    return { label: 'Warning', color: 'bg-amber-500' };
  }
  return { label: 'Critical', color: 'bg-rose-500' };
};

const EndpointCard = ({ endpoint }) => {
  const { method, path, host, count, successRate, averageDuration, p95Duration, chartData, latestStatus } =
    endpoint;
  const health = getHealthMeta(successRate);

  return (
    <Card className="h-full rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MethodBadge method={method} />
              {host ? (
                <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                  {host}
                </Text>
              ) : null}
            </div>
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {path}
            </Title>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="slate">Requests {new Intl.NumberFormat().format(count)}</Badge>
            <StatusBadge status={latestStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <LineChart
              data={chartData}
              index="time"
              categories={['duration', 'baseline']}
              colors={['cyan', 'gray']}
              showYAxis={false}
              showLegend={false}
              className="h-36"
            />
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-tremor-small bg-gray-50 p-4 dark:bg-dark-tremor-background">
            <div>
              <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">Success rate</Text>
              <div className="mt-1 flex items-center gap-2">
                <Metric className="!text-xl">{successRate}%</Metric>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${health.color}`}>
                  {health.label}
                </span>
              </div>
            </div>

            <div>
              <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">
                Avg duration
              </Text>
              <Metric className="!text-xl">{averageDuration ? `${averageDuration}ms` : 'N/A'}</Metric>
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
    <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
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
                <TableCell className="min-w-[160px]">{formatTimestamp(operation.timestamp)}</TableCell>
                <TableCell>{operation.host || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default function WorkspaceOperationsApp() {
  const { client } = useInspectr();
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const latestEventMeta =
    useLiveQuery(
      () => eventDB.db.events.orderBy('time').last(),
      [],
      null,
      { throttle: 300 }
    ) || null;

  const records =
    useLiveQuery(
      () => eventDB.db.events.orderBy('time').reverse().toArray(),
      [],
      [],
      { throttle: 200 }
    ) || [];

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
        const result = await client.operations.summarize({ seriesLimit: MAX_CHART_POINTS });
        if (isMounted) {
          setSummary(result);
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

  const endpoints = useMemo(() => {
    if (!summary?.summaries?.length) return [];
    return summary.summaries.map((endpoint) => ({
      ...endpoint,
      chartData: (endpoint.series || [])
        .slice(-MAX_CHART_POINTS)
        .map((point) => ({
          time: formatChartLabel(point.ts),
          duration: point.duration ?? 0,
          baseline: point.baseline ?? endpoint.averageDuration ?? 0
        }))
    }));
  }, [summary]);

  const fallbackEndpointCount = useMemo(() => {
    if (!operations.length) return 0;
    const unique = new Set();
    operations.forEach((operation) => {
      if (operation?.method && operation?.path) {
        unique.add(`${operation.method} ${operation.path}`);
      }
    });
    return unique.size;
  }, [operations]);

  const { fallbackErrorCount, fallbackAverageDuration } = useMemo(() => {
    if (!operations.length) return { fallbackErrorCount: 0, fallbackAverageDuration: 0 };

    let errorCountAccumulator = 0;
    let durationSum = 0;
    let durationCount = 0;

    operations.forEach((operation) => {
      if ((operation.status || 0) >= 400) {
        errorCountAccumulator += 1;
      }
      if (Number.isFinite(operation.duration)) {
        durationSum += operation.duration;
        durationCount += 1;
      }
    });

    return {
      fallbackErrorCount: errorCountAccumulator,
      fallbackAverageDuration: durationCount ? Math.round(durationSum / durationCount) : 0
    };
  }, [operations]);

  const totalOperations = summary?.totals?.totalOperations ?? operations.length;
  const totalEndpoints =
    summary?.totals?.totalEndpoints ?? fallbackEndpointCount;
  const errorCount = summary?.totals?.errorCount ?? fallbackErrorCount;
  const averageDuration = summary?.totals?.averageDuration ?? fallbackAverageDuration;

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
            <Text className="text-sm text-tremor-content dark:text-dark-tremor-content">Errors</Text>
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
        </TabPanels>
      </TabGroup>
    </div>
  );
}
