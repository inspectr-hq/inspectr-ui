// src/components/DashBoardPercentileChart.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Card } from '@tremor/react';

function valueFormatter(number) {
  // Duration values are milliseconds
  if (number == null || Number.isNaN(number)) return '';
  return `${Math.round(number)}`; // show as integer ms
}

function TogglePill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-2 py-1 text-xs rounded border',
        active
          ? 'bg-tremor-brand text-tremor-brand-inverted dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted border-transparent'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function DashBoardPercentileChart({
  title = 'HTTP Request duration: p50, p90, p95, p99',
  data = []
}) {
  const allKeys = ['p50', 'p90', 'p95', 'p99'];

  // Detect which percentile keys are actually available in the dataset
  const availableKeys = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const set = new Set();
    for (const row of data) {
      for (const k of allKeys) {
        if (row && typeof row[k] === 'number') set.add(k);
      }
    }
    return allKeys.filter((k) => set.has(k));
  }, [data]);

  // Selected keys state: default to all available ("all on")
  const [selectedKeys, setSelectedKeys] = useState(new Set(allKeys));

  // Keep selected keys in sync when availableKeys change (e.g., on new data)
  useEffect(() => {
    // Initialize to all available on first load, and drop any keys that are no longer available
    setSelectedKeys((prev) => {
      // If prev was empty or different size, ensure at least includes only available keys; default to all available if empty
      const next = new Set([...prev].filter((k) => availableKeys.includes(k)));
      if (next.size === 0) {
        return new Set(availableKeys);
      }
      // Also include any newly available keys (to keep default "all on")
      availableKeys.forEach((k) => next.add(k));
      return next;
    });
  }, [availableKeys]);

  const toggleKey = (k) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        next.delete(k);
      } else {
        next.add(k);
      }
      return next;
    });
  };

  // Build categories and matching colors based on selected keys, preserving fixed order
  const colorByKey = {
    p50: 'blue',
    p90: 'violet',
    p95: 'cyan',
    p99: 'rose'
  };

  const categories = useMemo(() => {
    return availableKeys.filter((k) => selectedKeys.has(k));
  }, [availableKeys, selectedKeys]);

  const colors = useMemo(() => categories.map((k) => colorByKey[k]), [categories]);

  // If no percentile data present, render a subtle placeholder card
  if (availableKeys.length === 0) {
    return (
      <Card className="mt-4 rounded-tremor-small p-4">
        <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No percentile data found for the selected range.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-4 rounded-tremor-small p-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </h3>
        <div className="flex gap-2">
          {allKeys.map((k) => (
            <TogglePill
              key={k}
              label={k.toUpperCase()}
              active={selectedKeys.has(k)}
              onClick={() => toggleKey(k)}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No percentile selected. Toggle one or more options above.
          </p>
        ) : (
          <>
            <AreaChart
              data={data}
              index="date"
              categories={categories}
              colors={colors}
              showGradient={false}
              valueFormatter={valueFormatter}
              className="mt-4 hidden h-80 w-full sm:block"
            />
            <AreaChart
              data={data}
              index="date"
              categories={categories}
              colors={colors}
              showGradient={false}
              valueFormatter={valueFormatter}
              className="mt-4 h-48 w-full sm:hidden"
            />
          </>
        )}
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Values in milliseconds</p>
      </div>
    </Card>
  );
}
