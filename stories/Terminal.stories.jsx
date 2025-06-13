import React from 'react';
import Terminal from '../src/components/Terminal';

export default {
  title: 'Components/Terminal',
  component: Terminal,
  argTypes: {
    endpoint: { control: 'text' },
    command: { control: 'text' },
    showCopyButton: { control: 'boolean' }
  }
};

const Template = (args) => <Terminal {...args} />;

export const Default = Template.bind({});
Default.args = {
  endpoint: 'http://localhost:8080',
  showCopyButton: true
};
