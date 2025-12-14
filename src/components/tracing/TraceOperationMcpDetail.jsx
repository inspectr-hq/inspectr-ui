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
import PropertiesAccordion from '../mcp/PropertiesAccordion.jsx';
import CollapsibleSection from '../mcp/CollapsibleSection.jsx';
import StatusBadge from '../insights/StatusBadge.jsx';
import MethodBadge from '../insights/MethodBadge.jsx';
import McpContentItems from '../mcp/McpContentItems.jsx';
import { formatDuration } from '../../utils/formatters.js';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import {
  deriveMcpView,
  getSseJsonPayload,
  getMcpMethodColor,
  parseJson,
  validateArgsAgainstSchema
} from '../../utils/mcp.js';

export default function TraceOperationMcpDetail({ operation, isLoading }) {
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';
  if (debugMode) {
    console.log('OP', operation);
  }

  const [showRaw, setShowRaw] = useState(false);
  const [resultTab, setResultTab] = useState('structured');
  const toolCacheRef = useRef([]);
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
  const ssePayload = getSseJsonPayload(operation?.response?.event_frames);
  const effectiveResponseBody = rawResponseBody || ssePayload || '';

  const mcpRequest = parseJson(rawRequestBody);
  const mcpResponse = parseJson(effectiveResponseBody);
  const mcpMethod = mcpMeta.method || mcpRequest?.method || '';
  const mcpCategory = mcpMeta.category || '';
  const tools = mcpResponse?.result?.tools || mcpResponse?.tools || [];
  const hasToolTag =
    Array.isArray(operation?.meta?.tags) &&
    operation.meta.tags.some((tag) => typeof tag === 'string' && tag.startsWith('mcp.tool.'));
  const view = useMemo(() => deriveMcpView(mcpMethod, mcpResponse), [mcpMethod, mcpResponse]);
  const isToolsList = view.type === 'toolsList' && Array.isArray(view.tools);
  const isToolsCall = mcpMethod === 'tools/call' || mcpMethod === 'tool/call' || hasToolTag;
  const isPromptsList = view.type === 'promptsList';
  const isPromptsGet = mcpMethod === 'prompts/get';
  const isResourcesList = view.type === 'resourcesList';
  const isResourcesRead = mcpMethod === 'resources/read';
  const hasContentItems = useMemo(
    () => Array.isArray(view.content) && view.content.length,
    [view.content]
  );

  const tabs = useMemo(() => {
    const result = [];
    if (view.structuredContent) {
      result.push({ key: 'structured', label: 'Structured content' });
    }
    if (hasContentItems) {
      result.push({ key: 'content', label: 'Content items' });
    }
    result.push({ key: 'raw', label: 'Raw content' });
    return result;
  }, [view.structuredContent, hasContentItems]);

  useEffect(() => {
    setShowRaw(false);
    if (view.structuredContent) {
      setResultTab('structured');
    } else if (hasContentItems) {
      setResultTab('content');
    } else {
      setResultTab('raw');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation?.id]);
  if (isToolsList && view.tools.length) {
    toolCacheRef.current = view.tools;
  }
  const cachedTools = toolCacheRef.current || [];
  const matchedToolFromCache = cachedTools.find((t) => t.name === mcpRequest?.params?.name);
  const callSchema =
    mcpResponse?.result?.tool?.inputSchema ||
    matchedToolFromCache?.inputSchema ||
    (Array.isArray(view.tools) &&
      view.tools.find((t) => t.name === mcpRequest?.params?.name)?.inputSchema) ||
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
        <CollapsibleSection title="Properties" resetKey={operation?.id} defaultOpen>
          <PropertiesAccordion operation={operation} mcpMeta={mcpMeta} />
        </CollapsibleSection>

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
                  {isToolsList && view.tools?.length ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          Tools ({view.tools.length})
                        </Text>
                      </div>
                      <div className="space-y-2">
                        {view.tools.map((tool) => (
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
                          <McpBadge method={mcpMethod || ''}>
                            {mcpRequest?.params?.name || '-'}
                          </McpBadge>
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
                            {mcpResponse ? (
                              (() => {
                                const activeKey =
                                  tabs.find((t) => t.key === resultTab)?.key || tabs[0].key;
                                const activeIndex = tabs.findIndex((t) => t.key === activeKey);
                                const rawData = mcpResponse?.result ?? mcpResponse ?? {};
                                return (
                                  <TabGroup
                                    index={activeIndex}
                                    onIndexChange={(idx) =>
                                      setResultTab(tabs[idx]?.key || tabs[0].key)
                                    }
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
                                              copyText={JSON.stringify(
                                                view.structuredContent,
                                                null,
                                                2
                                              )}
                                            />
                                          ) : null}
                                          {tab.key === 'content' ? (
                                            <McpContentItems items={view.content} />
                                          ) : null}
                                          {tab.key === 'raw' ? (
                                            <StructuredBlock
                                              data={rawData}
                                              title="Raw Output"
                                              copyText={JSON.stringify(rawData, null, 2)}
                                            />
                                          ) : null}
                                        </TabPanel>
                                      ))}
                                    </TabPanels>
                                  </TabGroup>
                                );
                              })()
                            ) : (
                              <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                                No result returned.
                              </Text>
                            )}
                          </McpOutputCard>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isPromptsList && Array.isArray(view.prompts) ? (
                    <div className="space-y-2">
                      <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        Prompts ({view.prompts.length})
                      </Text>
                      <div className="space-y-2">
                        {view.prompts.map((prompt) => {
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

                  {isResourcesList && Array.isArray(view.resources) ? (
                    <div className="space-y-2">
                      <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        Resources ({view.resources.length})
                      </Text>
                      <div className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
                        {view.resources.map((res) => (
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
                  <CollapsibleSection
                    title="HTTP Request"
                    resetKey={operation?.id}
                    defaultOpen={false}
                    copyText={requestBodyValue}
                  >
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
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="HTTP Response"
                    resetKey={operation?.id}
                    defaultOpen={false}
                    copyText={responseBodyValue}
                  >
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
                  </CollapsibleSection>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
