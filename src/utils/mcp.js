// src/utils/mcp.js

const tryParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const dataMatch = trimmed.match(/data:\s*(\{[\s\S]*\})/);
  if (dataMatch && dataMatch[1]) {
    const parsed = tryParse(dataMatch[1].trim());
    if (parsed) return parsed;
  }

  return null;
};

export const summarizeSchema = (schema) => {
  if (!schema || typeof schema !== 'object') return { total: 0, required: 0 };
  const properties = schema.properties || {};
  const required = Array.isArray(schema.required) ? schema.required.length : 0;
  return { total: Object.keys(properties).length, required };
};

export const getMimeLanguage = (mimeType = '') => {
  const lower = mimeType.toLowerCase();
  if (lower.includes('json')) return 'json';
  if (lower.includes('xml')) return 'xml';
  if (lower.includes('html')) return 'html';
  if (lower.includes('javascript')) return 'javascript';
  if (lower.includes('css')) return 'css';
  if (lower.includes('yaml') || lower.includes('yml')) return 'yaml';
  if (lower.includes('sql')) return 'sql';
  if (lower.startsWith('text/')) return 'plaintext';
  return 'json';
};

export const validateArgsAgainstSchema = (args = {}, schema) => {
  if (!schema || typeof schema !== 'object') return { missing: [], extra: [] };
  const requiredList = new Set(schema.required || []);
  const props = new Set(Object.keys(schema.properties || {}));
  const argKeys = Object.keys(args);
  const missing = Array.from(requiredList).filter((key) => !argKeys.includes(key));
  const extra = argKeys.filter((key) => !props.has(key));
  return { missing, extra };
};

export const getMcpMethodColor = (method = '') => {
  const value = method.toLowerCase();
  if (value.includes('tool')) return 'blue';
  if (value.includes('prompt')) return 'indigo';
  if (value.includes('resource')) return 'emerald';
  if (value.includes('model')) return 'amber';
  return 'slate';
};

export const deriveMcpView = (method = '', response) => {
  if (!response) return { type: 'none', raw: null };

  const lowerMethod = (method || '').toLowerCase();
  const tools =
    response?.result?.tools ||
    response?.tools ||
    (Array.isArray(response?.result?.tools) ? response.result.tools : []);
  const prompts = response?.result?.prompts;
  const resources = response?.result?.resources;
  const structuredContent = response?.result?.structuredContent;
  const raw = response?.result ?? response;

  if (lowerMethod === 'tools/list' && Array.isArray(tools)) {
    return { type: 'toolsList', tools, raw };
  }
  if (lowerMethod === 'prompts/list' && Array.isArray(prompts)) {
    return { type: 'promptsList', prompts, raw };
  }
  if (lowerMethod === 'resources/list' && Array.isArray(resources)) {
    return { type: 'resourcesList', resources, raw };
  }
  if (structuredContent) {
    return { type: 'structured', structuredContent, raw };
  }

  return { type: 'raw', raw };
};
