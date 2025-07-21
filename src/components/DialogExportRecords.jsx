import React, { useState } from 'react';
import { useInspectr } from '../context/InspectrContext';
import { useLiveQuery } from 'dexie-react-hooks';
import eventDB from '../utils/eventDB.js';

export default function DialogExportRecords({
  open,
  onClose,
  onContinue,
  onCancelRecording,
  startTime
}) {
  const { client, setToast } = useInspectr();
  const [format, setFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const recordCount = useLiveQuery(async () => {
    if (!startTime) return 0;
    return await eventDB.db.events.where('time').above(startTime).count();
  }, [startTime]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await client.operations.export({
        since: startTime,
        format
      });
      const now = new Date();
      const pad = (num) => num.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspectr_operations_${timestamp}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      if (onClose) onClose();
    } catch (err) {
      console.error('Export failed', err);
      setToast({ message: 'Export failed', subMessage: err.message, type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Export Recording</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p className="text-sm mb-4">
          {recordCount} operations recorded since {new Date(startTime).toLocaleString()}
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="openapi">OpenAPI</option>
            <option value="phar">PHAR</option>
            <option value="postman">Postman</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Continue Recording
          </button>
          <button
            onClick={onCancelRecording}
            className="px-4 py-2 bg-orange-200 text-gray-700 rounded hover:bg-orange-300"
          >
            Cancel Recording
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 text-white rounded ${exporting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
