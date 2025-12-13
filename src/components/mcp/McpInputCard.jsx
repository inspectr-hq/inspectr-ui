// src/components/mcp/McpInputCard.jsx

import React from 'react';
import { Card, Text } from '@tremor/react';

const McpInputCard = ({ title = 'Input', validation, children }) => (
  <Card className="space-y-2 rounded-tremor-small border border-tremor-border p-3 dark:border-dark-tremor-border">
    <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
      {title}
    </Text>
    {children}
    {validation && (validation.missing?.length || validation.extra?.length) ? (
      <div className="space-y-1 text-[11px] text-amber-700 dark:text-amber-200">
        {validation.missing?.length ? (
          <div>Missing required: {validation.missing.join(', ')}</div>
        ) : null}
        {validation.extra?.length ? <div>Unknown fields: {validation.extra.join(', ')}</div> : null}
      </div>
    ) : null}
  </Card>
);

export default McpInputCard;
