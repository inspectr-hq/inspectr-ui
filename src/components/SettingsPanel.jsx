// src/components/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import logo from '../assets/inspectr_logo_small.png';
import ConnectionStatusIndicator from './ConnectionStatusIndicator.jsx';
import { useInspectr } from '../context/InspectrContext';

const SettingsPanel = () => {
  const {
    apiEndpoint,
    setApiEndpoint,
    connectionStatus,
    channelCode,
    setChannelCode,
    channel,
    setChannel,
    client,
    userInitiatedRegistrationRef,
    handleRegister: onRegister,
    attemptReRegistration: onReconnect,
    resetReRegistration
  } = useInspectr();

  const [isOpen, setIsOpen] = useState(false);
  const [endpointInput, setEndpointInput] = useState(apiEndpoint);
  const [channelCodeInput, setChannelCodeInput] = useState(channelCode);
  const [channelInput, setChannelInput] = useState(channel);

  // Sync input fields with props when they change, but only if the panel is closed
  // This prevents loops when the user is actively editing the fields
  useEffect(() => {
    if (!isOpen) {
      setEndpointInput(apiEndpoint);
      setChannelCodeInput(channelCode);
      setChannelInput(channel);
    }
  }, [apiEndpoint, channelCode, channel, isOpen]);

  // Save API Endpoint configuration.
  const handleSaveEndpoint = () => {
    // Normalize the endpoint by removing trailing slashes
    const newEndpoint = endpointInput.replace(/\/+$/, '');
    setApiEndpoint(newEndpoint);
    client.configure({ apiEndpoint: newEndpoint });
    userInitiatedRegistrationRef.current = false;
    onRegister(channelCode, channel, '', true);
  };

  // Trigger registration
  const handleRegister = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('channelCode', channelCodeInput);
      localStorage.setItem('channel', channelInput);
    }
    // This prevents the auto-registration useEffect from running
    userInitiatedRegistrationRef.current = true;

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
        <ConnectionStatusIndicator
          status={connectionStatus}
          onReconnect={(e) => {
            e.stopPropagation();
            resetReRegistration();
            onReconnect();
          }}
        />

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
