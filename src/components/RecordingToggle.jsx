import React from 'react';
import NotificationBadge from './NotificationBadge.jsx';

export default function RecordingToggle({ isRecording, recordCount, disabled = false, onClick }) {
  const buttonClass = `px-2 py-1 rounded text-xs flex items-center border border-green-500 ${
    isRecording ? 'text-white bg-green-500' : 'text-green-500 hover:text-white hover:bg-green-500'
  }`;

  return (
    <div className="relative">
      <button disabled={disabled} className={buttonClass} onClick={onClick}>
        <span
          className={`mr-1 block w-2 h-2 ${
            isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-600 rounded-full'
          }`}
        ></span>
        <span className="max-[880px]:inline hidden">{isRecording ? 'Stop' : 'Start'}</span>
        <span className="max-[880px]:hidden">
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </span>
      </button>
      {isRecording && recordCount > 0 && (
        <span className="absolute -top-3 -right-2">
          <NotificationBadge count={recordCount} />
        </span>
      )}
    </div>
  );
}
