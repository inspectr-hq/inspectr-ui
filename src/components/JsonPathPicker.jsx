// src/components/JsonPathPicker.jsx
import React, { useEffect, useId, useMemo, useState } from 'react';
import { JSONPath } from 'jsonpath-plus';
import { inspectrJsonPathTree, flattenJsonPathTree } from '../utils/inspectrJsonPaths';
import useRecentOperations from '../hooks/useRecentOperations.jsx';

const parseJsonSafely = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value;
  const startsLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (!startsLikeJson) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const prepareOperationForPreview = (operation) => {
  if (!operation || typeof operation !== 'object') return operation;

  const next = { ...operation };

  if (operation.request && typeof operation.request === 'object') {
    next.request = { ...operation.request };
    if ('body' in operation.request) {
      const parsed = parseJsonSafely(operation.request.body);
      if (parsed !== operation.request.body) {
        next.request.body = parsed;
        next.request.__rawBody = operation.request.body;
      }
    }
  }

  if (operation.response && typeof operation.response === 'object') {
    next.response = { ...operation.response };
    if ('body' in operation.response) {
      const parsed = parseJsonSafely(operation.response.body);
      if (parsed !== operation.response.body) {
        next.response.body = parsed;
        next.response.__rawBody = operation.response.body;
      }
    }
  }

  return next;
};

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
  disabled = false,
  enablePreview = false
}) {
  const generatedId = useId();
  const inputId = id || `json-path-input-${generatedId}`;
  const datalistId = `${inputId}-options`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewMatchesCount, setPreviewMatchesCount] = useState(0);
  const [previewError, setPreviewError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  const { results: recentOperations } = useRecentOperations(8);

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

  useEffect(() => {
    if (!enablePreview) return;
    if (!isPreviewOpen) return;
    if (!recentOperations.length) return;
    const firstId = recentOperations[0]?.id;
    if (!firstId) return;
    setSelectedOperationId((prev) => prev || firstId);
  }, [enablePreview, isPreviewOpen, recentOperations]);

  useEffect(() => {
    if (!enablePreview) return;
    if (!isPreviewOpen) return;

    if (!trimmedValue) {
      setPreviewResult(null);
      setPreviewMatchesCount(0);
      setPreviewError('');
      setIsEvaluating(false);
      return;
    }

    if (!selectedOperationId) {
      setPreviewResult(null);
      setPreviewMatchesCount(0);
      setPreviewError('Select an operation to preview');
      setIsEvaluating(false);
      return;
    }

    const operation = recentOperations.find((item) => item.id === selectedOperationId);

    if (!operation) {
      setPreviewResult(null);
      setPreviewMatchesCount(0);
      setPreviewError('Selected operation is no longer available');
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);
    try {
      const evaluationTarget = prepareOperationForPreview(operation);
      const rawResult = JSONPath({ path: trimmedValue, json: evaluationTarget });
      const matches = Array.isArray(rawResult) ? rawResult : [rawResult];
      const matchesCount = matches.length;

      setPreviewMatchesCount(matchesCount);

      if (matchesCount === 0) {
        setPreviewResult(null);
      } else if (matchesCount === 1) {
        setPreviewResult(matches[0]);
      } else {
        setPreviewResult(matches);
      }
      setPreviewError('');
    } catch (err) {
      setPreviewResult(null);
      setPreviewMatchesCount(0);
      setPreviewError(err?.message || 'Failed to evaluate JSON path');
    } finally {
      setIsEvaluating(false);
    }
  }, [enablePreview, isPreviewOpen, trimmedValue, selectedOperationId, recentOperations]);

  useEffect(() => {
    if (!enablePreview) {
      setIsPreviewOpen(false);
    }
  }, [enablePreview]);

  const renderPreviewResult = () => {
    if (!trimmedValue) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter a JSON path to preview the matching values.
        </p>
      );
    }

    if (!recentOperations.length) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No recent operations available. Capture traffic to preview JSON path results.
        </p>
      );
    }

    if (previewError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {previewError}
        </div>
      );
    }

    if (isEvaluating) {
      return <p className="text-xs text-gray-500 dark:text-gray-400">Evaluating JSON path…</p>;
    }

    if (
      previewMatchesCount === 0 ||
      previewResult === null ||
      typeof previewResult === 'undefined'
    ) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No results found for this JSON path in the selected operation.
        </p>
      );
    }

    const formatted = (() => {
      if (typeof previewResult === 'string') return previewResult;
      if (typeof previewResult === 'number' || typeof previewResult === 'boolean') {
        return String(previewResult);
      }
      try {
        return JSON.stringify(previewResult, null, 2);
      } catch (err) {
        return String(previewResult);
      }
    })();

    return (
      <div className="space-y-2">
        {previewMatchesCount > 1 && (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Found {previewMatchesCount} matches.
          </p>
        )}
        <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          {formatted}
        </pre>
      </div>
    );
  };

  const previewOperationOptions = recentOperations.map((operation) => {
    const method = operation?.request?.method || 'GET';
    const path = operation?.request?.path || operation?.request?.url || 'Unknown path';
    const status = operation?.response?.status;
    const timestamp = operation?.request?.timestamp
      ? new Date(operation.request.timestamp).toLocaleString()
      : 'Unknown time';
    const statusLabel = status ? `${status}` : 'N/A';
    return {
      id: operation.id,
      label: `${method} ${path} • ${statusLabel} • ${timestamp}`
    };
  });

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
        {enablePreview && (
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setIsPreviewOpen((prev) => !prev);
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:border-blue-700 dark:focus:ring-blue-700/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            {isPreviewOpen ? 'Hide preview' : 'Preview'}
          </button>
        )}
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
      {enablePreview && isPreviewOpen && !disabled && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-1">
            <label
              htmlFor={`${inputId}-preview-operation`}
              className="text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              Preview with operation
            </label>
            <select
              id={`${inputId}-preview-operation`}
              value={selectedOperationId}
              onChange={(event) => setSelectedOperationId(event.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
            >
              <option value="">Select an operation…</option>
              {previewOperationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>{renderPreviewResult()}</div>
        </div>
      )}
    </div>
  );
}
