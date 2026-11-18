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
