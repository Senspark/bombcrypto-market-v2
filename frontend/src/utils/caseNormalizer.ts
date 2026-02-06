/**
 * Temporary utility for supporting both snake_case and camelCase during backend migration.
 * TODO: Remove after migration complete
 */

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function normalizeResponse<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(normalizeResponse) as T;
  }

  const result = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    const value = (data as Record<string, unknown>)[key];

    // Recursively normalize nested objects/arrays
    result[key] = normalizeResponse(value);

    // Add camelCase alias for snake_case keys
    if (key.includes('_')) {
      const camelKey = snakeToCamel(key);
      if (!(camelKey in result)) result[camelKey] = result[key];
    }

    // Add snake_case alias for camelCase keys
    if (/[a-z][A-Z]/.test(key)) {
      const snakeKey = camelToSnake(key);
      if (!(snakeKey in result)) result[snakeKey] = result[key];
    }
  }
  return result as T;
}
