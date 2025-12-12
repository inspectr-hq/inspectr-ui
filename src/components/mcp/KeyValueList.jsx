// src/components/mcp/KeyValueList.jsx

import React from 'react';

const KeyValueList = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="space-y-1 text-xs text-tremor-content dark:text-dark-tremor-content">
      {items.map((item, idx) => {
        if (!item) return null;
        const { label, value } = item;
        if (value === undefined || value === null || value === '') return null;
        return (
          <div key={`${label}-${idx}`} className="flex items-start gap-2">
            <span className="font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {label}
            </span>
            <span className="flex-1 break-words">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default KeyValueList;
