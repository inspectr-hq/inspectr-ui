// stories/RequestList.stories.jsx
import React from "react";
import RequestList from "../src/components/RequestList";

export default {
    title: "Components/RequestList",
    component: RequestList,
};

export const DefaultList = () => (
    <RequestList
        requests={[
            { id: 1, request: { method: "GET" }, response: { status: 200 }, url: "http://example.com", latency: 123 },
            { id: 2, request: { method: "POST" }, response: { status: 301 }, url: "http://example.com", latency: 123 },
            { id: 3, request: { method: "POST" }, response: { status: 404 }, url: "http://example.com", latency: 123 },
            { id: 4, request: { method: "POST" }, response: { status: 500 }, url: "http://example.com", latency: 123 }
        ]}
        onSelect={() => {}}
        onRemove={() => {}}
        clearRequests={() => {}}
    />
);