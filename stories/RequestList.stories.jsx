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
      operations={[
        {
          id: 1,
          request: { method: 'GET', url: 'http://example.com', timestamp: '2025-03-12T16:06:32.344451Z' },
          response: { status: 200 },
          timing: { duration: 123 }
        },
        {
          id: 2,
          request: { method: 'POST', url: 'http://example.com', timestamp: '2025-03-12T16:06:32.344451Z' },
          response: { status: 301 },
          timing: { duration: 123 }
        },
        {
          id: 3,
          method: 'POST',
          request: { method: 'POST', url: 'http://example.com', timestamp: '2025-03-12T16:06:32.344451Z' },
          response: { status: 404 },
          timing: { duration: 123 }
        },
        {
          id: 4,
          request: { method: 'POST', url: 'http://example.com', timestamp: '2025-03-12T16:06:32.344451Z' },
          response: { status: 500 },
          timing: { duration: 123 }
        }
      ]}
      onSelect={() => {
      }}
      onRemove={() => {
      }}
      clearOperations={() => {
      }}
      selectedOperation={null}
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
