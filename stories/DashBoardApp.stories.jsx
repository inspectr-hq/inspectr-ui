import React from 'react';
import DashBoardApp from '../src/components/DashBoardApp';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/DashBoardApp',
  component: DashBoardApp
};

export const Default = () => (
  <InspectrProvider>
    <DashBoardApp />
  </InspectrProvider>
);
