import { describe, expect, it } from "vitest";
import { agentSaid } from "../src/daemon/agent-events";

describe("agentSaid", () => {
  it("reads the tool's name of a Claude Code permission request, and no text", () => {
    expect(agentSaid("PermissionRequest", { tool_name: "Bash", tool_input: { command: "ls" }, message: "not read here", last_assistant_message: "nor this" })).toEqual({ text: null, tool: "Bash" });
  });

  it("reads the last message of a Claude Code turn's end, and no tool", () => {
    expect(agentSaid("Stop", { last_assistant_message: "The form is in src/form.ts.", tool_name: "Bash", message: "not read here" })).toEqual({ text: "The form is in src/form.ts.", tool: null });
  });

  it("reads the message of a Claude Code notification where it is text, and no tool", () => {
    expect(agentSaid("Notification", { message: "Claude needs your permission to use Bash", tool_name: "Bash", last_assistant_message: "not read here" })).toEqual({ text: "Claude needs your permission to use Bash", tool: null });
    expect(agentSaid("Notification", { message: { text: "an object" } })).toEqual({ text: null, tool: null });
    expect(agentSaid("Notification", {})).toEqual({ text: null, tool: null });
  });

  it("reads neither where the event carries none, or carries one that is not text or holds no letter", () => {
    expect(agentSaid("PermissionRequest", {})).toEqual({ text: null, tool: null });
    expect(agentSaid("PermissionRequest", { tool_name: 7 })).toEqual({ text: null, tool: null });
    expect(agentSaid("PermissionRequest", { tool_name: " " })).toEqual({ text: null, tool: null });
    expect(agentSaid("Stop", {})).toEqual({ text: null, tool: null });
    expect(agentSaid("Stop", { last_assistant_message: 7 })).toEqual({ text: null, tool: null });
    expect(agentSaid("Stop", { last_assistant_message: " \n" })).toEqual({ text: null, tool: null });
  });

  it("reads neither from any other event, though it carries a tool's name or a message", () => {
    for (const hook of ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "SubagentStop", "toString"]) {
      expect(agentSaid(hook, { tool_name: "Bash", message: "m", last_assistant_message: "l" })).toEqual({ text: null, tool: null });
    }
  });
});
