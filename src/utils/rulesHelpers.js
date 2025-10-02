// src/utils/rulesHelpers.js

export const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' }
];

export const normalizeRuleOperators = (operators) => {
  if (!Array.isArray(operators) || operators.length === 0) {
    return [];
  }

  const seen = new Set();
  const normalized = operators
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const key = item.operator || item.value || item.op;
      if (!key || typeof key !== 'string') return null;
      const operator = key.trim();
      if (!operator) return null;
      if (seen.has(operator)) return null;
      seen.add(operator);
      const aliases = Array.isArray(item.aliases)
        ? item.aliases.filter((alias) => typeof alias === 'string' && alias.trim())
        : [];
      return {
        operator,
        label: item.label || item.name || operator,
        description: item.description || '',
        aliases,
        valueRequired: Boolean(item.value_required ?? item.valueRequired ?? item.requiresValue),
        multiValue: Boolean(item.multi_value ?? item.multiValue)
      };
    })
    .filter(Boolean);

  return normalized;
};

export const createOperatorOptions = (operators = []) =>
  operators.map((item) => ({
    value: item.operator,
    label: item.label || item.operator,
    description: item.description || '',
    valueRequired: item.valueRequired !== false,
    multiValue: item.multiValue === true
  }));

export const createOperatorLabelMap = (operators = []) =>
  operators.reduce((acc, item) => {
    const label = item.label || item.operator;
    acc[item.operator] = label;
    (item.aliases || []).forEach((alias) => {
      acc[alias] = label;
    });
    return acc;
  }, {});

export const createOperatorMetaMap = (operators = []) =>
  operators.reduce((acc, item) => {
    acc[item.operator] = item;
    (item.aliases || []).forEach((alias) => {
      acc[alias] = item;
    });
    return acc;
  }, {});

export const getDefaultOperatorValue = (operators = []) => operators[0]?.operator || '';

export const aggregatorOptions = [
  { value: 'and', label: 'All conditions match' },
  { value: 'or', label: 'Any condition matches' }
];

export const aggregatorHints = {
  and: 'All conditions must match before actions run.',
  or: 'Any condition may match before actions run.'
};

export const actionTitleMap = {
  tag: 'Apply static tags',
  tag_dynamic: 'Apply dynamic tags'
};

export const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return Boolean(value);
};

export const getParamDefault = (param) => {
  // Prefer explicit defaults
  if (param?.input === 'single_select' && Array.isArray(param?.choices) && param.choices.length) {
    // Use provided default if present, otherwise default to first choice value
    if (param.default != null) return param.default;
    const first = param.choices[0];
    return first?.value ?? '';
  }
  if (typeof param?.type === 'string' && param.type.startsWith('array')) return '';
  if (param?.type === 'object') return {};
  if (param?.type === 'boolean') return parseBoolean(param.default ?? true);
  if (param?.default != null) return param.default;
  return '';
};

export const createActionId = () => Math.random().toString(36).slice(2, 10);

export const createCondition = (operator = getDefaultOperatorValue()) => ({
  path: '',
  operator,
  value: '',
  valueType: 'string'
});

export const buildActionState = (definition) => ({
  id: createActionId(),
  type: definition?.type || '',
  params: (definition?.params || []).reduce((acc, param) => {
    acc[param.name] = getParamDefault(param);
    return acc;
  }, {})
});

export const toArrayParam = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const extractConditions = (node) => {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(extractConditions);
  if (node.left && node.op) return [node];
  if (node.args) return node.args.flatMap(extractConditions);
  return [];
};

export const detectValueType = (value) => {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
};

