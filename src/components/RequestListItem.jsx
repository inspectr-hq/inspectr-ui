// src/components/RequestListItem.jsx
import React from 'react';
import { getStatusClass } from '../utils/getStatusClass.js';
import { getMethodTextClass } from '../utils/getMethodClass.js';

const selectedClass = ['bg-blue-100', 'border-blue-700'].join(' ');
const baseBorderClass = 'border-l-4';

const RequestListItem = ({ operation, opId, onSelect, onRemove, selected }) => {
  const handleSelect = (operation) => {
    onSelect(operation);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <li
      className={`flex items-center cursor-pointer hover:bg-gray-200 ${baseBorderClass} ${selected ? selectedClass : 'border-transparent'}`}
      onClick={() => {
        handleSelect(operation);
      }}
    >
      <div className="flex items-center p-2 w-full">
        <div className="w-16 flex justify-center">
          <span
            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
              operation?.response?.status
            )}`}
          >
            {operation?.response?.status || 'N/A'}
          </span>
        </div>
        <div className={`w-20 text-center font-medium ${getMethodTextClass( operation?.request?.method )}`}>{operation?.request?.method || 'GET'}</div>
        <div className="flex-grow truncate text-left">{operation?.request.path || operation?.request.url}</div>
        <div className="w-20 text-gray-900 text-center text-xs">
          {operation?.request?.timestamp ? formatTime(operation.request.timestamp) : 'N/A'}
        </div>
        {/*<div className="flex flex-col text-left">*/}
        {/*  <div className="w-20 text-gray-500 text-xs font-bold">*/}
        {/*    {operation?.request?.timestamp ? formatDate(operation.request.timestamp) : 'N/A'}*/}
        {/*  </div>*/}
        {/*  <div className="w-20 text-gray-500 text-xs">*/}
        {/*    {operation?.request?.timestamp ? formatTime(operation.request.timestamp) : 'N/A'}*/}
        {/*  </div>*/}
        {/*</div>*/}
        <div className="w-16 text-gray-500 text-center text-xs">{operation?.timing?.duration}ms</div>
        <button
          className="w-8 h-8 flex items-center justify-center cursor-pointer text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(opId);
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
};

export default RequestListItem;
