import { describe, expect, it } from "vitest";
import { agentStateAfter } from "../src/daemon/agent-state";

describe("agentStateAfter", () => {
  it("is working after a prompt, and after a tool's start, end or failure", () => {
    expect(agentStateAfter("prompt")).toBe("working");
    expect(agentStateAfter("tool-start")).toBe("working");
    expect(agentStateAfter("tool-end")).toBe("working");
    expect(agentStateAfter("tool-failed")).toBe("working");
  });

  it("is waiting after a permission request or a notification", () => {
    expect(agentStateAfter("permission")).toBe("waiting");
    expect(agentStateAfter("notification")).toBe("waiting");
  });

  it("is finished after the end of a turn", () => {
    expect(agentStateAfter("turn-end")).toBe("finished");
  });

  it("is waiting after the person interrupted the turn", () => {
    expect(agentStateAfter("interrupted")).toBe("waiting");
  });

  it("leaves a state that began at an interruption as it is at a tool's end or failure, and gives every other event the state it gives anywhere else", () => {
    expect(agentStateAfter("tool-end", false, true)).toBe("waiting");
    expect(agentStateAfter("tool-failed", false, true)).toBe("waiting");
    for (const event of ["prompt", "tool-start", "permission", "notification", "turn-end", "session-start", "interrupted"] as const) {
      expect(agentStateAfter(event, false, true), event).toBe(agentStateAfter(event));
    }
    expect(agentStateAfter("tool-end", false, false)).toBe("working");
  });

  it("is no state after the agent's session starts, before anything was asked of it", () => {
    expect(agentStateAfter("session-start")).toBeNull();
  });

  it("is waiting after an event that asks the person a question, whatever the event, and as before after one that asks none", () => {
    for (const event of ["prompt", "tool-start", "tool-end", "tool-failed", "permission", "notification", "turn-end", "session-start", "interrupted"] as const) {
      expect(agentStateAfter(event, true), event).toBe("waiting");
      expect(agentStateAfter(event, false), event).toBe(agentStateAfter(event));
    }
    expect(agentStateAfter("tool-start", false)).toBe("working");
  });
});
