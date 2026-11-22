import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LastLook } from "../src/daemon/last-look";
import type { Look, SessionInfo, WorkItem, WorktreeSetup } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const SESSION: SessionInfo = { id: 4, kind: "claude", alive: true, workItemId: 1, state: "waiting", stateSince: 1200, stateText: "May I run the tests?", stateTool: "Bash" };
const COMMIT = { hash: "abc1234", subject: "add the form", at: 1100, added: 3, removed: 1 };
const FILE = { path: "src/form.ts", added: 3, removed: 1 };
const SETUP: WorktreeSetup = { copied: [".env", "node_modules/"], copiedCount: 2, failedCopies: [{ path: ".env.secret", why: "EACCES: permission denied" }], command: "pnpm install\n", paneId: 3, state: "failed", exitCode: 0, failure: null, startedAt: 1, endedAt: 2 };
const WORK_ITEM: WorkItem = {
  id: 1,
  title: "Fix the login bug",
  repoId: 1,
  repo: "/r/project",
  repoName: "project",
  branch: "owlery/fix-the-login-bug",
  worktree: "/w/project/fix-the-login-bug",
  createdAt: 1,
  baseCommit: "c".repeat(40),
  baseBranch: "main",
  aheadOfBase: 2,
  newCommits: 2,
  commits: [COMMIT, { hash: "def5678", subject: "add an image", at: 1000, added: null, removed: null }],
  changes: { files: 2, added: 3, removed: 1, list: [FILE, { path: "owl.png", added: null, removed: null }] },
  pinned: true,
  muted: true,
  groupId: 2,
  archivedAt: null,
  setup: SETUP,
};
const LOOK: Look = { at: 1234, sessions: [SESSION], workItems: [WORK_ITEM] };

