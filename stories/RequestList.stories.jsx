// stories/RequestList.stories.jsx
import React, { useState } from 'react';
import RequestList from '../src/components/operations/RequestList.jsx';
import { httpOperations } from './fixtures/inspectrFixtures.js';

export default {
  title: 'Components/Operations/RequestList',
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
      operations={httpOperations}
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

export const EmptyList = () => {
  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <RequestList
      operations={[]}
      onSelect={() => {}}
      onRemove={() => {}}
      clearOperations={() => {}}
      selectedOperation={null}
      currentPage={currentPage}
      totalPages={1}
      totalCount={0}
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

// Toggle showing query params via a Storybook control.
export const QueryParamsToggle = (args) => {
  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Sync Storybook arg to the component's localStorage-backed toggle
  React.useEffect(() => {
    window.localStorage.setItem('showQueryParams', args.showQueryParams ? 'true' : 'false');
  }, [args.showQueryParams]);

  const operations = [
    {
      id: 101,
      request: {
        method: 'GET',
        path: '/api/users',
        query_params: [
          { name: 'page', value: '1' },
          { name: 'q', value: 'john' }
        ],
        timestamp: '2025-03-12T10:15:30.000Z'
      },
      response: { status: 200 },
      timing: { duration: 87 }
    },
    {
      id: 102,
      request: {
        method: 'GET',
        path: '/api/orders',
        query_params: [
          { name: 'status', value: 'open' },
          { name: 'limit', value: '25' }
        ],
        timestamp: '2025-03-12T11:05:10.000Z'
      },
      response: { status: 301 },
      timing: { duration: 142 }
    },
    {
      id: 103,
      request: {
        method: 'POST',
        path: '/api/users',
        query_params: [{ name: 'invite', value: 'true' }],
        timestamp: '2025-03-11T16:45:00.000Z'
      },
      response: { status: 201 },
      timing: { duration: 215 }
    }
  ];

  return (
    <RequestList
      operations={operations}
      onSelect={() => {}}
      onRemove={() => {}}
      clearOperations={() => {}}
      clearFilteredOperations={() => {}}
      syncOperations={() => {}}
      isSyncing={false}
      selectedOperation={null}
      currentPage={currentPage}
      totalPages={1}
      totalCount={operations.length}
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

QueryParamsToggle.argTypes = {
  showQueryParams: {
    control: 'boolean',
    name: 'Show query params'
  }
};

QueryParamsToggle.args = {
  showQueryParams: false
};
