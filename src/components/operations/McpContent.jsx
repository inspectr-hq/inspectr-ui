// src/components/operations/McpContent.jsx
import React, { useState } from 'react';
import ArgumentsTable from '../mcp/ArgumentsTable.jsx';
import McpInputCard from '../mcp/McpInputCard.jsx';
import McpOutputCard from '../mcp/McpOutputCard.jsx';
import StructuredBlock from '../mcp/StructuredBlock.jsx';
import { deriveMcpView, getMcpMethodColor, parseJson } from '../../utils/mcp.js';
import McpBadge from '../mcp/McpBadge.jsx';
import McpIndicator from './McpIndicator.jsx';
import ToolCard from '../mcp/ToolCard.jsx';
import { Badge, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';

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
  const [resultTab, setResultTab] = useState('structured');
  const mcpMethod = mcp?.method || mcpRequest?.method;
  const view = deriveMcpView(mcpMethod, mcpResponse);

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
        <div className="grid grid-cols-1 gap-3">
          <McpInputCard>
            {hasInputArgs ? (
              <ArgumentsTable args={mcpRequest.params.arguments} />
            ) : (
              <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
                No MCP input
              </div>
            )}
          </McpInputCard>
          <McpOutputCard>
            {mcpResponse ? (
              view.type === 'toolsList' && view.tools?.length ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
                      Tools ({view.tools.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {view.tools.map((tool) => (
                      <ToolCard key={tool.name} tool={tool} />
                    ))}
                  </div>
                </div>
              ) : view.type === 'promptsList' && view.prompts ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
                    Prompts ({view.prompts.length})
                  </h4>
                  <div className="space-y-2">
                    {view.prompts.map((prompt) => {
                      const args = prompt.arguments || [];
                      const requiredCount = args.filter((a) => a.required).length;
                      return (
                        <div
                          key={prompt.name}
                          className="space-y-1 rounded border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
                                {prompt.title || prompt.name}
                              </div>
                              {prompt.description ? (
                                <div className="text-xs text-slate-600 dark:text-dark-tremor-content">
                                  {prompt.description}
                                </div>
                              ) : null}
                            </div>
                            <Badge color="slate" size="xs">
                              {args.length} args
                              {requiredCount ? ` (${requiredCount} required)` : ''}
                            </Badge>
                          </div>
                          {args.length ? (
                            <div className="space-y-1">
                              {args.map((arg) => (
                                <div key={arg.name} className="flex items-start gap-2 text-xs">
                                  <span className="font-mono text-slate-700 dark:text-dark-tremor-content-strong">
                                    {arg.name}
                                  </span>
                                  <span className="flex-1 text-slate-700 dark:text-dark-tremor-content">
                                    {arg.description || 'No description'}
                                  </span>
                                  {arg.required ? (
                                    <Badge color="rose" size="xs">
                                      required
                                    </Badge>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : view.type === 'resourcesList' && view.resources ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
                    Resources ({view.resources.length})
                  </h4>
                  <div className="divide-y divide-slate-200 text-sm dark:divide-dark-tremor-border">
                    {view.resources.map((res) => (
                      <div key={res.uri} className="flex flex-wrap items-center gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
                            {res.title || res.name || res.uri}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-dark-tremor-content">
                            {res.uri}
                          </div>
                          {res.description ? (
                            <div className="text-xs text-slate-700 dark:text-dark-tremor-content">
                              {res.description}
                            </div>
                          ) : null}
                        </div>
                        {res.mimeType ? (
                          <Badge color="slate" size="xs">
                            {res.mimeType}
                          </Badge>
                        ) : null}
                        {res.size ? (
                          <Badge color="slate" size="xs">
                            {`${(res.size / 1024).toFixed(1)} KB`}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : view.type === 'structured' ? (
                <TabGroup
                  index={resultTab === 'structured' ? 0 : 1}
                  onIndexChange={(idx) => setResultTab(idx === 0 ? 'structured' : 'raw')}
                >
                  <TabList>
                    <Tab>Structured content</Tab>
                    <Tab>Raw content</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <StructuredBlock data={view.structuredContent} title="Structured content" />
                    </TabPanel>
                    <TabPanel>
                      <StructuredBlock data={view.raw} title="Raw Output" />
                    </TabPanel>
                  </TabPanels>
                </TabGroup>
              ) : (
                <StructuredBlock data={view.raw} />
              )
            ) : (
              <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
                No MCP output
              </div>
            )}
          </McpOutputCard>
        </div>
      ) : null}
    </div>
  );
};

export default McpContent;
