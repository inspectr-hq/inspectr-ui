// src/components/insights/ListMode.jsx

import React from 'react';
import { Grid } from '@tremor/react';
import EmptyState from './EmptyState.jsx';
import OperationCard from './OperationCard.jsx';
import { MAX_LIST_ITEMS } from './constants.js';

export default function ListMode({ operations }) {
  if (!operations.length) {
    return <EmptyState message="Operations will appear here once traffic flows." />;
  }

  return (
    <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
      {operations.slice(0, MAX_LIST_ITEMS).map((operation) => (
        <OperationCard key={operation.id} operation={operation} />
      ))}
    </Grid>
  );
}
