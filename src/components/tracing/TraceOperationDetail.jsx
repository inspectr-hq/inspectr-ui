// src/components/tracing/TraceOperationDetail.jsx

import React from 'react';
import { Badge, Text, Title } from '@tremor/react';
import StatusBadge from '../insights/StatusBadge.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { extractGenericTraceEntries, extractMetaEntries, toDisplayString } from './traceUtils.js';

export default function TraceOperationDetail({ operation, isLoading }) {
  if (!operation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
        {isLoading ? 'Loading trace details…' : 'Select a span to inspect its details.'}
      </div>
    );
  }

  const metaEntries = extractMetaEntries(operation);
  const genericTraceEntries = extractGenericTraceEntries(operation);
  const tags = Array.isArray(operation.tags) ? operation.tags : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {`${operation.method} ${operation.path}`}
          </Title>
          <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
            {operation.host || operation.request?.server || 'Unspecified host'}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={operation.status} />
          <Badge color="blue">{formatDuration(operation.duration)}</Badge>
        </div>
      </div>

      <div className="mt-6 space-y-5 overflow-y-auto">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Properties
          </Text>
          <dl className="mt-3 divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Request time</dt>
              <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                {formatTimestamp(operation.timestamp)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Operation ID</dt>
              <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                {operation.id}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Correlation ID</dt>
              <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                {operation.correlationId || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Trace ID</dt>
              <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                {operation.traceInfo?.trace_id || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Trace source</dt>
              <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                {operation.traceInfo?.source || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Client</dt>
              <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                {operation.request?.client_ip || '—'}
              </dd>
            </div>
          </dl>
        </div>

        {operation.traceInfo?.generic && genericTraceEntries.length ? (
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Trace metadata
            </Text>
            <div className="mt-2 space-y-3">
              {genericTraceEntries.map((entry) => (
                <div key={entry.key}>
                  <Text className="text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {entry.key}
                  </Text>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
                    {entry.value}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tags.length ? (
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Tags
            </Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.token}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content"
                >
                  {tag.display}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {metaEntries.length ? (
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Metadata
            </Text>
            <div className="mt-2 space-y-3">
              {metaEntries.map((entry) => (
                <div key={entry.key}>
                  <Text className="text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {entry.key}
                  </Text>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
                    {entry.value}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {operation.response?.body ? (
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Response body
            </Text>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
              {toDisplayString(operation.response.body)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
