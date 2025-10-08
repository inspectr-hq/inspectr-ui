// src/components/NoDataPlaceholder.jsx
import React from 'react';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function NoDataPlaceholder({ className = '' }) {
  return (
    <div
      className={joinClassNames(
        'flex items-center justify-center w-full h-full border border-dashed rounded-tremor-default border-tremor-border dark:border-dark-tremor-border',
        className
      )}
    >
      <p className="text-tremor-content text-tremor-default dark:text-dark-tremor-content">
        No data
      </p>
    </div>
  );
}
