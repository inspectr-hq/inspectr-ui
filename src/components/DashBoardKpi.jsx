// src/components/DashBoardKpi.jsx

import { Card } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DashBoardKpi({ overall }) {
  if (!overall) {
    return <div>Loading KPI...</div>;
  }

  const kpiData = [
    {
      name: 'Total Requests',
      stat: overall.total_requests,
      // Optionally, include change info if available
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Average Response Time',
      stat: `${overall.average_response_time} ms`,
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Success Rate',
      stat: `${(overall.success_rate * 100).toFixed(1)}%`,
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Error Rate',
      stat: `${(overall.error_rate * 100).toFixed(1)}%`,
      change: '',
      changeType: 'neutral',
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((item) => (
        <Card key={item.name}>
          <div className="flex items-center justify-between">
            <dt className="text-tremor-default font-medium text-tremor-content dark:text-dark-tremor-content">
              {item.name}
            </dt>
            {item.change && (
              <span
                className={classNames(
                  item.changeType === 'positive'
                    ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-500 dark:ring-emerald-400/20'
                    : 'bg-red-100 text-red-800 ring-red-600/10 dark:bg-red-400/10 dark:text-red-500 dark:ring-red-400/20',
                  'inline-flex items-center rounded-tremor-small px-2 py-1 text-tremor-label font-medium ring-1 ring-inset'
                )}
              >
                {item.change}
              </span>
            )}
          </div>
          <dd className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {item.stat}
          </dd>
        </Card>
      ))}
    </dl>
  );
}