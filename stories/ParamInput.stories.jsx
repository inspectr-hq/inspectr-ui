import React, { useState } from 'react';
import ParamInput from '../src/components/inputs/ParamInput.jsx';

const fields = [
  {
    id: 'target-url',
    descriptor: {
      name: 'url',
      label: 'Webhook URL',
      type: 'string',
      required: true,
      placeholder: 'https://hooks.acme.test/events',
      help: 'HTTPS endpoint that receives matching operations.'
    },
    initialValue: 'https://hooks.acme.test/rules'
  },
  {
    id: 'http-method',
    descriptor: {
      name: 'method',
      label: 'HTTP method',
      input: 'single_select',
      choices: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' }
      ]
    },
    initialValue: 'POST'
  },
  {
    id: 'retry-limit',
    descriptor: {
      name: 'retry_limit',
      label: 'Retry limit',
      type: 'integer',
      help: 'Maximum attempts.'
    },
    initialValue: 3
  },
  {
    id: 'include-headers',
    descriptor: { name: 'include_headers', label: 'Include request headers', type: 'boolean' },
    initialValue: true
  },
  {
    id: 'labels',
    descriptor: {
      name: 'labels',
      label: 'Labels',
      type: 'array<string>',
      placeholder: 'review, billing'
    },
    initialValue: ['billing', 'high-value']
  }
];

const InputGallery = () => {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map(({ id, initialValue }) => [id, initialValue]))
  );
  return (
    <div className="grid max-w-3xl grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2">
      {fields.map(({ id, descriptor }) => (
        <ParamInput
          key={id}
          id={id}
          descriptor={descriptor}
          value={values[id]}
          onChange={(value) => setValues((current) => ({ ...current, [id]: value }))}
        />
      ))}
    </div>
  );
};

export default {
  title: 'Components/Inputs/ParamInput',
  component: ParamInput,
  parameters: { layout: 'padded' }
};

export const FieldGallery = () => <InputGallery />;
