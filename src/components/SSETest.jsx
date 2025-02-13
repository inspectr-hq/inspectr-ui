import React from 'react';
import useSSE from '../hooks/useSSE';

const SSETest = () => {
  const { data, error } = useSSE('http://localhost:4321/api/events');

  console.log('test', 'test');

  return (
    <div>
      <h1>SSE Test Component</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>No data received yet</p>}
    </div>
  );
};

export default SSETest;
