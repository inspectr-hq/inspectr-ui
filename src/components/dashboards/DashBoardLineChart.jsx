// src/components/DashBoardLineChart.jsx

import { AreaChart, Card } from '@tremor/react';

function valueFormatter(number, unit) {
  // For milliseconds
  if (unit === 'ms') {
    return `${Math.round(number)}`;
  }

  // Default formatting for other units
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short'
  });
  return formatter.format(number);
}

export default function DashBoardLineChart({
  title = 'Response Times',
  data,
  metricKey = [],
  metricUnit = '',
  highlightValue = '',
  highlightLabel = ''
}) {
  // Ensure that metricKey is an array
  const categories = Array.isArray(metricKey) ? metricKey : [metricKey];

  // Create a formatter function that includes the metricUnit
  const formatWithUnit = (number) => valueFormatter(number, metricUnit);

  return (
    <Card className="mt-4 h-120 rounded-tremor-small p-2">
      <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        {title}
      </h3>
      <div className="p-6">
        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          {highlightLabel}
        </p>
        <p className="text-2xl font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {highlightValue}
          {metricUnit ? ` ${metricUnit}` : ''}
        </p>
        <AreaChart
          data={data}
          index="date"
          categories={categories}
          // showLegend={false}
          showGradient={false}
          // yAxisWidth={45}
          // startEndOnly={true}
          // xAxisLabel="Month"
          // yAxisLabel="MS"
          // tickGap={2}
          valueFormatter={formatWithUnit}
          className="mt-8 hidden h-80 w-full sm:block"
        />
        <AreaChart
          data={data}
          index="date"
          categories={categories}
          // showLegend={true}
          showGradient={false}
          // showYAxis={false}
          // startEndOnly={true}
          // yAxisLabel="MS"
          // tickGap={2}
          valueFormatter={formatWithUnit}
          className="mt-8 h-48 w-full sm:hidden"
        />
      </div>
    </Card>
  );
}
