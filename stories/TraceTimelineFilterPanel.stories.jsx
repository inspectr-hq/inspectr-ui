import React, { useState } from 'react';
import TraceTimelineFilterPanel from '../src/components/tracing/TraceTimelineFilterPanel.jsx';

const FilterPanelStory = ({ initialFilters = {}, hasMcpOperations = true }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [persistFilters, setPersistFilters] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 p-6 dark:bg-gray-950">
      <TraceTimelineFilterPanel
        isOpen
        onClose={() => {}}
        filters={filters}
        setFilters={setFilters}
        statusOptions={['200', '201', '202', '400', '500', '504']}
        methodOptions={['DELETE', 'GET', 'PATCH', 'POST', 'PUT']}
        tagOptions={['env:production', 'env:staging', 'team:checkout', 'source:webhook']}
        mcpToolOptions={['lookup_inventory', 'create_checkout']}
        mcpResourceOptions={['inventory://stock/eu-west']}
        mcpPromptOptions={['refund-review']}
        mcpCategoryOptions={['prompt', 'resource', 'tool']}
        mcpMethodOptions={['initialize', 'tools/call', 'tools/list']}
        hostOptions={['api.acme.test', 'hooks.acme.test', 'mcp.acme.test']}
        hasMcpOperations={hasMcpOperations}
        persistFilters={persistFilters}
        onPersistFiltersChange={setPersistFilters}
      />
      <pre className="ml-[440px] max-w-2xl overflow-auto rounded-lg bg-white p-4 text-xs dark:bg-slate-900">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
};

export default {
  title: 'Components/Tracing/TraceTimelineFilterPanel',
  component: TraceTimelineFilterPanel,
  parameters: { layout: 'fullscreen' }
};

export const HttpAndMcpFilters = () => <FilterPanelStory />;

export const ActiveFilters = () => (
  <FilterPanelStory
    initialFilters={{
      status: ['504'],
      method: ['GET'],
      path: '/v2/stock',
      tags: ['env:production'],
      durationMin: '500',
      host: ['inventory.acme.test'],
      mcpTool: ['lookup_inventory'],
      mcpCategory: ['tool'],
      tokenMin: '40'
    }}
  />
);

export const HttpOnlyFilters = () => <FilterPanelStory hasMcpOperations={false} />;
