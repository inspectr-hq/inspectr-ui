// src/components/ToastNotification.stories.jsx
import React from 'react';
import { action } from '@storybook/addon-actions';
import ToastNotification from '../src/components/ToastNotification';

export default {
  title: 'Components/ToastNotification',
  component: ToastNotification,
  argTypes: {
    message: { control: 'text' },
    subMessage: { control: 'text' },
    onClose: { action: 'closed' },
    type: { control: { type: 'select' }, options: ['success', 'error'] }
  }
};

const Template = (args) => <ToastNotification {...args} />;

export const WithSubMessage = Template.bind({});
WithSubMessage.args = {
  message: 'Success!',
  subMessage: 'Your operation was successful.',
  onClose: action('Toast closed')
};

export const WithoutSubMessage = Template.bind({});
WithoutSubMessage.args = {
  message: 'Success!',
  subMessage: '',
  onClose: action('Toast closed')
};
