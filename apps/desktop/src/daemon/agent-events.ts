import type { AgentEvent } from "../shared/protocol";

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
 * What an agent's own event says to a person: its text and the tool it asks
 * for, each null where the event carries none, carries one that is not text,
 * or carries one with nothing to read in it. An event that is not in the map
 * says neither.
 */
export function agentSaid(hookName: string, payload: Record<string, unknown>): { text: string | null; tool: string | null } {
  const fields = CLAUDE_CODE_SAID[hookName];
  const read = (field: string | undefined): string | null => {
    const value = field === undefined ? undefined : payload[field];
    return typeof value === "string" && value.trim() !== "" ? value : null;
  };
  return { text: read(fields?.text), tool: read(fields?.tool) };
}
