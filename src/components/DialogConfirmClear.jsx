import React from 'react';

const DialogConfirmClear = ({ open, onClose, onConfirmAll, onConfirmFiltered, hasFilters }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Dialog panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
            <svg className="size-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" aria-hidden="true" data-slot="icon">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {hasFilters ? 'Clear Requests' : 'Clear All Requests'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {hasFilters
                ? 'You have active filters. Would you like to clear only the filtered requests or all requests?'
                : 'Are you sure you want to clear all requests? This action cannot be undone.'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          {hasFilters && (
            <button
              onClick={() => {
                onConfirmFiltered();
                onClose();
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              Clear Filtered
            </button>
          )}
          <button
            onClick={() => {
              onConfirmAll();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogConfirmClear;
