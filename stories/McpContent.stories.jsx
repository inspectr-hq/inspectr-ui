import React from 'react';
import McpContent from '../src/components/operations/McpContent.jsx';

export default {
  title: 'Components/MCP/McpContent',
  component: McpContent
};

const toolsListRequest = {
  jsonrpc: '2.0',
  id: 21,
  method: 'tools/list',
  params: {}
};

const toolsListResponse = {
  jsonrpc: '2.0',
  id: 21,
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
              description: 'Operation UUID to retrieve.',
              format: 'uuid',
              pattern: '^[0-9a-f-]{36}$'
            },
            include_body: {
              type: 'boolean',
              description: 'Include captured request and response bodies.',
              default: false
            },
            response_projection: {
              type: 'string',
              description:
                'Selects which nested response fields should be returned for detailed inspection, including headers, timing information, tags, matched rules, and decoded MCP metadata.',
              enum: ['summary', 'full', 'debug']
            }
          },
          required: ['operation_id', 'response_projection']
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
      }
    ]
  }
};

const toolsCallRequest = {
  jsonrpc: '2.0',
  id: 22,
  method: 'tools/call',
  params: {
    name: 'inspectr_get_operation',
    arguments: {
      operation_id: '304a86f6-79d0-4c58-a1bb-7db03d878231',
      include_body: true,
      response_projection: 'full'
    }
  }
};

const toolsCallResponse = {
  jsonrpc: '2.0',
  id: 22,
  result: {
    structuredContent: {
      operation: {
        id: '304a86f6-79d0-4c58-a1bb-7db03d878231',
        method: 'POST',
        path: '/mcp',
        status: 200
      }
    },
    content: [
      {
        type: 'text',
        text: 'Captured operation 304a86f6-79d0-4c58-a1bb-7db03d878231 returned 200.'
      }
    ]
  }
};

const makeOperation = ({ method, name, requestBody, responseBody, tokens }) => ({
  status: 200,
  request: {
    method: 'POST',
    url: 'http://localhost:4567/mcp',
    path: '/mcp',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify(requestBody, null, 2),
    timestamp: new Date('2026-05-09T09:00:00.000Z')
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify(responseBody, null, 2),
    timestamp: new Date('2026-05-09T09:00:01.000Z')
  },
  timing: {
    duration: 84
  },
  meta: {
    mcp: {
      method,
      name,
      category: 'tools',
      tokens
    }
  }
});

const toolsListOperation = makeOperation({
  method: 'tools/list',
  name: 'List tools',
  requestBody: toolsListRequest,
  responseBody: toolsListResponse,
  tokens: {
    request: 48,
    response: 1284,
    total: 1332
  }
});

const toolsCallOperation = makeOperation({
  method: 'tools/call',
  name: 'inspectr_get_operation',
  requestBody: toolsCallRequest,
  responseBody: toolsCallResponse,
  tokens: {
    request: 174,
    response: 286,
    total: 460
  }
});

const importedToolsCallOperation = {
  ...toolsCallOperation,
  request: {
    ...toolsCallOperation.request,
    body: JSON.stringify(
      {
        method: 'tools/call',
        params: {
          name: 'deep_dataset_analysis',
          arguments: {
            dataset_handle: '1784f25f-fbb4-49f1-b2ff-8666fc88769c',
            sql_query: 'SELECT * FROM data LIMIT 5'
          }
        },
        jsonrpc: '2.0',
        id: 6
      },
      null,
      2
    )
  },
  response: {
    ...toolsCallOperation.response,
    body: JSON.stringify(
      {
        jsonrpc: '2.0',
        id: 6,
        result: {
          content: [
            {
              type: 'text',
              text: '{"dataset_handle":"1784f25f-fbb4-49f1-b2ff-8666fc88769c","row_count":27}'
            }
          ],
          structuredContent: {
            dataset_handle: '1784f25f-fbb4-49f1-b2ff-8666fc88769c',
            row_count: 27
          }
        }
      },
      null,
      2
    )
  },
  meta: {
    protocol: 'mcp',
    trace: {
      source: 'mcp'
    },
    mcp: {
      method: 'tools/call',
      name: 'deep_dataset_analysis',
      category: 'tool',
      tokens: {
        request: 178,
        response: 3333,
        total: 3511
      }
    }
  }
};

