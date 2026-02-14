// src/components/mcp/PropertiesAccordion.jsx

import React from 'react';
import { Badge } from '@tremor/react';
import { formatTimestamp } from '../../utils/formatters.js';

const PropertiesAccordion = ({ operation, mcpMeta }) => {
  return (
    <dl className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Request time</dt>
        <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
          {formatTimestamp(operation.timestamp)}
        </dd>
      </div>
      {mcpMeta?.session_id ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
            MCP Session ID
          </dt>
          <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
            {mcpMeta?.session_id}
          </dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Operation ID</dt>
        <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
          {operation.id}
        </dd>
      </div>
      {operation?.correlationId ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
            Correlation ID
          </dt>
          <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
            {operation.correlationId || '—'}
          </dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Trace ID</dt>
        <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
          {operation.traceInfo?.trace_id || '—'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Trace source</dt>
        <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
          {operation.traceInfo?.source || '—'}
        </dd>
      </div>
      {mcpMeta?.tokens ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Tokens</dt>
          <dd className="flex items-center gap-2 text-right text-tremor-content dark:text-dark-tremor-content">
            <Badge color="indigo" size="xs">
              Request {mcpMeta.tokens.request ?? '—'}
            </Badge>
            <Badge color="indigo" size="xs">
              Response {mcpMeta.tokens.response ?? '—'}
            </Badge>
            <Badge color="indigo" size="xs">
              Total {mcpMeta.tokens.total ?? '—'}
            </Badge>
          </dd>
        </div>
      ) : null}
    </dl>
  );
};

export default PropertiesAccordion;
