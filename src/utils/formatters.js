// Format a timestamp to a human-readable format
const formatTimestamp = (isoString) => {
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
  return `${formattedDate} at ${formattedTime}`;
};

// Format a duration in milliseconds to a human-readable format (ms, s, or m)
const formatDuration = (milliseconds) => {
  if (milliseconds === undefined || milliseconds === null) return 'N/A';

  // Convert to number
  const ms = Number(milliseconds);

  if (ms < 1000) {
    // Less than a second, show in milliseconds
    return `${ms}ms`;
  } else if (ms < 60000) {
    // Less than a minute, show in seconds with 2 decimal places
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    // Show in minutes with 2 decimal places
    return `${(ms / 60000).toFixed(2)}m`;
  }
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
