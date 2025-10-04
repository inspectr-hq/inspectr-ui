// src/components/RuleImportDialog.jsx
import React, { useEffect, useState } from 'react';
import { useInspectr } from '../context/InspectrContext.jsx';

export default function RuleImportDialog({ open, onCancel, onImport, onImported }) {
  const { client, setToast } = useInspectr();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [overwrite, setOverwrite] = useState(true);

  useEffect(() => {
    if (!open) {
      setText('');
      setFile(null);
      setError('');
      setImporting(false);
      setOverwrite(true);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError('');
  };

  const handleImport = async () => {
    if (!client?.rules?.import) return;
    if (!file && !text.trim()) {
      setError('Select a YAML file or paste YAML content.');
      return;
    }

    setImporting(true);
    setError('');

    try {
      let payload = text;
      if (file) {
        try {
          // Using Response(file) is more resilient than File.text() in some browsers
          payload = await new Response(file).text();
        } catch (e) {
          console.error('Failed to read file', e);
          setError('Could not read the selected file. Please reselect it or paste the YAML.');
          setImporting(false);
          return;
        }
      }
      const res = await client.rules.import(payload, { overwrite });

      // Try to surface a created/updated rule back to parent if they want to open the builder
      const rule = res?.rule || (Array.isArray(res?.rules) ? res.rules[0] : null);

      setToast?.({ type: 'success', message: 'Import completed' });

      if (onImported) {
        try {
          await onImported();
        } catch (e) {
          // ignore refresh errors
        }
      }

      if (rule && onImport) {
        onImport(rule);
      }

      onCancel?.();
    } catch (err) {
      console.error('Import failed', err);
      setError(err?.message || 'Failed to import rules');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 !mt-0">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Import rules</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a .yaml export or paste YAML content.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close import dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label
              htmlFor="rule-import-file"
              className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              YAML file
            </label>
            <input
              id="rule-import-file"
              type="file"
              accept=".yaml,.yml,text/yaml,application/x-yaml,application/yaml"
              onChange={handleFileChange}
              onClick={(e) => {
                e.currentTarget.value = null;
              }}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50 dark:text-gray-200 dark:file:border-gray-700 dark:file:bg-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="rule-import-yaml"
              className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Or paste YAML
            </label>
            <textarea
              id="rule-import-yaml"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              placeholder={`# name: Example rule\n# event: ...\n# expression:\n#   op: and\n#   args: ...`}
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#0B101F] dark:text-gray-100 dark:focus:border-blue-700 dark:focus:ring-blue-800/50"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
              />
              Overwrite existing rules
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={importing}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
