// stories/RequestDetailsPanel.stories.jsx
import React from "react";
import RequestDetailsPanel from "../src/components/RequestDetailsPanel";

export default {
    title: "Components/RequestDetailsPanel",
    component: RequestDetailsPanel,
};

export const DefaultPanel = () => (
    <RequestDetailsPanel request={{
        request: {
            method: "POST",
            queryParams: { search: "test" },
            headers: { "Content-Type": "application/json" },
            payload: { key: "value" },
        },
        response: {status: 201, payload: {key: "value"}, headers: {"X-Test": "Header"}},
        endpoint: "/api/create",
    }} currentTab="request" setCurrentTab={() => {}} />
);