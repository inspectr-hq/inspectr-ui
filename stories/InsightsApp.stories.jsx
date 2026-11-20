import React from 'react';
import InsightsApp from '../src/components/insights/InsightsApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import { createInsightsClient, httpOperations } from './fixtures/inspectrFixtures.js';

const InsightsStory = ({ mode = 'populated', delay = 0 }) => {
  const eventDB = React.useMemo(
    () => createEventDB({ dbName: `InspectrInsightsStory-${mode}` }),
    [mode]
  );
  const client = React.useMemo(() => createInsightsClient({ mode, delay }), [mode, delay]);

  React.useEffect(() => {
    let active = true;
    const seed = async () => {
      await eventDB.clearEvents();
      if (!active || mode === 'empty') return;
      await eventDB.bulkUpsertEvents(httpOperations.map((operation) => ({
        id: operation.id,
        operation_id: operation.id,
        data: operation
      })));
    };
    seed();
    return () => {
      active = false;
      eventDB.db.close();
    };
  }, [eventDB, mode]);

  return (
    <InspectrContext.Provider value={{ client, eventDB }}>
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-950 sm:p-6">
        <InsightsApp />
      </div>
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Apps/Insights/InsightsApp',
  component: InsightsApp
};

export const Populated = () => <InsightsStory />;
export const Empty = () => <InsightsStory mode="empty" />;
export const Loading = () => <InsightsStory mode="populated" delay={30000} />;
export const Error = () => <InsightsStory mode="error" />;
