// src/components/settings/DialogAuthConfig.jsx
import React, { useState, useEffect } from 'react';

export default function DialogAuthConfig({
  open,
  onClose,
  initialSecret = '',
  initialTtl = '',
  onSubmit
}) {
  const [secret, setSecret] = useState(initialSecret);
  const [ttl, setTtl] = useState(initialTtl);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSecret(initialSecret);
      setTtl(initialTtl);
      setError(null);
      setLoading(false);
    }
  }, [open, initialSecret, initialTtl]);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(secret, ttl);
      onClose();
    } catch (err) {
      console.error('Authentication save error', err);
      setError(err.message || 'Failed to save');
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
          <h3 className="text-lg font-medium text-gray-900">Authentication Guard Settings</h3>
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
          <label htmlFor="auth-secret" className="block text-sm font-medium text-gray-700">
            Secret
          </label>
          <input
            id="auth-secret"
            type="text"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="auth-ttl" className="block text-sm font-medium text-gray-700">
            TTL (hours, optional)
          </label>
          <input
            id="auth-ttl"
            type="number"
            value={ttl}
            onChange={(e) => {
              setTtl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="24"
            disabled={loading}
            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
