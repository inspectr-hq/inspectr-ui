import React, { useEffect, useMemo } from 'react';
import DialogVersionUpdate from '../src/components/DialogVersionUpdate.jsx';
import { InspectrContext } from '../src/context/InspectrContext.jsx';

export default {
  title: 'Components/DialogVersionUpdate',
  component: DialogVersionUpdate,
  argTypes: {
    latestVersion: { control: 'text' },
    currentVersion: { control: 'text' },
    updateAvailable: { control: 'boolean' }
  }
};

const VERSION_KEY = 'inspectrVersionMuteUntil';

const MockProvider = ({ latestVersion, currentVersion, updateAvailable }) => {
  useEffect(() => {
    localStorage.removeItem(VERSION_KEY);
  }, [latestVersion, currentVersion, updateAvailable]);

  const mockClient = useMemo(
    () => ({
      service: {
        getVersion: async () => ({
          update_available: updateAvailable,
          latest_version: latestVersion,
          current_version: currentVersion
        })
      }
    }),
    [updateAvailable, latestVersion, currentVersion]
  );

  return (
    <InspectrContext.Provider value={{ client: mockClient }}>
      <div className="min-h-[220px] bg-gray-50 p-6 dark:bg-gray-950">
        <DialogVersionUpdate />
      </div>
    </InspectrContext.Provider>
  );
};

const Template = (args) => <MockProvider {...args} />;

export const UpdateAvailable = Template.bind({});
UpdateAvailable.args = {
  latestVersion: 'v1.4.0',
  currentVersion: 'v1.3.0',
  updateAvailable: true
};
