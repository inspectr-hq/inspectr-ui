// src/components/DateRangeButtons.jsx
import React, { useMemo } from 'react';
import { getTimeRangePresets } from '../utils/timeRange.js';

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

export default function DateRangeButtons({
  selectedRange,
  onSelect,
  onCustomClick,
  referenceDate
}) {
  const options = useMemo(() => getTimeRangePresets(referenceDate), [referenceDate]);

  return (
    <div className="inline-flex items-center rounded shadow">
      {options.map((item, idx) => (
        <button
          key={item.label}
          onClick={() => onSelect?.(item)}
          title={item.tooltip}
          type="button"
          className={joinClassNames(
            idx === 0 ? 'rounded-l' : idx === options.length - 1 ? '-ml-px rounded-r' : '-ml-px',
            'border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand/60',
            selectedRange === item.label
              ? 'bg-tremor-brand text-tremor-brand-inverted dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          {item.label}
        </button>
      ))}
      <button
        onClick={onCustomClick}
        title="Set custom date range"
        type="button"
        className={joinClassNames(
          '-ml-px rounded-r',
          'border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand/60',
          selectedRange === 'Custom'
            ? 'bg-tremor-brand text-tremor-brand-inverted dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        )}
      >
        Custom
      </button>
    </div>
  );
}
