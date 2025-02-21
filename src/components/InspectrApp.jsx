// src/components/InspectrApp.jsx
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import RequestList from './RequestList';
import RequestDetailsPanel from './RequestDetailsPanel';
import SettingsPanel from './SettingsPanel';
import eventDB from '../utils/eventDB';

const InspectrApp = ({ apiEndpoint: initialApiEndpoint = '/api' }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentTab, setCurrentTab] = useState('request');
  const [apiEndpoint, setApiEndpoint] = useState(initialApiEndpoint);
  const [isConnected, setIsConnected] = useState(false);

  // Registration details state.
  const [sseEndpoint, setSseEndpoint] = useState(''); // Will be set after registration.
  const [accessCode, setAccessCode] = useState('');
  const [channel, setChannel] = useState('');
  const [token, setToken] = useState('');

  const pageSize = 100;
  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({});

  // Live query: get the events for the current page.
  const requests = useLiveQuery(() => {
    // console.log('[Inspectr] filters', filters);
    return eventDB.queryEvents({
      sort: { field: sortField, order: sortDirection },
      filters,
      page,
      pageSize
    });
  }, [page, sortField, sortDirection, filters]);

  // Live query to get total count.
  const totalCount = useLiveQuery(() => eventDB.db.events.count(), []);
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  // Ensure localStorage is only accessed on the client.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedApiEndpoint = localStorage.getItem('apiEndpoint');
      if (!apiEndpoint && storedApiEndpoint) {
        setApiEndpoint(storedApiEndpoint);
      }
      const storedAccessCode = localStorage.getItem('accessCode');
      if (storedAccessCode) {
        setAccessCode(storedAccessCode);
      }
      const storedChannel = localStorage.getItem('channel');
      if (storedChannel) {
        setChannel(storedChannel);
      }
    }
  }, [apiEndpoint]);

  // Registration handler.
  const handleRegister = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessCode, channel })
      });
      const result = await response.json();
      if (result?.token && result?.sse_endpoint && result?.access_code) {
        setAccessCode(result.access_code);
        localStorage.setItem('accessCode', result.access_code);
        setChannel(result.channel);
        localStorage.setItem('channel', result.channel);
        setToken(result.token);
        localStorage.setItem('token', result.token);
        if (result.sse_endpoint) {
          setSseEndpoint(result.sse_endpoint);
          localStorage.setItem('sseEndpoint', result.sse_endpoint);
        }
        console.log('Registration successful');
      } else {
        console.error('Registration failed:');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Automatically trigger registration when a channel is present and token is not yet set.
  useEffect(() => {
    if (!channel && !token) {
      handleRegister();
    }
  }, [channel, token]);

  // Connect to SSE when the component mounts.
  useEffect(() => {
    if (!sseEndpoint) return;
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
        // console.log('[Inspectr] Received event:', data);
        // Update the list and, if it's the first event, select it.
        if (!data.id) data.id = generateId();

        // Save the incoming event to the DB.
        eventDB.upsertEvent(data).catch((err) => console.error('Error saving event to DB:', err));
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

  // If no request is selected but there are requests (e.g. historical items), select the first one.
  useEffect(() => {
    if (!selectedRequest && requests && requests.length > 0) {
      setSelectedRequest(requests[0]);
    }
  }, [requests, selectedRequest]);

  // Clear all requests.
  const clearRequests = () => {
    setSelectedRequest(null);
    eventDB.clearEvents().catch((err) => console.error('Error clearing events from DB:', err));
  };

  // Clear only the requests matching the active filters.
  const clearFilteredRequests = async () => {
    try {
      // Query all filtered requests using a very high pageSize.
      const filteredRequests = await eventDB.queryEvents({
        filters,
        sort: { field: 'time', order: 'desc' },
        page: 1,
        pageSize: Number.MAX_SAFE_INTEGER
      });
      await Promise.all(filteredRequests.map((record) => eventDB.deleteEvent(record.id)));
      if (selectedRequest && filteredRequests.some((record) => record.id === selectedRequest.id)) {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error clearing filtered requests:', error);
    }
  };

  // Remove a single request.
  const removeRequest = (reqId) => {
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
            clearFilteredRequests={clearFilteredRequests}
            selectedRequest={selectedRequest}
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
        apiEndpoint={apiEndpoint}
        setApiEndpoint={setApiEndpoint}
        isConnected={isConnected}
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        channel={channel}
        setChannel={setChannel}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default InspectrApp;
