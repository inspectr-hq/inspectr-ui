// stories/SettingsPanel.stories.jsx
import React, { useState } from "react";
import SettingsPanel from "../src/components/SettingsPanel";

export default {
  title: "Components/SettingsPanel",
  component: SettingsPanel,
  argTypes: {
    connectionStatus: {
      control: { type: "select" },
      options: ["connected", "reconnecting", "disconnected"],
    },
    apiEndpoint: { control: "text" },
    channelCode: { control: "text" },
    channel: { control: "text" },
  },
};

const Template = (args) => {
  const [apiEndpoint, setApiEndpoint] = useState(args.apiEndpoint);
  const [channelCode, setChannelCode] = useState(args.channelCode);
  const [channel, setChannel] = useState(args.channel);

  const handleRegister = (channelCode, channel) => {
    console.log("Registering with:", channelCode, channel);
    // Additional registration logic can be added here if needed.
  };

  return (
    <SettingsPanel
      {...args}
      apiEndpoint={apiEndpoint}
      setApiEndpoint={setApiEndpoint}
      channelCode={channelCode}
      setChannelCode={setChannelCode}
      channel={channel}
      setChannel={setChannel}
      onRegister={handleRegister}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  connectionStatus: "disconnected",
  apiEndpoint: "",
  channelCode: "",
  channel: "",
};

export const Connected = Template.bind({});
Connected.args = {
  connectionStatus: "connected",
  apiEndpoint: "https://example.com/api",
  channelCode: "ABC123",
  channel: "Channel1",
};

export const Reconnecting = Template.bind({});
Reconnecting.args = {
  connectionStatus: "reconnecting",
  apiEndpoint: "https://example.com/api",
  channelCode: "XYZ789",
  channel: "Channel2",
};
