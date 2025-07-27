// src/components/SettingsApiEndpoint.jsx
import React, { useState } from 'react';
import { Divider, TextInput } from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';

export default function SettingsApiEndpoint() {
  const { apiEndpoint, setApiEndpoint, client } = useInspectr();
  const [localEndpoint, setLocalEndpoint] = useState(apiEndpoint);
  const [error, setError] = useState(null);

  const handleSaveEndpoint = async (e) => {
    e.preventDefault();
    const cleaned = localEndpoint.replace(/\/+$/, '');
    setApiEndpoint(cleaned);
    client.configure({ apiEndpoint: cleaned });
    // Ping the service to verify the endpoint
    try {
      setError(null);
      await client.service.getHealth();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <form
        className="grid grid-cols-1 gap-10 md:grid-cols-3 items-end"
        onSubmit={handleSaveEndpoint}
      >
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
    </>
  );
}
