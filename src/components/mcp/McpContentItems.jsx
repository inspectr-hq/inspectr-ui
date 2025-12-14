// src/components/mcp/McpContentItems.jsx
import React from 'react';
import { Badge } from '@tremor/react';
import StructuredBlock from './StructuredBlock.jsx';
import ResourceOutput from './ResourceOutput.jsx';

const AnnotationBadges = ({ annotations }) => {
  if (!annotations || typeof annotations !== 'object') return null;
  const { audience, priority, lastModified } = annotations;
  const chips = [];
  if (Array.isArray(audience) && audience.length) {
    chips.push(
      <Badge key="audience" color="slate" size="xs">
        audience: {audience.join(', ')}
      </Badge>
    );
  }
  if (priority !== undefined) {
    chips.push(
      <Badge key="priority" color="slate" size="xs">
        priority: {priority}
      </Badge>
    );
  }
  if (lastModified) {
    chips.push(
      <Badge key="lastModified" color="slate" size="xs">
        modified: {lastModified}
      </Badge>
    );
  }
  if (!chips.length) return null;
  return <div className="flex flex-wrap gap-2">{chips}</div>;
};

const dataUri = (mimeType, data) => {
  if (!data) return '';
  return `data:${mimeType || 'application/octet-stream'};base64,${data}`;
};

const ContentItem = ({ item, index }) => {
  const keyLabel = `Item ${index + 1}`;
  switch (item?.type) {
    case 'text':
      return (
        <div className="space-y-1 rounded-tremor-small border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {keyLabel} · Text
            </div>
            <AnnotationBadges annotations={item.annotations} />
          </div>
          <pre className="whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-dark-tremor-content">
            {item.text || '[empty text]'}
          </pre>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2 rounded-tremor-small border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {keyLabel} · Image
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.mimeType ? (
                <Badge color="slate" size="xs">
                  {item.mimeType}
                </Badge>
              ) : null}
              <AnnotationBadges annotations={item.annotations} />
            </div>
          </div>
          {item.data ? (
            <img
              src={dataUri(item.mimeType, item.data)}
              alt={item.description || 'MCP image content'}
              className="max-h-64 w-auto rounded"
            />
          ) : (
            <div className="text-sm text-slate-600 dark:text-dark-tremor-content">
              No image data provided.
            </div>
          )}
        </div>
      );
    case 'audio':
      return (
        <div className="space-y-1 rounded-tremor-small border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {keyLabel} · Audio
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.mimeType ? (
                <Badge color="slate" size="xs">
                  {item.mimeType}
                </Badge>
              ) : null}
              <AnnotationBadges annotations={item.annotations} />
            </div>
          </div>
          {item.data ? (
            <audio controls className="w-full">
              <source src={dataUri(item.mimeType, item.data)} type={item.mimeType || 'audio/wav'} />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="text-sm text-slate-600 dark:text-dark-tremor-content">
              No audio data provided.
            </div>
          )}
        </div>
      );
    case 'resource_link':
      return (
        <div className="space-y-1 rounded-tremor-small border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {keyLabel} · Resource link
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.mimeType ? (
                <Badge color="slate" size="xs">
                  {item.mimeType}
                </Badge>
              ) : null}
              <AnnotationBadges annotations={item.annotations} />
            </div>
          </div>
          <div className="space-y-1 text-sm text-slate-800 dark:text-dark-tremor-content">
            <div className="font-semibold">{item.name || item.title || 'Unnamed resource'}</div>
            <div className="break-all text-xs text-slate-600 dark:text-dark-tremor-content">
              {item.uri || 'No URI'}
            </div>
            {item.description ? (
              <div className="text-sm text-slate-700 dark:text-dark-tremor-content">
                {item.description}
              </div>
            ) : null}
          </div>
        </div>
      );
    case 'resource': {
      const resource = item.resource || item;
      return (
        <div className="space-y-2 rounded-tremor-small border border-slate-200 bg-white p-3 shadow-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dark-tremor-content">
              {keyLabel} · Resource
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {resource.mimeType ? (
                <Badge color="slate" size="xs">
                  {resource.mimeType}
                </Badge>
              ) : null}
              <AnnotationBadges annotations={resource.annotations || item.annotations} />
            </div>
          </div>
          <ResourceOutput resource={resource} mimeType={resource.mimeType} />
        </div>
      );
    }
    default:
      return (
        <StructuredBlock
          data={item}
          title={`${keyLabel} · ${item?.type || 'Unknown type'}`}
          copyText={JSON.stringify(item, null, 2)}
        />
      );
  }
};

const McpContentItems = ({ items = [] }) => {
  if (!Array.isArray(items) || !items.length) {
    return (
      <div className="text-sm text-slate-500 dark:text-dark-tremor-content">
        No content items returned.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <ContentItem key={idx} item={item} index={idx} />
      ))}
    </div>
  );
};

export default McpContentItems;
