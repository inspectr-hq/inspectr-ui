// src/components/insights/TableMode.jsx

import React from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from '@tremor/react';
import EmptyState from './EmptyState.jsx';
import StatusBadge from './StatusBadge.jsx';
import { getMethodTextClass } from '../../utils/getMethodClass.js';
import { formatDuration, formatTimestamp } from '../../utils/formatters.js';

export default function TableMode({ operations }) {
  if (!operations.length) {
    return <EmptyState message="No operations available for tabular view." />;
  }

  return (
    <Card className="rounded-tremor-small border border-tremor-border dark:border-dark-tremor-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Method</TableHeaderCell>
              <TableHeaderCell>Path</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Host</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell>
                  <StatusBadge status={operation.status} />
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${getMethodTextClass(operation.method)}`}>
                    {operation.method}
                  </span>
                </TableCell>
                <TableCell className="max-w-md truncate">{operation.path}</TableCell>
                <TableCell>{formatDuration(operation.duration)}</TableCell>
                <TableCell className="min-w-[160px]">
                  {formatTimestamp(operation.timestamp)}
                </TableCell>
                <TableCell>{operation.host || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
