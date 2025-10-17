// src/components/insights/EndpointMode.jsx

import React from 'react';
import { Card, Grid } from '@tremor/react';
import EmptyState from './EmptyState.jsx';
import EndpointCard from './EndpointCard.jsx';

export default function EndpointMode({ endpoints, loading, error }) {
  if (loading) {
    return (
      <Card className="rounded-tremor-small border border-dashed border-tremor-border py-12 text-center text-sm text-tremor-content-subtle dark:border-dark-tremor-border dark:text-dark-tremor-content">
        Loading endpoint summary…
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-tremor-small border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
        Failed to load endpoint summary: {error.message || 'Unexpected error'}
      </Card>
    );
  }

  if (!endpoints.length) {
    return <EmptyState message="No endpoint activity to display yet." />;
  }

  return (
    <Grid>
      {endpoints.map((endpoint) => (
        <EndpointCard key={endpoint.key} endpoint={endpoint} />
      ))}
    </Grid>
  );
}
