// src/components/DashBoardBarList.jsx

import { useState } from 'react';
import { BarList, Card } from '@tremor/react';

const valueFormatter = (number) => `${Intl.NumberFormat('us').format(number).toString()}`;

export default function DashBoardBarList({ title, data, toggleable = true }) {
  const [extended, setExtended] = useState(true);
  // If toggleable is false, always show extended content.
  const showExtended = toggleable ? extended : true;

  // Transform data from { path, count } to { name, value }
  const transformedData = data
    ? data.map((item) => ({
        name: item.path,
        value: item.count
      }))
    : [];

  return (
    <Card className="mt-4 rounded-tremor-small p-2">
      <div className="flex items-center justify-between border-b border-tremor-border p-3 dark:border-dark-tremor-border">
        <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </p>
        <p className="text-tremor-label font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
          Totals
        </p>
      </div>
      <div className={`overflow-hidden p-6 ${showExtended ? '' : 'max-h-[260px]'}`}>
        <BarList data={transformedData} valueFormatter={valueFormatter} />
      </div>
      {toggleable && (
        <div
          className={`flex justify-center ${
            actualExtended
              ? 'px-6 pb-6'
              : 'absolute inset-x-0 bottom-0 rounded-b-tremor-default bg-gradient-to-t from-tremor-background to-transparent py-7 dark:from-dark-tremor-background'
          }`}
        >
          <button
            className="flex items-center justify-center rounded-tremor-small border border-tremor-border bg-tremor-background px-2.5 py-2 text-tremor-default font-medium text-tremor-content-strong shadow-tremor-input hover:bg-tremor-background-muted dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-strong dark:shadow-dark-tremor-input hover:dark:bg-dark-tremor-background-muted"
            onClick={() => setExtended(!extended)}
          >
            {extended ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
    </Card>
  );
}
