// src/components/insights/OperationCard.jsx

import React from 'react';
import { Badge, Card, Text, Title } from '@tremor/react';
import MethodBadge from './MethodBadge.jsx';
import StatusBadge from './StatusBadge.jsx';
import TagPill from '../TagPill.jsx';
import { getMethodTextClass } from '../../utils/getMethodClass.js';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';

export default function OperationCard({ operation }) {
  return (
    <Card className="h-full rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MethodBadge method={operation.method} />
              <Text className={`text-xs font-semibold ${getMethodTextClass(operation.method)}`}>
                {operation.method}
              </Text>
            </div>
            <Title className="text-base text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {operation.path}
            </Title>
            <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
              {formatTimestamp(operation.timestamp)}
            </Text>
            {operation.host ? (
              <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                Host {operation.host}
              </Text>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={operation.status} />
            <Badge color="blue">{formatDuration(operation.duration)}</Badge>
          </div>
        </div>

        {operation.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {operation.tags.slice(0, 6).map((tag) => (
              <TagPill key={tag.token} tag={tag} />
            ))}
            {operation.tags.length > 6 ? (
              <span className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content">
                +{operation.tags.length - 6} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
