// src/utils/eventDB.js
import Dexie from 'dexie';
import { normalizeTags, normalizeTagFilters } from './normalizeTags.js';

const getRecordNormalizedTags = (record) => {
  if (!record) return [];
  if (Array.isArray(record.__normalizedTags)) return record.__normalizedTags;
  const tags = normalizeTags(record?.tags || []);
  record.__normalizedTags = tags;
  return tags;
};

const normalizeOptionValue = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const getFirstPrefixedTagValue = (tags, prefixes) => {
  if (!Array.isArray(tags)) return null;
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    for (const prefix of prefixes) {
      if (tag.startsWith(prefix)) {
        const value = normalizeOptionValue(tag.slice(prefix.length));
        if (value) return value;
      }
    }
  }
  return null;
};

const getMcpMetaValue = (meta, category, key) => {
  if (!meta || typeof meta !== 'object') return null;
  const direct = normalizeOptionValue(meta[key]);
  if (direct) return direct;
  if (meta.category === category && meta.name) {
    return normalizeOptionValue(meta.name);
  }
  return null;
};

const collectDistinctValues = (records, field) => {
  const values = new Set();
  records.forEach((record) => {
    const recordValue = record?.[field];
    if (Array.isArray(recordValue)) {
      recordValue.forEach((value) => {
        const normalized = normalizeOptionValue(value);
        if (normalized) values.add(normalized);
      });
      return;
    }
    const normalized = normalizeOptionValue(recordValue);
    if (normalized) values.add(normalized);
  });
  return Array.from(values).sort((a, b) => a.localeCompare(b));
};

class EventDB {
  constructor() {
    this.db = new Dexie('InspectrDB');
    // Define the "events" table with indexes on the key fields.
    // Here "id" is the primary key.
    this.db.version(1).stores({
      events: 'id, time, operation_id, method, status_code, path, duration, server'
    });
    this.db.version(2).stores({
      events: 'id, time, operation_id, method, status_code, path, duration, server'
    });
    this.db.version(3).stores({
      events:
        'id, time, operation_id, method, status_code, path, duration, server, mcp_tool, mcp_resource, mcp_prompt'
    });
    this.db.version(4).stores({
      events:
        'id, time, operation_id, method, status_code, path, duration, server, mcp_tool, mcp_resource, mcp_prompt, mcp_category, mcp_method'
    });
  }

  // Helper method to transform a raw SSE event into a flattened record.
  transformEvent(event) {
    const { id, data, operation_id } = event;
    const syncRunId = event?.__syncRunId;
    const normalizedTags = normalizeTags(data?.meta?.tags || []);
    const rawTags = Array.isArray(data?.meta?.tags) ? data.meta.tags : [];
    const mcpMeta = data?.meta?.mcp || data?.meta?.trace?.mcp || null;
    const mcpTool =
      getMcpMetaValue(mcpMeta, 'tool', 'tool_name') ||
      getFirstPrefixedTagValue(rawTags, ['mcp.tool.', 'mcp.tool:']);
    const mcpResource =
      getMcpMetaValue(mcpMeta, 'resource', 'resource_name') ||
      getFirstPrefixedTagValue(rawTags, ['mcp.resource.', 'mcp.resource:']);
    const mcpPrompt =
      getMcpMetaValue(mcpMeta, 'prompt', 'prompt_name') ||
      getFirstPrefixedTagValue(rawTags, ['mcp.prompt.', 'mcp.prompt:']);
    const mcpCategory =
      normalizeOptionValue(mcpMeta?.category) ||
      getFirstPrefixedTagValue(rawTags, ['mcp.category.', 'mcp.category:']);
    const mcpMethod =
      normalizeOptionValue(mcpMeta?.method) ||
      getFirstPrefixedTagValue(rawTags, ['mcp.method.', 'mcp.method:']);

    return {
      id,
      time: data.request.timestamp,
      operation_id,
      method: data.request.method,
      url: data.request.url,
      server: data.request.server,
      path: data.request.path,
      query_params: data.request.query_params || [],
      client_ip: data.request.client_ip,
      duration: data.timing.duration,
      status_code: data.response?.status,
      mcp_tool: mcpTool,
      mcp_resource: mcpResource,
      mcp_prompt: mcpPrompt,
      mcp_category: mcpCategory,
      mcp_method: mcpMethod,
      ...(syncRunId ? { last_synced_at: syncRunId } : {}),
      tagTokens: normalizedTags.map((tag) => tag.token),
      tags: normalizedTags.map((tag) => tag.display)
    };
  }

