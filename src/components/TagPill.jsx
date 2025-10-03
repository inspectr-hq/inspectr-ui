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
      X
    </button>
  ) : null;

  if (normalized.type === 'kv') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 pl-2.5 pr-2.5 py-1 text-xs text-slate-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
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
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 pl-2.5 pr-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content">
      {normalized.display}
      {removeButton}
    </span>
  );
}
