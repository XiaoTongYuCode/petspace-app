const TRANSIENT_DATABASE_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
]);

type ErrorRecord = {
  cause?: unknown;
  code?: unknown;
  errors?: unknown;
  message?: unknown;
  name?: unknown;
  sourceError?: unknown;
};

function asRecord(value: unknown): ErrorRecord | null {
  return value && typeof value === "object" ? (value as ErrorRecord) : null;
}

function collectErrorText(error: unknown, seen = new Set<unknown>()): string {
  if (!error || seen.has(error)) {
    return "";
  }

  seen.add(error);

  if (typeof error === "string") {
    return error;
  }

  const record = asRecord(error);

  if (!record) {
    return "";
  }

  const parts = [
    typeof record.name === "string" ? record.name : "",
    typeof record.code === "string" ? record.code : "",
    typeof record.message === "string" ? record.message : "",
    collectErrorText(record.cause, seen),
    collectErrorText(record.sourceError, seen),
  ];

  if (Array.isArray(record.errors)) {
    for (const nested of record.errors) {
      parts.push(collectErrorText(nested, seen));
    }
  }

  return parts.filter(Boolean).join(" ");
}

function findErrorCode(error: unknown, seen = new Set<unknown>()): string | null {
  if (!error || seen.has(error)) {
    return null;
  }

  seen.add(error);

  const record = asRecord(error);

  if (!record) {
    return null;
  }

  if (typeof record.code === "string") {
    return record.code;
  }

  return (
    findErrorCode(record.cause, seen) ??
    findErrorCode(record.sourceError, seen) ??
    (Array.isArray(record.errors)
      ? record.errors.map((nested) => findErrorCode(nested, seen)).find(Boolean) ?? null
      : null)
  );
}

export function getDatabaseErrorText(error: unknown) {
  return collectErrorText(error);
}

export function isDatabaseSchemaMissingError(error: unknown) {
  const code = findErrorCode(error);
  const text = getDatabaseErrorText(error);

  return code === "42P01" || /relation ".+" does not exist/i.test(text);
}

export function isDatabaseUnavailableError(error: unknown) {
  const code = findErrorCode(error);
  const text = getDatabaseErrorText(error);

  return (
    (code ? TRANSIENT_DATABASE_CODES.has(code) : false) ||
    /fetch failed|error connecting to database|socket hang up|connection refused|connection reset|timed? ?out|abort/i.test(
      text,
    )
  );
}

export function isDatabaseReadFallbackError(error: unknown) {
  return isDatabaseSchemaMissingError(error) || isDatabaseUnavailableError(error);
}
