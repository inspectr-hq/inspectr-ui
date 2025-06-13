import React from 'react';
import Workspace from '../src/components/Workspace';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/Workspace',
  component: Workspace
};

export const Default = () => (
  <InspectrProvider>
    <Workspace />
  </InspectrProvider>
);
