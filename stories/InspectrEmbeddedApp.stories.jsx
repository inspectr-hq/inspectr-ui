import React from 'react';
import InspectrEmbeddedApp from '../src/components/InspectrEmbeddedApp.jsx';
import { InspectrProvider } from '../src/context/InspectrContext.jsx';

export default {
  title: 'Apps/Inspectr/InspectrEmbeddedApp',
  component: InspectrEmbeddedApp
};

const Template = (args) => (
  <InspectrProvider
    mode="embedded"
    namespace="storybook/embedded-app"
    sessionBootstrap={{
      apiEndpoint: 'api',
      channelCode: 'demo',
      channel: 'storybook',
      token: 'demo-token',
      sseEndpoint: 'http://localhost:7777/sse'
    }}
  >
    <div className="p-4 bg-slate-100 min-h-[600px]">
      <InspectrEmbeddedApp {...args} />
    </div>
  </InspectrProvider>
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
