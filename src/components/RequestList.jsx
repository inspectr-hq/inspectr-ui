// src/components/RequestList.jsx
import React, { useState } from 'react';
import RequestListItem from './RequestListItem';
import RequestListSidePanel from './RequestListSidePanel';

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

  // Helper function to compute page numbers with ellipsis when totalPages > 7.;
  const getPageNumbers = (currentPage, totalPages) => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        // Show pages 1 to 5, ellipsis, last page.
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page, ellipsis, then last 5 pages.
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, ellipsis, currentPage-1, currentPage, currentPage+1, ellipsis, last page.
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold text-xl">
          Requests ({requests.length} of {totalCount})
        </span>
        <div className="space-x-2">
          {/* Button to open the side panel */}
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
            onClick={() => setIsSidePanelOpen(true)}
          >
            Filters
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
            onClick={clearRequests}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center bg-gray-200 p-2 border-b border-gray-300 text-sm font-bold">
        <div className="w-16 text-center">Status</div>
        <div className="w-20 text-center">Method</div>
        <div className="flex-grow text-left">Path</div>
        <div className="w-20 text-center">Duration</div>
        <div className="w-10"></div>
      </div>

      <ul
        className="overflow-y-auto flex-grow"
        style={{ maxHeight: 'calc(100vh - 40px - 100px - 64px)' }}
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

      {/* Pagination Component */}
      <nav className="p-4 border-t border-gray-300">
        <ul className="flex items-center justify-center -space-x-px h-8 text-sm">
          {/* Previous Button */}
          <li>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <span className="sr-only">Previous</span>
              <svg
                className="w-2.5 h-2.5 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 1 1 5l4 4"
                />
              </svg>
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <li key={`ellipsis-${index}`}>
                  <span
                    className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300">
                    ...
                  </span>
                </li>
              );
            }
            const active = item === currentPage;
            return (
              <li key={item}>
                <button
                  onClick={() => onPageChange(item)}
                  className={
                    active
                      ? 'z-10 flex items-center justify-center px-3 h-8 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                      : 'flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }
                >
                  {item}
                </button>
              </li>
            );
          })}

          {/* Next Button */}
          <li>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <span className="sr-only">Next</span>
              <svg
                className="w-2.5 h-2.5 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
            </button>
          </li>
        </ul>
      </nav>

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
