import React from 'react';
import { action } from '@storybook/addon-actions';
import RulesBuilderPanel from '../src/components/rules/RulesBuilderPanel.jsx';
import {
  mockActionsCatalog,
  mockEvents,
  mockOperatorOptions,
  createMockBuilderForm
} from './rulesMocks.js';
import { buildActionState } from '../src/utils/rulesHelpers.js';

const reorder = (items, fromIndex, toIndex) => {
  const copy = items.slice();
  const start = Math.max(0, Math.min(fromIndex, copy.length - 1));
  const target = Math.max(0, Math.min(toIndex, copy.length - 1));
  const [removed] = copy.splice(start, 1);
  copy.splice(target, 0, removed);
  return copy;
};

const Template = (args) => {
  const cloneForm = React.useCallback((form) => JSON.parse(JSON.stringify(form)), []);
  const [form, setForm] = React.useState(() => cloneForm(args.form ?? createMockBuilderForm()));

  React.useEffect(() => {
    setForm(cloneForm(args.form ?? createMockBuilderForm()));
  }, [args.form, cloneForm]);

  const defaultOperator = args.operatorOptions?.[0]?.value ?? '==';

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    action('onFieldChange')(field, value);
  };

  const handleConditionChange = (index, field, value) => {
    setForm((prev) => {
      const next = prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      );
      return { ...prev, conditions: next };
    });
    action('onConditionChange')(index, field, value);
  };

  const handleAddCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { path: '', operator: defaultOperator, value: '', valueType: 'string' }
      ]
    }));
    action('onAddCondition')();
  };

  const handleRemoveCondition = (index) => {
    setForm((prev) => {
      if (prev.conditions.length === 1) return prev;
      return {
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index)
      };
    });
    action('onRemoveCondition')(index);
  };

  const handleMoveCondition = (fromIndex, toIndex) => {
    setForm((prev) => ({
      ...prev,
      conditions: reorder(prev.conditions, fromIndex, toIndex)
    }));
    action('onMoveCondition')(fromIndex, toIndex);
  };

  const handleActionTypeChange = (actionId, nextType) => {
    const definition = args.actionsCatalog.find((item) => item.type === nextType);
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action) => {
        if (action.id !== actionId) return action;
        if (!definition) return { ...action, type: nextType };
        const defaults = buildActionState(definition);
        return { ...action, type: nextType, params: defaults.params };
      })
    }));
    action('onActionTypeChange')(actionId, nextType);
  };

  const handleActionParamChange = (actionId, paramName, value) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action) =>
        action.id === actionId
          ? { ...action, params: { ...action.params, [paramName]: value } }
          : action
      )
    }));
    action('onActionParamChange')(actionId, paramName, value);
  };

  const handleAddAction = () => {
    setForm((prev) => {
      const definition = args.actionsCatalog[0];
      const created = definition ? buildActionState(definition) : { id: `generated-${Date.now()}`, type: '', params: {} };
      return { ...prev, actions: [...prev.actions, created] };
    });
    action('onAddAction')();
  };

  const handleRemoveAction = (actionId) => {
    setForm((prev) => {
      if (prev.actions.length === 1) return prev;
      return { ...prev, actions: prev.actions.filter((action) => action.id !== actionId) };
    });
    action('onRemoveAction')(actionId);
  };

  const handleMoveAction = (actionId, toIndex) => {
    setForm((prev) => {
      const index = prev.actions.findIndex((action) => action.id === actionId);
      if (index === -1) return prev;
      return { ...prev, actions: reorder(prev.actions, index, toIndex) };
    });
    action('onMoveAction')(actionId, toIndex);
  };

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    action('onSubmit')(form);
  };

  const handleReset = () => {
    const resetForm = createMockBuilderForm();
    setForm(cloneForm(resetForm));
    action('onReset')();
  };

  return (
    <RulesBuilderPanel
      {...args}
      form={form}
      onFieldChange={handleFieldChange}
      onConditionChange={handleConditionChange}
      onAddCondition={handleAddCondition}
      onRemoveCondition={handleRemoveCondition}
      onMoveCondition={handleMoveCondition}
      onActionTypeChange={handleActionTypeChange}
      onActionParamChange={handleActionParamChange}
      onAddAction={handleAddAction}
      onRemoveAction={handleRemoveAction}
      onMoveAction={handleMoveAction}
      onSubmit={handleSubmit}
      onReset={handleReset}
    />
  );
};

export default {
  title: 'Components/RulesBuilderPanel',
  component: RulesBuilderPanel
};

export const CreateRule = Template.bind({});
CreateRule.args = {
  form: createMockBuilderForm(),
  events: mockEvents,
  selectedEventDescription: mockEvents[0].description,
  actionsCatalog: mockActionsCatalog,
  isEditing: false,
  saving: false,
  formErrors: [],
  operatorOptions: mockOperatorOptions
};

const editingForm = createMockBuilderForm();
editingForm.name = 'Update watch list notification';
editingForm.active = false;
editingForm.priority = 12;
editingForm.conditions = editingForm.conditions.map((condition, index) =>
  index === 0
    ? { ...condition, path: 'operation.metadata.ip_country', operator: 'contains', value: 'CN', valueType: 'string' }
    : condition
);
editingForm.actions = editingForm.actions.map((action, index) =>
  index === 0
    ? { ...action, params: { ...action.params, tags: 'watch_list' } }
    : action
);

export const EditingRule = Template.bind({});
EditingRule.args = {
  ...CreateRule.args,
  form: editingForm,
  isEditing: true,
  formErrors: ['Condition 2 is missing a value.']
};

export const SavingState = Template.bind({});
SavingState.args = {
  ...CreateRule.args,
  saving: true
};
