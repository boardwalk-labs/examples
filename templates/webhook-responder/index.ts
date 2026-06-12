// webhook-responder — webhook trigger + typed input + conditional logic.
//
// POST a JSON payload at the workflow's webhook URL and it triages the event: page someone,
// open a ticket, or just log it. Deliberately agent-free — it demonstrates the trigger + input
// path, and it runs end-to-end under `boardwalk dev` today.

import { Phase, input, output, type WorkflowMeta } from "@boardwalk/workflow";

export const meta = {
  name: "webhook-responder",
  description: "Triage incoming webhook events: decide page / ticket / ignore.",
  triggers: [{ kind: "webhook", auth: "token" }],
  input_schema: {
    type: "object",
    properties: {
      event: { type: "string", description: "Event name, e.g. deploy_failed." },
      service: { type: "string", description: "The service the event concerns." },
      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
      detail: { type: "string" },
    },
    required: ["event", "severity"],
  },
} satisfies WorkflowMeta;

interface Event {
  event: string;
  service?: string;
  severity: "low" | "medium" | "high" | "critical";
  detail?: string;
}

const QUIET_EVENTS = new Set(["heartbeat", "deploy_succeeded", "scale_event"]);

export default async function run(): Promise<void> {
  Phase("Triage");
  const e = input as Event;

  let action: "page" | "ticket" | "ignore";
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

  output({ action, reason, event: e.event, severity: e.severity });
}