const importedToolsListOperation = {
  ...toolsListOperation,
  meta: {
    protocol: 'mcp',
    trace: {
      source: 'mcp'
    },
    mcp: {
      method: 'tools/list',
      name: 'List tools',
      category: 'tools',
      tokens: {
        request: 48,
        response: 1284,
        total: 1332
      }
    }
  }
};

const plainArrayToolsListOperation = makeOperation({
  method: 'tools/list',
  name: 'List tools',
  requestBody: toolsListRequest,
  responseBody: [
    {
      name: 'inspectr_get_operation',
      title: 'Get operation',
      description: 'Fetch one captured operation by id.',
      inputSchema: {
        type: 'object',
        properties: {
          operation_id: {
            type: 'string',
            description: 'Operation UUID to retrieve.'
          }
        },
        required: ['operation_id']
      }
    },
    {
      name: 'inspectr_delete_operation',
      title: 'Delete operation',
      description: 'Delete one captured operation from local storage.'
    }
  ],
  tokens: {
    request: 48,
    response: 512,
    total: 560
  }
});

const rawFallbackToolsListOperation = makeOperation({
  method: 'tools/list',
  name: 'List tools',
  requestBody: toolsListRequest,
  responseBody: {
    jsonrpc: '2.0',
    id: 21,
    result: {
      count: 2,
      note: 'This payload does not expose a tools array.'
    }
  },
  tokens: {
    request: 48,
    response: 88,
    total: 136
  }
});

const promptsListRequest = {
  jsonrpc: '2.0',
  id: 31,
  method: 'prompts/list',
  params: {}
};

const promptsListOperation = makeOperation({
  method: 'prompts/list',
  name: 'List prompts',
  requestBody: promptsListRequest,
  responseBody: [
    {
      name: 'summarize_request',
      title: 'Summarize request',
      description: 'Produce a short summary from a captured request.'
    },
    {
      name: 'explain_trace',
      title: 'Explain trace',
      description: 'Generate a readable explanation for a trace.'
    }
  ],
  tokens: {
    request: 36,
    response: 274,
    total: 310
  }
});

const resourcesListRequest = {
  jsonrpc: '2.0',
  id: 41,
  method: 'resources/list',
  params: {}
};

const resourcesListOperation = makeOperation({
  method: 'resources/list',
  name: 'List resources',
  requestBody: resourcesListRequest,
  responseBody: [
    {
      uri: 'inspectr://operations/1',
      name: 'Recent operation',
      title: 'Recent operation',
      description: 'A captured operation available through import/export.',
      mimeType: 'application/json'
    },
    {
      uri: 'inspectr://operations/2',
      name: 'Recent trace',
      title: 'Recent trace',
      description: 'A captured trace resource.',
      mimeType: 'application/json'
    }
  ],
  tokens: {
    request: 36,
    response: 312,
    total: 348
  }
});

export const ToolsListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={toolsListOperation} />
  </div>
);

export const ImportedToolsListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={importedToolsListOperation} />
  </div>
);

export const PlainArrayToolsListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={plainArrayToolsListOperation} />
  </div>
);

export const RawFallbackToolsListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={rawFallbackToolsListOperation} />
  </div>
);

export const PromptsListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={promptsListOperation} />
  </div>
);

export const ResourcesListOperation = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={resourcesListOperation} />
  </div>
);

export const ToolsCallStructuredOutput = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={toolsCallOperation} />
  </div>
);

export const ImportedToolsCallStructuredOutput = () => (
  <div className="max-w-4xl p-4">
    <McpContent operation={importedToolsCallOperation} />
  </div>
);
