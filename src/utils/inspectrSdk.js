// src/utils/inspectrSdk.js
/**
 * Inspectr SDK - A JavaScript SDK for interacting with the Inspectr API
 *
 * This SDK provides a comprehensive set of methods for interacting with the Inspectr API.
 * It handles common tasks like error handling, endpoint normalization, and request formatting.
 *
 * @example
 * // Create a new client instance
 * const client = new InspectrClient({ apiEndpoint: 'https://api.example.com' });
 *
 * // Use the client to interact with the API
 * const healthInfo = await client.service.getHealth();
 */

/**
 * Helper function to normalize API endpoints by removing trailing slashes
 * @private
 */
const normalizeEndpoint = (endpoint) => endpoint.replace(/\/+$/, '');

/**
 * InspectrClient - The main class for interacting with the Inspectr API
 */
class InspectrClient {
  /**
   * Create a new InspectrClient instance
   * @param {Object} options - Configuration options
   * @param {string} [options.apiEndpoint='/api'] - The base API endpoint
   * @param {Object} [options.headers={}] - Additional headers to include in all requests
   */
  constructor(options = {}) {
    this.apiEndpoint = normalizeEndpoint(options.apiEndpoint || '/api');

    // Default headers for all requests
    this.defaultHeaders = {
      'inspectr-client': 'inspectr-app',
      ...options.headers
    };

    // Default content type for JSON requests
    this.jsonHeaders = {
      ...this.defaultHeaders,
      'Content-Type': 'application/json'
    };

    // Initialize sub-clients
    this.registration = new registrationClient(this);
    this.auth = new authClient(this);
    this.operations = new OperationsClient(this);
    this.service = new ServiceClient(this);
    this.stats = new StatsClient(this);
    this.mock = new MockClient(this);
    this.mcp = new McpSettingsClient(this);
    this.rules = new RulesClient(this);
    this.traces = new TracesClient(this);
    this.connectors = new ConnectorsClient(this);
  }

  /**
   * Update the client configuration
   * @param {Object} options - New configuration options
   * @param {string} [options.apiEndpoint] - New API endpoint
   * @param {Object} [options.headers] - New headers to include in all requests
   */
  configure(options = {}) {
    if (options.apiEndpoint) {
      this.apiEndpoint = normalizeEndpoint(options.apiEndpoint);
    }

    if (options.headers) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        ...options.headers
      };

      this.jsonHeaders = {
        ...this.defaultHeaders,
        'Content-Type': 'application/json'
      };
    }
  }
}

/**
 * registrationClient - Handles channel registration
 * @private
 */
class registrationClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Register with the Inspectr API
   * @param {Object} body - Registration data (channel, channel_code, or token)
   * @returns {Promise<Object>} - Registration response with token and endpoints
   */
  async register(body) {
    const res = await fetch(`${this.client.apiEndpoint}/register`, {
      method: 'POST',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Registration failed (${res.status})`);
    return await res.json();
  }

  /**
   * Get configuration from the app server
   * @returns {Promise<Object>} - Configuration data
   */
  async getConfig() {
    const res = await fetch('/app/config');
    if (!res.ok) throw new Error(`Config load failed (${res.status})`);
    return await res.json();
  }
}

/**
 * authClient - Handles backend authentication and guarding
 * @private
 */
class authClient {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get Authentication settings
   * @returns {Promise<Object>} - Authentication settings
   */
  async getAuthenticationSettings() {
    const res = await fetch(`${this.client.apiEndpoint}/auth/settings`, {
      headers: this.client.defaultHeaders
    });
    if (!res.ok) throw new Error(`Authentication settings failed (${res.status})`);
    return await res.json();
  }

  /**
   * Update Authentication settings
   * @param {Object} body - { secret: string, ttl: number }
   * @returns {Promise<Object>} - Updated settings
   */
  async updateAuthenticationSettings(body) {
    const res = await fetch(`${this.client.apiEndpoint}/auth/settings`, {
      method: 'PATCH',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Update authentication settings failed (${res.status})`);
    return await res.json();
  }
}

/**
 * mcpSettingsClient - Handles MCP server settings
 * @private
 */
class McpSettingsClient {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get MCP server settings
   * @returns {Promise<Object>} - MCP server settings
   */
  async getMCPServerSettings() {
    const res = await fetch(`${this.client.apiEndpoint}/mcp/settings`, {
      headers: this.client.defaultHeaders
    });
    if (!res.ok) throw new Error(`MCP Server settings failed (${res.status})`);
    return await res.json();
  }

