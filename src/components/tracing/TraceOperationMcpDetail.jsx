// src/components/tracing/TraceOperationMcpDetail.jsx

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Badge, Card, Text, Title } from '@tremor/react';
import Editor from '@monaco-editor/react';
import StatusBadge from '../insights/StatusBadge.jsx';
import MethodBadge from '../insights/MethodBadge.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';

const parseJson = (value) => {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

const summarizeSchema = (schema) => {
  if (!schema || typeof schema !== 'object') return { total: 0, required: 0 };
  const properties = schema.properties || {};
  const required = Array.isArray(schema.required) ? schema.required.length : 0;
  return { total: Object.keys(properties).length, required };
};

const renderBadge = (condition, label, color = 'slate') =>
  condition ? (
    <Badge color={color} size="xs">
      {label}
    </Badge>
  ) : null;

const renderMarkdownPreview = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('#')) {
      flushList();
      const depth = Math.min(trimmed.match(/^#+/)?.[0]?.length || 1, 6);
      const content = trimmed.replace(/^#+\s*/, '') || trimmed;
      blocks.push(
        <div
          key={`h-${blocks.length}`}
          className={`font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong ${
            depth <= 2 ? 'text-base' : 'text-sm'
          }`}
        >
          {content}
        </div>
      );
      return;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm">
        {trimmed}
      </p>
    );
  });
  flushList();
  return (
    <div className="space-y-1 text-tremor-content dark:text-dark-tremor-content">{blocks}</div>
  );
};

const htmlTextPreview = (html) => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html || '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    return doc.body.textContent || html || '';
  } catch {
    return html || '';
  }
};

