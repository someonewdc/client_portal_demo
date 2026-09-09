export type JsonPrimitive = boolean | number | string | null;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];

export const BOUNDED_JSON_LIMITS = {
  depth: 8,
  entriesPerCollection: 100,
  keyLength: 200,
  nodes: 500,
  stringLength: 2_000,
} as const;

export const REDACTED_JSON_VALUE = '***REDACTED***';

const SENSITIVE_KEY = /authorization|cookie|api[_-]?key|token|secret|password/i;
const DEPTH_MARKER = '[Truncated: maximum depth reached]';
const NODE_MARKER = '[Truncated: maximum node count reached]';
const ENTRY_MARKER = '[Truncated: more entries are available]';
const CYCLE_MARKER = '[Truncated: circular reference]';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (isJsonObject(value)) {
    return redactJsonObject(value);
  }
  return value;
}

export function redactJsonObject(value: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED_JSON_VALUE : redactValue(entry),
    ]),
  );
}

function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}… [truncated]`;
}

function normalizeBoundedValue(
  value: unknown,
  depth: number,
  budget: { remaining: number },
  seen: WeakSet<object>,
): JsonValue | undefined {
  if (budget.remaining <= 0) {
    return NODE_MARKER;
  }
  budget.remaining -= 1;

  if (
    value === null ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }
  if (typeof value === 'string') {
    return truncateText(value, BOUNDED_JSON_LIMITS.stringLength);
  }
  if (!Array.isArray(value) && !isRecord(value)) {
    return undefined;
  }
  if (depth >= BOUNDED_JSON_LIMITS.depth) {
    return DEPTH_MARKER;
  }
  if (seen.has(value)) {
    return CYCLE_MARKER;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const result: JsonValue[] = [];
    const entryCount = Math.min(value.length, BOUNDED_JSON_LIMITS.entriesPerCollection);
    for (let index = 0; index < entryCount; index += 1) {
      result.push(
        normalizeBoundedValue(value[index], depth + 1, budget, seen) ?? '[Unsupported value]',
      );
      if (budget.remaining <= 0) {
        break;
      }
    }
    if (entryCount < value.length || budget.remaining <= 0) {
      result.push(ENTRY_MARKER);
    }
    return result;
  }

  const result = Object.create(null) as Record<string, JsonValue>;
  let entries = 0;
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      continue;
    }
    if (entries >= BOUNDED_JSON_LIMITS.entriesPerCollection || budget.remaining <= 0) {
      result.__truncated__ = ENTRY_MARKER;
      break;
    }
    const displayKey = truncateText(key, BOUNDED_JSON_LIMITS.keyLength);
    result[displayKey] =
      normalizeBoundedValue(value[key], depth + 1, budget, seen) ?? '[Unsupported value]';
    entries += 1;
  }
  return result;
}

export function toBoundedJsonValue(value: unknown): JsonValue | undefined {
  return normalizeBoundedValue(
    value,
    0,
    { remaining: BOUNDED_JSON_LIMITS.nodes },
    new WeakSet<object>(),
  );
}
