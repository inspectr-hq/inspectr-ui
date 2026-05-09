import { useInspectr } from '../context/InspectrContext.jsx';
import useStorageAdapter from './useStorageAdapter.jsx';

export default function useInspectrStorage(key, defaultValue) {
  const { storageAdapter } = useInspectr();
  return useStorageAdapter(key, defaultValue, storageAdapter);
}
