import "server-only";
import postgres from "postgres";

// One pooled connection for the server. DATABASE_URL can be local Postgres or
// Supabase (use the pooler URL on serverless: prepare:false keeps it
// compatible with transaction pooling). Every query goes through the `sql`
// tagged template, which sends values as parameters, never as SQL text.

/**
 * Prisma-style connection strings carry options Postgres itself doesn't know
 * (pgbouncer=true, connection_limit, schema). Strip them so the same
 * DATABASE_URL works for both apps in this repo.
 */
export function cleanUrl(raw: string | undefined) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    for (const k of ["pgbouncer", "connection_limit", "pool_timeout", "schema", "statement_cache_size"]) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return raw;
  }
}

// DATABASE_URL, or what Vercel's database integrations create when a prefix
// is chosen (PIED_URL) or none is (POSTGRES_URL).
const url = cleanUrl(process.env.DATABASE_URL || process.env.PIED_URL || process.env.PIED_DATABASE_URL || process.env.POSTGRES_URL);
const local = !!url && /@(127\.0\.0\.1|localhost)[:/]/.test(url);

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __piedSql?: Sql };

export const hasDb = () => !!url;

export function db(): Sql {
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!g.__piedSql) {
    g.__piedSql = postgres(url, {
      max: Number(process.env.DB_POOL ?? 5),
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: local ? false : "require",
      onnotice: () => {},
      // Keep query text and parameters out of error messages that might be logged.
      debug: false,
    });
  }
  return g.__piedSql;
}
