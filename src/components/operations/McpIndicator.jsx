// src/components/operations/McpIndicator.jsx
import React from 'react';

const McpIndicator = ({
  mcp,
  showCategory = false,
  showToolName = false,
  showMethod = false,
  onClick
}) => {
  if (!mcp) return null;

  const { category, tool_name: toolName, method } = mcp;

  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 ${
        onClick
          ? 'cursor-pointer hover:ring-2 hover:ring-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300'
          : ''
      }`}
    >
      <span>MCP</span>
      {showCategory && category ? (
        <span className="rounded bg-white px-1 py-0.5 text-[10px] font-semibold uppercase text-sky-700 shadow-sm dark:bg-sky-900/60 dark:text-sky-100">
          {category}
        </span>
      ) : null}
      {showToolName && toolName ? (
        <span className="font-mono text-[11px] normal-case text-sky-800 dark:text-sky-100">
          {toolName}
        </span>
      ) : null}
      {showMethod && method ? (
        <span className="text-[11px] normal-case text-sky-600 dark:text-sky-200">{method}</span>
      ) : null}
    </span>
  );
};

export default McpIndicator;
