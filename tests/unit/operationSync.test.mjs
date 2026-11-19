import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventDB } from '../../src/utils/eventDB.js';
import * as sync from '../../src/utils/operationSync.js';

const operation = (id, method = 'GET') => ({
  operation_id: id,
  request: {
    timestamp: '2026-11-18T00:00:00Z', method, url: 'https://test/path?q=x',
    path: '/path', server: 'test', query_params: [{ name: 'q', value: 'x' }], client_ip: '127.0.0.1'
  },
  response: { status: 200 },
  timing: { duration: 8 },
  meta: { tags: ['Team: Blue'], mcp: { category: 'tool', name: 'echo', method: 'tools/call' } }
});
const event = (data) => ({ id: data.operation_id, operation_id: data.operation_id, data });
const syncEvent = (type, data = {}) => ({
  type: 'dev.inspectr.platform.sse.v1.sync_' + type,
  data: { sync_id: 'run', ...data }
});

function setup(keys = [], options = {}) {
  const rows = new Map(keys.map((id) => [id, { id }]));
  const dexie = createEventDB();
  const errors = [];
  const cursors = [];
  const refreshed = [];
  const db = {
    getEventIds: async () => [...rows.keys()],
    deleteEvents: async (ids) => ids.forEach((id) => rows.delete(id)),
    deleteEventByOperationId: async (id) => rows.delete(id),
    bulkUpsertEvents: async (events) =>
      events.forEach((item) => rows.set(item.id, dexie.transformEvent(item))),
    upsertEvent: async (item) => rows.set(item.id, dexie.transformEvent(item))
  };
  return { rows, db, dexie, errors, cursors, refreshed, run: sync.createOperationSync(db, {
    ...options,
    onCursor: (id) => cursors.push(id),
    onReplay: (ids) => refreshed.push(ids),
    onError: (err) => errors.push(err)
  }) };
}

test('sync URLs preserve existing parameters and request compact whenever a replay cursor is present', () => {
  assert.equal(sync.buildOperationStreamURL('/api/sse/test?existing=1', 'token', 'sync'),
    '/api/sse/test?existing=1&token=token&last_event_id=sync&sync_format=compact');
  assert.equal(sync.buildOperationStreamURL('/api/sse/test', 'token', 'op_1'),
    '/api/sse/test?token=token&last_event_id=op_1&sync_format=compact');
  assert.equal(sync.buildOperationStreamURL('/api/sse/test', 'token', ''),
    '/api/sse/test?token=token');
});

test('compact replay keeps live updates and deletes, then prunes absent rows', async () => {
  const { run, rows, dexie, cursors, errors } = setup(['stale', 'op_deleted', 'op_updated']);
  const preserved = operation('op_history');
  run.handle(syncEvent('start'));
  run.upsert(event(operation('op_updated', 'POST')));
  run.remove('op_deleted');
  run.handle(syncEvent('batch', { operations: [preserved, operation('op_updated'), operation('op_deleted')] }));
  run.handle(syncEvent('complete', { sync_id: 'unrelated', record_count: 0 }));
  run.handle(syncEvent('complete', { record_count: 3 }));
  await run.settled();
  assert.deepEqual([...rows.keys()].sort(), ['op_history', 'op_updated']);
  assert.equal(rows.get('op_updated').method, 'POST');
  const full = {
    ...preserved, request: { ...preserved.request, body: 'full body', headers: [] },
    response: { ...preserved.response, body: 'full response', event_frames: [] }
  };
  assert.deepEqual(rows.get('op_history'), dexie.transformEvent(event(full)));
  assert.equal(rows.get('op_history').mcp_tool, 'echo');
  assert.deepEqual(cursors, ['op_updated']);
  assert.deepEqual(errors, []);
});

test('an older proxy can send full replay and legacy completion', async () => {
  const { run, rows, cursors } = setup(['stale']);
  run.upsert(event(operation('legacy')));
  run.handle(syncEvent('complete', { record_count: 1 }));
  await run.settled();
  assert.deepEqual([...rows.keys()], ['legacy']);
  assert.deepEqual(cursors, ['legacy']);
});

for (const scenario of ['interruption', 'count mismatch', 'write failure']) {
  test(`compact sync keeps existing rows and cursor on ${scenario}`, async () => {
    const { run, rows, db, cursors } = setup(['stale']);
    if (scenario === 'write failure') {
      db.bulkUpsertEvents = async () => { throw new Error('write failed'); };
    }
    run.handle(syncEvent('start'));
    run.handle(syncEvent('batch', { operations: [operation('replay')] }));
    if (scenario === 'interruption') {
      run.abort();
    } else {
      run.handle(syncEvent('complete', { record_count: scenario === 'count mismatch' ? 2 : 1 }));
    }
    await run.settled();
    assert.ok(rows.has('stale'));
    assert.deepEqual(cursors, []);
  });
}


