import React from 'react';

export default function NotificationBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
      {count}
    </span>
  );
}
