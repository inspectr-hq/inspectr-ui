import React from 'react';
import UsageMetrics from '../src/components/UsageMetrics.jsx';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/UsageMetrics',
  component: UsageMetrics
};

export const Default = () => (
  <InspectrProvider>
    <UsageMetrics />
  </InspectrProvider>
);
