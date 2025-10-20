// src/components/settings/SettingsMcpInfo.jsx
import React, { useEffect, useState } from 'react';
import { Divider, List, ListItem } from '@tremor/react';
import useFeaturePreview from '../../hooks/useFeaturePreview.jsx';
import { useInspectr } from '../../context/InspectrContext';
import BadgeIndicator from '../BadgeIndicator.jsx';
import CopyButton from '../CopyButton.jsx';

export default function SettingsMcpInfo() {
  const { client } = useInspectr();
  const [mcpFeatureEnabled] = useFeaturePreview('feat_export_mcp_server');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!mcpFeatureEnabled) return;
      try {
        setError(null);
        const data = await client.service.getInfo();
        setInfo(data);
      } catch (err) {
        console.error('Info error', err);
        setError(err.message || 'Failed to load service info');
      }
    };
    load();
  }, [client, mcpFeatureEnabled]);

  if (!mcpFeatureEnabled) return null;

  const mcp = info?.mcp || {};
  const mcpAuth = mcp?.auth || {};

  return (
    <>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            MCP Server (Preview)
          </h2>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Connection details for the built-in MCP server for Inspectr.
          </p>
        </div>
        <div className="sm:max-w-3xl md:col-span-2">
          {!info && !error && <p className="mt-2 text-tremor-default">Loading…</p>}
          {error && (
            <p className="mt-2 text-tremor-default text-red-600 dark:text-red-400">{error}</p>
          )}
          <List className="mt-4 divide-y divide-tremor-border dark:divide-dark-tremor-border">
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                URL
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-tremor-content dark:text-dark-tremor-content break-all">
                  {mcp?.url || '-'}
                </span>
                {mcp?.url && <CopyButton textToCopy={mcp.url} showLabel={false} />}
              </div>
            </ListItem>
            <ListItem className="py-3 flex justify-between">
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Protocol
              </span>
              <span className="text-tremor-content dark:text-dark-tremor-content">
                {mcp?.protocol || '-'}
              </span>
            </ListItem>
            {/*<ListItem className="py-3 flex justify-between">*/}
            {/*  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">*/}
            {/*    Authentication*/}
            {/*  </span>*/}
            {/*  <div className="flex items-center space-x-2">*/}
            {/*    <BadgeIndicator variant={mcpAuth?.required ? 'success' : 'neutral'}>*/}
            {/*      {mcpAuth?.required ? 'Required' : 'Optional'}*/}
            {/*    </BadgeIndicator>*/}
            {/*    <span className="text-tremor-content dark:text-dark-tremor-content">*/}
            {/*      {mcpAuth?.scheme ? mcpAuth.scheme.toUpperCase() : '-'}*/}
            {/*    </span>*/}
            {/*    {mcpAuth?.header && (*/}
            {/*      <span className="text-tremor-content dark:text-dark-tremor-content">*/}
            {/*        via {mcpAuth.header}*/}
            {/*      </span>*/}
            {/*    )}*/}
            {/*  </div>*/}
            {/*</ListItem>*/}
            {/*<ListItem className="py-3 flex justify-between">*/}
            {/*  <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">*/}
            {/*    Token*/}
            {/*  </span>*/}
            {/*  <div className="flex items-center space-x-2">*/}
            {/*    <span className="text-tremor-content dark:text-dark-tremor-content break-all font-mono">*/}
            {/*      {showToken ? mcpAuth?.token || '-' : mcpAuth?.token ? '••••••••••' : '-'}*/}
            {/*    </span>*/}
            {/*    {mcpAuth?.token && (*/}
            {/*      <>*/}
            {/*        <CopyButton textToCopy={mcpAuth.token} showLabel={false} />*/}
            {/*        <button*/}
            {/*          type="button"*/}
            {/*          onClick={() => setShowToken((s) => !s)}*/}
            {/*          className="text-xs text-blue-600 hover:underline"*/}
            {/*        >*/}
            {/*          {showToken ? 'Hide' : 'Show'}*/}
            {/*        </button>*/}
            {/*      </>*/}
            {/*    )}*/}
            {/*  </div>*/}
            {/*</ListItem>*/}
          </List>
        </div>
      </div>
      <Divider className="my-10" />
    </>
  );
}
