// src/components/RequestDetailsPanel.jsx
import React, { useState, useEffect } from 'react';
import RequestDetail from './RequestDetail';
import RequestContent from './RequestContent';
import ResponseContent from './ResponseContent';
import Terminal from './Terminal';
import { RiExternalLinkLine } from "@remixicon/react";


const RequestDetailsPanel = ({ operation, currentTab, setCurrentTab }) => {
  const [ingressEndpoint, setIngressEndpoint] = useState('');
  const [proxyEndpoint, setProxyEndpoint] = useState('');
  const [expose, setExpose] = useState(false);

  useEffect(() => {
    // Get the endpoints and expose setting from localStorage
    const ingressEndpointValue = localStorage.getItem('ingressEndpoint');
    const proxyEndpointValue = localStorage.getItem('proxyEndpoint');
    const exposeValue = localStorage.getItem('expose');

    if (ingressEndpointValue) {
      setIngressEndpoint(ingressEndpointValue);
    }
    if (proxyEndpointValue) {
      setProxyEndpoint(proxyEndpointValue);
    }
    if (exposeValue) {
      setExpose(exposeValue === 'true');
    }
  }, []);
  if (!operation) {
    return (
      <div className="h-96 min-h-full mb-20 flex flex-1 flex-col justify-center rounded-tremor-default border border-tremor-border bg-tremor-background-muted px-6 py-10 dark:border-dark-tremor-border dark:bg-dark-tremor-background-muted">
        <div className="mx-auto text-center">
          <h4 className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong font-[Inter] font-sans">
            Request Inspectr
          </h4>
          <p
            className="mt-3 max-w-xl text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content sm:text-base">
            Select a request from the list to view its details</p>
          <p
            className="max-w-xl text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content sm:text-base">
            or get started by making a request
            to {expose ? (ingressEndpoint ? `"${ingressEndpoint}"` : 'the ingress endpoint') : (proxyEndpoint ? `"${proxyEndpoint}"` : 'the proxy endpoint')}.
          </p>

          <Terminal endpoint={expose ? ingressEndpoint : proxyEndpoint} showCopyButton={true} />

          <div className="mt-8 sm:flex sm:items-center sm:justify-center sm:gap-x-3">
            <button
              type="button"
              className="w-full whitespace-nowrap rounded-tremor-small bg-tremor-brand px-4 py-2 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis sm:w-fit"
            >
              View Documentation
            </button>
            <a
              href="https://inspectr.dev"
              target="_blank"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-tremor-small border border-tremor-border bg-tremor-background px-3 py-2 text-tremor-default font-medium text-tremor-brand shadow-tremor-input hover:text-tremor-brand-emphasis dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-brand dark:shadow-dark-tremor-input hover:dark:text-dark-tremor-brand-emphasis sm:mt-0 sm:w-fit"
            >
              Visit Website
              <RiExternalLinkLine
                className="size-5 shrink-0"
                aria-hidden={true}
              />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RequestDetail operation={operation} />

      {/* Tabs for Request and Response */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-t ${
            currentTab === 'request' 
              ? 'bg-blue-600 dark:bg-blue-700 text-white' 
              : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
          }`}
          onClick={() => setCurrentTab('request')}
        >
          Request
        </button>
        <button
          className={`px-4 py-2 rounded-t ${
            currentTab === 'response' 
              ? 'bg-blue-600 dark:bg-blue-700 text-white' 
              : 'bg-gray-200 dark:bg-dark-tremor-background-subtle text-gray-700 dark:text-dark-tremor-content'
          }`}
          onClick={() => setCurrentTab('response')}
        >
          Response
        </button>
      </div>

      {/* Tab Content */}
      <div
        className="p-4 bg-white dark:bg-dark-tremor-background border border-gray-300 dark:border-dark-tremor-border rounded-b shadow dark:shadow-dark-tremor-shadow flex-grow overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 270px - 64px)' }}
      >
        {currentTab === 'request' ? (
          <RequestContent operation={operation} />
        ) : (
          <ResponseContent operation={operation} />
        )}
      </div>
    </div>
  );
};

export default RequestDetailsPanel;
