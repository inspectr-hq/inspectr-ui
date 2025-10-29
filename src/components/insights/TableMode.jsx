// src/components/insights/TableMode.jsx

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from '@tremor/react';
import EmptyState from './EmptyState.jsx';
import StatusBadge from './StatusBadge.jsx';
import { getMethodTextClass } from '../../utils/getMethodClass.js';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';
import DateRangeButtons from '../DateRangeButtons.jsx';
import { findPresetByLabel, getEndOfDay, getStartOfDay } from '../../utils/timeRange.js';
import { useInspectr } from '../../context/InspectrContext.jsx';

const STATUS_COLOR_PALETTE = ['emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'slate', 'stone'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PANEL_HEIGHT = 480;
const TABLE_PAGE_SIZE = 50;

const normalizeStatus = (status) => (status || status === 0 ? String(status) : 'Unknown');
const normalizeMethod = (method) => (method ? method.toUpperCase() : 'UNKNOWN');
const normalizeHost = (host) => (host && host.trim() ? host : 'Unknown');
const normalizePath = (path) => (path && path.trim() ? path : 'Unknown');
const extractTimestampMs = (operation) => {
  if (Number.isFinite(operation?.timestampMs)) return operation.timestampMs;
  const parsed = Date.parse(operation?.timestamp);
  return Number.isNaN(parsed) ? null : parsed;
};

const MAX_TAG_ITEMS = 16;
const MAX_PATH_ITEMS = 18;

const MAX_STATUS_ITEMS = 50;

const FACET_CONFIG = [
  { key: 'status', dimension: 'status', limit: MAX_STATUS_ITEMS },
  { key: 'method', dimension: 'method', limit: 12 },
  { key: 'host', dimension: 'host', limit: 12 },
  { key: 'path', dimension: 'path', limit: MAX_PATH_ITEMS },
  { key: 'tags', dimension: 'tag', limit: MAX_TAG_ITEMS }
];

const sortFacetItems = (items) =>
  [...items].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });

const ensureSelectedFacetValues = (items, selectedValues, createItem) => {
  if (!selectedValues.length) return items;
  const map = new Map(items.map((item) => [item.value, item]));
  selectedValues.forEach((value) => {
    if (!map.has(value)) {
      map.set(value, createItem(value));
    }
  });
  return sortFacetItems(Array.from(map.values()));
};

const MS_INTERVALS = {
  hour: 60 * 60 * 1000,
  day: DAY_IN_MS,
  week: 7 * DAY_IN_MS
};

