// src/components/OperationTagsPanel.jsx
import React, { useEffect, useState } from 'react';
import { useInspectr } from '../context/InspectrContext';
import DialogDeleteConfirm from './DialogDeleteConfirm.jsx';
import TagPill from './TagPill.jsx';

export default function OperationTagsPanel({ onTagsUpdate }) {
  const { client, setToast } = useInspectr();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setRefreshing] = useState(false);

  const [pendingTag, setPendingTag] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const hasClient = Boolean(client?.operations);

  const applyTags = (list) => {
    setTags(list);
    onTagsUpdate?.(list);
  };

  const loadTags = async () => {
    if (!hasClient) return;
    try {
      setLoading(true);
      setError('');
      const res = await client.operations.listTags();
      const list = Array.isArray(res?.tags) ? res.tags : [];
      list.sort((a, b) => a.localeCompare(b));
      applyTags(list);
    } catch (err) {
      console.error('Failed to load tags', err);
      setError(err?.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const refreshTags = async () => {
    if (!hasClient) return;
    try {
      setRefreshing(true);
      setError('');
      const res = await client.operations.listTags();
      const list = Array.isArray(res?.tags) ? res.tags : [];
      list.sort((a, b) => a.localeCompare(b));
      applyTags(list);
    } catch (err) {
      console.error('Failed to refresh tags', err);
      setError(err?.message || 'Failed to refresh tags');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hasClient) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await client.operations.listTags();
        if (cancelled) return;
        const list = Array.isArray(res?.tags) ? res.tags : [];
        list.sort((a, b) => a.localeCompare(b));
        applyTags(list);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load tags', err);
        setError(err?.message || 'Failed to load tags');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasClient, client]);

  const handleRequestDelete = (tag) => {
    setPendingTag(tag);
    setDeleteError('');
  };

  const handleCancelDelete = () => {
    setPendingTag(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!pendingTag || !client?.operations) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      const result = await client.operations.bulkDeleteTag({ tag: pendingTag, dryRun: false });
      setToast?.({
        type: 'success',
        message: `Tag \"${pendingTag}\" removed from matching operations`
      });
      setPendingTag(null);
      refreshTags();
    } catch (err) {
      console.error('Bulk delete tag failed', err);
      setDeleteError(err?.message || 'Failed to delete tag');
      setToast?.({ type: 'error', message: err?.message || 'Failed to delete tag' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Operation Tags
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and remove tags across operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshTags}
            title="Refresh tags"
            disabled={isRefreshing || loading}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-2 pb-4">
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading tags…
          </div>
        ) : tags.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No tags found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {tags.map((tag) => (
              <li key={tag} className="flex items-center justify-between gap-3 py-2">
                <div className="inline-flex items-center gap-2">
                  <TagPill tag={tag} />
                </div>
                <button
                  type="button"
                  onClick={() => handleRequestDelete(tag)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950"
                  title={`Remove tag \"${tag}\" from operations`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="-ms-0.5"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DialogDeleteConfirm
        open={Boolean(pendingTag)}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Remove tag from operations?"
        description={
          pendingTag ? (
            <>
              This will remove the tag <span className="font-semibold">{pendingTag}</span> from all
              matching operations. This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete Tag"
      />
    </section>
  );
}
