// src/components/TagPill.jsx
import React from 'react';
import { normalizeTag } from '../utils/normalizeTags.js';

export default function TagPill({ tag, showRemove = false, onRemove, removeLabel = 'Remove tag' }) {
  const normalized = typeof tag === 'string' ? normalizeTag(tag) : tag;
  if (!normalized) return null;

  const handleRemove = () => {
    if (!showRemove) return;
    onRemove?.(normalized);
  };

  const removeButton = showRemove ? (
    <button
      type="button"
      onClick={handleRemove}
      className="inline-flex size-4 -mr-1.5 p-0.5 items-center justify-center rounded-full text-[11px] font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none dark:text-red-300 dark:hover:bg-red-950"
      aria-label={`${removeLabel} ${normalized.display}`.trim()}
      title={`${removeLabel} ${normalized.display}`.trim()}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414
                     1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293
                     4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </button>
  ) : null;

  if (normalized.type === 'kv') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 pl-2.5 pr-2.5 py-1 text-xs text-slate-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
        <span className="font-semibold uppercase tracking-wide text-[10px] text-slate-500 dark:text-dark-tremor-content">
          {normalized.key}:
        </span>
        <span className="font-mono text-[11px] text-slate-700 dark:text-dark-tremor-content">
          {normalized.value}
        </span>
        {removeButton}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 pl-2.5 pr-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
      {normalized.display}
      {removeButton}
    </span>
  );
}
