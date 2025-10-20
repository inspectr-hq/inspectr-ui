// src/components/insights/InsightsApp.jsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Flex,
  Grid,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title
} from '@tremor/react';
import { useLiveQuery } from 'dexie-react-hooks';
import eventDB from '../../utils/eventDB.js';
import { useInspectr } from '../../context/InspectrContext.jsx';
import EndpointMode from './EndpointMode.jsx';
import ListMode from './ListMode.jsx';
import TableMode from './TableMode.jsx';
import TimelineMode from './TimelineMode.jsx';
import { formatChartLabel, normalizeOperation, endpointKey } from './insightsUtils.js';
import { MAX_CHART_POINTS } from './constants.js';

export default function InsightsApp() {
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

  const operations = useMemo(
    () =>
      records
        .map((record) => normalizeOperation(record))
        .filter(Boolean)
        .sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0)),
    [records]
  );

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
              Insights Explorer
            </Title>
            <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              Get more insights into the operations by grouping them by endpoint, as time line view, as rich cards, or in a compact table
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
