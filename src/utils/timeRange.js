// src/utils/timeRange.js

const joinDateParts = (date, hours = 0, minutes = 0, seconds = 0, ms = 0) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds, ms);
};

export const getStartOfDay = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }
  return joinDateParts(date).toISOString();
};

export const getEndOfDay = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }
  return joinDateParts(date, 23, 59, 59, 999).toISOString();
};

const createPreset = (label, startDate, endDate) => {
  const start = getStartOfDay(startDate);
  const end = getEndOfDay(endDate);
  return {
    label,
    start,
    end,
    tooltip: `${start} – ${end}`
  };
};

export const getTimeRangePresets = (referenceDate = new Date()) => {
  const today = referenceDate instanceof Date ? new Date(referenceDate) : new Date();
  const presets = [
    createPreset('Today', today, today),
    createPreset('7D', new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), today),
    createPreset('30D', new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today),
    createPreset(
      '3M',
      new Date(today.getUTCFullYear(), today.getUTCMonth() - 3, today.getUTCDate()),
      today
    ),
    createPreset(
      '6M',
      new Date(today.getUTCFullYear(), today.getUTCMonth() - 6, today.getUTCDate()),
      today
    )
  ];
  return presets;
};

export const findPresetByLabel = (label, referenceDate = new Date()) => {
  if (!label) return null;
  const presets = getTimeRangePresets(referenceDate);
  return presets.find((preset) => preset.label === label) || null;
};