  // Store or update (upsert) an event.
  async upsertEvent(event) {
    const record = this.transformEvent(event);
    // console.log('[EventDB] upsertEvent record:', record);
    return await this.db.events.put(record);
  }

  // Store or update multiple events in a single transaction.
  async bulkUpsertEvents(events) {
    const records = events.map((e) => this.transformEvent(e));
    return await this.db.transaction('rw', this.db.events, () => this.db.events.bulkPut(records));
  }

  // Delete an event by its id.
  async deleteEvent(id) {
    return await this.db.events.delete(id);
  }

  // Retrieve a single event by id.
  async getEvent(id) {
    return await this.db.events.get(id);
  }

  // Query events with optional filters, sorting, and pagination.
  async queryEvents(options = {}) {
    const {
      filters = {},
      sort = { field: 'time', order: 'desc' },
      page = 1,
      pageSize = 20
    } = options;

    // Detect whether any filters are active
    const hasFilters = Boolean(
      filters.timestampRange ||
      (filters.status && filters.status.length) ||
      (filters.method && filters.method.length) ||
      filters.path ||
      filters.durationMin ||
      filters.durationMax ||
      filters.host ||
      (filters.tags && filters.tags.length) ||
      (filters.mcpTool && filters.mcpTool.length) ||
      (filters.mcpResource && filters.mcpResource.length) ||
      (filters.mcpPrompt && filters.mcpPrompt.length) ||
      (filters.mcpCategory && filters.mcpCategory.length) ||
      (filters.mcpMethod && filters.mcpMethod.length)
    );

    // --- Fast path: no filters → direct index count & page fetch ---
    if (!hasFilters) {
      const table = this.db.events;
      // Fire count and page-fetch in parallel
      const totalCountPromise = table.count();
      let collection = table.orderBy(sort.field);
      if (sort.order === 'desc') {
        collection = collection.reverse();
      }
      const pagePromise = collection
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();

      const [rawRecords, totalCount] = await Promise.all([pagePromise, totalCountPromise]);
      return { results: rawRecords, totalCount };
    }

    // --- Fallback path: filters are present, run full filtering logic ---
    // Log total record count.
    // const totalCount = await this.db.events.count();
    // console.log('[EventDB] Total records in DB:', totalCount);

    // Start with the complete collection.
    let collection = this.db.events.toCollection();
    // const allItemsPreFilter = await collection.toArray();
    // console.log('[EventDB] All items before filtering:', allItemsPreFilter);

    // --- Filtering by timestamp range ---
    if (filters.timestampRange) {
      // If the timestampRange is provided as a string, handle preset ranges.
      if (typeof filters.timestampRange === 'string') {
        let startTime = new Date();
        switch (filters.timestampRange) {
          case '5M':
            startTime.setMinutes(startTime.getMinutes() - 5);
            break;
          case '15M':
            startTime.setMinutes(startTime.getMinutes() - 15);
            break;
          case '30M':
            startTime.setMinutes(startTime.getMinutes() - 30);
            break;
          case '1H':
            startTime.setHours(startTime.getHours() - 1);
            break;
          case '3H':
            startTime.setHours(startTime.getHours() - 3);
            break;
          case '6H':
            startTime.setHours(startTime.getHours() - 6);
            break;
          case '12H':
            startTime.setHours(startTime.getHours() - 12);
            break;
          case '24H':
            startTime.setHours(startTime.getHours() - 24);
            break;
          case '48H':
            startTime.setHours(startTime.getHours() - 48);
            break;
          case 'week':
            startTime.setDate(startTime.getDate() - 7);
            break;
          case 'month':
            startTime.setMonth(startTime.getMonth() - 1);
            break;
          default:
            break;
        }
        // Filter items with time >= computed startTime.
        collection = collection.filter((item) => new Date(item.time) >= startTime);
      } else if (typeof filters.timestampRange === 'object') {
        // Specific range: support "from" (start), "to" (end), or both.
        if (filters.timestampRange.start && filters.timestampRange.end) {
          const start = new Date(filters.timestampRange.start);
          const end = new Date(filters.timestampRange.end);
          collection = collection.filter((item) => {
            const itemTime = new Date(item.time);
            return itemTime >= start && itemTime <= end;
          });
        } else if (filters.timestampRange.start) {
          const start = new Date(filters.timestampRange.start);
          collection = collection.filter((item) => new Date(item.time) >= start);
        } else if (filters.timestampRange.end) {
          const end = new Date(filters.timestampRange.end);
          collection = collection.filter((item) => new Date(item.time) <= end);
        }
      }
    }

    // --- Filter on Status Code ---
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      collection = collection.filter((item) => {
        // Handle null or undefined status_code
        if (item.status_code === null || item.status_code === undefined) {
          return false;
        }
        return filters.status.includes(String(item.status_code));
      });
    }
    // --- Filter on HTTP Method ---
    if (filters.method && Array.isArray(filters.method) && filters.method.length > 0) {
      const selectedMethods = filters.method.map((method) => method.toLowerCase());
      collection = collection.filter((item) => selectedMethods.includes(item.method.toLowerCase()));
    }
    // --- Filter on Path ---
    if (filters.path) {
      // Partial match search on path.
      collection = collection.filter((item) => item.path.includes(filters.path));
    }
    // --- Filter on Duration ---
    if (filters.durationMin) {
      collection = collection.filter(
        (item) => Number(item.duration) >= Number(filters.durationMin)
      );
    }
    if (filters.durationMax) {
      collection = collection.filter(
        (item) => Number(item.duration) <= Number(filters.durationMax)
      );
    }
    // --- Filter on Host ---
    if (filters.host) {
      collection = collection.filter((item) =>
        item.server.toLowerCase().includes(filters.host.toLowerCase())
      );
    }

