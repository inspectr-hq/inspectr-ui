const fixedTime = (minutesAgo = 0) =>
  new Date(Date.UTC(2026, 0, 15, 12, -minutesAgo)).toISOString();

export {
  mockActionsCatalog as rulesActions,
  mockEvents as ruleEvents,
  mockOperatorCatalog as ruleOperators,
  mockRuleTemplateGroups as ruleTemplateGroups,
  mockRuleTemplates as ruleTemplates,
  mockOperationTags as ruleTags,
  mockRules as rules
} from '../rulesMocks.js';

export const httpOperations = [
  {
    id: 'op-checkout-created',
    request: {
      method: 'POST',
      url: 'https://api.acme.test/v1/checkouts',
      path: '/v1/checkouts',
      server: 'api.acme.test',
      timestamp: fixedTime(12),
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({
        cart_id: 'cart_1042',
        currency: 'EUR',
        items: [{ sku: 'linen-shirt', quantity: 2 }]
      })
    },
    response: {
      status: 201,
      status_text: 'Created',
      body: JSON.stringify({ id: 'chk_8f31', status: 'pending' })
    },
    timing: { duration: 184 },
    meta: { tags: ['env:staging', 'team:checkout'] }
  },
  {
    id: 'op-inventory-timeout',
    request: {
      method: 'GET',
      url: 'https://inventory.acme.test/v2/stock?sku=linen-shirt&warehouse=eu-west',
      path: '/v2/stock',
      server: 'inventory.acme.test',
      query_params: [
        { name: 'sku', value: 'linen-shirt' },
        { name: 'warehouse', value: 'eu-west' }
      ],
      timestamp: fixedTime(8),
      headers: [{ name: 'Accept', value: 'application/json' }]
    },
    response: {
      status: 504,
      status_text: 'Gateway Timeout',
      body: JSON.stringify({ error: 'upstream_timeout', retryable: true })
    },
    timing: { duration: 3024 },
    meta: { tags: ['env:production', 'team:inventory'] }
  },
  {
    id: 'op-payment-webhook',
    request: {
      method: 'POST',
      url: 'https://hooks.acme.test/webhooks/payments',
      path: '/webhooks/payments',
      server: 'hooks.acme.test',
      timestamp: fixedTime(4),
      headers: [
        { name: 'X-Webhook-Event', value: 'payment.succeeded' },
        { name: 'Content-Type', value: 'application/json' }
      ],
      body: JSON.stringify({
        event: 'payment.succeeded',
        payment_id: 'pay_24cd',
        amount: 8490,
        currency: 'EUR'
      })
    },
    response: { status: 202, status_text: 'Accepted', body: JSON.stringify({ received: true }) },
    timing: { duration: 93 },
    meta: { tags: ['env:production', 'source:webhook'] }
  },
  {
    id: 'op-mcp-inventory',
    request: {
      method: 'POST',
      url: 'http://localhost:8080/mcp/tools/call',
      path: '/mcp/tools/call',
      server: 'localhost:8080',
      timestamp: fixedTime(2),
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({
        name: 'lookup_inventory',
        arguments: { sku: 'linen-shirt', region: 'eu-west' }
      })
    },
    response: {
      status: 200,
      status_text: 'OK',
      body: JSON.stringify({ available: 18, reserved: 3 })
    },
    timing: { duration: 241 },
    meta: {
      tags: ['mcp.category.tool', 'mcp.tool.lookup_inventory'],
      mcp: { category: 'tool', tool_name: 'lookup_inventory' }
    }
  }
];

export const largeWorkspaceOperations = Array.from({ length: 100 }, (_, index) => {
  const source = httpOperations[index % httpOperations.length];
  const sequence = index + 1;
  const id = `op-volume-${String(sequence).padStart(3, '0')}`;

  return {
    ...source,
    id,
    operation_id: id,
    request: {
      ...source.request,
      timestamp: fixedTime(index)
    },
    meta: {
      ...source.meta,
      ...(index === 0
        ? { trace: { trace_id: 'trace-checkout-batch-01', source: 'inspectr-directive' } }
        : {})
    }
  };
});

export const analyticsSummary = {
  totals: { totalOperations: 1842, totalEndpoints: 12, errorCount: 37, averageDuration: 186 },
  summaries: [
    {
      method: 'POST',
      path: '/v1/checkouts',
      host: 'api.acme.test',
      count: 624,
      successRate: 97.4,
      averageDuration: 184,
      p95Duration: 412,
      latestStatus: 201
    },
    {
      method: 'GET',
      path: '/v2/stock',
      host: 'inventory.acme.test',
      count: 508,
      successRate: 91.1,
      averageDuration: 236,
      p95Duration: 3024,
      latestStatus: 504
    },
    {
      method: 'POST',
      path: '/webhooks/payments',
      host: 'hooks.acme.test',
      count: 346,
      successRate: 99.7,
      averageDuration: 93,
      p95Duration: 188,
      latestStatus: 202
    }
  ]
};

export const analyticsSeries = {
  series: [
    { ts: fixedTime(45), duration: 172 },
    { ts: fixedTime(30), duration: 194 },
    { ts: fixedTime(15), duration: 181 },
    { ts: fixedTime(0), duration: 186 }
  ]
};

export const createInsightsClient = ({ mode = 'populated', delay = 0 } = {}) => {
  const wait = async (value) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (mode === 'error') throw new Error('Analytics service unavailable');
    return value;
  };
  const summaries = mode === 'empty' ? [] : analyticsSummary.summaries;
  return {
    operations: {
      summarize: () =>
        wait({
          totals:
            mode === 'empty'
              ? { totalOperations: 0, totalEndpoints: 0, errorCount: 0, averageDuration: 0 }
              : analyticsSummary.totals,
          summaries
        }),
      getSeries: () => wait(mode === 'empty' ? { series: [] } : analyticsSeries),
      listCompact: () =>
        wait({
          operations: mode === 'empty' ? [] : insightsOperations,
          meta: {
            page: 1,
            total: mode === 'empty' ? 0 : insightsOperations.length,
            total_pages: 1
          }
        })
    }
  };
};

