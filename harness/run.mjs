#!/usr/bin/env node
// SPDX-License-Identifier: MIT

// The template harness — every template is a parity test.
//
// For each registry entry:
//   1. `boardwalk check <package>` must pass (manifest schema + compile), for every package.
//   2. Registry/filesystem consistency: every templates/ dir is registered and vice versa.
//   3. Entries with an `e2e` block are executed end-to-end through the self-hosted server
//      engine against a local HTTP fixture server; expected output required.
//
// CLI resolution: $BOARDWALK_CLI (e.g. "node /path/to/bin/boardwalk.js") or `boardwalk` on PATH.
// Zero dependencies — plain Node.

import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = join(root, "templates");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));

const cli = (process.env.BOARDWALK_CLI ?? "boardwalk").split(" ").filter(Boolean);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => {
  console.log(`  ✓ ${msg}`);
};

/** Template files on disk, relative POSIX paths, minus local-only dirs. */
function listFiles(dir, prefix = "") {
  const SKIP = new Set(["node_modules", ".boardwalk", ".bw-runs", ".env"]);
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const abs = join(dir, name);
    const rel = prefix === "" ? name : `${prefix}/${name}`;
    if (statSync(abs).isDirectory()) out.push(...listFiles(abs, rel));
    else out.push(rel);
  }
  return out;
}

// Async on purpose: a blocking spawn would freeze this process's event loop, and the fixture
// HTTP server below must keep answering while a template run probes it.
async function runCli(args) {
  const [cmd, ...prefix] = cli;
  try {
    const { stdout, stderr } = await promisify(execFile)(cmd, [...prefix, ...args], {
      encoding: "utf8",
      timeout: 120_000,
    });
    return { status: 0, stdout, stderr };
  } catch (err) {
    return { status: err.code ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? String(err) };
  }
}

// ── Server-mode parity ──────────────────────────────────────────────────────────────────
// The templates with an `e2e` block, executed through the SELF-HOSTED server engine:
// `boardwalk build` each → boot `boardwalk-server` over a mounted workflows dir → trigger via
// the JSON API → assert the expected output. Proves the self-host deploy path. Skipped unless
// BOARDWALK_SERVER names the boardwalk-server binary
// (e.g. installed from @boardwalk-labs/engine); the hosted-platform mode is tested platform-side.

async function pollRunToTerminal(baseUrl, runId, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/runs/${runId}`);
    if (res.ok) {
      const { run } = await res.json();
      if (run && ["completed", "failed", "cancelled"].includes(run.status)) return run;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

async function runServerParity(harnessUrl) {
  const serverCmd = (process.env.BOARDWALK_SERVER ?? "").split(" ").filter(Boolean);
  const templates = registry.templates.filter((t) => t.e2e !== undefined);
  if (serverCmd.length === 0) {
    console.log("\nserver-mode parity — skipped (set BOARDWALK_SERVER to the boardwalk-server binary)");
    return;
  }
  console.log("\nserver-mode parity");

  const dataDir = mkdtempSync(join(tmpdir(), "bw-harness-data-"));
  const workflowsDir = mkdtempSync(join(tmpdir(), "bw-harness-flows-"));
  const built = [];
  for (const t of templates) {
    const pkgDir = join(templatesDir, t.name, t.packages[0]);
    const res = await runCli(["build", pkgDir, "--out", join(workflowsDir, `${t.name}.mjs`)]);
    if (res.status === 0) built.push(t);
    else fail(`server: build ${t.name} failed:\n${(res.stderr || res.stdout || "").trim()}`);
  }

  const [cmd, ...prefix] = serverCmd;
  const child = spawn(cmd, prefix, {
    env: {
      ...process.env,
      BOARDWALK_DATA_DIR: dataDir,
      BOARDWALK_WORKFLOWS_DIR: workflowsDir,
      BOARDWALK_HOST: "127.0.0.1",
      BOARDWALK_PORT: "0", // ephemeral; the resolved port is read from the startup log
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  try {
    const baseUrl = await new Promise((res, rej) => {
      const deadline = Date.now() + 20_000;
      const tick = setInterval(() => {
        const m = /listening on (http:\/\/127\.0\.0\.1:\d+)/.exec(log);
        if (m) {
          clearInterval(tick);
          res(m[1]);
        } else if (Date.now() > deadline) {
          clearInterval(tick);
          rej(new Error(`server did not start within 20s:\n${log}`));
        }
      }, 100);
    });

    for (const t of built) {
      const input = JSON.parse(JSON.stringify(t.e2e.input).replaceAll("{{harnessUrl}}", harnessUrl));
      const post = await fetch(`${baseUrl}/api/workflows/${t.name}/runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!post.ok) {
        fail(`server: trigger ${t.name} → HTTP ${post.status}`);
        continue;
      }
      const { run } = await post.json();
      const final = await pollRunToTerminal(baseUrl, run.id);
      if (final === null) {
        fail(`server: ${t.name} did not reach a terminal status in time`);
      } else if (final.status !== "completed") {
        fail(`server: ${t.name} ${final.status}: ${final.error?.message ?? ""}`);
      } else if (
        t.e2e.expectOutputContains !== undefined &&
        !JSON.stringify(final.output).includes(t.e2e.expectOutputContains)
      ) {
        const got = JSON.stringify(final.output).slice(0, 200);
        fail(`server: ${t.name} output missing "${t.e2e.expectOutputContains}": ${got}`);
      } else {
        ok(`server run ${t.name} completed with expected output`);
      }
    }
  } catch (err) {
    fail(`server-mode parity error: ${err.message}`);
  } finally {
    child.kill("SIGTERM");
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(workflowsDir, { recursive: true, force: true });
  }
}

