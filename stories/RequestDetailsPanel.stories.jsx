// stories/RequestDetailsPanel.stories.jsx
import React from 'react';
import RequestDetailsPanel from '../src/components/RequestDetailsPanel';

export default {
  title: 'Components/RequestDetailsPanel',
  component: RequestDetailsPanel
};

export const DefaultPanel = () => (
  <RequestDetailsPanel
    request={{
      method: 'POST',
      url: 'http://localhost:3000/api/create',
      path: '/api/create',
      latency: 123,
      request: {
        queryParams: { search: 'test' },
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        statusCode: 201,
        payload: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { 'X-Test': 'Header' },
        timestamp: new Date()
      }
    }}
    currentTab="request"
    setCurrentTab={() => {
    }}
  />
);