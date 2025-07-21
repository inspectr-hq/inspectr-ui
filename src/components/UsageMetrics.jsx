import React, { useEffect, useState } from 'react';
import { Card, List, ListItem } from '@tremor/react';
import { useInspectr } from '../context/InspectrContext';

export default function UsageMetrics() {
  const { client } = useInspectr();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const data = await client.stats.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Usage metrics error', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [client]);

  if (loading) return <p>Loading metrics…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {Object.entries(metrics).map(([section, values]) => (
        <Card key={section} className="rounded-tremor-small p-2">
          <h3 className="capitalize p-3 border-b border-tremor-border dark:border-dark-tremor-border font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {section}
          </h3>
          <List className="mt-2 divide-y divide-tremor-border dark:divide-dark-tremor-border">
            {Object.entries(values).map(([name, value]) => (
              <ListItem key={name} className="py-2 flex justify-between">
                <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {name.replace(/_/g, ' ')}
                </span>
                <span className="text-tremor-content dark:text-dark-tremor-content">{value}</span>
              </ListItem>
            ))}
          </List>
        </Card>
      ))}
    </div>
  );
}
