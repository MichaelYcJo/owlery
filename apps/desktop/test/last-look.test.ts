import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LastLook } from "../src/daemon/last-look";
import type { AskedQuestion, Chain, Decision, Look, PermissionAsk, Question, SessionInfo, Unread, WorkItem, WorktreeSetup } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const ASKED: AskedQuestion[] = [
  { asks: "May I run the tests?", options: [{ label: "Yes", implies: "Runs pnpm test." }, { label: "No", implies: "" }], multiple: false },
  { asks: "Which ones?", options: [], multiple: true },
];
const SESSION: SessionInfo = { id: 4, kind: "claude", alive: true, workItemId: 1, state: "waiting", stateSince: 1200, stateText: "May I run the tests?", stateTool: "Bash", stateQuestions: ASKED };
const COMMIT = { hash: "abc1234", subject: "add the form", at: 1100, added: 3, removed: 1 };
const FILE = { path: "src/form.ts", added: 3, removed: 1 };
const ASK: PermissionAsk = { id: 3, headlessId: 2, tool: "Bash", action: "run", text: "printf x >> README.md", at: 1150 };
const DECISION: Decision = { id: 3, kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default.", by: "orchestrator", state: "decided", reversal: null, landed: null, since: 1150 };
const REVERSED: Decision = { id: 5, kind: "route", says: "Build it with no framer.", grounds: "The issue names one file.", by: null, state: "applied", reversal: "Frame it first.", landed: "abc1234", since: null };
const QUESTIONS: Question[] = [
  { id: 6, asks: "Which base does the branch start from?", grounds: "No document names it.", by: "sealer", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release/v0.0.2", implies: "It merges after the release." }], default: "main", answer: null, since: 1170 },
  { id: 7, asks: "May the session push?", grounds: "A push needs an approval.", by: null, options: [], default: null, answer: "Yes.", since: null },
];
const UNREAD: Unread[] = [{ line: 40, why: "an empty `seal` block" }];
const SETUP: WorktreeSetup = { copied: [".env", "node_modules/"], copiedCount: 2, failedCopies: [{ path: ".env.secret", why: "EACCES: permission denied" }], command: "pnpm install\n", paneId: 3, state: "failed", exitCode: 0, failure: null, startedAt: 1, endedAt: 2 };
const CHAIN: Chain = { state: "stopped", says: "Review round 2 failed: the session reached its time limit and was stopped.", stages: [{ kind: "round", round: 1, state: "finished", failure: null, startedAt: 1, endedAt: 2, headlessId: 1, refusals: 0, gate: null }, { kind: "round", round: 2, state: "failed", failure: "the session reached its time limit and was stopped", startedAt: 3, endedAt: 4, headlessId: 2, refusals: 1, gate: null }], since: 6 };
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
  behindBase: 1,
  newCommits: 2,
  commits: [COMMIT, { hash: "def5678", subject: "add an image", at: 1000, added: null, removed: null }],
  changes: { files: 2, added: 3, removed: 1, list: [FILE, { path: "owl.png", added: null, removed: null }] },
  pinned: true,
  muted: true,
  groupId: 2,
  archivedAt: null,
  decisions: [DECISION, REVERSED],
  questions: QUESTIONS,
  unread: UNREAD,
  setup: SETUP,
  permissions: [ASK],
  chain: CHAIN,
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
    const session = structuredClone(SESSION);
    const workItem = structuredClone(WORK_ITEM);
    const sessions = [session];
    const look = new LastLook(runDir());
    look.record(1234, sessions, [workItem]);
    session.state = "finished";
    session.stateText = "Done.";
    session.stateQuestions![0]!.asks = "changed";
    session.stateQuestions![0]!.options[0]!.implies = "changed";
    session.stateQuestions![0]!.options.pop();
    session.stateQuestions!.pop();
    workItem.newCommits = 9;
    workItem.commits![0]!.subject = "amended";
    workItem.commits!.pop();
    workItem.changes!.files = 9;
    workItem.changes!.list[0]!.added = 9;
    workItem.changes!.list.pop();
    workItem.permissions[0]!.text = "changed";
    workItem.permissions.push({ ...ASK, id: 4 });
    workItem.decisions[0]!.says = "changed";
    workItem.decisions[1]!.reversal = "changed";
    workItem.decisions.pop();
    workItem.questions[0]!.asks = "changed";
    workItem.questions[0]!.options[0]!.implies = "changed";
    workItem.questions[0]!.options.pop();
    workItem.questions.pop();
    workItem.unread[0]!.why = "changed";
    workItem.unread.pop();
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
      sessions: [{ id: 2, kind: "shell", alive: false, workItemId: null, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null }],
      workItems: [{ ...WORK_ITEM, baseCommit: null, baseBranch: null, aheadOfBase: null, behindBase: null, newCommits: null, commits: null, changes: null }],
    };
    writeFileSync(join(dir, "last-look.json"), JSON.stringify(look));
    expect(new LastLook(dir).get()).toEqual(look);
  });

  it("reads only the fields of a look, whatever else the file carries", () => {
    const dir = runDir();
    const workItem = {
      ...WORK_ITEM,
      note: "x",
      permissions: [{ ...ASK, path: "/w/a.ts" }],
      commits: WORK_ITEM.commits!.map((commit) => ({ ...commit, author: "someone" })),
      changes: { ...WORK_ITEM.changes!, binary: 1, list: WORK_ITEM.changes!.list.map((file) => ({ ...file, mode: "100644" })) },
      decisions: [{ ...DECISION, model: "x" }, { ...REVERSED, at: 1160 }],
      questions: QUESTIONS.map((question) => ({ ...question, kind: "choice", options: question.options.map((option) => ({ ...option, note: "x" })) })),
      unread: UNREAD.map((unread) => ({ ...unread, block: 39 })),
      setup: { ...SETUP, shell: "/bin/zsh", failedCopies: SETUP.failedCopies.map((entry) => ({ ...entry, code: "EACCES" })) },
    };
    const stateQuestions = ASKED.map((question) => ({ ...question, header: "Tests", options: question.options.map((option) => ({ ...option, preview: "x" })) }));
    writeFileSync(join(dir, "last-look.json"), JSON.stringify({ ...LOOK, by: "a window", sessions: [{ ...SESSION, pid: 7, stateQuestions }], workItems: [workItem] }));
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
    const [asked] = ASKED as [AskedQuestion];
    const askedFields = [{ asks: 3 }, { asks: undefined }, { options: {} }, { options: [null] }, { options: [{ label: "Yes" }] }, { options: [{ label: 3, implies: "x" }] }, { multiple: "yes" }, { multiple: undefined }];
    for (const stateQuestions of ["May I?", {}, [null], ["May I?"], ...askedFields.map((field) => [{ ...asked, ...field }])]) {
      expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, stateQuestions }] })), JSON.stringify(stateQuestions)).toBeNull();
    }
    expect(read(JSON.stringify({ ...LOOK, sessions: [{ ...SESSION, stateTool: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, repoName: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, baseBranch: 3 }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, aheadOfBase: "2" }] }))).toBeNull();
    for (const behindBase of ["1", true, {}, [1]]) expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, behindBase }] })), JSON.stringify(behindBase)).toBeNull();
    for (const field of [{ repoId: "1" }, { repoId: null }, { pinned: "yes" }, { pinned: null }, { muted: 1 }, { muted: null }, { groupId: "2" }, { archivedAt: "9" }, { setup: "running" }, { setup: { ...SETUP, state: "done" } }, { setup: { ...SETUP, copied: [1] } }, { setup: { ...SETUP, failedCopies: [{ why: "x" }] } }, { setup: { ...SETUP, startedAt: undefined } }]) expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, ...field }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: "none" }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: [null] }] }))).toBeNull();
    for (const commit of [{ hash: 7 }, { subject: 7 }, { at: "1100" }, { added: "3" }, { removed: "1" }]) expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, commits: [{ ...COMMIT, ...commit }] }] }))).toBeNull();
    expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, changes: [] }] }))).toBeNull();
    for (const changes of [{ files: "2" }, { added: null }, { removed: null }, { list: {} }, { list: [null] }, { list: [{ ...FILE, path: 3 }] }, { list: [{ ...FILE, added: "3" }] }, { list: [{ ...FILE, removed: "1" }] }]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, changes: { ...WORK_ITEM.changes, ...changes } }] }))).toBeNull();
    }
    for (const permissions of ["none", {}, [null], ["Bash"], [{ ...ASK, id: "3" }], [{ ...ASK, headlessId: null }], [{ ...ASK, tool: 7 }], [{ ...ASK, action: "delete" }], [{ ...ASK, text: null }], [{ ...ASK, at: "1150" }], [{ ...ASK, at: undefined }]]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, permissions }] })), JSON.stringify(permissions)).toBeNull();
    }
    const decisionFields = [{ id: "3" }, { kind: "guess" }, { says: 3 }, { grounds: null }, { by: 3 }, { by: undefined }, { state: "open" }, { state: undefined }, { reversal: 3 }, { reversal: undefined }, { landed: 3 }, { landed: undefined }, { since: "1150" }, { since: undefined }];
    for (const decisions of [null, "none", {}, [null], ...decisionFields.map((field) => [{ ...DECISION, ...field }])]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, decisions }] })), JSON.stringify(decisions)).toBeNull();
    }
    const [first] = QUESTIONS as [Question];
    const questionFields = [{ id: "6" }, { asks: 3 }, { grounds: null }, { by: 3 }, { by: undefined }, { options: {} }, { options: [null] }, { options: [{ label: "main" }] }, { options: [{ label: 3, implies: "x" }] }, { default: 0 }, { default: undefined }, { answer: 3 }, { answer: undefined }, { since: "1170" }, { since: undefined }];
    for (const questions of [null, "none", {}, [null], ...questionFields.map((field) => [{ ...first, ...field }])]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, questions }] })), JSON.stringify(questions)).toBeNull();
    }
    for (const unread of [null, "none", {}, [null], [{ line: "40", why: "x" }], [{ line: 40 }], [{ line: 40, why: 3 }]]) {
      expect(read(JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, unread }] })), JSON.stringify(unread)).toBeNull();
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

  it("reads a look a build before the permission requests wrote, whose work items hold no list of them, with none on each", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { permissions: _permissions, ...before } = WORK_ITEM;
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [before, { ...before, id: 2 }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, permissions: [] }, { ...before, id: 2, permissions: [] }] });
    // Each kind of what a call does is read.
    for (const action of ["read", "write", "run", "other"] as const) {
      writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, permissions: [{ ...ASK, action }] }] }));
      expect(new LastLook(dir).get(), action).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, permissions: [{ ...ASK, action }] }] });
    }
  });

  it("reads a look a build before the work item's record wrote, whose work items hold none of `decisions`, `questions` and `unread`, with no decision, no question and nothing unread on each, and holds in a look recorded now the three of each work item", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { decisions: _decisions, questions: _questions, unread: _unread, ...before } = WORK_ITEM;
    const none = { decisions: [], questions: [], unread: [] };
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [before, { ...before, id: 2 }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, ...none }, { ...before, id: 2, ...none }] });
    // A look that holds one of the three is read with the other two empty.
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...before, decisions: [DECISION] }, { ...before, questions: QUESTIONS }, { ...before, unread: UNREAD }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, ...none, decisions: [DECISION] }, { ...before, ...none, questions: QUESTIONS }, { ...before, ...none, unread: UNREAD }] });
    const look = new LastLook(dir);
    look.record(1234, [SESSION], [WORK_ITEM, { ...WORK_ITEM, id: 2, ...none }]);
    const held = [[[DECISION, REVERSED], QUESTIONS, UNREAD], [[], [], []]];
    expect(JSON.parse(readFileSync(file, "utf8")).workItems.map((item: WorkItem) => [item.decisions, item.questions, item.unread])).toEqual(held);
    expect(new LastLook(dir).get()?.workItems.map((item) => [item.decisions, item.questions, item.unread])).toEqual(held);
  });

  it("reads a look a build before the questions an agent asks wrote, whose sessions lack them, with none, and holds in a look recorded now the questions of each session", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { stateQuestions: _questions, ...before } = SESSION;
    writeFileSync(file, JSON.stringify({ ...LOOK, sessions: [before, { ...before, id: 5 }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, sessions: [{ ...before, stateQuestions: null }, { ...before, id: 5, stateQuestions: null }] });
    const look = new LastLook(dir);
    look.record(1234, [SESSION, { ...SESSION, id: 5, stateQuestions: null }], [WORK_ITEM]);
    expect(JSON.parse(readFileSync(file, "utf8")).sessions.map((session: SessionInfo) => session.stateQuestions)).toEqual([ASKED, null]);
    expect(new LastLook(dir).get()?.sessions.map((session) => session.stateQuestions)).toEqual([ASKED, null]);
  });

  it("reads a look a build before the count behind the base wrote, whose work items lack it, with none, and holds in a look recorded now the count of each work item", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { behindBase: _behind, ...before } = WORK_ITEM;
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [before, { ...before, id: 2 }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, behindBase: null }, { ...before, id: 2, behindBase: null }] });
    const look = new LastLook(dir);
    look.record(1234, [SESSION], [WORK_ITEM, { ...WORK_ITEM, id: 2, behindBase: 0 }, { ...WORK_ITEM, id: 3, behindBase: null }]);
    expect(JSON.parse(readFileSync(file, "utf8")).workItems.map((item: WorkItem) => item.behindBase)).toEqual([1, 0, null]);
    expect(new LastLook(dir).get()?.workItems.map((item) => item.behindBase)).toEqual([1, 0, null]);
  });

  it("reads a look a build before the setup wrote, whose work items lack it, with none", () => {
    const dir = runDir();
    const { setup: _setup, ...before } = WORK_ITEM;
    writeFileSync(join(dir, "last-look.json"), JSON.stringify({ ...LOOK, workItems: [before] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, setup: null }] });
  });

  it("reads a look a build before the chain wrote, whose work items lack it, with none, keeps a chain a look holds with only a chain's fields, reads a chain an earlier build stored as reviewed as none with the look around it kept, and reads a look whose chain is none as no look", () => {
    const dir = runDir();
    const file = join(dir, "last-look.json");
    const { chain: _chain, ...before } = WORK_ITEM;
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [before] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...before, chain: null }] });
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, extra: 1, stages: CHAIN.stages.map((stage) => ({ ...stage, extra: 1 })) } }] }));
    expect(new LastLook(dir).get()).toEqual(LOOK);
    // A chain a build before the time of its state wrote is kept as in its state since its newest stage ended.
    const { since: _since, ...written } = CHAIN;
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: written }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, since: 4 } }] });
    // A stage a build before the broad gate wrote holds no run of one, and a gate's stage is kept with its run.
    const gate = { ...CHAIN.stages[0], kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: 3, output: true } };
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, stages: [...CHAIN.stages.map(({ gate: _gate, ...old }) => old), { ...gate, gate: { ...gate.gate, extra: 1 } }] } }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, stages: [...CHAIN.stages, gate] } }] });
    // A sealed chain and a seal's stage are kept, and a field an earlier build wrote on every chain is dropped.
    const seal = { ...CHAIN.stages[0], kind: "seal" };
    writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, state: "sealed", reviewedAt: null, stages: [seal] } }] }));
    expect(new LastLook(dir).get()).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: { ...CHAIN, state: "sealed", stages: [seal] } }] });
    // A build before the seal rested a chain `reviewed`: the look is read, with that work item's chain as none.
    for (const reviewed of [{ ...CHAIN, state: "reviewed", reviewedAt: "c".repeat(40) }, { ...CHAIN, state: "reviewed" }]) {
      writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: reviewed }] }));
      expect(new LastLook(dir).get(), JSON.stringify(reviewed)).toEqual({ ...LOOK, workItems: [{ ...WORK_ITEM, chain: null }] });
    }
    for (const chain of ["running", { ...CHAIN, state: "reviewing" }, { ...CHAIN, reviewedAt: 1 }, { ...CHAIN, since: "6" }, { ...CHAIN, stages: [{ ...CHAIN.stages[0], kind: "audit" }] }]) {
      writeFileSync(file, JSON.stringify({ ...LOOK, workItems: [{ ...WORK_ITEM, chain }] }));
      expect(new LastLook(dir).get(), JSON.stringify(chain)).toBeNull();
    }
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
