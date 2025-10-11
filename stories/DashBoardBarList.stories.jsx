import React from 'react';
import DashBoardBarList from '../src/components/dashboards/DashBoardBarList.jsx';

export default {
  title: 'Components/DashBoardBarList',
  component: DashBoardBarList
};

const data = [
  { path: '/api/a', count: 100 },
  { path: '/api/b', count: 80 },
  { path: '/api/c', count: 50 }
];

const Template = (args) => <DashBoardBarList {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Top Endpoints',
  data,
  toggleable: true
};
