const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const sanitizeNamespace = (
  namespace,
  { replacement = '-', allowSlash = false, removeEdgeSlashes = false } = {}
) => {
  const normalizedReplacement = String(replacement || '-');
  const disallowedPattern = allowSlash ? /[^\w./-]+/g : /[^\w.-]+/g;

  let sanitized = String(namespace || '').trim().replace(disallowedPattern, normalizedReplacement);

  if (removeEdgeSlashes) {
    sanitized = sanitized.replace(/^\/+|\/+$/g, '');
  }

  const escapedReplacement = escapeRegExp(normalizedReplacement);
  const trimPattern = new RegExp(`^(?:${escapedReplacement})+|(?:${escapedReplacement})+$`, 'g');
  sanitized = sanitized.replace(trimPattern, '');

  return sanitized;
};
