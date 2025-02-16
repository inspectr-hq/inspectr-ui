// src/components/InspectrApp.jsx
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import RequestList from './RequestList';
import RequestDetailsPanel from './RequestDetailsPanel';
import SettingsPanel from './SettingsPanel';
import eventDB from '../utils/eventDB';

const InspectrApp = ({ sseEndpoint: propSseEndpoint }) => {
  // const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentTab, setCurrentTab] = useState('request');
  const [sseEndpoint, setSseEndpoint] = useState('/api/sse');
  const [isConnected, setIsConnected] = useState(false);

  const pageSize = 100;
  const [page, setPage] = useState(1);

  // Live query: get the events for the current page.
  const requests = useLiveQuery(() => {
    return eventDB.queryEvents({
      sort: { field: 'time', order: 'desc' },
      page,
      pageSize
    });
  }, [page]);

  // Live query to get total count.
  const totalCount = useLiveQuery(() => eventDB.db.events.count(), []);
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  // Ensure localStorage is only accessed on the client.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSseEndpoint = localStorage.getItem('sseEndpoint');
      if (!propSseEndpoint && storedSseEndpoint) {
        setSseEndpoint(storedSseEndpoint);
      }
    }
  }, [propSseEndpoint]);

  // Connect to SSE when the component mounts.
  useEffect(() => {
    const generateId = () => `req-${Math.random().toString(36).substr(2, 9)}`;

    const eventSource = new EventSource(sseEndpoint);
    console.log(`Inspectr EventSource created with URL: ${sseEndpoint}`);

    eventSource.onopen = () => {
      console.log('SSE Inspectr connection opened');
      setIsConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // console.log('Received event:', data);
        // Update the list and, if it's the first event, select it.
        if (!data.id) data.id = generateId();

        // Save the incoming event to the DB.
        eventDB.upsertEvent(data).catch((err) => console.error('Error saving event to DB:', err));

        // Optionally, set the first event as selected.
        if (!selectedRequest && data?.data) {
          setSelectedRequest(data.data);
        }
      } catch (error) {
        console.error('Error parsing SSE Inspectr data:', error);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Inspectr error:', err);
      setIsConnected(false);
      // The EventSource object will try to reconnect automatically.
    };

    return () => {
      console.log('Closing Inspectr EventSource');
      eventSource.close();
      setIsConnected(false);
    };
  }, [sseEndpoint]); // Run only once on mount

  const clearRequests = () => {
    // setRequests([]);
    setSelectedRequest(null);
    eventDB.clearEvents().catch((err) => console.error('Error clearing events from DB:', err));
  };

  const removeRequest = (reqId) => {
    // setRequests((prev) => prev.filter((req, i) => (req.id ? req.id !== reqId : i !== reqId)));
    if (selectedRequest && (selectedRequest.id || '') === reqId) {
      setSelectedRequest(null);
    }
    eventDB.deleteEvent(reqId).catch((err) => console.error('Error deleting event from DB:', err));
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-grow">
        {/* Left Panel */}
        <div className="w-1/3 border-r border-gray-300 overflow-y-auto">
          <RequestList
            requests={requests || []}
            onSelect={setSelectedRequest}
            onRemove={removeRequest}
            clearRequests={clearRequests}
            selectedRequest={selectedRequest}
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount || 0}
            onPageChange={setPage}
          />
        </div>

        {/* Right Panel */}
        <div className="w-2/3 p-4">
          <RequestDetailsPanel
            request={selectedRequest}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
          />
        </div>
      </div>
      {/* Bottom Panel */}
      <SettingsPanel
        sseEndpoint={sseEndpoint}
        setSseEndpoint={setSseEndpoint}
        isConnected={isConnected}
      />
    </div>
  );
};

export default InspectrApp;
