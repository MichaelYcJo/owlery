import type { AgentEvent, AskedQuestion } from "../shared/protocol";

// The Claude Code hooks Owlery listens to, as the neutral events its protocol
// carries. Another agent's adapter maps its own events onto the same values.
const CLAUDE_CODE: Record<string, AgentEvent> = {
  SessionStart: "session-start",
  UserPromptSubmit: "prompt",
  PreToolUse: "tool-start",
  PostToolUse: "tool-end",
  PostToolUseFailure: "tool-failed",
  PermissionRequest: "permission",
  Notification: "notification",
  Stop: "turn-end",
};

export function agentEventFor(hookName: string): AgentEvent | undefined {
  return Object.hasOwn(CLAUDE_CODE, hookName) ? CLAUDE_CODE[hookName] : undefined;
}

/** The field of a Claude Code hook's input that holds what a person reads of the event: a text, or the name of a tool. */
const CLAUDE_CODE_SAID: Record<string, { text?: string; tool?: string } | undefined> = {
  PermissionRequest: { tool: "tool_name" },
  Notification: { text: "message" },
  Stop: { text: "last_assistant_message" },
};

/**
 * The tool through which Claude Code's agent asks the person questions in its
 * own pane, and the hooks whose input holds a call of it before the person
 * answers. The call's `tool_input.questions` holds each question as
 * `question`, `header`, `options` and `multiSelect`, and each option as
 * `label`, `description` and `preview`.
 */
const CLAUDE_CODE_ASKS = { tool: "AskUserQuestion", hooks: ["PreToolUse", "PermissionRequest"] };

/** How many questions of one call, and how many choices of one question, the reader keeps: more than the question tool lets its agent ask. */
const MOST_QUESTIONS = 8;
const MOST_CHOICES = 8;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** The choices of one question: each option whose label is text, with its description as what it leads to, or the empty text where the description is no text. */
function choicesOf(options: unknown): AskedQuestion["options"] {
  const entries = Array.isArray(options) ? options : [];
  return entries.flatMap((option) => (isRecord(option) && isText(option.label) ? [{ label: option.label, implies: typeof option.description === "string" ? option.description : "" }] : [])).slice(0, MOST_CHOICES);
}

/** The questions a call of the question tool asks, in the call's order: each entry whose question is text, with its choices. Null where the event is no such call or the call holds no question. A question's header and an option's preview are not read. */
function questionsOf(hookName: string, payload: Record<string, unknown>): AskedQuestion[] | null {
  if (!CLAUDE_CODE_ASKS.hooks.includes(hookName) || payload.tool_name !== CLAUDE_CODE_ASKS.tool) return null;
  const input = payload.tool_input;
  const entries = isRecord(input) && Array.isArray(input.questions) ? input.questions : [];
  const questions = entries.flatMap((entry) => (isRecord(entry) && isText(entry.question) ? [{ asks: entry.question, options: choicesOf(entry.options), multiple: entry.multiSelect === true }] : [])).slice(0, MOST_QUESTIONS);
  return questions.length > 0 ? questions : null;
}

/**
 * What an agent's own event says to a person: its text, the tool it asks
 * for, and the questions it asks the person with the choices it offers.
 * The text and the tool are each null where the event carries none, carries
 * one that is not text, or carries one with nothing to read in it, and the
 * questions are null where the event asks none. Where it asks one, the text
 * is the first question's. An event that is not in the map says none of the
 * three.
 */
export function agentSaid(hookName: string, payload: Record<string, unknown>): { text: string | null; tool: string | null; questions: AskedQuestion[] | null } {
  const fields = CLAUDE_CODE_SAID[hookName];
  const read = (field: string | undefined): string | null => {
    const value = field === undefined ? undefined : payload[field];
    return isText(value) ? value : null;
  };
  const questions = questionsOf(hookName, payload);
  return { text: questions?.[0]?.asks ?? read(fields?.text), tool: read(fields?.tool), questions };
}