  /**
   * Update MCP server settings
   * @param {Object} body - { public: boolean }
   * @returns {Promise<Object>} - Updated MCP server settings
   */
  async updateMCPServerSettings(body) {
    const res = await fetch(`${this.client.apiEndpoint}/mcp/settings`, {
      method: 'PATCH',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Update MCP Server settings failed (${res.status})`);
    return await res.json();
  }

  /**
   * @deprecated Use updateMCPServerSettings instead.
   */
  async updateAuthenticationSettings(body) {
    console.warn(
      '[Inspectr SDK] mcp.updateAuthenticationSettings is deprecated. Use updateMCPServerSettings instead.'
    );
    return this.updateMCPServerSettings(body);
  }
}

/**
 * OperationsClient - Handles operations management
 * @private
 */
class OperationsClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Delete all operations
   * @returns {Promise<void>}
   */
  async deleteAll() {
    const res = await fetch(`${this.client.apiEndpoint}/operations`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Delete all failed (${res.status})`);
  }

  /**
   * Delete a specific operation by ID
   * @param {string} id - Operation ID to delete
   * @returns {Promise<void>}
   */
  async delete(id) {
    const res = await fetch(`${this.client.apiEndpoint}/operations/${id}`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!(res.ok || res.status === 404)) throw new Error(`Delete ${id} failed (${res.status})`);
  }

  /**
   * Replay an operation
   * @param {Object} operation - Operation data to replay
   * @returns {Promise<Object>} - Replay response
   */
  async replay(operation) {
    // Remove response, meta, and timing from the operation before sending
    const { meta, timing, response, ...opRequest } = operation;

    const res = await fetch(`${this.client.apiEndpoint}/replay`, {
      method: 'POST',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(opRequest)
    });

    if (!res.ok) throw new Error(`Replay failed (${res.status})`);
    return await res.json();
  }

  /**
   * Export operations
   * @param {Object} options
   * @param {string} [options.path] - Filter operations by path
   * @param {string} [options.preset] - Preset filter
   * @param {string} [options.since] - Export operations after this timestamp
   * @param {string} [options.until] - Export operations before this timestamp
   * @param {string} [options.format='json'] - Export format
   * @returns {Promise<Blob>} - Exported data blob
   */
  async export({ path, preset, since, until, format = 'json' } = {}) {
    let url;
    // Set export format
    if (['postman', 'openapi', 'phar'].includes(format)) {
      url = `${this.client.apiEndpoint}/operations/export/${format}`;
    } else {
      url = `${this.client.apiEndpoint}/operations/export`;
    }

    // Append filters
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    if (preset) params.append('preset', preset);
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const res = await fetch(`${url}?${params}`, {
      headers: this.client.defaultHeaders
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let errorBody = null;
      let message = `Export failed (${res.status})`;

      if (contentType.toLowerCase().includes('application/json')) {
        errorBody = await res.json().catch(() => null);
        const bodyMessage =
          errorBody?.error || errorBody?.message || errorBody?.detail || errorBody?.title;
        if (bodyMessage) message = bodyMessage;
      } else {
        const textBody = await res.text().catch(() => '');
        if (textBody) {
          errorBody = textBody;
          message = textBody;
        }
      }

      const error = new Error(message);
      error.status = res.status;
      if (errorBody !== null) error.body = errorBody;
      throw error;
    }

    return await res.blob();
  }

  /**
   * Import operations from a file
   * @param {File|Blob} file - File containing operations
   * @returns {Promise<void>}
   */
  async import(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = { ...this.client.defaultHeaders };
    delete headers['Content-Type'];

    const res = await fetch(`${this.client.apiEndpoint}/operations/import`, {
      method: 'POST',
      headers: this.client.defaultHeaders,
      body: formData
    });

    if (!res.ok) throw new Error(`Import failed (${res.status})`);
  }

  /**
   * Retrieve aggregated operation summaries and series data.
   * Server endpoint: GET /operations/summary
   * @param {Object} [options]
   * @param {string} [options.operationId]
   * @param {string|Date} [options.since]
   * @param {string|Date} [options.until]
   * @param {string} [options.sortField]
   * @param {string} [options.sortDirection]
   * @param {string|number} [options.status]
   * @param {Array<string|number>} [options.statuses]
   * @param {string} [options.path]
   * @param {string} [options.host]
   * @param {string} [options.method]
   * @param {string[]} [options.methods]
   * @param {number} [options.minDuration]
   * @param {number} [options.maxDuration]
   * @param {string|string[]} [options.tag]
   * @param {string[]} [options.tags]
   * @param {string|string[]} [options.tagAny]
   * @param {string[]} [options.tagsAny]
   * @param {number} [options.seriesLimit]
   * @returns {Promise<Object>} Aggregated summary payload
   */
  async summarize(options = {}) {
    const qs = new URLSearchParams();
    const toStringValue = (value) => {
      if (value === undefined || value === null) return undefined;
      if (value instanceof Date) return value.toISOString();
      return String(value);
    };
    const setParam = (key, value) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        qs.set(key, value.map(toStringValue).join(','));
        return;
      }
      const normalized = toStringValue(value);
      if (normalized === undefined) return;
      qs.set(key, normalized);
    };

    setParam('operation_id', options.operationId);
    setParam('since', options.since);
    setParam('until', options.until);
    setParam('sort_field', options.sortField);
    setParam('sort_direction', options.sortDirection);
    setParam('filter[status]', options.status);
    setParam('filter[statuses]', options.statuses);
    setParam('filter[path]', options.path);
    setParam('filter[host]', options.host);
    setParam('filter[method]', options.method);
    setParam('filter[methods]', options.methods);
    setParam('min_duration', options.minDuration);
    setParam('max_duration', options.maxDuration);
    setParam('filter[tag]', options.tag);
    setParam('filter[tags]', options.tags);
    setParam('filter[tag_any]', options.tagAny);
    setParam('filter[tags_any]', options.tagsAny);

    const query = qs.toString();
    const url = `${this.client.apiEndpoint}/operations/summary${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Operations summary failed (${res.status})`);
    return await res.json();
  }

  /**
   * Retrieve latency series for a specific method and path.
   * Server endpoint: GET /operations/series
   * @param {Object} options
   * @param {string} options.method - HTTP method (required)
   * @param {string} options.path - Operation path (required)
   * @param {string} [options.operationId]
   * @param {string|Date} [options.since]
   * @param {string|Date} [options.until]
   * @param {string} [options.host]
   * @param {number} [options.minDuration]
   * @param {number} [options.maxDuration]
   * @param {string|number} [options.status]
   * @param {Array<string|number>} [options.statuses]
   * @param {string|string[]} [options.tag]
   * @param {string[]} [options.tags]
   * @param {string|string[]} [options.tagAny]
   * @param {string[]} [options.tagsAny]
   * @param {number} [options.seriesLimit]
   * @returns {Promise<Object>} Series payload
   */
  async getSeries(options = {}) {
    const { method, path } = options;
    if (!method) throw new Error('options.method is required');
    if (!path) throw new Error('options.path is required');

    const qs = new URLSearchParams();
    const toStringValue = (value) => {
      if (value === undefined || value === null) return undefined;
      if (value instanceof Date) return value.toISOString();
      return String(value);
    };
    const setParam = (key, value) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        if (!value.length) return;
        qs.set(key, value.map(toStringValue).join(','));
        return;
      }
      const normalized = toStringValue(value);
      if (normalized === undefined) return;
      qs.set(key, normalized);
    };

    setParam('method', method);
    setParam('path', path);
    setParam('operation_id', options.operationId);
    setParam('since', options.since);
    setParam('until', options.until);
    setParam('host', options.host);
    setParam('min_duration', options.minDuration);
    setParam('max_duration', options.maxDuration);
    setParam('status', options.status);
    setParam('statuses', options.statuses);
    setParam('tag', options.tag);
    setParam('tags', options.tags);
    setParam('tag_any', options.tagAny);
    setParam('tags_any', options.tagsAny);
    setParam('series_limit', options.seriesLimit);

    const query = qs.toString();
    const url = `${this.client.apiEndpoint}/operations/series${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Operations series failed (${res.status})`);
    return await res.json();
  }

  /**
   * List all tags observed across operations.
   * Server endpoint: GET /operations/tags
   * @returns {Promise<{tags: string[]}>}
   */
  async listTags() {
    const res = await fetch(`${this.client.apiEndpoint}/operations/tags`, {
      headers: this.client.defaultHeaders
    });
    if (!res.ok) throw new Error(`List tags failed (${res.status})`);
    return await res.json();
  }

  /**
   * List compact operations with pagination support.
   * Server endpoint: GET /operations/compact
   * @param {Object} [options]
   * @param {string} [options.operationId]
   * @param {string|Date} [options.since]
   * @param {string|Date} [options.until]
   * @param {string} [options.sortField]
   * @param {string} [options.sortDirection]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string|number} [options.status]
   * @param {Array<string|number>} [options.statuses]
   * @param {string} [options.method]
   * @param {string[]} [options.methods]
   * @param {string} [options.path]
   * @param {string} [options.host]
   * @param {number} [options.minDuration]
   * @param {number} [options.maxDuration]
   * @param {string} [options.tag]
   * @param {string[]} [options.tags]
   * @param {string} [options.tagAny]
   * @param {string[]} [options.tagsAny]
   * @returns {Promise<Object>} Compact operations response
   */
  async listCompact(options = {}) {
    const qs = new URLSearchParams();

    const toISOString = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (value instanceof Date) return value.toISOString();
      return String(value);
    };

    const setParam = (key, value) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        if (!value.length) return;
        qs.set(key, value.map((item) => String(item)).join(','));
        return;
      }
      qs.set(key, String(value));
    };

    setParam('operation_id', options.operationId);
    setParam('since', toISOString(options.since));
    setParam('until', toISOString(options.until));
    setParam('sort_field', options.sortField);
    setParam('sort_direction', options.sortDirection);
    setParam('page', options.page);
    setParam('limit', options.limit);
    setParam('filter[status]', options.status);
    setParam('filter[statuses]', options.statuses);
    setParam('filter[method]', options.method);
    setParam('filter[methods]', options.methods);
    setParam('filter[path]', options.path);
    setParam('filter[paths]', options.paths);
    setParam('filter[host]', options.host);
    setParam('filter[hosts]', options.hosts);
    setParam('min_duration', options.minDuration);
    setParam('max_duration', options.maxDuration);
    setParam('filter[tag]', options.tag);
    setParam('filter[tags]', options.tags);
    setParam('filter[tag_any]', options.tagAny);
    setParam('filter[tags_any]', options.tagsAny);

    const query = qs.toString();
    const url = `${this.client.apiEndpoint}/operations/compact${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`List compact operations failed (${res.status})`);
    return await res.json();
  }

  /**
   * Delete one or more tags from a specific operation.
   * Server endpoint: DELETE /operations/{id}/tags
   * Provide either a single tag via `tag` (string or string[]) and/or `tags` (string|string[])
   * @param {string} id - Operation ID
   * @param {Object} [options]
   * @param {string|string[]} [options.tag] - Repeatable tag parameter; if array, sent multiple times
   * @param {string|string[]} [options.tags] - Comma-separated list of tags; if array, joined with commas
   * @returns {Promise<{message: string, removed_count: number, operation: object}>}
   */
  async deleteOperationTags(id, options = {}) {
    if (!id) throw new Error('Operation id is required');
    const qs = new URLSearchParams();

    const appendRepeatable = (name, value) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null && `${v}` !== '') qs.append(name, String(v));
        });
      } else if (value !== undefined && value !== null && `${value}` !== '') {
        qs.append(name, String(value));
      }
    };

    const setCommaSeparated = (name, value) => {
      if (Array.isArray(value)) {
        if (value.length) qs.set(name, value.join(','));
      } else if (value !== undefined && value !== null && `${value}` !== '') {
        qs.set(name, String(value));
      }
    };

    appendRepeatable('tag', options.tag);
    setCommaSeparated('tags', options.tags);

    if (!qs.has('tag') && !qs.has('tags')) {
      throw new Error('At least one tag must be provided via options.tag or options.tags');
    }

    const url = `${this.client.apiEndpoint}/operations/${encodeURIComponent(id)}/tags`;
    const res = await fetch(`${url}?${qs.toString()}`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Delete operation tags failed (${res.status})`);
    return await res.json();
  }

  /**
   * Delete a specific tag across operations (persisting changes; no dry-run).
   * Server endpoint: DELETE /operations/tags/{tag}
   * Optional filters are supported.
   * @param {string} tag - The tag to remove
   * @param {Object} [options]
   * @param {string|Date} [options.since]
   * @param {string|Date} [options.until]
   * @param {string} [options.method]
   * @param {string} [options.path]
   * @param {string} [options.host]
   * @param {string[]} [options.tagsAll]
   * @param {string[]} [options.tagsAny]
   * @param {number[]|string[]} [options.statuses]
   * @param {number} [options.limit]
   * @param {number} [options.pageSize]
   * @returns {Promise<Object>} Result payload from the server
   */
  async deleteTag(tag, options = {}) {
    if (!tag) throw new Error('tag is required');

    const qs = new URLSearchParams();
    const toRFC3339 = (v) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString();
      return v;
    };
    const add = (k, v) => {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      qs.set(k, Array.isArray(v) ? v.join(',') : String(v));
    };

    add('since', toRFC3339(options.since));
    add('until', toRFC3339(options.until));
    add('method', options.method);
    add('path', options.path);
    add('host', options.host);

    if (Array.isArray(options.tagsAll) && options.tagsAll.length) {
      add('tags_all', options.tagsAll);
    }
    if (Array.isArray(options.tagsAny) && options.tagsAny.length) {
      add('tags_any', options.tagsAny);
    }
    if (Array.isArray(options.statuses) && options.statuses.length) {
      add('statuses', options.statuses);
    }
    add('limit', options.limit);
    add('page_size', options.pageSize);

    const url = `${this.client.apiEndpoint}/operations/tags/${encodeURIComponent(tag)}`;
    const res = await fetch(`${url}${qs.toString() ? '?' + qs.toString() : ''}`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Delete tag failed (${res.status})`);
    return await res.json();
  }

  /**
   * Bulk delete a tag from operations with optional dry-run.
   * Server endpoint: POST /operations/tags/bulk-delete
   * @param {Object} options
   * @param {string} options.tag - Tag to remove (required)
   * @param {string|Date} [options.since]
   * @param {string|Date} [options.until]
   * @param {string} [options.method]
   * @param {string} [options.path]
   * @param {string} [options.host]
   * @param {string[]} [options.tagsAll]
   * @param {string[]} [options.tagsAny]
   * @param {number[]|string[]} [options.statuses]
   * @param {number} [options.limit]
   * @param {number} [options.pageSize]
   * @param {boolean} [options.dryRun=true] - If true, performs dry-run without persisting changes
   * @returns {Promise<Object>} Result payload from the server
   */
  async bulkDeleteTag(options = {}) {
    const { tag } = options;
    if (!tag) throw new Error('options.tag is required');

    const qs = new URLSearchParams();
    const toRFC3339 = (v) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString();
      return v;
    };
    const add = (k, v) => {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
      qs.set(k, Array.isArray(v) ? v.join(',') : String(v));
    };

    add('tag', tag);
    add('since', toRFC3339(options.since));
    add('until', toRFC3339(options.until));
    add('method', options.method);
    add('path', options.path);
    add('host', options.host);

    if (Array.isArray(options.tagsAll) && options.tagsAll.length) {
      add('tags_all', options.tagsAll);
    }
    if (Array.isArray(options.tagsAny) && options.tagsAny.length) {
      add('tags_any', options.tagsAny);
    }
    if (Array.isArray(options.statuses) && options.statuses.length) {
      add('statuses', options.statuses);
    }
    add('limit', options.limit);
    add('page_size', options.pageSize);

    // dry_run defaults to true on the server; include only if explicitly provided
    if (options.dryRun !== undefined && options.dryRun !== null) {
      add('dry_run', options.dryRun ? 'true' : 'false');
    }

    const url = `${this.client.apiEndpoint}/operations/tags/bulk-delete`;
    const res = await fetch(`${url}?${qs.toString()}`, {
      method: 'POST',
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Bulk delete tag failed (${res.status})`);
    return await res.json();
  }
}