// ── A local HTTP fixture for templates that probe a URL ({{harnessUrl}}) ────────────────
const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
});
await new Promise((res) => server.listen(0, "127.0.0.1", res));
const harnessUrl = `http://127.0.0.1:${server.address().port}/`;

try {
  // ── Registry ⇄ filesystem consistency ────────────────────────────────────────────────
  console.log("registry consistency");
  const registered = new Set(registry.templates.map((t) => t.name));
  const onDisk = readdirSync(templatesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const name of onDisk) {
    if (!registered.has(name)) fail(`templates/${name} is not in registry.json`);
  }
  for (const t of registry.templates) {
    if (!onDisk.includes(t.name)) fail(`registry entry "${t.name}" has no templates/ directory`);
  }
  if (failures === 0) ok(`${onDisk.length} templates, all registered`);

  // ── Per-template checks ───────────────────────────────────────────────────────────────
  for (const t of registry.templates) {
    console.log(`\n${t.name}`);
    const dir = join(templatesDir, t.name);

    // `files` is the fetch list `boardwalk init` downloads — it must exactly match the disk.
    const diskFiles = listFiles(dir).sort();
    const registryFiles = [...t.files].sort();
    if (JSON.stringify(diskFiles) === JSON.stringify(registryFiles)) {
      ok(`files list matches disk (${diskFiles.length})`);
    } else {
      const missing = registryFiles.filter((f) => !diskFiles.includes(f));
      const unlisted = diskFiles.filter((f) => !registryFiles.includes(f));
      if (missing.length > 0) fail(`registry files not on disk: ${missing.join(", ")}`);
      if (unlisted.length > 0) fail(`disk files not in registry: ${unlisted.join(", ")}`);
    }

    // `boardwalk check` per package.
    for (const pkg of t.packages) {
      const pkgDir = join(dir, pkg);
      const res = await runCli(["check", pkgDir]);
      if (res.status === 0) ok(`check ${pkg === "." ? "" : pkg + " "}passed`);
      else fail(`check ${pkg} failed:\n${(res.stderr || res.stdout || "").trim()}`);
    }
  }

  // ── Server-mode parity — the e2e templates via the self-hosted server engine ──
  await runServerParity(harnessUrl);
} finally {
  server.close();
}

console.log(failures === 0 ? "\nall green" : `\n${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
