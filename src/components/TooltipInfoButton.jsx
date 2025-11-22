import { Tooltip } from './ToolTip.jsx';
import React from 'react';

// Info icon SVG.
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

const TooltipInfoButton = ({ label, tooltip }) => {
  if (!tooltip) return null;
  const ariaLabel = `${label} details`;
  return (
    <Tooltip content={tooltip} sideOffset={6} side="top">
      <button
        type="button"
        aria-label={ariaLabel}
        className="rounded-full p-1 text-gray-400 transition hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-tremor-brand dark:text-gray-500 dark:hover:text-gray-300"
      >
        <InfoIcon />
      </button>
    </Tooltip>
  );
};

export { TooltipInfoButton };
