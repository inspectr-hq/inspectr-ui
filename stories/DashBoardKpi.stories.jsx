import React from 'react';
import DashBoardKpi from '../src/components/dashboards/DashBoardKpi.jsx';

export default {
  title: 'Components/DashBoardKpi',
  component: DashBoardKpi
};

const overall = {
  total_requests: 1000,
  average_response_time: 120,
  success_rate: 0.95,
  error_rate: 0.05
};

const Template = (args) => <DashBoardKpi {...args} />;

export const Default = Template.bind({});
Default.args = { overall };