/**
 * ServiceClient - Handles service information
 * @private
 */
class ServiceClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get health information from the API
   * @returns {Promise<Object>} - Health information
   */
  async getHealth() {
    const res = await fetch(`${this.client.apiEndpoint}/health`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return await res.json();
  }

  /**
   * Ping a specific service component
   * @param {string} component - backend | mock | catch
   * @returns {Promise<Object>} - Ping result
   */
  async ping(component) {
    const res = await fetch(`${this.client.apiEndpoint}/ping/${component}`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(`${errorBody?.error || res.status}`);
    }

    return await res.json();
  }

  /**
   * Get usage metrics
   * @returns {Promise<Object>} - Metrics data
   */
  async getMetrics() {
    const res = await fetch(`${this.client.apiEndpoint}/metrics`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Metrics failed (${res.status})`);
    return await res.json();
  }

  /**
   * Get general service info (API, App, MCP)
   * @returns {Promise<Object>} - Info payload
   */
  async getInfo() {
    const res = await fetch(`${this.client.apiEndpoint}/info`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Info failed (${res.status})`);
    return await res.json();
  }

  /**
   * Get license information including features and usage
   * @returns {Promise<Object>} - License info
   */
  async getLicense() {
    const res = await fetch(`${this.client.apiEndpoint}/license`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`License failed (${res.status})`);
    return await res.json();
  }

  /**
   * Update license using a license key
   * @param {string} licenseKey - The license key string (e.g., INSPECTR-...)
   * @returns {Promise<Object>} - API response (updated license or status)
   */
  async putLicense(licenseKey) {
    const body = JSON.stringify({ license_key: licenseKey });
    const res = await fetch(`${this.client.apiEndpoint}/license`, {
      method: 'PUT',
      headers: this.client.jsonHeaders,
      body
    });
    if (!res.ok) {
      const status = res.status;
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody?.error || errorBody?.message || `License update failed (${status})`;
      const err = new Error(message);
      err.status = status;
      err.code = errorBody?.code;
      err.reason = errorBody?.reason;
      err.details = errorBody?.error || errorBody?.message;
      throw err;
    }
    return await res.json();
  }
}

