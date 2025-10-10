// src/components/settings/DialogMockConfig.jsx

import React, { useState, useEffect } from 'react';

export default function DialogMockConfig({ open, onClose, initialUrl = '', onSubmit }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // reset input whenever the dialog is opened
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setError(null);
      +setLoading(false);
    }
  }, [open, initialUrl]);

  if (!open) return null;

  // wrap submission to catch errors
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(url);
      onClose();
    } catch (err) {
      console.error('Mock launch error', err);
      setError(err.message || 'Failed to launch mock');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Dialog panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Set OpenAPI URL</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close"
            disabled={loading}
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="openapi-url" className="block text-sm font-medium text-gray-700">
            OpenAPI Spec URL
          </label>
          <input
            id="openapi-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
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
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Launch Mock'}
          </button>
        </div>
      </div>
    </div>
  );
}
