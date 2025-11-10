// src/components/settings/SettingsGuard.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { Switch } from '@headlessui/react';
import { useInspectr } from '../../context/InspectrContext';
import DialogAuthConfig from './DialogAuthConfig.jsx';
import CopyButton from '../CopyButton.jsx';
import { cx } from '../../utils/cx.js';
import { Tooltip } from '../ToolTip.jsx';
import { TooltipInfoButton } from '../TooltipInfoButton.jsx';

export default function SettingsGuard() {
  const { apiEndpoint, client } = useInspectr();
  const [authInfo, setAuthInfo] = useState(null);
  const [authSecretInput, setAuthSecretInput] = useState('');
  const [authTtlInput, setAuthTtlInput] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const loading = authInfo === null && !authError;

  const fetchAuthInfo = async () => {
    try {
      setAuthError(null);
      const data = await client.auth.getAuthenticationSettings();
      setAuthInfo(data);
      setAuthSecretInput(data.secret || '');
      setAuthTtlInput(String(data.token_ttl || ''));
      setAuthEnabled(Boolean(data.enabled));
    } catch (err) {
      console.error('Authentication info error', err);
      setAuthError(err.message);
    }
  };

  const handleSaveAuthentication = async (
    secret = authSecretInput,
    token_ttl = authTtlInput,
    enabled = authEnabled
  ) => {
    try {
      setSaving(true);
      const body = {
        enabled,
        secret,
        token_ttl: token_ttl ? parseInt(token_ttl, 10) : undefined
      };
      const data = await client.auth.updateAuthenticationSettings(body);
      setAuthInfo(data);
      setAuthSecretInput(data.secret || '');
      setAuthTtlInput(String(data.token_ttl || ''));
      setAuthEnabled(Boolean(data.enabled));
      setAuthError(null);
    } catch (err) {
      console.error('Security save error', err);
      setAuthError(err.message);
    } finally {
    setSaving(false);
    }
  };

  const handleRenewToken = async () => {
    await handleSaveAuthentication(authSecretInput, authTtlInput, authEnabled);
  };

  useEffect(() => {
    fetchAuthInfo();
  }, [apiEndpoint]);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 items-start">
        <div className="self-start">
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Backend Authentication Guard
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Use one of the following API Keys to authenticate requests to your backend.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAuthDialogOpen(true)}
              className="whitespace-nowrap rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              Configure Authentication
            </button>
          </div>
        </div>
        <div className="sm:max-w-3xl md:col-span-2 space-y-4">
          {authInfo && (
            <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
              <ListItem className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Guard Protection
                  </span>
                  <TooltipInfoButton
                    label="Authentication Guard"
                    tooltip="Enable API key authentication on all requests."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={authEnabled}
                    onChange={async (checked) => {
                      setAuthEnabled(checked);
                      await handleSaveAuthentication(authSecretInput, authTtlInput, checked);
                    }}
                    disabled={saving || loading}
                    className={cx(
                      'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand focus-visible:ring-offset-2',
                      authEnabled
                        ? 'bg-tremor-brand dark:bg-dark-tremor-brand'
                        : 'bg-gray-200 dark:bg-gray-700',
                      saving || loading ? 'opacity-60 cursor-not-allowed' : ''
                    )}
                  >
                    <span className="sr-only">Toggle Authentication Guard</span>
                    <span
                      aria-hidden="true"
                      className={cx(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                        authEnabled ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </Switch>
                  <span className="text-sm font-medium text-tremor-content dark:text-dark-tremor-content">
                    {authEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {saving && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Saving…</span>
                  )}
                </div>
              </ListItem>
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong min-w-10">
                  inspectr-auth-key
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                    {authInfo.auth_key || '-'}
                  </span>
                  <CopyButton textToCopy={authInfo.auth_key || ''} showLabel={false} />
                </div>
              </ListItem>
              <ListItem className="py-3 flex justify-between items-start">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong w-40 flex-shrink-0">
                  inspectr-auth-token
                </span>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                      {authInfo.auth_token || '-'}
                    </span>
                    <CopyButton textToCopy={authInfo.auth_token || ''} showLabel={false} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleRenewToken}
                      className="px-2 py-0.5 rounded bg-tremor-brand text-white hover:bg-tremor-brand-emphasis text-xs"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </ListItem>
              <ListItem className="py-3 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  inspectr-auth-token Expiration
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content">
                  {authInfo.auth_token_expiration
                    ? new Date(authInfo.auth_token_expiration).toLocaleString()
                    : '-'}
                </span>
              </ListItem>
            </List>
          )}
          {authError && <p className="text-sm text-red-600">{authError}</p>}
        </div>
      </div>
      <DialogAuthConfig
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialSecret={authSecretInput}
        initialTtl={authTtlInput}
        onSubmit={async (secret, token_ttl) => {
          setAuthSecretInput(secret);
          setAuthTtlInput(token_ttl);
          await handleSaveAuthentication(secret, token_ttl, authEnabled);
        }}
      />
      <Divider className="my-10" />
    </>
  );
}