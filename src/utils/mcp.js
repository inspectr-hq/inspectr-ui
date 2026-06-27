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

export const parseMcpResponse = ({ rawBody, eventFrames = [] } = {}) => {
  const parsedRaw = parseJson(rawBody);
  if (parsedRaw) return parsedRaw;

  const ssePayload = getSseJsonPayload(eventFrames);
  if (!ssePayload) return null;

  return parseJson(ssePayload);
};

const getOperationMetaSources = (operation = {}) =>
  [operation?.meta, operation?.raw?.meta, operation?.response?.meta].filter(
    (meta) => meta && typeof meta === 'object'
  );

export const isMcpOperation = (operation = {}) => {
  return getOperationMetaSources(operation).some((meta) => {
    const hasMcpMeta = Boolean(meta?.mcp && Object.keys(meta.mcp).length);
    const hasTraceMcpMeta = Boolean(meta?.trace?.mcp && Object.keys(meta.trace.mcp).length);
    return meta.protocol === 'mcp' || meta?.trace?.source === 'mcp' || hasMcpMeta || hasTraceMcpMeta;
  });
};

const extractListArray = (payload, key) => {
  const parsed = parseJson(payload);
  if (!parsed) return null;

  if (Array.isArray(parsed)) {
    return parsed;
  }

  const list = parsed?.result?.[key] || parsed?.[key];
  return Array.isArray(list) ? list : null;
};

const getListPayload = ({ response, eventFrames = [], key }) => {
  const directList = extractListArray(response, key);
  if (directList) return directList;

  if (Array.isArray(eventFrames) && eventFrames.length) {
    for (const frame of eventFrames) {
      if (String(frame?.event || '').toLowerCase() !== 'message') continue;
      const list = extractListArray(frame?.data, key);
      if (list) return list;
    }
  }

  const ssePayload = getSseJsonPayload(eventFrames);
  if (ssePayload) {
    const list = extractListArray(ssePayload, key);
    if (list) return list;
  }

  return null;
};

export const getMcpToolsList = ({ method = '', response, eventFrames = [] } = {}) => {
  const lowerMethod = String(method || '').toLowerCase();
  if (lowerMethod !== 'tools/list') return null;
  return getListPayload({ response, eventFrames, key: 'tools' });
};

export const getMcpPromptsList = ({ method = '', response, eventFrames = [] } = {}) => {
  const lowerMethod = String(method || '').toLowerCase();
  if (lowerMethod !== 'prompts/list') return null;
  return getListPayload({ response, eventFrames, key: 'prompts' });
};

export const getMcpResourcesList = ({ method = '', response, eventFrames = [] } = {}) => {
  const lowerMethod = String(method || '').toLowerCase();
  if (lowerMethod !== 'resources/list') return null;
  return getListPayload({ response, eventFrames, key: 'resources' });
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

export const deriveMcpView = (method = '', response, options = {}) => {
  if (!response) return { type: 'none', raw: null };

  const lowerMethod = (method || '').toLowerCase();
  const tools =
    getMcpToolsList({ method: lowerMethod, response, eventFrames: options.eventFrames }) ||
    response?.result?.tools ||
    response?.tools ||
    (Array.isArray(response?.result?.tools) ? response.result.tools : []);
  const prompts =
    getMcpPromptsList({ method: lowerMethod, response, eventFrames: options.eventFrames }) ||
    response?.result?.prompts ||
    response?.prompts;
  const resources =
    getMcpResourcesList({ method: lowerMethod, response, eventFrames: options.eventFrames }) ||
    response?.result?.resources ||
    response?.resources;
  const structuredContent = response?.result?.structuredContent;
  const content = response?.result?.content || response?.content || [];
  const raw = response?.result ?? response;

  if (lowerMethod === 'tools/list' && Array.isArray(tools)) {
    return { type: 'toolsList', tools, raw, content };
  }
  if (lowerMethod === 'prompts/list' && Array.isArray(prompts)) {
    return { type: 'promptsList', prompts, raw, content };
  }
  if (lowerMethod === 'resources/list' && Array.isArray(resources)) {
    return { type: 'resourcesList', resources, raw, content };
  }
  if (structuredContent) {
    return { type: 'structured', structuredContent, raw, content };
  }
  if (Array.isArray(content) && content.length) {
    return { type: 'content', content, raw };
  }

  return { type: 'raw', raw, content };
};

export const getSseJsonPayload = (eventFrames = []) => {
  if (!Array.isArray(eventFrames) || !eventFrames.length) return null;
  const messages = eventFrames.filter(
    (frame) => frame?.data && frame.event && frame.event.toLowerCase() === 'message'
  );
  if (!messages.length) return null;
  return messages.map((m) => m.data).join('\n');
};

const getContentTypeValue = (headers) => {
  if (!headers) return '';
  const normalized = Array.isArray(headers)
    ? headers
    : typeof headers === 'object'
      ? Object.entries(headers).map(([name, value]) => ({ name, value }))
      : [];
  const raw = normalized.find(
    (header) => String(header?.name ?? header?.key ?? '').toLowerCase() === 'content-type'
  )?.value;
  return typeof raw === 'string' ? raw.split(';')[0].trim().toLowerCase() : '';
};

export const analyzeSseResponse = (operation = {}) => {
  const contentType = getContentTypeValue(operation?.response?.headers);
  const isSse = contentType.includes('text/event-stream');
  const frames = Array.isArray(operation?.response?.event_frames)
    ? operation.response.event_frames
    : [];
  const hasEvents = frames.length > 0 || isSse;
  const singleFrame = frames.length === 1 ? frames[0] : null;
  const eventType = String(singleFrame?.event || '').toLowerCase();
  const isMessageLike = eventType === '' || eventType === 'message';
  const parsedSingleFrameJson =
    singleFrame && isMessageLike && typeof singleFrame.data === 'string'
      ? parseJson(singleFrame.data)
      : null;
  const hasSingleJsonFrame = Boolean(parsedSingleFrameJson);

  return {
    isSse,
    hasEvents,
    hasSingleJsonFrame,
    singleJsonPayload: parsedSingleFrameJson
  };
};
