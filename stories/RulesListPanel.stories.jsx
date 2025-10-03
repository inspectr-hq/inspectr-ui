import React from 'react';
import { action } from '@storybook/addon-actions';
import RulesListPanel from '../src/components/RulesListPanel.jsx';
import {
  mockEvents,
  mockRules,
  mockOperatorLabelMap
} from './rulesMocks.js';

export default {
  title: 'Components/RulesListPanel',
  component: RulesListPanel
};

const Template = (args) => {
  const [openRuleId, setOpenRuleId] = React.useState(args.openRuleId ?? null);

  React.useEffect(() => {
    setOpenRuleId(args.openRuleId ?? null);
  }, [args.openRuleId]);

  const handleToggle = (id) => {
    setOpenRuleId(id);
    action('onToggleRule')(id);
  };

  return (
    <RulesListPanel
      {...args}
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
  openRuleId: mockRules[0].id
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  rules: [],
  loading: true,
  openRuleId: null
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  ...Default.args,
  rules: [],
  error: 'Unable to load rules from the API.',
  loading: false,
  openRuleId: null
};

export const EmptyState = Template.bind({});
EmptyState.args = {
  ...Default.args,
  rules: [],
  loading: false,
  error: '',
  openRuleId: null
};
