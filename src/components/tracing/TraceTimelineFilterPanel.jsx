// src/components/tracing/TraceTimelineFilterPanel.jsx
import React from 'react';
import TagsInput from '../TagsInput.jsx';
import { getStatusClass } from '../../utils/getStatusClass.js';
import { getMethodTagClass } from '../../utils/getMethodClass.js';
import { getMcpMethodColor } from '../../utils/mcp.js';

const TraceTimelineFilterPanel = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  statusOptions = [],
  methodOptions = [],
  tagOptions = [],
  mcpToolOptions = [],
  mcpResourceOptions = [],
  mcpPromptOptions = [],
  mcpCategoryOptions = [],
  mcpMethodOptions = [],
  hostOptions = [],
  hasMcpOperations = false,
  persistFilters = false,
  onPersistFiltersChange = () => {}
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
  const hasMcpFiltersActive = [
    ...(filters.mcpTool || []),
    ...(filters.mcpResource || []),
    ...(filters.mcpPrompt || []),
    ...(filters.mcpCategory || []),
    ...(filters.mcpMethod || [])
  ].length
    ? true
    : Boolean(filters.tokenMin || filters.tokenMax);
  const showMcpSection =
    hasMcpOperations ||
    hasMcpFiltersActive ||
    showMcpToolFilter ||
    showMcpResourceFilter ||
    showMcpPromptFilter ||
    showMcpCategoryFilter ||
    showMcpMethodFilter;

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleSectionReset = (keys) => {
    setFilters((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50"
          style={{ zIndex: 9998 }}
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[420px] max-w-full bg-white dark:bg-dark-tremor-background shadow-xl dark:shadow-dark-tremor-shadow transform transition-transform duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300 dark:border-dark-tremor-border bg-gray-50 dark:bg-dark-tremor-background-subtle">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-tremor-content-strong">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-dark-tremor-content hover:text-gray-800 dark:hover:text-dark-tremor-content-strong focus:outline-none cursor-pointer border rounded px-1"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <section className="mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-dark-tremor-border">
              <h3 className="text-xs font-bold text-gray-600 dark:text-dark-tremor-content uppercase tracking-wide">
                Filters
              </h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-dark-tremor-content-subtle">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={persistFilters}
                    onChange={(e) => onPersistFiltersChange(e.target.checked)}
                  />
                  Keep on reload
                </label>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              {showMcpSection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-tremor-content-subtle">
                      MCP
                    </h4>
                    <button
                      onClick={() =>
                        handleSectionReset([
                          'mcpTool',
                          'mcpResource',
                          'mcpPrompt',
                          'mcpMethod',
                          'mcpCategory',
                          'tokenMin',
                          'tokenMax'
                        ])
                      }
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                      Total Tokens
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.tokenMin || ''}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, tokenMin: e.target.value }))
                        }
                        className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.tokenMax || ''}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, tokenMax: e.target.value }))
                        }
                        className="w-1/2 border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={`space-y-4 ${
                  showMcpSection
                    ? 'pt-4 border-t border-gray-200 dark:border-dark-tremor-border'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-tremor-content-subtle">
                    HTTP
                  </h4>
                  <button
                    onClick={() => handleSectionReset(['status', 'method', 'path'])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    Status
                  </label>
                  <TagsInput
                    options={statusOptions}
                    selected={filters.status || []}
                    onChange={(codes) => setFilters((prev) => ({ ...prev, status: codes }))}
                    placeholder="Add status..."
                    colorFn={getStatusClass}
                  />
                </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /mcp"
                    value={filters.path || ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))}
                    className="block w-full border border-gray-300 dark:border-dark-tremor-border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-tremor-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-tremor-content-subtle">
                    Tags
                  </h4>
                  <button
                    onClick={() => handleSectionReset(['tags'])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
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
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-tremor-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-tremor-content-subtle">
                    Timing & Host
                  </h4>
                  <button
                    onClick={() => handleSectionReset(['durationMin', 'durationMax', 'host'])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                    Host
                  </label>
                  <TagsInput
                    options={hostOptions}
                    selected={filters.host || []}
                    onChange={(selectedHosts) =>
                      setFilters((prev) => ({ ...prev, host: selectedHosts }))
                    }
                    placeholder="Add host..."
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default TraceTimelineFilterPanel;
