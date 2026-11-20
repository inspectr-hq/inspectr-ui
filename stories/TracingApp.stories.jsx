import React from 'react';
import TracingApp from '../src/components/tracing/TracingApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { httpOperations } from './fixtures/inspectrFixtures.js';

export default {
  title: 'Apps/Tracing/TracingApp',
  component: TracingApp
};

const traceListResponse = {
  traces: [
    {
      trace_id: 'demo-trace-12345',
      operation_count: 2,
      first_seen: '2025-11-06T21:32:26Z',
      last_seen: '2025-11-06T21:33:14Z',
      sources: ['inspectr-directive']
    },
    {
      trace_id: '6a1b2c3d4e5f6a7b-AMS',
      operation_count: 1,
      first_seen: '2025-11-06T21:32:10Z',
      last_seen: '2025-11-06T21:32:10Z',
      sources: ['cf-ray']
    },
    {
      trace_id: 'xyz-7890',
      operation_count: 2,
      first_seen: '2025-10-29T21:44:40Z',
      last_seen: '2025-10-29T21:45:00Z',
      sources: ['rule:a96e1c4b-3419-4dd2-9c19-a0be3b0dc57f']
    }
  ],
  meta: {
    total: 3,
    page: 1,
    limit: 50,
    total_pages: 1
  },
  links: {
    current: '/api/traces?limit=50&page=1'
  }
};

