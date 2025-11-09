// src/components/settings/SettingsFeaturePreviews.jsx
import React from 'react';
import { Divider } from '@tremor/react';
import { Switch } from '@headlessui/react';
import useFeaturePreview from '../../hooks/useFeaturePreview.jsx';
import useLocalStorage from '../../hooks/useLocalStorage.jsx';
import { cx } from '../../utils/cx.js';

const PREVIEWS = [
  {
    slug: 'feat_export_openapi',
    title: 'Export as OpenAPI Document',
    description:
      'Export your API operations as an OpenAPI document. This document can be used as a starting point for building a custom OpenAPI document.',
    image: 'https://inspectr.dev/preview/export-openapi.png'
  },
  {
    slug: 'feat_export_postman',
    title: 'Export as Postman Collection',
    description:
      'Export your API operations as a Postman collection. The Postman collection contains all requests based on the Inspectr Operations history.',
    image: 'https://inspectr.dev/preview/export-postman.png'
  },
  // {
  //   slug: 'feat_export_mcp_server',
  //   title: 'MCP Server',
  //   description:
  //     "Enable Inspectr's MCP Server to expose operations and data via the Model Context Protocol for compatible AI Agents like Claude, ChatGPT, and more.",
  //   image: undefined
  // }
];

const FUTURE_FEATURES = [
  {
    slug: 'feat_connectors',
    title: 'Inspectr Connectors',
    description: 'Forward Inspectr events to other services by configuring outbound connectors.',
    image: undefined,
    defaultEnabled: false,
    removeWhenFalse: true
  },
  // {
  //   slug: 'feat_rules_ui',
  //   title: 'Rules',
  //   description: 'Toggle access to the Rules engine.',
  //   image: undefined,
  //   defaultEnabled: false,
  //   removeWhenFalse: true
  // },
  {
    slug: 'feat_insights_display',
    title: 'Insights Display',
    description: 'Show the insights explorer navigation with Endpoint, List, Table, and Timeline modes.',
    image: undefined,
    defaultEnabled: false,
    removeWhenFalse: true
  },
  {
    slug: 'feat_statistics_compare',
    title: 'Statistics Compare Mode',
    description: 'Enable the Compare tab and navigation within Inspectr statistics.',
    image: undefined,
    defaultEnabled: false,
    removeWhenFalse: true
  }
];

export default function SettingsFeaturePreviews() {
  const [futureFlag] = useLocalStorage('future', 'false');
  const isFutureEnabled = futureFlag === 'true';

  const previewDefinitions = React.useMemo(
    () => (isFutureEnabled ? [...PREVIEWS, ...FUTURE_FEATURES] : PREVIEWS),
    [isFutureEnabled]
  );

  const features = previewDefinitions.map((f) => {
    const [enabled, setEnabled] = useFeaturePreview(f.slug, f.defaultEnabled, f.removeWhenFalse);
    return { ...f, enabled, setEnabled };
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 items-start">
        <div className="self-start">
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Feature Previews
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Enable or disable experimental features.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2 space-y-6">
          {features.map((feature) => (
            <div key={feature.slug} className="flex items-start space-x-4">
              <div className="flex-1">
                <h3 className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {feature.title}
                </h3>
                <p className="mt-1 text-tremor-content dark:text-dark-tremor-content">
                  {feature.description}
                </p>
              </div>
              {feature.image && (
                <img
                  src={feature.image}
                  alt={feature.slug}
                  className="w-32 border border-tremor-border dark:border-dark-tremor-border rounded"
                />
              )}
              <div className="flex items-center pt-1 space-x-3">
                <Switch
                  checked={Boolean(feature.enabled)}
                  onChange={() => feature.setEnabled(!feature.enabled)}
                  className={cx(
                    'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                    feature.enabled
                      ? 'bg-tremor-brand dark:bg-dark-tremor-brand'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span className="sr-only">
                    {feature.enabled ? 'Disable feature preview' : 'Enable feature preview'}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      feature.enabled ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </Switch>
                <span className="text-sm font-medium text-tremor-content dark:text-dark-tremor-content">
                  {feature.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
