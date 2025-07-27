// src/components/SettingsApp.jsx
import React from 'react';
import SettingsApiEndpoint from './SettingsApiEndpoint.jsx';
import SettingsInspectr from './SettingsInspectr.jsx';
import SettingsMock from './SettingsMock.jsx';
import SettingsGuard from './SettingsGuard.jsx';

export default function SettingsApp() {
  return (
    <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 max-w-5xl mx-auto bg-white transition-all dark:bg-gray-950">
      <SettingsApiEndpoint />
      <SettingsInspectr />
      <SettingsMock />
      <SettingsGuard />
    </div>
  );
}
