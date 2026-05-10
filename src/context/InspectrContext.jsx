// src/context/InspectrContext.jsx
import React, { createContext, useState, useContext, useRef, useEffect, useMemo } from 'react';
import useStorageAdapter from '../hooks/useStorageAdapter.jsx';
import InspectrClient, { normalizeEndpoint as normalizeApiEndpoint } from '../utils/inspectrSdk';
import eventDB, { createEventDB, getNamespacedEventDBName } from '../utils/eventDB';
import {
  createDefaultStorageAdapter,
  createNamespacedStorageAdapter
} from '../utils/storageAdapter.js';

const EMPTY_APP_AUTH_CONTEXT = Object.freeze({
  appAuthEnabled: false,
  authenticated: false,
  tokenType: null,
  tokenExpiresAt: null
});

const stableStringify = (value) => {
  const normalize = (input) => {
    if (Array.isArray(input)) {
      return input.map(normalize);
    }
    if (input && typeof input === 'object') {
      return Object.keys(input)
        .sort()
        .reduce((acc, key) => {
          acc[key] = normalize(input[key]);
          return acc;
        }, {});
    }
    return input;
  };

  return JSON.stringify(normalize(value));
};

const applySessionBootstrap = (bootstrap, setters) => {
  if (!bootstrap || typeof bootstrap !== 'object') return;

  const applyStringValue = (setter, value) => {
    if (value === undefined || value === null) {
      setter(null);
      return;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      setter(null);
      return;
    }

    setter(normalized);
  };

  applyStringValue(setters.setApiEndpoint, bootstrap.apiEndpoint);
  applyStringValue(setters.setChannelCode, bootstrap.channelCode);
  applyStringValue(setters.setChannel, bootstrap.channel);
  applyStringValue(setters.setToken, bootstrap.token);
  applyStringValue(setters.setExpires, bootstrap.expires);
  applyStringValue(setters.setSseEndpoint, bootstrap.sseEndpoint);
  applyStringValue(setters.setIngressEndpoint, bootstrap.ingressEndpoint);
  applyStringValue(setters.setProxyEndpoint, bootstrap.proxyEndpoint);
  if (typeof bootstrap.expose === 'boolean') {
    setters.setExposeLocalStorage(bootstrap.expose ? 'true' : 'false');
  } else {
    setters.setExposeLocalStorage(null);
  }
};

// Create the context with default values
const InspectrContext = createContext({
  // Settings
  apiEndpoint: 'api',
  setApiEndpoint: () => {},

  // Connection status
  connectionStatus: 'reconnecting', // 'connected' | 'reconnecting' | 'disconnected'
  setConnectionStatus: () => {},

  // Registration details
  sseEndpoint: '',
  ingressEndpoint: '',
  channelCode: '',
  setChannelCode: () => {},
  channel: '',
  setChannel: () => {},
  token: '',
  mode: 'standalone',
  namespace: '',
  featureConfig: null,
  themeConfig: null,
  sessionBootstrap: null,
  storageAdapter: createDefaultStorageAdapter(),
  eventDB,

  // Refs
  reRegistrationFailedRef: { current: false },
  userInitiatedRegistrationRef: { current: false },

  // Registration functions
  handleRegister: () => {},
  attemptReRegistration: () => {},

  // Toast notifications
  toast: null,
  setToast: () => {},

  // Debug mode
  debugMode: false,

  // Hosted app auth bootstrap context
  appAuthContext: EMPTY_APP_AUTH_CONTEXT,

  // SDK client
  client: null
});

// Custom hook to use the context
export const useInspectr = () => useContext(InspectrContext);

