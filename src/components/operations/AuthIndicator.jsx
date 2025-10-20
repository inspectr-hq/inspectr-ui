// src/components/operations/AuthIndicator.jsx
import React from 'react';

// Determine the type of authentication used for a request and display it
// using a colored badge. If no authentication is present, render nothing.
//
// Supported types:
// - Inspectr guard headers: "inspectr-auth-token" or "inspectr-auth-key"
// - API key headers (e.g. "x-api-key")
// - Standard Authorization header: "Basic", "Bearer", or other
//
export default function AuthIndicator({ operation, onClick }) {
  const guard = operation?.meta?.inspectr?.guard || {};
  const headers = operation?.request?.headers || [];

  const Badge = ({ children }) => (
    <span
      onClick={onClick}
      className="py-1 px-1.5 inline-flex items-center gap-x-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md dark:bg-blue-500/10 dark:text-blue-500 cursor-pointer select-none hover:ring-1 ring-blue-300"
    >
      <svg
        className="shrink-0 h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      {children}
    </span>
  );

  if (guard['inspectr-auth-token']) {
    return <Badge>Guard Token</Badge>;
  }

  if (guard['inspectr-auth-key']) {
    return <Badge>Guard Key</Badge>;
  }

  const apiKeyHeader = headers.find((h) => {
    const name = h?.name;
    if (!name) return false;
    const compact = name.toLowerCase().replace(/[^a-z]/g, ''); // e.g., 'x-api-key' -> 'xapikey'
    return compact.includes('apikey');
  });
  if (apiKeyHeader) {
    return <Badge>API Key</Badge>;
  }

  const authHeader = headers.find((h) => h.name && h.name.toLowerCase() === 'authorization');
  if (authHeader && authHeader.value) {
    const value = authHeader.value.toLowerCase();
    if (value.startsWith('basic')) {
      return <Badge>Basic Auth</Badge>;
    }
    if (value.startsWith('bearer')) {
      return <Badge>Bearer</Badge>;
    }
    return <Badge>Auth</Badge>;
  }

  return null;
}
