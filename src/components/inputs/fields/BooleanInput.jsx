// src/components/inputs/fields/BooleanInput.jsx
import React from 'react';

export default function BooleanInput({ id, descriptor, value, onChange, readOnly }) {
  if (!descriptor || descriptor.hidden) return null;
  const label = descriptor.label || descriptor.name;
  const isReadOnly = readOnly ?? Boolean(descriptor.readonly);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="checkbox"
          disabled={isReadOnly}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
        />
        {descriptor.description && (
          <span className="text-xs text-gray-600 dark:text-gray-400">{descriptor.description}</span>
        )}
      </div>
      {descriptor.help && (
        <p className="text-[11px] text-gray-500 dark:text-gray-500">{descriptor.help}</p>
      )}
    </div>
  );
}
