import React from 'react';
import DashBoardDonutChart from '../src/components/DashBoardDonutChart';

export default {
  title: 'Components/DashBoardDonutChart',
  component: DashBoardDonutChart
};

const data = [
  { name: 'A', amount: 50, share: '50%', borderColor: 'bg-blue-500' },
  { name: 'B', amount: 25, share: '25%', borderColor: 'bg-violet-500' },
  { name: 'C', amount: 25, share: '25%', borderColor: 'bg-fuchsia-500' }
];

const Template = (args) => <DashBoardDonutChart {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Method Ratio',
  description: 'Distribution',
  data
};
