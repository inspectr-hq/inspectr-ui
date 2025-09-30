// src/components/inputs/fields/SingleSelectInput.jsx
import React from 'react';

export default function SingleSelectInput({ id, descriptor, value, onChange, provider, readOnly }) {
  if (!descriptor || descriptor.hidden) return null;
  const label = descriptor.label || descriptor.name;
  const isReadOnly = readOnly ?? Boolean(descriptor.readonly);
  const helpText = descriptor.help || descriptor.description;

  const inputClass =
    'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30';

  const list = (descriptor.choices || [])
    .filter((choice) => !choice.group || !provider || choice.group === provider);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        id={id}
        disabled={isReadOnly}
        value={typeof value === 'string' ? value : value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {list.map((choice) => (
          <option key={choice.value} value={choice.value} title={choice.description || ''}>
            {choice.label || choice.value}
          </option>
        ))}
      </select>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
