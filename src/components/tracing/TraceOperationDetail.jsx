// src/components/tracing/TraceOperationDetail.jsx

import React, { useMemo } from 'react';
import { Badge, Text, Title } from '@tremor/react';
import Editor from '@monaco-editor/react';
import StatusBadge from '../insights/StatusBadge.jsx';
import { formatDuration } from '../../utils/formatters.js';
import { extractGenericTraceEntries, extractMetaEntries } from './traceUtils.js';
import MethodBadge from '../insights/MethodBadge.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import { formatXML } from '../../utils/formatXml.js';
import PropertiesAccordion from '../mcp/PropertiesAccordion.jsx';
import CollapsibleSection from '../mcp/CollapsibleSection.jsx';
import HeaderList from '../mcp/HeaderList.jsx';

const normalizeHeaders = (headers) => {
  if (!headers) return [];
  if (Array.isArray(headers)) {
    return headers.map((header) => ({
      name: header.name ?? header.key ?? '',
      value: header.value
    }));
  }
  if (typeof headers === 'object') {
    if ('name' in headers && 'value' in headers) {
      return [{ name: headers.name, value: headers.value }];
    }
    return Object.entries(headers).map(([name, value]) => ({ name, value }));
  }
  return [];
};

const extractContentType = (headers) => {
  const normalized = normalizeHeaders(headers);
  const raw = normalized.find((header) => header.name?.toLowerCase() === 'content-type')?.value;
  if (!raw || typeof raw !== 'string') return null;
  return raw.split(';')[0].trim().toLowerCase();
};

const getEditorLanguage = (contentType) => {
  if (!contentType) return 'json';
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('html')) return 'html';
  if (contentType.includes('xml')) return 'xml';
  if (contentType.includes('javascript')) return 'javascript';
  if (contentType.includes('css')) return 'css';
  if (contentType.includes('yaml') || contentType.includes('yml')) return 'yaml';
  if (contentType.includes('sql')) return 'sql';
  if (contentType.startsWith('text/')) return 'plaintext';
  return 'plaintext';
};

const formatPayload = (payload, contentType) => {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') {
    if (contentType?.includes('json')) {
      try {
        const parsed = JSON.parse(payload);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return payload;
      }
    }
    if (contentType?.includes('xml')) {
      try {
        return formatXML(payload);
      } catch {
        return payload;
      }
    }
    return payload;
  }
  if (typeof payload === 'object') {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  }
  return String(payload);
};

export default function TraceOperationDetail({ operation, isLoading }) {
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';
  if (debugMode) {
    console.log('OP', operation);
  }

  const metaEntries = extractMetaEntries(operation);
  const ADVANCED_META_KEYS = useMemo(() => new Set(['proxy', 'ingress', 'inspectr']), []);
  const basicMetaEntries = metaEntries.filter((entry) => !ADVANCED_META_KEYS.has(entry.key));
  const advancedMetaEntries = metaEntries.filter((entry) => ADVANCED_META_KEYS.has(entry.key));
  const genericTraceEntries = extractGenericTraceEntries(operation);
  const tags = Array.isArray(operation?.tags) ? operation.tags : [];
  const requestHeaders = normalizeHeaders(operation?.request?.headers);
  const responseHeaders = normalizeHeaders(operation?.response?.headers);
  const mcpMeta =
    operation?.meta?.mcp ||
    operation?.raw?.meta?.mcp ||
    operation?.meta?.trace?.mcp ||
    operation?.raw?.meta?.trace?.mcp ||
    {};
  const requestContentType = extractContentType(operation?.request?.headers);
  const responseContentType = extractContentType(operation?.response?.headers);
  const requestBodyValue = formatPayload(operation?.request?.body, requestContentType);
  const responseBodyValue = formatPayload(operation?.response?.body, responseContentType);
  const requestEditorLanguage = getEditorLanguage(requestContentType);
  const responseEditorLanguage = getEditorLanguage(responseContentType);
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

      <div className="mt-6 space-y-5">
        {/* Properties */}
        <CollapsibleSection title="Properties" resetKey={operation?.id} defaultOpen>
          <PropertiesAccordion operation={operation} mcpMeta={mcpMeta} />
        </CollapsibleSection>

        {/* Request headers */}
        <CollapsibleSection
          title={`Request headers (${requestHeaders.length})`}
          resetKey={operation?.id}
          defaultOpen={false}
        >
          <HeaderList headers={requestHeaders} />
        </CollapsibleSection>

        {/* Request body */}
        <CollapsibleSection
          title="Request body"
          resetKey={operation?.id}
          defaultOpen={false}
          copyText={requestBodyValue}
        >
          <div className="h-60 overflow-hidden">
            <Editor
              value={requestBodyValue || 'No request body'}
              language={requestEditorLanguage}
              theme={getMonacoTheme()}
              beforeMount={defineMonacoThemes}
              options={editorOptions}
              height="100%"
            />
          </div>
        </CollapsibleSection>

        {/* Response body */}
        <CollapsibleSection
          title="Response body"
          resetKey={operation?.id}
          defaultOpen={false}
          copyText={responseBodyValue}
        >
          <div className="h-[320px] overflow-hidden">
            <Editor
              value={responseBodyValue || 'No response body'}
              language={responseEditorLanguage}
              theme={getMonacoTheme()}
              beforeMount={defineMonacoThemes}
              options={editorOptions}
              height="100%"
            />
          </div>
        </CollapsibleSection>

        {/* Response headers */}
        <CollapsibleSection
          title={`Response headers (${responseHeaders.length})`}
          resetKey={operation?.id}
          defaultOpen={false}
        >
          <HeaderList headers={responseHeaders} />
        </CollapsibleSection>

        {/* Tags */}
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

        {/* Basic metadata */}
        {basicMetaEntries.length ? (
          <CollapsibleSection title="Metadata" resetKey={operation?.id} defaultOpen={false}>
            <div className="px-3 py-2">
              <div className="mt-2 space-y-3">
                {basicMetaEntries.map((entry) => (
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
          </CollapsibleSection>
        ) : null}

        {advancedMetaEntries.length || genericTraceEntries.length ? (
          <CollapsibleSection
            title="Advanced metadata"
            resetKey={operation?.id}
            defaultOpen={false}
          >
            <div className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
              {operation.traceInfo?.generic && genericTraceEntries.length ? (
                <div className="px-3 py-2">
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
              {advancedMetaEntries.map((entry) => (
                <div key={entry.key} className="px-3 py-2">
                  <Text className="text-xs font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {entry.key}
                  </Text>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-tremor-small bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-gray-800 dark:text-gray-100">
                    {entry.value}
                  </pre>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        ) : null}
      </div>
    </div>
  );
}
