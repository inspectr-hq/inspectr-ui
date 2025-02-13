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
            queryParams: JSON.stringify({ search: "test" }, null, "\t"),
            headers: JSON.stringify({ "Content-Type": "application/json" }, null, "\t"),
            payload: JSON.stringify({ key: "value" }, null, "\t"),
        },
    },
};