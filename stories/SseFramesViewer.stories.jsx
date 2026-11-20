import React from 'react';
import SseFramesViewer from '../src/components/operations/SseFramesViewer.jsx';

const frames = [
  {
    id: 'evt_01JH_CHECKOUT_001',
    event: 'checkout.started',
    timestamp: '2026-01-15T11:58:00.125Z',
    data: JSON.stringify({ checkout_id: 'chk_8f31', status: 'started', region: 'eu-west' })
  },
  {
    id: 'evt_01JH_CHECKOUT_002',
    event: 'checkout.item_added',
    timestamp: '2026-01-15T11:58:02.810Z',
    data: JSON.stringify({ checkout_id: 'chk_8f31', sku: 'linen-shirt', quantity: 2 })
  },
  {
    id: 'evt_01JH_CHECKOUT_003',
    event: 'checkout.payment_pending',
    timestamp: '2026-01-15T11:58:04.092Z',
    data: JSON.stringify({ checkout_id: 'chk_8f31', payment_id: 'pay_24cd', amount: 8490 })
  },
  {
    id: 'evt_01JH_CHECKOUT_004',
    event: 'checkout.completed',
    timestamp: '2026-01-15T11:58:05.744Z',
    data: JSON.stringify({ checkout_id: 'chk_8f31', status: 'complete', response_code: 201 })
  }
];

const longPayload = JSON.stringify({
  checkout_id: 'chk_8f31',
  customer: { id: 'cus_2048', region: 'eu-west', tier: 'business' },
  items: Array.from({ length: 8 }, (_, index) => ({
    sku: `item-${String(index + 1).padStart(2, '0')}`,
    quantity: index + 1,
    unit_price: 1299 + index * 100
  })),
  metadata: { source: 'checkout-api', retryable: false, request_id: 'req_4a9f' }
});

const FrameStage = ({ children }) => (
  <div
    className={[
      'h-[560px] rounded-lg border border-slate-200 bg-white p-4',
      'dark:border-slate-800 dark:bg-gray-950'
    ].join(' ')}
  >
    {children}
  </div>
);

export default {
  title: 'Components/Operations/SseFramesViewer',
  component: SseFramesViewer,
  parameters: { layout: 'padded' }
};

export const RepresentativeStream = () => (
  <FrameStage>
    <SseFramesViewer frames={frames} />
  </FrameStage>
);

export const EmptyFrames = () => (
  <FrameStage>
    <SseFramesViewer frames={[]} />
  </FrameStage>
);

export const MalformedPayload = () => (
  <FrameStage>
    <SseFramesViewer
      frames={[
        {
          id: 'evt_malformed_01',
          event: 'operation.warning',
          timestamp: '2026-01-15T11:58:05.744Z',
          data: '{"operation_id":"op_7f2a", "warning":'
        }
      ]}
    />
  </FrameStage>
);

export const LongJsonPayload = () => (
  <FrameStage>
    <SseFramesViewer
      frames={[
        {
          id: 'evt_large_payload_01',
          event: 'checkout.snapshot',
          timestamp: '2026-01-15T11:58:05.744Z',
          data: longPayload
        }
      ]}
    />
  </FrameStage>
);

export const HighVolumeStream = () => (
  <FrameStage>
    <SseFramesViewer
      frames={Array.from({ length: 80 }, (_, index) => ({
        id: `evt_01JH_STREAM_${String(index + 1).padStart(3, '0')}`,
        event: index % 2 === 0 ? 'operation.progress' : 'operation.heartbeat',
        timestamp: new Date(Date.UTC(2026, 0, 15, 12, 0, index)).toISOString(),
        data: JSON.stringify({ operation_id: 'op_8b21', sequence: index + 1, progress: index + 1 })
      }))}
    />
  </FrameStage>
);
