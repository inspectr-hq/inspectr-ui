// src/components/inputs/ParamInput.jsx
import React from 'react';

/**
 * Reusable parameter input renderer for action/rule builders.
 * Supports FieldDescriptor schema with properties:
 * - type: string | boolean | number | integer | object | array<string>
 * - input: string | boolean | number | object | single_select | multi_select | password
 * - choices: for single_select/multi_select
 * - variants: handled by parent for object-with-variants; this component renders a flat descriptor
 * - placeholder, help, description, required, hidden, readonly
 */
export default function ParamInput({ id, descriptor, value, onChange, provider, className = '', readOnly }) {
  if (!descriptor || descriptor.hidden) return null;

  const label = descriptor.label || descriptor.name;
  const isBoolean = descriptor.type === 'boolean' || descriptor.input === 'boolean';
  const isArray = typeof descriptor.type === 'string' && descriptor.type.startsWith('array');
  const isSingleSelect = descriptor.input === 'single_select' && Array.isArray(descriptor.choices);
  const isMultiSelect = descriptor.input === 'multi_select' && Array.isArray(descriptor.choices);
  const isNumber =
    descriptor.type === 'integer' || descriptor.type === 'number' || descriptor.input === 'number';
  const isObject = descriptor.type === 'object' || descriptor.input === 'object';
  const isPassword = descriptor.input === 'password';
  const isReadOnly = readOnly ?? Boolean(descriptor.readonly);
  const placeholder = descriptor.placeholder ?? descriptor.help ?? descriptor.description ?? '';

  // Helper for standard input classes
  const inputClass =
    'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30';

  const wrapClass = `space-y-1 ${className}`.trim();

  if (isBoolean) {
    return (
      <div className={wrapClass}>
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

  if (isSingleSelect) {
    return (
      <div className={wrapClass}>
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
          {(descriptor.choices || [])
            .filter((choice) => !choice.group || !provider || choice.group === provider)
            .map((choice) => (
              <option key={choice.value} value={choice.value} title={choice.description || ''}>
                {choice.label || choice.value}
              </option>
            ))}
        </select>
        {(descriptor.description || descriptor.help) && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {descriptor.description || descriptor.help}
          </p>
        )}
      </div>
    );
  }

  if (isMultiSelect) {
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

    return (
      <div className={wrapClass}>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
          {descriptor.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(descriptor.choices || [])
            .filter((choice) => !choice.group || !provider || choice.group === provider)
            .map((choice) => {
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
          <p className="text-[11px] text-gray-500 dark:text-gray-500">{descriptor.help}</p>
        )}
      </div>
    );
  }

  if (isNumber) {
    return (
      <div className={wrapClass}>
        <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
          {descriptor.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          id={id}
          type="number"
          step={descriptor.type === 'integer' ? 1 : 'any'}
          disabled={isReadOnly}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        {descriptor.help && (
          <p className="text-[11px] text-gray-500 dark:text-gray-500">{descriptor.help}</p>
        )}
      </div>
    );
  }

  if (isArray) {
    return (
      <div className={wrapClass}>
        <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
          {descriptor.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          id={id}
          type="text"
          disabled={isReadOnly}
          value={Array.isArray(value) ? value.join(', ') : value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'tag.one, tag.two'}
          className={inputClass}
        />
        {descriptor.help && (
          <p className="text-[11px] text-gray-500 dark:text-gray-500">{descriptor.help}</p>
        )}
      </div>
    );
  }

  if (isObject) {
    return (
      <div className={wrapClass}>
        <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
          {descriptor.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <textarea
          id={id}
          rows={4}
          disabled={isReadOnly}
          value={typeof value === 'string' ? value : value ? JSON.stringify(value, null, 2) : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Enter JSON object'}
          className={inputClass}
        />
        {(descriptor.description || descriptor.help) && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {descriptor.description || descriptor.help}
          </p>
        )}
      </div>
    );
  }

  // default text/password
  return (
    <div className={wrapClass}>
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {descriptor.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={isPassword ? 'password' : 'text'}
        disabled={isReadOnly}
        value={typeof value === 'string' ? value : value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {descriptor.help && (
        <p className="text-[11px] text-gray-500 dark:text-gray-500">{descriptor.help}</p>
      )}
    </div>
  );
}
