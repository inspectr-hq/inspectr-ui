// src/components/RulesApp.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInspectr } from '../context/InspectrContext';

const operatorOptions = [
  { value: '==', label: 'is equal to' },
  { value: '!=', label: 'is not equal to' },
  { value: '>', label: 'is greater than' },
  { value: '>=', label: 'is greater or equal to' },
  { value: '<', label: 'is less than' },
  { value: '<=', label: 'is less or equal to' }
];

const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' }
];

const aggregatorOptions = [
  { value: 'and', label: 'All conditions match' },
  { value: 'or', label: 'Any condition matches' }
];

const aggregatorHints = {
  and: 'All conditions must match before actions run.',
  or: 'Any condition may match before actions run.'
};

const operatorLabelMap = operatorOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const createCondition = () => ({
  path: '',
  operator: '==',
  value: '',
  valueType: 'string'
});

const createActionId = () => Math.random().toString(36).slice(2, 10);

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return Boolean(value);
};

const getParamDefault = (param) => {
  if (param.type.startsWith('array')) return '';
  if (param.type === 'boolean') return parseBoolean(param.default ?? true);
  if (param.default != null) return param.default;
  return '';
};

const buildActionState = (definition) => ({
  id: createActionId(),
  type: definition?.type || '',
  params: (definition?.params || []).reduce((acc, param) => {
    acc[param.name] = getParamDefault(param);
    return acc;
  }, {})
});

const toArrayParam = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const extractConditions = (node) => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(extractConditions);
  if (node.left && node.op) return [node];
  if (node.args) return node.args.flatMap(extractConditions);
  return [];
};

const detectValueType = (value) => {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
};

const formatConditionValue = (value) => {
  if (value === null || value === undefined || value === '') return 'empty';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

const actionTitleMap = {
  tag: 'Apply static tags',
  tag_dynamic: 'Apply dynamic tags'
};

const getActionDisplayName = (type) => {
  if (actionTitleMap[type]) return actionTitleMap[type];
  return type
    .toString()
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatActionParams = (params = {}) => {
  const entries = Object.entries(params);
  if (entries.length === 0) return 'No parameters configured';
  return entries
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
      if (typeof value === 'object' && value !== null) return `${key}: ${JSON.stringify(value)}`;
      if (typeof value === 'boolean') return `${key}: ${value ? 'true' : 'false'}`;
      return `${key}: ${value}`;
    })
    .join(' · ');
};

