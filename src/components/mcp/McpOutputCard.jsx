// src/components/mcp/McpOutputCard.jsx

import React, { useState } from 'react';
import { Text } from '@tremor/react';
import CollapsibleSection from './CollapsibleSection.jsx';

const McpOutputCard = ({ title = 'Output', children }) => {
  const [open, setOpen] = useState(true);

  return (
    <CollapsibleSection
      title={title}
      defaultOpen
      onToggle={setOpen}
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

export default McpOutputCard;
