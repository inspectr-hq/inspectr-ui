// src/components/mcp/ToolCard.jsx

import React from 'react';
import { Badge, Card, Text } from '@tremor/react';
import { summarizeSchema } from '../../utils/mcp.js';
import CollapsibleSection from './CollapsibleSection.jsx';

const renderBadge = (condition, label, color = 'slate') =>
  condition ? (
    <Badge color={color} size="xs">
      {label}
    </Badge>
  ) : null;

const JsonPre = ({ value }) => (
  <pre className="max-h-100 overflow-auto whitespace-pre-wrap px-3 py-2 text-xs text-tremor-content dark:text-dark-tremor-content">
    {value}
  </pre>
);

const ToolCard = ({ tool }) => {
  const { total, required } = summarizeSchema(tool.inputSchema);
  const outputSummary = summarizeSchema(tool.outputSchema);
  const props = Object.entries(tool.inputSchema?.properties || {});
  const requiredList = new Set(tool.inputSchema?.required || []);
  const hasOutputSchema = Boolean(tool.outputSchema && typeof tool.outputSchema === 'object');
  const outputSchemaText = hasOutputSchema ? JSON.stringify(tool.outputSchema, null, 2) : '';
  const metadata = tool._meta || tool.metadata;
  const hasMetadata = Boolean(metadata && typeof metadata === 'object');
  const metadataText = hasMetadata ? JSON.stringify(metadata, null, 2) : '';

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

      {hasOutputSchema ? (
        <CollapsibleSection
          title="Output schema"
          defaultOpen={false}
          copyText={outputSchemaText}
          copyShowLabel={false}
          className="bg-white dark:bg-dark-tremor-background"
          contentClassName="p-0"
          headerRight={
            outputSummary.total ? (
              <Badge color="slate" size="xs">
                {outputSummary.total} fields
                {outputSummary.required ? ` (${outputSummary.required} required)` : ''}
              </Badge>
            ) : null
          }
        >
          <JsonPre value={outputSchemaText} />
        </CollapsibleSection>
      ) : null}

      {hasMetadata ? (
        <CollapsibleSection
          title="Metadata"
          defaultOpen={false}
          copyText={metadataText}
          copyShowLabel={false}
          className="bg-white dark:bg-dark-tremor-background"
          contentClassName="p-0"
          headerRight={
            <Badge color="slate" size="xs">
              {Object.keys(metadata).length} keys
            </Badge>
          }
        >
          <JsonPre value={metadataText} />
        </CollapsibleSection>
      ) : null}
    </Card>
  );
};

export default ToolCard;
