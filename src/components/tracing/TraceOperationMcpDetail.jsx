// src/components/tracing/TraceOperationMcpDetail.jsx

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Badge,
  Card,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Title
} from '@tremor/react';
import Editor from '@monaco-editor/react';
import ArgumentsTable from '../mcp/ArgumentsTable.jsx';
import KeyValueList from '../mcp/KeyValueList.jsx';
import McpInputCard from '../mcp/McpInputCard.jsx';
import McpOutputCard from '../mcp/McpOutputCard.jsx';
import ResourceOutput from '../mcp/ResourceOutput.jsx';
import StructuredBlock from '../mcp/StructuredBlock.jsx';
import ToolCard from '../mcp/ToolCard.jsx';
import McpBadge from '../mcp/McpBadge.jsx';
import StatusBadge from '../insights/StatusBadge.jsx';
import MethodBadge from '../insights/MethodBadge.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import { getMcpMethodColor, parseJson, validateArgsAgainstSchema } from '../../utils/mcp.js';

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

export default function TraceOperationMcpDetail({ operation, isLoading }) {
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';
  if (debugMode) {
    console.log('OP', operation);
  }

  const [showRaw, setShowRaw] = useState(false);
  const [resultTab, setResultTab] = useState('structured');
  const [showRawRequest, setShowRawRequest] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const toolCacheRef = useRef([]);
  useEffect(() => {
    setShowRaw(false);
    setResultTab('structured');
    setShowRawRequest(false);
    setShowRawResponse(false);
    setShowProperties(true);
  }, [operation?.id]);
  const mcpMeta =
    operation?.meta?.mcp ||
    operation?.raw?.meta?.mcp ||
    operation?.meta?.trace?.mcp ||
    operation?.raw?.meta?.trace?.mcp ||
    {};
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
  const mcpMethod = mcpMeta.method || mcpRequest?.method || '';
  const mcpCategory = mcpMeta.category || '';
  const tools = mcpResponse?.result?.tools || mcpResponse?.tools || [];
  const isToolsList = mcpMethod === 'tools/list' && Array.isArray(tools);
  const hasToolTag =
    Array.isArray(operation?.meta?.tags) &&
    operation.meta.tags.some((tag) => typeof tag === 'string' && tag.startsWith('mcp.tool.'));
  const isToolsCall = mcpMethod === 'tools/call' || mcpMethod === 'tool/call' || hasToolTag;
  const isPromptsList = mcpMethod === 'prompts/list';
  const isPromptsGet = mcpMethod === 'prompts/get';
  const isResourcesList = mcpMethod === 'resources/list';
  const isResourcesRead = mcpMethod === 'resources/read';
  if (isToolsList && tools.length) {
    toolCacheRef.current = tools;
  }
  const cachedTools = toolCacheRef.current || [];
  const matchedToolFromCache = cachedTools.find((t) => t.name === mcpRequest?.params?.name);
  const callSchema =
    mcpResponse?.result?.tool?.inputSchema ||
    matchedToolFromCache?.inputSchema ||
    (Array.isArray(tools) && tools.find((t) => t.name === mcpRequest?.params?.name)?.inputSchema) ||
    null;
  const callValidation = isToolsCall
    ? validateArgsAgainstSchema(mcpRequest?.params?.arguments || {}, callSchema)
    : { missing: [], extra: [] };
  const resourceRead = mcpResponse?.result;
  const resourceMime = resourceRead?.mimeType || resourceRead?.resource?.mimeType || '';

  const requestBodyValue = mcpRequest
    ? JSON.stringify(mcpRequest, null, 2)
    : rawRequestBody || 'No request body';
  const responseBodyValue = mcpResponse
    ? JSON.stringify(mcpResponse, null, 2)
    : rawResponseBody || 'No response body';
  const editorOptions = useMemo(
    () => ({
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 12,
      lineNumbers: 'off',
      folding: false
    }),
    []
  );

  const getMainTabLabel = () => {
    if (isToolsCall) return 'Tool call';
    if (isToolsList) return 'Tools list';
    if (isPromptsList) return 'Prompts list';
    if (isPromptsGet) return 'Prompt';
    if (isResourcesList) return 'Resources list';
    if (isResourcesRead) return 'Resource';
    return 'Typed view';
  };

  if (!operation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
        {isLoading ? 'Loading trace details…' : 'Select a span to inspect its details.'}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MethodBadge method={operation.method} />
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {`${operation.path || operation.url || 'Operation'}`}
            </Title>
          </div>
          <Text className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
            {operation.host || operation.request?.server || 'Unspecified host'}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={operation.status} />
          <Badge color="blue">{formatDuration(operation.duration)}</Badge>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-5 pr-1">
        <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
          <button
            type="button"
            onClick={() => setShowProperties((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
          >
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Properties
            </Text>
            <ChevronIcon open={showProperties} />
          </button>
          {showProperties ? (
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
                <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                  Trace ID
                </dt>
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
                  <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                    Tokens
                  </dt>
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              MCP
            </Text>
            <div className="flex items-center gap-2">
              <McpBadge method={mcpMethod || ''}>{mcpMethod || 'Unknown method'}</McpBadge>
              {mcpCategory ? (
                <Badge color="slate" size="xs">
                  {mcpCategory}
                </Badge>
              ) : null}
              {mcpMeta?.session_id ? (
                <Badge color="slate" size="xs">
                  {mcpMeta.session_id}
                </Badge>
              ) : null}
            </div>
          </div>

          <TabGroup index={showRaw ? 1 : 0} onIndexChange={(idx) => setShowRaw(idx === 1)}>
            <TabList>
              <Tab>{getMainTabLabel()}</Tab>
              <Tab>Raw</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div className="space-y-3">
                  {isToolsList && tools.length ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          Tools ({tools.length})
                        </Text>
                      </div>
                      <div className="space-y-2">
                        {tools.map((tool) => (
                          <ToolCard key={tool.name} tool={tool} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isToolsCall ? (
                    <div className="space-y-2">
                      {/*<Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">*/}
                      {/*  Tool call*/}
                      {/*</Text>*/}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                            Tool:
                          </span>
                          <Badge color="blue" size="xs">
                            {mcpRequest?.params?.name || 'Unknown tool'}
                          </Badge>
                          <span className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                            Result:
                          </span>
                          {mcpResponse?.error ? (
                            <Badge color="rose" size="xs">
                              Error
                            </Badge>
                          ) : (
                            <Badge color="emerald" size="xs">
                              Success
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-1">
                          <McpInputCard validation={callSchema ? callValidation : undefined}>
                            <ArgumentsTable args={mcpRequest?.params?.arguments} />
                          </McpInputCard>
                          <McpOutputCard>
                            <TabGroup
                              index={resultTab === 'structured' ? 0 : 1}
                              onIndexChange={(idx) =>
                                setResultTab(idx === 0 ? 'structured' : 'raw')
                              }
                            >
                              <TabList>
                                <Tab>Structured content</Tab>
                                <Tab>Raw content</Tab>
                              </TabList>
                              <TabPanels>
                                <TabPanel>
                                  {mcpResponse?.result?.structuredContent ? (
                                    <StructuredBlock
                                      data={mcpResponse.result.structuredContent}
                                      title="Structured content"
                                    />
                                  ) : null}
                                  {!mcpResponse?.result && !mcpResponse?.error ? (
                                    <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                      No result returned.
                                    </Text>
                                  ) : null}
                                </TabPanel>
                                <TabPanel>
                                  <StructuredBlock
                                    data={mcpResponse?.result ?? mcpResponse ?? {}}
                                    title="Raw Output"
                                  />
                                </TabPanel>
                              </TabPanels>
                            </TabGroup>
                          </McpOutputCard>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isPromptsList && Array.isArray(mcpResponse?.result?.prompts) ? (
                    <div className="space-y-2">
                      <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        Prompts ({mcpResponse.result.prompts.length})
                      </Text>
                      <div className="space-y-2">
                        {mcpResponse.result.prompts.map((prompt) => {
                          const args = prompt.arguments || [];
                          const requiredCount = args.filter((a) => a.required).length;
                          return (
                            <Card
                              key={prompt.name}
                              className="space-y-1 rounded-tremor-small border border-tremor-border p-3 shadow-sm dark:border-dark-tremor-border"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                                    {prompt.title || prompt.name}
                                  </Text>
                                  {prompt.description ? (
                                    <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                      {prompt.description}
                                    </Text>
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
                                      <span className="font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">
                                        {arg.name}
                                      </span>
                                      <span className="flex-1 text-tremor-content dark:text-dark-tremor-content">
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
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {isPromptsGet && Array.isArray(mcpResponse?.result?.messages) ? (
                    <div className="space-y-2">
                      {/*<Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">*/}
                      {/*  Prompt*/}
                      {/*</Text>*/}
                      <div className="grid gap-3">
                        <McpInputCard>
                          <KeyValueList
                            items={[
                              {
                                label: 'name',
                                value: mcpRequest?.params?.name || mcpResponse?.result?.name || '—'
                              },
                              ...(Array.isArray(mcpRequest?.params?.arguments)
                                ? mcpRequest.params.arguments.map((arg, idx) => ({
                                    label: `arg ${idx + 1}`,
                                    value: arg
                                  }))
                                : [])
                            ]}
                          />
                        </McpInputCard>
                        <McpOutputCard>
                          <div className="space-y-2">
                            {mcpResponse.result.messages.map((message, idx) => (
                              <div
                                key={idx}
                                className={`flex ${message.role === 'assistant' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xl rounded-tremor-small px-3 py-2 text-sm ${
                                    message.role === 'assistant'
                                      ? 'bg-tremor-brand-faint text-tremor-content-strong'
                                      : 'bg-tremor-background-subtle text-tremor-content dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content'
                                  }`}
                                >
                                  {Array.isArray(message.content)
                                    ? message.content.map((c, i) => (
                                        <div key={i}>{c.text || '[content]'}</div>
                                      ))
                                    : message.content?.text || '[content]'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </McpOutputCard>
                      </div>
                    </div>
                  ) : null}

                  {isResourcesList && Array.isArray(mcpResponse?.result?.resources) ? (
                    <div className="space-y-2">
                      <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        Resources ({mcpResponse.result.resources.length})
                      </Text>
                      <div className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
                        {mcpResponse.result.resources.map((res) => (
                          <div key={res.uri} className="flex flex-wrap items-center gap-2 py-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                                {res.title || res.name || res.uri}
                              </div>
                              <div className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                {res.uri}
                              </div>
                              {res.description ? (
                                <div className="text-xs text-tremor-content dark:text-dark-tremor-content">
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
                  ) : null}

                  {isResourcesRead && mcpResponse?.result ? (
                    <div className="space-y-2">
                      {/*<Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">*/}
                      {/*  Resource*/}
                      {/*</Text>*/}
                      <div className="grid gap-3">
                        <McpInputCard>
                          <KeyValueList
                            items={[
                              { label: 'uri', value: mcpRequest?.params?.uri || resourceRead?.uri },
                              resourceMime ? { label: 'mime', value: resourceMime } : null
                            ]}
                          />
                        </McpInputCard>
                        <McpOutputCard>
                          <ResourceOutput
                            resource={resourceRead}
                            mimeType={resourceMime}
                            editorOptions={editorOptions}
                          />
                        </McpOutputCard>
                      </div>
                    </div>
                  ) : null}

                  {!isToolsList &&
                  !isToolsCall &&
                  !isPromptsList &&
                  !isPromptsGet &&
                  !isResourcesList &&
                  !isResourcesRead ? (
                    <Text className="text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
                      No typed MCP view available for this method. Switch to Raw JSON to inspect.
                    </Text>
                  ) : null}
                </div>
              </TabPanel>
              <TabPanel>
                <div className="space-y-3">
                  <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                    <button
                      type="button"
                      onClick={() => setShowRawRequest((prev) => !prev)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
                    >
                      <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                        HTTP Request
                      </Text>
                      <ChevronIcon open={showRawRequest} />
                    </button>
                    {showRawRequest ? (
                      <div className="border-t border-tremor-border">
                        <div className="h-60 overflow-hidden">
                          <Editor
                            value={requestBodyValue || 'No request body'}
                            language="json"
                            theme={getMonacoTheme()}
                            beforeMount={defineMonacoThemes}
                            options={editorOptions}
                            height="100%"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                    <button
                      type="button"
                      onClick={() => setShowRawResponse((prev) => !prev)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
                    >
                      <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                        HTTP Response
                      </Text>
                      <ChevronIcon open={showRawResponse} />
                    </button>
                    {showRawResponse ? (
                      <div className="border-t border-tremor-border">
                        <div className="h-[320px] overflow-hidden">
                          <Editor
                            value={responseBodyValue || 'No response body'}
                            language="json"
                            theme={getMonacoTheme()}
                            beforeMount={defineMonacoThemes}
                            options={editorOptions}
                            height="100%"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
