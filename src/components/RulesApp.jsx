// src/components/RulesApp.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInspectr } from '../context/InspectrContext';
import RulesListPanel from './RulesListPanel.jsx';
import RulesBuilderPanel from './RulesBuilderPanel.jsx';
import RuleDeleteDialog from './RuleDeleteDialog.jsx';
import RuleBuilderDialog from './RuleBuilderDialog.jsx';
import RuleTemplateDialog from './RuleTemplateDialog.jsx';
import RuleApplyHistoryDialog from './RuleApplyHistoryDialog.jsx';
import OperationTagsPanel from './OperationTagsPanel.jsx';
import {
  buildActionState,
  createActionId,
  createCondition,
  detectValueType,
  extractConditions,
  moveItem,
  parseBoolean,
  toArrayParam,
  getParamDefault
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
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyRule, setApplyRule] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applyPreview, setApplyPreview] = useState(null);

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
      setRules(data?.rules || []);
      setError('');
    } catch (err) {
      console.error('Failed to refresh rules', err);
      setError(err?.message || 'Failed to refresh rules');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePauseRule = async (rule) => {
    if (!client?.rules || !rule?.id) return;
    const nextActive = !rule.active;
    try {
      await client.rules.update(rule.id, { ...rule, active: nextActive });
      setToast?.({
        type: 'success',
        message: `Rule "${rule.name || 'Untitled'}" ${nextActive ? 'activated' : 'paused'}`
      });
      // Refresh rules to reflect the change
      await refreshRules();
    } catch (err) {
      console.error('Toggle rule active failed', err);
      setToast?.({ type: 'error', message: err?.message || 'Failed to update rule status' });
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
        // If there is a provider + provider_options with variants, seed provider_options from provider
        try {
          const providerParam = (definition.params || []).find((p) => p.name === 'provider');
          const optionsParam = (definition.params || []).find((p) => p.name === 'provider_options');
          const providerValue = base.params?.provider;
          if (providerParam && optionsParam && Array.isArray(optionsParam.variants)) {
            const variant = optionsParam.variants.find((v) => v.value === providerValue);
            if (variant) {
              const seeded = (variant.params || []).reduce((acc, p) => {
                acc[p.name] = getParamDefault(p);
                return acc;
              }, {});
              base.params.provider_options = seeded;
            }
          }
        } catch {}
        return { ...base, id: actionId, type: nextType };
      })
    }));
  };

  const handleActionParamChange = (actionId, paramName, value) => {
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action) => {
        if (action.id !== actionId) return action;
        const nextParams = { ...action.params, [paramName]: value };
        if (paramName === 'provider') {
          // Seed provider_options defaults based on selected provider variant
          const def = getActionDefinition(action.type);
          const optionsParam = def?.params?.find((p) => p.name === 'provider_options');
          if (optionsParam && Array.isArray(optionsParam.variants)) {
            const variant = optionsParam.variants.find((v) => v.value === value);
            if (variant) {
              nextParams.provider_options = (variant.params || []).reduce((acc, p) => {
                acc[p.name] = getParamDefault(p);
                return acc;
              }, {});
            } else {
              nextParams.provider_options = {};
            }
          } else {
            nextParams.provider_options = {};
          }
        }
        return { ...action, params: nextParams };
      })
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
          } else if (typeof param.type === 'string' && param.type.startsWith('array')) {
            if (Array.isArray(raw)) params[param.name] = raw.join(', ');
            else params[param.name] = raw || '';
          } else if (param.type === 'object') {
            if (raw && typeof raw === 'object') params[param.name] = raw;
            else params[param.name] = {};
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
        if (typeof param.type === 'string' && param.type.startsWith('array')) {
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
        } else if (param.type === 'integer' || param.type === 'number') {
          const n = Number(raw);
          if (param.required && !Number.isFinite(n)) {
            issues.push(`${param.name} must be a valid ${param.type} for the ${action.type} action.`);
          }
        } else if (param.type === 'object') {
          if (param.required) {
            if (raw == null || (typeof raw === 'object' && Object.keys(raw).length === 0)) {
              issues.push(`${param.name} is required for the ${action.type} action.`);
            } else if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') {
                  issues.push(`${param.name} must be a valid JSON object for the ${action.type} action.`);
                }
              } catch (e) {
                issues.push(`${param.name} must be valid JSON for the ${action.type} action.`);
              }
            }
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
        if (typeof param.type === 'string' && param.type.startsWith('array')) {
          const values = toArrayParam(rawValue);
          if (param.required || values.length) params[param.name] = values;
        } else if (param.type === 'boolean') {
          if (rawValue !== undefined) params[param.name] = parseBoolean(rawValue);
        } else if (param.type === 'integer' || param.type === 'number') {
          if (rawValue !== undefined && rawValue !== '') {
            const num = Number(rawValue);
            if (Number.isFinite(num)) params[param.name] = num;
          }
        } else if (param.type === 'object') {
          if (rawValue) {
            if (typeof rawValue === 'object') {
              let obj = rawValue;
              if (param.input === 'multi_select' && Array.isArray(param.choices)) {
                const result = {};
                Object.entries(rawValue).forEach(([k, v]) => {
                  const choice = param.choices.find((c) => (c.meta?.key || c.value) === k);
                  const t = choice?.meta?.type;
                  if (t === 'integer' || t === 'number') {
                    const num = Number(v);
                    result[k] = Number.isFinite(num) ? num : v;
                  } else if (t === 'boolean') {
                    result[k] = v === true || v === 'true' || v === '1';
                  } else if (t === 'object') {
                    try {
                      result[k] = typeof v === 'string' ? JSON.parse(v) : v;
                    } catch {
                      result[k] = v;
                    }
                  } else {
                    result[k] = v;
                  }
                });
                obj = result;
              } else if (Array.isArray(param.variants) && param.name === 'provider_options') {
                // Coerce nested provider options using variant parameter definitions
                const provider = action.params?.provider;
                const variant = param.variants.find((v) => v.value === provider);
                if (variant) {
                  const coerced = {};
                  (variant.params || []).forEach((sub) => {
                    const v = rawValue[sub.name];
                    if (v === undefined) return;
                    if (sub.type === 'integer' || sub.type === 'number') {
                      const n = Number(v);
                      coerced[sub.name] = Number.isFinite(n) ? n : v;
                    } else if (sub.type === 'boolean') {
                      coerced[sub.name] = v === true || v === 'true' || v === '1';
                    } else if (typeof sub.type === 'string' && sub.type.startsWith('array')) {
                      coerced[sub.name] = Array.isArray(v) ? v : toArrayParam(v);
                    } else if (sub.type === 'object') {
                      try {
                        coerced[sub.name] = typeof v === 'string' ? JSON.parse(v) : v;
                      } catch {
                        coerced[sub.name] = v;
                      }
                    } else {
                      coerced[sub.name] = v;
                    }
                  });
                  obj = coerced;
                }
              }
              if (param.required || Object.keys(obj).length) params[param.name] = obj;
            } else if (typeof rawValue === 'string') {
              try {
                const parsed = JSON.parse(rawValue);
                if (parsed && typeof parsed === 'object') {
                  if (param.required || Object.keys(parsed).length) params[param.name] = parsed;
                }
              } catch {
                // ignore invalid json
              }
            }
          }
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

  const handleDuplicateRule = (copy, original) => {
    if (!actionsReady) return;
    // Map the duplicated rule object into the builder form state
    const formState = mapRuleToForm(copy);
    setForm(formState);
    setEditingRuleId(null); // ensure we're creating, not editing
    setFormErrors([]);
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

  // Apply-to-history handlers
  const handleOpenApplyHistory = (rule) => {
    setApplyRule(rule);
    setIsApplyOpen(true);
    setApplyError('');
    setApplyPreview(null);
  };

  const handleCloseApplyHistory = () => {
    setIsApplyOpen(false);
    setApplyRule(null);
    setApplyError('');
    setApplyPreview(null);
    setApplyLoading(false);
    setApplying(false);
  };

  const handlePreviewApply = async (options) => {
    if (!client?.rules || !applyRule?.id) return;
    try {
      setApplyLoading(true);
      setApplyError('');
      const res = await client.rules.applyToHistory(applyRule.id, {
        ...options,
        limit: 5,
        dryRun: true
      });
      setApplyPreview(res);
    } catch (err) {
      console.error('Preview apply failed', err);
      setApplyError(err?.message || 'Failed to preview');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApplyNow = async (options) => {
    if (!client?.rules || !applyRule?.id) return;
    try {
      setApplying(true);
      setApplyError('');
      const res = await client.rules.applyToHistory(applyRule.id, { ...options, dryRun: false });
      setToast?.({ type: 'success', message: 'Rule applied to matching historical operations' });
      setIsApplyOpen(false);
    } catch (err) {
      console.error('Apply to history failed', err);
      setApplyError(err?.message || 'Failed to apply');
      setToast?.({ type: 'error', message: err?.message || 'Failed to apply rule' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-0 flex flex-col">
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
            onApplyHistory={handleOpenApplyHistory}
            onDuplicateRule={handleDuplicateRule}
            onPauseRule={handlePauseRule}
            actionsDisabled={!actionsReady}
          />
        </div>
        <div className="lg:col-span-1">
          <OperationTagsPanel />
        </div>
      </div>

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
        groupedTemplates={groupedTemplates}
        loading={templatesLoading}
        error={templatesError}
        onClose={() => setIsTemplateDialogOpen(false)}
        onRetry={loadTemplates}
        onSelect={handleApplyTemplate}
      />

      <RuleApplyHistoryDialog
        open={isApplyOpen}
        rule={applyRule}
        onClose={handleCloseApplyHistory}
        onPreview={handlePreviewApply}
        onApply={handleApplyNow}
        loading={applyLoading}
        applying={applying}
        error={applyError}
        preview={applyPreview}
      />
    </div>
  );
}
