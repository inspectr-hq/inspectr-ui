import React from 'react';

const extractHeaders = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return Object.entries(input).map(([name, value]) => ({ name, value }));
};

const MetaContent = ({ operation }) => {
  const guardHeaders = extractHeaders(operation?.meta?.inspectr?.guard);
  const directiveHeaders = extractHeaders(operation?.meta?.inspectr?.directives);

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
        <div>
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
              {guardHeaders.map((h) => (
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
