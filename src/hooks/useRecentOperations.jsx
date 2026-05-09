// src/hooks/useRecentOperations.jsx
import { useLiveQuery } from 'dexie-react-hooks';
import { useInspectr } from '../context/InspectrContext.jsx';

const DEFAULT_RESULT = Object.freeze({ results: [], totalCount: 0 });

export default function useRecentOperations(limit = 10) {
  const { eventDB } = useInspectr();
  const pageSize = typeof limit === 'number' && limit > 0 ? limit : 10;

  const data =
    useLiveQuery(
      () =>
        eventDB.queryEvents({
          sort: { field: 'time', order: 'desc' },
          page: 1,
          pageSize
        }),
      [eventDB, pageSize],
      DEFAULT_RESULT,
      { throttle: 200 }
    ) || DEFAULT_RESULT;

  const results = Array.isArray(data.results) ? data.results : [];
  const totalCount = typeof data.totalCount === 'number' ? data.totalCount : 0;

  return { results, totalCount };
}
