// src/components/RequestDetail.jsx
import React, { useState } from 'react';
import { getStatusClass } from '../utils/getStatusClass.js';
import ToastNotification from './ToastNotification';
import { getMethodTextClass } from '../utils/getMethodClass.js';
import { formatTimestamp, formatDuration, formatSize } from '../utils/formatters.js';
import { Popover } from '@headlessui/react';
import CopyButton from './CopyButton.jsx';

const RequestDetail = ({ operation }) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showCurlErrorToast, setShowCurlErrorToast] = useState(false);
  const [showUrlToast, setShowUrlToast] = useState(false);
  const [showReplayToast, setShowReplayToast] = useState(false);
  const [replayed, setReplayed] = useState(false);

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

  // POST the request event to /api/replay endpoint
  const handleReplay = () => {
    const { meta, timing, response, ...opRequest } = operation;
    fetch('/api/replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opRequest)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Replay failed');
        }
        return response.json();
      })
      .then(() => {
        setReplayed(true);
        setTimeout(() => setReplayed(false), 2500);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to replay request:', err);
        setShowReplayToast(true);
      });
  };

  const buttonClasses =
    'flex items-center space-x-2 px-2 py-1 border border-slate-600 dark:border-blue-500 text-slate-700 dark:text-white bg-slate-100 dark:bg-blue-600 rounded focus:outline-none cursor-pointer transition-transform duration-150 ease-in-out active:scale-95 hover:bg-slate-200 dark:hover:bg-blue-700 active:ring active:ring-slate-300 dark:active:ring-blue-400';

  // check icon SVG.
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

  return (
    <div className="mb-4 p-4 bg-white dark:bg-dark-tremor-background border border-gray-300 dark:border-dark-tremor-border rounded shadow dark:shadow-dark-tremor-shadow relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-2xl text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Request Details
        </h2>
        <div className="flex space-x-2">
          {/* Copy as cURL Button */}
          <button onClick={handleCopyCurl} className={buttonClasses}>
            {copiedCurl ? (
              <CheckIcon />
            ) : (
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
            )}
            <span className="text-xs">{copiedCurl ? 'Copied cURL' : 'Copy as cURL'}</span>
          </button>
          {/* Replay Button */}
          <button onClick={handleReplay} className={buttonClasses}>
            {replayed ? (
              <CheckIcon />
            ) : (
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            )}
            <span className="text-xs">{replayed ? 'Replayed' : 'Replay'}</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 font-mono text-lg">
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
        </div>
      </div>

      {/* Toast Notifications */}
      {showCurlErrorToast && (
        <ToastNotification
          message="Failed to copy cURL command!"
          subMessage="Please try again."
          onClose={() => setShowCurlErrorToast(false)}
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
        />
      )}
    </div>
  );
};

export default RequestDetail;
