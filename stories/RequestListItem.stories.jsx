// stories/RequestListItem.stories.jsx
import React from 'react';
import RequestListItem from '../src/components/operations/RequestListItem.jsx';

export default {
  title: 'Components/RequestListItem',
  component: RequestListItem
};

export const DefaultItem = () => (
  <RequestListItem
      operation={{
        request: {
          method: 'GET',
          path: '/api/test',
          timestamp: '2025-03-12T16:06:32.344451Z',
          headers: [{ name: 'X-API-Key', value: 'abc123' }]
        },
        response: { status: 200 },
        timing: { duration: 123 },
        meta: { inspectr: { guard: {} } }
      }}
    opId={1}
    onSelect={() => {}}
    onRemove={() => {}}
  />
);
