// Local database for development: an embedded PostgreSQL (no Docker), plus a
// migration runner that works against any Postgres, Supabase included.
//   node scripts/db.mjs start     → runs Postgres on 127.0.0.1:54329
//   node scripts/db.mjs stop
//   node scripts/db.mjs migrate   → applies sql/schema.sql to $DATABASE_URL
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cmd = process.argv[2];

function env() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

if (cmd === "start" || cmd === "stop") {
  // Use the binaries bundled in the embedded-postgres devDependency directly.
  const { spawnSync } = await import("node:child_process");
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const bin = path.join(path.dirname(require.resolve(`@embedded-postgres/${process.platform}-${process.arch}`)), "..", "native", "bin");
  const data = path.join(root, ".pg", "data");
  const run = (name, args) => spawnSync(path.join(bin, name), args, { stdio: "inherit" }).status ?? 1;
  if (cmd === "stop") process.exit(run("pg_ctl", ["-D", data, "-m", "fast", "stop"]));
  if (!fs.existsSync(path.join(data, "PG_VERSION"))) {
    fs.mkdirSync(path.dirname(data), { recursive: true });
    const pw = path.join(root, ".pg", "pwfile");
    fs.writeFileSync(pw, "pied-local-only");
    if (run("initdb", ["-D", data, "-U", "pied", "--pwfile", pw, "-A", "scram-sha-256", "-E", "UTF8", "--locale=C"]) !== 0) process.exit(1);
  }
  const running = spawnSync(path.join(bin, "pg_ctl"), ["-D", data, "status"], { stdio: "ignore" }).status === 0;
  if (!running) {
    const code = spawnSync(path.join(bin, "pg_ctl"), ["-D", data, "-l", path.join(root, ".pg", "postgres.log"), "-o", "-p 54329 -c listen_addresses=127.0.0.1", "-w", "start"], { stdio: "ignore" }).status;
    if (code !== 0) process.exit(code ?? 1);
  }
  const { default: postgres } = await import("postgres");
  const admin = postgres("postgres://pied:pied-local-only@127.0.0.1:54329/postgres", { max: 1, onnotice: () => {} });
  const [{ n }] = await admin`select count(*)::int as n from pg_database where datname = 'pied'`;
  if (!n) await admin.unsafe("create database pied");
  await admin.end();
  console.log("Postgres on 127.0.0.1:54329 — DATABASE_URL=postgres://pied:pied-local-only@127.0.0.1:54329/pied");
} else if (cmd === "migrate") {
  env();
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
  const { default: postgres } = await import("postgres");
  const local = /@(127\.0\.0\.1|localhost)[:/]/.test(process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: local ? false : "require", onnotice: () => {} });
  await sql.unsafe(fs.readFileSync(path.join(root, "sql/schema.sql"), "utf8"));
  await sql.end();
  console.log("schema applied");
} else {
  console.log("usage: node scripts/db.mjs start | stop | migrate");
}
