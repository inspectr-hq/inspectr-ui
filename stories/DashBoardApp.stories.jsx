import React from 'react';
import DashBoardApp from '../src/components/DashBoardApp';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Apps/Dashboard/DashBoardApp',
  component: DashBoardApp
};

export const Default = () => (
  <InspectrProvider>
    <DashBoardApp />
  </InspectrProvider>
);
