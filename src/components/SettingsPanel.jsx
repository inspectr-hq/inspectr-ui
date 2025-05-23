// src/components/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import logo from '../assets/inspectr_logo_small.png';

const SettingsPanel = ({
  apiEndpoint,
  setApiEndpoint,
  connectionStatus, // now a string: "connected", "reconnecting", or "disconnected"
  channelCode,
  setChannelCode,
  channel,
  setChannel,
  onRegister
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [endpointInput, setEndpointInput] = useState(apiEndpoint);
  const [channelCodeInput, setChannelCodeInput] = useState(channelCode);
  const [channelInput, setChannelInput] = useState(channel);

  // Sync input fields with props when they change
  useEffect(() => {
    setEndpointInput(apiEndpoint);
    setChannelCodeInput(channelCode);
    setChannelInput(channel);
  }, [apiEndpoint, channelCode, channel]);

  // Load stored values on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedApiEndpoint = localStorage.getItem('apiEndpoint');
      const defaultEndpoint = storedApiEndpoint || window.location.origin + '/api';
      setEndpointInput(defaultEndpoint);
      setApiEndpoint(defaultEndpoint);
    }
  }, [setApiEndpoint]);

  // Save API Endpoint configuration.
  const handleSaveEndpoint = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiEndpoint', endpointInput);
    }
    setApiEndpoint(endpointInput);
  };

  // Save registration details and trigger the registration process.
  const handleRegister = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('channelCode', channelCodeInput);
      localStorage.setItem('channel', channelInput);
    }
    setChannelCode(channelCodeInput);
    setChannel(channelInput);
    onRegister(channelCodeInput, channelInput, '', true);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full">
      {/* Bottom Panel */}
      <div
        className="flex items-center justify-between bg-gray-200 dark:bg-dark-tremor-background-subtle px-4 py-2 w-full cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center 
              ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 text-white'
                  : connectionStatus === 'reconnecting'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-red-500'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1 
                ${
                  connectionStatus === 'connected'
                    ? 'bg-green-800'
                    : connectionStatus === 'reconnecting'
                      ? 'bg-yellow-800'
                      : 'bg-red-800'
                }`}
            ></span>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </span>
        </div>

        {/* Inspectr Logo & Name */}
        <a
          href="https://github.com/inspectr-hq/inspectr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <img src={logo} alt="Inspectr Logo" className="h-6" />
          <span className="text-gray-700 dark:text-dark-tremor-content font-semibold text-sm">
            Inspectr
          </span>
        </a>
      </div>

      {/* Configuration Panel */}
      <div
        className={`bg-gray-100 dark:bg-dark-tremor-background border-t border-gray-300 dark:border-dark-tremor-border transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <div className="px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-tremor-content-strong mb-4">
            Configuration
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {/* Column 1: API Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                Inspectr API Endpoint
              </label>
              <input
                type="text"
                placeholder="Enter API Endpoint..."
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                className="w-full border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={handleSaveEndpoint}
                className="mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-1.5 rounded-md text-sm"
              >
                Save
              </button>
            </div>

            {/* Column 2: Access Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                Channel
              </label>
              <input
                type="text"
                placeholder="Enter Channel..."
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                className="w-full bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content border border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onClick={handleRegister}
                className="mt-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-3 py-1.5 rounded-md text-sm"
              >
                Register
              </button>
            </div>

            {/* Column 3: Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-tremor-content mb-1">
                Access Code
              </label>
              <input
                type="text"
                placeholder="Enter Access Code..."
                value={channelCodeInput}
                onChange={(e) => setChannelCodeInput(e.target.value)}
                className="w-full border bg-white dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
