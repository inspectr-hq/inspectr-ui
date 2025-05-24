import React from 'react';

export default function ConnectionStatusIndicator({
  status, // "connected" | "reconnecting" | "disconnected"
  onReconnect // callback for reconnect
}) {
  // map status → styles
  const bgClasses = {
    connected: 'bg-green-500 text-white',
    reconnecting: 'bg-yellow-500 text-black',
    disconnected: 'bg-red-500 text-white'
  }[status];

  const dotClasses = {
    connected: 'bg-green-800 animate-pulse',
    reconnecting: 'bg-yellow-800 animate-pulse',
    disconnected: 'bg-red-800'
  }[status];

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex items-center gap-4">
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${bgClasses}`}
      >
        <span className={`w-2 h-2 rounded-full mr-1 ${dotClasses}`} />
        {label}
      </span>

      {status === 'disconnected' && (
        <button
          onClick={onReconnect}
          className="ml-2 text-sm font-medium text-blue-600 hover:underline"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