/**
 * StatsClient - Handles statistics and analytics
 * @private
 */
class StatsClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get operation statistics
   * @param {Object} options - Query options
   * @param {string} options.group - Grouping interval (hour, day, week, month)
   * @param {string} options.start - Start date (ISO string)
   * @param {string} options.end - End date (ISO string)
   * @returns {Promise<Object>} - Statistics data
   */
  async getOperations({ group, start, end, tag }) {
    const searchParams = new URLSearchParams({
      group,
      start,
      end
    });
    if (tag) {
      searchParams.append('tag', tag);
    }
    const url = `${this.client.apiEndpoint}/stats/operations?${searchParams.toString()}`;

    const res = await fetch(url, {
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Stats operations failed (${res.status})`);
    return await res.json();
  }

  /**
   * Overview KPIs for a time window (totals, rates, Apdex).
   * Server endpoint: GET /stats/operations/overview
   * @param {Object} [options]
   * @param {string|Date} [options.from]
   * @param {string|Date} [options.to]
   * @param {string} [options.interval] - hour|day|week|month (server-specific)
   * @param {string} [options.tag]
   * @returns {Promise<Object>} Overview envelope
   */
  async getOverview(options = {}) {
    const toISOString = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };
    const params = new URLSearchParams();
    const add = (k, v) => {
      if (v === undefined || v === null || v === '') return;
      params.set(k, String(v));
    };

    add('from', toISOString(options.from));
    add('to', toISOString(options.to));
    add('interval', options.interval);
    add('tag', options.tag);

    const qs = params.toString();
    const url = `${this.client.apiEndpoint}/stats/operations/overview${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Stats overview failed (${res.status})`);
    return await res.json();
  }

  /**
   * Time-bucketed statistics suitable for charting.
   * Server endpoint: GET /stats/operations/buckets
   * @param {Object} [options]
   * @param {string|Date} [options.from]
   * @param {string|Date} [options.to]
   * @param {string} [options.interval] - hour|day|week|month
   * @param {string} [options.group] - optional grouping hint (e.g., status_class)
   * @param {string} [options.tag]
   * @returns {Promise<Object>} Buckets envelope
   */
  async getBuckets(options = {}) {
    const toISOString = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };
    const params = new URLSearchParams();
    const add = (k, v) => {
      if (v === undefined || v === null || v === '') return;
      params.set(k, String(v));
    };
    const addCsv = (k, v) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        if (!v.length) return;
        params.set(k, v.map((x) => String(x)).join(','));
      } else {
        params.set(k, String(v));
      }
    };

    add('from', toISOString(options.from));
    add('to', toISOString(options.to));
    add('interval', options.interval);
    add('group', options.group);
    addCsv('filter[method]', options.method);
    addCsv('filter[status]', options.status);
    addCsv('filter[status_class]', options.statusClass);
    addCsv('filter[tag]', options.tag);
    addCsv('filter[path]', options.path);
    add('path_prefix', options.pathPrefix);
    addCsv('filter[host]', options.host);

    const qs = params.toString();
    const url = `${this.client.apiEndpoint}/stats/operations/buckets${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Stats buckets failed (${res.status})`);
    return await res.json();
  }

  /**
   * Aggregate statistics grouped by a dimension.
   * Server endpoint: GET /stats/operations/aggregate/{dimension}
   * @param {('path'|'method'|'host'|'status_class'|'status'|'tag')} dimension - Required group-by dimension
   * @param {Object} [options]
   * @param {string|Date} [options.from]
   * @param {string|Date} [options.to]
   * @param {string|string[]} [options.metrics] - e.g., 'count', 'avg_ms', 'p95_ms', 'error_rate'
   * @param {number} [options.limit]
   * @param {string} [options.order] - e.g., '-count', '+avg_ms'
   * @param {string|string[]} [options.method]
   * @param {string|string[]} [options.status]
   * @param {string|string[]} [options.statusClass]
   * @param {string} [options.path]
   * @param {string} [options.pathPrefix]
   * @param {string} [options.host]
   * @param {string|string[]} [options.tag]
   * @returns {Promise<Object>} Aggregate envelope
   */
  async aggregateBy(dimension, options = {}) {
    const allowed = ['path', 'method', 'host', 'status_class', 'status', 'tag'];
    if (!allowed.includes(dimension)) {
      throw new Error(`Invalid dimension: ${dimension}. Allowed: ${allowed.join(', ')}`);
    }

    const toISOString = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };
    const params = new URLSearchParams();
    const add = (k, v) => {
      if (v === undefined || v === null || v === '') return;
      params.set(k, String(v));
    };
    const addCsv = (k, v) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        if (!v.length) return;
        params.set(k, v.map((x) => String(x)).join(','));
      } else {
        params.set(k, String(v));
      }
    };

    add('from', toISOString(options.from));
    add('to', toISOString(options.to));
    addCsv('metrics', options.metrics);
    if (typeof options.limit === 'number') add('limit', options.limit);
    add('order', options.order);

    addCsv('method', options.method);
    addCsv('status', options.status);
    addCsv('status_class', options.statusClass);
    add('path', options.path);
    add('path_prefix', options.pathPrefix);
    add('host', options.host);
    addCsv('tag', options.tag);

    const qs = params.toString();
    const url = `${this.client.apiEndpoint}/stats/operations/aggregate/${encodeURIComponent(dimension)}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Stats aggregate failed (${res.status})`);
    return await res.json();
  }

  /**
   * Delete All operation statistics
   * @returns {Promise<void>}
   */
  async deleteOperations() {
    const res = await fetch(`${this.client.apiEndpoint}/stats/operations`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (res.status === 204) {
      return;
    }
    throw new Error(`Delete stats operations failed (${res.status})`);
  }
}

/**
 * TracesClient - Handles trace exploration
 * @private
 */
class TracesClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * List traces with optional pagination
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @param {string} [options.source]
   * @param {string} [options.search]
   * @returns {Promise<Object>} Trace collection response
   */
  async list(options = {}) {
    const params = new URLSearchParams();
    const { page, limit, source, search } = options;

    if (page !== undefined && page !== null) params.set('page', String(page));
    if (limit !== undefined && limit !== null) params.set('limit', String(limit));
    if (source) params.set('source', source);
    if (search) params.set('search', search);

    const qs = params.toString();
    const url = `${this.client.apiEndpoint}/traces${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: {
        ...this.client.defaultHeaders,
        Accept: 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Trace list failed (${res.status})`);
    return await res.json();
  }

  /**
   * Fetch a single trace with operations
   * @param {string} traceId
   * @param {Object} [options]
   * @param {number} [options.page]
   * @param {number} [options.limit]
   * @returns {Promise<Object>} Trace detail response
   */
  async get(traceId, options = {}) {
    if (!traceId) throw new Error('Trace ID is required');

    const params = new URLSearchParams();
    const { page, limit } = options;

    if (page !== undefined && page !== null) params.set('page', String(page));
    if (limit !== undefined && limit !== null) params.set('limit', String(limit));

    const qs = params.toString();
    const url = `${this.client.apiEndpoint}/traces/${encodeURIComponent(traceId)}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: {
        ...this.client.defaultHeaders,
        Accept: 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Trace detail failed (${res.status})`);
    return await res.json();
  }
}

/**
 * MockClient - Handles mock service operations
 * @private
 */
class MockClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get mock configuration information
   * @returns {Promise<Object>} - Mock configuration
   */
  async getConfig() {
    const res = await fetch(`${this.client.apiEndpoint}/mock`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Mock info failed (${res.status})`);
    return await res.json();
  }

  /**
   * Launch or restart the mock service with a given OpenAPI URL
   * @param {string} openapiUrl - OpenAPI spec URL
   * @returns {Promise<Object>} - { message: string }
   */
  async launch(openapiUrl) {
    const url = `${this.client.apiEndpoint}/mock/launch?openapi=` + encodeURIComponent(openapiUrl);
    const res = await fetch(url, {
      method: 'GET',
      headers: this.client.defaultHeaders
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Mock launch failed (${res.status})`);
    }
    return await res.json();
  }
}

/**
 * RulesClient - Handles automation rule management
 */
class RulesClient {
  constructor(client) {
    this.client = client;
  }

  /**
   * Export rules as YAML.
   * Server endpoint: GET /api/rules/export
   * - Response headers:
   *   Content-Disposition: attachment; filename=rules.yaml
   *   Content-Type: application/x-yaml
   *
   * @param {Object} [options]
   * @param {string} [options.id] - Optional rule id to export a single rule if the server supports it
   * @returns {Promise<{ blob: Blob, filename: string, contentType: string }>} Download payload
   */
  async export(options = {}) {
    const id = options?.id;
    const url = id
      ? `${this.client.apiEndpoint}/rules/${encodeURIComponent(id)}/export`
      : `${this.client.apiEndpoint}/rules/export`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { ...this.client.defaultHeaders, Accept: 'application/x-yaml' }
    });

    if (!res.ok) {
      let errText = '';
      try {
        errText = await res.text();
      } catch {}
      throw new Error(`Rules export failed (${res.status})${errText ? `: ${errText}` : ''}`);
    }

    const blob = await res.blob();
    const contentType = res.headers.get('Content-Type') || 'application/x-yaml';
    const cd = res.headers.get('Content-Disposition') || '';
    const filenameMatch = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
    const filename = decodeURIComponent(filenameMatch?.[1] || filenameMatch?.[2] || 'rules.yaml');

    return { blob, filename, contentType };
  }

  /**
   * Import rules from YAML.
   * Server endpoint: POST /api/rules/import
   * - Request Content-Type: application/x-yaml
   * - Response: JSON (import summary or created rules)
   *
   * @param {string|Blob|File} yaml - YAML content or file/blob
   * @param {Object} [options]
   * @param {boolean} [options.overwrite=false] - When true, adds ?overwrite=true to the request
   * @returns {Promise<any>} Parsed JSON response
   */
  async import(yaml, options = {}) {
    const isBlob =
      yaml && typeof yaml === 'object' && (yaml instanceof Blob || yaml instanceof File);
    const body = isBlob ? yaml : String(yaml ?? '');

    const overwrite = options?.overwrite === true;
    const url = `${this.client.apiEndpoint}/rules/import` + (overwrite ? `?overwrite=true` : '');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.client.defaultHeaders,
        'Content-Type': 'application/x-yaml',
        Accept: 'application/json'
      },
      body
    });

    if (!res.ok) {
      let errorBody = {};
      try {
        errorBody = await res.json();
      } catch {
        try {
          const text = await res.text();
          errorBody = { message: text };
        } catch {}
      }
      const message =
        errorBody?.error || errorBody?.message || `Rules import failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }

    // Try to parse JSON response; fallback to empty object
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  /**
   * Apply a rule to historical operations with optional filters.
   * Server endpoint: POST /api/rules/{id}/apply
   *
   * @param {string} id - Rule ID
   * @param {Object} [options] - Filtering and execution options
   * @param {string|Date} [options.since] - RFC3339 timestamp or Date to filter operations starting from this time
   * @param {string|Date} [options.until] - RFC3339 timestamp or Date to filter operations up to this time
   * @param {string} [options.method]
   * @param {string} [options.path]
   * @param {string} [options.host]
   * @param {string[]} [options.tagsAll]
   * @param {string[]} [options.tagsAny]
   * @param {number[]} [options.statuses]
   * @param {number} [options.limit]
   * @param {number} [options.pageSize]
   * @param {boolean} [options.dryRun=true] - If true, actions are not executed; only a preview/result is returned
   * @returns {Promise<Object>} Result payload from the server
   */
  async applyToHistory(id, options = {}) {
    if (!id) throw new Error('Rule id is required');

    const qs = new URLSearchParams();
    const toRFC3339 = (v) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString();
      // assume already RFC3339 or ISO 8601 string
      return v;
    };

    const add = (k, v) => {
      if (v === undefined || v === null || v === '') return;
      qs.set(k, String(v));
    };

    add('since', toRFC3339(options.since));
    add('until', toRFC3339(options.until));
    add('method', options.method);
    add('path', options.path);
    add('host', options.host);

    if (Array.isArray(options.tagsAll) && options.tagsAll.length) {
      add('tags_all', options.tagsAll.join(','));
    }
    if (Array.isArray(options.tagsAny) && options.tagsAny.length) {
      add('tags_any', options.tagsAny.join(','));
    }
    if (Array.isArray(options.statuses) && options.statuses.length) {
      add('statuses', options.statuses.join(','));
    }

    if (typeof options.limit === 'number') add('limit', options.limit);
    if (typeof options.pageSize === 'number') add('page_size', options.pageSize);

    // default dryRun to true unless explicitly false
    const dryRun = options.dryRun !== false;
    add('dry_run', dryRun);

    const url =
      `${this.client.apiEndpoint}/rules/${encodeURIComponent(id)}/apply` +
      (qs.toString() ? `?${qs.toString()}` : '');

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) {
      let errorBody = {};
      try {
        errorBody = await res.json();
      } catch (e) {}
      const message = errorBody?.error || errorBody?.message || `Apply rule failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }

    return await res.json();
  }

  async list({ page, limit } = {}) {
    let url = `${this.client.apiEndpoint}/rules`;

    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Rules load failed (${res.status})`);
    return await res.json();
  }

  async create(body) {
    const res = await fetch(`${this.client.apiEndpoint}/rules`, {
      method: 'POST',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Rule create failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }

    return await res.json();
  }

  async get(id) {
    const res = await fetch(`${this.client.apiEndpoint}/rules/${id}`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Rule load failed (${res.status})`);
    return await res.json();
  }

  async replace(id, body) {
    const res = await fetch(`${this.client.apiEndpoint}/rules/${id}`, {
      method: 'PUT',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Rule update failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }

    return await res.json();
  }

  async delete(id) {
    const res = await fetch(`${this.client.apiEndpoint}/rules/${id}`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!(res.ok || res.status === 204)) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Rule delete failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }
  }

  async update(id, body) {
    return this.replace(id, body);
  }

  async getEvents({ page, limit } = {}) {
    let url = `${this.client.apiEndpoint}/rules/events`;

    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Rules events failed (${res.status})`);
    return await res.json();
  }

  async getActions({ page, limit } = {}) {
    let url = `${this.client.apiEndpoint}/rules/actions`;

    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Rules actions failed (${res.status})`);
    return await res.json();
  }

  async getOperators({ page, limit } = {}) {
    let url = `${this.client.apiEndpoint}/rules/operators`;

    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });

    if (!res.ok) throw new Error(`Rules operators failed (${res.status})`);
    const payload = await res.json();
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.operators)) return payload.operators;
    return [];
  }
}

/**
 * ConnectorsClient - Manage external connectors
 */
class ConnectorsClient {
  constructor(client) {
    this.client = client;
  }

  // List connectors
  async list({ page, limit } = {}) {
    let url = `${this.client.apiEndpoint}/connectors`;

    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    const res = await fetch(url, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Connectors list failed (${res.status})`);
    return await res.json();
  }

  // Create connector
  async create(body) {
    const res = await fetch(`${this.client.apiEndpoint}/connectors`, {
      method: 'POST',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Connector create failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }
    return await res.json();
  }

  // Get a single connector
  async get(id) {
    const res = await fetch(`${this.client.apiEndpoint}/connectors/${encodeURIComponent(id)}`, {
      headers: { ...this.client.defaultHeaders, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Connector load failed (${res.status})`);
    return await res.json();
  }

  // Update/replace a connector
  async update(id, body) {
    const res = await fetch(`${this.client.apiEndpoint}/connectors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.client.jsonHeaders,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Connector update failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }
    return await res.json();
  }

  // Delete a connector
  async delete(id) {
    const res = await fetch(`${this.client.apiEndpoint}/connectors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.client.defaultHeaders
    });

    if (!(res.ok || res.status === 204)) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody?.error || errorBody?.message || `Connector delete failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.body = errorBody;
      throw err;
    }
  }
}

// Export the client class as the default export
export default InspectrClient;
