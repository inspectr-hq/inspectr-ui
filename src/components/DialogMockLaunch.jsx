// src/components/DialogMockLaunch.jsx
import React, { useState, useEffect } from 'react';
import { useInspectr } from '../context/InspectrContext';

export default function DialogMockLaunch() {
  const { client, setToast } = useInspectr();
  const [open, setOpen] = useState(false);
  const [url, setUrl]   = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceMode, setServiceMode] = useState(null);

  // on mount, check for ?openapi=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openapi = params.get('openapi');
    if (openapi) {
      setUrl(openapi);
      setOpen(true);
      fetchServiceHealth();
    }
  }, []);

  // Fetch /health to check if we're in proxy mode
  const fetchServiceHealth = async () => {
    try {
      const info = await client.service.getHealth();
      setServiceMode(info.mode);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    if (!loading) setOpen(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await client.mock.launch(url);
      setToast({
        message: 'Mock launched',
        subMessage: `Serving mock from OpenAPI spec`,
        type: 'success'
      });
      setOpen(false);
    } catch (err) {
      console.error('Mock launch error', err);
      setError(err.message || 'Failed to launch mock');
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Configure Inspectr Mock</h3>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close"
            disabled={loading}
          >
            &times;
          </button>
        </div>

        {/* Introduction */}
        <p className="mb-2 text-sm text-gray-700">
          Inspectr lets you serve a mock API based on an OpenAPI spec.
        </p>
        <p className="mb-4 text-sm text-gray-700">
          You’re about to use <b>{url}</b> for mock responses.
          This will replace any existing mock configuration or catch-mode settings.
        </p>

        {/* Proxy-mode hint */}
        {serviceMode === 'proxy' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm font-medium text-yellow-800">
              Inspectr is currently running in <strong>proxy</strong> mode.
            </p>
            <p className="mt-2 text-sm text-yellow-800">
              To enable mock mode, restart Inspectr with:
            </p>
            <pre className="mt-2 p-2 bg-gray-100 text-xs rounded overflow-auto">
              inspectr --mock --openapi="{url}"
            </pre>
          </div>
        )}

        {/* URL input */}
        <div className="mb-4">
          <label htmlFor="openapi-url" className="block text-sm font-medium text-gray-700">
            OpenAPI Spec URL
          </label>
          <input
            id="openapi-url"
            type="url"
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com/openapi.yaml"
            disabled={loading}
            className={
              `mt-1 block w-full rounded-md shadow-sm sm:text-sm ` +
              (error
                ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500')
            }
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
