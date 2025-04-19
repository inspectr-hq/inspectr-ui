// src/components/RequestList.jsx
import React, { useState } from 'react';
import RequestListItem from './RequestListItem';
import RequestListSidePanel from './RequestListSidePanel';
import RequestListPagination from './RequestListPagination';
import DialogConfirmClear from './DialogConfirmClear.jsx';
import DividerText from './DividerText.jsx';

const RequestList = ({
  operations,
  onSelect,
  onRemove,
  clearOperations,
  clearFilteredRequests,
  selectedOperation,
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

  const formatGroupDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Group operations by date.
  const groupOperationsByDate = (ops) => {
    return ops.reduce((groups, op) => {
      const groupKey = op.request.timestamp ? formatGroupDate(op.request.timestamp) : 'N/A';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(op);
      return groups;
    }, {});
  };

  const groupedOperations = groupOperationsByDate(operations);

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold text-xl">
          Requests ({operations.length} of {totalCount})
        </span>
        <div className="space-x-2 relative">
          {/* Button to open the side panel */}
          <button
            className={`relative px-3 py-1 rounded text-xs cursor-pointer ${filtersButtonClass}`}
            onClick={() => setIsSidePanelOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-700 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
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
        <div className="w-20 text-center">Timestamp</div>
        <div className="w-16 text-right">Duration</div>
        <div className="w-10"></div>
      </div>

      <ul
        className="overflow-y-auto flex-grow"
        style={{ maxHeight: 'calc(100vh - 40px - 100px - 49px - 64px)' }}
      >
        {operations.length === 0 ? (
          <li className="flex items-center justify-center h-full text-gray-500 text-2xl">
            No operations
          </li>
        ) : (
          Object.entries(groupedOperations).map(([date, ops]) => (
            <React.Fragment key={date}>
              <li>
                <DividerText text={date} align={'center'} />
              </li>
              {ops.map((op, index) => {
                const opId = op.id || index;
                return (
                  <RequestListItem
                    key={opId}
                    opId={opId}
                    operation={op}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    selected={selectedOperation && selectedOperation.id === opId}
                  />
                );
              })}
            </React.Fragment>
          ))
        )}
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
        onConfirmAll={clearOperations}
        onConfirmFiltered={clearFilteredRequests}
        hasFilters={activeFiltersCount > 0}
      />
    </div>
  );
};

export default RequestList;
