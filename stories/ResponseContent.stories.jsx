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
        headers: [
          { name: 'Content-Type', value: 'application/json' },
          { key: 'X-Test', value: 'Header' }
        ]
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

export const HtmlResponse = () => (
  <ResponseContent
    operation={{
      response: {
        body: '<!DOCTYPE html><html><body><h1>Hello</h1></body></html>',
        headers: [{ name: 'Content-Type', value: 'text/html' }]
      }
    }}
  />
);
