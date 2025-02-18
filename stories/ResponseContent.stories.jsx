// stories/ResponseContent.stories.jsx
import React from 'react';
import ResponseContent from '../src/components/ResponseContent';

export default {
  title: 'Components/ResponseContent',
  component: ResponseContent
};

export const DefaultResponse = () => (
  <ResponseContent
    request={{
      response: {
        payload: JSON.stringify({ key: 'value' }, null, '\t'),
        headers: { 'X-Test': 'Header' }
      }
    }}
  />
);