import React, { useEffect, useMemo, useState } from 'react';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { WorkspaceContent } from '../src/components/Workspace.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import {
  createNamespacedStorageAdapter,
  resolveNamespacedStorageKey
} from '../src/utils/storageAdapter.js';
import { httpOperations } from './fixtures/inspectrFixtures.js';

const STORY_NAMESPACE = 'storybook/workspace';
const STORY_DB_NAME = 'InspectrWorkspaceStory';

const WorkspaceScenario = ({ mode }) => {
  const eventDB = useMemo(
    () => createEventDB({ dbName: STORY_DB_NAME, namespace: STORY_NAMESPACE }),
    []
  );
  const [toast, setToast] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const storageAdapter = useMemo(() => createNamespacedStorageAdapter(STORY_NAMESPACE), []);
  const client = useMemo(
    () => ({
      operations: {
        getOperation: async (id) => {
          const operation = httpOperations.find((item) => item.id === id);
          if (!operation) throw new Error(`Unknown fixture operation: ${id}`);
          return operation;
        },
        delete: async () => {},
        deleteAll: async () => {}
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
            storage_policy: {
              operations_retention_ttl: '168h0m0s',
              operations_max_stored: 25000,
              operations_stored: 4,
              storage_bytes: 2048
            }
          }
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
      mock: { launch: async () => {} }
    }),
    []
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

      if (mode === 'populated') {
        await eventDB.bulkUpsertEvents(
          httpOperations.map((operation) => ({
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
