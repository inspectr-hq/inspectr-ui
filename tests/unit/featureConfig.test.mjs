import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultFeatureConfig, mergeFeatureConfig } from '../../src/utils/featureConfig.js';

test('getDefaultFeatureConfig enables all baseline modules and actions', () => {
  const defaults = getDefaultFeatureConfig();
  assert.deepEqual(defaults.modules, {
    history: true,
    detail: true,
    trace: true,
    statistics: true,
    rules: true,
    settings: true
  });
  assert.deepEqual(defaults.actions, {
    allowReplay: true,
    allowDelete: true,
    allowTagEdit: true,
    allowExport: true
  });
});

test('mergeFeatureConfig returns defaults for empty input', () => {
  assert.deepEqual(mergeFeatureConfig(null), getDefaultFeatureConfig());
  assert.deepEqual(mergeFeatureConfig(undefined), getDefaultFeatureConfig());
});

test('mergeFeatureConfig applies module overrides while preserving defaults', () => {
  const merged = mergeFeatureConfig({
    modules: {
      trace: false,
      rules: false
    }
  });

  assert.equal(merged.modules.history, true);
  assert.equal(merged.modules.trace, false);
  assert.equal(merged.modules.rules, false);
  assert.equal(merged.modules.settings, true);
});

test('mergeFeatureConfig applies action overrides while preserving defaults', () => {
  const merged = mergeFeatureConfig({
    actions: {
      allowReplay: false,
      allowDelete: false
    }
  });

  assert.equal(merged.actions.allowReplay, false);
  assert.equal(merged.actions.allowDelete, false);
  assert.equal(merged.actions.allowTagEdit, true);
  assert.equal(merged.actions.allowExport, true);
});
