// src/components/mcp/ArgumentsTable.jsx

import React from 'react';
import { Text } from '@tremor/react';

const ArgumentsTable = ({ args }) => {
  const entries = Object.entries(args || {});
  if (!entries.length)
    return (
      <Text className="text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
        No arguments provided.
      </Text>
    );
  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-start gap-2 rounded-tremor-small bg-tremor-background-subtle px-2 py-1 text-xs dark:bg-dark-tremor-background-subtle"
        >
          <span className="font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {key}
          </span>
          <span className="flex-1 text-tremor-content dark:text-dark-tremor-content">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ArgumentsTable;
