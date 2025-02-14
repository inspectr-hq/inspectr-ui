// src/components/RequestListItem.jsx
import React from 'react';
import { getStatusClass } from '../utils/getStatusClass.js';

const selectedClass = ['bg-blue-100', 'border-l-4', 'border-blue-700'].join(' ');

const RequestListItem = ({ request, reqId, onSelect, onRemove, selected }) => {
  const handleSelect = (request) => {
    onSelect(request);
  };

  return (
    <li
      className={`flex items-center cursor-pointer hover:bg-gray-200 ${selected ? selectedClass : ''}`}
      onClick={() => {
        handleSelect(request);
      }}
    >
      <div className="flex items-center p-2 w-full">
        <div className="w-16 flex justify-center">
          <span
            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
              request.response.statusCode
            )}`}
          >
            {request.response.statusCode || 'N/A'}
          </span>
        </div>
        <div className="w-20 text-center font-medium">{request.method || 'GET'}</div>
        <div className="flex-grow truncate text-left">{request.path || request.url}</div>
        <div className="w-20 text-gray-500 text-center">{request.latency}ms</div>
        <button
          className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(reqId);
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
};

export default RequestListItem;
