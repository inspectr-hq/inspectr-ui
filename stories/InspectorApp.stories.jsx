import React from 'react';
import InspectrApp from '../src/components/InspectrApp.jsx';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import { httpOperations } from './fixtures/inspectrFixtures.js';

export default {
  title: 'Apps/History/InspectrApp',
  component: InspectrApp
};

const HistoryStory = ({ mode = 'populated', delay = 0 }) => {
  const eventDB = React.useMemo(
    () => createEventDB({ dbName: `InspectrStory-${mode}` }),
    [mode]
  );
  const client = React.useMemo(
    () => ({ operations: { deleteAll: async () => {}, delete: async () => {} } }),
    []
  );

  React.useEffect(() => {
    let active = true;
    const queryEvents = eventDB.queryEvents.bind(eventDB);
    eventDB.queryEvents = async (options) => {
      if (mode === 'error') throw new Error('Local history could not be read.');
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return queryEvents(options);
    };
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
  }, [delay, eventDB, mode]);

  return (
    <InspectrContext.Provider
      value={{
        client,
        eventDB,
        mode: 'standalone',
        namespace: '',
        connectionStatus: 'connected',
        syncOperations: () => {},
        setLastEventId: () => {},
        setToast: () => {}
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <InspectrApp route={{ slug: 'inspectr', params: {} }} />
      </div>
    </InspectrContext.Provider>
  );
};

export const Populated = () => <HistoryStory />;
export const Empty = () => <HistoryStory mode="empty" />;
export const Loading = () => <HistoryStory mode="loading" delay={30000} />;
export const Error = () => <HistoryStory mode="error" />;
