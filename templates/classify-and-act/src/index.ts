// classify-and-act — a classifier agent routes, then a handler acts.
//
// One agent labels the incoming task; deterministic code routes to a handler tuned for that
// label — a tailored agent for the messy cases, a plain action for the routine ones. Routing as
// code means the cheap path stays cheap and only the hard cases spend a model.

import { phase, agent } from "@boardwalk-labs/workflow";

interface Input {
  /** The incoming message to triage and answer. */
  message: string;
}

type Category = "bug" | "feature_request" | "question" | "spam";

interface Label {
  category: Category;
  reason: string;
}

interface Result {
  category: Category;
  reason: string;
  action: string;
  response: string | null;
}

export default async function run(input: Input): Promise<Result> {
  const { message } = input;

  phase("Classify");
  const label = await agent<Label>(
    `Classify this incoming message into exactly one category: bug, feature_request, question, or spam.

Message:
${message}

Answer ONLY with JSON: {"category": "<one of the four>", "reason": "<one sentence>"}`,
    {
      schema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["bug", "feature_request", "question", "spam"] },
          reason: { type: "string" },
        },
        required: ["category", "reason"],
      },
    },
  );

  phase("Act");
  const result = await act(label.category, message);
  return { category: label.category, reason: label.reason, ...result };
}

// Route on the label. Two paths spend an agent tuned for the case; the routine path is just
// code — no model burned on obvious spam. The switch is exhaustive over Category.
async function act(
  category: Category,
  text: string,
): Promise<{ action: string; response: string | null }> {
  switch (category) {
    case "bug":
      return {
        action: "draft-bug-ack",
        response: await agent(
          `A user reported a bug: "${text}". Write a short, specific acknowledgement that
restates the problem in your own words and asks for the single most useful missing detail.`,
        ),
      };
    case "feature_request":
      return {
        action: "draft-feature-ack",
        response: await agent(
          `A user requested a feature: "${text}". Write a short reply that reflects the
underlying need (not just the asked-for solution) and sets honest expectations.`,
        ),
      };
    case "question":
      return {
        action: "draft-answer",
        response: await agent(`Answer this user question clearly and concisely: "${text}"`),
      };
    case "spam":
      return { action: "drop", response: null };
  }
}
