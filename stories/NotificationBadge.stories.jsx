import React from 'react';
import NotificationBadge from '../src/components/NotificationBadge';

export default {
  title: 'Components/NotificationBadge',
  component: NotificationBadge,
  argTypes: {
    count: { control: 'number' }
  }
};

const Template = (args) => <NotificationBadge {...args} />;

export const Default = Template.bind({});
Default.args = {
  count: 5
};
