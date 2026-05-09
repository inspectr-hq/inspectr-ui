import test from 'node:test';
import assert from 'node:assert/strict';

import { formatDuration } from '../../src/utils/formatters.js';

test('formatDuration keeps integer millisecond values intact', () => {
  assert.equal(formatDuration(0), '0ms');
  assert.equal(formatDuration(10), '10ms');
  assert.equal(formatDuration(20), '20ms');
  assert.equal(formatDuration(250), '250ms');
});

test('formatDuration still trims fractional unit values', () => {
  assert.equal(formatDuration(1500), '1.5s');
  assert.equal(formatDuration(60000), '1m');
  assert.equal(formatDuration(3600000), '1h');
});
