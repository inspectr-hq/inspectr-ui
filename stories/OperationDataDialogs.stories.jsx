import React, { useEffect, useMemo, useState } from 'react';
import InspectrContext from '../src/context/InspectrContext.jsx';
import DialogExportOperations from '../src/components/operations/DialogExportOperations.jsx';
import DialogExportRecords from '../src/components/operations/DialogExportRecords.jsx';
import DialogImportOperations from '../src/components/operations/DialogImportOperations.jsx';
import { createEventDB } from '../src/utils/eventDB.js';
import { createNamespacedStorageAdapter } from '../src/utils/storageAdapter.js';
import { httpOperations } from './fixtures/inspectrFixtures.js';

const RECORDING_START = '2026-01-15T10:00:00.000Z';

const DialogScenario = ({ kind, mode = 'success' }) => {
  const [open, setOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const eventDB = useMemo(
    () => createEventDB({ dbName: 'InspectrOperationDataDialogsStory' }),
    []
  );
  const storageAdapter = useMemo(
    () => createNamespacedStorageAdapter('storybook/operation-data-dialogs'),
    []
  );
  const client = useMemo(
    () => ({
      operations: {
        export: async () => {
          if (mode === 'export-error') throw new Error('Export service unavailable');
          return new Blob([JSON.stringify({ operations: httpOperations }, null, 2)], {
            type: 'application/json'
          });
        },
        importOperations: async (file) => {
          if (mode === 'import-error') throw new Error(`Could not import ${file.name}`);
          return { imported: httpOperations.length };
        }
      }
    }),
    [mode]
  );

  useEffect(() => {
    const seed = async () => {
      await eventDB.clearEvents();
      await eventDB.bulkUpsertEvents(
        httpOperations.map((operation) => ({
          id: operation.id,
          operation_id: operation.id,
          data: operation
        }))
      );
    };
    seed();
    return () => {
      eventDB.db.close();
    };
  }, [eventDB]);

  const close = () => setOpen(false);
  const value = { client, eventDB, storageAdapter, toast, setToast };

  return (
    <InspectrContext.Provider value={value}>
      <div className="min-h-[360px] bg-gray-100 p-8 dark:bg-gray-950">
        {kind === 'import' ? <DialogImportOperations open={open} onClose={close} /> : null}
        {kind === 'export' ? <DialogExportOperations open={open} onClose={close} /> : null}
        {kind === 'recording' ? (
          <DialogExportRecords
            open={open}
            onClose={close}
            onContinue={close}
            onCancelRecording={close}
            startTime={RECORDING_START}
          />
        ) : null}
        {toast ? (
          <p role="status" aria-live="polite" className="rounded bg-white p-3 text-sm shadow">
            {toast.message}
            {toast.subMessage ? `: ${toast.subMessage}` : ''}
          </p>
        ) : null}
      </div>
    </InspectrContext.Provider>
  );
};

export default {
  title: 'Components/Operations/OperationDataDialogs',
  parameters: { layout: 'fullscreen' }
};

export const ImportReady = () => <DialogScenario kind="import" />;
export const ImportFailure = () => <DialogScenario kind="import" mode="import-error" />;
export const ExportOperationsReady = () => <DialogScenario kind="export" />;
export const ExportOperationsFailure = () => (
  <DialogScenario kind="export" mode="export-error" />
);
export const ExportRecording = () => <DialogScenario kind="recording" />;
