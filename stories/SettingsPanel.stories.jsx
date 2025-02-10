// stories/SettingsPanel.stories.jsx
import React, { useState } from "react";
import SettingsPanel from "../src/components/SettingsPanel";

export default {
    title: "Components/SettingsPanel",
    component: SettingsPanel,
    argTypes: {
        isConnected: { control: "boolean" },
        sseEndpoint: { control: "text" },
    },
};

const Template = (args) => {
    const [sseEndpoint, setSseEndpoint] = useState(args.sseEndpoint);
    return <SettingsPanel {...args} sseEndpoint={sseEndpoint} setSseEndpoint={setSseEndpoint} />;
};

export const Default = Template.bind({});
Default.args = {
    isConnected: false,
    sseEndpoint: "",
};

export const Connected = Template.bind({});
Connected.args = {
    isConnected: true,
    sseEndpoint: "https://example.com/sse",
};

export const Disconnected = Template.bind({});
Disconnected.args = {
    isConnected: false,
    sseEndpoint: "https://example.com/sse",
};
