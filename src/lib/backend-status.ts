import { sql } from "drizzle-orm";
import { getDbOrNull } from "@/db";
import {
  getDatabaseErrorText,
  isDatabaseSchemaMissingError,
  isDatabaseUnavailableError,
} from "@/db/errors";
import { postComments, posts, userCheckIns } from "@/db/schema";
import { hasClerkEnv, isClerkKeylessMode } from "@/lib/auth";
import { hasOssEnv } from "@/lib/oss";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "ALIYUN_ACCESS_KEY_ID",
  "ALIYUN_ACCESS_KEY_SECRET",
  "ALIYUN_OSS_ROLE_ARN",
  "ALIYUN_OSS_BUCKET",
  "ALIYUN_OSS_REGION",
  "ALIYUN_OSS_ENDPOINT",
] as const;

type RequiredEnvName = (typeof REQUIRED_ENV)[number];

const STATUS_CACHE_MS = 30_000;

let checkedStatusCache:
  | {
      expiresAt: number;
      status: BackendStatus;
    }
  | null = null;

export type BackendStatus = {
  ready: boolean;
  mode: "live" | "preview";
  configured: {
    database: boolean;
    clerk: boolean;
    clerkKeyless: boolean;
    oss: boolean;
  };
  database: {
    checked: boolean;
    reachable: boolean | null;
    schemaReady: boolean | null;
    error: string | null;
  };
  missingEnv: RequiredEnvName[];
};

function hasEnv(name: RequiredEnvName) {
  return Boolean(process.env[name]);
}

function redactEnvValues(message: string) {
  let safeMessage = message;

  for (const name of REQUIRED_ENV) {
    const value = process.env[name];

    if (value) {
      safeMessage = safeMessage.replaceAll(value, `[${name}]`);
    }
  }

  return safeMessage;
}

export async function getBackendStatus(options: { checkDatabase?: boolean } = {}) {
  const checkDatabase = Boolean(options.checkDatabase);

  if (
    checkDatabase &&
    checkedStatusCache &&
    checkedStatusCache.expiresAt > Date.now()
  ) {
    return checkedStatusCache.status;
  }

  const missingEnv = REQUIRED_ENV.filter((name) => !hasEnv(name));
  const databaseConfigured = hasEnv("DATABASE_URL");
  const clerkKeyless = isClerkKeylessMode();
  const clerkConfigured = hasClerkEnv() || clerkKeyless;
  const ossConfigured = hasOssEnv();
  let databaseReachable: boolean | null = null;
  let databaseSchemaReady: boolean | null = null;
  let databaseError: string | null = null;

  if (checkDatabase && databaseConfigured) {
    try {
      const db = getDbOrNull();

      if (!db) {
        databaseReachable = false;
        databaseError = "DATABASE_URL is not configured.";
      } else {
        await db.execute(sql`select 1`);
        databaseReachable = true;

        try {
          await Promise.all([
            db.select({ id: posts.id }).from(posts).limit(1),
            db.select({ id: postComments.id }).from(postComments).limit(1),
            db.select({ id: userCheckIns.id }).from(userCheckIns).limit(1),
          ]);
          databaseSchemaReady = true;
        } catch (error) {
          if (!isDatabaseSchemaMissingError(error)) {
            throw error;
          }

          databaseSchemaReady = false;
          databaseError = "Database is reachable, but migrations have not been applied.";
        }
      }
    } catch (error) {
      const unavailable = isDatabaseUnavailableError(error);

      databaseReachable = false;
      databaseSchemaReady = unavailable ? null : databaseSchemaReady;
      databaseError = unavailable
        ? "Database connection timed out or is unreachable. Check DATABASE_URL, network access, and PostgreSQL availability."
        : redactEnvValues(getDatabaseErrorText(error) || "Database health check failed.");
    }
  }

  const ready =
    databaseConfigured &&
    clerkConfigured &&
    ossConfigured &&
    (!checkDatabase || databaseReachable !== false) &&
    (!checkDatabase || databaseSchemaReady !== false);

  const status = {
    ready,
    mode: ready ? "live" : "preview",
    configured: {
      database: databaseConfigured,
      clerk: clerkConfigured,
      clerkKeyless,
      oss: ossConfigured,
    },
    database: {
      checked: checkDatabase,
      reachable: databaseReachable,
      schemaReady: databaseSchemaReady,
      error: databaseError,
    },
    missingEnv,
  } satisfies BackendStatus;

  if (checkDatabase) {
    checkedStatusCache = {
      expiresAt: Date.now() + STATUS_CACHE_MS,
      status,
    };
  }

  return status;
}
