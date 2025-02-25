// src/components/InspectrApp.jsx
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import RequestList from './RequestList';
import RequestDetailsPanel from './RequestDetailsPanel';
import SettingsPanel from './SettingsPanel';
import eventDB from '../utils/eventDB';
import ToastNotification from './ToastNotification.jsx';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

const InspectrApp = ({ apiEndpoint: initialApiEndpoint = '/api' }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentTab, setCurrentTab] = useState('request');
  const [apiEndpoint, setApiEndpoint] = useState(initialApiEndpoint);
  const [isConnected, setIsConnected] = useState(false);

  // Registration details state.
  const [sseEndpoint, setSseEndpoint] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [channel, setChannel] = useState('');
  const [token, setToken] = useState('');

  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);

  const [toast, setToast] = useState(null);

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

  /**
   * 🏁 Step 1: Load credentials from localStorage on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Read query parameters using URLSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const queryAccessCode = urlParams.get('accessCode');
    const queryChannel = urlParams.get('channel');
    const queryToken = urlParams.get('token');

    // Query parameters take precedence
    if (queryAccessCode || queryChannel || queryToken) {
      console.log('🔍 Found credentials in query params');

      if (queryAccessCode) {
        setAccessCode(queryAccessCode);
        localStorage.setItem('accessCode', queryAccessCode);
      }

      if (queryChannel) {
        setChannel(queryChannel);
        localStorage.setItem('channel', queryChannel);
      }

      if (queryToken) {
        setToken(queryToken);
        localStorage.setItem('token', queryToken);
      }

      // Update the URL without reloading the page
      window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
    
    } else {
      // Otherwise, check localStorage
      const storedAccessCode = localStorage.getItem('accessCode');
      const storedChannel = localStorage.getItem('channel');
      const storedToken = localStorage.getItem('token');

      if (storedAccessCode && storedChannel && storedToken) {
        console.log('✅ Using stored credentials from localStorage');
        setAccessCode(storedAccessCode);
        setChannel(storedChannel);
        setToken(storedToken);
      } else if (isLocalhost) {
        console.log('🔄 Fetching /app/config (Localhost, No credentials found)');
        fetch('/app/config')
          .then((res) => res.json())
          .then((result) => {
            if (result?.token && result?.sse_endpoint && result?.access_code) {
              console.log('✅ Loaded from /app/config:', result);

              setAccessCode(result.access_code);
              localStorage.setItem('accessCode', result.access_code);

              setChannel(result.channel);
              localStorage.setItem('channel', result.channel);

              setToken(result.token);
              localStorage.setItem('token', result.token);

              setSseEndpoint(result.sse_endpoint);
              localStorage.setItem('sseEndpoint', result.sse_endpoint);
            }
          })
          .catch((err) => console.error('❌ Failed to load /app/config:', err));
      }
    }

    setIsInitialized(true);
  }, []);

  /**
   * 🏁 Step 2: When `isInitialized` is true, register using stored credentials
   */
  useEffect(() => {
    if (!isInitialized) return;
    console.log('🔄 Auto-registering with stored credentials:', channel, accessCode);

    if (channel && accessCode) {
      handleRegister(accessCode, channel);
    } else {
      console.log('⚠️ Missing credentials for auto-registration, skipping.');
    }
  }, [isInitialized, channel, accessCode]);

  // Registration handler.
  const handleRegister = async (
    newAccessCode = accessCode,
    newChannel = channel,
    newToken = token,
    showNotification
  ) => {
    try {
      // Construct request body
      let requestBody = {};
      if (newAccessCode && newChannel) {
        requestBody = { channel: newChannel, access_code: newAccessCode };
      } else if (newToken) {
        requestBody = { token: newToken };
      }

      console.log('📤 Registering with:', requestBody);

      const response = await fetch(`${apiEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-inspectr-client': 'inspectr-app'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result?.token && result?.sse_endpoint && result?.access_code) {
        console.log('✅ Registration successful');

        setAccessCode(result.access_code);
        localStorage.setItem('accessCode', result.access_code);

        setChannel(result.channel);
        localStorage.setItem('channel', result.channel);

        setToken(result.token);
        localStorage.setItem('token', result.token);

        setSseEndpoint(result.sse_endpoint);
        localStorage.setItem('sseEndpoint', result.sse_endpoint);

        if (showNotification) {
          setToast({
            message: 'Registration Successful',
            subMessage: 'Your channel and access code have been registered.'
          });
        }
      } else {
        console.error('❌ Registration failed:', result);
        setToast({
          message: 'Registration Failed',
          subMessage: 'Please check your channel and access code.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setToast({
        message: 'Registration Error',
        subMessage: error.message || 'An error occurred during registration.',
        type: 'error'
      });
    }
  };

  // Automatically trigger registration when a channel is present and token is not yet set.
  // useEffect(() => {
  //   if (localStorageLoaded) {
  //     if (channel && accessCode) {
  //       console.log('Automatically trigger reregistration', channel, accessCode);
  //       handleRegister(accessCode, channel);
  //     } else {
  //       console.log('Automatically trigger new registration');
  //       handleRegister();
  //     }
  //   }
  // }, [localStorageLoaded, channel, accessCode]);

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
      {toast && (
        <ToastNotification
          message={toast.message}
          subMessage={toast.subMessage}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default InspectrApp;
