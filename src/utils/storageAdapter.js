const LOCAL_STORAGE_EVENT = 'local-storage';
const STORAGE_KEY_PREFIX = 'inspectr';

const hasWindow = () => typeof window !== 'undefined';

const readLocalStorage = (key) => {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(key);
};

const writeLocalStorage = (key, value) => {
  if (!hasWindow()) return;
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
  window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key, value } }));
};

export const createDefaultStorageAdapter = () => ({
  get(key) {
    return readLocalStorage(key);
  },

  set(key, value) {
    writeLocalStorage(key, value);
  },

  remove(key) {
    writeLocalStorage(key, null);
  },

  subscribe(key, cb) {
    if (!hasWindow()) return () => {};

    const handleNativeStorage = (event) => {
      if (event.key && event.key !== key) return;
      cb(readLocalStorage(key));
    };

    const handleLocalStorageEvent = (event) => {
      if (event?.detail?.key && event.detail.key !== key) return;
      cb(readLocalStorage(key));
    };

    window.addEventListener('storage', handleNativeStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalStorageEvent);

    return () => {
      window.removeEventListener('storage', handleNativeStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalStorageEvent);
    };
  }
});

const normalizeNamespaceSegment = (value) => {
  return String(value || '')
    .trim()
    .replace(/[^\w.-/]+/g, '-')
    .replace(/^\/+|\/+$/g, '');
};

export const resolveNamespacedStorageKey = (namespace, key) => {
  const namespaceSegment = normalizeNamespaceSegment(namespace);
  if (!namespaceSegment) return key;
  return `${STORAGE_KEY_PREFIX}:${namespaceSegment}:${key}`;
};

export const createNamespacedStorageAdapter = (
  namespace,
  baseAdapter = createDefaultStorageAdapter()
) => {
  return {
    get(key) {
      return baseAdapter.get(resolveNamespacedStorageKey(namespace, key));
    },

    set(key, value) {
      baseAdapter.set(resolveNamespacedStorageKey(namespace, key), value);
    },

    remove(key) {
      baseAdapter.remove(resolveNamespacedStorageKey(namespace, key));
    },

    subscribe(key, cb) {
      if (typeof baseAdapter.subscribe !== 'function') return () => {};
      return baseAdapter.subscribe(resolveNamespacedStorageKey(namespace, key), cb);
    }
  };
};
