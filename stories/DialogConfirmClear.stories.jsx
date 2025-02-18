// src/components/DialogConfirmClear.stories.jsx
import React from 'react';
import { action } from '@storybook/addon-actions';
import DialogConfirmClear from '../src/components/DialogConfirmClear';

export default {
  title: 'Components/DialogConfirmClear',
  component: DialogConfirmClear,
  argTypes: {
    open: { control: 'boolean' },
    hasFilters: { control: 'boolean' },
    onClose: { action: 'onClose' },
    onConfirmAll: { action: 'onConfirmAll' },
    onConfirmFiltered: { action: 'onConfirmFiltered' }
  }
};

const Template = (args) => <DialogConfirmClear {...args} />;

export const ClearAllDialog = Template.bind({});
ClearAllDialog.args = {
  open: true,
  hasFilters: false,
  onClose: action('onClose'),
  onConfirmAll: action('onConfirmAll'),
  onConfirmFiltered: action('onConfirmFiltered')
};

export const ClearFilteredDialog = Template.bind({});
ClearFilteredDialog.args = {
  open: true,
  hasFilters: true,
  onClose: action('onClose'),
  onConfirmAll: action('onConfirmAll'),
  onConfirmFiltered: action('onConfirmFiltered')
};
