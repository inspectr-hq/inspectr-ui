import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventDB, getNamespacedEventDBName } from '../../src/utils/eventDB.js';

test('getNamespacedEventDBName returns legacy default when namespace is empty', () => {
  assert.equal(getNamespacedEventDBName(''), 'InspectrDB');
  assert.equal(getNamespacedEventDBName(null), 'InspectrDB');
});

test('getNamespacedEventDBName creates stable namespaced DB names', () => {
  const dbName = getNamespacedEventDBName('workspace-1/bin-42');
  assert.ok(dbName.startsWith('InspectrDB_'));
  assert.ok(dbName.includes('workspace-1_bin-42'));
});

test('createEventDB uses default and explicit names', () => {
  const defaultDb = createEventDB();
  const explicitDb = createEventDB({ dbName: 'InspectrDB_Custom' });

  assert.equal(defaultDb.db.name, 'InspectrDB');
  assert.equal(explicitDb.db.name, 'InspectrDB_Custom');

  defaultDb.db.close();
  explicitDb.db.close();
});

test('createEventDB derives dbName from namespace when provided', () => {
  const namespaced = createEventDB({ namespace: 'workspaceA/binA' });
  assert.equal(namespaced.db.name, getNamespacedEventDBName('workspaceA/binA'));
  namespaced.db.close();
});
