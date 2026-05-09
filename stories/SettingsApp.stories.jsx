import React from 'react';
import SettingsApp from '../src/components/SettingsApp';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Apps/Settings/SettingsApp',
  component: SettingsApp
};

export const Default = () => (
  <InspectrProvider>
    <SettingsApp />
  </InspectrProvider>
);
