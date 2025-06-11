import React from 'react';
import ConnectionStatusIndicator from '../src/components/ConnectionStatusIndicator';

export default {
  title: 'Components/ConnectionStatusIndicator',
  component: ConnectionStatusIndicator,
  argTypes: {
    status: { control: { type: 'select' }, options: ['connected', 'reconnecting', 'disconnected'] }
  }
};

const Template = (args) => <ConnectionStatusIndicator {...args} />;

export const Connected = Template.bind({});
Connected.args = { status: 'connected' };

export const Reconnecting = Template.bind({});
Reconnecting.args = { status: 'reconnecting' };

export const Disconnected = Template.bind({});
Disconnected.args = { status: 'disconnected' };