    // --- Filter on Tags ---
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      const normalizedFilterTokens = normalizeTagFilters(filters.tags);
      if (normalizedFilterTokens.length > 0) {
        collection = collection.filter((item) => {
          const recordTokens =
            Array.isArray(item.tagTokens) && item.tagTokens.length > 0
              ? item.tagTokens
              : getRecordNormalizedTags(item).map((tag) => tag.token);
          if (!recordTokens || recordTokens.length === 0) return false;
          return normalizedFilterTokens.every((token) => recordTokens.includes(token));
        });
      }
    }

    const matchesMcpFilter = (value, selected) => {
      if (!Array.isArray(selected) || selected.length === 0) return true;
      if (!value) return false;
      const recordValues = Array.isArray(value) ? value : [value];
      const recordSet = new Set(recordValues.map((item) => String(item).toLowerCase()));
      return selected.some((item) => recordSet.has(String(item).toLowerCase()));
    };

    // --- Filter on MCP Tool / Resource / Prompt ---
    if (filters.mcpTool && Array.isArray(filters.mcpTool) && filters.mcpTool.length > 0) {
      collection = collection.filter((item) => matchesMcpFilter(item.mcp_tool, filters.mcpTool));
    }
    if (
      filters.mcpResource &&
      Array.isArray(filters.mcpResource) &&
      filters.mcpResource.length > 0
    ) {
      collection = collection.filter((item) =>
        matchesMcpFilter(item.mcp_resource, filters.mcpResource)
      );
    }
    if (filters.mcpPrompt && Array.isArray(filters.mcpPrompt) && filters.mcpPrompt.length > 0) {
      collection = collection.filter((item) =>
        matchesMcpFilter(item.mcp_prompt, filters.mcpPrompt)
      );
    }
    if (
      filters.mcpCategory &&
      Array.isArray(filters.mcpCategory) &&
      filters.mcpCategory.length > 0
    ) {
      collection = collection.filter((item) =>
        matchesMcpFilter(item.mcp_category, filters.mcpCategory)
      );
    }
    if (filters.mcpMethod && Array.isArray(filters.mcpMethod) && filters.mcpMethod.length > 0) {
      collection = collection.filter((item) =>
        matchesMcpFilter(item.mcp_method, filters.mcpMethod)
      );
    }

    // Count result after filtering
    const totalCount = await collection.count();

    // --- Sorting ---
    let sortedCollection;
    if (typeof collection.orderBy === 'function') {
      try {
        sortedCollection = collection.orderBy(sort.field);
        if (sort.order === 'desc') {
          sortedCollection = sortedCollection.reverse();
        }
      } catch (error) {
        console.error('[EventDB] orderBy error, fallback sorting:', error);
        const allItems = await collection.toArray();
        sortedCollection = allItems.sort((a, b) => {
          const field = sort.field;
          if (a[field] < b[field]) return sort.order === 'asc' ? -1 : 1;
          if (a[field] > b[field]) return sort.order === 'asc' ? 1 : -1;
          return 0;
        });
      }
    } else {
      // Fallback if orderBy is not available.
      const allItems = await collection.toArray();
      sortedCollection = allItems.sort((a, b) => {
        const field = sort.field;
        if (a[field] < b[field]) return sort.order === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return sort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // --- Pagination ---
    const offset = (page - 1) * pageSize;
    let pageItems;
    if (Array.isArray(sortedCollection)) {
      pageItems = sortedCollection.slice(offset, offset + pageSize);
    } else if (typeof sortedCollection.offset === 'function') {
      pageItems = await sortedCollection.offset(offset).limit(pageSize).toArray();
    } else {
      pageItems = [];
    }
    // console.log('[EventDB] queryEvents raw returning records:', pageItems);

    // --- Transform Results ---
    // Instead of exposing the full stored record, only return the inner raw.data along with the id.
    const results = pageItems;
    // console.log('[EventDB] Transformed results:', results);

    return { results, totalCount };
  }

  // Clear all stored events.
  async clearEvents() {
    return await this.db.events.clear();
  }

  async removeEventsNotSynced(syncRunId) {
    if (!syncRunId) return 0;
    return await this.db.events.filter((item) => item.last_synced_at !== syncRunId).delete();
  }

  async getAllTagOptions() {
    const records = await this.db.events.toArray();
    const tagMap = new Map();
    records.forEach((record) => {
      const tags = getRecordNormalizedTags(record);
      tags.forEach((tag) => {
        if (!tagMap.has(tag.token)) {
          tagMap.set(tag.token, tag.display);
        }
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b));
  }

  async getAllMcpToolOptions() {
    const records = await this.db.events.toArray();
    return collectDistinctValues(records, 'mcp_tool');
  }

  async getAllMcpResourceOptions() {
    const records = await this.db.events.toArray();
    return collectDistinctValues(records, 'mcp_resource');
  }

  async getAllMcpPromptOptions() {
    const records = await this.db.events.toArray();
    return collectDistinctValues(records, 'mcp_prompt');
  }

  async getAllMcpCategoryOptions() {
    const records = await this.db.events.toArray();
    return collectDistinctValues(records, 'mcp_category');
  }

  async getAllMcpMethodOptions() {
    const records = await this.db.events.toArray();
    return collectDistinctValues(records, 'mcp_method');
  }
}

const eventDB = new EventDB();
export default eventDB;
