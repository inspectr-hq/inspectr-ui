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

    if (!res.ok) throw new Error(`Export failed (${res.status})`);
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
  async getOperations({ group, start, end }) {
    const url = `${this.client.apiEndpoint}/stats/operations?group=${group}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    const res = await fetch(url, {
      headers: this.client.defaultHeaders
    });

    if (!res.ok) throw new Error(`Stats operations failed (${res.status})`);
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

// Export the client class as the default export
export default InspectrClient;