const ToolCard = ({ tool }) => {
  const { total, required } = summarizeSchema(tool.inputSchema);
  const props = Object.entries(tool.inputSchema?.properties || {});
  const requiredList = new Set(tool.inputSchema?.required || []);

  return (
    <Card className="space-y-2 rounded-tremor-small border border-tremor-border p-3 shadow-sm dark:border-dark-tremor-border">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {tool.title || tool.annotations?.title || tool.name}
          </Text>
          {tool.description ? (
            <Text className="mt-0.5 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              {tool.description}
            </Text>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {renderBadge(tool.annotations?.readOnlyHint, 'Read-only', 'blue')}
          {renderBadge(
            tool.annotations?.destructiveHint && !tool.annotations?.readOnlyHint,
            'Destructive',
            'rose'
          )}
          {renderBadge(tool.annotations?.idempotentHint, 'Idempotent', 'emerald')}
          {renderBadge(tool.annotations?.openWorldHint, 'Open world', 'amber')}
          {total ? (
            <Badge color="slate" size="xs">
              {total} params{required ? ` (${required} required)` : ''}
            </Badge>
          ) : (
            <Badge color="slate" size="xs">
              No params
            </Badge>
          )}
        </div>
      </div>

      {props.length ? (
        <div className="space-y-1">
          {props.map(([name, schema]) => (
            <div
              key={name}
              className="flex items-start gap-2 rounded-tremor-small bg-tremor-background-subtle px-2 py-1 dark:bg-dark-tremor-background-subtle"
            >
              <div className="font-mono text-xs text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {name}
              </div>
              <div className="flex-1 text-[11px] text-tremor-content dark:text-dark-tremor-content">
                {schema?.type ? `${schema.type}` : 'any'}
                {schema?.description ? ` — ${schema.description}` : ''}
              </div>
              {requiredList.has(name) ? (
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
};

const ArgumentsTable = ({ args }) => {
  const entries = Object.entries(args || {});
  if (!entries.length)
    return (
      <Text className="text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
        No arguments provided.
      </Text>
    );
  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-start gap-2 rounded-tremor-small bg-tremor-background-subtle px-2 py-1 text-xs dark:bg-dark-tremor-background-subtle"
        >
          <span className="font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {key}
          </span>
          <span className="flex-1 text-tremor-content dark:text-dark-tremor-content">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const StructuredBlock = ({ data, title }) => (
  <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
    {title ? (
      <div className="border-b border-tremor-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        {title}
      </div>
    ) : null}
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs text-tremor-content dark:text-dark-tremor-content">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

const getMimeLanguage = (mimeType = '') => {
  const lower = mimeType.toLowerCase();
  if (lower.includes('json')) return 'json';
  if (lower.includes('xml')) return 'xml';
  if (lower.includes('html')) return 'html';
  if (lower.includes('javascript')) return 'javascript';
  if (lower.includes('css')) return 'css';
  if (lower.includes('yaml') || lower.includes('yml')) return 'yaml';
  if (lower.includes('sql')) return 'sql';
  if (lower.startsWith('text/')) return 'plaintext';
  return 'json';
};

const validateArgsAgainstSchema = (args = {}, schema) => {
  if (!schema || typeof schema !== 'object') return { missing: [], extra: [] };
  const requiredList = new Set(schema.required || []);
  const props = new Set(Object.keys(schema.properties || {}));
  const argKeys = Object.keys(args);
  const missing = Array.from(requiredList).filter((key) => !argKeys.includes(key));
  const extra = argKeys.filter((key) => !props.has(key));
  return { missing, extra };
};

export default function TraceOperationMcpDetail({ operation, isLoading }) {
  const [showRaw, setShowRaw] = useState(false);
  const toolCacheRef = useRef([]);
  useEffect(() => {
    setShowRaw(false);
  }, [operation?.id]);
  const mcpMeta = operation?.meta?.mcp || operation?.meta?.trace?.mcp || {};
  const mcpRequest = parseJson(operation?.request?.body);
  const mcpResponse = parseJson(operation?.response?.body);
  const mcpMethod = mcpMeta.method || mcpRequest?.method || '';
  const mcpCategory = mcpMeta.category || '';
  const tools = mcpResponse?.result?.tools || mcpResponse?.tools || [];
  const isToolsList = mcpMethod === 'tools/list' && Array.isArray(tools);
  const isToolsCall = mcpMethod === 'tools/call' || mcpMethod === 'tool/call';
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

  const requestBodyValue = mcpRequest ? JSON.stringify(mcpRequest, null, 2) : '';
  const responseBodyValue = mcpResponse ? JSON.stringify(mcpResponse, null, 2) : '';
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

  if (!operation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
        {isLoading ? 'Loading trace details…' : 'Select a span to inspect its details.'}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MethodBadge method={operation.method} />
            <Title className="text-lg text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {`${operation.path || operation.url || 'Operation'}`} NEW
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

      <div className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Properties
          </Text>
          <dl className="mt-3 divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                Request time
              </dt>
              <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                {formatTimestamp(operation.timestamp)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                Operation ID
              </dt>
              <dd className="text-right text-sm font-mono text-tremor-content dark:text-dark-tremor-content">
                {operation.id}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                Correlation ID
              </dt>
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
              <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">
                Trace source
              </dt>
              <dd className="text-right text-tremor-content dark:text-dark-tremor-content">
                {operation.traceInfo?.source || '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              MCP
            </Text>
            <div className="flex items-center gap-2">
              <Badge color="blue" size="xs">
                {mcpMethod || 'Unknown method'}
              </Badge>
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

          <div className="flex flex-wrap items-center gap-2 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
            {mcpMeta?.tokens ? (
              <>
                <Badge color="indigo" size="xs">
                  Req {mcpMeta.tokens.request ?? '—'}
                </Badge>
                <Badge color="indigo" size="xs">
                  Res {mcpMeta.tokens.response ?? '—'}
                </Badge>
                <Badge color="indigo" size="xs">
                  Total {mcpMeta.tokens.total ?? '—'}
                </Badge>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRaw(false)}
              className={`rounded-tremor-small px-3 py-1 text-xs font-semibold ${
                !showRaw
                  ? 'bg-tremor-brand-faint text-tremor-content-strong'
                  : 'text-tremor-content-subtle hover:text-tremor-content'
              }`}
            >
              Typed view
            </button>
            <button
              type="button"
              onClick={() => setShowRaw(true)}
              className={`rounded-tremor-small px-3 py-1 text-xs font-semibold ${
                showRaw
                  ? 'bg-tremor-brand-faint text-tremor-content-strong'
                  : 'text-tremor-content-subtle hover:text-tremor-content'
              }`}
            >
              Raw JSON
            </button>
          </div>

          {!showRaw ? (
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
                  <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Tool call
                  </Text>
                  <Card className="space-y-2 rounded-tremor-small border border-tremor-border p-3 shadow-sm dark:border-dark-tremor-border">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="blue" size="xs">
                        {mcpRequest?.params?.name || 'Unknown tool'}
                      </Badge>
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                          Arguments
                        </Text>
                        <ArgumentsTable args={mcpRequest?.params?.arguments} />
                        {callSchema &&
                        (callValidation.missing.length || callValidation.extra.length) ? (
                          <div className="space-y-1 text-[11px] text-amber-700 dark:text-amber-200">
                            {callValidation.missing.length ? (
                              <div>Missing required: {callValidation.missing.join(', ')}</div>
                            ) : null}
                            {callValidation.extra.length ? (
                              <div>Unknown fields: {callValidation.extra.join(', ')}</div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                          Result
                        </Text>
                        {mcpResponse?.result?.structuredContent ? (
                          <StructuredBlock
                            data={mcpResponse.result.structuredContent}
                            title="Structured content"
                          />
                        ) : null}
                        {Array.isArray(mcpResponse?.result?.content) ? (
                          <div className="space-y-1 rounded-tremor-small bg-tremor-background-subtle p-2 text-xs text-tremor-content dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
                            {mcpResponse.result.content.map((block, idx) => (
                              <div key={idx}>{block?.text || '[non-text content]'}</div>
                            ))}
                          </div>
                        ) : null}
                        {!mcpResponse?.result && !mcpResponse?.error ? (
                          <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                            No result returned.
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  </Card>
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
                  <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Prompt preview
                  </Text>
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
                  <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    Resource content
                  </Text>
                  {typeof resourceRead?.text === 'string' ? (
                    <>
                      {(resourceMime || '').includes('markdown') ? (
                        <div className="rounded-tremor-small border border-slate-200 bg-tremor-background-subtle p-3 text-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                          {renderMarkdownPreview(resourceRead.text) || (
                            <div className="text-tremor-content-subtle dark:text-dark-tremor-content">
                              Unable to render markdown preview.
                            </div>
                          )}
                        </div>
                      ) : null}
                      {(resourceMime || '').includes('html') ? (
                        <div className="rounded-tremor-small border border-slate-200 bg-tremor-background-subtle p-3 text-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                            HTML (text-only preview)
                          </Text>
                          <p className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
                            {htmlTextPreview(resourceRead.text)}
                          </p>
                        </div>
                      ) : null}
                      <Editor
                        value={resourceRead.text}
                        language={getMimeLanguage(resourceMime)}
                        theme={getMonacoTheme()}
                        beforeMount={defineMonacoThemes}
                        options={editorOptions}
                        height="240px"
                      />
                    </>
                  ) : (
                    <StructuredBlock data={resourceRead} />
                  )}
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
          ) : (
            <div className="space-y-3">
              <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                <div className="border-b border-tremor-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                  MCP Request (JSON-RPC)
                </div>
                <Editor
                  value={requestBodyValue || '—'}
                  language="json"
                  theme={getMonacoTheme()}
                  beforeMount={defineMonacoThemes}
                  options={editorOptions}
                  height="200px"
                />
              </div>
              <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                <div className="border-b border-tremor-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
                  MCP Response (JSON-RPC)
                </div>
                <Editor
                  value={responseBodyValue || '—'}
                  language="json"
                  theme={getMonacoTheme()}
                  beforeMount={defineMonacoThemes}
                  options={editorOptions}
                  height="200px"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Raw HTTP Request body
          </Text>
          <div className="mt-2 h-60 overflow-hidden rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
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

        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Raw HTTP Response body
          </Text>
          <div className="mt-2 h-60 overflow-hidden rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
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
      </div>
    </div>
  );
}
