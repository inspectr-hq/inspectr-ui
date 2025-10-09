// src/components/SettingsConnector.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider } from '@tremor/react';
import { Disclosure, Switch } from '@headlessui/react';
import { useInspectr } from '../context/InspectrContext';
import DialogConnectorForm from './DialogConnectorForm.jsx';
import BadgeIndicator from './BadgeIndicator.jsx';
import DialogDeleteConfirm from './DialogDeleteConfirm.jsx';
import { Tooltip } from './ToolTip.jsx';
import { cx } from '../utils/cx.js';

const CONNECTOR_STATUS_META = {
  pending: {
    label: 'Pending',
    description: 'Inspectr is still discovering the connector metadata.',
    dotClass: 'fill-amber-500 dark:fill-amber-400 animate-pulse',
    badgeProps: {
      variant: 'neutral',
      filled: true,
      backgroundClass:
        'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-200'
    }
  },
  ready: {
    label: 'Ready',
    description: 'The connector is healthy and routable.',
    dotClass: 'fill-emerald-500 dark:fill-emerald-400',
    badgeProps: { variant: 'success', filled: true }
  },
  disabled: {
    label: 'Disabled',
    description: 'The connector is disabled and will never receive traffic.',
    dotClass: 'fill-gray-300 dark:fill-gray-500',
    badgeProps: {
      variant: 'neutral',
      filled: true,
      backgroundClass:
        'border-gray-300 bg-gray-200 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  },
  disconnected: {
    label: 'Disconnected',
    description: 'The connector is temporarily unreachable and will be retried with backoff.',
    dotClass: 'fill-rose-500 dark:fill-rose-400',
    badgeProps: { variant: 'error', filled: true }
  },
  unknown: {
    label: 'Unknown',
    description: 'The connector status is unknown.',
    dotClass: 'fill-gray-300 dark:fill-gray-600 animate-pulse',
    badgeProps: {
      variant: 'neutral',
      filled: true,
      backgroundClass:
        'border-gray-300 bg-gray-200 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  }
};

const getConnectorStatus = (connector) => {
  const explicitStatus = connector?.status || connector?.record?.status;
  if (explicitStatus) return String(explicitStatus).toLowerCase();

  if (connector?.record?.enabled === false) return 'disabled';
  if (connector?.ready === true) return 'ready';
  if (connector?.ready === false) return 'disconnected';
  return 'pending';
};

const getStatusMeta = (status) => CONNECTOR_STATUS_META[status] || CONNECTOR_STATUS_META.unknown;

const normalizeConnectors = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.connectors)) return payload.connectors;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
};

const HeadersList = ({ headers }) => {
  const entries = useMemo(() => {
    if (!headers || typeof headers !== 'object') return [];
    return Object.entries(headers);
  }, [headers]);

  if (entries.length === 0)
    return <p className="text-sm text-tremor-content">No headers configured.</p>;

  return (
    <dl className="mt-1 space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {key}
          </dt>
          <dd className="break-all text-tremor-content dark:text-dark-tremor-content">
            {String(value ?? '')}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const ActionsList = ({ actions }) => {
  if (!Array.isArray(actions) || actions.length === 0) {
    return <p className="text-sm text-tremor-content">No actions exposed.</p>;
  }
  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action?.type || action?.label}
          className="rounded border border-tremor-border p-3"
        >
          <p className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {action?.label || action?.type || 'Action'}
          </p>
          <p className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
            {action?.description || 'No description provided.'}
          </p>
          {Array.isArray(action?.params) && action.params.length > 0 && (
            <div className="mt-2 text-xs text-tremor-content dark:text-dark-tremor-content">
              <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Parameters
              </p>
              <ul className="mt-1 space-y-1 list-disc pl-5">
                {action.params.map((param) => (
                  <li key={param?.name || param?.type}>
                    <span className="font-medium">{param?.name}</span>
                    {param?.required ? ' (required)' : ''} - {param?.description || param?.type}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ConnectorStatusIndicator = ({ status, lastSync, error }) => {
  const normalizedStatus = status ? String(status).toLowerCase() : 'unknown';
  const meta = getStatusMeta(normalizedStatus);

  const tooltipLines = [meta.description];
  if (lastSync) tooltipLines.push(`Last sync: ${formatDateTime(lastSync)}`);
  if (error) tooltipLines.push(`Last error: ${error}`);

  const tooltipContent = (
    <span className="block whitespace-pre-line">{tooltipLines.filter(Boolean).join('\n')}</span>
  );

  return (
    <Tooltip content={tooltipContent} sideOffset={4} side="left">
      <svg viewBox="0 0 6 6" aria-hidden="true" className={cx('h-3 w-3', meta.dotClass)}>
        <circle r="3" cx="3" cy="3" />
      </svg>
    </Tooltip>
  );
};

const ChevronIcon = ({ open }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className={cx(
      'h-4 w-4 text-tremor-content-subtle transition-transform duration-200 dark:text-dark-tremor-content-subtle',
      open ? '-rotate-180' : 'rotate-0'
    )}
  >
    <path
      fill="currentColor"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 0 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
    />
  </svg>
);

const ExpandableSection = ({ title, defaultOpen = false, children }) => (
  <Disclosure defaultOpen={defaultOpen}>
    {({ open }) => (
      <div className="rounded-lg border border-tremor-border bg-white dark:border-dark-tremor-border dark:bg-dark-tremor-background">
        <Disclosure.Button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold bg-gray-100 text-tremor-content-strong transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background-muted">
          <span>{title}</span>
          <ChevronIcon open={open} />
        </Disclosure.Button>
        <Disclosure.Panel className="mt-4 px-4 pb-4 text-sm text-tremor-content dark:text-dark-tremor-content">
          {children}
        </Disclosure.Panel>
      </div>
    )}
  </Disclosure>
);

const ConnectorMeta = ({ connector }) => {
  const record = connector?.record || {};
  const info = connector?.info || {};
  const actions = connector?.actions;
  const status = getConnectorStatus(connector);
  const statusMeta = getStatusMeta(status);

  return (
    <div className="mt-4 space-y-3">
      <ExpandableSection title="Connector Details" defaultOpen>
        <dl className="grid gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Status
            </dt>
            <dd className="space-y-1">
              <div className="flex items-center gap-2">
                <ConnectorStatusIndicator
                  status={status}
                  lastSync={connector?.last_sync}
                  error={connector?.last_error}
                />
                <BadgeIndicator {...(statusMeta.badgeProps || {})}>
                  {statusMeta.label}
                </BadgeIndicator>
              </div>
              <p className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                {statusMeta.description}
              </p>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Source
            </dt>
            <dd>{record.source || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Created
            </dt>
            <dd>{formatDateTime(record.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Updated
            </dt>
            <dd>{formatDateTime(record.updated_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Last sync
            </dt>
            <dd>{formatDateTime(connector?.last_sync)}</dd>
          </div>
          {connector?.last_error && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-tremor-content-strong text-red-600 dark:text-red-400">
                Last error
              </dt>
              <dd className="text-red-600 dark:text-red-400">{connector.last_error}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4">
          <p className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Headers
          </p>
          <HeadersList headers={record.headers} />
        </div>
      </ExpandableSection>
      <ExpandableSection title="Service Info">
        {info && Object.keys(info).length > 0 ? (
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Name
              </dt>
              <dd>{info.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Version
              </dt>
              <dd>{info.version || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Protocol version
              </dt>
              <dd>{info.protocol_version ?? '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Maintainer
              </dt>
              <dd>{info.maintainer || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Description
              </dt>
              <dd>{info.description || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Supported events
              </dt>
              <dd>
                {Array.isArray(info.supported_events) && info.supported_events.length > 0
                  ? info.supported_events.join(', ')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Supported models
              </dt>
              <dd>
                {Array.isArray(info.supported_models) && info.supported_models.length > 0
                  ? info.supported_models
                      .map(
                        (model) =>
                          `${model?.kind || '-'} ${model?.version ? `(${model.version})` : ''}`
                      )
                      .join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p>No metadata available.</p>
        )}
      </ExpandableSection>
      <ExpandableSection title="Actions">
        <ActionsList actions={actions} />
      </ExpandableSection>
    </div>
  );
};

export default function SettingsConnector() {
  const { client, setToast } = useInspectr();
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [activeRecord, setActiveRecord] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [connectorPendingDelete, setConnectorPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchConnectors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await client.connectors.list();
      const normalized = normalizeConnectors(payload);
      setConnectors(normalized);
      setExpandedId((prev) => {
        if (!prev) return prev;
        return normalized.some((entry) => entry?.record?.id === prev) ? prev : null;
      });
    } catch (err) {
      console.error('Connectors load error', err);
      setError(err?.message || 'Failed to load connectors');
      setConnectors([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const handleCreate = () => {
    setModalMode('create');
    setActiveRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (connector) => {
    setModalMode('edit');
    setActiveRecord(connector?.record || null);
    setModalOpen(true);
  };

  const handleRequestDelete = (connector) => {
    const record = connector?.record;
    if (!record?.id) return;
    setConnectorPendingDelete(record);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!connectorPendingDelete?.id) return;
    setIsDeleting(true);
    setDeleteError('');
    setUpdatingId(connectorPendingDelete.id);
    try {
      await client.connectors.delete(connectorPendingDelete.id);
      setToast?.({ message: 'Connector deleted', type: 'success' });
      if (expandedId === connectorPendingDelete.id) {
        setExpandedId(null);
      }
      setConnectorPendingDelete(null);
      fetchConnectors();
    } catch (err) {
      console.error('Connector delete error', err);
      setToast?.({ type: 'error', message: err?.message || 'Failed to delete connector' });
      setDeleteError(err?.message || 'Failed to delete connector');
    } finally {
      setIsDeleting(false);
      setUpdatingId(null);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setConnectorPendingDelete(null);
    setDeleteError('');
  };

  const handleSubmit = async (payload) => {
    if (modalMode === 'edit' && activeRecord?.id) {
      const result = await client.connectors.update(activeRecord.id, payload);
      setToast?.({ message: 'Connector updated', type: 'success' });
      fetchConnectors();
      return result;
    }
    const created = await client.connectors.create(payload);
    setToast?.({ message: 'Connector created', type: 'success' });
    fetchConnectors();
    return created;
  };

  const handleToggleEnabled = async (connector) => {
    const record = connector?.record;
    if (!record?.id) return;
    setUpdatingId(record.id);
    try {
      const body = {
        name: record.name,
        server_url: record.server_url,
        description: record.description,
        enabled: !record.enabled,
        headers: record.headers || {}
      };
      await client.connectors.update(record.id, body);
      setToast?.({
        message: `Connector ${record.enabled ? 'disabled' : 'enabled'}`,
        type: 'success'
      });
      fetchConnectors();
    } catch (err) {
      console.error('Connector toggle error', err);
      setToast?.({
        type: 'error',
        message: err?.message || 'Failed to update connector status'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const hasConnectors = connectors.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 items-start">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Connectors
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Manage outbound connectors to forward Inspectr events to other services.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-tremor-default bg-tremor-brand px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              Create connector
            </button>
            <button
              type="button"
              onClick={fetchConnectors}
              className="rounded-tremor-default border border-tremor-border px-4 py-2.5 text-tremor-default font-medium text-tremor-content hover:bg-tremor-background-muted dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="sm:max-w-4xl md:col-span-2">
          {loading && <p className="text-tremor-default">Loading connectors…</p>}
          {!loading && error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && !hasConnectors && (
            <div className="rounded-lg border border-dashed border-tremor-border p-6 text-center text-sm text-tremor-content dark:border-dark-tremor-border dark:text-dark-tremor-content">
              No connectors yet. Create one to start forwarding events.
            </div>
          )}
          {!loading && !error && hasConnectors && (
            <div className="space-y-4">
              {connectors.map((connector, index) => {
                const record = connector?.record || {};
                const id = record.id || record.name || `connector-${index}`;
                const isBusy = updatingId === record.id;
                const status = getConnectorStatus(connector);
                const statusMeta = getStatusMeta(status);
                return (
                  <div
                    key={id}
                    className="rounded-lg border border-tremor-border bg-white p-4 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-2">
                        <p className="text-base font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          {record.name || 'Unnamed connector'}
                        </p>
                        <p className="text-sm text-tremor-content dark:text-dark-tremor-content">
                          {record.description || 'No description provided.'}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                          {record.server_url || '—'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-tremor-content dark:text-dark-tremor-content">
                          <div className="flex items-center gap-2">
                            <span>Connection</span>
                            <ConnectorStatusIndicator
                              status={status}
                              lastSync={connector?.last_sync}
                              error={connector?.last_error}
                            />
                            <BadgeIndicator {...(statusMeta.badgeProps || {})}>
                              {statusMeta.label}
                            </BadgeIndicator>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Status</span>
                            <BadgeIndicator variant={record.enabled ? 'success' : 'neutral'} filled>
                              {record.enabled ? 'Enabled' : 'Disabled'}
                            </BadgeIndicator>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              checked={Boolean(record.enabled)}
                              onChange={() => handleToggleEnabled(connector)}
                              disabled={isBusy}
                              className={cx(
                                'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                                record.enabled
                                  ? 'bg-tremor-brand dark:bg-dark-tremor-brand'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              )}
                            >
                              <span className="sr-only">
                                {record.enabled ? 'Disable connector' : 'Enable connector'}
                              </span>
                              <span
                                aria-hidden="true"
                                className={cx(
                                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                                  record.enabled ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </Switch>
                            <span className="font-medium">
                              {record.enabled ? 'Disable' : 'Enable'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((prev) => (prev === record.id ? null : record.id))
                          }
                          className="rounded-md border border-tremor-border px-3 py-2 text-sm font-medium text-tremor-content hover:bg-tremor-background-muted dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isBusy}
                        >
                          {expandedId === record.id ? 'Hide details' : 'Show details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(connector)}
                          className="rounded-md border border-tremor-border px-3 py-2 text-sm font-medium text-tremor-content hover:bg-tremor-background-muted dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isBusy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(connector)}
                          className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isBusy}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {expandedId === record.id && <ConnectorMeta connector={connector} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DialogDeleteConfirm
        open={Boolean(connectorPendingDelete)}
        rule={connectorPendingDelete}
        title="Delete connector?"
        description={
          <>
            This will permanently remove{' '}
            <span className="font-medium">
              {connectorPendingDelete?.name || connectorPendingDelete?.id || 'this connector'}
            </span>{' '}
            and its configuration.
          </>
        }
        confirmLabel="Delete Connector"
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      <DialogConnectorForm
        open={modalOpen}
        mode={modalMode}
        initialData={activeRecord || undefined}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <Divider className="my-10" />
    </>
  );
}
