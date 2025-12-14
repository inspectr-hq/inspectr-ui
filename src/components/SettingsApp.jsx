// src/components/SettingsApp.jsx
import React, { useEffect, useState } from 'react';
import SettingsApiEndpoint from './settings/SettingsApiEndpoint.jsx';
import SettingsInspectr from './settings/SettingsInspectr.jsx';
import SettingsMock from './settings/SettingsMock.jsx';
import SettingsGuard from './settings/SettingsGuard.jsx';
import SettingsFeaturePreviews from './settings/SettingsFeaturePreviews.jsx';
import SettingsMcpInfo from './settings/SettingsMcpInfo.jsx';
import SettingsConnector from './settings/SettingsConnector.jsx';
import { parseHash } from '../hooks/useHashRouter.jsx';
import useFeaturePreview from '../hooks/useFeaturePreview.jsx';

const navItems = [
  { slug: 'general', label: 'General' },
  { slug: 'mock', label: 'Mock' },
  { slug: 'guard', label: 'Authentication Guard' },
  { slug: 'connectors', label: 'Connectors' },
  { slug: 'mcp-server', label: 'MCP Server' },
  { slug: 'previews', label: 'Feature Previews' }
];

const getCurrent = () => {
  const { slug, operationId } = parseHash();
  return slug === 'settings' && operationId ? operationId : 'general';
};

export default function SettingsApp() {
  const [current, setCurrent] = useState(getCurrent);
  const [connectorsFeatureEnabled] = useFeaturePreview('feat_connectors');

  useEffect(() => {
    const onHashChange = () => setCurrent(getCurrent());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (current === 'connectors' && !connectorsFeatureEnabled) {
      window.history.replaceState(null, '', '#settings/general');
      setCurrent('general');
    }
  }, [connectorsFeatureEnabled, current]);

  const navigate = (slug) => {
    window.history.pushState(null, '', `#settings/${slug}`);
    setCurrent(slug);
  };

  const items = connectorsFeatureEnabled
    ? navItems
    : navItems.filter((item) => item.slug !== 'connectors');

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] bg-white dark:bg-gray-950">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-tremor-border dark:border-dark-tremor-border md:min-h-full">
        <nav className="flex md:flex-col">
          {items.map((item) => (
            <button
              key={item.slug}
              onClick={() => navigate(item.slug)}
              className={`px-4 py-2 text-left text-tremor-default border-b md:border-b-0 md:border-l-4 md:py-3 ${current === item.slug ? 'md:border-tremor-brand md:text-tremor-brand text-tremor-brand font-medium bg-tremor-brand/5 dark:bg-dark-tremor-brand/10' : 'border-transparent text-tremor-content hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 h-full overflow-y-auto p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 max-w-5xl mx-auto">
        {current === 'general' && (
          <>
            <SettingsApiEndpoint />
            <SettingsInspectr />
          </>
        )}
        {current === 'connectors' && connectorsFeatureEnabled && <SettingsConnector />}
        {current === 'mock' && <SettingsMock />}
        {current === 'guard' && <SettingsGuard />}
        {current === 'mcp-server' && <SettingsMcpInfo />}
        {current === 'previews' && <SettingsFeaturePreviews />}
      </div>
    </div>
  );
}
