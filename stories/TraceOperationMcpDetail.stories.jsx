import React from 'react';
import TraceOperationMcpDetail from '../src/components/tracing/TraceOperationMcpDetail.jsx';

export default {
  title: 'Components/Tracing/TraceOperationMcpDetail',
  component: TraceOperationMcpDetail
};

const importedToolsListOperation = {
  id: 'trace-mcp-op',
  method: 'POST',
  path: '/mcp',
  url: 'http://localhost:3000/mcp',
  host: 'localhost:3000',
  status: 200,
  duration: 84,
  request: {
    method: 'POST',
    url: 'http://localhost:3000/mcp',
    path: '/mcp',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify(
      {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/list',
        params: {}
      },
      null,
      '\t'
    ),
    timestamp: new Date('2026-05-09T09:00:00.000Z')
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify(
      {
        jsonrpc: '2.0',
        id: 21,
        result: {
          tools: [
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
          ]
        }
      },
      null,
      '\t'
    ),
    timestamp: new Date('2026-05-09T09:00:01.000Z')
  },
  timing: {
    duration: 84
  },
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

export const ImportedToolsList = () => <TraceOperationMcpDetail operation={importedToolsListOperation} />;

const importedToolsCallOperation = {
  id: 'trace-mcp-call-op',
  method: 'POST',
  path: '/mcp',
  url: 'http://localhost:8765/mcp',
  host: 'localhost:8765',
  status: 200,
  duration: 31,
  request: {
    method: 'POST',
    url: 'http://localhost:8765/mcp',
    path: '/mcp',
    headers: [{ name: 'Content-Type', value: 'application/json' }],
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
    ),
    timestamp: new Date('2026-06-12T15:13:58.006Z')
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
    body:
      'event: message\n' +
      'data: {"jsonrpc":"2.0","id":6,"result":{"content":[{"type":"text","text":"{\\"dataset_handle\\":\\"1784f25f-fbb4-49f1-b2ff-8666fc88769c\\",\\"row_count\\":27}"}],"structuredContent":{"dataset_handle":"1784f25f-fbb4-49f1-b2ff-8666fc88769c","row_count":27}}}\n\n',
    event_frames: [
      {
        event: 'message',
        data: JSON.stringify(
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
      }
    ],
    timestamp: new Date('2026-06-12T15:13:58.038Z')
  },
  timing: {
    duration: 31
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

export const ImportedToolsCall = () => (
  <TraceOperationMcpDetail operation={importedToolsCallOperation} />
);
