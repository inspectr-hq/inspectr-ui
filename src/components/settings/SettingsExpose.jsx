import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { Switch } from '@headlessui/react';

import { useInspectr } from '../../context/InspectrContext';
import BadgeIndicator from '../BadgeIndicator.jsx';
import CopyButton from '../CopyButton.jsx';
import { TooltipInfoButton } from '../TooltipInfoButton.jsx';

export default function SettingsExpose() {
  const { client } = useInspectr();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    enabled: false,
    channel: '',
    channel_code: ''
  });

  const loadSettings = useCallback(async () => {
    if (!client?.expose?.getExposeSettings) {
      setSettings(null);
      setLoading(false);
      return;
    }
    try {
      setError('');
      setLoading(true);
      const data = await client.expose.getExposeSettings();
      setSettings(data);
      setForm({
        enabled: Boolean(data?.enabled),
        channel: data?.channel || '',
        channel_code: data?.channel_code || ''
      });
    } catch (err) {
      console.error('Failed to load expose settings', err);
      setError(err.message || 'Failed to load expose settings');
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!client?.expose?.putExposeSettings) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        enabled: Boolean(form.enabled),
        channel: form.channel || undefined,
        channel_code: form.channel_code || undefined
      };
      const updated = await client.expose.putExposeSettings(payload);
      setSettings(updated);
      setForm({
        enabled: Boolean(updated?.enabled),
        channel: updated?.channel || '',
        channel_code: updated?.channel_code || ''
      });
    } catch (err) {
      console.error('Failed to save expose settings', err);
      setError(err.message || 'Failed to save expose settings');
    } finally {
      setSaving(false);
    }
  };

  const localUrl = settings?.local_url || '-';
  const publicUrl = settings?.public_url || '';
  const persistedEnabled = Boolean(settings?.enabled);

  const canSave = useMemo(() => settings !== null, [settings]);
  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      Boolean(form.enabled) !== Boolean(settings?.enabled) ||
      form.channel !== (settings?.channel || '') ||
      form.channel_code !== (settings?.channel_code || '')
    );
  }, [form.channel, form.channel_code, form.enabled, settings]);
  const statusEnabled = persistedEnabled;

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Expose settings
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Control whether Inspectr exposes the proxy endpoint publicly and configure the channel
            credentials.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          {loading && <p className="text-sm text-tremor-default">Loading expose settings…</p>}
          {error && (
            <div className="mt-1 space-y-2 text-sm text-red-600 dark:text-red-400">
              <p>{error}</p>
            </div>
          )}
          {!loading && settings && (
            <List className="mt-2 divide-y divide-tremor-border dark:divide-dark-tremor-border">
              <ListItem className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Status
                  </span>
                  <TooltipInfoButton
                    label="Expose status"
                    tooltip="Expose forwards the local proxy through a public channel controlled by Inspectr."
                  />
                </div>
                <BadgeIndicator filled variant={statusEnabled ? 'success' : 'neutral'}>
                  {statusEnabled ? 'Enabled' : 'Disabled'}
                </BadgeIndicator>
              </ListItem>
              <ListItem className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Local URL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-tremor-content break-all">{localUrl}</span>
                  {localUrl !== '-' && <CopyButton textToCopy={localUrl} showLabel={false} />}
                </div>
              </ListItem>
              <ListItem className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Public URL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-tremor-content break-all">
                    {publicUrl || 'Not available'}
                  </span>
                  {publicUrl && <CopyButton textToCopy={publicUrl} showLabel={false} />}
                </div>
              </ListItem>
            </List>
          )}
          <Divider className="my-8" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-4">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content">
                  Enable expose toggle
                </label>
                <TooltipInfoButton
                  label="Expose"
                  tooltip="Enable to share the viewport through a public channel and expose operations externally."
                />
              </div>
              <Switch
                checked={form.enabled}
                onChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))}
                disabled={saving || loading || !canSave}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${form.enabled ? 'bg-tremor-brand dark:bg-dark-tremor-brand' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className="sr-only">Toggle expose</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    form.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </Switch>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                Channel
              </label>
              <input
                type="text"
                value={form.channel}
                onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
                disabled={saving || loading || !canSave}
                placeholder="hello-world"
                className="w-full border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                Channel code
              </label>
              <input
                type="text"
                value={form.channel_code}
                onChange={(e) => setForm((prev) => ({ ...prev, channel_code: e.target.value }))}
                disabled={saving || loading || !canSave}
                placeholder="12345ABC"
                className="w-full border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-6 md:ml-[220px] flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() =>
                setForm({
                  enabled: Boolean(settings?.enabled),
                  channel: settings?.channel || '',
                  channel_code: settings?.channel_code || ''
                })
              }
              disabled={!canSave || saving || !isDirty}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving || !isDirty}
              className={`px-4 py-2 rounded text-white ${
                saving
                  ? 'bg-gray-400'
                  : persistedEnabled
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                    : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
              }`}
            >
              {saving ? 'Saving…' : persistedEnabled ? 'Disable expose' : 'Enable expose'}
            </button>
            {!canSave && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expose settings are unavailable for this installation.
              </p>
            )}
          </div>
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
