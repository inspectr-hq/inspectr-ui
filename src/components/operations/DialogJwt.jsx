// src/components/operations/DialogJwt.jsx
import React from 'react';
import CopyButton from '../CopyButton.jsx';

const DialogJwt = ({ open, onClose, decoded }) => {
  if (!open) return null;

  const jwtText = JSON.stringify(decoded, null, 2);

  const formatTimestamp = (ts) => {
    return ts ? new Date(ts * 1000).toLocaleString() : 'N/A';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>

      {/* Dialog panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <polygon
                  fill="#546e7a"
                  points="21.906,31.772 24.507,29.048 27.107,31.772 27.107,43 21.906,43"
                />
                <polygon
                  fill="#f50057"
                  points="17.737,29.058 21.442,28.383 21.945,32.115 15.345,41.199 11.138,38.141"
                />
                <polygon
                  fill="#d500f9"
                  points="15.962,24.409 19.355,26.041 17.569,29.356 6.89,32.825 5.283,27.879"
                />
                <polygon
                  fill="#29b6f6"
                  points="17.256,19.607 19.042,22.922 15.649,24.554 4.97,21.084 6.577,16.137"
                />
                <polygon
                  fill="#00e5ff"
                  points="21.126,16.482 20.623,20.214 16.918,19.539 10.318,10.455 14.526,7.398"
                />
                <polygon
                  fill="#546e7a"
                  points="26.094,16.228 23.493,18.952 20.893,16.228 20.893,5 26.094,5"
                />
                <polygon
                  fill="#f50057"
                  points="30.262,18.943 26.558,19.618 26.055,15.886 32.654,6.802 36.862,9.859"
                />
                <polygon
                  fill="#d500f9"
                  points="32.039,23.59 28.645,21.958 30.431,18.643 41.11,15.174 42.717,20.12"
                />
                <polygon
                  fill="#29b6f6"
                  points="30.744,28.393 28.958,25.078 32.351,23.447 43.03,26.916 41.423,31.863"
                />
                <polygon
                  fill="#00e5ff"
                  points="26.874,31.518 27.378,27.786 31.082,28.461 37.682,37.545 33.474,40.602"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Decoded JWT</h3>
              <p className="mt-1 text-sm text-gray-500">Below is the decoded JWT information.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="relative mt-4">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton textToCopy={jwtText} />
          </div>
          <pre className="bg-gray-100 p-2 rounded text-xs text-gray-700 overflow-x-auto">
            {jwtText}
          </pre>
          {decoded && (
            <div className="mt-2 text-sm text-gray-600">
              {decoded?.payload?.iat && (
                <p>Issued At (iat): {formatTimestamp(decoded.payload.iat)}</p>
              )}
              {decoded?.payload?.nbf && (
                <p>Not Before (nbf): {formatTimestamp(decoded.payload.nbf)}</p>
              )}
              {decoded?.payload?.exp && (
                <p>Expires At (exp): {formatTimestamp(decoded.payload.exp)}</p>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogJwt;
