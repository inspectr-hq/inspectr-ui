// src/components/settings/SettingsMock.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { useInspectr } from '../../context/InspectrContext';
import DialogMockConfig from './DialogMockConfig.jsx';
import BadgeIndicator from '../BadgeIndicator.jsx';

export default function SettingsMock() {
  const { client } = useInspectr();
  const [mockInfo, setMockInfo] = useState(null);
  const [mockDialogOpen, setMockDialogOpen] = useState(false);

  const fetchMockInfo = async () => {
    try {
      const data = await client.mock.getConfig();
      setMockInfo(data);
    } catch (err) {
      console.error('Mock info error', err);
      setMockInfo(null);
    }
  };

  const handleLaunchMock = async (openApiUrl) => {
    try {
      await client.mock.launch(openApiUrl);
      fetchMockInfo();
    } catch (err) {
      console.error('Mock launch error', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMockInfo();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Mock Details
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Information about your mock configuration.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setMockDialogOpen(true)}
              className="whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              Set OpenAPI
            </button>
          </div>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          {!mockInfo && <p className="mt-2 text-tremor-default">Loading mock info…</p>}
          {mockInfo && (
            <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Status
                </span>
                <BadgeIndicator filled="true">
                  {mockInfo?.status ? 'Active' : 'Inactive'}
                </BadgeIndicator>
              </ListItem>
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  OpenAPI Spec
                </span>
                <a
                  href={mockInfo.openapi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-tremor-content dark:text-dark-tremor-content"
                >
                  {mockInfo.openapi}
                </a>
              </ListItem>
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Examples
                </span>
                <BadgeIndicator variant="neutral">{mockInfo?.examples}</BadgeIndicator>
              </ListItem>
            </List>
          )}
        </div>
      </div>
      <DialogMockConfig
        open={mockDialogOpen}
        onClose={() => setMockDialogOpen(false)}
        initialUrl={mockInfo?.openapi}
        onSubmit={handleLaunchMock}
      />
      <Divider className="my-10" />
    </>
  );
}
