// src/components/SettingsInspectr.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';
import BadgeIndicator from './BadgeIndicator.jsx';
import CopyButton from './CopyButton.jsx';
import ServiceStatus from './ServiceStatus.jsx';

export default function SettingsInspectr() {
  const { apiEndpoint, proxyEndpoint, ingressEndpoint, client } = useInspectr();
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState(null);

  const fetchServiceInfo = async () => {
    try {
      setError(null);
      setStatusInfo(null);
      const data = await client.service.getHealth();
      setStatusInfo(data);
    } catch (err) {
      console.error('Health error', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchServiceInfo();
  }, [apiEndpoint]);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Inspectr
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Information about the connected Inspectr service itself.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          {!statusInfo && !error && <p className="mt-2 text-tremor-default">Loading…</p>}
          <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Status
              </span>
              <BadgeIndicator filled="true">{statusInfo?.message ?? 'NOK'}</BadgeIndicator>
            </ListItem>
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Version
              </span>
              <span className="text-tremor-content dark:text-dark-tremor-content">
                {statusInfo?.version ?? '-'}
              </span>
            </ListItem>
            {statusInfo && (
              <>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Running since
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {new Date(statusInfo.start_time).toLocaleString()}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Mode
                  </span>
                  <BadgeIndicator variant="neutral">{statusInfo.mode}</BadgeIndicator>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Proxy URL
                  </span>
                  {proxyEndpoint ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                        {proxyEndpoint}
                      </span>
                      <CopyButton textToCopy={proxyEndpoint} showLabel={false} />
                    </div>
                  ) : (
                    <span className="text-tremor-default dark:text-dark-tremor-content">
                      Not set
                    </span>
                  )}
                </ListItem>
                {statusInfo?.backend && (
                  <ListItem className="py-3 flex justify-between">
                    <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      Backend URL
                    </span>
                    <div className="flex items-center space-x-2">
                      <ServiceStatus component="backend" />
                      <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                        {statusInfo.backend}
                      </span>
                      <CopyButton textToCopy={statusInfo.backend} showLabel={false} />
                    </div>
                  </ListItem>
                )}
                {statusInfo?.mode === 'mock' && (
                  <ListItem className="py-3 flex justify-between">
                    <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      Mock URL
                    </span>
                    <div className="flex items-center space-x-2">
                      <ServiceStatus component="mock" />
                      <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                        {proxyEndpoint}
                      </span>
                      <CopyButton textToCopy={proxyEndpoint} showLabel={false} />
                    </div>
                  </ListItem>
                )}
                {statusInfo?.mode === 'catch' && (
                  <ListItem className="py-3 flex justify-between">
                    <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      Catch URL
                    </span>
                    <div className="flex items-center space-x-2">
                      <ServiceStatus component="catch" />
                      <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                        {proxyEndpoint}
                      </span>
                      <CopyButton textToCopy={proxyEndpoint} showLabel={false} />
                    </div>
                  </ListItem>
                )}
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Expose
                  </span>
                  <BadgeIndicator>{statusInfo?.expose ? 'Yes' : 'No'}</BadgeIndicator>
                </ListItem>
                {statusInfo.expose && ingressEndpoint && (
                  <ListItem className="py-3 flex justify-between">
                    <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      Expose URL
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                        {ingressEndpoint}
                      </span>
                      <CopyButton textToCopy={ingressEndpoint} showLabel={false} />
                    </div>
                  </ListItem>
                )}
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    App
                  </span>
                  <BadgeIndicator>{statusInfo?.app ? 'Yes' : 'No'}</BadgeIndicator>
                </ListItem>
              </>
            )}
          </List>
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
