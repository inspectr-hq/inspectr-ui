// src/components/RulesApp.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInspectr } from '../context/InspectrContext';
import RulesListPanel from './RulesListPanel.jsx';
import RulesBuilderPanel from './RulesBuilderPanel.jsx';
import {
  buildActionState,
  createActionId,
  createCondition,
  detectValueType,
  extractConditions,
  moveItem,
  parseBoolean,
  toArrayParam
} from '../utils/rulesHelpers.js';

const createInitialForm = (events, actionsCatalog) => ({
  name: '',
  description: '',
  event: events?.[0]?.type || '',
  priority: 10,
  active: true,
  expressionType: 'and',
  conditions: [createCondition()],
  actions: actionsCatalog?.length ? [buildActionState(actionsCatalog[0])] : []
});

const convertConditionValue = (value, valueType) => {
  if (valueType === 'number') {
    const numberValue = Number(value);
    if (!Number.isNaN(numberValue)) return numberValue;
    return value;
  }
  if (valueType === 'boolean') {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
  return value;
};

const RuleDeleteDialog = ({ open, rule, isDeleting, error, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Delete rule?</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This will permanently remove{' '}
          <span className="font-medium">{rule?.name || 'this rule'}</span>. Actions triggered by
          this rule will no longer run.
        </p>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-red-500 dark:hover:bg-red-400"
          >
            {isDeleting ? 'Deleting…' : 'Delete Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RulesApp() {
  const { client, setToast } = useInspectr();
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [actionsCatalog, setActionsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openRuleId, setOpenRuleId] = useState(null);
  const [form, setForm] = useState(() => createInitialForm([], []));
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const initializedRef = useRef(false);
  const [rulePendingDelete, setRulePendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!client?.rules) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [rulesPayload, eventsPayload, actionsPayload] = await Promise.all([
          client.rules.list(),
          client.rules.getEvents(),
          client.rules.getActions()
        ]);
        if (cancelled) return;
        setRules(rulesPayload || []);
        setEvents(eventsPayload || []);
        setActionsCatalog(actionsPayload || []);
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load rules', err);
        setError(err?.message || 'Failed to load rules');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (loading) return;
    if (!initializedRef.current) {
      setForm(createInitialForm(events, actionsCatalog));
      initializedRef.current = true;
    }
  }, [loading, events, actionsCatalog]);

  const eventMap = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.type] = event;
      return acc;
    }, {});
  }, [events]);

  const refreshRules = async () => {
    if (!client?.rules) return;
    try {
      setRefreshing(true);
      const data = await client.rules.list();
      setRules(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to refresh rules', err);
      setError(err?.message || 'Failed to refresh rules');
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setForm(createInitialForm(events, actionsCatalog));
    setFormErrors([]);
    setEditingRuleId(null);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConditionChange = (index, field, value) => {
    setForm((prev) => {
      const nextConditions = prev.conditions.map((condition, i) => {
        if (i !== index) return condition;
        if (field === 'valueType') {
          if (value === 'boolean') {
            const nextValue = condition.value === 'false' ? 'false' : 'true';
            return { ...condition, valueType: value, value: nextValue };
          }
          if (condition.valueType === 'boolean') {
            return { ...condition, valueType: value, value: '' };
          }
        }
        return { ...condition, [field]: value };
      });
      return { ...prev, conditions: nextConditions };
    });
  };

  const handleMoveCondition = (fromIndex, toIndex) => {
    setForm((prev) => ({
      ...prev,
      conditions: moveItem(prev.conditions, fromIndex, toIndex)
    }));
  };

  const handleAddCondition = () => {
    setForm((prev) => ({ ...prev, conditions: [...prev.conditions, createCondition()] }));
  };

  const handleRemoveCondition = (index) => {
    setForm((prev) => {
      if (prev.conditions.length === 1) return prev;
      const nextConditions = prev.conditions.filter((_, i) => i !== index);
      return { ...prev, conditions: nextConditions };
    });
  };

  const getActionDefinition = (type) => actionsCatalog.find((item) => item.type === type);

  const handleAddAction = () => {
    setForm((prev) => {
      const defaultDefinition = actionsCatalog[0];
      const newAction = defaultDefinition
        ? buildActionState(defaultDefinition)
        : { id: createActionId(), type: '', params: {} };
      return { ...prev, actions: [...prev.actions, newAction] };
    });
  };

  const handleRemoveAction = (actionId) => {
    setForm((prev) => {
      if (prev.actions.length === 1) return prev;
      return { ...prev, actions: prev.actions.filter((action) => action.id !== actionId) };
    });
  };

  const handleActionTypeChange = (actionId, nextType) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action) => {
        if (action.id !== actionId) return action;
        const definition = getActionDefinition(nextType);
        if (!definition) {
          return { ...action, type: nextType, params: {} };
        }
        const base = buildActionState(definition);
        return { ...base, id: actionId, type: nextType };
      })
    }));
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
  };

  const handleMoveAction = (actionId, toIndex) => {
    setForm((prev) => {
      const index = prev.actions.findIndex((action) => action.id === actionId);
      if (index === -1) return prev;
      return {
        ...prev,
        actions: moveItem(prev.actions, index, toIndex)
      };
    });
  };

  const validateForm = () => {
    const issues = [];
    if (!form.name.trim()) issues.push('Rule name is required.');
    if (!form.event) issues.push('Select an event for the rule.');

    form.conditions.forEach((condition, index) => {
      if (!condition.path.trim()) issues.push(`Condition ${index + 1} is missing a data path.`);
      if (`${condition.value}`.trim() === '')
        issues.push(`Condition ${index + 1} is missing a value.`);
    });

    if (!form.conditions.length) issues.push('Add at least one condition.');
    if (!form.actions.length) issues.push('Add at least one action.');

    form.actions.forEach((action) => {
      const definition = getActionDefinition(action.type);
      if (!definition) {
        if (!action.type) issues.push('Every action must have a type.');
        return;
      }
      (definition.params || []).forEach((param) => {
        const raw = action.params?.[param.name];
        if (param.type.startsWith('array')) {
          const values = toArrayParam(raw);
          if (param.required && values.length === 0) {
            issues.push(`${param.name} is required for the ${action.type} action.`);
          }
        } else if (param.type === 'string') {
          if (param.required && !`${raw ?? ''}`.trim()) {
            issues.push(`${param.name} is required for the ${action.type} action.`);
          }
        } else if (param.type === 'boolean') {
          if (param.required && typeof raw !== 'boolean') {
            issues.push(`${param.name} must be toggled for the ${action.type} action.`);
          }
        }
      });
    });

    return issues;
  };

  const convertFormToPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    event: form.event,
    priority: Number(form.priority) || 0,
    active: !!form.active,
    expression: {
      op: form.expressionType,
      args: form.conditions.map((condition) => ({
        op: condition.operator,
        left: { path: condition.path.trim() },
        right: convertConditionValue(condition.value, condition.valueType)
      }))
    },
    actions: form.actions.map((action) => {
      const definition = getActionDefinition(action.type) || { params: [] };
      const params = {};
      (definition.params || []).forEach((param) => {
        const rawValue = action.params?.[param.name];
        if (param.type.startsWith('array')) {
          const values = toArrayParam(rawValue);
          if (param.required || values.length) params[param.name] = values;
        } else if (param.type === 'boolean') {
          if (rawValue !== undefined) params[param.name] = parseBoolean(rawValue);
        } else {
          const trimmed = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
          if (param.required || (trimmed != null && trimmed !== '')) params[param.name] = trimmed;
        }
      });
      return { type: action.type, params };
    })
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!client?.rules) return;

    const issues = validateForm();
    if (issues.length) {
      setFormErrors(issues);
      return;
    }

    setFormErrors([]);
    setSaving(true);

    const payload = convertFormToPayload();
    const isEditing = Boolean(editingRuleId);

    try {
      const result = isEditing
        ? await client.rules.replace(editingRuleId, payload)
        : await client.rules.create(payload);

      setToast?.({
        message: isEditing ? 'Rule updated' : 'Rule saved',
        subMessage: `${payload.name} applied successfully.`
      });

      resetForm();

      if (result?.id) {
        setRules((prev) => {
          const index = prev.findIndex((rule) => rule.id === result.id);
          if (index === -1) {
            return [result, ...prev];
          }
          const next = [...prev];
          next[index] = result;
          return next;
        });
      } else {
        await refreshRules();
      }
    } catch (err) {
      console.error('Failed to save rule', err);
      setFormErrors([err?.message || 'Failed to save rule']);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRule = (rule) => {
    const expressionType = String(rule.expression?.op || 'and').toLowerCase();
    const rawConditions = extractConditions(rule.expression);
    const nextConditions = rawConditions.length
      ? rawConditions.map((condition) => {
          const valueType = detectValueType(condition.right);
          let value;
          if (valueType === 'boolean') value = condition.right ? 'true' : 'false';
          else if (condition.right === undefined || condition.right === null) value = '';
          else value = String(condition.right);
          return {
            path: condition.left?.path || '',
            operator: condition.op || '==',
            valueType,
            value
          };
        })
      : [createCondition()];

    const nextActions = (() => {
      if (!rule.actions?.length) {
        return actionsCatalog.length ? [buildActionState(actionsCatalog[0])] : [];
      }
      return rule.actions.map((action) => {
        const definition = getActionDefinition(action.type);
        if (!definition) {
          const params = Object.entries(action.params || {}).reduce((acc, [key, value]) => {
            if (Array.isArray(value)) acc[key] = value.join(', ');
            else if (typeof value === 'boolean') acc[key] = value;
            else acc[key] = value != null ? String(value) : '';
            return acc;
          }, {});
          return { id: createActionId(), type: action.type || '', params };
        }
        const base = buildActionState(definition);
        const params = { ...base.params };
        (definition.params || []).forEach((param) => {
          const raw = action.params?.[param.name];
          if (param.type === 'boolean') {
            params[param.name] = raw === undefined ? params[param.name] : parseBoolean(raw);
          } else if (param.type.startsWith('array')) {
            if (Array.isArray(raw)) params[param.name] = raw.join(', ');
            else params[param.name] = raw || '';
          } else {
            params[param.name] = raw == null ? '' : String(raw);
          }
        });
        return { ...base, id: createActionId(), type: action.type || '', params };
      });
    })();

    setForm({
      name: rule.name || '',
      description: rule.description || '',
      event: rule.event || events[0]?.type || '',
      priority: rule.priority ?? 10,
      active: rule.active !== false,
      expressionType,
      conditions: nextConditions,
      actions: nextActions
    });
    setEditingRuleId(rule.id || null);
    setFormErrors([]);
    setOpenRuleId(rule.id || null);
  };

  const handleRequestDeleteRule = (rule) => {
    setRulePendingDelete(rule);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!client?.rules || !rulePendingDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await client.rules.delete(rulePendingDelete.id);
      setRules((prev) => prev.filter((rule) => rule.id !== rulePendingDelete.id));
      if (editingRuleId && rulePendingDelete.id === editingRuleId) {
        resetForm();
      }
      if (openRuleId === rulePendingDelete.id) {
        setOpenRuleId(null);
      }
      setToast?.({
        message: 'Rule deleted',
        subMessage: `${rulePendingDelete.name || 'Rule'} removed successfully.`
      });
      setRulePendingDelete(null);
    } catch (err) {
      console.error('Failed to delete rule', err);
      setDeleteError(err?.message || 'Failed to delete rule');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setRulePendingDelete(null);
    setDeleteError('');
  };

  const selectedEventDescription = eventMap[form.event]?.description;

  const listPanel = (
    <RulesListPanel
      rules={rules}
      events={events}
      loading={loading}
      error={error}
      isRefreshing={refreshing}
      openRuleId={openRuleId}
      onToggleRule={setOpenRuleId}
      onRefresh={refreshRules}
      onEditRule={handleEditRule}
      onDeleteRule={handleRequestDeleteRule}
    />
  );

  const builderPanel = (
    <RulesBuilderPanel
      form={form}
      events={events}
      selectedEventDescription={selectedEventDescription}
      actionsCatalog={actionsCatalog}
      isEditing={Boolean(editingRuleId)}
      saving={saving}
      formErrors={formErrors}
      onSubmit={handleSubmit}
      onReset={resetForm}
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
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="w-full lg:basis-1/2 lg:flex-none lg:pr-3">{listPanel}</div>
        <div className="w-full lg:basis-1/2 lg:flex-none lg:pl-3">{builderPanel}</div>
      </div>
      <RuleDeleteDialog
        open={Boolean(rulePendingDelete)}
        rule={rulePendingDelete}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
