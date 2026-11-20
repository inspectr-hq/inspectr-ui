import React, { useEffect, useMemo, useState } from 'react';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { WorkspaceContent } from '../src/components/Workspace.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import {
  createNamespacedStorageAdapter,
  resolveNamespacedStorageKey
} from '../src/utils/storageAdapter.js';
import {
  createDashboardClient,
  createInsightsClient,
  largeWorkspaceOperations,
  httpOperations,
  ruleEvents,
  rules,
  rulesActions,
  ruleOperators
} from './fixtures/inspectrFixtures.js';

const STORY_NAMESPACE = 'storybook/workspace';
const STORY_DB_NAME = 'InspectrWorkspaceStory';
const WORKSPACE_TRACE_ID = 'trace-checkout-batch-01';

const workspaceTraceOperation = {
  ...largeWorkspaceOperations[0],
  correlation_id: WORKSPACE_TRACE_ID,
  meta: {
    ...largeWorkspaceOperations[0].meta,
    trace: { trace_id: WORKSPACE_TRACE_ID, source: 'inspectr-directive' }
  }
};

const workspaceTraceSummary = {
  trace_id: WORKSPACE_TRACE_ID,
  operation_count: 1,
  first_seen: workspaceTraceOperation.request.timestamp,
  last_seen: workspaceTraceOperation.request.timestamp,
  sources: ['inspectr-directive']
};

