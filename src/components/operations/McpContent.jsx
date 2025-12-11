// src/components/operations/McpContent.jsx
import React from 'react';
import McpIndicator from './McpIndicator.jsx';
import { Badge } from '@tremor/react';

const Field = ({ label, value }) => (
  <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
    <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
      {value ?? '—'}
    </div>
  </div>
);

const TokenChip = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
      {label}
    </span>
    <span className="font-mono text-sm">{value ?? '—'}</span>
  </div>
);

const McpContent = ({ operation }) => {
  const mcp =
    operation?.meta?.mcp ||
    operation?.raw?.meta?.mcp ||
    operation?.meta?.trace?.mcp ||
    operation?.raw?.meta?.trace?.mcp;
  if (!mcp) {
    return (
      <div className="text-sm text-gray-500 dark:text-dark-tremor-content">No MCP metadata</div>
    );
  }

  const tokens = mcp.tokens;
  const tokenItems = [
    { label: 'Request', value: tokens?.request },
    { label: 'Response', value: tokens?.response },
    { label: 'Total', value: tokens?.total }
  ].filter((item) => item.value !== undefined);

  const isError = Number(operation?.status) >= 400;

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
              MCP
            </h3>
            <Badge color={isError ? 'rose' : 'emerald'} size="xs">
              {isError ? 'Error' : 'Success'}
            </Badge>
          </div>
          <McpIndicator mcp={mcp} />
        </div>
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {mcp.category ?? 'Name'}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
              <Badge color="blue" size="xs">
                {mcp.name ?? '—'}
              </Badge>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              Method
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
              <Badge color="blue" size="xs">
                {mcp.method ?? '—'}
              </Badge>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              Category
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
              <Badge color="slate" size="xs">
                {mcp.category ?? '—'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {tokens ? (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
              MCP Tokens
            </h3>
            {/*<div className="text-xs text-slate-500 dark:text-dark-tremor-content">*/}
            {/*  {tokens.method || tokens.model_assumed ? (*/}
            {/*    <>*/}
            {/*      {tokens.method ? <span className="font-semibold">{tokens.method}</span> : null}*/}
            {/*      {tokens.method && tokens.model_assumed ? <span className="mx-1">•</span> : null}*/}
            {/*      {tokens.model_assumed ? <span>{tokens.model_assumed}</span> : null}*/}
            {/*    </>*/}
            {/*  ) : (*/}
            {/*    <span>Counts</span>*/}
            {/*  )}*/}
            {/*</div>*/}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tokenItems.length > 0 ? (
              tokenItems.map((item) => (
                <TokenChip key={item.label} label={item.label} value={item.value} />
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
                No token counts
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default McpContent;
