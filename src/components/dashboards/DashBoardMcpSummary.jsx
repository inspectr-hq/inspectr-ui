// src/components/dashboards/DashBoardMcpSummary.jsx

import { Card } from '@tremor/react';

const formatNumber = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0';
  return Intl.NumberFormat('us').format(numeric);
};

export default function DashBoardMcpSummary({ total }) {
  const kpiData = [
    { name: 'Total MCP Requests', stat: formatNumber(total?.count) },
    { name: 'Request Tokens', stat: formatNumber(total?.request_tokens) },
    { name: 'Response Tokens', stat: formatNumber(total?.response_tokens) },
    { name: 'Total Tokens', stat: formatNumber(total?.total_tokens) }
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((item) => (
        <Card key={item.name}>
          <div className="flex items-center justify-between">
            <dt className="text-tremor-default font-medium text-tremor-content dark:text-dark-tremor-content">
              {item.name}
            </dt>
          </div>
          <dd className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {item.stat}
          </dd>
        </Card>
      ))}
    </dl>
  );
}
