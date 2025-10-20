import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import DialogMockConfig from '../src/components/settings/DialogMockConfig.jsx';

export default {
  title: 'Components/DialogMockConfig',
  component: DialogMockConfig
};

const Template = (args) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-4">
      <button
        onClick={() => setOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open
      </button>
      <DialogMockConfig
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={action('submit')}
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  initialUrl: 'https://example.com/openapi.yaml'
};
