// src/components/operations/DialogExportRecords.jsx
import React, { useEffect, useState } from 'react';
import { useInspectr } from '../../context/InspectrContext';
import { useLiveQuery } from 'dexie-react-hooks';
import eventDB from '../../utils/eventDB.js';
import useFeaturePreview from '../../hooks/useFeaturePreview.jsx';
import useLocalStorage from '../../hooks/useLocalStorage.jsx';

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
  const [indentJson, setIndentJson] = useLocalStorage('exportJsonIndent', 'false');
  const [openapiEnabled] = useFeaturePreview('feat_export_openapi');
  const [postmanEnabled] = useFeaturePreview('feat_export_postman');
  const [errorMessage, setErrorMessage] = useState('');
  const recordCount = useLiveQuery(async () => {
    if (!startTime) return 0;
    return await eventDB.db.events.where('time').above(startTime).count();
  }, [startTime]);

  useEffect(() => {
    if (!open) setErrorMessage('');
  }, [open]);

  const handleExport = async () => {
    setExporting(true);
    setErrorMessage('');
    try {
      const params = {
        since: startTime,
        format
      };
      if (format === 'json') {
        params.indent = indentJson === 'true';
      }
      const blob = await client.operations.export(params);
      const now = new Date();
      const pad = (num) => num.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'phar' ? 'phar' : 'json';
      const formatSuffix = format === 'json' ? '' : `_${format}`;
      a.download = `inspectr_operations_${timestamp}${formatSuffix}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      if (onClose) onClose();
    } catch (err) {
      console.error('Export failed', err);
      const message = err?.message || 'Export failed';
      setErrorMessage(message);
      setToast({ message: 'Export failed', subMessage: message, type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 z-10">
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
            <option value="json">JSON</option>
            {openapiEnabled && <option value="openapi">OpenAPI (preview)</option>}
            {postmanEnabled && <option value="postman">Postman (preview)</option>}
          </select>
        </div>
        {format === 'json' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">JSON formatting</label>
            <div className="mt-1 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="jsonIndentRecords"
                  value="false"
                  checked={indentJson === 'false'}
                  onChange={() => setIndentJson('false')}
                  className="form-radio"
                />
                <span className="ml-2">Minified</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="jsonIndentRecords"
                  value="true"
                  checked={indentJson === 'true'}
                  onChange={() => setIndentJson('true')}
                  className="form-radio"
                />
                <span className="ml-2">Pretty-printed</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minified is the default but you can export as a pretty-printed JSON.
            </p>
          </div>
        )}
        {errorMessage && (
          <p className="-mt-2 mb-4 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
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
