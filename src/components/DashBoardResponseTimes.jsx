// 'use client';

import { RiExternalLinkLine } from '@remixicon/react';
import { AreaChart, Card } from '@tremor/react';

function valueFormatter(number) {
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(number);
}

const data = [
  {
    date: 'Jan 23',
    MS: 385,
  },
  {
    date: 'Feb 23',
    MS: 403,
  },
  {
    date: 'Mar 23',
    MS: 502,
  },
  {
    date: 'Apr 23',
    MS: 551,
  },
  {
    date: 'May 23',
    MS: 560,
  },
  {
    date: 'Jun 23',
    MS: 100,
  },
  {
    date: 'Jul 23',
    MS: 853,
  },
  {
    date: 'Aug 23',
    MS: 801,
  },
  {
    date: 'Sep 23',
    MS: 750,
  },
  {
    date: 'Oct 23',
    MS: 710,
  },
  {
    date: 'Nov 23',
    MS: 680,
  },
  {
    date: 'Dec 23',
    MS: 601,
  },
];

export default function DashBoardResponseTimes() {
  return (
    <>
      {/*<Card className="p-0 sm:mx-auto sm:w-full"> */}
      <Card className="mt-4 h-120 rounded-tremor-small p-2">
        <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Response Times
        </h3>
        <div className="p-6">
          <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Average Response Times
          </p>
          <p className="text-2xl font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            423 ms
          </p>
          <AreaChart
            data={data}
            index="date"
            categories={['MS']}
            showLegend={false}
            showGradient={false}
            yAxisWidth={45}
            valueFormatter={valueFormatter}
            className="mt-8 hidden h-60 sm:block"
          />
          <AreaChart
            data={data}
            index="date"
            categories={['MS']}
            showLegend={false}
            showGradient={false}
            showYAxis={false}
            startEndOnly={true}
            valueFormatter={valueFormatter}
            className="mt-8 h-48 sm:hidden"
          />
        </div>
      </Card>
    </>
  );
}