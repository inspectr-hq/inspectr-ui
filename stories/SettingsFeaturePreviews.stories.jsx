import React from 'react';
import SettingsFeaturePreviews from '../src/components/SettingsFeaturePreviews';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/SettingsFeaturePreviews',
  component: SettingsFeaturePreviews
};

export const Default = () => (
  <InspectrProvider>
    <SettingsFeaturePreviews />
  </InspectrProvider>
);
