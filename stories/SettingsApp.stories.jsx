import React from 'react';
import SettingsApp from '../src/components/SettingsApp';
import InspectrContext from '../src/context/InspectrContext.jsx';

const createSettingsClient = ({ mode = 'populated', delay = 0 } = {}) => {
  const respond = async (value) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (mode === 'error') throw new Error('Inspectr service unavailable');
    return value;
  };
  return {
    configure: () => {},
    service: {
      getHealth: () =>
        respond(
          mode === 'empty'
            ? {}
            : {
                message: 'Healthy',
                version: '1.9.3',
                start_time: '2026-01-15T08:00:00Z',
                mode: 'standalone'
              }
        ),
      getMetrics: () =>
        respond(
          mode === 'empty'
            ? {}
            : {
                operations: {
                  storage_policy: {
                    operations_retention_ttl: '168h0m0s',
                    operations_max_stored: 25000
                  }
                }
              }
        ),
      ping: (component) => respond({ component, status: 'healthy' })
    },
    auth: {
      getAuthenticationSettings: () =>
        respond({
          enabled: mode !== 'empty',
          secret: mode === 'empty' ? '' : 'story-secret',
          token_ttl: mode === 'empty' ? 0 : 3600,
          auth_key: mode === 'empty' ? '' : 'inspectr-story-key',
          auth_token: mode === 'empty' ? '' : 'insptr_tok_story_fixture',
          auth_token_expiration: mode === 'empty' ? '' : '2027-01-15T12:00:00.000Z'
        }),
      updateAuthenticationSettings: (value) =>
        respond({
          auth_key: 'inspectr-story-key',
          auth_token: 'insptr_tok_story_fixture',
          auth_token_expiration: '2027-01-15T12:00:00.000Z',
          ...value
        })
    },
    mock: {
      getConfig: () =>
        respond({ status: true, openapi: 'https://api.acme.test/openapi.json', examples: 12 }),
      launch: () => respond({ status: 'ok' })
    },
    expose: {
      getExposeSettings: () =>
        respond({
          enabled: false,
          channel: 'acme-staging',
          channel_code: 'ACME42',
          local_url: 'http://localhost:4005',
          public_url: ''
        }),
      putExposeSettings: (value) => respond(value)
    },
    mcp: {
      getMCPServerSettings: () =>
        respond({
          enabled: true,
          public: false,
          local_url: 'http://localhost:4005/mcp',
          public_url: ''
        }),
      updateMCPServerSettings: (value) => respond({ enabled: true, ...value })
    },
    connectors: {
      list: () => respond([]),
      create: (value) => respond(value),
      update: (_id, value) => respond(value),
      delete: () => respond({ status: 'ok' })
    }
  };
};

const SettingsStory = ({ mode, delay }) => {
  const client = React.useMemo(() => createSettingsClient({ mode, delay }), [mode, delay]);
  return (
    <InspectrContext.Provider value={{ apiEndpoint: 'http://localhost:4005/api', client }}>
      <SettingsApp />
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Apps/Settings/SettingsApp',
  component: SettingsApp
};

export const Default = () => <SettingsStory mode="populated" />;
export const Empty = () => <SettingsStory mode="empty" />;
export const Loading = () => <SettingsStory mode="populated" delay={30000} />;
export const ServiceError = () => <SettingsStory mode="error" />;
