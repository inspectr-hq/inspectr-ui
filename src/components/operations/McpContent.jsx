// src/components/operations/McpContent.jsx
import React from 'react';
import ArgumentsTable from '../mcp/ArgumentsTable.jsx';
import McpInputCard from '../mcp/McpInputCard.jsx';
import McpOutputCard from '../mcp/McpOutputCard.jsx';
import StructuredBlock from '../mcp/StructuredBlock.jsx';
import { getMcpMethodColor, parseJson } from '../../utils/mcp.js';
import McpBadge from '../mcp/McpBadge.jsx';
import McpIndicator from './McpIndicator.jsx';
import { Badge } from '@tremor/react';

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
  const methodColor = getMcpMethodColor(mcp?.method);
  const rawRequestBody =
    typeof operation?.request?.body === 'string'
      ? operation.request.body
      : operation?.request?.body
        ? JSON.stringify(operation.request.body)
        : '';
  const rawResponseBody =
    typeof operation?.response?.body === 'string'
      ? operation.response.body
      : operation?.response?.body
        ? JSON.stringify(operation.response.body)
        : '';
  const mcpRequest = parseJson(rawRequestBody);
  const mcpResponse = parseJson(rawResponseBody);
  const hasInputArgs = Boolean(
    mcpRequest?.params?.arguments && Object.keys(mcpRequest.params.arguments).length
  );

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
              <McpBadge method={mcp.method ?? ''}>{mcp.name ?? '—'}</McpBadge>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              Method
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
              <McpBadge method={mcp.method ?? ''}>{mcp.method ?? '—'}</McpBadge>
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              Category
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong break-all">
              <McpBadge color="slate">{mcp.category ?? '—'}</McpBadge>
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

      {mcpRequest || mcpResponse ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <McpInputCard>
            {hasInputArgs ? (
              <ArgumentsTable args={mcpRequest.params.arguments} />
            ) : (
              <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
                No MCP input captured
              </div>
            )}
          </McpInputCard>
          <McpOutputCard>
            {mcpResponse ? (
              <StructuredBlock data={mcpResponse.result ?? mcpResponse} />
            ) : (
              <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
                No MCP output captured
              </div>
            )}
          </McpOutputCard>
        </div>
      ) : null}
    </div>
  );
};

export default McpContent;
