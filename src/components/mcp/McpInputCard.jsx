// src/components/mcp/McpInputCard.jsx

import React, { useState } from 'react';
import { Text } from '@tremor/react';
import CollapsibleSection from './CollapsibleSection.jsx';

const McpInputCard = ({ title = 'Input', validation, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <CollapsibleSection
      title={title}
      defaultOpen
      onToggle={setOpen}
      headerRight={
        validation && (validation.missing?.length || validation.extra?.length) ? (
          <div className="text-[11px] text-amber-700 dark:text-amber-200">
            {validation.missing?.length ? (
              <span className="mr-2">Missing: {validation.missing.join(', ')}</span>
            ) : null}
            {validation.extra?.length ? <span>Extra: {validation.extra.join(', ')}</span> : null}
          </div>
        ) : null
      }
      className="rounded-tremor-small border border-tremor-border bg-white shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle"
      withBorderTop={false}
    >
      {open ? (
        <div className="space-y-2 px-3 pt-0 pb-3">
          {/*<Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">*/}
          {/*  {title}*/}
          {/*</Text>*/}
          {children}
        </div>
      ) : null}
    </CollapsibleSection>
  );
};

export default McpInputCard;
