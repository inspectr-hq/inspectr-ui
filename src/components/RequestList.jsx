// src/components/RequestList.jsx
import React, { useState } from 'react';
import RequestListItem from './RequestListItem';
import RequestListSidePanel from './RequestListSidePanel';
import RequestListPagination from './RequestListPagination';
import DialogConfirmClear from './DialogConfirmClear.jsx';

const RequestList = ({
                       requests,
                       onSelect,
                       onRemove,
                       clearRequests,
                       clearFilteredRequests,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate the number of active filters.
  const activeFiltersCount = Object.entries(filters || {}).reduce((count, [key, value]) => {
    // For custom timestampRange, check if object and has at least one non-empty field.
    if (key === 'timestampRange' && typeof value === 'object') {
      if (value.start || value.end) return count + 1;
      return count;
    }
    return value ? count + 1 : count;
  }, 0);

  // Determine button background based on active filters.
  const filtersButtonClass =
    activeFiltersCount > 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white';

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold text-xl">
          Requests ({requests.length} of {totalCount})
        </span>
        <div className="space-x-2 relative">
          {/* Button to open the side panel */}
          <button
            className={`relative px-3 py-1 rounded text-xs cursor-pointer ${filtersButtonClass}`}
            onClick={() => setIsSidePanelOpen(true)}
          >
            Filters
            {activeFiltersCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-green-700 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
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

      {/* Clear All Dialog */}
      <DialogConfirmClear
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirmAll={clearRequests}
        onConfirmFiltered={clearFilteredRequests}
        hasFilters={activeFiltersCount > 0}
      />
    </div>
  );
};

export default RequestList;
