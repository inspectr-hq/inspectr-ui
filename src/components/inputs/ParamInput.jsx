// src/components/inputs/ParamInput.jsx
import React from 'react';
import BooleanInput from './fields/BooleanInput.jsx';
import SingleSelectInput from './fields/SingleSelectInput.jsx';
import MultiSelectInput from './fields/MultiSelectInput.jsx';
import NumberInput from './fields/NumberInput.jsx';
import ArrayInput from './fields/ArrayInput.jsx';
import ObjectInput from './fields/ObjectInput.jsx';
import TextInput from './fields/TextInput.jsx';
import PasswordInput from './fields/PasswordInput.jsx';
import JsonPathInput from './fields/JsonPathInput.jsx';

/**
 * Facade component that keeps the ParamInput API stable,
 * while delegating rendering to specialized field components.
 * Supports FieldDescriptor schema properties including:
 * - type: string | boolean | number | integer | object | array<string>
 * - input: string | boolean | number | object | single_select | multi_select | password
 * - choices, variants (variants are handled by parent containers), placeholder, help, required, hidden, readonly
 */
export default function ParamInput({ id, descriptor, value, onChange, provider, className = '', readOnly }) {
  if (!descriptor || descriptor.hidden) return null;

  const format = descriptor.format || descriptor.meta?.format;
  const meta = descriptor.meta || {};
  const normalize = (text) => (typeof text === 'string' ? text.toLowerCase() : '');
  const matchesJsonPath = (text) => /json[\s_-]?path/.test(normalize(text));

  const expectsJsonPath =
    descriptor.input === 'json_path' ||
    descriptor.type === 'json_path' ||
    format === 'json_path' ||
    meta.input === 'json_path' ||
    meta.format === 'json_path' ||
    meta.jsonPath === true ||
    meta.json_path === true ||
    matchesJsonPath(descriptor.name) ||
    matchesJsonPath(descriptor.placeholder) ||
    matchesJsonPath(meta.label);

  const isBoolean = descriptor.type === 'boolean' || descriptor.input === 'boolean';
  const isArray = typeof descriptor.type === 'string' && descriptor.type.startsWith('array');
  const isSingleSelect = descriptor.input === 'single_select' && Array.isArray(descriptor.choices);
  const isMultiSelect = descriptor.input === 'multi_select' && Array.isArray(descriptor.choices);
  const isNumber = descriptor.type === 'integer' || descriptor.type === 'number' || descriptor.input === 'number';
  const isObject = descriptor.type === 'object' || descriptor.input === 'object';
  const isPassword = descriptor.input === 'password';

  let FieldComponent = TextInput;
  if (expectsJsonPath) FieldComponent = JsonPathInput;
  else if (isBoolean) FieldComponent = BooleanInput;
  else if (isSingleSelect) FieldComponent = SingleSelectInput;
  else if (isMultiSelect) FieldComponent = MultiSelectInput;
  else if (isNumber) FieldComponent = NumberInput;
  else if (isArray) FieldComponent = ArrayInput;
  else if (isObject) FieldComponent = ObjectInput;
  else if (isPassword) FieldComponent = PasswordInput;

  // Wrap to preserve optional external className without altering child markup
  return (
    <div className={className}>
      <FieldComponent
        id={id}
        descriptor={descriptor}
        value={value}
        onChange={onChange}
        provider={provider}
        readOnly={readOnly}
      />
    </div>
  );
}
