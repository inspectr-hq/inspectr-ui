import React, { useEffect } from 'react';
import SettingsPanel from '../src/components/SettingsPanel';
import { InspectrProvider, useInspectr } from '../src/context/InspectrContext';

export default {
  title: 'Components/SettingsPanel',
  component: SettingsPanel,
  argTypes: {
    connectionStatus: {
      control: { type: 'select' },
      options: ['connected', 'reconnecting', 'disconnected']
    },
    apiEndpoint: { control: 'text' },
    channelCode: { control: 'text' },
    channel: { control: 'text' }
  }
};

const Wrapper = ({ connectionStatus, apiEndpoint, channelCode, channel }) => {
  const ctx = useInspectr();
  useEffect(() => {
    ctx.setConnectionStatus(connectionStatus);
    ctx.setApiEndpoint(apiEndpoint);
    ctx.setChannelCode(channelCode);
    ctx.setChannel(channel);
  }, [connectionStatus, apiEndpoint, channelCode, channel]);
  return <SettingsPanel />;
};

const Template = (args) => (
  <InspectrProvider>
    <Wrapper {...args} />
  </InspectrProvider>
);

export const Default = Template.bind({});
Default.args = {
  connectionStatus: 'disconnected',
  apiEndpoint: '',
  channelCode: '',
  channel: ''
};

export const Connected = Template.bind({});
Connected.args = {
  connectionStatus: 'connected',
  apiEndpoint: 'https://example.com/api',
  channelCode: 'ABC123',
  channel: 'Channel1'
};

export const Reconnecting = Template.bind({});
Reconnecting.args = {
  connectionStatus: 'reconnecting',
  apiEndpoint: 'https://example.com/api',
  channelCode: 'XYZ789',
  channel: 'Channel2'
};
