// src/components/SseFramesViewer.jsx
import React from 'react';
import Editor from '@monaco-editor/react';
import { parseSseStream } from '../utils/sse.js';
import { defineMonacoThemes, getMonacoTheme } from '../utils/monacoTheme.js';

/**
 * Visualize Server-Sent Event frames in a simple table.
 * @param {{frames?: Array, raw?: string}} props
 */
const SseFramesViewer = ({ frames, raw }) => {
  const items = React.useMemo(
    () => (frames && frames.length ? frames : parseSseStream(raw)),
    [frames, raw]
  );

  const [showJson, setShowJson] = React.useState({});
  const [sortKey, setSortKey] = React.useState(null); // 'id' | 'type' | 'data' | 'time'
  const [sortDir, setSortDir] = React.useState('asc'); // 'asc' | 'desc'

  const getTs = (frame) => {
    const ts = frame.timestamp ?? frame.time;
    if (ts == null) return 0;
    if (typeof ts === 'number') return ts;
    const n = Number(ts);
    if (!Number.isNaN(n)) return n;
    const d = new Date(ts).getTime();
    return Number.isNaN(d) ? 0 : d;
  };

  const compareStr = (a, b) => String(a || '').localeCompare(String(b || ''));

  const sortedItems = React.useMemo(() => {
    if (!sortKey) return items;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id') cmp = compareStr(a.id, b.id);
      else if (sortKey === 'type') cmp = compareStr(a.event, b.event);
      else if (sortKey === 'data') cmp = compareStr(a.data, b.data);
      else if (sortKey === 'time') cmp = getTs(a) - getTs(b);
      return cmp * dir;
    });
  }, [items, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      // third click resets sorting
      setSortKey(null);
      setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };
  if (!items || !items.length) {
    return <div className="p-4">No event frames</div>;
  }

  const parseJson = (data) => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const renderTimestamp = (frame) => {
    const ts = frame.timestamp ?? frame.time;
    if (!ts) return '';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return typeof ts === 'string' ? ts : '';
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
      date.getMilliseconds(),
      3
    )}`;
  };

  const badgeClasses = (type) => {
    if (!type) return '';
    if (type === 'comment') {
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
    const palette = [
      'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200',
      'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200',
      'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
      'bg-pink-200 text-pink-800 dark:bg-pink-700 dark:text-pink-200'
    ];
    const hash = [...type].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse border border-slate-200 dark:border-dark-tremor-border">
        {/* Control column widths: Time gets a tight 12ch */}
        <colgroup>
          <col className="w-1/6" /> {/* ID */}
          <col className="w-1/6" /> {/* Type */}
          <col /> {/* Data grows */}
          <col className="w-[12ch]" /> {/* Time */}
        </colgroup>

        <thead>
          <tr className="bg-gray-100 dark:bg-dark-tremor-background-subtle">
            <th
              className="sticky top-0 z-10 border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white bg-gray-100 dark:bg-dark-tremor-background-subtle cursor-pointer select-none"
              onClick={() => handleSort('id')}
              aria-sort={
                sortKey === 'id' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <span className="inline-flex items-center gap-1">
                ID {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </span>
            </th>
            <th
              className="sticky top-0 z-10 border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white bg-gray-100 dark:bg-dark-tremor-background-subtle cursor-pointer select-none"
              onClick={() => handleSort('type')}
              aria-sort={
                sortKey === 'type' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <span className="inline-flex items-center gap-1">
                Type {sortKey === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </span>
            </th>
            <th
              className="sticky top-0 z-10 border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white bg-gray-100 dark:bg-dark-tremor-background-subtle cursor-pointer select-none"
              onClick={() => handleSort('data')}
              aria-sort={
                sortKey === 'data' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <span className="inline-flex items-center gap-1">
                Data {sortKey === 'data' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </span>
            </th>
            <th
              className="sticky top-0 z-10 border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white bg-gray-100 dark:bg-dark-tremor-background-subtle whitespace-nowrap cursor-pointer select-none"
              onClick={() => handleSort('time')}
              aria-sort={
                sortKey === 'time' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <span className="inline-flex items-center gap-1">
                Time {sortKey === 'time' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedItems.map((f, i) => {
            const key = f.id ?? i; // stable key for toggle state
            const json = parseJson(f.data);
            const isOpen = !!showJson[key];

            return (
              <React.Fragment key={key}>
                {/* Main row */}
                <tr className="align-top">
                  <td className="border px-2 py-1 font-mono text-xs text-slate-500 dark:text-dark-tremor-content">
                    {f.id || ''}
                  </td>
                  <td className="border px-2 py-1">
                    {f.event ? (
                      <span
                        className={`inline-flex items-center rounded px-2.5 py-0.5 font-mono text-xs font-medium ${badgeClasses(
                          f.event
                        )}`}
                      >
                        {f.event}
                      </span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="border px-2 py-1 font-mono text-xs whitespace-pre-wrap break-all dark:text-dark-tremor-content">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 break-all whitespace-pre-wrap">{f.data}</div>
                      {json && (
                        <button
                          className="self-start px-2 py-1 text-xs rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          title={isOpen ? 'Hide formatted JSON' : 'Show formatted JSON'}
                          aria-expanded={isOpen}
                          onClick={() => setShowJson((prev) => ({ ...prev, [key]: !prev[key] }))}
                        >
                          {isOpen ? 'Hide' : 'Preview'}
                        </button>
                      )}
                    </div>
                  </td>
                  {/* Time column */}
                  <td className="border px-2 py-1 font-mono text-xs text-slate-500 dark:text-dark-tremor-content whitespace-nowrap w-[12ch]">
                    {renderTimestamp(f)}
                  </td>
                </tr>

                {/* Expandable JSON row (full width) */}
                {json && isOpen && (
                  <tr>
                    <td
                      className="border px-2 py-2 bg-slate-50 dark:bg-dark-tremor-background-subtle"
                      colSpan={4}
                    >
                      <Editor
                        height="260px"
                        language="json"
                        value={JSON.stringify(json, null, 2)}
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
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SseFramesViewer;
