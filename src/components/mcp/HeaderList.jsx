// src/components/mcp/HeaderList.jsx

import React from 'react';
import { Text } from '@tremor/react';

const HeaderList = ({ headers = [] }) =>
  headers.length ? (
    <div className="max-h-60 overflow-auto">
      <dl className="divide-y divide-tremor-border dark:divide-dark-tremor-border">
        {headers.map((header, index) => (
          <div key={`${header.name}-${index}`} className="flex items-start gap-3 px-3 py-1">
            <dt className="w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              {header.name}
            </dt>
            <dd className="flex-1 text-[10px] text-tremor-content dark:text-dark-tremor-content">
              {header.value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  ) : (
    <Text className="px-3 py-2 text-sm text-tremor-content-subtle dark:text-dark-tremor-content">
      No headers
    </Text>
  );

export default HeaderList;