const WorkspaceScenario = ({ mode }) => {
  const operations = mode === 'large' ? largeWorkspaceOperations : httpOperations;
  const eventDB = useMemo(
    () => createEventDB({ dbName: STORY_DB_NAME, namespace: STORY_NAMESPACE }),
    []
  );
  const [toast, setToast] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const storageAdapter = useMemo(() => createNamespacedStorageAdapter(STORY_NAMESPACE), []);
  const dashboardClient = useMemo(
    () => createDashboardClient({ mode: mode === 'empty' ? 'empty' : 'populated' }),
    [mode]
  );
  const insightsClient = useMemo(
    () => createInsightsClient({ mode: mode === 'empty' ? 'empty' : 'populated' }),
    [mode]
  );
  const client = useMemo(
    () => ({
      operations: {
        ...dashboardClient.operations,
        ...insightsClient.operations,
        getOperation: async (id) => {
          const operation = operations.find((item) => item.id === id);
          if (!operation) throw new Error(`Unknown fixture operation: ${id}`);
          return operation;
        },
        delete: async () => {},
        deleteAll: async () => {},
        bulkDeleteTag: async ({ tag }) => ({ removed_tag: tag })
      },
      traces: {
        list: async () => ({
          traces: [workspaceTraceSummary],
          meta: { total: 1, page: 1, limit: 50 }
        }),
        get: async (traceId) => ({
          trace: traceId === WORKSPACE_TRACE_ID ? workspaceTraceSummary : null,
          operations: traceId === WORKSPACE_TRACE_ID ? [workspaceTraceOperation] : [],
          meta: { total: traceId === WORKSPACE_TRACE_ID ? 1 : 0, page: 1, limit: 200 }
        })
      },
      stats: dashboardClient.stats,
      rules: {
        list: async () => ({
          rules: mode === 'empty' ? [] : rules,
          meta: { page: 1, total: mode === 'empty' ? 0 : rules.length, limit: 20 }
        }),
        getEvents: async () => ({ events: ruleEvents }),
        getActions: async () => ({ actions: rulesActions }),
        getOperators: async () => ruleOperators
      },
      configure: () => {},
      service: {
        getHealth: async () => ({
          message: 'Healthy',
          version: '1.9.3',
          start_time: '2026-01-15T08:00:00.000Z',
          mode: 'standalone'
        }),
        getMetrics: async () => ({
          operations: {
            total_requests: mode === 'empty' ? 0 : 1842,
            total_responses: mode === 'empty' ? 0 : 1805,
            total_event_frames: mode === 'empty' ? 0 : 560,
            requests_local: mode === 'empty' ? 0 : 1240,
            requests_ingress: mode === 'empty' ? 0 : 602,
            responses_local: mode === 'empty' ? 0 : 1208,
            responses_ingress: mode === 'empty' ? 0 : 597,
            event_frames_local: mode === 'empty' ? 0 : 410,
            event_frames_ingress: mode === 'empty' ? 0 : 150,
            storage_policy: {
              operations_retention_ttl: '168h0m0s',
              operations_max_stored: 25000,
              operations_stored: mode === 'empty' ? 0 : operations.length,
              storage_bytes: mode === 'empty' ? 0 : 2048
            }
          },
          generic: {
            totals: {
              sse: {
                active: mode === 'empty' ? 0 : 3,
                reconnect_attempts: mode === 'empty' ? 0 : 4,
                total_connections: mode === 'empty' ? 0 : 24,
                total_disconnections: mode === 'empty' ? 0 : 8
              },
              mcp: {
                requests: mode === 'empty' ? 0 : 248,
                responses: mode === 'empty' ? 0 : 242,
                tools: mode === 'empty' ? 0 : 186,
                resources: mode === 'empty' ? 0 : 42,
                prompts: mode === 'empty' ? 0 : 20
              },
              rules: {
                definitions: mode === 'empty' ? 0 : rules.length,
                actions_executed: mode === 'empty' ? 0 : 319
              },
              features: {
                registrations: mode === 'empty' ? 0 : 54,
                token_refresh: mode === 'empty' ? 0 : 18,
                launches: mode === 'empty' ? 0 : 32,
                ingress_registrations: mode === 'empty' ? 0 : 9
              }
            }
          },
          features: {
            registration_requests: mode === 'empty' ? 0 : 54,
            token_refresh_requests: mode === 'empty' ? 0 : 18
          },
          mcp: {
            plan: 'open_source',
            licensed: false,
            limit: 1000,
            requests: mode === 'empty' ? 0 : 248
          },
          rules: {
            definitions_total: mode === 'empty' ? 0 : rules.length,
            actions_executed: mode === 'empty' ? 0 : 319
          },
          meta: { installed_at: '2025-09-01T18:02:51Z' }
        }),
        getVersion: async () => ({
          current_version: '1.9.3',
          latest_version: '1.9.3',
          update_available: false
        })
      },
      auth: {
        getAuthenticationSettings: async () => ({
          enabled: true,
          secret: 'story-secret',
          token_ttl: 3600,
          auth_key: 'inspectr-story-key',
          auth_token: 'insptr_tok_story_fixture',
          auth_token_expiration: '2027-01-15T12:00:00.000Z'
        }),
        updateAuthenticationSettings: async (value) => ({
          enabled: true,
          secret: 'story-secret',
          token_ttl: 3600,
          auth_key: 'inspectr-story-key',
          auth_token: 'insptr_tok_story_fixture',
          auth_token_expiration: '2027-01-15T12:00:00.000Z',
          ...value
        })
      },
      mock: {
        getConfig: async () => ({
          status: true,
          openapi: 'https://api.acme.test/openapi.json',
          examples: 12
        }),
        launch: async () => ({ status: 'ok' })
      },
      mcp: {
        getMCPServerSettings: async () => ({
          enabled: true,
          public: false,
          local_url: 'http://localhost:4005/mcp',
          public_url: ''
        }),
        updateMCPServerSettings: async (value) => ({
          enabled: true,
          local_url: 'http://localhost:4005/mcp',
          public_url: '',
          ...value
        })
      }
    }),
    [dashboardClient, insightsClient, mode]
  );

  useEffect(() => {
    let active = true;
    const storage = window.localStorage;
    const insightsKey = resolveNamespacedStorageKey(
      STORY_NAMESPACE,
      'feature_preview_feat_insights_display'
    );
    const recordingKey = resolveNamespacedStorageKey(STORY_NAMESPACE, 'recordStart');

    const seed = async () => {
      storage.setItem(insightsKey, 'true');
      storage.removeItem(recordingKey);
      await eventDB.clearEvents();

      if (mode !== 'empty') {
        await eventDB.bulkUpsertEvents(
          operations.map((operation) => ({
            id: operation.id,
            operation_id: operation.id,
            data: operation
          }))
        );
      }

      if (active) setIsReady(true);
    };

    seed();

    return () => {
      active = false;
      storage.removeItem(insightsKey);
      storage.removeItem(recordingKey);
    };
  }, [eventDB, mode]);

  if (!isReady) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />;
  }

  return (
    <InspectrContext.Provider
      value={{
        mode: 'standalone',
        namespace: STORY_NAMESPACE,
        featureConfig: null,
        themeConfig: null,
        storageAdapter,
        eventDB,
        apiEndpoint: 'http://localhost:4005/api',
        setApiEndpoint: () => {},
        connectionStatus: 'disconnected',
        setConnectionStatus: () => {},
        sseEndpoint: '',
        ingressEndpoint: '',
        proxyEndpoint: '',
        channelCode: '',
        setChannelCode: () => {},
        channel: '',
        setChannel: () => {},
        token: '',
        reRegistrationFailedRef: { current: false },
        userInitiatedRegistrationRef: { current: false },
        handleRegister: async () => {},
        attemptReRegistration: async () => {},
        resetReRegistration: () => {},
        toast,
        setToast,
        debugMode: false,
        appAuthContext: { appAuthEnabled: false, authenticated: false },
        lastEventId: null,
        setLastEventId: () => {},
        connect: () => {},
        disconnect: () => {},
        syncOperations: () => {},
        client
      }}
    >
      <WorkspaceContent />
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Apps/Workspace/Workspace',
  component: WorkspaceContent
};

export const Default = () => <WorkspaceScenario mode="populated" />;
export const Empty = () => <WorkspaceScenario mode="empty" />;
export const LargeOperationsWithTrace = () => <WorkspaceScenario mode="large" />;
