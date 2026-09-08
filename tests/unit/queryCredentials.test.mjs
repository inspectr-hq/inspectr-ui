import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeCredentialParams,
  shouldSyncInitialOperations
} from '../../src/utils/queryCredentials.js';

test('initial sync is enabled by default', () => {
  assert.equal(shouldSyncInitialOperations(undefined), true);
  assert.equal(shouldSyncInitialOperations(null), true);
  assert.equal(shouldSyncInitialOperations('true'), true);
});

test('sync=false disables the initial sync case-insensitively', () => {
  assert.equal(shouldSyncInitialOperations('false'), false);
  assert.equal(shouldSyncInitialOperations('FALSE'), false);
});

test('sanitizeCredentialParams removes credentials and preserves navigation state', () => {
  assert.equal(
    sanitizeCredentialParams(
      'https://inspectr.test/dashboard?channelCode=secret-code&token=secret-token&sync=true&tab=history' +
        '#/requests?channel=secret-channel&sync=false&view=detail'
    ),
    '/dashboard?tab=history#/requests?view=detail'
  );
});

test('sanitizeCredentialParams removes credentials when they are only in the hash', () => {
  assert.equal(
    sanitizeCredentialParams(
      'https://inspectr.test/dashboard#/requests?channelCode=secret&sync=false&tab=history'
    ),
    '/dashboard#/requests?tab=history'
  );
});
