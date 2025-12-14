// src/components/mcp/McpTokensCard.jsx

import React, { useMemo, useState } from 'react';
import CollapsibleSection from './CollapsibleSection.jsx';

const TokenChip = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-strong">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
      {label}
    </span>
    <span className="font-mono text-sm">{value ?? '—'}</span>
  </div>
);

const McpTokensCard = ({ tokens, title = 'MCP Tokens', defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const items = useMemo(
    () =>
      [
        { label: 'Request', value: tokens?.request },
        { label: 'Response', value: tokens?.response },
        { label: 'Total', value: tokens?.total }
      ].filter((item) => item.value !== undefined),
    [tokens]
  );

  if (!tokens) return null;

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={defaultOpen}
      onToggle={setOpen}
      className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle"
      withBorderTop={false}
    >
      {open ? (
        <div className="grid grid-cols-2 gap-3 p-2 sm:grid-cols-3">
          {items.length > 0 ? (
            items.map((item) => (
              <TokenChip key={item.label} label={item.label} value={item.value} />
            ))
          ) : (
            <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
              No token counts
            </div>
          )}
        </div>
      ) : null}
    </CollapsibleSection>
  );
};

export default McpTokensCard;
