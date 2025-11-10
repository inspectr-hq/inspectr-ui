// src/components/settings/SettingsMcpInfo.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { Switch } from '@headlessui/react';

import { useInspectr } from '../../context/InspectrContext';
import BadgeIndicator from '../BadgeIndicator.jsx';
import CopyButton from '../CopyButton.jsx';
import { Tooltip } from '../ToolTip.jsx';
import { cx } from '../../utils/cx.js';
import { TooltipInfoButton } from '../TooltipInfoButton.jsx';



export default function SettingsMcpInfo() {
  const { client } = useInspectr();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [publicMcpEnabled, setPublicMcpEnabled] = useState(false);

  const loadMcpSettings = useCallback(async () => {
    if (!client?.mcp?.getMCPServerSettings) {
      setInfo(null);
      setLoading(false);
      return;
    }
    try {
      setError('');
      setLoading(true);
      const data = await client.mcp.getMCPServerSettings();
      setInfo(data);
      setPublicMcpEnabled(Boolean(data?.public));
    } catch (err) {
      console.error('Failed to load MCP server settings', err);
      setInfo(null);
      setError(err.message || 'Failed to load MCP server info');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadMcpSettings();
  }, [loadMcpSettings]);

  const handleTogglePublic = async (nextValue) => {
    if (!client?.mcp?.updateMCPServerSettings) return;
    const previousValue = publicMcpEnabled;
    setPublicMcpEnabled(nextValue);
    setSaving(true);
    setError('');
    try {
      const updated = await client.mcp.updateMCPServerSettings({ public: nextValue });
      setInfo(updated);
      setPublicMcpEnabled(Boolean(updated?.public));
    } catch (err) {
      console.error('Failed to update MCP public exposure', err);
      setPublicMcpEnabled(previousValue);
      setError(err.message || 'Failed to update MCP server visibility');
    } finally {
      setSaving(false);
    }
  };

  const mcp = info || {};
  const localUrl = mcp?.local_url || mcp?.url || '';
  const publicUrl = mcp?.public_url || '';
  const serverEnabled = mcp?.enabled ?? Boolean(localUrl);
  const statusLabel = serverEnabled ? 'Active' : 'Inactive';
  const publicUrlText = publicUrl
    ? publicUrl
    : publicMcpEnabled
      ? 'Activating public MCP access…'
      : '-';

  const urlValueClasses = 'text-tremor-content dark:text-dark-tremor-content break-all text-sm';

  const isPublicUrlCopyable = Boolean(publicUrl);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            MCP Server (Preview)
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Connection details for the built-in MCP server for Inspectr.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          {loading && <p className="mt-2 text-tremor-default">Loading MCP server info…</p>}
          {error && (
            <p className="mt-2 text-tremor-default text-red-600 dark:text-red-400">{error}</p>
          )}
          {info ? (
            <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
              <ListItem className="py-3 flex items-center justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Status
                </span>
                <BadgeIndicator filled variant={serverEnabled ? 'success' : 'neutral'}>
                  {statusLabel}
                </BadgeIndicator>
              </ListItem>

              <ListItem className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Public access
                  </span>
                  <TooltipInfoButton
                    label="Public access"
                    tooltip="Allow external agents to connect through the public Inspectr MCP endpoint."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={publicMcpEnabled}
                    onChange={handleTogglePublic}
                    disabled={saving || loading}
                    className={cx(
                      'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand focus-visible:ring-offset-2',
                      publicMcpEnabled
                        ? 'bg-tremor-brand dark:bg-dark-tremor-brand'
                        : 'bg-gray-200 dark:bg-gray-700',
                      saving || loading ? 'opacity-60 cursor-not-allowed' : ''
                    )}
                  >
                    <span className="sr-only">Toggle public MCP access</span>
                    <span
                      aria-hidden="true"
                      className={cx(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                        publicMcpEnabled ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </Switch>
                  <span className="text-sm font-medium text-tremor-content dark:text-dark-tremor-content">
                    {publicMcpEnabled ? 'Enabled' : 'Local only'}
                  </span>
                  {saving && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Saving…</span>
                  )}
                </div>
              </ListItem>

              <ListItem className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Local URL
                  </span>
                  <TooltipInfoButton
                    label="Local URL"
                    tooltip="Use this endpoint when connecting from the same network as your Inspectr instance."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={urlValueClasses}>{localUrl || '-'}</span>
                  {localUrl && <CopyButton textToCopy={localUrl} showLabel={false} />}
                </div>
              </ListItem>

              <ListItem className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Public URL
                  </span>
                  <TooltipInfoButton
                    label="Public URL"
                    tooltip="Share this endpoint with external MCP clients after enabling public access."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      urlValueClasses,
                      !isPublicUrlCopyable ? 'text-gray-500 dark:text-gray-400' : ''
                    )}
                  >
                    {publicUrlText}
                  </span>
                  {isPublicUrlCopyable && <CopyButton textToCopy={publicUrl} showLabel={false} />}
                </div>
              </ListItem>
            </List>
          ) : (
            !loading &&
            !error && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                MCP server settings are unavailable.
              </p>
            )
          )}
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
