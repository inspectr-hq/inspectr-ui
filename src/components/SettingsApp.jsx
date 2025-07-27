// src/components/SettingsApp.jsx
import React, { useEffect, useState } from 'react';
import { Divider } from '@tremor/react';
import SettingsApiEndpoint from './SettingsApiEndpoint.jsx';
import SettingsInspectr from './SettingsInspectr.jsx';
import SettingsMock from './SettingsMock.jsx';
import SettingsGuard from './SettingsGuard.jsx';
import { parseHash } from '../hooks/useHashRouter.jsx';

const navItems = [
  { slug: 'general', label: 'General' },
  { slug: 'mock', label: 'Mock' },
  { slug: 'guard', label: 'Guard' }
];

const getCurrent = () => {
  const { slug, operationId } = parseHash();
  return slug === 'settings' && operationId ? operationId : 'general';
};

export default function SettingsApp() {
  const [current, setCurrent] = useState(getCurrent);

  useEffect(() => {
    const onHashChange = () => setCurrent(getCurrent());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (slug) => {
    window.history.pushState(null, '', `#settings/${slug}`);
    setCurrent(slug);
  };

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-gray-950">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-tremor-border dark:border-dark-tremor-border">
        <nav className="flex md:flex-col">
          {navItems.map((item) => (
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
      <div className="flex-1 p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7 max-w-5xl">
        {current === 'general' && (
          <>
            <SettingsApiEndpoint />
            <SettingsInspectr />
          </>
        )}
        {current === 'mock' && <SettingsMock />}
        {current === 'guard' && <SettingsGuard />}
      </div>
    </div>
  );
}
