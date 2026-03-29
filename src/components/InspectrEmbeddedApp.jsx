import React, { useEffect, useMemo, useState } from 'react';
import { useInspectr } from '../context/InspectrContext.jsx';
import { mergeFeatureConfig } from '../utils/featureConfig.js';
import { buildThemeStyle } from '../utils/themeConfig.js';
import InspectrApp from './InspectrApp.jsx';
import RequestDetailsPanel from './operations/RequestDetailsPanel.jsx';
import TracingApp from './tracing/TracingApp.jsx';
import DashBoardApp from './DashBoardApp.jsx';
import RulesApp from './RulesApp.jsx';
import SettingsApp from './SettingsApp.jsx';

const DEFAULT_MODULE_ORDER = Object.freeze([
  'history',
  'detail',
  'trace',
  'statistics',
  'rules',
  'settings'
]);

const MODULE_LABELS = Object.freeze({
  history: 'History',
  detail: 'Detail',
  trace: 'Trace',
  statistics: 'Statistics',
  rules: 'Rules',
  settings: 'Settings'
});

export function InspectrHistoryModule({ route }) {
  return <InspectrApp route={route || { slug: 'inspectr' }} />;
}

export function InspectrDetailModule({ operation, currentTab, setCurrentTab }) {
  const [tab, setTab] = useState(currentTab || 'request');
  const resolvedCurrentTab = currentTab || tab;
  const resolvedSetCurrentTab = setCurrentTab || setTab;
  return (
    <RequestDetailsPanel
      operation={operation || null}
      currentTab={resolvedCurrentTab}
      setCurrentTab={resolvedSetCurrentTab}
    />
  );
}

export function InspectrTraceModule({ route }) {
  return <TracingApp route={route || { slug: 'traces' }} />;
}

export function InspectrStatisticsModule({ route }) {
  return <DashBoardApp route={route || { slug: 'statistics' }} />;
}

export function InspectrRulesModule({ route }) {
  return <RulesApp route={route || { slug: 'rules' }} />;
}

export function InspectrSettingsModule({ route }) {
  return <SettingsApp route={route || { slug: 'settings' }} />;
}

const MODULE_COMPONENTS = Object.freeze({
  history: InspectrHistoryModule,
  detail: InspectrDetailModule,
  trace: InspectrTraceModule,
  statistics: InspectrStatisticsModule,
  rules: InspectrRulesModule,
  settings: InspectrSettingsModule
});

const normalizeModuleKey = (moduleKey, fallbackKey) => {
  if (moduleKey && MODULE_COMPONENTS[moduleKey]) return moduleKey;
  return fallbackKey;
};

const mergeEmbeddedFeatureConfig = (contextConfig, localConfig) => {
  const contextMerged = mergeFeatureConfig(contextConfig);
  if (!localConfig) return contextMerged;
  return {
    modules: {
      ...contextMerged.modules,
      ...(localConfig.modules && typeof localConfig.modules === 'object' ? localConfig.modules : {})
    },
    actions: {
      ...contextMerged.actions,
      ...(localConfig.actions && typeof localConfig.actions === 'object' ? localConfig.actions : {})
    }
  };
};

export default function InspectrEmbeddedApp({
  className = '',
  style,
  featureConfig,
  themeConfig,
  moduleOrder = DEFAULT_MODULE_ORDER,
  defaultModule = 'history',
  activeModule,
  onModuleChange,
  showModuleTabs = true,
  moduleProps = {}
}) {
  const context = useInspectr();
  const effectiveFeatureConfig = useMemo(
    () => mergeEmbeddedFeatureConfig(context?.featureConfig, featureConfig),
    [context?.featureConfig, featureConfig]
  );
  const effectiveThemeStyle = useMemo(
    () => buildThemeStyle(themeConfig || context?.themeConfig),
    [themeConfig, context?.themeConfig]
  );

  const visibleModules = useMemo(() => {
    return moduleOrder.filter((key) => {
      if (!MODULE_COMPONENTS[key]) return false;
      return effectiveFeatureConfig.modules[key] !== false;
    });
  }, [moduleOrder, effectiveFeatureConfig.modules]);

  const fallbackModule = normalizeModuleKey(defaultModule, 'history');
  const initialModule = visibleModules[0] || fallbackModule;
  const [internalModule, setInternalModule] = useState(initialModule);

  const selectedVisibleModule =
    visibleModules.includes(activeModule) && activeModule
      ? activeModule
      : visibleModules.includes(internalModule)
        ? internalModule
        : initialModule;
  const selectedModule = normalizeModuleKey(selectedVisibleModule, initialModule);
  const ActiveModuleComponent = MODULE_COMPONENTS[selectedModule] || MODULE_COMPONENTS[initialModule];

  useEffect(() => {
    if (activeModule != null) return;
    if (visibleModules.includes(internalModule)) return;
    setInternalModule(initialModule);
  }, [activeModule, visibleModules, internalModule, initialModule]);

  const handleModuleChange = (nextModule) => {
    if (!nextModule || nextModule === selectedModule) return;
    if (activeModule == null) {
      setInternalModule(nextModule);
    }
    onModuleChange?.(nextModule);
  };

  if (!ActiveModuleComponent) return null;

  return (
    <div className={className} style={{ ...effectiveThemeStyle, ...style }}>
      {showModuleTabs && visibleModules.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
          {visibleModules.map((moduleKey) => (
            <button
              key={moduleKey}
              type="button"
              onClick={() => handleModuleChange(moduleKey)}
              className={`rounded px-3 py-1.5 text-sm ${
                selectedModule === moduleKey
                  ? 'bg-blue-600 text-white dark:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
              }`}
            >
              {MODULE_LABELS[moduleKey] || moduleKey}
            </button>
          ))}
        </div>
      ) : null}
      <ActiveModuleComponent {...(moduleProps[selectedModule] || {})} />
    </div>
  );
}
