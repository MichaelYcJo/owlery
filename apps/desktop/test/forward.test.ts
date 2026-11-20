import { describe, expect, it } from "vitest";
import { comeForward } from "../src/main/forward";

/** A window and an app that note each call made of them, in order. */
function recorded(minimized: boolean): { calls: string[]; win: { isMinimized(): boolean; restore(): void; show(): void; focus(): void }; activate: () => void } {
  const calls: string[] = [];
  return {
    calls,
    win: {
      isMinimized: () => minimized,
      restore: () => void calls.push("restore"),
      show: () => void calls.push("show"),
      focus: () => void calls.push("focus"),
    },
    activate: () => void calls.push("activate"),
  };
}

describe("comeForward", () => {
  it("restores a minimized window, shows it, gives it the focus and makes the app the active one", () => {
    const { calls, win, activate } = recorded(true);
    expect(comeForward(win, false, activate)).toBe(true);
    expect(calls).toEqual(["restore", "show", "focus", "activate"]);
  });

  it("does not restore a window that is not minimized", () => {
    const { calls, win, activate } = recorded(false);
    expect(comeForward(win, false, activate)).toBe(true);
    expect(calls).toEqual(["show", "focus", "activate"]);
  });

  it("calls nothing of the window and nothing of the app in an app started in the background", () => {
    const { calls, win, activate } = recorded(true);
    let asked = 0;
    const watched = { ...win, isMinimized: () => (asked++, true) };
    expect(comeForward(watched, true, activate)).toBe(false);
    expect(calls).toEqual([]);
    expect(asked).toBe(0);
  });

  it("calls nothing where the window that asked is gone", () => {
    const { calls, activate } = recorded(false);
    expect(comeForward(null, false, activate)).toBe(false);
    expect(calls).toEqual([]);
  });
});
