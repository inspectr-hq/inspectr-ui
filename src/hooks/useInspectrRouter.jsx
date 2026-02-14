import { useState, useEffect } from 'react';
import { parseHash } from './useHashRouter';

const toId = (value) => (value == null ? null : String(value));

export default function useInspectrRouter(operations, defaultTab = 'request') {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [currentTab, setCurrentTab] = useState(defaultTab);

  // grab { slug, operationId, subTab, params } when hash changes
  useEffect(() => {
    const applyRoute = () => {
      const { slug, operationId, subTab } = parseHash();
      if (slug !== 'inspectr') return;

      // select by ID
      if (operationId && operations.length) {
        const match = operations.find((o) => toId(o.id) === operationId);
        if (match) setSelectedOperation(match);
      }

      // switch sub-tab
      if (subTab) {
        setCurrentTab(subTab);
      }
    };

    applyRoute(); // on mount
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, [operations]);

  // when user picks a row: set state + push new URL
  const handleSelect = (op) => {
    setSelectedOperation(op);
    // "#inspectr/{id}/{currentTab}"
    const encodedId = op.id ? encodeURIComponent(op.id) : '';
    window.history.pushState(null, '', `#inspectr/${encodedId}/${currentTab}`);
  };

  // if you let them switch tabs inside InspectrApp:
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    // preserve selectedOperation in URL if present
    const encodedId = selectedOperation?.id ? encodeURIComponent(selectedOperation.id) : null;
    const base = encodedId ? `#inspectr/${encodedId}` : '#inspectr';
    window.history.replaceState(null, '', `${base}/${tab}`);
  };

  const clearSelection = () => {
    setSelectedOperation(null);
    window.history.pushState(null, '', '#inspectr');
  };

  return {
    selectedOperation,
    currentTab,
    handleSelect,
    handleTabChange,
    clearSelection
  };
}
