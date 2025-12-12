// src/components/mcp/StructuredBlock.jsx

import React from 'react';

import CopyButton from '../CopyButton.jsx';

const StructuredBlock = ({ data, title, copyText }) => {
  const textValue = copyText || JSON.stringify(data, null, 2);

  return (
    <div className="rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border">
      {title ? (
        <div className="flex items-center justify-between border-b border-tremor-border px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
            {title}
          </div>
          <CopyButton textToCopy={textValue} showLabel={true} />
        </div>
      ) : (
        <div className="flex justify-end border-b border-tremor-border px-3 py-2">
          <CopyButton textToCopy={textValue} showLabel={true} />
        </div>
      )}
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs text-tremor-content dark:text-dark-tremor-content">
        {textValue}
      </pre>
    </div>
  );
};

export default StructuredBlock;