const getBucketMeta = (timestamp, interval = 'day') => {
  if (!timestamp) {
    return { label: 'Unknown', sortValue: Number.POSITIVE_INFINITY, startMs: null, endMs: null };
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return { label: 'Unknown', sortValue: Number.POSITIVE_INFINITY, startMs: null, endMs: null };
  }

  const duration = MS_INTERVALS[interval] ?? DAY_IN_MS;
  const startMs = date.getTime();
  const endMs = startMs + duration - 1;

  let label;
  if (interval === 'hour') {
    label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (interval === 'week') {
    label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return { label, sortValue: startMs, startMs, endMs };
};

const pickTotalRequests = (record) =>
  Number(record?.requests ?? record?.total_requests ?? record?.count ?? 0);

const FACET_VALUE_EXTRACTORS = {
  status: (row) => row?.status ?? row?.key ?? row?.value,
  method: (row) => row?.method ?? row?.key ?? row?.value,
  host: (row) => row?.host ?? row?.key ?? row?.value,
  path: (row) => row?.path ?? row?.key ?? row?.value,
  tags: (row) => row?.tag ?? row?.key ?? row?.value
};

const FACET_NORMALIZERS = {
  status: normalizeStatus,
  method: normalizeMethod,
  host: normalizeHost,
  path: normalizePath,
  tags: (value) => (value && typeof value === 'string' ? value : 'Unknown')
};

const buildFacetItemsFromAggregate = (rows, key) => {
  const extractValue = FACET_VALUE_EXTRACTORS[key];
  const normalizeValue = FACET_NORMALIZERS[key] || ((value) => value ?? 'Unknown');
  if (!extractValue) return [];

  const items = rows
    .map((row) => {
      const rawValue = extractValue(row);
      const value = normalizeValue(rawValue);
      if (!value) return null;
      const count = Number(row?.count ?? row?.total ?? 0);
      return {
        value,
        label: value,
        count: Number.isFinite(count) ? count : 0
      };
    })
    .filter(Boolean);

  return sortFacetItems(items);
};

const buildFacetPlaceholderItem = (key, rawValue) => {
  const normalizeValue = FACET_NORMALIZERS[key] || ((value) => value ?? 'Unknown');
  const value = normalizeValue(rawValue);
  return {
    value,
    label: value,
    count: 0
  };
};

const buildChartSeriesFromBuckets = (buckets, categories, defaultValues, interval) => {
  if (!Array.isArray(buckets) || buckets.length === 0) {
    return [];
  }

  const knownCategories = categories.filter((category) => category !== 'Other');
  const includeOther = categories.includes('Other');

  return buckets
    .map((entry) => {
      const timestamp = entry?.timestamp ?? entry?.date ?? entry?.bucket ?? null;
      const { label, sortValue, startMs, endMs } = getBucketMeta(timestamp, interval);
      const record = {
        day: label,
        dayKey: timestamp || sortValue,
        startMs,
        endMs,
        sortValue,
        ...defaultValues
      };

      let knownSum = 0;
      knownCategories.forEach((category) => {
        // Prefer values from the bucket's `series` map, fall back to top-level for compatibility
        const value = Number(entry?.series?.[category] ?? entry?.[category] ?? 0);
        if (Number.isFinite(value)) {
          record[category] = value;
          knownSum += value;
        }
      });

      if (includeOther) {
        const total = pickTotalRequests(entry);
        const otherValue = Number.isFinite(total) ? Math.max(0, total - knownSum) : 0;
        record.Other = otherValue;
      }

      return record;
    })
    .sort((a, b) => a.sortValue - b.sortValue)
    .map(({ sortValue, ...record }) => record);
};

const DURATION_BUCKETS = [
  { key: 'lt-100', label: '< 100 ms', min: 0, max: 100 },
  { key: '100-250', label: '100 – 250 ms', min: 100, max: 250 },
  { key: '250-500', label: '250 – 500 ms', min: 250, max: 500 },
  { key: '500-1000', label: '0.5 – 1 s', min: 500, max: 1000 },
  { key: '1000-3000', label: '1 – 3 s', min: 1000, max: 3000 },
  { key: 'gte-3000', label: '> 3 s', min: 3000, max: null }
];
const UNKNOWN_DURATION_BUCKET = { key: 'unknown', label: 'Unknown duration' };

const getDurationBucketKey = (duration) => {
  const numeric = Number(duration);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return UNKNOWN_DURATION_BUCKET.key;
  }
  const bucket = DURATION_BUCKETS.find((entry) => {
    const minOk = entry.min == null || numeric >= entry.min;
    const maxOk = entry.max == null || numeric < entry.max;
    return minOk && maxOk;
  });
  return bucket ? bucket.key : UNKNOWN_DURATION_BUCKET.key;
};

const buildDurationCountItems = (operations) => {
  const counts = new Map();
  [...DURATION_BUCKETS, UNKNOWN_DURATION_BUCKET].forEach((bucket) => {
    counts.set(bucket.key, {
      value: bucket.key,
      label: bucket.label,
      count: 0
    });
  });

  operations.forEach((operation) => {
    const key = getDurationBucketKey(operation.duration);
    const entry = counts.get(key);
    if (entry) {
      entry.count += 1;
    }
  });

  return Array.from(counts.values())
    .filter((entry) => entry.count > 0)
    .sort((a, b) => {
      if (a.value === UNKNOWN_DURATION_BUCKET.key) return 1;
      if (b.value === UNKNOWN_DURATION_BUCKET.key) return -1;
      const order = [
        'lt-100',
        '100-250',
        '250-500',
        '500-1000',
        '1000-3000',
        'gte-3000'
      ];
      return order.indexOf(a.value) - order.indexOf(b.value);
    });
};

export default function TableMode({ operations }) {
  if (!operations.length) {
    return <EmptyState message="No operations available for tabular view." />;
  }

  const { client } = useInspectr();
  const [tablePage, setTablePage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [tableMeta, setTableMeta] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [chartState, setChartState] = useState({
    data: [],
    interval: 'day',
    loading: false,
    error: null,
    total: 0
  });
  const [facetState, setFacetState] = useState(() => ({
    status: { items: [], total: 0, loading: false, error: null },
    method: { items: [], total: 0, loading: false, error: null },
    host: { items: [], total: 0, loading: false, error: null },
    path: { items: [], total: 0, loading: false, error: null },
    tags: { items: [], total: 0, loading: false, error: null }
  }));
  const referenceDate = useMemo(() => new Date(), []);
  const defaultPreset = useMemo(() => findPresetByLabel('30D', referenceDate), [referenceDate]);
  const defaultStart = defaultPreset?.start ?? getStartOfDay(referenceDate);
  const defaultEnd = defaultPreset?.end ?? getEndOfDay(referenceDate);

  const [selectedRange, setSelectedRange] = useState(defaultPreset?.label ?? 'Custom');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customStartTime, setCustomStartTime] = useState('00:00');
  const [customEndDate, setCustomEndDate] = useState(referenceDate.toISOString().split('T')[0]);
  const [customEndTime, setCustomEndTime] = useState('23:59');
  const [rangeError, setRangeError] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(() => ({
    status: new Set(),
    method: new Set(),
    host: new Set(),
    tags: new Set(),
    path: new Set(),
    duration: new Set()
  }));
  const statusFilterValues = useMemo(
    () => Array.from(selectedFilters.status),
    [selectedFilters.status]
  );
  const methodFilterValues = useMemo(
    () => Array.from(selectedFilters.method),
    [selectedFilters.method]
  );
  const hostFilterValues = useMemo(() => Array.from(selectedFilters.host), [selectedFilters.host]);
  const tagFilterValues = useMemo(() => Array.from(selectedFilters.tags), [selectedFilters.tags]);
  const pathFilterValues = useMemo(() => Array.from(selectedFilters.path), [selectedFilters.path]);
  const durationFilterValues = useMemo(
    () => Array.from(selectedFilters.duration),
    [selectedFilters.duration]
  );
  const selectedDurationBuckets = useMemo(
    () =>
      durationFilterValues
        .map((value) =>
          value === UNKNOWN_DURATION_BUCKET.key
            ? UNKNOWN_DURATION_BUCKET
            : DURATION_BUCKETS.find((bucket) => bucket.key === value)
        )
        .filter(Boolean),
    [durationFilterValues]
  );
  const filtersSignature = useMemo(
    () =>
      JSON.stringify({
        status: [...statusFilterValues].sort(),
        method: [...methodFilterValues].sort(),
        host: [...hostFilterValues].sort(),
        tags: [...tagFilterValues].sort(),
        path: [...pathFilterValues].sort(),
        duration: [...durationFilterValues].sort()
      }),
    [
      statusFilterValues,
      methodFilterValues,
      hostFilterValues,
      tagFilterValues,
      pathFilterValues,
      durationFilterValues
    ]
  );
  const buildStatsQueryFilters = useMemo(
    () => ({
      get(skipKey) {
        const query = {};
        const assign = (key, values) => {
          if (!values.length) return;
          query[key] = values.length === 1 ? values[0] : values;
        };

        if (skipKey !== 'status') assign('status', statusFilterValues);
        if (skipKey !== 'method') assign('method', methodFilterValues);
        if (skipKey !== 'host') assign('host', hostFilterValues);
        if (skipKey !== 'path') assign('path', pathFilterValues);
        if (skipKey !== 'tags') assign('tag', tagFilterValues);

        return query;
      }
    }),
    [hostFilterValues, methodFilterValues, pathFilterValues, statusFilterValues, tagFilterValues]
  );
  const filterCardRef = useRef(null);
  const [filterCardHeight, setFilterCardHeight] = useState(null);

  useLayoutEffect(() => {
    const element = filterCardRef.current;
    if (!element) return;

    const updateHeight = () => {
      setFilterCardHeight(element.offsetHeight || null);
    };
    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    setTablePage(1);
  }, [filtersSignature, start, end]);

  useEffect(() => {
    if (!showCustomPicker) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime())) {
      setCustomStartDate(startDate.toISOString().split('T')[0]);
      setCustomStartTime(startDate.toISOString().split('T')[1]?.slice(0, 5) || '00:00');
    }
    if (!Number.isNaN(endDate.getTime())) {
      setCustomEndDate(endDate.toISOString().split('T')[0]);
      setCustomEndTime(endDate.toISOString().split('T')[1]?.slice(0, 5) || '23:59');
    }
  }, [showCustomPicker, start, end]);

  const startMs = useMemo(() => Date.parse(start), [start]);
  const endMs = useMemo(() => Date.parse(end), [end]);
  const hasValidRange = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs;

  const operationsWithinRange = useMemo(() => {
    if (!hasValidRange) return [];
    return operations.filter((operation) => {
      const timestampMs = extractTimestampMs(operation);
      if (!Number.isFinite(timestampMs)) return false;
      return timestampMs >= startMs && timestampMs <= endMs;
    });
  }, [operations, hasValidRange, startMs, endMs]);

  const tableRows = useMemo(() => {
    return tableData.map((item) => {
      let derivedPath = item.path || '';
      if (!derivedPath && item.url) {
        try {
          const parsed = new URL(item.url);
          derivedPath = parsed.pathname || parsed.href;
        } catch {
          derivedPath = item.url;
        }
      }
      const fallbackId =
        item.operation_id ||
        item.id ||
        item.uuid ||
        (item.timestamp ? `ts-${item.timestamp}` : null) ||
        (item.url ? `url-${item.url}` : null) ||
        (derivedPath ? `path-${derivedPath}` : null);
      return {
        id: fallbackId || undefined,
        status: item.status ?? item.status_code ?? null,
        method: (item.method || item.http_method || 'unknown').toUpperCase(),
        path: derivedPath || '/',
        duration: item.duration ?? null,
        timestamp: item.timestamp ?? null,
        host: item.server || item.host || ''
      };
    });
  }, [tableData]);

  const rawTablePage = tableMeta?.page ?? tablePage;
  const normalizedPage = Number.isFinite(Number(rawTablePage))
    ? Number(rawTablePage)
    : tablePage;
  const tableCurrentPage = normalizedPage >= 1 ? normalizedPage : 1;
  const rawTableLimit = tableMeta?.limit ?? tableMeta?.per_page ?? TABLE_PAGE_SIZE;
  const tableLimit = Number.isFinite(Number(rawTableLimit))
    ? Number(rawTableLimit)
    : TABLE_PAGE_SIZE;
  const rawTotalCount = tableMeta?.total ?? tableMeta?.total_count ?? null;
  const tableTotalCount =
    rawTotalCount === null || rawTotalCount === undefined
      ? null
      : Number.isFinite(Number(rawTotalCount))
        ? Number(rawTotalCount)
        : null;
  const rawTotalPages =
    tableMeta?.total_pages ??
    (tableTotalCount !== null && tableLimit
      ? Math.max(1, Math.ceil(tableTotalCount / tableLimit))
      : Math.max(1, tableCurrentPage));
  const tableTotalPages = Number.isFinite(Number(rawTotalPages))
    ? Number(rawTotalPages)
    : Math.max(1, tableCurrentPage);
  const canGoPrevious = tableCurrentPage > 1;
  const canGoNext = tableCurrentPage < tableTotalPages;

  useEffect(() => {
    if (!hasValidRange) {
      setTableData([]);
      setTableMeta(null);
      setTableError(null);
      setTableLoading(false);
      return;
    }
    if (!client?.operations?.listCompact) {
      return;
    }

    let cancelled = false;

    const fetchTableData = async () => {
      setTableLoading(true);
      setTableError(null);
      try {
        const query = {
          page: tablePage,
          limit: TABLE_PAGE_SIZE,
          since: start,
          until: end,
          sortField: 'timestamp',
          sortDirection: 'desc'
        };

        if (statusFilterValues.length === 1) {
          query.status = statusFilterValues[0];
        } else if (statusFilterValues.length > 1) {
          query.statuses = statusFilterValues;
        }

        if (methodFilterValues.length === 1) {
          query.method = methodFilterValues[0];
        } else if (methodFilterValues.length > 1) {
          query.methods = methodFilterValues;
        }

        if (hostFilterValues.length === 1) {
          query.host = hostFilterValues[0];
        } else if (hostFilterValues.length > 1) {
          query.hosts = hostFilterValues;
        }

        if (pathFilterValues.length === 1) {
          query.path = pathFilterValues[0];
        } else if (pathFilterValues.length > 1) {
          query.paths = pathFilterValues;
        }

        if (tagFilterValues.length === 1) {
          query.tag = tagFilterValues[0];
        } else if (tagFilterValues.length > 1) {
          query.tagsAny = tagFilterValues;
        }

        const hasUnknownDuration = selectedDurationBuckets.some(
          (bucket) => bucket.key === UNKNOWN_DURATION_BUCKET.key
        );
        const numericDurationBuckets = selectedDurationBuckets.filter(
          (bucket) => bucket.key !== UNKNOWN_DURATION_BUCKET.key
        );
        if (!hasUnknownDuration && numericDurationBuckets.length > 0) {
          let minDuration = null;
          let maxDuration = null;
          numericDurationBuckets.forEach((bucket) => {
            if (bucket.min !== undefined && bucket.min !== null) {
              minDuration = minDuration === null ? bucket.min : Math.min(minDuration, bucket.min);
            }
            if (bucket.max !== undefined && bucket.max !== null) {
              maxDuration = maxDuration === null ? bucket.max : Math.max(maxDuration, bucket.max);
            }
          });
          if (minDuration !== null) query.minDuration = minDuration;
          if (maxDuration !== null) query.maxDuration = maxDuration;
        }

        const response = await client.operations.listCompact(query);
        if (cancelled) return;

        const compactOperations = Array.isArray(response?.operations) ? response.operations : [];
        setTableData(compactOperations);
        setTableMeta(response?.meta || null);

        const metaPage = Number(response?.meta?.page);
        const metaTotalPages = Number(response?.meta?.total_pages);
        if (Number.isFinite(metaPage) && metaPage >= 1 && metaPage !== tablePage) {
          setTablePage(metaPage);
        } else if (
          Number.isFinite(metaTotalPages) &&
          metaTotalPages >= 1 &&
          tablePage > metaTotalPages
        ) {
          setTablePage(metaTotalPages);
        }
      } catch (error) {
        if (cancelled) return;
        setTableError(error instanceof Error ? error.message : 'Failed to load operations');
        setTableData([]);
        setTableMeta(null);
      } finally {
        if (!cancelled) {
          setTableLoading(false);
        }
      }
    };

    fetchTableData();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    tablePage,
    start,
    end,
    hasValidRange,
    filtersSignature,
    statusFilterValues,
    methodFilterValues,
    hostFilterValues,
    tagFilterValues,
    pathFilterValues,
    selectedDurationBuckets
  ]);

  useEffect(() => {
    if (!hasValidRange) {
      setChartState({
        data: [],
        interval: 'day',
        loading: false,
        error: null,
        total: 0
      });
      return;
    }
    if (!client?.stats?.getBuckets) {
      return;
    }

    let cancelled = false;
    setChartState((prev) => ({ ...prev, loading: true, error: null }));

    const fetchBuckets = async () => {
      const filters = buildStatsQueryFilters.get(undefined);
      try {
        const response = await client.stats.getBuckets({
          from: start,
          to: end,
          interval: 'day',
          group: 'status',
          ...filters
        });
        if (cancelled) return;
        // API returns an array of bucket objects in `data`, each with a `series` map of status counts
        const buckets = Array.isArray(response?.data) ? response.data : [];
        const interval = response?.meta?.interval || 'day';
        const total = buckets.reduce((sum, record) => sum + pickTotalRequests(record), 0);
        setChartState({
          data: buckets,
          interval,
          loading: false,
          error: null,
          total
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load chart data';
        setChartState({
          data: [],
          interval: 'day',
          loading: false,
          error: message,
          total: 0
        });
      }
    };

    fetchBuckets();

    return () => {
      cancelled = true;
    };
  }, [buildStatsQueryFilters, client, end, hasValidRange, start]);

  useEffect(() => {
    if (!hasValidRange) {
      setFacetState((prev) => {
        const next = { ...prev };
        FACET_CONFIG.forEach(({ key }) => {
          next[key] = { items: [], total: 0, loading: false, error: null };
        });
        return next;
      });
      return;
    }
    if (!client?.stats?.aggregateBy) {
      return;
    }

    let cancelled = false;

    setFacetState((prev) => {
      const next = { ...prev };
      FACET_CONFIG.forEach(({ key }) => {
        next[key] = { ...prev[key], loading: true, error: null };
      });
      return next;
    });

    const fetchFacets = async () => {
      const common = {
        from: start,
        to: end,
        metrics: ['count'],
        order: '-count'
      };

      const results = await Promise.all(
        FACET_CONFIG.map(async (config) => {
          const filters = buildStatsQueryFilters.get(config.key);
          try {
            const response = await client.stats.aggregateBy(config.dimension, {
              ...common,
              ...filters,
              limit: config.limit
            });
            const rows = response?.data?.rows ?? [];
            const items = buildFacetItemsFromAggregate(rows, config.key);
            const total = items.reduce(
              (sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0),
              0
            );
            return { key: config.key, items, total, error: null };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to load facet data';
            return { key: config.key, items: [], total: 0, error: message };
          }
        })
      );

      if (cancelled) return;

      setFacetState((prev) => {
        const next = { ...prev };
        results.forEach(({ key, items, total, error }) => {
          next[key] = { items, total, error, loading: false };
        });
        return next;
      });
    };

    fetchFacets();

    return () => {
      cancelled = true;
    };
  }, [buildStatsQueryFilters, client, end, hasValidRange, start]);

  const statusItems = useMemo(() => {
    const base = facetState.status.items;
    return ensureSelectedFacetValues(base, statusFilterValues, (value) =>
      buildFacetPlaceholderItem('status', value)
    );
  }, [facetState.status.items, statusFilterValues]);
  const methodItems = useMemo(() => {
    const base = facetState.method.items;
    return ensureSelectedFacetValues(base, methodFilterValues, (value) =>
      buildFacetPlaceholderItem('method', value)
    );
  }, [facetState.method.items, methodFilterValues]);
  const hostItems = useMemo(() => {
    const base = facetState.host.items;
    return ensureSelectedFacetValues(base, hostFilterValues, (value) =>
      buildFacetPlaceholderItem('host', value)
    ).slice(0, 12);
  }, [facetState.host.items, hostFilterValues]);
  const tagItems = useMemo(() => {
    const base = facetState.tags.items;
    return ensureSelectedFacetValues(base, tagFilterValues, (value) =>
      buildFacetPlaceholderItem('tags', value)
    ).slice(0, MAX_TAG_ITEMS);
  }, [facetState.tags.items, tagFilterValues]);
  const pathItems = useMemo(() => {
    const base = facetState.path.items;
    return ensureSelectedFacetValues(base, pathFilterValues, (value) =>
      buildFacetPlaceholderItem('path', value)
    ).slice(0, MAX_PATH_ITEMS);
  }, [facetState.path.items, pathFilterValues]);
  const durationItems = useMemo(
    () => buildDurationCountItems(operationsWithinRange),
    [operationsWithinRange]
  );

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: 'Status code', items: statusItems },
      { key: 'method', label: 'Method', items: methodItems },
      { key: 'path', label: 'Path', items: pathItems },
      { key: 'duration', label: 'Duration', items: durationItems },
      { key: 'tags', label: 'Tags', items: tagItems },
      { key: 'host', label: 'Host', items: hostItems }
    ],
    [durationItems, hostItems, methodItems, pathItems, statusItems, tagItems]
  );

  const topStatusValues = useMemo(
    () => statusItems.slice(0, 5).map((item) => item.value),
    [statusItems]
  );
  const prioritizedStatuses = useMemo(() => {
    const priorities = [...topStatusValues];
    statusFilterValues.forEach((status) => {
      if (!priorities.includes(status)) {
        priorities.push(status);
      }
    });
    return priorities;
  }, [statusFilterValues, topStatusValues]);
  const remainingStatuses = useMemo(() => {
    const prioritySet = new Set(prioritizedStatuses);
    return statusItems
      .map((item) => item.value)
      .filter((status) => !prioritySet.has(status));
  }, [prioritizedStatuses, statusItems]);
  const chartCategories = useMemo(() => {
    const categories = [...prioritizedStatuses];
    if (remainingStatuses.length > 0) {
      categories.push('Other');
    }
    return categories;
  }, [prioritizedStatuses, remainingStatuses]);
  const chartColors = useMemo(
    () =>
      chartCategories.map(
        (_, index) => STATUS_COLOR_PALETTE[index % STATUS_COLOR_PALETTE.length]
      ),
    [chartCategories]
  );

  const defaultCategoryValues = useMemo(() => {
    const base = {};
    chartCategories.forEach((category) => {
      base[category] = 0;
    });
    return base;
  }, [chartCategories]);

  const toggleFilter = (group, value) => {
    setSelectedFilters((prev) => {
      const nextGroup = new Set(prev[group]);
      if (nextGroup.has(value)) {
        nextGroup.delete(value);
      } else {
        nextGroup.add(value);
      }
      return { ...prev, [group]: nextGroup };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      status: new Set(),
      method: new Set(),
      host: new Set(),
      tags: new Set(),
      path: new Set(),
      duration: new Set()
    });
  };

  const barChartData = useMemo(() => {
    if (!hasValidRange) return [];
    if (!chartState.data.length) return [];
    return buildChartSeriesFromBuckets(
      chartState.data,
      chartCategories,
      defaultCategoryValues,
      chartState.interval
    );
  }, [chartCategories, chartState.data, chartState.interval, defaultCategoryValues, hasValidRange]);
  const rangeTotalRequests = useMemo(() => {
    if (!hasValidRange) return 0;
    return Number.isFinite(chartState.total) ? chartState.total : 0;
  }, [chartState.total, hasValidRange]);
  const visibleRequests = useMemo(() => {
    if (!hasValidRange) return 0;
    if (chartState.data.length > 0) {
      return chartState.total;
    }
    if (statusFilterValues.length > 0) {
      return statusItems.reduce((sum, item) => {
        if (statusFilterValues.includes(item.value)) {
          const value = Number(item.count) || 0;
          return sum + value;
        }
        return sum;
      }, 0);
    }
    return rangeTotalRequests;
  }, [
    chartState.data,
    chartState.total,
    hasValidRange,
    rangeTotalRequests,
    statusFilterValues,
    statusItems
  ]);

  const activeFilterCount =
    selectedFilters.status.size +
    selectedFilters.method.size +
    selectedFilters.host.size +
    selectedFilters.tags.size +
    selectedFilters.path.size +
    selectedFilters.duration.size;
  const rangeSummary = hasValidRange
    ? `${formatTimestamp(start)} – ${formatTimestamp(end)}`
    : 'Invalid range selected';

  const handlePresetSelect = (item) => {
    setSelectedRange(item.label);
    setStart(item.start);
    setEnd(item.end);
    setShowCustomPicker(false);
    setRangeError('');
  };

  const handleCustomToggle = () => {
    setShowCustomPicker((prev) => !prev);
    if (!showCustomPicker) {
      setSelectedRange('Custom');
      setRangeError('');
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setRangeError('Select both start and end dates.');
      return;
    }

    const parsedStart = new Date(`${customStartDate}T${customStartTime || '00:00'}:00`);
    const parsedEnd = new Date(`${customEndDate}T${customEndTime || '00:00'}:00`);

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      setRangeError('Unable to parse custom range.');
      return;
    }

    if (parsedStart > parsedEnd) {
      setRangeError('Start must be before end.');
      return;
    }

    setStart(parsedStart.toISOString());
    setEnd(parsedEnd.toISOString());
    setSelectedRange('Custom');
    setShowCustomPicker(false);
    setRangeError('');
  };

  const handleBarValueChange = (value) => {
    if (!value || (value.eventType !== 'bar' && value.eventType !== 'category')) return;

    const { startMs: barStart, endMs: barEnd, categoryClicked } = value;
    const shouldUpdateRange = value.eventType === 'bar';
    const hasRange =
      shouldUpdateRange && Number.isFinite(barStart) && Number.isFinite(barEnd) && barEnd >= barStart;

    if (hasRange) {
      setStart(new Date(barStart).toISOString());
      setEnd(new Date(barEnd).toISOString());
      setSelectedRange('Custom');
    }

    if (categoryClicked) {
      if (categoryClicked === 'Other') {
        if (remainingStatuses.length > 0) {
          setSelectedFilters((prev) => {
            const nextStatus = new Set(prev.status);
            const allSelected = remainingStatuses.every((status) => nextStatus.has(status));
            if (allSelected) {
              remainingStatuses.forEach((status) => nextStatus.delete(status));
            } else {
              remainingStatuses.forEach((status) => nextStatus.add(status));
            }
            return { ...prev, status: nextStatus };
          });
        }
      } else {
        toggleFilter('status', categoryClicked);
      }
    }

    setShowCustomPicker(false);
    setRangeError('');
  };

  const tableCardHeight = filterCardHeight ?? DEFAULT_PANEL_HEIGHT;

  return (
    <div className="space-y-6">
      <Card className="rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Requests by status code
            </h3>
            <p className="mt-1 text-sm text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
              Daily request volume stacked per HTTP response code.
            </p>
            <p className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
              Range: {rangeSummary}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="relative">
              <DateRangeButtons
                selectedRange={selectedRange}
                onSelect={handlePresetSelect}
                onCustomClick={handleCustomToggle}
              />
              {showCustomPicker ? (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-md border border-tremor-border bg-tremor-background p-3 shadow-xl dark:border-dark-tremor-border dark:bg-gray-950">
                  <div className="flex flex-col gap-3 text-xs text-tremor-content dark:text-dark-tremor-content">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide">
                        Start
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(event) => {
                            setCustomStartDate(event.target.value);
                            setRangeError('');
                          }}
                          className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                        />
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(event) => {
                            setCustomStartTime(event.target.value);
                            setRangeError('');
                          }}
                          className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide">End</span>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(event) => {
                            setCustomEndDate(event.target.value);
                            setRangeError('');
                          }}
                          className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                        />
                        <input
                          type="time"
                          value={customEndTime}
                          onChange={(event) => {
                            setCustomEndTime(event.target.value);
                            setRangeError('');
                          }}
                          className="w-full rounded border border-tremor-border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand dark:border-dark-tremor-border dark:bg-gray-900"
                        />
                      </div>
                    </div>
                    {rangeError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-500">{rangeError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomPicker(false);
                          setRangeError('');
                        }}
                        className="rounded border border-tremor-border px-2 py-1 text-xs text-tremor-content hover:bg-gray-100 dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCustomRange}
                        className="rounded bg-tremor-brand px-3 py-1 text-xs font-semibold text-tremor-brand-inverted hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:hover:bg-dark-tremor-brand-emphasis"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="text-sm text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
              {visibleRequests.toLocaleString()} of{' '}
              {rangeTotalRequests.toLocaleString()} requests in range visible
            </div>
            {operationsWithinRange.length !== operations.length ? (
              <div className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                {operations.length.toLocaleString()} total requests loaded
              </div>
            ) : null}
          </div>
        </div>
        {!hasValidRange ? (
          <div className="mt-6 rounded border border-dashed border-rose-500/60 bg-rose-50 py-6 text-center text-sm text-rose-700 dark:border-rose-500/70 dark:bg-rose-900/20 dark:text-rose-200">
            Adjust the date range to view request trends.
          </div>
        ) : chartState.loading ? (
          <div className="mt-8 rounded border border-dashed border-tremor-border bg-white py-12 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background">
            Loading chart data…
          </div>
        ) : chartState.error ? (
          <div className="mt-8 rounded border border-dashed border-rose-500/60 bg-rose-50 py-12 text-center text-sm text-rose-700 dark:border-rose-500/70 dark:bg-rose-900/20 dark:text-rose-200">
            {chartState.error}
          </div>
        ) : barChartData.length > 0 ? (
          <BarChart
            className="mt-6"
            data={barChartData}
            index="day"
            categories={chartCategories}
            colors={chartColors}
            stack
            onValueChange={handleBarValueChange}
            valueFormatter={(value) => value.toLocaleString()}
          />
        ) : (
          <div className="mt-8 rounded border border-dashed border-tremor-border bg-white py-12 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:bg-dark-tremor-background">
            No data to visualize for the selected filters.
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <Card
          ref={filterCardRef}
          className="flex h-full flex-col rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border"
          style={{ minHeight: DEFAULT_PANEL_HEIGHT }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="mt-4 space-y-6">
            {filterGroups.map((group) => (
              <div key={group.key}>
                <span className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                  {group.label}
                </span>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isSelected = selectedFilters[group.key].has(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleFilter(group.key, item.value)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                            : 'text-tremor-content hover:bg-gray-100 dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted'
                        }`}
                        title={item.label}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="ml-3 text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                          {item.count.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                  {group.items.length === 0 && (
                    <div className="px-2 py-2 text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="flex h-full flex-col rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border"
          style={{ minHeight: tableCardHeight, maxHeight: tableCardHeight }}
        >
          <div className="flex flex-col gap-2 border-b border-tremor-border px-4 py-3 dark:border-dark-tremor-border lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Request details
            </p>
            <p className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
              {tableLoading
                ? 'Loading…'
                : `${tableRows.length.toLocaleString()} results${
                    tableTotalCount !== null ? ` • ${tableTotalCount.toLocaleString()} total` : ''
                  }`}
              {activeFilterCount > 0 && <span> • Filters active</span>}
              {tableError && !tableLoading && (
                <span className="ml-2 text-rose-500 dark:text-rose-400">
                  {tableError}
                </span>
              )}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full min-h-0 overflow-x-auto">
              <div className="h-full min-h-0 overflow-y-auto">
                <Table className="min-w-full">
                  <TableHead className="sticky top-0 z-10 bg-white shadow-sm dark:bg-dark-tremor-background">
                    <TableRow>
                      <TableHeaderCell>Timestamp</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Method</TableHeaderCell>
                      <TableHeaderCell>Path</TableHeaderCell>
                      <TableHeaderCell>Duration</TableHeaderCell>
                      <TableHeaderCell>Host</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!hasValidRange ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content-subtle"
                        >
                          Select a valid date range to view operations.
                        </TableCell>
                      </TableRow>
                    ) : tableLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content-subtle"
                        >
                          Loading operations…
                        </TableCell>
                      </TableRow>
                    ) : tableError ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-rose-500 dark:text-rose-400"
                        >
                          {tableError}
                        </TableCell>
                      </TableRow>
                    ) : tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-tremor-content-subtle dark:text-dark-tremor-content-subtle"
                        >
                          No operations match the selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((operation, index) => (
                        <TableRow key={operation.id ?? index}>
                          <TableCell className="min-w-[160px]">
                            {formatTimestamp(operation.timestamp)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={operation.status} />
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${getMethodTextClass(operation.method)}`}>
                              {operation.method}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{operation.path}</TableCell>
                          <TableCell>{formatDuration(operation.duration)}</TableCell>
                          <TableCell>{operation.host || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div className="border-t border-tremor-border px-4 py-3 text-xs text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content-subtle">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Page {tableCurrentPage.toLocaleString()} of {tableTotalPages.toLocaleString()}
                {tableTotalCount !== null ? (
                  <span> • {tableTotalCount.toLocaleString()} records</span>
                ) : null}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                  disabled={!canGoPrevious || tableLoading}
                  className="rounded border border-tremor-border px-3 py-1 text-xs font-medium text-tremor-content hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTablePage((prev) => {
                      if (!canGoNext) return prev;
                      return prev + 1;
                    })
                  }
                  disabled={!canGoNext || tableLoading}
                  className="rounded border border-tremor-border px-3 py-1 text-xs font-medium text-tremor-content hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-tremor-border dark:text-dark-tremor-content dark:hover:bg-dark-tremor-background-muted"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
