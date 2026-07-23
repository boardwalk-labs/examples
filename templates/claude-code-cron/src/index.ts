// claude-code-cron — zero-rewrite hosting for a `claude -p` script.
//
// If you run Claude Code on a cron today (laptop crontab, a GitHub Action, a forgotten EC2 box),
// this is the same thing with hosting, scheduling, secrets, and run history handled: paste your
// prompt, deploy, done. The program shells out to the Claude Code CLI exactly like your script
// does — no rewrite into a framework.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { secrets } from "@boardwalk-labs/workflow";

// ── Paste the prompt you run today with `claude -p "…"` ────────────────────────────────
const PROMPT = `Check the open issues on my repo that are labeled "bug" and have no assignee.
For each, write a one-line triage suggestion. End with the single most urgent one.`;

export default async function run(): Promise<string> {
  // The secret lives in Boardwalk's vault — the program fetches it
  // and hands it to the subprocess. It never appears in logs or model context.
  const anthropicKey = await secrets.get("ANTHROPIC_API_KEY");

  const { stdout } = await promisify(execFile)(
    "npx",
    ["-y", "@anthropic-ai/claude-code", "-p", PROMPT, "--output-format", "text"],
    {
      env: { ...process.env, ANTHROPIC_API_KEY: anthropicKey },
      maxBuffer: 16 * 1024 * 1024,
    },
  );

  return stdout.trim();
}
