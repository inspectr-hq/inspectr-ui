// src/components/mcp/ResourceOutput.jsx

import React from 'react';
import { Text } from '@tremor/react';
import Editor from '@monaco-editor/react';
import StructuredBlock from './StructuredBlock.jsx';
import { defineMonacoThemes, getMonacoTheme } from '../../utils/monacoTheme.js';
import { getMimeLanguage } from '../../utils/mcp.js';

const renderMarkdownPreview = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('#')) {
      flushList();
      const depth = Math.min(trimmed.match(/^#+/)?.[0]?.length || 1, 6);
      const content = trimmed.replace(/^#+\s*/, '') || trimmed;
      blocks.push(
        <div
          key={`h-${blocks.length}`}
          className={`font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong ${depth <= 2 ? 'text-base' : 'text-sm'}`}
        >
          {content}
        </div>
      );
      return;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
      return;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm">
        {trimmed}
      </p>
    );
  });
  flushList();
  return (
    <div className="space-y-1 text-tremor-content dark:text-dark-tremor-content">{blocks}</div>
  );
};

const htmlTextPreview = (html) => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html || '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    return doc.body.textContent || html || '';
  } catch {
    return html || '';
  }
};

const ResourceOutput = ({ resource, mimeType, editorOptions }) => {
  if (typeof resource?.text === 'string') {
    return (
      <>
        {(mimeType || '').includes('markdown') ? (
          <div className="rounded-tremor-small border border-slate-200 bg-tremor-background-subtle p-3 text-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            {renderMarkdownPreview(resource.text) || (
              <div className="text-tremor-content-subtle dark:text-dark-tremor-content">
                Unable to render markdown preview.
              </div>
            )}
          </div>
        ) : null}
        {(mimeType || '').includes('html') ? (
          <div className="rounded-tremor-small border border-slate-200 bg-tremor-background-subtle p-3 text-sm dark:border-dark-tremor-border dark:bg-dark-tremor-background-subtle">
            <Text className="text-xs font-semibold uppercase tracking-wide text-tremor-content-subtle dark:text-dark-tremor-content">
              HTML (text-only preview)
            </Text>
            <p className="mt-1 text-sm text-tremor-content dark:text-dark-tremor-content">
              {htmlTextPreview(resource.text)}
            </p>
          </div>
        ) : null}
        <Editor
          value={resource.text}
          language={getMimeLanguage(mimeType)}
          theme={getMonacoTheme()}
          beforeMount={defineMonacoThemes}
          options={editorOptions}
          height="240px"
        />
      </>
    );
  }

  return <StructuredBlock data={resource} />;
};

export default ResourceOutput;
