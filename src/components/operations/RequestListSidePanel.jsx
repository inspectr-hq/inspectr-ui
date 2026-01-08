// src/components/operations/RequestListSidePanel.jsx
import React from 'react';
import TagsInput from '../TagsInput.jsx';
import { getStatusClass } from '../../utils/getStatusClass.js';
import { getMethodTagClass } from '../../utils/getMethodClass.js';
import { HTTP_METHOD_OPTIONS, STATUS_CODE_OPTIONS } from '../../utils/operationFilterOptions.js';
import { getMcpMethodColor } from '../../utils/mcp.js';

const RequestListSidePanel = ({
  isOpen,
  onClose,
  sortField,
  sortDirection,
  filters,
  setSortField,
  setSortDirection,
  setFilters,
  tagOptions = [],
  mcpToolOptions = [],
  mcpResourceOptions = [],
  mcpPromptOptions = [],
  mcpCategoryOptions = [],
  mcpMethodOptions = []
}) => {
  const mcpColorClasses = {
    blue: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/5 dark:text-blue-200',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-200',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-200',
    amber: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/5 dark:text-amber-200',
    slate: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/5 dark:text-slate-200'
  };
  const getMcpTagClass = (value) => {
    const color = getMcpMethodColor(value);
    return mcpColorClasses[color] || mcpColorClasses.slate;
  };
  const getFixedMcpTagClass = (color) => () => mcpColorClasses[color] || mcpColorClasses.slate;
  const showMcpToolFilter = mcpToolOptions.length > 0 || (filters.mcpTool || []).length > 0;
  const showMcpResourceFilter =
    mcpResourceOptions.length > 0 || (filters.mcpResource || []).length > 0;
  const showMcpPromptFilter = mcpPromptOptions.length > 0 || (filters.mcpPrompt || []).length > 0;
  const showMcpCategoryFilter =
    mcpCategoryOptions.length > 0 || (filters.mcpCategory || []).length > 0;
  const showMcpMethodFilter = mcpMethodOptions.length > 0 || (filters.mcpMethod || []).length > 0;

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

  // Define options for HTTP methods and status codes.
  const methodOptions = HTTP_METHOD_OPTIONS;
  const statusCodeOptions = STATUS_CODE_OPTIONS;

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
        className={`fixed top-0 left-0 h-full w-100 bg-white dark:bg-dark-tremor-background shadow-xl dark:shadow-dark-tremor-shadow transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ zIndex: 9999 }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 dark:border-dark-tremor-border bg-gray-50 dark:bg-dark-tremor-background-subtle">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-tremor-content-strong">
            Filter & Sort
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-dark-tremor-content hover:text-gray-800 dark:hover:text-dark-tremor-content-strong focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 overflow-y-auto h-full">
          {/* Sort Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="mb-3 text-xs font-bold text-gray-600 dark:text-dark-tremor-content uppercase tracking-wide">
                Sort By
              </h3>
              <button
                onClick={handleResetSort}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="sortField"
                  value="time"
                  checked={sortField === 'time'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600 dark:text-blue-500 h-3 w-3"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-dark-tremor-content">
                  Timestamp
                </span>
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="sortField"
                  value="status_code"
                  checked={sortField === 'status_code'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600 dark:text-blue-500 h-3 w-3"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-dark-tremor-content">
                  Status
                </span>
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="radio"
                  name="sortField"
                  value="method"
                  checked={sortField === 'method'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="form-radio text-blue-600 dark:text-blue-500 h-3 w-3"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-dark-tremor-content">
                  Method
                </span>
              </label>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-bold text-gray-600 dark:text-dark-tremor-content uppercase tracking-wide">
                Sort Direction
              </h4>
              <div className="space-y-2">
                <label className="flex items-center text-xs">
                  <input
                    type="radio"
                    name="sortDirection"
                    value="asc"
                    checked={sortDirection === 'asc'}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="form-radio text-blue-600 dark:text-blue-500 h-3 w-3"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-dark-tremor-content">
                    Ascending
                  </span>
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="radio"
                    name="sortDirection"
                    value="desc"
                    checked={sortDirection === 'desc'}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="form-radio text-blue-600 dark:text-blue-500 h-3 w-3"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-dark-tremor-content">
                    Descending
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Filter Section */}
          <section className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="mb-3 text-xs font-bold text-gray-600 dark:text-dark-tremor-content uppercase tracking-wide">
                Filters
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="space-y-4">
              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Quick Time Range
                </label>
                <select
                  value={typeof filters.timestampRange === 'string' ? filters.timestampRange : ''}
                  onChange={handlePresetTimeRangeChange}
                  className="block w-full border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any</option>
                  <option value="5M">Last 5 minutes</option>
                  <option value="15M">Last 15 minutes</option>
                  <option value="30M">Last 30 minutes</option>
                  <option value="1H">Last 1 hour</option>
                  <option value="3H">Last 3 hours</option>
                  <option value="6H">Last 6 hours</option>
                  <option value="12H">Last 12 hours</option>
                  <option value="24H">Last 24 hours</option>
                  <option value="48H">Last 48 hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Specific Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
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
                    className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={
                      typeof filters.timestampRange === 'object' && filters.timestampRange.end
                        ? filters.timestampRange.end
                        : ''
                    }
                    onChange={(e) => handleCustomRangeChange('end', e.target.value)}
                    className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Status
                </label>
                <TagsInput
                  options={statusCodeOptions}
                  selected={filters.status || []}
                  onChange={(codes) => setFilters((prev) => ({ ...prev, status: codes }))}
                  placeholder="Add status code..."
                  colorFn={getStatusClass}
                />
              </div>

              {/* Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Method
                </label>
                <TagsInput
                  options={methodOptions}
                  selected={filters.method || []}
                  onChange={(methods) => setFilters((prev) => ({ ...prev, method: methods }))}
                  placeholder="Add method..."
                  colorFn={getMethodTagClass}
                />
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Tags
                </label>
                <TagsInput
                  options={tagOptions}
                  selected={filters.tags || []}
                  onChange={(selectedTags) =>
                    setFilters((prev) => ({ ...prev, tags: selectedTags }))
                  }
                  placeholder="Add tag..."
                />
              </div>

              {/* MCP Tool Filter */}
              {showMcpToolFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    MCP Tool
                  </label>
                  <TagsInput
                    options={mcpToolOptions}
                    selected={filters.mcpTool || []}
                    onChange={(selectedTools) =>
                      setFilters((prev) => ({ ...prev, mcpTool: selectedTools }))
                    }
                    placeholder="Add MCP tool..."
                    colorFn={getFixedMcpTagClass('blue')}
                  />
                </div>
              )}

              {/* MCP Resource Filter */}
              {showMcpResourceFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    MCP Resource
                  </label>
                  <TagsInput
                    options={mcpResourceOptions}
                    selected={filters.mcpResource || []}
                    onChange={(selectedResources) =>
                      setFilters((prev) => ({ ...prev, mcpResource: selectedResources }))
                    }
                    placeholder="Add MCP resource..."
                    colorFn={getFixedMcpTagClass('emerald')}
                  />
                </div>
              )}

              {/* MCP Prompt Filter */}
              {showMcpPromptFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    MCP Prompt
                  </label>
                  <TagsInput
                    options={mcpPromptOptions}
                    selected={filters.mcpPrompt || []}
                    onChange={(selectedPrompts) =>
                      setFilters((prev) => ({ ...prev, mcpPrompt: selectedPrompts }))
                    }
                    placeholder="Add MCP prompt..."
                    colorFn={getFixedMcpTagClass('indigo')}
                  />
                </div>
              )}

              {/* MCP Category Filter */}
              {showMcpCategoryFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    MCP Category
                  </label>
                  <TagsInput
                    options={mcpCategoryOptions}
                    selected={filters.mcpCategory || []}
                    onChange={(selectedCategories) =>
                      setFilters((prev) => ({ ...prev, mcpCategory: selectedCategories }))
                    }
                    placeholder="Add MCP category..."
                    colorFn={getMcpTagClass}
                  />
                </div>
              )}

              {/* MCP Method Filter */}
              {showMcpMethodFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    MCP Method
                  </label>
                  <TagsInput
                    options={mcpMethodOptions}
                    selected={filters.mcpMethod || []}
                    onChange={(selectedMethods) =>
                      setFilters((prev) => ({ ...prev, mcpMethod: selectedMethods }))
                    }
                    placeholder="Add MCP method..."
                    colorFn={getMcpTagClass}
                  />
                </div>
              )}

              {/* Path Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. /api/users"
                  value={filters.path || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Duration (Latency) Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
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
                    className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.durationMax || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, durationMax: e.target.value }))
                    }
                    className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Host Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                  Host
                </label>
                <input
                  type="text"
                  placeholder="e.g. localhost"
                  value={filters.host || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, host: e.target.value }))}
                  className="block w-full border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
