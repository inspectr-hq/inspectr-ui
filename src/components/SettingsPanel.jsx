// src/components/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import logo from '../assets/inspectr_logo_small.png';

const SettingsPanel = ({ sseEndpoint, setSseEndpoint, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(sseEndpoint);

  // Load stored value on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEndpoint = localStorage.getItem('sseEndpoint');
      if (!sseEndpoint && storedEndpoint) {
        setInputValue(storedEndpoint);
        setSseEndpoint(storedEndpoint);
      }
    }
  }, [sseEndpoint, setSseEndpoint]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sseEndpoint', inputValue);
    }
    setSseEndpoint(inputValue);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full">
      {/* Bottom Panel */}
      <div
        className="flex items-center justify-between bg-gray-200 px-4 py-2 w-full cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${
              isConnected ? 'bg-green-500 text-white' : 'bg-red-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-800' : 'bg-red-800'}`}
            ></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Inspectr Logo & Name */}
        <a
          href="https://github.com/thim81/inspectr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <img src={logo} alt="Inspectr Logo" className="h-6" />
          <span className="text-gray-700 font-semibold text-sm">Inspectr</span>
        </a>
      </div>

      {/* Configuration Panel */}
      <div
        className={`bg-gray-100 border-t border-gray-300 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-40 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <div className="px-6">
          {/* Title */}

          {/* Two-column Layout */}
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Left Column (Empty for now) */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h2>
            </div>

            {/* Right Column (Label + Input in the same row) */}
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-semibold whitespace-nowrap">SSE Endpoint:</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border p-2 rounded flex-1 bg-white"
                placeholder="Enter SSE Endpoint..."
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-md">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
