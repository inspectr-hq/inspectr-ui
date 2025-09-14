// src/utils/mapLicenseError.js
export default function mapLicenseError(err) {
  const reason = (err && err.reason) || '';
  const status = err && err.status;
  switch (reason) {
    case 'invalid_request':
      return 'Invalid request. Submit as {"license_key": "..."}.';
    case 'invalid_format':
      return 'Invalid format. Did you paste JSON or a file? Paste only the license key string.';
    case 'ingress_unreachable':
      return 'Activation service unreachable. Check network/ingress connectivity and try again.';
    case 'activation_error':
      return `Activation failed. ${err?.details || 'Please try again or contact support.'}`;
    case 'invalid_key':
      return 'Invalid license key. Is this the exact key? Check for typos or request a new key.';
    case 'revoked':
      return 'License revoked. Contact support to resolve or obtain a new license.';
    case 'expired':
      return 'License expired. Renew your license or enter a valid key.';
    case 'storage_error':
      return 'Failed to store the license locally. Ensure write permissions and retry.';
    case 'internal_error':
      return 'Server error during activation. Please try again shortly.';
    default: {
      if (status === 401) return 'Unauthorized: Invalid license key.';
      if (status === 403) return 'Forbidden: License revoked.';
      if (status === 410) return 'Expired license. Please renew or use a new key.';
      return err?.message || 'Failed to update license';
    }
  }
}
