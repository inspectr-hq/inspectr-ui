import React from 'react';
import InspectrEmbeddedApp from '../src/components/InspectrEmbeddedApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import {
  analyticsSummary,
  analyticsSeries,
  createDashboardClient,
  createTraceClient,
  httpOperations,
  rulesActions as ruleActions,
  ruleEvents,
  ruleOperators,
  ruleTags,
  ruleTemplateGroups,
  ruleTemplates,
  rules
} from './fixtures/inspectrFixtures.js';

const EmbeddedStory = ({ children }) => {
  const eventDB = React.useMemo(() => createEventDB({ dbName: 'InspectrEmbeddedStory' }), []);
  const client = React.useMemo(() => {
    const dashboard = createDashboardClient();
    const traces = createTraceClient();
    return {
      ...dashboard,
      ...traces,
      service: {
        getHealth: async () => ({ message: 'Healthy', version: '1.9.3', start_time: '2026-01-15T08:00:00Z', mode: 'standalone' }),
        getMetrics: async () => ({ operations: { storage_policy: { operations_retention_ttl: '168h0m0s', operations_max_stored: 25000 } } }),
        ping: async (component) => ({ component, status: 'healthy' })
      },
      operations: {
        ...dashboard.operations,
        listTags: async () => ({ tags: ruleTags }),
        deleteAll: async () => {},
        delete: async () => {},
        getOperation: async (id) => httpOperations.find((operation) => operation.id === id),
        summarize: async () => analyticsSummary,
        getSeries: async () => analyticsSeries,
        getAll: async () => httpOperations
      },
      rules: {
        list: async () => ({ rules }),
        getEvents: async () => ruleEvents,
        getActions: async () => ruleActions,
        getOperators: async () => ruleOperators,
        get: async (id) => rules.find((rule) => rule.id === id),
        create: async (rule) => rule,
        replace: async (_id, rule) => rule,
        update: async (_id, rule) => rule,
        delete: async () => ({ status: 'ok' }),
        applyToHistory: async () => ({ matched_operations: 42, updated_operations: 19, duration_ms: 2800 })
      },
      auth: { getAuthenticationSettings: async () => ({ enabled: true, secret: 'story-secret', token_ttl: 3600 }), updateAuthenticationSettings: async (value) => value },
      mock: { getConfig: async () => ({ status: true, openapi: 'https://api.acme.test/openapi.json', examples: 12 }), launch: async () => ({ status: 'ok' }) },
      expose: { getExposeSettings: async () => ({ enabled: false, channel: 'acme-staging', channel_code: 'ACME42' }), putExposeSettings: async (value) => value },
      mcp: { getMCPServerSettings: async () => ({ enabled: true, public: false, local_url: 'http://localhost:4005/mcp' }), updateMCPServerSettings: async (value) => value },
      connectors: { list: async () => [], create: async (value) => value, update: async (_id, value) => value, delete: async () => ({ status: 'ok' }) },
      configure: () => {}
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    const originalFetch = globalThis.fetch;
    const seed = async () => {
      await eventDB.clearEvents();
      if (active) {
        await eventDB.bulkUpsertEvents(httpOperations.map((operation) => ({ id: operation.id, operation_id: operation.id, data: operation })));
      }
    };
    const mockFetch = async (input) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const value = url.includes('/group-types') ? ruleTemplateGroups : ruleTemplates;
      return { ok: true, status: 200, json: async () => value };
    };
    globalThis.fetch = mockFetch;
    seed();
    return () => {
      active = false;
      globalThis.fetch = originalFetch;
      eventDB.db.close();
    };
  }, [eventDB]);

  return (
    <InspectrContext.Provider value={{ client, eventDB, apiEndpoint: 'http://localhost:4005/api', mode: 'embedded', namespace: 'storybook/embedded-app', syncOperations: () => {}, setLastEventId: () => {}, setToast: () => {} }}>
      {children}
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Apps/Inspectr/InspectrEmbeddedApp',
  component: InspectrEmbeddedApp
};

const Template = (args) => (
  <EmbeddedStory>
    <div className="p-4 bg-slate-100 min-h-[600px]">
      <InspectrEmbeddedApp {...args} />
    </div>
  </EmbeddedStory>
);

export const Default = Template.bind({});
Default.args = {};

export const HistoryOnly = Template.bind({});
HistoryOnly.args = {
  showModuleTabs: false,
  defaultModule: 'history',
  featureConfig: {
    modules: {
      history: true,
      detail: false,
      trace: false,
      statistics: false,
      rules: false,
      settings: false
    }
  }
};

export const ThemedAndGated = Template.bind({});
ThemedAndGated.args = {
  defaultModule: 'detail',
  featureConfig: {
    modules: {
      history: true,
      detail: true,
      trace: false,
      statistics: false,
      rules: false,
      settings: false
    },
    actions: {
      allowReplay: false,
      allowDelete: false,
      allowTagEdit: false,
      allowExport: false
    }
  },
  themeConfig: {
    tokens: {
      surfaceBackground: '#f7fafc',
      accentPrimary: '#0f766e',
      accentPrimaryContrast: '#ffffff'
    }
  }
};
