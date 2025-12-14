// src/components/mcp/McpOutputCard.jsx

import React from 'react';
import { Card, Text } from '@tremor/react';

const McpOutputCard = ({ title = 'Output', children }) => (
  <Card className="space-y-2 rounded-tremor-small border border-tremor-border p-3 dark:border-dark-tremor-border">
    <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
      {title}
    </Text>
    {children}
  </Card>
);

export default McpOutputCard;
