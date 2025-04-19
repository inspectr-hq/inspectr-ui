// src/components/RequestContent.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import DialogJwt from './DialogJwt.jsx';
import CopyButton from './CopyButton.jsx';

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

const RequestContent = ({ operation }) => {
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [showRequestHeaders, setShowRequestHeaders] = useState(false);
  const [jwtDialogOpen, setJwtDialogOpen] = useState(false);
  const [jwtDecoded, setJwtDecoded] = useState(null);

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

  // Render table rows for a given data object.
  // For JWT values, display a Decode button next to the value.
  const renderTableRows = (data) =>
    data.map((row) => (
      <tr key={row.name}>
        <td className="border border-slate-200 px-2 py-1 font-mono text-slate-500 text-xs">
          {row.name}
        </td>
        <td className="border border-slate-200 px-2 py-1 font-mono text-xs">
          <div className="flex flex-wrap items-center">
            <span className="min-w-0 break-all flex-1">{row.value}</span>
            {isJWT(row.value) && (
              <button
                onClick={() => handleDecodeJWT(row.value)}
                className="ml-2 p-1 text-blue-500 text-xs border border-slate-600 rounded cursor-pointer"
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
    ));

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
    <div>
      {/* Query Parameters Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 cursor-pointer"
          onClick={() => setShowQueryParams(!showQueryParams)}
        >
          Query Parameters ({(operation?.request?.query_params ?? []).length})
        </button>
        {showQueryParams && (
          <div className="p-0">
            <table className="table-fixed w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-slate-200 px-2 py-1 w-1/4 text-left">Key</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Value</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(operation?.request?.query_params ?? [])}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Headers Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200 cursor-pointer"
          onClick={() => setShowRequestHeaders(!showRequestHeaders)}
        >
          Headers ({(operation?.request?.headers ?? []).length})
        </button>
        {showRequestHeaders && (
          <div className="p-0">
            <table className="table-fixed w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-slate-200 px-2 py-1 w-1/4 text-left">Header</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Value</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(operation?.request?.headers ?? [])}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Body Section */}
      <div>
        <div className="flex justify-between items-center bg-gray-200">
          <button className="p-2 text-left font-bold flex-grow">Request Body</button>
          <CopyButton textToCopy={formatPayload(payload)} />
        </div>
        {isEmptyPayload ? (
          <div className="p-4 bg-white rounded-b shadow">No payload</div>
        ) : (
          <div className="bg-white rounded-b shadow p-0 h-[400px]">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={formatPayload(payload)}
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
          </div>
        )}
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
