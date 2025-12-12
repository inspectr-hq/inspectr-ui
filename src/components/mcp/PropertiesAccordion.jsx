// src/components/mcp/PropertiesAccordion.jsx

import React, { useEffect, useState } from 'react';
import { Badge, Text } from '@tremor/react';
import { formatTimestamp } from '../../utils/formatters.js';

const ChevronIcon = ({ open, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const PropertiesAccordion = ({ operation, mcpMeta }) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [operation?.id]);

  return (
    <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
          Properties
        </Text>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <dl className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
              Request time
            </dt>
            <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
              {formatTimestamp(operation.timestamp)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
              Operation ID
            </dt>
            <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
              {operation.id}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
              Correlation ID
            </dt>
            <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
              {operation.correlationId || '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Trace ID</dt>
            <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
              {operation.traceInfo?.trace_id || '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
              Trace source
            </dt>
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
      ) : null}
    </div>
  );
};

export default PropertiesAccordion;
