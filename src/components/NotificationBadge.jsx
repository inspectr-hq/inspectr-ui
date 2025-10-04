import React from 'react';

export default function NotificationBadge({ count, color = 'red', className = '' }) {
  if (!count || count <= 0) return null;

  const colorClass =
    color === 'green' ? 'bg-green-600' : color === 'orange' ? 'bg-orange-500' : 'bg-red-600';

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white ${colorClass} rounded-full ${className}`}
    >
      {count}
    </span>
  );
}
