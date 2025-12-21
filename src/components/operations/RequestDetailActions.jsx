import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

const ButtonBaseClasses =
  'flex items-center space-x-2 border border-slate-600 dark:border-blue-500 text-slate-700 dark:text-white bg-slate-100 dark:bg-blue-600 rounded focus:outline-none cursor-pointer transition-transform duration-150 ease-in-out active:scale-95 hover:bg-slate-200 dark:hover:bg-blue-700 active:ring active:ring-slate-300 dark:active:ring-blue-400';
const ButtonClasses = `${ButtonBaseClasses} px-2 py-1`;
const SplitLeftClasses = `${ButtonBaseClasses} px-2 py-1 rounded-r-none border-r-0`;
const SplitRightClasses = `${ButtonBaseClasses} px-1 py-1 rounded-l-none`;
const TraceButtonClasses =
  'flex items-center space-x-2 px-2 py-1 border border-purple-500 text-purple-600 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 rounded focus:outline-none cursor-pointer transition-transform duration-150 ease-in-out active:scale-95 hover:bg-purple-100 dark:hover:bg-purple-800/50 active:ring active:ring-purple-200 dark:active:ring-purple-400';

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3"
    />
  </svg>
);

const ReplayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
    />
  </svg>
);

const RefreshIcon = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`h-4 w-4 ${className}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const TraceIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M10 6h8" />
    <path d="M12 16h6" />
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M8 11h7" />
  </svg>
);

const CurlIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  </svg>
);

const OperationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 17.25v-1.5a3 3 0 0 0-3-3h-4.5a3 3 0 0 0-3 3v1.5M18.75 21v-1.5a3 3 0 0 0-3-3h-.75M4.5 21v-1.5a3 3 0 0 1 3-3h.75M15.75 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 9.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4 text-slate-600 dark:text-white"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.293l3.71-4.06a.75.75 0 1 1 1.1 1.02l-4.25 4.65a.75.75 0 0 1-1.1 0l-4.25-4.65a.75.75 0 0 1 .02-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

export default function RequestDetailActions({
  hasTrace = false,
  onViewTrace,
  onDownload,
  onCopyCurl,
  onCopyOperation,
  copyActionKey = 'curl',
  onCopyActionChange,
  copiedCurl = false,
  copiedOperation = false,
  onReplay,
  replayed = false,
  onRefresh,
  isRefreshing = false
}) {
  const isCurl = copyActionKey === 'curl';
  const isCopied = isCurl ? copiedCurl : copiedOperation;
  const label = isCurl ? 'Copy as cURL' : 'Copy operation';
  const copiedLabel = isCurl ? 'Copied cURL' : 'Copied operation';
  const icon = isCurl ? <CurlIcon /> : <OperationIcon />;
  const handleAction = isCurl ? onCopyCurl : onCopyOperation;
  const showRefresh = typeof onRefresh === 'function';

  return (
    <div className="flex space-x-2">
      {hasTrace ? (
        <button type="button" onClick={onViewTrace} className={TraceButtonClasses}>
          <TraceIcon className="h-4 w-4" />
          <span className="text-xs hidden [@container(min-width:520px)]:inline">View trace</span>
        </button>
      ) : null}
      <button onClick={onDownload} className={ButtonClasses} aria-label="Export as JSON">
        <DownloadIcon />
      </button>
      <div className="relative flex">
        <button onClick={handleAction} className={SplitLeftClasses}>
          {isCopied ? <CheckIcon /> : icon}
          <span className="text-xs hidden [@container(min-width:520px)]:inline">
            {isCopied ? copiedLabel : label}
          </span>
        </button>
        <Menu>
          <MenuButton className={SplitRightClasses} aria-label="Select copy action">
            <ChevronDownIcon />
          </MenuButton>
          <MenuItems className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-lg focus:outline-none dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content">
            <MenuItem>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 data-[focus]:bg-slate-100 dark:data-[focus]:bg-dark-tremor-background-subtle"
                onClick={() => onCopyActionChange?.('curl')}
              >
                <CurlIcon />
                Copy as cURL
              </button>
            </MenuItem>
            <MenuItem>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 data-[focus]:bg-slate-100 dark:data-[focus]:bg-dark-tremor-background-subtle"
                onClick={() => onCopyActionChange?.('operation')}
              >
                <OperationIcon />
                Copy operation
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
      <button onClick={onReplay} className={ButtonClasses}>
        {replayed ? <CheckIcon /> : <ReplayIcon />}
        <span className="text-xs hidden [@container(min-width:520px)]:inline">
          {replayed ? 'Replayed' : 'Replay'}
        </span>
      </button>
      {showRefresh ? (
        <button onClick={onRefresh} className={ButtonClasses} aria-label="Refresh operation">
          <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      ) : null}
    </div>
  );
}
