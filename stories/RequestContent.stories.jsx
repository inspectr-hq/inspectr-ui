// stories/RequestContent.stories.jsx
import React from 'react';
import RequestContent from '../src/components/RequestContent';

export default {
  title: 'Components/RequestContent',
  component: RequestContent
};

const Template = (args) => <RequestContent {...args} />;

export const Default = Template.bind({});
Default.args = {
  operation: {
    request: {
      query_params: [{ key: 'search', value: 'test' }],
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify({ key: 'value' }, null, '\t')
    }
  }
};

export const EmptyBody = Template.bind({});
EmptyBody.args = {
  operation: {
    request: {
      query_params: [],
      headers: [],
      body: ''
    }
  }
};
