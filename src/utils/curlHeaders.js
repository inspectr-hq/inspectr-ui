const KNOWN_CURL_HEADER_EXCLUSIONS = new Set([
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'host',
  'te',
  'trailer',
  'upgrade',
  'proxy-connection',
  'via',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'user-agent',
  'origin',
  'referer',
  'dnt',
  'postman-token'
]);
const HEADER_PREFIXES_TO_EXCLUDE = ['sec-fetch-', 'sec-ch-ua'];

export const shouldIncludeHeaderInCurl = (headerName) => {
  if (!headerName) return false;
  const normalized = headerName.toLowerCase();
  if (KNOWN_CURL_HEADER_EXCLUSIONS.has(normalized)) return false;
  return !HEADER_PREFIXES_TO_EXCLUDE.some((prefix) => normalized.startsWith(prefix));
};
