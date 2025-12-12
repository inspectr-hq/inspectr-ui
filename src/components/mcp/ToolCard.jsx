// src/components/mcp/ToolCard.jsx

import React from 'react';
import { Badge, Card, Text } from '@tremor/react';
import { summarizeSchema } from '../../utils/mcp.js';

const renderBadge = (condition, label, color = 'slate') =>
  condition ? (
    <Badge color={color} size="xs">
      {label}
    </Badge>
  ) : null;

const ToolCard = ({ tool }) => {
  const { total, required } = summarizeSchema(tool.inputSchema);
  const props = Object.entries(tool.inputSchema?.properties || {});
  const requiredList = new Set(tool.inputSchema?.required || []);

  return (
    <Card className="space-y-2 rounded-tremor-small border border-tremor-border p-3 shadow-sm dark:border-dark-tremor-border">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Text className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {tool.title || tool.annotations?.title || tool.name}
          </Text>
          {tool.description ? (
            <Text className="mt-0.5 text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              {tool.description}
            </Text>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {renderBadge(tool.annotations?.readOnlyHint, 'Read-only', 'blue')}
          {renderBadge(
            tool.annotations?.destructiveHint && !tool.annotations?.readOnlyHint,
            'Destructive',
            'rose'
          )}
          {renderBadge(tool.annotations?.idempotentHint, 'Idempotent', 'emerald')}
          {renderBadge(tool.annotations?.openWorldHint, 'Open world', 'amber')}
          {total ? (
            <Badge color="slate" size="xs">
              {total} params{required ? ` (${required} required)` : ''}
            </Badge>
          ) : (
            <Badge color="slate" size="xs">
              No params
            </Badge>
          )}
        </div>
      </div>

      {props.length ? (
        <div className="space-y-1">
          {props.map(([name, schema]) => (
            <div
              key={name}
              className="flex items-start gap-2 rounded-tremor-small bg-tremor-background-subtle px-2 py-1 dark:bg-dark-tremor-background-subtle"
            >
              <div className="font-mono text-xs text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {name}
              </div>
              <div className="flex-1 text-[11px] text-tremor-content dark:text-dark-tremor-content">
                {schema?.type ? `${schema.type}` : 'any'}
                {schema?.description ? ` — ${schema.description}` : ''}
              </div>
              {requiredList.has(name) ? (
                <Badge color="rose" size="xs">
                  required
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
};

export default ToolCard;
