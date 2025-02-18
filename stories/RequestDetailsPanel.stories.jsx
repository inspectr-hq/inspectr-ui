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
      latency: 123,
      request: {
        queryParams: JSON.stringify({ search: 'test' }, null, '\t'),
        headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, '\t'),
        payload: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        statusCode: 201,
        payload: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: JSON.stringify({ 'X-Test': 'Header' }, null, '\t'),
        timestamp: new Date()
      },
      path: '/api/create'
    }}
    currentTab="request"
    setCurrentTab={() => {
    }}
  />
);