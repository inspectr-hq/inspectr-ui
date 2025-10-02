// src/utils/inspectrJsonPaths.js
// JSON path metadata for InspectrOperation objects. This mirrors the backend model
// defined in pkg/models/inspectr_data.go so the UI can offer suggestions for
// commonly used paths when building rules.

export const inspectrJsonPathTree = {
  label: 'Inspectr Operation',
  value: '$',
  description: 'Root object containing the captured request, response, and metadata.',
  children: [
    {
      label: 'Version',
      value: '$.version',
      description: 'Inspectr payload version string.'
    },
    {
      label: 'Operation ID',
      value: '$.operation_id',
      description: 'Unique identifier assigned to the captured operation.'
    },
    {
      label: 'Correlation ID',
      value: '$.correlation_id',
      description: 'Correlation identifier propagated between services.'
    },
    {
      label: 'Request',
      value: '$.request',
      description: 'Incoming HTTP request information.',
      children: [
        { label: 'Method', value: '$.request.method' },
        { label: 'URL', value: '$.request.url' },
        { label: 'Path', value: '$.request.path' },
        { label: 'Server', value: '$.request.server' },
        { label: 'Client IP', value: '$.request.client_ip' },
        { label: 'HTTP Version', value: '$.request.http_version' },
        { label: 'Headers Size', value: '$.request.headers_size' },
        {
          label: 'Headers',
          value: '$.request.headers',
          description: 'Array of request headers as name/value pairs.',
          children: [
            { label: 'Header Name', value: '$.request.headers[*].name' },
            { label: 'Header Value', value: '$.request.headers[*].value' }
          ]
        },
        {
          label: 'Query Parameters',
          value: '$.request.query_params',
          description: 'Array of query parameters as name/value pairs.',
          children: [
            { label: 'Query Param Name', value: '$.request.query_params[*].name' },
            { label: 'Query Param Value', value: '$.request.query_params[*].value' }
          ]
        },
        {
          label: 'Cookies',
          value: '$.request.cookies',
          description: 'Array of request cookies.',
          children: [
            { label: 'Cookie Name', value: '$.request.cookies[*].name' },
            { label: 'Cookie Value', value: '$.request.cookies[*].value' }
          ]
        },
        { label: 'Body', value: '$.request.body' },
        { label: 'Body Size', value: '$.request.body_size' },
        { label: 'Timestamp', value: '$.request.timestamp' }
      ]
    },
    {
      label: 'Response',
      value: '$.response',
      description: 'Outgoing HTTP response information.',
      children: [
        { label: 'Status Code', value: '$.response.status' },
        { label: 'Status Text', value: '$.response.status_text' },
        { label: 'HTTP Version', value: '$.response.http_version' },
        { label: 'Headers Size', value: '$.response.headers_size' },
        {
          label: 'Headers',
          value: '$.response.headers',
          description: 'Array of response headers as name/value pairs.',
          children: [
            { label: 'Header Name', value: '$.response.headers[*].name' },
            { label: 'Header Value', value: '$.response.headers[*].value' }
          ]
        },
        {
          label: 'Cookies',
          value: '$.response.cookies',
          description: 'Array of response cookies.',
          children: [
            { label: 'Cookie Name', value: '$.response.cookies[*].name' },
            { label: 'Cookie Value', value: '$.response.cookies[*].value' }
          ]
        },
        { label: 'Body', value: '$.response.body' },
        { label: 'Body Size', value: '$.response.body_size' },
        { label: 'Timestamp', value: '$.response.timestamp' },
        {
          label: 'Event Frames',
          value: '$.response.event_frames',
          description: 'Server-sent events captured during the operation.',
          children: [
            { label: 'Frame ID', value: '$.response.event_frames[*].id' },
            { label: 'Frame Event', value: '$.response.event_frames[*].event' },
            { label: 'Frame Data', value: '$.response.event_frames[*].data' },
            { label: 'Frame Timestamp', value: '$.response.event_frames[*].timestamp' }
          ]
        }
      ]
    },
    {
      label: 'Timing',
      value: '$.timing',
      description: 'Timing metrics for the operation lifecycle.',
      children: [
        { label: 'Request Timestamp', value: '$.timing.request' },
        { label: 'Response Timestamp', value: '$.timing.response' },
        { label: 'Duration (ms)', value: '$.timing.duration' }
      ]
    },
    {
      label: 'Meta',
      value: '$.meta',
      description: 'Additional metadata captured alongside the operation.',
      children: [
        {
          label: 'Proxy',
          value: '$.meta.proxy',
          children: [
            { label: 'Instance', value: '$.meta.proxy.instance' },
            { label: 'URL', value: '$.meta.proxy.url' }
          ]
        },
        {
          label: 'Ingress',
          value: '$.meta.ingress',
          children: [
            {
              label: 'Headers',
              value: '$.meta.ingress.headers',
              description: 'Map of ingress headers preserved by Inspectr.',
              children: [
                {
                  label: 'Header Value by Name',
                  value: '$.meta.ingress.headers["Header-Name"]',
                  description: 'Replace Header-Name with the ingress header key.'
                }
              ]
            }
          ]
        },
        {
          label: 'Inspectr',
          value: '$.meta.inspectr',
          children: [
            {
              label: 'Directives',
              value: '$.meta.inspectr.directives',
              description: 'Map of Inspectr directive headers.',
              children: [
                {
                  label: 'Directive by Name',
                  value: '$.meta.inspectr.directives["directive-name"]',
                  description: 'Replace directive-name with the directive key.'
                }
              ]
            },
            {
              label: 'Guard',
              value: '$.meta.inspectr.guard',
              description: 'Map of Inspectr Guard headers.',
              children: [
                {
                  label: 'Guard Header by Name',
                  value: '$.meta.inspectr.guard["guard-name"]',
                  description: 'Replace guard-name with the guard header key.'
                }
              ]
            }
          ]
        },
        {
          label: 'Tags',
          value: '$.meta.tags',
          description: 'Array of user-defined tags applied to the operation.',
          children: [{ label: 'Tag Value', value: '$.meta.tags[*]' }]
        }
      ]
    }
  ]
};

export function flattenJsonPathTree(node) {
  const result = [];

  const traverse = (current) => {
    if (!current) return;
    if (current.value) {
      result.push({
        value: current.value,
        label: current.label,
        description: current.description || ''
      });
    }
    if (current.children && current.children.length > 0) {
      current.children.forEach((child) => traverse(child));
    }
  };

  traverse(node);
  return result;
}
