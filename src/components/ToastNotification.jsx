// src/components/ToastNotification.jsx
import React, { useEffect, useState } from 'react';

const ToastNotification = ({ message, subMessage, onClose, type = 'success' }) => {
  const totalTime = 3000; // total duration in ms
  const tickInterval = 50; // interval update every 50ms
  const [remainingTime, setRemainingTime] = useState(totalTime);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused) {
        setRemainingTime((prev) => {
          if (prev <= tickInterval) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - tickInterval;
        });
      }
    }, tickInterval);

    return () => clearInterval(interval);
  }, [paused, onClose]);

  // Calculate progress percentage
  const progressPercent = (remainingTime / totalTime) * 100;

  // Styling based on type
  const borderColor = type === 'error' ? 'border-red-500' : 'border-green-500';
  const textColor = type === 'error' ? 'text-red-500' : 'text-green-500';
  const progressColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const iconPath =
    type === 'error'
      ? 'M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' // Error icon (exclamation mark)
      : 'M9 12.75L11.25 15L15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'; // Success icon (check mark)

  return (
    <div
      className="fixed top-4 right-4 z-50 w-80"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`bg-white border-l-4 ${borderColor} p-2 shadow-lg rounded-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-6 w-6 ${textColor}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
          </div>
          <div className="ml-1 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {subMessage && <p className="mt-1 text-sm text-gray-500 break-words">{subMessage}</p>}
            <div
              className={`w-full h-1 rounded-t-lg ${progressColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="ml-auto pl-1">
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'error' ? 'red' : 'green'}-500`}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 1 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
