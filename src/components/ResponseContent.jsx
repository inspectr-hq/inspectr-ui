// src/components/ResponseContent.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import CopyButton from './CopyButton.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../utils/monacoTheme.js';
import { formatXML } from '../utils/formatXml.js';
import SseFramesViewer from './SseFramesViewer.jsx';

const ResponseContent = ({ operation }) => {
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);
  const [viewMode, setViewMode] = useState('source');

  const renderTableRows = (data) =>
    data.map((row) => (
      <tr key={row.name}>
        <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-slate-500 dark:text-dark-tremor-content text-xs">
          {row.name}
        </td>
        <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-xs dark:text-dark-tremor-content">
          <div className="flex flex-wrap items-center">
            <span className="min-w-0 break-all flex-1">{row.value}</span>
          </div>
        </td>
      </tr>
    ));

  // Check if the response body has content
  const payload = operation.response.body;
  const isEmptyPayload =
    !payload ||
    (typeof payload === 'object' && Object.keys(payload).length === 0) ||
    (typeof payload === 'string' && (payload.trim() === '' || payload.trim() === '{}'));

  const formatPayload = (payload, type) => {
    if (typeof payload !== 'string') return payload;
    if (type && type.includes('json')) {
      try {
        const parsed = JSON.parse(payload);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return payload;
      }
    }
    if (type && type.includes('xml')) {
      return formatXML(payload);
    }
    return payload;
  };

  // Method to detect the content type from headers
  const getContentType = () => {
    const raw = (operation?.response?.headers ?? []).find(
      (h) => h.name?.toLowerCase() === 'content-type' || h.key?.toLowerCase() === 'content-type'
    )?.value;
    return typeof raw === 'string' ? raw.split(';')[0].trim() : undefined;
  };

  // Detect content type
  const contentType = getContentType();

  // Check if content is HTML
  const isHTMLContent = typeof contentType === 'string' && contentType.includes('text/html');

  // Check if content is XML
  const isXMLContent = typeof contentType === 'string' && contentType.includes('xml');

  // Check if content is Image
  const isImageContent = typeof contentType === 'string' && contentType.startsWith('image/');

  // Check if content is SSE stream
  const isSseContent = typeof contentType === 'string' && contentType.includes('text/event-stream');

  // New SSE frames field from backend
  const availableSseFrames = operation?.response?.event_frames || [];
  const hasEvents =
    (Array.isArray(availableSseFrames) && availableSseFrames.length > 0) || isSseContent;

  // Method to map the editor language
  const getEditorLanguage = (type) => {
    if (!type) return 'json';
    const ct = type.toLowerCase();
    if (ct.includes('json')) return 'json';
    if (ct.includes('html')) return 'html';
    if (ct.includes('xml')) return 'xml';
    if (ct.includes('javascript')) return 'javascript';
    if (ct.includes('css')) return 'css';
    if (ct.includes('yaml') || ct.includes('yml')) return 'yaml';
    if (ct.includes('sql')) return 'sql';
    if (ct.startsWith('text/')) return 'plaintext';
    return 'plaintext';
  };

  // Get Monaco language from type
  const editorLanguage = getEditorLanguage(contentType);

  // Check if can be previewed
  const supportsPreview = isHTMLContent || isImageContent || hasEvents;

  return (
    <div className="flex flex-col h-full">
      {/* Response Headers Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong cursor-pointer"
          onClick={() => setShowResponseHeaders(!showResponseHeaders)}
        >
          Headers ({(operation?.response?.headers ?? []).length})
        </button>
        {showResponseHeaders && (
          <div className="p-0">
            <table className="w-full border-collapse border border-gray-300 dark:border-dark-tremor-border">
              <thead>
                <tr className="bg-gray-100 dark:bg-blue-900/30">
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 w-1/4 text-left font-semibold text-gray-700 dark:text-white">
                    Header
                  </th>
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableRows(operation?.response?.headers ?? [])}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Body Section */}
      <div className="flex flex-col flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow overflow-hidden">
        <div className="flex justify-between items-center bg-gray-200 dark:bg-dark-tremor-background-subtle">
          <button className="p-2 text-left font-bold flex-grow dark:text-dark-tremor-content-strong">
            Response Body
          </button>
          {supportsPreview && (
            <div className="flex space-x-1 mr-2">
              <button
                onClick={() => setViewMode('source')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'source' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                Source
              </button>
              {hasEvents ? (
                <button
                  onClick={() => setViewMode('events')}
                  className={`px-2 py-1 text-xs rounded ${viewMode === 'events' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                >
                  Events
                </button>
              ) : (
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-2 py-1 text-xs rounded ${viewMode === 'preview' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                >
                  Preview
                </button>
              )}
            </div>
          )}
          <CopyButton
            textToCopy={
              isHTMLContent || isImageContent || isSseContent
                ? payload
                : formatPayload(payload, contentType)
            }
          />
        </div>
        {hasEvents && viewMode === 'events' ? (
          <SseFramesViewer frames={availableSseFrames} raw={payload} />
        ) : isSseContent ? (
          viewMode === 'events' ? (
            <SseFramesViewer frames={availableSseFrames} raw={payload} />
          ) : isEmptyPayload ? (
            <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
              No payload
            </div>
          ) : (
            <Editor
              height="100%"
              className="flex-1"
              language="plaintext"
              value={payload}
              theme={getMonacoTheme()}
              beforeMount={defineMonacoThemes}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                automaticLayout: true,
                fontFamily:
                  '"Cascadia Code", "Jetbrains Mono", "Fira Code", "Menlo", "Consolas", monospace',
                tabSize: 2,
                scrollBeyondLastLine: false
              }}
            />
          )
        ) : isEmptyPayload ? (
          <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
            No payload
          </div>
        ) : viewMode === 'preview' && isHTMLContent ? (
          <iframe
            title="HTML Preview"
            srcDoc={payload}
            className="flex-1 w-full h-full border-none"
          />
        ) : viewMode === 'preview' && isImageContent ? (
          <img
            alt="Response Preview"
            src={payload.startsWith('data:') ? payload : `data:${contentType};base64,${payload}`}
            className="flex-1 w-full h-full object-contain"
          />
        ) : (
          <Editor
            height="100%"
            className="flex-1"
            // defaultLanguage="json"
            language={editorLanguage}
            value={formatPayload(payload, contentType)}
            theme={getMonacoTheme()}
            beforeMount={defineMonacoThemes}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              automaticLayout: true,
              fontFamily:
                '"Cascadia Code", "Jetbrains Mono", "Fira Code", "Menlo", "Consolas", monospace',
              tabSize: 2,
              scrollBeyondLastLine: false
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ResponseContent;
