// Local PostgreSQL for development, using the binaries bundled in the
// embedded-postgres devDependency (no Docker, no installer, no admin rights).
//
//   npm run db:start   initialise (first time) and start on 127.0.0.1:54322
//   npm run db:stop    stop the server
//   npm run db:status  is it running?
//
// Port and credentials match `supabase start` defaults, so DATABASE_URL in
// .env.example works unchanged whether this or the Supabase CLI stack is running.
// Production uses Supabase's own Postgres; this file never runs there.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const PORT = 54322;
const USER = "postgres";
const PASSWORD = "postgres";

const require = createRequire(import.meta.url);
const platform = process.platform === "win32" ? "windows" : process.platform;
const pkg = `@embedded-postgres/${platform}-${process.arch}`;
let binDir;
try {
  // package "exports" hides package.json; resolve the entry (dist/index.js) and go up.
  binDir = join(dirname(require.resolve(pkg)), "..", "native", "bin");
} catch {
  console.error(`No embedded-postgres binaries for ${process.platform}-${process.arch}. Use \`npx supabase start\` (Docker) instead.`);
  process.exit(1);
}

const root = process.cwd();
const dataDir = join(root, ".pg", "data");
const logFile = join(root, ".pg", "postgres.log");
const exe = (name) => join(binDir, process.platform === "win32" ? `${name}.exe` : name);

function run(name, args, opts = {}) {
  const r = spawnSync(exe(name), args, { stdio: "inherit", ...opts });
  return r.status ?? 1;
}

function init() {
  if (existsSync(join(dataDir, "PG_VERSION"))) return;
  mkdirSync(dirname(dataDir), { recursive: true });
  const pwfile = join(root, ".pg", "pwfile");
  writeFileSync(pwfile, PASSWORD);
  console.log("Initialising database cluster…");
  const code = run("initdb", ["-D", dataDir, "-U", USER, "--pwfile", pwfile, "-A", "scram-sha-256", "-E", "UTF8", "--locale=C"]);
  if (code !== 0) process.exit(code);
}

const cmd = process.argv[2];
switch (cmd) {
  case "start": {
    init();
    // stdio ignored: the server would otherwise inherit our pipes and keep the caller attached.
    const code = run("pg_ctl", ["-D", dataDir, "-l", logFile, "-o", `-p ${PORT} -c listen_addresses=127.0.0.1`, "-w", "start"], { stdio: "ignore" });
    if (code !== 0) console.error(`pg_ctl start failed (exit ${code}); see ${logFile}`);
    if (code === 0) console.log(`PostgreSQL listening on postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/postgres`);
    process.exit(code);
  }
  case "stop":
    process.exit(run("pg_ctl", ["-D", dataDir, "-m", "fast", "stop"]));
  case "status":
    process.exit(run("pg_ctl", ["-D", dataDir, "status"]));
  default:
    console.error("usage: node scripts/db.mjs <start|stop|status>");
    process.exit(2);
}
