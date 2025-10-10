// src/components/operations/MetaContent.jsx
import React, { useEffect, useRef, useState } from 'react';

const extractHeaders = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return Object.entries(input).map(([name, value]) => ({ name, value }));
};

const MetaContent = ({ operation }) => {
  const guardHeaders = extractHeaders(operation?.meta?.inspectr?.guard);
  const directiveHeaders = extractHeaders(operation?.meta?.inspectr?.directives);
  const [highlight, setHighlight] = useState(null);
  const guardSectionRef = useRef(null);

  useEffect(() => {
    const open = (e) => {
      const name = e?.detail?.name;
      setHighlight(name || null);
      // Scroll guard section into view
      guardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Clear highlight after a moment
      if (name) {
        setTimeout(() => setHighlight(null), 1600);
      }
    };
    window.addEventListener('inspectr:openMetaGuard', open);
    return () => window.removeEventListener('inspectr:openMetaGuard', open);
  }, []);

  const AuthBadge = ({ label }) => (
    <span className="ml-2 py-0.5 px-1.5 inline-flex items-center gap-x-1 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-md dark:bg-blue-500/10 dark:text-blue-500">
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
      {label}
    </span>
  );

  if (guardHeaders.length === 0 && directiveHeaders.length === 0) {
    return (
      <div className="text-gray-500 dark:text-dark-tremor-content text-sm">
        No Inspectr metadata
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {guardHeaders.length > 0 && (
        <div ref={guardSectionRef}>
          <button className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong">
            Guard ({(guardHeaders ?? []).length})
          </button>
          <table className="table-fixed w-full border-collapse border border-gray-300 dark:border-dark-tremor-border">
            <thead>
              <tr className="bg-gray-100 dark:bg-blue-900/30">
                <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 w-1/4 text-left font-semibold text-gray-700 dark:text-white">
                  API Key
                </th>
                <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {guardHeaders.map((h) => {
                const showToken = h.name === 'inspectr-auth-token';
                const showKey = h.name === 'inspectr-auth-key';
                const rowHighlight = highlight && highlight === h.name;
                return (
                  <tr key={h.name} className={rowHighlight ? 'bg-blue-50 dark:bg-blue-950/30' : ''}>
                    <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-slate-500 dark:text-dark-tremor-content text-xs">
                      <div className="flex items-center">
                        <span>{h.name}</span>
                        {showToken && <AuthBadge label="Guard Token" />}
                        {showKey && <AuthBadge label="Guard Key" />}
                      </div>
                    </td>
                    <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-xs break-all dark:text-dark-tremor-content">
                      {h.value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {directiveHeaders.length > 0 && (
        <div>
          <button className="w-full p-2 text-left font-bold bg-gray-200 dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong">
            Directives ({(directiveHeaders ?? []).length})
          </button>
          <table className="table-fixed w-full border-collapse border border-gray-300 dark:border-dark-tremor-border">
            <thead>
              <tr className="bg-gray-100 dark:bg-blue-900/30">
                <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 w-1/4 text-left font-semibold text-gray-700 dark:text-white">
                  Directive
                </th>
                <th className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 text-left font-semibold text-gray-700 dark:text-white">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {directiveHeaders.map((h) => (
                <tr key={h.name}>
                  <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-slate-500 dark:text-dark-tremor-content text-xs">
                    {h.name}
                  </td>
                  <td className="border border-slate-200 dark:border-dark-tremor-border px-2 py-1 font-mono text-xs break-all dark:text-dark-tremor-content">
                    {h.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetaContent;
