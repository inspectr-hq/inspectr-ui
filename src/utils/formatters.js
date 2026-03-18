// Format a timestamp to a human-readable format
const formatTimestamp = (isoString, options) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const formattedDate = date.toLocaleDateString('en-CA', {
    // YYYY-MM-DD format
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formattedTime = date.toLocaleTimeString([], {
    // HH:MM:SS in local time
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // 24-hour format
  });

  const includeMilliseconds = options?.includeMilliseconds === true;
  const milliseconds = includeMilliseconds
    ? `.${String(date.getMilliseconds()).padStart(3, '0')}`
    : '';

  return `${formattedDate} at ${formattedTime}${milliseconds}`;
};

// Format a duration in milliseconds to a human-readable format (ms, s, or m)
const formatDuration = (milliseconds) => {
  if (milliseconds === undefined || milliseconds === null) return 'N/A';

  const ms = Number(milliseconds);
  if (!Number.isFinite(ms)) return 'N/A';

  const sign = ms < 0 ? '-' : '';
  const absMs = Math.abs(ms);

  const trim = (value, maxFractionDigits = 2) => {
    const text = value.toFixed(maxFractionDigits);
    return text.replace(/\.?0+$/, '');
  };

  if (absMs < 1000) return `${sign}${trim(absMs, 0)}ms`;
  if (absMs < 60000) return `${sign}${trim(absMs / 1000)}s`;
  if (absMs < 3600000) return `${sign}${trim(absMs / 60000)}m`;
  if (absMs < 86400000) return `${sign}${trim(absMs / 3600000)}h`;
  return `${sign}${trim(absMs / 86400000)}d`;
};

// Format a size in bytes to a human-readable format (B, KB, MB, etc.)
const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null) return 'N/A';

  // Convert to number
  const size = Number(bytes);

  if (size === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const digitGroups = Math.floor(Math.log10(size) / Math.log10(1024));

  // Format with 2 decimal places if not in bytes
  return digitGroups === 0
    ? `${size} ${units[digitGroups]}`
    : `${(size / Math.pow(1024, digitGroups)).toFixed(2)} ${units[digitGroups]}`;
};

export { formatTimestamp, formatDuration, formatSize };
