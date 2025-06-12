// src/components/InspectrApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import RequestList from './RequestList';
import RequestDetailsPanel from './RequestDetailsPanel';
import SettingsPanel from './SettingsPanel';
import eventDB from '../utils/eventDB';
import useInspectrRouter from '../hooks/useInspectrRouter.jsx';
import { useInspectr } from '../context/InspectrContext';

const InspectrApp = () => {
  // Get all the shared state from context
  const {
    apiEndpoint,
    setApiEndpoint,
    connectionStatus,
    setConnectionStatus,
    sseEndpoint,
    channelCode,
    setChannelCode,
    channel,
    setChannel,
    token,
    reRegistrationFailedRef,
    handleRegister,
    attemptReRegistration,
    resetReRegistration,
    toast,
    setToast,
    debugMode,
    client
  } = useInspectr();

  const pageSize = 100;
  const SYNC_LAST_EVENT_ID = 'sync';
  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({});

  // SSE connection references
  const wasConnectedRef = useRef(false);
  const eventSourceRef = useRef(null);

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
      [filters, sortField, sortDirection, page]
    ) || {};

  // Paginate
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  // now hook in deep-linking
  const { selectedOperation, currentTab, handleSelect, handleTabChange, clearSelection } =
    useInspectrRouter(operations);

  const connectSSE = (overrideLastEventId) => {
    if (eventSourceRef.current) {
      console.log('Closing SSE EventSource connection');
      eventSourceRef.current.close();
    }

    if (!sseEndpoint) return;

    const lastEventId = overrideLastEventId || localStorage.getItem('lastEventId');
    let sseUrl = `${sseEndpoint}?token=${token}`;
    if (lastEventId) {
      sseUrl += sseUrl.includes('?')
        ? `&last_event_id=${lastEventId}`
        : `?last_event_id=${lastEventId}`;
    }

    const generateId = (opId) => opId || `req-${Math.random().toString(36).substr(2, 9)}`;
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;
    console.log(`🔄 SSE connecting with ${sseUrl}`);

    eventSource.onopen = () => {
      console.log('📡️ SSE connection opened.');
      wasConnectedRef.current = true;
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (debugMode) {
          console.log('[Inspectr] Received event:', event);
        }
        // Update the list and, if it's the first event, select it
        if (!event.id) event.id = generateId(event.operation_id);
        if (event.operation_id) {
          event.id = event.operation_id;
          localStorage.setItem('lastEventId', event.operation_id);
        }

        // Save the incoming event to the DB
        eventDB.upsertEvent(event).catch((err) => console.error('Error saving event to DB:', err));
      } catch (error) {
        console.error('Error parsing SSE Inspectr data:', error);
      }
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE connection error:', err);
      wasConnectedRef.current = false;
      setConnectionStatus('reconnecting');

      if (reRegistrationFailedRef.current) {
        console.log('❌ Maximum re-registration attempts reached. Closing EventSource.');
        setConnectionStatus('disconnected');
        eventSource.close();
        return;
      }

      // Start the re-registration retry loop if not already in progress
      if (!reRegistrationFailedRef.current) {
        console.log('🔄 Starting re-registration retry loop due to SSE error.');
        attemptReRegistration();
      }
      // The EventSource will try to reconnect automatically
    };
  };

  const syncOperations = () => {
    localStorage.setItem('lastEventId', SYNC_LAST_EVENT_ID);
    connectSSE(SYNC_LAST_EVENT_ID);
  };

  // Connect to SSE when the component mounts or credentials change.
  useEffect(() => {
    resetReRegistration();
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('📡️ Closing SSE connection');
        eventSourceRef.current.close();
        setConnectionStatus('disconnected');
      }
    };
  }, [sseEndpoint, token]); // Run only once on mount

  // If no operation is selected but there are operations, select the first one.
  useEffect(() => {
    if (!selectedOperation && operations && operations.length > 0) {
      handleSelect(operations[0]);
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

      // Unset lastEventId
      localStorage.removeItem('lastEventId');
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

  return (
    <div
      className="flex flex-col h-screen bg-white dark:bg-dark-tremor-background"
      style={{ maxHeight: 'calc(100vh - 64px)' }}
    >
      <div className="flex flex-grow">
        {/* Left Panel */}
        <div className="w-1/3 border-r border-gray-300 dark:border-dark-tremor-border overflow-y-auto">
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
          />
        </div>

        {/* Right Panel */}
        <div className="w-2/3 p-4 h-full overflow-y-auto bg-white dark:bg-dark-tremor-background text-tremor-content-strong dark:text-dark-tremor-content-strong">
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
