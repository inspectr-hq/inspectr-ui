// src/components/SettingsApp.jsx
import React, { useState, useEffect } from 'react';
import { Divider, List, ListItem, TextInput } from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';
import DialogMockConfig from './DialogMockConfig.jsx';
import BadgeIndicator from './BadgeIndicator.jsx';
import CopyButton from './CopyButton.jsx';
import ServiceStatus from './ServiceStatus.jsx';

export default function SettingsApp() {
  const { apiEndpoint, setApiEndpoint, proxyEndpoint, ingressEndpoint, client } = useInspectr();

  // Local input state so typing doesn't immediately ping the API
  const [localEndpoint, setLocalEndpoint] = useState(apiEndpoint);
  const [statusInfo, setStatusInfo] = useState(null);
  const [mockInfo, setMockInfo] = useState(null);
  const [error, setError] = useState(null);

  // Authentication state
  const [authInfo, setAuthInfo] = useState(null);
  const [authSecretInput, setAuthSecretInput] = useState('');
  const [authTtlInput, setAuthTtlInput] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [mockDialogOpen, setMockDialogOpen] = useState(false);

  // Fetch health only on mount or after saving
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

  // Fetch mock configuration
  const fetchMockInfo = async () => {
    if (!statusInfo) return;
    try {
      const data = await client.mock.getConfig();
      setMockInfo(data);
    } catch (err) {
      console.error('Mock error', err);
      setMockInfo(null);
    }
  };

  // Fetch security configuration
  const fetchAuthInfo = async () => {
    try {
      setAuthError(null);
      const data = await client.auth.getAuthenticationSettings();
      setAuthInfo(data);
      setAuthSecretInput(data.secret || '');
      setAuthTtlInput(String(data.ttl || ''));
      setAuthEnabled(Boolean(data.enabled));
    } catch (err) {
      console.error('Authentication info error', err);
      setAuthError(err.message);
    }
  };

  // Handler for launching mock with new OpenAPI URL
  const handleLaunchMock = async (openApiUrl) => {
    try {
      const result = await client.mock.launch(openApiUrl);
      console.log('Mock launched:', result);
      fetchMockInfo();
    } catch (err) {
      console.error('Mock launch error', err);
      throw err;
    }
  };

  // ——— Effects ———
  useEffect(() => {
    fetchServiceInfo();
  }, [apiEndpoint]);

  useEffect(() => {
    if (statusInfo) fetchMockInfo();
  }, [statusInfo]);

  useEffect(() => {
    fetchAuthInfo();
  }, [apiEndpoint]);

  // Handler to save the endpoint
  const handleSaveEndpoint = (e) => {
    e.preventDefault();
    const cleaned = localEndpoint.replace(/\/+$/, '');
    setApiEndpoint(cleaned);
    client.configure({ apiEndpoint: cleaned });
    fetchServiceInfo();
  };

  // Handler for saving authentication settings
  const handleSaveAuthentication = async (e) => {
    e.preventDefault();
    try {
      const body = {
        enabled: authEnabled,
        secret: authSecretInput,
        ttl: authTtlInput ? parseInt(authTtlInput, 10) : undefined
      };
      const data = await client.auth.updateAuthenticationSettings(body);
      setAuthInfo(data);
      setAuthError(null);
    } catch (err) {
      console.error('Security save error', err);
      setAuthError(err.message);
    }
  };

  // ——— Render ———
  return (
    <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 max-w-5xl mx-auto bg-white transition-all dark:bg-gray-950">
      <form
        className="grid grid-cols-1 gap-10 md:grid-cols-3 items-end"
        onSubmit={handleSaveEndpoint}
      >
        {/* API Endpoint */}
        <div className="self-start">
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            API Endpoint
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Set the base URL for the Inspectr API.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          <TextInput
            id="api-endpoint"
            name="api-endpoint"
            placeholder="https://localhost:4004/api"
            value={localEndpoint}
            onValueChange={(v) => setLocalEndpoint(v)}
            className={`mt-2 focus:ring-2 focus:ring-offset-0 ${
              error
                ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : ''
            }`}
          />
          {error && <p className="mt-2 text-sm text-red-600">Cannot connect to {localEndpoint}</p>}
          <div className="flex items-center justify-end space-x-4 pt-4">
            {/*<button*/}
            {/*  type="button"*/}
            {/*  onClick={() => window.history.back()}*/}
            {/*  className="whitespace-nowrap rounded-tremor-small px-4 py-2.5 text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"*/}
            {/*>*/}
            {/*  Go back*/}
            {/*</button>*/}
            <button
              type="submit"
              className="whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              Save API Endpoint
            </button>
          </div>
        </div>
      </form>

      <Divider className="my-10" />

      {/* Inspectr */}
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
              {/*<span className={badgeClasses(!!statusInfo)}>{statusInfo?.message ?? 'NOK'}</span>*/}
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

      {/* Mock Info */}
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

      {/* Dialog for entering OpenAPI URL */}
      <DialogMockConfig
        open={mockDialogOpen}
        onClose={() => setMockDialogOpen(false)}
        initialUrl={mockInfo?.openapi}
        onSubmit={handleLaunchMock}
      />

      <Divider className="my-10" />

      {/* Authentication Guard */}
      <form
        onSubmit={handleSaveAuthentication}
        className="grid grid-cols-1 gap-10 md:grid-cols-3 items-end"
      >
        <div className="self-start">
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Authentication Guard
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Configure API secret, token TTL, and enable or disable guard.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2 space-y-4">
          {/* Toggle for enabling/disabling authentication */}
          <div className="flex items-center space-x-3">
            <input
              id="auth-enabled"
              type="checkbox"
              checked={authEnabled}
              onChange={(e) => setAuthEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-tremor-brand focus:ring-tremor-brand"
            />
            <label
              htmlFor="auth-enabled"
              className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
            >
              Authentication Guard Enabled
            </label>
          </div>

          {/* Secret input */}
          <TextInput
            placeholder="Secret"
            value={authSecretInput}
            onValueChange={(v) => setAuthSecretInput(v)}
            disabled={!authEnabled}
          />

          {/* TTL input (optional) */}
          <TextInput
            placeholder="TTL (seconds, optional)"
            value={authTtlInput}
            onValueChange={(v) => setAuthTtlInput(v)}
            disabled={!authEnabled}
          />
          <p className="text-sm text-tremor-default">Leave blank for default (24h)</p>

          {authError && <p className="text-sm text-red-600">{authError}</p>}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              Save Security
            </button>
          </div>

          {authInfo && (
            <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  API Key Header
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                  {authInfo.api_key_header}
                </span>
              </ListItem>
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  JWT Header
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                  {authInfo.token_header}
                </span>
              </ListItem>
            </List>
          )}
        </div>
      </form>

      <Divider className="my-10" />
    </div>
  );
}
