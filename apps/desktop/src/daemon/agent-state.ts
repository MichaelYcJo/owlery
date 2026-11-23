import type { AgentEvent, AgentState } from "../shared/protocol";

/**
 * What a session's agent is doing, judged from its last event alone: working
 * once it was asked something or used a tool, waiting where it asks the person
 * or notifies them, finished at the end of its turn. Its session's start says
 * nothing was asked of it yet, which is no state. An event that `asks` the
 * person a question leaves the agent waiting, whatever the event is, as the
 * call of a tool through which the agent asks in its own pane does.
 */
export function agentStateAfter(event: AgentEvent, asks = false): AgentState | null {
  if (asks) return "waiting";
  switch (event) {
    case "prompt":
    case "tool-start":
    case "tool-end":
    case "tool-failed":
      return "working";
    case "permission":
    case "notification":
      return "waiting";
    case "turn-end":
      return "finished";
    case "session-start":
      return null;
  }
}
