// src/components/RequestContent.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const RequestContent = ({ request }) => {
  const [showQueryParams, setShowQueryParams] = useState(false);
  const [showRequestHeaders, setShowRequestHeaders] = useState(false);

  const renderTableRows = (data) =>
    Object.entries(data || {}).map(([key, value]) => (
      <tr key={key}>
        <td className="border border-slate-200 px-2 py-1 font-mono text-slate-500 text-xs">
          {key}
        </td>
        <td className="border border-slate-200 px-2 py-1 font-mono text-xs">{value}</td>
      </tr>
    ));

  // Check if the request body has content.
  const payload = request.request.payload;
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
          className="w-full p-2 text-left font-bold bg-gray-200"
          onClick={() => setShowQueryParams(!showQueryParams)}
        >
          Query Parameters ({Object.keys(request.request.queryParams || {}).length})
        </button>
        {showQueryParams && (
          <div className="p-0">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-slate-200 px-2 py-1 w-1/4 text-left">Key</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Value</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(request.request.queryParams)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Headers Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200"
          onClick={() => setShowRequestHeaders(!showRequestHeaders)}
        >
          Headers ({Object.keys(request.request.headers || {}).length})
        </button>
        {showRequestHeaders && (
          <div className="p-0">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-slate-200 px-2 py-1 w-1/4 text-left">Header</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Value</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(request.request.headers)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Body Section */}
      <div>
        <button className="w-full p-2 text-left font-bold bg-gray-200">Request Body</button>
        {isEmptyPayload ? (
          <div className="hidden"></div>
        ) : (
          <div className="bg-white rounded-b shadow p-0 h-100">
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
    </div>
  );
};

export default RequestContent;
