// stories/RequestDetailsPanel.stories.jsx
import React from 'react';
import RequestDetailsPanel from '../src/components/RequestDetailsPanel';

export default {
  title: 'Components/RequestDetailsPanel',
  component: RequestDetailsPanel
};

export const DefaultPanel = () => (
  <RequestDetailsPanel
    operation={{operation: {

      request: {
        method: 'POST',
        url: 'http://localhost:3000/api/create',
        path: '/api/create',
        query_params: { search: 'test' },
        headers: {  'name':'Content-Type', 'value': 'application/json' },
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        timestamp: new Date()
      },
      response: {
        statusCode: 201,
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { 'name':'X-Test', 'value': 'Header' },
        timestamp: new Date()
      },
      timing: {
        duration: 123,
      }
    }}}
    currentTab="request"
    setCurrentTab={() => {
    }}
  />
);