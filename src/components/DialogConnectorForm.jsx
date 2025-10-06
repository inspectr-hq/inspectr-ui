// src/components/DialogConnectorForm.jsx
import React, { useEffect, useMemo, useState } from 'react';

const defaultFormState = {
  name: '',
  server_url: '',
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

const extractAuthFromHeaders = (headers = {}) => {
  const entries = Object.entries(headers || {});
  if (entries.length === 0) {
    return {
      authName: 'Authorization',
      authToken: '',
      restHeaders: {}
    };
  }

  const lowered = entries.map(([key, value]) => [key, value, key.toLowerCase()]);
  let authEntry = lowered.find(([, , lowerKey]) => lowerKey === 'authorization');
  if (!authEntry) {
    authEntry = lowered.find(
      ([, value]) => typeof value === 'string' && /^\s*Bearer\s+/i.test(value)
    );
  }

  if (!authEntry) {
    return {
      authName: 'Authorization',
      authToken: '',
      restHeaders: headers
    };
  }

  const [key, value] = authEntry;
  const token =
    typeof value === 'string' ? value.replace(/^\s*Bearer\s+/i, '') : String(value ?? '');
  const restHeaders = entries
    .filter(([entryKey]) => entryKey !== key)
    .reduce((acc, [entryKey, entryValue]) => {
      acc[entryKey] = entryValue;
      return acc;
    }, {});

  return {
    authName: key,
    authToken: token,
    restHeaders
  };
};

export default function DialogConnectorForm({
  open,
  mode = 'create',
  initialData = defaultFormState,
  onClose,
  onSubmit
}) {
  const [name, setName] = useState(initialData.name || '');
  const [serverUrl, setServerUrl] = useState(initialData.server_url || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [enabled, setEnabled] = useState(
    typeof initialData.enabled === 'boolean' ? initialData.enabled : true
  );
  const [headerPairs, setHeaderPairs] = useState(headersToPairs(initialData.headers));
  const [authHeaderName, setAuthHeaderName] = useState('Authorization');
  const [authBearerToken, setAuthBearerToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData.name || '');
      setServerUrl(initialData.server_url || '');
      setDescription(initialData.description || '');
      setEnabled(typeof initialData.enabled === 'boolean' ? initialData.enabled : true);
      const { authName, authToken, restHeaders } = extractAuthFromHeaders(initialData.headers);
      setAuthHeaderName(authName || 'Authorization');
      setAuthBearerToken(authToken || '');
      setHeaderPairs(headersToPairs(restHeaders));
      const hasAdditionalHeaders = Object.keys(restHeaders || {}).length > 0;
      setShowAdvanced(Boolean(authToken) || hasAdditionalHeaders);
      setError(null);
      setSaving(false);
    }
  }, [open, initialData]);

  const isDisabled = useMemo(() => {
    return saving || !name.trim() || !serverUrl.trim();
  }, [saving, name, serverUrl]);

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
        server_url: serverUrl.trim(),
        description: description.trim(),
        enabled: Boolean(enabled)
      };
      const headers = pairsToHeaders(headerPairs);
      const trimmedAuthName = authHeaderName.trim();
      const trimmedToken = authBearerToken.trim();
      if (trimmedAuthName && trimmedToken) {
        headers[trimmedAuthName] = /^Bearer\s+/i.test(trimmedToken)
          ? trimmedToken
          : `Bearer ${trimmedToken}`;
      }
      payload.headers = headers;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Connector save error', err);
      setError(err?.message || 'Failed to save connector');
      setSaving(false);
    }
  };

  const handleToggleAdvanced = () => setShowAdvanced((prev) => !prev);

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
              placeholder="Custom Connector"
            />
          </div>
          <div>
            <label
              htmlFor="connector-server-url"
              className="block text-sm font-medium text-gray-700"
            >
              Server URL
            </label>
            <input
              id="connector-server-url"
              type="url"
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
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
              Description <span className={'text-xs text-gray-300'}>(optional)</span>
            </label>
            <input
              id="connector-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
              placeholder="A custom connector for integrating with Inspectr Rules."
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
            <button
              type="button"
              onClick={handleToggleAdvanced}
              className="text-sm font-medium text-tremor-brand hover:text-tremor-brand-emphasis"
              disabled={saving}
            >
              {showAdvanced
                ? 'Configure authentication & headers'
                : 'Configure authentication & headers'}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-lg border border-tremor-border bg-tremor-background-muted p-4 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
                <div>
                  <p className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    API Token Authentication
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="connector-auth-header"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Header Name
                      </label>
                      <input
                        id="connector-auth-header"
                        type="text"
                        value={authHeaderName}
                        onChange={(event) => setAuthHeaderName(event.target.value)}
                        disabled={saving}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
                        placeholder="Authorization"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="connector-auth-token"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Bearer Token
                      </label>
                      <input
                        id="connector-auth-token"
                        type="text"
                        value={authBearerToken}
                        onChange={(event) => setAuthBearerToken(event.target.value)}
                        disabled={saving}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-tremor-brand focus:outline-none focus:ring-1 focus:ring-tremor-brand"
                        placeholder="Bearer Token"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-medium text-gray-700">
                      Additional Headers
                    </span>
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
              </div>
            )}
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
