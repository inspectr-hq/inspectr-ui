import React from 'react';
import RulesListPanel from '../src/components/rules/RulesListPanel.jsx';
import {
  mockEvents,
  mockRules,
  mockOperatorLabelMap,
  mockRulesLicenseUsage
} from './rulesMocks.js';

const action = () => () => {};

export default {
  title: 'Components/RulesListPanel',
  component: RulesListPanel
};

const Template = (args) => {
  const { meta: metaArgs, paginationAlwaysShow = false } = args;
  const [openRuleId, setOpenRuleId] = React.useState(args.openRuleId ?? null);
  const [currentPage, setCurrentPage] = React.useState(metaArgs?.page ?? 1);

  React.useEffect(() => {
    setOpenRuleId(args.openRuleId ?? null);
  }, [args.openRuleId]);

  React.useEffect(() => {
    setCurrentPage(metaArgs?.page ?? 1);
  }, [metaArgs?.page]);

  const handleToggle = (id) => {
    setOpenRuleId(id);
    action('onToggleRule')(id);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    action('onPageChange')(page);
  };

  return (
    <RulesListPanel
      {...args}
      meta={metaArgs ? { ...metaArgs, page: currentPage } : metaArgs}
      openRuleId={openRuleId}
      onToggleRule={handleToggle}
      onRefresh={args.onRefresh ?? action('onRefresh')}
      onCreateRule={args.onCreateRule ?? action('onCreateRule')}
      onStartFromTemplate={args.onStartFromTemplate ?? action('onStartFromTemplate')}
      onApplyHistory={args.onApplyHistory ?? action('onApplyHistory')}
      onEditRule={args.onEditRule ?? action('onEditRule')}
      onDeleteRule={args.onDeleteRule ?? action('onDeleteRule')}
      onDuplicateRule={args.onDuplicateRule ?? action('onDuplicateRule')}
      onPauseRule={args.onPauseRule ?? action('onPauseRule')}
      onExportRule={args.onExportRule ?? action('onExportRule')}
      onImportRule={args.onImportRule ?? action('onImportRule')}
      onPageChange={args.onPageChange ?? handlePageChange}
      paginationAlwaysShow={paginationAlwaysShow}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  rules: mockRules,
  events: mockEvents,
  loading: false,
  error: '',
  isRefreshing: false,
  actionsDisabled: false,
  operatorLabelMap: mockOperatorLabelMap,
  openRuleId: mockRules[0].id,
  meta: {
    total: 48,
    page: 1,
    limit: 20,
    total_pages: 3
  },
  licenseUsage: mockRulesLicenseUsage,
  paginationAlwaysShow: false
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  rules: [],
  loading: true,
  openRuleId: null,
  meta: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0
  }
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  ...Default.args,
  rules: [],
  error: 'Unable to load rules from the API.',
  loading: false,
  openRuleId: null,
  meta: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0
  }
};

export const EmptyState = Template.bind({});
EmptyState.args = {
  ...Default.args,
  rules: [],
  loading: false,
  error: '',
  openRuleId: null,
  meta: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0
  }
};

export const ManyPages = Template.bind({});
ManyPages.args = {
  ...Default.args,
  meta: {
    total: 95,
    page: 2,
    limit: 20,
    total_pages: 5
  }
};

export const LicenseLimitReached = Template.bind({});
LicenseLimitReached.args = {
  ...Default.args,
  licenseUsage: {
    used: 50,
    limit: 50
  }
};
