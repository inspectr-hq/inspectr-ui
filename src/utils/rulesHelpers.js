// src/utils/rulesHelpers.js

export const operatorOptions = [
  { value: '==', label: 'is equal to' },
  { value: '!=', label: 'is not equal to' },
  { value: '>', label: 'is greater than' },
  { value: '>=', label: 'is greater or equal to' },
  { value: '<', label: 'is less than' },
  { value: '<=', label: 'is less or equal to' }
];

export const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' }
];

export const aggregatorOptions = [
  { value: 'and', label: 'All conditions match' },
  { value: 'or', label: 'Any condition matches' }
];

export const aggregatorHints = {
  and: 'All conditions must match before actions run.',
  or: 'Any condition may match before actions run.'
};

export const operatorLabelMap = operatorOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

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
  if (param.type.startsWith('array')) return '';
  if (param.type === 'boolean') return parseBoolean(param.default ?? true);
  if (param.default != null) return param.default;
  return '';
};

export const createActionId = () => Math.random().toString(36).slice(2, 10);

export const createCondition = () => ({
  path: '',
  operator: '==',
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