export const insightsOperations = httpOperations.map((operation) => ({
  id: operation.id,
  method: operation.request.method,
  url: operation.request.url,
  server: operation.request.server,
  path: operation.request.path,
  time: operation.request.timestamp,
  status_code: operation.response.status,
  duration: operation.timing.duration,
  tags: operation.meta.tags
}));

export const createDashboardClient = ({ mode = 'populated', delay = 0 } = {}) => {
  const wait = async (value) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (mode === 'error') throw new Error('Statistics service unavailable');
    return value;
  };
  const empty = mode === 'empty';
  const buckets = empty ? [] : [
    {
      timestamp: '2026-01-15T09:00:00Z',
      requests: 142,
      series: { '2xx': 134, '3xx': 2, '4xx': 4, '5xx': 2 },
      avg_ms: 178,
      min_ms: 22,
      max_ms: 940,
      p50_ms: 112,
      p90_ms: 310,
      p95_ms: 412,
      p99_ms: 802
    },
    {
      timestamp: '2026-01-15T10:00:00Z',
      requests: 186,
      series: { '2xx': 172, '3xx': 3, '4xx': 7, '5xx': 4 },
      avg_ms: 193,
      min_ms: 19,
      max_ms: 1240,
      p50_ms: 124,
      p90_ms: 342,
      p95_ms: 486,
      p99_ms: 1010
    },
    {
      timestamp: '2026-01-15T11:00:00Z',
      requests: 221,
      series: { '2xx': 208, '3xx': 2, '4xx': 8, '5xx': 3 },
      avg_ms: 181,
      min_ms: 18,
      max_ms: 990,
      p50_ms: 117,
      p90_ms: 326,
      p95_ms: 431,
      p99_ms: 870
    }
  ];
  const rows = empty ? [] : [
    { path: '/v1/checkouts', count: 624, p95_ms: 412 },
    { path: '/v2/stock', count: 508, p95_ms: 3024 },
    { path: '/webhooks/payments', count: 346, p95_ms: 188 }
  ];
  return {
    stats: {
      getOverview: () =>
        wait({
          data: {
            total_requests: empty ? 0 : 1842,
            average_response_time: empty ? 0 : 186,
            average_errors: empty ? 0 : 37,
            success_rate: empty ? 0 : 0.98,
            error_rate: empty ? 0 : 0.02
          }
        }),
      getBuckets: () => wait({ data: buckets }),
      aggregateBy: (dimension, options = {}) => {
        let aggregateRows = rows;
        if (dimension === 'method') {
          aggregateRows = empty
            ? []
            : [
                { method: 'GET', count: 872 },
                { method: 'POST', count: 744 },
                { method: 'PUT', count: 226 }
              ];
        } else if (dimension === 'status') {
          aggregateRows = empty
            ? []
            : [
                { status: 200, count: 1624 },
                { status: 404, count: 24 },
                { status: 500, count: 13 }
              ];
        } else if (options.statusClass) {
          aggregateRows = rows.slice(1, 2);
        }
        return wait({ data: { rows: aggregateRows } });
      },
      getBucketsGroup: () =>
        wait({
          data: empty ? [] : [{ series: { HTTP: { count: 1610 }, HTTPS: { count: 232 } } }]
        }),
      getMcpOperations: () =>
        wait({
          total: empty ? 0 : 248,
          tools: empty ? 0 : 186,
          resources: empty ? 0 : 42,
          prompts: empty ? 0 : 20
        }),
      getMcpBuckets: () => wait(empty ? [] : [{ timestamp: '2026-01-15T11:00:00Z', count: 48 }])
    },
    operations: {
      listTags: () =>
        wait({ tags: empty ? [] : ['env:production', 'team:checkout', 'source:webhook'] })
    }
  };
};

export const traceOperations = [
  { ...httpOperations[0], trace_id: 'trace-checkout-1042', correlation_id: 'req-7dd1' },
  { ...httpOperations[1], trace_id: 'trace-checkout-1042', correlation_id: 'req-7dd1' },
  { ...httpOperations[2], trace_id: 'trace-webhook-24cd', correlation_id: 'req-82ab' }
];

export const traceSummaries = [
  {
    trace_id: 'trace-checkout-1042',
    operation_count: 2,
    first_seen: httpOperations[0].request.timestamp,
    last_seen: httpOperations[1].request.timestamp,
    sources: ['inspectr-directive', 'checkout-service']
  },
  {
    trace_id: 'trace-webhook-24cd',
    operation_count: 1,
    first_seen: httpOperations[2].request.timestamp,
    last_seen: httpOperations[2].request.timestamp,
    sources: ['webhook']
  }
];

export const createTraceClient = ({ mode = 'populated', delay = 0 } = {}) => {
  const wait = async (value) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (mode === 'error') throw new Error('Trace service unavailable');
    return value;
  };
  const summaries = mode === 'empty' ? [] : traceSummaries;
  const operations = mode === 'empty' ? [] : traceOperations;
  return {
    traces: {
      list: () => wait({ traces: summaries, meta: { total: summaries.length, page: 1, limit: 50 } }),
      get: (traceId) => {
        const trace = summaries.find((item) => item.trace_id === traceId);
        const matchedOperations = operations.filter((item) => item.trace_id === traceId);
        return wait({
          trace,
          operations: matchedOperations,
          meta: { total: matchedOperations.length, page: 1, limit: 200 }
        });
      }
    }
  };
};
