// src/components/JsonPathPicker.jsx
import React, { useId, useMemo, useState } from 'react';
import { inspectrJsonPathTree, flattenJsonPathTree } from '../utils/inspectrJsonPaths';

function renderTree(nodes, onSelect, depth = 0) {
  if (!nodes) return null;

  return nodes.map((node) => {
    const key = `${node.value || node.label}-${depth}`;
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = `${depth * 12}px`;

    return (
      <div key={key} className="space-y-1" style={{ paddingLeft }}>
        <button
          type="button"
          onClick={() => node.value && onSelect(node.value)}
          className={`flex w-full flex-col items-start rounded-md px-2 py-1 text-left text-sm transition hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-100 focus:text-blue-700 focus:outline-none dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:focus:bg-blue-500/20 dark:focus:text-blue-200 ${
            node.value
              ? ''
              : 'cursor-default text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'
          }`}
          disabled={!node.value}
        >
          <span>{node.label}</span>
          {node.description && node.value && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{node.description}</span>
          )}
        </button>
        {hasChildren && renderTree(node.children, onSelect, depth + 1)}
      </div>
    );
  });
}

export default function JsonPathPicker({
  id,
  value,
  onChange,
  placeholder = '$.request.path',
  inputClassName = '',
  browseButtonLabel = 'Browse paths',
  className = '',
  disabled = false
}) {
  const generatedId = useId();
  const inputId = id || `json-path-input-${generatedId}`;
  const datalistId = `${inputId}-options`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const flatOptions = useMemo(() => flattenJsonPathTree(inspectrJsonPathTree), []);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatOptions;
    return flatOptions.filter((option) => {
      return (
        option.value.toLowerCase().includes(q) ||
        (option.label && option.label.toLowerCase().includes(q)) ||
        (option.description && option.description.toLowerCase().includes(q))
      );
    });
  }, [flatOptions, query]);

  const handleSelect = (selectedValue) => {
    if (!selectedValue) return;
    if (onChange) {
      onChange(selectedValue);
    }
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={inputId}
            list={datalistId}
            value={value}
            onChange={(event) => onChange && onChange(event.target.value)}
            placeholder={placeholder}
            className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30 ${inputClassName}`}
            onFocus={() => !disabled && setQuery('')}
            autoComplete="off"
            disabled={disabled}
          />
          <datalist id={datalistId}>
            {flatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>
        </div>
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
            setQuery('');
          }}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:border-blue-700 dark:focus:ring-blue-700/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
        >
          {browseButtonLabel}
        </button>
      </div>
      {isOpen && !disabled && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search JSON paths..."
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
            >
              Close
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1 text-gray-800 dark:text-gray-100">
            {query.trim() ? (
              filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="flex w-full flex-col items-start rounded-md px-2 py-1 text-left text-sm transition hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-100 focus:text-blue-700 focus:outline-none dark:hover:bg-blue-500/10 dark:hover:text-blue-300 dark:focus:bg-blue-500/20 dark:focus:text-blue-200"
                  >
                    <span>{option.value}</span>
                    {option.label && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {option.label}
                      </span>
                    )}
                    {option.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {option.description}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400">
                  No matches found.
                </p>
              )
            ) : (
              renderTree([inspectrJsonPathTree], handleSelect)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
