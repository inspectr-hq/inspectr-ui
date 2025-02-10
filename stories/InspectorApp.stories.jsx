// stories/InspectorApp.stories.jsx
import React from "react";
import InspectorApp from "../src/components/InspectorApp";

export default {
    title: "Inspector/InspectorApp",
    component: InspectorApp,
};

const Template = (args) => <InspectorApp {...args} />;

export const Default = Template.bind({});
