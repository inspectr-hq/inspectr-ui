// src/utils/timestampUtils.js

const toIsoString = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    const dateFromNumber = new Date(value);
    if (!Number.isNaN(dateFromNumber.valueOf())) {
      return dateFromNumber.toISOString();
    }
  }
  const dateFromValue = new Date(value);
  if (!Number.isNaN(dateFromValue.valueOf())) {
    return dateFromValue.toISOString();
  }
  return String(value);
};

export const normalizeTimestamp = (value) => toIsoString(value);

export const isTimestampAfter = (candidate, baseline) => {
  if (!candidate) return false;
  if (!baseline) return true;
  const nextMs = Date.parse(candidate);
  const prevMs = Date.parse(baseline);
  if (!Number.isNaN(nextMs) && !Number.isNaN(prevMs)) {
    return nextMs > prevMs;
  }
  return candidate > baseline;
};
