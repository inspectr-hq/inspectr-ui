// stories/RequestDetailsPanel.stories.jsx
import React from 'react';
import RequestDetailsPanel from '../src/components/operations/RequestDetailsPanel.jsx';

export default {
  title: 'Components/Operations/RequestDetailsPanel',
  component: RequestDetailsPanel
};

export const DefaultPanel = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'POST',
        url: 'http://localhost:3000/api/create',
        path: '/api/create',
        query_params: [{ name: 'search', value: 'test' }],
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        status: 201,
        status_text: 'OK',
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { name: 'X-Test', value: 'Header' },
        timestamp: new Date()
      },
      timing: {
        duration: 123
      }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const ResponseTab = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'POST',
        url: 'http://localhost:3000/api/create',
        path: '/api/create',
        query_params: [{ name: 'search', value: 'test' }],
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        status: 201,
        status_text: 'OK',
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { name: 'X-Test', value: 'Header' },
        timestamp: new Date()
      },
      timing: {
        duration: 123
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const ImportedMcpOperation = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-mcp-op',
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
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        body: JSON.stringify(
          {
            jsonrpc: '2.0',
            id: 21,
            result: {
              tools: [
                {
                  name: 'inspectr_get_operation',
                  title: 'Get operation',
                  description: 'Fetch one captured operation by id.'
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
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        timestamp: new Date()
      },
      timing: {
        duration: 123
      },
      meta: {
        protocol: 'mcp',
        trace: {
          source: 'mcp'
        },
        mcp: {
          method: 'tools/list',
          name: 'List tools',
          category: 'tools'
        }
      }
    }}
    currentTab="mcp"
    setCurrentTab={() => {}}
  />
);

export const SseResponseBasic = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/stream',
        path: '/stream',
        headers: [{ name: 'Accept', value: 'text/event-stream' }],
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
        event_frames: [
          { event: 'message', data: 'hello' },
          { event: 'update', data: '{"count":1}' }
        ],
        body:
          'event: message\n' +
          'data: hello\n\n' +
          'event: update\n' +
          'data: {"count":1}\n\n'
      },
      timing: {
        duration: 123
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const SseResponse = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/stream',
        path: '/stream',
        headers: [{ name: 'Accept', value: 'text/event-stream' }],
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
        event_frames: [
          {
            event: 'comment',
            data: 'connected 2025-08-18T20:16:22.116Z',
            timestamp: '2025-08-18T20:16:22.200694Z'
          },
          {
            id: 'evt-1',
            event: 'tick',
            data: '{"idx":1,"kind":"sse","now":"2025-08-18T20:16:25.324Z","payload":"world"}',
            timestamp: '2025-08-18T20:16:25.325942Z'
          },
          {
            id: 'evt-2',
            event: 'tick',
            data: '{"idx":2,"kind":"sse","now":"2025-08-18T20:16:28.325Z","payload":"world"}',
            timestamp: '2025-08-18T20:16:28.325979Z'
          },
          {
            id: 'evt-3',
            event: 'tick',
            data: JSON.stringify(
              {
                idx: 3,
                kind: 'sse',
                now: '2025-08-18T20:16:31.326Z',
                payload: 'world',
                session: {
                  id: '6a8b582f94b041ffb119081a2fc57af6',
                  correlation_id: 'xyz-7890',
                  protocol: 'mcp'
                },
                request: {
                  method: 'POST',
                  path: '/mcp',
                  headers: {
                    accept: 'application/json, text/event-stream',
                    content_type: 'application/json'
                  },
                  body: {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list',
                    params: {}
                  }
                },
                result: {
                  tools: [
                    {
                      name: 'search_tags',
                      title: 'Search Tags',
                      description:
                        'Find or list TrendMiner tags by name or equipment identifier.',
                      inputSchema: {
                        type: 'object',
                        required: ['name'],
                        properties: {
                          name: { type: 'string', minLength: 3, maxLength: 200 },
                          page: { type: 'integer', minimum: 1, default: 1 },
                          page_size: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 100,
                            default: 20
                          }
                        }
                      }
                    },
                    {
                      name: 'navigate_asset_hierarchy',
                      title: 'Navigate Asset Hierarchy',
                      description: 'Retrieve TrendMiner asset structure and linked tags.'
                    }
                  ],
                  pagination: {
                    page: 1,
                    page_size: 20,
                    total: 2,
                    has_more: false
                  }
                },
                timing: {
                  request_ts: '2026-05-06T16:19:44.945014Z',
                  response_ts: '2026-05-06T16:19:45.030249Z',
                  duration_ms: 85
                }
              },
              null,
              0
            ),
            timestamp: '2025-08-18T20:16:31.327409Z'
          },
          {
            event: 'comment',
            data: 'heartbeat 2025-08-18T20:16:32.322Z',
            timestamp: '2025-08-18T20:16:32.323023Z'
          },
          {
            id: 'evt-4',
            event: 'tick',
            data: '{"idx":4,"kind":"sse","now":"2025-08-18T20:16:34.328Z","payload":"world"}',
            timestamp: '2025-08-18T20:16:34.328782Z'
          },
          {
            id: 'evt-5',
            event: 'tick',
            data: '{"idx":5,"kind":"sse","now":"2025-08-18T20:16:37.329Z","payload":"world"}',
            timestamp: '2025-08-18T20:16:37.330934Z'
          }
        ],
        body:
          ': connected 2025-08-18T20:16:22.116Z\n' +
          '\n' +
          'id: evt-1\n' +
          'event: tick\n' +
          'data: {"idx":1,"kind":"sse","now":"2025-08-18T20:16:25.324Z","payload":"world"}\n' +
          '\n' +
          'id: evt-2\n' +
          'event: tick\n' +
          'data: {"idx":2,"kind":"sse","now":"2025-08-18T20:16:28.325Z","payload":"world"}\n' +
          '\n' +
          'id: evt-3\n' +
          'event: tick\n' +
          'data: {"idx":3,"kind":"sse","now":"2025-08-18T20:16:31.326Z","payload":"world"}\n' +
          '\n' +
          ': heartbeat 2025-08-18T20:16:32.322Z\n' +
          '\n' +
          'id: evt-4\n' +
          'event: tick\n' +
          'data: {"idx":4,"kind":"sse","now":"2025-08-18T20:16:34.328Z","payload":"world"}\n' +
          '\n' +
          'id: evt-5\n' +
          'event: tick\n' +
          'data: {"idx":5,"kind":"sse","now":"2025-08-18T20:16:37.329Z","payload":"world"}\n\n'
      },
      timing: {
        duration: 123
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const SseSingleJsonDefaultsToJson = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'POST',
        url: 'http://localhost:8765/mcp',
        path: '/mcp',
        headers: [{ name: 'Accept', value: 'application/json, text/event-stream' }],
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
        event_frames: [
          {
            event: 'message',
            data: '{"jsonrpc":"2.0","id":1,"result":{"ok":true,"name":"demo"}}',
            timestamp: '2026-05-09T11:41:01.120Z'
          }
        ],
        body:
          'event: message\n' +
          'data: {"jsonrpc":"2.0","id":1,"result":{"ok":true,"name":"demo"}}\n\n'
      },
      timing: {
        duration: 85
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const SseSingleJsonMcpDefaultsToJson = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'POST',
        url: 'http://localhost:8765/mcp',
        path: '/mcp',
        headers: [{ name: 'Accept', value: 'application/json, text/event-stream' }],
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
        event_frames: [
          {
            event: 'message',
            data: '{"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"search_tags"}]}}',
            timestamp: '2026-05-09T11:41:02.100Z'
          }
        ],
        body:
          'event: message\n' +
          'data: {"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"search_tags"}]}}\n\n'
      },
      meta: {
        mcp: {
          method: 'tools/list',
          category: 'tool'
        }
      },
      timing: {
        duration: 85
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const SseMultiFrameStaysEvents = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/stream',
        path: '/stream',
        headers: [{ name: 'Accept', value: 'text/event-stream' }],
        timestamp: new Date()
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: [{ name: 'Content-Type', value: 'text/event-stream' }],
        event_frames: [
          { event: 'message', data: '{"step":1}', timestamp: '2026-05-09T11:42:01.100Z' },
          { event: 'message', data: '{"step":2}', timestamp: '2026-05-09T11:42:02.100Z' }
        ],
        body: 'event: message\ndata: {"step":1}\n\nevent: message\ndata: {"step":2}\n\n'
      },
      timing: {
        duration: 123
      }
    }}
    currentTab="response"
    setCurrentTab={() => {}}
  />
);

