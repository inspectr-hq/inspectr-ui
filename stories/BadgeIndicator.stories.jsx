import React from 'react';
import BadgeIndicator from '../src/components/BadgeIndicator';

export default {
  title: 'Components/BadgeIndicator',
  component: BadgeIndicator,
  argTypes: {
    variant: { control: { type: 'select' }, options: ['auto', 'success', 'error', 'neutral'] },
    filled: { control: 'boolean' },
    children: { control: 'text' }
  }
};

const Template = (args) => <BadgeIndicator {...args} />;

export const Default = Template.bind({});
Default.args = {
  variant: 'auto',
  filled: false,
  children: 'OK'
};
