// src/components/ListPagination.jsx
import React from 'react';

const ListPagination = ({
  currentPage: currentPageProp,
  totalPages: totalPagesProp,
  meta,
  onPageChange,
  alwaysShow = true
}) => {
  const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const metaPage = safeNumber(meta?.page ?? meta?.current_page);
  const metaTotalPages = safeNumber(meta?.total_pages ?? meta?.totalPages);

  const totalPages = Math.max(0, metaTotalPages ?? safeNumber(totalPagesProp) ?? 0);
  const computedCurrentPage = metaPage ?? safeNumber(currentPageProp) ?? 1;
  const currentPage = totalPages > 0 ? Math.min(Math.max(1, computedCurrentPage), totalPages) : 1;

  if (totalPages === 0) {
    return null;
  }

  if (!alwaysShow && totalPages <= 1) {
    return null;
  }

  const isInteractive = typeof onPageChange === 'function';

  const handlePageChange = (page) => {
    if (!isInteractive) return;
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    onPageChange(page);
  };

  // Helper function to compute page numbers with ellipsis when totalPages > 7.
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
    <nav className="p-2 border-t border-gray-300">
      <ul className="flex items-center justify-center -space-x-px h-8 text-xs">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!isInteractive || currentPage <= 1}
            className="flex items-center justify-center px-2 h-7 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
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
                <span className="flex items-center justify-center px-2 h-7 leading-tight text-gray-500 bg-white border border-gray-300 cursor-pointer">
                  ...
                </span>
              </li>
            );
          }
          const active = item === currentPage;
          return (
            <li key={item}>
              <button
                onClick={() => handlePageChange(item)}
                disabled={!isInteractive}
                className={
                  active
                    ? 'z-10 flex items-center justify-center px-2 h-7 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-700 dark:text-white cursor-pointer'
                    : 'flex items-center justify-center px-2 h-7 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer'
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!isInteractive || currentPage >= totalPages}
            className="flex items-center justify-center px-2 h-7 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer"
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
  );
};

export default ListPagination;
