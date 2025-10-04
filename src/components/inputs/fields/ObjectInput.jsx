// src/components/inputs/fields/ObjectInput.jsx
import React from 'react';

export default function ObjectInput({ id, descriptor, value, onChange, readOnly }) {
  if (!descriptor || descriptor.hidden) return null;
  const label = descriptor.label || descriptor.name;
  const isReadOnly = readOnly ?? Boolean(descriptor.readonly);
  const placeholder = descriptor.placeholder || '';
  const helpText = descriptor.help || descriptor.description;
  const inputClass =
    'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30';

  const textValue = typeof value === 'string' ? value : value ? JSON.stringify(value, null, 2) : '';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        rows={4}
        disabled={isReadOnly}
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
