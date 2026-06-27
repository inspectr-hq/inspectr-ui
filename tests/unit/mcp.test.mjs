import test from 'node:test';
import assert from 'node:assert/strict';

import { isMcpOperation } from '../../src/utils/mcp.js';

test('isMcpOperation detects MCP metadata when top-level meta also exists', () => {
  assert.equal(
    isMcpOperation({
      meta: { tags: ['service.api'] },
      raw: {
        meta: {
          mcp: {
            method: 'tools/list',
            category: 'tool'
          }
        }
      }
    }),
    true
  );
});

test('isMcpOperation detects nested trace MCP metadata across meta sources', () => {
  assert.equal(
    isMcpOperation({
      meta: { tags: ['service.api'] },
      raw: {
        meta: {
          trace: {
            mcp: {
              method: 'tools/call',
              name: 'inspectr_get_operation'
            }
          }
        }
      }
    }),
    true
  );
});

test('isMcpOperation returns false when no MCP signal exists', () => {
  assert.equal(
    isMcpOperation({
      meta: { tags: ['service.api'] },
      raw: { meta: { trace: { source: 'inspectr-directive' } } }
    }),
    false
  );
});
