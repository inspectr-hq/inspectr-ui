// src/components/DialogLicenseInfo.jsx
import React, { useEffect, useState } from 'react';
import mapLicenseError from '../utils/mapLicenseError.js';

export default function DialogLicenseInfo({ open, onClose, license, onRefresh }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setKey('');
      setLoading(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const summaryPlan = license?.license?.plan || 'unknown';
  const meta = license?.license || {};
  const features = license?.features || {};
  const usageFeatures = license?.usage?.features || {};

  const expiresAt = meta?.expires_at || null;
  const startsAt = meta?.starts_at || null;
  const updatedAt = meta?.updated_at || null;
  const graceUntil = meta?.grace_until || null;
  const inGraceFlag = meta?.in_grace === true;
  const issuedBy = meta?.issuer || null;
  const subject = meta?.subject || null;

  const featureEntries = Object.entries(features || {});

  const fmtIso = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toISOString().slice(0, 19).replace('T', ' ');
  };

  const handleRefresh = async () => {
    setError('');
    const licenseKey = (key || '').trim();
    if (!licenseKey) {
      setError('Please enter a license key.');
      return;
    }
    try {
      setLoading(true);
      await onRefresh(licenseKey);
      setKey('');
    } catch (err) {
      setError(mapLicenseError(err));
    } finally {
      setLoading(false);
    }
  };

  // Derive license status (active / in grace / expired)
  const now = new Date();
  const expDate = expiresAt ? new Date(expiresAt) : null;
  const graceDate = graceUntil ? new Date(graceUntil) : null;
  const isExpired = expDate ? now > expDate : false;
  const isBeyondGrace = isExpired && graceDate ? now > graceDate : false;
  const isInGrace = inGraceFlag || (isExpired && graceDate && now <= graceDate);
  const isActive = expDate ? now <= expDate : false;

  let statusLabel = 'Unknown';
  let statusDetail = '';
  let statusDot = 'bg-gray-400';
  if (isBeyondGrace) {
    statusLabel = 'Expired';
    statusDetail = graceDate ? `(grace ended ${fmtIso(graceUntil)})` : '(grace ended)';
    statusDot = 'bg-red-600';
  } else if (isInGrace) {
    statusLabel = 'In Grace';
    statusDetail = graceDate ? `(until ${fmtIso(graceUntil)})` : '';
    statusDot = 'bg-yellow-500';
  } else if (isActive) {
    statusLabel = 'Active';
    statusDetail = expDate ? `(until ${fmtIso(expiresAt)})` : '';
    statusDot = 'bg-green-600';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />

      {/* Dialog panel */}
      <div className="relative bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">License Overview</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            aria-label="Close"
            disabled={loading}
          >
            &times;
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50 flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusDot}`} />
              {statusLabel}
              {statusDetail && (
                <span className="ml-2 text-xs font-normal text-gray-500">{statusDetail}</span>
              )}
            </p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Plan</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{summaryPlan}</p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Issued By</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{issuedBy || '—'}</p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">License Key</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{subject || '—'}</p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {fmtIso(updatedAt) || '—'}
            </p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Starts</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {fmtIso(startsAt) || '—'}
            </p>
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs uppercase text-gray-500">Expires</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {fmtIso(expiresAt) || '—'}
            </p>
          </div>
          {graceUntil && (
            <div className="rounded border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs uppercase text-gray-500">Grace Until</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {fmtIso(graceUntil)}
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Features</h4>
          {featureEntries.length === 0 && (
            <p className="text-sm text-gray-500">No features available.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featureEntries.map(([name, info]) => {
              const title = name.toUpperCase();
              const usage = usageFeatures?.[name] || {};
              return (
                <div key={name} className="rounded border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs uppercase text-gray-500 mb-1">{title}</p>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    {'effective_enabled' in info && (
                      <p>Effective enabled: {String(info.effective_enabled)}</p>
                    )}
                    {'effective_limit' in info && (
                      <p>Effective limit: {info.effective_limit ?? '—'}</p>
                    )}
                    {'licensed_enabled' in info && (
                      <p>Licensed enabled: {String(info.licensed_enabled)}</p>
                    )}
                    {'licensed_limit' in info && (
                      <p>Licensed limit: {info.licensed_limit ?? '—'}</p>
                    )}
                    {'default_limit' in info && <p>Default limit: {info.default_limit ?? '—'}</p>}
                    {'unlimited' in info && <p>Unlimited: {String(info.unlimited)}</p>}
                    {('used' in usage || 'used' in info) && (
                      <p>Used: {usage.used ?? info.used ?? 0}</p>
                    )}
                    {('remaining' in usage || 'remaining' in info) && (
                      <p>Remaining: {usage.remaining ?? info.remaining ?? 0}</p>
                    )}
                    {('window' in usage || 'window' in info) && (
                      <p>Window: {usage.window ?? info.window ?? '—'}</p>
                    )}
                    {('period_start' in usage || 'period_start' in info) && (
                      <p>Period start: {fmtIso(usage.period_start ?? info.period_start)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refresh */}
        <div className="mt-2 rounded border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Refresh License</p>
          <p className="mt-1 text-xs text-gray-500">
            Enter a license key to update the license details.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="INSPECTR-..."
              className="flex-1 rounded border border-gray-300 dark:border-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleRefresh}
              className={`px-4 py-2 text-white rounded ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh License'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