export const formatConditionValue = (value) => {
  if (value === null || value === undefined || value === '') return 'empty';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

export const getActionDisplayName = (type) => {
  if (actionTitleMap[type]) return actionTitleMap[type];
  return type
    .toString()
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatActionParams = (params = {}) => {
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

export const formatUpdateLabel = (iso) => {
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

export const moveItem = (array, fromIndex, toIndex) => {
  if (!Array.isArray(array)) return array;
  const length = array.length;
  if (length === 0) return array;
  const start = ((fromIndex % length) + length) % length;
  const end = ((toIndex % length) + length) % length;
  if (start === end) return array;
  const copy = [...array];
  const [item] = copy.splice(start, 1);
  copy.splice(end, 0, item);
  return copy;
};

export const serializeRuleForExport = (rule) => {
  if (!rule || typeof rule !== 'object') return null;

  const aggregator = String(rule.expression?.op || 'and').toLowerCase();
  const normalizedAggregator = aggregator === 'or' ? 'or' : 'and';

  const conditions = extractConditions(rule.expression).map((condition) => {
    const base = {
      path: condition.left?.path || '',
      operator: condition.op || ''
    };

    if (condition.right && typeof condition.right === 'object' && !Array.isArray(condition.right)) {
      if (condition.right.path) {
        base.comparePath = condition.right.path;
      } else if ('value' in condition.right) {
        base.value = condition.right.value;
      }
    } else if (condition.right !== undefined) {
      base.value = condition.right;
    }

    return base;
  });

  return {
    name: rule.name || '',
    description: rule.description || '',
    event: rule.event || '',
    priority:
      typeof rule.priority === 'number'
        ? rule.priority
        : Number.isFinite(Number(rule.priority))
          ? Number(rule.priority)
          : 0,
    active: rule.active !== false,
    aggregator: normalizedAggregator,
    conditions,
    actions: (rule.actions || []).map((action) => ({
      type: action?.type || '',
      params: (action && typeof action === 'object' && action.params) || {}
    }))
  };
};

export const stringifyRuleExport = (rule) => {
  const exportPayload = serializeRuleForExport(rule);
  if (!exportPayload) return '';
  try {
    return JSON.stringify(exportPayload, null, 2);
  } catch (error) {
    console.error('Failed to stringify rule export', error);
    return '';
  }
};

export const parseRuleImport = (input) => {
  if (input == null) {
    throw new Error('Rule import is empty. Paste a JSON export to continue.');
  }

  let payload = input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Rule import cannot be blank. Paste the exported JSON first.');
    }
    try {
      payload = JSON.parse(trimmed);
    } catch (error) {
      throw new Error(
        'Rule import must be valid JSON. Paste the exported JSON exactly as provided.'
      );
    }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Rule import must be a JSON object that matches the export format.');
  }

  const aggregatorRaw =
    typeof payload.aggregator === 'string' ? payload.aggregator.toLowerCase() : 'and';
  const aggregator = aggregatorRaw === 'or' ? 'or' : 'and';

  const conditionsInput = Array.isArray(payload.conditions) ? payload.conditions : [];
  if (!conditionsInput.length) {
    throw new Error('Imported rules must define at least one condition.');
  }

  const args = conditionsInput.map((condition, index) => {
    if (!condition || typeof condition !== 'object') {
      throw new Error(`Condition ${index + 1} is invalid. Each condition must be an object.`);
    }
    const path = `${condition.path ?? condition.left ?? ''}`.trim();
    if (!path) {
      throw new Error(`Condition ${index + 1} is missing a data path.`);
    }
    const operator = `${condition.operator ?? condition.op ?? ''}`.trim();
    if (!operator) {
      throw new Error(`Condition ${index + 1} is missing an operator.`);
    }

    const node = {
      op: operator,
      left: { path }
    };

    if (condition.comparePath) {
      node.right = { path: condition.comparePath };
    } else if ('right' in condition) {
      const right = condition.right;
      if (right && typeof right === 'object' && !Array.isArray(right) && right.path) {
        node.right = { path: right.path };
      } else if (right !== undefined) {
        node.right = right;
      }
    } else if ('value' in condition) {
      node.right = condition.value;
    } else if ('values' in condition) {
      node.right = condition.values;
    }

    return node;
  });

  const actionsInput = Array.isArray(payload.actions) ? payload.actions : [];
  if (!actionsInput.length) {
    throw new Error('Imported rules must include at least one action.');
  }

  const actions = actionsInput.map((action, index) => {
    if (!action || typeof action !== 'object') {
      throw new Error(`Action ${index + 1} is invalid. Each action must be an object.`);
    }
    const type = `${action.type ?? ''}`.trim();
    if (!type) {
      throw new Error(`Action ${index + 1} is missing a type.`);
    }
    const params = action.params && typeof action.params === 'object' ? action.params : {};
    return { type, params };
  });

  const priorityRaw = payload.priority;
  let priority = 0;
  if (typeof priorityRaw === 'number' && Number.isFinite(priorityRaw)) {
    priority = priorityRaw;
  } else if (priorityRaw != null) {
    const parsed = Number(priorityRaw);
    if (Number.isFinite(parsed)) priority = parsed;
  }

  return {
    name: typeof payload.name === 'string' ? payload.name : '',
    description: typeof payload.description === 'string' ? payload.description : '',
    event: typeof payload.event === 'string' ? payload.event : '',
    priority,
    active: payload.active !== false,
    expression: {
      op: aggregator,
      args
    },
    actions
  };
};
