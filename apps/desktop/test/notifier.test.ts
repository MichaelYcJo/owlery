import { describe, expect, it } from "vitest";
import { chooseNotifier, type Raised } from "../src/renderer/notifier";

/** A stand-in for the system's notification that notes each title and body it was handed and returns a notification of its own. No case raises a notification of the system's. */
function noting(): { handed: [string, string][]; made: Raised[]; system: (title: string, body: string) => Raised } {
  const handed: [string, string][] = [];
  const made: Raised[] = [];
  return {
    handed,
    made,
    system: (title, body) => {
      handed.push([title, body]);
      const raised: Raised = { onclick: null };
      made.push(raised);
      return raised;
    },
  };
}

describe("chooseNotifier", () => {
  it("keeps each notification in the background with its title, its body and a handler that starts empty, returns the kept entry, and never calls the system's", () => {
    const { handed, system } = noting();
    const notifier = chooseNotifier(true, system);
    const first = notifier.raise("Alpha", "Needs you");
    const second = notifier.raise("Beta", "Finished");
    expect(notifier.kept).toEqual([
      { title: "Alpha", body: "Needs you", onclick: null },
      { title: "Beta", body: "Finished", onclick: null },
    ]);
    expect(notifier.kept[0]).toBe(first);
    expect(notifier.kept[1]).toBe(second);
    expect(handed).toEqual([]);
  });

  it("keeps a handler set on what it returned in the background as the kept entry's", () => {
    const notifier = chooseNotifier(true, noting().system);
    let clicked = 0;
    notifier.raise("Alpha", "Needs you").onclick = () => {
      clicked += 1;
    };
    notifier.kept[0]?.onclick?.();
    expect(clicked).toBe(1);
  });

  it("hands each notification to the system's otherwise, returns what the system's returned, and keeps nothing", () => {
    const { handed, made, system } = noting();
    const notifier = chooseNotifier(false, system);
    const raised = notifier.raise("Alpha", "Needs you");
    expect(handed).toEqual([["Alpha", "Needs you"]]);
    expect(raised).toBe(made[0]);
    expect(notifier.kept).toEqual([]);
  });
});
