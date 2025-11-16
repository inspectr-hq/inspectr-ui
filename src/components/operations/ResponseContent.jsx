// src/components/operations/ResponseContent.jsx
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import CopyButton from '../CopyButton.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import { formatXML } from '../../utils/formatXml.js';
import SseFramesViewer from './SseFramesViewer.jsx';

// Decode base64 payloads in a browser-safe way so Source view can show raw bytes
const decodeBase64ToBinaryString = (value) => {
  if (typeof value !== 'string' || value.trim() === '') return '';
  const trimmed = value.trim();

  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
      return globalThis.atob(trimmed);
    }
  } catch {
    // Ignore decode errors and try Buffer fallback
  }

  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(trimmed, 'base64').toString('binary');
    }
  } catch {
    // Ignore—no usable fallback in this environment
  }

  return '';
};

// Convert binary string to Uint8Array for Blob downloads
const binaryStringToUint8Array = (binaryString) => {
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i) & 0xff;
  }
  return bytes;
};

const ResponseContent = ({ operation }) => {
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);
  const [viewMode, setViewMode] = useState('source');
  const currentOperationId = operation?.id;

  const normalizeHeaders = (headers) => {
    if (!headers) return [];
    if (Array.isArray(headers)) {
      return headers.map((h) => ({ name: h.name ?? h.key ?? '', value: h.value }));
    }
    if (typeof headers === 'object') {
      if ('name' in headers && 'value' in headers) {
        return [{ name: headers.name, value: headers.value }];
      }
      return Object.entries(headers).map(([name, value]) => ({ name, value }));
    }
    return [];
  };

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

  // Raw response payload provided by backend (may be base64-encoded)
  const responseBody =
    typeof operation?.response?.body === 'string' ? operation.response.body : undefined;
  const responseBodyEncoding = operation?.response?.body_encoding;
  const normalizedBodyEncoding =
    typeof responseBodyEncoding === 'string' ? responseBodyEncoding.toLowerCase() : 'utf8';

  // We only treat the payload as base64 when backend marks it explicitly
  const isBase64Body = normalizedBodyEncoding === 'base64';

  // Source view uses decoded bytes, preview uses the body as delivered
  const decodedPayload =
    isBase64Body && typeof responseBody === 'string'
      ? decodeBase64ToBinaryString(responseBody)
      : responseBody;
  const sourcePayload =
    typeof decodedPayload === 'string' && decodedPayload !== '' ? decodedPayload : responseBody;
  const previewPayload = responseBody;
  const isEmptySourcePayload =
    !sourcePayload ||
    (typeof sourcePayload === 'object' && Object.keys(sourcePayload).length === 0) ||
    (typeof sourcePayload === 'string' &&
      (sourcePayload.trim() === '' || sourcePayload.trim() === '{}'));

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
    const hdrs = normalizeHeaders(operation?.response?.headers);
    const raw = hdrs.find(
      (h) => h.name?.toLowerCase() === 'content-type' || h.key?.toLowerCase() === 'content-type'
    )?.value;
    return typeof raw === 'string' ? raw.split(';')[0].trim() : undefined;
  };

  // Detect content type
  const contentType = getContentType();
  const normalizedContentType = contentType || 'application/octet-stream';

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
  // Auto-switch preview on for image/binary payloads so users don't stare at gibberish
  const isLikelyBinaryContent = isImageContent || isBase64Body;
  const shouldDefaultToPreview = supportsPreview && isLikelyBinaryContent;

  useEffect(() => {
    if (!currentOperationId) return;
    setViewMode(shouldDefaultToPreview ? 'preview' : 'source');
  }, [currentOperationId, shouldDefaultToPreview]);
  // Ensure we only try rendering when we actually have binary-safe data in hand
  const previewPayloadString = typeof previewPayload === 'string' ? previewPayload : '';
  const trimmedPreviewPayload = previewPayloadString.trim();
  const imagePreviewSrc =
    isImageContent && trimmedPreviewPayload
      ? trimmedPreviewPayload.startsWith('data:')
        ? previewPayloadString
        : isBase64Body
          ? `data:${normalizedContentType};base64,${previewPayloadString}`
          : `data:${normalizedContentType};charset=utf-8,${encodeURIComponent(previewPayloadString)}`
      : '';

  const getDownloadFilename = () => {
    const hdrs = normalizeHeaders(operation?.response?.headers);
    const disposition = hdrs.find(
      (h) =>
        h.name?.toLowerCase() === 'content-disposition' ||
        h.key?.toLowerCase() === 'content-disposition'
    )?.value;

    if (typeof disposition === 'string') {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        try {
          return decodeURIComponent(utf8Match[1]);
        } catch {
          return utf8Match[1];
        }
      }
      const simpleMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      if (simpleMatch && simpleMatch[1]) {
        return simpleMatch[1];
      }
    }

    const idPart = operation?.id ? String(operation.id) : Date.now().toString();
    return `operation-response-${idPart}`;
  };

  const getDownloadBlob = () => {
    if (typeof responseBody !== 'string' || responseBody === '') {
      return null;
    }

    if (isBase64Body) {
      const binaryString = decodeBase64ToBinaryString(responseBody);
      if (!binaryString) return null;
      const bytes = binaryStringToUint8Array(binaryString);
      return new Blob([bytes], { type: normalizedContentType });
    }

    return new Blob([responseBody], { type: `${normalizedContentType};charset=utf-8` });
  };

  const handleDownloadResponse = () => {
    if (typeof document === 'undefined') return;
    const blob = getDownloadBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const filename = getDownloadFilename();
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const shouldShowDownloadButton =
    !supportsPreview && typeof responseBody === 'string' && responseBody.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Response Headers Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong cursor-pointer"
          onClick={() => setShowResponseHeaders(!showResponseHeaders)}
        >
          Headers ({normalizeHeaders(operation?.response?.headers).length})
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
              <tbody>{renderTableRows(normalizeHeaders(operation?.response?.headers))}</tbody>
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
          <div className="flex items-center space-x-2 mr-2">
            {supportsPreview && (
              <div className="flex space-x-1">
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
            {shouldShowDownloadButton && (
              <button
                onClick={handleDownloadResponse}
                className="px-2 py-1 text-xs rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Download
              </button>
            )}
            <CopyButton
              textToCopy={
                (isHTMLContent || isImageContent || isSseContent
                  ? (sourcePayload ?? '')
                  : formatPayload(sourcePayload, contentType)) ?? ''
              }
            />
          </div>
        </div>
        {hasEvents && viewMode === 'events' ? (
          <SseFramesViewer frames={availableSseFrames} raw={sourcePayload ?? ''} />
        ) : isSseContent ? (
          viewMode === 'events' ? (
            <SseFramesViewer frames={availableSseFrames} raw={sourcePayload ?? ''} />
          ) : isEmptySourcePayload ? (
            <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
              No payload
            </div>
          ) : (
            <Editor
              height="100%"
              className="flex-1"
              language="plaintext"
              value={sourcePayload ?? ''}
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
        ) : isEmptySourcePayload ? (
          <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
            No payload
          </div>
        ) : viewMode === 'preview' && isHTMLContent ? (
          <iframe
            title="HTML Preview"
            srcDoc={sourcePayload ?? ''}
            className="flex-1 w-full h-full border-none"
          />
        ) : viewMode === 'preview' && isImageContent ? (
          imagePreviewSrc ? (
            <div className="flex-1 w-full h-full overflow-auto bg-white dark:bg-dark-tremor-background-subtle">
              <img alt="Response Preview" src={imagePreviewSrc} className="max-w-none" />
            </div>
          ) : (
            <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
              Unable to render image preview
            </div>
          )
        ) : (
          <Editor
            height="100%"
            className="flex-1"
            // defaultLanguage="json"
            language={editorLanguage}
            value={formatPayload(sourcePayload, contentType) ?? ''}
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
