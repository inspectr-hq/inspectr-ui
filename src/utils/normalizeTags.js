// src/utils/normalizeTags.js
const TAG_SEPARATORS = [':', '='];

const asString = (value) => {
  if (value == null) return '';
  return typeof value === 'string' ? value : String(value);
};

export const normalizeTag = (input) => {
  const raw = asString(input).trim();
  if (!raw) return null;

  let separatorIndex = -1;
  let separatorChar = '';

  for (const separator of TAG_SEPARATORS) {
    const index = raw.indexOf(separator);
    if (index > 0 && index < raw.length - 1) {
      separatorIndex = index;
      separatorChar = separator;
      break;
    }
  }

  if (separatorIndex === -1) {
    return {
      type: 'simple',
      raw,
      display: raw,
      key: null,
      value: null,
      separator: null,
      token: raw.toLowerCase()
    };
  }

  const key = raw.slice(0, separatorIndex).trim();
  const value = raw.slice(separatorIndex + 1).trim();

  if (!key || !value) {
    return {
      type: 'simple',
      raw,
      display: raw,
      key: null,
      value: null,
      separator: null,
      token: raw.toLowerCase()
    };
  }

  return {
    type: 'kv',
    raw,
    display: `${key}:${value}`,
    key,
    value,
    separator: separatorChar,
    token: `${key}:${value}`.toLowerCase(),
    keyToken: key.toLowerCase()
  };
};

export const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.map(normalizeTag).filter(Boolean);
};

export const normalizeTagFilters = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(normalizeTag)
    .filter(Boolean)
    .map((tag) => tag.token);
};
