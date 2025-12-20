// src/components/operations/RequestDetail.jsx
import React, { useEffect, useState } from 'react';
import { getStatusClass } from '../../utils/getStatusClass.js';
import ToastNotification from '../ToastNotification';
import { getMethodTextClass } from '../../utils/getMethodClass.js';
import { formatTimestamp, formatDuration, formatSize } from '../../utils/formatters.js';
import { Menu, MenuButton, MenuItem, MenuItems, Popover } from '@headlessui/react';
import CopyButton from '../CopyButton.jsx';
import { useInspectr } from '../../context/InspectrContext';
import { Tooltip } from '../ToolTip.jsx';
import AuthIndicator from './AuthIndicator.jsx';
import McpIndicator from './McpIndicator.jsx';
import { normalizeTags, normalizeTag } from '../../utils/normalizeTags.js';
import useLocalStorage from '../../hooks/useLocalStorage.jsx';
import DialogDeleteConfirm from '../DialogDeleteConfirm.jsx';
import TagPill from '../TagPill.jsx';

const RequestDetail = ({ operation, setCurrentTab, onRefresh, isRefreshing = false }) => {
  // Get the client from context
  const { client, setToast } = useInspectr();

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedOperation, setCopiedOperation] = useState(false);
  const [showCurlErrorToast, setShowCurlErrorToast] = useState(false);
  const [showUrlToast, setShowUrlToast] = useState(false);
  const [showReplayToast, setShowReplayToast] = useState(false);
  const [replayed, setReplayed] = useState(false);
  const [copyActionValue, setCopyActionValue] = useLocalStorage('copyActionPreference', 'curl');
  const copyActionKey = copyActionValue === 'operation' ? 'operation' : 'curl';

  // Local tag state for UI updates after delete
  const [localTagsRaw, setLocalTagsRaw] = useState(() => operation?.meta?.tags || []);
  useEffect(() => {
    setLocalTagsRaw(operation?.meta?.tags || []);
  }, [operation?.id]);

  // Delete tag dialog state
  const [pendingTag, setPendingTag] = useState(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const [deleteTagError, setDeleteTagError] = useState('');

  // Calculate request size details
  const calculateRequestSize = () => {
    if (!operation?.request) return { headers: 0, body: 0, total: 0 };

    const headersSize = operation.request.headers_size || 0;
    const bodySize = operation.request.body_size || 0;

    return {
      headers: headersSize,
      body: bodySize,
      total: headersSize + bodySize
    };
  };

  // Calculate response size details
  const calculateResponseSize = () => {
    if (!operation?.response) return { headers: 0, body: 0, total: 0 };

    const headersSize = operation.response.headers_size || 0;
    const bodySize = operation.response.body_size || 0;

    return {
      headers: headersSize,
      body: bodySize,
      total: headersSize + bodySize
    };
  };

  const requestSize = calculateRequestSize();
  const responseSize = calculateResponseSize();

  const tags = normalizeTags(localTagsRaw);
  const hasTags = tags.length > 0;

  // Generate a cURL command string from the request data
  const generateCurlCommand = () => {
    if (!operation?.request) return;
    const { request } = operation;
    const { method, url, headers, body } = request;
    let curlCommand = `curl -X ${method} '${url}'`;

    // Add headers
    if (headers) {
      headers.forEach((header) => {
        curlCommand += ` -H '${header.name}: ${header.value}'`;
      });
    }

    // Add payload if it exists
    if (body) {
      curlCommand += ` --data '${body}'`;
    }
    return curlCommand;
  };

  // Copy the generated cURL command to the clipboard
  const handleCopyCurl = () => {
    const curlCommand = generateCurlCommand();
    navigator.clipboard
      .writeText(curlCommand)
      .then(() => {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2500);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to copy cURL command:', err);
        setShowCurlErrorToast(true);
      });
  };

  const handleCopyOperation = () => {
    try {
      const data = operation ? { ...operation } : {};
      const json = JSON.stringify(data, null, 2);
      navigator.clipboard
        .writeText(json)
        .then(() => {
          setCopiedOperation(true);
          setTimeout(() => setCopiedOperation(false), 2500);
        })
        .catch((err) => {
          console.error('[Inspectr] Failed to copy operation JSON:', err);
          setToast?.({
            type: 'error',
            message: 'Failed to copy operation',
            subMessage: err?.message || 'Unable to copy the operation details.'
          });
        });
    } catch (err) {
      console.error('[Inspectr] Failed to copy operation JSON:', err);
      setToast?.({
        type: 'error',
        message: 'Failed to copy operation',
        subMessage: err?.message || 'Unable to copy the operation details.'
      });
    }
  };

  // Copy the URL to the clipboard
  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(operation.request.url)
      .then(() => {
        setShowUrlToast(true);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to copy URL:', err);
      });
  };

  // Replay the request using the SDK
  const handleReplay = () => {
    client.operations
      .replay(operation)
      .then(() => {
        setReplayed(true);
        setTimeout(() => setReplayed(false), 2500);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to replay request:', err);
        setShowReplayToast(true);
      });
  };

  // Download the operation as a JSON file
  const handleDownloadOperation = () => {
    try {
      const data = operation ? { ...operation } : {};
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const idPart = operation?.id ? String(operation.id) : String(Date.now());
      const filename = `operation_${idPart}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Inspectr] Failed to download operation JSON:', err);
    }
  };

  // Tag delete handlers
  const handleRequestDeleteTag = (tag) => {
    setPendingTag(tag);
    setDeleteTagError('');
  };

  const handleCancelDeleteTag = () => {
    setPendingTag(null);
    setDeleteTagError('');
  };

  const handleConfirmDeleteTag = async () => {
    if (!pendingTag) return;
    const opId = operation?.id;
    if (!client?.operations || !opId) {
      setDeleteTagError('Operation or client not available');
      return;
    }
    try {
      setIsDeletingTag(true);
      setDeleteTagError('');
      await client.operations.deleteOperationTags(opId, { tag: pendingTag.raw });
      // Remove matching tags locally (case-insensitive, match token)
      const removeToken = pendingTag.token || normalizeTag(pendingTag.raw)?.token;
      setLocalTagsRaw((prev) =>
        Array.isArray(prev)
          ? prev.filter((t) => {
              const nt = normalizeTag(t);
              return !nt || nt.token !== removeToken;
            })
          : []
      );
      setToast?.({
        type: 'success',
        message: `Tag "${pendingTag.display}" removed from this operation`
      });
      setPendingTag(null);
    } catch (err) {
      console.error('Delete operation tag failed', err);
      setDeleteTagError(err?.message || 'Failed to delete tag');
      setToast?.({ type: 'error', message: err?.message || 'Failed to delete tag' });
    } finally {
      setIsDeletingTag(false);
    }
  };

  const buttonBaseClasses =
    'flex items-center space-x-2 border border-slate-600 dark:border-blue-500 text-slate-700 dark:text-white bg-slate-100 dark:bg-blue-600 rounded focus:outline-none cursor-pointer transition-transform duration-150 ease-in-out active:scale-95 hover:bg-slate-200 dark:hover:bg-blue-700 active:ring active:ring-slate-300 dark:active:ring-blue-400';
  const buttonClasses = `${buttonBaseClasses} px-2 py-1`;
  const splitLeftClasses = `${buttonBaseClasses} px-2 py-1 rounded-r-none border-r-0`;
  const splitRightClasses = `${buttonBaseClasses} px-0 py-1 rounded-l-none`;
  const traceInfo = operation?.meta?.trace || null;
  const traceId = traceInfo?.trace_id || null;
  const traceSource = traceInfo?.source || null;
  const rawMcpMeta = operation?.meta?.mcp;
  const mcpMeta =
    rawMcpMeta &&
    typeof rawMcpMeta === 'object' &&
    Object.keys(rawMcpMeta).some((key) => rawMcpMeta[key] !== undefined)
      ? rawMcpMeta
      : null;
  const hasTrace = Boolean(traceId);
  const traceButtonClasses =
    'flex items-center space-x-2 px-2 py-1 border border-purple-500 text-purple-600 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 rounded focus:outline-none cursor-pointer transition-transform duration-150 ease-in-out active:scale-95 hover:bg-purple-100 dark:hover:bg-purple-800/50 active:ring active:ring-purple-200 dark:active:ring-purple-400';

  // Check icon SVG.
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

  // CLI/Curl icon
  const CliIcon = () => (
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

  // Copy Icon
  const CopyIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path
        d="M12.7587 2H16.2413C17.0463 1.99999 17.7106 1.99998 18.2518 2.04419C18.8139 2.09012 19.3306 2.18868 19.816 2.43597C20.5686 2.81947 21.1805 3.43139 21.564 4.18404C21.8113 4.66937 21.9099 5.18608 21.9558 5.74817C22 6.28936 22 6.95372 22 7.75868V11.2413C22 12.0463 22 12.7106 21.9558 13.2518C21.9099 13.8139 21.8113 14.3306 21.564 14.816C21.1805 15.5686 20.5686 16.1805 19.816 16.564C19.3306 16.8113 18.8139 16.9099 18.2518 16.9558C17.8906 16.9853 17.4745 16.9951 16.9984 16.9984C16.9951 17.4745 16.9853 17.8906 16.9558 18.2518C16.9099 18.8139 16.8113 19.3306 16.564 19.816C16.1805 20.5686 15.5686 21.1805 14.816 21.564C14.3306 21.8113 13.8139 21.9099 13.2518 21.9558C12.7106 22 12.0463 22 11.2413 22H7.75868C6.95372 22 6.28936 22 5.74818 21.9558C5.18608 21.9099 4.66937 21.8113 4.18404 21.564C3.43139 21.1805 2.81947 20.5686 2.43597 19.816C2.18868 19.3306 2.09012 18.8139 2.04419 18.2518C1.99998 17.7106 1.99999 17.0463 2 16.2413V12.7587C1.99999 11.9537 1.99998 11.2894 2.04419 10.7482C2.09012 10.1861 2.18868 9.66937 2.43597 9.18404C2.81947 8.43139 3.43139 7.81947 4.18404 7.43598C4.66937 7.18868 5.18608 7.09012 5.74817 7.04419C6.10939 7.01468 6.52548 7.00487 7.00162 7.00162C7.00487 6.52548 7.01468 6.10939 7.04419 5.74817C7.09012 5.18608 7.18868 4.66937 7.43598 4.18404C7.81947 3.43139 8.43139 2.81947 9.18404 2.43597C9.66937 2.18868 10.1861 2.09012 10.7482 2.04419C11.2894 1.99998 11.9537 1.99999 12.7587 2ZM9.00176 7L11.2413 7C12.0463 6.99999 12.7106 6.99998 13.2518 7.04419C13.8139 7.09012 14.3306 7.18868 14.816 7.43598C15.5686 7.81947 16.1805 8.43139 16.564 9.18404C16.8113 9.66937 16.9099 10.1861 16.9558 10.7482C17 11.2894 17 11.9537 17 12.7587V14.9982C17.4455 14.9951 17.7954 14.9864 18.089 14.9624C18.5274 14.9266 18.7516 14.8617 18.908 14.782C19.2843 14.5903 19.5903 14.2843 19.782 13.908C19.8617 13.7516 19.9266 13.5274 19.9624 13.089C19.9992 12.6389 20 12.0566 20 11.2V7.8C20 6.94342 19.9992 6.36113 19.9624 5.91104C19.9266 5.47262 19.8617 5.24842 19.782 5.09202C19.5903 4.7157 19.2843 4.40973 18.908 4.21799C18.7516 4.1383 18.5274 4.07337 18.089 4.03755C17.6389 4.00078 17.0566 4 16.2 4H12.8C11.9434 4 11.3611 4.00078 10.911 4.03755C10.4726 4.07337 10.2484 4.1383 10.092 4.21799C9.7157 4.40973 9.40973 4.7157 9.21799 5.09202C9.1383 5.24842 9.07337 5.47262 9.03755 5.91104C9.01357 6.20463 9.00489 6.55447 9.00176 7ZM5.91104 9.03755C5.47262 9.07337 5.24842 9.1383 5.09202 9.21799C4.7157 9.40973 4.40973 9.7157 4.21799 10.092C4.1383 10.2484 4.07337 10.4726 4.03755 10.911C4.00078 11.3611 4 11.9434 4 12.8V16.2C4 17.0566 4.00078 17.6389 4.03755 18.089C4.07337 18.5274 4.1383 18.7516 4.21799 18.908C4.40973 19.2843 4.7157 19.5903 5.09202 19.782C5.24842 19.8617 5.47262 19.9266 5.91104 19.9624C6.36113 19.9992 6.94342 20 7.8 20H11.2C12.0566 20 12.6389 19.9992 13.089 19.9624C13.5274 19.9266 13.7516 19.8617 13.908 19.782C14.2843 19.5903 14.5903 19.2843 14.782 18.908C14.8617 18.7516 14.9266 18.5274 14.9624 18.089C14.9992 17.6389 15 17.0566 15 16.2V12.8C15 11.9434 14.9992 11.3611 14.9624 10.911C14.9266 10.4726 14.8617 10.2484 14.782 10.092C14.5903 9.7157 14.2843 9.40973 13.908 9.21799C13.7516 9.1383 13.5274 9.07337 13.089 9.03755C12.6389 9.00078 12.0566 9 11.2 9H7.8C6.94342 9 6.36113 9.00078 5.91104 9.03755Z"
        fill="currentColor"
      ></path>
    </svg>
  );

  // Dropdown menu icon
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

  // Replay icon SVG.
  const ReplayIcon = () => (
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
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
      />
    </svg>
  );

  // Refresh icon SVG.
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
      className={`lucide lucide-chart-gantt-icon lucide-chart-gantt ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path d="M10 6h8" />
      <path d="M12 16h6" />
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M8 11h7" />
    </svg>
  );

  // Info icon SVG.
  const InfoIcon = () => (
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
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      />
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

  const handleAuthIndicatorClick = () => {
    const guard = operation?.meta?.inspectr?.guard || {};
    const guardKey = guard['inspectr-auth-key'];
    const guardToken = guard['inspectr-auth-token'];
    if (guardKey || guardToken) {
      if (typeof setCurrentTab === 'function') setCurrentTab('meta');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('inspectr:openMetaGuard', {
            detail: { name: guardToken ? 'inspectr-auth-token' : 'inspectr-auth-key' }
          })
        );
      }, 150);
      return;
    }
    if (typeof setCurrentTab === 'function') {
      setCurrentTab('request');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('inspectr:openRequestHeaders'));
      }, 50);
    } else {
      window.dispatchEvent(new CustomEvent('inspectr:openRequestHeaders'));
    }
  };

  const handleViewTrace = () => {
    if (!traceId) return;
    const traceOperationId = operation?.operation_id || operation?.id || null;
    const hashValue = `#traces/${traceId}${traceOperationId ? `/${traceOperationId}` : ''}`;
    if (window.location.hash === hashValue) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = hashValue;
    }
  };

  const handleOpenMcp = () => {
    if (typeof setCurrentTab === 'function') {
      setCurrentTab('mcp');
    }
  };

  return (
    <div className="mb-4 p-4 bg-white dark:bg-dark-tremor-background border border-gray-300 dark:border-dark-tremor-border rounded shadow dark:shadow-dark-tremor-shadow relative [container-type:inline-size] [container-name:requestdetail] ">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Request Details
          </h2>
          <AuthIndicator operation={operation} onClick={handleAuthIndicatorClick} />
          <McpIndicator mcp={mcpMeta} showCategory={true} onClick={handleOpenMcp} />
        </div>
        <div className="flex space-x-2">
          {hasTrace ? (
            <button type="button" onClick={handleViewTrace} className={traceButtonClasses}>
              <TraceIcon className="h-4 w-4" />
              <span className="text-xs hidden [@container(min-width:520px)]:inline">
                View trace
              </span>
            </button>
          ) : null}
          {/* Export JSON Button */}
          <button
            onClick={handleDownloadOperation}
            className={buttonClasses}
            aria-label="Export as JSON"
          >
            <DownloadIcon />
            {/*<span className="text-xs">Export JSON</span>*/}
          </button>
          {/* Copy Action Button + Dropdown */}
          <div className="relative flex">
            {(() => {
              const isCurl = copyActionKey === 'curl';
              const isCopied = isCurl ? copiedCurl : copiedOperation;
              const label = isCurl ? 'Copy as cURL' : 'Copy operation';
              const copiedLabel = isCurl ? 'Copied cURL' : 'Copied operation';
              const icon = isCurl ? <CliIcon /> : <CopyIcon />;
              const handleAction = isCurl ? handleCopyCurl : handleCopyOperation;
              return (
                <>
                  <button onClick={handleAction} className={splitLeftClasses}>
                    {isCopied ? <CheckIcon /> : icon}
                    <span className="text-xs hidden [@container(min-width:520px)]:inline">
                      {isCopied ? copiedLabel : label}
                    </span>
                  </button>
                  <Menu>
                    <MenuButton className={splitRightClasses} aria-label="Select copy action">
                      <ChevronDownIcon />
                    </MenuButton>
                    <MenuItems className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-lg focus:outline-none dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content">
                      <MenuItem>
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 data-[focus]:bg-slate-100 dark:data-[focus]:bg-dark-tremor-background-subtle"
                          onClick={() => setCopyActionValue('curl')}
                        >
                          <CliIcon />
                          Copy as cURL
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 data-[focus]:bg-slate-100 dark:data-[focus]:bg-dark-tremor-background-subtle"
                          onClick={() => setCopyActionValue('operation')}
                        >
                          <CopyIcon />
                          Copy operation
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </>
              );
            })()}
          </div>
          {/* Replay Button */}
          <button onClick={handleReplay} className={buttonClasses}>
            {replayed ? <CheckIcon /> : <ReplayIcon />}
            <span className="text-xs hidden [@container(min-width:520px)]:inline">
              {replayed ? 'Replayed' : 'Replay'}
            </span>
          </button>
          {/* Refresh Button */}
          {/*<button onClick={onRefresh} className={buttonClasses} aria-label="Refresh operation">*/}
          {/*  <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />*/}
          {/*  /!*<span className="text-xs">Refresh</span>*!/*/}
          {/*</button>*/}
        </div>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 font-mono text-base">
          <span className={`font-bold ${getMethodTextClass(operation?.request?.method)}`}>
            {operation?.request?.method}
          </span>
          <span className="text-blue-600 dark:text-blue-400">{operation?.request?.path}</span>
          <span
            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
              operation?.response?.status
            )}`}
          >
            {operation?.response?.status}
          </span>
          <span className="text-sm dark:text-dark-tremor-content">
            {operation?.response?.status_text}
          </span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-dark-tremor-content">
          <span onClick={handleCopyUrl} className="cursor-pointer">
            {operation?.request?.url}
          </span>
          <CopyButton textToCopy={operation.request.url} showLabel={false} />
        </div>
        <div className="text-gray-500 dark:text-dark-tremor-content text-xs">
          Received on{' '}
          <span className="font-semibold">{formatTimestamp(operation?.request?.timestamp)}</span> •
          Took <span className="font-semibold">{formatDuration(operation?.timing?.duration)}</span>{' '}
          to respond •
          <Popover className="relative inline-block">
            <span className="flex items-center pl-1">
              size
              <span className="font-semibold pl-1">{formatSize(responseSize.total)}</span>
              <Popover.Button className="cursor-pointer pl-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="12"
                  height="12"
                >
                  <path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM8 7H16V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"></path>
                </svg>
              </Popover.Button>
            </span>
            <Popover.Panel className="absolute z-10 mt-2 w-72 -translate-x-1/2 transform px-4 sm:px-0">
              <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white dark:bg-dark-tremor-background p-3">
                <div className="text-sm font-semibold mb-2">Request Size</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total:</div>
                  <div className="font-mono text-right">{formatSize(requestSize.total)}</div>
                  <div>Headers:</div>
                  <div className="font-mono text-right">{formatSize(requestSize.headers)}</div>
                  <div>Body:</div>
                  <div className="font-mono text-right">{formatSize(requestSize.body)}</div>
                </div>
                <div className="text-sm font-semibold mt-3 mb-2">Response Size</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total:</div>
                  <div className="font-mono text-right">{formatSize(responseSize.total)}</div>
                  <div>Headers:</div>
                  <div className="font-mono text-right">{formatSize(responseSize.headers)}</div>
                  <div>Body:</div>
                  <div className="font-mono text-right">{formatSize(responseSize.body)}</div>
                </div>
              </div>
            </Popover.Panel>
          </Popover>
          {operation?.meta?.proxy?.url && (
            <>
              <span> • Proxy </span>
              <div className="relative inline-block align-middle">
                <Tooltip side="right" content={operation.meta.proxy.url}>
                  <InfoIcon className="relative inline-block" />
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </div>

      {hasTags && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
            Tags
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagPill
                key={tag.token || tag.display}
                tag={tag}
                showRemove
                onRemove={() => handleRequestDeleteTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirm delete single tag dialog */}
      <DialogDeleteConfirm
        open={Boolean(pendingTag)}
        isDeleting={isDeletingTag}
        error={deleteTagError}
        onCancel={handleCancelDeleteTag}
        onConfirm={handleConfirmDeleteTag}
        title="Remove tag from this operation?"
        description={
          pendingTag ? (
            <>
              This will remove the tag <span className="font-semibold">{pendingTag.display}</span>{' '}
              from this operation. This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Remove Tag"
      />

      {/* Toast Notifications */}
      {showCurlErrorToast && (
        <ToastNotification
          message="Failed to copy cURL command!"
          subMessage="Please try again."
          onClose={() => setShowCurlErrorToast(false)}
          type={'error'}
        />
      )}
      {showUrlToast && (
        <ToastNotification
          message="URL copied!"
          subMessage="The request URL has been copied to your clipboard."
          onClose={() => setShowUrlToast(false)}
        />
      )}
      {showReplayToast && (
        <ToastNotification
          message="Replay failed!"
          subMessage="Failed to replay the request. Please try again."
          onClose={() => setShowReplayToast(false)}
          type={'error'}
        />
      )}
    </div>
  );
};

export default RequestDetail;