const traceDetailResponses = {
  'demo-trace-12345': {
    trace: {
      trace_id: 'demo-trace-12345',
      operation_count: 2,
      first_seen: '2025-11-06T21:32:26Z',
      last_seen: '2025-11-06T21:33:14Z',
      sources: ['inspectr-directive']
    },
    operations: [
      {
        version: '1.0',
        operation_id: 'ccd30230-9c8f-452a-9d24-54387387e8dc',
        correlation_id: 'xyz-7890',
        request: {
          method: 'GET',
          url: 'http://localhost:4005/api/cloudflare/trace',
          path: '/api/cloudflare/trace',
          server: 'http://localhost:4005',
          client_ip: '::1',
          http_version: 'HTTP/1.1',
          headers: [
            { name: 'Accept', value: '*/*' },
            { name: 'Accept-Encoding', value: 'gzip, deflate, br' },
            { name: 'Connection', value: 'keep-alive' },
            { name: 'Postman-Token', value: 'edc6fa46-e6f9-4be8-9e7c-2b5cb549252e' },
            { name: 'User-Agent', value: 'PostmanRuntime/7.49.1' }
          ],
          headers_size: 141,
          query_params: null,
          cookies: null,
          body: '{"message":"Simulated Cloudflare trace headers set on response"}',
          body_size: 0,
          timestamp: '2025-11-06T21:32:26.751729Z'
        },
        response: {
          status: 200,
          status_text: 'OK',
          http_version: 'HTTP/1.1',
          headers: [
            { name: 'Alt-Svc', value: 'h3=":443"; ma=86400' },
            { name: 'Cf-Cache-Status', value: 'DYNAMIC' },
            { name: 'Cf-Ray', value: '17f00a66257b28afd804ac8a1eef2-AMS' },
            { name: 'Connection', value: 'keep-alive' },
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Date', value: 'Thu, 06 Nov 2025 21:32:26 GMT' },
            { name: 'Keep-Alive', value: 'timeout=5' },
            {
              name: 'Nel',
              value:
                '{"report_to":"cf-nel","max_age":604800,"success_fraction":0,"failure_fraction":0.01}'
            },
            {
              name: 'Report-To',
              value:
                '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v3"}]}'
            },
            { name: 'Server', value: 'cloudflare' },
            { name: 'Traceparent', value: '00-fdd1015e5c368e6b4f386c29910ad221-49e9782ddb19bbbf-01' },
            { name: 'Tracestate', value: 'cf=trace' }
          ],
          headers_size: 481,
          cookies: null,
          body: '{"message":"Simulated Cloudflare trace headers set on response","headers":{"cf-ray":"17f00a66257b28afd804ac8a1eef2-AMS","cf-cache-status":"DYNAMIC","server":"cloudflare","traceparent":"00-fdd1015e5c368e6b4f386c29910ad221-49e9782ddb19bbbf-01","tracestate":"cf=trace"}}',
          body_size: 267,
          timestamp: '2025-11-06T22:32:26.756322+01:00'
        },
        timing: {
          request: '2025-11-06T21:32:26.751729Z',
          response: '2025-11-06T22:32:26.756322+01:00',
          duration: 4
        },
        meta: {
          proxy: {
            instance: 'localhost:8080',
            url: 'http://localhost:8080/api/cloudflare/trace'
          },
          ingress: {
            headers: {
              'Cf-Ray': '6a1b2c3d4e5f6a7b-AMS'
            }
          },
          inspectr: {
            directives: {
              'inspectr-trace-id': 'demo-trace-12345'
            }
          },
          trace: {
            trace_id: 'demo-trace-12345',
            source: 'inspectr-directive',
            generic: {
              'cf-ray': '6a1b2c3d4e5f6a7b-AMS'
            }
          }
        }
      },
      {
        version: '1.0',
        operation_id: 'e069e143-0af7-4f6c-974b-7aa344f38907',
        correlation_id: 'xyz-7890',
        request: {
          method: 'GET',
          url: 'http://localhost:4005/api/cloudflare/trace',
          path: '/api/cloudflare/trace',
          server: 'http://localhost:4005',
          client_ip: '::1',
          http_version: 'HTTP/1.1',
          headers: [
            { name: 'Accept', value: '*/*' },
            { name: 'Accept-Encoding', value: 'gzip, deflate, br' },
            { name: 'Connection', value: 'keep-alive' },
            { name: 'Postman-Token', value: 'a7afa6de-ba4e-47c7-b985-803541f2099b' },
            { name: 'User-Agent', value: 'PostmanRuntime/7.49.1' }
          ],
          headers_size: 141,
          query_params: null,
          cookies: null,
          body: '',
          body_size: 0,
          timestamp: '2025-11-06T21:33:14.38258Z'
        },
        response: {
          status: 200,
          status_text: 'OK',
          http_version: 'HTTP/1.1',
          headers: [
            { name: 'Alt-Svc', value: 'h3=":443"; ma=86400' },
            { name: 'Cf-Cache-Status', value: 'DYNAMIC' },
            { name: 'Cf-Ray', value: 'e64a1e28beecbee7d240fbb4e095b-AMS' },
            { name: 'Connection', value: 'keep-alive' },
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Date', value: 'Thu, 06 Nov 2025 21:33:14 GMT' },
            { name: 'Keep-Alive', value: 'timeout=5' },
            {
              name: 'Nel',
              value:
                '{"report_to":"cf-nel","max_age":604800,"success_fraction":0,"failure_fraction":0.01}'
            },
            {
              name: 'Report-To',
              value:
                '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v3"}]}'
            },
            { name: 'Server', value: 'cloudflare' },
            { name: 'Traceparent', value: '00-a4a597313fb39a895c1bce12cc66c708-02f0da65433b7cf2-01' },
            { name: 'Tracestate', value: 'cf=trace' }
          ],
          headers_size: 481,
          cookies: null,
          body: '{"message":"Simulated Cloudflare trace headers set on response","headers":{"cf-ray":"e64a1e28beecbee7d240fbb4e095b-AMS","cf-cache-status":"DYNAMIC","server":"cloudflare","traceparent":"00-a4a597313fb39a895c1bce12cc66c708-02f0da65433b7cf2-01","tracestate":"cf=trace"}}',
          body_size: 267,
          timestamp: '2025-11-06T22:33:14.390486+01:00'
        },
        timing: {
          request: '2025-11-06T21:33:14.38258Z',
          response: '2025-11-06T22:33:14.390486+01:00',
          duration: 7
        },
        meta: {
          proxy: {
            instance: 'localhost:8080',
            url: 'http://localhost:8080/api/cloudflare/trace'
          },
          ingress: {
            headers: {
              'Cf-Ray': '6a1b2c3d4e5f6a7b-AMS'
            }
          },
          inspectr: {
            directives: {
              'inspectr-trace-id': 'demo-trace-12345'
            }
          },
          trace: {
            trace_id: 'demo-trace-12345',
            source: 'inspectr-directive',
            generic: {
              'cf-ray': '6a1b2c3d4e5f6a7b-AMS'
            }
          }
        }
      }
    ],
    meta: {
      total: 2,
      page: 1,
      limit: 50,
      total_pages: 1
    },
    links: {
      current: '/api/traces/demo-trace-12345?limit=50&page=1'
    }
  }
};

