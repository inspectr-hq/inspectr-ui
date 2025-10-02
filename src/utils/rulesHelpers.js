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
