// src/components/DialogLicense.jsx
import React, { useEffect, useState } from 'react';
import mapLicenseError from '../../utils/mapLicenseError.js';

export default function DialogLicense({ open, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputId = 'license-file-input';

  useEffect(() => {
    if (open) {
      setText('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    const key = (text || '').trim();
    if (!key) {
      setError('Please paste a license key.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(key);
      onClose();
    } catch (err) {
      const friendly = mapLicenseError(err);
      setError(friendly);
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const txt = await file.text();
      setText(txt.trim());
      setError('');
    } catch (err) {
      setError('Failed to read license file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Dialog panel */}
      <div className="relative bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">Update License</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            aria-label="Close"
            disabled={loading}
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Paste your license key below or upload a key file.
        </p>

        <div className="mb-3 flex items-center gap-2">
          <input
            id={fileInputId}
            type="file"
            accept=".txt,.key,.license,application/octet-stream,text/plain,application/json"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => document.getElementById(fileInputId)?.click()}
            className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Upload Key File
          </button>
          <span className="text-xs text-gray-500">Accepted: .txt, .key, .license</span>
        </div>

        <textarea
          className={`w-full h-48 p-3 rounded border text-sm font-mono ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-800 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder={`Paste your license key here`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
          disabled={loading}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update License'}
          </button>
        </div>
      </div>
    </div>
  );
}
