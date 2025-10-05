// src/components/DialogConnectorForm.jsx
import React, { useEffect, useMemo, useState } from 'react';

const defaultFormState = {
  name: '',
  base_url: '',
  description: '',
  enabled: true,
  headers: {}
};

const headersToPairs = (headers = {}) => {
  if (!headers || typeof headers !== 'object') return [{ key: '', value: '' }];
  const entries = Object.entries(headers);
  if (entries.length === 0) return [{ key: '', value: '' }];
  return entries.map(([key, value]) => ({ key, value: String(value ?? '') }));
};

const pairsToHeaders = (pairs) => {
  return pairs.reduce((acc, { key, value }) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      acc[trimmedKey] = value ?? '';
    }
    return acc;
  }, {});
};

export default function DialogConnectorForm({
  open,
  mode = 'create',
  initialData = defaultFormState,
  onClose,
  onSubmit
}) {
  const [name, setName] = useState(initialData.name || '');
  const [baseUrl, setBaseUrl] = useState(initialData.base_url || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [enabled, setEnabled] = useState(
    typeof initialData.enabled === 'boolean' ? initialData.enabled : true
  );
  const [headerPairs, setHeaderPairs] = useState(headersToPairs(initialData.headers));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData.name || '');
      setBaseUrl(initialData.base_url || '');
      setDescription(initialData.description || '');
      setEnabled(typeof initialData.enabled === 'boolean' ? initialData.enabled : true);
      setHeaderPairs(headersToPairs(initialData.headers));
      setError(null);
      setSaving(false);
    }
  }, [open, initialData]);

  const isDisabled = useMemo(() => {
    return saving || !name.trim() || !baseUrl.trim();
  }, [saving, name, baseUrl]);

  if (!open) return null;

  const updateHeaderPair = (index, field, value) => {
    setHeaderPairs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addHeaderPair = () => {
    setHeaderPairs((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeHeaderPair = (index) => {
    setHeaderPairs((prev) => {
      if (prev.length === 1) return [{ key: '', value: '' }];
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async () => {
    if (isDisabled) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        base_url: baseUrl.trim(),
        description: description.trim(),
        enabled: Boolean(enabled),
        headers: pairsToHeaders(headerPairs)
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Connector save error', err);
      setError(err?.message || 'Failed to save connector');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={() => (!saving ? onClose() : null)}
      />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'edit' ? 'Edit Connector' : 'Create Connector'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            disabled={saving}
          >
            &times;
          </button>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label htmlFor="connector-name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="connector-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
              placeholder="Example Connector"
            />
          </div>
          <div>
            <label htmlFor="connector-base-url" className="block text-sm font-medium text-gray-700">
              Base URL
            </label>
            <input
              id="connector-base-url"
              type="url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
              placeholder="http://localhost:3100"
            />
          </div>
          <div>
            <label
              htmlFor="connector-description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="connector-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
              placeholder="Notify in a Slack channel"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="connector-enabled"
              type="checkbox"
              checked={Boolean(enabled)}
              onChange={(event) => setEnabled(event.target.checked)}
              disabled={saving}
              className="h-5 w-5 rounded border-gray-300 text-tremor-brand focus:ring-tremor-brand"
            />
            <label htmlFor="connector-enabled" className="text-sm font-medium text-gray-700">
              Enabled
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="block text-sm font-medium text-gray-700">Headers</span>
              <button
                type="button"
                onClick={addHeaderPair}
                disabled={saving}
                className="text-sm font-medium text-tremor-brand hover:text-tremor-brand-emphasis"
              >
                Add header
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {headerPairs.map((pair, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(event) => updateHeaderPair(index, 'key', event.target.value)}
                    placeholder="Header name"
                    disabled={saving}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(event) => updateHeaderPair(index, 'value', event.target.value)}
                    placeholder="Header value"
                    disabled={saving}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderPair(index)}
                    disabled={saving}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-tremor-brand hover:bg-tremor-brand-emphasis'
            }`}
          >
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create connector'}
          </button>
        </div>
      </div>
    </div>
  );
}
