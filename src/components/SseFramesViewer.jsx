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
  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse border border-slate-200 dark:border-dark-tremor-border">
        <thead>
          <tr className="bg-gray-100 dark:bg-dark-tremor-background-subtle">
            <th className="border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white w-1/6">
              Id
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
              <td className="border px-2 py-1 font-mono text-xs text-slate-500 dark:text-dark-tremor-content">
                {f.event || ''}
              </td>
              <td className="border px-2 py-1 font-mono text-xs whitespace-pre-wrap break-all dark:text-dark-tremor-content">
                {f.data || ''}
              </td>
              <td className="border px-2 py-1 font-mono text-xs text-slate-500 dark:text-dark-tremor-content">
                {f.timestamp
                  ? typeof f.timestamp === 'number'
                    ? new Date(f.timestamp).toISOString()
                    : f.timestamp
                  : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SseFramesViewer;
