// src/components/operations/McpContent.jsx
import React, { useMemo, useState } from 'react';
import ArgumentsTable from '../mcp/ArgumentsTable.jsx';
import McpInputCard from '../mcp/McpInputCard.jsx';
import McpOutputCard from '../mcp/McpOutputCard.jsx';
import StructuredBlock from '../mcp/StructuredBlock.jsx';
import { deriveMcpView, getMcpMethodColor, getSseJsonPayload, parseJson } from '../../utils/mcp.js';
import McpBadge from '../mcp/McpBadge.jsx';
import McpIndicator from './McpIndicator.jsx';
import ToolCard from '../mcp/ToolCard.jsx';
import { Badge, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import McpContentItems from '../mcp/McpContentItems.jsx';

const ChevronIcon = ({ open, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-4 w-4 text-tremor-content transition-transform dark:text-dark-tremor-content ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
      clipRule="evenodd"
    />
  </svg>
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
  const hasMcp =
    mcp && typeof mcp === 'object' && Object.keys(mcp).filter((k) => mcp[k] !== undefined).length;
  if (!hasMcp) {
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
  const ssePayload = getSseJsonPayload(operation?.response?.event_frames);
  const effectiveResponseBody = rawResponseBody || ssePayload || '';
  const mcpRequest = parseJson(rawRequestBody);
  const mcpResponse = parseJson(effectiveResponseBody);
  const hasInputArgs = Boolean(
    mcpRequest?.params?.arguments && Object.keys(mcpRequest.params.arguments).length
  );
  const [resultTab, setResultTab] = useState('structured');
  const mcpMethod = mcp?.method || mcpRequest?.method;
  const view = useMemo(() => deriveMcpView(mcpMethod, mcpResponse), [mcpMethod, mcpResponse]);
  const hasStructuredContent = useMemo(
    () => Boolean(view.structuredContent),
    [view.structuredContent]
  );
  const hasContentItems = useMemo(
    () => Array.isArray(view.content) && view.content.length,
    [view.content]
  );
  const [openSections, setOpenSections] = useState({
    mcp: true,
    tokens: true,
    input: true,
    output: true
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = useMemo(() => {
    const result = [];
    if (hasStructuredContent) {
      result.push({ key: 'structured', label: 'Structured content' });
    }
    if (hasContentItems) {
      result.push({ key: 'content', label: 'Content items' });
    }
    result.push({ key: 'raw', label: 'Raw content' });
    return result;
  }, [hasStructuredContent, hasContentItems]);

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
          <div className="flex items-center gap-2">
            <McpIndicator mcp={mcp} />
            <button
              type="button"
              onClick={() => toggleSection('mcp')}
              className="rounded p-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:hover:bg-dark-tremor-background-subtle"
              aria-label={openSections.mcp ? 'Collapse MCP section' : 'Expand MCP section'}
            >
              <ChevronIcon open={openSections.mcp} />
            </button>
          </div>
        </div>
        {openSections.mcp ? (
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
        ) : null}
      </div>

      {tokens ? (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-tremor-content-strong">
              MCP Tokens
            </h3>
            <button
              type="button"
              onClick={() => toggleSection('tokens')}
              className="rounded p-1 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:hover:bg-dark-tremor-background-subtle"
              aria-label={openSections.tokens ? 'Collapse MCP tokens' : 'Expand MCP tokens'}
            >
              <ChevronIcon open={openSections.tokens} />
            </button>
          </div>
          {openSections.tokens ? (
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
          ) : null}
        </div>
      ) : null}

      {mcpRequest || mcpResponse ? (
        <div className="grid grid-cols-1 gap-3">
          {hasInputArgs ? (
            <McpInputCard>
              <ArgumentsTable args={mcpRequest.params.arguments} />
            </McpInputCard>
          ) : null}
          {/*<div className="text-sm text-slate-500 dark:text-dark-tremor-content">*/}
          {/*  No MCP input*/}
          {/*</div>*/}

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
              ) : view.type === 'structured' || view.type === 'content' || hasContentItems ? (
                (() => {
                  const activeKey = tabs.find((t) => t.key === resultTab)?.key || tabs[0].key;
                  const activeIndex = tabs.findIndex((t) => t.key === activeKey);
                  return (
                    <TabGroup
                      index={activeIndex}
                      onIndexChange={(idx) => setResultTab(tabs[idx]?.key || 'raw')}
                    >
                      <TabList>
                        {tabs.map((tab) => (
                          <Tab key={tab.key}>{tab.label}</Tab>
                        ))}
                      </TabList>
                      <TabPanels>
                        {tabs.map((tab) => (
                          <TabPanel key={tab.key}>
                            {tab.key === 'structured' ? (
                              <StructuredBlock
                                data={view.structuredContent}
                                title="Structured content"
                              />
                            ) : null}
                            {tab.key === 'content' ? (
                              <StructuredBlock
                                data={view.content}
                                title="Content items"
                                copyText={JSON.stringify(view.content, null, 2)}
                              >
                                <McpContentItems items={view.content} />
                              </StructuredBlock>
                            ) : null}
                            {tab.key === 'raw' ? (
                              <StructuredBlock data={view.raw} title="Raw Output" />
                            ) : null}
                          </TabPanel>
                        ))}
                      </TabPanels>
                    </TabGroup>
                  );
                })()
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
