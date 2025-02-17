// src/components/RequestList.jsx
import React, { useState } from 'react';
import RequestListItem from './RequestListItem';
import RequestListSidePanel from './RequestListSidePanel';
import RequestListPagination from './RequestListPagination';

const RequestList = ({
  requests,
  onSelect,
  onRemove,
  clearRequests,
  selectedRequest,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  sortField,
  sortDirection,
  filters,
  setSortField,
  setSortDirection,
  setFilters
}) => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold text-xl">
          Requests ({requests.length} of {totalCount})
        </span>
        <div className="space-x-2">
          {/* Button to open the side panel */}
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs cursor-pointer"
            onClick={() => setIsSidePanelOpen(true)}
          >
            Filters
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer"
            onClick={clearRequests}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div
        className="flex items-center bg-gray-200 p-2 border-b border-gray-300 text-sm font-bold cursor-pointer"
        onClick={() => setIsSidePanelOpen(true)}
      >
        <div className="w-16 text-center">Status</div>
        <div className="w-20 text-center">Method</div>
        <div className="flex-grow text-left">Path</div>
        <div className="w-20 text-center">Duration</div>
        <div className="w-10"></div>
      </div>

      <ul
        className="overflow-y-auto flex-grow"
        style={{ maxHeight: 'calc(100vh - 40px - 100px - 49px)' }}
      >
        {requests.map((req, index) => {
          const reqId = req.id || index;
          return (
            <RequestListItem
              key={reqId}
              reqId={reqId}
              request={req}
              onSelect={onSelect}
              onRemove={onRemove}
              selected={selectedRequest && selectedRequest.id === reqId}
            />
          );
        })}
      </ul>

      {/* Pagination */}
      <RequestListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Slide-In Side Panel */}
      <RequestListSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        sortField={sortField}
        sortDirection={sortDirection}
        filters={filters}
        setSortField={setSortField}
        setSortDirection={setSortDirection}
        setFilters={setFilters}
      />
    </div>
  );
};

export default RequestList;
