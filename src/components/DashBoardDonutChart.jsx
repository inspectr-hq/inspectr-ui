// src/components/DashBoardDonutChart.jsx

import { Card, DonutChart } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const data = [
  {
    name: 'Real estate',
    amount: 2095920,
    share: '84.3%',
    href: '#',
    borderColor: 'bg-blue-500',
  },
  {
    name: 'Stocks & ETFs',
    amount: 250120,
    share: '10.1%',
    href: '#',
    borderColor: 'bg-violet-500',
  },
  {
    name: 'Cash & cash equivalent',
    amount: 140110,
    share: '5.6%',
    href: '#',
    borderColor: 'bg-fuchsia-500',
  },
];

export default function DashBoardDonutChart({
  title = 'Donut Chart',
  description = '',
  data,
  valueFormatter, // optional custom function
  colors, // optional array of colors for the chart (e.g. ['blue', 'violet', 'fuchsia'])
}) {
  // Default border colors for the legend items
  const defaultBorderColors = ['bg-blue-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-emerald-500', 'bg-sky-500'];
  // Default colors for the DonutChart (if not provided)
  const donutChartColors = colors || ['blue', 'violet', 'fuchsia', 'emerald', 'sky'];

  // Default value formatter: display as percentage (assumes data is ratio-based)
  const defaultValueFormatter = (number) => `${number}`;
  const formatter = valueFormatter || defaultValueFormatter;

  // Transform data if needed:
  // If data is an object, transform it into an array of { name, amount, share, borderColor }
  let transformedData = [];
  if (Array.isArray(data)) {
    transformedData = data;
  } else if (data && typeof data === 'object') {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    transformedData = entries.map(([key, value], index) => ({
      name: key,
      amount: value,
      share: total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%',
      borderColor: defaultBorderColors[index % defaultBorderColors.length],
    }));
  }

  return (
    <Card className="mt-4 h-120 rounded-tremor-small p-2">
      <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
          {description}
        </p>
      )}
      <div className="mt-6 grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-8">
        <DonutChart
          data={transformedData}
          category="amount"
          index="name"
          valueFormatter={formatter}
          showTooltip={false}
          className="h-40"
          colors={donutChartColors}
        />
        <div className="mt-6 flex items-center sm:mt-0">
          <ul role="list" className="space-y-3">
            {transformedData.map((item) => (
              <li key={item.name} className="flex space-x-3">
                <span className={classNames(item.borderColor, 'w-1 shrink-0 rounded')} />
                <div>
                  <p className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {formatter(item.amount)}{' '}
                    <span className="font-normal">({item.share})</span>
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                    {item.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}