// 'use client';

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

const currencyFormatter = (number) => {
  return '$' + Intl.NumberFormat('us').format(number).toString();
};

export default function DashBoardDonutChart() {
  return (
    <>
      {/*<Card className="sm:mx-auto sm:max-w-xl">*/}
      <Card className="mt-4 h-120 rounded-tremor-small p-2">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Asset allocation
        </h3>
        <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-8">
          <DonutChart
            data={data}
            category="amount"
            index="name"
            valueFormatter={currencyFormatter}
            showTooltip={false}
            className="h-40"
            colors={['blue', 'violet', 'fuchsia']}
          />
          <div className="mt-6 flex items-center sm:mt-0">
            <ul role="list" className="space-y-3">
              {data.map((item) => (
                <li key={item.name} className="flex space-x-3">
                  <span
                    className={classNames(
                      item.borderColor,
                      'w-1 shrink-0 rounded',
                    )}
                  />
                  <div>
                    <p className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      {currencyFormatter(item.amount)}{' '}
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
    </>
  );
}