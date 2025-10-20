import React from 'react';
import DashBoardPercentileChart from '../src/components/dashboards/DashBoardPercentileChart.jsx';

const sampleData = [
  { date: '2024-05-01', p50: 42, p90: 110, p95: 140, p99: 210 },
  { date: '2024-05-02', p50: 39, p90: 105, p95: 135, p99: 198 },
  { date: '2024-05-03', p50: 44, p90: 120, p95: 150, p99: 220 },
  { date: '2024-05-04', p50: 37, p90: 95, p95: 125, p99: 180 }
];

export default {
  title: 'Components/DashBoardPercentileChart',
  component: DashBoardPercentileChart,
  args: {
    title: 'HTTP Request duration percentiles',
    data: sampleData
  }
};

export const Default = (args) => <DashBoardPercentileChart {...args} />;

export const MissingPercentiles = () => (
  <DashBoardPercentileChart
    title="Partial data"
    data={sampleData.map(({ date, p50, p95 }) => ({ date, p50, p95 }))}
  />
);

export const EmptyState = () => <DashBoardPercentileChart data={[]} />;
