import React from 'react';
import DialogConfirmClearAll from '../src/components/DialogConfirmClearAll';

const action = () => () => {};

export default {
  title: 'Components/DialogConfirmClearAll',
  component: DialogConfirmClearAll,
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    message: { control: 'text' },
    confirmButtonText: { control: 'text' }
  }
};

const Template = (args) => (
  <DialogConfirmClearAll {...args} onConfirm={action('confirm')} onClose={action('close')} />
);

export const Default = Template.bind({});
Default.args = {
  open: true,
  title: 'Clear All?',
  message: 'Are you sure?',
  confirmButtonText: 'Clear All'
};
