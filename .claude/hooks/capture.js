#!/usr/bin/env node
// 8x agent-capture hook for Claude Code.
//
// Wired from .claude/settings.json:
//   UserPromptSubmit -> `node .claude/hooks/capture.js prompt`
//   Stop             -> `node .claude/hooks/capture.js response`
//
// Both events hand a JSON payload on stdin. The prompt event carries the
// verbatim prompt; the stop event carries `transcript_path`, which we read to
// pull out only the final assistant text of the turn (no thinking, no tool
// calls). Everything is appended to .agent-logs/<date>_<time>_<session>.md.

const fs = require("fs");
const path = require("path");

const MODE = process.argv[2]; // "prompt" | "response"
const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(ROOT, ".agent-logs");
const CONFIG = readJson(path.join(__dirname, "capture.config.json")) || {};
const AUTHOR = CONFIG.author || "unknown";
const PROJECT = CONFIG.project || path.basename(ROOT);
const TOOL = "claude-code";

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

// --- log file lookup / creation -------------------------------------------

function findLogFile(sessionId) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  const hit = fs.readdirSync(LOG_DIR).find((f) => f.endsWith("_" + sessionId + ".md"));
  return hit ? path.join(LOG_DIR, hit) : null;
}

function newLogFile(sessionId, isoTime) {
  const d = new Date(isoTime);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + "_" +
    pad(d.getUTCHours()) + "-" + pad(d.getUTCMinutes()) + "-" + pad(d.getUTCSeconds());
  return path.join(LOG_DIR, stamp + "_" + sessionId + ".md");
}

// --- frontmatter -----------------------------------------------------------

const FM_RE = /^---\n([\s\S]*?)\n---\n/;

function parseFrontmatter(text) {
  const m = text.match(FM_RE);
  const meta = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { meta, body: m ? text.slice(m[0].length) : text };
}

function renderFrontmatter(meta) {
  const keys = [
    "session_id", "date", "author", "model", "tool", "project",
    "total_exchanges", "first_prompt_time", "last_prompt_time",
  ];
  return "---\n" + keys.map((k) => k + ": " + (meta[k] ?? "")).join("\n") + "\n---\n";
}

function loadOrInit(sessionId, isoTime, model) {
  let file = findLogFile(sessionId);
  let meta, body;
  if (file && fs.existsSync(file)) {
    ({ meta, body } = parseFrontmatter(fs.readFileSync(file, "utf8")));
  } else {
    file = newLogFile(sessionId, isoTime);
    const date = isoTime.slice(0, 10);
    meta = {
      session_id: sessionId,
      date,
      author: AUTHOR,
      model,
      tool: TOOL,
      project: PROJECT,
      total_exchanges: 0,
      first_prompt_time: isoTime,
      last_prompt_time: isoTime,
    };
    body =
      "\n# Session Log - " + date + "\n\n" +
      "Session: `" + sessionId.slice(0, 8) + "` | Project: `" + PROJECT + "` | Author: `" + AUTHOR + "`\n\n---\n";
  }
  return { file, meta, body };
}

function save(file, meta, body) {
  fs.writeFileSync(file, renderFrontmatter(meta) + body, "utf8");
}

// --- transcript parsing ----------------------------------------------------

function readTranscript(p) {
  const out = [];
  let raw;
  try { raw = fs.readFileSync(p, "utf8"); } catch { return out; }
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* skip partial line */ }
  }
  return out;
}

function isHumanPrompt(entry) {
  if (entry.type !== "user" || entry.isMeta) return false;
  const c = entry.message && entry.message.content;
  if (typeof c === "string") return true;
  if (Array.isArray(c)) return c.length > 0 && c.every((b) => b.type === "text");
  return false;
}

function isToolResult(entry) {
  const c = entry.type === "user" && entry.message && entry.message.content;
  return Array.isArray(c) && c.some((b) => b.type === "tool_result");
}

function assistantText(entry) {
  const c = entry.message && entry.message.content;
  if (typeof c === "string") return c;
  if (!Array.isArray(c)) return "";
  return c.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("\n");
}

// The "final response" is the assistant text after the last tool call of the
// turn. If the turn had no trailing text (e.g. it ended on a question tool),
// fall back to the last text the assistant produced anywhere in the turn.
function extractFinalResponse(entries) {
  let start = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isHumanPrompt(entries[i])) { start = i; break; }
  }
  const turn = entries.slice(start + 1);
  let lastToolIdx = -1;
  for (let i = 0; i < turn.length; i++) if (isToolResult(turn[i])) lastToolIdx = i;

  const tail = turn.slice(lastToolIdx + 1).filter((e) => e.type === "assistant");
  const modelEntry = [...turn].reverse().find((e) => e.type === "assistant" && e.message && e.message.model);
  let text = tail.map(assistantText).filter(Boolean).join("\n\n").trim();
  if (!text) {
    const any = turn.filter((e) => e.type === "assistant").map(assistantText).filter(Boolean);
    text = (any[any.length - 1] || "").trim();
  }
  const ts = [...turn].reverse().find((e) => e.type === "assistant" && e.timestamp);
  return {
    text,
    model: (modelEntry && modelEntry.message.model) || "",
    timestamp: (ts && ts.timestamp) || new Date().toISOString(),
  };
}

// --- main ------------------------------------------------------------------

function main() {
  let payload = {};
  try { payload = JSON.parse(readStdin()); } catch { payload = {}; }
  const sessionId = payload.session_id || "unknown-session";
  const now = new Date().toISOString();

  if (MODE === "prompt") {
    const prompt = payload.prompt ?? "";
    // Model isn't in the prompt payload; take the last one seen in the transcript.
    const entries = payload.transcript_path ? readTranscript(payload.transcript_path) : [];
    const lastModel = [...entries].reverse().find((e) => e.type === "assistant" && e.message && e.message.model);
    const model = (lastModel && lastModel.message.model) || CONFIG.default_model || "";

    const { file, meta, body } = loadOrInit(sessionId, now, model);
    const num = Number(meta.total_exchanges || 0) + 1;
    meta.total_exchanges = num;
    meta.last_prompt_time = now;
    if (model) meta.model = model;
    const entry =
      "\n[LOG_ENTRY type=PROMPT num=" + num + " session=" + sessionId.slice(0, 8) + "]\n" +
      "timestamp: " + now + "\n" +
      "model: " + (model || "unknown") + "\n\n" +
      prompt + "\n\n";
    save(file, meta, body + entry);
    return;
  }

  if (MODE === "response") {
    if (payload.stop_hook_active) return; // never loop
    const entries = payload.transcript_path ? readTranscript(payload.transcript_path) : [];
    const { text, model, timestamp } = extractFinalResponse(entries);
    const { file, meta, body } = loadOrInit(sessionId, timestamp, model);
    const num = Number(meta.total_exchanges || 0);
    if (model) meta.model = model;
    const entry =
      "\n[LOG_ENTRY type=RESPONSE num=" + num + " session=" + sessionId.slice(0, 8) + "]\n" +
      "timestamp: " + timestamp + "\n" +
      "model: " + (model || "unknown") + "\n\n" +
      (text || "(no text response this turn)") + "\n\n";
    save(file, meta, body + entry);
    return;
  }

  process.stderr.write("capture.js: unknown mode " + MODE + "\n");
}

try { main(); } catch (e) {
  // Never block the agent because logging failed; leave a trace instead.
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, "capture-errors.log"), new Date().toISOString() + " " + MODE + ": " + ((e && e.stack) || e) + "\n");
  } catch {}
}
