import { describe, expect, it } from "vitest";
import { PANE_KINDS } from "../src/daemon/pane-kinds";

describe("PANE_KINDS", () => {
  it("offers the shell, which reports no state and continues no conversation, and Claude Code, which does both, each with the label a person reads", () => {
    expect(PANE_KINDS).toEqual([
      { kind: "shell", label: "Shell", reportsState: false, continues: false },
      { kind: "claude", label: "Claude Code", reportsState: true, continues: true },
    ]);
  });
});
