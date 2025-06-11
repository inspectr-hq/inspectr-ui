import React from 'react';
import CopyButton from '../src/components/CopyButton';

export default {
  title: 'Components/CopyButton',
  component: CopyButton,
  argTypes: {
    textToCopy: { control: 'text' },
    showLabel: { control: 'boolean' },
    labelText: { control: 'text' },
    copiedText: { control: 'text' }
  }
};

const Template = (args) => <CopyButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  textToCopy: 'Hello World',
  showLabel: true,
  labelText: 'Copy',
  copiedText: 'Copied'
};
