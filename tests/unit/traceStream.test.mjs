import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getOperationStreamOperationId,
  getOperationStreamTraceId,
  isTerminalOperationStreamEvent,
  shouldRefreshTraceFromOperationStream
} from '../../src/components/tracing/traceStream.js';

test('getOperationStreamTraceId extracts trace_id from operation stream payload metadata', () => {
  const payload = {
    meta: {
      trace: {
        trace_id: '7bb8930d08f149c8a7ca4bb8d3acce2e'
      }
    }
  };

  assert.equal(getOperationStreamTraceId(payload), '7bb8930d08f149c8a7ca4bb8d3acce2e');
});

test('getOperationStreamTraceId supports traceId fallback casing', () => {
  const payload = {
    meta: {
      trace: {
        traceId: 'd3538559-7288-473d-a6a4-fe319e89d826'
      }
    }
  };

  assert.equal(getOperationStreamTraceId(payload), 'd3538559-7288-473d-a6a4-fe319e89d826');
});

test('getOperationStreamTraceId returns null for missing trace metadata', () => {
  assert.equal(getOperationStreamTraceId({ meta: {} }), null);
  assert.equal(getOperationStreamTraceId(null), null);
});

test('shouldRefreshTraceFromOperationStream only matches the active trace', () => {
  const payload = {
    data: {
      meta: {
        trace: {
          trace_id: 'active-trace'
        }
      }
    }
  };

  assert.equal(
    shouldRefreshTraceFromOperationStream('active-trace', payload, {
      operationId: 'new-operation',
      knownOperationIds: new Set()
    }),
    true
  );
  assert.equal(
    shouldRefreshTraceFromOperationStream('other-trace', payload, {
      operationId: 'new-operation',
      knownOperationIds: new Set()
    }),
    false
  );
  assert.equal(
    shouldRefreshTraceFromOperationStream(null, payload, {
      operationId: 'new-operation',
      knownOperationIds: new Set()
    }),
    false
  );
});

test('getOperationStreamOperationId extracts operation ids from stream detail and payload', () => {
  assert.equal(
    getOperationStreamOperationId({
      operationId: 'detail-operation',
      payload: { operation_id: 'payload-operation' }
    }),
    'detail-operation'
  );
  assert.equal(
    getOperationStreamOperationId({
      payload: { operation_id: 'payload-operation' }
    }),
    'payload-operation'
  );
});

test('isTerminalOperationStreamEvent detects completed and error event types', () => {
  assert.equal(isTerminalOperationStreamEvent('dev.inspectr.operation.http.v1.completed'), true);
  assert.equal(isTerminalOperationStreamEvent('dev.inspectr.operation.http.v1.error'), true);
  assert.equal(isTerminalOperationStreamEvent('dev.inspectr.operation.http.v1.updated'), false);
});

test('shouldRefreshTraceFromOperationStream skips existing non-terminal operations', () => {
  const payload = {
    operation_id: 'existing-operation',
    meta: {
      trace: {
        trace_id: 'active-trace'
      }
    }
  };

  assert.equal(
    shouldRefreshTraceFromOperationStream('active-trace', payload, {
      operationId: 'existing-operation',
      eventType: 'dev.inspectr.operation.http.v1.updated',
      knownOperationIds: new Set(['existing-operation'])
    }),
    false
  );
  assert.equal(
    shouldRefreshTraceFromOperationStream('active-trace', payload, {
      operationId: 'new-operation',
      eventType: 'dev.inspectr.operation.http.v1.updated',
      knownOperationIds: new Set(['existing-operation'])
    }),
    true
  );
  assert.equal(
    shouldRefreshTraceFromOperationStream('active-trace', payload, {
      operationId: 'existing-operation',
      eventType: 'dev.inspectr.operation.http.v1.completed',
      knownOperationIds: new Set(['existing-operation'])
    }),
    true
  );
});
