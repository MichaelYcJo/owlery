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

  it("is no state after the agent's session starts, before anything was asked of it", () => {
    expect(agentStateAfter("session-start")).toBeNull();
  });
});