export const NoOperation = () => (
  <RequestDetailsPanel operation={null} currentTab="request" setCurrentTab={() => {}} />
);

export const InfoTab = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'POST',
        url: 'http://localhost:3000/api/create',
        path: '/api/create',
        query_params: [{ name: 'search', value: 'test' }],
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        status: 201,
        status_text: 'OK',
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { name: 'X-Test', value: 'Header' },
        timestamp: new Date()
      },
      timing: {
        duration: 123
      },
      meta: {
        inspectr: {
          guard: { 'inspectr-auth-token': 'secret-token' },
          directives: { 'inspectr-response-status': '503' }
        }
      }
    }}
    currentTab="meta"
    setCurrentTab={() => {}}
  />
);

// Authentication indicator examples
export const AuthToken = () => {
  const [tab, setTab] = React.useState('request');
  return (
    <RequestDetailsPanel
      operation={{
        id: 'story-op',
        request: {
          method: 'GET',
          url: 'http://localhost:3000/api/secure',
          path: '/api/secure',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          timestamp: new Date()
        },
        response: { status: 200, status_text: 'OK' },
        timing: { duration: 42 },
        meta: { inspectr: { guard: { 'inspectr-auth-token': 'secret-token' } } }
      }}
      currentTab={tab}
      setCurrentTab={setTab}
    />
  );
};
AuthToken.storyName = 'Guard Token';

