// 'use client';

import { BarChart, Card } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  { name: '2xx', value: '$1.9M', color: 'bg-blue-500' },
  { name: '3xx', value: '$4.1M', color: 'bg-orange-500' },
  { name: '4xx', value: '$10.1M', color: 'bg-cyan-500' },
  { name: '5xx', value: '$10.1M', color: 'bg-indigo-500' },
];

const data = [
  {
    date: 'Jan 23',
    '2xx': 68560,
    '3xx': 28560,
    '4xx': 34940,
    '5xx': 34940,
  },
  {
    date: 'Feb 23',
    '2xx': 70320,
    '3xx': 30320,
    '4xx': 44940,
    '5xx': 44940,
  },
  {
    date: 'Mar 23',
    '2xx': 80233,
    '3xx': 70233,
    '4xx': 94560,
    '5xx': 94560,
  },
  {
    date: 'Apr 23',
    '2xx': 55123,
    '3xx': 45123,
    '4xx': 84320,
    '5xx': 84320,
  },
  {
    date: 'May 23',
    '2xx': 56000,
    '3xx': 80600,
    '4xx': 71120,
    '5xx': 71120,
  },
  {
    date: 'Jun 23',
    '2xx': 100000,
    '3xx': 85390,
    '4xx': 61340,
    '5xx': 61340,
  },
  {
    date: 'Jul 23',
    '2xx': 85390,
    '3xx': 45340,
    '4xx': 71260,
    '5xx': 71260,
  },
  {
    date: 'Aug 23',
    '2xx': 80100,
    '3xx': 70120,
    '4xx': 61210,
    '5xx': 61210,
  },
  {
    date: 'Sep 23',
    '2xx': 75090,
    '3xx': 69450,
    '4xx': 61110,
    '5xx': 61110,
  },
  {
    date: 'Oct 23',
    '2xx': 71080,
    '3xx': 63345,
    '4xx': 41430,
    '5xx': 41430,
  },
  {
    date: 'Nov 23',
    '2xx': 68041,
    '3xx': 61210,
    '4xx': 100330,
    '5xx': 100330,
  },
  {
    date: 'Dec 23',
    '2xx': 60143,
    '3xx': 45321,
    '4xx': 80780,
    '5xx': 80780,
  },
];

function valueFormatter(number) {
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
    style: 'currency',
    currency: 'USD',
  });

  return formatter.format(number);
}

export default function DashBoardVolume() {
  return (
    <>
      {/*<Card className="sm:mx-auto sm:max-w-2xl">*/}
      <Card className="mt-4 h-120 rounded-tremor-small p-2">
        <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Traffic Volume
        </h3>
        <ul
          role="list"
          className="mt-6 grid gap-3 sm:grid-cols-4 md:grid-cols-4"
        >
          {tabs.map((tab) => (
            <li
              key={tab.name}
              className="rounded-tremor-small border border-tremor-border px-3 py-2 text-left dark:border-dark-tremor-border"
            >
              <div className="flex items-center space-x-1.5">
                <span
                  className={classNames(tab.color, 'size-2.5 rounded-sm')}
                  aria-hidden={true}
                />
                <p className="text-tremor-label text-tremor-content dark:text-dark-tremor-content">
                  {tab.name}
                </p>
              </div>
              <p className="mt-0.5 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {tab.value}
              </p>
            </li>
          ))}
        </ul>
        <BarChart
          data={data}
          index="date"
          categories={['2xx', '3xx', '4xx', '5xx']}
          colors={['blue', 'orange', 'cyan', 'indigo']}
          showLegend={false}
          valueFormatter={valueFormatter}
          yAxisWidth={50}
          stack={true}
          className="mt-6 hidden h-56 sm:block"
        />
        <BarChart
          data={data}
          index="date"
          categories={['2xx', '3xx', '4xx', '5xx']}
          colors={['blue', 'orange', 'cyan', 'indigo']}
          showLegend={false}
          valueFormatter={valueFormatter}
          showYAxis={false}
          stack={true}
          className="mt-6 h-48 sm:hidden"
        />
      </Card>
    </>
  );
}