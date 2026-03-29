import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNamespace } from '../../src/utils/namespace.js';
import { toCssVarName, buildThemeStyle } from '../../src/utils/themeConfig.js';

test('sanitizeNamespace supports slash-preserving and db-safe strategies', () => {
  assert.equal(
    sanitizeNamespace(' workspace/id-1 ', { replacement: '-', allowSlash: true, removeEdgeSlashes: true }),
    'workspace/id-1'
  );
  assert.equal(
    sanitizeNamespace(' workspace/id-1 ', { replacement: '_', allowSlash: false }),
    'workspace_id-1'
  );
});

test('toCssVarName preserves acronym boundaries', () => {
  assert.equal(toCssVarName('primaryBGColor'), '--inspectr-primary-bg-color');
  assert.equal(toCssVarName('HTTPStatusColor'), '--inspectr-http-status-color');
});

test('buildThemeStyle maps tokens to inspectr css variables', () => {
  const style = buildThemeStyle({
    tokens: {
      primaryBGColor: '#111111',
      accentPrimary: '#222222'
    }
  });

  assert.deepEqual(style, {
    '--inspectr-primary-bg-color': '#111111',
    '--inspectr-accent-primary': '#222222'
  });
});
