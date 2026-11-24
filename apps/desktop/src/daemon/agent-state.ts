import type { AgentEvent, AgentState } from "../shared/protocol";

/**
 * What a session's agent is doing, judged from its last event: working once
 * it was asked something or used a tool, waiting where it asks the person or
 * notifies them or where the person interrupted its turn, finished at the end
 * of its turn. Its session's start says nothing was asked of it yet, which is
 * no state. An event that `asks` the person a question leaves the agent
 * waiting, whatever the event is, as the call of a tool through which the
 * agent asks in its own pane does. Where the state began at an interruption,
 * `interrupted` says so, and a tool's end or failure leaves it waiting: it can
 * only close a call that began before the interruption.
 */
export function agentStateAfter(event: AgentEvent, asks = false, interrupted = false): AgentState | null {
  if (asks) return "waiting";
  switch (event) {
    case "prompt":
    case "tool-start":
      return "working";
    case "tool-end":
    case "tool-failed":
      return interrupted ? "waiting" : "working";
    case "permission":
    case "notification":
    case "interrupted":
      return "waiting";
    case "turn-end":
      return "finished";
    case "session-start":
      return null;
  }
}
