// stories/ResponseContent.stories.jsx
import React from 'react';
import ResponseContent from '../src/components/ResponseContent';

export default {
  title: 'Components/ResponseContent',
  component: ResponseContent
};

export const DefaultResponse = () => (
  <ResponseContent
    operation={{
      response: {
        body: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: [{ key: 'X-Test', value: 'Header' }]
      }
    }}
  />
);

export const EmptyResponse = () => (
  <ResponseContent
    operation={{
      response: {
        body: '',
        headers: []
      }
    }}
  />
);