const mcpTraceId = 'mcp-inventory-demo';
const mcpTimestamp = '2026-01-15T12:00:00.000Z';
const mcpTraceOperations = [
  {
    version: '1.0',
    operation_id: 'mcp-inventory-initialize',
    correlation_id: mcpTraceId,
    request: {
      method: 'POST',
      url: 'https://mcp.acme.test/mcp',
      path: '/mcp',
      server: 'mcp.acme.test',
      timestamp: mcpTimestamp,
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'Inspectr', version: '1.9.3' }
        }
      })
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: 'Acme Inventory MCP', version: '2.4.0' }
        }
      }),
      timestamp: mcpTimestamp
    },
    timing: { duration: 18 },
    meta: {
      mcp: { method: 'initialize', category: 'session' },
      trace: { trace_id: mcpTraceId, source: 'mcp' }
    }
  },
  {
    version: '1.0',
    operation_id: 'mcp-inventory-tools-list',
    correlation_id: mcpTraceId,
    request: {
      method: 'POST',
      url: 'https://mcp.acme.test/mcp',
      path: '/mcp',
      server: 'mcp.acme.test',
      timestamp: '2026-01-15T12:00:00.120Z',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'lookup_inventory',
              description: 'Check available and reserved stock for a SKU in a warehouse.',
              inputSchema: {
                type: 'object',
                properties: {
                  sku: { type: 'string', description: 'Product SKU to look up' },
                  warehouse: { type: 'string', description: 'Warehouse code' }
                },
                required: ['sku', 'warehouse']
              }
            }
          ]
        }
      }),
      timestamp: '2026-01-15T12:00:00.142Z'
    },
    timing: { duration: 22 },
    meta: {
      mcp: { method: 'tools/list', category: 'tool' },
      trace: { trace_id: mcpTraceId, source: 'mcp' }
    }
  },
  {
    ...httpOperations[3],
    operation_id: 'mcp-inventory-tool-call',
    correlation_id: mcpTraceId,
    request: {
      ...httpOperations[3].request,
      url: 'https://mcp.acme.test/mcp',
      path: '/mcp',
      server: 'mcp.acme.test',
      timestamp: '2026-01-15T12:00:00.350Z',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'lookup_inventory', arguments: { sku: 'linen-shirt', warehouse: 'eu-west' } }
      })
    },
    response: {
      ...httpOperations[3].response,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [{ type: 'text', text: '18 units available, 3 reserved.' }],
          structuredContent: { sku: 'linen-shirt', warehouse: 'eu-west', available: 18, reserved: 3 }
        }
      }),
      timestamp: '2026-01-15T12:00:00.591Z'
    },
    timing: { duration: 241 },
    meta: {
      ...httpOperations[3].meta,
      mcp: {
        category: 'tool',
        method: 'tools/call',
        name: 'lookup_inventory',
        tokens: { request: 48, response: 32 }
      },
      trace: { trace_id: mcpTraceId, source: 'mcp' }
    }
  }
];

const mcpTraceSummary = {
  trace_id: mcpTraceId,
  operation_count: mcpTraceOperations.length,
  first_seen: mcpTimestamp,
  last_seen: '2026-01-15T12:00:00.591Z',
  sources: ['mcp']
};

const mcpTraceListResponse = {
  traces: [mcpTraceSummary],
  meta: { total: 1, page: 1, limit: 50, total_pages: 1 },
  links: { current: '/api/traces?limit=50&page=1' }
};

const mcpTraceDetailResponses = {
  [mcpTraceId]: {
    trace: mcpTraceSummary,
    operations: mcpTraceOperations,
    meta: { total: mcpTraceOperations.length, page: 1, limit: 50, total_pages: 1 },
    links: { current: `/api/traces/${mcpTraceId}?limit=50&page=1` }
  }
};

