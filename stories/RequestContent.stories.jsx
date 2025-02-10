// stories/RequestContent.stories.jsx
import React from "react";
import RequestContent from "../src/components/RequestContent";

export default {
    title: "Components/RequestContent",
    component: RequestContent,
};

const Template = (args) => <RequestContent {...args} />;

export const Default = Template.bind({});
Default.args = {
    request: {
        request: {
            queryParams: { search: "test" },
            headers: { "Content-Type": "application/json" },
            payload: { key: "value" },
        },
    },
};