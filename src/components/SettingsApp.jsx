// src/components/SettingsApp.jsx
import React, { useState, useEffect } from 'react';
import { Divider, List, ListItem, TextInput } from '@tremor/react';

export default function SettingsApp() {
  // ——— State ———
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('apiEndpoint') || `${window.location.origin}/api`;
    }
    return '';
  });
  const [statusInfo, setStatusInfo] = useState(null);
  const [mockInfo, setMockInfo] = useState(null);
  const [error, setError] = useState(null);

  // ——— Fetchers ———
  async function fetchHealthInfo() {
    try {
      setError(null);
      const res = await fetch(`${apiEndpoint}/health`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch health: ${res.status}`);
      }
      const data = await res.json();
      setStatusInfo(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatusInfo(null);
    }
  }

  async function fetchMockInfo() {
    try {
      const res = await fetch(`${apiEndpoint}/mock`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch mock: ${res.status}`);
      }
      const data = await res.json();
      setMockInfo(data);
    } catch (err) {
      console.error(err);
      setMockInfo(null);
    }
  }

  // ——— Effects ———
  useEffect(() => {
    if (apiEndpoint) {
      fetchHealthInfo();
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchMockInfo();
  }, [statusInfo]);

  // ——— Handlers ———
  function handleSaveEndpoint() {
    localStorage.setItem('apiEndpoint', apiEndpoint);
    fetchHealthInfo();
  }

  // ——— Render ———
  return (
    <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 max-w-5xl mx-auto bg-white transition-all dark:bg-gray-950">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveEndpoint();
        }}
      >
        {/* API Endpoint */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              API Endpoint
            </h2>
            <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
              Set the base URL for your service’s health & mock endpoints.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            <TextInput
              id="api-endpoint"
              name="api-endpoint"
              placeholder="https://…/api"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <Divider className="my-14" />

        {/* Service Health */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Service Health
            </h2>
            <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
              Current status of your API service.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
            {!statusInfo && !error && <p className="mt-2 text-tremor-default">Loading…</p>}
            {statusInfo && (
              <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Message
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {statusInfo.message}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Version
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {statusInfo.version}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Started At
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {new Date(statusInfo.start_time).toLocaleString()}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Mode
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {statusInfo.mode}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Expose
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {statusInfo.expose ? 'Yes' : 'No'}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    App
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {statusInfo.app ? 'Yes' : 'No'}
                  </span>
                </ListItem>
              </List>
            )}
          </div>
        </div>

        <Divider className="my-14" />

        {/* Mock Info */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Mock Details
            </h2>
            <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
              Information about your mock configuration.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            {!mockInfo && <p className="mt-2 text-tremor-default">Loading mock info…</p>}
            {mockInfo && (
              <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
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
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {mockInfo.examples}
                  </span>
                </ListItem>
                <ListItem className="py-3 flex justify-between">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Status
                  </span>
                  <span className="text-tremor-content dark:text-dark-tremor-content">
                    {mockInfo.status ? 'Active' : 'Inactive'}
                  </span>
                </ListItem>
              </List>
            )}
          </div>
        </div>

        <Divider className="my-14" />

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="whitespace-nowrap rounded-tremor-small px-4 py-2.5 text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
          >
            Go back
          </button>
          <button
            type="submit"
            className="whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