const largeTraceId = 'trace-high-volume-75';
const largeTraceOperations = Array.from({ length: 75 }, (_, index) => {
  const source = httpOperations[index % httpOperations.length];
  const operationId = `trace-operation-${String(index + 1).padStart(3, '0')}`;
  const timestamp = new Date(Date.UTC(2026, 0, 15, 12, index)).toISOString();

  return {
    ...source,
    version: '1.0',
    id: operationId,
    operation_id: operationId,
    correlation_id: largeTraceId,
    request: { ...source.request, timestamp },
    response: { ...source.response, timestamp },
    meta: {
      ...source.meta,
      trace: { trace_id: largeTraceId, source: 'inspectr-directive' }
    }
  };
});

const largeTraceSummary = {
  trace_id: largeTraceId,
  operation_count: largeTraceOperations.length,
  first_seen: largeTraceOperations[0].request.timestamp,
  last_seen: largeTraceOperations.at(-1).request.timestamp,
  sources: ['inspectr-directive']
};

const largeTraceListResponse = {
  traces: [largeTraceSummary],
  meta: { total: 1, page: 1, limit: 50, total_pages: 1 },
  links: { current: '/api/traces?limit=50&page=1' }
};

const largeTraceDetailResponses = {
  [largeTraceId]: {
    trace: largeTraceSummary,
    operations: largeTraceOperations,
    meta: { total: largeTraceOperations.length, page: 1, limit: 100, total_pages: 1 },
    links: { current: `/api/traces/${largeTraceId}?limit=100&page=1` }
  }
};

const createMockClient = ({
  listResponse = traceListResponse,
  detailResponses = traceDetailResponses,
  listDelay = 50,
  detailDelay = 50,
  listError,
  detailError
} = {}) => ({
  traces: {
    list: async (options = {}) => {
      if (listDelay) {
        await new Promise((resolve) => setTimeout(resolve, listDelay));
      }
      if (listError) {
        throw listError;
      }
      return listResponse;
    },
    get: async (traceId, options = {}) => {
      if (detailDelay) {
        await new Promise((resolve) => setTimeout(resolve, detailDelay));
      }
      if (detailError) {
        throw detailError;
      }
      if (detailResponses && detailResponses[traceId]) {
        return detailResponses[traceId];
      }
      const summaries = listResponse?.traces || [];
      const summary = summaries.find((trace) => trace.trace_id === traceId);
      const safeTrace = summary || {
        trace_id: traceId,
        operation_count: 0,
        first_seen: null,
        last_seen: null,
        sources: []
      };
      return {
        trace: safeTrace,
        operations: [],
        meta: {
          total: 0,
          page: 1,
          limit: 50,
          total_pages: 1
        },
        links: {
          current: `/api/traces/${traceId}?limit=50&page=1`
        }
      };
    }
  }
});

const MockProvider = ({ client, children }) => (
  <InspectrContext.Provider value={{ client }}>{children}</InspectrContext.Provider>
);

export const Default = () => (
  <MockProvider client={createMockClient()}>
    <TracingApp route={{ params: {} }} />
  </MockProvider>
);

export const Empty = () => (
  <MockProvider
    client={createMockClient({
      listResponse: {
        traces: [],
        meta: { total: 0, page: 1, limit: 50, total_pages: 1 },
        links: { current: '/api/traces?limit=50&page=1' }
      },
      detailDelay: 0
    })}
  >
    <TracingApp route={{ params: {} }} />
  </MockProvider>
);

export const Loading = () => (
  <MockProvider
    client={createMockClient({
      listDelay: 30000,
      detailDelay: 0
    })}
  >
    <TracingApp route={{ params: {} }} />
  </MockProvider>
);

export const ListError = () => (
  <MockProvider
    client={createMockClient({
      listError: new Error('Trace list failed (500)'),
      detailDelay: 0
    })}
  >
    <TracingApp route={{ params: {} }} />
  </MockProvider>
);

export const McpOperations = () => (
  <MockProvider
    client={createMockClient({
      listResponse: mcpTraceListResponse,
      detailResponses: mcpTraceDetailResponses,
      listDelay: 0,
      detailDelay: 0
    })}
  >
    <TracingApp route={{ params: { trace: mcpTraceId, operation: 'mcp-inventory-tool-call' } }} />
  </MockProvider>
);

export const LargeTrace = () => (
  <MockProvider
    client={createMockClient({
      listResponse: largeTraceListResponse,
      detailResponses: largeTraceDetailResponses,
      listDelay: 0,
      detailDelay: 0
    })}
  >
    <TracingApp route={{ params: { trace: largeTraceId } }} />
  </MockProvider>
);
