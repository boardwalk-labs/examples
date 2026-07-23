// webhook-responder — webhook trigger + typed input + conditional logic.
//
// POST a JSON payload at the workflow's webhook URL and it triages the event: page someone,
// open a ticket, or just log it. Deliberately agent-free — it demonstrates the trigger + typed
// input path, and a run costs no model tokens.

import { phase } from "@boardwalk-labs/workflow";

// The native type IS the payload contract: the deploy derives its schema, so the dashboard's
// run form and your webhook producers know the shape. (There's no pre-run gate — a payload
// arrives best-effort; validate in code if you need a hard check.)
interface Event {
  /** Event name, e.g. deploy_failed. */
  event: string;
  /** The service the event concerns. */
  service?: string;
  severity: "low" | "medium" | "high" | "critical";
  detail?: string;
}

interface Decision {
  action: "page" | "ticket" | "ignore";
  reason: string;
  event: string;
  severity: Event["severity"];
}

const QUIET_EVENTS = new Set(["heartbeat", "deploy_succeeded", "scale_event"]);

export default async function run(e: Event): Promise<Decision> {
  phase("Triage");

  let action: Decision["action"];
  let reason: string;

  if (QUIET_EVENTS.has(e.event)) {
    action = "ignore";
    reason = `"${e.event}" is routine.`;
  } else if (e.severity === "critical" || (e.severity === "high" && e.event === "deploy_failed")) {
    action = "page";
    reason = `${e.severity} ${e.event}${e.service !== undefined ? ` on ${e.service}` : ""} needs eyes now.`;
  } else {
    action = "ticket";
    reason = `${e.severity} ${e.event} can wait for triage hours.`;
  }

  // From here, real responders call real APIs (PagerDuty, your tracker) with fetch + secrets —
  // or hand the messy judgment calls to an agent():
  //   const plan = await agent(`Given this event, who should own it? ${JSON.stringify(e)}`);

  return { action, reason, event: e.event, severity: e.severity };
}
