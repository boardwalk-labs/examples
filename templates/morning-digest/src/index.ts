// morning-digest — cron + secrets + agent summarization.
//
// Every weekday at 9am: fetch the GitHub issues assigned to you, have an agent turn them into
// a short prioritized digest, return it. The deterministic code does the fetching (the trusted
// layer holds the token); the agent only does the writing.

import { phase, agent, secrets } from "@boardwalk-labs/workflow";

interface Issue {
  title: string;
  html_url: string;
  repository?: { full_name?: string };
  updated_at: string;
}

export default async function run(): Promise<string> {
  phase("Fetch issues");
  const token = await secrets.get("GITHUB_TOKEN");
  const res = await fetch("https://api.github.com/issues?filter=assigned&state=open&per_page=50", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "morning-digest-workflow",
    },
  });
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  const issues = (await res.json()) as Issue[];

  if (issues.length === 0) {
    return "No open issues assigned to you. Enjoy the quiet morning.";
  }

  phase("Summarize");
  const listing = issues
    .map((i) => `- [${i.repository?.full_name ?? "?"}] ${i.title} (updated ${i.updated_at})\n  ${i.html_url}`)
    .join("\n");

  return agent(
    `Here are my open GitHub issues. Write a morning digest: a 2-sentence overview, then the
3 most urgent items as bullets (each with its link), then anything that looks stale enough
to close. Be direct.

${listing}`,
  );
}
