import React from 'react';
import DialogLicenseInfo from '../src/components/DialogLicenseInfo.jsx';

export default {
  title: 'Components/DialogLicenseInfo',
  component: DialogLicenseInfo
};

const licensePayload = {
  features: {
    mcp: {
      enabled_default: true,
      default_limit: 300,
      licensed_enabled: true,
      licensed_limit: 22,
      effective_enabled: true,
      effective_limit: 22,
      window: 'monthly',
      remaining: 278,
      unlimited: false,
      period_start: '2025-09-01T00:00:00Z'
    }
  },
  license: {
    expires_at: '2026-12-31T23:59:59Z',
    updated_at: '2025-09-04T22:19:41Z',
    issuer: 'Inspectr',
    subject: 'acme-inc',
    plan: 'opensource'
  },
  usage: {
    features: {
      mcp: {
        used: 22,
        remaining: 278,
        window: 'monthly',
        period_start: '2025-09-01T00:00:00Z'
      }
    }
  }
};

const licensePayloadUnlimited = {
  ...licensePayload,
  features: {
    mcp: {
      ...licensePayload.features.mcp,
      unlimited: true,
      effective_limit: null,
      licensed_limit: null,
      remaining: null
    }
  },
  usage: {
    features: {
      mcp: {
        used: 500,
        remaining: null,
        window: 'monthly',
        period_start: '2025-09-01T00:00:00Z'
      }
    }
  }
};

const noop = () => {};
const mockRefresh = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return { status: 'ok' };
};

export const Overview = () => (
  <DialogLicenseInfo open={true} onClose={noop} license={licensePayload} onRefresh={mockRefresh} />
);

export const OverviewUnlimited = () => (
  <DialogLicenseInfo
    open={true}
    onClose={noop}
    license={licensePayloadUnlimited}
    onRefresh={mockRefresh}
  />
);
