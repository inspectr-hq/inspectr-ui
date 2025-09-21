// src/utils/eventDB.js
import Dexie from 'dexie';
import { normalizeTags, normalizeTagFilters } from './normalizeTags.js';

const getRecordNormalizedTags = (record) => {
  if (!record) return [];
  if (Array.isArray(record.__normalizedTags)) return record.__normalizedTags;
  const tags = normalizeTags(record?.raw?.data?.meta?.tags || []);
  record.__normalizedTags = tags;
  return tags;
};

class EventDB {
  constructor() {
    this.db = new Dexie('InspectrDB');
    // Define the "events" table with indexes on the key fields.
    // Here "id" is the primary key.
    this.db.version(1).stores({
      events: 'id, time, operation_id, method, status_code, path, duration, server'
    });
  }

  // Helper method to transform a raw SSE event into a flattened record.
  transformEvent(event) {
    const { id, data, operation_id } = event;
    const normalizedTags = normalizeTags(data?.meta?.tags || []);

    return {
      id,
      time: data.request.timestamp,
      operation_id,
      method: data.request.method,
      url: data.request.url,
      server: data.request.server,
      path: data.request.path,
      client_ip: data.request.client_ip,
      duration: data.timing.duration,
      status_code: data.response?.status,
      raw: event,
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
        (filters.tags && filters.tags.length)
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
      const results = rawRecords.map((record) => ({
        id: record.id,
        ...record.raw.data
      }));
      return { results, totalCount };
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
    const results = pageItems.map((record) => ({
      id: record.id,
      ...record.raw.data
    }));
    // console.log('[EventDB] Transformed results:', results);

    return { results, totalCount };
  }

  // Clear all stored events.
  async clearEvents() {
    return await this.db.events.clear();
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
}

const eventDB = new EventDB();
export default eventDB;
