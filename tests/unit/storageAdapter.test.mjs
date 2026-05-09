import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultStorageAdapter,
  createNamespacedStorageAdapter,
  resolveNamespacedStorageKey
} from '../../src/utils/storageAdapter.js';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

const ensureCustomEvent = () => {
  if (typeof globalThis.CustomEvent === 'function') return;
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
};

const createMockWindow = () => {
  ensureCustomEvent();
  const target = new EventTarget();
  const localStorage = new MemoryStorage();
  target.localStorage = localStorage;
  target.location = { hostname: 'localhost' };
  target.history = { replaceState: () => {} };
  target.addEventListener = target.addEventListener.bind(target);
  target.removeEventListener = target.removeEventListener.bind(target);
  target.dispatchEvent = target.dispatchEvent.bind(target);
  return target;
};

const withMockWindow = async (fn) => {
  const previousWindow = globalThis.window;
  globalThis.window = createMockWindow();
  try {
    await fn(globalThis.window);
  } finally {
    globalThis.window = previousWindow;
  }
};

test('DefaultStorageAdapter supports get/set/remove', async () => {
  await withMockWindow(async () => {
    const adapter = createDefaultStorageAdapter();
    assert.equal(adapter.get('alpha'), null);
    adapter.set('alpha', '1');
    assert.equal(adapter.get('alpha'), '1');
    adapter.remove('alpha');
    assert.equal(adapter.get('alpha'), null);
  });
});

test('NamespacedStorageAdapter prefixes keys and isolates values', async () => {
  await withMockWindow(async () => {
    const base = createDefaultStorageAdapter();
    const a = createNamespacedStorageAdapter('workspaceA/bin1', base);
    const b = createNamespacedStorageAdapter('workspaceB/bin1', base);

    a.set('token', 'token-a');
    b.set('token', 'token-b');

    assert.equal(a.get('token'), 'token-a');
    assert.equal(b.get('token'), 'token-b');
    assert.equal(base.get('token'), null);
    assert.equal(base.get(resolveNamespacedStorageKey('workspaceA/bin1', 'token')), 'token-a');
    assert.equal(base.get(resolveNamespacedStorageKey('workspaceB/bin1', 'token')), 'token-b');
  });
});

test('DefaultStorageAdapter subscribe receives set and remove updates', async () => {
  await withMockWindow(async () => {
    const adapter = createDefaultStorageAdapter();
    const seen = [];
    const unsubscribe = adapter.subscribe('watch-key', (value) => seen.push(value));

    adapter.set('watch-key', 'on');
    adapter.remove('watch-key');
    unsubscribe();

    assert.deepEqual(seen, ['on', null]);
  });
});

test('resolveNamespacedStorageKey uses inspectr canonical key format', () => {
  assert.equal(resolveNamespacedStorageKey('workspace/bin', 'token'), 'inspectr:workspace/bin:token');
  assert.equal(resolveNamespacedStorageKey('  ', 'token'), 'token');
  assert.equal(resolveNamespacedStorageKey(' workspace id ', 'token'), 'inspectr:workspace-id:token');
});
