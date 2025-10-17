// src/components/insights/EndpointCard.jsx

import React, { useMemo } from 'react';
import { Badge, Card, LineChart, Metric, Text, Title } from '@tremor/react';
import MethodBadge from './MethodBadge.jsx';
import StatusBadge from './StatusBadge.jsx';

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

export default function EndpointCard({ endpoint }) {
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
}
