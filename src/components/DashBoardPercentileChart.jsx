// src/components/DashBoardPercentileChart.jsx
import React, { useMemo, useState } from 'react';
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
  title = 'HTTP Request duration (percentiles)',
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

  // Selection state: null or 'all' means show all available, otherwise only the clicked key
  const [selectedKey, setSelectedKey] = useState('all');

  const categories = useMemo(() => {
    if (!availableKeys.length) return [];
    if (!selectedKey || selectedKey === 'all') return availableKeys;
    return availableKeys.includes(selectedKey) ? [selectedKey] : availableKeys;
  }, [availableKeys, selectedKey]);

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
          <TogglePill
            label="All"
            active={selectedKey === 'all'}
            onClick={() => setSelectedKey('all')}
          />
          {allKeys.map((k) => (
            <TogglePill
              key={k}
              label={k.toUpperCase()}
              active={selectedKey === k}
              onClick={() => setSelectedKey(k)}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        <AreaChart
          data={data}
          index="date"
          categories={categories}
          colors={[
            'blue', // p50
            'violet', // p90
            'cyan', // p95
            'rose' // p99
          ]}
          showGradient={false}
          valueFormatter={valueFormatter}
          className="mt-4 hidden h-80 w-full sm:block"
        />
        <AreaChart
          data={data}
          index="date"
          categories={categories}
          colors={['blue', 'violet', 'cyan', 'rose']}
          showGradient={false}
          valueFormatter={valueFormatter}
          className="mt-4 h-48 w-full sm:hidden"
        />
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Values in milliseconds</p>
      </div>
    </Card>
  );
}
