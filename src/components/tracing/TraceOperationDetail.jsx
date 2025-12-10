// src/components/tracing/TraceOperationDetail.jsx

import React, { useMemo, useState } from 'react';
import { Badge, Text, Title } from '@tremor/react';
import Editor from '@monaco-editor/react';
import StatusBadge from '../insights/StatusBadge.jsx';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import { extractGenericTraceEntries, extractMetaEntries } from './traceUtils.js';
import MethodBadge from '../insights/MethodBadge.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import { formatXML } from '../../utils/formatXml.js';

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
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(false);
  const [showRequestHeaders, setShowRequestHeaders] = useState(false);
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);

  const metaEntries = extractMetaEntries(operation);
  const ADVANCED_META_KEYS = useMemo(() => new Set(['proxy', 'ingress', 'inspectr']), []);
  const basicMetaEntries = metaEntries.filter((entry) => !ADVANCED_META_KEYS.has(entry.key));
  const advancedMetaEntries = metaEntries.filter((entry) => ADVANCED_META_KEYS.has(entry.key));
  const genericTraceEntries = extractGenericTraceEntries(operation);
  const tags = Array.isArray(operation?.tags) ? operation.tags : [];
  const requestHeaders = normalizeHeaders(operation?.request?.headers);
  const responseHeaders = normalizeHeaders(operation?.response?.headers);
  const requestContentType = extractContentType(operation?.request?.headers);
  const responseContentType = extractContentType(operation?.response?.headers);
  const requestBodyValue = formatPayload(operation?.request?.body, requestContentType);
  const responseBodyValue = formatPayload(operation?.response?.body, responseContentType);
  const hasRequestBody = (requestBodyValue || '').trim().length > 0;
  const hasResponseBody = (responseBodyValue || '').trim().length > 0;
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

      <div className="mt-6 space-y-5 overflow-y-auto">
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
            {/*<div className="flex items-center justify-between gap-3 py-2">*/}
            {/*  <dt className="text-tremor-content-subtle dark:text-dark-tremor-content">Client</dt>*/}
            {/*  <dd className="text-right text-tremor-content dark:text-dark-tremor-content">*/}
            {/*    {operation.request?.client_ip || '—'}*/}
            {/*  </dd>*/}
            {/*</div>*/}
          </dl>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowRequestHeaders((prev) => !prev)}
            aria-expanded={showRequestHeaders}
            className="flex w-full items-center justify-between text-left"
          >
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Request headers
            </Text>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 text-tremor-content transition-transform dark:text-dark-tremor-content ${showRequestHeaders ? 'rotate-180' : 'rotate-0'}`}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {requestHeaders.length ? (
            showRequestHeaders ? (
              <div className="mt-2 max-h-60 overflow-auto rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                <dl className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
                  {requestHeaders.map((header, index) => (
                    <div
                      key={`${header.name}-${index}`}
                      className="flex items-start gap-3 px-3 py-2"
                    >
                      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                        {header.name}
                      </dt>
                      <dd className="flex-1 text-sm text-tremor-content dark:text-dark-tremor-content">
                        {header.value || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null
          ) : (
            <Text className="mt-2 text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
              No headers captured.
            </Text>
          )}
        </div>

        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Request body
          </Text>
          {hasRequestBody ? (
            <div className="mt-2 h-60 overflow-hidden rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
              <Editor
                value={requestBodyValue}
                language={requestEditorLanguage}
                theme={getMonacoTheme()}
                beforeMount={defineMonacoThemes}
                options={editorOptions}
                height="100%"
              />
            </div>
          ) : (
            <div className="mt-2 h-10 overflow-hidden rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
              <Editor
                value="No request body"
                language={requestEditorLanguage}
                theme={getMonacoTheme()}
                beforeMount={defineMonacoThemes}
                options={editorOptions}
                height="100%"
              />
            </div>
          )}
        </div>

        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            Response body
          </Text>
          {hasResponseBody ? (
            <div className="mt-2 h-60 overflow-hidden rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
              <Editor
                value={responseBodyValue}
                language={responseEditorLanguage}
                theme={getMonacoTheme()}
                beforeMount={defineMonacoThemes}
                options={editorOptions}
                height="100%"
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
              No response body captured.
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowResponseHeaders((prev) => !prev)}
            aria-expanded={showResponseHeaders}
            className="flex w-full items-center justify-between text-left"
          >
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Response headers
            </Text>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 text-tremor-content transition-transform dark:text-dark-tremor-content ${showResponseHeaders ? 'rotate-180' : 'rotate-0'}`}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {responseHeaders.length ? (
            showResponseHeaders ? (
              <div className="mt-2 max-h-60 overflow-auto rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
                <dl className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
                  {responseHeaders.map((header, index) => (
                    <div
                      key={`${header.name}-${index}`}
                      className="flex items-start gap-3 px-3 py-2"
                    >
                      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
                        {header.name}
                      </dt>
                      <dd className="flex-1 text-sm text-tremor-content dark:text-dark-tremor-content">
                        {header.value || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null
          ) : (
            <Text className="mt-2 text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
              No headers captured.
            </Text>
          )}
        </div>

        {operation.traceInfo?.generic && genericTraceEntries.length ? (
          <div>
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

        {basicMetaEntries.length ? (
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              Metadata
            </Text>
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
        ) : null}

        {advancedMetaEntries.length ? (
          <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
            <button
              type="button"
              onClick={() => setShowAdvancedMeta((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span>Advanced metadata</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 transition-transform ${showAdvancedMeta ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showAdvancedMeta ? (
              <div className="divide-y divide-tremor-border text-sm dark:divide-dark-tremor-border">
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
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
