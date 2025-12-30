// src/components/dashboards/DashBoardMcpBarList.jsx

import { BarList, Card } from '@tremor/react';
import NoDataPlaceholder from '../NoDataPlaceholder.jsx';

const formatNumber = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0';
  return Intl.NumberFormat('us').format(numeric);
};

const valueFormatter = (number) => `${formatNumber(number)}`;

export default function DashBoardMcpBarList({ title, items }) {
  const data = Array.isArray(items)
    ? items.map((item) => {
        const tokenLabel =
          item.totalTokens != null ? ` (${formatNumber(item.totalTokens)} tokens)` : '';
        return {
          name: `${item.name}${tokenLabel}`,
          value: item.count ?? 0
        };
      })
    : [];

  const hasData = data.length > 0;

  return (
    <Card className="mt-4 rounded-tremor-small p-2">
      <div className="flex items-center justify-between border-b border-tremor-border p-3 dark:border-dark-tremor-border">
        <p className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </p>
        <p className="text-tremor-label font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
          Count
        </p>
      </div>
      <div className="overflow-hidden p-6">
        {hasData ? (
          <BarList data={data} valueFormatter={valueFormatter} />
        ) : (
          <NoDataPlaceholder className="min-h-[150px]" />
        )}
      </div>
    </Card>
  );
}
