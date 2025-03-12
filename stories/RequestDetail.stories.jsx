// stories//RequestDetail.stories.jsx
import React from 'react';
import RequestDetail from '../src/components/RequestDetail';

export default {
  title: 'Components/RequestDetail',
  component: RequestDetail
};

export const DefaultRequestDetail = () => (
  <RequestDetail operation={
     {
      request: {
        method: 'GET',
        path: '/api/test',
        url: 'http://example.com/api/test',
        timestamp: '2024-02-09T12:00:00Z'
      },
      response: { status: 200, status_text: 'OK' },
      timing: {
        duration: 150
      }

  }} />
);