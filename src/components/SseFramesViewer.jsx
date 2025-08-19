// src/components/SseFramesViewer.jsx
import React from 'react';
import { parseSseStream } from '../utils/sse.js';

/**
 * Visualise Server-Sent Event frames in a simple table.
 * @param {{frames?: Array, raw?: string}} props
 */
const SseFramesViewer = ({ frames, raw }) => {
  const items = frames && frames.length ? frames : parseSseStream(raw);
  if (!items.length) {
    return <div className="p-4">No event frames</div>;
  }

  const renderTimestamp = (frame) => {
    const ts = frame.timestamp ?? frame.time;
    if (!ts) return '';
    return typeof ts === 'number' ? new Date(ts).toISOString() : ts;
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
        <thead>
          <tr className="bg-gray-100 dark:bg-dark-tremor-background-subtle">
            <th className="border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white w-1/6">
              ID
            </th>
            <th className="border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white w-1/6">
              Type
            </th>
            <th className="border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white">
              Data
            </th>
            <th className="border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white w-1/4">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((f, i) => (
            <tr key={i} className="align-top">
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
                {f.data || ''}
              </td>
              <td className="border px-2 py-1 font-mono text-xs text-slate-500 dark:text-dark-tremor-content">
                {renderTimestamp(f)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SseFramesViewer;
