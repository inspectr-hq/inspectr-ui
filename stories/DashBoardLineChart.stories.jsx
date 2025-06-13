import React from 'react';
import DashBoardLineChart from '../src/components/DashBoardLineChart';

export default {
  title: 'Components/DashBoardLineChart',
  component: DashBoardLineChart
};

const data = [
  { date: 'Jan', min_response_time: 100, average_response_time: 150, max_response_time: 200 },
  { date: 'Feb', min_response_time: 90, average_response_time: 140, max_response_time: 220 },
  { date: 'Mar', min_response_time: 110, average_response_time: 160, max_response_time: 240 }
];

const Template = (args) => <DashBoardLineChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Response Times',
  data,
  metricKey: ['min_response_time', 'average_response_time', 'max_response_time'],
  metricUnit: 'ms',
  highlightValue: 150,
  highlightLabel: 'Average Response Time'
};
