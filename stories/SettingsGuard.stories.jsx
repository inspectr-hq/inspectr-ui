import React from 'react';
import InspectrContext from '../src/context/InspectrContext.jsx';
import SettingsGuard from '../src/components/settings/SettingsGuard.jsx';

const authenticationSettings = {
  enabled: true,
  secret: 'acme-story-secret',
  token_ttl: 24,
  auth_key: 'inspectr-key-acme-staging',
  auth_token: 'insptr_tok_acme_fixture',
  auth_token_expiration: '2027-01-15T12:00:00.000Z'
};

const SettingsGuardStory = ({ mode = 'enabled' }) => {
  const client = React.useMemo(() => {
    let settings = {
      ...authenticationSettings,
      enabled: mode !== 'disabled'
    };

    const wait = async () => {
      if (mode === 'loading') await new Promise((resolve) => setTimeout(resolve, 30000));
      if (mode === 'error') throw new Error('Authentication service unavailable');
    };

    return {
      auth: {
        getAuthenticationSettings: async () => {
          await wait();
          return { ...settings };
        },
        updateAuthenticationSettings: async (value) => {
          await wait();
          settings = { ...settings, ...value };
          return { ...settings };
        }
      }
    };
  }, [mode]);

  return (
    <InspectrContext.Provider value={{ apiEndpoint: 'http://localhost:4005/api', client }}>
      <div className="min-h-screen bg-white p-6 dark:bg-gray-950">
        <SettingsGuard />
      </div>
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Apps/Settings/AuthenticationGuard',
  component: SettingsGuard
};

export const Enabled = () => <SettingsGuardStory mode="enabled" />;
export const Disabled = () => <SettingsGuardStory mode="disabled" />;
export const Loading = () => <SettingsGuardStory mode="loading" />;
export const FetchError = () => <SettingsGuardStory mode="error" />;
