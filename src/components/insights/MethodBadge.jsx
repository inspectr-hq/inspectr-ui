// src/components/insights/MethodBadge.jsx

import React from 'react';
import { getMethodTagClass } from '../../utils/getMethodClass.js';

export default function MethodBadge({ method }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getMethodTagClass(method)}`}
    >
      {method || 'N/A'}
    </span>
  );
}
