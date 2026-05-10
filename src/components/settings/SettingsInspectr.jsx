// src/components/settings/SettingsInspectr.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { useInspectr } from '../../context/InspectrContext';
import BadgeIndicator from '../BadgeIndicator.jsx';
import CopyButton from '../CopyButton.jsx';
import ServiceStatus from './ServiceStatus.jsx';

const formatBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

export default function SettingsInspectr() {
  const { apiEndpoint, proxyEndpoint, ingressEndpoint, client } = useInspectr();
  const [statusInfo, setStatusInfo] = useState(null);
  const [storagePolicy, setStoragePolicy] = useState(null);
  const [error, setError] = useState(null);

  const fetchServiceInfo = async () => {
    try {
      setError(null);
      setStatusInfo(null);
      setStoragePolicy(null);
      const [healthData, metricsData] = await Promise.all([
        client.service.getHealth(),
        client.service.getMetrics().catch(() => null)
      ]);
      setStatusInfo(healthData);
      setStoragePolicy(metricsData?.operations?.storage_policy || null);
    } catch (err) {
      console.error('Health error', err);
      setError(err.message);
    }
  };

  const retentionTtl = storagePolicy?.operations_retention_ttl;
  const maxStored = storagePolicy?.operations_max_stored;
  const normalizedRetentionTtl = retentionTtl == null ? '' : String(retentionTtl).trim();
  const hasActiveTtl = normalizedRetentionTtl !== '';
  const retentionTtlLabel = normalizedRetentionTtl === '0' ? 'Unlimited' : normalizedRetentionTtl;
  const normalizedMaxStored = maxStored == null ? '' : String(maxStored).trim();
  const hasActiveMaxStored = normalizedMaxStored !== '';
  const maxStoredLabel = normalizedMaxStored === '0' ? 'Unlimited' : normalizedMaxStored;

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
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Operations Storage
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Active storage policy and current usage.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
            {hasActiveTtl && (
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Retention Window
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content">
                  {retentionTtlLabel}
                </span>
              </ListItem>
            )}
            {hasActiveMaxStored && (
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Max Operations Stored
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content">
                  {maxStoredLabel}
                </span>
              </ListItem>
            )}
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Current Operations Stored
              </span>
              <span className="text-tremor-content dark:text-dark-tremor-content">
                {storagePolicy?.operations_stored ?? '0'}
              </span>
            </ListItem>
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Current Storage Size
              </span>
              <span className="text-tremor-content dark:text-dark-tremor-content">
                {formatBytes(storagePolicy?.storage_bytes)}
              </span>
            </ListItem>
          </List>
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
