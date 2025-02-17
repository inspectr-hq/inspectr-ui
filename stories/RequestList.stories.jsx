// stories/RequestList.stories.jsx
import React, { useState } from 'react';
import RequestList from '../src/components/RequestList';

export default {
  title: 'Components/RequestList',
  component: RequestList
};

export const DefaultList = () => {

// State for sort options and filters used by RequestListSidePanel.
  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <RequestList
      requests={[
        { id: 1, method: 'GET', request: {}, response: { statusCode: 200 }, url: 'http://example.com', latency: 123 },
        { id: 2, method: 'POST', request: {}, response: { statusCode: 301 }, url: 'http://example.com', latency: 123 },
        {
          id: 3,
          method: 'POST',
          request: { method: 'POST' },
          response: { statusCode: 404 },
          url: 'http://example.com',
          latency: 123
        },
        {
          id: 4,
          method: 'POST',
          request: { method: 'POST' },
          response: { statusCode: 500 },
          url: 'http://example.com',
          latency: 123
        }
      ]}
      onSelect={() => {
      }}
      onRemove={() => {
      }}
      clearRequests={() => {
      }}
      selectedRequest={null}
      currentPage={currentPage}
      totalPages={5}        // You can adjust as needed.
      totalCount={10}       // You can adjust as needed.
      onPageChange={(page) => setCurrentPage(page)}
      sortField={sortField}
      sortDirection={sortDirection}
      filters={filters}
      setSortField={setSortField}
      setSortDirection={setSortDirection}
      setFilters={setFilters}
    />
  );
};
