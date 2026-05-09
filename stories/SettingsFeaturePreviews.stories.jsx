import React from 'react';
import SettingsFeaturePreviews from '../src/components/settings/SettingsFeaturePreviews.jsx';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/Settings/SettingsFeaturePreviews',
  component: SettingsFeaturePreviews
};

export const Default = () => (
  <InspectrProvider>
    <SettingsFeaturePreviews />
  </InspectrProvider>
);
