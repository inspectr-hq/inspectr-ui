// src/components/mcp/StructuredBlock.jsx

import React from 'react';

const StructuredBlock = ({ data, title }) => (
  <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
    {title ? (
      <div className="border-b border-tremor-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        {title}
      </div>
    ) : null}
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs text-tremor-content dark:text-dark-tremor-content">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export default StructuredBlock;
