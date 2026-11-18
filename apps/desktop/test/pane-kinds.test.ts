import { describe, expect, it } from "vitest";
import { PANE_KINDS } from "../src/daemon/pane-kinds";

describe("PANE_KINDS", () => {
  it("offers the shell, which reports no state, and Claude Code, which does, each with the label a person reads", () => {
    expect(PANE_KINDS).toEqual([
      { kind: "shell", label: "Shell", reportsState: false },
      { kind: "claude", label: "Claude Code", reportsState: true },
    ]);
  });
});
