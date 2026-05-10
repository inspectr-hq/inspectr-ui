import React from 'react';
import SettingsInspectr from '../src/components/settings/SettingsInspectr.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';

export default {
  title: 'Apps/Settings/SettingsInspectr',
  component: SettingsInspectr
};

const createMockClient = ({ health, metrics, failMetrics = false }) => {
  const getMetrics = failMetrics
    ? async () => {
        throw new Error('metrics unavailable');
      }
    : async () => metrics;
  return {
    service: {
      getHealth: async () => health,
      getMetrics,
      ping: async () => ({ status: 'up' })
    }
  };
};

const Template = ({ health, metrics, proxyEndpoint, ingressEndpoint, failMetrics = false }) => {
  const value = {
    apiEndpoint: 'api',
    proxyEndpoint,
    ingressEndpoint,
    client: createMockClient({ health, metrics, failMetrics })
  };

  return (
    <InspectrContext.Provider value={value}>
      <SettingsInspectr />
    </InspectrContext.Provider>
  );
};

export const WithStoragePolicy = Template.bind({});
WithStoragePolicy.args = {
  proxyEndpoint: 'http://localhost:4004',
  ingressEndpoint: 'https://ingress.inspectr.dev/hello',
  health: {
    message: 'OK',
    version: '1.2.3',
    start_time: '2026-05-10T08:00:00.000Z',
    mode: 'catch',
    backend: 'http://localhost:4010',
    expose: true,
    app: true
  },
  metrics: {
    operations: {
      storage_policy: {
        operations_retention_ttl: '24h',
        operations_max_stored: 10000,
        eviction_policy: 'fifo',
        policy_source: 'config',
        operations_stored: 5231,
        operations_total: 18124,
        evicted_total: 12893,
        evicted_cap_total: 12300,
        evicted_ttl_total: 593,
        storage_bytes: 21873654,
        last_evicted_at: '2026-05-10T09:41:22.184512Z'
      }
    }
  }
};

export const WithoutMetrics = Template.bind({});
WithoutMetrics.args = {
  proxyEndpoint: 'http://localhost:4004',
  ingressEndpoint: 'https://ingress.inspectr.dev/hello',
  failMetrics: true,
  health: {
    message: 'OK',
    version: '1.2.3',
    start_time: '2026-05-10T08:00:00.000Z',
    mode: 'catch',
    backend: 'http://localhost:4010',
    expose: true,
    app: true
  },
  metrics: null
};

export const WithTtlOnly = Template.bind({});
WithTtlOnly.args = {
  proxyEndpoint: 'http://localhost:4004',
  ingressEndpoint: 'https://ingress.inspectr.dev/hello',
  health: {
    message: 'OK',
    version: '1.2.3',
    start_time: '2026-05-10T08:00:00.000Z',
    mode: 'catch',
    backend: 'http://localhost:4010',
    expose: true,
    app: true
  },
  metrics: {
    operations: {
      storage_policy: {
        operations_retention_ttl: '24h',
        operations_stored: 5231,
        storage_bytes: 21873654
      }
    }
  }
};

export const WithMaxStoredUnlimited = Template.bind({});
WithMaxStoredUnlimited.args = {
  proxyEndpoint: 'http://localhost:4004',
  ingressEndpoint: 'https://ingress.inspectr.dev/hello',
  health: {
    message: 'OK',
    version: '1.2.3',
    start_time: '2026-05-10T08:00:00.000Z',
    mode: 'catch',
    backend: 'http://localhost:4010',
    expose: true,
    app: true
  },
  metrics: {
    operations: {
      storage_policy: {
        operations_retention_ttl: '24h',
        operations_max_stored: 0,
        operations_stored: 5231,
        storage_bytes: 21873654
      }
    }
  }
};
