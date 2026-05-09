import React from 'react';
import ToolCard from '../src/components/mcp/ToolCard.jsx';

export default {
  title: 'Components/MCP/ToolCard',
  component: ToolCard
};

const toolsListResponse = {
  jsonrpc: '2.0',
  id: 1,
  result: {
    tools: [
      {
        name: 'inspectr_get_operation',
        title: 'Get operation',
        description: 'Fetch one captured operation by id.',
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true
        },
        _meta: {
          source: 'inspectr',
          category: 'operations',
          version: '2026-05-09'
        },
        inputSchema: {
          type: 'object',
          properties: {
            operation_id: {
              type: 'string',
              description: 'Operation UUID to retrieve.'
            },
            include_body: {
              type: 'boolean',
              description: 'Include captured request and response bodies.'
            }
          },
          required: ['operation_id']
        },
        outputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'object',
              description: 'Captured operation details.',
              properties: {
                id: { type: 'string' },
                method: { type: 'string' },
                status: { type: 'integer' }
              },
              required: ['id', 'method']
            }
          },
          required: ['operation']
        }
      },
      {
        name: 'inspectr_delete_operation',
        description: 'Delete one captured operation from local storage.',
        annotations: {
          title: 'Delete operation',
          destructiveHint: true
        },
        metadata: {
          confirmationRequired: true,
          auditEvent: 'operation.deleted'
        },
        inputSchema: {
          type: 'object',
          properties: {
            operation_id: {
              type: 'string',
              description: 'Operation UUID to delete.'
            }
          },
          required: ['operation_id']
        },
        outputSchema: {
          type: 'object',
          properties: {
            deleted: {
              type: 'boolean',
              description: 'Whether the operation was deleted.'
            }
          },
          required: ['deleted']
        }
      },
      {
        name: 'inspectr_list_operations',
        title: 'List operations',
        description: 'Search captured operations by method and status.',
        annotations: {
          readOnlyHint: true
        },
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'HTTP method filter.'
            },
            limit: {
              type: 'integer',
              description: 'Maximum operations to return.'
            }
          }
        }
      }
    ]
  }
};

export const ToolsListWithOutputSchema = () => (
  <div className="max-w-3xl space-y-2 p-4">
    {toolsListResponse.result.tools.map((tool) => (
      <ToolCard key={tool.name} tool={tool} />
    ))}
  </div>
);
