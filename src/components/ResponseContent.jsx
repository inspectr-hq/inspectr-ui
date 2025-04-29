// src/components/ResponseContent.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import CopyButton from './CopyButton.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../utils/monacoTheme.js';

const ResponseContent = ({ operation }) => {
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);

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
          <CopyButton textToCopy={formatPayload(payload)} />
        </div>
        {isEmptyPayload ? (
          <div className="p-4 flex-1 bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow dark:text-dark-tremor-content">
            No payload
          </div>
        ) : (
          // <div className="bg-white dark:bg-dark-tremor-background-subtle rounded-b shadow dark:shadow-dark-tremor-shadow p-0">
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
          // </div>
        )}
      </div>
    </div>
  );
};

export default ResponseContent;
