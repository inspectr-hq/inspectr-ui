const CREDENTIAL_PARAM_KEYS = ['channelCode', 'channel', 'token', 'sseEndpoint', 'sync'];

export const shouldSyncInitialOperations = (syncParam) =>
  typeof syncParam !== 'string' || syncParam.toLowerCase() !== 'false';

export const sanitizeCredentialParams = (href) => {
  const sanitizedUrl = new URL(href);
  CREDENTIAL_PARAM_KEYS.forEach((key) => sanitizedUrl.searchParams.delete(key));

  const [hashPath, hashQuery] = sanitizedUrl.hash.split('?');
  if (hashQuery !== undefined) {
    const sanitizedHashParams = new URLSearchParams(hashQuery);
    CREDENTIAL_PARAM_KEYS.forEach((key) => sanitizedHashParams.delete(key));
    const nextHashQuery = sanitizedHashParams.toString();
    sanitizedUrl.hash = nextHashQuery ? `${hashPath}?${nextHashQuery}` : hashPath;
  }

  return `${sanitizedUrl.pathname}${sanitizedUrl.search}${sanitizedUrl.hash}`;
};