describe("LastLook", () => {
  it("holds no look until one is recorded, then the time and both lists it was given", () => {
    const look = new LastLook(runDir());
    expect(look.get()).toBeNull();
    look.record(1234, [SESSION], [WORK_ITEM]);
    expect(look.get()).toEqual(LOOK);
  });

  it("replaces the look it held with a later one", () => {
    const look = new LastLook(runDir());
    look.record(1234, [SESSION], [WORK_ITEM]);
    look.record(5678, [], [{ ...WORK_ITEM, newCommits: 3 }]);
    expect(look.get()).toEqual({ at: 5678, sessions: [], workItems: [{ ...WORK_ITEM, newCommits: 3 }] });
  });

  it("keeps the lists as they stood, though a session or a work item it was given changes afterwards", () => {
    const session = { ...SESSION };
    const workItem = structuredClone(WORK_ITEM);
    const sessions = [session];
    const look = new LastLook(runDir());
    look.record(1234, sessions, [workItem]);
    session.state = "finished";
    session.stateText = "Done.";
    workItem.newCommits = 9;
    workItem.commits![0]!.subject = "amended";
    workItem.commits!.pop();
    workItem.changes!.files = 9;
    workItem.changes!.list[0]!.added = 9;
    workItem.changes!.list.pop();
    workItem.setup!.copied.pop();
    workItem.setup!.failedCopies[0]!.why = "gone";
    sessions.push({ ...SESSION, id: 5 });
    expect(look.get()).toEqual(LOOK);
  });

  it("writes last-look.json in the run directory, readable by the user alone", () => {
    const dir = runDir();
    new LastLook(dir).record(1234, [SESSION], [WORK_ITEM]);
    expect(statSync(join(dir, "last-look.json")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(dir, "last-look.json"), "utf8"))).toEqual(LOOK);
  });

  it("reads at start the look an earlier daemon wrote, the later of two", () => {
    const dir = runDir();
    const earlier = new LastLook(dir);
    earlier.record(1, [], []);
    earlier.record(1234, [SESSION], [WORK_ITEM]);
    expect(new LastLook(dir).get()).toEqual(LOOK);
  });

  it("reads a session with no work item, a session with no state and a work item with neither base commit, base branch, count, commits nor changes", () => {
    const dir = runDir();
    const look: Look = {
      at: 1,
      sessions: [{ id: 2, kind: "shell", alive: false, workItemId: null, state: null, stateSince: null, stateText: null, stateTool: null }],
      workItems: [{ ...WORK_ITEM, baseCommit: null, baseBranch: null, aheadOfBase: null, newCommits: null, commits: null, changes: null }],
    };
    writeFileSync(join(dir, "last-look.json"), JSON.stringify(look));
    expect(new LastLook(dir).get()).toEqual(look);
  });

  it("reads only the fields of a look, whatever else the file carries", () => {
    const dir = runDir();
    const workItem = {
      ...WORK_ITEM,
      note: "x",
      commits: WORK_ITEM.commits!.map((commit) => ({ ...commit, author: "someone" })),
      changes: { ...WORK_ITEM.changes!, binary: 1, list: WORK_ITEM.changes!.list.map((file) => ({ ...file, mode: "100644" })) },
      setup: { ...SETUP, shell: "/bin/zsh", failedCopies: SETUP.failedCopies.map((entry) => ({ ...entry, code: "EACCES" })) },
    };
    writeFileSync(join(dir, "last-look.json"), JSON.stringify({ ...LOOK, by: "a window", sessions: [{ ...SESSION, pid: 7 }], workItems: [workItem] }));
    expect(new LastLook(dir).get()).toEqual(LOOK);
  });

  it("holds no look where the file is not one", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const read = (text: string): Look | null => {
      writeFileSync(file, text);
      return new LastLook(dir).get();
    };
    expect(read("{ not json")).toBeNull();
    expect(read("null")).toBeNull();
    expect(read(JSON.stringify([LOOK]))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, at: "1234" }))).toBeNull();
    expect(read(JSON.stringify({ at: 1234, workItems: [WORK_ITEM] }))).toBeNull();
    expect(read(JSON.stringify({ at: 1234, sessions: [SESSION] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, id: "4" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, kind: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, alive: "yes" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, workItemId: "1" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, state: "sealed" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [null] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, id: "1" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, title: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, repo: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, branch: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, worktree: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, createdAt: "1" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, baseCommit: 7 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, newCommits: "2" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, stateSince: "1200" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, stateText: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, stateTool: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, repoName: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, baseBranch: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, aheadOfBase: "2" }] }))).toBeNull();
    for (const field of [{ repoId: "1" }, { repoId: null }, { pinned: "yes" }, { pinned: null }, { muted: 1 }, { muted: null }, { groupId: "2" }, { archivedAt: "9" }, { setup: "running" }, { setup: { ...SETUP, state: "done" } }, { setup: { ...SETUP, copied: [1] } }, { setup: { ...SETUP, failedCopies: [{ why: "x" }] } }, { setup: { ...SETUP, startedAt: undefined } }]) expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, ...field }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: "none" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: [null] }] }))).toBeNull();
    for (const commit of [{ hash: 7 }, { subject: 7 }, { at: "1100" }, { added: "3" }, { removed: "1" }]) expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: [{ ...COMMIT, ...commit }] }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, changes: [] }] }))).toBeNull();
    for (const changes of [{ files: "2" }, { added: null }, { removed: null }, { list: {} }, { list: [null] }, { list: [{ ...FILE, path: 3 }] }, { list: [{ ...FILE, added: "3" }] }, { list: [{ ...FILE, removed: "1" }] }]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, changes: { ...WORK_ITEM.changes, ...changes } }] }))).toBeNull();
    }
    // The file as the first line of this case would have it read, so the reader is the one under test.
    expect(read(JSON.stringify(LOOK))).toEqual(LOOK);
  });

  it("holds no look where the file is one a build before these fields wrote: a session with no time of its state, or a work item with no repository's name", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { stateSince: _since, stateText: _text, stateTool: _tool, ...sessionBefore } = SESSION;
    const { repoName: _name, baseBranch: _base, commits: _commits, changes: _changes, ...workItemBefore } = WORK_ITEM;
    writeFileSync(file, JSON.stringify({ at: 1234, sessions: [sessionBefore], workItems: [WORK_ITEM] }));
    expect(new LastLook(dir).get()).toBeNull();
    writeFileSync(file, JSON.stringify({ at: 1234, sessions: [SESSION], workItems: [workItemBefore] }));
    expect(new LastLook(dir).get()).toBeNull();
    // Each field of the two alone, absent: none is read as null.
    for (const field of ["stateSince", "stateText", "stateTool"]) {
      writeFileSync(file, JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, [field]: undefined }] }));
      expect(new LastLook(dir).get()).toBeNull();
    }
    for (const field of ["repoName", "baseBranch", "aheadOfBase", "commits", "changes"]) {
      writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, [field]: undefined }] }));
      expect(new LastLook(dir).get()).toBeNull();
    }
  });

  it("reads a look a build before the repositories wrote, whose work items lack the fields they brought, with no repository's id, no pin, no mute, no group and no archive", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { repoId: _repo, pinned: _pinned, muted: _muted, groupId: _group, archivedAt: _archived, ...before } = WORK_ITEM;
    const empty = { repoId: 0, pinned: false, muted: false, groupId: null, archivedAt: null };
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [before] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, ...empty }] });
    // Each of the fields alone, absent: the others are read as the file holds them.
    for (const field of ["repoId", "pinned", "muted", "groupId", "archivedAt"] as const) {
      writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, archivedAt: 9, [field]: undefined }] }));
      expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, archivedAt: 9, [field]: empty[field] }] });
    }
  });

  it("reads a look a build before the setup wrote, whose work items lack it, with none", () => {
    const dir = runDir();
    const { setup: _setup, ...before } = WORK_ITEM;
    writeFileSync(join(dir, "last-look.json"), JSON.stringify({ ...LOOK, workItems: [before] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, setup: null }] });
  });

  it("holds the look it was given though the file cannot be written, and says that it was not", () => {
    const gone = join(runDir(), "removed");
    const look = new LastLook(gone);
    expect(() => look.record(1234, [SESSION], [WORK_ITEM])).toThrow();
    expect(look.get()).toEqual(LOOK);
  });

  it("throws where the rename fails, removes the partial file it wrote, and holds the look", () => {
    const dir = runDir();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "last-look.json"));
    const look = new LastLook(dir);
    expect(() => look.record(1234, [SESSION], [WORK_ITEM])).toThrow(/rename/);
    expect(readdirSync(dir)).toEqual(["last-look.json"]);
    expect(statSync(join(dir, "last-look.json")).isDirectory()).toBe(true);
    expect(look.get()).toEqual(LOOK);
  });

  it("keeps the look in memory alone where it is given no run directory", () => {
    // Where a look with no run directory would write, were it to write at all.
    const stray = join(process.cwd(), "last-look.json");
    cleanups.push(() => rmSync(stray, { force: true }));
    const look = new LastLook(undefined);
    look.record(1234, [SESSION], [WORK_ITEM]);
    expect(look.get()).toEqual(LOOK);
    expect(existsSync(stray)).toBe(false);
  });
});
