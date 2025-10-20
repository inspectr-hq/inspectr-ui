// src/components/operations/DialogImportOperations.jsx
import React, { useState } from 'react';
import { useInspectr } from '../../context/InspectrContext';

export default function DialogImportOperations({ open, onClose }) {
  const { client, setToast } = useInspectr();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      await client.operations.import(file);
      setToast({ message: 'Import completed', type: 'success' });
      if (onClose) onClose();
    } catch (err) {
      console.error('Import failed', err);
      setToast({ message: 'Import failed', subMessage: err.message, type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Import Operations</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className={`px-4 py-2 text-white rounded ${!file || importing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
