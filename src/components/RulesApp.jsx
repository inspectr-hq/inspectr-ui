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

const RuleBuilderDialog = ({ open, title, description, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close builder dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
};

const RuleTemplateDialog = ({ open, templates, loading, error, onClose, onRetry, onSelect }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Start from a template
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a starter rule and customise it to fit your automation workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close template dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-6 sm:px-6">
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading templates…</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Try again
              </button>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No templates available right now.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Event:</span>{' '}
                        {template.event}
                      </p>
                      {template.priority != null && (
                        <p>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Priority:
                          </span>{' '}
                          {template.priority}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Actions:
                        </span>{' '}
                        {template.actions?.length || 0}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(template)}
                    className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Use template
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [rulePendingDelete, setRulePendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateGroups, setTemplateGroups] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');

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
        setRules(rulesPayload?.rules || []);
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

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError('');
      const [templatesRes, groupsRes] = await Promise.all([
        fetch('https://templates.inspectr.dev/api/rules/templates'),
        fetch('https://templates.inspectr.dev/api/rules/templates/group-types')
      ]);

      if (!templatesRes.ok) throw new Error(`Template fetch failed (${templatesRes.status})`);
      if (!groupsRes.ok) throw new Error(`Group types fetch failed (${groupsRes.status})`);

      const templatesData = await templatesRes.json();
      const groupsData = await groupsRes.json();

      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setTemplateGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error('Failed to load templates', err);
      if (err?.name === 'TypeError' || err?.message?.includes('Failed to fetch')) {
        setTemplatesError('');
        setIsTemplateDialogOpen(false);
        resetForm();
        setEditingRuleId(null);
        setFormErrors([]);
        setIsBuilderOpen(true);
        setTemplates([]);
        setTemplateGroups([]);
      } else {
        setTemplatesError(err?.message || 'Failed to load templates');
      }
    } finally {
      setTemplatesLoading(false);
    }
  };

  const resetForm = () => {
    setForm(createInitialForm(events, actionsCatalog));
    setFormErrors([]);
    setEditingRuleId(null);
  };

  const closeBuilder = () => {
    setIsBuilderOpen(false);
    resetForm();
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

  const mapRuleToForm = (rule) => {
    const expressionType = String(rule?.expression?.op || 'and').toLowerCase();
    const rawConditions = extractConditions(rule?.expression);
    const conditions = rawConditions.length
      ? rawConditions.map((condition) => {
          const rawRight = condition.right;
          const valueType = Array.isArray(rawRight) ? 'string' : detectValueType(rawRight);
          let value;
          if (Array.isArray(rawRight)) value = rawRight.join(', ');
          else if (valueType === 'boolean') value = rawRight ? 'true' : 'false';
          else if (rawRight === undefined || rawRight === null) value = '';
          else value = String(rawRight);
          return {
            path: condition.left?.path || '',
            operator: condition.op || '==',
            valueType,
            value
          };
        })
      : [createCondition()];

    const actions = (() => {
      if (!rule?.actions?.length) {
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

    const eventType = rule?.event;
    const fallbackEvent = events[0]?.type || '';
    const selectedEvent = events.some((evt) => evt.type === eventType) ? eventType : fallbackEvent;

    return {
      name: rule?.name || '',
      description: rule?.description || '',
      event: selectedEvent,
      priority: rule?.priority ?? 10,
      active: rule?.active !== false,
      expressionType,
      conditions,
      actions
    };
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

      closeBuilder();
    } catch (err) {
      console.error('Failed to save rule', err);
      setFormErrors([err?.message || 'Failed to save rule']);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRule = (rule) => {
    if (!actionsCatalog.length) return;
    setForm(mapRuleToForm(rule));
    setEditingRuleId(rule.id || null);
    setFormErrors([]);
    setIsBuilderOpen(true);
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
        closeBuilder();
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

  const handleBuilderReset = () => {
    if (editingRuleId) {
      closeBuilder();
    } else {
      resetForm();
    }
  };

  const handleCreateRule = () => {
    if (!actionsReady) return;
    resetForm();
    setIsBuilderOpen(true);
  };

  const handleStartFromTemplate = () => {
    if (!actionsReady) return;
    setIsTemplateDialogOpen(true);
    if (!templatesLoading && templates.length === 0) {
      loadTemplates();
    }
  };

  const handleApplyTemplate = (template) => {
    if (!actionsCatalog.length) return;
    setForm(mapRuleToForm(template));
    setEditingRuleId(null);
    setFormErrors([]);
    setIsTemplateDialogOpen(false);
    setIsBuilderOpen(true);
  };

  const actionsReady = events.length > 0 && actionsCatalog.length > 0 && !loading;
  const selectedEventDescription = eventMap[form.event]?.description;
  const builderTitle = editingRuleId ? 'Edit rule' : 'Create rule';
  const builderDescription = editingRuleId
    ? 'Update the event, conditions, and actions for this automation rule.'
    : 'Define the event trigger, matching conditions, and resulting actions for your new rule.';

  const templateGroupMap = useMemo(() => {
    return templateGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [templateGroups]);

  const groupedTemplates = useMemo(() => {
    if (!templates.length) return [];

    const groups = [];

    templateGroups.forEach((group) => {
      const items = templates.filter((template) => template.group_type === group.id);
      if (items.length) {
        groups.push({
          id: group.id,
          label: group.label,
          description: group.description,
          items
        });
      }
    });

    const uncategorized = templates.filter(
      (template) => !template.group_type || !templateGroupMap[template.group_type]
    );

    if (uncategorized.length) {
      groups.push({
        id: 'uncategorized',
        label: 'Other Templates',
        description: 'General-purpose rules without a defined category.',
        items: uncategorized
      });
    }

    return groups;
  }, [templates, templateGroups, templateGroupMap]);

  return (
    <div className="space-y-6">
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
        onCreateRule={handleCreateRule}
        onStartFromTemplate={handleStartFromTemplate}
        actionsDisabled={!actionsReady}
      />

      <RuleDeleteDialog
        open={Boolean(rulePendingDelete)}
        rule={rulePendingDelete}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <RuleBuilderDialog
        open={isBuilderOpen}
        title={builderTitle}
        description={builderDescription}
        onClose={closeBuilder}
      >
        <RulesBuilderPanel
          form={form}
          events={events}
          selectedEventDescription={selectedEventDescription}
          actionsCatalog={actionsCatalog}
          isEditing={Boolean(editingRuleId)}
          saving={saving}
          formErrors={formErrors}
          onSubmit={handleSubmit}
          onReset={handleBuilderReset}
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
      </RuleBuilderDialog>

      <RuleTemplateDialog
        open={isTemplateDialogOpen}
        templates={templates}
        loading={templatesLoading}
        error={templatesError}
        onClose={() => setIsTemplateDialogOpen(false)}
        onRetry={loadTemplates}
        onSelect={handleApplyTemplate}
      />
    </div>
  );
}