// Provider component
export const InspectrProvider = ({
  children,
  mode = 'standalone',
  storageAdapter,
  namespace = '',
  dbName,
  sessionBootstrap = null,
  featureConfig = null,
  themeConfig = null
}) => {
  const resolvedStorageAdapter = useMemo(() => {
    if (storageAdapter) return storageAdapter;
    if (mode === 'embedded' && namespace) {
      return createNamespacedStorageAdapter(namespace, createDefaultStorageAdapter());
    }
    return createDefaultStorageAdapter();
  }, [storageAdapter, mode, namespace]);

  const resolvedEventDB = useMemo(() => {
    if (mode !== 'embedded') {
      return eventDB;
    }
    const resolvedDbName = dbName || getNamespacedEventDBName(namespace);
    return createEventDB({ dbName: resolvedDbName, namespace });
  }, [mode, dbName, namespace]);

  useEffect(() => {
    if (resolvedEventDB === eventDB) return;
    return () => {
      try {
        resolvedEventDB.db.close();
      } catch {}
    };
  }, [resolvedEventDB]);

  // Settings state
  const [rawApiEndpoint, setRawApiEndpoint] = useStorageAdapter(
    'apiEndpoint',
    'api',
    resolvedStorageAdapter
  );
  const apiEndpoint = normalizeApiEndpoint(rawApiEndpoint);
  const setApiEndpoint = (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      setRawApiEndpoint(null);
      return;
    }
    setRawApiEndpoint(normalizeApiEndpoint(value));
  };
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sseEndpoint, setSseEndpoint] = useStorageAdapter(
    'sseEndpoint',
    '',
    resolvedStorageAdapter
  );
  const [ingressEndpoint, setIngressEndpoint] = useStorageAdapter(
    'ingressEndpoint',
    '',
    resolvedStorageAdapter
  );
  const [channelCode, setChannelCode] = useStorageAdapter(
    'channelCode',
    '',
    resolvedStorageAdapter
  );
  const [channel, setChannel] = useStorageAdapter('channel', '', resolvedStorageAdapter);
  const [token, setToken] = useStorageAdapter('token', '', resolvedStorageAdapter);
  const [expires, setExpires] = useStorageAdapter('expires', '', resolvedStorageAdapter);
  const [, setExposeLocalStorage] = useStorageAdapter('expose', 'false', resolvedStorageAdapter);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState(null);
  const [appAuthContext, setAppAuthContext] = useState(EMPTY_APP_AUTH_CONTEXT);

  // SSE connection reference
  const registrationRetryCountRef = useRef(0);
  const reRegistrationFailedRef = useRef(false);
  const maxRegistrationRetries = 6;
  const retryDelay = 5000; // milliseconds

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const [debugModeValue] = useStorageAdapter('debug', 'false', resolvedStorageAdapter);
  const debugMode = debugModeValue === 'true';

  useEffect(() => {
    if (debugMode) {
      console.log('[Inspectr] Debug Mode enabled');
    }
  }, []);

  // Load credentials from URL query parameters
  const loadCredentialsFromQueryParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

    const getParam = (key) => urlParams.get(key) || hashParams.get(key);
    const queryChannelCode = urlParams.get('channelCode');
    const queryChannel = urlParams.get('channel');
    const queryToken = urlParams.get('token');
    const querySseEndpoint = urlParams.get('sseEndpoint');

    const resolvedChannelCode = queryChannelCode || getParam('channelCode');
    const resolvedChannel = queryChannel || getParam('channel');
    const resolvedToken = queryToken || getParam('token');
    const resolvedSseEndpoint = querySseEndpoint || getParam('sseEndpoint');

    if (resolvedChannelCode || resolvedChannel || resolvedToken || resolvedSseEndpoint) {
      console.log('🔍 Found credentials in query params');
      if (resolvedChannelCode) {
        setChannelCode(resolvedChannelCode);
      }
      if (resolvedChannel) {
        setChannel(resolvedChannel);
      }
      if (resolvedToken) {
        setToken(resolvedToken);
      }
      if (resolvedSseEndpoint) {
        setSseEndpoint(resolvedSseEndpoint);
      }
      // Update the URL without reloading the page.
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      );
      return true;
    }
    return false;
  };

  // Load credentials from local storage
  const loadCredentialsFromLocalStorage = () => {
    if (channelCode && channel && token) {
      console.log('✅ Using stored credentials from localStorage');
      return true;
    }
    return false;
  };

  // Proxy URL state (persisted)
  const [proxyEndpoint, setProxyEndpoint] = useStorageAdapter(
    'proxyEndpoint',
    '',
    resolvedStorageAdapter
  );

  // Create an InspectrClient instance
  const [inspectrClient] = useState(() => new InspectrClient({ apiEndpoint }));
  const sessionBootstrapFingerprint = useMemo(
    () => stableStringify(sessionBootstrap || null),
    [sessionBootstrap]
  );
  const lastAppliedSessionBootstrapRef = useRef(null);

  // Update the client when apiEndpoint changes
  useEffect(() => {
    inspectrClient.configure({ apiEndpoint });
  }, [apiEndpoint]);

  // Embedded mode uses runtime JWT for API calls as Bearer auth.
  // SSE still authenticates with `?token=...` because EventSource cannot set headers.
  useEffect(() => {
    if (mode !== 'embedded') return;
    inspectrClient.setAuthorizationToken(token || '');
  }, [mode, token, inspectrClient]);

  // Bootstrap hosted app auth context and keep bearer token in memory only.
  useEffect(() => {
    let cancelled = false;
    if (mode === 'embedded') {
      inspectrClient.setAuthorizationToken('');
      setAppAuthContext(EMPTY_APP_AUTH_CONTEXT);
      return;
    }

    const applyBootstrap = (payload) => {
      const appAuthEnabled = Boolean(payload?.app_auth_enabled);
      const authenticated = Boolean(payload?.authenticated);
      const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
      const shouldAttachToken = appAuthEnabled && authenticated && token;

      inspectrClient.setAuthorizationToken(shouldAttachToken ? token : '');
      setAppAuthContext({
        appAuthEnabled,
        authenticated,
        tokenType: payload?.token_type || null,
        tokenExpiresAt: payload?.token_expires_at || null
      });
    };

    const loadAuthBootstrap = async () => {
      try {
        const payload = await inspectrClient.registration.getAuthBootstrap();
        if (cancelled) return;
        applyBootstrap(payload);
      } catch (err) {
        if (cancelled) return;
        inspectrClient.setAuthorizationToken('');
        setAppAuthContext(EMPTY_APP_AUTH_CONTEXT);
        if (debugMode) {
          console.warn('[Inspectr] Hosted auth bootstrap unavailable, using local auth behavior.');
        }
      }
    };

    loadAuthBootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiEndpoint, inspectrClient, debugMode, mode]);

  // Load credentials from REST API
  const loadCredentialsFromApi = async () => {
    console.log('🔄 Fetching /app/config (Localhost, No credentials found)');
    try {
      const result = await inspectrClient.registration.getConfig();
      if (result?.token && result?.sse_endpoint && result?.channel_code) {
        console.log('✅ Loaded from /app/config:', result);
        setChannelCode(result.channel_code);
        setChannel(result.channel);
        setToken(result.token);
        setSseEndpoint(result.sse_endpoint);
        setIngressEndpoint(result.ingress_endpoint);
        setProxyEndpoint(result.proxy_endpoint);
        setExposeLocalStorage(result.expose ? 'true' : 'false');
      }
    } catch (err) {
      console.error('❌ Failed to load /app/config:', err);
    }
  };

  // Registration handler.
  const handleRegister = async (
    newChannelCode = channelCode,
    newChannel = channel,
    newToken = token,
    showNotification
  ) => {
    if (mode === 'embedded') {
      // Embedded mode receives runtime/session bootstrap from the host app and
      // must not call runtime /api/register from a different origin.
      if (newToken && sseEndpoint) {
        setConnectionStatus('connected');
        return true;
      }
      setConnectionStatus('disconnected');
      throw new Error('registration_disabled_in_embedded_mode');
    }

    try {
      // Construct request body
      let requestBody = {};
      if (newChannelCode && newChannel) {
        requestBody = { channel: newChannel, channel_code: newChannelCode };
      } else if (newToken) {
        requestBody = { token: newToken };
      }

      console.log('📤 Registering with:', requestBody);

      // Register App with Inspectr
      const result = await inspectrClient.registration.register(requestBody);

      if (result?.token && result?.sse_endpoint && result?.channel_code) {
        console.log('✅ Registration successful');
        registrationRetryCountRef.current = 0;
        reRegistrationFailedRef.current = false;

        setChannelCode(result.channel_code);
        setChannel(result.channel);
        setToken(result.token);
        setExpires(result.expires);
        setSseEndpoint(result.sse_endpoint);
        setIngressEndpoint(result.ingress_endpoint);
        setProxyEndpoint(result.proxy_endpoint);
        setExposeLocalStorage(result.expose ? 'true' : 'false');

        if (showNotification) {
          setToast({
            message: 'Registration Successful',
            subMessage: 'Your channel and access code have been registered.'
          });
        }
        // Update the connection status.
        setConnectionStatus('connected');
        return true;
      } else {
        console.error('❌ Registration failed:', result);
        setToast({
          message: 'Registration Failed',
          subMessage: 'Please check your channel and access code.',
          type: 'error'
        });
        setConnectionStatus('disconnected');
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setToast({
        message: 'Registration Error',
        subMessage: 'An error occurred during registration.',
        type: 'error'
      });
      setConnectionStatus('disconnected');
      throw error;
    }
  };

  const attemptReRegistration = () => {
    if (mode === 'embedded') {
      // In embedded mode we rely on SSE reconnect behavior only.
      return;
    }
    if (reRegistrationFailedRef.current) return;

    setConnectionStatus('reconnecting');
    if (registrationRetryCountRef.current < maxRegistrationRetries) {
      registrationRetryCountRef.current += 1;
      console.log(
        `🔄 Attempting re-registration (${registrationRetryCountRef.current}/${maxRegistrationRetries}) in ${
          retryDelay / 1000
        } seconds...`
      );
      setTimeout(async () => {
        try {
          await handleRegister();
        } catch (error) {
          console.log('❌ Re-registration attempt failed:', error);
          // Try again recursively.
          attemptReRegistration();
        }
      }, retryDelay);
    } else {
      console.log(`❌ Re-registration failed after ${maxRegistrationRetries} attempts. Giving up.`);
      registrationRetryCountRef.current = 0;
      reRegistrationFailedRef.current = true; // Prevent further attempts
      // Set final connection status to "disconnected"
      setConnectionStatus('disconnected');
    }
  };

  const resetReRegistration = () => {
    registrationRetryCountRef.current = 0;
    reRegistrationFailedRef.current = false;
  };

  /**
   * 🏁 Step 1: Load credentials from localStorage on mount
   */
  useEffect(() => {
    const loadCredentials = async () => {
      if (typeof window === 'undefined') return;

      if (mode === 'embedded') {
        if (lastAppliedSessionBootstrapRef.current !== sessionBootstrapFingerprint) {
          applySessionBootstrap(sessionBootstrap, {
            setApiEndpoint,
            setChannelCode,
            setChannel,
            setToken,
            setExpires,
            setSseEndpoint,
            setIngressEndpoint,
            setProxyEndpoint,
            setExposeLocalStorage
          });
          lastAppliedSessionBootstrapRef.current = sessionBootstrapFingerprint;
        }
        setIsInitialized(true);
        return;
      }
      lastAppliedSessionBootstrapRef.current = null;

      if (!loadCredentialsFromQueryParams()) {
        if (!loadCredentialsFromLocalStorage() && isLocalhost) {
          await loadCredentialsFromApi();
        }
      }

      setIsInitialized(true);
    };

    loadCredentials();
  }, [mode, sessionBootstrapFingerprint, isLocalhost]);

  /**
   * 🏁 Step 2: When `isInitialized` is true, register using stored credentials
   * We use a ref to track if registration was triggered by the user to avoid loops
   */
  const userInitiatedRegistrationRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (mode === 'embedded') return;

    // Skip auto-registration if it was triggered by the user via SettingsPanel
    if (userInitiatedRegistrationRef.current) {
      userInitiatedRegistrationRef.current = false;
      return;
    }

    // Skip if we already have valid credentials; prevents duplicate registration on state updates
    // if (token && sseEndpoint) {
    //   if (debugMode) {
    //     console.log(
    //       '🔄 Already registered with active token and SSE endpoint, skipping auto-registration'
    //     );
    //   }
    //   return;
    // }

    // If we have a token but no sseEndpoint, we need to re-register
    if (token && !sseEndpoint && !reRegistrationFailedRef.current) {
      console.log('🔄 Have token but missing sseEndpoint, re-registering');
      handleRegister('', '', token);
      return;
    }

    console.log('🔄 Auto-registering with stored credentials:', channel, channelCode);

    if (channel && channelCode) {
      handleRegister(channelCode, channel);
    } else {
      console.log('⚠️ Missing credentials for auto-registration, skipping.');
    }
  }, [isInitialized, channel, channelCode, token, sseEndpoint, mode]);

  // ——— SSE connection lifecycle (moved from InspectrConnectionContext) ———
  const [lastEventId, setLastEventId] = useStorageAdapter(
    'lastEventId',
    '',
    resolvedStorageAdapter
  );
  const eventSourceRef = useRef(null);
  const wasConnectedRef = useRef(false);

  const BURST_WINDOW_MS = 50;
  const BURST_THRESHOLD = 50;
  const AUTO_SYNC_THROTTLE_MS = 15000;
  const burstStartRef = useRef(0);
  const burstCountRef = useRef(0);
  const burstBufferRef = useRef([]);
  const syncRunIdRef = useRef(null);
  const lastAutoSyncAtRef = useRef(0);
  const suppressAutoSyncOnOpenRef = useRef(false);

  const closeEventSource = () => {
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {}
      eventSourceRef.current = null;
    }
  };

  const triggerThrottledSyncOnConnect = () => {
    const now = Date.now();
    if (now - lastAutoSyncAtRef.current < AUTO_SYNC_THROTTLE_MS) {
      return;
    }
    lastAutoSyncAtRef.current = now;
    syncOperations();
  };

  const connect = (overrideLastEventId) => {
    // Close any existing instance first
    closeEventSource();

    if (!sseEndpoint || !token) return;

    const storedLastEventId = overrideLastEventId ?? lastEventId;
    let sseUrl = `${sseEndpoint}?token=${encodeURIComponent(token)}`;
    if (storedLastEventId) {
      const join = sseUrl.includes('?') ? '&' : '?';
      sseUrl = `${sseUrl}${join}last_event_id=${encodeURIComponent(storedLastEventId)}`;
    }

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;
    let logEndpoint = sseEndpoint;
    try {
      const parsed = new URL(sseUrl);
      logEndpoint = `${parsed.origin}${parsed.pathname}`;
    } catch {}
    console.log(`🔄 SSE connecting with ${logEndpoint}`);

    // Use "connecting" for normal (re)connects. Reserve "reconnecting" for
    // actual SSE error recovery paths so embedded guards don't trigger refresh
    // loops on healthy reconnects (e.g. token/session rotation).
    setConnectionStatus('connecting');

    eventSource.onopen = () => {
      wasConnectedRef.current = true;
      setConnectionStatus('connected');
      if (debugMode) console.log('📡️ SSE connection opened.');
      if (suppressAutoSyncOnOpenRef.current) {
        suppressAutoSyncOnOpenRef.current = false;
        return;
      }
      triggerThrottledSyncOnConnect();
    };

    // SSE sync event handlers
    const handleSyncEvent = (e) => {
      try {
        if (!e.data || e.data.trim() === '') {
          if (debugMode) console.warn('Received empty sync event data, skipping');
          return;
        }
        const event = JSON.parse(e.data);
        if (debugMode) console.log('[Inspectr] Received sync event:', event);

        if (event?.type !== 'dev.inspectr.platform.sse.v1.sync_complete') {
          return;
        }

        // ========================================================================================
        // sync_complete event
        // ========================================================================================
        const activeSyncId = syncRunIdRef.current;
        syncRunIdRef.current = null;
        const flushAndPrune = async () => {
          const syncedCount = Number(event?.data?.record_count || 0);
          if (burstBufferRef.current.length) {
            const buffered = burstBufferRef.current;
            burstBufferRef.current = [];
            burstCountRef.current = 0;
            burstStartRef.current = performance.now();
            await resolvedEventDB.bulkUpsertEvents(buffered);
          }
          if (debugMode) {
            console.log(`[Inspectr] Sync complete: ${syncedCount} synced`);
          }
          if (activeSyncId) {
            const deletedCount = await resolvedEventDB.removeEventsNotSynced(activeSyncId);
            if (debugMode) {
              console.log(`[Inspectr] Sync cleanup: ${deletedCount} removed`);
            }
          }
        };

        flushAndPrune().catch((err) => console.error('Failed to finalize sync pruning', err));
      } catch (err) {
        console.error('Error parsing SSE sync event:', err);
      }
    };

    // SSE message/operation event handlers
    const handleMessageEvent = (e) => {
      try {
        const now = performance.now();
        if (now - burstStartRef.current > BURST_WINDOW_MS) {
          burstStartRef.current = now;
          burstCountRef.current = 0;
        }
        burstCountRef.current++;

        if (!e.data || e.data.trim() === '') {
          if (debugMode) console.warn('Received empty SSE data, skipping');
          return;
        }
        const event = JSON.parse(e.data);
        if (debugMode) console.log('[Inspectr] Received event:', event);

        // ========================================================================================
        // operation delete event
        // ========================================================================================
        if (event?.type === 'dev.inspectr.operation.http.v1.deleted') {
          const deletedOperationId = event?.operation_id || event?.data?.operation_id;
          if (!deletedOperationId) {
            if (debugMode) {
              console.warn(
                '[Inspectr] Received delete event without operation_id, skipping:',
                event
              );
            }
            return;
          }
          resolvedEventDB
            .deleteEventByOperationId(deletedOperationId)
            .catch((err) => console.error('Error deleting event from DB by operation_id:', err));
          return;
        }

        // ========================================================================================
        // operation event
        // ========================================================================================
        // Normalize IDs and maintain lastEventId when operation_id is present.
        // Some emitters place operation_id under data, so handle both shapes.
        const operationId = event.operation_id || event?.data?.operation_id;
        if (operationId) {
          event.operation_id = operationId;
          event.id = operationId;
          setLastEventId(operationId);
          if (typeof window !== 'undefined' && event?.data && typeof event.data === 'object') {
            window.dispatchEvent(
              new CustomEvent('inspectr:operation-stream-update', {
                detail: {
                  operationId: String(operationId),
                  payload: event.data,
                  eventType: event.type,
                  eventTime: event.time || null
                }
              })
            );
          }
        } else {
          event.id = event.id || `req-${Math.random().toString(36).slice(2, 11)}`;
        }

        if (syncRunIdRef.current) {
          event.__syncRunId = syncRunIdRef.current;
        }

        if (burstCountRef.current < BURST_THRESHOLD) {
          resolvedEventDB
            .upsertEvent(event)
            .catch((err) => console.error('Error saving event to DB:', err));
        } else {
          burstBufferRef.current.push(event);
          if (burstCountRef.current === BURST_THRESHOLD) {
            setTimeout(async () => {
              try {
                await resolvedEventDB.bulkUpsertEvents(burstBufferRef.current);
              } catch (err) {
                console.error('bulk save failed', err);
              } finally {
                burstBufferRef.current = [];
                burstCountRef.current = 0;
                burstStartRef.current = performance.now();
              }
            }, BURST_WINDOW_MS);
          }
        }
      } catch (err) {
        console.error('Error parsing SSE Inspectr data:', err);
      }
    };

    // SSE event listener registration
    eventSource.onmessage = handleMessageEvent;
    eventSource.addEventListener('sync', handleSyncEvent);

    // SSE error handler
    eventSource.onerror = (err) => {
      console.error('❌ SSE connection error:', err);
      setConnectionStatus('reconnecting');

      if (mode === 'embedded') {
        // Avoid cross-origin /api/register attempts in embedded mode.
        return;
      }

      if (reRegistrationFailedRef.current) {
        console.log('❌ Maximum re-registration attempts reached. Closing EventSource.');
        setConnectionStatus('disconnected');
        try {
          eventSource.close();
        } catch {}
        return;
      }

      // Attempt to re-register; the EventSource will auto-retry too
      console.log('🔄 Starting re-registration retry loop due to SSE error.');
      attemptReRegistration();
    };
  };

  const disconnect = () => {
    closeEventSource();
    setConnectionStatus('disconnected');
    console.log('📡️ SSE connection closed.');
  };

  const SYNC_LAST_EVENT_ID = 'sync';
  const syncOperations = () => {
    if (debugMode) {
      console.log('[Inspectr] Syncing all operations...');
    }

    syncRunIdRef.current = Date.now();
    lastAutoSyncAtRef.current = Date.now();
    suppressAutoSyncOnOpenRef.current = true;
    setLastEventId(SYNC_LAST_EVENT_ID);
    connect(SYNC_LAST_EVENT_ID);
  };

  // Auto-connect when credentials change; keep alive across tab switches
  useEffect(() => {
    if (!sseEndpoint || !token) return;
    // Reset re-registration counters and connect with current config
    resetReRegistration();
    connect();

    // Cleanup on full unmount of provider (e.g., navigating away from Workspace)
    return () => {
      disconnect();
    };
    // We intentionally omit lastEventId here to avoid reconnects when it changes during streaming
    // Sync action explicitly reconnects with override.
  }, [sseEndpoint, token, resolvedEventDB, mode]);

  // Close on full page unload
  useEffect(() => {
    const onUnload = () => {
      try {
        closeEventSource();
      } catch {}
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // Context value
  const contextValue = {
    mode,
    namespace,
    featureConfig,
    themeConfig,
    sessionBootstrap,
    storageAdapter: resolvedStorageAdapter,
    eventDB: resolvedEventDB,
    apiEndpoint,
    setApiEndpoint,
    connectionStatus,
    setConnectionStatus,
    sseEndpoint,
    ingressEndpoint,
    proxyEndpoint,
    setProxyEndpoint,
    channelCode,
    setChannelCode,
    channel,
    setChannel,
    token,
    reRegistrationFailedRef,
    userInitiatedRegistrationRef,
    handleRegister,
    attemptReRegistration,
    resetReRegistration,
    toast,
    setToast,
    debugMode,
    appAuthContext,
    client: inspectrClient,
    // Expose connection helpers/state
    lastEventId,
    setLastEventId,
    connect,
    disconnect,
    syncOperations,
    eventSource: eventSourceRef.current
  };

  return <InspectrContext.Provider value={contextValue}>{children}</InspectrContext.Provider>;
};

export default InspectrContext;
