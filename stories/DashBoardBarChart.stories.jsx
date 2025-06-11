import React from 'react';
import DashBoardBarChart from '../src/components/DashBoardBarChart';

export default {
  title: 'Components/DashBoardBarChart',
  component: DashBoardBarChart
};

const sampleData = [
  { date: 'Jan', '2xx': 100, '3xx': 10, '4xx': 5, '5xx': 1 },
  { date: 'Feb', '2xx': 80, '3xx': 20, '4xx': 10, '5xx': 2 },
  { date: 'Mar', '2xx': 120, '3xx': 15, '4xx': 8, '5xx': 0 }
];

const Template = (args) => <DashBoardBarChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Traffic Volume',
  data: sampleData
};
