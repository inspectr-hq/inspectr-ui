// src/components/operations/RequestDetailsPanel.jsx
import React, { useEffect, useState } from 'react';
import RequestDetail from './RequestDetail';
import RequestContent from './RequestContent';
import ResponseContent from './ResponseContent';
import MetaContent from './MetaContent.jsx';
import McpContent from './McpContent.jsx';
import Terminal from '../Terminal';
import { RiExternalLinkLine } from '@remixicon/react';
import useLocalStorage from '../../hooks/useLocalStorage.jsx';
import useOperationDetails from '../../hooks/useOperationDetails.jsx';

// CSS for fade-in effect
const fadeInStyle = {
  opacity: 1,
  visibility: 'visible',
  transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
};

const hiddenStyle = {
  opacity: 0,
  visibility: 'hidden',
  transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
};

const RequestDetailsPanel = ({ operation, currentTab, setCurrentTab }) => {
  const [ingressEndpoint, setIngressEndpoint] = useLocalStorage('ingressEndpoint', '');
  const [proxyEndpoint, setProxyEndpoint] = useLocalStorage('proxyEndpoint', '');
  const [exposeValue] = useLocalStorage('expose', 'false');
  const expose = exposeValue === 'true';
  const [isLoaded, setIsLoaded] = useState(false);
  const { detailOperation, fetchDetail, isFetching } = useOperationDetails(
    operation?.id,
    operation
  );
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const extractHeaders = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return Object.entries(input).map(([name, value]) => ({ name, value }));
  };

  const guardHeaders = extractHeaders(detailOperation?.meta?.inspectr?.guard);
  const directiveHeaders = extractHeaders(detailOperation?.meta?.inspectr?.directives);
  const hasInfo = guardHeaders.length > 0 || directiveHeaders.length > 0;
  const mcp = detailOperation?.meta?.mcp || null;
  const hasMcp = !!(
    mcp &&
    typeof mcp === 'object' &&
    Object.keys(mcp).some((k) => mcp[k] !== undefined)
  );
  const hasTags =
    Array.isArray(detailOperation?.meta?.tags) && detailOperation.meta.tags.length > 0;
  // Offset breakdown: request-detail bar (270px) + navbar (64px) = 334px base;
  // tags row adds an extra 48px when present → 382px.
  const contentHeightOffset = hasTags ? 382 : 334;
  const contentMaxHeight = `max(calc(100vh - ${contentHeightOffset}px), 22rem)`;

  useEffect(() => {
    if (!detailOperation) return;
    if (!hasInfo && currentTab === 'meta') {
      setCurrentTab('request');
    }
  }, [hasInfo, currentTab, setCurrentTab]);

  useEffect(() => {
    if (!detailOperation) return;
    if (!hasMcp && currentTab === 'mcp') {
      setCurrentTab('request');
    }
  }, [hasMcp, currentTab, setCurrentTab]);

  useEffect(() => {
    // Set isLoaded to true after a short delay to ensure CSS transitions work properly
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isFetching) {
      setIsManualRefresh(false);
    }
  }, [isFetching]);

  useEffect(() => {
    setIsManualRefresh(false);
  }, [operation?.id]);

  // Apply CSS-based solution to prevent flashing
  if (!operation) {
    return (
      <div
        className="h-96 min-h-full mb-20 flex flex-1 flex-col justify-center rounded-tremor-default border border-tremor-border bg-tremor-background-muted px-6 py-10 dark:border-dark-tremor-border dark:bg-dark-tremor-background-muted"
        style={isLoaded ? fadeInStyle : hiddenStyle}
      >
        <div className="mx-auto text-center">
          <h4 className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong font-[Inter] font-sans">
            Request Inspectr
          </h4>
          <p className="mt-3 max-w-xl text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content sm:text-base">
            Select a request from the list to view its details
          </p>
          <p className="max-w-xl text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content sm:text-base">
            or get started by making a request to{' '}
            {expose
              ? ingressEndpoint
                ? `"${ingressEndpoint}"`
                : 'the ingress endpoint'
              : proxyEndpoint
                ? `"${proxyEndpoint}"`
                : 'the proxy endpoint'}
            .
          </p>

          <Terminal endpoint={expose ? ingressEndpoint : proxyEndpoint} showCopyButton={true} />

          <div className="mt-8 sm:flex sm:items-center sm:justify-center sm:gap-x-3">
            <a
              href="https://inspectr.dev/docs"
              target="_blank"
              className="w-full whitespace-nowrap rounded-tremor-small bg-tremor-brand px-4 py-2 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis sm:w-fit"
            >
              View Documentation
            </a>
            <a
              href="https://inspectr.dev"
              target="_blank"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-tremor-small border border-tremor-border bg-tremor-background px-3 py-2 text-tremor-default font-medium text-tremor-brand shadow-tremor-input hover:text-tremor-brand-emphasis dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-brand dark:shadow-dark-tremor-input hover:dark:text-dark-tremor-brand-emphasis sm:mt-0 sm:w-fit"
            >
              Visit Website
              <RiExternalLinkLine className="size-5 shrink-0" aria-hidden={true} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!detailOperation) {
    return null;
  }

  return (
    <div
      className="relative flex flex-col h-full min-h-0"
      style={isLoaded ? fadeInStyle : hiddenStyle}
    >
      <RequestDetail
        operation={detailOperation}
        setCurrentTab={setCurrentTab}
        onRefresh={() => {
          if (!operation?.id) return;
          setIsManualRefresh(true);
          fetchDetail(operation.id, { force: true });
        }}
        isRefreshing={isFetching && isManualRefresh}
      />

      {/* Tabs for Request, Response */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-1 text-base rounded-t ${
            currentTab === 'request'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
          }`}
          onClick={() => setCurrentTab('request')}
        >
          Request
        </button>
        <button
          className={`px-4 py-1 text-base rounded-t ${
            currentTab === 'response'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
          }`}
          onClick={() => setCurrentTab('response')}
        >
          Response
        </button>
        {hasInfo && (
          <button
            className={`px-4 py-1 text-base rounded-t ${
              currentTab === 'meta'
                ? 'bg-teal-600 dark:bg-teal-700 text-white'
                : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
            }`}
            onClick={() => setCurrentTab('meta')}
          >
            Info
          </button>
        )}
        {hasMcp && (
          <button
            className={`px-4 py-1 text-base rounded-t ${
              currentTab === 'mcp'
                ? 'bg-sky-500 dark:bg-sky-800 text-white'
                : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
            }`}
            onClick={() => setCurrentTab('mcp')}
          >
            MCP
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div
        className="p-4 bg-white dark:bg-dark-tremor-background border border-gray-300 dark:border-dark-tremor-border rounded-b shadow dark:shadow-dark-tremor-shadow flex-1 min-h-0 overflow-y-auto"
        style={{
          ...(isLoaded ? fadeInStyle : hiddenStyle),
          maxHeight: contentMaxHeight
        }}
      >
        {currentTab === 'request' ? (
          <RequestContent operation={detailOperation} />
        ) : currentTab === 'response' ? (
          <ResponseContent operation={detailOperation} />
        ) : currentTab === 'meta' && hasInfo ? (
          <MetaContent operation={detailOperation} />
        ) : currentTab === 'mcp' ? (
          <McpContent operation={detailOperation} />
        ) : null}
      </div>
    </div>
  );
};

export default RequestDetailsPanel;
