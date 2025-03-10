// src/components/ResponseContent.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const ResponseContent = ({ operation }) => {
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);

  const renderTableRows = (data) =>
    data.map((row) => (
      <tr key={row.name}>
        <td className="border border-slate-200 px-2 py-1 font-mono text-slate-500 text-xs">
          {row.name}
        </td>
        <td className="border border-slate-200 px-2 py-1 font-mono text-xs">
          <div className="flex flex-wrap items-center">
            <span className="min-w-0 break-all flex-1">{row.value}</span>
          </div>
        </td>
      </tr>
    ));

  // Check if the response body has content.
  const payload = operation.response.body;
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
      {/* Response Headers Section */}
      <div className="mb-4">
        <button
          className="w-full p-2 text-left font-bold bg-gray-200"
          onClick={() => setShowResponseHeaders(!showResponseHeaders)}
        >
          Headers ({(operation?.request?.headers ?? []).length})
        </button>
        {showResponseHeaders && (
          <div className="p-0">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-slate-200 px-2 py-1 w-1/4 text-left">Header</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Value</th>
                </tr>
              </thead>
              <tbody>{renderTableRows((operation?.request?.headers ?? []))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Body Section */}
      <div>
        <button className="w-full p-2 text-left font-bold bg-gray-200">Response Body</button>
        {isEmptyPayload ? (
          <div className="p-4 bg-white rounded-b shadow">No payload</div>
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

export default ResponseContent;
