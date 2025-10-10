// src/components/settings/SettingsGuard.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import { useInspectr } from '../../context/InspectrContext';
import DialogAuthConfig from './DialogAuthConfig.jsx';
import CopyButton from '../CopyButton.jsx';

export default function SettingsGuard() {
  const { apiEndpoint, client } = useInspectr();
  const [authInfo, setAuthInfo] = useState(null);
  const [authSecretInput, setAuthSecretInput] = useState('');
  const [authTtlInput, setAuthTtlInput] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

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
          <div className="flex items-center space-x-3">
            <input
              id="auth-enabled"
              type="checkbox"
              checked={authEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setAuthEnabled(checked);
                handleSaveAuthentication(authSecretInput, authTtlInput, checked);
              }}
              className="h-5 w-5 rounded border-gray-300 text-tremor-brand focus:ring-tremor-brand"
            />
            <label
              htmlFor="auth-enabled"
              className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
            >
              Authentication Guard Enabled
            </label>
          </div>
          {authInfo && (
            <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
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
