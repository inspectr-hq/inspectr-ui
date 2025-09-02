// src/components/UsageApp.jsx
import React, { useEffect, useState } from 'react';
import opsIcon from '../assets/icons/operations.svg';
import connIcon from '../assets/icons/connections.svg';
import mcpIcon from '../assets/icons/mcp.svg';
import toolsIcon from '../assets/icons/tools.svg';
import resourcesIcon from '../assets/icons/resources.svg';
import promptsIcon from '../assets/icons/prompts.svg';
import { Card, Title, Text, Metric, ProgressBar, BarList, Button } from '@tremor/react';
import useFeaturePreview from '../hooks/useFeaturePreview.jsx';
import { useInspectr } from '../context/InspectrContext';

const UsageApp = () => {
  const { client } = useInspectr();
  const [mcpFeatureEnabled] = useFeaturePreview('feat_export_mcp_server');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const loadMetrics = React.useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        else setRefreshing(true);
        const data = await client.service.getMetrics();
        setMetrics(data);
        setError('');
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err.message || 'Failed to load metrics');
      } finally {
        if (isInitial) setLoading(false);
        else setRefreshing(false);
      }
    },
    [client]
  );

  useEffect(() => {
    loadMetrics(true);
  }, [loadMetrics]);

  // Derived values used by hooks must be declared before any early returns
  const operations = metrics?.operations || {};
  const connections = metrics?.generic?.totals?.sse || {};
  const mcpTotals = metrics?.generic?.totals?.mcp || {};
  const featuresTotals = metrics?.generic?.totals?.features || {};
  const featuresRaw = metrics?.features || {};
  const mcp = metrics?.mcp || {};
  const mcpLicensed = mcp?.licensed;
  const usageLimit = mcpLicensed === false && typeof mcp.limit === 'number' ? mcp.limit : null;
  const mcpUsed = typeof mcpTotals.requests === 'number' ? mcpTotals.requests : 0;
  const mcpPercent = usageLimit ? Math.min(100, (mcpUsed / usageLimit) * 100) : 0;
  const planKey = (() => {
    const plan = (mcp?.plan || '').toString().toLowerCase();
    if (plan === 'pro') return 'pro';
    if (['open_source', 'open-source', 'opensource', 'oss'].includes(plan)) return 'open_source';
    return mcpLicensed ? 'pro' : 'open_source';
  })();
  const planName = planKey === 'pro' ? 'Pro plan' : 'Open Source plan';
  const planLabel = planKey === 'pro' ? 'Pro' : 'Open Source';
  const planBadgeClass =
    planKey === 'pro'
      ? 'bg-brand-primary text-gray-900 '
      : 'bg-white dark:bg-gray-800/10 border border-brand-primary text-brand-primary';

  // Installed at -> "Usage metrics since <date>"
  const installedSinceText = (() => {
    const iso = metrics?.meta?.installed_at;
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  })();

  // Keep hooks above early returns to satisfy React's Rules of Hooks
  useEffect(() => {
    // Show upgrade box only when explicitly not licensed; allow temporary dismiss for this session
    if (!metrics) return;
    setShowUpgrade(mcpLicensed === false);
  }, [mcpLicensed, metrics]);

  if (loading) {
    return (
      <Card className="p-6">
        <Title>Usage Overview</Title>
        <Text className="mt-2">Loading usage…</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Title>Usage Overview</Title>
        <Text className="mt-2 text-red-600 dark:text-red-400">Error loading metrics: {error}</Text>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <header>
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Usage Overview
          </h3>
          <div className="mt-2 sm:mt-0">
            <Button onClick={() => loadMetrics(false)}>{refreshing ? 'Loading' : 'Refresh'}</Button>
          </div>
        </div>
      </header>
      {/* Current plan banner */}
      <div className="rounded-lg bg-gray-200 p-6 ring-1 ring-inset ring-gray-200 dark:bg-gray-400/10 dark:ring-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          This workspace is currently on{' '}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${planBadgeClass}`}
          >
            {planLabel}
          </span>
        </h4>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          {planKey === 'pro'
            ? "You're on Pro — enjoy premium features and priority support."
            : 'Boost your analytics and unlock advanced features with our premium plans.'}
          <a
            href="https://inspectr.dev/pricing"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-500"
          >
            {planKey === 'pro' ? 'Explore features' : 'Compare plans'}
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              aria-hidden="true"
              className="remixicon size-4 shrink-0"
            >
              <path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path>
            </svg>
          </a>
        </p>
      </div>
      {installedSinceText && (
        <Text className="-mt-2 text-sm text-gray-500">
          Usage metrics since {installedSinceText}
        </Text>
      )}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <img
            src={opsIcon}
            width={24}
            height={24}
            alt=""
            aria-hidden="true"
            className="inline-block"
          />
          <Title className="!mb-0">Operations</Title>
        </div>
        <Text className="mt-1 text-gray-500">
          Metrics on requests, responses, and events handled by Inspectr.
        </Text>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <Text>Total requests</Text>
            <Metric>
              {operations.total_requests ??
                (operations.requests_local ?? 0) + (operations.requests_ingress ?? 0)}
            </Metric>
            <div className="mt-3">
              <BarList
                data={[
                  { name: 'proxy', value: operations.requests_local ?? 0, color: 'cyan' },
                  { name: 'ingress', value: operations.requests_ingress ?? 0, color: 'yellow' }
                ]}
              />
            </div>
          </div>
          <div>
            <Text>Total responses</Text>
            <Metric>
              {operations.total_responses ??
                (operations.responses_local ?? 0) + (operations.responses_ingress ?? 0)}
            </Metric>
            <div className="mt-3">
              <BarList
                data={[
                  { name: 'proxy', value: operations.responses_local ?? 0, color: 'cyan' },
                  { name: 'ingress', value: operations.responses_ingress ?? 0, color: 'yellow' }
                ]}
              />
            </div>
          </div>
          <div>
            <Text>Event frames</Text>
            <Metric>
              {operations.total_event_frames ??
                (operations.event_frames_local ?? 0) + (operations.event_frames_ingress ?? 0)}
            </Metric>
            <div className="mt-3">
              <BarList
                data={[
                  { name: 'proxy', value: operations.event_frames_local ?? 0, color: 'cyan' },
                  {
                    name: 'ingress',
                    value: operations.event_frames_ingress ?? 0,
                    color: 'yellow'
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <img
            src={opsIcon}
            width={24}
            height={24}
            alt=""
            aria-hidden="true"
            className="inline-block"
          />
          <Title className="!mb-0">Features</Title>
        </div>
        <Text className="mt-1 text-gray-500">Usage metrics for core Inspectr features.</Text>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Registrations
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {featuresTotals.registrations ?? featuresRaw.registration_requests ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Token refresh
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {featuresTotals.token_refresh ?? featuresRaw.token_refresh_requests ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Launches
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {featuresTotals.launches ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Ingress registrations
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {featuresTotals.ingress_registrations ?? 0}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <img
            src={connIcon}
            width={24}
            height={24}
            alt=""
            aria-hidden="true"
            className="inline-block"
          />
          <Title className="!mb-0">Inspectr Connections</Title>
        </div>
        <Text className="mt-1 text-gray-500">
          Overview of metrics related to the Inspectr App SSE connections to Inspectr.
        </Text>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Active connections
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {connections.active ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Reconnect attempts
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {connections.reconnect_attempts ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Total connections
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {connections.total_connections ?? 0}
            </p>
          </div>
          <div>
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              Total disconnections
            </p>
            <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {connections.total_disconnections ?? 0}
            </p>
          </div>
        </div>
      </Card>

      {mcpFeatureEnabled && (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <img
              src={mcpIcon}
              width={24}
              height={24}
              alt=""
              aria-hidden="true"
              className="inline-block"
            />
            <Title className="!mb-0">Inspectr MCP Server</Title>
          </div>
          <Text className="mt-1 text-gray-500">
            Overview of Model Context Protocol (MCP) activity on the Inspectr MCP server, including
            usage across tools, resources, and prompts.
          </Text>
          {!mcpLicensed && showUpgrade && (
            <div className="mt-4 rounded-md bg-gray-50 p-6 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Want to upgrade?
              </h4>
              <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                Elevate your workspace and boost productivity with premium features. See our pro
                plans and upgrade today.
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <a
                  href="https://inspectr.dev/pricing"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-center text-sm font-medium shadow-sm transition-all duration-100 ease-in-out disabled:pointer-events-none disabled:shadow-none outline outline-offset-2 outline-0 focus-visible:outline-2 outline-blue-500 dark:outline-blue-500 border-transparent text-white dark:text-white bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:bg-blue-300 disabled:text-white disabled:dark:bg-blue-800 disabled:dark:text-blue-400"
                >
                  Plans
                </a>
                <button
                  type="button"
                  className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-center text-sm font-medium shadow-sm transition-all duration-100 ease-in-out disabled:pointer-events-none disabled:shadow-none outline outline-offset-2 outline-0 focus-visible:outline-2 outline-blue-500 dark:outline-blue-500 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-50 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/60 disabled:text-gray-400 disabled:dark:text-gray-600"
                  onClick={() => setShowUpgrade(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {usageLimit && (
            <div className="mt-6">
              <Text className="mb-2">Remaining usage</Text>
              <ProgressBar value={mcpPercent} color="blue" />
              <Text className="mt-2">
                {mcpUsed} of {usageLimit} uses
              </Text>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group 1 (left): Artifacts */}
            <div className="grid grid-cols-1 gap-4">
              <h4 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Usage
              </h4>
              <div>
                <p className="flex items-center text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  <img
                    src={toolsIcon}
                    width={16}
                    height={16}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 mr-2"
                  />
                  Total tools
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {mcpTotals.tools ?? 0}
                </p>
              </div>
              <div>
                <p className="flex items-center text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  <img
                    src={resourcesIcon}
                    width={16}
                    height={16}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 mr-2"
                  />
                  Total resources
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {mcpTotals.resources ?? 0}
                </p>
              </div>
              <div>
                <p className="flex items-center text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  <img
                    src={promptsIcon}
                    width={16}
                    height={16}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 mr-2"
                  />
                  Total prompts
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {mcpTotals.prompts ?? 0}
                </p>
              </div>
            </div>

            {/* Group 2 (right): Traffic */}
            <div className="grid grid-cols-1 gap-4">
              <h4 className="text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Traffic
              </h4>
              <div>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  Total requests
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {mcpTotals.requests ?? 0}
                </p>
              </div>
              <div>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  Total responses
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {mcpTotals.responses ?? 0}
                </p>
              </div>
              <div>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                  Total all
                </p>
                <p className="font-semibold text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {(mcpTotals.requests ?? 0) +
                    (mcpTotals.responses ?? 0) +
                    (mcpTotals.tools ?? 0) +
                    (mcpTotals.resources ?? 0) +
                    (mcpTotals.prompts ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UsageApp;