const formatUpdateLabel = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return date.toLocaleString();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const StepIcon = ({ variant }) => {
  if (variant === 'event') {
    return (
      <span
        className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-orange-600 dark:bg-orange-500"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-white"
          aria-hidden="true"
        >
          <path d="M12 2v14" />
          <path d="m19 9-7 7-7-7" />
          <circle cx="12" cy="21" r="1" />
        </svg>
      </span>
    );
  }

  if (variant === 'condition') {
    return (
      <span
        className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-sky-500 dark:bg-sky-500"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-white"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
          <path d="M9 11.2h5.7" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="relative flex aspect-square h-9 items-center justify-center rounded-lg bg-emerald-500 dark:bg-emerald-500"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 shrink-0 text-white"
        aria-hidden="true"
      >
        <path d="M22 12A10 10 0 1 1 12 2" />
        <path d="M22 2 12 12" />
        <path d="M16 2h6v6" />
      </svg>
    </span>
  );
};

export default function RulesApp() {
  const { client, setToast } = useInspectr();
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [actionsCatalog, setActionsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState('');
  const [openRuleId, setOpenRuleId] = useState(null);
  const [form, setForm] = useState(() => createInitialForm([], []));
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const initializedRef = useRef(false);

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
    return events.reduce((acc, item) => {
      acc[item.type] = item;
      return acc;
    }, {});
  }, [events]);

  const refreshRules = async () => {
    if (!client?.rules) return;
    try {
      setRulesLoading(true);
      const data = await client.rules.list();
      setRules(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to refresh rules', err);
      setError(err?.message || 'Failed to refresh rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const resetForm = () => {
    setForm(createInitialForm(events, actionsCatalog));
    setFormErrors([]);
    setEditingRuleId(null);
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

  const handleActionChange = (actionId, updater) => {
    setForm((prev) => {
      const nextActions = prev.actions.map((action) =>
        action.id === actionId ? updater(action) : action
      );
      return { ...prev, actions: nextActions };
    });
  };

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

  const convertFormToPayload = () => {
    return {
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
    };
  };

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
        ? await client.rules.update(editingRuleId, payload)
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
  };

  const buildRuleSteps = (rule) => {
    const aggregator = String(rule.expression?.op || 'and').toLowerCase();
    const aggregatorText = aggregatorHints[aggregator];
    const eventMeta = eventMap[rule.event] || {};
    const eventTitle = eventMeta.name || rule.event;
    const eventDescriptionParts = [rule.description, eventMeta.description, aggregatorText].filter(
      Boolean
    );

    const steps = [
      {
        variant: 'event',
        title: eventTitle,
        description: eventDescriptionParts.join(' · ')
      }
    ];

    const conditions = extractConditions(rule.expression);
    conditions.forEach((condition, index) => {
      const operatorLabel = operatorLabelMap[condition.op] || condition.op;
      const valueText = formatConditionValue(condition.right);
      const descriptionParts = [];
      if (condition.left?.path) descriptionParts.push(condition.left.path);
      if (condition.right?.path) descriptionParts.push(`Compare to ${condition.right.path}`);
      steps.push({
        variant: 'condition',
        title: `Condition ${index + 1}: ${operatorLabel} ${valueText}`,
        description: descriptionParts.join(' · ')
      });
    });

    (rule.actions || []).forEach((action, index) => {
      steps.push({
        variant: 'action',
        title: `Action ${index + 1}: ${getActionDisplayName(action.type)}`,
        description: formatActionParams(action.params)
      });
    });

    return steps;
  };

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

  const isEditing = Boolean(editingRuleId);

  const renderedRules = useMemo(() => rules || [], [rules]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="w-full lg:basis-1/2 lg:flex-none lg:pr-3">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#090E1A]">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Applied Rules
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Overview of automation rules currently available on your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshRules}
                disabled={rulesLoading || loading}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                {rulesLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="px-4 py-4">
              {loading ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading rules…</p>
              ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : renderedRules.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  No rules have been defined yet. Create a new rule using the builder.
                </div>
              ) : (
                <div className="space-y-3">
                  {renderedRules.map((rule) => {
                    const isOpen = openRuleId === rule.id;
                    const steps = buildRuleSteps(rule);
                    const updatedLabel = formatUpdateLabel(rule.updated_at || rule.created_at);
                    return (
                      <div
                        key={rule.id || rule.name}
                        className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRuleId((current) => (current === rule.id ? null : rule.id))
                          }
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900/40"
                        >
                          <div className="flex w-full items-center justify-between gap-4">
                            <div className="truncate">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                                {rule.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                                {rule.description || 'No description provided'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${rule.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="size-3.5"
                                  aria-hidden="true"
                                >
                                  {rule.active ? (
                                    <>
                                      <path d="m9 11 3 3L22 4" />
                                      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                                    </>
                                  ) : (
                                    <circle cx="12" cy="12" r="10" />
                                  )}
                                </svg>
                                {rule.active ? 'Live' : 'Inactive'}
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`size-5 shrink-0 transition-transform duration-150 text-gray-400 dark:text-gray-600 ${isOpen ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                            <div className="overflow-hidden pb-4 text-sm text-gray-700 dark:text-gray-200">
                              <div className="mx-auto flex w-full items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-500">
                                <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800"></div>
                              </div>
                              <ul role="list" className="mt-6 space-y-6" aria-label="Rule steps">
                                {steps.map((step, index) => {
                                  const isLast = index === steps.length - 1;
                                  return (
                                    <li
                                      key={`${rule.id}-step-${index}`}
                                      className="relative flex gap-x-4"
                                    >
                                      {!isLast && (
                                        <div className="-bottom-6 absolute left-0 top-0 flex w-9 justify-center">
                                          <div className="w-px bg-gray-200 dark:bg-gray-800" />
                                        </div>
                                      )}
                                      <StepIcon variant={step.variant} />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                          {index + 1}. {step.title}
                                        </p>
                                        {step.description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {step.description}
                                          </p>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                                <time className="flex-none text-xs leading-5 text-gray-500 dark:text-gray-500">
                                  {updatedLabel ? `Updated ${updatedLabel}` : 'Updated recently'}
                                </time>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditRule(rule)}
                                    className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:hover:bg-gray-800/30"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-settings -ml-0.5 size-4 shrink-0"
                                      aria-hidden="true"
                                    >
                                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOpenRuleId(null)}
                                    className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-rose-500 dark:hover:bg-gray-800/30"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:basis-1/2 lg:flex-none lg:pl-3">
          <form
            className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-800 dark:bg-[#090E1A]/60 sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="rule-name"
                  className="text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  {isEditing ? 'Edit Rule' : 'Rule Name'}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {isEditing
                    ? 'Update the selected rule and save your changes.'
                    : 'Define a descriptive name for your rule.'}
                </p>
              </div>
              {isEditing && (
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  Editing
                </span>
              )}
            </div>
            <input
              id="rule-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="E.g. Min. Transaction Amount USD"
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
            />

            <div className="space-y-2">
              <label
                htmlFor="rule-description"
                className="text-sm font-medium text-gray-900 dark:text-gray-50"
              >
                Description
              </label>
              <textarea
                id="rule-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Optional summary for this automation rule"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="rule-event"
                  className="text-sm font-medium text-gray-900 dark:text-gray-50"
                >
                  Event Trigger
                </label>
                <select
                  id="rule-event"
                  value={form.event}
                  onChange={(event) => setForm((prev) => ({ ...prev, event: event.target.value }))}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                >
                  {events.length === 0 && <option value="">No events available</option>}
                  {events.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.name || item.type}
                    </option>
                  ))}
                </select>
                {events.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {eventMap[form.event]?.description || 'Select the event to monitor.'}
                  </p>
                )}
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Activation
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="rule-active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                    className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <label htmlFor="rule-active" className="text-sm text-gray-700 dark:text-gray-200">
                    Rule is active
                  </label>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="rule-priority"
                    className="text-sm font-medium text-gray-900 dark:text-gray-50"
                  >
                    Priority
                  </label>
                  <input
                    id="rule-priority"
                    type="number"
                    value={form.priority}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, priority: event.target.value }))
                    }
                    className="block w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#090E1A]">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Rule Flow</h4>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Configure the event, matching conditions, and resulting actions.
                </div>
              </div>
              <div className="space-y-6 px-4 py-5">
                <div className="rounded-lg border-l-4 border-orange-600 bg-orange-50/60 p-4 dark:border-orange-500 dark:bg-orange-500/10">
                  <div className="flex items-center gap-4">
                    <span
                      className="flex aspect-square h-10 items-center justify-center rounded-lg bg-orange-600 dark:bg-orange-500"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-6 text-white"
                      >
                        <path d="M12 2v14" />
                        <path d="m19 9-7 7-7-7" />
                        <circle cx="12" cy="21" r="1" />
                      </svg>
                    </span>
                    <div className="truncate">
                      <h5 className="text-sm font-medium capitalize text-gray-900 dark:text-gray-50">
                        Event
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Select the operation event you want to monitor.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label
                      className="text-xs font-medium text-gray-900 dark:text-gray-200"
                      htmlFor="builder-event"
                    >
                      Event
                    </label>
                    <select
                      id="builder-event"
                      value={form.event}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, event: event.target.value }))
                      }
                      className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                    >
                      {events.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.name || item.type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      Conditions
                    </h5>
                    <div className="flex items-center gap-3">
                      <label
                        className="text-xs font-medium text-gray-500 dark:text-gray-400"
                        htmlFor="expression-type"
                      >
                        Condition Logic
                      </label>
                      <select
                        id="expression-type"
                        value={form.expressionType}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, expressionType: event.target.value }))
                        }
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                      >
                        {aggregatorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-4 px-4 py-4">
                        <span
                          className="flex aspect-square h-10 items-center justify-center rounded-lg bg-sky-500"
                          aria-hidden="true"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-6 text-white"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
                            <path d="M9 11.2h5.7" />
                          </svg>
                        </span>
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                JSON path
                              </label>
                              <input
                                type="text"
                                value={condition.path}
                                onChange={(event) =>
                                  handleConditionChange(index, 'path', event.target.value)
                                }
                                placeholder="$.request.path"
                                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Operator
                                </label>
                                <select
                                  value={condition.operator}
                                  onChange={(event) =>
                                    handleConditionChange(index, 'operator', event.target.value)
                                  }
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                >
                                  {operatorOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Value Type
                                </label>
                                <select
                                  value={condition.valueType}
                                  onChange={(event) =>
                                    handleConditionChange(index, 'valueType', event.target.value)
                                  }
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                >
                                  {valueTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Compare value
                              </label>
                              {condition.valueType === 'boolean' ? (
                                (() => {
                                  const booleanValue =
                                    condition.value === ''
                                      ? 'true'
                                      : condition.value === true
                                        ? 'true'
                                        : condition.value === false
                                          ? 'false'
                                          : condition.value;
                                  return (
                                    <select
                                      value={booleanValue}
                                      onChange={(event) =>
                                        handleConditionChange(index, 'value', event.target.value)
                                      }
                                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                    >
                                      <option value="true">true</option>
                                      <option value="false">false</option>
                                    </select>
                                  );
                                })()
                              ) : (
                                <input
                                  type="text"
                                  value={condition.value}
                                  onChange={(event) =>
                                    handleConditionChange(index, 'value', event.target.value)
                                  }
                                  placeholder={
                                    condition.valueType === 'number'
                                      ? 'e.g. 200'
                                      : 'e.g. /api/payments'
                                  }
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                />
                              )}
                            </div>
                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveCondition(index)}
                                className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/30"
                                disabled={form.conditions.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-900"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Condition
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      Actions
                    </h5>
                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="inline-flex items-center gap-2 rounded-md border border-transparent bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                        aria-hidden="true"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Action
                    </button>
                  </div>

                  {form.actions.map((action) => {
                    const definition = getActionDefinition(action.type) || { params: [] };
                    return (
                      <div
                        key={action.id}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="flex items-start gap-4 px-4 py-4">
                          <span
                            className="flex aspect-square h-10 items-center justify-center rounded-lg bg-emerald-500"
                            aria-hidden="true"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="size-6 text-white"
                            >
                              <path d="M22 12A10 10 0 1 1 12 2" />
                              <path d="M22 2 12 12" />
                              <path d="M16 2h6v6" />
                            </svg>
                          </span>
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex-1 min-w-[180px] space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Action Type
                                </label>
                                <select
                                  value={action.type}
                                  onChange={(event) => {
                                    const nextDefinition = getActionDefinition(
                                      event.target.value
                                    ) || {
                                      type: event.target.value,
                                      params: []
                                    };
                                    handleActionChange(action.id, () => ({
                                      ...buildActionState(nextDefinition),
                                      id: action.id
                                    }));
                                  }}
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                >
                                  {actionsCatalog.length === 0 && (
                                    <option value="">No actions available</option>
                                  )}
                                  {actionsCatalog.map((item) => (
                                    <option key={item.type} value={item.type}>
                                      {item.type}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAction(action.id)}
                                className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/30"
                                disabled={form.actions.length === 1}
                              >
                                Remove
                              </button>
                            </div>

                            {definition?.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {definition.description}
                              </p>
                            )}

                            <div className="space-y-4">
                              {(definition.params || []).map((param) => {
                                const fieldId = `${action.id}-${param.name}`;
                                const currentValue =
                                  action.params?.[param.name] ?? getParamDefault(param);
                                const isBoolean = param.type === 'boolean';
                                const isArray = param.type.startsWith('array');
                                return (
                                  <div key={param.name} className="space-y-1">
                                    <label
                                      htmlFor={fieldId}
                                      className="text-xs font-medium text-gray-500 dark:text-gray-400"
                                    >
                                      {param.name}
                                      {param.required && (
                                        <span className="ml-1 text-red-500">*</span>
                                      )}
                                    </label>
                                    {isBoolean ? (
                                      <div className="flex items-center gap-3">
                                        <input
                                          id={fieldId}
                                          type="checkbox"
                                          checked={Boolean(currentValue)}
                                          onChange={(event) =>
                                            handleActionChange(action.id, (prevAction) => ({
                                              ...prevAction,
                                              params: {
                                                ...prevAction.params,
                                                [param.name]: event.target.checked
                                              }
                                            }))
                                          }
                                          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {param.description}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          id={fieldId}
                                          type="text"
                                          value={
                                            typeof currentValue === 'string'
                                              ? currentValue
                                              : isArray
                                                ? (currentValue || []).join(', ')
                                                : (currentValue ?? '')
                                          }
                                          onChange={(event) =>
                                            handleActionChange(action.id, (prevAction) => ({
                                              ...prevAction,
                                              params: {
                                                ...prevAction.params,
                                                [param.name]: event.target.value
                                              }
                                            }))
                                          }
                                          placeholder={isArray ? 'tag.one, tag.two' : ''}
                                          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                        />
                                        {param.description && (
                                          <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {param.description}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {formErrors.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                <ul className="list-disc space-y-1 pl-4">
                  {formErrors.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                {isEditing ? 'Cancel edit' : 'Reset'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {saving ? 'Saving…' : isEditing ? 'Update Rule' : 'Save Rule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function createInitialForm(events, actionsCatalog) {
  return {
    name: '',
    description: '',
    event: events?.[0]?.type || '',
    priority: 10,
    active: true,
    expressionType: 'and',
    conditions: [createCondition()],
    actions: actionsCatalog?.length ? [buildActionState(actionsCatalog[0])] : []
  };
}
