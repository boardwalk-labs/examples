#!/usr/bin/env node
// The template harness — every template is a parity test.
//
// For each registry entry:
//   1. `boardwalk check <package>` must pass (manifest schema + compile), for every package.
//   2. Registry/filesystem consistency: every templates/ dir is registered and vice versa;
//      every registered secret appears in the template's .env.example.
//   3. Entries with a `dev` block are executed end-to-end via `boardwalk dev` against a local
//      HTTP fixture server; exit 0 + expected output required.
//
// CLI resolution: $BOARDWALK_CLI (e.g. "node /path/to/bin/boardwalk.js") or `boardwalk` on PATH.
// Zero dependencies — plain Node.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
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

// Async on purpose: a blocking spawn would freeze this process's event loop, and the fixture
// HTTP server below must keep answering while a `dev` run probes it.
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

    // Secrets documented in .env.example (per package for multi-package templates).
    for (const secret of t.secrets) {
      const documented = t.packages.some((pkg) => {
        const envExample = join(dir, pkg, ".env.example");
        return existsSync(envExample) && readFileSync(envExample, "utf8").includes(secret);
      });
      if (documented) ok(`secret ${secret} documented in .env.example`);
      else fail(`secret ${secret} missing from .env.example`);
    }

    // `boardwalk check` per package.
    for (const pkg of t.packages) {
      const pkgDir = join(dir, pkg);
      const res = await runCli(["check", pkgDir]);
      if (res.status === 0) ok(`check ${pkg === "." ? "" : pkg + " "}passed`);
      else fail(`check ${pkg} failed:\n${(res.stderr || res.stdout || "").trim()}`);
    }

    // End-to-end `boardwalk dev` for templates that support it today.
    if (t.dev !== undefined) {
      const input = JSON.stringify(t.dev.input).replaceAll("{{harnessUrl}}", harnessUrl);
      const pkgDir = join(dir, t.packages[0]);
      const res = await runCli(["dev", pkgDir, "--input", input, "--stream", "output"]);
      const stdout = (res.stdout ?? "").trim();
      if (res.status !== 0) {
        fail(`dev run failed (exit ${res.status}):\n${(res.stderr || stdout).trim()}`);
      } else if (stdout.length === 0) {
        fail("dev run produced no output");
      } else if (
        t.dev.expectOutputContains !== undefined &&
        !stdout.includes(t.dev.expectOutputContains)
      ) {
        fail(`dev output missing "${t.dev.expectOutputContains}": ${stdout.slice(0, 200)}`);
      } else {
        ok(`dev run completed with expected output`);
      }
    }
  }
} finally {
  server.close();
}

console.log(failures === 0 ? "\nall green" : `\n${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
