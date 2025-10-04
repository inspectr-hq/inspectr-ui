// src/components/inputs/operators/OperatorSelect.jsx
import React from 'react';

export default function OperatorSelect({
  value,
  options = [],
  onChange,
  disabled = false,
  className = ''
}) {
  const availableOptions = Array.isArray(options) ? options : [];
  const hasOptions = availableOptions.length > 0;
  const selectValue = value ?? '';

  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  return (
    <select
      value={hasOptions ? selectValue : ''}
      onChange={handleChange}
      disabled={disabled || !hasOptions}
      className={
        className ||
        'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30'
      }
    >
      {hasOptions ? (
        availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      ) : (
        <option value="" disabled>
          No operators available
        </option>
      )}
    </select>
  );
}
