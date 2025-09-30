// src/components/inputs/fields/MultiSelectInput.jsx
import React from 'react';

export default function MultiSelectInput({ id, descriptor, value, onChange, provider, readOnly }) {
  if (!descriptor || descriptor.hidden) return null;
  const label = descriptor.label || descriptor.name;
  const isReadOnly = readOnly ?? Boolean(descriptor.readonly);
  const inputClass =
    'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30';

  const selectedValues = value && typeof value === 'object' && value !== null ? value : {};

  const handleToggle = (key, checked) => {
    const next = { ...selectedValues };
    if (checked) {
      if (!(key in next)) next[key] = '';
    } else {
      delete next[key];
    }
    onChange(next);
  };

  const handleValueChange = (key, val) => {
    const next = { ...selectedValues };
    next[key] = val;
    onChange(next);
  };

  const choices = (descriptor.choices || []).filter(
    (choice) => !choice.group || !provider || choice.group === provider
  );

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const key = choice.meta?.key || choice.value;
          const checked = Object.prototype.hasOwnProperty.call(selectedValues, key);
          const metaType = choice.meta?.type || 'string';
          const valueForInput = (() => {
            const v = selectedValues[key];
            if (metaType === 'object' && typeof v === 'object' && v !== null) {
              try {
                return JSON.stringify(v);
              } catch (e) {
                return String(v);
              }
            }
            return v ?? '';
          })();

        return (
          <div key={choice.value} className="rounded-md border border-gray-200 p-2 dark:border-gray-800">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={checked}
                onChange={(e) => handleToggle(key, e.target.checked)}
                className="mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
              />
              <span className="flex-1">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {choice.label || choice.value}
                </span>
                {choice.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">{choice.description}</p>
                )}
              </span>
            </label>
            {checked && (
              <div className="mt-2">
                {metaType === 'object' ? (
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={valueForInput}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder={choice.label}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type={metaType === 'integer' || metaType === 'number' ? 'number' : 'text'}
                    disabled={isReadOnly}
                    value={valueForInput}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder={choice.label}
                    className={inputClass}
                  />
                )}
              </div>
            )}
          </div>
        );
        })}
      </div>
      {descriptor.help && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{descriptor.help}</p>
      )}
    </div>
  );
}
