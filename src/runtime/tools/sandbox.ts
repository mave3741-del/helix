import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const WORKSPACE_ROOT = resolve(process.cwd(), ".helix/work");

function assertSafe(rel: string) {
  const cleaned = rel.replace(/^\/+/, "").replace(/\0/g, "");
  if (cleaned.includes("..")) throw new Error("Path escape rejected");
  const full = resolve(WORKSPACE_ROOT, cleaned);
  if (full !== WORKSPACE_ROOT && !full.startsWith(WORKSPACE_ROOT + "/")) {
    throw new Error("Path escape rejected");
  }
  return { rel: cleaned, full };
}

export async function ensureWorkspace() {
  await mkdir(WORKSPACE_ROOT, { recursive: true });
}

export async function listFiles(rel = ".") {
  await ensureWorkspace();
  const { full } = assertSafe(rel || ".");
  const entries = await readdir(full, { withFileTypes: true });
  return entries.map((e) => ({
    name: e.name,
    type: e.isDirectory() ? "dir" : "file",
    path: relative(WORKSPACE_ROOT, join(full, e.name)) || e.name,
  }));
}

export async function readWorkspaceFile(rel: string) {
  await ensureWorkspace();
  const { full } = assertSafe(rel);
  const buf = await readFile(full);
  if (buf.length > 400_000) throw new Error("File too large");
  return buf.toString("utf8");
}

export async function writeWorkspaceFile(rel: string, content: string) {
  await ensureWorkspace();
  if (content.length > 400_000) throw new Error("Write too large");
  const { full } = assertSafe(rel);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
  return { path: rel, bytes: Buffer.byteLength(content) };
}

export async function runNodeFile(rel: string, timeoutMs = 8000) {
  await ensureWorkspace();
  const { full } = assertSafe(rel);
  if (!existsSync(full)) throw new Error(`Missing ${rel}`);
  return await new Promise<{ ok: boolean; stdout: string; stderr: string; code: number }>((resolveP) => {
    const child = spawn(process.execPath, [full], {
      cwd: WORKSPACE_ROOT,
      env: { PATH: process.env.PATH, HOME: WORKSPACE_ROOT, NODE_ENV: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += String(d);
      if (stdout.length > 20_000) stdout = stdout.slice(0, 20_000);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
      if (stderr.length > 20_000) stderr = stderr.slice(0, 20_000);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolveP({ ok: (code ?? 1) === 0, stdout, stderr, code: code ?? 1 });
    });
    child.on("error", (err) => {
      clearTimeout(t);
      resolveP({ ok: false, stdout, stderr: err.message, code: 1 });
    });
  });
}

const FIB_SRC = `export function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("n must be a non-negative integer");
  if (n < 2) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const n = Number(process.argv[2] ?? 10);
  console.log(String(fibonacci(n)));
}
`;

const FIB_TEST = `import { fibonacci } from "./fibonacci.mjs";
import assert from "node:assert/strict";

assert.equal(fibonacci(0), 0);
assert.equal(fibonacci(1), 1);
assert.equal(fibonacci(10), 55);
assert.equal(fibonacci(20), 6765);
console.log("fibonacci tests passed");
`;

export async function runFibonacciProject() {
  await writeWorkspaceFile("fibonacci.mjs", FIB_SRC);
  await writeWorkspaceFile("fibonacci.test.mjs", FIB_TEST);
  const result = await runNodeFile("fibonacci.test.mjs");
  return {
    files: ["fibonacci.mjs", "fibonacci.test.mjs"],
    ...result,
    evidence: result.ok ? "code-run-pass" : "code-run-fail",
  };
}

export async function fetchUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "Helix/2 research-tool" },
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      body: text.slice(0, 8000),
    };
  } finally {
    clearTimeout(t);
  }
}
