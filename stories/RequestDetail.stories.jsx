// stories/RequestDetail.stories.jsx
import React from 'react';
import RequestDetail from '../src/components/operations/RequestDetail.jsx';

export default {
  title: 'Components/RequestDetail',
  component: RequestDetail
};

export const DefaultRequestDetail = () => (
  <RequestDetail
    operation={{
      request: {
        method: 'GET',
        path: '/api/test',
        url: 'http://example.com/api/test',
        timestamp: '2024-02-09T12:00:00Z'
      },
      response: { status: 200, status_text: 'OK' },
      timing: {
        duration: 150
      },
      meta: { proxy: { instance: 'inspectr-1234' } }
    }}
  />
);

export const RequestDetailWithTags = () => (
  <RequestDetail
    operation={{
      request: {
        method: 'POST',
        path: '/api/payments',
        url: 'https://api.inspectr.dev/v1/payments',
        timestamp: '2024-03-15T09:30:00Z',
        headers: [
          { name: 'content-type', value: 'application/json' },
          { name: 'x-request-id', value: 'req_abc123' }
        ]
      },
      response: { status: 202, status_text: 'Accepted' },
      timing: {
        duration: 275
      },
      meta: {
        proxy: { instance: 'inspectr-4321' },
        tags: ['priority:high', 'segment:card', 'fraud-review', 'error_code:42']
      }
    }}
    setCurrentTab={() => {}}
  />
);
