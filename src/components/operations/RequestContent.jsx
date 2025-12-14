// src/components/operations/RequestContent.jsx
import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import DialogJwt from './DialogJwt.jsx';
import CopyButton from '../CopyButton.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';

// Utility to convert Base64 URL strings to standard Base64.
const base64UrlDecode = (str) => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

// Decodes a JWT token and returns an object with header, payload, and signature.
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(atob(base64UrlDecode(parts[0])));
    const payload = JSON.parse(atob(base64UrlDecode(parts[1])));
    return { header, payload, signature: parts[2] };
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
};

// Checks whether a string looks like a JWT token.

const isJWT = (token) => {
  if (typeof token !== 'string') return false;
  if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  // Regex to match three base64url segments separated by dots.
  const jwtRegex = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
  return jwtRegex.test(token);
};

// ChevronIcon for expand/collapse indication
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

const RequestContent = ({ operation }) => {
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [showRequestHeaders, setShowRequestHeaders] = useState(false);
  const [showRequestBody, setShowRequestBody] = useState(true);
  const headersSectionRef = useRef(null);
  useEffect(() => {
    const open = () => {
      setShowRequestHeaders(true);
      // Scroll to headers section after it expands
      setTimeout(() => {
        headersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    };
    window.addEventListener('inspectr:openRequestHeaders', open);
    return () => window.removeEventListener('inspectr:openRequestHeaders', open);
  }, []);
  const [jwtDialogOpen, setJwtDialogOpen] = useState(false);
  const [jwtDecoded, setJwtDecoded] = useState(null);

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

  // Opens the JWT dialog by decoding the token.
  const handleDecodeJWT = (token) => {
    const tokenValue =
      token.startsWith('Bearer ') || token.startsWith('bearer ') ? token.slice(7).trim() : token;
    const decoded = decodeJWT(tokenValue);
    if (decoded) {
      setJwtDecoded(decoded);
      setJwtDialogOpen(true);
    }
  };

  // Auth header helpers
  const getAuthLabelForHeader = (name, value) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    const compact = lower.replace(/[^a-z]/g, '');
    if (lower === 'authorization') {
      const v = String(value || '').toLowerCase();
      if (v.startsWith('basic')) return 'Basic';
      if (v.startsWith('bearer')) return 'Bearer';
      return 'Auth';
    }
    if (compact.includes('apikey')) return 'API Key';
    if (compact.includes('inspectrauthkey')) return 'Key';
    if (compact.includes('inspectrauthtoken')) return 'Token';
    return null;
  };

  const AuthBadge = ({ label }) => (
    <span className="ml-2 py-0.5 px-1.5 inline-flex items-center gap-x-1 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-md dark:bg-blue-500/10 dark:text-blue-500">
      <svg
        className="shrink-0 h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      {label}
    </span>
  );

  // Render table rows for a given data array.
  // For JWT values, display a Decode button next to the value.
  // When isHeaders=true, show an auth badge next to any auth-related header name.
  const renderTableRows = (data, isHeaders = false) =>
    data.map((row) => {
      const authLabel = isHeaders ? getAuthLabelForHeader(row.name, row.value) : null;
      return (
        <tr key={row.name}>
          <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-slate-500 dark:text-dark-tremor-content text-xs">
            <div className="flex items-center">
              <span>{row.name}</span>
              {authLabel && <AuthBadge label={authLabel} />}
            </div>
          </td>
          <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-xs dark:text-dark-tremor-content">
            <div className="flex flex-wrap items-center">
              <span className="min-w-0 break-all flex-1">{row.value}</span>
              {isJWT(row.value) && (
                <button
                  onClick={() => handleDecodeJWT(row.value)}
                  className="ml-2 p-1 text-blue-500 dark:text-blue-400 text-xs border border-slate-600 dark:border-slate-500 rounded cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <polygon
                      fill="#546e7a"
                      points="21.906,31.772 24.507,29.048 27.107,31.772 27.107,43 21.906,43"
                    />
                    <polygon
                      fill="#f50057"
                      points="17.737,29.058 21.442,28.383 21.945,32.115 15.345,41.199 11.138,38.141"
                    />
                    <polygon
                      fill="#d500f9"
                      points="15.962,24.409 19.355,26.041 17.569,29.356 6.89,32.825 5.283,27.879"
                    />
                    <polygon
                      fill="#29b6f6"
                      points="17.256,19.607 19.042,22.922 15.649,24.554 4.97,21.084 6.577,16.137"
                    />
                    <polygon
                      fill="#00e5ff"
                      points="21.126,16.482 20.623,20.214 16.918,19.539 10.318,10.455 14.526,7.398"
                    />
                    <polygon
                      fill="#546e7a"
                      points="26.094,16.228 23.493,18.952 20.893,16.228 20.893,5 26.094,5"
                    />
                    <polygon
                      fill="#f50057"
                      points="30.262,18.943 26.558,19.618 26.055,15.886 32.654,6.802 36.862,9.859"
                    />
                    <polygon
                      fill="#d500f9"
                      points="32.039,23.59 28.645,21.958 30.431,18.643 41.11,15.174 42.717,20.12"
                    />
                    <polygon
                      fill="#29b6f6"
                      points="30.744,28.393 28.958,25.078 32.351,23.447 43.03,26.916 41.423,31.863"
                    />
                    <polygon
                      fill="#00e5ff"
                      points="26.874,31.518 27.378,27.786 31.082,28.461 37.682,37.545 33.474,40.602"
                    />
                  </svg>
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });

  // Check if the request body has content.
  const payload = operation.request.body;
  const isEmptyPayload =
    !payload ||
    (typeof payload === 'object' && Object.keys(payload).length === 0) ||
    (typeof payload === 'string' && (payload.trim() === '' || payload.trim() === '{}'));

  const formatPayload = (payload) => {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return payload;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Query Parameters Section */}
      <div
        className={`mb-4 border border-slate-200 dark:border-dark-tremor-border ${
          showQueryParams ? 'rounded-tremor-small rounded-b-none' : 'rounded-tremor-small'
        }`}
      >
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong cursor-pointer flex items-center justify-between"
          onClick={() => setShowQueryParams(!showQueryParams)}
          type="button"
        >
          <span>Query Parameters ({(operation?.request?.query_params ?? []).length})</span>
          <ChevronIcon open={showQueryParams} />
        </button>
        {showQueryParams && (
          <div className="p-0 border-t border-tremor-border dark:border-dark-tremor-border">
            <table className="table-fixed w-full border-collapse border border-gray-300 dark:border-dark-tremor-border">
              <thead>
                <tr className="bg-gray-100 dark:bg-blue-900/30">
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 w-1/4 text-sm text-left font-semibold text-gray-700 dark:text-white">
                    Key
                  </th>
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 text-sm text-left font-semibold text-gray-700 dark:text-white">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableRows(operation?.request?.query_params ?? [], false)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Headers Section */}
      <div
        className={`mb-4 border border-slate-200 dark:border-dark-tremor-border ${
          showRequestHeaders ? 'rounded-tremor-small rounded-b-none' : 'rounded-tremor-small'
        }`}
        ref={headersSectionRef}
      >
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong cursor-pointer flex items-center justify-between"
          onClick={() => setShowRequestHeaders(!showRequestHeaders)}
          type="button"
        >
          <span>Headers ({normalizeHeaders(operation?.request?.headers).length})</span>
          <ChevronIcon open={showRequestHeaders} />
        </button>
        {showRequestHeaders && (
          <div className="p-0">
            <table className="table-fixed w-full border-collapse border border-gray-300 dark:border-dark-tremor-border">
              <thead>
                <tr className="bg-gray-100 dark:bg-blue-900/30">
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 w-1/4 text-left text-sm font-semibold text-gray-700 dark:text-white">
                    Header
                  </th>
                  <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 text-left text-sm font-semibold text-gray-700 dark:text-white">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableRows(normalizeHeaders(operation?.request?.headers), true)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Body Section */}
      <div
        className={`${
          showRequestBody ? 'flex flex-col flex-1' : ''
        } mb-4 border border-slate-200 dark:border-dark-tremor-border ${
          showRequestBody ? 'rounded-tremor-small rounded-b-none' : 'rounded-tremor-small'
        } bg-white dark:bg-dark-tremor-background-subtle overflow-hidden`}
      >
        <button
          type="button"
          onClick={() => setShowRequestBody(!showRequestBody)}
          className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong cursor-pointer flex items-center justify-between"
        >
          <span>Request Body</span>
          <span className="flex items-center gap-2">
            <CopyButton textToCopy={formatPayload(payload)} showLabel={true} />
            <ChevronIcon open={showRequestBody} />
          </span>
        </button>

        {showRequestBody ? (
          <div className="border-t border-tremor-border dark:border-dark-tremor-border flex flex-col flex-1">
            {isEmptyPayload ? (
              <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
                No payload
              </div>
            ) : (
              <Editor
                height="100%"
                className="flex-1"
                defaultLanguage="json"
                value={formatPayload(payload)}
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
        ) : null}
      </div>

      {/* JWT Dialog */}
      <DialogJwt
        open={jwtDialogOpen}
        decoded={jwtDecoded}
        onClose={() => {
          setJwtDialogOpen(false);
          setJwtDecoded(null);
        }}
      />
    </div>
  );
};

export default RequestContent;
