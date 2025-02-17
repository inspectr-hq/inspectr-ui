// src/components/RequestDetail.jsx
import React, { useState } from 'react';
import { getStatusClass } from '../utils/getStatusClass.js';
import ToastNotification from './ToastNotification';

const RequestDetail = ({ request }) => {
  const [showToast, setShowToast] = useState(false);
  const [showUrlToast, setShowUrlToast] = useState(false);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A'; // Handle missing timestamp
    const date = new Date(isoString);
    const formattedDate = date.toLocaleDateString('en-CA', {
      // YYYY-MM-DD format
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = date.toLocaleTimeString([], {
      // HH:MM:SS in local time
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24-hour format
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  // Generate a cURL command string from the request data
  const generateCurlCommand = () => {
    const { method, url, request: req } = request;
    let curlCommand = `curl -X ${method} '${url}'`;

    // Add headers
    if (req.headers) {
      Object.entries(req.headers).forEach(([key, value]) => {
        curlCommand += ` -H '${key}: ${value}'`;
      });
    }

    // Add payload if it exists
    if (req.payload) {
      curlCommand += ` --data '${req.payload}'`;
    }
    return curlCommand;
  };

  // Copy the generated cURL command to the clipboard
  const handleCopyCurl = () => {
    const curlCommand = generateCurlCommand();
    navigator.clipboard
      .writeText(curlCommand)
      .then(() => {
        setShowToast(true);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to copy cURL command:', err);
      });
  };

  // Copy the URL to the clipboard
  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(request.url)
      .then(() => {
        setShowUrlToast(true);
      })
      .catch((err) => {
        console.error('[Inspectr] Failed to copy URL:', err);
      });
  };

  return (
    <div className="mb-4 p-4 bg-white rounded shadow relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-2xl">Request Details</h2>
        <button
          onClick={handleCopyCurl}
          className="flex items-center space-x-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <span className="text-xs">Copy as cURL</span>
        </button>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 font-mono text-lg">
          <span className="font-bold">{request.method}</span>
          <span className="text-blue-600">{request.path}</span>
          <span
            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
              request?.response?.statusCode
            )}`}
          >
            {request?.response?.statusCode}
          </span>
          <span className="text-sm">{request.response.statusMessage}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span onClick={handleCopyUrl} className="cursor-pointer">
            {request.url}
          </span>
          <button onClick={handleCopyUrl} className="cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                d="M48.186 92.137c0-8.392 6.49-14.89 16.264-14.89s29.827-.225 29.827-.225-.306-6.99-.306-15.88c0-8.888 7.954-14.96 17.49-14.96 9.538 0 56.786.401 61.422.401 4.636 0 8.397 1.719 13.594 5.67 5.196 3.953 13.052 10.56 16.942 14.962 3.89 4.402 5.532 6.972 5.532 10.604 0 3.633 0 76.856-.06 85.34-.059 8.485-7.877 14.757-17.134 14.881-9.257.124-29.135.124-29.135.124s.466 6.275.466 15.15-8.106 15.811-17.317 16.056c-9.21.245-71.944-.49-80.884-.245-8.94.245-16.975-6.794-16.975-15.422s.274-93.175.274-101.566zm16.734 3.946l-1.152 92.853a3.96 3.96 0 0 0 3.958 4.012l73.913.22a3.865 3.865 0 0 0 3.91-3.978l-.218-8.892a1.988 1.988 0 0 0-2.046-1.953s-21.866.64-31.767.293c-9.902-.348-16.672-6.807-16.675-15.516-.003-8.709.003-69.142.003-69.142a1.989 1.989 0 0 0-2.007-1.993l-23.871.082a4.077 4.077 0 0 0-4.048 4.014zm106.508-35.258c-1.666-1.45-3.016-.84-3.016 1.372v17.255c0 1.106.894 2.007 1.997 2.013l20.868.101c2.204.011 2.641-1.156.976-2.606l-20.825-18.135zm-57.606.847a2.002 2.002 0 0 0-2.02 1.988l-.626 96.291a2.968 2.968 0 0 0 2.978 2.997l75.2-.186a2.054 2.054 0 0 0 2.044-2.012l1.268-62.421a1.951 1.951 0 0 0-1.96-2.004s-26.172.042-30.783.042c-4.611 0-7.535-2.222-7.535-6.482S152.3 63.92 152.3 63.92a2.033 2.033 0 0 0-2.015-2.018l-36.464-.23z"
                stroke="#979797"
                fillRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="text-gray-500 text-xs">
          Received on {formatTimestamp(request.request.timestamp)} • Took {request.latency}ms to
          respond
        </div>
      </div>
      {showToast && (
        <ToastNotification
          message="cURL command copied!"
          subMessage="You can now paste it into your terminal."
          onClose={() => setShowToast(false)}
        />
      )}
      {showUrlToast && (
        <ToastNotification
          message="URL copied!"
          subMessage="The request URL has been copied to your clipboard."
          onClose={() => setShowUrlToast(false)}
        />
      )}
    </div>
  );
};

export default RequestDetail;
