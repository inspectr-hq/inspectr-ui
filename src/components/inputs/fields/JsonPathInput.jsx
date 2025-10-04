// src/components/inputs/fields/JsonPathInput.jsx
import React from 'react';
import JsonPathPicker from '../../JsonPathPicker.jsx';

export default function JsonPathInput({ id, descriptor, value, onChange, readOnly }) {
  if (!descriptor || descriptor.hidden) return null;

  const label = descriptor.label || descriptor.name;
  const helpText = descriptor.help || descriptor.description;
  const placeholder = descriptor.placeholder || '$.request.path';
  const browseLabel = descriptor.meta?.browseLabel || descriptor.meta?.browse_label || 'Browse paths';
  const isDisabled = readOnly ?? Boolean(descriptor.readonly);

  const normalizedValue = typeof value === 'string' ? value : value ?? '';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <JsonPathPicker
        id={id}
        value={normalizedValue}
        onChange={onChange}
        placeholder={placeholder}
        browseButtonLabel={browseLabel}
        disabled={isDisabled}
        enablePreview
      />
      {helpText && <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
    </div>
  );
}

