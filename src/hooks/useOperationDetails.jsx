import { useCallback, useEffect, useRef, useState } from 'react';
import { useInspectr } from '../context/InspectrContext.jsx';

const CACHE_LIMIT = 25;

export default function useOperationDetails(operationId) {
  const { client, setToast } = useInspectr();
  const [detailOperation, setDetailOperation] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());
  const cacheOrderRef = useRef([]);

  const cacheGet = (id) => {
    if (!id) return null;
    const cache = cacheRef.current;
    if (!cache.has(id)) return null;
    const order = cacheOrderRef.current;
    const index = order.indexOf(id);
    if (index >= 0) {
      order.splice(index, 1);
    }
    order.unshift(id);
    return cache.get(id);
  };

  const cacheSet = (id, value) => {
    if (!id) return;
    const cache = cacheRef.current;
    const order = cacheOrderRef.current;
    const exists = cache.has(id);
    cache.set(id, value);
    if (exists) {
      const index = order.indexOf(id);
      if (index >= 0) {
        order.splice(index, 1);
      }
    }
    order.unshift(id);
    while (order.length > CACHE_LIMIT) {
      const evictedId = order.pop();
      cache.delete(evictedId);
    }
  };

  const fetchDetail = useCallback(
    async (id, { force } = {}) => {
      if (!id || !client?.operations?.getOperation) {
        setDetailOperation(null);
        return;
      }

      const cached = force ? null : cacheGet(id);
      if (cached) {
        setDetailOperation(cached);
        setIsFetching(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsFetching(true);

      try {
        const result = await client.operations.getOperation(id);
        if (requestIdRef.current !== requestId) return;
        setDetailOperation(result);
        cacheSet(id, result);
        setIsFetching(false);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        setIsFetching(false);
        setToast({
          message: 'Failed to load request',
          subMessage: error?.message || 'Unable to fetch the operation details.',
          type: 'error'
        });
      }
    },
    [client, setToast]
  );

  useEffect(() => {
    if (!operationId) {
      setDetailOperation(null);
      return;
    }
    fetchDetail(operationId);
  }, [operationId, fetchDetail]);

  return { detailOperation, fetchDetail, isFetching };
}
