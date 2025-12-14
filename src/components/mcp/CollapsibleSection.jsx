// src/components/mcp/CollapsibleSection.jsx

import React, { useEffect, useState } from 'react';
import { Text } from '@tremor/react';
import CopyButton from '../CopyButton.jsx';

const ChevronIcon = ({ open, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`h-4 w-4 text-tremor-content transition-transform dark:text-dark-tremor-content ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.417a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  resetKey,
  contentClassName = '',
  headerRight,
  className = '',
  withBorderTop = true,
  onToggle,
  copyText
}) => {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [resetKey, defaultOpen]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  };

  return (
    <div
      className={`rounded-tremor-small border border-slate-200 dark:border-dark-tremor-border ${className}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
          {title}
        </Text>
        <span className="flex items-center gap-2">
          {copyText ? <CopyButton textToCopy={copyText} showLabel={true} /> : null}
          {headerRight}
          <ChevronIcon open={open} />
        </span>
      </div>
      {open ? (
        withBorderTop ? (
          <div className={`border-t border-tremor-border ${contentClassName}`}>{children}</div>
        ) : (
          children
        )
      ) : null}
    </div>
  );
};

export default CollapsibleSection;
