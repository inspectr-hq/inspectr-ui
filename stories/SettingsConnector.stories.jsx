import React, { useMemo, useRef, useState } from 'react';
import InspectrContext from '../src/context/InspectrContext.jsx';
import SettingsConnector from '../src/components/settings/SettingsConnector.jsx';

const fixedDate = '2026-01-15T12:00:00.000Z';

const makeConnector = ({ id, name, status, enabled = true, lastError = '' }) => ({
  status,
  last_sync: status === 'ready' ? fixedDate : null,
  last_error: lastError || undefined,
  record: {
    id,
    name,
    server_url: `https://${id}.acme.test/events`,
    description: `${name} event destination`,
    enabled,
    source: 'custom',
    headers: { Authorization: 'Bearer story-token', 'X-Workspace': 'staging' },
    created_at: fixedDate,
    updated_at: fixedDate
  },
  info: {
    name: `${name} receiver`,
    version: '2.4.0',
    protocol_version: '2025-03-26',
    maintainer: 'Acme Platform Team',
    description: 'Receives filtered Inspectr events.',
    supported_events: ['operation.created', 'operation.completed'],
    supported_models: [{ kind: 'operation', version: '1.0' }]
  },
  actions: [
    {
      type: 'notify',
      label: 'Send event notification',
      description: 'Send a notification to the configured destination.',
      params: [{ name: 'operation_id', type: 'string', required: true }]
    }
  ]
});

const lifecycleConnectors = [
  makeConnector({ id: 'connector-ready', name: 'Checkout events', status: 'ready' }),
  makeConnector({ id: 'connector-pending', name: 'Inventory sync', status: 'pending' }),
  makeConnector({
    id: 'connector-disconnected',
    name: 'Payment alerts',
    status: 'disconnected',
    lastError: 'Connection timed out after 5 seconds.'
  }),
  makeConnector({
    id: 'connector-disabled',
    name: 'Legacy exports',
    status: 'disabled',
    enabled: false
  })
];

const ConnectorScenario = ({ mode = 'lifecycle', delay = 0 }) => {
  const initialConnectors = useMemo(
    () =>
      mode === 'lifecycle'
        ? lifecycleConnectors
        : mode === 'edit'
          ? [lifecycleConnectors[0]]
          : [],
    [mode]
  );
  const [connectors, setConnectors] = useState(initialConnectors);
  const connectorsRef = useRef(connectors);
  connectorsRef.current = connectors;

  const client = useMemo(() => {
    const wait = async () => {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      if (mode === 'error') throw new Error('Connector service unavailable');
    };
    const updateConnectors = (next) => {
      connectorsRef.current = next;
      setConnectors(next);
    };

    return {
      connectors: {
        list: async () => {
          await wait();
          return connectorsRef.current;
        },
        create: async (payload) => {
          const created = {
            ...makeConnector({
              id: 'connector-story-created',
              name: payload.name,
              status: 'pending',
              enabled: payload.enabled
            }),
            record: {
              ...payload,
              id: 'connector-story-created',
              source: 'custom',
              created_at: fixedDate,
              updated_at: fixedDate
            }
          };
          updateConnectors([...connectorsRef.current, created]);
          return created;
        },
        update: async (id, payload) => {
          const updated = connectorsRef.current.map((connector) =>
            connector.record.id === id
              ? {
                  ...connector,
                  record: { ...connector.record, ...payload, updated_at: fixedDate },
                  status: payload.enabled ? connector.status : 'disabled'
                }
              : connector
          );
          updateConnectors(updated);
          return updated.find((connector) => connector.record.id === id);
        },
        delete: async (id) => {
          updateConnectors(
            connectorsRef.current.filter((connector) => connector.record.id !== id)
          );
          return { status: 'ok' };
        }
      }
    };
  }, [delay, mode]);

  return (
    <InspectrContext.Provider value={{ client, setToast: () => {} }}>
      <div className="min-h-80 rounded-lg bg-gray-50 p-6 dark:bg-gray-950">
        <SettingsConnector />
      </div>
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Components/Settings/SettingsConnector',
  component: SettingsConnector,
  parameters: { layout: 'padded' }
};

export const LifecycleStates = () => <ConnectorScenario mode="lifecycle" />;
export const Empty = () => <ConnectorScenario mode="empty" />;
export const Loading = () => <ConnectorScenario mode="loading" delay={30000} />;
export const LoadError = () => <ConnectorScenario mode="error" />;
export const CreateFlow = () => <ConnectorScenario mode="empty" />;
export const EditFlow = () => <ConnectorScenario mode="edit" />;
