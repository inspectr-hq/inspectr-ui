// src/components/inputs/operators/OperatorValueInput.jsx
import React from 'react';

const baseInputClassName =
  'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30';

const valueHintClassName =
  'rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400';

const getBooleanValue = (value) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (value === '' || value === null || value === undefined) return 'true';
  return String(value);
};

const getPlaceholder = (multiValue, valueType) => {
  if (multiValue) {
    return valueType === 'number' ? 'e.g. 100, 200' : 'Enter comma-separated values';
  }
  if (valueType === 'number') return 'e.g. 200';
  return 'e.g. /api/payments';
};

export default function OperatorValueInput({
  value,
  valueType = 'string',
  valueRequired = true,
  multiValue = false,
  onChange,
  className,
  hintClassName
}) {
  if (!valueRequired) {
    return (
      <div className={hintClassName || valueHintClassName}>
        This operator does not require a comparison value.
      </div>
    );
  }

  if (valueType === 'boolean') {
    return (
      <select
        value={getBooleanValue(value)}
        onChange={(event) => onChange?.(event.target.value)}
        className={className || baseInputClassName}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={getPlaceholder(multiValue, valueType)}
      className={className || baseInputClassName}
    />
  );
}
