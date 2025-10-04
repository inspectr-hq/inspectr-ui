// src/components/InspectrApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import RequestList from './RequestList';
import RequestDetailsPanel from './RequestDetailsPanel';
import SettingsPanel from './SettingsPanel';
import eventDB from '../utils/eventDB';
import useInspectrRouter from '../hooks/useInspectrRouter.jsx';
import useLocalStorage from '../hooks/useLocalStorage.jsx';
import useSessionStorage from '../hooks/useSessionStorage.jsx';
import { useInspectr } from '../context/InspectrContext';

const FILTER_STORAGE_KEY = 'requestFilters';
const DEFAULT_FILTERS = Object.freeze({});
const SESSION_FILTER_OPTIONS = Object.freeze({ resetOnReload: true });

const InspectrApp = () => {
  // Get all the shared state from context
  const { toast, setToast, client } = useInspectr();

  const { syncOperations: connectionSync, setLastEventId: setConnectionLastEventId } =
    useInspectr();

  const pageSize = 100;
  const LEFT_PANEL_WIDTH = 33;

  const [page, setPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leftPanelWidthValue, setLeftPanelWidthValue] = useLocalStorage(
    'leftPanelWidth',
    LEFT_PANEL_WIDTH
  );
  const leftPanelWidth = parseFloat(leftPanelWidthValue || LEFT_PANEL_WIDTH);
  const isResizingRef = useRef(false);

  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useSessionStorage(
    FILTER_STORAGE_KEY,
    DEFAULT_FILTERS,
    SESSION_FILTER_OPTIONS
  );

  // Live query: get the events for the current page.
  const { results: operations = [], totalCount = 0 } =
    useLiveQuery(
      () =>
        eventDB.queryEvents({
          filters,
          sort: { field: sortField, order: sortDirection },
          page,
          pageSize
        }),
      [filters, sortField, sortDirection, page],
      { results: [], totalCount: 0 },
      { throttle: 100 }
    ) || {};

  const tagOptions =
    useLiveQuery(() => eventDB.getAllTagOptions(), [], [], { throttle: 300 }) || [];

  // Paginate
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  // now hook in deep-linking
  const { selectedOperation, currentTab, handleSelect, handleTabChange, clearSelection } =
    useInspectrRouter(operations);

  const syncOperations = () => {
    setIsSyncing(true);
    // Delegate sync to persistent connection provider
    connectionSync();
    // Set a timeout to normalize the syncing state
    setTimeout(() => setIsSyncing(false), 2500);
  };

  // Ensure selection stays in sync with the available operations
  useEffect(() => {
    if (!operations) return;

    const currentExists =
      selectedOperation && operations.some((op) => op.id === selectedOperation.id);

    if (!currentExists) {
      if (operations.length > 0) {
        handleSelect(operations[0]);
      } else {
        clearSelection();
      }
    }
  }, [operations, selectedOperation]);

  // Clear all operations.
  const clearOperations = async () => {
    clearSelection();

    try {
      // Clear operations locally
      await eventDB.clearEvents();

      // Clear operations from Inspectr
      await deleteAllOperationsApi();

      // Unset lastEventId (via connection context)
      setConnectionLastEventId('');
    } catch (err) {
      console.error('Error clearing all operations:', err);
    }
  };

  // Clear only the operations matching the active filters.
  const clearFilteredOperations = async () => {
    try {
      // Query all filtered operations using a very high pageSize.
      const filteredOperations = await eventDB.queryEvents({
        filters,
        sort: { field: 'time', order: 'desc' },
        page: 1,
        pageSize: Number.MAX_SAFE_INTEGER
      });
      await Promise.all(
        filteredOperations.map(async (record) => {
          // Delete operation from local Dexie DB.
          await eventDB.deleteEvent(record.id);
          // Delete operation from the API.
          await deleteOperationApi(record.operation_id);
        })
      );
      if (
        selectedOperation &&
        filteredOperations.some((record) => record.id === selectedOperation.id)
      ) {
        clearSelection();
      }
    } catch (error) {
      console.error('Error clearing filtered operations:', error);
    }
  };

  // Remove a single request.
  const removeOperation = async (opId) => {
    const isCurrentlySelected = selectedOperation && (selectedOperation.id || '') === opId;
    const operation = await eventDB.getEvent(opId);

    try {
      // Clear operation locally
      await eventDB.deleteEvent(opId);

      // Delete operation from Inspectr via API
      await deleteOperationApi(operation.operation_id);

      // Reset selection if the deleted operation was selected
      if (isCurrentlySelected) {
        clearSelection();

        // Get the updated list of operations to select a new one
        const updatedOperations = await eventDB.queryEvents({
          sort: { field: sortField, order: sortDirection },
          filters,
          page,
          pageSize
        });

        // Select the first operation if available
        if (updatedOperations && updatedOperations.length > 0) {
          handleSelect(updatedOperations[0]);
        }
      }
    } catch (err) {
      console.error('Error during operation removal:', err);
    }
  };

  /**
   * Inspectr API methods
   */
  // Delete all operations via REST API
  const deleteAllOperationsApi = async () => {
    try {
      await client.operations.deleteAll();
    } catch (error) {
      console.error('Error deleting all operations:', error);
      setToast({
        message: 'Error deleting all operations',
        subMessage: error.message,
        type: 'error'
      });
    }
  };

  // Delete a single operation via REST API
  const deleteOperationApi = async (id) => {
    try {
      await client.operations.delete(id);
    } catch (error) {
      console.error(`Error deleting operation ${id}:`, error);
      setToast({
        message: 'Error deleting operation',
        subMessage: error.message,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setLeftPanelWidthValue(String(newWidth));
      }
    };
    const stopResizing = () => {
      isResizingRef.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [setLeftPanelWidthValue]);

  const startResizing = () => {
    isResizingRef.current = true;
  };

  return (
    <div
      className="flex flex-col h-screen bg-white dark:bg-dark-tremor-background"
      style={{ maxHeight: 'calc(100vh - 64px)' }}
    >
      <div className="flex flex-grow">
        {/* Left Panel */}
        <div className="overflow-y-auto" style={{ width: `${leftPanelWidth}%` }}>
          <RequestList
            operations={operations || []}
            onSelect={handleSelect}
            onRemove={removeOperation}
            clearOperations={clearOperations}
            clearFilteredOperations={clearFilteredOperations}
            selectedOperation={selectedOperation}
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount || 0}
            onPageChange={setPage}
            sortField={sortField}
            sortDirection={sortDirection}
            filters={filters}
            setSortField={setSortField}
            setSortDirection={setSortDirection}
            setFilters={setFilters}
            syncOperations={syncOperations}
            isSyncing={isSyncing}
            tagOptions={tagOptions}
          />
        </div>
        <div
          className="relative w-px bg-gray-300 dark:bg-dark-tremor-border cursor-col-resize"
          onMouseDown={startResizing}
        >
          <button
            type="button"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center px-0 py-2 rounded-md border border-gray-300 bg-white/80 backdrop-blur-sm shadow-sm cursor-col-resize dark:border-dark-tremor-border dark:bg-dark-tremor-background/80"
            title="Drag to resize. Double-click to reset."
            aria-label="Resize panels"
            onMouseDown={(e) => {
              e.preventDefault();
              startResizing();
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              setLeftPanelWidthValue(LEFT_PANEL_WIDTH);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              aria-hidden
            >
              <path d="M8.5 7C9.32843 7 10 6.32843 10 5.5C10 4.67157 9.32843 4 8.5 4C7.67157 4 7 4.67157 7 5.5C7 6.32843 7.67157 7 8.5 7ZM8.5 13.5C9.32843 13.5 10 12.8284 10 12C10 11.1716 9.32843 10.5 8.5 10.5C7.67157 10.5 7 11.1716 7 12C7 12.8284 7.67157 13.5 8.5 13.5ZM10 18.5C10 19.3284 9.32843 20 8.5 20C7.67157 20 7 19.3284 7 18.5C7 17.6716 7.67157 17 8.5 17C9.32843 17 10 17.6716 10 18.5ZM15.5 7C16.3284 7 17 6.32843 17 5.5C17 4.67157 16.3284 4 15.5 4C14.6716 4 14 4.67157 14 5.5C14 6.32843 14.6716 7 15.5 7ZM17 12C17 12.8284 16.3284 13.5 15.5 13.5C14.6716 13.5 14 12.8284 14 12C14 11.1716 14.6716 10.5 15.5 10.5C16.3284 10.5 17 11.1716 17 12ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z" />
            </svg>
          </button>
        </div>

        {/* Right Panel */}
        <div
          className="p-4 h-full overflow-y-auto bg-white dark:bg-dark-tremor-background text-tremor-content-strong dark:text-dark-tremor-content-strong"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="flex flex-col h-full">
            <RequestDetailsPanel
              operation={selectedOperation}
              currentTab={currentTab}
              setCurrentTab={handleTabChange}
            />
          </div>
        </div>
      </div>
      {/* Bottom Panel */}
      <SettingsPanel />
    </div>
  );
};

export default InspectrApp;
