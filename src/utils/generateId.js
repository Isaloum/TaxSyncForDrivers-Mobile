/**
 * Generate a unique ID with prefix, matching web app pattern.
 * Format: prefix-timestamp-randomsuffix
 */
export function generateId(prefix = 'item') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
}
