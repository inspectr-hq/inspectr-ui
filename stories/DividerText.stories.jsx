import React from 'react';
import DividerText from '../src/components/DividerText';

export default {
  title: 'Components/DividerText',
  component: DividerText,
  argTypes: {
    text: { control: 'text' },
    align: { control: { type: 'select' }, options: ['left', 'center', 'right'] }
  }
};

const Template = (args) => <DividerText {...args} />;

export const Default = Template.bind({});
Default.args = { text: 'Divider', align: 'center' };
