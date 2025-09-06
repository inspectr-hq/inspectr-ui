import React from 'react';
import UsageApp from '../src/components/UsageApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';

export default {
  title: 'Components/UsageApp',
  component: UsageApp
};

// Starting state: mostly zeros, Open Source plan, unlicensed
const mockMetricsStarting = {
  operations: {
    total_requests: 0,
    total_responses: 0,
    total_event_frames: 0,
    requests_local: 0,
    requests_ingress: 0,
    responses_local: 0,
    responses_ingress: 0,
    event_frames_local: 0,
    event_frames_ingress: 0
  },
  generic: {
    totals: {
      sse: {
        active: 0,
        reconnect_attempts: 0,
        total_connections: 0,
        total_disconnections: 0
      },
      mcp: {
        requests: 0,
        responses: 0,
        tools: 0,
        resources: 0,
        prompts: 0
      },
      features: {
        registrations: 0,
        token_refresh: 0,
        launches: 0,
        ingress_registrations: 0
      }
    }
  },
  features: {
    registration_requests: 0,
    token_refresh_requests: 0
  },
  mcp: {
    plan: 'open_source',
    licensed: false,
    limit: 1000
  },
  meta: {
    installed_at: '2025-09-01T18:02:51Z'
  }
};

// With usage (unlicensed): shows upgrade and usage bar
const mockMetricsUnlicensed = {
  operations: {
    total_requests: 4,
    total_responses: 4,
    total_event_frames: 0,
    requests_local: 2,
    requests_ingress: 2,
    responses_local: 2,
    responses_ingress: 2,
    event_frames_local: 0,
    event_frames_ingress: 0
  },
  generic: {
    totals: {
      sse: {
        active: 2,
        reconnect_attempts: 4,
        total_connections: 4,
        total_disconnections: 2
      },
      mcp: {
        requests: 5,
        responses: 5,
        tools: 2,
        resources: 1,
        prompts: 1
      },
      features: {
        registrations: 11,
        token_refresh: 1,
        launches: 2,
        ingress_registrations: 2
      }
    }
  },
  features: {
    registration_requests: 11,
    token_refresh_requests: 1
  },
  mcp: {
    plan: 'open_source',
    licensed: false,
    limit: 1000
  },
  meta: {
    installed_at: '2025-09-01T18:02:51Z'
  }
};

// With usage (licensed): no upgrade box, no limit bar
const mockMetricsLicensed = {
  operations: {
    total_requests: 120,
    total_responses: 118,
    total_event_frames: 560,
    requests_local: 70,
    requests_ingress: 50,
    responses_local: 69,
    responses_ingress: 49,
    event_frames_local: 400,
    event_frames_ingress: 160
  },
  generic: {
    totals: {
      sse: {
        active: 8,
        reconnect_attempts: 16,
        total_connections: 120,
        total_disconnections: 96
      },
      mcp: {
        requests: 420,
        responses: 415,
        tools: 60,
        resources: 50,
        prompts: 25
      },
      features: {
        registrations: 320,
        token_refresh: 80,
        launches: 140,
        ingress_registrations: 60
      }
    }
  },
  features: {
    registration_requests: 0,
    token_refresh_requests: 0
  },
  mcp: {
    plan: 'pro',
    licensed: true
  },
  meta: {
    installed_at: '2025-09-01T18:02:51Z'
  }
};

const makeMockClient = (metricsData, licenseData) => ({
  service: {
    getMetrics: async () => {
      // small delay to exercise loading state
      await new Promise((r) => setTimeout(r, 50));
      return metricsData;
    },
    putLicense: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { status: 'ok' };
    },
    ...(licenseData !== undefined && {
      getLicense: async () => {
        await new Promise((r) => setTimeout(r, 50));
        return licenseData;
      }
    })
  }
});

const MockProvider = ({ client, children }) => (
  <InspectrContext.Provider value={{ client }}>{children}</InspectrContext.Provider>
);

export const Starting = () => (
  <MockProvider client={makeMockClient(mockMetricsStarting)}>
    <UsageApp />
  </MockProvider>
);

export const UsageUnlicensed = () => (
  <MockProvider client={makeMockClient(mockMetricsUnlicensed)}>
    <UsageApp />
  </MockProvider>
);

export const UsageLicensed = () => (
  <MockProvider client={makeMockClient(mockMetricsLicensed)}>
    <UsageApp />
  </MockProvider>
);

// License API examples
const mockLicenseLimited = {
  features: {
    mcp: {
      enabled_default: true,
      default_limit: 2000,
      effective_enabled: true,
      effective_limit: 2000,
      window: 'monthly',
      remaining: 1980,
      unlimited: false,
      period_start: '2025-09-01T00:00:00Z'
    }
  },
  license: {
    plan: 'opensource',
    issuer: 'Inspectr',
    subject: 'acme-inc',
    expires_at: '2026-12-31T23:59:59Z',
    updated_at: '2025-09-04T22:19:41Z'
  },
  usage: {
    features: {
      mcp: { used: 20, remaining: 1980, window: 'monthly', period_start: '2025-09-01T00:00:00Z' }
    }
  }
};

const mockLicenseUnlimited = {
  features: {
    mcp: {
      enabled_default: true,
      default_limit: 0,
      effective_enabled: true,
      window: 'monthly',
      remaining: null,
      unlimited: true,
      period_start: '2025-09-01T00:00:00Z'
    }
  },
  license: {
    plan: 'pro',
    issuer: 'Inspectr',
    subject: 'acme-inc',
    expires_at: '2026-12-31T23:59:59Z',
    updated_at: '2025-09-04T22:19:41Z'
  },
  usage: {
    features: {
      mcp: { used: 500, remaining: null, window: 'monthly', period_start: '2025-09-01T00:00:00Z' }
    }
  }
};

// Align metrics' request count with license.used for clearer demo
const withMcpRequests = (base, used) => ({
  ...base,
  generic: {
    ...base.generic,
    totals: {
      ...base.generic.totals,
      mcp: { ...base.generic.totals.mcp, requests: used }
    }
  }
});

export const WithLicenseLimited = () => (
  <MockProvider client={makeMockClient(withMcpRequests(mockMetricsUnlicensed, 20), mockLicenseLimited)}>
    <UsageApp />
  </MockProvider>
);

export const WithLicenseUnlimited = () => (
  <MockProvider client={makeMockClient(withMcpRequests(mockMetricsLicensed, 500), mockLicenseUnlimited)}>
    <UsageApp />
  </MockProvider>
);
