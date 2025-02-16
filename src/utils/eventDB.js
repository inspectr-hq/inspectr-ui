// src/utils/eventDB.js
import Dexie from 'dexie';

class EventDB {
  constructor() {
    this.db = new Dexie('InspectrDB');
    // Define the "events" table with indexes on the key fields.
    // Here "id" is the primary key.
    this.db.version(1).stores({
      events: 'id, time, method, statusCode, path, latency, server'
    });
  }

  // Helper method to transform a raw SSE event into a flattened record.
  transformEvent(event) {
    const { id, time, data } = event;
    return {
      id,
      time,
      method: data.method,
      url: data.url,
      server: data.server,
      path: data.path,
      clientIp: data.clientIp,
      latency: data.latency,
      statusCode: data.response?.statusCode,
      raw: event
    };
  }

  // Store or update (upsert) an event.
  async upsertEvent(event) {
    const record = this.transformEvent(event);
    console.log('[EventDB] upsertEvent record:', record);
    return await this.db.events.put(record);
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
  // Options structure:
  // {
  //   filters: {
  //     timestampRange: '24H' | '48H' | 'week' | 'month' | { start, end },
  //     status: number,
  //     method: string,
  //     path: string,
  //     duration: { min?: number, max?: number },
  //     host: string
  //   },
  //   sort: { field: 'time'|'statusCode'|'method'|'path'|'latency', order: 'asc'|'desc' },
  //   page: number,          // 1-indexed
  //   pageSize: number
  // }
  async queryEvents(options = {}) {
    const {
      filters = {},
      sort = { field: 'time', order: 'desc' },
      page = 1,
      pageSize = 20
    } = options;

    // Log total record count.
    const totalCount = await this.db.events.count();
    console.log('[EventDB] Total records in DB:', totalCount);

    // Start with the complete collection.
    let collection = this.db.events.toCollection();
    const allItemsPreFilter = await collection.toArray();
    console.log('[EventDB] All items before filtering:', allItemsPreFilter);

    // --- Filtering by timestamp range ---
    if (filters.timestampRange) {
      let startTime = new Date();
      if (filters.timestampRange === '24H') {
        startTime.setHours(startTime.getHours() - 24);
      } else if (filters.timestampRange === '48H') {
        startTime.setHours(startTime.getHours() - 48);
      } else if (filters.timestampRange === 'week') {
        startTime.setDate(startTime.getDate() - 7);
      } else if (filters.timestampRange === 'month') {
        startTime.setMonth(startTime.getMonth() - 1);
      } else if (filters.timestampRange.start && filters.timestampRange.end) {
        // Custom range provided as an object {start, end}
        const start = new Date(filters.timestampRange.start);
        const end = new Date(filters.timestampRange.end);
        collection = collection.filter(item => {
          const itemTime = new Date(item.time);
          return itemTime >= start && itemTime <= end;
        });
      }
      // For the predefined ranges, filter items with time >= computed startTime.
      if (['24H', '48H', 'week', 'month'].includes(filters.timestampRange)) {
        collection = collection.filter(item => new Date(item.time) >= startTime);
      }
    }

    // --- Other Filters ---
    if (filters.status !== undefined) {
      collection = collection.filter(item => item.statusCode === filters.status);
    }
    if (filters.method) {
      collection = collection.filter(item => item.method.toLowerCase() === filters.method.toLowerCase());
    }
    if (filters.path) {
      // Partial match search on path.
      collection = collection.filter(item => item.path.includes(filters.path));
    }
    if (filters.duration) {
      if (filters.duration.min !== undefined) {
        collection = collection.filter(item => item.latency >= filters.duration.min);
      }
      if (filters.duration.max !== undefined) {
        collection = collection.filter(item => item.latency <= filters.duration.max);
      }
    }
    if (filters.host) {
      collection = collection.filter(item => item.server.toLowerCase().includes(filters.host.toLowerCase()));
    }

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

    // Log sorted items (for debugging).
    let sortedArray;
    if (Array.isArray(sortedCollection)) {
      sortedArray = sortedCollection;
    } else {
      sortedArray = await sortedCollection.toArray();
    }
    console.log('[EventDB] Sorted array before pagination:', sortedArray);

    // --- Pagination ---
    const offset = (page - 1) * pageSize;
    let results;
    if (Array.isArray(sortedCollection)) {
      results = sortedArray.slice(offset, offset + pageSize);
    } else if (typeof sortedCollection.offset === 'function') {
      results = await sortedCollection.offset(offset).limit(pageSize).toArray();
    } else {
      results = [];
    }
    console.log('[EventDB] queryEvents raw returning records:', results);

    // --- Transform Results ---
    // Instead of exposing the full stored record, only return the inner raw.data along with the id.
    const transformedResults = results.map(record => ({
      id: record.id,
      ...record.raw.data
    }));
    console.log('[EventDB] Transformed results:', transformedResults);

    return transformedResults;
  }

  // Clear all stored events.
  async clearEvents() {
    return await this.db.events.clear();
  }
}

const eventDB = new EventDB();
export default eventDB;
