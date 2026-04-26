import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const DEFAULT_QUERY_TIMEOUT_MS = 10_000;
const DEFAULT_POOL_MAX = 5;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

let db: Db | null = null;
let dbUrl: string | null = null;
let pool: Pool | null = null;

function getPositiveNumber(name: string, fallback: number) {
  const configured = Number(process.env[name]);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : fallback;
}

function getQueryTimeoutMs() {
  return getPositiveNumber("DATABASE_QUERY_TIMEOUT_MS", DEFAULT_QUERY_TIMEOUT_MS);
}

function getPoolMax() {
  return getPositiveNumber("DATABASE_POOL_MAX", DEFAULT_POOL_MAX);
}

function getSslConfig(): PoolConfig["ssl"] {
  const configured = process.env.DATABASE_SSL?.toLowerCase();

  if (configured === "true" || configured === "1" || configured === "require") {
    return { rejectUnauthorized: false };
  }

  if (configured === "false" || configured === "0" || configured === "disable") {
    return false;
  }

  return undefined;
}

function createPool(connectionString: string) {
  const timeoutMs = getQueryTimeoutMs();

  return new Pool({
    connectionString,
    connectionTimeoutMillis: timeoutMs,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    max: getPoolMax(),
    query_timeout: timeoutMs,
    ssl: getSslConfig(),
    statement_timeout: timeoutMs,
  });
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const currentUrl = process.env.DATABASE_URL;

  if (!currentUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!db || !pool || dbUrl !== currentUrl) {
    if (pool) {
      void pool.end().catch(() => undefined);
    }

    pool = createPool(currentUrl);
    db = drizzle(pool, { schema });
    dbUrl = currentUrl;
  }

  return db;
}

export function getDbOrNull() {
  if (!hasDatabase()) {
    return null;
  }

  try {
    return getDb();
  } catch {
    return null;
  }
}
