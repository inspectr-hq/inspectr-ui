// src/components/insights/EmptyState.jsx

import React from 'react';

export default function EmptyState({ message = 'No operations captured yet.' }) {
  return (
    <div className="flex items-center justify-center rounded-tremor-small border border-dashed border-tremor-border py-16 text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
      {message}
    </div>
  );
}