export const AuthKey = () => {
  const [tab, setTab] = React.useState('request');
  return (
    <RequestDetailsPanel
      operation={{
        id: 'story-op',
        request: {
          method: 'GET',
          url: 'http://localhost:3000/api/secure',
          path: '/api/secure',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          timestamp: new Date()
        },
        response: { status: 200, status_text: 'OK' },
        timing: { duration: 42 },
        meta: { inspectr: { guard: { 'inspectr-auth-key': 'key-123' } } }
      }}
      currentTab={tab}
      setCurrentTab={setTab}
    />
  );
};
AuthKey.storyName = 'Guard Key';

export const ApiKeyHeader = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/secure',
        path: '/api/secure',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-API-Key', value: 'abc123' }
        ],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const ApiKeyHeaderVariants = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/secure',
        path: '/api/secure',
        headers: [
          { name: 'apikey', value: 'abc123' },
          { name: 'API_Key', value: 'abc123' },
          { name: 'XApiKey', value: 'abc123' }
        ],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const BasicAuthHeader = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/secure',
        path: '/api/secure',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Authorization', value: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' }
        ],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const BearerAuthHeader = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/secure',
        path: '/api/secure',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' }
        ],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const OtherAuthHeader = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/secure',
        path: '/api/secure',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Authorization', value: 'Digest username="Mufasa", realm="test"' }
        ],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);

export const NoAuth = () => (
  <RequestDetailsPanel
    operation={{
      id: 'story-op',
      request: {
        method: 'GET',
        url: 'http://localhost:3000/api/public',
        path: '/api/public',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        timestamp: new Date()
      },
      response: { status: 200, status_text: 'OK' },
      timing: { duration: 42 }
    }}
    currentTab="request"
    setCurrentTab={() => {}}
  />
);