test('compact catch-up keeps existing history, respects live updates and refreshes replayed details', async () => {
  const { run, rows, db, cursors, refreshed } = setup(['saved', 'updated', 'deleted'], {
    resumeAfter: 'saved'
  });
  db.getEventIds = async () => { throw new Error('catch-up should not scan local history'); };
  run.handle(syncEvent('start'));
  run.upsert(event(operation('updated', 'POST')));
  run.remove('deleted');
  run.handle(syncEvent('batch', {
    operations: [operation('missed'), operation('updated'), operation('deleted')]
  }));
  run.handle(syncEvent('complete', { record_count: 3 }));
  await run.settled();

  assert.deepEqual([...rows.keys()].sort(), ['missed', 'saved', 'updated']);
  assert.equal(rows.get('updated').method, 'POST');
  assert.deepEqual(cursors, ['updated']);
  assert.deepEqual(refreshed, [['missed']]);
});

test('a legacy proxy can send ordinary messages without a replay handshake', async () => {
  const { run, rows, db, cursors, refreshed } = setup(['saved'], { resumeAfter: 'saved' });
  const legacyEvent = event(operation('missed'));
  assert.equal(run.upsert(legacyEvent), false);
  assert.equal(run.remove('saved'), false);
  await db.upsertEvent(legacyEvent);
  run.commitLiveCursor(legacyEvent.operation_id);

  run.handle(syncEvent('complete', { record_count: 1 }));
  await run.settled();
  assert.deepEqual([...rows.keys()], ['saved', 'missed']);
  assert.deepEqual(cursors, ['missed']);
  assert.deepEqual(refreshed, []);
});

test('empty catch-up keeps the saved operation cursor', async () => {
  const { run, rows, cursors, refreshed } = setup(['saved'], { resumeAfter: 'saved' });
  run.handle(syncEvent('start'));
  run.handle(syncEvent('complete', { record_count: 0 }));
  await run.settled();
  assert.deepEqual([...rows.keys()], ['saved']);
  assert.deepEqual(cursors, ['saved']);
  assert.deepEqual(refreshed, []);
});

test('an interrupted catch-up keeps the previous cursor for the next attempt', async () => {
  const { run, rows, cursors, refreshed } = setup(['saved'], { resumeAfter: 'saved' });
  run.handle(syncEvent('start'));
  run.handle(syncEvent('batch', { operations: [operation('missed')] }));
  await run.settled();
  run.abort();
  run.handle(syncEvent('complete', { record_count: 1 }));
  await run.settled();
  assert.deepEqual([...rows.keys()], ['saved', 'missed']);
  assert.deepEqual(cursors, []);
  assert.deepEqual(refreshed, []);
});

test('a persisted live event cannot move the cursor past a failed catch-up', async () => {
  const { run, rows, db, errors, cursors } = setup(['saved'], { resumeAfter: 'saved' });
  const bulkUpsertEvents = db.bulkUpsertEvents;
  const missed = operation('missed');
  const live = event(operation('later'));
  db.bulkUpsertEvents = async () => { throw new Error('write failed'); };

  run.handle(syncEvent('start'));
  run.handle(syncEvent('batch', { operations: [missed] }));
  run.handle(syncEvent('complete', { record_count: 1 }));
  await run.settled();
  assert.equal(errors.length, 1);
  assert.equal(rows.has('missed'), false);

  assert.equal(run.upsert(live), false);
  await db.upsertEvent(live);
  run.commitLiveCursor(live.operation_id);
  assert.ok(rows.has('later'));
  assert.deepEqual(cursors, []);

  db.bulkUpsertEvents = bulkUpsertEvents;
  const retry = sync.createOperationSync(db, {
    resumeAfter: 'saved',
    onCursor: (id) => cursors.push(id)
  });
  retry.handle(syncEvent('start'));
  retry.handle(syncEvent('batch', { operations: [missed, live.data] }));
  retry.handle(syncEvent('complete', { record_count: 2 }));
  await retry.settled();
  assert.deepEqual([...rows.keys()].sort(), ['later', 'missed', 'saved']);
  assert.deepEqual(cursors, ['later']);

  const nextLive = event(operation('next'));
  await db.upsertEvent(nextLive);
  retry.commitLiveCursor(nextLive.operation_id);
  assert.deepEqual(cursors, ['later', 'next']);
});
