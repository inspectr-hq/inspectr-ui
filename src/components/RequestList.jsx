// src/components/RequestList.jsx
import React, { useState } from 'react';
import RequestListItem from './RequestListItem';

const RequestList = ({ requests, onSelect, onRemove, clearRequests, selectedRequest }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center">
        <span className="font-bold text-xl">Requests ({requests.length})</span>
        <button className="px-3 py-1 bg-red-500 text-white rounded text-xs" onClick={clearRequests}>
          Clear All
        </button>
      </div>

      {/* Table Header */}
      <div className="flex items-center bg-gray-200 p-2 border-b border-gray-300 text-sm font-bold">
        <div className="w-16 text-center">Status</div>
        <div className="w-20 text-center">Method</div>
        <div className="flex-grow text-left">URL</div>
        <div className="w-20 text-center">Duration</div>
        <div className="w-10"></div>
      </div>

      <ul className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100vh - 40px - 100px)' }}>
        {requests.map((req, index) => {
          const reqId = req.id || index;
          return (
            <RequestListItem
              key={reqId}
              reqId={reqId}
              request={req}
              onSelect={onSelect}
              onRemove={onRemove}
              selected={selectedRequest && selectedRequest.id === reqId}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default RequestList;
