// src/components/RequestListSidePanel.jsx
import React from 'react';

const RequestListSidePanel = ({
  isOpen,
  onClose,
  sortField,
  sortDirection,
  filters,
  setSortField,
  setSortDirection,
  setFilters
}) => {
  // Reset sort options
  const handleResetSort = () => {
    setSortField('time');
    setSortDirection('desc');
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({});
  };

  // Handle preset time range change
  const handlePresetTimeRangeChange = (e) => {
    const value = e.target.value;
    // When a preset is selected, update timestampRange as string and clear any custom range values.
    setFilters((prev) => ({
      ...prev,
      timestampRange: value,
      customStart: undefined,
      customEnd: undefined
    }));
  };

  // Handle custom range change - update the timestampRange as an object.
  const handleCustomRangeChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      // clear the preset if any custom value is provided
      timestampRange: {
        ...((typeof prev.timestampRange === 'object' && prev.timestampRange) || {}),
        [field]: value
      }
    }));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50"
          style={{ zIndex: 9998 }}
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed top-0 left-0 h-full w-100 bg-white shadow-xl transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ zIndex: 9999 }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
          <h2 className="pl-4 text-lg font-semibold text-gray-800">Filter & Sort</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 overflow-y-auto h-full">
          {/* Sort Section */}
          <section className="mb-6 ml-4 mr-4">
            <div className="flex items-center justify-between">
              <h3 className="mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                Sort By
              </h3>
              <button
                onClick={handleResetSort}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortField"
                  value="time"
                  checked={sortField === 'time'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-3 text-gray-700">Timestamp</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortField"
                  value="statusCode"
                  checked={sortField === 'statusCode'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-3 text-gray-700">Status</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortField"
                  value="method"
                  checked={sortField === 'method'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-3 text-gray-700">Method</span>
              </label>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                Sort Direction
              </h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sortDirection"
                    value="asc"
                    checked={sortDirection === 'asc'}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">Ascending</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sortDirection"
                    value="desc"
                    checked={sortDirection === 'desc'}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">Descending</span>
                </label>
              </div>
            </div>
          </section>

          {/* Filter Section */}
          <section className="mb-6 ml-4 mr-4">
            <div className="flex items-center justify-between">
              <h3 className="mb-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                Filters
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="space-y-4">
              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quick Time Range
                </label>
                <select
                  value={typeof filters.timestampRange === 'string' ? filters.timestampRange : ''}
                  onChange={handlePresetTimeRangeChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  <option value="15M">Last 15 minutes</option>
                  <option value="30M">Last 30 minutes</option>
                  <option value="1H">Last 1 hour</option>
                  <option value="3H">Last 3 hours</option>
                  <option value="6H">Last 6 hours</option>
                  <option value="12H">Last 12 hours</option>
                  <option value="24H">Last 24 hours</option>
                  <option value="48H">Last 2 days</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Specific Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Time Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="datetime-local"
                    value={
                      typeof filters.timestampRange === 'object' && filters.timestampRange.start
                        ? filters.timestampRange.start
                        : ''
                    }
                    onChange={(e) => handleCustomRangeChange('start', e.target.value)}
                    className="w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={
                      typeof filters.timestampRange === 'object' && filters.timestampRange.end
                        ? filters.timestampRange.end
                        : ''
                    }
                    onChange={(e) => handleCustomRangeChange('end', e.target.value)}
                    className="w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <input
                  type="number"
                  placeholder="e.g. 200"
                  value={filters.status || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  value={filters.method || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="OPTIONS">OPTIONS</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>

              {/* Path Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                <input
                  type="text"
                  placeholder="e.g. /api/users"
                  value={filters.path || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Duration (Latency) Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (ms)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.durationMin || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, durationMin: e.target.value }))
                    }
                    className="w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.durationMax || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, durationMax: e.target.value }))
                    }
                    className="w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Host Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                <input
                  type="text"
                  placeholder="e.g. localhost"
                  value={filters.host || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, host: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default RequestListSidePanel;
