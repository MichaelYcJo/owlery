import { describe, expect, it } from "vitest";
import { tabLabel, workItemFields, workItemLine } from "../src/renderer/view";
import type { WorkItem } from "../src/shared/protocol";

const LOGIN: WorkItem = {
  id: 1,
  title: "Fix the login bug",
  repo: "/r/project",
  branch: "owlery/fix-the-login-bug",
  worktree: "/w/project/fix-the-login-bug",
  createdAt: 1234,
  baseCommit: null,
  newCommits: null,
};
const SEARCH: WorkItem = { ...LOGIN, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search" };

describe("tabLabel", () => {
  it("labels the tab of a work item's pane with the work item's title, then the pane", () => {
    expect(tabLabel({ id: 3, kind: "claude", alive: true, workItemId: 2, state: null }, [LOGIN, SEARCH])).toBe("Speed up search · Claude Code 3");
    expect(tabLabel({ id: 4, kind: "shell", alive: true, workItemId: 1, state: null }, [LOGIN, SEARCH])).toBe("Fix the login bug · Shell 4");
  });

  it("labels the tab of a pane opened without a work item with the pane alone", () => {
    expect(tabLabel({ id: 1, kind: "shell", alive: true, workItemId: null, state: null }, [LOGIN])).toBe("Shell 1");
    expect(tabLabel({ id: 2, kind: "claude", alive: true, workItemId: null, state: null }, [LOGIN])).toBe("Claude Code 2");
  });

  it("labels with the pane alone a tab whose work item the window does not hold", () => {
    expect(tabLabel({ id: 5, kind: "shell", alive: true, workItemId: 9, state: null }, [LOGIN])).toBe("Shell 5");
  });
});

describe("workItemLine", () => {
  it("says a work item's title and its branch", () => {
    expect(workItemLine(LOGIN)).toBe("Fix the login bug · owlery/fix-the-login-bug");
  });
});

describe("workItemFields", () => {
  it("gives the folder and the title without the spaces around them", () => {
    expect(workItemFields("  /r/project ", " Fix the login bug  ")).toEqual({ repo: "/r/project", title: "Fix the login bug" });
  });

  it("refuses an empty folder, so nothing is sent that the daemon would run in its own folder", () => {
    expect(workItemFields("   ", "Fix the login bug")).toEqual({ error: "Choose the repository folder." });
  });

  it("refuses an empty title", () => {
    expect(workItemFields("/r/project", " ")).toEqual({ error: "Give the work item a title." });
  });
});
