// src/components/mcp/McpBadge.jsx

import React from 'react';
import fileIcon from '../../assets/icons/file.svg?raw';
import hammerIcon from '../../assets/icons/hammer.svg?raw';
import messageIcon from '../../assets/icons/message-square.svg?raw';
import serverIcon from '../../assets/icons/server.svg?raw';
import { getMcpMethodColor } from '../../utils/mcp.js';

const iconMap = {
  resource: fileIcon,
  tool: hammerIcon,
  prompt: messageIcon,
  system: serverIcon
};

const getMethodKind = (method = '') => {
  const value = method.toLowerCase();
  if (value.includes('resource')) return 'resource';
  if (value.includes('tool')) return 'tool';
  if (value.includes('prompt')) return 'prompt';
  if (value.includes('system')) return 'system';
  return null;
};

const colorClassMap = {
  slate: {
    root: 'bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:bg-slate-500/5 dark:text-slate-200 dark:ring-slate-500/60'
  },
  gray: {
    root: 'bg-gray-500/10 text-gray-700 ring-gray-500/20 dark:bg-gray-500/5 dark:text-gray-200 dark:ring-gray-500/60'
  },
  zinc: {
    root: 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-500/5 dark:text-zinc-200 dark:ring-zinc-500/60'
  },
  neutral: {
    root: 'bg-neutral-500/10 text-neutral-700 ring-neutral-500/20 dark:bg-neutral-500/5 dark:text-neutral-200 dark:ring-neutral-500/60'
  },
  stone: {
    root: 'bg-stone-500/10 text-stone-700 ring-stone-500/20 dark:bg-stone-500/5 dark:text-stone-200 dark:ring-stone-500/60'
  },
  red: {
    root: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:bg-red-500/5 dark:text-red-200 dark:ring-red-500/60'
  },
  orange: {
    root: 'bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:bg-orange-500/5 dark:text-orange-200 dark:ring-orange-500/60'
  },
  amber: {
    root: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200 dark:ring-amber-500/60'
  },
  yellow: {
    root: 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/20 dark:bg-yellow-500/5 dark:text-yellow-200 dark:ring-yellow-500/60'
  },
  lime: {
    root: 'bg-lime-500/10 text-lime-700 ring-lime-500/20 dark:bg-lime-500/5 dark:text-lime-200 dark:ring-lime-500/60'
  },
  green: {
    root: 'bg-green-500/10 text-green-700 ring-green-500/20 dark:bg-green-500/5 dark:text-green-200 dark:ring-green-500/60'
  },
  emerald: {
    root: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-200 dark:ring-emerald-500/60'
  },
  teal: {
    root: 'bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:bg-teal-500/5 dark:text-teal-200 dark:ring-teal-500/60'
  },
  cyan: {
    root: 'bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-500/5 dark:text-cyan-200 dark:ring-cyan-500/60'
  },
  sky: {
    root: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:bg-sky-500/5 dark:text-sky-200 dark:ring-sky-500/60'
  },
  blue: {
    root: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:bg-blue-500/5 dark:text-blue-200 dark:ring-blue-500/60'
  },
  indigo: {
    root: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-200 dark:ring-indigo-500/60'
  },
  violet: {
    root: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:bg-violet-500/5 dark:text-violet-200 dark:ring-violet-500/60'
  },
  purple: {
    root: 'bg-purple-500/10 text-purple-700 ring-purple-500/20 dark:bg-purple-500/5 dark:text-purple-200 dark:ring-purple-500/60'
  },
  fuchsia: {
    root: 'bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/20 dark:bg-fuchsia-500/5 dark:text-fuchsia-200 dark:ring-fuchsia-500/60'
  },
  pink: {
    root: 'bg-pink-500/10 text-pink-700 ring-pink-500/20 dark:bg-pink-500/5 dark:text-pink-200 dark:ring-pink-500/60'
  },
  rose: {
    root: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:bg-rose-500/5 dark:text-rose-200 dark:ring-rose-500/60'
  }
};

const sizeClassMap = {
  xs: 'h-[22px] px-2 py-0.5 text-xs',
  sm: 'h-6 px-2.5 py-0.5 text-sm'
};

const normalizeColor = (value) => {
  if (!value) return 'blue';
  const normalized = String(value).toLowerCase();
  return colorClassMap[normalized] ? normalized : 'blue';
};

const McpBadge = ({ method, children, color, size = 'xs', showIcon = true }) => {
  const derivedColor = color || getMcpMethodColor(method);
  const kind = getMethodKind(method);
  const rawIcon = showIcon ? iconMap[kind] : null;
  const icon = rawIcon ? rawIcon.replace('<svg', '<svg class="h-full w-full block"') : null;

  const normalizedColor = normalizeColor(derivedColor);
  const colorClasses = colorClassMap[normalizedColor].root;
  const sizeClasses = sizeClassMap[size] || sizeClassMap.xs;

  return (
    <span
      className={`w-max shrink-0 inline-flex items-center justify-center cursor-default rounded-tremor-small ring-1 ring-inset ${sizeClasses} ${colorClasses}`}
    >
      <span className="inline-flex items-center gap-1 leading-none">
        {icon ? (
          <span
            className="flex h-3.5 w-3.5 items-center justify-center leading-none"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: icon }}
          />
        ) : null}
        <span className="leading-none">{children}</span>
      </span>
    </span>
  );
};

export default McpBadge;
