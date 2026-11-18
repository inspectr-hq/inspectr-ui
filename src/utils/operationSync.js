const SYNC_EVENT = 'dev.inspectr.platform.sse.v1.sync_';
export const SYNC_LAST_EVENT_ID = 'sync';
export const OPERATION_REPLAY_EVENT = 'inspectr:operations-replayed';

export function buildOperationStreamURL(endpoint, token, lastEventId) {
  const hashIndex = endpoint.indexOf('#');
  const hash = hashIndex < 0 ? '' : endpoint.slice(hashIndex);
  const url = hashIndex < 0 ? endpoint : endpoint.slice(0, hashIndex);
  const queryIndex = url.indexOf('?');
  const path = queryIndex < 0 ? url : url.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex < 0 ? '' : url.slice(queryIndex + 1));
  params.set('token', token);
  if (lastEventId) params.set('last_event_id', lastEventId);
  else params.delete('last_event_id');
  if (lastEventId) params.set('sync_format', 'compact');
  else params.delete('sync_format');
  return `${path}?${params}${hash}`;
}

// A requested replay shares the connection's queue with live writes.
export function createOperationSync(
  db,
  { resumeAfter = '', onCursor, onReplay, onError, enqueue } = {}
) {
  let pending = Promise.resolve();
  // Older proxies send full catch-up as ordinary messages with no sync markers.
  let active = !resumeAfter;
  let finishing = false;
  let aborted = false;
  let failed = false;
  let syncId = null;
  let received = 0;
  const replayed = new Set();
  const live = new Map();
  const stale = new Set();

  const schedule = enqueue || ((work) => pending.then(work));
  const queue = (work) => {
    pending = schedule(async () => {
      try {
        await work();
      } catch (err) {
        failed = true;
        onError?.(err);
      }
    });
  };

  if (!resumeAfter) {
    queue(async () => {
      for (const id of await db.getEventIds()) stale.add(id);
    });
  }

  const handle = ({ type, data }) => {
    if (aborted || finishing || !data?.sync_id) return;
    if (type === SYNC_EVENT + 'start') {
      if (!syncId) {
        syncId = data.sync_id;
        active = true;
      }
      return;
    }
    if (!active || (syncId && data.sync_id !== syncId)) return;

    if (type === SYNC_EVENT + 'batch' && syncId) {
      queue(async () => {
        if (aborted || failed) return;
        if (!Array.isArray(data.operations)) throw new Error('Invalid compact sync batch');
        const events = [];
        for (const operation of data.operations) {
          const id = operation?.operation_id;
          if (typeof id !== 'string' || !id) throw new Error('Missing compact sync operation ID');
          stale.delete(id);
          replayed.add(id);
          if (!live.has(id)) events.push({ id, operation_id: id, data: operation });
        }
        if (events.length) await db.bulkUpsertEvents(events);
        received += data.operations.length;
      });
      return;
    }

    if (type === SYNC_EVENT + 'complete') {
      finishing = true;
      queue(async () => {
        try {
          if (aborted || failed) return;
          const count = data.record_count;
          // Legacy replay mixes full history and live events in the default message stream.
          const validCount =
            Number.isSafeInteger(count) && count >= 0 &&
            (syncId ? received === count : replayed.size >= count);
          if (!validCount) throw new Error('Incomplete operation sync');

          let cursor = resumeAfter;
          for (const id of replayed) {
            if (live.get(id) !== false) cursor = id;
          }
          for (const [id, present] of live) {
            if (present) cursor = id;
          }
          if (stale.size) await db.deleteEvents([...stale]);
          if (!aborted) {
            onCursor?.(cursor);
            if (resumeAfter && onReplay) {
              const updatedIds = [...replayed].filter((id) => !live.has(id));
              if (updatedIds.length) onReplay(updatedIds);
            }
          }
        } finally {
          active = false;
        }
      });
    }
  };

  const commitLiveCursor = (id) => {
    // A later live write cannot prove that a failed replay was fully applied.
    if (!active && !failed && !aborted) onCursor?.(id);
  };

  const upsert = (event) => {
    const id = event.operation_id;
    if (!active || !id) return false;
    const compact = Boolean(syncId);
    const afterCompletion = finishing;
    stale.delete(id);
    queue(async () => {
      stale.delete(id);
      if (compact) {
        live.delete(id);
        live.set(id, true);
      } else {
        replayed.add(id);
      }
      await db.upsertEvent(event);
      if (afterCompletion) commitLiveCursor(id);
    });
    return true;
  };

  const remove = (id) => {
    if (!active) return false;
    stale.delete(id);
    queue(async () => {
      stale.delete(id);
      live.set(id, false);
      await db.deleteEventByOperationId(id);
    });
    return true;
  };

  return {
    handle,
    commitLiveCursor,
    upsert,
    remove,
    abort() {
      aborted = true;
      active = false;
    },
    settled: () => pending
  };
}
