import React from 'react';
import { Divider } from '@tremor/react';
import useLocalStorage from '../hooks/useLocalStorage.jsx';
import BadgeIndicator from './BadgeIndicator.jsx';

const PREVIEWS = [
  {
    slug: 'feat_export_openapi',
    title: 'Export as OpenAPI Document',
    description:
      'Export your API operations as an OpenAPI document. This document can be used as a starting point for building a custom OpenAPI document.',
    image: 'https://inspectr.dev/preview/export-openapi.png'
  },
  {
    slug: 'feat_export_openapi',
    title: 'Export as Postman Collection',
    description:
      'Export your API operations as a Postman collection. The Postman collection contains all requests based on the Inspectr Operations history.',
    image: 'https://inspectr.dev/preview/export-postman.png'
  }
];

function useFeaturePreview(slug, defaultEnabled = false) {
  const [value, setValue] = useLocalStorage(
    `feature_preview_${slug}`,
    defaultEnabled ? 'true' : 'false'
  );
  const enabled = value === 'true';
  const setEnabled = (v) => setValue(v ? 'true' : 'false');
  return [enabled, setEnabled];
}

export default function SettingsFeaturePreviews() {
  const features = PREVIEWS.map((f) => {
    const [enabled, setEnabled] = useFeaturePreview(f.slug);
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
                <button
                  onClick={() => feature.setEnabled(!feature.enabled)}
                  className={`px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200`}
                >
                  {feature.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
