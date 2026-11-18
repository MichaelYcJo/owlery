import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorkItemList } from "../src/daemon/work-items";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const PLACE = { title: "Fix the login bug", repo: "/r/project", branch: "owlery/fix-the-login-bug", worktree: "/w/project/fix-the-login-bug" };

describe("WorkItemList", () => {
  it("gives each work item the next id and the time it was made", () => {
    const list = new WorkItemList(runDir(), () => 1234);
    const first = list.add(PLACE);
    const second = list.add({ ...PLACE, title: "Another" });
    expect(first).toEqual({ id: 1, ...PLACE, createdAt: 1234 });
    expect(second.id).toBe(2);
    expect(list.all()).toEqual([first, second]);
    expect(list.get(2)).toEqual(second);
    expect(list.get(3)).toBeUndefined();
  });

  it("writes work-items.json in the run directory, readable by the user alone", () => {
    const dir = runDir();
    new WorkItemList(dir).add(PLACE);
    expect(statSync(join(dir, "work-items.json")).mode & 0o777).toBe(0o600);
  });

  it("reads at start the list an earlier daemon wrote, and goes on from its last id", () => {
    const dir = runDir();
    const earlier = new WorkItemList(dir, () => 1);
    const first = earlier.add(PLACE);
    const later = new WorkItemList(dir, () => 2);
    expect(later.all()).toEqual([first]);
    expect(later.add({ ...PLACE, title: "Another" }).id).toBe(2);
    expect(JSON.parse(readFileSync(join(dir, "work-items.json"), "utf8"))).toEqual(later.all());
  });

  it("starts empty where the file is not a list of work items", () => {
    const dir = runDir();
    writeFileSync(join(dir, "work-items.json"), "{ not json");
    expect(new WorkItemList(dir).all()).toEqual([]);
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([{ id: "1", title: 3 }]));
    expect(new WorkItemList(dir).all()).toEqual([]);
  });

  it("keeps the list in memory alone where it is given no run directory", () => {
    const list = new WorkItemList(undefined);
    expect(list.add(PLACE).id).toBe(1);
    expect(list.all()).toHaveLength(1);
  });
});
