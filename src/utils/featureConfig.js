const DEFAULT_MODULE_VISIBILITY = Object.freeze({
  history: true,
  detail: true,
  trace: true,
  statistics: true,
  rules: true,
  settings: true
});

const DEFAULT_ACTION_FLAGS = Object.freeze({
  allowReplay: true,
  allowDelete: true,
  allowTagEdit: true,
  allowExport: true
});

export const getDefaultFeatureConfig = () => ({
  modules: { ...DEFAULT_MODULE_VISIBILITY },
  actions: { ...DEFAULT_ACTION_FLAGS }
});

export const mergeFeatureConfig = (inputConfig) => {
  const defaults = getDefaultFeatureConfig();
  if (!inputConfig || typeof inputConfig !== 'object') {
    return defaults;
  }

  return {
    modules: {
      ...defaults.modules,
      ...(inputConfig.modules && typeof inputConfig.modules === 'object' ? inputConfig.modules : {})
    },
    actions: {
      ...defaults.actions,
      ...(inputConfig.actions && typeof inputConfig.actions === 'object' ? inputConfig.actions : {})
    }
  };
};
