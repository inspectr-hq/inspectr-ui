// src/components/insights/StatusBadge.jsx

import React from 'react';
import { getStatusClass } from '../../utils/getStatusClass.js';

export default function StatusBadge({ status }) {
  const normalized = typeof status === 'number' ? status : Number(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(normalized)}`}
    >
      {status ?? '—'}
    </span>
  );
}
