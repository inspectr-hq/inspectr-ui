// src/utils/sse.js
/**
 * Parse a raw Server-Sent Events (SSE) stream into individual frames.
 * Supports standard event blocks as well as comment lines beginning with ':'
 * which are converted into frames with `event: "comment"`.
 *
 * @param {string} raw Raw SSE stream
 * @returns {Array<{id?:string,event?:string,data?:string,timestamp?:number|string}>}
 */
export function parseSseStream(raw) {
  if (!raw) return [];
  const frames = [];
  let frame = null;
  const lines = String(raw).split(/\r?\n/);
  for (const line of lines) {
    if (line === '') {
      if (frame) {
        frames.push({ ...frame, timestamp: frame.timestamp ?? Date.now() });
        frame = null;
      }
      continue;
    }
    if (line.startsWith(':')) {
      const comment = line.slice(1).trimStart();
      frames.push({ event: 'comment', data: comment, timestamp: Date.now() });
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    if (!frame) frame = {};
    const field = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trimStart();
    if (field === 'data') {
      frame.data = frame.data ? frame.data + '\n' + value : value;
    } else if (field === 'timestamp' || field === 'time') {
      const num = Number(value);
      frame.timestamp = Number.isNaN(num) ? value : num;
    } else {
      frame[field] = value;
    }
  }
  if (frame) frames.push({ ...frame, timestamp: frame.timestamp ?? Date.now() });
  return frames;
}
