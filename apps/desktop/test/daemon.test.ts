import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import type { AccountLogins, RoleAdapter } from "../src/daemon/adapters/adapter";
import { claudeLogins } from "../src/daemon/adapters/claude-accounts";
import { type FakeAsk, fakeAdapter } from "../src/daemon/adapters/fake";
import { agentEventFor } from "../src/daemon/agent-events";
import { OutputBuffer } from "../src/daemon/buffer";
import { Daemon, type DaemonOptions, HEADLESS_KEPT, HEADLESS_LIMIT_MS } from "../src/daemon/daemon";
import { buildOf, readDiscovery, writeDiscovery } from "../src/daemon/discovery";
import type { HoldAwake } from "../src/daemon/keep-awake";
import { AgentMemoryStore, type MachineReader } from "../src/daemon/machine";
import { hookSettings, paneCommands, writeHookSettings } from "../src/daemon/hooks";
import { readPlugins } from "../src/daemon/claude-plugins";
import { carriedIn, paneHead, writePaneChain } from "../src/daemon/pane-chain";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { type DecisionRecord, RECORD_FILE, readDecisionRecord, withApplied, withCarried, withDecision, withReversal } from "../src/daemon/decision-record";
import { MARKER, SUBJECT, workflowText } from "../src/daemon/records-place";
import { readSetup } from "../src/daemon/worktree-setup";
import { COMMIT_END_GRACE_MS, createWorktree, readLoss } from "../src/daemon/worktrees";
import { interruptToolCall, lines, REPLY_ESC, replay, SECOND_PROMPT, sessionLog, TOOL_ESC } from "./interrupted-turn";
import { generateName } from "../src/shared/names";
import { type HeadlessInfo, type KeepAwake, type Machine, type MachineReading, type PullRequest, ROLE_STAGES, type RoleStage, type ServerMessage, type Usage, type WorkItem, type WorkItemLoss } from "../src/shared/protocol";
import { branchedWorktree, branchOf, commitFile, git, runs, temporaryClone, temporaryRepository, unansweringOrigin, writeStore } from "./repositories";
import { client as chainClient, commitSeal, ghStandIn, PULL_REQUEST_URL, roundRecord, standing } from "./chain-run";
import { VIEW_FIELDS } from "../src/daemon/github";

const TOKEN = "t".repeat(64);
/** A session whose agent has sent no event and whose silent start is not over, whose session just started, or whose kind reports no state. */
const NO_STATE = { state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null };
/** What a work item just made holds since its base. */
const NOTHING_NEW = { aheadOfBase: 0, behindBase: 0, newCommits: 0, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } };
const SESSION_FIELDS = ["accountId", "alive", "id", "kind", "signsIn", "state", "stateQuestions", "stateSince", "stateText", "stateTool", "workItemId"];
const WORK_ITEM_FIELDS = ["accountId", "aheadOfBase", "archivedAt", "baseBranch", "baseCommit", "behindBase", "branch", "chain", "changes", "commits", "createdAt", "decisions", "groupId", "id", "machineWait", "muted", "newCommits", "ownsBranch", "pinned", "pullRequest", "questions", "recorded", "repo", "repoId", "repoName", "seal", "setup", "title", "unread", "wordOwed", "worktree"];
const SETUP_FIELDS = ["command", "copied", "copiedCount", "endedAt", "exitCode", "failedCopies", "failure", "paneId", "startedAt", "state"];
/** What a work item holds of the fields set after its creation, by a person, by its setup, by its chain or by its pull request stage, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null, pullRequest: null };
/** What a work item holds of its record of decisions and questions where its worktree holds none. */
const NO_RECORD = { decisions: [], questions: [], unread: [] };
/** What a work item holds of its records of the chain where its worktree holds none of them. */
const NOTHING_RECORDED = { framed: false, rounds: 0, gate: null, verdict: null };
/** What a repository holds of the fields a person sets, before any is set. */
/** What a repository holds of the records place where its checkout holds none. */
const NO_RECORDS = { root: null, check: null, broadGate: null, olderCheck: null };
/** Which chain a repository's Claude Code panes run where its checkout holds no workflow of Owlery's and no person answered. */
const NO_CHAIN = { owl: false, plugin: false, chosen: null };
const PLAIN = { customName: null, icon: null, defaultBase: null, hidden: false, groups: [], records: NO_RECORDS, chain: NO_CHAIN, accountId: null };
const cleanups: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function daemon(options: Partial<DaemonOptions> = {}): Promise<{ daemon: Daemon; url: string }> {
  const d = new Daemon({
    token: TOKEN,
    paneKinds: PANE_KINDS,
    roleAdapter: fakeAdapter(),
    // The fake command of a pane: prints, waits, prints again, and stays alive.
    commandFor: () => ({ command: "/bin/sh", args: ["-c", "echo first; sleep 0.3; echo second; sleep 30"], env: {} }),
    ...options,
  });
  const port = await d.listen(0);
  cleanups.push(() => d.close());
  return { daemon: d, url: `ws://127.0.0.1:${port}` };
}

/** A client that keeps every message it receives. */
/** `null` sends no hello at all. */
async function client(url: string, token: string | null = TOKEN) {
  const socket = new WebSocket(url);
  const messages: ServerMessage[] = [];
  let closed: { code: number } | undefined;
  socket.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
  socket.on("close", (code) => {
    closed = { code };
  });
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
  if (token !== null) socket.send(JSON.stringify({ type: "hello", token }));
  cleanups.push(() => socket.close());
  const until = async <T>(find: () => T | undefined, ms = 5000): Promise<T> => {
    const end = Date.now() + ms;
    for (;;) {
      const found = find();
      if (found !== undefined) return found;
      if (Date.now() > end) throw new Error(`timed out; got ${JSON.stringify(messages)}`);
      await new Promise((r) => setTimeout(r, 20));
    }
  };
  return {
    socket,
    messages,
    send: (message: object) => socket.send(JSON.stringify(message)),
    closed: () => closed,
    until,
    message: <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean = () => true) =>
      until(() => messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>))),
  };
}

/**
 * Puts a `git` before the real one on the path the daemon runs git from: it
 * notes its arguments, waits `seconds`, and runs the real one. `calls` counts
 * the runs whose first argument is the command, and `noted` gives each run's
 * arguments, joined by spaces. The cases' own git goes through it too, until
 * `stop`.
 */
function watchedGit(base: string, seconds = 0): { calls: (command: string) => number; noted: () => string[]; stop: () => void } {
  const bin = join(base, "bin");
  const noted = join(base, "git-calls.txt");
  const path = process.env.PATH ?? "";
  mkdirSync(bin);
  writeFileSync(join(bin, "git"), `#!/bin/sh\necho "$*" >> '${noted}'\nsleep ${seconds}\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
  process.env.PATH = `${bin}:${path}`;
  const stop = (): void => {
    process.env.PATH = path;
  };
  cleanups.push(stop);
  const lines = (): string[] => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line !== "") : []);
  return {
    calls: (command) => lines().filter((line) => line.split(" ")[0] === command).length,
    noted: lines,
    stop,
  };
}

/**
 * Puts a `git` before the real one on the path the daemon runs git from: its
 * `git worktree add`, which makes a work item's folder, waits until
 * `release`, and every other command runs at once, the commands that
 * read a folder's repository among them. `when` names another command
 * to hold, as a test of the shell over git's arguments. `waiting` says
 * whether a held command has arrived.
 */
function heldGit(base: string, when = '[ "$1" = worktree ] && [ "$2" = add ]'): { release: () => void; waiting: () => boolean } {
  const bin = join(base, "held-bin");
  const released = join(base, "git-released");
  const arrived = join(base, "git-arrived");
  const path = process.env.PATH ?? "";
  mkdirSync(bin);
  // A held command also ends its wait once this script is gone, with the temporary folder of a case that failed before its release.
  writeFileSync(join(bin, "git"), `#!/bin/sh\nif ${when}; then touch '${arrived}'; while [ ! -e '${released}' ] && [ -e "$0" ]; do sleep 0.02; done; fi\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
  process.env.PATH = `${bin}:${path}`;
  const release = (): void => {
    writeFileSync(released, "");
    process.env.PATH = path;
  };
  cleanups.push(release);
  return { release, waiting: () => existsSync(arrived) };
}

/**
 * Stands the suite's process, and so a daemon of the case and the git it
 * runs, in a temporary repository's folder `src` until the case ends. A
 * relative folder a case sends then names that repository, and never the one
 * the suite itself runs in.
 */
function standingIn(repo: string): void {
  const before = process.cwd();
  mkdirSync(join(repo, "src", "src"), { recursive: true });
  process.chdir(join(repo, "src"));
  cleanups.push(() => process.chdir(before));
}

/** A temporary clone, removed after the case. */
function clone(branch?: string) {
  const made = temporaryClone(branch);
  cleanups.push(made.remove);
  return made;
}

/** A run folder that lists one work item, made before the daemon that reads it, whose branch, the one Owlery makes at a first commit (`branchedWorktree`), holds one new commit. */
async function runFolderWithWorkItem(made: { repo: string; root: string; base: string }, title: string) {
  const runDir = join(made.base, "run");
  mkdirSync(runDir);
  // An entry of `work-items.json` says nothing of whether Owlery made its branch, as no build that wrote one did.
  const { ownsBranch: _owns, ...place } = await branchedWorktree({ folder: made.repo, title, root: made.root });
  git(place.worktree, "commit", "--quiet", "--allow-empty", "-m", "one");
  const workItem = { id: 1, title, createdAt: 1, ...place };
  writeFileSync(join(runDir, "work-items.json"), JSON.stringify([workItem]));
  return { runDir, workItem };
}

/**
 * A daemon whose store lists one work item with no branch yet, number 1,
 * named `title`, written before the daemon that reads it: the worktree a
 * creation made with no branch picked, its `HEAD` detached at a commit of
 * its own that no branch holds. The tag `lone` holds that commit, so no read
 * takes it for a commit made in the worktree and makes the work item's
 * branch: a case makes one with a commit of its own. `branches` gives the
 * repository's local branches as git names them.
 */
async function daemonWithoutBranch(options: Partial<DaemonOptions> = {}, title = "No branch yet") {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const runDir = join(made.base, "run");
  mkdirSync(runDir);
  const { repo: _repo, ...place } = await createWorktree({ folder: made.repo, title, root: made.root });
  const lone = commitFile(place.worktree, "lone.txt");
  git(made.repo, "tag", "lone", lone);
  writeStore(runDir, made.repo, [{ id: 1, title, createdAt: 1, ...place }]);
  const { url } = await daemon({ runDir, worktreesRoot: made.root, ...options });
  const c = await client(url);
  await c.message("ready");
  return { made, runDir, c, worktree: place.worktree, lone, branches: () => git(made.repo, "for-each-ref", "--format=%(refname:short)", "refs/heads") };
}

/**
 * A daemon whose one work item has no branch yet and a worktree detached at
 * its base, the branch `feature`, one commit past `main`, with no commit made
 * in the worktree. Where `deleted`, the base branch is deleted before the
 * daemon starts, as after a squash merge, so no ref holds the base commit.
 */
async function daemonAtBase(deleted: boolean) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const runDir = join(made.base, "run");
  mkdirSync(runDir);
  git(made.repo, "branch", "--quiet", "feature");
  const tip = commitFile(made.repo, "feature.txt");
  git(made.repo, "branch", "--quiet", "--force", "feature", tip);
  git(made.repo, "reset", "--quiet", "--hard", "HEAD~1");
  const { repo: _repo, ...place } = await createWorktree({ folder: made.repo, title: "No branch yet", root: made.root, base: "feature" });
  if (deleted) git(made.repo, "branch", "--quiet", "-D", "feature");
  writeStore(runDir, made.repo, [{ id: 1, title: "No branch yet", createdAt: 1, ...place }]);
  const { url } = await daemon({ runDir, worktreesRoot: made.root, commitPollMs: 20 });
  const c = await client(url);
  await c.message("ready");
  return { made, c, worktree: place.worktree, branches: () => git(made.repo, "for-each-ref", "--format=%(refname:short)", "refs/heads") };
}

type Client = Awaited<ReturnType<typeof client>>;

/**
 * Gives a work item a creation made, with no branch picked, its branch as a
 * rename gives it: a `renameWorkItem` of its own name with `branch: true`,
 * which makes `owlery/<slug of the name>` at its worktree's `HEAD`. A case
 * whose work item needs a branch after its creation takes it this way. The
 * work item comes back as the lists carry it once it has the branch.
 */
async function branchedByRename(c: Client, workItem: WorkItem, requestId: number): Promise<WorkItem> {
  c.send({ type: "renameWorkItem", requestId, id: workItem.id, title: workItem.title, branch: true });
  await c.message("done", (m) => m.requestId === requestId);
  const inbox = await c.message("inbox", (m) => m.workItems.some((w) => w.id === workItem.id && w.branch !== null));
  return inbox.workItems.find((w) => w.id === workItem.id)!;
}

/** A daemon whose run folder lists one work item, number 1, in which a pane starts. */
async function daemonWithWorkItem(options: Partial<DaemonOptions> = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const { runDir, workItem } = await runFolderWithWorkItem(made, "Pane work");
  return { ...(await daemon({ runDir, worktreesRoot: made.root, ...options })), workItem };
}

/** Every file under a folder with its bytes, and the repository's refs and worktrees as git prints them. */
function onDisk(repo: string, ...folders: string[]): unknown[] {
  const files = (folder: string) =>
    (readdirSync(folder, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[])
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .sort()
      .map((file) => [file, readFileSync(file, "base64")]);
  return [git(repo, "for-each-ref"), git(repo, "worktree", "list", "--porcelain"), ...[repo, ...folders].map(files)];
}
/** What a request that ends sessions names where the person was told of none. */
const NONE_RUNNING = { panes: [], headless: [] };
/** The role a case starts a headless session as, through `Daemon#startRoleSession`, where the role is not what it tests. */
const PROOFER = { role: "proofer", stage: "round" } as const;
/** What the fake adapter answers a proofer's prompt with. */
const proofersAnswer = (prompt: string): string => `As the proofer at the stage round, you asked: "${prompt}"`;

describe("the daemon's local server", () => {
  it("listens on the loopback address only", async () => {
    const { daemon: d } = await daemon();
    expect(d.address()).toBe("127.0.0.1");
  });

  it("refuses a client whose first message has the wrong token", async () => {
    const { url } = await daemon();
    const c = await client(url, "wrong");
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
    expect(c.messages).toEqual([]);
  });

  it("refuses a client that sends anything before the token", async () => {
    const { url } = await daemonWithWorkItem();
    const c = await client(url, null);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
  });

  it("refuses a client that never says hello", async () => {
    const { url } = await daemon({ helloTimeoutMs: 100 });
    const c = await client(url, null);
    await c.until(() => c.closed());
    expect(c.closed()?.code).toBe(4001);
  });
});

describe("sessions", () => {
  it("starts a session and streams its output", async () => {
    const { url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 7, workItemId: 1 });
    const started = await c.message("started", (m) => m.requestId === 7);
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === started.session.id && m.data.includes("first")) ? true : undefined));
  });

  it("keeps a session alive when its client leaves, and replays the output the client missed", async () => {
    const { url } = await daemonWithWorkItem();
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await first.message("started");
    await first.until(() => (first.messages.some((m) => m.type === "output" && m.data.includes("first")) ? true : undefined));
    first.socket.close();

    // "second" is printed while no client is connected.
    await new Promise((r) => setTimeout(r, 500));
    const second = await client(url);
    const ready = await second.message("ready");
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: 1, accountId: 0, signsIn: null, ...NO_STATE }]);
    second.send({ type: "attach", id: session.id });
    const replay = await second.message("replay");
    expect(replay.data).toContain("first");
    expect(replay.data).toContain("second");
  });

  it("sends a reconnecting client each line once: what it missed in the replay, the rest live", async () => {
    // Prints forty numbered lines in five bursts of eight, 100 ms apart, so lines are printed between the client's ready and its attach. Each pause starts a `sleep` process, which takes about 45 ms on GitHub's macOS runner, so the lines come in bursts and not one pause each: forty starts there took the case past its five seconds.
    const { url } = await daemonWithWorkItem({
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "i=0; while [ $i -lt 40 ]; do echo line-$i; i=$((i+1)); [ $((i % 8)) -ne 0 ] || sleep 0.1; done; sleep 30"], env: {} }),
    });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await first.message("started");
    first.socket.close();

    const second = await client(url);
    await second.message("ready");
    await new Promise((r) => setTimeout(r, 150));
    second.send({ type: "attach", id: session.id });
    await second.until(() => (second.messages.some((m) => m.type === "output" && m.data.includes("line-39")) || second.messages.some((m) => m.type === "replay" && m.data.includes("line-39")) ? true : undefined));
    const drawn = second.messages.flatMap((m) => (m.type === "replay" || m.type === "output") && m.id === session.id ? [m.data] : []).join("");
    for (let i = 0; i < 40; i++) expect(drawn.split(`line-${i}\r`).length - 1).toBe(1);
  });

  it("sends a session's output only to the clients that opened or attached it", async () => {
    const { url } = await daemonWithWorkItem();
    const opener = await client(url);
    await opener.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    opener.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    await opener.until(() => (opener.messages.some((m) => m.type === "output" && m.data.includes("first")) ? true : undefined));
    expect(bystander.messages.filter((m) => m.type === "output")).toEqual([]);
  });

  it("sends a client that detached no further output of the session while the other client still receives it, and after its next attach a replay of what was printed meanwhile and the output after it", async () => {
    // The pane answers each line it is sent, so the case decides when it prints.
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'while read line; do echo "got-$line."; done'], env: {} }) });
    const stays = await client(url);
    await stays.message("ready");
    stays.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await stays.message("started");
    const leaves = await client(url);
    await leaves.message("ready");
    leaves.send({ type: "attach", id: session.id });
    await leaves.message("replay");
    const printed = (c: { messages: ServerMessage[] }, text: string) => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(text)) ? true : undefined);
    leaves.send({ type: "input", id: session.id, data: "one\n" });
    for (const each of [stays, leaves]) await each.until(() => printed(each, "got-one."));

    // The daemon handles one client's messages in the order they arrive, so the line is sent after the detach.
    leaves.send({ type: "detach", id: session.id });
    leaves.send({ type: "input", id: session.id, data: "two\n" });
    await stays.until(() => printed(stays, "got-two."));
    await new Promise((r) => setTimeout(r, 200));
    expect(leaves.messages.filter((m) => m.type === "output" && m.data.includes("two"))).toEqual([]);

    leaves.send({ type: "attach", id: session.id });
    const replay = await leaves.message("replay", (m) => m.data.includes("got-one."));
    expect(replay.data).toContain("got-two.");
    leaves.send({ type: "input", id: session.id, data: "three\n" });
    await leaves.until(() => printed(leaves, "got-three."));
  });

  it("forgets a session's kept output at a forget, so the next replay holds only what the session printed afterwards, and changes nothing for an id it does not list", async () => {
    // The pane answers each line it is sent, so the case decides when it prints.
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'while read line; do echo "got-$line."; done'], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const printed = (text: string) => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(text)) ? true : undefined);
    const replays = () => c.messages.filter((m): m is Extract<ServerMessage, { type: "replay" }> => m.type === "replay");
    c.send({ type: "input", id: session.id, data: "one\n" });
    await c.until(() => printed("got-one."));

    // No session has this id, and the one that printed keeps its output.
    c.send({ type: "forget", id: session.id + 1 });
    c.send({ type: "attach", id: session.id });
    expect((await c.until(() => replays()[0])).data).toContain("got-one.");

    c.send({ type: "forget", id: session.id });
    c.send({ type: "input", id: session.id, data: "two\n" });
    await c.until(() => printed("got-two."));
    c.send({ type: "attach", id: session.id });
    const later = await c.until(() => replays()[1]);
    expect(later.data).toContain("got-two.");
    expect(later.data).not.toContain("one");
  });

  it("keeps the modes a session's program set at a forget that asks for them, first in the next replay, and keeps nothing at a forget that does not ask", async () => {
    // The pane asks for pastes in brackets, and then answers each line it is sent.
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'printf "\\033[?2004h"; while read line; do echo "got-$line."; done'], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const printed = (text: string) => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(text)) ? true : undefined);
    const replays = () => c.messages.filter((m): m is Extract<ServerMessage, { type: "replay" }> => m.type === "replay");
    c.send({ type: "input", id: session.id, data: "one\n" });
    await c.until(() => printed("got-one."));

    c.send({ type: "forget", id: session.id, keepModes: true });
    c.send({ type: "input", id: session.id, data: "two\n" });
    await c.until(() => printed("got-two."));
    c.send({ type: "attach", id: session.id });
    const kept = await c.until(() => replays()[0]);
    expect(kept.data.startsWith("\u001b[?2004h")).toBe(true);
    expect(kept.data).toContain("got-two.");
    expect(kept.data).not.toContain("one");

    c.send({ type: "forget", id: session.id });
    c.send({ type: "attach", id: session.id });
    expect((await c.until(() => replays()[1])).data).toBe("");
  });

  it("ends a session's output with the exit line, on a line of its own: sent to the clients that receive the session, and last in a later replay", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "printf last; exit 3"], env: {} }) });
    const opener = await client(url);
    await opener.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    opener.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await opener.message("started");
    await opener.message("exit");
    const sent = opener.messages.flatMap((m) => (m.type === "output" && m.id === session.id ? [m.data] : [])).join("");
    expect(sent).toBe("last\r\n[process exited with code 3]\r\n");
    // The line is the session's output, so a client that does not receive the session is not sent it.
    expect(bystander.messages.filter((m) => m.type === "output")).toEqual([]);
    // It is sent before the `exit` it follows from, so a client draws it before it learns of the end.
    expect(opener.messages.findIndex((m) => m.type === "output" && m.data.includes("[process exited with code 3]"))).toBeLessThan(opener.messages.findIndex((m) => m.type === "exit"));

    const later = await client(url);
    await later.message("ready");
    later.send({ type: "attach", id: session.id });
    expect((await later.message("replay")).data).toBe("last\r\n[process exited with code 3]\r\n");
  });

  it("takes a size sent for a session whose process exited, changes nothing, and goes on answering", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await c.message("exit");
    // A window that shows an exited pane fits its screen and tells the size, as it does for a live one. The pseudo-terminal is closed by then.
    c.send({ type: "resize", id: session.id, cols: 100, rows: 30 });
    c.send({ type: "attach", id: session.id });
    expect((await c.message("replay")).data).toBe("\r\n[process exited with code 3]\r\n");
  });

  it("tells every client when a session ends, and lists it as ended", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const exit = await c.message("exit");
    expect(exit).toEqual({ type: "exit", id: session.id, exitCode: 3 });
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "shell", alive: false, workItemId: 1, accountId: 0, signsIn: null, ...NO_STATE }]);
  });

  it("gives each session's process the pane's id and the hook socket", async () => {
    const seen: number[] = [];
    const { url } = await daemonWithWorkItem({
      commandFor: (_kind, id) => {
        seen.push(id);
        return { command: "/bin/sh", args: ["-c", 'echo "pane=$OWLERY_PANE_ID"; sleep 30'], env: { OWLERY_PANE_ID: String(id) } };
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(seen).toEqual([session.id]);
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.data.includes(`pane=${session.id}`)) ? true : undefined));
  });
});

describe("work items", () => {
  // A pane that prints the folder its process runs in, and stays alive.
  const printsItsFolder = () => ({ command: "/bin/sh", args: ["-c", 'echo "cwd=$(pwd -P)"; sleep 30'], env: {} });

  function repository() {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  }

  it("creates a work item and opens a pane whose process runs in its worktree, which stands detached at the base, and the repository gains no branch", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ commandFor: printsItsFolder, worktreesRoot: root, now: () => 1234 });
    const c = await client(url);
    expect((await c.message("ready")).workItems).toEqual([]);
    const branches = () => git(repo, "for-each-ref", "refs/heads");
    const before = branches();
    c.send({ type: "createWorkItem", requestId: 3, repo, title: "Fix the login bug", kind: "claude", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated", (m) => m.requestId === 3);
    const worktree = join(root, "project", "fix-the-login-bug");
    const baseCommit = git(repo, "rev-parse", "HEAD").trim();
    // The repository's HEAD is on `main`, and its folder is named `project`. No branch was picked, so the creation made none.
    expect(created.workItem).toEqual({ id: 1, title: "Fix the login bug", repoId: 1, repo, repoName: "project", ...UNSET, accountId: null, machineWait: null, wordOwed: null, ...NO_RECORD, recorded: NOTHING_RECORDED, seal: null, branch: null, ownsBranch: false, worktree, createdAt: 1234, baseCommit, baseBranch: "main", ...NOTHING_NEW });
    expect(created.session).toEqual({ id: created.session.id, kind: "claude", alive: true, workItemId: 1, accountId: 0, signsIn: null, ...NO_STATE });
    expect(git(repo, "worktree", "list", "--porcelain")).toContain(`worktree ${worktree}\nHEAD ${baseCommit}\ndetached\n`);
    expect([branches(), git(worktree, "branch", "--show-current").trim()]).toEqual([before, ""]);
    // The creating client receives the pane's output, as with a pane it started.
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === created.session.id && m.data.includes(`cwd=${worktree}\r`)) ? true : undefined));
    const later = await client(url);
    const ready = await later.message("ready");
    expect(ready.workItems).toEqual([created.workItem]);
    expect(ready.sessions).toEqual([created.session]);
  });

  it("carries only the fields the protocol names, none of them a vendor's", async () => {
    const { repo, root } = repository();
    const { daemon: d, url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Keys", kind: "shell", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated");
    // The reversal is committed on the work item's branch, which a rename gives it.
    const directory = withDirectory(await branchedByRename(c, created.workItem, 9));
    // Two decisions, one of them reversed, a park with a question that names options, and a block the reader refuses, so that the lists carry a decision, a question, an option and an unread line.
    d.decided(created.workItem.id, { kind: "default", says: "Start from main.", grounds: "The repository's default base." });
    d.decided(created.workItem.id, { kind: "route", says: "Build it with no framer.", grounds: "The issue names one file." });
    c.send({ type: "reverseDecision", requestId: 2, workItemId: created.workItem.id, decisionId: 1, message: "Frame it first." });
    await c.message("done", (m) => m.requestId === 2);
    d.park(created.workItem.id, { by: "sealer", questions: [{ asks: "Which base?", grounds: "No document names it.", options: [{ label: "main", implies: "The default." }], default: "main" }] });
    writeFileSync(join(directory, RECORD_FILE), `${readFileSync(join(directory, RECORD_FILE), "utf8")}\n\`\`\`seal\n\`\`\`\n`);
    // A verdict, so that what the records say of the chain carries one.
    writeFileSync(join(directory, "guarantee.md"), `\`\`\`seal\ntarget: ${"a".repeat(40)} against main\nVerdict: withheld reason: The suite failed.\n\`\`\`\n`);
    expect(Object.keys(created).sort()).toEqual(["requestId", "session", "type", "workItem"]);
    expect(Object.keys(created.workItem).sort()).toEqual(WORK_ITEM_FIELDS);
    expect(Object.keys(created.session).sort()).toEqual(SESSION_FIELDS);
    expect(Object.keys(created.workItem.changes!).sort()).toEqual(["added", "files", "list", "removed"]);
    // The daemon commits the reversal, so the lists carry a commit and a changed file. The case's own commit waits for it, since two commits of one worktree do not run at once.
    await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 1);
    writeFileSync(join(created.workItem.worktree, "one.txt"), "one\n");
    git(created.workItem.worktree, "add", "one.txt");
    git(created.workItem.worktree, "commit", "--quiet", "-m", "add one");
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 2);
    // A look, so that `ready` carries one; the `attach` after it is answered once the daemon has handled both.
    c.send({ type: "looked" });
    c.send({ type: "attach", id: created.session.id });
    await c.message("replay");
    const ready = await (await client(url)).message("ready");
    expect(Object.keys(ready).sort()).toEqual(["accounts", "agentNotice", "archived", "defaultAccountId", "headless", "lastLook", "paneKinds", "refreshesUsage", "repositories", "sessions", "type", "workItems"]);
    expect(Object.keys(ready.repositories[0]!).sort()).toEqual(["accountId", "chain", "customName", "defaultBase", "folder", "groups", "hidden", "icon", "id", "name", "records"]);
    expect(Object.keys(ready.repositories[0]!.records).sort()).toEqual(["broadGate", "check", "olderCheck", "root"]);
    expect(Object.keys(ready.repositories[0]!.chain).sort()).toEqual(["chosen", "owl", "plugin"]);
    expect(Object.keys(ready.lastLook!).sort()).toEqual(["at", "sessions", "workItems"]);
    expect(Object.keys(ready.paneKinds[0]!).sort()).toEqual(["accounts", "continues", "kind", "label", "reportsState"]);
    expect(Object.keys(inbox).sort()).toEqual(["archived", "repositories", "sessions", "type", "workItems"]);
    for (const lists of [inbox, ready, ready.lastLook!]) {
      // The look keeps no account a pane was launched under, as it keeps none set on a work item.
      expect(Object.keys(lists.sessions[0]!).sort()).toEqual(lists === ready.lastLook ? SESSION_FIELDS.filter((key) => key !== "accountId" && key !== "signsIn") : SESSION_FIELDS);
      const workItem = lists.workItems[0]!;
      // The look keeps nothing of what the records say of the chain, nor the account set on the work item, nor what a heavy command or a word of the person's waits for, nor whether Owlery made its branch, and keeps the seal reading the lists carried.
      expect(Object.keys(workItem).sort()).toEqual(lists === ready.lastLook ? WORK_ITEM_FIELDS.filter((key) => key !== "recorded" && key !== "accountId" && key !== "machineWait" && key !== "wordOwed" && key !== "ownsBranch") : WORK_ITEM_FIELDS);
      if (lists !== ready.lastLook) {
        expect(Object.keys(workItem.recorded!).sort()).toEqual(["framed", "gate", "rounds", "verdict"]);
        expect(Object.keys(workItem.recorded!.verdict!).sort()).toEqual(["commit", "is", "says"]);
      }
      expect(Object.keys(workItem.commits![0]!).sort()).toEqual(["added", "at", "hash", "removed", "subject"]);
      expect(Object.keys(workItem.changes!).sort()).toEqual(["added", "files", "list", "removed"]);
      expect(Object.keys(workItem.changes!.list[0]!).sort()).toEqual(["added", "path", "removed"]);
      const DECISION_FIELDS = ["by", "grounds", "id", "kind", "landed", "reversal", "says", "since", "state"];
      expect(workItem.decisions.map((decision) => Object.keys(decision).sort())).toEqual([DECISION_FIELDS, DECISION_FIELDS]);
      expect(workItem.questions.map((question) => Object.keys(question).sort())).toEqual([["answer", "asks", "by", "default", "grounds", "id", "options", "since"]]);
      expect(Object.keys(workItem.questions[0]!.options[0]!).sort()).toEqual(["implies", "label"]);
      expect(workItem.unread.map((unread) => Object.keys(unread).sort())).toEqual([["line", "why"]]);
    }
  });

  it("gives a second work item of the same title a folder ending in -2, though both are asked at once, and neither a branch", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Fix the login bug", kind: "shell", cols: 80, rows: 24 });
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Fix the login bug", kind: "shell", cols: 80, rows: 24 });
    const first = await c.message("workItemCreated", (m) => m.requestId === 1);
    const second = await c.message("workItemCreated", (m) => m.requestId === 2);
    expect(first.workItem).toMatchObject({ id: 1, branch: null, worktree: join(root, "project", "fix-the-login-bug") });
    expect(second.workItem).toMatchObject({ id: 2, branch: null, worktree: join(root, "project", "fix-the-login-bug-2") });
  });

  it("names a work item nobody named with one generated name, as its title and its folder, and stores a typed title without the white space at its ends", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, random: () => 0.5 });
    const name = generateName(() => 0.5);
    const c = await client(url);
    await c.message("ready");
    const create = async (requestId: number, fields: object) => {
      c.send({ type: "createWorkItem", requestId, repo, kind: "shell", cols: 80, rows: 24, ...fields });
      return (await c.message("workItemCreated", (m) => m.requestId === requestId)).workItem;
    };
    expect(await create(1, { title: "" })).toMatchObject({ title: name, branch: null, worktree: join(root, "project", name) });
    expect(git(repo, "worktree", "list", "--porcelain")).toContain(`worktree ${join(root, "project", name)}\n`);
    // The same draw again: the title carries the number the folder got.
    expect(await create(2, { title: " \t" })).toMatchObject({ title: `${name}-2`, worktree: join(root, "project", `${name}-2`) });
    // A title that leaves no slug is the work item's title as typed, and the name sent names its folder.
    expect(await create(3, { title: " 로그인 버그 ", name: "amber-heron" })).toMatchObject({ title: "로그인 버그", worktree: join(root, "project", "amber-heron") });
    expect(await create(4, { title: " Fix the login bug ", name: "amber-heron" })).toMatchObject({ title: "Fix the login bug", worktree: join(root, "project", "fix-the-login-bug") });
    // An empty title with a name sent is called by that name.
    expect(await create(5, { title: "", name: "quiet-otter" })).toMatchObject({ title: "quiet-otter", worktree: join(root, "project", "quiet-otter") });
    expect(git(repo, "for-each-ref", "refs/heads/owlery")).toBe("");
  });

  it("starts a work item at the base its creation names, detached at it: a local branch, a remote's branch no local branch bears, and the local branch where both bear the name", async () => {
    const { repo, origin, root } = clone();
    git(origin, "branch", "--quiet", "shadow");
    git(origin, "checkout", "--quiet", "-b", "remote-only");
    const remoteOnly = commitFile(origin, "remote.txt");
    git(repo, "fetch", "--quiet", "origin");
    git(repo, "checkout", "--quiet", "-b", "feature");
    const feature = commitFile(repo, "feature.txt");
    // A local branch that bears the name of the remote's `shadow`, at another commit than it.
    git(repo, "branch", "--quiet", "origin/shadow");
    git(repo, "checkout", "--quiet", "main");
    const first = git(repo, "rev-parse", "refs/remotes/origin/shadow").trim();
    expect(new Set([first, feature, remoteOnly]).size).toBe(3);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const create = async (requestId: number, base: string) => {
      c.send({ type: "createWorkItem", requestId, repo, title: `From ${requestId}`, base, kind: "shell", cols: 80, rows: 24 });
      const { workItem } = await c.message("workItemCreated", (m) => m.requestId === requestId);
      expect([workItem.branch, git(workItem.worktree, "rev-parse", "HEAD").trim()]).toEqual([null, workItem.baseCommit]);
      return [workItem.baseBranch, workItem.baseCommit, workItem.aheadOfBase, workItem.behindBase];
    };
    expect(await create(1, "feature")).toEqual(["feature", feature, 0, 0]);
    expect(await create(2, "origin/remote-only")).toEqual(["origin/remote-only", remoteOnly, 0, 0]);
    expect(await create(3, "origin/shadow")).toEqual(["origin/shadow", feature, 0, 0]);
  });

  it("answers a creation whose base is none of the repository's with an error that names it, and creates no branch, folder or list entry", async () => {
    const { repo, root } = clone();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const refused = async (requestId: number, base: unknown) => {
      c.send({ type: "createWorkItem", requestId, repo, title: "Refused", base, kind: "shell", cols: 80, rows: 24 });
      return (await c.message("error", (m) => m.requestId === requestId)).message;
    };
    expect(await refused(1, "nope")).toBe(`${repo} has no branch nope to start a work item from`);
    // A remote's HEAD entry is a ref of the clone, and no base.
    expect(git(repo, "rev-parse", "--verify", "refs/remotes/origin/HEAD").trim()).toBe(git(repo, "rev-parse", "HEAD").trim());
    expect(await refused(2, "origin/HEAD")).toBe(`${repo} has no branch origin/HEAD to start a work item from`);
    // A name that only begins a branch's is none, and neither is one git reads as a pattern.
    git(repo, "branch", "--quiet", "feat/login");
    expect(await refused(3, "feat")).toBe(`${repo} has no branch feat to start a work item from`);
    expect(await refused(4, "ma*")).toBe(`${repo} has no branch ma* to start a work item from`);
    expect(await refused(5, "")).toBe(`${repo} has no branch  to start a work item from`);
    expect(await refused(6, 7)).toBe("a work item starts from a branch's name, and 7 is none");
    expect(await refused(7, null)).toBe("a work item starts from a branch's name, and null is none");
    expect(git(repo, "for-each-ref", "refs/heads/owlery")).toBe("");
    expect(existsSync(root)).toBe(false);
    const ready = await (await client(url)).message("ready");
    expect(ready.workItems).toEqual([]);
    expect(ready.sessions).toEqual([]);
    expect(c.messages.some((m) => m.type === "workItemCreated")).toBe(false);
  });

  it("checks out a local branch a creation names as it stands, adds no branch, keeps it as one Owlery did not make and reads what it holds since the commit it shares with the base; and checks out a remote's branch as a local branch of its name that tracks it, which is Owlery's", async () => {
    const { repo, origin, root } = clone();
    const fork = git(repo, "rev-parse", "HEAD").trim();
    git(repo, "checkout", "--quiet", "-b", "feat/login");
    commitFile(repo, "login.txt");
    git(repo, "checkout", "--quiet", "main");
    git(origin, "checkout", "--quiet", "-b", "remote-only");
    const remoteOnly = commitFile(origin, "remote.txt");
    git(origin, "checkout", "--quiet", "main");
    git(repo, "fetch", "--quiet", "origin");
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const branches = () => git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").trim().split("\n");
    expect(branches()).toEqual(["feat/login", "main"]);
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "On the feature", branch: "feat/login", kind: "shell", cols: 80, rows: 24 });
    const local = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    expect(local).toMatchObject({ branch: "feat/login", ownsBranch: false, baseCommit: fork, baseBranch: "origin/main", newCommits: 1, aheadOfBase: 1, behindBase: 0 });
    expect([local.commits?.map(({ subject }) => subject), branches(), git(local.worktree, "branch", "--show-current").trim()]).toEqual([["add login.txt"], ["feat/login", "main"], "feat/login"]);
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "From the remote", branch: "origin/remote-only", kind: "shell", cols: 80, rows: 24 });
    const tracking = (await c.message("workItemCreated", (m) => m.requestId === 2)).workItem;
    expect(tracking).toMatchObject({ branch: "remote-only", ownsBranch: true, baseCommit: fork, newCommits: 1 });
    expect([branches(), git(repo, "for-each-ref", "--format=%(upstream:short)", "refs/heads/remote-only").trim(), git(repo, "rev-parse", "refs/heads/remote-only").trim()]).toEqual([["feat/login", "main", "remote-only"], "origin/remote-only", remoteOnly]);
  });

  it("names in a plan each branch a worktree has checked out with that worktree's folder, and refuses a creation that names one, or none of the repository's, saying so, and creates nothing", async () => {
    const { repo, root } = repository();
    git(repo, "branch", "--quiet", "feat/login");
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "First", branch: "feat/login", kind: "shell", cols: 80, rows: 24 });
    const first = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    c.send({ type: "planWorkItem", requestId: 2, repo, title: "Second" });
    expect((await c.message("workItemPlan", (m) => m.requestId === 2)).held).toEqual([{ branch: "main", folder: repo }, { branch: "feat/login", folder: first.worktree }]);
    const held = () => [git(repo, "for-each-ref"), git(repo, "worktree", "list", "--porcelain"), readdirSync(join(root, "project"))];
    const before = held();
    const refused = async (requestId: number, branch: unknown) => {
      c.send({ type: "createWorkItem", requestId, repo, title: "Second", branch, kind: "shell", cols: 80, rows: 24 });
      return (await c.message("error", (m) => m.requestId === requestId)).message;
    };
    expect(await refused(3, "feat/login")).toBe(`The branch feat/login is checked out in ${first.worktree}, so a new work item cannot check it out.`);
    expect(await refused(4, "main")).toBe(`The branch main is checked out in ${repo}, so a new work item cannot check it out.`);
    expect(await refused(5, "nope")).toBe(`${repo} has no branch nope to check out`);
    expect(await refused(6, 7)).toBe("a work item checks out a branch by its name, and 7 is none");
    expect(held()).toEqual(before);
    expect((await (await client(url)).message("ready")).workItems.map(({ id }) => id)).toEqual([first.id]);
  });

  it("answers a plan with the branch and the folder a creation would get, and creates nothing", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, random: () => 0.5 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Fix the login bug", kind: "shell", cols: 80, rows: 24 });
    await c.message("workItemCreated");
    const held = () => [git(repo, "for-each-ref"), git(repo, "worktree", "list", "--porcelain"), readdirSync(join(root, "project"))];
    const before = held();
    const plan = async (requestId: number, fields: object) => {
      c.send({ type: "planWorkItem", requestId, repo, ...fields });
      return await c.message("workItemPlan", (m) => m.requestId === requestId);
    };
    // The work item made first has no branch yet, so the branch a making of this title gives is free, and the folder is taken.
    const planned = await plan(2, { title: "Fix the login bug" });
    expect(planned).toEqual({ type: "workItemPlan", requestId: 2, branch: "owlery/fix-the-login-bug", worktree: join(root, "project", "fix-the-login-bug-2"), held: [{ branch: "main", folder: repo }], localBases: ["main"], remoteBases: [], defaultBase: "main", setupCommand: null, includes: false });
    expect(Object.keys(planned).sort()).toEqual(["branch", "defaultBase", "held", "includes", "localBases", "remoteBases", "requestId", "setupCommand", "type", "worktree"]);
    // The name sent names the branch where the title leaves no slug, and a generated name where neither does.
    expect(await plan(3, { title: "로그인 버그", name: "amber-heron" })).toMatchObject({ branch: "owlery/amber-heron", worktree: join(root, "project", "amber-heron") });
    const name = generateName(() => 0.5);
    expect(await plan(4, { title: "" })).toMatchObject({ branch: `owlery/${name}`, worktree: join(root, "project", name) });
    expect(held()).toEqual(before);
    expect((await (await client(url)).message("ready")).workItems).toHaveLength(1);
    expect(c.messages.filter((m) => m.type === "inbox")).toHaveLength(1);
  });

  it("lists in a plan the local branches, the checkout's first, and the remote's branches without its HEAD entry and without a name a local branch bears, each newest commit first, with the remote's default branch as the default base", async () => {
    const { repo, origin, root } = clone();
    // Every dated commit is older than the first one, which the clock dated.
    const T = 1_000_000_000;
    git(origin, "branch", "--quiet", "shadow");
    git(origin, "checkout", "--quiet", "-b", "older");
    commitFile(origin, "older.txt", T + 100);
    git(origin, "checkout", "--quiet", "-b", "remote-only", "main");
    commitFile(origin, "remote-only.txt", T + 200);
    git(origin, "checkout", "--quiet", "main");
    git(repo, "fetch", "--quiet", "origin");
    git(repo, "checkout", "--quiet", "-b", "recent");
    commitFile(repo, "recent.txt", T + 300);
    git(repo, "checkout", "--quiet", "-b", "feature", "main");
    commitFile(repo, "feature.txt", T + 50);
    git(repo, "branch", "--quiet", "origin/shadow");
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "planWorkItem", requestId: 1, repo, title: "Listed" });
    expect(await c.message("workItemPlan")).toEqual({
      type: "workItemPlan",
      requestId: 1,
      branch: "owlery/listed",
      worktree: join(root, "project", "listed"),
      held: [{ branch: "feature", folder: repo }],
      localBases: ["feature", "main", "recent", "origin/shadow"],
      remoteBases: ["origin/main", "origin/remote-only", "origin/older"],
      defaultBase: "origin/main",
      setupCommand: null,
      includes: false,
    });
    expect(existsSync(root)).toBe(false);
  });

  it("answers a plan in a folder outside any git repository, one whose fields are not the protocol's, and one in a folder that is not absolute, with an error", async () => {
    const { base, repo, root } = repository();
    const folder = join(base, "plain");
    mkdirSync(folder);
    standingIn(repo);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const refused = async (requestId: number, fields: object) => {
      c.send({ type: "planWorkItem", requestId, ...fields });
      return await c.message("error", (m) => m.requestId === requestId);
    };
    expect(await refused(8, { repo: folder, title: "Anything" })).toEqual({ type: "error", requestId: 8, message: `${folder} is not inside a git repository` });
    expect((await refused(9, { repo, title: 7 })).message).toBe("a work item needs a repository folder and a title");
    expect((await refused(10, { repo, title: "Named", name: 7 })).message).toBe("a work item's name, where one is sent, is a string");
    // A relative folder would have git answer for the folder the daemon runs in, which is inside a repository here.
    for (const [requestId, relative] of [[11, "."], [12, "src"], [13, ""]] as const) expect((await refused(requestId, { repo: relative, title: "Anything" })).message).toBe(`the repository folder has to be a whole path from /, and ${JSON.stringify(relative)} is not`);
    expect(c.messages.some((m) => m.type === "workItemPlan")).toBe(false);
    expect(existsSync(root)).toBe(false);
  });

  it("answers a plan while a creation is still under way", async () => {
    const { repo, root, base } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const held = heldGit(base);
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Slow", kind: "shell", cols: 80, rows: 24 });
    c.send({ type: "planWorkItem", requestId: 2, repo, title: "Meanwhile" });
    expect(await c.message("workItemPlan")).toMatchObject({ requestId: 2, branch: "owlery/meanwhile" });
    expect(c.messages.some((m) => m.type === "workItemCreated")).toBe(false);
    held.release();
    await c.message("workItemCreated");
  });

  it("answers a folder outside any git repository with an error, and creates no branch, folder, list entry or pane", async () => {
    const { base, root } = repository();
    const folder = join(base, "plain");
    mkdirSync(folder);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 9, repo: folder, title: "Anything", kind: "shell", cols: 80, rows: 24 });
    const error = await c.message("error");
    expect(error).toEqual({ type: "error", requestId: 9, message: `${folder} is not inside a git repository` });
    expect(existsSync(root)).toBe(false);
    expect(readdirSync(folder)).toEqual([]);
    const ready = await (await client(url)).message("ready");
    expect(ready.workItems).toEqual([]);
    expect(ready.sessions).toEqual([]);
    expect(c.messages.some((m) => m.type === "workItemCreated")).toBe(false);
  });

  it("answers a creation whose fields are not the protocol's, and one in a folder that is not absolute, with an error, and stays up", async () => {
    const { repo, root } = repository();
    standingIn(repo);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 4, repo, title: 7, kind: "shell", cols: 80, rows: 24 });
    expect(await c.message("error")).toEqual({ type: "error", requestId: 4, message: "a work item needs a repository folder and a title" });
    expect(existsSync(root)).toBe(false);
    c.send({ type: "createWorkItem", requestId: 6, repo, title: "Named", name: 7, kind: "shell", cols: 80, rows: 24 });
    expect(await c.message("error", (m) => m.requestId === 6)).toEqual({ type: "error", requestId: 6, message: "a work item's name, where one is sent, is a string" });
    expect(existsSync(root)).toBe(false);
    // A relative folder would have git answer for the folder the daemon runs in, which is inside a repository here.
    for (const [requestId, relative] of [[7, "."], [8, "src"], [9, ""]] as const) {
      c.send({ type: "createWorkItem", requestId, repo: relative, title: "Relative", kind: "shell", cols: 80, rows: 24 });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: `the repository folder has to be a whole path from /, and ${JSON.stringify(relative)} is not` });
    }
    expect(existsSync(root)).toBe(false);
    expect(git(repo, "for-each-ref", "refs/heads/owlery")).toBe("");
    expect((await (await client(url)).message("ready")).repositories).toEqual([]);
    c.send({ type: "createWorkItem", requestId: 5, repo, title: "After", kind: "shell", cols: 80, rows: 24 });
    await c.message("workItemCreated", (m) => m.requestId === 5);
  });

  it("lists after a restart the work items made before it, in a file the user alone can read", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const first = new Daemon({ token: TOKEN, paneKinds: PANE_KINDS, roleAdapter: fakeAdapter(), commandFor: printsItsFolder, runDir, worktreesRoot: root });
    const c = await client(`ws://127.0.0.1:${await first.listen(0)}`);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Outlives the daemon", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    git(workItem.worktree, "commit", "--quiet", "--allow-empty", "-m", "one");
    git(workItem.worktree, "commit", "--quiet", "--allow-empty", "-m", "two");
    await first.close();
    expect(statSync(join(runDir, "repositories.json")).mode & 0o777).toBe(0o600);

    const { url } = await daemon({ runDir, worktreesRoot: root });
    const ready = await (await client(url)).message("ready");
    // The daemon that starts holds no count, and reads each before it answers its first hello.
    expect(ready.workItems).toEqual([{ ...workItem, aheadOfBase: 2, newCommits: 2, commits: [expect.objectContaining({ subject: "two" }), expect.objectContaining({ subject: "one" })] }]);
    expect(ready.workItems[0]).toMatchObject({ repoName: "project", baseBranch: "main" });
    // Sessions do not outlive the daemon.
    expect(ready.sessions).toEqual([]);
  });

  it("starts a pane in the worktree of the work item the start message names", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ commandFor: printsItsFolder, worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Second pane", kind: "claude", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    const { session } = await c.message("started", (m) => m.requestId === 2);
    expect(session).toEqual({ id: session.id, kind: "shell", alive: true, workItemId: workItem.id, accountId: 0, signsIn: null, ...NO_STATE });
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(`cwd=${workItem.worktree}\r`)) ? true : undefined));
  });

  it("refuses a start that names no work item with an error, and starts nothing, a start that asks to continue among them", async () => {
    const asked: unknown[][] = [];
    const { url } = await daemon({
      commandFor: (...given) => {
        asked.push(given);
        return printsItsFolder();
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "a pane opens in a work item" });
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 2, continueLatest: true });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "a pane opens in a work item" });
    // A work item's id that is no number names none either.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: "1" });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "a pane opens in a work item" });
    expect(asked).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions).toEqual([]);
  });

  it("starts a pane on the latest conversation where the start asks it of a kind that continues: its command is the one asked to continue, in the work item's worktree, and the pane is of the kind asked and takes its agent's state", async () => {
    const { repo, root } = repository();
    const asked: unknown[][] = [];
    const { daemon: d, url } = await daemon({
      worktreesRoot: root,
      commandFor: (...given) => {
        asked.push(given);
        return printsItsFolder();
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Back to it", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session: first } = await c.message("workItemCreated");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id, continueLatest: true });
    const { session } = await c.message("started", (m) => m.requestId === 2);
    // The pane a work item is created with is asked nothing, and the continuing pane is the one asked.
    expect(asked).toEqual([
      ["shell", first.id, { continueLatest: false, folder: workItem.worktree, base: "main", checkout: workItem.repo, chosen: null, accountDir: null, configDir: null }],
      ["claude", session.id, { continueLatest: true, folder: workItem.worktree, base: "main", checkout: workItem.repo, chosen: null, accountDir: null, configDir: null }],
    ]);
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, accountId: 0, signsIn: null, ...NO_STATE });
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(`cwd=${workItem.worktree}\r`)) ? true : undefined));
    // A continued session is listed and told as any pane of its kind is.
    d.agentEvent(session.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => m.sessions.find((s) => s.id === session.id)?.state === "working");
  });

  it("asks the command of a pane to continue nothing where the start does not ask it, and names the pane's folder and the work item's base", async () => {
    const asked: unknown[][] = [];
    const { url, workItem } = await daemonWithWorkItem({
      commandFor: (...given) => {
        asked.push(given);
        return printsItsFolder();
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(asked).toEqual([["claude", session.id, { continueLatest: false, folder: workItem.worktree, base: workItem.baseBranch, checkout: workItem.repo, chosen: null, accountDir: null, configDir: null }]]);
  });

  it("answers a start that asks a kind that does not continue to continue with an error, and starts nothing", async () => {
    const asked: unknown[][] = [];
    const { url } = await daemonWithWorkItem({
      commandFor: (...given) => {
        asked.push(given);
        return printsItsFolder();
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 7, continueLatest: true, workItemId: 1 });
    expect(await c.message("error")).toEqual({ type: "error", requestId: 7, message: "a pane of kind shell continues no conversation" });
    expect(asked).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions).toEqual([]);
  });

  it("answers a start that names a work item it does not hold with an error, and starts nothing", async () => {
    const { url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 6, workItemId: 42 });
    expect(await c.message("error")).toEqual({ type: "error", requestId: 6, message: "no work item 42" });
    expect((await (await client(url)).message("ready")).sessions).toEqual([]);
  });

  it("answers a start in a work item whose folder is gone with an error, and starts nothing", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Removed by hand", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    rmSync(workItem.worktree, { recursive: true, force: true });
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    expect(await c.message("error")).toEqual({ type: "error", requestId: 2, message: `the folder of work item ${workItem.id} is gone: ${workItem.worktree}` });
    expect((await (await client(url)).message("ready")).sessions.map((s) => s.id)).toEqual([session.id]);
  });
});

describe("the setup of a new worktree", () => {
  /** The app's setup command, with `/bin/sh` in place of the person's login shell. */
  const setupCommandFor = (command: string, id: number) => ({ command: "/bin/sh", args: ["-c", command], env: { OWLERY_PANE_ID: String(id) } });

  /** A temporary repository whose `.gitignore` ignores `.env`, `.env.*` and `node_modules/`, holding the ignored `.env`, and naming the files given at the top of its main checkout. */
  function repositoryNaming(files: { include?: string; command?: string }) {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    writeFileSync(join(made.repo, ".gitignore"), ".env\n.env.*\nnode_modules/\n");
    git(made.repo, "add", ".gitignore");
    git(made.repo, "commit", "--quiet", "-m", "ignore");
    writeFileSync(join(made.repo, ".env"), "KEY=main\n");
    if (files.include !== undefined) writeFileSync(join(made.repo, ".worktreeinclude"), files.include);
    if (files.command !== undefined) writeFileSync(join(made.repo, ".worktreesetup"), files.command);
    return made;
  }

  /** A daemon and a client, and the answer to a creation of a Claude Code pane's work item in the repository, which carries `shown`, or where none is given the command `.worktreesetup` holds, as the form shows it from its plan. */
  async function createdIn(made: { repo: string; root: string }, options: Partial<DaemonOptions> = {}, shown?: string | null) {
    const { url, daemon: d } = await daemon({ worktreesRoot: made.root, setupCommandFor, now: () => 1234, ...options });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Set up", kind: "claude", cols: 80, rows: 24, setupCommand: shown === undefined ? (await readSetup(made.repo)).command : shown });
    return { url, d, c, answer: await c.message("workItemCreated", (m) => m.requestId === 1) };
  }

  /** The first inbox in which the work item's setup no longer runs. */
  const setupEnded = (c: Awaited<ReturnType<typeof client>>, paneId?: number) => c.message("inbox", (m) => [...m.workItems, ...m.archived].some((w) => w.setup !== null && w.setup.state !== "running" && (paneId === undefined || w.setup.paneId === paneId)));

  it("copies the included ignored paths and runs the command in a shell pane of the work item, started before the pane the creation names, sends the creating client its output, and records its success", async () => {
    const made = repositoryNaming({ include: ".env\n", command: "echo setting-up; echo made > made.txt" });
    const { c, answer } = await createdIn(made);
    const setup = answer.workItem.setup!;
    expect(setup).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: "echo setting-up; echo made > made.txt", paneId: answer.session.id - 1, state: "running", exitCode: null, failure: null, startedAt: 1234, endedAt: null });
    expect(Object.keys(setup).sort()).toEqual(SETUP_FIELDS);
    // The answer carries the pane the creation named.
    expect(answer.session).toMatchObject({ kind: "claude", workItemId: answer.workItem.id });
    const ended = await setupEnded(c);
    expect(ended.workItems[0]!.setup).toEqual({ ...setup, state: "succeeded", exitCode: 0, endedAt: 1234 });
    expect(ended.sessions.map(({ id, kind, workItemId }) => [id, kind, workItemId])).toEqual([[setup.paneId, "shell", answer.workItem.id], [answer.session.id, "claude", answer.workItem.id]]);
    expect(c.messages.some((m) => m.type === "output" && m.id === setup.paneId && m.data.includes("setting-up"))).toBe(true);
    expect(readFileSync(join(answer.workItem.worktree, "made.txt"), "utf8")).toBe("made\n");
    expect(readFileSync(join(answer.workItem.worktree, ".env"), "utf8")).toBe("KEY=main\n");
  });

  it("records a command that exits with another code than 0 as failed, and leaves the work item listed, the pane the creation named alive, and a new pane able to start", async () => {
    const { c, answer } = await createdIn(repositoryNaming({ command: "exit 3" }));
    const ended = await setupEnded(c);
    expect(ended.workItems.map((w) => w.id)).toEqual([answer.workItem.id]);
    expect(ended.workItems[0]!.setup).toMatchObject({ copied: [], state: "failed", exitCode: 3, failure: null });
    expect(ended.sessions.find((s) => s.id === answer.session.id)?.alive).toBe(true);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: answer.workItem.id });
    expect((await c.message("started", (m) => m.requestId === 2)).session).toMatchObject({ alive: true, workItemId: answer.workItem.id });
  });

  it("records a command whose process a signal ended as failed, with the signal, though its exit code reads 0", async () => {
    const { c } = await createdIn(repositoryNaming({ command: "kill -TERM $$" }));
    const ended = await setupEnded(c);
    expect(ended.workItems[0]!.setup).toMatchObject({ state: "failed", exitCode: 0, failure: "The setup command was ended by SIGTERM." });
  });

  it("runs the command though an included path failed to copy, and records the setup as failed with the path and why", async () => {
    const made = repositoryNaming({ include: ".env\n.env.secret\n", command: "echo ran > ran.txt" });
    writeFileSync(join(made.repo, ".env.secret"), "SECRET=1\n");
    chmodSync(join(made.repo, ".env.secret"), 0o000);
    cleanups.push(() => chmodSync(join(made.repo, ".env.secret"), 0o600));
    const { c, answer } = await createdIn(made);
    const ended = await setupEnded(c);
    expect(ended.workItems[0]!.setup).toMatchObject({ copied: [".env"], copiedCount: 1, failedCopies: [{ path: ".env.secret", why: expect.stringContaining("EACCES") }], state: "failed", exitCode: 0, failure: null });
    expect(readFileSync(join(answer.workItem.worktree, "ran.txt"), "utf8")).toBe("ran\n");
  });

  it("gives a work item in a repository that names neither file no setup, the one pane the creation named, and a worktree that holds no ignored file", async () => {
    const made = repositoryNaming({});
    const { url, answer } = await createdIn(made);
    expect(answer.workItem.setup).toBeNull();
    const ready = await (await client(url)).message("ready");
    expect(ready.sessions.map((s) => s.id)).toEqual([answer.session.id]);
    expect((await readLoss(made.repo, answer.workItem.branch, answer.workItem.worktree)).ignored).toEqual([]);
  });

  it("runs at a creation no command but the one the creation carries: where .worktreesetup changed after the plan, or the creation carries none, it copies, starts no setup pane and says why", async () => {
    const changed = ".worktreesetup changed after the setup was shown, so no command ran.";
    const made = repositoryNaming({ include: ".env\n", command: "echo ran > ran.txt" });
    const { url, c, answer } = await createdIn(made, {}, "pnpm install\n");
    expect(answer.workItem.setup).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: "echo ran > ran.txt", paneId: null, state: "failed", exitCode: null, failure: changed, startedAt: 1234, endedAt: 1234 });
    // A client that carries no command showed none.
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Unshown", kind: "shell", cols: 80, rows: 24 });
    const second = await c.message("workItemCreated", (m) => m.requestId === 2);
    expect(second.workItem.setup).toMatchObject({ command: "echo ran > ran.txt", paneId: null, state: "failed", failure: changed });
    expect((await (await client(url)).message("ready")).sessions.map((s) => s.id)).toEqual([answer.session.id, second.session.id]);
  });

  it("records a setup whose pane the person closed, and one whose work item was archived, as failed: its pane ended before its command did", async () => {
    const made = repositoryNaming({ command: "sleep 30" });
    const { c, answer } = await createdIn(made);
    const closed = answer.workItem.setup!.paneId!;
    c.send({ type: "close", id: closed });
    const afterClose = await setupEnded(c, closed);
    expect(afterClose.workItems[0]!.setup).toMatchObject({ paneId: closed, state: "failed", failure: "The setup pane ended before its command did." });
    expect(afterClose.sessions.map((s) => s.id)).toEqual([answer.session.id]);
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Archived", kind: "shell", cols: 80, rows: 24, setupCommand: "sleep 30" });
    const second = await c.message("workItemCreated", (m) => m.requestId === 2);
    const archived = second.workItem.setup!.paneId!;
    c.send({ type: "archiveWorkItem", requestId: 3, id: second.workItem.id, running: { panes: [archived, second.session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 3);
    const after = await c.message("inbox", (m) => m.archived.some((w) => w.id === second.workItem.id));
    expect(after.archived[0]!.setup).toMatchObject({ paneId: archived, state: "failed", failure: "The setup pane ended before its command did." });
  });

  it("keeps a setup running while its command runs, though another pane of the work item exits", async () => {
    const { c, answer } = await createdIn(repositoryNaming({ command: "sleep 30" }), { commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 4"], env: {} }) });
    const exited = await c.message("inbox", (m) => m.sessions.some((s) => s.id === answer.session.id && !s.alive));
    expect(exited.workItems[0]!.setup).toMatchObject({ paneId: answer.workItem.setup!.paneId, state: "running", exitCode: null });
  });

  it("leaves a setup that runs as the daemon stops for the next daemon to read as failed, since the daemon stopped before it ended, and naming no pane", async () => {
    const made = repositoryNaming({ command: "sleep 30" });
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const { d, answer } = await createdIn(made, { runDir });
    await d.close();
    // The killed pane's exit has had time to arrive.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { url } = await daemon({ runDir, worktreesRoot: made.root, setupCommandFor });
    const ready = await (await client(url)).message("ready");
    expect(ready.workItems[0]!.setup).toEqual({ ...answer.workItem.setup, paneId: null, state: "failed", failure: "The daemon stopped before the setup command ended." });
  });

  it("names after a restart no pane of the setup, so the pane the next daemon gives the same id is no setup pane, and a run again leaves it listed", async () => {
    const made = repositoryNaming({ command: "true" });
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const { d, c, answer } = await createdIn(made, { runDir });
    const old = answer.workItem.setup!.paneId!;
    await setupEnded(c);
    await d.close();
    // The next daemon counts its pane ids from 1 again, and its panes exit at once.
    const { url } = await daemon({ runDir, worktreesRoot: made.root, setupCommandFor, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const next = await client(url);
    expect((await next.message("ready")).workItems[0]!.setup).toMatchObject({ paneId: null, state: "succeeded" });
    next.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: answer.workItem.id });
    const pane = (await next.message("started", (m) => m.requestId === 2)).session.id;
    expect(pane).toBe(old);
    await next.message("inbox", (m) => m.sessions.some((s) => s.id === pane && !s.alive));
    next.send({ type: "runSetup", requestId: 3, workItemId: answer.workItem.id, cols: 80, rows: 24, setupCommand: "true" });
    const started = await next.message("started", (m) => m.requestId === 3);
    const ended = await setupEnded(next, started.session.id);
    expect(ended.sessions.map((s) => s.id)).toEqual([pane, started.session.id]);
  });

  it("runs the setup again at a person's request: copies what is missing, takes the earlier setup pane off the lists, runs only the command the press carries, answers with the new pane, and records the new setup in place of the old", async () => {
    const made = repositoryNaming({ include: ".env\n", command: "test -e fixed" });
    const { c, answer } = await createdIn(made);
    const first = answer.workItem.setup!.paneId!;
    expect((await setupEnded(c, first)).workItems[0]!.setup).toMatchObject({ state: "failed", exitCode: 1 });
    writeFileSync(join(made.repo, ".worktreesetup"), "touch fixed");
    // The press carries the command the view showed, which the file no longer holds: the earlier pane leaves the lists, and no command runs.
    c.send({ type: "runSetup", requestId: 2, workItemId: answer.workItem.id, cols: 80, rows: 24, setupCommand: "test -e fixed" });
    await c.message("done", (m) => m.requestId === 2);
    const refused = await c.message("inbox", (m) => m.workItems[0]?.setup?.command === "touch fixed");
    expect(refused.workItems[0]!.setup).toEqual({ copied: [], copiedCount: 0, failedCopies: [], command: "touch fixed", paneId: null, state: "failed", exitCode: null, failure: ".worktreesetup changed after the setup was shown, so no command ran.", startedAt: 1234, endedAt: 1234 });
    expect(refused.sessions.map((s) => s.id)).toEqual([answer.session.id]);
    expect(existsSync(join(answer.workItem.worktree, "fixed"))).toBe(false);
    // The next press carries the command the view shows now.
    rmSync(join(answer.workItem.worktree, ".env"));
    c.send({ type: "runSetup", requestId: 3, workItemId: answer.workItem.id, cols: 80, rows: 24, setupCommand: "touch fixed" });
    const started = await c.message("started", (m) => m.requestId === 3);
    expect(started.session).toMatchObject({ kind: "shell", alive: true, workItemId: answer.workItem.id });
    const ended = await setupEnded(c, started.session.id);
    expect(ended.workItems[0]!.setup).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: "touch fixed", paneId: started.session.id, state: "succeeded", exitCode: 0, failure: null, startedAt: 1234, endedAt: 1234 });
    expect(ended.sessions.map((s) => s.id)).toEqual([answer.session.id, started.session.id]);
    expect(readFileSync(join(answer.workItem.worktree, ".env"), "utf8")).toBe("KEY=main\n");
    // Where only .worktreeinclude stands and the press shows no command, the setup ends by the copy and the answer is `done`.
    rmSync(join(made.repo, ".worktreesetup"));
    c.send({ type: "runSetup", requestId: 4, workItemId: answer.workItem.id, cols: 80, rows: 24, setupCommand: null });
    await c.message("done", (m) => m.requestId === 4);
    const copied = await c.message("inbox", (m) => m.workItems[0]?.setup?.command === null);
    expect(copied.workItems[0]!.setup).toEqual({ copied: [], copiedCount: 0, failedCopies: [], command: null, paneId: null, state: "succeeded", exitCode: null, failure: null, startedAt: 1234, endedAt: 1234 });
    expect(copied.sessions.map((s) => s.id)).toEqual([answer.session.id]);
  });

  it("refuses to run the setup again while its command runs, for a work item it does not list, in a repository that names neither file now, and in an archived work item, and changes nothing", async () => {
    const made = repositoryNaming({ command: "sleep 30" });
    const { url, c, answer } = await createdIn(made);
    const id = answer.workItem.id;
    const held = async () => {
      const ready = await (await client(url)).message("ready");
      return [ready.sessions, ready.workItems, ready.archived];
    };
    const refused = async (requestId: number, workItemId: number) => {
      const before = await held();
      c.send({ type: "runSetup", requestId, workItemId, cols: 80, rows: 24 });
      const { message } = await c.message("error", (m) => m.requestId === requestId);
      expect(await held()).toEqual(before);
      return message;
    };
    expect(await refused(2, id)).toBe(`The setup of work item ${id} is still running.`);
    expect(await refused(3, 99)).toBe("no work item 99");
    c.send({ type: "close", id: answer.workItem.setup!.paneId! });
    await setupEnded(c);
    rmSync(join(made.repo, ".worktreesetup"));
    expect(await refused(4, id)).toBe(`${made.repo} names no setup: it holds neither .worktreeinclude nor .worktreesetup.`);
    writeFileSync(join(made.repo, ".worktreesetup"), "true");
    c.send({ type: "archiveWorkItem", requestId: 5, id, running: { panes: [answer.session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 5);
    expect(await refused(6, id)).toBe(`work item ${id} is archived, restore it first`);
  });

  it("records a setup whose pane could not start as failed, and says why", async () => {
    const { url, answer } = await createdIn(repositoryNaming({ command: "true" }), {
      setupCommandFor: () => {
        throw new Error("no shell here");
      },
    });
    expect(answer.workItem.setup).toMatchObject({ command: "true", paneId: null, state: "failed", exitCode: null, failure: "The setup pane could not start: no shell here", endedAt: 1234 });
    expect((await (await client(url)).message("ready")).sessions.map((s) => s.id)).toEqual([answer.session.id]);
  });

  it("starts no setup pane where an archive of the work item began while the setup ran again copied, and says so", async () => {
    const made = repositoryNaming({ include: ".env\n", command: "true" });
    const { url, c, answer } = await createdIn(made);
    await setupEnded(c);
    const held = heldGit(made.base, '[ "$1" = check-ignore ]');
    c.send({ type: "runSetup", requestId: 2, workItemId: answer.workItem.id, cols: 80, rows: 24 });
    await c.until(() => (held.waiting() ? true : undefined));
    c.send({ type: "archiveWorkItem", requestId: 3, id: answer.workItem.id, running: { panes: [answer.session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 3);
    held.release();
    expect((await c.message("error", (m) => m.requestId === 2)).message).toBe(`work item ${answer.workItem.id} is archived, restore it first`);
    const ready = await (await client(url)).message("ready");
    expect(ready.sessions.filter((s) => s.alive)).toEqual([]);
    expect(ready.archived[0]!.setup).toEqual(answer.workItem.setup && { ...answer.workItem.setup, state: "succeeded", exitCode: 0, endedAt: 1234 });
  });

  it("names in a plan the command .worktreesetup holds, whole, and whether .worktreeinclude stands", async () => {
    const made = repositoryNaming({ include: ".env\n", command: "pnpm install\n" });
    const { url } = await daemon({ worktreesRoot: made.root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "planWorkItem", requestId: 1, repo: made.repo, title: "Planned" });
    expect(await c.message("workItemPlan", (m) => m.requestId === 1)).toMatchObject({ branch: "owlery/planned", setupCommand: "pnpm install\n", includes: true });
    rmSync(join(made.repo, ".worktreeinclude"));
    c.send({ type: "planWorkItem", requestId: 2, repo: made.repo, title: "Planned" });
    expect(await c.message("workItemPlan", (m) => m.requestId === 2)).toMatchObject({ setupCommand: "pnpm install\n", includes: false });
  });
});

describe("the fetch of a base", () => {
  /** Waits until no process of these ids runs, and says whether that came within two seconds. */
  async function ended(pids: number[]): Promise<boolean> {
    const end = Date.now() + 2000;
    while (pids.some(runs)) {
      if (Date.now() > end) return false;
      await new Promise((r) => setTimeout(r, 20));
    }
    return true;
  }

  it("answers a fetch of a remote's branch with the remote's commit, a local base with no fetch, and a folder or a base that names none with an error", async () => {
    const { base, origin, repo, root } = clone();
    const local = git(repo, "rev-parse", "refs/heads/main").trim();
    const moved = commitFile(origin, "moved.txt");
    const folder = join(base, "plain");
    mkdirSync(folder);
    standingIn(repo);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "fetchBase", requestId: 1, repo, base: "origin/main" });
    expect(await c.message("baseFetched", (m) => m.requestId === 1)).toEqual({ type: "baseFetched", requestId: 1, base: "origin/main", commit: moved, fetch: "fetched", failure: null, since: null });
    expect(git(repo, "rev-parse", "refs/remotes/origin/main").trim()).toBe(moved);
    c.send({ type: "fetchBase", requestId: 2, repo, base: "main" });
    expect(await c.message("baseFetched", (m) => m.requestId === 2)).toEqual({ type: "baseFetched", requestId: 2, base: "main", commit: local, fetch: "none", failure: null, since: null });
    const refused = async (requestId: number, fields: object) => {
      c.send({ type: "fetchBase", requestId, ...fields });
      return await c.message("error", (m) => m.requestId === requestId);
    };
    expect(await refused(3, { repo: folder, base: "origin/main" })).toEqual({ type: "error", requestId: 3, message: `${folder} is not inside a git repository` });
    expect(await refused(4, { repo, base: "origin/never" })).toEqual({ type: "error", requestId: 4, message: `${repo} has no branch origin/never to start a work item from` });
    expect((await refused(5, { repo, base: 7 })).message).toBe("a fetch names a branch, and 7 is none");
    // A relative folder would have git answer for the folder the daemon runs in, which is inside a repository here.
    expect((await refused(6, { repo: "src", base: "origin/main" })).message).toBe('the repository folder has to be a whole path from /, and "src" is not');
    expect(c.messages.filter((m) => m.type === "baseFetched")).toHaveLength(2);
  });

  it("cuts a creation soon after a fetch where that fetch left the branch, and fetches again for one made later", async () => {
    const { origin, repo, root } = clone();
    let clock = 1000;
    const { url } = await daemon({ worktreesRoot: root, now: () => clock, baseFreshMs: 500 });
    const c = await client(url);
    await c.message("ready");
    const said = commitFile(origin, "said.txt");
    c.send({ type: "fetchBase", requestId: 1, repo, base: "origin/main" });
    expect((await c.message("baseFetched")).commit).toBe(said);
    const later = commitFile(origin, "later.txt");
    clock += 499;
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Soon", base: "origin/main", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated", (m) => m.requestId === 2)).workItem.baseCommit).toBe(said);
    clock += 1;
    c.send({ type: "createWorkItem", requestId: 3, repo, title: "Later", base: "origin/main", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated", (m) => m.requestId === 3)).workItem.baseCommit).toBe(later);
    // A client's own request asks the remote again, however lately a fetch ended.
    const again = commitFile(origin, "again.txt");
    c.send({ type: "fetchBase", requestId: 4, repo, base: "origin/main" });
    expect((await c.message("baseFetched", (m) => m.requestId === 4)).commit).toBe(again);
  });

  it("has a creation join the fetch of its base that is under way: one fetch runs, and the work item is made after its answer", async () => {
    const made = clone();
    const held = git(made.repo, "rev-parse", "refs/remotes/origin/main").trim();
    const standIn = unansweringOrigin(made);
    cleanups.push(standIn.stop);
    const { url } = await daemon({ worktreesRoot: made.root, baseFetchMs: 2000 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "fetchBase", requestId: 1, repo: made.repo, base: "origin/main" });
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Joined", base: "origin/main", kind: "shell", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated", (m) => m.requestId === 2);
    expect(created.workItem.baseCommit).toBe(held);
    const order = c.messages.filter((m) => m.type === "baseFetched" || m.type === "workItemCreated").map((m) => m.type);
    expect(order).toEqual(["baseFetched", "workItemCreated"]);
    expect(c.messages.find((m) => m.type === "baseFetched")).toMatchObject({ requestId: 1, commit: held, fetch: "kept", failure: "origin did not answer in 2 seconds" });
    expect(standIn.started()).toHaveLength(1);
    expect(await ended(standIn.started())).toBe(true);
  });

  it("leaves no fetch under way once the daemon has closed", async () => {
    const made = clone();
    const standIn = unansweringOrigin(made);
    cleanups.push(standIn.stop);
    const { daemon: d, url } = await daemon({ worktreesRoot: made.root, baseFetchMs: 60_000 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "fetchBase", requestId: 1, repo: made.repo, base: "origin/main" });
    await c.until(() => (standIn.started().length === 1 ? true : undefined));
    expect(standIn.started().every(runs)).toBe(true);
    await d.close();
    expect(await ended(standIn.started())).toBe(true);
  });

  it("asks no remote for a plan", async () => {
    const { origin, repo, root } = clone();
    commitFile(origin, "moved.txt");
    const before = git(repo, "for-each-ref", "refs/remotes");
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "planWorkItem", requestId: 1, repo, title: "Planned" });
    expect((await c.message("workItemPlan")).remoteBases).toEqual(["origin/main"]);
    expect(git(repo, "for-each-ref", "refs/remotes")).toBe(before);
  });
});

describe("repositories", () => {
  function repository(name?: string) {
    const made = temporaryRepository(name);
    cleanups.push(made.remove);
    return made;
  }

  /** A run folder whose store holds what is given, made before the daemon that reads it. */
  function runFolder(base: string, repositories: object[]): string {
    const runDir = join(base, "run");
    mkdirSync(runDir);
    writeFileSync(join(runDir, "repositories.json"), JSON.stringify(repositories));
    return runDir;
  }

  /** A work item as the store keeps one that git is never asked about: it has no base commit. */
  const stored = (id: number, fields: object = {}) => ({ id, title: `Work item ${id}`, branch: `owlery/work-item-${id}`, worktree: `/w/project/work-item-${id}`, createdAt: id, baseCommit: null, baseBranch: null, ...UNSET, ...fields });
  const storedRepository = (id: number, folder: string, fields: object = {}) => ({ id, folder, name: null, icon: null, defaultBase: null, hidden: false, addedAt: 1, groups: [], workItems: [], ...fields });

  /** Sends a start the daemon refuses, and waits for the refusal: every message the daemon sent for what was asked before has then arrived. */
  let refused = 700;
  async function settled(c: Awaited<ReturnType<typeof client>>): Promise<void> {
    const requestId = refused++;
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId, workItemId: 999 });
    await c.message("error", (m) => m.requestId === requestId);
  }

  it("carries in `ready` and in an `inbox` the repository of a work item, which the work item names by its id", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    const ready = await c.message("ready");
    expect([ready.repositories, ready.workItems, ready.archived]).toEqual([[], [], []]);
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "In a repository", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    const kept = { id: 1, folder: repo, name: "project", ...PLAIN };
    const inbox = await c.message("inbox");
    expect(inbox.repositories).toEqual([kept]);
    expect(inbox.workItems).toEqual([workItem]);
    expect(inbox.archived).toEqual([]);
    expect(workItem).toMatchObject({ repoId: 1, repo, repoName: "project", ...UNSET });
    const later = await (await client(url)).message("ready");
    expect(later.repositories).toEqual([kept]);
    expect(later.workItems).toEqual([workItem]);
    expect(later.archived).toEqual([]);
  });

  it("lists an archived work item in `archived` and not in `workItems`, each under its repository's id, folder and name, the name a person gave where one is set", async () => {
    const { base } = repository();
    const runDir = runFolder(base, [
      storedRepository(1, "/r/project", { name: "The project", workItems: [stored(1), stored(2, { archivedAt: 50 })] }),
      storedRepository(4, "/r/docs", { hidden: true, icon: "D", defaultBase: "origin/main", groups: [{ id: 3, name: "Later" }], workItems: [stored(3, { pinned: true, muted: true, groupId: 3 })] }),
    ]);
    const { url } = await daemon({ runDir });
    const c = await client(url);
    const ready = await c.message("ready");
    expect(ready.repositories).toEqual([
      { id: 1, folder: "/r/project", name: "The project", ...PLAIN, customName: "The project" },
      { id: 4, folder: "/r/docs", name: "docs", customName: null, icon: "D", defaultBase: "origin/main", hidden: true, groups: [{ id: 3, name: "Later" }], records: NO_RECORDS, chain: NO_CHAIN, accountId: null },
    ]);
    expect(ready.workItems.map((w) => [w.id, w.repoId, w.repo, w.repoName, w.pinned, w.muted, w.groupId, w.archivedAt])).toEqual([
      [1, 1, "/r/project", "The project", false, false, null, null],
      [3, 4, "/r/docs", "docs", true, true, 3, null],
    ]);
    expect(ready.archived.map((w) => [w.id, w.repoId, w.repo, w.repoName, w.archivedAt])).toEqual([[2, 1, "/r/project", "The project", 50]]);
    // The daemon reads no archived work item's branch, so one it has not read since it started carries no `seal`.
    expect(Object.keys(ready.archived[0]!).sort()).toEqual(WORK_ITEM_FIELDS.filter((key) => key !== "seal"));
    // An inbox carries the same lists: a change to a work item sends one.
    c.send({ type: "setWorkItem", requestId: 1, id: 1, pinned: true });
    const inbox = await c.message("inbox");
    expect([inbox.repositories, inbox.workItems, inbox.archived]).toEqual([ready.repositories, ready.workItems.map((w) => (w.id === 1 ? { ...w, pinned: true } : w)), ready.archived]);
    // The look holds the work items an inbox lists, so none that is archived.
    c.send({ type: "looked" });
    await settled(c);
    expect((await (await client(url)).message("ready")).lastLook?.workItems.map((w) => w.id)).toEqual([1, 3]);
  });

  it("adds the repository a folder is inside, with no work item, answers before the inbox that lists it, and changes nothing in the repository", async () => {
    const { repo, root, base } = repository();
    const inside = join(repo, "src", "deep");
    mkdirSync(inside, { recursive: true });
    const read = () => [git(repo, "status", "--porcelain=v1", "--ignored"), git(repo, "for-each-ref"), git(repo, "worktree", "list", "--porcelain"), readdirSync(repo, { recursive: true }).sort()];
    const before = read();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const { url } = await daemon({ runDir, worktreesRoot: root });
    const c = await client(url);
    const other = await client(url);
    await c.message("ready");
    await other.message("ready");
    c.send({ type: "addRepository", requestId: 5, folder: inside });
    const inbox = await c.message("inbox");
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "done", "inbox"]);
    expect(c.messages[1]).toEqual({ type: "done", requestId: 5 });
    const kept = { id: 1, folder: repo, name: "project", ...PLAIN };
    expect([inbox.repositories, inbox.workItems, inbox.archived]).toEqual([[kept], [], []]);
    // Every client is told, and the one that asked alone is answered.
    expect((await other.message("inbox")).repositories).toEqual([kept]);
    expect(other.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);
    expect(read()).toEqual(before);
    expect(existsSync(root)).toBe(false);
    // The repository outlives the daemon.
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ nextRepositoryId: 2, repositories: [{ id: 1, folder: repo, workItems: [] }] });
  });

  it("adds a repository it keeps no second time: the second add is answered, and no inbox follows it", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: repo });
    await c.message("inbox");
    c.send({ type: "addRepository", requestId: 2, folder: repo });
    expect(await c.message("done", (m) => m.requestId === 2)).toEqual({ type: "done", requestId: 2 });
    // An inbox for the second add would have arrived before the refusal of a start sent after its answer.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "done", "inbox", "done", "error"]);
    expect((await (await client(url)).message("ready")).repositories.map((r) => r.folder)).toEqual([repo]);
    // A work item made in it stands under the repository that was added, and adds no other.
    c.send({ type: "createWorkItem", requestId: 3, repo, title: "Inside", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated")).workItem.repoId).toBe(1);
    expect((await (await client(url)).message("ready")).repositories.map((r) => r.id)).toEqual([1]);
  });

  it("answers an add in a folder outside any git repository with the sentence a creation there gets, and one whose folder is no absolute folder's name with an error, and adds nothing", async () => {
    const { base, repo } = repository();
    const folder = join(base, "plain");
    mkdirSync(folder);
    standingIn(repo);
    const { url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: `${folder} is not inside a git repository` });
    // A relative folder would have git answer for the folder the daemon runs in, which is inside a repository here.
    for (const [requestId, wrong] of [[2, 7], [3, ""], [4, undefined], [5, "."], [6, "src"]] as const) {
      c.send({ type: "addRepository", requestId, folder: wrong });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a repository is added by a folder inside it" });
    }
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "error", "error", "error", "error", "error", "error"]);
    expect((await (await client(url)).message("ready")).repositories).toEqual([]);
  });

  it("shows a hidden repository again when its folder is added, and when a work item is created in it", async () => {
    const one = repository();
    const two = repository("docs");
    const runDir = runFolder(one.base, [storedRepository(1, one.repo, { hidden: true }), storedRepository(2, two.repo, { hidden: true })]);
    const { url } = await daemon({ runDir, worktreesRoot: one.root });
    const c = await client(url);
    expect((await c.message("ready")).repositories.map((r) => r.hidden)).toEqual([true, true]);
    c.send({ type: "addRepository", requestId: 1, folder: one.repo });
    expect((await c.message("inbox")).repositories.map((r) => [r.id, r.hidden])).toEqual([[1, false], [2, true]]);
    c.send({ type: "createWorkItem", requestId: 2, repo: two.repo, title: "Shown again", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect(workItem.repoId).toBe(2);
    expect((await c.message("inbox", (m) => m.workItems.length === 1)).repositories.map((r) => [r.id, r.hidden])).toEqual([[1, false], [2, false]]);
  });

  it("starts from the work items a build before the repositories listed, each under the repository of its folder", async () => {
    const made = repository();
    const { runDir, workItem } = await runFolderWithWorkItem(made, "Made before");
    const { url } = await daemon({ runDir, worktreesRoot: made.root });
    const ready = await (await client(url)).message("ready");
    expect(ready.repositories).toEqual([{ id: 1, folder: made.repo, name: "project", ...PLAIN }]);
    expect(ready.workItems).toMatchObject([{ id: workItem.id, title: "Made before", repoId: 1, repo: made.repo, newCommits: 1, ...UNSET }]);
    expect(readdirSync(runDir).sort()).toEqual(["work-items.json"]);
  });

  it("adds the repository a linked worktree belongs to, by a folder inside the worktree, once with its main checkout's folder, and puts a work item created in the worktree's folder under it", async () => {
    const { repo, root, base } = repository();
    const linked = join(base, "linked");
    git(repo, "worktree", "add", "--quiet", "-b", "side", linked);
    mkdirSync(join(linked, "src"));
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: join(linked, "src") });
    const kept = { id: 1, folder: repo, name: "project", ...PLAIN };
    expect((await c.message("inbox")).repositories).toEqual([kept]);
    // The main checkout's folder names the repository the worktree's folder named.
    c.send({ type: "addRepository", requestId: 2, folder: repo });
    await c.message("done", (m) => m.requestId === 2);
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "done", "inbox", "done", "error"]);
    c.send({ type: "planWorkItem", requestId: 3, repo: linked, title: "From the worktree" });
    expect((await c.message("workItemPlan")).worktree).toBe(join(root, "project", "from-the-worktree"));
    c.send({ type: "createWorkItem", requestId: 4, repo: linked, title: "From the worktree", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated")).workItem).toMatchObject({ repoId: 1, repo, repoName: "project", worktree: join(root, "project", "from-the-worktree") });
    expect((await (await client(url)).message("ready")).repositories).toEqual([kept]);
  });

  it("answers an add, a plan and a creation in a linked worktree of a bare repository with the sentence that it has no checkout to keep, and adds nothing", async () => {
    const { repo, root, base } = repository();
    const bare = join(base, "bare.git");
    git(base, "clone", "--quiet", "--bare", repo, bare);
    const linked = join(base, "of-bare");
    git(bare, "worktree", "add", "--quiet", "-b", "side", linked);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const message = `${linked} belongs to a bare repository, which has no checkout to keep`;
    c.send({ type: "addRepository", requestId: 1, folder: linked });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message });
    c.send({ type: "planWorkItem", requestId: 2, repo: linked, title: "Anything" });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message });
    c.send({ type: "createWorkItem", requestId: 3, repo: linked, title: "Anything", kind: "shell", cols: 80, rows: 24 });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message });
    expect((await (await client(url)).message("ready")).repositories).toEqual([]);
    expect(existsSync(root)).toBe(false);
  });

  it("removes a repository with no work item and leaves everything of it on disk, and gives its id to no repository added after, in this daemon or in one that reads the store again", async () => {
    const one = repository();
    const two = repository("docs");
    const before = onDisk(one.repo);
    const runDir = join(one.base, "run");
    mkdirSync(runDir);
    const { url } = await daemon({ runDir, worktreesRoot: one.root });
    const c = await client(url);
    const other = await client(url);
    await c.message("ready");
    await other.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: one.repo });
    expect((await c.message("inbox")).repositories.map((r) => r.id)).toEqual([1]);
    c.send({ type: "removeRepository", requestId: 2, id: 1, workItems: [], running: NONE_RUNNING });
    expect((await c.message("inbox", (m) => m.repositories.length === 0)).workItems).toEqual([]);
    // The answer stands before the inbox that carries the removal, and every client is told.
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "done", "inbox", "done", "inbox"]);
    expect(c.messages[3]).toEqual({ type: "done", requestId: 2 });
    expect((await other.message("inbox", (m) => m.repositories.length === 0)).repositories).toEqual([]);
    expect(onDisk(one.repo)).toEqual(before);
    c.send({ type: "addRepository", requestId: 3, folder: one.repo });
    expect((await c.message("inbox", (m) => m.repositories[0]?.id !== undefined && m.repositories[0].id !== 1)).repositories).toEqual([{ id: 2, folder: one.repo, name: "project", ...PLAIN }]);
    c.send({ type: "removeRepository", requestId: 4, id: 2, workItems: [], running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 4);
    // A daemon that starts on the same run folder reads the store from its file, which holds no repository.
    const later = await daemon({ runDir, worktreesRoot: one.root });
    const l = await client(later.url);
    expect((await l.message("ready")).repositories).toEqual([]);
    l.send({ type: "addRepository", requestId: 1, folder: two.repo });
    expect((await l.message("inbox")).repositories.map((r) => [r.id, r.folder])).toEqual([[3, two.repo]]);
    // A removal of a repository the daemon does not keep, and one that does not say what the person was told of, is refused.
    l.send({ type: "removeRepository", requestId: 2, id: 2, workItems: [], running: NONE_RUNNING });
    expect(await l.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "no repository 2" });
    for (const [requestId, wrong] of [[3, { workItems: undefined }], [4, { workItems: ["1"] }], [5, { running: undefined }], [6, { running: { panes: [] } }], [7, { running: { panes: ["1"], headless: [] } }]] as const) {
      l.send({ type: "removeRepository", requestId, id: 3, ...{ workItems: [], running: NONE_RUNNING }, ...wrong });
      expect(await l.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a removal names the repository's work items and its running sessions" });
    }
    expect((await (await client(later.url)).message("ready")).repositories.map((r) => r.id)).toEqual([3]);
  });

  it("gives a repository the name a person sets, without the white space at its ends, in its work items' `repoName` too, and the last part of its folder again for an empty one", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const { url } = await daemon({ runDir, worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Named", kind: "shell", cols: 80, rows: 24 });
    await c.message("inbox", (m) => m.workItems.length === 1);
    const names = (m: { repositories: { name: string; customName: string | null }[]; workItems: { repoName: string }[] }) => [m.repositories.map((r) => [r.name, r.customName]), m.workItems.map((w) => w.repoName)];
    c.send({ type: "setRepository", requestId: 2, id: 1, name: "  The project " });
    expect(names(await c.message("inbox", (m) => m.repositories[0]?.customName !== null))).toEqual([[["The project", "The project"]], ["The project"]]);
    const at = c.messages.findIndex((m) => m.type === "done" && m.requestId === 2);
    // The pane the creation opened prints meanwhile, and its output is no answer.
    const since = () => c.messages.slice(at).flatMap((m) => (m.type === "output" ? [] : [m.type]));
    expect(since()).toEqual(["done", "inbox"]);
    // The name outlives the daemon.
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ repositories: [{ id: 1, name: "The project" }] });
    // A set that changes nothing is answered, and no inbox follows it.
    c.send({ type: "setRepository", requestId: 3, id: 1, name: "The project" });
    await c.message("done", (m) => m.requestId === 3);
    await settled(c);
    expect(since()).toEqual(["done", "inbox", "done", "error"]);
    c.send({ type: "setRepository", requestId: 4, id: 1, name: "   " });
    expect(names(await c.message("inbox", (m) => m.repositories[0]?.customName === null))).toEqual([[["project", null]], ["project"]]);
    c.send({ type: "setRepository", requestId: 5, id: 1, name: "Again" });
    await c.message("inbox", (m) => m.repositories[0]?.customName === "Again");
    c.send({ type: "setRepository", requestId: 6, id: 1, name: null });
    expect(names(await c.message("inbox", (m) => m.repositories[0]?.customName === null && m.repositories[0]?.name === "project" && c.messages.some((d) => d.type === "done" && d.requestId === 6)))).toEqual([[["project", null]], ["project"]]);
    c.send({ type: "setRepository", requestId: 7, id: 9, name: "Nowhere" });
    expect(await c.message("error", (m) => m.requestId === 7)).toEqual({ type: "error", requestId: 7, message: "no repository 9" });
    for (const [requestId, wrong] of [[8, { name: 7 }], [9, { icon: 7 }], [10, { defaultBase: 7 }], [11, { hidden: "yes" }]] as const) {
      c.send({ type: "setRepository", requestId, id: 1, ...wrong });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a repository's name, its icon and its base are each a text or null, and whether it is hidden is true or false" });
    }
  });

  it("starts a repository's new work items from the base a person set for it, in a plan and in a creation without a base, and from the repository's default base where that branch is gone", async () => {
    const { repo, root } = repository();
    git(repo, "branch", "--quiet", "develop");
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: repo });
    await c.message("inbox");
    c.send({ type: "planWorkItem", requestId: 2, repo, title: "Planned" });
    expect((await c.message("workItemPlan", (m) => m.requestId === 2)).defaultBase).toBe("main");
    c.send({ type: "setRepository", requestId: 3, id: 1, defaultBase: "develop" });
    expect((await c.message("inbox", (m) => m.repositories[0]?.defaultBase === "develop")).repositories[0]).toEqual({ id: 1, folder: repo, name: "project", ...PLAIN, defaultBase: "develop" });
    c.send({ type: "planWorkItem", requestId: 4, repo, title: "Planned" });
    expect((await c.message("workItemPlan", (m) => m.requestId === 4)).defaultBase).toBe("develop");
    c.send({ type: "createWorkItem", requestId: 5, repo, title: "On develop", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated", (m) => m.requestId === 5)).workItem.baseBranch).toBe("develop");
    git(repo, "branch", "--quiet", "-D", "develop");
    c.send({ type: "planWorkItem", requestId: 6, repo, title: "Planned" });
    expect((await c.message("workItemPlan", (m) => m.requestId === 6)).defaultBase).toBe("main");
    c.send({ type: "createWorkItem", requestId: 7, repo, title: "Develop is gone", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated", (m) => m.requestId === 7)).workItem.baseBranch).toBe("main");
    // Null gives the repository its default base again.
    c.send({ type: "setRepository", requestId: 8, id: 1, defaultBase: null });
    expect((await c.message("inbox", (m) => m.repositories[0]?.defaultBase === null && c.messages.some((d) => d.type === "done" && d.requestId === 8))).repositories[0]?.defaultBase).toBeNull();
  });

  it("stores an icon of one character, an emoji of several code points among them, takes it away for an empty one, and refuses one of two characters", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: repo });
    await c.message("inbox");
    const icon = async (requestId: number, sent: string | null): Promise<string | null | undefined> => {
      c.send({ type: "setRepository", requestId, id: 1, icon: sent });
      await c.message("done", (m) => m.requestId === requestId);
      return (await (await client(url)).message("ready")).repositories[0]?.icon;
    };
    expect(await icon(2, "P")).toBe("P");
    expect(await icon(3, " 🦉 ")).toBe("🦉");
    // A family of three people is seven code points and one character.
    const family = "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}";
    expect(await icon(4, family)).toBe(family);
    for (const [requestId, two] of [[5, "ab"], [6, "🦉🦉"], [7, "a b"]] as const) {
      c.send({ type: "setRepository", requestId, id: 1, icon: two });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "An icon is one character." });
    }
    expect((await (await client(url)).message("ready")).repositories[0]?.icon).toBe(family);
    expect(await icon(8, "  ")).toBeNull();
    expect(await icon(9, "한")).toBe("한");
    expect(await icon(10, null)).toBeNull();
  });

  it("hides a repository and shows it again: it stays in `repositories`, hidden, and its work items stay in `workItems`", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Stays listed", kind: "shell", cols: 80, rows: 24 });
    await c.message("inbox", (m) => m.workItems.length === 1);
    c.send({ type: "setRepository", requestId: 2, id: 1, hidden: true });
    const hidden = await c.message("inbox", (m) => m.repositories[0]?.hidden === true);
    expect(hidden.repositories).toEqual([{ id: 1, folder: repo, name: "project", ...PLAIN, hidden: true }]);
    expect(hidden.workItems.map((w) => [w.id, w.repoId])).toEqual([[1, 1]]);
    c.send({ type: "setRepository", requestId: 3, id: 1, hidden: false });
    const shown = await c.message("inbox", (m) => m.repositories[0]?.hidden === false && c.messages.some((d) => d.type === "done" && d.requestId === 3));
    expect([shown.repositories.map((r) => r.hidden), shown.workItems.map((w) => w.id)]).toEqual([[false], [1]]);
  });

  it("removes a repository whose work item has a running pane only where the removal names the work item and the pane: it ends the pane, takes both out of the lists, leaves the folder, the branch and the repository as they were, and gives the next work item an id, a count and a pane the removed one did not bear", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const { url } = await daemon({ runDir, worktreesRoot: root, commitPollMs: 50 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Runs a pane", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    commitFile(workItem.worktree, "work.txt");
    writeFileSync(join(workItem.worktree, "untracked.txt"), "kept\n");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    const before = onDisk(repo, workItem.worktree);
    const refusals = [
      [2, { workItems: [], running: NONE_RUNNING }, "A work item was added since you looked. Read it again."],
      [3, { workItems: [workItem.id], running: NONE_RUNNING }, "A session started since you looked. Read it again."],
      [4, { workItems: [workItem.id], running: { panes: [session.id + 1], headless: [session.id] } }, "A session started since you looked. Read it again."],
    ] as const;
    for (const [requestId, told, message] of refusals) {
      c.send({ type: "removeRepository", requestId, id: 1, ...told });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message });
    }
    // The refusals ended nothing and removed nothing.
    const still = await (await client(url)).message("ready");
    expect([still.repositories.map((r) => r.id), still.workItems.map((w) => w.id), still.sessions.map((s) => [s.id, s.alive])]).toEqual([[1], [1], [[session.id, true]]]);
    const sent = Date.now();
    c.send({ type: "removeRepository", requestId: 5, id: 1, workItems: [workItem.id], running: { panes: [session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 5);
    // The answer comes when the pane's process has exited, and does not wait out the three seconds a process is given.
    expect(Date.now() - sent).toBeLessThan(2000);
    const removed = await c.message("inbox", (m) => m.repositories.length === 0);
    expect([removed.workItems, removed.archived, removed.sessions]).toEqual([[], [], []]);
    expect((await c.message("exit")).id).toBe(session.id);
    expect(onDisk(repo, workItem.worktree)).toEqual(before);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toEqual({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [] });
    // The repository is added again by a creation in it, and nothing of the removed work item is the new one's.
    c.send({ type: "createWorkItem", requestId: 6, repo, title: "Made after", kind: "shell", cols: 80, rows: 24 });
    const next = await c.message("workItemCreated", (m) => m.requestId === 6);
    expect(next.workItem).toMatchObject({ id: 2, repoId: 2, ...NOTHING_NEW });
    const after = await (await client(url)).message("ready");
    expect([after.repositories.map((r) => r.id), after.workItems.map((w) => [w.id, w.repoId, w.newCommits, w.commits]), after.sessions.map((s) => [s.id, s.workItemId])]).toEqual([[2], [[2, 2, 0, []]], [[next.session.id, 2]]]);
    expect(next.session.id).not.toBe(session.id);
  });

  it("ends a working headless session of a repository it removes, where the removal names it, and refuses one that does not", async () => {
    const { repo, root } = repository();
    let stopped = 0;
    const slow = fakeAdapter({ delayMs: 60_000 });
    const quick = fakeAdapter();
    // The prompt "Quick?" is answered at once, and any other after a minute.
    const roleAdapter: RoleAdapter = { name: slow.name, features: slow.features, notice: slow.notice, start: async (options, listener) => { const run = await (options.prompt === "Quick?" ? quick : slow).start(options, listener); return { ...run, stop: () => { stopped++; return run.stop(); } }; } };
    const { daemon: d, url } = await daemon({ worktreesRoot: root, roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("exit");
    await d.startRoleSession(workItem.id, "Quick?", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    // The pane has exited and the first headless session has finished, so the second is the one that runs, and the one a removal has to name.
    c.send({ type: "removeRepository", requestId: 3, id: 1, workItems: [workItem.id], running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "A session started since you looked. Read it again." });
    expect(stopped).toBe(0);
    c.send({ type: "removeRepository", requestId: 4, id: 1, workItems: [workItem.id], running: { panes: [], headless: [headless.id] } });
    await c.message("done", (m) => m.requestId === 4);
    expect(stopped).toBe(1);
    const after = await (await client(url)).message("ready");
    expect([after.repositories, after.workItems, after.sessions, after.headless]).toEqual([[], [], [], []]);
  });

  it("stops the run of a headless session a removal ended while its adapter was still starting, once it has started", async () => {
    const { repo, root } = repository();
    let stopped = 0;
    const inner = fakeAdapter({ delayMs: 60_000 });
    // The adapter takes a moment to start a run, as one that launches a process does.
    const roleAdapter: RoleAdapter = { name: inner.name, features: inner.features, notice: inner.notice, start: async (options, listener) => { await new Promise((r) => setTimeout(r, 300)); const run = await inner.start(options, listener); return { ...run, stop: () => { stopped++; return run.stop(); } }; } };
    const { daemon: d, url } = await daemon({ worktreesRoot: root, roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("exit");
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    c.send({ type: "removeRepository", requestId: 3, id: 1, workItems: [workItem.id], running: { panes: [], headless: [headless.id] } });
    await c.message("done", (m) => m.requestId === 3);
    // Every client was told that the session failed, and why, before it left the lists.
    expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.state === "failed" ? [[m.headless.error, m.headless.stopped]] : []))).toEqual([["ended when a removal of its repository began", "request"]]);
    expect(stopped).toBe(0);
    await c.until(() => (stopped === 1 ? true : undefined));
  });

  it("removes a repository only after a creation in it that is under way, so the work item that creation adds is one the removal has to name", async () => {
    const { repo, root, base } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: repo });
    await c.message("inbox");
    const held = heldGit(base);
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Under way", kind: "shell", cols: 80, rows: 24 });
    await c.until(() => (held.waiting() ? true : undefined));
    c.send({ type: "removeRepository", requestId: 3, id: 1, workItems: [], running: NONE_RUNNING });
    // A removal that did not wait would be answered before the refusal of a start sent after it.
    await settled(c);
    expect(c.messages.flatMap((m) => (m.type === "done" || m.type === "error" ? [m.requestId] : [])).filter((requestId) => requestId < 700)).toEqual([1]);
    held.release();
    const { workItem } = await c.message("workItemCreated");
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "A work item was added since you looked. Read it again." });
    expect((await (await client(url)).message("ready")).workItems.map((w) => [w.id, w.repoId])).toEqual([[workItem.id, 1]]);
  });

  it("refuses a removal where a pane's process has not exited within the wait, and one where a session started while it waited, and removes nothing", async () => {
    const { repo, root } = repository();
    // The pane's process ignores the signal that ends it, says so, and exits by itself after a moment.
    const deaf = (c: Awaited<ReturnType<typeof client>>, id: number) => c.until(() => (c.messages.some((m) => m.type === "output" && m.id === id && m.data.includes("deaf")) ? true : undefined));
    const { url } = await daemon({ worktreesRoot: root, endWaitMs: 200, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 0.8"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Slow to end", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    const told = { workItems: [workItem.id], running: { panes: [session.id], headless: [] } };
    await deaf(c, session.id);
    c.send({ type: "removeRepository", requestId: 2, id: 1, ...told });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "A session did not end in time, so nothing was removed. Try again." });
    const still = await (await client(url)).message("ready");
    expect([still.repositories.map((r) => r.id), still.workItems.map((w) => w.id)]).toEqual([[1], [1]]);
    await c.message("exit", (m) => m.id === session.id);
    // A pane that starts in the work item while a removal waits for another to end is one the person was not told of.
    const later = await daemon({ worktreesRoot: root, endWaitMs: 5000, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 0.6"], env: {} }) });
    const l = await client(later.url);
    await l.message("ready");
    l.send({ type: "createWorkItem", requestId: 1, repo, title: "Gains a pane", kind: "shell", cols: 80, rows: 24 });
    const made = await l.message("workItemCreated");
    await deaf(l, made.session.id);
    l.send({ type: "removeRepository", requestId: 2, id: 1, workItems: [made.workItem.id], running: { panes: [made.session.id], headless: [] } });
    // The start arrives once the removal has read the sessions and waits: two messages sent together are read in one turn, the start before the removal's first read.
    await new Promise((r) => setTimeout(r, 150));
    expect(l.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 2)).toBe(false);
    l.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: made.workItem.id });
    await l.message("started", (m) => m.requestId === 3);
    expect(await l.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "A session started since you looked. Read it again." });
    expect((await (await client(later.url)).message("ready")).repositories.map((r) => r.id)).toEqual([1]);
    // Two daemons, and two processes that each outlive the signal for a moment.
  }, 15_000);

  it("removes a repository with its work items deleted from disk, one after another: without the force it deletes the one that loses nothing, stops at the one that holds an untracked file, whose pane it leaves running, and keeps the repository; with the force both worktrees and both branches are gone, the repository leaves the lists, and its folder stands", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const { url } = await daemon({ runDir, worktreesRoot: root, commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    // Each work item is given its branch by a rename, so the removal has a branch to delete.
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Nothing to lose", kind: "shell", cols: 80, rows: 24 });
    const createdClean = await c.message("workItemCreated", (m) => m.requestId === 1);
    const clean = { ...createdClean, workItem: await branchedByRename(c, createdClean.workItem, 21) };
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Holds a file", kind: "shell", cols: 80, rows: 24 });
    const createdHeld = await c.message("workItemCreated", (m) => m.requestId === 2);
    const held = { ...createdHeld, workItem: await branchedByRename(c, createdHeld.workItem, 22) };
    writeFileSync(join(held.workItem.worktree, "untracked.txt"), "kept\n");
    const stamps = { [clean.workItem.id]: (await readLoss(repo, clean.workItem.branch, clean.workItem.worktree)).stamp, [held.workItem.id]: (await readLoss(repo, held.workItem.branch, held.workItem.worktree)).stamp };
    const told = { workItems: [clean.workItem.id, held.workItem.id], running: { panes: [clean.session.id, held.session.id], headless: [] } };
    // A removal that deletes names the stamp of every work item's loss, and one that does not ends and removes nothing.
    const refusals = [
      [3, { stamps: { [clean.workItem.id]: stamps[clean.workItem.id] }, force: false }],
      [4, { stamps, force: "yes" }],
      [5, { stamps: [], force: false }],
      [6, true],
      [10, { stamps: null, force: false }],
      [11, { stamps: "stamps", force: false }],
    ] as const;
    for (const [requestId, chosen] of refusals) {
      c.send({ type: "removeRepository", requestId, id: 1, ...told, delete: chosen });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a removal that deletes names the stamp of each work item's loss, and whether it is forced" });
    }
    // A removal that deletes ends no session where one runs that it does not name, the first work item's neither.
    c.send({ type: "removeRepository", requestId: 9, id: 1, workItems: told.workItems, running: { panes: [clean.session.id], headless: [] }, delete: { stamps, force: true } });
    expect(await c.message("error", (m) => m.requestId === 9)).toEqual({ type: "error", requestId: 9, message: "A session started since you looked. Read it again." });
    const before = onDisk(repo, clean.workItem.worktree, held.workItem.worktree);
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.sessions.map((s) => s.alive)]).toEqual([[1, 2], [true, true]]);
    expect(onDisk(repo, clean.workItem.worktree, held.workItem.worktree)).toEqual(before);

    c.messages.length = 0;
    c.send({ type: "removeRepository", requestId: 7, id: 1, ...told, delete: { stamps, force: false } });
    expect(await c.message("error", (m) => m.requestId === 7)).toEqual({ type: "error", requestId: 7, message: "Holds a file: The work item holds work a delete would lose. Check Force delete to delete it anyway." });
    // The first work item is gone, from the lists and from disk, and the second and the repository are as they were.
    const partly = await c.message("inbox", (m) => m.workItems.length === 1);
    expect([partly.repositories.map((r) => r.id), partly.workItems.map((w) => w.id), partly.sessions.map((s) => [s.id, s.alive])]).toEqual([[1], [held.workItem.id], [[held.session.id, true]]]);
    expect([existsSync(clean.workItem.worktree), git(repo, "branch", "--list", "owlery/*").trim()]).toEqual([false, `+ ${held.workItem.branch}`]);
    expect(readFileSync(join(held.workItem.worktree, "untracked.txt"), "utf8")).toBe("kept\n");

    c.send({ type: "removeRepository", requestId: 8, id: 1, workItems: [held.workItem.id], running: { panes: [held.session.id], headless: [] }, delete: { stamps: { [held.workItem.id]: stamps[held.workItem.id] }, force: true } });
    await c.message("done", (m) => m.requestId === 8);
    const removed = await c.message("inbox", (m) => m.repositories.length === 0);
    expect([removed.workItems, removed.archived, removed.sessions]).toEqual([[], [], []]);
    expect([existsSync(held.workItem.worktree), git(repo, "branch", "--list", "owlery/*").trim(), git(repo, "worktree", "list", "--porcelain").split("\n\n").filter((block) => block.trim() !== "").length]).toEqual([false, "", 1]);
    // The repository's own folder is no worktree a delete removes.
    expect([readFileSync(join(repo, "README.md"), "utf8"), git(repo, "status", "--porcelain")]).toEqual(["a repository\n", ""]);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toEqual({ nextWorkItemId: 3, nextRepositoryId: 2, nextGroupId: 1, repositories: [] });
  });

  it("starts no pane in a work item of a repository whose removal is deleting its work items, names the work item whose delete it was refused at, and starts one again after the refusal", async () => {
    const { repo, root } = repository();
    // The pane's process ignores the signal that ends it, says so, and exits by itself after a moment.
    const { url } = await daemon({ worktreesRoot: root, endWaitMs: 400, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 1.5"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Slow to end", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes("deaf")) ? true : undefined));
    const { stamp } = await readLoss(repo, workItem.branch, workItem.worktree);
    c.send({ type: "removeRepository", requestId: 2, id: 1, workItems: [workItem.id], running: { panes: [session.id], headless: [] }, delete: { stamps: { [workItem.id]: stamp }, force: false } });
    // The start arrives once the removal's delete waits for the pane to end.
    await new Promise((r) => setTimeout(r, 150));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 2)).toBe(false);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: workItem.id });
    const answer = (requestId: number) => c.until(() => c.messages.find((m) => (m.type === "started" || m.type === "done" || m.type === "error") && m.requestId === requestId));
    expect(await answer(3)).toEqual({ type: "error", requestId: 3, message: `work item ${workItem.id} is being deleted` });
    expect(await answer(2)).toEqual({ type: "error", requestId: 2, message: "Slow to end: A session did not end in time, so nothing was deleted. Try again." });
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 4, workItemId: workItem.id });
    expect((await answer(4))?.type).toBe("started");
    expect((await (await client(url)).message("ready")).repositories.map((r) => r.id)).toEqual([1]);
  });
});

describe("the records place of a repository", () => {
  const WORKFLOW = ".github/workflows/owlery-seal.yml";
  const status = (repo: string): string => git(repo, "status", "--porcelain=v1", "--untracked-files=all");

  function repository() {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  }

  /** A daemon of version 1.2.3 that keeps one repository, number 1, and a client that was told so. Its pass over the branches comes once, at the hello, so an `inbox` a case waits for is the answer's own. */
  async function kept() {
    const made = repository();
    const { url } = await daemon({ worktreesRoot: made.root, version: "1.2.3", commitPollMs: 60_000 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    const inbox = await c.message("inbox");
    return { ...made, url, c, inbox };
  }

  it("answers planRecords with a recordsPlan that names the branch, the subject, each file with its text and a stamp, and writes nothing; a repository it does not keep is an error", async () => {
    const { repo, c, inbox } = await kept();
    expect(inbox.repositories[0]?.records).toEqual(NO_RECORDS);
    c.send({ type: "planRecords", requestId: 2, id: 1, broadGate: "pnpm test" });
    const answer = await c.message("recordsPlan");
    expect(answer).toMatchObject({ requestId: 2, id: 1, plan: { branch: "main", subject: SUBJECT, blocked: null, proposedBroadGate: null } });
    expect(answer.plan.stamp).toMatch(/^[0-9a-f]{64}$/);
    expect(answer.plan.files.map((file) => file.path)).toEqual(["seal/README.md", "seal/config.json", WORKFLOW]);
    expect(answer.plan.files[1]?.text).toContain('"Broad gate": "pnpm test"');
    // The workflow is written for the version the daemon was given.
    expect(answer.plan.files[2]?.text).toBe(workflowText("1.2.3"));
    expect(status(repo)).toBe("");
    expect(existsSync(join(repo, "seal"))).toBe(false);
    c.send({ type: "planRecords", requestId: 3, id: 9, broadGate: "pnpm test" });
    expect(await c.message("error", (m) => m.requestId === 3)).toMatchObject({ message: "no repository 9" });
    c.send({ type: "setUpRecords", requestId: 4, id: 9, broadGate: "pnpm test", stamp: answer.plan.stamp });
    expect(await c.message("error", (m) => m.requestId === 4)).toMatchObject({ message: "no repository 9" });
  });

  it("sets up at setUpRecords with the plan's stamp: one commit of the plan's files alone, answered with done before the inbox, whose repository carries the root, the workflow and the command", async () => {
    const { repo, c } = await kept();
    writeFileSync(join(repo, "other.txt"), "staged by the person\n");
    git(repo, "add", "other.txt");
    const before = git(repo, "rev-parse", "HEAD").trim();
    c.send({ type: "planRecords", requestId: 2, id: 1, broadGate: "pnpm test" });
    const { plan } = await c.message("recordsPlan");
    c.send({ type: "setUpRecords", requestId: 3, id: 1, broadGate: "pnpm test", stamp: plan.stamp });
    const inbox = await c.message("inbox", (m) => m.repositories[0]?.records.root !== null);
    expect(inbox.repositories[0]?.records).toEqual({ root: "seal", check: WORKFLOW, broadGate: "pnpm test", olderCheck: null });
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "done", "inbox", "recordsPlan", "done", "inbox"]);
    expect(c.messages[4]).toEqual({ type: "done", requestId: 3 });
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(repo, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([SUBJECT, WORKFLOW, "seal/README.md", "seal/config.json"]);
    expect(status(repo)).toBe("A  other.txt\n");
  });

  it("refuses a setup the person did not read: a commit landed since the plan, so the old stamp is answered with an error and the tree holds no file of the setup", async () => {
    const { repo, c } = await kept();
    c.send({ type: "planRecords", requestId: 2, id: 1, broadGate: "pnpm test" });
    const { plan } = await c.message("recordsPlan");
    const landed = commitFile(repo, "landed.txt");
    c.send({ type: "setUpRecords", requestId: 3, id: 1, broadGate: "pnpm test", stamp: plan.stamp });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "The repository changed since the plan was read. Read the plan again." });
    expect(git(repo, "rev-parse", "HEAD").trim()).toBe(landed);
    expect(existsSync(join(repo, "seal"))).toBe(false);
    expect(existsSync(join(repo, ".github"))).toBe(false);
    expect(status(repo)).toBe("");
    // A setup that names no stamp is refused before git is asked.
    c.send({ type: "setUpRecords", requestId: 4, id: 1, broadGate: "pnpm test" });
    expect(await c.message("error", (m) => m.requestId === 4)).toMatchObject({ message: "a setup of the records place names the broad gate command and the stamp of the plan the person read" });
  });

  it("reads what a repository holds of the records place at its addition and in the pass that reads the branches, from the working tree, and a daemon given no version refuses the plan", async () => {
    const made = repository();
    mkdirSync(join(made.repo, "seal"));
    writeFileSync(join(made.repo, "seal", "README.md"), "# What AgenticSeal maintains in seal/\n");
    const { url } = await daemon({ worktreesRoot: made.root, commitPollMs: 30 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    // Not committed: the place is read from the working tree.
    expect((await c.message("inbox")).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: null, olderCheck: null });
    writeFileSync(join(made.repo, "seal", "config.json"), JSON.stringify({ "Broad gate": "make check" }));
    expect((await c.message("inbox", (m) => m.repositories[0]?.records.broadGate !== null)).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: "make check", olderCheck: null });
    // A client that connects later is told the same in its `ready`.
    expect((await (await client(url)).message("ready")).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: "make check", olderCheck: null });
    c.send({ type: "planRecords", requestId: 2, id: 1, broadGate: "" });
    expect(await c.message("error", (m) => m.requestId === 2)).toMatchObject({ message: "This build of Owlery names no version, so it cannot write the workflow of the pull request check." });
  });

  it("reads the records place of a repository a creation adds, so the inbox that lists the repository says what it holds", async () => {
    const made = repository();
    mkdirSync(join(made.repo, "agentic-seal"));
    writeFileSync(join(made.repo, "agentic-seal", "README.md"), "# What AgenticSeal maintains in seal/\n");
    const { url } = await daemon({ worktreesRoot: made.root, commitPollMs: 60_000 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "First", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("inbox")).repositories[0]?.records).toEqual({ root: "agentic-seal", check: null, broadGate: null, olderCheck: null });
  });

  it("tells the window that a repository's check is older than the daemon: the version Owlery's workflow in the main checkout pins, read again in the pass that reads the branches, and none once it pins the daemon's version or where AgenticSeal's hygiene.yml runs the check", async () => {
    const made = repository();
    mkdirSync(join(made.repo, ".github", "workflows"), { recursive: true });
    writeFileSync(join(made.repo, WORKFLOW), workflowText("1.2.2"));
    const { url } = await daemon({ worktreesRoot: made.root, version: "1.2.3", commitPollMs: 30 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    expect((await c.message("inbox")).repositories[0]?.records).toEqual({ root: null, check: WORKFLOW, broadGate: null, olderCheck: "1.2.2" });
    writeFileSync(join(made.repo, WORKFLOW), workflowText("1.2.3"));
    expect((await c.message("inbox", (m) => m.repositories[0]?.records.olderCheck === null)).repositories[0]?.records).toEqual({ root: null, check: WORKFLOW, broadGate: null, olderCheck: null });
    rmSync(join(made.repo, WORKFLOW));
    const hygiene = join(made.repo, ".github", "workflows", "hygiene.yml");
    writeFileSync(hygiene, 'jobs:\n  hygiene:\n    steps:\n      - run: |\n          git clone --branch v1.2.2 \\\n          || git clone --branch release/v1.2.2 \\\n          python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py"\n');
    const read = await c.message("inbox", (m) => m.repositories[0]?.records.check === ".github/workflows/hygiene.yml");
    expect(read.repositories[0]?.records.olderCheck).toBeNull();
  });

  it("names, in a plan that moves the check, each work item of the repository whose records at its branch's head the daemon's readers refuse, by its id and title with the reader's sentence, and not one whose head holds no records; a plan that moves nothing names none", { timeout: 60_000 }, async () => {
    const NAME = "1795696248-refused-records";
    const { made, c, workItems } = await standing(cleanups, ["Refused work", "Plain work"], { version: "1.2.3", commitPollMs: 50 });
    const [a] = workItems as [(typeof workItems)[number]];
    commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit, seal: false });
    const record = `seal/threads/${NAME}/trail/rounds/round-2.md`;
    writeFileSync(join(a.worktree, record), roundRecord(`# Review round 2: ${NAME}`, "x"));
    git(a.worktree, "add", record);
    git(a.worktree, "commit", "--quiet", "-m", "chore: record review round 2");
    const refused = git(a.worktree, "rev-parse", "HEAD").trim();
    // The lists name a commit by its short hash.
    await c.until(() => (refused.startsWith(c.workItem(a.id)?.commits?.[0]?.hash ?? "-") ? true : undefined));
    // The repository holds no workflow yet, so the plan sets the place up and moves nothing.
    const setup = await c.asked({ type: "planRecords", requestId: 2, id: 1, broadGate: "" });
    expect(setup).toMatchObject({ type: "recordsPlan", plan: { move: null, unread: [] } });
    mkdirSync(join(made.repo, ".github", "workflows"), { recursive: true });
    writeFileSync(join(made.repo, WORKFLOW), workflowText("1.2.2"));
    git(made.repo, "add", WORKFLOW);
    git(made.repo, "commit", "--quiet", "-m", "ci: the check of 1.2.2");
    const moving = await c.asked({ type: "planRecords", requestId: 3, id: 1, broadGate: "" });
    if (moving.type !== "recordsPlan") throw new Error(`no plan: ${JSON.stringify(moving)}`);
    expect([moving.plan.move, moving.plan.blocked]).toEqual([{ from: "1.2.2", to: "1.2.3" }, null]);
    expect(moving.plan.unread).toEqual([{ id: a.id, title: "Refused work", why: expect.stringMatching(new RegExp(`^the reader refuses line 4 of ${record.replace(/\./gu, "\\.")}: `, "u")) }]);
  });
});

describe("what a person sets on a work item", () => {
  function repository() {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  }

  // A pane that prints nothing, so a client's messages are the daemon's answers and its lists alone.
  const silent = () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} });

  /** A daemon on a run folder of the repository's temporary folder, a client of it, and a work item the client created, given its branch `owlery/first-name` by a rename (`branchedByRename`). */
  async function withWorkItem(made: { repo: string; root: string; base: string }, options: Partial<DaemonOptions> = {}) {
    const title = "First name";
    const runDir = join(made.base, "run");
    mkdirSync(runDir, { recursive: true });
    const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, commandFor: silent, ...options });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 100, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 });
    const { workItem: created, session } = await c.message("workItemCreated", (m) => m.requestId === 100);
    const workItem = await branchedByRename(c, created, 101);
    c.messages.length = 0;
    return { daemon: d, c, url, runDir, workItem, session };
  }

  /** Sends a start the daemon refuses, and waits for the refusal: every message the daemon sent for what was asked before has then arrived. */
  let refused = 900;
  async function settled(c: Awaited<ReturnType<typeof client>>): Promise<void> {
    const requestId = refused++;
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId, workItemId: 999 });
    await c.message("error", (m) => m.requestId === requestId);
  }

  it("pins and mutes a work item at a `setWorkItem`, answers before the inbox that carries it, and keeps both after the daemon starts again", async () => {
    const made = repository();
    const { c, url, runDir, workItem } = await withWorkItem(made);
    const other = await client(url);
    await other.message("ready");
    c.send({ type: "setWorkItem", requestId: 1, id: workItem.id, pinned: true });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 1 });
    expect(inbox.workItems).toEqual([{ ...workItem, pinned: true }]);
    // Every client is told, and the one that asked alone is answered.
    expect((await other.message("inbox")).workItems).toEqual([{ ...workItem, pinned: true }]);
    expect(other.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);
    c.send({ type: "setWorkItem", requestId: 2, id: workItem.id, muted: true });
    expect((await c.message("inbox", (m) => m.workItems[0]?.muted === true)).workItems).toEqual([{ ...workItem, pinned: true, muted: true }]);
    c.send({ type: "setWorkItem", requestId: 3, id: workItem.id, pinned: false });
    expect((await c.message("inbox", (m) => m.workItems[0]?.pinned === false)).workItems).toEqual([{ ...workItem, muted: true }]);
    c.send({ type: "setWorkItem", requestId: 4, id: workItem.id, pinned: true });
    await c.message("done", (m) => m.requestId === 4);

    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, pinned: true, muted: true }]);
  });

  it("answers a `setWorkItem` that changes nothing, and sends no inbox for it", async () => {
    const { c, workItem } = await withWorkItem(repository());
    c.send({ type: "setWorkItem", requestId: 1, id: workItem.id, pinned: false, muted: false });
    expect(await c.message("done")).toEqual({ type: "done", requestId: 1 });
    // An inbox for it would have arrived before the refusal of a start sent after its answer.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["done", "error"]);
  });

  it("answers a `setWorkItem` that names no work item it holds, and one whose pin or mute is no boolean, with an error, and sets nothing", async () => {
    const { c, url, workItem } = await withWorkItem(repository());
    c.send({ type: "setWorkItem", requestId: 1, id: 9, pinned: true });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "no work item 9" });
    for (const [requestId, fields] of [[2, { pinned: "yes" }], [3, { muted: 1 }], [4, { pinned: true, muted: null }]] as const) {
      c.send({ type: "setWorkItem", requestId, id: workItem.id, ...fields });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a work item's pin and its mute are each true or false" });
    }
    expect(c.messages.map((m) => m.type)).toEqual(["error", "error", "error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, pinned: false, muted: false }]);
  });

  it("adds a group to a repository at an `addGroup`, under the name without the white space at its ends and after the groups it has, answers before the inbox that carries it, and keeps it after the daemon starts again", async () => {
    const made = repository();
    const { c, url, runDir } = await withWorkItem(made);
    const other = await client(url);
    await other.message("ready");
    c.send({ type: "addGroup", requestId: 1, repoId: 1, name: "  Later " });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 1 });
    expect(inbox.repositories.map((r) => r.groups)).toEqual([[{ id: 1, name: "Later" }]]);
    // Every client is told, and the one that asked alone is answered.
    expect((await other.message("inbox")).repositories[0]?.groups).toEqual([{ id: 1, name: "Later" }]);
    expect(other.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);
    c.send({ type: "addGroup", requestId: 2, repoId: 1, name: "Drafts" });
    expect((await c.message("inbox", (m) => m.repositories[0]?.groups.length === 2)).repositories[0]?.groups).toEqual([{ id: 1, name: "Later" }, { id: 2, name: "Drafts" }]);

    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).repositories[0]?.groups).toEqual([{ id: 1, name: "Later" }, { id: 2, name: "Drafts" }]);
  });

  it("answers an `addGroup` with an empty name, with a name that is no text, and one that names no repository it holds, with an error, and adds no group", async () => {
    const { c, url } = await withWorkItem(repository());
    for (const [requestId, name] of [[1, ""], [2, "   "]] as const) {
      c.send({ type: "addGroup", requestId, repoId: 1, name });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "Give the group a name." });
    }
    c.send({ type: "addGroup", requestId: 3, repoId: 1, name: 7 });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "a group is added to a repository under a name" });
    c.send({ type: "addGroup", requestId: 4, repoId: 9, name: "Later" });
    expect(await c.message("error", (m) => m.requestId === 4)).toEqual({ type: "error", requestId: 4, message: "no repository 9" });
    expect(c.messages.map((m) => m.type)).toEqual(["error", "error", "error", "error"]);
    expect((await (await client(url)).message("ready")).repositories.map((r) => r.groups)).toEqual([[]]);
  });

  it("moves a work item into a group of its repository at a `setWorkItem` with the group's id, and out of it with null, answers before the inbox that carries each, leaves the group at a set that names none, and keeps it after the daemon starts again", async () => {
    const made = repository();
    const { c, runDir, workItem } = await withWorkItem(made);
    c.send({ type: "addGroup", requestId: 1, repoId: workItem.repoId, name: "Later" });
    await c.message("inbox", (m) => m.repositories[0]?.groups.length === 1);
    c.messages.length = 0;
    c.send({ type: "setWorkItem", requestId: 2, id: workItem.id, groupId: 1 });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(inbox.workItems).toEqual([{ ...workItem, groupId: 1 }]);
    // A pin leaves the group, and the group leaves the pin.
    c.send({ type: "setWorkItem", requestId: 3, id: workItem.id, pinned: true });
    expect((await c.message("inbox", (m) => m.workItems[0]?.pinned === true)).workItems).toEqual([{ ...workItem, groupId: 1, pinned: true }]);
    c.send({ type: "setWorkItem", requestId: 4, id: workItem.id, groupId: null });
    expect((await c.message("inbox", (m) => m.workItems[0]?.groupId === null)).workItems).toEqual([{ ...workItem, pinned: true }]);
    c.send({ type: "setWorkItem", requestId: 5, id: workItem.id, groupId: 1 });
    await c.message("done", (m) => m.requestId === 5);

    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, pinned: true, groupId: 1 }]);
  });

  it("answers a `setWorkItem` whose group is a group of another repository, one no repository holds, or no id, with an error, and sets nothing of that message, its pin neither", async () => {
    const made = repository();
    const elsewhere = repository();
    const { c, url, workItem } = await withWorkItem(made);
    c.send({ type: "addRepository", requestId: 1, folder: elsewhere.repo });
    await c.message("done", (m) => m.requestId === 1);
    c.send({ type: "addGroup", requestId: 2, repoId: 2, name: "Theirs" });
    await c.message("done", (m) => m.requestId === 2);
    await c.message("inbox", (m) => m.repositories[1]?.groups.length === 1);
    c.messages.length = 0;
    for (const [requestId, groupId] of [[3, 1], [4, 9]] as const) {
      c.send({ type: "setWorkItem", requestId, id: workItem.id, groupId, pinned: true });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: `Group ${groupId} is no group of the work item's repository.` });
    }
    for (const [requestId, groupId] of [[5, "1"], [6, true]] as const) {
      c.send({ type: "setWorkItem", requestId, id: workItem.id, groupId, pinned: true });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a work item's group is a group's id, or null for none" });
    }
    expect(c.messages.map((m) => m.type)).toEqual(["error", "error", "error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, pinned: false, groupId: null }]);
  });

  it("renames a work item without its branch: the title is the name without the white space at its ends, and the branch and the folder are the ones they were", async () => {
    const made = repository();
    const { c, runDir, workItem } = await withWorkItem(made);
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "  Second name ", branch: false });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 1 });
    expect(inbox.workItems).toEqual([{ ...workItem, title: "Second name" }]);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("+ owlery/first-name");
    // The name outlives the daemon.
    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, title: "Second name", branch: "owlery/first-name" }]);
  });

  it("refuses an empty name, a name of white space, a name that is no string, a branch choice that is neither true nor false and a work item it does not hold, and renames nothing", async () => {
    const made = repository();
    const { c, url, workItem } = await withWorkItem(made);
    for (const [requestId, title] of [[1, ""], [2, "  \t "]] as const) {
      c.send({ type: "renameWorkItem", requestId, id: workItem.id, title, branch: true });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "Give the work item a name." });
    }
    c.send({ type: "renameWorkItem", requestId: 3, id: workItem.id, title: 7, branch: false });
    expect((await c.message("error", (m) => m.requestId === 3)).message).toBe("a rename needs the work item's new name, and whether its branch is renamed too");
    c.send({ type: "renameWorkItem", requestId: 4, id: workItem.id, title: "Second name" });
    expect((await c.message("error", (m) => m.requestId === 4)).message).toBe("a rename needs the work item's new name, and whether its branch is renamed too");
    c.send({ type: "renameWorkItem", requestId: 5, id: 9, title: "Second name", branch: false });
    expect((await c.message("error", (m) => m.requestId === 5)).message).toBe("no work item 9");
    expect(c.messages.map((m) => m.type)).toEqual(["error", "error", "error", "error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, title: "First name", branch: "owlery/first-name" }]);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("+ owlery/first-name");
  });

  it("renames the branch too where the rename says so, on a branch with no upstream that no remote holds: the worktree's HEAD names owlery/<slug>, the folder is the one it was, and the branch's commits are still listed", async () => {
    const made = clone();
    const { c, runDir, workItem } = await withWorkItem(made, { commitPollMs: 50 });
    const commit = commitFile(workItem.worktree, "work.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    c.messages.length = 0;
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "Second name", branch: true });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(inbox.workItems).toMatchObject([{ id: workItem.id, title: "Second name", branch: "owlery/second-name", worktree: workItem.worktree, newCommits: 1, commits: [{ subject: "add work.txt" }] }]);
    expect(git(workItem.worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/second-name");
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/second-name").trim()).toBe(commit);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("+ owlery/second-name");
    expect(existsSync(join(workItem.worktree, "work.txt"))).toBe(true);
    // A later read counts the commits of the branch under its new name.
    commitFile(workItem.worktree, "more.txt");
    expect((await c.message("inbox", (m) => m.workItems[0]?.newCommits === 2)).workItems[0]?.branch).toBe("owlery/second-name");
    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ title: "Second name", branch: "owlery/second-name", newCommits: 2 }]);
  });

  it("answers a rename of the branch with the reason, on a branch with an upstream and on one a remote holds under its name with no upstream, and the title and the branch are the ones they were", async () => {
    const made = clone();
    const { c, url, workItem } = await withWorkItem(made);
    git(made.repo, "push", "--quiet", "origin", branchOf(workItem));
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "Second name", branch: true });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "The remote origin holds a branch owlery/first-name, so the branch keeps its name." });
    git(made.repo, "branch", "--quiet", `--set-upstream-to=origin/${workItem.branch}`, branchOf(workItem));
    c.send({ type: "renameWorkItem", requestId: 2, id: workItem.id, title: "Second name", branch: true });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "The branch owlery/first-name has an upstream, origin/owlery/first-name, so it keeps its name." });
    expect(c.messages.map((m) => m.type)).toEqual(["error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ id: workItem.id, title: "First name", branch: "owlery/first-name" }]);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("+ owlery/first-name");
  });

  it("answers a `planRename` with the branch a rename would give, -2 where another branch bears the name, and the reason where the branch keeps its name, and renames nothing", async () => {
    const made = clone();
    const { c, url, workItem } = await withWorkItem(made);
    c.send({ type: "planRename", requestId: 1, id: workItem.id, title: "Second name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 1)).toEqual({ type: "renamePlan", requestId: 1, branch: "owlery/second-name", blocked: null });
    git(made.repo, "branch", "--quiet", "owlery/second-name");
    c.send({ type: "planRename", requestId: 2, id: workItem.id, title: "Second name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 2)).toEqual({ type: "renamePlan", requestId: 2, branch: "owlery/second-name-2", blocked: null });
    c.send({ type: "planRename", requestId: 3, id: workItem.id, title: "First name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 3)).toEqual({ type: "renamePlan", requestId: 3, branch: "owlery/first-name", blocked: "The branch is already owlery/first-name." });
    git(made.repo, "push", "--quiet", "origin", branchOf(workItem));
    c.send({ type: "planRename", requestId: 4, id: workItem.id, title: "Second name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 4)).toEqual({ type: "renamePlan", requestId: 4, branch: "owlery/second-name-2", blocked: "The remote origin holds a branch owlery/first-name, so the branch keeps its name." });
    c.send({ type: "planRename", requestId: 5, id: 9, title: "Second name" });
    expect(await c.message("error", (m) => m.requestId === 5)).toEqual({ type: "error", requestId: 5, message: "no work item 9" });
    c.send({ type: "planRename", requestId: 6, id: workItem.id, title: 7 });
    expect((await c.message("error", (m) => m.requestId === 6)).message).toBe("a rename's plan needs the work item's new name");
    expect(c.messages.map((m) => m.type)).toEqual(["renamePlan", "renamePlan", "renamePlan", "renamePlan", "error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ title: "First name", branch: "owlery/first-name" }]);
  });

  it("answers a `planRename` of a work item with no branch yet with the branch a rename makes, and the reason where its worktree's HEAD names a branch; a rename of its name alone makes none, and a rename of its branch makes it at the worktree's HEAD, puts the worktree on it, and keeps that Owlery made it", async () => {
    // A read a minute away, so the branch the worktree's HEAD names meanwhile is not taken up before the rename.
    const { c, made, runDir, worktree, lone, branches } = await daemonWithoutBranch({ commitPollMs: 60_000 });
    const before = branches();
    c.send({ type: "renameWorkItem", requestId: 1, id: 1, title: "Fix the login bug", branch: false });
    await c.message("done", (m) => m.requestId === 1);
    expect((await c.message("inbox", (m) => m.workItems[0]?.title === "Fix the login bug")).workItems[0]).toMatchObject({ title: "Fix the login bug", branch: null });
    expect(branches()).toBe(before);
    c.send({ type: "planRename", requestId: 2, id: 1, title: "Fix the login bug" });
    expect(await c.message("renamePlan", (m) => m.requestId === 2)).toEqual({ type: "renamePlan", requestId: 2, branch: "owlery/fix-the-login-bug", blocked: null });
    git(worktree, "switch", "--quiet", "-c", "fix/x");
    const taken = "The worktree is on the branch fix/x, which becomes the work item's at Owlery's next read.";
    c.send({ type: "planRename", requestId: 3, id: 1, title: "Fix the login bug" });
    expect(await c.message("renamePlan", (m) => m.requestId === 3)).toEqual({ type: "renamePlan", requestId: 3, branch: "owlery/fix-the-login-bug", blocked: taken });
    c.send({ type: "renameWorkItem", requestId: 4, id: 1, title: "Fix the login bug", branch: true });
    expect((await c.message("error", (m) => m.requestId === 4)).message).toBe(taken);
    git(worktree, "switch", "--quiet", "--detach");
    git(made.repo, "branch", "--quiet", "-D", "fix/x");
    expect(branches()).toBe(before);
    c.send({ type: "renameWorkItem", requestId: 5, id: 1, title: "Fix the login bug", branch: true });
    await c.message("done", (m) => m.requestId === 5);
    expect((await c.message("inbox", (m) => m.workItems[0]?.branch !== null)).workItems[0]).toMatchObject({ title: "Fix the login bug", branch: "owlery/fix-the-login-bug", ownsBranch: true });
    expect(git(worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/fix-the-login-bug");
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/fix-the-login-bug").trim()).toBe(lone);
    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ branch: "owlery/fix-the-login-bug", ownsBranch: true }]);
  });

  it("gives a work item with no branch yet one branch where a rename makes it while a read finds a commit in its worktree: the read's turn waits behind the rename's and then finds the branch made, as Owlery's", async () => {
    const { c, made, worktree, branches } = await daemonWithoutBranch({ commitPollMs: 20 });
    const held = heldGit(made.base, '[ "$1" = switch ]');
    c.send({ type: "renameWorkItem", requestId: 1, id: 1, title: "Fix the login bug", branch: true });
    await c.until(() => (held.waiting() ? true : undefined));
    // The rename waits in git's switch. A commit made now is one the reads find, and their turn to give the work item a branch waits behind the rename's.
    commitFile(worktree, "first.txt");
    await new Promise((resolve) => setTimeout(resolve, 300));
    held.release();
    await c.message("done", (m) => m.requestId === 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const listed = c.messages.flatMap((m) => (m.type === "inbox" ? m.workItems.filter((w) => w.branch !== null).map((w) => [w.branch, w.ownsBranch]) : []));
    expect(listed.length).toBeGreaterThan(0);
    expect(new Set(listed.map((pair) => JSON.stringify(pair)))).toEqual(new Set([JSON.stringify(["owlery/fix-the-login-bug", true])]));
    expect(branches()).toBe("main\nowlery/fix-the-login-bug\n");
  });

  it("makes no branch for a work item archived while a read's turn to give it one waited behind a creation", async () => {
    const { c, made, worktree, branches } = await daemonWithoutBranch({ commitPollMs: 20 });
    const held = heldGit(made.base);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Beside it", kind: "shell", cols: 80, rows: 24 });
    await c.until(() => (held.waiting() ? true : undefined));
    // The creation waits in `git worktree add`, and the reads' turns to give work item 1 a branch at this commit wait behind it.
    commitFile(worktree, "first.txt");
    await new Promise((resolve) => setTimeout(resolve, 300));
    c.send({ type: "archiveWorkItem", requestId: 2, id: 1, running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 2);
    held.release();
    await c.message("workItemCreated", (m) => m.requestId === 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    // The creation picked no branch, so it made none either.
    expect(branches()).toBe("main\n");
    expect(git(worktree, "rev-parse", "--abbrev-ref", "HEAD").trim()).toBe("HEAD");
    expect((await c.message("inbox", (m) => m.archived.length > 0)).archived).toMatchObject([{ id: 1, branch: null }]);
  });

  it("answers a `planRename` and a rename of the branch of a work item on a branch Owlery did not make with the reason, renames nothing, and renames its name alone", async () => {
    const made = repository();
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    git(made.repo, "branch", "--quiet", "picked");
    const { repo: _repo, ...picked } = await createWorktree({ folder: made.repo, title: "Picked", root: made.root, branch: "picked" });
    writeStore(runDir, made.repo, [{ id: 1, title: "Picked", createdAt: 1, ...picked }]);
    const { url } = await daemon({ runDir, worktreesRoot: made.root });
    const c = await client(url);
    await c.message("ready");
    const kept = "The branch picked is not one Owlery made, so it keeps its name.";
    c.send({ type: "planRename", requestId: 1, id: 1, title: "Second name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 1)).toEqual({ type: "renamePlan", requestId: 1, branch: "owlery/second-name", blocked: kept });
    c.send({ type: "renameWorkItem", requestId: 2, id: 1, title: "Second name", branch: true });
    expect((await c.message("error", (m) => m.requestId === 2)).message).toBe(kept);
    c.send({ type: "renameWorkItem", requestId: 3, id: 1, title: "Second name", branch: false });
    await c.message("done", (m) => m.requestId === 3);
    expect((await c.message("inbox", (m) => m.workItems[0]?.title === "Second name")).workItems[0]).toMatchObject({ branch: "picked", ownsBranch: false });
    expect(git(made.repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").trim().split("\n")).toEqual(["main", "picked"]);
  });

  it("sends no list read from a branch's old name while the branch is being renamed", async () => {
    const made = repository();
    const { c, workItem } = await withWorkItem(made, { commitPollMs: 20 });
    commitFile(workItem.worktree, "work.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    c.messages.length = 0;
    const held = heldGit(made.base, '[ "$1" = branch ] && [ "$2" = -m ]');
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "Second name", branch: true });
    await c.until(() => (held.waiting() ? true : undefined));
    // A rename of the name alone, of the same work item, is answered meanwhile. It changes nothing here, and it does not end the other rename's hold on the reads.
    c.send({ type: "renameWorkItem", requestId: 2, id: workItem.id, title: "First name", branch: false });
    await c.message("done", (m) => m.requestId === 2);
    // Git's own rename takes the old name away a moment before the daemon hears that it ended. The case stretches that moment: the branch leaves its old name here, and the reads of several intervals pass.
    git(made.repo, "branch", "-M", branchOf(workItem), "owlery/elsewhere");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(c.messages).toEqual([{ type: "done", requestId: 2 }]);
    c.messages.length = 0;
    git(made.repo, "branch", "-M", "owlery/elsewhere", branchOf(workItem));
    held.release();
    expect((await c.message("inbox")).workItems).toMatchObject([{ title: "Second name", branch: "owlery/second-name", newCommits: 1, commits: [{ subject: "add work.txt" }] }]);
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
  });

  it("drops a read of a branch's old name that began before the rename and ends after it", async () => {
    const made = repository();
    const { c, workItem } = await withWorkItem(made, { commitPollMs: 20 });
    commitFile(workItem.worktree, "work.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    c.messages.length = 0;
    // A read of the commits opens by asking git for the branch's head, with this command, which nothing else of a read and nothing of a rename runs.
    const held = heldGit(made.base, '[ "$1" = rev-parse ]');
    await c.until(() => (held.waiting() ? true : undefined));
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "Second name", branch: true });
    expect((await c.message("inbox")).workItems).toMatchObject([{ branch: "owlery/second-name", newCommits: 1 }]);
    // The read that waited now asks git for the old name, which is gone.
    held.release();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(c.messages.flatMap((m) => (m.type === "inbox" ? m.workItems.map((w) => [w.branch, w.newCommits, w.commits?.length]) : []))).toEqual([["owlery/second-name", 1, 1]]);
  });

  it("runs a rename of a branch after a creation that is under way, so the two never take one branch", async () => {
    const made = temporaryClone();
    cleanups.push(made.remove);
    git(made.origin, "branch", "--quiet", "owlery/taken-name");
    git(made.repo, "fetch", "--quiet", "origin");
    const { c, workItem } = await withWorkItem(made);
    const held = heldGit(made.base);
    // The creation checks out the remote's branch as a local branch of its name, the one the rename's name gives.
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Picked", branch: "origin/owlery/taken-name", kind: "shell", cols: 80, rows: 24 });
    c.send({ type: "renameWorkItem", requestId: 2, id: workItem.id, title: "Taken name", branch: true });
    // The creation made its branch and waits in `git worktree add`. A plan is a read, and does not wait behind it.
    c.send({ type: "planRename", requestId: 3, id: workItem.id, title: "Meanwhile" });
    await c.message("renamePlan", (m) => m.requestId === 3);
    expect(c.messages.map((m) => m.type)).toEqual(["renamePlan"]);
    held.release();
    expect((await c.message("workItemCreated", (m) => m.requestId === 1)).workItem.branch).toBe("owlery/taken-name");
    await c.message("done", (m) => m.requestId === 2);
    expect((await c.message("inbox", (m) => m.workItems.some((w) => w.id === workItem.id && w.title === "Taken name"))).workItems.map((w) => w.branch).sort()).toEqual(["owlery/taken-name", "owlery/taken-name-2"]);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim().split("\n").map((line) => line.trim())).toEqual(["+ owlery/taken-name", "+ owlery/taken-name-2"]);
    expect(git(made.repo, "for-each-ref", "--format=%(upstream:short)", "refs/heads/owlery/taken-name").trim()).toBe("origin/owlery/taken-name");
  });

  const ARCHIVED = "work item 1 is archived, restore it first";
  /** Waits until the daemon lists no pane whose process runs. */
  async function allExited(url: string): Promise<void> {
    for (;;) {
      const ready = await (await client(url)).message("ready");
      if (ready.sessions.every((s) => !s.alive)) return;
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  /** The first of a client's messages that is an inbox listing an archived work item, and where it stands among the messages. */
  const archivedInbox = (c: Awaited<ReturnType<typeof client>>) => c.until(() => { const at = c.messages.findIndex((m) => m.type === "inbox" && m.archived.length > 0); return at === -1 ? undefined : { at, inbox: c.messages[at] as Extract<ServerMessage, { type: "inbox" }> }; });

  it("archives a work item whose pane runs only where the archive names the pane: it ends the pane, lists the work item in `archived` and not in `workItems`, and leaves the folder's files, the branch and its commit as they were; it refuses a pane and an ask in it; and after a restore lists it in `workItems`, with its pane exited and the output the pane printed before the archive", async () => {
    const made = repository();
    const { daemon: d, c, url, runDir, workItem, session } = await withWorkItem(made, { now: () => 77, commandFor: () => ({ command: "/bin/sh", args: ["-c", "echo printed before the archive; sleep 30"], env: {} }) });
    commitFile(workItem.worktree, "work.txt");
    writeFileSync(join(workItem.worktree, "README.md"), "changed and not committed\n");
    writeFileSync(join(workItem.worktree, "untracked.txt"), "kept\n");
    const before = onDisk(made.repo, workItem.worktree);
    c.send({ type: "archiveWorkItem", requestId: 1, id: workItem.id, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "A session started since you looked. Read it again." });
    // The refusal ended nothing and archived nothing.
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.archived, still.sessions.map((s) => [s.id, s.alive])]).toEqual([[workItem.id], [], [[session.id, true]]]);

    c.send({ type: "archiveWorkItem", requestId: 2, id: workItem.id, running: { panes: [session.id], headless: [] } });
    const { at, inbox } = await archivedInbox(c);
    // The answer first, then the inbox that carries the archive.
    expect(c.messages.findIndex((m) => m.type === "done" && m.requestId === 2)).toBeLessThan(at);
    expect(c.messages.findIndex((m) => m.type === "done" && m.requestId === 2)).not.toBe(-1);
    expect(inbox.workItems).toEqual([]);
    expect(inbox.archived).toMatchObject([{ id: workItem.id, title: workItem.title, branch: workItem.branch, worktree: workItem.worktree, archivedAt: 77 }]);
    expect(inbox.sessions.map((s) => [s.id, s.alive])).toEqual([[session.id, false]]);
    expect(onDisk(made.repo, workItem.worktree)).toEqual(before);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8")).repositories[0].workItems[0].archivedAt).toBe(77);

    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: workItem.id });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: ARCHIVED });
    await expect(d.startRoleSession(workItem.id, "Which file?", PROOFER)).rejects.toThrow(ARCHIVED);
    const archived = await (await client(url)).message("ready");
    expect([archived.workItems, archived.archived.map((w) => w.id), archived.sessions.map((s) => s.id), archived.headless]).toEqual([[], [workItem.id], [session.id], []]);

    c.messages.length = 0;
    c.send({ type: "restoreWorkItem", requestId: 5, id: workItem.id });
    const restored = await c.message("inbox", (m) => m.workItems.length === 1);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 5 });
    expect(restored.archived).toEqual([]);
    expect(restored.workItems).toMatchObject([{ id: workItem.id, title: workItem.title, branch: workItem.branch, archivedAt: null }]);
    expect(restored.sessions.map((s) => [s.id, s.workItemId, s.alive])).toEqual([[session.id, workItem.id, false]]);
    c.send({ type: "attach", id: session.id });
    expect((await c.message("replay", (m) => m.id === session.id)).data).toContain("printed before the archive");
    expect(onDisk(made.repo, workItem.worktree)).toEqual(before);
    // A pane starts in it again.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 6, workItemId: workItem.id });
    expect((await c.message("started", (m) => m.requestId === 6)).session.workItemId).toBe(workItem.id);
  });

  it("stops a working headless session of a work item it archives, where the archive names it: the session failed, says that it ended when the work item was archived, and stays listed with the answers of the others after a restore", async () => {
    const made = repository();
    let stopped = 0;
    const slow = fakeAdapter({ delayMs: 60_000 });
    const quick = fakeAdapter();
    // The prompt "Quick?" is answered at once, and any other after a minute.
    const roleAdapter: RoleAdapter = { name: slow.name, features: slow.features, notice: slow.notice, start: async (options, listener) => { const run = await (options.prompt === "Quick?" ? quick : slow).start(options, listener); return { ...run, stop: () => { stopped++; return run.stop(); } }; } };
    const { daemon: d, c, url, workItem } = await withWorkItem(made, { roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    await d.startRoleSession(workItem.id, "Quick?", PROOFER);
    const finished = (await c.message("headless", (m) => m.headless.state === "finished")).headless;
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    c.send({ type: "archiveWorkItem", requestId: 3, id: workItem.id, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: "A session started since you looked. Read it again." });
    expect(stopped).toBe(0);
    c.send({ type: "archiveWorkItem", requestId: 4, id: workItem.id, running: { panes: [], headless: [headless.id] } });
    await c.message("done", (m) => m.requestId === 4);
    expect(stopped).toBe(1);
    const failed = { ...headless, state: "failed", error: "ended when the work item was archived", stopped: "request" };
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless).toEqual(failed);
    c.send({ type: "restoreWorkItem", requestId: 5, id: workItem.id });
    await c.message("done", (m) => m.requestId === 5);
    const after = await (await client(url)).message("ready");
    expect([after.workItems.map((w) => w.id), after.archived, after.headless]).toEqual([[workItem.id], [], [finished, failed]]);
  });

  it("archives a work item with no running session at once, answers a second archive and a restore of a work item that is not archived with no inbox, and keeps the archive after the daemon starts again", async () => {
    const made = repository();
    const { c, url, runDir, workItem } = await withWorkItem(made, { now: () => 77, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    await settled(c);
    c.messages.length = 0;
    c.send({ type: "restoreWorkItem", requestId: 1, id: workItem.id });
    expect(await c.message("done")).toEqual({ type: "done", requestId: 1 });
    c.send({ type: "archiveWorkItem", requestId: 2, id: workItem.id, running: NONE_RUNNING });
    await c.message("inbox", (m) => m.archived.length === 1);
    c.send({ type: "archiveWorkItem", requestId: 3, id: workItem.id, running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 3);
    // An inbox for either request that changed nothing would have arrived before the refusal of a start sent after its answer.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["done", "done", "inbox", "done", "error"]);
    const later = await daemon({ runDir, worktreesRoot: made.root });
    const ready = await (await client(later.url)).message("ready");
    expect([ready.workItems, ready.archived.map((w) => [w.id, w.archivedAt])]).toEqual([[], [[workItem.id, 77]]]);
  });

  it("answers an archive and a restore that name no work item it holds, and an archive that names no running sessions, with an error, and archives nothing", async () => {
    const { c, url, workItem } = await withWorkItem(repository());
    c.send({ type: "archiveWorkItem", requestId: 1, id: 9, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "no work item 9" });
    c.send({ type: "restoreWorkItem", requestId: 2, id: 9 });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "no work item 9" });
    for (const [requestId, running] of [[3, undefined], [4, null], [5, { panes: [1] }], [6, { panes: "all", headless: [] }]] as const) {
      c.send({ type: "archiveWorkItem", requestId, id: workItem.id, running });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "an archive names the work item's running sessions" });
    }
    const ready = await (await client(url)).message("ready");
    expect([ready.workItems.map((w) => w.id), ready.archived, ready.sessions.map((s) => s.alive)]).toEqual([[workItem.id], [], [true]]);
  });

  it("reads git for no archived work item, at a hello among them, and reads a restored work item's branch at once", async () => {
    const made = repository();
    // The reads follow one another a minute apart, so a count that moves here moved at a hello or at the restore.
    const { c, url, workItem, session } = await withWorkItem(made, { commitPollMs: 60_000 });
    c.send({ type: "archiveWorkItem", requestId: 1, id: workItem.id, running: { panes: [session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 1);
    commitFile(workItem.worktree, "work.txt");
    const ready = await (await client(url)).message("ready");
    expect(ready.archived.map((w) => [w.id, w.newCommits])).toEqual([[workItem.id, 0]]);
    c.send({ type: "restoreWorkItem", requestId: 2, id: workItem.id });
    const read = await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    expect(read.workItems[0]?.commits?.map((commit) => commit.subject)).toEqual(["add work.txt"]);
  });

  it("archives a work item though a pane of it outlives the wait for its end, and starts no pane in it meanwhile", async () => {
    const made = repository();
    // The pane's process ignores the signal that ends it, says so, and exits by itself after a moment.
    const { c, workItem, session } = await withWorkItem(made, { endWaitMs: 400, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 1.5"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("deaf")) ? true : undefined));
    c.send({ type: "archiveWorkItem", requestId: 1, id: workItem.id, running: { panes: [session.id], headless: [] } });
    // The start arrives once the archive waits: two messages sent together are read in one turn, the start before the archive.
    await new Promise((r) => setTimeout(r, 100));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 1)).toBe(false);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    // Whichever way each request is answered, so a pane that started and an archive that was refused are each read as what they are.
    const answer = (requestId: number) => c.until(() => c.messages.find((m) => (m.type === "started" || m.type === "done" || m.type === "error") && m.requestId === requestId));
    expect(await answer(2)).toEqual({ type: "error", requestId: 2, message: ARCHIVED });
    expect(await answer(1)).toEqual({ type: "done", requestId: 1 });
    const { inbox } = await archivedInbox(c);
    expect([inbox.workItems, inbox.archived.map((w) => w.id), inbox.sessions.map((s) => [s.id, s.alive])]).toEqual([[], [workItem.id], [[session.id, true]]]);
    // The pane is listed as exited once its process ends.
    expect((await c.message("inbox", (m) => m.sessions.every((s) => !s.alive))).archived.map((w) => w.id)).toEqual([workItem.id]);
  });

  const CHANGED = "What the delete would remove has changed. Read it again.";
  const UNFORCED = "The work item holds work a delete would lose. Check Force delete to delete it anyway.";
  /** Asks the daemon what a delete of the work item would lose. */
  async function lossOf(c: Awaited<ReturnType<typeof client>>, id: number): Promise<WorkItemLoss> {
    const requestId = refused++;
    c.send({ type: "readLoss", requestId, id });
    return (await c.message("workItemLoss", (m) => m.requestId === requestId)).loss;
  }
  /** Every file under a folder, by its path from the folder, without the worktree's own `.git`. */
  const pathsIn = (folder: string): string[] =>
    (readdirSync(folder, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[])
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
      .filter((path) => path !== ".git")
      .sort();

  it("answers a `readLoss` with what a delete of the work item would lose, as git reads it then, and one that names no work item it holds with an error", async () => {
    const made = repository();
    const { c, workItem } = await withWorkItem(made);
    writeFileSync(join(workItem.worktree, "untracked.txt"), "kept\n");
    c.send({ type: "readLoss", requestId: 1, id: workItem.id });
    const answer = await c.message("workItemLoss", (m) => m.requestId === 1);
    expect(answer).toEqual({ type: "workItemLoss", requestId: 1, id: workItem.id, loss: await readLoss(made.repo, workItem.branch, workItem.worktree) });
    expect(answer.loss).toMatchObject({ branch: workItem.branch, worktree: workItem.worktree, untracked: ["untracked.txt"] });
    c.send({ type: "readLoss", requestId: 2, id: 9 });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "no work item 9" });
    // The read changed nothing, and told no other client anything.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["workItemLoss", "error", "error"]);
  });

  it("deletes a work item that would lose nothing but an ignored file, with the loss's stamp and no force: it ends the pane the delete names, removes the folder and the branch, takes the work item, its pane and its headless sessions off the lists, answers before the inbox, and gives its id to no work item made after", async () => {
    const made = repository();
    const { daemon: d, c, url, runDir, workItem, session } = await withWorkItem(made, { roleAdapter: fakeAdapter() });
    writeFileSync(join(workItem.worktree, ".gitignore"), ".env\n");
    git(workItem.worktree, "add", ".gitignore");
    git(workItem.worktree, "commit", "--quiet", "-m", "ignore the environment");
    git(made.repo, "branch", "keeps", branchOf(workItem));
    writeFileSync(join(workItem.worktree, ".env"), "SECRET=1\n");
    await d.startRoleSession(workItem.id, "Quick?", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    const loss = await lossOf(c, workItem.id);
    expect(loss).toMatchObject({ commitCount: 0, uncommittedCount: 0, untrackedCount: 0, ignored: [".env"] });
    const own = [readFileSync(join(made.repo, "README.md"), "base64"), git(made.repo, "status", "--porcelain")];
    c.messages.length = 0;
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [] } });
    const gone = await c.message("inbox", (m) => m.workItems.length === 0);
    // The answer first, then the inbox that carries the delete.
    expect(c.messages.findIndex((m) => m.type === "done" && m.requestId === 2)).toBe(c.messages.indexOf(gone) - 1);
    expect([gone.repositories.map((r) => r.id), gone.archived, gone.sessions]).toEqual([[1], [], []]);
    expect([existsSync(workItem.worktree), git(made.repo, "branch", "--format=%(refname:short)").trim().split("\n").sort()]).toEqual([false, ["keeps", "main"]]);
    expect([readFileSync(join(made.repo, "README.md"), "base64"), git(made.repo, "status", "--porcelain")]).toEqual(own);
    const after = await (await client(url)).message("ready");
    expect([after.workItems, after.sessions, after.headless]).toEqual([[], [], []]);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ nextWorkItemId: 2, repositories: [{ id: 1, workItems: [] }] });
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Made after", kind: "shell", cols: 80, rows: 24 });
    expect((await c.message("workItemCreated", (m) => m.requestId === 3)).workItem).toMatchObject({ id: 2, repoId: 1, ...NOTHING_NEW });
  });

  it("deletes a work item with no branch yet and one on a branch Owlery did not make, and removes no branch: the first's loss names the commit only its worktree holds, which a forced delete loses, and the second's names none, since the branch that stays holds its commit", async () => {
    const made = repository();
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const { repo: _none, ...none } = await createWorktree({ folder: made.repo, title: "No branch yet", root: made.root });
    git(made.repo, "branch", "--quiet", "picked");
    const { repo: _picked, ...picked } = await createWorktree({ folder: made.repo, title: "Picked", root: made.root, branch: "picked" });
    commitFile(picked.worktree, "picked.txt");
    writeStore(runDir, made.repo, [
      { id: 1, title: "No branch yet", createdAt: 1, ...none },
      { id: 2, title: "Picked", createdAt: 1, ...picked },
    ]);
    // The `ready` waits for the first read, and the next is a minute away.
    const { url } = await daemon({ runDir, worktreesRoot: made.root, commitPollMs: 60_000, readyWaitMs: 60_000 });
    const c = await client(url);
    await c.message("ready");
    // The commit is made after that read, so no read makes the work item's branch at it before the delete: the state a commit made in the worktree is in until the next read.
    const lone = commitFile(none.worktree, "lone.txt");
    const loss = await lossOf(c, 1);
    expect(loss).toMatchObject({ branch: null, worktree: none.worktree, commits: [{ hash: git(made.repo, "rev-parse", "--short", lone).trim(), subject: "add lone.txt" }], commitCount: 1 });
    c.send({ type: "deleteWorkItem", requestId: 1, id: 1, stamp: loss.stamp, force: true, running: { panes: [], headless: [] } });
    await c.message("done", (m) => m.requestId === 1);
    const kept = await lossOf(c, 2);
    expect(kept).toMatchObject({ branch: null, worktree: picked.worktree, commits: [], commitCount: 0 });
    c.send({ type: "deleteWorkItem", requestId: 2, id: 2, stamp: kept.stamp, force: false, running: { panes: [], headless: [] } });
    await c.message("done", (m) => m.requestId === 2);
    expect([existsSync(none.worktree), existsSync(picked.worktree), git(made.repo, "branch", "--format=%(refname:short)").trim().split("\n").sort()]).toEqual([false, false, ["main", picked.branch]]);
  });

  it("refuses a delete of a work item that holds work without the force and leaves everything as it was, the pane running; and with the force removes the folder and the branch and nothing else: no ref of the remote, no remote's branch or tag of the clone, no other branch, no file of another work item or of the repository's own checkout, no path the loss did not name and no commit the loss did not name", async () => {
    const seed = temporaryRepository("seed");
    cleanups.push(seed.remove);
    // A clone of a bare remote, in the seed's temporary folder.
    const remote = join(seed.base, "remote.git");
    const repo = join(seed.base, "project");
    git(seed.base, "clone", "--quiet", "--bare", seed.repo, remote);
    git(seed.base, "clone", "--quiet", remote, repo);
    git(repo, "config", "user.name", "Owlery Test");
    git(repo, "config", "user.email", "test@owlery.invalid");
    git(repo, "config", "commit.gpgsign", "false");
    const { c, url, workItem, session } = await withWorkItem({ repo, root: seed.root, base: seed.base });
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Beside it", kind: "shell", cols: 80, rows: 24 });
    const beside = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    writeFileSync(join(beside.worktree, "beside.txt"), "another work item's\n");
    const { worktree, branch } = workItem;
    writeFileSync(join(worktree, ".gitignore"), ".env\nnode_modules/\n");
    git(worktree, "add", ".gitignore");
    git(worktree, "commit", "--quiet", "-m", "ignore the environment");
    const shared = commitFile(worktree, "shared.txt");
    git(repo, "branch", "keeps", shared);
    git(repo, "tag", "marked", "main");
    git(repo, "push", "--quiet", "origin", "keeps", "marked");
    const lost = commitFile(worktree, "lost.txt");
    writeFileSync(join(worktree, "README.md"), "changed and not committed\n");
    mkdirSync(join(worktree, "newdir", "deep"), { recursive: true });
    writeFileSync(join(worktree, "newdir", "deep", "u.txt"), "untracked\n");
    writeFileSync(join(worktree, ".env"), "SECRET=1\n");
    mkdirSync(join(worktree, "node_modules", "left-pad"), { recursive: true });
    writeFileSync(join(worktree, "node_modules", "left-pad", "index.js"), "\n");
    const loss = await lossOf(c, workItem.id);
    expect(loss).toMatchObject({ branch, worktree, commits: [{ hash: git(repo, "rev-parse", "--short", lost).trim(), subject: "add lost.txt" }], uncommitted: ["README.md"], untracked: ["newdir/deep/u.txt"], ignored: [".env", "node_modules/"], blocked: null, unreachable: false });
    const everything = onDisk(repo, worktree, beside.worktree);
    const told = { panes: [session.id], headless: [] };
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: told });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: UNFORCED });
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.sessions.map((s) => [s.id, s.alive])]).toEqual([[workItem.id, beside.id], [[session.id, true], [session.id + 1, true]]]);
    expect(onDisk(repo, worktree, beside.worktree)).toEqual(everything);

    // What stands before the delete that it may not touch, and what it may only touch as the loss named it.
    const refs = (...patterns: string[]): string => git(repo, "for-each-ref", "--format=%(refname) %(objectname)", ...patterns);
    const others = (): string => refs("refs/heads").split("\n").filter((line) => !line.startsWith(`refs/heads/${branch} `)).join("\n");
    const bytesIn = (folder: string) => pathsIn(folder).filter((path) => !path.startsWith(".git/")).map((path) => [path, readFileSync(join(folder, path), "base64")]);
    const kept = () => [git(repo, "ls-remote", "origin"), refs("refs/remotes", "refs/tags"), others(), bytesIn(beside.worktree), bytesIn(repo), git(repo, "status", "--porcelain")];
    const before = kept();
    const stood = pathsIn(worktree);
    const committed = new Set(git(repo, "ls-tree", "-r", "--name-only", `refs/heads/${branch}`).split("\n"));
    const reachable = (): Set<string> => new Set(git(repo, "rev-list", "--all").split("\n").filter((commit) => commit !== ""));
    const commitsBefore = reachable();
    c.send({ type: "deleteWorkItem", requestId: 3, id: workItem.id, stamp: loss.stamp, force: true, running: told });
    await c.message("done", (m) => m.requestId === 3);
    expect([existsSync(worktree), refs(`refs/heads/${branch}`)]).toEqual([false, ""]);
    expect(kept()).toEqual(before);
    expect((await c.message("inbox", (m) => m.workItems.length === 1)).workItems.map((w) => w.id)).toEqual([beside.id]);
    // Every path that stood in the folder is one a commit of the branch holds, or one the loss named, by itself or by the folder it is under.
    const named = [...loss.uncommitted, ...loss.untracked, ...loss.ignored];
    expect(stood.filter((path) => !committed.has(path) && !named.some((name) => (name.endsWith("/") ? path.startsWith(name) : path === name)))).toEqual([]);
    expect(stood).toEqual(expect.arrayContaining(["newdir/deep/u.txt", ".env", "node_modules/left-pad/index.js", "lost.txt"]));
    // Every commit no ref holds any more is one the loss named.
    const after = reachable();
    expect([...commitsBefore].filter((commit) => !after.has(commit)).map((commit) => git(repo, "rev-parse", "--short", commit).trim())).toEqual(loss.commits.map(({ hash }) => hash));
  });

  it("refuses a delete whose stamp is of an earlier loss, one that does not name a running pane, one of a work item whose loss says it is blocked, and one whose fields are not the protocol's or that names no work item, and ends and removes nothing", async () => {
    const made = repository();
    const { c, url, workItem, session } = await withWorkItem(made);
    const told = { panes: [session.id], headless: [] };
    const earlier = await lossOf(c, workItem.id);
    git(workItem.worktree, "commit", "--quiet", "--allow-empty", "-m", "made since the dialog was drawn");
    const everything = onDisk(made.repo, workItem.worktree);
    // The force does not stand in for the reading: the person read another loss.
    c.send({ type: "deleteWorkItem", requestId: 1, id: workItem.id, stamp: earlier.stamp, force: true, running: told });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: CHANGED });
    const loss = await lossOf(c, workItem.id);
    expect(loss.commitCount).toBe(1);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: true, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "A session started since you looked. Read it again." });
    git(made.repo, "worktree", "lock", workItem.worktree);
    const locked = await lossOf(c, workItem.id);
    c.send({ type: "deleteWorkItem", requestId: 3, id: workItem.id, stamp: locked.stamp, force: true, running: told });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: `The worktree ${workItem.worktree} is locked, so git does not remove it.` });
    git(made.repo, "worktree", "unlock", workItem.worktree);
    for (const [requestId, fields] of [[4, { stamp: 7, force: true, running: told }], [5, { stamp: loss.stamp, force: "yes", running: told }], [6, { stamp: loss.stamp, running: told }], [7, { stamp: loss.stamp, force: true }]] as const) {
      c.send({ type: "deleteWorkItem", requestId, id: workItem.id, ...fields });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message: "a delete names the stamp of the loss the person read, whether it is forced, and the work item's running sessions" });
    }
    c.send({ type: "deleteWorkItem", requestId: 8, id: 9, stamp: loss.stamp, force: true, running: told });
    expect(await c.message("error", (m) => m.requestId === 8)).toEqual({ type: "error", requestId: 8, message: "no work item 9" });
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.sessions.map((s) => [s.id, s.alive])]).toEqual([[workItem.id], [[session.id, true]]]);
    expect(onDisk(made.repo, workItem.worktree)).toEqual(everything);
  });

  it("reads the loss once more after the sessions ended, and refuses a delete where a pane's end left a file the person was not told of: the folder, the branch and the work item stay, and a headless session the delete stopped says that a delete of its work item began", async () => {
    const made = repository();
    const slow = fakeAdapter({ delayMs: 60_000 });
    // The pane's process writes a file into its folder as it ends.
    const { daemon: d, c, url, workItem, session } = await withWorkItem(made, { roleAdapter: slow, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap 'echo late > late.txt; exit 0' HUP; echo ready; sleep 30 & wait"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("ready")) ? true : undefined));
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    const loss = await lossOf(c, workItem.id);
    expect([loss.untrackedCount, loss.commitCount]).toEqual([0, 0]);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [headless.id] } });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: CHANGED });
    expect([readFileSync(join(workItem.worktree, "late.txt"), "utf8"), git(made.repo, "branch", "--list", branchOf(workItem)).trim()]).toEqual(["late\n", `+ ${workItem.branch}`]);
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.sessions.map((s) => [s.id, s.alive]), still.headless]).toEqual([[workItem.id], [[session.id, false]], [{ ...headless, state: "failed", error: "ended when a delete of its work item began", stopped: "request" }]]);
    // The loss the person reads next names the file, and a delete with its stamp needs the force.
    const next = await lossOf(c, workItem.id);
    expect(next.untracked).toEqual(["late.txt"]);
    c.send({ type: "deleteWorkItem", requestId: 3, id: workItem.id, stamp: next.stamp, force: false, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: UNFORCED });
    c.send({ type: "deleteWorkItem", requestId: 4, id: workItem.id, stamp: next.stamp, force: true, running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 4);
    expect([existsSync(workItem.worktree), (await (await client(url)).message("ready")).headless]).toEqual([false, []]);
  });

  it("reads the loss once more only after the headless runs the delete stopped have ended, so a file a run wrote as it ended refuses the delete", async () => {
    const made = repository();
    const inner = fakeAdapter({ delayMs: 60_000 });
    // The run writes a file into the work item's folder as it ends, a moment after its stop.
    const roleAdapter: RoleAdapter = {
      name: inner.name,
      features: inner.features, notice: inner.notice,
      start: async (options, listener) => {
        const run = await inner.start(options, listener);
        return {
          ...run,
          stop: async () => {
            await run.stop();
            await new Promise((r) => setTimeout(r, 300));
            if (existsSync(options.cwd)) writeFileSync(join(options.cwd, "late.txt"), "late\n");
          },
        };
      },
    };
    const { daemon: d, c, url, workItem } = await withWorkItem(made, { roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    const loss = await lossOf(c, workItem.id);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [], headless: [headless.id] } });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: CHANGED });
    expect(readFileSync(join(workItem.worktree, "late.txt"), "utf8")).toBe("late\n");
  });

  it("goes on with a delete past a headless run whose end it waited for in vain: only a pane that outlives the wait refuses it", async () => {
    const made = repository();
    const inner = fakeAdapter({ delayMs: 60_000 });
    // The run never says it has ended.
    const roleAdapter: RoleAdapter = { name: inner.name, features: inner.features, notice: inner.notice, start: async (options, listener) => { await inner.start(options, listener); return { stop: () => new Promise<void>(() => {}), answer: () => {} }; } };
    const { daemon: d, c, url, workItem } = await withWorkItem(made, { roleAdapter, endWaitMs: 300, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    const loss = await lossOf(c, workItem.id);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [], headless: [headless.id] } });
    await c.message("done", (m) => m.requestId === 2);
    expect(existsSync(workItem.worktree)).toBe(false);
  });

  it("refuses a delete where a pane's process has not exited within the wait, and removes nothing; starts no pane and no headless session in the work item, and archives it at no request, while the delete is under way; and starts one again after", async () => {
    const made = repository();
    // The pane's process ignores the signal that ends it, says so, and exits by itself after a moment.
    const { daemon: d, c, url, workItem, session } = await withWorkItem(made, { endWaitMs: 400, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 1.5"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("deaf")) ? true : undefined));
    const loss = await lossOf(c, workItem.id);
    const told = { panes: [session.id], headless: [] };
    c.send({ type: "deleteWorkItem", requestId: 1, id: workItem.id, stamp: loss.stamp, force: false, running: told });
    // The requests arrive once the delete waits: messages sent together are read in one turn, before the delete's first read.
    await new Promise((r) => setTimeout(r, 150));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 1)).toBe(false);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    c.send({ type: "archiveWorkItem", requestId: 4, id: workItem.id, running: told });
    const answer = (requestId: number) => c.until(() => c.messages.find((m) => (m.type === "started" || m.type === "done" || m.type === "error") && m.requestId === requestId));
    const DELETING = `work item ${workItem.id} is being deleted`;
    expect([await answer(2), await answer(4)]).toEqual([2, 4].map((requestId) => ({ type: "error", requestId, message: DELETING })));
    await expect(d.startRoleSession(workItem.id, "Which file?", PROOFER)).rejects.toThrow(DELETING);
    expect(await answer(1)).toEqual({ type: "error", requestId: 1, message: "A session did not end in time, so nothing was deleted. Try again." });
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.archived, existsSync(join(workItem.worktree, "README.md")), git(made.repo, "branch", "--list", branchOf(workItem)).trim()]).toEqual([[workItem.id], [], true, `+ ${workItem.branch}`]);
    // The refused delete holds the work item no longer.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 5, workItemId: workItem.id });
    expect((await answer(5))?.type).toBe("started");
  });

  it("refuses a delete of a work item while an archive of it is ending its sessions, so the two never end one work item's sessions at once, and the archive goes on", async () => {
    const made = repository();
    const { c, workItem, session } = await withWorkItem(made, { endWaitMs: 400, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 1.5"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("deaf")) ? true : undefined));
    const loss = await lossOf(c, workItem.id);
    const told = { panes: [session.id], headless: [] };
    c.send({ type: "archiveWorkItem", requestId: 1, id: workItem.id, running: told });
    await new Promise((r) => setTimeout(r, 100));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 1)).toBe(false);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: true, running: told });
    c.send({ type: "removeRepository", requestId: 3, id: 1, workItems: [workItem.id], running: told, delete: { stamps: { [workItem.id]: loss.stamp }, force: true } });
    const answer = (requestId: number) => c.until(() => c.messages.find((m) => (m.type === "done" || m.type === "error") && m.requestId === requestId));
    const ARCHIVING = `An archive of work item ${workItem.id} is ending its sessions. Try again.`;
    expect([await answer(2), await answer(3)]).toEqual([{ type: "error", requestId: 2, message: ARCHIVING }, { type: "error", requestId: 3, message: ARCHIVING }]);
    expect(await answer(1)).toEqual({ type: "done", requestId: 1 });
    const { inbox } = await archivedInbox(c);
    expect([inbox.archived.map((w) => w.id), existsSync(join(workItem.worktree, "README.md")), git(made.repo, "branch", "--list", branchOf(workItem)).trim()]).toEqual([[workItem.id], true, `+ ${workItem.branch}`]);
  });

  it("leaves the removal of a changed worktree to git where the delete is not forced: git refuses to remove a file that arrived after the daemon's last read, its sentence is the answer, and the work item stays listed with its folder and its branch", async () => {
    const made = repository();
    const { c, url, workItem, session } = await withWorkItem(made);
    const loss = await lossOf(c, workItem.id);
    const held = heldGit(made.base, '[ "$1" = worktree ] && [ "$2" = remove ]');
    c.send({ type: "deleteWorkItem", requestId: 1, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [] } });
    await c.until(() => (held.waiting() ? true : undefined));
    writeFileSync(join(workItem.worktree, "arrived.txt"), "after the last read\n");
    held.release();
    expect((await c.message("error", (m) => m.requestId === 1)).message).toContain("contains modified or untracked files, use --force to delete it");
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), readFileSync(join(workItem.worktree, "arrived.txt"), "utf8"), git(made.repo, "branch", "--list", branchOf(workItem)).trim()]).toEqual([[workItem.id], "after the last read\n", `+ ${workItem.branch}`]);
  });

  it("deletes an archived work item, and takes a work item whose repository's folder is gone off the lists with nothing removed on disk", async () => {
    const made = repository();
    const { c, url, workItem, session } = await withWorkItem(made);
    c.send({ type: "archiveWorkItem", requestId: 1, id: workItem.id, running: { panes: [session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 1);
    const loss = await lossOf(c, workItem.id);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 2);
    const after = await (await client(url)).message("ready");
    expect([after.workItems, after.archived, after.sessions, existsSync(workItem.worktree), git(made.repo, "branch", "--list", "owlery/*")]).toEqual([[], [], [], false, ""]);

    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Its repository goes", kind: "shell", cols: 80, rows: 24 });
    const left = await c.message("workItemCreated", (m) => m.requestId === 3);
    writeFileSync(join(left.workItem.worktree, "untracked.txt"), "kept\n");
    rmSync(made.repo, { recursive: true });
    const unreachable = await lossOf(c, left.workItem.id);
    expect(unreachable).toMatchObject({ branch: null, worktree: null, untracked: [], unreachable: true });
    // Nothing is named as lost, so the delete needs no force, and removes no file.
    c.send({ type: "deleteWorkItem", requestId: 4, id: left.workItem.id, stamp: unreachable.stamp, force: false, running: { panes: [left.session.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 4);
    expect((await (await client(url)).message("ready")).workItems).toEqual([]);
    expect(pathsIn(left.workItem.worktree)).toEqual(["README.md", "untracked.txt"]);
  });

  it("runs a delete after a creation that is under way", async () => {
    const made = repository();
    const { c, workItem, session } = await withWorkItem(made);
    const loss = await lossOf(c, workItem.id);
    const held = heldGit(made.base);
    c.messages.length = 0;
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Under way", kind: "shell", cols: 80, rows: 24 });
    await c.until(() => (held.waiting() ? true : undefined));
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [] } });
    // A delete that did not wait would have ended the pane and removed the folder well inside a second: it reads git, ends a `sleep` and runs two git commands.
    await new Promise((r) => setTimeout(r, 1000));
    expect([c.messages.flatMap((m) => (m.type === "done" || m.type === "error" ? [m.requestId] : [])), existsSync(join(workItem.worktree, "README.md"))]).toEqual([[], true]);
    held.release();
    await c.message("workItemCreated", (m) => m.requestId === 1);
    await c.message("done", (m) => m.requestId === 2);
    // The delete removed the branch a rename gave the first, and the creation, which picked none, made none.
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("");
  });
});

describe("agent events", () => {
  it("carries a hook as a neutral event, with no field of the vendor's", async () => {
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    d.agentEvent(4, "PreToolUse", { tool_name: "Bash", session_id: "s", tool_input: { command: "ls" } });
    const event = await c.message("agent");
    expect(Object.keys(event).sort()).toEqual(["at", "event", "id", "tool", "type"]);
    expect(event).toMatchObject({ type: "agent", id: 4, event: "tool-start", tool: "Bash" });
  });

  it("maps each Claude Code hook Owlery listens to, and drops any other", () => {
    expect(agentEventFor("SessionStart")).toBe("session-start");
    expect(agentEventFor("UserPromptSubmit")).toBe("prompt");
    expect(agentEventFor("PreToolUse")).toBe("tool-start");
    expect(agentEventFor("PostToolUse")).toBe("tool-end");
    expect(agentEventFor("PostToolUseFailure")).toBe("tool-failed");
    expect(agentEventFor("PermissionRequest")).toBe("permission");
    expect(agentEventFor("Notification")).toBe("notification");
    expect(agentEventFor("Stop")).toBe("turn-end");
    expect(agentEventFor("StopFailure")).toBe("turn-failed");
    expect(agentEventFor("StopFailure", { hook_event_name: "StopFailure", agent_id: "a1b2", error: "rate_limit", last_assistant_message: "API Error: Rate limit reached" })).toBeUndefined();
    expect(agentEventFor("SubagentStop")).toBeUndefined();
  });
});

describe("the inbox", () => {
  type Inbox = Extract<ServerMessage, { type: "inbox" }>;
  const START = { type: "start", cols: 80, rows: 24 };
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function repository() {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  }

  /** Commits a new file in a worktree, on the branch it has checked out. */
  function commit(folder: string, file: string): void {
    writeFileSync(join(folder, file), `${file}\n`);
    git(folder, "add", file);
    git(folder, "commit", "--quiet", "-m", `add ${file}`);
  }

  const inboxes = (c: { messages: ServerMessage[] }): Inbox[] => c.messages.filter((m): m is Inbox => m.type === "inbox");
  const stateOf = (m: Inbox, id: number) => m.sessions.find((s) => s.id === id)?.state;

  it("offers in `ready` the kinds of pane it was given, each with its label, whether it reports state and whether it continues", async () => {
    const paneKinds = [{ kind: "shell" as const, label: "A shell", reportsState: false, continues: true }];
    const { url } = await daemon({ paneKinds });
    expect((await (await client(url)).message("ready")).paneKinds).toEqual(paneKinds);
  });

  it("tells a session's state as its agent's events arrive: working, then waiting, then finished", async () => {
    const { repo, root } = repository();
    const { daemon: d, url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Watched", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    expect(session.state).toBeNull();
    d.agentEvent(session.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "working");
    d.agentEvent(session.id, "PermissionRequest", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    d.agentEvent(session.id, "Stop", {});
    const last = await c.message("inbox", (m) => stateOf(m, session.id) === "finished");
    expect(last.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, accountId: 0, signsIn: null, state: "finished", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null }]);
    expect(last.workItems).toEqual([workItem]);
  });

  it("sends an inbox when the state changes, and none for an event that leaves it as it was", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "UserPromptSubmit", {});
    d.agentEvent(session.id, "PreToolUse", { tool_name: "Bash" });
    d.agentEvent(session.id, "PostToolUse", { tool_name: "Bash" });
    d.agentEvent(session.id, "Stop", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "finished");
    // One for the pane's start, one for working, one for finished.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "working", "finished"]);
    // The events themselves still reach the client, each one.
    expect(c.messages.flatMap((m) => (m.type === "agent" ? [m.event] : []))).toEqual(["prompt", "tool-start", "tool-end", "turn-end"]);
  });

  it("keeps a pane of a kind that reports no state at none, whatever arrives under its id", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const shell = (await c.message("started", (m) => m.requestId === 1)).session;
    c.send({ ...START, kind: "claude", requestId: 2, workItemId: 1 });
    const agent = (await c.message("started", (m) => m.requestId === 2)).session;
    d.agentEvent(shell.id, "UserPromptSubmit", {});
    d.agentEvent(agent.id, "UserPromptSubmit", {});
    const inbox = await c.message("inbox", (m) => stateOf(m, agent.id) === "working");
    expect(stateOf(inbox, shell.id)).toBeNull();
  });

  it("lists a session that waits as waiting to a client that connects later", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "Notification", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    c.socket.close();
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: 1, accountId: 0, signsIn: null, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null }]);
  });

  it("carries with a session's state the time it began, and the tool or the text the event that began it carried, until the state changes", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: 1, accountId: 0, signsIn: null, ...NO_STATE });
    /** The session as a client that says hello now is given it. */
    const listed = async () => (await (await client(url)).message("ready")).sessions[0];
    d.agentEvent(session.id, "PermissionRequest", { tool_name: "Bash", tool_input: { command: "ls" } });
    const waiting = { ...session, state: "waiting", stateSince: 100, stateText: null, stateTool: "Bash" };
    expect(await listed()).toEqual(waiting);
    // The inbox that tells of the state carries the same.
    expect((await c.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([waiting]);
    clock = 200;
    d.agentEvent(session.id, "Stop", { last_assistant_message: "The form is in src/form.ts." });
    expect(await listed()).toEqual({ ...session, state: "finished", stateSince: 200, stateText: "The form is in src/form.ts.", stateTool: null });
    clock = 300;
    d.agentEvent(session.id, "UserPromptSubmit", { prompt: "Go on." });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 300, stateText: null, stateTool: null });
    clock = 400;
    d.agentEvent(session.id, "Notification", { message: "The agent is waiting for your input" });
    expect(await listed()).toEqual({ ...session, state: "waiting", stateSince: 400, stateText: "The agent is waiting for your input", stateTool: null });
    clock = 500;
    d.agentEvent(session.id, "SessionStart", {});
    expect(await listed()).toEqual({ ...session, ...NO_STATE });
  });

  it("lists a Claude Code session whose turn ended on an API error as waiting with the error's text, from the event as the hooks reference gives it, and as working again from the next prompt", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const { payload } = JSON.parse(readFileSync(join(__dirname, "fixtures", "claude-stop-failure.json"), "utf8")) as { payload: { hook_event_name: string; last_assistant_message: string } };
    d.agentEvent(session.id, "UserPromptSubmit", { prompt: "Go on." });
    clock = 200;
    d.agentEvent(session.id, payload.hook_event_name, payload);
    const waiting = { ...session, state: "waiting", stateSince: 200, stateText: "API Error: Rate limit reached", stateTool: null, stateQuestions: null };
    expect((await c.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([waiting]);
    expect((await (await client(url)).message("ready")).sessions).toEqual([waiting]);
    clock = 300;
    d.agentEvent(session.id, "UserPromptSubmit", { prompt: "Try again." });
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, state: "working", stateSince: 300, stateText: null, stateTool: null, stateQuestions: null }]);
  });

  it("leaves a working Claude Code session working at the API error of one of its subagents, whose hook input names the subagent's agent_id", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "UserPromptSubmit", {});
    d.agentEvent(session.id, "StopFailure", { agent_id: "a1b2", error: "rate_limit", last_assistant_message: "API Error: Rate limit reached" });
    await pause(100);
    expect(c.messages.filter((m) => m.type === "agent" && m.event === "turn-failed")).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions[0]).toMatchObject({ state: "working", stateText: null });
  });

  it("reads no session log of a pane whose turn ended on an API error: an interruption entry the log gains afterwards tells nobody", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const log = sessionLog(cleanups);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    d.agentEvent(session.id, "UserPromptSubmit", { transcript_path: log });
    // The watch is given time to begin, as in the case of an interrupted reply, so an entry it read would be told.
    await pause(60);
    d.agentEvent(session.id, "StopFailure", { transcript_path: log, last_assistant_message: "API Error: Rate limit reached" });
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    await pause(300);
    expect(interruptions(c)).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions[0]).toMatchObject({ state: "waiting", stateText: "API Error: Rate limit reached" });
  });

  it("keeps 2000 characters of a state's text, and cuts inside no character", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const text = async () => (await (await client(url)).message("ready")).sessions[0]?.stateText;
    d.agentEvent(session.id, "Stop", { last_assistant_message: "x".repeat(2000) });
    expect(await text()).toBe("x".repeat(2000));
    d.agentEvent(session.id, "UserPromptSubmit", {});
    d.agentEvent(session.id, "Stop", { last_assistant_message: `${"x".repeat(2000)}y` });
    expect(await text()).toBe("x".repeat(2000));
    d.agentEvent(session.id, "UserPromptSubmit", {});
    // An owl is two characters of a text, and the cut would fall between them.
    d.agentEvent(session.id, "Stop", { last_assistant_message: `${"x".repeat(1999)}\u{1F989} and more` });
    expect(await text()).toBe("x".repeat(1999));
    d.agentEvent(session.id, "UserPromptSubmit", {});
    d.agentEvent(session.id, "Stop", { last_assistant_message: `${"x".repeat(1998)}\u{1F989} and more` });
    expect(await text()).toBe(`${"x".repeat(1998)}\u{1F989}`);
  });

  it("keeps what the event that began a state said: a later event that leaves the state as it was changes neither its time, its text nor its tool", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const listed = async () => (await (await client(url)).message("ready")).sessions[0];
    d.agentEvent(session.id, "PermissionRequest", { tool_name: "Bash" });
    clock = 200;
    d.agentEvent(session.id, "Notification", { message: "The agent needs your permission to use Bash" });
    expect(await listed()).toEqual({ ...session, state: "waiting", stateSince: 100, stateText: null, stateTool: "Bash" });
    clock = 300;
    d.agentEvent(session.id, "UserPromptSubmit", {});
    clock = 400;
    d.agentEvent(session.id, "PreToolUse", { tool_name: "Read" });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 300, stateText: null, stateTool: null });
    // One inbox for the pane's start and one per state.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "waiting", "working"]);
  });

  /** A call of Claude Code's question tool, with one question and its two options. */
  const ASKING = { tool_name: "AskUserQuestion", tool_input: { questions: [{ question: "Which library formats the dates?", header: "Dates", multiSelect: false, options: [{ label: "date-fns", description: "Small functions." }, { label: "dayjs", description: "One object." }] }] } };
  const ASKED = [{ asks: "Which library formats the dates?", options: [{ label: "date-fns", implies: "Small functions." }, { label: "dayjs", implies: "One object." }], multiple: false }];

  it("lists a session whose agent asks a question as waiting from the call that asks, with the question as its text and its questions, and keeps them through the events that follow until the call ends", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const listed = async () => (await (await client(url)).message("ready")).sessions[0];
    d.agentEvent(session.id, "UserPromptSubmit", {});
    clock = 200;
    d.agentEvent(session.id, "PreToolUse", ASKING);
    const waiting = { ...session, state: "waiting", stateSince: 200, stateText: "Which library formats the dates?", stateTool: null, stateQuestions: ASKED };
    expect(await listed()).toEqual(waiting);
    expect((await c.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([waiting]);
    clock = 300;
    d.agentEvent(session.id, "PermissionRequest", ASKING);
    clock = 400;
    d.agentEvent(session.id, "Notification", { message: "Claude needs your permission to use AskUserQuestion" });
    expect(await listed()).toEqual(waiting);
    clock = 500;
    d.agentEvent(session.id, "PostToolUse", { tool_name: "AskUserQuestion", tool_input: ASKING.tool_input });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 500, stateText: null, stateTool: null, stateQuestions: null });
    clock = 600;
    d.agentEvent(session.id, "PreToolUse", { tool_name: "Bash", tool_input: { command: "ls" } });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 500, stateText: null, stateTool: null, stateQuestions: null });
    // One inbox for the pane's start and one per state.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "working", "waiting", "working"]);
  });

  it("keeps 2000 characters of a question's text, of an option's label and of what it implies", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const long = (letter: string) => `${letter.repeat(2000)}and more`;
    d.agentEvent(session.id, "PreToolUse", { tool_name: "AskUserQuestion", tool_input: { questions: [{ question: long("q"), options: [{ label: long("l"), description: long("d") }] }] } });
    const listed = (await (await client(url)).message("ready")).sessions[0];
    expect(listed?.stateText).toBe("q".repeat(2000));
    expect(listed?.stateQuestions).toEqual([{ asks: "q".repeat(2000), options: [{ label: "l".repeat(2000), implies: "d".repeat(2000) }], multiple: false }]);
  });

  /** A pane whose process prints nothing and stays alive, as a CLI that asks a question before its session starts sends no event. */
  const SILENT = { commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }) };

  it("lists a pane that sent no event in the time after its start as waiting, from the clock's value then and with no text and no tool, and tells every client once", async () => {
    let clock = 100;
    const { url } = await daemonWithWorkItem({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: 1, accountId: 0, signsIn: null, ...NO_STATE });
    // The time is the one the silence was called at, and not the pane's start.
    clock = 700;
    const waiting = { ...session, state: "waiting", stateSince: 700, stateText: null, stateTool: null };
    for (const each of [c, bystander]) expect((await each.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([waiting]);
    await pause(200);
    // One inbox for the pane's start and one for the silence.
    for (const each of [c, bystander]) expect(inboxes(each).map((m) => stateOf(m, session.id))).toEqual([null, "waiting"]);
    expect((await (await client(url)).message("ready")).sessions).toEqual([waiting]);
  });

  it.each(["SessionStart", "SubagentStop"])("never calls a pane waiting by silence once an event arrived under its id: %s, though it leaves no state", async (hook) => {
    const { daemon: d, url } = await daemonWithWorkItem({ ...SILENT, silentStartMs: 200 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, hook, {});
    await pause(450);
    expect((await (await client(url)).message("ready")).sessions).toEqual([session]);
    // The one inbox is the pane's start.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null]);
  });

  it("takes the waiting of a silent pane away at its session's start, and gives a prompt after it working with the prompt's time", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    const listed = async () => (await (await client(url)).message("ready")).sessions[0];
    clock = 200;
    d.agentEvent(session.id, "SessionStart", {});
    expect(await listed()).toEqual({ ...session, ...NO_STATE });
    clock = 300;
    d.agentEvent(session.id, "UserPromptSubmit", { prompt: "Go on." });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 300, stateText: null, stateTool: null });
    await pause(200);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "waiting", null, "working"]);
  });

  it("keeps the time of the silence, and neither a text nor a tool, where an event that maps to waiting arrives while the pane waits by silence", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    clock = 200;
    d.agentEvent(session.id, "PermissionRequest", { tool_name: "Bash" });
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, state: "waiting", stateSince: 100, stateText: null, stateTool: null }]);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "waiting"]);
  });

  it("keeps a silent pane of a kind that reports no state at none, and sends no inbox for its silence", async () => {
    const { url } = await daemonWithWorkItem({ ...SILENT, silentStartMs: 60 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await pause(300);
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, ...NO_STATE }]);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null]);
  });

  it("never calls a pane waiting whose process exited before the time passed", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }), silentStartMs: 300 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await c.message("exit");
    await pause(550);
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, alive: false }]);
    // One inbox for the pane's start and one for its end.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, null]);
  });

  it("sends nothing for the silence of a pane a client closed before the time passed", async () => {
    // The pane's shell ignores the signal a close sends, so its end does not come before the time passes.
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; sleep 1"], env: {} }), silentStartMs: 200 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    c.send({ type: "close", id: session.id });
    await c.message("inbox", (m) => m.sessions.length === 0);
    await pause(450);
    // One inbox for the pane's start and one for its close, which lists no pane.
    expect(inboxes(c).map((m) => m.sessions.map((s) => s.state))).toEqual([[null], []]);
    expect((await (await client(url)).message("ready")).sessions).toEqual([]);
  });

  it("calls no pane waiting after the daemon closed, though the pane's process outlives the close", async () => {
    let read = 0;
    // The shell ignores the signal here too.
    const { daemon: d, url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; sleep 1"], env: {} }), silentStartMs: 150, now: () => ++read });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    await c.message("started");
    await d.close();
    const before = read;
    await pause(400);
    // A silence that is called reads the clock for the state's time.
    expect(read).toBe(before);
  });

  /** What a session the person interrupted is listed with, beside its time. */
  const INTERRUPTED = { state: "waiting", stateText: "The turn was interrupted, and the agent waits for what to do next.", stateTool: null, stateQuestions: null };

  const interruptions = (c: { messages: ServerMessage[] }) => c.messages.filter((m) => m.type === "agent" && m.event === "interrupted");

  it("lists a Claude Code session whose tool call the person interrupted as waiting, from the entry its session log gained, and tells every client of the interruption", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const log = sessionLog(cleanups);
    // The log as it stood when the person sent the prompt that asks for the Bash call.
    writeFileSync(log, lines(0, SECOND_PROMPT));
    await replay(d, session.id, log, SECOND_PROMPT, TOOL_ESC);
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, state: "working", stateSince: 100, stateText: null, stateTool: null, stateQuestions: null }]);
    clock = 200;
    // The Esc's batch, and what the recording shows after it: a batch at the session's end, and its `SessionEnd`, to which Owlery does not listen.
    await replay(d, session.id, log, TOOL_ESC, Infinity);
    const waiting = { ...session, ...INTERRUPTED, stateSince: 200 };
    for (const each of [c, bystander]) {
      expect((await each.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([waiting]);
      expect(interruptions(each)).toEqual([{ type: "agent", id: session.id, event: "interrupted", tool: null, at: expect.any(Number) }]);
    }
    // The session waits now, so its log is no longer read: the same entry again tells nobody of a second interruption.
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    await pause(200);
    expect(interruptions(c)).toHaveLength(1);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "working", "waiting"]);
  });

  it("lists a Claude Code session whose reply the person interrupted as waiting, though its session log did not stand yet when the prompt arrived", async () => {
    const { daemon: d, url } = await daemonWithWorkItem();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const log = sessionLog(cleanups);
    await replay(d, session.id, log, 0, REPLY_ESC);
    expect((await (await client(url)).message("ready")).sessions[0]?.state).toBe("working");
    await replay(d, session.id, log, REPLY_ESC, SECOND_PROMPT);
    expect((await c.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([{ ...session, ...INTERRUPTED, stateSince: expect.any(Number) }]);
    expect(interruptions(c)).toHaveLength(1);
  });

  it("keeps an interrupted session waiting, from the interruption's time and with its text, at the end or the failure of a tool that arrives later, and lists it working from the next prompt as before", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const listed = async () => (await (await client(url)).message("ready")).sessions[0];
    const log = sessionLog(cleanups);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    await replay(d, session.id, log, SECOND_PROMPT, TOOL_ESC);
    // The Esc's batch, and before the daemon reads it the end of the call the Esc stopped, as a command that ran when the Esc came may send it.
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    d.agentEvent(session.id, "PostToolUseFailure", { tool_name: "Bash", transcript_path: log });
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    clock = 200;
    d.agentEvent(session.id, "PostToolUse", { tool_name: "Bash", transcript_path: log });
    d.agentEvent(session.id, "PostToolUseFailure", { tool_name: "Bash", transcript_path: log });
    expect(await listed()).toEqual({ ...session, ...INTERRUPTED, stateSince: 100 });
    clock = 300;
    d.agentEvent(session.id, "UserPromptSubmit", { transcript_path: log });
    d.agentEvent(session.id, "PreToolUse", { tool_name: "Bash", transcript_path: log });
    d.agentEvent(session.id, "PostToolUse", { tool_name: "Bash", transcript_path: log });
    expect(await listed()).toEqual({ ...session, state: "working", stateSince: 300, stateText: null, stateTool: null, stateQuestions: null });
    // One inbox for the pane's start and one per state.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "working", "waiting", "working"]);
  });

  it("leaves a session working where its session log never stands or is removed while it is read, throws nothing, says so once a pane in its log, and finishes the session at its turn's end", async () => {
    const said = logged();
    const { daemon: d, url } = await daemonWithWorkItem({ sessionLogWaitMs: 100 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const never = (await c.message("started", (m) => m.requestId === 1)).session;
    c.send({ ...START, kind: "claude", requestId: 2, workItemId: 1 });
    const removed = (await c.message("started", (m) => m.requestId === 2)).session;
    const missing = sessionLog(cleanups);
    d.agentEvent(never.id, "UserPromptSubmit", { transcript_path: missing });
    await pause(300);
    d.agentEvent(never.id, "PreToolUse", { tool_name: "Bash", transcript_path: missing });
    await pause(300);
    const log = sessionLog(cleanups);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    d.agentEvent(removed.id, "UserPromptSubmit", { transcript_path: log });
    // The watch is armed at the next turn of the loop, and a removal before it is reported to nobody.
    await pause(60);
    rmSync(log);
    await pause(300);
    const listed = (await (await client(url)).message("ready")).sessions;
    expect(listed.map(({ state }) => state)).toEqual(["working", "working"]);
    expect(said.filter((line) => line.includes("session log"))).toEqual([`the session log of pane ${String(never.id)} is not read, so its state is what its hook events say: ${missing} did not stand within 100 ms`, expect.stringMatching(new RegExp(`^the session log of pane ${String(removed.id)} is not read, so its state is what its hook events say: ENOENT`))]);
    for (const { id } of [never, removed]) d.agentEvent(id, "Stop", {});
    expect((await (await client(url)).message("ready")).sessions.map(({ state }) => state)).toEqual(["finished", "finished"]);
    expect(interruptions(c)).toEqual([]);
  });

  it("watches a session log again at the next working event that names it, where the last watch of it gave up because it did not stand", async () => {
    logged();
    const { daemon: d, url } = await daemonWithWorkItem({ sessionLogWaitMs: 100 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const log = sessionLog(cleanups);
    d.agentEvent(session.id, "UserPromptSubmit", { transcript_path: log });
    await pause(300);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    d.agentEvent(session.id, "PreToolUse", { tool_name: "Bash", transcript_path: log });
    await pause(60);
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    expect((await c.message("inbox", (m) => stateOf(m, session.id) === "waiting")).sessions).toEqual([{ ...session, ...INTERRUPTED, stateSince: expect.any(Number) }]);
  });

  it("reads no session log of a pane that is not working: one whose turn finished, one that was closed and one whose process exited, each while it worked", async () => {
    // The shell ignores the signal a close sends, so the closed pane's process outlives its close, and ends at a line.
    const { daemon: d, url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; read line; exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    const panes = [];
    for (const requestId of [1, 2, 3]) {
      c.send({ ...START, kind: "claude", requestId, workItemId: 1 });
      panes.push({ id: (await c.message("started", (m) => m.requestId === requestId)).session.id, log: sessionLog(cleanups) });
    }
    const [finished, closed, exited] = panes as [(typeof panes)[number], (typeof panes)[number], (typeof panes)[number]];
    for (const { id, log } of panes) {
      writeFileSync(log, lines(0, SECOND_PROMPT));
      d.agentEvent(id, "UserPromptSubmit", { transcript_path: log });
    }
    d.agentEvent(finished.id, "Stop", { transcript_path: finished.log });
    c.send({ type: "close", id: closed.id });
    c.send({ type: "input", id: exited.id, data: "go\n" });
    await c.message("exit", (m) => m.id === exited.id);
    for (const { log } of panes) appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    await pause(300);
    expect(interruptions(c)).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions.map(({ id, state }) => [id, state])).toEqual([
      [finished.id, "finished"],
      [exited.id, "working"],
    ]);
  });

  it("reads no session log after the daemon closed, though a working pane's process outlives the close", async () => {
    let read = 0;
    // The shell ignores the signal a close sends.
    const { daemon: d, url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; sleep 1"], env: {} }), now: () => ++read });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    const log = sessionLog(cleanups);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    d.agentEvent(session.id, "UserPromptSubmit", { transcript_path: log });
    await pause(60);
    await d.close();
    const before = read;
    appendFileSync(log, lines(TOOL_ESC, TOOL_ESC + 1));
    await pause(300);
    // An interruption that is read reads the clock for the state's time.
    expect(read).toBe(before);
  });

  it("tells every client of a work item one of them creates, of a pane one starts, and of a state that changes", async () => {
    const { repo, root } = repository();
    const { daemon: d, url } = await daemon({ worktreesRoot: root });
    const one = await client(url);
    await one.message("ready");
    const two = await client(url);
    await two.message("ready");
    one.send({ type: "createWorkItem", requestId: 1, repo, title: "Heard by both", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await one.message("workItemCreated");
    for (const c of [one, two]) {
      const inbox = await c.message("inbox");
      expect(inbox.workItems).toEqual([workItem]);
      expect(inbox.sessions).toEqual([session]);
    }
    two.send({ ...START, kind: "shell", requestId: 2, workItemId: workItem.id });
    const second = (await two.message("started")).session;
    for (const c of [one, two]) await c.message("inbox", (m) => m.sessions.some((s) => s.id === second.id));
    d.agentEvent(session.id, "UserPromptSubmit", {});
    for (const c of [one, two]) await c.message("inbox", (m) => stateOf(m, session.id) === "working");
  });

  it("answers the client that asked before it sends the inbox that holds what was asked", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Answered first", kind: "shell", cols: 80, rows: 24 });
    await c.message("inbox", (m) => m.workItems.length === 1);
    c.send({ ...START, kind: "shell", requestId: 2, workItemId: 1 });
    await c.message("inbox", (m) => m.sessions.length === 2);
    const order = c.messages.flatMap((m) => (m.type === "workItemCreated" || m.type === "started" || m.type === "inbox" ? [m.type] : []));
    expect(order).toEqual(["workItemCreated", "inbox", "started", "inbox"]);
  });

  it("lists a session that has exited as not alive, with the state it last had, and tells every client", async () => {
    // The pane ends when its input closes or a line arrives, so the case decides when.
    const { daemon: d, url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "PermissionRequest", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    c.send({ type: "input", id: session.id, data: "go\n" });
    const ended = { id: session.id, kind: "claude", alive: false, workItemId: 1, accountId: 0, signsIn: null, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null };
    for (const each of [c, bystander]) expect((await each.message("inbox", (m) => m.sessions[0]?.alive === false)).sessions).toEqual([ended]);
  });

  it("closes a pane: its process ends, and the session is in no later list", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'echo "pid=$$."; sleep 30'], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const kept = (await c.message("started", (m) => m.requestId === 1)).session;
    c.send({ ...START, kind: "shell", requestId: 2, workItemId: 1 });
    const closed = (await c.message("started", (m) => m.requestId === 2)).session;
    const pid = await c.until(() => {
      const printed = c.messages.flatMap((m) => (m.type === "output" && m.id === closed.id ? [m.data] : [])).join("");
      const found = /pid=(\d+)\./.exec(printed);
      return found ? Number(found[1]) : undefined;
    });
    expect(() => process.kill(pid, 0)).not.toThrow();

    bystander.send({ type: "close", id: closed.id });
    for (const each of [c, bystander]) {
      const inbox = await each.message("inbox", (m) => !m.sessions.some((s) => s.id === closed.id));
      expect(inbox.sessions).toEqual([kept]);
    }
    await c.until(() => {
      try {
        process.kill(pid, 0);
        return undefined;
      } catch {
        return true;
      }
    });
    expect((await (await client(url)).message("ready")).sessions).toEqual([kept]);
    // The pane is gone from the lists, so nothing says later that it ended: no `exit`, and no exit line in its output.
    await pause(200);
    expect(c.messages.filter((m) => m.type === "exit")).toEqual([]);
    expect(c.messages.filter((m) => m.type === "output" && m.data.includes("process exited"))).toEqual([]);
    expect(inboxes(c).at(-1)?.sessions).toEqual([kept]);
  });

  it("closes a pane whose process has already ended, taking it off the lists", async () => {
    const { url } = await daemonWithWorkItem({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    await c.message("exit");
    c.send({ type: "close", id: session.id });
    await c.until(() => (inboxes(c).at(-1)?.sessions.length === 0 ? true : undefined));
    expect((await (await client(url)).message("ready")).sessions).toEqual([]);
  });

  it("shows a commit made in a work item's worktree as one new commit, with its hash, its subject, its time, its lines and the file it changed, on the branch the read makes at it, and no agent state for its shell pane", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 40 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Committed to", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    expect(workItem).toMatchObject(NOTHING_NEW);
    /** The newest commit of the worktree's branch, as the daemon lists one that adds a file of one line. */
    const newest = (subject: string) => ({ hash: git(workItem.worktree, "rev-parse", "--short", "HEAD").trim(), subject, at: Number(git(workItem.worktree, "log", "-1", "--format=%ct").trim()) * 1000, added: 1, removed: 0 });
    commit(workItem.worktree, "one.txt");
    const one = newest("add one.txt");
    // The work item has no branch until a read finds the commit, and the read makes it there. The branch's making and the read's counts each send an inbox, in either order.
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 1 && m.workItems[0].aheadOfBase === 1 && m.workItems[0].branch !== null);
    expect(inbox.workItems).toEqual([{ ...workItem, branch: "owlery/committed-to", ownsBranch: true, aheadOfBase: 1, newCommits: 1, commits: [one], changes: { files: 1, added: 1, removed: 0, list: [{ path: "one.txt", added: 1, removed: 0 }] } }]);
    expect(inbox.sessions).toEqual([{ ...session, state: null }]);
    commit(workItem.worktree, "two.txt");
    const two = newest("add two.txt");
    const later = await c.message("inbox", (m) => m.workItems[0]?.newCommits === 2);
    // Newest first.
    expect(later.workItems[0]?.commits).toEqual([two, one]);
    expect(later.workItems[0]?.changes).toEqual({ files: 2, added: 2, removed: 0, list: [{ path: "one.txt", added: 1, removed: 0 }, { path: "two.txt", added: 1, removed: 0 }] });
  });

  it("asks git for a branch's log and diff only where its head moved since it last read them, and tells every client of a head that moved though the count stayed", async () => {
    const { repo, root, base } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Amended", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, so each read is of the branch.
    const workItem = await branchedByRename(c, (await c.message("workItemCreated")).workItem, 2);
    const watched = watchedGit(base);
    /** Waits until the daemon has read the counts three more times. A read runs `rev-list` twice: for the commits since the base commit, and for the commits ahead of the base branch and behind it. */
    const threeReads = async (): Promise<void> => {
      const reads = watched.calls("rev-list");
      await c.until(() => (watched.calls("rev-list") >= reads + 6 ? true : undefined));
    };
    // The branch was just made, and its head is where the creation left the worktree.
    await threeReads();
    expect([watched.calls("log"), watched.calls("diff")]).toEqual([0, 0]);
    commit(workItem.worktree, "one.txt");
    await c.message("inbox", (m) => m.workItems[0]?.commits?.[0]?.subject === "add one.txt");
    await threeReads();
    expect([watched.calls("log"), watched.calls("diff")]).toEqual([1, 1]);
    git(workItem.worktree, "commit", "--quiet", "--amend", "-m", "add one, said better");
    const amended = await c.message("inbox", (m) => m.workItems[0]?.commits?.[0]?.subject === "add one, said better");
    expect(amended.workItems[0]).toMatchObject({ newCommits: 1, commits: [{ subject: "add one, said better", added: 1, removed: 0 }] });
    await threeReads();
    expect([watched.calls("log"), watched.calls("diff")]).toEqual([2, 2]);
    // One for the creation, one for the rename, one for the commit and one for the amended one.
    expect(inboxes(c).map((m) => m.workItems[0]?.commits?.[0]?.subject)).toEqual([undefined, undefined, "add one.txt", "add one, said better"]);
  });

  it("tells every client how far a work item's branch is ahead of its base branch and how far behind it: behind by a commit the base gained while the branch's head stayed, not ahead by the commits the base gained and the branch merged in, and by none either way once the base holds the branch", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, which the base later merges.
    const workItem = await branchedByRename(c, (await c.message("workItemCreated")).workItem, 2);
    expect([workItem.baseBranch, workItem.aheadOfBase, workItem.behindBase]).toEqual(["main", 0, 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.aheadOfBase, m.workItems[0]?.behindBase, m.workItems[0]?.newCommits];
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m).join() === "1,0,1");
    const head = git(workItem.worktree, "rev-parse", "HEAD").trim();
    commit(repo, "on-main.txt");
    // The branch's head and its counts since the base commit stay, and the inbox is for the base that moved.
    const behind = await c.message("inbox", (m) => counts(m).join() === "1,1,1");
    expect(git(workItem.worktree, "rev-parse", "HEAD").trim()).toBe(head);
    expect(behind.workItems[0]?.commits?.map((each) => each.subject)).toEqual(["add own.txt"]);
    git(workItem.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    // Three commits since the base commit: the branch's own, the base's and the merge. The base holds its own.
    await c.message("inbox", (m) => counts(m).join() === "2,0,3");
    git(repo, "merge", "--quiet", "--ff-only", branchOf(workItem));
    // The branch's head and its count stay, and the inbox is for the base that moved.
    await c.message("inbox", (m) => counts(m).join() === "0,0,3");
  });

  it("tells every client how far a work item's branch is ahead of a remote's branch: by its own commit, by none once a fetch brought that commit to the remote's branch, and by no count once a fetch pruned it", async () => {
    const { repo, origin, root } = clone();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead of the remote", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, which the remote later pulls.
    const workItem = await branchedByRename(c, (await c.message("workItemCreated")).workItem, 2);
    expect([workItem.baseBranch, workItem.aheadOfBase, workItem.behindBase]).toEqual(["origin/main", 0, 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.baseBranch, m.workItems[0]?.aheadOfBase, m.workItems[0]?.behindBase, m.workItems[0]?.newCommits].join();
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m) === "origin/main,1,0,1");
    git(origin, "pull", "--quiet", "--ff-only", repo, branchOf(workItem));
    git(repo, "fetch", "--quiet", "origin");
    await c.message("inbox", (m) => counts(m) === "origin/main,0,0,1");
    git(origin, "checkout", "--quiet", "-b", "renamed");
    git(origin, "branch", "--quiet", "-D", "main");
    git(repo, "fetch", "--quiet", "--prune", "origin");
    await c.message("inbox", (m) => counts(m) === "origin/main,,,1");
  });

  it("gives a work item cut from no branch, and one whose base branch is gone, no count of commits ahead and none behind", async () => {
    const { repo, root } = repository();
    git(repo, "checkout", "--quiet", "--detach");
    // No local branch and no remote: the repository has no default base.
    git(repo, "branch", "--quiet", "-D", "main");
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "From a commit", kind: "shell", cols: 80, rows: 24 });
    const detached = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    expect([detached.baseBranch, detached.aheadOfBase, detached.behindBase]).toEqual([null, null, null]);
    git(repo, "checkout", "--quiet", "-b", "feature");
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "From a feature", kind: "shell", cols: 80, rows: 24 });
    const cut = (await c.message("workItemCreated", (m) => m.requestId === 2)).workItem;
    expect([cut.baseBranch, cut.aheadOfBase, cut.behindBase]).toEqual(["feature", 0, 0]);
    commit(detached.worktree, "one.txt");
    git(repo, "checkout", "--quiet", "--detach");
    git(repo, "branch", "--quiet", "-D", "feature");
    const inbox = await c.message("inbox", (m) => m.workItems[1]?.aheadOfBase === null && m.workItems[0]?.newCommits === 1);
    expect(inbox.workItems.map((w) => [w.baseBranch, w.aheadOfBase, w.behindBase, w.newCommits])).toEqual([[null, null, null, 1], ["feature", null, null, 0]]);
  });

  it("lists the 20 newest of a work item's commits, beside the count of all of them", async () => {
    const made = repository();
    const { runDir, workItem } = await runFolderWithWorkItem(made, "Long");
    for (let n = 2; n <= 25; n++) git(workItem.worktree, "commit", "--quiet", "--allow-empty", "-m", `commit ${n}`);
    const { url } = await daemon({ runDir, worktreesRoot: made.root, readyWaitMs: 5000 });
    const listed = (await (await client(url)).message("ready")).workItems[0];
    expect(listed?.newCommits).toBe(25);
    expect(listed?.commits?.map((each) => each.subject)).toEqual(Array.from({ length: 20 }, (_, i) => `commit ${25 - i}`));
  });

  it("gives a work item whose branch is gone no count, no commits and no changes", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Removed", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, which the case then removes.
    const workItem = await branchedByRename(c, (await c.message("workItemCreated")).workItem, 2);
    commit(workItem.worktree, "one.txt");
    await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 1);
    git(repo, "worktree", "remove", "--force", workItem.worktree);
    git(repo, "branch", "--quiet", "-D", branchOf(workItem));
    const gone = await c.message("inbox", (m) => m.workItems[0]?.newCommits === null);
    // Nor a seal: what was read of the branch went with it, so the work item carries no `seal`.
    const { seal: _seal, ...read } = workItem;
    expect(gone.workItems).toEqual([{ ...read, aheadOfBase: null, behindBase: null, newCommits: null, commits: null, changes: null }]);
    expect("seal" in gone.workItems[0]!).toBe(false);
  });

  it("reads a work item with no branch yet at its worktree's HEAD: its commit there, which a tag holds, is one new commit, ahead of the base by one, with the file it changed and no seal, and no branch is made", async () => {
    const { c, worktree, lone, branches } = await daemonWithoutBranch({ commitPollMs: 20 });
    const before = branches();
    const read = await c.until(() => c.messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems : [])).find((item) => item.newCommits === 1 && item.seal !== undefined));
    expect(read).toMatchObject({
      branch: null,
      ownsBranch: false,
      aheadOfBase: 1,
      behindBase: 0,
      newCommits: 1,
      commits: [{ hash: git(worktree, "rev-parse", "--short", lone).trim(), subject: "add lone.txt" }],
      changes: { files: 1, added: 1, removed: 0, list: [{ path: "lone.txt", added: 1, removed: 0 }] },
      seal: null,
    });
    expect(branches()).toBe(before);
  });

  /** The first list that carries the work item number 1 with a branch. */
  const branched = (c: Awaited<ReturnType<typeof client>>) => c.message("inbox", (m) => typeof m.workItems.find((w) => w.id === 1)?.branch === "string").then((m) => m.workItems.find((w) => w.id === 1));

  it("makes the branch owlery/<slug of the title> at a commit made in the worktree of a work item with no branch yet, at the next read, puts the worktree on it, and keeps that Owlery made it", async () => {
    const { c, made, runDir, worktree } = await daemonWithoutBranch({ commitPollMs: 20 });
    const first = commitFile(worktree, "first.txt");
    expect(await branched(c)).toMatchObject({ branch: "owlery/no-branch-yet", ownsBranch: true });
    expect(git(worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/no-branch-yet");
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/no-branch-yet").trim()).toBe(first);
    const later = await daemon({ runDir, worktreesRoot: made.root });
    expect((await (await client(later.url)).message("ready")).workItems).toMatchObject([{ branch: "owlery/no-branch-yet", ownsBranch: true }]);
  });

  it("names the branch it makes after the worktree's folder where the work item's title leaves no slug", async () => {
    const { c, worktree } = await daemonWithoutBranch({ commitPollMs: 20 }, "?!");
    commitFile(worktree, "first.txt");
    expect((await branched(c))?.branch).toBe(`owlery/${basename(worktree)}`);
  });

  it("numbers the branch it makes -2 where a local branch bears the name the title gives, and leaves that branch as it was", async () => {
    const { c, made, worktree } = await daemonWithoutBranch({ commitPollMs: 20 });
    git(made.repo, "branch", "--quiet", "owlery/no-branch-yet", "main");
    const first = commitFile(worktree, "first.txt");
    expect((await branched(c))?.branch).toBe("owlery/no-branch-yet-2");
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/no-branch-yet-2").trim()).toBe(first);
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/no-branch-yet").trim()).toBe(git(made.repo, "rev-parse", "main").trim());
  });

  it("takes up the branch its worktree's HEAD names, as one Owlery did not make, and makes no branch of its own", async () => {
    const { c, worktree, branches } = await daemonWithoutBranch({ commitPollMs: 20 });
    git(worktree, "switch", "--quiet", "-c", "fix/x");
    expect(await branched(c)).toMatchObject({ branch: "fix/x", ownsBranch: false });
    expect(branches()).toBe("fix/x\nmain\n");
  });

  it("takes up the branch its worktree's HEAD names at the base commit, before any commit is made there", async () => {
    const { c, worktree, branches } = await daemonAtBase(false);
    git(worktree, "switch", "--quiet", "-c", "fix/x");
    expect(await branched(c)).toMatchObject({ branch: "fix/x", ownsBranch: false });
    expect(branches()).toBe("feature\nfix/x\nmain\n");
  });

  it("makes no branch at the base commit of a work item whose base branch was deleted, though no ref holds that commit then, and makes it at a commit made in the worktree after", async () => {
    const { c, made, worktree, branches } = await daemonAtBase(true);
    expect(branches()).toBe("main\n");
    // A read comes every 20 ms, so this wait holds a dozen of them.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(branches()).toBe("main\n");
    expect(c.messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems.map((w) => w.branch) : []))).not.toContainEqual(expect.any(String));
    const first = commitFile(worktree, "first.txt");
    expect(await branched(c)).toMatchObject({ branch: "owlery/no-branch-yet", ownsBranch: true });
    expect(git(made.repo, "rev-parse", "refs/heads/owlery/no-branch-yet").trim()).toBe(first);
  });

  it("makes no branch while a rebase is under way in the worktree and says why in the log, and makes it at a read after the rebase has ended", async () => {
    const said = logged();
    const { c, worktree, branches } = await daemonWithoutBranch({ commitPollMs: 20 });
    const before = branches();
    const marker = git(worktree, "rev-parse", "--path-format=absolute", "--git-path", "rebase-merge").trim();
    mkdirSync(marker);
    commitFile(worktree, "first.txt");
    await c.until(() => (said.some((line) => line.startsWith("the branch of work item 1 was not made:") && line.includes("cannot switch branch while rebasing")) ? true : undefined));
    expect(branches()).toBe(before);
    expect(c.messages.flatMap((m) => (m.type === "ready" || m.type === "inbox" ? m.workItems.map((w) => w.branch) : []))).not.toContainEqual(expect.any(String));
    rmSync(marker, { recursive: true });
    expect(await branched(c)).toMatchObject({ branch: "owlery/no-branch-yet", ownsBranch: true });
  });

  it("sends no inbox while the counts stay as they were", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Quiet", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, so the commit's read makes none and sends no inbox for one.
    const workItem = await branchedByRename(c, (await c.message("workItemCreated")).workItem, 2);
    c.messages.length = 0;
    await pause(200);
    commit(workItem.worktree, "one.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    // One for the commit alone, over ten intervals and more.
    expect(inboxes(c).map((m) => m.workItems[0]?.newCommits)).toEqual([1]);
  });

  it("reads no count while no client is connected, and reads them at the next hello, so its `ready` carries the commits made meanwhile", async () => {
    const { repo, root, base } = repository();
    // The wait is long, so that the first run of the watched git, which the system checks, ends inside it.
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20, readyWaitMs: 5000 });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "createWorkItem", requestId: 1, repo, title: "Unwatched", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await first.message("workItemCreated");
    first.socket.close();
    await pause(100);
    const watched = watchedGit(base);
    commit(workItem.worktree, "one.txt");
    expect(watched.calls("commit")).toBe(1);
    // Ten intervals and more with nobody connected, and the pane still alive.
    await pause(200);
    expect(watched.calls("rev-list")).toBe(0);
    const second = await client(url);
    expect((await second.message("ready")).workItems[0]?.newCommits).toBe(1);
  });

  it("reads the counts between two hellos at most once per interval, and tells the other clients, in an inbox, of a count a hello's read changed", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 60_000 });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "createWorkItem", requestId: 1, repo, title: "Read once", kind: "shell", cols: 80, rows: 24 });
    // A rename gives the work item its branch, so a read of the commit makes none.
    const workItem = await branchedByRename(first, (await first.message("workItemCreated")).workItem, 2);
    first.messages.length = 0;
    commit(workItem.worktree, "one.txt");
    await pause(300);
    // No inbox: the interval is not over, so nothing read the commit.
    expect(inboxes(first)).toEqual([]);
    const second = await client(url);
    expect((await second.message("ready")).workItems[0]?.newCommits).toBe(1);
    await first.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    await pause(100);
    // The client that said hello has the count in its `ready`, and is sent no inbox for it, before or after.
    expect(second.messages.map((m) => m.type)).toEqual(["ready"]);
  });

  it("sends `ready` with the counts it holds where the read takes longer than its wait, and the read's counts in an inbox after it", async () => {
    const made = repository();
    const { runDir } = await runFolderWithWorkItem(made, "Slow to count");
    // Each git call waits half a second, ten times the daemon's wait; a count reads the base's ref, then counts.
    watchedGit(made.base, 0.5);
    const { url } = await daemon({ runDir, worktreesRoot: made.root, readyWaitMs: 50, commitPollMs: 60_000 });
    const c = await client(url);
    // A daemon that just started holds no count.
    expect((await c.message("ready")).workItems[0]?.newCommits).toBeNull();
    expect((await c.message("inbox")).workItems[0]?.newCommits).toBe(1);
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);
  });

  it("handles nothing of a client that left before its `ready`: a pane it asked for is not started", async () => {
    const made = repository();
    const { runDir } = await runFolderWithWorkItem(made, "Left early");
    // The read takes long enough for the client to ask and leave before it ends, and the wait is longer still.
    const watched = watchedGit(made.base, 0.2);
    const { url } = await daemon({ runDir, worktreesRoot: made.root, readyWaitMs: 5000 });
    const c = await client(url);
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    c.socket.close();
    await c.until(() => c.closed());
    watched.stop();
    // The hello of the next client is answered after the read the first one started.
    const ready = await (await client(url)).message("ready");
    expect(ready.workItems[0]?.newCommits).toBe(1);
    expect(ready.sessions).toEqual([]);
    expect(c.messages).toEqual([]);
  });

  it("gives a work item from before the base commit was recorded no count and no `seal`, beside one that has them", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const before = await branchedWorktree({ folder: repo, title: "Before", root });
    const after = await branchedWorktree({ folder: repo, title: "After", root });
    commit(before.worktree, "before.txt");
    commit(after.worktree, "after.txt");
    const { baseCommit: _none, ...old } = before;
    writeFileSync(join(runDir, "work-items.json"), JSON.stringify([{ id: 1, title: "Before", createdAt: 1, ...old }, { id: 2, title: "After", createdAt: 2, ...after }]));
    const { url } = await daemon({ runDir, worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    const ready = await c.message("ready");
    expect(ready.workItems.map((w) => [w.baseCommit, w.newCommits, w.commits?.length ?? null, w.changes?.files ?? null])).toEqual([[null, null, null, null], [after.baseCommit, 1, 1, 1]]);
    expect(ready.workItems.map((w) => ("seal" in w ? w.seal : "none"))).toEqual(["none", null]);
    commit(after.worktree, "again.txt");
    const inbox = await c.message("inbox", (m) => m.workItems[1]?.newCommits === 2);
    expect(inbox.workItems[0]).toMatchObject({ id: 1, baseCommit: null, newCommits: null, commits: null, changes: null });
    expect("seal" in inbox.workItems[0]!).toBe(false);
  });
});

// A pane that prints nothing, so a client's messages are the daemon's answers and its lists alone.
const silent = () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} });

/** A daemon on a run folder of a temporary repository, a client of it, and a work item the client created under each title, each with the shell pane its creation opened and given its branch by a rename (`branchedByRename`). */
async function withWorkItems(titles: readonly string[], options: Partial<DaemonOptions> = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const runDir = join(made.base, "run");
  mkdirSync(runDir, { recursive: true });
  const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, commandFor: silent, ...options });
  const c = await client(url);
  await c.message("ready");
  const created = [];
  for (const [index, title] of titles.entries()) {
    c.send({ type: "createWorkItem", requestId: 100 + index, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 });
    const answer = await c.message("workItemCreated", (m) => m.requestId === 100 + index);
    created.push({ workItem: await branchedByRename(c, answer.workItem, 200 + index), session: answer.session });
  }
  c.messages.length = 0;
  return { d, url, c, made, runDir, workItems: created.map((m) => m.workItem), sessions: created.map((m) => m.session) };
}

/** Sends a start the daemon refuses, and waits for the refusal: every message the daemon sent for what was asked before has then arrived. */
let refused = 900;
async function settled(c: Awaited<ReturnType<typeof client>>): Promise<void> {
  const requestId = refused++;
  c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId, workItemId: 999 });
  await c.message("error", (m) => m.requestId === requestId);
}

/** Makes a work item's directory in its worktree, uncommitted: the records root with its marker, and a `routing.md` under `threads/<name>` that names the work item's branch. Gives the directory. */
function withDirectory(workItem: { worktree: string; branch: string | null }, name = "1-item"): string {
  const directory = join(workItem.worktree, "seal", "threads", name);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(workItem.worktree, "seal", "README.md"), `${MARKER}\n`);
  writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${branchOf(workItem)} |\n`);
  return directory;
}

/** The record of a work item's directory as the reader reads its file, or null where no file stands. */
function recordIn(directory: string): DecisionRecord | null {
  const file = join(directory, RECORD_FILE);
  return existsSync(file) ? readDecisionRecord(readFileSync(file, "utf8")) : null;
}

/** The file of a work item's record as bytes, or null where none stands. */
const bytesIn = (directory: string): string | null => (existsSync(join(directory, RECORD_FILE)) ? readFileSync(join(directory, RECORD_FILE), "base64") : null);

/** What the daemon writes to its log from here until the case ends, a line for each call. */
function logged(): string[] {
  const said: string[] = [];
  const error = console.error;
  console.error = (...parts: unknown[]) => void said.push(parts.join(" "));
  cleanups.push(() => {
    console.error = error;
  });
  return said;
}

type Lists = { workItems: WorkItem[]; archived: WorkItem[] };
const itemOf = (lists: Lists, id: number): WorkItem | undefined => [...lists.workItems, ...lists.archived].find((w) => w.id === id);
describe("the decisions made without asking", () => {
  const DEFAULT = { kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default." } as const;
  const ROUTE = { kind: "route", says: "Build it with no framer.", grounds: "The issue names one file, apps/desktop/src/renderer/view.ts." } as const;
  /** A decision as the daemon sends one that stands as made. */
  const made = (id: number, decision: { kind: string; says: string; grounds: string }, since: number, by: string | null = null) => ({ id, ...decision, by, state: "decided", reversal: null, landed: null, since });

  it("writes a decision into the record of one work item and tells every client: that work item holds it with the id 1, the texts given and the daemon's time, the other holds none, no session changes, and the other's headless session finishes; a second decision takes the id 2", async () => {
    const { d, url, c, workItems, sessions } = await withWorkItems(["Decided for", "Goes on"], { now: () => 1234, roleAdapter: fakeAdapter({ delayMs: 100 }) });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    const other = await client(url);
    await other.message("ready");
    const headless = await d.startRoleSession(b.id, "Still there?", PROOFER);
    await c.message("headless", (m) => m.headless.id === headless.id);
    c.messages.length = 0;
    other.messages.length = 0;
    const decision = d.decided(a.id, DEFAULT);
    // It returned at once: the session it left alone is still working.
    expect(decision).toEqual(made(1, DEFAULT, 1234));
    expect(recordIn(directory)).toMatchObject({ decisions: [{ id: 1, kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds, by: null, state: { is: "decided" } }], questions: [], refusals: [], notices: [] });
    for (const told of [c, other]) {
      const inbox = await told.message("inbox");
      expect(inbox.workItems).toEqual([{ ...a, decisions: [decision] }, b]);
      expect(inbox.sessions).toEqual(sessions);
      // Nothing but the lists is sent for it, and no headless session was told as changed by it.
      expect(told.messages.filter((m) => m.type !== "headless").map((m) => m.type)).toEqual(["inbox"]);
    }
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state !== "working")).headless).toMatchObject({ workItemId: b.id, state: "finished", stopped: null });
    expect(d.decided(a.id, { ...ROUTE, by: "orchestrator" })).toEqual(made(2, ROUTE, 1234, "orchestrator"));
    const later = await (await client(url)).message("ready");
    expect([itemOf(later, a.id)?.decisions, itemOf(later, b.id)?.decisions, later.sessions]).toEqual([[decision, made(2, ROUTE, 1234, "orchestrator")], [], sessions]);
    expect(recordIn(directory)?.decisions.map(({ id, by }) => [id, by])).toEqual([[1, null], [2, "orchestrator"]]);
  });

  it("writes what was decided, its grounds and who decided without the white space at their ends, 2000 characters of each at most and each on one line, and takes each of the four kinds", async () => {
    const { d, workItems } = await withWorkItems(["Decided for"], { now: () => 5 });
    const id = workItems[0]!.id;
    withDirectory(workItems[0]!);
    expect(d.decided(id, { kind: "scope", says: `  ${"가".repeat(2001)}\n`, grounds: `\t${"g".repeat(1999)}😀 `, by: ` ${"b".repeat(2001)}\n` })).toEqual({ ...made(1, { kind: "scope", says: "가".repeat(2000), grounds: "g".repeat(1999) }, 5), by: "b".repeat(2000) });
    expect(d.decided(id, { ...DEFAULT, says: "Start\r\nfrom main." })?.says).toBe("Start from main.");
    expect((["route", "default", "answered"] as const).map((kind) => d.decided(id, { ...DEFAULT, kind })?.kind)).toEqual(["route", "default", "answered"]);
  });

  it("writes nothing and tells no client for a work item it does not keep, one whose worktree holds no directory, one whose worktree holds two directories that name its branch, a kind that is none of the four, what was decided or grounds that are empty or no text, and who decided that is empty or no text", async () => {
    const { d, c, url, runDir, workItems } = await withWorkItems(["Decided for", "No directory", "Two directories"]);
    const [a, none, two] = workItems as [(typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    const twice = [withDirectory(two, "1-first"), withDirectory(two, "2-second")];
    const loose = d.decided.bind(d) as (workItemId: unknown, decision: unknown) => unknown;
    const said = logged();
    expect(loose(99, DEFAULT)).toBeUndefined();
    expect(loose(String(a.id), DEFAULT)).toBeUndefined();
    expect(loose(none.id, DEFAULT)).toBeUndefined();
    expect(loose(two.id, DEFAULT)).toBeUndefined();
    for (const decision of [{ ...DEFAULT, kind: "guess" }, { ...DEFAULT, kind: undefined }, { ...DEFAULT, says: "" }, { ...DEFAULT, says: " \n\t" }, { ...DEFAULT, says: 3 }, { ...DEFAULT, grounds: "  " }, { ...DEFAULT, grounds: null }, { ...DEFAULT, by: " " }, { ...DEFAULT, by: 3 }, null]) {
      expect(loose(a.id, decision)).toBeUndefined();
    }
    // An inbox for any of them would have arrived before the refusal of a start sent after them.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["error"]);
    expect([directory, ...twice].map(bytesIn)).toEqual([null, null, null]);
    // Each was refused before the record's writer was asked, so the log holds no line of a write that failed.
    expect(said).toEqual([]);
    expect(readdirSync(join(none.worktree)).includes("seal")).toBe(false);
    expect(["decisions.json", "asked.json"].map((file) => existsSync(join(runDir, file)))).toEqual([false, false]);
    expect((await (await client(url)).message("ready")).workItems.map(({ decisions, questions, unread }) => ({ decisions, questions, unread }))).toEqual([NO_RECORD, NO_RECORD, NO_RECORD]);
    // The call as the refusals above would have it taken, so the method is the one under test.
    expect(loose(a.id, DEFAULT)).toMatchObject({ id: 1 });
  });

  it("reads the record as the store: a second daemon on the run folder lists two decisions, one reversed, and an open question as the file holds them, and the run folder holds neither `decisions.json` nor `asked.json`; a block written into the file by hand, uncommitted, arrives in an inbox after the next pass; and a block the reader refuses is sent as unread with its line and the reader's reason, the blocks around it listed", async () => {
    const { d, c, made: repository, runDir, workItems } = await withWorkItems(["Recorded"], { now: () => 1000 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const file = join(directory, RECORD_FILE);
    d.decided(a.id, ROUTE);
    d.decided(a.id, DEFAULT);
    d.park(a.id, { by: "sealer", questions: [{ asks: "May it push?", grounds: "A push needs the person's approval." }] });
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "Frame it first." });
    await c.message("done", (m) => m.requestId === 1);
    await d.close();

    const later = await daemon({ runDir, worktreesRoot: repository.root, now: () => 5000, commitPollMs: 30 });
    const lc = await client(later.url);
    const ready = await lc.message("ready");
    const held = [{ ...made(1, ROUTE, 1000), state: "reversed", reversal: "Frame it first." }, made(2, DEFAULT, 1000)];
    const question = { id: 3, asks: "May it push?", grounds: "A push needs the person's approval.", by: "sealer", options: [], default: null, answer: null, since: 1000 };
    expect(itemOf(ready, a.id)).toMatchObject({ decisions: held, questions: [question], unread: [] });
    expect(["decisions.json", "asked.json"].map((name) => existsSync(join(runDir, name)))).toEqual([false, false]);
    expect(git(a.worktree, "status", "--porcelain", "--", "seal")).toContain("seal/");

    // A stage writes a block without the daemon's method: the next pass reads it.
    writeFileSync(file, withDecision(readFileSync(file, "utf8"), { kind: "scope", decided: "Leave the phone out.", grounds: "docs/roadmap.md, milestone 2." }));
    const inbox = await lc.message("inbox", (m) => itemOf(m, a.id)?.decisions.length === 3);
    expect(itemOf(inbox, a.id)?.decisions.at(-1)).toEqual(made(4, { kind: "scope", says: "Leave the phone out.", grounds: "docs/roadmap.md, milestone 2." }, 5000));

    // A block with a blank line inside is refused at that line. The blocks around it are still read, and the next block takes an id above the refused one's.
    const before = readFileSync(file, "utf8");
    const fence = "```";
    const broken = `${fence}seal\ndecision: 5 default\n\ndecided: x\ngrounds: y\nstate: decided\n${fence}\n`;
    // The text ends with a line end, so its count of lines is one under the split's, and the broken block opens after one blank line.
    const opener = before.split("\n").length + 1;
    writeFileSync(file, withDecision(`${before}\n${broken}`, { kind: "answered", decided: "The tree answers it.", grounds: "docs/product.md." }));
    const after = await lc.message("inbox", (m) => (itemOf(m, a.id)?.unread.length ?? 0) > 0);
    expect(itemOf(after, a.id)?.unread).toEqual([{ line: opener + 2, why: "a blank line inside a `seal` block: its lines are fields, one after another, and the block is not read past it" }]);
    expect(itemOf(after, a.id)?.decisions.map(({ id, kind }) => [id, kind])).toEqual([[1, "route"], [2, "default"], [4, "scope"], [6, "answered"]]);
    expect(itemOf(after, a.id)?.questions).toEqual([question]);
    // A pass that reads the record as it read it last sends nothing.
    await settled(lc);
    lc.messages.length = 0;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(lc.messages).toEqual([]);
  });

  it("sends a fence that opens like a `seal` block and is not one as unread, at its line, beside the refusals in the order of the file", async () => {
    const { d, c, workItems } = await withWorkItems(["Noticed"], { now: () => 1, commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const fence = "```";
    writeFileSync(join(directory, RECORD_FILE), `${fence}seal x\ndecision: 1 default\n${fence}\n\n${fence}seal\n${fence}\n`);
    const inbox = await c.message("inbox", (m) => (itemOf(m, a.id)?.unread.length ?? 0) > 0);
    expect(itemOf(inbox, a.id)?.unread.map(({ line, why }) => [line, why.slice(0, 22)])).toEqual([[1, "not read: ````seal x` "], [5, "an empty `seal` block:"]]);
    expect(itemOf(inbox, a.id)?.decisions).toEqual([]);
    // Nothing is decided on either: the next decision is written, and both lines stay named.
    expect(d.decided(a.id, DEFAULT)).toMatchObject({ id: 1 });
  });

  it("reverses a decision at a `reverseDecision`: the block reads `reversed` with the message as typed, the answer comes before the inbox that carries it with a new time, and a second reversal, an id that is a question's, an id the record does not hold, a message of white space, a work item it does not keep and one with no directory are each refused with the file byte for byte as it stood and no inbox after", async () => {
    let clock = 1000;
    const { d, c, url, workItems } = await withWorkItems(["Decided for", "Another", "No directory"], { now: () => clock });
    const [a, b, none] = workItems as [(typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0]];
    const directories = [withDirectory(a), withDirectory(b)] as const;
    const first = d.decided(a.id, DEFAULT)!;
    const second = d.decided(b.id, ROUTE)!;
    d.park(b.id, { questions: [{ asks: "May it push?", grounds: "A push needs the person's approval." }] });
    await c.message("inbox", (m) => itemOf(m, b.id)?.questions.length === 1);
    const other = await client(url);
    await other.message("ready");
    c.messages.length = 0;
    clock = 2000;
    const typed = "기본값 말고 main에서 시작해 주세요";
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: first.id, message: `  ${typed}\n` });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 1 });
    const reversed = { ...first, state: "reversed", reversal: typed, since: 2000 };
    expect([itemOf(inbox, a.id)?.decisions, itemOf(inbox, b.id)?.decisions]).toEqual([[reversed], [second]]);
    expect(recordIn(directories[0])?.decisions.map(({ state }) => state)).toEqual([{ is: "reversed", message: typed }]);
    // Every client is told, and the one that asked alone is answered.
    expect(itemOf(await other.message("inbox"), a.id)?.decisions).toEqual([reversed]);
    expect(other.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);

    c.messages.length = 0;
    clock = 3000;
    const bytes = directories.map(bytesIn);
    const refusals = [
      [2, { workItemId: a.id, decisionId: first.id, message: "again" }, "decision 1 is reversed, and only a decision that stands decided is reversed"],
      [3, { workItemId: b.id, decisionId: 2, message: "a question's id" }, "the record holds no decision 2"],
      [4, { workItemId: b.id, decisionId: 9, message: "of none" }, "the record holds no decision 9"],
      [5, { workItemId: b.id, decisionId: second.id, message: " \n\t" }, "Say why the decision is reversed."],
      [6, { workItemId: 99, decisionId: second.id, message: "nowhere" }, "no work item 99"],
      [7, { workItemId: none.id, decisionId: 1, message: "no record" }, `Work item ${none.id} has no record of decisions.`],
      [8, { workItemId: b.id, decisionId: second.id, message: 3 }, "a reversal names a work item, a decision of it and a message"],
      [9, { workItemId: b.id, decisionId: String(second.id), message: "no id" }, "a reversal names a work item, a decision of it and a message"],
    ] as const;
    for (const [requestId, fields, message] of refusals) {
      c.send({ type: "reverseDecision", requestId, ...fields });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message });
    }
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(refusals.map(() => "error").concat("error"));
    expect(directories.map(bytesIn)).toEqual(bytes);
    const ready = await (await client(url)).message("ready");
    expect([itemOf(ready, a.id)?.decisions, itemOf(ready, b.id)?.decisions]).toEqual([[reversed], [second]]);
    // The message as the refusals above would have it taken, so the case is the one under test.
    c.send({ type: "reverseDecision", requestId: 20, workItemId: b.id, decisionId: second.id, message: "가".repeat(2001) });
    expect(await c.message("done", (m) => m.requestId === 20)).toEqual({ type: "done", requestId: 20 });
    // A message is cut as every text the daemon writes is.
    expect(recordIn(directories[1])?.decisions[0]?.state).toEqual({ is: "reversed", message: "가".repeat(2000) });
  });

  it("sends each decision as its block stands: an applied one with its commit and a carried one with its home, each with the person's message", async () => {
    const { c, workItems } = await withWorkItems(["Taken in"], { now: () => 1, commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    let text = withDecision(withDecision("", { kind: "default", decided: "Start from main.", grounds: "The default base.", by: "orchestrator" }), { kind: "scope", decided: "Leave the phone out.", grounds: "docs/roadmap.md." });
    text = withCarried(withReversal(withApplied(withReversal(text, 1, "Start from the release branch."), 1, "abc1234"), 2, "Take the phone in."), 2, "#53");
    writeFileSync(join(directory, RECORD_FILE), text);
    const inbox = await c.message("inbox", (m) => itemOf(m, a.id)?.decisions.length === 2);
    expect(itemOf(inbox, a.id)?.decisions).toEqual([
      { id: 1, kind: "default", says: "Start from main.", grounds: "The default base.", by: "orchestrator", state: "applied", reversal: "Start from the release branch.", landed: "abc1234", since: 1 },
      { id: 2, kind: "scope", says: "Leave the phone out.", grounds: "docs/roadmap.md.", by: null, state: "carried", reversal: "Take the phone in.", landed: "#53", since: 1 },
    ]);
  });

  it("keeps each block's time as its own: a later pass and a second daemon send the time of the first read, a reversal gives the decision the time of that read and leaves the question's, a block that leaves the file leaves `record-times.json`, and a daemon that starts with the file removed gives every block its start's time", async () => {
    let clock = 1000;
    const { d, c, made: repository, runDir, workItems } = await withWorkItems(["Timed"], { now: () => clock, commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const file = join(directory, RECORD_FILE);
    const times = (): unknown => JSON.parse(readFileSync(join(runDir, "record-times.json"), "utf8"));
    d.decided(a.id, DEFAULT);
    d.park(a.id, { questions: [{ asks: "May it push?", grounds: "A push needs the person's approval." }] });
    expect(times()).toEqual({ workItems: { [a.id]: { 1: { state: "decided", since: 1000 }, 2: { state: "open", since: 1000 } } } });
    expect(statSync(join(runDir, "record-times.json")).mode & 0o777).toBe(0o600);
    // A pass at a later clock reads both again, and neither time moves. The block a pass at that clock finds first is the mark that it ran.
    clock = 2000;
    writeFileSync(file, withDecision(readFileSync(file, "utf8"), { kind: "scope", decided: "Leave the phone out.", grounds: "docs/roadmap.md." }));
    const passed = await c.message("inbox", (m) => itemOf(m, a.id)?.decisions.length === 2);
    expect([itemOf(passed, a.id)?.decisions.map(({ since }) => since), itemOf(passed, a.id)?.questions.map(({ since }) => since)]).toEqual([[1000, 2000], [1000]]);

    clock = 3000;
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    await c.message("done", (m) => m.requestId === 1);
    const reversed = await c.message("inbox", (m) => itemOf(m, a.id)?.decisions[0]?.state === "reversed");
    expect([itemOf(reversed, a.id)?.decisions.map(({ since }) => since), itemOf(reversed, a.id)?.questions.map(({ since }) => since)]).toEqual([[3000, 2000], [1000]]);
    await d.close();

    clock = 4000;
    const second = await daemon({ runDir, worktreesRoot: repository.root, now: () => clock, commitPollMs: 30 });
    const sc = await client(second.url);
    const ready = await sc.message("ready");
    expect([itemOf(ready, a.id)?.decisions.map(({ since }) => since), itemOf(ready, a.id)?.questions.map(({ since }) => since)]).toEqual([[3000, 2000], [1000]]);
    // The question's block leaves the file: a record of the two decisions alone is put in its place.
    const kept = readFileSync(file, "utf8");
    const from = kept.indexOf("```seal\nquestion:");
    const until = kept.indexOf("```\n", from + 3) + 4;
    writeFileSync(file, kept.slice(0, from) + kept.slice(until));
    await sc.message("inbox", (m) => itemOf(m, a.id)?.questions.length === 0);
    expect(times()).toEqual({ workItems: { [a.id]: { 1: { state: "reversed", since: 3000 }, 3: { state: "decided", since: 2000 } } } });
    await second.daemon.close();

    rmSync(join(runDir, "record-times.json"));
    clock = 5000;
    const third = await daemon({ runDir, worktreesRoot: repository.root, now: () => clock });
    const again = await (await client(third.url)).message("ready");
    expect(itemOf(again, a.id)?.decisions.map(({ id, since }) => [id, since])).toEqual([[1, 5000], [3, 5000]]);
    expect(times()).toEqual({ workItems: { [a.id]: { 1: { state: "reversed", since: 5000 }, 3: { state: "decided", since: 5000 } } } });
  });

  it("lists an archived work item under `archived` with what its record holds, the blocks written since the last pass among them, reads it again at its own start, and takes a work item's times out of `record-times.json` at its delete and at its repository's removal", async () => {
    const { d, c, made: repository, runDir, workItems, sessions } = await withWorkItems(["Archived", "Deleted", "Removed"], { now: () => 9 });
    const [archived, deleted, removed] = workItems as [(typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0]];
    const times = (): { workItems: Record<string, unknown> } => JSON.parse(readFileSync(join(runDir, "record-times.json"), "utf8")) as { workItems: Record<string, unknown> };
    const directory = withDirectory(archived);
    for (const each of [deleted, removed]) withDirectory(each);
    const kept = d.decided(archived.id, DEFAULT)!;
    d.decided(deleted.id, ROUTE);
    d.decided(removed.id, ROUTE);
    const [question] = d.park(archived.id, { questions: [{ asks: "May it push?", grounds: "A push needs the person's approval." }] })!;
    // A block a stage wrote after the daemon's last read is read at the archive, since no pass reads an archived work item.
    const file = join(directory, RECORD_FILE);
    writeFileSync(file, withDecision(readFileSync(file, "utf8"), { kind: "scope", decided: "Leave the phone out.", grounds: "docs/roadmap.md." }));
    c.send({ type: "archiveWorkItem", requestId: 1, id: archived.id, running: { panes: [sessions[0]!.id], headless: [] } });
    const inbox = await c.message("inbox", (m) => m.archived.length === 1);
    const late = made(3, { kind: "scope", says: "Leave the phone out.", grounds: "docs/roadmap.md." }, 9);
    expect(inbox.archived[0]).toMatchObject({ id: archived.id, decisions: [kept, late], questions: [question] });
    expect(inbox.workItems.map(({ id }) => id)).toEqual([deleted.id, removed.id]);
    expect(Object.keys(times().workItems)).toEqual([String(archived.id), String(deleted.id), String(removed.id)]);

    c.send({ type: "readLoss", requestId: 2, id: deleted.id });
    const { loss } = await c.message("workItemLoss", (m) => m.requestId === 2);
    c.send({ type: "deleteWorkItem", requestId: 3, id: deleted.id, stamp: loss.stamp, force: true, running: { panes: [sessions[1]!.id], headless: [] } });
    await c.message("done", (m) => m.requestId === 3);
    expect(Object.keys(times().workItems)).toEqual([String(archived.id), String(removed.id)]);
    expect(d.decided(deleted.id, DEFAULT)).toBeUndefined();
    await d.close();

    // A daemon that starts reads the archived work item's record, which no pass of it reads.
    writeFileSync(file, withDecision(readFileSync(file, "utf8"), { kind: "answered", decided: "The tree answers it.", grounds: "docs/product.md." }));
    const later = await daemon({ runDir, worktreesRoot: repository.root, commandFor: silent, now: () => 20 });
    const lc = await client(later.url);
    const ready = await lc.message("ready");
    expect(ready.archived[0]).toMatchObject({ id: archived.id, decisions: [kept, late, made(4, { kind: "answered", says: "The tree answers it.", grounds: "docs/product.md." }, 20)], questions: [question] });

    lc.send({ type: "removeRepository", requestId: 4, id: 1, workItems: [archived.id, removed.id], running: NONE_RUNNING });
    await lc.message("done", (m) => m.requestId === 4);
    expect(times()).toEqual({ workItems: {} });
  });

  it("leaves `record-times.json` at its start as it stood, the entries under an id its repositories do not hold among them, and drops what stands under an id, and under no other, where a new work item is given that id", async () => {
    const repository = temporaryRepository();
    cleanups.push(repository.remove);
    const runDir = join(repository.base, "run");
    mkdirSync(runDir);
    // The entries a list of repositories that was lost left behind: under the id the first work item made will take, and under another.
    const stray = JSON.stringify({ workItems: { 1: { 1: { state: "decided", since: 5 } }, 99: { 1: { state: "open", since: 6 } } } });
    writeFileSync(join(runDir, "record-times.json"), stray);
    const { url } = await daemon({ runDir, worktreesRoot: repository.root, commandFor: silent, now: () => 11, commitPollMs: 30 });
    const c = await client(url);
    await c.message("ready");
    expect(readFileSync(join(runDir, "record-times.json"), "utf8")).toBe(stray);
    c.send({ type: "createWorkItem", requestId: 1, repo: repository.repo, title: "Made anew", kind: "shell", cols: 80, rows: 24 });
    const next = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    expect(next).toMatchObject({ id: 1, ...NO_RECORD });
    // A record whose first block has the id and the state of the stray entry: its time is this daemon's, not the entry's. Its routing names the branch a rename gives the work item.
    const directory = withDirectory(await branchedByRename(c, next, 2));
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: "Start from main.", grounds: "The default base." }));
    const inbox = await c.message("inbox", (m) => itemOf(m, 1)?.decisions.length === 1);
    expect(itemOf(inbox, 1)?.decisions[0]?.since).toBe(11);
    expect(JSON.parse(readFileSync(join(runDir, "record-times.json"), "utf8"))).toEqual({ workItems: { 1: { 1: { state: "decided", since: 11 } }, 99: { 1: { state: "open", since: 6 } } } });
  });

  it("stays up where a record cannot be read or written: the work item is sent with one unread line that says why, a decision and a park return nothing, a reversal is refused with what refused it, and its log says so; and holds the times in memory where `record-times.json` cannot be written", async () => {
    const { d, c, runDir, workItems } = await withWorkItems(["Unreadable", "Times unwritten"], { now: () => 7, commitPollMs: 30 });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    const said = logged();
    // A folder stands where the record goes, so it is neither read nor replaced.
    mkdirSync(join(directory, RECORD_FILE));
    const inbox = await c.message("inbox", (m) => (itemOf(m, a.id)?.unread.length ?? 0) > 0);
    expect(itemOf(inbox, a.id)).toMatchObject({ decisions: [], questions: [], unread: [{ line: 1, why: "the record cannot be read: decisions.md is not a plain file" }] });
    expect(d.decided(a.id, DEFAULT)).toBeUndefined();
    expect(d.park(a.id, { questions: [{ asks: "May it push?", grounds: "It needs an approval." }] })).toBeUndefined();
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    expect((await c.message("error", (m) => m.requestId === 1)).message).toBe("decisions.md is not a plain file");
    expect(said.filter((line) => line === "the record was not written: decisions.md is not a plain file")).toHaveLength(2);

    mkdirSync(join(runDir, "record-times.json"));
    expect(d.decided(b.id, DEFAULT)).toMatchObject({ id: 1, since: 7 });
    expect(said.filter((line) => line.startsWith("the times of the records were not written: "))).toHaveLength(1);
    expect(d.decided(b.id, ROUTE)).toMatchObject({ id: 2, since: 7 });
  });

  it("reads a record that is a link as one unread line that says so, and lists nothing of the file the link leads to; a reversal of it is refused with the same words, and the link stays a link to a file that reads as it did", async () => {
    const { c, made: repository, workItems } = await withWorkItems(["Linked"], { commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    // A file outside the worktree that reads as a record with one decision.
    const outside = join(repository.base, "outside.md");
    const text = withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds });
    writeFileSync(outside, text);
    symlinkSync(outside, join(directory, RECORD_FILE));
    const refusal = "decisions.md is a link, and Owlery reads it only as a file of its own";
    const inbox = await c.message("inbox", (m) => (itemOf(m, a.id)?.unread.length ?? 0) + (itemOf(m, a.id)?.decisions.length ?? 0) > 0);
    expect(itemOf(inbox, a.id)).toMatchObject({ decisions: [], questions: [], unread: [{ line: 1, why: `the record cannot be read: ${refusal}` }] });
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    expect((await c.message("error", (m) => m.requestId === 1)).message).toBe(refusal);
    expect([lstatSync(join(directory, RECORD_FILE)).isSymbolicLink(), readFileSync(outside, "utf8")]).toEqual([true, text]);
  });
});

describe("the questions a work item is parked with", () => {
  const BASE = { asks: "Which base does the branch start from?", grounds: "No document names the base of a hotfix.", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release/v0.0.2", implies: "It merges after the release." }], default: "main" };
  const FREE = { asks: "May the session push to the remote?", grounds: "A push needs the person's approval." };
  const ASKING = { by: "sealer", questions: [BASE, FREE] };
  /** The two questions of `ASKING` as the daemon sends them open, numbered from `first`. */
  const open = (since: number, first = 1) => [
    { id: first, ...BASE, by: "sealer", answer: null, since },
    { id: first + 1, ...FREE, by: "sealer", options: [], default: null, answer: null, since },
  ];
  const TYPED = "둘 다 아니고, 세 번째 방법으로";

  it("parks one work item with its questions as open blocks and tells every client, and holds nothing else: the other work item holds none and its headless session finishes, a pane starts in each of the two, a headless session starts in the parked one, a third work item is created, and a second park of the parked one adds its question", async () => {
    const { d, url, c, made, workItems, sessions } = await withWorkItems(["Parked", "Goes on"], { now: () => 1234, roleAdapter: fakeAdapter({ delayMs: 150 }) });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    const other = await client(url);
    await other.message("ready");
    const headless = await d.startRoleSession(b.id, "Still there?", PROOFER);
    await c.message("headless", (m) => m.headless.id === headless.id);
    c.messages.length = 0;
    other.messages.length = 0;
    const questions = d.park(a.id, ASKING);
    expect(questions).toEqual(open(1234));
    expect(recordIn(directory)).toMatchObject({ decisions: [], questions: [{ id: 1, asks: BASE.asks, grounds: BASE.grounds, by: "sealer", options: BASE.options, default: "main", state: { is: "open" } }, { id: 2, asks: FREE.asks, by: "sealer", options: [], default: null, state: { is: "open" } }], refusals: [] });
    for (const told of [c, other]) {
      const inbox = await told.message("inbox");
      expect(inbox.workItems).toEqual([{ ...a, questions }, b]);
      expect(inbox.sessions).toEqual(sessions);
      // Nothing but the lists is sent for it.
      expect(told.messages.filter((m) => m.type !== "headless").map((m) => m.type)).toEqual(["inbox"]);
    }
    // While the work item is parked, every request is served as before, in it and beside it.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: b.id });
    expect((await c.message("started", (m) => m.requestId === 2)).session).toMatchObject({ workItemId: b.id, alive: true });
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: a.id });
    expect((await c.message("started", (m) => m.requestId === 3)).session).toMatchObject({ workItemId: a.id, alive: true });
    expect(await d.startRoleSession(a.id, "And in the parked one?", PROOFER)).toMatchObject({ workItemId: a.id, state: "working" });
    c.send({ type: "createWorkItem", requestId: 5, repo: made.repo, title: "A third", kind: "shell", cols: 80, rows: 24 });
    const third = (await c.message("workItemCreated", (m) => m.requestId === 5)).workItem;
    expect(third.questions).toEqual([]);
    // The session that was working when the park returned finishes, after the lists that carry the park.
    const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state !== "working");
    expect(finished.headless).toMatchObject({ workItemId: b.id, state: "finished", stopped: null });
    expect(c.messages.findIndex((m) => m.type === "inbox")).toBeLessThan(c.messages.indexOf(finished));
    // A park of a work item that is already parked is not refused: its question is a third open block.
    const more = d.park(a.id, { questions: [{ asks: "And the credential?", grounds: "No session holds the token." }] });
    expect(more).toEqual([{ id: 3, asks: "And the credential?", grounds: "No session holds the token.", by: null, options: [], default: null, answer: null, since: 1234 }]);
    const later = await (await client(url)).message("ready");
    expect([itemOf(later, a.id)?.questions, itemOf(later, b.id)?.questions, itemOf(later, third.id)?.questions]).toEqual([[...questions!, ...more!], [], []]);
  });

  it("writes who asks and each text of a question without the white space at its ends, 2000 characters of each at most, in one write of the file, and reads a question given no options and no default as one with neither", async () => {
    const { d, workItems } = await withWorkItems(["Parked"], { now: () => 5 });
    withDirectory(workItems[0]!);
    const long = "가".repeat(2001);
    const cut = "가".repeat(2000);
    const questions = d.park(workItems[0]!.id, {
      by: `  ${long}\n`,
      questions: [
        { asks: `\t${"q".repeat(1999)}😀 `, grounds: ` ${long} `, options: [{ label: ` ${long} `, implies: `\n${long}` }, { label: "second", implies: "" }], default: ` ${long}\n` },
        { asks: " One more? ", grounds: " It needs\nan approval. ", options: [{ label: "yes", implies: " Then it goes on. " }], default: null },
        { asks: "Free?", grounds: "A credential." },
      ],
    });
    expect(questions).toEqual([
      { id: 1, asks: "q".repeat(1999), grounds: cut, by: cut, options: [{ label: cut, implies: cut }, { label: "second", implies: "" }], default: cut, answer: null, since: 5 },
      { id: 2, asks: "One more?", grounds: "It needs an approval.", by: cut, options: [{ label: "yes", implies: "Then it goes on." }], default: null, answer: null, since: 5 },
      { id: 3, asks: "Free?", grounds: "A credential.", by: cut, options: [], default: null, answer: null, since: 5 },
    ]);
  });

  it("writes nothing and tells no client for a work item it does not keep, an archived one, one with no directory, a call with no question, a question with an empty text or empty grounds, two options of one question with one label, a default that names no option, an option with no label, a field of another type and an asker that is empty", async () => {
    const { d, c, url, workItems, sessions } = await withWorkItems(["Parked", "Archived", "No directory"], { now: () => 7 });
    const [a, archived, none] = workItems as [(typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0]];
    const directories = [withDirectory(a), withDirectory(archived)];
    c.send({ type: "archiveWorkItem", requestId: 1, id: archived.id, running: { panes: [sessions[1]!.id], headless: [] } });
    await c.message("inbox", (m) => m.archived.length === 1);
    c.messages.length = 0;
    const loose = d.park.bind(d) as (workItemId: unknown, asking: unknown) => unknown;
    const said = logged();
    expect(loose(99, ASKING)).toBeUndefined();
    expect(loose(String(a.id), ASKING)).toBeUndefined();
    expect(loose(archived.id, ASKING)).toBeUndefined();
    expect(loose(none.id, ASKING)).toBeUndefined();
    const refused = [
      null,
      { by: "sealer" },
      { ...ASKING, questions: [] },
      { ...ASKING, questions: {} },
      { ...ASKING, questions: [BASE, null] },
      { ...ASKING, questions: [BASE, { ...FREE, asks: "" }] },
      { ...ASKING, questions: [BASE, { ...FREE, asks: " \n\t" }] },
      { ...ASKING, questions: [{ ...FREE, asks: 3 }] },
      { ...ASKING, questions: [BASE, { ...FREE, grounds: " " }] },
      { ...ASKING, questions: [BASE, { asks: FREE.asks }] },
      { ...ASKING, questions: [{ ...BASE, options: [BASE.options[0], { label: " main ", implies: "The same label." }] }] },
      { ...ASKING, questions: [{ ...BASE, default: "develop" }] },
      { ...ASKING, questions: [{ ...BASE, default: 0 }] },
      { ...ASKING, questions: [{ ...FREE, default: "main" }] },
      { ...ASKING, questions: [{ ...BASE, options: {} }] },
      { ...ASKING, questions: [{ ...BASE, options: [null, BASE.options[1]] }] },
      // No default, so the empty label is what refuses it, and not a default that names no option.
      { ...ASKING, questions: [{ ...BASE, default: null, options: [{ label: " ", implies: "x" }, BASE.options[1]] }] },
      { ...ASKING, questions: [{ ...BASE, options: [{ label: 3, implies: "x" }, BASE.options[1]] }] },
      { ...ASKING, questions: [{ ...BASE, options: [{ label: "main" }, BASE.options[1]] }] },
      { ...ASKING, by: "" },
      { ...ASKING, by: "  " },
      { ...ASKING, by: 3 },
    ];
    for (const asking of refused) expect(loose(a.id, asking), JSON.stringify(asking)).toBeUndefined();
    // An inbox for any of them would have arrived before the refusal of a start sent after them.
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(["error"]);
    expect(directories.map(bytesIn)).toEqual([null, null]);
    // Each was refused before the record's writer was asked, so the log holds no line of a write that failed.
    expect(said).toEqual([]);
    const ready = await (await client(url)).message("ready");
    expect([itemOf(ready, a.id)?.questions, ready.archived[0]?.questions]).toEqual([[], []]);
    // The call as the refusals above would have it taken, so the method is the one under test.
    expect(loose(a.id, ASKING)).toEqual(open(7));
  });

  it("writes nothing of a park whose second question the record's writer refuses, the first question neither", async () => {
    const { d, workItems } = await withWorkItems(["Parked"], { now: () => 7 });
    const directory = withDirectory(workItems[0]!);
    d.decided(workItems[0]!.id, { kind: "default", says: "Start from main.", grounds: "The default base." });
    const bytes = bytesIn(directory);
    const said = logged();
    // A label that holds a backtick is no label the record's grammar takes.
    expect(d.park(workItems[0]!.id, { questions: [FREE, { ...FREE, options: [{ label: "a`b", implies: "" }] }] })).toBeUndefined();
    expect(bytesIn(directory)).toBe(bytes);
    expect(said.filter((line) => line.startsWith("the record was not written: "))).toHaveLength(1);
  });

  it("ends the park at an `answerQuestions`: each open block reads `answered` with its answer as typed, cut as every text is, the answer comes before the inbox that carries it, and the answered blocks stay in the record beside the questions of a later park", async () => {
    let clock = 1000;
    const { d, c, url, workItems } = await withWorkItems(["Parked", "Another"], { now: () => clock });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    d.park(a.id, ASKING);
    await c.message("inbox");
    const other = await client(url);
    await other.message("ready");
    c.messages.length = 0;
    clock = 2000;
    c.send({ type: "answerQuestions", requestId: 1, workItemId: a.id, answers: [{ questionId: 2, answer: `  ${TYPED}\n` }, { questionId: 1, answer: "main" }] });
    const inbox = await c.message("inbox");
    expect(c.messages.slice(0, 2).map((m) => m.type)).toEqual(["done", "inbox"]);
    expect(c.messages[0]).toEqual({ type: "done", requestId: 1 });
    const answered = [{ ...open(1000)[0]!, answer: "main", since: 2000 }, { ...open(1000)[1]!, answer: TYPED, since: 2000 }];
    expect([itemOf(inbox, a.id)?.questions, itemOf(inbox, b.id)?.questions]).toEqual([answered, []]);
    expect(recordIn(directory)?.questions.map(({ state }) => state)).toEqual([{ is: "answered", answer: "main" }, { is: "answered", answer: TYPED }]);
    // Every client is told, and the one that asked alone is answered.
    expect(itemOf(await other.message("inbox"), a.id)?.questions).toEqual(answered);
    expect(other.messages.map((m) => m.type)).toEqual(["ready", "inbox"]);

    clock = 3000;
    const again = d.park(a.id, { by: "proofer", questions: [{ asks: `${"답".repeat(2001)}?`, grounds: "An approval." }] });
    expect(again).toEqual([{ id: 3, asks: "답".repeat(2000), grounds: "An approval.", by: "proofer", options: [], default: null, answer: null, since: 3000 }]);
    // The answered questions need no answer again: the message answers the open one alone.
    clock = 4000;
    c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 3, answer: "가".repeat(2001) }] });
    await c.message("done", (m) => m.requestId === 2);
    expect(recordIn(directory)?.questions.map(({ id, state }) => [id, state])).toEqual([[1, { is: "answered", answer: "main" }], [2, { is: "answered", answer: TYPED }], [3, { is: "answered", answer: "가".repeat(2000) }]]);
  });

  it("refuses an `answerQuestions` that leaves an open question out, answers an id that is no open question of the record or one question twice, gives an empty answer, names a work item with no open question, one with no directory or one it does not keep, or is of another shape, with the file byte for byte as it stood and no inbox after", async () => {
    let clock = 1000;
    const { d, c, url, workItems } = await withWorkItems(["Parked", "Never parked", "Answered", "No directory"], { now: () => clock });
    const [a, b, answered, none] = workItems as [(typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0], (typeof workItems)[0]];
    const directories = [withDirectory(a), withDirectory(b), withDirectory(answered)];
    d.decided(a.id, { kind: "default", says: "Start from main.", grounds: "The default base." });
    d.park(a.id, ASKING);
    d.park(answered.id, { by: "proofer", questions: [FREE] });
    c.send({ type: "answerQuestions", requestId: 1, workItemId: answered.id, answers: [{ questionId: 1, answer: "Yes." }] });
    await c.message("inbox", (m) => itemOf(m, answered.id)?.questions[0]?.answer === "Yes.");
    const bytes = directories.map(bytesIn);
    c.messages.length = 0;
    clock = 2000;
    // The decision took the id 1, so the two questions of the park are 2 and 3.
    const both = [{ questionId: 2, answer: "main" }, { questionId: 3, answer: TYPED }];
    const shape = "an answer names a work item and gives an answer to each of its open questions";
    const refusals = [
      [2, { workItemId: a.id, answers: [both[0]] }, "Question 3 has no answer."],
      [3, { workItemId: a.id, answers: [] }, "Question 2 has no answer."],
      [4, { workItemId: a.id, answers: [...both, { questionId: 9, answer: "a third" }] }, `Work item ${a.id} holds no open question 9.`],
      [5, { workItemId: a.id, answers: [...both, { questionId: 1, answer: "a decision's id" }] }, `Work item ${a.id} holds no open question 1.`],
      [6, { workItemId: a.id, answers: [...both, { questionId: 3, answer: "again" }] }, "Question 3 is answered twice."],
      [7, { workItemId: a.id, answers: [both[0], { questionId: 3, answer: " \n\t" }] }, "Give an answer to question 3."],
      [8, { workItemId: b.id, answers: both }, `Work item ${b.id} waits for no answer.`],
      [9, { workItemId: answered.id, answers: [{ questionId: 1, answer: "another" }] }, `Work item ${answered.id} waits for no answer.`],
      [10, { workItemId: none.id, answers: both }, `Work item ${none.id} has no record of decisions.`],
      [11, { workItemId: 99, answers: both }, "no work item 99"],
      [12, { workItemId: String(a.id), answers: both }, shape],
      [13, { workItemId: a.id, answers: { 2: "main", 3: TYPED } }, shape],
      [14, { workItemId: a.id, answers: [both[0], null] }, shape],
      [15, { workItemId: a.id, answers: [both[0], { questionId: "3", answer: TYPED }] }, shape],
      [16, { workItemId: a.id, answers: [both[0], { questionId: 3, answer: 3 }] }, shape],
    ] as const;
    for (const [requestId, fields, message] of refusals) {
      c.send({ type: "answerQuestions", requestId, ...fields });
      expect(await c.message("error", (m) => m.requestId === requestId)).toEqual({ type: "error", requestId, message });
    }
    await settled(c);
    expect(c.messages.map((m) => m.type)).toEqual(refusals.map(() => "error").concat("error"));
    expect(directories.map(bytesIn)).toEqual(bytes);
    const ready = await (await client(url)).message("ready");
    expect([itemOf(ready, a.id)?.questions, itemOf(ready, b.id)?.questions]).toEqual([open(1000, 2), []]);
    // The message as the refusals above would have it taken, so the case is the one under test.
    c.send({ type: "answerQuestions", requestId: 20, workItemId: a.id, answers: both });
    expect(await c.message("done", (m) => m.requestId === 20)).toEqual({ type: "done", requestId: 20 });
  });

  it("takes an answer for an archived work item, lists it under `archived` with its questions as answered, and reads its record again at its restore, in the inbox that lists it as restored", async () => {
    const { d, c, workItems, sessions } = await withWorkItems(["Archived"], { now: () => 9 });
    const archived = workItems[0]!;
    const directory = withDirectory(archived);
    d.park(archived.id, ASKING);
    c.send({ type: "archiveWorkItem", requestId: 1, id: archived.id, running: { panes: [sessions[0]!.id], headless: [] } });
    expect((await c.message("inbox", (m) => m.archived.length === 1)).archived[0]?.questions).toEqual(open(9));
    c.send({ type: "answerQuestions", requestId: 2, workItemId: archived.id, answers: [{ questionId: 1, answer: "main" }, { questionId: 2, answer: TYPED }] });
    await c.message("done", (m) => m.requestId === 2);
    expect((await c.message("inbox", (m) => m.archived[0]?.questions[0]?.answer === "main")).archived[0]?.questions.map(({ answer }) => answer)).toEqual(["main", TYPED]);
    // A block a stage wrote while the work item was archived, which no pass read.
    const file = join(directory, RECORD_FILE);
    writeFileSync(file, withDecision(readFileSync(file, "utf8"), { kind: "default", decided: "Start from main.", grounds: "The default base." }));
    c.messages.length = 0;
    c.send({ type: "restoreWorkItem", requestId: 3, id: archived.id });
    const restored = await c.message("inbox");
    expect([restored.archived, restored.workItems.map(({ decisions }) => decisions.map(({ id, since }) => [id, since]))]).toEqual([[], [[[3, 9]]]]);
  });
});

describe("what a work item's records say of its chain", () => {
  const FENCE = "```";
  const A = "a".repeat(40);
  const B = "b".repeat(40);
  const run = (tree: string): string => `${FENCE}seal\nrun: ${tree} against ${"c".repeat(40)}\n${FENCE}\n`;
  const verdict = (commit: string, says: string): string => `${FENCE}seal\ntarget: ${commit} against main\nVerdict: ${says}\n${FENCE}\n`;
  /** A file of the directory, the folders above it made. */
  const put = (directory: string, path: string, text: string): void => {
    mkdirSync(join(directory, path, ".."), { recursive: true });
    writeFileSync(join(directory, path), text);
  };

  it("sends a work item whose worktree holds no directory of its own with no frame, no round, no gate and no verdict, at its creation, in `ready` and in an `inbox`", async () => {
    const { c, url, workItems } = await withWorkItems(["No directory"], { commitPollMs: 30 });
    const a = workItems[0]!;
    expect(a.recorded).toEqual(NOTHING_RECORDED);
    expect(itemOf(await (await client(url)).message("ready"), a.id)?.recorded).toEqual(NOTHING_RECORDED);
    c.send({ type: "setWorkItem", requestId: 1, id: a.id, pinned: true });
    expect(itemOf(await c.message("inbox"), a.id)?.recorded).toEqual(NOTHING_RECORDED);
  });

  it("reads the records of a work item's directory at every pass, uncommitted and once committed alike, the last block of the gate's record and of the guarantee, and a reason of 2000 characters at most, and sends every client the lists where they read otherwise and nothing where they read the same", async () => {
    const { c, url, workItems } = await withWorkItems(["Recorded", "Another"], { commitPollMs: 30 });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    const other = await client(url);
    await other.message("ready");
    put(directory, "frame/design.md", "# Design\n");
    for (const n of [1, 2, 3]) put(directory, `trail/rounds/round-${n}.md`, `# Round ${n}\n`);
    put(directory, "trail/gate.md", `${run(A)}\n${run(B)}`);
    put(directory, "guarantee.md", `${verdict(A, "withheld reason: The suite failed.")}\n${verdict(B, "sealed")}`);
    expect(git(a.worktree, "status", "--porcelain", "--", "seal")).toContain("?? seal/");
    const said = { framed: true, rounds: 3, gate: B, verdict: { is: "sealed", commit: B, says: null } };
    for (const told of [c, other]) {
      const inbox = await told.message("inbox", (m) => itemOf(m, a.id)?.recorded?.rounds === 3);
      expect([itemOf(inbox, a.id)?.recorded, itemOf(inbox, b.id)?.recorded]).toEqual([said, NOTHING_RECORDED]);
    }

    // Committed, the records read the same: the inbox the new commit sends carries them as they were.
    git(a.worktree, "add", "seal");
    git(a.worktree, "commit", "--quiet", "-m", "records");
    const committed = await c.message("inbox", (m) => itemOf(m, a.id)?.newCommits === 1);
    expect(itemOf(committed, a.id)?.recorded).toEqual(said);
    // A pass that reads the records as it read them last sends nothing.
    await settled(c);
    c.messages.length = 0;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(c.messages).toEqual([]);

    // A record that reads otherwise is sent, and a reason is cut at 2000 characters.
    put(directory, "guarantee.md", verdict(A, `withheld reason: ${"가".repeat(2001)}`));
    const withheld = await c.message("inbox", (m) => itemOf(m, a.id)?.recorded?.verdict?.is === "withheld");
    expect(itemOf(withheld, a.id)?.recorded).toEqual({ ...said, verdict: { is: "withheld", commit: A, says: "가".repeat(2000) } });
  });
});

describe("the seal a work item's head holds", { timeout: 60_000 }, () => {
  const NAME = "1795396351-sealed-work";
  /** A daemon whose one work item's branch the case seals by committing the records, and the work item once the lists carry its seal as `sealed`. */
  async function sealed() {
    const { made, c, workItems } = await standing(cleanups, ["Sealed work"], { commitPollMs: 50 });
    const a = workItems[0]!;
    const gate = commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit });
    // The case sends nothing from here on: what the lists carry, the daemon read by itself.
    const seal = await c.until(() => (c.workItem(a.id)?.seal?.state === "sealed" ? c.workItem(a.id)?.seal : undefined));
    expect(seal).toEqual({ state: "sealed", commit: gate, why: null });
    return { made, c, a, gate };
  }
  const broken = (c: Awaited<ReturnType<typeof sealed>>["c"], id: number) => c.until(() => (c.workItem(id)?.seal?.state === "broken" ? c.workItem(id)?.seal : undefined));

  it("turns a sealed work item broken within the read interval after a commit made with git in its worktree, and no message of a client asks for it", async () => {
    const { c, a, gate } = await sealed();
    writeFileSync(join(a.worktree, "feature.txt"), "A greeting, changed after the seal\n");
    git(a.worktree, "commit", "--quiet", "-am", "fix: change the greeting");
    expect(await broken(c, a.id)).toEqual({ state: "broken", commit: gate, why: `\`feature.txt\` changed after the sealed commit \`${gate.slice(0, 7)}\`.` });
  });

  it("turns it broken when the branch is moved from the repository's main checkout with git update-ref, which no worktree's checkout makes", async () => {
    const { made, c, a, gate } = await sealed();
    const at = git(made.repo, "rev-parse", `refs/heads/${a.branch}`).trim();
    // A commit of the branch's tree with one file changed, made in the main checkout through an index of its own.
    const index = join(made.base, "moved.index");
    const env = { ...process.env, GIT_INDEX_FILE: index };
    const blob = spawnSync("git", ["hash-object", "-w", "--stdin"], { cwd: made.repo, input: "Changed from the main checkout\n", encoding: "utf8" }).stdout.trim();
    spawnSync("git", ["read-tree", at], { cwd: made.repo, env });
    spawnSync("git", ["update-index", "--cacheinfo", `100644,${blob},feature.txt`], { cwd: made.repo, env });
    const tree = spawnSync("git", ["write-tree"], { cwd: made.repo, env, encoding: "utf8" }).stdout.trim();
    const moved = spawnSync("git", ["commit-tree", tree, "-p", at, "-m", "fix: change the greeting elsewhere"], { cwd: made.repo, encoding: "utf8" }).stdout.trim();
    git(made.repo, "update-ref", `refs/heads/${a.branch}`, moved, at);
    expect(await broken(c, a.id)).toEqual({ state: "broken", commit: gate, why: `\`feature.txt\` changed after the sealed commit \`${gate.slice(0, 7)}\`.` });
  });

  it("sends a broken seal's sentence cut at 2000 characters, where it quotes a long line of a record the reader refuses", async () => {
    const { c, a, gate } = await sealed();
    const record = `seal/threads/${NAME}/trail/rounds/round-2.md`;
    mkdirSync(join(a.worktree, record, ".."), { recursive: true });
    writeFileSync(join(a.worktree, record), roundRecord(`# Review round 2: ${NAME}`, "x".repeat(3000)));
    git(a.worktree, "add", record);
    git(a.worktree, "commit", "--quiet", "-m", "chore: record review round 2");
    const seal = await broken(c, a.id);
    expect([seal?.commit, seal?.why?.length]).toEqual([gate, 2000]);
    expect(seal?.why).toMatch(new RegExp(`^The records at the head do not read: the reader refuses line 4 of ${record.replace(/\./gu, "\\.")}: \`target: x+$`, "u"));
  });

  it("sends a work item with no `seal` until it has read the branch, so a `ready` that goes out before git answered carries none, and the lists that follow the read carry the seal, or null where the head holds none", async () => {
    const stood = await standing(cleanups, ["Sealed work", "Unsealed work"], { commitPollMs: 60_000 });
    const [a, b] = stood.workItems as [(typeof stood.workItems)[number], (typeof stood.workItems)[number]];
    const gate = commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit });
    await stood.d.close();
    // Each git call waits a fifth of a second, four times the wait of the daemon that starts now, so its `ready` goes out before it has read either branch.
    watchedGit(stood.made.base, 0.2);
    const c = await chainClient((await stood.start({ readyWaitMs: 50 })).url, cleanups);
    const ready = await c.message("ready");
    expect(ready.workItems.map((w) => [w.id, "seal" in w])).toEqual([[a.id, false], [b.id, false]]);
    const read = await c.until(() => {
      const [sealedItem, unsealedItem] = [c.workItem(a.id), c.workItem(b.id)];
      return sealedItem?.seal?.state === "sealed" && unsealedItem !== undefined && "seal" in unsealedItem ? [sealedItem.seal, unsealedItem.seal] : undefined;
    });
    expect(read).toEqual([{ state: "sealed", commit: gate, why: null }, null]);
  });

  it("sends no seal for a work item whose head holds none, though a pane of it prints `Verdict: sealed` and its stored chain rests", async () => {
    const stood = await standing(cleanups, ["Sealed work"], { commitPollMs: 50, commandFor: () => ({ command: "/bin/sh", args: ["-c", "printf 'Verdict: sealed\\n'; sleep 30"], env: {} }) });
    const a = stood.workItems[0]!;
    // The records of a chain that has a gate's run and no guarantee, and a stored chain that rests, which the store's file is given.
    commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit, seal: false });
    expect((await stood.c.asked({ type: "setWorkItem", requestId: 9, id: a.id, pinned: true })).type).toBe("done");
    await stood.d.close();
    const file = join(stood.runDir, "repositories.json");
    const stored = JSON.parse(readFileSync(file, "utf8")) as { repositories: { workItems: { id: number; chain?: unknown }[] }[] };
    Object.assign(stored.repositories[0]?.workItems.find(({ id }) => id === a.id) ?? {}, { chain: { state: "rested", says: "The sealer sealed ccccccc, after round 1.", since: 3, stages: [] } });
    writeFileSync(file, JSON.stringify(stored));
    const c = await chainClient((await stood.start()).url, cleanups);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: a.id });
    const { session } = await c.message("started");
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes("Verdict: sealed")) ? true : undefined));
    // The read of the branch has run once it lists the commits of the records, and the chain still rests.
    const read = await c.until(() => {
      const item = c.workItem(a.id);
      return item?.commits?.some(({ subject }) => subject === "chore: record the broad gate's run") ? item : undefined;
    });
    expect(read.chain).toMatchObject({ state: "rested" });
    expect(read.seal).toBeNull();
  });
});

describe("the records of the back of a seal", { timeout: 60_000 }, () => {
  const NAME = "1795400730-sealed-work";
  const headOf = (folder: string): string => git(folder, "rev-parse", "HEAD").trim();

  it("answers a `readSealRecords` with what the records of the work item's directory say at its branch's head, with the empty value for a work item with no directory, and with an error for an id it lists no work item under and for a branch whose head it cannot read", async () => {
    const { made, c, workItems } = await standing(cleanups, ["Sealed work", "No directory", "Gone branch"], { commitPollMs: 60_000 });
    const [a, b, gone] = workItems as [(typeof workItems)[number], (typeof workItems)[number], (typeof workItems)[number]];
    const gate = commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit });
    const sealed = await c.asked({ type: "readSealRecords", requestId: 1, workItemId: a.id });
    expect(sealed).toMatchObject({ type: "sealRecords", requestId: 1, workItemId: a.id, records: { head: headOf(a.worktree), record: { commit: gate, branch: a.branch, item: NAME, gate, rounds: 1 }, brokenBy: null, refusals: [], unreadRefusals: 0 } });
    expect(sealed.type === "sealRecords" ? sealed.records.rounds.map(({ round, findings }) => [round, findings]) : null).toEqual([[1, []]]);
    expect(await c.asked({ type: "readSealRecords", requestId: 2, workItemId: b.id })).toEqual({
      type: "sealRecords",
      requestId: 2,
      workItemId: b.id,
      records: { head: headOf(b.worktree), record: null, brokenBy: null, rounds: [], refusals: [], unreadRefusals: 0 },
    });
    expect(await c.asked({ type: "readSealRecords", requestId: 3, workItemId: 99 })).toEqual({ type: "error", requestId: 3, message: "no work item 99" });
    git(made.repo, "update-ref", "-d", `refs/heads/${gone.branch}`);
    expect(await c.asked({ type: "readSealRecords", requestId: 4, workItemId: gone.id })).toMatchObject({ type: "error", requestId: 4, message: expect.stringContaining(branchOf(gone)) });
  });

  it("answers a `readSealRecords` of a work item with no branch yet with the empty value, read at its worktree's HEAD", async () => {
    const { c, lone } = await daemonWithoutBranch();
    c.send({ type: "readSealRecords", requestId: 1, workItemId: 1 });
    expect(await c.message("sealRecords", (m) => m.requestId === 1)).toEqual({ type: "sealRecords", requestId: 1, workItemId: 1, records: { head: lone, record: null, brokenBy: null, rounds: [], refusals: [], unreadRefusals: 0 } });
  });

  it("names the commit that broke a broken seal, read with the seal the head holds, and sends a finding's words cut at 2000 characters", async () => {
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { commitPollMs: 60_000 });
    const a = workItems[0]!;
    commitSeal(a.worktree, { workItem: NAME, branch: branchOf(a), base: a.baseCommit });
    writeFileSync(join(a.worktree, "feature.txt"), "A greeting, changed after the seal\n");
    git(a.worktree, "commit", "--quiet", "-am", "fix: change the greeting");
    const broke = headOf(a.worktree);
    // A round recorded after the break, whose finding's symptom and severity are long.
    const record = `seal/threads/${NAME}/trail/rounds/round-2.md`;
    const fence = "```";
    writeFileSync(join(a.worktree, record), [`# Review round 2: ${NAME}`, "", `${fence}seal`, `target: ${broke} against main`, fence, "", "## Findings", "", `### 1. ${"가".repeat(3000)}`, "", `${fence}seal`, `severity: ${"s".repeat(3000)}`, "location: `feature.txt:1`", fence, ""].join("\n"));
    git(a.worktree, "add", record);
    git(a.worktree, "commit", "--quiet", "-m", "chore: record review round 2");
    const answer = await c.asked({ type: "readSealRecords", requestId: 1, workItemId: a.id });
    expect(answer).toMatchObject({ type: "sealRecords", records: { brokenBy: { commit: broke, subject: "fix: change the greeting" } } });
    const found = answer.type === "sealRecords" ? answer.records.rounds[1]?.findings[0] : undefined;
    expect([found?.says, found?.severity.length]).toEqual(["가".repeat(2000), 2000]);
  });
});

describe("the commit of a person's word", () => {
  const DEFAULT = { kind: "default", says: "Start from main.", grounds: "The default base." } as const;
  const WHO = "Owlery Test <test@owlery.invalid>, Owlery Test <test@owlery.invalid>";
  /** How many commits the worktree's branch holds. */
  const commitsIn = (worktree: string): number => Number(git(worktree, "rev-list", "--count", "HEAD"));
  /** The newest commit of the worktree's branch: its subject, the rest of its message, who wrote and who committed it, and the paths it changed. */
  const newest = (worktree: string) => ({
    subject: git(worktree, "log", "-1", "--format=%s").trim(),
    body: git(worktree, "log", "-1", "--format=%b").trim(),
    by: git(worktree, "log", "-1", "--format=%an <%ae>, %cn <%ce>").trim(),
    paths: git(worktree, "show", "--name-only", "--format=", "HEAD").trim().split("\n"),
  });
  /** What git says of the worktree's changes, a line for each path. */
  const status = (worktree: string): string[] => git(worktree, "status", "--porcelain", "--untracked-files=all").split("\n").filter((line) => line !== "").sort();
  /** The pass over the owed words and the first wait of a retry, short, so a case waits on what happens. */
  const QUICK = { wordPassMs: 50, wordRetryMs: 200 } as const;
  /** The limit the cases of a commit that does not end give, in milliseconds: long enough that git reaches the hook while other suites load the machine. */
  const LIMIT_MS = 2000;
  /** The record's path in the worktree of a work item whose directory `withDirectory` made under its default name. */
  const RECORD = "seal/threads/1-item/decisions.md";
  /** What a work item's word waits for while a pane or a headless session of it works. */
  const WORKING = { waits: "session", why: "a session of the work item is working" } as const;
  type Client = Awaited<ReturnType<typeof client>>;
  /** The work item as an inbox carries it. */
  const inboxItem = (m: ServerMessage, workItemId: number): WorkItem | undefined => (m.type === "inbox" ? m.workItems.find((each) => each.id === workItemId) : undefined);
  /** Waits for an inbox, from the client's message `from` on, that carries this `wordOwed` for the work item. */
  const carried = (c: Client, workItemId: number, wordOwed: WorkItem["wordOwed"], from: number): Promise<true> =>
    c.until(() => (c.messages.slice(from).some((m) => JSON.stringify(inboxItem(m, workItemId)?.wordOwed) === JSON.stringify(wordOwed)) ? true : undefined));
  /** Waits until the last inbox the client was sent carries this `wordOwed` for the work item. */
  const rests = (c: Client, workItemId: number, wordOwed: WorkItem["wordOwed"]): Promise<true> =>
    c.until(() => (JSON.stringify(inboxItem(c.messages.filter((m) => m.type === "inbox").at(-1) ?? c.messages[0]!, workItemId)?.wordOwed) === JSON.stringify(wordOwed) ? true : undefined));
  /** A reversal of the decision, answered `done`. */
  const reversal = async (c: Client, requestId: number, workItemId: number, decisionId: number): Promise<void> => {
    c.send({ type: "reverseDecision", requestId, workItemId, decisionId, message: `Not ${String(decisionId)}.` });
    expect(await c.message("done", (m) => m.requestId === requestId)).toEqual({ type: "done", requestId });
  };
  /** A pane of the work item whose agent says it is working, and its session's id. */
  const workingPane = async (d: Daemon, c: Client, requestId: number, workItemId: number): Promise<number> => {
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId, workItemId });
    const { session } = await c.message("started", (m) => m.requestId === requestId);
    d.agentEvent(session.id, "UserPromptSubmit", {});
    return session.id;
  };
  /** Writes a hook of the repository, which its worktrees run, that notes its process id in a file beside the repository and then runs `body`, and gives the ids noted so far. The case's cleanup ends by its id each one that still runs. */
  const hook = (made: { base: string; repo: string }, name: string, body: string): (() => number[]) => {
    const noted = join(made.base, `${name}-pids.txt`);
    writeFileSync(join(made.repo, ".git", "hooks", name), `#!/bin/sh\necho $$ >> '${noted}'\n${body}\n`, { mode: 0o755 });
    const started = (): number[] => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line !== "").map(Number) : []);
    cleanups.push(() => {
      for (const pid of started()) if (runs(pid)) process.kill(pid, "SIGKILL");
    });
    return started;
  };
  /** A hook's body that waits for a file that never comes. */
  const never = (made: { base: string }): string => `while [ ! -e '${join(made.base, "never")}' ]; do sleep 0.2; done`;
  /** Waits until no process of the ids runs. */
  const gone = (started: () => number[]) => vi.waitFor(() => expect(started().filter(runs)).toEqual([]), { timeout: 5000, interval: 50 });
  /** Whether git's lock of the worktree's index stands. */
  const locked = (worktree: string): boolean => existsSync(join(git(worktree, "rev-parse", "--absolute-git-dir").trim(), "index.lock"));

  it("commits a reversal where no session of the work item is working: one new commit whose only path is `decisions.md`, under the person's identity, with the subject that names the decision and the trailer that names the work item's directory, and a change staged beside it and one not staged stand as they stood; an `answerQuestions` gives a commit of its own, which the daemon's close waits for", async () => {
    const { d, c, workItems } = await withWorkItems(["Reversed"]);
    const a = workItems[0]!;
    const directory = withDirectory(a, "1795330500-reversed");
    const record = "seal/threads/1795330500-reversed/decisions.md";
    d.decided(a.id, DEFAULT);
    d.park(a.id, { by: "sealer", questions: [{ asks: "May the session push?", grounds: "A push needs the person's approval." }] });
    writeFileSync(join(a.worktree, "staged.txt"), "staged\n");
    git(a.worktree, "add", "staged.txt");
    writeFileSync(join(a.worktree, "README.md"), "changed and not staged\n");
    const stood = status(a.worktree);
    expect(stood).toEqual([" M README.md", "?? seal/README.md", `?? ${record}`, "?? seal/threads/1795330500-reversed/routing.md", "A  staged.txt"]);
    expect(commitsIn(a.worktree)).toBe(1);

    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "기본값 말고 main에서 시작해 주세요" });
    expect(await c.message("done", (m) => m.requestId === 1)).toEqual({ type: "done", requestId: 1 });
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1795330500-reversed", by: WHO, paths: [record] });
    expect(git(a.worktree, "show", `HEAD:${record}`)).toBe(readFileSync(join(directory, RECORD_FILE), "utf8"));
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "기본값 말고 main에서 시작해 주세요" });
    // The record is committed and nothing else moved: the staged file is still staged and not committed, and the other change is still not staged.
    const left = stood.filter((line) => line !== `?? ${record}`);
    expect(status(a.worktree)).toEqual(left);

    c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 2, answer: "Yes, push." }] });
    await c.message("done", (m) => m.requestId === 2);
    // No wait but the close's: the commit under way has ended when the close has.
    await d.close();
    expect(commitsIn(a.worktree)).toBe(3);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's answers", body: "Seal-Routing: 1795330500-reversed", by: WHO, paths: [record] });
    expect(git(a.worktree, "show", `HEAD:${record}`)).toBe(readFileSync(join(directory, RECORD_FILE), "utf8"));
    expect(status(a.worktree)).toEqual(left);
  });

  it("rewrites the `Branch` row of the work item's `routing.md` at a rename of its branch, in a commit of that file alone with the trailer that names the directory, so the work item still carries its decision at the reads after it; a rename of the name alone writes and commits nothing", async () => {
    const { d, c, url, workItems } = await withWorkItems(["First name"], { commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a, "1795388700-renamed");
    const routing = "seal/threads/1795388700-renamed/routing.md";
    const stood = readFileSync(join(directory, "routing.md"), "utf8");
    d.decided(a.id, DEFAULT);
    await c.message("inbox", (m) => m.workItems[0]?.decisions.length === 1);

    c.send({ type: "renameWorkItem", requestId: 1, id: a.id, title: "Another name", branch: false });
    await c.message("done", (m) => m.requestId === 1);
    await settled(c);
    expect([readFileSync(join(directory, "routing.md"), "utf8"), commitsIn(a.worktree)]).toEqual([stood, 1]);

    c.send({ type: "renameWorkItem", requestId: 2, id: a.id, title: "Second name", branch: true });
    await c.message("done", (m) => m.requestId === 2);
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(stood).toContain(`| Branch | ${a.branch} |\n`);
    expect(readFileSync(join(directory, "routing.md"), "utf8")).toBe(stood.replace(`| Branch | ${a.branch} |`, "| Branch | owlery/second-name |"));
    expect(newest(a.worktree)).toEqual({ subject: "chore: name the renamed branch in the work item's routing", body: "Seal-Routing: 1795388700-renamed", by: WHO, paths: [routing] });
    expect(git(a.worktree, "show", `HEAD:${routing}`)).toBe(readFileSync(join(directory, "routing.md"), "utf8"));
    expect(status(a.worktree)).toEqual(["?? seal/README.md", "?? seal/threads/1795388700-renamed/decisions.md"]);
    // The record is read again at each interval, by the branch's new name.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const later = (await (await client(url)).message("ready")).workItems[0];
    expect([later?.branch, later?.decisions.map((decision) => decision.says)]).toEqual(["owlery/second-name", ["Start from main."]]);
  });

  it("refuses a rename of the branch while the work item's chain is running, with the branch, the routing and the name as they were, takes a rename of the name alone meanwhile, and renames the branch once the chain rests", async () => {
    // The fake proofer's answer holds no round record, so the chain stops when round 1's session ends.
    const { c, d, workItems } = await withWorkItems(["First name"], { roleAdapter: fakeAdapter({ delayMs: 250 }) });
    const a = workItems[0]!;
    const directory = withDirectory(a, "1795388700-renamed");
    // A chain starts only on a branch whose records name a broad gate command.
    writeFileSync(join(a.worktree, "seal", "config.json"), '{ "Broad gate": "true" }\n');
    git(a.worktree, "add", "--all");
    git(a.worktree, "commit", "--quiet", "-m", "chore: add the records and declare the routing");
    const stood = readFileSync(join(directory, "routing.md"), "utf8");
    const chainOf = (): WorkItem["chain"] | undefined => c.messages.flatMap((m) => (m.type === "inbox" ? m.workItems : [])).at(-1)?.chain;

    await d.startChain(a.id, true);
    c.send({ type: "renameWorkItem", requestId: 2, id: a.id, title: "Second name", branch: true });
    expect((await c.message("error", (m) => m.requestId === 2)).message).toBe("The work item's chain is running, and it finds the work item's records by the branch's name. Rename the branch once the chain rests.");
    expect(chainOf()?.state).toBe("running");
    expect([git(a.worktree, "symbolic-ref", "--short", "HEAD").trim(), readFileSync(join(directory, "routing.md"), "utf8"), commitsIn(a.worktree)]).toEqual([a.branch, stood, 2]);
    c.send({ type: "renameWorkItem", requestId: 3, id: a.id, title: "Second name", branch: false });
    await c.message("done", (m) => m.requestId === 3);
    expect((await c.message("inbox", (m) => m.workItems[0]?.title === "Second name")).workItems[0]).toMatchObject({ title: "Second name", branch: a.branch });

    await c.until(() => (chainOf()?.state === "stopped" ? true : undefined), 10_000);
    c.send({ type: "renameWorkItem", requestId: 4, id: a.id, title: "Second name", branch: true });
    await c.message("done", (m) => m.requestId === 4);
    expect(git(a.worktree, "symbolic-ref", "--short", "HEAD").trim()).toBe("owlery/second-name");
  });

  /** Runs git in a worktree where the command is expected to stop on a conflict, and gives its exit code. */
  const stopping = (worktree: string, ...args: string[]): number | null => spawnSync("git", args, { cwd: worktree, encoding: "utf8" }).status;
  /**
   * Each state of a worktree in which a person's word is refused before it is written and nothing is committed, with the commands that bring it about and the reason the refusal gives.
   * The work item's branch holds the commit "mine" and the branch `theirs` the commit "theirs", which change one line of `README.md` each, so each of the two taken onto the other stops on a conflict.
   */
  const NOT_COMMITTED: { name: string; bring: (worktree: string) => void; says: (branch: string) => string }[] = [
    { name: "on a detached HEAD", bring: (worktree) => void git(worktree, "checkout", "--quiet", "--detach"), says: (branch) => `the worktree is not on the branch ${branch}` },
    { name: "on another branch", bring: (worktree) => void git(worktree, "checkout", "--quiet", "theirs"), says: (branch) => `the worktree is not on the branch ${branch}` },
    { name: "in a rebase that stopped on a conflict", bring: (worktree) => expect(stopping(worktree, "rebase", "theirs")).toBe(1), says: () => "a rebase is under way in the worktree" },
    { name: "in a merge that stopped on a conflict", bring: (worktree) => expect(stopping(worktree, "merge", "theirs")).toBe(1), says: () => "a merge is under way in the worktree" },
    { name: "in a cherry-pick that stopped on a conflict", bring: (worktree) => expect(stopping(worktree, "cherry-pick", "theirs")).toBe(1), says: () => "a cherry-pick is under way in the worktree" },
    { name: "in a revert that has not been committed", bring: (worktree) => void git(worktree, "revert", "--no-commit", "HEAD"), says: () => "a revert is under way in the worktree" },
    {
      name: "in a `git am` that stopped on a conflict",
      bring: (worktree) => {
        writeFileSync(join(worktree, "..", "theirs.patch"), git(worktree, "format-patch", "-1", "theirs", "--stdout"));
        expect(stopping(worktree, "am", join(worktree, "..", "theirs.patch"))).not.toBe(0);
      },
      says: () => "a rebase or a `git am` is under way in the worktree",
    },
  ];

  /** The refusal of a person's word for the reason given, as the window shows it. */
  const refusal = (why: string): string => `Nothing was written: ${why}. Send it again once the worktree is on its branch and nothing is under way in it.`;

  it.each(NOT_COMMITTED)("refuses a reversal and an answer where the worktree is $name: each is answered with an `error` that says why, the record stands byte for byte as it stood, no inbox follows, no branch and no HEAD moves, the index stands as it stood, and the log holds nothing", async ({ bring, says }) => {
    const { d, c, workItems } = await withWorkItems(["Elsewhere"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    d.decided(a.id, DEFAULT);
    d.park(a.id, { by: "sealer", questions: [{ asks: "May the session push?", grounds: "A push needs the person's approval." }] });
    git(a.worktree, "checkout", "--quiet", "-b", "theirs");
    writeFileSync(join(a.worktree, "README.md"), "theirs\n");
    git(a.worktree, "commit", "--quiet", "-am", "theirs");
    git(a.worktree, "checkout", "--quiet", branchOf(a));
    writeFileSync(join(a.worktree, "README.md"), "mine\n");
    git(a.worktree, "commit", "--quiet", "-am", "mine");
    bring(a.worktree);
    /** Where every branch and the worktree's HEAD stand, and what git says of the worktree's changes. */
    const stands = (): unknown[] => [git(a.worktree, "for-each-ref", "refs/heads"), git(a.worktree, "rev-parse", "HEAD"), status(a.worktree), readFileSync(join(directory, RECORD_FILE), "utf8")];
    const stood = stands();
    const said = logged();
    await settled(c);
    const before = c.messages.length;
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: refusal(says(branchOf(a))) });
    c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 2, answer: "Yes, push." }] });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: refusal(says(branchOf(a))) });
    await settled(c);
    // The third is the refusal `settled` waits for.
    expect(c.messages.slice(before).map((m) => m.type)).toEqual(["error", "error", "error"]);
    await d.close();
    expect(said).toEqual([]);
    expect(stands()).toEqual(stood);
  });

  it("refuses a reversal and an answer for a work item with no branch yet before anything is written, says so, and moves no branch and no HEAD", async () => {
    const { c, worktree, branches } = await daemonWithoutBranch();
    const stands = (): unknown[] => [branches(), git(worktree, "rev-parse", "HEAD"), status(worktree)];
    const stood = stands();
    c.send({ type: "reverseDecision", requestId: 1, workItemId: 1, decisionId: 1, message: "No." });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "Nothing was written: the work item has no branch yet." });
    c.send({ type: "answerQuestions", requestId: 2, workItemId: 1, answers: [{ questionId: 2, answer: "Yes, push." }] });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: "Nothing was written: the work item has no branch yet." });
    expect(stands()).toEqual(stood);
  });

  it("commits nothing where the worktree leaves its branch after a word was written: a HEAD detached while an earlier commit is held leaves the later word written and answered `done`, moves the work item's branch nowhere, and the log says why", async () => {
    const { d, c, made: repository, workItems } = await withWorkItems(["Left"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    for (const says of ["One.", "Two."]) d.decided(a.id, { ...DEFAULT, says });
    // The hook holds the first commit until the case lets it go.
    const [started, go] = [join(repository.base, "hook-started"), join(repository.base, "hook-go")];
    writeFileSync(join(repository.repo, ".git", "hooks", "pre-commit"), `#!/bin/sh\ntouch '${started}'\nwhile [ ! -f '${go}' ]; do sleep 0.05; done\n`, { mode: 0o755 });
    const said = logged();
    const reverse = (decisionId: number): void => c.send({ type: "reverseDecision", requestId: decisionId, workItemId: a.id, decisionId, message: `Not ${String(decisionId)}.` });
    reverse(1);
    await c.until(() => (existsSync(started) ? true : undefined), 3000);
    // The second word is written while the worktree is on its branch, and its commit waits behind the first.
    reverse(2);
    expect(await c.message("done", (m) => m.requestId === 2)).toEqual({ type: "done", requestId: 2 });
    // HEAD is detached where it stands, with no read of the index the held commit has locked.
    git(a.worktree, "update-ref", "--no-deref", "HEAD", git(a.worktree, "rev-parse", "HEAD").trim());
    const branchAt = (): string => git(a.worktree, "rev-parse", `refs/heads/${a.branch}`);
    const stood = branchAt();
    writeFileSync(go, "");
    await d.close();
    expect(said).toEqual([`the person's word was not committed: the worktree is not on the branch ${a.branch}`]);
    expect(branchAt()).toBe(stood);
    // The held commit, which passed its checks on the branch, is the one commit made, and the second word is in the file alone.
    expect(git(a.worktree, "log", "--format=%s", "HEAD").trim().split("\n")).toEqual(["chore: record the person's reversal of decision 1", "first"]);
    expect(recordIn(directory)?.decisions.map(({ state }) => state)).toEqual([1, 2].map((id) => ({ is: "reversed", message: `Not ${String(id)}.` })));
  });

  it("takes the words of one worktree in the order they came: twelve reversals sent one behind another are each answered `done` in that order, though git is asked where the worktree stands for each", async () => {
    const { d, c, workItems } = await withWorkItems(["In order"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const ids = Array.from({ length: 12 }, (_, index) => index + 1);
    for (const id of ids) d.decided(a.id, { ...DEFAULT, says: `Decision ${String(id)}.` });
    await settled(c);
    const before = c.messages.length;
    for (const id of ids) c.send({ type: "reverseDecision", requestId: id, workItemId: a.id, decisionId: id, message: `Not ${String(id)}.` });
    await c.until(() => (c.messages.filter((m) => m.type === "done").length === ids.length ? true : undefined), 10000);
    expect(c.messages.slice(before).flatMap((m) => (m.type === "done" ? [m.requestId] : []))).toEqual(ids);
    await d.close();
    expect(recordIn(directory)?.decisions.map(({ state }) => state)).toEqual(ids.map((id) => ({ is: "reversed", message: `Not ${String(id)}.` })));
  });

  it("waits at its close for a word whose worktree is still being read: a reversal sent just before the close is written and committed when the close has ended", async () => {
    const { d, c, workItems } = await withWorkItems(["Closing"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    d.decided(a.id, DEFAULT);
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    // A socket's messages are taken in the order they came, so the answer to the second says the daemon has the first, whose read of the worktree by git takes longer than that answer.
    c.send({ type: "setWorkItem", requestId: 2, id: a.id, pinned: true });
    await c.message("done", (m) => m.requestId === 2);
    await d.close();
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "No." });
    expect(commitsIn(a.worktree)).toBe(2);
    expect(newest(a.worktree).subject).toBe("chore: record the person's reversal of decision 1");
  });

  it("leaves the record written and not committed while a headless session of the work item is working, and while a pane of it is, with `wordOwed` saying so, and commits it within a turn of the pass once the session has stopped working, with no word sent after: a commit of the record alone with the subject and the trailer of the reversal, and `wordOwed` null; the other work item's word is committed meanwhile", async () => {
    const { d, c, workItems } = await withWorkItems(["Worked in", "Quiet"], { ...QUICK, roleAdapter: fakeAdapter({ delayMs: 400 }) });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    for (const says of ["One.", "Two."]) d.decided(a.id, { ...DEFAULT, says });
    for (const says of ["One.", "Two."]) d.decided(b.id, { ...DEFAULT, says });

    // A headless session works in the first work item, and none in the second.
    await d.startRoleSession(a.id, "Quick?", PROOFER);
    const from = c.messages.length;
    await reversal(c, 2, a.id, 1);
    await carried(c, a.id, WORKING, from);
    await reversal(c, 3, b.id, 1);
    await c.until(() => (commitsIn(b.worktree) === 2 ? true : undefined), 3000);
    expect(newest(b.worktree).subject).toBe("chore: record the person's reversal of decision 1");
    expect(commitsIn(a.worktree)).toBe(1);
    await c.message("headless", (m) => m.headless.state === "finished");
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);

    // A pane of the first work item says it is working, and then that its turn has ended, while its process stays.
    const pane = await workingPane(d, c, 4, a.id);
    const later = c.messages.length;
    await reversal(c, 5, a.id, 2);
    await carried(c, a.id, WORKING, later);
    await reversal(c, 6, b.id, 2);
    await c.until(() => (commitsIn(b.worktree) === 3 ? true : undefined), 3000);
    expect(commitsIn(a.worktree)).toBe(2);
    d.agentEvent(pane, "Stop", {});
    await c.until(() => (commitsIn(a.worktree) === 3 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 2", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    expect(git(a.worktree, "show", `HEAD:${RECORD}`)).toBe(readFileSync(join(directory, RECORD_FILE), "utf8"));
    await rests(c, a.id, null);
  });

  it("leaves the record written and not committed while the work item's chain is running, with `wordOwed` naming the chain, and commits it within a turn of the pass once the chain has stopped", async () => {
    // The fake proofer's answer holds no round record, so the chain stops when round 1's session ends.
    const { c, d, workItems } = await withWorkItems(["Chained"], { ...QUICK, roleAdapter: fakeAdapter({ delayMs: 400 }) });
    const a = workItems[0]!;
    withDirectory(a);
    d.decided(a.id, DEFAULT);
    // A chain starts only on a branch whose records name a broad gate command.
    writeFileSync(join(a.worktree, "seal", "config.json"), '{ "Broad gate": "true" }\n');
    git(a.worktree, "add", "--all");
    git(a.worktree, "commit", "--quiet", "-m", "chore: add the records and declare the routing");
    const chainOf = (): WorkItem["chain"] | undefined => c.messages.flatMap((m) => (m.type === "inbox" ? m.workItems : [])).at(-1)?.chain;
    await d.startChain(a.id, true);
    const from = c.messages.length;
    await reversal(c, 1, a.id, 1);
    await carried(c, a.id, { waits: "session", why: "the work item's chain is running" }, from);
    expect(commitsIn(a.worktree)).toBe(2);
    await c.until(() => (chainOf()?.state === "stopped" ? true : undefined), 10_000);
    await c.until(() => (commitsIn(a.worktree) === 3 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
  });

  it("makes no commit of a word left for a working pane where a commit made in the worktree meanwhile carried it: once the pane has stopped working, `wordOwed` is null, no `git add` runs at the turns of the pass, and the branch holds the worktree's commit alone", async () => {
    const { d, c, made, workItems } = await withWorkItems(["Carried"], QUICK);
    const a = workItems[0]!;
    withDirectory(a);
    d.decided(a.id, DEFAULT);
    const watched = watchedGit(made.base);
    const pane = await workingPane(d, c, 1, a.id);
    const from = c.messages.length;
    await reversal(c, 2, a.id, 1);
    await carried(c, a.id, WORKING, from);
    // The session's own commit carries the record.
    git(a.worktree, "add", RECORD);
    git(a.worktree, "commit", "--quiet", "-m", "the session's commit");
    const adds = watched.calls("add");
    d.agentEvent(pane, "Stop", {});
    await rests(c, a.id, null);
    // Each turn of the pass in this wait would try a word still owed.
    await new Promise((resolve) => setTimeout(resolve, 20 * QUICK.wordPassMs));
    expect(watched.calls("add")).toBe(adds);
    expect(git(a.worktree, "log", "--format=%s").trim().split("\n")).toEqual(["the session's commit", "first"]);
  });

  it("names the commit of a reversal and an answer owed together the person's word: a pane works while a decision is reversed and a question is answered, and once its turn has ended one commit carries both", async () => {
    const { d, c, workItems } = await withWorkItems(["Both"], QUICK);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    d.decided(a.id, DEFAULT);
    d.park(a.id, { by: "sealer", questions: [{ asks: "May the session push?", grounds: "A push needs the person's approval." }] });
    const pane = await workingPane(d, c, 1, a.id);
    await reversal(c, 2, a.id, 1);
    c.send({ type: "answerQuestions", requestId: 3, workItemId: a.id, answers: [{ questionId: 2, answer: "Yes, push." }] });
    await c.message("done", (m) => m.requestId === 3);
    expect(commitsIn(a.worktree)).toBe(1);
    d.agentEvent(pane, "Stop", {});
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's word", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    const committed = readDecisionRecord(git(a.worktree, "show", `HEAD:${RECORD}`));
    expect([committed.decisions[0]?.state.is, committed.questions[0]?.state.is]).toEqual(["reversed", "answered"]);
    expect(recordIn(directory)).toEqual(committed);
  });

  it("commits a word left while the work item's pane worked once the person interrupted the pane's turn, read from its session log, within a turn of the pass and with no word sent after", async () => {
    const { d, c, workItems } = await withWorkItems(["Interrupted", "Quiet"], QUICK);
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    d.decided(a.id, DEFAULT);
    d.decided(b.id, DEFAULT);

    // A Claude Code pane of the first work item works.
    const pane = await workingPane(d, c, 1, a.id);
    await reversal(c, 2, a.id, 1);
    await reversal(c, 3, b.id, 1);
    await c.until(() => (commitsIn(b.worktree) === 2 ? true : undefined), 3000);
    expect(commitsIn(a.worktree)).toBe(1);

    // The person presses Esc during the pane's Bash call, and the pane's process stays.
    await interruptToolCall(d, pane, sessionLog(cleanups));
    await c.message("inbox", (m) => m.sessions.some((each) => each.id === pane && each.alive && each.state === "waiting"));
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree).subject).toBe("chore: record the person's reversal of decision 1");
    expect(recordIn(directory)).toEqual(readDecisionRecord(git(a.worktree, "show", `HEAD:${RECORD}`)));
  });

  it("makes the commits of one worktree one after another, each of the file as it stands at its turn: two reversals written while a commit is under way wait for it, the first of their turns commits both under the subject of the person's word, the second's turn commits nothing, and the log holds nothing", async () => {
    const { d, c, made: repository, workItems } = await withWorkItems(["Thrice"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    for (const says of ["One.", "Two.", "Three."]) d.decided(a.id, { ...DEFAULT, says });
    // The hook holds the first commit, which has the index locked, until the case lets it go.
    const [started, go] = [join(repository.base, "hook-started"), join(repository.base, "hook-go")];
    writeFileSync(join(repository.repo, ".git", "hooks", "pre-commit"), `#!/bin/sh\ntouch '${started}'\nwhile [ ! -f '${go}' ]; do sleep 0.05; done\n`, { mode: 0o755 });
    const said = logged();
    const reverse = (decisionId: number): void => c.send({ type: "reverseDecision", requestId: decisionId, workItemId: a.id, decisionId, message: `Not ${String(decisionId)}.` });
    reverse(1);
    await c.until(() => (existsSync(started) ? true : undefined), 3000);
    reverse(2);
    reverse(3);
    await c.message("done", (m) => m.requestId === 3);
    writeFileSync(go, "");
    await d.close();
    expect(git(a.worktree, "log", "--format=%s").trim().split("\n")).toEqual(["chore: record the person's word", "chore: record the person's reversal of decision 1", "first"]);
    const committed = (commit: string): unknown[] => readDecisionRecord(git(a.worktree, "show", `${commit}:seal/threads/1-item/decisions.md`)).decisions.map(({ state }) => state.is);
    expect([committed("HEAD~1"), committed("HEAD")]).toEqual([["reversed", "decided", "decided"], ["reversed", "reversed", "reversed"]]);
    expect(git(a.worktree, "show", "HEAD:seal/threads/1-item/decisions.md")).toBe(readFileSync(join(directory, RECORD_FILE), "utf8"));
    expect(said).toEqual([]);
  });

  it("says in the log why a record that git ignores was not committed, and answers `done`", async () => {
    const { c, made: repository, workItems } = await withWorkItems(["Ignored"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    writeFileSync(join(repository.repo, ".git", "info", "exclude"), "seal/\n");
    const said = logged();
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    expect(await c.message("done", (m) => m.requestId === 1)).toEqual({ type: "done", requestId: 1 });
    await c.until(() => (said.length > 0 ? true : undefined), 3000);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^the person's word was not committed: .*ignored/s);
    expect(commitsIn(a.worktree)).toBe(1);
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "No." });
  });

  it("answers `done` and keeps the record written where the commit fails, says so in the lists and tries again: a `pre-commit` hook that prints a line and exits 1 leaves the branch with no new commit and the record not staged, `wordOwed` carries the retry with the hook's line, the log holds git's words once, the hook's among them, and once the hook is gone a later try commits the record and `wordOwed` is null", async () => {
    const { c, made: repository, workItems } = await withWorkItems(["Hooked"], QUICK);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    // A worktree runs the hooks of its repository.
    const refusing = join(repository.repo, ".git", "hooks", "pre-commit");
    writeFileSync(refusing, "#!/bin/sh\necho 'the hook says no.' >&2\nexit 1\n", { mode: 0o755 });
    const said = logged();
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    const stood = status(a.worktree);
    await reversal(c, 1, a.id, 1);
    await rests(c, a.id, { waits: "retry", why: "the hook says no" });
    // Two waits of the retry: each try in them fails as the first did.
    await new Promise((resolve) => setTimeout(resolve, 3 * QUICK.wordRetryMs));
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^the person's word was not committed: /);
    expect(said[0]).toContain("the hook says no");
    expect(commitsIn(a.worktree)).toBe(1);
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "Not 1." });
    expect(status(a.worktree)).toEqual(stood);

    rmSync(refusing);
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 5000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
    expect(said).toHaveLength(1);
  });

  it("tries a failed word again at the next turn of the pass once the record's text changes, before the wait after the failure is over: an edit of a decision's grounds, which is no word of the person's, after the refusing hook is gone, gives the commit within a few turns, where the wait is a minute", async () => {
    // A wait far longer than the case, so only the change of the record can make the try due.
    const { c, made, workItems } = await withWorkItems(["Edited"], { wordPassMs: 50, wordRetryMs: 60_000 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const refusing = join(made.repo, ".git", "hooks", "pre-commit");
    writeFileSync(refusing, "#!/bin/sh\necho 'the hook says no.' >&2\nexit 1\n", { mode: 0o755 });
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    await reversal(c, 1, a.id, 1);
    await rests(c, a.id, { waits: "retry", why: "the hook says no" });
    rmSync(refusing);
    // The pass's turns while the record stands as it failed try nothing.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(commitsIn(a.worktree)).toBe(1);
    const file = join(directory, RECORD_FILE);
    const text = readFileSync(file, "utf8");
    expect(text.split(DEFAULT.grounds)).toHaveLength(2);
    writeFileSync(file, text.replace(DEFAULT.grounds, `${DEFAULT.grounds} Edited.`));
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
  });

  it("tries a failed word again at the next turn of the pass once the branch's head moves while a client is connected, before the wait after the failure is over: a commit made by hand after the refusing hook is gone gives the daemon's commit of the record, where the wait is a minute", async () => {
    const { c, made, workItems } = await withWorkItems(["Moved"], { wordPassMs: 50, wordRetryMs: 60_000, commitPollMs: 30 });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const refusing = join(made.repo, ".git", "hooks", "pre-commit");
    writeFileSync(refusing, "#!/bin/sh\necho 'the hook says no.' >&2\nexit 1\n", { mode: 0o755 });
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    await reversal(c, 1, a.id, 1);
    await rests(c, a.id, { waits: "retry", why: "the hook says no" });
    rmSync(refusing);
    // The pass's turns while the head stands as it failed try nothing.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(commitsIn(a.worktree)).toBe(1);
    commitFile(a.worktree, "moved.ts");
    await c.until(() => (commitsIn(a.worktree) === 3 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
  });

  it("commits a word left for a working pane once the pane's process exits while the pane still says it is working, within a turn of the pass: a pane that is not alive holds no word", async () => {
    // A pane of the kind that reports its state ends by itself after a second and a half, and every other pane stays.
    const commandFor = (kind: string) => (kind === "claude" ? { command: "/bin/sh", args: ["-c", "sleep 1.5"], env: {} } : silent());
    const { d, c, workItems } = await withWorkItems(["Exited"], { ...QUICK, commandFor });
    const a = workItems[0]!;
    withDirectory(a);
    d.decided(a.id, DEFAULT);
    const pane = await workingPane(d, c, 1, a.id);
    const from = c.messages.length;
    await reversal(c, 2, a.id, 1);
    await carried(c, a.id, WORKING, from);
    expect(commitsIn(a.worktree)).toBe(1);
    // The exit leaves the pane's state as its agent last said it, working.
    await c.message("exit", (m) => m.id === pane);
    await c.until(() => (commitsIn(a.worktree) === 2 ? true : undefined), 3000);
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
    await rests(c, a.id, null);
  });

  it("tries a commit that keeps failing again at waits that double: a `pre-commit` hook that notes the time of each run and exits 1 runs again no sooner than the retry's wait after the first try, twice it after the second and four times it after the third", async () => {
    const RETRY_MS = 300;
    const { c, made, workItems } = await withWorkItems(["Retried"], { wordPassMs: 50, wordRetryMs: RETRY_MS });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    const times = join(made.base, "hook-times");
    writeFileSync(join(made.repo, ".git", "hooks", "pre-commit"), `#!/bin/sh\nperl -MTime::HiRes=time -e 'printf "%d\\n", time * 1000' >> '${times}'\nexit 1\n`, { mode: 0o755 });
    const said = logged();
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    await reversal(c, 1, a.id, 1);
    const ran = (): number[] => (existsSync(times) ? readFileSync(times, "utf8").split("\n").filter((line) => line !== "").map(Number) : []);
    await c.until(() => (ran().length >= 4 ? true : undefined), 15_000);
    const [first, second, third, fourth] = ran() as [number, number, number, number];
    expect([second - first >= RETRY_MS, third - second >= 2 * RETRY_MS, fourth - third >= 4 * RETRY_MS]).toEqual([true, true, true]);
    expect(said).toHaveLength(1);
  });

  it("ends a commit whose `pre-commit` hook never ends at the daemon's limit, so the worktree's later commits and the close are not held: two reversals are each answered `done`, the log holds the sentence of the limit once, the second word's try runs the hook again once the first was ended, and the close resolves with no commit made and no `index.lock` left", async () => {
    const { d, c, made, workItems } = await withWorkItems(["Hung"], { commitLimitMs: LIMIT_MS, commitCloseWaitMs: 200 });
    const a = workItems[0]!;
    withDirectory(a);
    for (const says of ["One.", "Two."]) d.decided(a.id, { ...DEFAULT, says });
    const started = hook(made, "pre-commit", never(made));
    const said = logged();
    await reversal(c, 1, a.id, 1);
    await reversal(c, 2, a.id, 2);
    await c.until(() => (started().length === 2 ? true : undefined), 3 * LIMIT_MS + COMMIT_END_GRACE_MS);
    expect(said).toEqual(["the person's word was not committed: git commit did not end in 2 seconds and was ended"]);
    await d.close();
    await gone(started);
    expect(commitsIn(a.worktree)).toBe(1);
    expect(locked(a.worktree)).toBe(false);
  });

  it("ends at its close a commit under way whose `pre-commit` hook never ends, after the close's wait and under the default limit: the close resolves within the wait and the grace, the record holds the reversal and is not staged, no `index.lock` stands, the hook's process is gone, and the log holds nothing", async () => {
    const WAIT_MS = 500;
    const { d, c, made, workItems } = await withWorkItems(["Closing on a hook"], { commitCloseWaitMs: WAIT_MS });
    const a = workItems[0]!;
    const directory = withDirectory(a);
    d.decided(a.id, DEFAULT);
    const started = hook(made, "pre-commit", never(made));
    const stood = status(a.worktree);
    const said = logged();
    await reversal(c, 1, a.id, 1);
    await c.until(() => (started().length === 1 ? true : undefined), 5000);
    const from = Date.now();
    await d.close();
    const took = Date.now() - from;
    expect(took).toBeGreaterThanOrEqual(WAIT_MS);
    expect(took).toBeLessThan(WAIT_MS + COMMIT_END_GRACE_MS);
    await gone(started);
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "Not 1." });
    expect(status(a.worktree)).toEqual(stood);
    expect(locked(a.worktree)).toBe(false);
    expect(commitsIn(a.worktree)).toBe(1);
    expect(said).toEqual([]);
  });

  it("commits at a daemon's start a word whose commit failed before the last daemon closed: once the hook is gone, a new daemon on the same run folder commits it when a client connects, with the subject of what is owed", async () => {
    const { d, c, made, runDir, workItems } = await withWorkItems(["Restarted"]);
    const a = workItems[0]!;
    withDirectory(a);
    d.decided(a.id, DEFAULT);
    const refusing = join(made.repo, ".git", "hooks", "pre-commit");
    writeFileSync(refusing, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    const said = logged();
    await reversal(c, 1, a.id, 1);
    await c.until(() => (said.length === 1 ? true : undefined), 3000);
    await d.close();
    rmSync(refusing);
    expect(commitsIn(a.worktree)).toBe(1);
    const { url } = await daemon({ runDir, worktreesRoot: made.root, commandFor: silent });
    await (await client(url)).message("ready");
    await vi.waitFor(() => expect(commitsIn(a.worktree)).toBe(2), { timeout: 5000, interval: 50 });
    expect(newest(a.worktree)).toEqual({ subject: "chore: record the person's reversal of decision 1", body: "Seal-Routing: 1-item", by: WHO, paths: [RECORD] });
  });

  it("commits nothing for the blocks a stage wrote: a record no commit holds, with a decision that stands `decided` and a question that stands `open`, is read at each interval, git is never asked for its committed text, no `git add` runs, no commit is made and `wordOwed` is null", async () => {
    const { d, c, made, workItems } = await withWorkItems(["A stage's blocks"], { ...QUICK, commitPollMs: 30 });
    const a = workItems[0]!;
    withDirectory(a);
    const watched = watchedGit(made.base);
    d.decided(a.id, DEFAULT);
    d.park(a.id, { by: "sealer", questions: [{ asks: "May the session push?", grounds: "A push needs the person's approval." }] });
    await c.message("inbox", (m) => inboxItem(m, a.id)?.questions.length === 1);
    // Each interval in this wait reads the records, and each turn of the pass would try a word owed.
    await new Promise((resolve) => setTimeout(resolve, 20 * QUICK.wordPassMs));
    expect(watched.noted().filter((line) => line.includes(RECORD))).toEqual([]);
    expect(watched.calls("add")).toBe(0);
    expect(commitsIn(a.worktree)).toBe(1);
    await rests(c, a.id, null);
  });
});

describe("the last look", () => {
  type Client = Awaited<ReturnType<typeof client>>;
  const stateOf = (m: Extract<ServerMessage, { type: "inbox" }>, id: number) => m.sessions.find((s) => s.id === id)?.state;

  function repository() {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  }

  /**
   * Sends `looked`, which has no answer, and after it a start the daemon
   * refuses: the refusal arrives once the daemon has handled both, and starts nothing.
   */
  let refused = 900;
  async function looked(c: Client): Promise<void> {
    const requestId = refused++;
    c.send({ type: "looked" });
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId, workItemId: 999 });
    await c.message("error", (m) => m.requestId === requestId);
  }

  /** The look a client that says hello now is given. */
  const lookNow = async (url: string) => (await (await client(url)).message("ready")).lastLook;
  /** A work item as the look keeps it: without what its records say of the chain, without the wait of a heavy command, without what a word of the person's waits for and without whether Owlery made its branch, which the look does not keep, and with its seal reading. */
  const asLooked = ({ recorded: _recorded, accountId: _accountId, machineWait: _machineWait, wordOwed: _wordOwed, ownsBranch: _ownsBranch, ...kept }: WorkItem): WorkItem => kept;

  it("gives a client no look where no client ever sent `looked`", async () => {
    const { url } = await daemon();
    expect((await (await client(url)).message("ready")).lastLook).toBeNull();
    expect(await lookNow(url)).toBeNull();
  });

  it("keeps the time and both lists of the moment a client sends `looked`, and gives them to a client that connects afterwards", async () => {
    const { repo, root } = repository();
    const { daemon: d, url } = await daemon({ worktreesRoot: root, now: () => 1234 });
    const c = await client(url);
    expect((await c.message("ready")).lastLook).toBeNull();
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Looked at", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    d.agentEvent(session.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "working");
    await looked(c);
    // The agent goes on after the look, and the look stays as it was taken.
    d.agentEvent(session.id, "PermissionRequest", { tool_name: "Bash" });
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    const ready = await (await client(url)).message("ready");
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working", stateSince: 1234, stateText: null, stateTool: null, stateQuestions: null }], workItems: [asLooked(workItem)] });
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, accountId: 0, signsIn: null, state: "waiting", stateSince: 1234, stateText: null, stateTool: "Bash", stateQuestions: null }]);
  });

  it("replaces the look with the one of a later `looked`, from whichever client", async () => {
    let clock = 100;
    const { url } = await daemonWithWorkItem({ now: () => clock });
    const one = await client(url);
    await one.message("ready");
    await looked(one);
    expect(await lookNow(url)).toEqual({ at: 100, sessions: [], workItems: [expect.objectContaining({ id: 1 })] });
    const two = await client(url);
    await two.message("ready");
    two.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await two.message("started");
    clock = 200;
    await looked(two);
    // The look keeps no account a pane was launched under, and no account whose sign-in it runs.
    const { accountId: _, signsIn: __, ...lookedSession } = session;
    expect(await lookNow(url)).toEqual({ at: 200, sessions: [lookedSession], workItems: [expect.objectContaining({ id: 1 })] });
  });

  it("tells a client of the look only in its `ready`: a `looked` is answered with nothing and sent to nobody", async () => {
    const { url } = await daemon();
    const one = await client(url);
    const other = await client(url);
    await one.message("ready");
    await other.message("ready");
    await looked(one);
    expect(one.messages.map((m) => m.type)).toEqual(["ready", "error"]);
    expect(other.messages.map((m) => m.type)).toEqual(["ready"]);
  });

  it("handles what a client sends after its hello only once its `ready` is sent: a look sent at once is taken after the counts were read, and is not the look that `ready` carries", async () => {
    const made = repository();
    const { runDir, workItem } = await runFolderWithWorkItem(made, "Looked at early");
    // The read takes long enough for both messages to arrive before it ends, and the wait is longer still.
    watchedGit(made.base, 0.2);
    const { url } = await daemon({ runDir, worktreesRoot: made.root, readyWaitMs: 5000, now: () => 1234 });
    const c = await client(url);
    c.send({ type: "looked" });
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 7, workItemId: 999 });
    const ready = await c.message("ready");
    expect(ready.lastLook).toBeNull();
    expect(ready.workItems[0]?.newCommits).toBe(1);
    await c.message("error", (m) => m.requestId === 7);
    expect(c.messages.map((m) => m.type)).toEqual(["ready", "error"]);
    // The look holds the work item as it is sent, the commit read at the hello among it, and the head read with no seal.
    expect(await lookNow(url)).toEqual({ at: 1234, sessions: [], workItems: [{ ...workItem, repoId: 1, repoName: "project", ...UNSET, ...NO_RECORD, aheadOfBase: 1, behindBase: 0, newCommits: 1, commits: [expect.objectContaining({ subject: "one" })], changes: { files: 0, added: 0, removed: 0, list: [] }, seal: null }] });
  });

  it("gives after a restart the look taken before it, from a file the user alone can read", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const first = new Daemon({ token: TOKEN, paneKinds: PANE_KINDS, roleAdapter: fakeAdapter(), commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }), runDir, worktreesRoot: root, now: () => 1234 });
    const c = await client(`ws://127.0.0.1:${await first.listen(0)}`);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Outlives the daemon", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    first.agentEvent(session.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "working");
    await looked(c);
    await first.close();
    expect(statSync(join(runDir, "last-look.json")).mode & 0o777).toBe(0o600);

    const { url } = await daemon({ runDir, worktreesRoot: root, now: () => 5678 });
    const ready = await (await client(url)).message("ready");
    // The look keeps the session it was taken with, which the daemon that starts no longer holds.
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working", stateSince: 1234, stateText: null, stateTool: null, stateQuestions: null }], workItems: [asLooked(workItem)] });
    expect(ready.sessions).toEqual([]);
  });

  it("stays up and holds the look where its run folder cannot be written, and says so in its log", async () => {
    const { base } = repository();
    const said: unknown[][] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void said.push(args);
    cleanups.push(() => {
      console.error = error;
    });
    const { url } = await daemon({ runDir: join(base, "removed"), now: () => 1234 });
    const c = await client(url);
    await c.message("ready");
    await looked(c);
    expect(await lookNow(url)).toEqual({ at: 1234, sessions: [], workItems: [] });
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^the last look was not written: /)]);
  });
});

describe("headless sessions", () => {
  type Headless = Extract<ServerMessage, { type: "headless" }>;
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const told = (c: { messages: ServerMessage[] }): HeadlessInfo[] => c.messages.flatMap((m) => (m.type === "headless" ? [m.headless] : []));

  /** A daemon that holds one work item, and the clients connected to it. */
  async function withWorkItem(options: Partial<DaemonOptions> = {}, clients = 1) {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { daemon: d, url } = await daemon({ worktreesRoot: made.root, now: () => 1234, ...options });
    const connected = [];
    for (let i = 0; i < clients; i++) {
      const c = await client(url);
      await c.message("ready");
      connected.push(c);
    }
    const c = connected[0]!;
    c.send({ type: "createWorkItem", requestId: 100, repo: made.repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    return { daemon: d, url, clients: connected, c, workItem };
  }

  /** A fake adapter that also records where each session was started, and how many runs were stopped. */
  function watched(inner: RoleAdapter = fakeAdapter()) {
    const seen = { started: [] as { prompt: string; cwd: string; role?: RoleStage }[], stopped: 0 };
    const adapter: RoleAdapter = {
      name: inner.name,
      features: inner.features, notice: inner.notice,
      start: async (options, listener) => {
        seen.started.push(options);
        const run = await inner.start(options, listener);
        return {
          ...run,
          stop: () => {
            seen.stopped++;
            return run.stop();
          },
        };
      },
    };
    return { adapter, seen };
  }

  it("starts no session at a message of a client: a client that sends what a window of an earlier build sent to start one is answered nothing, and the daemon lists no session", async () => {
    const { adapter, seen } = watched();
    const { c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Q", role: PROOFER });
    // A message the daemon refuses: every message it sent for the two before has then arrived.
    c.send({ type: "stopHeadless", requestId: 3, id: 99 });
    await c.message("error", (m) => m.requestId === 3);
    await pause(100);
    expect(c.messages.filter((m) => "requestId" in m && (m.requestId === 1 || m.requestId === 2))).toEqual([]);
    expect(c.messages.some((m) => m.type === "headless")).toBe(false);
    expect(seen.started).toEqual([]);
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
  });

  it("runs a session against the fake adapter: every client sees it working, its text as it grows, then finished with the whole answer", async () => {
    const { daemon: d, clients, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ pieces: () => ["A barn ", "owl."] }) }, 2);
    const working = { id: 1, workItemId: workItem.id, prompt: "Which owl?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: PROOFER, accountId: 0 };
    expect(await d.startRoleSession(workItem.id, "Which owl?", PROOFER)).toEqual(working);
    for (const c of clients) {
      await c.message("headless", (m) => m.headless.state === "finished");
      expect(told(c)).toEqual([working, { ...working, answer: "A barn " }, { ...working, answer: "A barn owl." }, { ...working, state: "finished", answer: "A barn owl." }]);
    }
  });

  it("starts the session in the work item's worktree, with the prompt and the role it was given", async () => {
    const { adapter, seen } = watched();
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter });
    await d.startRoleSession(workItem.id, "Where am I?", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    expect(seen.started).toEqual([{ prompt: "Where am I?", cwd: workItem.worktree, role: PROOFER }]);
  });

  it("launches a role: the session starts as the pair it is given, every `headless` and a later `ready` carry the pair, and the answer names it", async () => {
    const { adapter, seen } = watched();
    const { daemon: d, clients, url, workItem } = await withWorkItem({ roleAdapter: adapter }, 2);
    const role = { role: "crafter", stage: "fix-pass" } as const;
    expect(await d.startRoleSession(workItem.id, "Which owl?", role)).toEqual({ id: 1, workItemId: workItem.id, prompt: "Which owl?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role, accountId: 0 });
    for (const c of clients) {
      const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
      expect(headless.answer).toBe('As the crafter at the stage fix-pass, you asked: "Which owl?"');
      expect(told(c).map((h) => h.role)).toEqual([role, role, role]);
    }
    expect(seen.started).toEqual([{ prompt: "Which owl?", cwd: workItem.worktree, role }]);
    expect((await (await client(url)).message("ready")).headless.map((h) => h.role)).toEqual([role]);
  });

  it("launches each pair the protocol lists", async () => {
    const { adapter, seen } = watched();
    const { daemon: d, workItem } = await withWorkItem({ roleAdapter: adapter });
    expect(ROLE_STAGES).toEqual([
      { role: "proofer", stage: "round" },
      { role: "crafter", stage: "fix-pass" },
      { role: "sealer", stage: "seal" },
      { role: "orchestrator", stage: "judgment" },
    ]);
    for (const pair of ROLE_STAGES) expect((await d.startRoleSession(workItem.id, "Q", pair)).role).toEqual(pair);
    expect(seen.started.map((started) => started.role)).toEqual([...ROLE_STAGES]);
  });

  it("holds a role session to its limit and to a client's stop as any other", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 60_000 }));
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 150 });
    const role = { role: "sealer", stage: "seal" } as const;
    await d.startRoleSession(workItem.id, "Q", role);
    const limited = (await c.message("headless", (m) => m.headless.id === 1 && m.headless.state === "failed")).headless;
    expect([limited.stopped, limited.error, limited.role]).toEqual(["limit", "the session reached its time limit and was stopped", role]);
    const headless = await d.startRoleSession(workItem.id, "Q", role);
    c.send({ type: "stopHeadless", requestId: 3, id: headless.id });
    const stopped = (await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless;
    expect([stopped.stopped, stopped.role]).toEqual(["request", role]);
    expect(seen.stopped).toBe(2);
  });

  it("carries the usage the adapter reports, takes the result's text as the whole answer, and nothing after it", async () => {
    const usage: Usage = { costUsd: 0.25, converted: false, models: [{ model: "owl-1", inputTokens: 10, outputTokens: 20, cacheReadTokens: null, cacheWriteTokens: 0, costUsd: 0.25 }] };
    const roleAdapter: RoleAdapter = {
      name: "priced",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: (_options, listener) => {
        setTimeout(() => {
          listener({ type: "text", text: "Let me look. " });
          listener({ type: "text", text: "An owl." });
          listener({ type: "result", text: "An owl.", isError: false, usage });
          listener({ type: "text", text: " And more." });
          listener({ type: "exit", exitCode: 0, errorOutput: "" });
        }, 0);
        return Promise.resolve({ stop: () => Promise.resolve(), answer: () => {} });
      },
    };
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    expect(headless).toMatchObject({ answer: "An owl.", usage, error: null });
    // The result closes the answer: the text that arrives after it changes nothing.
    await pause(100);
    expect(told(c).map((h) => h.answer)).toEqual(["", "Let me look. ", "Let me look. An owl.", "An owl."]);
  });

  it("keeps the id and the model a session's adapter reports on its own record of the session, and sends neither in any message: not with the session, not in the ledger, and not in the lists of a client that connects later", async () => {
    const { daemon: d, url, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ session: () => ({ id: "s-kept-7f3", model: "owl-judge-9" }) }) });
    await d.startRoleSession(workItem.id, "Q", { role: "sealer", stage: "seal" });
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    // The record is the daemon's own and no message reads it, so the case reads the field: the seal's stage writes both values into the verdict block.
    const kept = (d as unknown as { headless: Map<number, { named: { id: string; model: string | null } | null }> }).headless.get(headless.id)?.named;
    expect(kept).toEqual({ id: "s-kept-7f3", model: "owl-judge-9" });
    c.send({ type: "readLedger", requestId: 2, workItemId: workItem.id });
    expect((await c.message("ledger")).entries).toHaveLength(1);
    const late = await client(url);
    expect((await late.message("ready")).headless.map((each) => each.id)).toEqual([headless.id]);
    const sent = JSON.stringify([...c.messages, ...late.messages]);
    for (const word of ["s-kept-7f3", "owl-judge-9"]) expect(sent, word).not.toContain(word);
  });

  it("says a session failed, with the adapter's message, where the adapter does not start", async () => {
    const { daemon: d, clients, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "start" }) }, 2);
    expect((await d.startRoleSession(workItem.id, "Q", PROOFER)).state).toBe("working");
    for (const c of clients) {
      const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
      expect(headless).toMatchObject({ id: 1, state: "failed", answer: "", error: "the fake adapter was told not to start", usage: null });
    }
  });

  it("says a session failed, with the result's text, where the result is an error", async () => {
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "result" }) });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect(headless).toMatchObject({ state: "failed", answer: "", error: "the fake adapter was told to fail" });
    // The exit that follows the result changes nothing, and is told to nobody.
    await pause(100);
    expect(told(c).map((h) => h.state)).toEqual(["working", "failed"]);
  });

  it("says a session failed, with the exit code, where the process exits without a result", async () => {
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "exit" }) });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect(headless).toMatchObject({ state: "failed", answer: "", error: "the session exited with code 1 and gave no result" });
  });

  it("tells nobody of the exit that follows a result", async () => {
    const { daemon: d, c, workItem } = await withWorkItem();
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    await pause(100);
    expect(told(c).map((h) => h.state)).toEqual(["working", "working", "finished"]);
  });

  it("lists a finished session, with its answer, to a client that connects later", async () => {
    const { daemon: d, c, url, workItem } = await withWorkItem();
    await d.startRoleSession(workItem.id, "Remembered?", PROOFER);
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    c.socket.close();
    const later = await client(url);
    expect((await later.message("ready")).headless).toEqual([headless]);
    expect(headless).toEqual({ id: 1, workItemId: workItem.id, prompt: "Remembered?", state: "finished", answer: proofersAnswer("Remembered?"), error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: PROOFER, accountId: 0 });
  });

  it("lists no headless session where none was started, and counts them apart from the panes", async () => {
    const { daemon: d, c, url, workItem } = await withWorkItem();
    // The work item's pane already holds the pane id 1.
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
    expect((await d.startRoleSession(workItem.id, "One", PROOFER)).id).toBe(1);
    expect((await d.startRoleSession(workItem.id, "Two", PROOFER)).id).toBe(2);
    await c.message("headless", (m) => m.headless.id === 2 && m.headless.state === "finished");
    expect((await (await client(url)).message("ready")).headless.map((h) => [h.id, h.prompt, h.state])).toEqual([[1, "One", "finished"], [2, "Two", "finished"]]);
  });

  it("carries only the fields the protocol names, the adapter's name not among them, and a usage only with its mark", async () => {
    const usage: Usage = { costUsd: 0.5, converted: true, models: [{ model: "owl-1", inputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4, costUsd: 0.5 }] };
    const { daemon: d, c, url, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ usage: () => usage }) });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    const changed = await c.message("headless", (m) => m.headless.state === "finished");
    const ready = await (await client(url)).message("ready");
    const fields = ["accountId", "answer", "error", "errorOutput", "id", "prompt", "role", "startedAt", "state", "stopped", "usage", "workItemId"];
    expect(Object.keys(changed).sort()).toEqual(["headless", "type"]);
    for (const info of [...told(c), ready.headless[0]!]) expect(Object.keys(info).sort()).toEqual(fields);
    // The cost travels with whether it is a value converted at API prices, and nothing else of the agent's travels beside it.
    for (const info of [changed.headless, ready.headless[0]!]) {
      expect(info.usage).toEqual(usage);
      expect(Object.keys(info.usage!).sort()).toEqual(["converted", "costUsd", "models"]);
      expect(Object.keys(info.usage!.models[0]!).sort()).toEqual(["cacheReadTokens", "cacheWriteTokens", "costUsd", "inputTokens", "model", "outputTokens"]);
    }
    expect(JSON.stringify([changed, ...told(c), ready.headless])).not.toContain("fake");
  });

  it("refuses a session it cannot start with a sentence, and starts nothing", async () => {
    const { adapter, seen } = watched();
    const { daemon: d, c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
    await expect(d.startRoleSession(42, "Q", PROOFER)).rejects.toThrow("no work item 42");
    await expect(d.startRoleSession(workItem.id, " \n", PROOFER)).rejects.toThrow("asking needs a work item and a prompt");
    await expect(d.startRoleSession(workItem.id, "Q", PROOFER, 9)).rejects.toThrow("No account 9 is kept.");
    rmSync(workItem.worktree, { recursive: true, force: true });
    await expect(d.startRoleSession(workItem.id, "Q", PROOFER)).rejects.toThrow(`the folder of work item ${workItem.id} is gone: ${workItem.worktree}`);
    expect(seen.started).toEqual([]);
    expect(c.messages.some((m) => m.type === "headless")).toBe(false);
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
  });

  it("stops every run still going when the daemon closes, and none of them again at its limit", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 5000 }));
    const { daemon: d, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 300 });
    await d.startRoleSession(workItem.id, "One", PROOFER);
    await d.startRoleSession(workItem.id, "Two", PROOFER);
    await pause(20);
    expect(seen.stopped).toBe(0);
    await d.close();
    expect(seen.stopped).toBe(2);
    await pause(400);
    expect(seen.stopped).toBe(2);
  });

  it("waits at its close until each run it stopped has ended", async () => {
    const inner = fakeAdapter({ delayMs: 60_000 });
    let ended = 0;
    // The run's process takes a moment to end after its stop.
    const roleAdapter: RoleAdapter = {
      name: inner.name,
      features: inner.features, notice: inner.notice,
      start: async (options, listener) => {
        const run = await inner.start(options, listener);
        return {
          ...run,
          stop: async () => {
            await run.stop();
            await pause(300);
            ended++;
          },
        };
      },
    };
    const { daemon: d, workItem } = await withWorkItem({ roleAdapter });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    await pause(20);
    await d.close();
    expect(ended).toBe(1);
  });

  it("stops a run that starts only after the daemon closed", async () => {
    const inner = fakeAdapter({ delayMs: 5000 });
    let stopped = 0;
    const roleAdapter: RoleAdapter = {
      name: "slow",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: async (options, listener) => {
        await pause(150);
        const run = await inner.start(options, listener);
        return {
          ...run,
          stop: () => {
            stopped++;
            return run.stop();
          },
        };
      },
    };
    const { daemon: d, workItem } = await withWorkItem({ roleAdapter });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    await d.close();
    expect(stopped).toBe(0);
    await pause(300);
    expect(stopped).toBe(1);
  });

  /** An adapter that answers the prompt "Quick?" at once and any other after a minute, and counts the runs it stopped. */
  function quickOrSlow() {
    const slow = fakeAdapter({ delayMs: 60_000 });
    const quick = fakeAdapter();
    return watched({ name: "fake", features: ["role-tools", "permission-requests"], notice: quick.notice, start: (options, listener) => (options.prompt === "Quick?" ? quick : slow).start(options, listener) });
  }

  it("carries what the agent's process printed on its error stream: every client sees the failed session with it, and `ready` lists it so", async () => {
    const printed = "error: unknown option '--no-such-option'\n";
    const { daemon: d, clients, url, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "exit", errorOutput: printed }) }, 2);
    const headless = await d.startRoleSession(workItem.id, "Q", PROOFER);
    const failed = { ...headless, state: "failed", error: "the session exited with code 1 and gave no result", errorOutput: printed };
    for (const c of clients) expect((await c.message("headless", (m) => m.headless.state === "failed")).headless).toEqual(failed);
    expect((await (await client(url)).message("ready")).headless).toEqual([failed]);
  });

  it("writes into a session that ended the error output its exit carries, and tells every client only where it changed", async () => {
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "result", errorOutput: "a trace" }) });
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    await c.message("headless", (m) => m.headless.errorOutput === "a trace");
    expect(told(c).map((h) => [h.state, h.error, h.errorOutput])).toEqual([
      ["working", null, ""],
      ["failed", "the fake adapter was told to fail", ""],
      ["failed", "the fake adapter was told to fail", "a trace"],
    ]);
  });

  it("stops a session still working at its limit: it fails with the limit's error and says the limit stopped it, its run is stopped, and the daemon may then go idle", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 60_000 }));
    let idle = 0;
    // The pane ends at once, so only the headless session can keep the daemon.
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 200, idleExitMs: 100, onIdle: () => idle++, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const headless = await d.startRoleSession(workItem.id, "Q", PROOFER);
    const failed = (await c.message("headless", (m) => m.headless.state === "failed")).headless;
    expect(failed).toEqual({ ...headless, state: "failed", error: "the session reached its time limit and was stopped", stopped: "limit" });
    expect(seen.stopped).toBe(1);
    c.socket.close();
    await c.until(() => (idle === 1 ? true : undefined));
    // Where the options name no limit, a session works an hour at most.
    expect(HEADLESS_LIMIT_MS).toBe(60 * 60_000);
  });

  it("stops at its limit a session whose adapter is still starting, once it has started, and leaves alone a session that ended before its limit", async () => {
    const inner = quickOrSlow();
    let stopped = 0;
    // The prompt "Slow to start?" waits for its adapter for 400 ms, past the limit.
    const roleAdapter: RoleAdapter = {
      name: "fake",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: async (options, listener) => {
        if (options.prompt === "Slow to start?") await pause(400);
        const run = await inner.adapter.start(options, listener);
        return {
          ...run,
          stop: () => {
            stopped++;
            return run.stop();
          },
        };
      },
    };
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter, headlessLimitMs: 200 });
    await d.startRoleSession(workItem.id, "Quick?", PROOFER);
    const quick = (await c.message("headless", (m) => m.headless.state === "finished")).headless;
    const headless = await d.startRoleSession(workItem.id, "Slow to start?", PROOFER);
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless).toMatchObject({ stopped: "limit" });
    expect(stopped).toBe(0);
    await c.until(() => (stopped === 1 ? true : undefined));
    await pause(300);
    expect(stopped).toBe(1);
    expect(told(c).filter((h) => h.id === quick.id).map((h) => h.state)).toEqual(["working", "working", "finished"]);
  });

  it("stops a working session at a client's request: it answers `done`, and every client sees the session failed with the request's error and saying a request stopped it; a session that ended is left as it is, and an id it does not list is refused", async () => {
    const { adapter, seen } = quickOrSlow();
    const { daemon: d, clients, url, workItem } = await withWorkItem({ roleAdapter: adapter }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    await d.startRoleSession(workItem.id, "Quick?", PROOFER);
    const finished = (await one.message("headless", (m) => m.headless.state === "finished")).headless;
    const headless = await d.startRoleSession(workItem.id, "Which file?", PROOFER);
    one.send({ type: "stopHeadless", requestId: 3, id: headless.id });
    expect(await one.message("done", (m) => m.requestId === 3)).toEqual({ type: "done", requestId: 3 });
    const failed = { ...headless, state: "failed", error: "the session was stopped at a request before it finished", stopped: "request" };
    for (const c of [one, two]) expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless).toEqual(failed);
    expect(seen.stopped).toBe(1);
    const before = one.messages.length;
    one.send({ type: "stopHeadless", requestId: 4, id: finished.id });
    one.send({ type: "stopHeadless", requestId: 5, id: headless.id });
    await one.message("done", (m) => m.requestId === 5);
    one.send({ type: "stopHeadless", requestId: 6, id: 99 });
    expect(await one.message("error", (m) => m.requestId === 6)).toEqual({ type: "error", requestId: 6, message: "no headless session 99" });
    await pause(100);
    expect(one.messages.slice(before).map((m) => m.type)).toEqual(["done", "done", "error"]);
    expect(seen.stopped).toBe(1);
    expect((await (await client(url)).message("ready")).headless).toEqual([finished, failed]);
  });

  it("keeps the sessions that ended last, as many as it is told, and every one still working: the one that ended first leaves the list, and every client is told", async () => {
    const quick = fakeAdapter();
    let finishSlow = (): void => {};
    // The prompt "Slow?" ends when the case says so, and any other at once.
    const roleAdapter: RoleAdapter = {
      name: "fake",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: async (options, listener) => {
        if (options.prompt !== "Slow?") return quick.start(options, listener);
        finishSlow = () => {
          listener({ type: "result", text: "slow", isError: false, usage: null });
          listener({ type: "exit", exitCode: 0, errorOutput: "" });
        };
        return { stop: () => Promise.resolve(), answer: () => {} };
      },
    };
    const { daemon: d, clients, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 2 }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    const dropped = (c: { messages: ServerMessage[] }) => c.messages.flatMap((m) => (m.type === "headlessDropped" ? [m.id] : []));
    const start = async (prompt: string) => (await d.startRoleSession(workItem.id, prompt, PROOFER)).id;
    const finishedOne = (id: number) => one.message("headless", (m) => m.headless.id === id && m.headless.state === "finished");
    const slow = await start("Slow?");
    for (const prompt of ["A", "B"]) await finishedOne(await start(prompt));
    await pause(50);
    expect(dropped(one)).toEqual([]);
    const fourth = await start("C");
    await finishedOne(fourth);
    for (const c of [one, two]) await c.until(() => (dropped(c).length === 1 ? true : undefined));
    // The session that started first ends last, so the second session ended first and leaves first, and the first is kept.
    finishSlow();
    for (const c of [one, two]) await c.until(() => (dropped(c).length === 2 ? true : undefined));
    expect([dropped(one), dropped(two)]).toEqual([[2, 3], [2, 3]]);
    expect((await (await client(url)).message("ready")).headless.map((h) => h.id)).toEqual([slow, fourth]);
    // Where the options name no number, the daemon keeps fifty.
    expect(HEADLESS_KEPT).toBe(50);
  });

  it("counts toward the bound no session that left the list with its work item", async () => {
    const { daemon: d, c, url, workItem } = await withWorkItem({ keptHeadless: 1, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    // The pane ends at once, so the removal names no running session.
    await c.message("exit");
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    c.send({ type: "removeRepository", requestId: 2, id: 1, workItems: [workItem.id], running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 2);
    const other = temporaryRepository();
    cleanups.push(other.remove);
    c.send({ type: "createWorkItem", requestId: 3, repo: other.repo, title: "Asked next", kind: "shell", cols: 80, rows: 24 });
    const next = (await c.message("workItemCreated", (m) => m.requestId === 3)).workItem;
    const headless = await d.startRoleSession(next.id, "Q", PROOFER);
    await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
    await pause(100);
    expect(c.messages.some((m) => m.type === "headlessDropped")).toBe(false);
    expect((await (await client(url)).message("ready")).headless.map((h) => h.id)).toEqual([headless.id]);
  });

  it("changes nothing at an exit that arrives for a session it no longer lists", async () => {
    const quick = fakeAdapter();
    let exitFirst = (): void => {};
    // The first session gives its result at once, and its process exits, printing on its error stream, only when the case says so.
    const roleAdapter: RoleAdapter = {
      name: "fake",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: async (options, listener) => {
        if (options.prompt !== "First?") return quick.start(options, listener);
        setTimeout(() => listener({ type: "result", text: "first", isError: false, usage: null }), 0);
        exitFirst = () => listener({ type: "exit", exitCode: 0, errorOutput: "late" });
        return { stop: () => Promise.resolve(), answer: () => {} };
      },
    };
    const { daemon: d, c, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 1 });
    await d.startRoleSession(workItem.id, "First?", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    await d.startRoleSession(workItem.id, "Second?", PROOFER);
    await c.message("headlessDropped");
    const before = c.messages.length;
    exitFirst();
    await pause(100);
    expect(c.messages.slice(before)).toEqual([]);
    expect((await (await client(url)).message("ready")).headless.map((h) => [h.id, h.errorOutput])).toEqual([[2, ""]]);
  });

  it("changes nothing at a start that fails after its session ended: a session a stop ended keeps what ended it, and one that left the list is told to nobody and counts toward the bound no more", async () => {
    const quick = fakeAdapter();
    const rejects: (() => void)[] = [];
    // A start for the prompt "Slow?" fails only when the case says so, and any other prompt is answered at once.
    const roleAdapter: RoleAdapter = {
      name: "fake",
      features: ["role-tools", "permission-requests"],
      notice: () => Promise.resolve(null),
      start: (options, listener) =>
        options.prompt !== "Slow?" ? quick.start(options, listener) : new Promise((_, reject) => rejects.push(() => reject(new Error("the login shell found no CLI")))),
    };
    const { daemon: d, c, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 1 });
    const start = async (prompt: string) => (await d.startRoleSession(workItem.id, prompt, PROOFER)).id;
    const stop = async (requestId: number, id: number) => {
      c.send({ type: "stopHeadless", requestId, id });
      await c.message("done", (m) => m.requestId === requestId);
    };
    const listed = async () => (await (await client(url)).message("ready")).headless.map((h) => [h.id, h.error, h.stopped]);
    // What the daemon told of headless sessions after the client's `before`th message. The work item's pane prints meanwhile.
    const toldSince = (before: number) => c.messages.slice(before).filter((m) => m.type === "headless" || m.type === "headlessDropped");
    // A session stopped while its adapter starts, and still listed.
    const first = await start("Slow?");
    await stop(2, first);
    let before = c.messages.length;
    rejects[0]!();
    await pause(100);
    expect(toldSince(before)).toEqual([]);
    expect(await listed()).toEqual([[first, "the session was stopped at a request before it finished", "request"]]);
    // A session stopped while its adapter starts, then dropped by the bound once a later session ended.
    const second = await start("Slow?");
    await stop(4, second);
    const third = await start("Quick?");
    await c.message("headless", (m) => m.headless.id === third && m.headless.state === "finished");
    await c.message("headlessDropped", (m) => m.id === second);
    before = c.messages.length;
    rejects[1]!();
    await pause(100);
    expect(toldSince(before)).toEqual([]);
    expect((await listed()).map(([id]) => id)).toEqual([third]);
  });

  describe("the ledger", () => {
    type Client = Awaited<ReturnType<typeof client>>;
    const USAGE: Usage = { costUsd: 0.25, converted: true, models: [{ model: "owl-1", inputTokens: 10, outputTokens: 20, cacheReadTokens: 30, cacheWriteTokens: 40, costUsd: 0.25 }] };
    const ENTRY_FIELDS = ["account", "branch", "chain", "endedAt", "repo", "stage", "startedAt", "state", "stopped", "usage", "workItemId"];
    const SEALER = { role: "sealer", stage: "seal" } as const;

    /** A run folder the case's daemons share, removed after the case. */
    function runFolder(): string {
      const runDir = mkdtempSync(join(tmpdir(), "owlery-ledger-"));
      cleanups.push(() => rmSync(runDir, { recursive: true, force: true }));
      return runDir;
    }

    let nextRequest = 1000;
    /** The answer a client is given to a `readLedger` of the work item. */
    async function ledgerOf(c: Client, workItemId: unknown) {
      const requestId = nextRequest++;
      c.send({ type: "readLedger", requestId, workItemId });
      type Answer = Extract<ServerMessage, { type: "ledger" | "error" }>;
      return c.until(() => c.messages.find((m): m is Answer => (m.type === "ledger" || m.type === "error") && m.requestId === requestId));
    }

    /** Starts a session of `role` and waits until it has ended. */
    async function ended(d: Daemon, c: Client, workItemId: number, prompt: string, role: RoleStage = PROOFER): Promise<HeadlessInfo> {
      const headless = await d.startRoleSession(workItemId, prompt, role);
      return (await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state !== "working")).headless;
    }

    it("keeps one entry for each session that ends: its work item, its repository and branch, its stage, no chain's stage, since no chain started it, its two times, how it ended and the usage its result reported", async () => {
      let clock = 1000;
      // The clock moves on while each turn runs, so a session's end is read after its start.
      const usage = (prompt: string): Usage => {
        clock += 500;
        return prompt === "Which owl?" ? USAGE : { ...USAGE, costUsd: 0.5 };
      };
      const { daemon: d, c, workItem } = await withWorkItem({ now: () => clock, roleAdapter: fakeAdapter({ usage }) });
      clock = 1500;
      await ended(d, c, workItem.id, "Which owl?");
      clock = 3000;
      await ended(d, c, workItem.id, "And you?", SEALER);
      const answer = await ledgerOf(c, workItem.id);
      const kept = { workItemId: workItem.id, repo: workItem.repo, branch: workItem.branch, state: "finished", stopped: null, account: { id: 0, name: "System default" } };
      expect(answer).toEqual({
        type: "ledger",
        requestId: answer.requestId,
        workItemId: workItem.id,
        entries: [
          { ...kept, stage: PROOFER, chain: null, startedAt: 1500, endedAt: 2000, usage: USAGE },
          { ...kept, stage: SEALER, chain: null, startedAt: 3000, endedAt: 3500, usage: { ...USAGE, costUsd: 0.5 } },
        ],
        unread: 0,
      });
      for (const entry of (answer as Extract<ServerMessage, { type: "ledger" }>).entries) expect(Object.keys(entry).sort()).toEqual(ENTRY_FIELDS);
    });

    it("outlives the daemon in a file of its run folder the user alone can read, commits nothing in the work item's worktree or the main checkout, and gives a work item no entry of an earlier one under its id", async () => {
      const runDir = runFolder();
      const { daemon: first, c, workItem } = await withWorkItem({ runDir, roleAdapter: fakeAdapter({ usage: () => USAGE }) });
      expect(workItem.id).toBe(1);
      const status = () => [git(workItem.worktree, "status", "--porcelain", "--ignored"), git(workItem.repo, "status", "--porcelain", "--ignored")];
      const before = status();
      await ended(first, c, workItem.id, "Which owl?");
      const kept = { workItemId: 1, repo: workItem.repo, branch: workItem.branch, stage: PROOFER, chain: null, startedAt: 1234, endedAt: 1234, state: "finished", stopped: null, usage: USAGE, account: { id: 0, name: "System default" } };
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ entries: [kept], unread: 0 });
      expect(status()).toEqual(before);
      await first.close();
      expect(statSync(join(runDir, "ledger.jsonl")).mode & 0o777).toBe(0o600);
      // A line of an earlier work item 1, whose stage started before this one was created: the id was given again after `repositories.json` was lost.
      const earlier = { workItemId: 1, repo: "/earlier", branch: "owlery/earlier", stage: null, startedAt: 5, endedAt: 6, state: "finished", stopped: null, usage: null };
      appendFileSync(join(runDir, "ledger.jsonl"), `${JSON.stringify(earlier)}\n{not json\n`);
      const { url } = await daemon({ runDir });
      const later = await client(url);
      await later.message("ready");
      expect(await ledgerOf(later, workItem.id)).toMatchObject({ workItemId: 1, entries: [kept], unread: 1 });
      expect(readFileSync(join(runDir, "ledger.jsonl"), "utf8")).toBe(`${JSON.stringify(kept)}\n${JSON.stringify(earlier)}\n{not json\n`);
    });

    it("enters a session its limit stopped with no usage", async () => {
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ delayMs: 60_000, usage: () => USAGE }), headlessLimitMs: 150 });
      expect((await ended(d, c, workItem.id, "Q")).stopped).toBe("limit");
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ entries: [{ stage: PROOFER, state: "failed", stopped: "limit", usage: null }], unread: 0 });
    });

    it("enters a session a request stopped with no usage", async () => {
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ delayMs: 60_000, usage: () => USAGE }) });
      const headless = await d.startRoleSession(workItem.id, "Q", PROOFER);
      c.send({ type: "stopHeadless", requestId: 2, id: headless.id });
      await c.message("headless", (m) => m.headless.state === "failed");
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ entries: [{ stage: PROOFER, state: "failed", stopped: "request", usage: null }], unread: 0 });
    });

    it("enters each session still working when the daemon closes, once, as stopped by the daemon with no usage, though its run's exit follows the stop", async () => {
      const runDir = runFolder();
      const inner = fakeAdapter({ delayMs: 60_000, usage: () => USAGE });
      // The run reports its process's exit as soon as it is stopped, as a process that ends at the signal does.
      const roleAdapter: RoleAdapter = {
        name: inner.name,
        features: inner.features,
        notice: inner.notice,
        start: async (options, listener) => {
          const run = await inner.start(options, listener);
          return {
            ...run,
            stop: () => {
              listener({ type: "exit", exitCode: 143, errorOutput: "" });
              return run.stop();
            },
          };
        },
      };
      let clock = 1000;
      const { daemon: first, workItem } = await withWorkItem({ runDir, roleAdapter, now: () => clock });
      await first.startRoleSession(workItem.id, "Q", PROOFER);
      await pause(20);
      clock = 4000;
      await first.close();
      const later = await client((await daemon({ runDir })).url);
      await later.message("ready");
      expect(await ledgerOf(later, workItem.id)).toMatchObject({ entries: [{ stage: PROOFER, startedAt: 1000, endedAt: 4000, state: "failed", stopped: "daemon", usage: null }], unread: 0 });
    });

    it("keeps what a failed session reported: the usage of an error result, no usage for an exit with no result, and no entry for a start the adapter rejected", async () => {
      const roleAdapter: RoleAdapter = {
        name: "scripted",
        features: ["role-tools", "permission-requests"],
        notice: () => Promise.resolve(null),
        start: (options, listener) => {
          if (options.prompt === "Rejected?") return Promise.reject(new Error("the login shell found no CLI"));
          setTimeout(() => {
            if (options.prompt === "Error?") listener({ type: "result", text: "the turn failed", isError: true, usage: USAGE });
            listener({ type: "exit", exitCode: 1, errorOutput: "" });
          }, 0);
          return Promise.resolve({ stop: () => Promise.resolve(), answer: () => {} });
        },
      };
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter });
      for (const prompt of ["Error?", "Exited?", "Rejected?"]) expect((await ended(d, c, workItem.id, prompt)).state).toBe("failed");
      expect(await ledgerOf(c, workItem.id)).toMatchObject({
        entries: [
          { state: "failed", stopped: null, usage: USAGE },
          { state: "failed", stopped: null, usage: null },
        ],
        unread: 0,
      });
    });

    it("keeps a deleted work item's entries in its file, and answers a read of the deleted work item with an error", async () => {
      const runDir = runFolder();
      const { daemon: d, c, workItem } = await withWorkItem({ runDir });
      const { session } = await c.message("workItemCreated");
      await ended(d, c, workItem.id, "Q");
      const written = readFileSync(join(runDir, "ledger.jsonl"), "utf8");
      expect(written.split("\n").map((line) => (line === "" ? line : (JSON.parse(line) as { workItemId: number }).workItemId))).toEqual([workItem.id, ""]);
      c.send({ type: "readLoss", requestId: 2, id: workItem.id });
      const { loss } = await c.message("workItemLoss", (m) => m.requestId === 2);
      c.send({ type: "deleteWorkItem", requestId: 3, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [] } });
      await c.message("done", (m) => m.requestId === 3);
      expect(readFileSync(join(runDir, "ledger.jsonl"), "utf8")).toBe(written);
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ type: "error", message: `no work item ${workItem.id}` });
    });

    it("answers a read of an archived work item as of any other, and a read of an id it lists no work item under with an error", async () => {
      const { daemon: d, c, workItem } = await withWorkItem();
      const { session } = await c.message("workItemCreated");
      await ended(d, c, workItem.id, "Q");
      const { entries } = (await ledgerOf(c, workItem.id)) as Extract<ServerMessage, { type: "ledger" }>;
      expect(entries).toHaveLength(1);
      c.send({ type: "archiveWorkItem", requestId: 2, id: workItem.id, running: { panes: [session.id], headless: [] } });
      await c.message("done", (m) => m.requestId === 2);
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ type: "ledger", workItemId: workItem.id, entries, unread: 0 });
      expect(await ledgerOf(c, 42)).toMatchObject({ type: "error", message: "no work item 42" });
      expect(await ledgerOf(c, String(workItem.id))).toMatchObject({ type: "error", message: `no work item ${workItem.id}` });
    });
  });

  describe("permission requests", () => {
    type Client = Awaited<ReturnType<typeof client>>;
    const SHELL: FakeAsk = { tool: "Bash", action: "run", path: null, text: "printf x >> README.md" };
    const CRAFTER = { role: "crafter", stage: "fix-pass" } as const;
    /** A fake adapter whose sessions raise the requests the case sets afterwards, once it knows its work item's folder. */
    function asking(options: Parameters<typeof fakeAdapter>[0] = {}) {
      const held = { asks: [] as FakeAsk[] };
      return { held, adapter: fakeAdapter({ ...options, asks: () => held.asks }) };
    }
    /** Starts one session of `role` and gives the lines its answer holds once it finished: what the daemon answered each request with, then the fake's own text. */
    async function answersOf(d: Daemon, c: Client, workItemId: number, role: RoleStage): Promise<string[]> {
      const headless = await d.startRoleSession(workItemId, "Q", role);
      const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
      return finished.headless.answer.split("\n").slice(0, -1);
    }
    const OUTSIDE = (role: string, path: string) => `Owlery lets the ${role} write only inside the work item's worktree, and ${path} is outside it. Do not work around it: say in your report which step needed the write.`;
    const NO_WRITE = (role: string) => `Owlery gives the ${role} no call that writes a file. Do not work around it: say in your report which step needed the write.`;
    const NO_COMMAND = (role: string) => `Owlery gives the ${role} no command that asks for permission. Do not work around it: say in your report which step needed the command.`;
    const NO_CALL = (role: string) => `Owlery's rule for the ${role} does not allow this call. Do not work around it: say in your report which step needed it.`;

    it("answers a crafter's request by its grant: a write inside the worktree and a command are allowed, and a write anywhere else and every other call are refused with the reason", async () => {
      const { held, adapter } = asking();
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter });
      const { worktree } = workItem;
      const outside = join(worktree, "..", "..", "outside");
      mkdirSync(outside);
      mkdirSync(join(worktree, "src"));
      symlinkSync(outside, join(worktree, "link"));
      symlinkSync(join(outside, "not-there.txt"), join(worktree, "dangling"));
      symlinkSync(join(worktree, "src"), join(worktree, "inner"));
      symlinkSync(join(worktree, "src"), join(outside, "in"));
      mkdirSync(join(worktree, "~"));
      mkdirSync(join(worktree, "deep", "er"), { recursive: true });
      symlinkSync(outside, join(worktree, "deep", "out"));
      symlinkSync(join(worktree, "deep", "er"), join(worktree, "hop"));
      symlinkSync(outside, join(worktree, " out"));
      // A link out under five folders of 200-character names: the path to it is longer than the system reads, as the worktree's own and as the text read from the worktree. No call can make a path that long whole, so the lower three folders are made beside the worktree and moved under the upper two.
      const names = ["a", "b", "c", "d", "e"].map((letter) => letter.repeat(200));
      const lower = join(outside, "..", "lower");
      mkdirSync(join(lower, ...names.slice(2)), { recursive: true });
      symlinkSync(outside, join(lower, ...names.slice(2), "link"));
      mkdirSync(join(worktree, names[0]!, names[1]!), { recursive: true });
      renameSync(join(lower, names[2]!), join(worktree, names[0]!, names[1]!, names[2]!));
      const deep = `${names.join("/")}/link/a.txt`;
      // A link out in a folder that cannot be searched, so nothing reads the link.
      mkdirSync(join(worktree, "closed"));
      symlinkSync(outside, join(worktree, "closed", "link"));
      chmodSync(join(worktree, "closed"), 0o600);
      // The case's folders are removed by their whole paths, so the long path is made short and the closed folder opened first.
      cleanups.push(() => {
        renameSync(join(worktree, names[0]!, names[1]!, names[2]!), join(lower, names[2]!));
        chmodSync(join(worktree, "closed"), 0o700);
      });
      const write = (path: string | null): FakeAsk => ({ tool: "Write", action: "write", path, text: path ?? "{}" });
      held.asks = [
        // Inside: a path of the worktree, a relative one, a file and a folder that are not there yet, a link that stays inside, a `..` in the part that is there, a link outside that points in, a folder of the worktree named `~`, and a path with a space before it that is inside with the space and without.
        write(join(worktree, "README.md")),
        write("src/new.ts"),
        write(join(worktree, "new-folder", "deep", "new.ts")),
        write("inner/new.ts"),
        { tool: "Edit", action: "write", path: "src/../README.md", text: "src/../README.md" },
        write(`${outside}/in/new.ts`),
        write("./~/a.txt"),
        write(" src/new.ts"),
        // Outside: another folder, a way out through `..`, the folder above, through a link, through a link and back, through a link whose target is not there, a folder whose name opens with the worktree's, the bundle's, and a write that names no file.
        write(join(outside, "a.txt")),
        write("../outside.txt"),
        write(".."),
        write("link/a.txt"),
        write("link/../b.txt"),
        write("dangling"),
        write(`${worktree}-2/a.txt`),
        write("/app/dist/bundle/skills/core/SKILL.md"),
        // Outside by one reading of several, each path written as text because `join` would settle its `..`: a `..` in the part that is not there, which climbs back to a link that leads out, relative and whole; the same after a link that stays inside, where neither reading follows the link the `..` reaches once the missing folder is made; a `..` after a link outside that points in, which the text settles to the link's own folder; a home folder as `~` names it, the person's and another's, with a space before it too; a path a space hides the root of; a link whose name opens with a space; and a path cut at a null character, which names the link.
        write("missing/../link/a.txt"),
        write(`${worktree}/missing/../link/a.txt`),
        write("hop/missing/../../out/a.txt"),
        write(`${outside}/in/../c.txt`),
        write("~/a.txt"),
        write("~"),
        write("~other/a.txt"),
        write(" ~/a.txt"),
        write(` ${outside}/a.txt`),
        write(" out/a.txt"),
        write("link\u0000/a.txt"),
        // Outside because the system cannot read a part of the path, so no link past that part is read: a link out under folders deeper than the system reads a path, as text and whole; a link out in a folder that cannot be searched; a file named as a folder; and a path inside the worktree written longer than the system reads.
        write(deep),
        write(`${worktree}/${deep}`),
        write("closed/link/a.txt"),
        write("README.md/a.txt"),
        write(`${"./".repeat(600)}src/new.ts`),
        write(null),
        SHELL,
        { tool: "Read", action: "read", path: "/etc/hosts", text: "/etc/hosts" },
        { tool: "WebFetch", action: "other", path: null, text: "{}" },
      ];
      expect(await answersOf(d, c, workItem.id, CRAFTER)).toEqual([
        "allowed: Write",
        "allowed: Write",
        "allowed: Write",
        "allowed: Write",
        "allowed: Edit",
        "allowed: Write",
        "allowed: Write",
        "allowed: Write",
        `refused: Write: ${OUTSIDE("crafter", join(outside, "a.txt"))}`,
        `refused: Write: ${OUTSIDE("crafter", "../outside.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "..")}`,
        `refused: Write: ${OUTSIDE("crafter", "link/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "link/../b.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "dangling")}`,
        `refused: Write: ${OUTSIDE("crafter", `${worktree}-2/a.txt`)}`,
        `refused: Write: ${OUTSIDE("crafter", "/app/dist/bundle/skills/core/SKILL.md")}`,
        `refused: Write: ${OUTSIDE("crafter", "missing/../link/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", `${worktree}/missing/../link/a.txt`)}`,
        `refused: Write: ${OUTSIDE("crafter", "hop/missing/../../out/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", `${outside}/in/../c.txt`)}`,
        `refused: Write: ${OUTSIDE("crafter", "~/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "~")}`,
        `refused: Write: ${OUTSIDE("crafter", "~other/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", " ~/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", ` ${outside}/a.txt`)}`,
        `refused: Write: ${OUTSIDE("crafter", " out/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "link\u0000/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", deep)}`,
        `refused: Write: ${OUTSIDE("crafter", `${worktree}/${deep}`)}`,
        `refused: Write: ${OUTSIDE("crafter", "closed/link/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", "README.md/a.txt")}`,
        `refused: Write: ${OUTSIDE("crafter", `${"./".repeat(600)}src/new.ts`)}`,
        `refused: Write: ${NO_CALL("crafter")}`,
        "allowed: Bash",
        `refused: Read: ${NO_CALL("crafter")}`,
        `refused: WebFetch: ${NO_CALL("crafter")}`,
      ]);
    });

    it.each([
      ["proofer", { role: "proofer", stage: "round" }],
      ["sealer", { role: "sealer", stage: "seal" }],
      ["orchestrator", { role: "orchestrator", stage: "judgment" }],
    ] as const)("refuses every request of a %s, a write inside the worktree and a command among them, with a reason that names the role and says to name the step in the report", async (name, role) => {
      const { held, adapter } = asking();
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter });
      held.asks = [{ tool: "Edit", action: "write", path: join(workItem.worktree, "README.md"), text: "README.md" }, SHELL, { tool: "Read", action: "read", path: "/etc/hosts", text: "/etc/hosts" }, { tool: "WebFetch", action: "other", path: null, text: "{}" }];
      const answers = await answersOf(d, c, workItem.id, role);
      expect(answers).toEqual([`refused: Edit: ${NO_WRITE(name)}`, `refused: Bash: ${NO_COMMAND(name)}`, `refused: Read: ${NO_CALL(name)}`, `refused: WebFetch: ${NO_CALL(name)}`]);
      for (const answer of answers) expect(answer).toMatch(/Do not work around it: say in your report which step needed /);
    });

    it("takes back nothing at a request its session withdrew: the grant answered the request as it arrived, and the session goes on to its answer", async () => {
      const { held, adapter } = asking({ delayMs: 50 });
      held.asks = [{ ...SHELL, withdraw: true }];
      const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter });
      const headless = await d.startRoleSession(workItem.id, "Q", CRAFTER);
      const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state !== "working");
      expect([finished.headless.state, finished.headless.answer]).toEqual(["finished", 'As the crafter at the stage fix-pass, you asked: "Q"']);
    });

    it("starts a session only through an adapter that declares both features of a role: it refuses with a sentence that names the adapter and what it lacks, and starts nothing", async () => {
      for (const [features, lacks] of [
        [["role-tools"], "permission-requests"],
        [["permission-requests"], "role-tools"],
        [[], "role-tools and permission-requests"],
      ] as const) {
        const { adapter, seen } = watched(fakeAdapter({ features }));
        const { daemon: d, c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
        await expect(d.startRoleSession(workItem.id, "Q", PROOFER), lacks).rejects.toThrow(`the fake adapter cannot launch a role: it does not declare ${lacks}`);
        expect(seen.started).toEqual([]);
        expect(c.messages.some((m) => m.type === "headless")).toBe(false);
        expect((await (await client(url)).message("ready")).headless).toEqual([]);
      }
    });
  });
});

describe("the agent's notice", () => {
  const NOTICE = "The fake agent is old.";
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const told = (c: { messages: ServerMessage[] }): (string | null)[] => c.messages.flatMap((m) => (m.type === "agentNotice" ? [m.notice] : []));

  /** A fake adapter whose notices are answered by the case: each call waits for the answer the case gives it, by the call's place. */
  function asked() {
    const answers: ((notice: string | null) => void)[] = [];
    const adapter: RoleAdapter = { ...fakeAdapter(), notice: () => new Promise((resolve) => answers.push(resolve)) };
    return { adapter, asks: () => answers.length, answer: (call: number, notice: string | null) => answers[call]!(notice) };
  }

  it("is read from the adapter at the daemon's start, and `ready` carries it: the adapter's sentence, or null where it has none", async () => {
    const old = await daemon({ roleAdapter: fakeAdapter({ notice: NOTICE }) });
    expect((await (await client(old.url)).message("ready")).agentNotice).toBe(NOTICE);
    const current = await daemon();
    const c = await client(current.url);
    expect((await c.message("ready")).agentNotice).toBeNull();
    await pause(100);
    expect(told(c)).toEqual([]);
  });

  it("does not wait for the adapter: a client that connected before the answer has a `ready` with none, and every client is sent the notice once it arrives", async () => {
    const { adapter, asks, answer } = asked();
    const { url } = await daemon({ roleAdapter: adapter });
    expect(asks()).toBe(1);
    const first = await client(url);
    const second = await client(url);
    expect((await first.message("ready")).agentNotice).toBeNull();
    expect((await second.message("ready")).agentNotice).toBeNull();
    // No notice stands, so the two hellos asked nothing more.
    expect(asks()).toBe(1);
    answer(0, NOTICE);
    for (const c of [first, second]) expect(await c.message("agentNotice")).toEqual({ type: "agentNotice", notice: NOTICE });
    expect((await (await client(url)).message("ready")).agentNotice).toBe(NOTICE);
  });

  it("asks the adapter again at each hello while a notice stands, tells every client that it went, and asks no more once it has", async () => {
    const { adapter, asks, answer } = asked();
    const { url } = await daemon({ roleAdapter: adapter });
    answer(0, NOTICE);
    const first = await client(url);
    expect((await first.message("ready")).agentNotice).toBe(NOTICE);
    await first.until(() => (asks() === 2 ? true : undefined));
    // The person has not updated yet: the same answer changes nothing, and nobody is told again.
    answer(1, NOTICE);
    const second = await client(url);
    expect((await second.message("ready")).agentNotice).toBe(NOTICE);
    await second.until(() => (asks() === 3 ? true : undefined));
    await pause(50);
    expect([told(first), told(second)]).toEqual([[], []]);
    answer(2, null);
    for (const c of [first, second]) expect(await c.message("agentNotice")).toEqual({ type: "agentNotice", notice: null });
    const third = await client(url);
    expect((await third.message("ready")).agentNotice).toBeNull();
    await pause(50);
    expect(asks()).toBe(3);
    expect([told(first), told(second), told(third)]).toEqual([[null], [null], []]);
  });

  it("keeps the answer of the adapter's last read where an earlier read answers after it", async () => {
    const { adapter, asks, answer } = asked();
    const { url } = await daemon({ roleAdapter: adapter });
    answer(0, NOTICE);
    const first = await client(url);
    await first.message("ready");
    const second = await client(url);
    await second.message("ready");
    await second.until(() => (asks() === 3 ? true : undefined));
    // The second hello's read found the CLI updated. The first hello's read began before the update and answers last.
    answer(2, null);
    await first.message("agentNotice", (m) => m.notice === null);
    answer(1, NOTICE);
    await pause(50);
    expect(told(first)).toEqual([null]);
    expect((await (await client(url)).message("ready")).agentNotice).toBeNull();
  });

  it("launches a session all the same while a notice stands", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { daemon: d, url } = await daemon({ worktreesRoot: made.root, roleAdapter: fakeAdapter({ notice: NOTICE }) });
    const c = await client(url);
    expect((await c.message("ready")).agentNotice).toBe(NOTICE);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await d.startRoleSession(workItem.id, "Which owl?", PROOFER);
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect([headless.state, headless.answer]).toEqual(["finished", proofersAnswer("Which owl?")]);
  });
});

describe("idle exit", () => {
  it("asks to exit once no session is alive and no client is connected", async () => {
    let idle = 0;
    const { url } = await daemon({ idleExitMs: 100, onIdle: () => idle++ });
    const c = await client(url);
    await c.message("ready");
    c.socket.close();
    await new Promise((r) => setTimeout(r, 400));
    expect(idle).toBe(1);
  });

  it("stays while a session is alive, though no client is connected", async () => {
    let idle = 0;
    const { url } = await daemonWithWorkItem({ idleExitMs: 100, onIdle: () => idle++ });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    await c.message("started");
    c.socket.close();
    await new Promise((r) => setTimeout(r, 400));
    expect(idle).toBe(0);
  });

  it("stays while a headless session is working, though no client is connected, and asks to exit once it has ended", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    let idle = 0;
    // The pane ends at once, so only the headless session can keep the daemon.
    const { daemon: d, url } = await daemon({
      worktreesRoot: made.root,
      idleExitMs: 100,
      onIdle: () => idle++,
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }),
      roleAdapter: fakeAdapter({ delayMs: 300 }),
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Waited for", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("exit");
    await d.startRoleSession(workItem.id, "Q", PROOFER);
    c.socket.close();
    // The text arrives 300 ms after the start and the result 300 ms after that.
    await new Promise((r) => setTimeout(r, 450));
    expect(idle).toBe(0);
    await new Promise((r) => setTimeout(r, 600));
    expect(idle).toBe(1);
  });
});

describe("OutputBuffer", () => {
  it("keeps all of the output while it is within its size", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("ab\ncd");
    buffer.append("ef\n");
    expect(buffer.text()).toBe("ab\ncdef\n");
  });

  it("opens at the first character after a line break once it dropped old output, so at no escape sequence's middle", () => {
    const buffer = new OutputBuffer(16);
    buffer.append("one\r\n\u001b[31mtwo\u001b[0m\r\n");
    // The first piece is already over the size and loses its first line. The second puts the cut inside `\u001b[0m`, the colour sequence that closes the line `two`.
    buffer.append("three\r\nfour");
    expect(buffer.text()).toBe("three\r\nfour");
  });

  it("keeps a line whole where the cut falls at its start, between two pieces of output or inside one", () => {
    const between = new OutputBuffer(6);
    between.append("abc\n");
    between.append("def\ngh");
    expect(between.text()).toBe("def\ngh");
    const inside = new OutputBuffer(5);
    inside.append("abc\nde\nfg");
    expect(inside.text()).toBe("de\nfg");
  });

  it("counts what it keeps after it dropped a line's rest, so later output is cut at its size again", () => {
    const buffer = new OutputBuffer(8);
    buffer.append("abcdef\ngh\nij");
    buffer.append("klmnop");
    expect(buffer.text()).toBe("ijklmnop");
  });

  it("cuts at the count of characters where what it keeps holds no line break", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("abcdef");
    buffer.append("ghijkl");
    expect(buffer.text()).toBe("cdefghijkl");
  });

  it("drops the rest of a line that had no line break yet at the first line break that follows it", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("abcdef");
    buffer.append("ghijkl");
    buffer.append("\nmn");
    expect(buffer.text()).toBe("mn");
    // The pieces dropped before the line break's own are counted out as well.
    buffer.append("opqrstuv");
    expect(buffer.text()).toBe("mnopqrstuv");
  });

  it("keeps what the count of characters left where the first line break stands past the first 4,096 characters it keeps", () => {
    const buffer = new OutputBuffer(8000);
    buffer.append("a".repeat(8000));
    // 2,002 characters are over the size, so the line break is the 6,000th character kept, near the start of a long piece.
    buffer.append(`b\n${"c".repeat(2000)}`);
    expect(buffer.text()).toBe(`${"a".repeat(5998)}b\n${"c".repeat(2000)}`);
  });

  it("drops through a line break that is the 4,096th character it keeps, and nothing where it is the 4,097th", () => {
    const within = new OutputBuffer(5000);
    // One character is over the size in each buffer.
    within.append(`${"a".repeat(4096)}\n${"z".repeat(904)}`);
    expect(within.text()).toBe("z".repeat(904));
    const past = new OutputBuffer(5000);
    past.append(`${"a".repeat(4097)}\n${"z".repeat(903)}`);
    expect(past.text()).toBe(`${"a".repeat(4096)}\n${"z".repeat(903)}`);
  });

  it("holds nothing once it was emptied, and keeps what is printed afterwards under its size as before", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("ab\ncd");
    buffer.clear();
    expect(buffer.text()).toBe("");
    buffer.append("ef\n");
    expect(buffer.text()).toBe("ef\n");
    // The count starts again: ten characters fit, and the eleventh drops the first line.
    buffer.append("ghijklm");
    expect(buffer.text()).toBe("ef\nghijklm");
    buffer.append("\nn");
    expect(buffer.text()).toBe("ghijklm\nn");
  });

  it("drops its older output at once, from a line's start, where its size is made smaller, and keeps more of what is printed afterwards where it is made larger (scenario B2)", () => {
    const buffer = new OutputBuffer(12);
    buffer.append("ab\ncd\nefgh\n");
    buffer.setLimit(6);
    // Six characters open at "\nefgh\n", inside the line "cd", whose rest is dropped through its line break.
    expect(buffer.text()).toBe("efgh\n");
    buffer.setLimit(20);
    buffer.append("ijklmnopqrst");
    expect(buffer.text()).toBe("efgh\nijklmnopqrst");
    // A limit that holds what is kept drops nothing.
    buffer.setLimit(17);
    expect(buffer.text()).toBe("efgh\nijklmnopqrst");
  });

  /** What a buffer keeps of a text once it was emptied with its modes kept. */
  const modesOf = (text: string): string => {
    const buffer = new OutputBuffer(1000);
    buffer.append(text);
    buffer.clear(true);
    return buffer.text();
  };

  it("keeps a private mode that was set, first in what it holds once it was emptied with its modes kept, and keeps it again at the next such emptying", () => {
    const buffer = new OutputBuffer(1000);
    // The sequence arrived in two pieces.
    buffer.append("a line\r\n\u001b[?20");
    buffer.append("04hanother\r\n");
    buffer.clear(true);
    expect(buffer.text()).toBe("\u001b[?2004h");
    buffer.append("later\r\n");
    expect(buffer.text()).toBe("\u001b[?2004hlater\r\n");
    buffer.clear(true);
    expect(buffer.text()).toBe("\u001b[?2004h");
    // What it kept counts toward its size, as what is printed does: the thirteenth character drops the first line, and the sequence is in it.
    const small = new OutputBuffer(12);
    small.append("\u001b[?25l");
    small.clear(true);
    small.append("abcdef\n");
    expect(small.text()).toBe("");
  });

  it("keeps none of the modes where it is emptied without them", () => {
    const buffer = new OutputBuffer(1000);
    buffer.append("\u001b[?2004ha line\r\n");
    buffer.clear();
    expect(buffer.text()).toBe("");
  });

  it("keeps a mode that was set and later reset as reset", () => {
    expect(modesOf("\u001b[?2004hone\r\n\u001b[?2004ltwo\r\n")).toBe("\u001b[?2004l");
  });

  it("reads a mode's number as a number, so one written with a zero before it names the same mode", () => {
    expect(modesOf("\u001b[?025l\u001b[?25h")).toBe("\u001b[?25h");
  });

  it("keeps the sequence its output stopped inside after the modes, so what the program prints next completes it", () => {
    const buffer = new OutputBuffer(1000);
    buffer.append("a line\r\n\u001b[?1000h\u001b[?20");
    buffer.clear(true);
    expect(buffer.text()).toBe("\u001b[?1000h\u001b[?20");
    buffer.append("04hrest\r\n");
    expect(buffer.text()).toBe("\u001b[?1000h\u001b[?2004hrest\r\n");
    // Emptied without its modes, it keeps no unfinished sequence either.
    buffer.append("\u001b[?20");
    buffer.clear();
    expect(buffer.text()).toBe("");
  });

  it.each([
    ["an escape with nothing after it", "\u001b"],
    ["an escape sequence that has only its intermediate character", "\u001b("],
    ["a CSI sequence that has its parameters and no final character", "\u001b[38;5;1"],
    ["an OSC string with no end", "\u001b]0;a ti"],
  ])("keeps %s where its output stopped there", (_kind, open) => {
    expect(modesOf(`one\r\n\u001b[1mtwo${open}`)).toBe(open);
  });

  it("keeps no sequence that ended before its output stopped: an OSC string ended by a bell, by its terminator, by a cancel or by a code from 80 to 9f, and a CSI sequence with its final character", () => {
    expect(modesOf("\u001b]0;a title\u0007")).toBe("");
    expect(modesOf("\u001b]0;a title\u0007one")).toBe("");
    expect(modesOf("\u001b]0;a title\u001b\\one")).toBe("");
    expect(modesOf("\u001b]0;a ti\u0018one")).toBe("");
    expect(modesOf("\u001b]0;a ti\u001aone")).toBe("");
    expect(modesOf("\u001b]0;a title\u009cone\r\n")).toBe("");
    expect(modesOf("\u001b]0;a ti\u0085one\r\n")).toBe("");
    expect(modesOf("\u001b[1m")).toBe("");
    expect(modesOf("\u001b(B")).toBe("");
  });

  it("keeps a mode that was only reset", () => {
    expect(modesOf("\u001b[?25lone\r\n")).toBe("\u001b[?25l");
  });

  it("keeps one sequence for each number of a sequence that names several modes", () => {
    expect(modesOf("\u001b[?1000;1006hone\r\n")).toBe("\u001b[?1000h\u001b[?1006h");
  });

  it("keeps the modes in the order of the last sequence that named each", () => {
    expect(modesOf("\u001b[?25l\u001b[?2004h\u001b[?1000h\u001b[?25h\u001b[?2004l")).toBe("\u001b[?1000h\u001b[?25h\u001b[?2004l");
  });

  it("keeps no mode set before the last full reset, and each set after it", () => {
    expect(modesOf("\u001b[?1000h\u001bc\u001b[?1004h\u001bcone\u001b[?2004h\u001b[?25l")).toBe("\u001b[?2004h\u001b[?25l");
  });

  it("keeps no sequence that is no private mode sequence: a mode that is not private, and a request for a mode's state", () => {
    expect(modesOf("\u001b[4h\u001b[?25$p\u001b[?2004h")).toBe("\u001b[?2004h");
  });

  it("holds nothing once it was emptied with its modes kept where it held no private mode sequence", () => {
    expect(modesOf("one\r\n\u001b[1mtwo\u001b[0m\r\n")).toBe("");
  });
});

describe("discovery", () => {
  it("writes the port and token to a file the user alone can read, and reads them back", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const file = writeDiscovery(dir, { port: 4321, token: TOKEN, pid: 99 });
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(readDiscovery(dir)).toEqual({ port: 4321, token: TOKEN, pid: 99 });
  });

  it("throws where the rename fails, and removes the partial file it wrote", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "daemon.json"));
    expect(() => writeDiscovery(dir, { port: 4321, token: TOKEN, pid: 99 })).toThrow(/rename/);
    expect(readdirSync(dir)).toEqual(["daemon.json"]);
    expect(statSync(join(dir, "daemon.json")).isDirectory()).toBe(true);
  });

  it("reads nothing where no daemon has written", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    expect(readDiscovery(dir)).toBeUndefined();
  });

  it("reads back the build a daemon wrote, and reads a file that holds none, or no text there, as one without a build", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    writeDiscovery(dir, { port: 4321, token: TOKEN, pid: 99, build: "0a1b" });
    expect(readDiscovery(dir)).toEqual({ port: 4321, token: TOKEN, pid: 99, build: "0a1b" });
    // What a daemon that could not read its own script writes.
    writeDiscovery(dir, { port: 4321, token: TOKEN, pid: 99, build: undefined });
    expect(JSON.parse(readFileSync(join(dir, "daemon.json"), "utf8"))).toEqual({ port: 4321, token: TOKEN, pid: 99 });
    expect(readDiscovery(dir)).toEqual({ port: 4321, token: TOKEN, pid: 99 });
    writeFileSync(join(dir, "daemon.json"), JSON.stringify({ port: 4321, token: TOKEN, pid: 99, build: 7 }));
    expect(readDiscovery(dir)).toEqual({ port: 4321, token: TOKEN, pid: 99 });
  });

  it("names a build by the SHA-256 of the bytes of the daemon's script, and gives nothing where the script cannot be read", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    writeFileSync(join(dir, "daemon.js"), "abc");
    expect(buildOf(join(dir, "daemon.js"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(buildOf(join(dir, "no-such.js"))).toBeUndefined();
    // A folder stands where the script would.
    expect(buildOf(dir)).toBeUndefined();
  });
});

describe("keeping the Mac awake", () => {
  const START = { type: "start", cols: 80, rows: 24 };
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const told = (c: { messages: ServerMessage[] }): KeepAwake[] => c.messages.flatMap((m) => (m.type === "keepAwake" ? [m.keepAwake] : []));
  const stateOf = (m: Extract<ServerMessage, { type: "inbox" }>, id: number) => m.sessions.find((s) => s.id === id)?.state;

  /** A holder that starts no process: it counts the holds asked of it and those released, keeps whether each held the display too, counts the wakes of the display, and `lose` ends the last hold as a child that ended by itself does. */
  function holder() {
    const seen = { held: 0, released: 0, displays: [] as boolean[], wakes: 0, lose: (): void => undefined };
    const holdAwake: HoldAwake = (lost, display) => {
      seen.held++;
      seen.displays.push(display);
      seen.lose = lost;
      return { release: () => void seen.released++ };
    };
    return { holdAwake, wakeDisplay: () => void seen.wakes++, seen };
  }

  /** A run folder of the case's own, removed after it. */
  function runFolder(): string {
    const dir = mkdtempSync(join(tmpdir(), "owlery-keep-awake-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    return dir;
  }

  /** A daemon given a counting holder, with two clients, and panes whose process ends when a line arrives. */
  async function held(options: Partial<DaemonOptions> = {}) {
    const { holdAwake, wakeDisplay, seen } = holder();
    const { daemon: d, url } = await daemonWithWorkItem({ holdAwake, wakeDisplay, commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }), ...options });
    const c = await client(url);
    const ready = await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    let requestId = 1;
    /** Opens a pane of a kind that reports state. */
    const pane = async () => {
      const asked = requestId++;
      c.send({ ...START, kind: "claude", requestId: asked, workItemId: 1 });
      return (await c.message("started", (m) => m.requestId === asked)).session;
    };
    /** Opens a pane whose agent then sends a prompt, and waits until the inbox lists it as working. */
    const workingPane = async () => {
      const session = await pane();
      d.agentEvent(session.id, "UserPromptSubmit", {});
      await c.message("inbox", (m) => stateOf(m, session.id) === "working");
      return session;
    };
    /** Sends a message that has no answer, and after it a start the daemon refuses: the refusal arrives once the daemon has handled both. */
    const sendAndWait = async (message: object) => {
      const asked = requestId++;
      c.send(message);
      c.send({ ...START, kind: "shell", requestId: asked, workItemId: 999 });
      await c.message("error", (m) => m.requestId === asked);
    };
    return { daemon: d, url, c, bystander, both: [c, bystander], ready, seen, pane, workingPane, sendAndWait };
  }

  it("says in `ready` that the choice is `working` and nothing is held where its run folder holds no choice, and holds nothing", async () => {
    const runDir = runFolder();
    const { ready, seen } = await held({ runDir });
    expect(ready.keepAwake).toEqual({ choice: "working", held: false });
    expect(seen).toMatchObject({ held: 0, released: 0 });
    expect(existsSync(join(runDir, "keep-awake.json"))).toBe(false);
  });

  it("holds once when a pane's agent begins to work, tells every client, and holds no second time for a second working pane", async () => {
    const { daemon: d, c, both, seen, pane } = await held();
    const first = await pane();
    const second = await pane();
    expect(seen.held).toBe(0);
    d.agentEvent(first.id, "UserPromptSubmit", {});
    for (const each of both) expect((await each.message("keepAwake")).keepAwake).toEqual({ choice: "working", held: true });
    expect(seen.held).toBe(1);
    d.agentEvent(second.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => stateOf(m, second.id) === "working");
    expect(seen).toMatchObject({ held: 1, released: 0 });
    for (const each of both) expect(told(each)).toEqual([{ choice: "working", held: true }]);
  });

  it.each(["asks a permission", "exits", "is closed", "is interrupted"] as const)("keeps the hold while one of two panes still works, and releases it once when the other %s, telling every client", async (end) => {
    const { daemon: d, url, c, both, seen, workingPane } = await held();
    const first = await workingPane();
    const second = await workingPane();
    d.agentEvent(first.id, "Stop", {});
    await c.message("inbox", (m) => stateOf(m, first.id) === "finished");
    expect(seen).toMatchObject({ held: 1, released: 0 });
    expect(told(c)).toEqual([{ choice: "working", held: true }]);
    if (end === "asks a permission") d.agentEvent(second.id, "PermissionRequest", {});
    if (end === "exits") c.send({ type: "input", id: second.id, data: "go\n" });
    if (end === "is closed") c.send({ type: "close", id: second.id });
    // The person presses Esc during the pane's Bash call, which its session log tells and no hook does.
    if (end === "is interrupted") await interruptToolCall(d, second.id, sessionLog(cleanups));
    for (const each of both) expect((await each.message("keepAwake", (m) => !m.keepAwake.held)).keepAwake).toEqual({ choice: "working", held: false });
    expect(seen).toMatchObject({ held: 1, released: 1 });
    // A pane that exited keeps `working` as its last state, and no longer counts.
    expect((await (await client(url)).message("ready")).keepAwake).toEqual({ choice: "working", held: false });
  });

  it.each([
    ["finishes", {}, "finished"],
    ["fails", { fail: "exit" }, "failed"],
  ] as const)("holds while a headless session works, with no pane working, and releases the hold when it %s", async (_, adapter, last) => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { daemon: d, c, both, seen } = await held({ worktreesRoot: made.root, roleAdapter: fakeAdapter({ ...adapter, delayMs: 100 }) });
    c.send({ type: "createWorkItem", requestId: 100, repo: made.repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect(seen.held).toBe(0);
    await d.startRoleSession(workItem.id, "Which owl?", PROOFER);
    for (const each of both) expect((await each.message("keepAwake")).keepAwake).toEqual({ choice: "working", held: true });
    expect(seen).toMatchObject({ held: 1, released: 0 });
    await c.message("headless", (m) => m.headless.state === last);
    for (const each of both) expect((await each.message("keepAwake", (m) => !m.keepAwake.held)).keepAwake).toEqual({ choice: "working", held: false });
    expect(seen).toMatchObject({ held: 1, released: 1 });
  });

  it("holds under `always` with no session, tells every client the choice and the hold in one message, still asks to exit once it is idle, and releases the hold when it closes", async () => {
    let idle = 0;
    const { daemon: d, c, bystander, both, seen } = await held({ idleExitMs: 100, onIdle: () => idle++ });
    bystander.send({ type: "setKeepAwake", choice: "always" });
    for (const each of both) expect((await each.message("keepAwake")).keepAwake).toEqual({ choice: "always", held: true });
    for (const each of both) expect(told(each)).toEqual([{ choice: "always", held: true }]);
    c.socket.close();
    bystander.socket.close();
    await pause(400);
    expect(idle).toBe(1);
    expect(seen).toMatchObject({ held: 1, released: 0 });
    await d.close();
    expect(seen).toMatchObject({ held: 1, released: 1 });
  });

  it("releases the hold of a working pane when a client chooses `never`, and holds for no pane that begins to work afterwards", async () => {
    const { c, both, seen, workingPane } = await held();
    await workingPane();
    expect(seen).toMatchObject({ held: 1, released: 0 });
    c.send({ type: "setKeepAwake", choice: "never" });
    for (const each of both) expect((await each.message("keepAwake", (m) => m.keepAwake.choice === "never")).keepAwake).toEqual({ choice: "never", held: false });
    expect(seen).toMatchObject({ held: 1, released: 1 });
    await workingPane();
    expect(seen).toMatchObject({ held: 1, released: 1 });
    for (const each of both) expect(told(each)).toEqual([{ choice: "working", held: true }, { choice: "never", held: false }]);
  });

  it("tells every client of a choice that leaves the hold as it was, and holds again for a working pane when the choice returns to `working`", async () => {
    const { c, both, seen, workingPane } = await held();
    c.send({ type: "setKeepAwake", choice: "never" });
    for (const each of both) expect((await each.message("keepAwake")).keepAwake).toEqual({ choice: "never", held: false });
    await workingPane();
    expect(seen.held).toBe(0);
    c.send({ type: "setKeepAwake", choice: "working" });
    for (const each of both) expect((await each.message("keepAwake", (m) => m.keepAwake.held)).keepAwake).toEqual({ choice: "working", held: true });
    expect(seen).toMatchObject({ held: 1, released: 0 });
  });

  it("holds from its start, and says so in `ready`, where the daemon before it on the same run folder was told `always`, from a file the user alone can read", async () => {
    const runDir = runFolder();
    const before = await held({ runDir });
    before.c.send({ type: "setKeepAwake", choice: "always" });
    await before.c.message("keepAwake");
    await before.daemon.close();
    expect(readFileSync(join(runDir, "keep-awake.json"), "utf8")).toBe('{"choice":"always"}');
    expect(statSync(join(runDir, "keep-awake.json")).mode & 0o777).toBe(0o600);

    const { holdAwake, seen } = holder();
    const { url } = await daemon({ runDir, holdAwake });
    expect(seen).toMatchObject({ held: 1, released: 0 });
    expect((await (await client(url)).message("ready")).keepAwake).toEqual({ choice: "always", held: true });
  });

  it.each([
    ["a choice that is none of the three", '{"choice":"sometimes"}'],
    ["text that is no JSON", "always"],
    ["JSON that is no record", "null"],
  ])("reads a file that holds %s as the choice `working`", async (_, text) => {
    const runDir = runFolder();
    writeFileSync(join(runDir, "keep-awake.json"), text);
    const { ready, seen } = await held({ runDir });
    expect(ready.keepAwake).toEqual({ choice: "working", held: false });
    expect(seen.held).toBe(0);
  });

  it("tells no client and writes no file for a choice that is none of the three, and for the choice that already stands", async () => {
    const runDir = runFolder();
    const { both, seen, sendAndWait } = await held({ runDir });
    await sendAndWait({ type: "setKeepAwake", choice: "sometimes" });
    await sendAndWait({ type: "setKeepAwake" });
    await sendAndWait({ type: "setKeepAwake", choice: "working" });
    for (const each of both) expect(told(each)).toEqual([]);
    expect(existsSync(join(runDir, "keep-awake.json"))).toBe(false);
    expect(seen.held).toBe(0);
    // The choice still stands, and the daemon still takes one of the three.
    await sendAndWait({ type: "setKeepAwake", choice: "never" });
    for (const each of both) expect(told(each)).toEqual([{ choice: "never", held: false }]);
    expect(readFileSync(join(runDir, "keep-awake.json"), "utf8")).toBe('{"choice":"never"}');
  });

  it("tells every client when the hold ends by itself, releases nothing, and holds again when another pane's agent begins to work", async () => {
    const { both, seen, workingPane } = await held();
    await workingPane();
    seen.lose();
    for (const each of both) expect((await each.message("keepAwake", (m) => !m.keepAwake.held)).keepAwake).toEqual({ choice: "working", held: false });
    expect(seen).toMatchObject({ held: 1, released: 0 });
    await workingPane();
    for (const each of both) await each.until(() => (told(each).length === 3 ? true : undefined));
    expect(seen).toMatchObject({ held: 2, released: 0 });
    for (const each of both) expect(told(each).map((k) => k.held)).toEqual([true, false, true]);
  });

  it("holds nothing, and tells no client of a hold, where the holder reports the hold lost before it returns", async () => {
    let asked = 0;
    const { both, workingPane, ready } = await held({
      holdAwake: (lost) => {
        asked++;
        lost();
        return { release: () => undefined };
      },
    });
    expect(ready.keepAwake).toEqual({ choice: "working", held: false });
    await workingPane();
    expect(asked).toBeGreaterThan(0);
    for (const each of both) expect(told(each)).toEqual([]);
  });

  it("takes no loss of a hold it released for the loss of the hold that stands", async () => {
    const { url, c, both, seen } = await held();
    c.send({ type: "setKeepAwake", choice: "always" });
    await c.message("keepAwake", (m) => m.keepAwake.held);
    const loseFirst = seen.lose;
    c.send({ type: "setKeepAwake", choice: "never" });
    await c.message("keepAwake", (m) => m.keepAwake.choice === "never");
    c.send({ type: "setKeepAwake", choice: "always" });
    for (const each of both) await each.until(() => (told(each).length === 3 ? true : undefined));
    loseFirst();
    expect((await (await client(url)).message("ready")).keepAwake).toEqual({ choice: "always", held: true });
    for (const each of both) expect(told(each).map((k) => k.held)).toEqual([true, false, true]);
    expect(seen).toMatchObject({ held: 2, released: 1 });
  });

  it("holds the display too and wakes it once at each heavy command's start while one holds a turn, releases the display's hold with the last heavy command, keeps the hold from idle sleep a working pane wants, and asks nothing under `never` (scenario J)", async () => {
    const { daemon: d, c, seen, workingPane } = await held();
    const giver = d.turnGiver();
    const ask = (name: string) => giver.ask({ folder: `/elsewhere/${name}`, name, place: "build", alone: false });
    // Under `working`, with no session working, a heavy command alone holds the Mac and its display.
    const first = await ask("first").turn;
    expect((await c.message("keepAwake")).keepAwake).toEqual({ choice: "working", held: true });
    const second = ask("second");
    first?.end();
    (await second.turn)?.end();
    expect((await c.message("keepAwake", (m) => !m.keepAwake.held)).keepAwake).toEqual({ choice: "working", held: false });
    expect(seen).toMatchObject({ held: 1, released: 1, displays: [true], wakes: 2 });
    // A pane that works holds the Mac from idle sleep, and a heavy command adds the display to that hold until it ends.
    await workingPane();
    const third = await ask("third").turn;
    await c.until(() => (seen.held === 3 ? true : undefined));
    third?.end();
    await c.until(() => (seen.held === 4 ? true : undefined));
    expect(seen).toMatchObject({ held: 4, released: 3, displays: [true, false, true, false], wakes: 3 });
    // Under `never` nothing is held and no display is woken, whatever runs.
    c.send({ type: "setKeepAwake", choice: "never" });
    await c.message("keepAwake", (m) => m.keepAwake.choice === "never");
    const fourth = await ask("fourth").turn;
    await pause(100);
    fourth?.end();
    await pause(100);
    expect(seen).toMatchObject({ held: 4, released: 4, displays: [true, false, true, false], wakes: 3 });
  });

  it("holds nothing once it closed, though its choice is `always` and a pane's process ends afterwards", async () => {
    const { daemon: d, c, seen, pane } = await held();
    await pane();
    c.send({ type: "setKeepAwake", choice: "always" });
    await c.message("keepAwake", (m) => m.keepAwake.held);
    await d.close();
    await pause(300);
    expect(seen).toMatchObject({ held: 1, released: 1 });
  });

  it("sends no `keepAwake` in `ready`, and takes no choice, where it is given no holder", async () => {
    const runDir = runFolder();
    const { url } = await daemon({ runDir });
    const c = await client(url);
    expect(Object.keys(await c.message("ready")).sort()).toEqual(["accounts", "agentNotice", "archived", "defaultAccountId", "headless", "lastLook", "paneKinds", "refreshesUsage", "repositories", "sessions", "type", "workItems"]);
    c.send({ type: "setKeepAwake", choice: "always" });
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 999 });
    await c.message("error", (m) => m.requestId === 1);
    expect(told(c)).toEqual([]);
    expect(existsSync(join(runDir, "keep-awake.json"))).toBe(false);
    expect("keepAwake" in (await (await client(url)).message("ready"))).toBe(false);
  });

  it("stays up and keeps the choice where its run folder cannot be written, and says so in its log", async () => {
    const said: unknown[][] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void said.push(args);
    cleanups.push(() => {
      console.error = error;
    });
    const { url, c, seen } = await held({ runDir: join(runFolder(), "removed") });
    c.send({ type: "setKeepAwake", choice: "always" });
    expect((await c.message("keepAwake")).keepAwake).toEqual({ choice: "always", held: true });
    expect(seen.held).toBe(1);
    expect((await (await client(url)).message("ready")).keepAwake).toEqual({ choice: "always", held: true });
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^the choice of when to keep the Mac awake was not written: /)]);
  });
});

describe("the caps on the machine", () => {
  const START = { type: "start", cols: 80, rows: 24 };
  /** The owner's Mac as the framer's probe read it: 36 GB, 12 cores of which 6 are performance cores, and 25.1 GB free. */
  const READING: MachineReading = { memoryBytes: 38_654_705_664, cores: 12, performanceCores: 6, load: 3.9, disk: { freeBytes: 25_088_950_272, totalBytes: 494_384_795_648 } };
  /** What the daemon proposes on that reading, with one work item standing and nothing measured. */
  const PROPOSED: Machine = {
    reading: READING,
    agents: { proposed: 6, byCores: 6, byMemory: 27, set: null, running: 0, perAgentBytes: 679 * 1024 ** 2, measured: 0, queue: [] },
    worktrees: { proposed: null, set: null, standing: 1, perWorktreeBytes: null, keepFreeBytes: 10_000_000_000 },
    panes: { proposed: 8, set: null },
    heavy: { proposed: 1, byCores: 1, byMemory: 2, set: null, queue: [] },
    scrollback: { proposed: 5000, set: null },
  };
  const told = (c: { messages: ServerMessage[] }): Machine[] => c.messages.flatMap((m) => (m.type === "machine" ? [m.machine] : []));

  /** A reader that gives `READING` and notes the folder of each read. */
  function reader() {
    const reads: string[] = [];
    const machine: MachineReader = {
      read: (folder) => {
        reads.push(folder);
        return READING;
      },
      // No process of an agent is read: the fake adapter starts none, and a pane's measure is the case's own.
      memoryOf: () => Promise.resolve(new Map()),
      // No worktree is measured: a measure is the case's own.
      sizeOf: () => Promise.resolve(null),
    };
    return { machine, reads };
  }

  /** A daemon given a reader, with a work item, a run folder of its own and two clients, and panes whose process ends when a line arrives. */
  async function machined(options: Partial<DaemonOptions> = {}) {
    const { machine, reads } = reader();
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { runDir } = await runFolderWithWorkItem(made, "Pane work");
    const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, machine, commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }), ...options });
    const c = await client(url);
    const ready = await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    return { daemon: d, url, runDir, root: made.root, reads, c, bystander, both: [c, bystander], ready };
  }

  it("sends in `ready` what it read of the machine, the worktrees' folder's disk among it, and each cap's proposal with the numbers it came from, each cap following its proposal (scenario 1)", async () => {
    const { ready, reads, root } = await machined();
    expect(ready.machine).toEqual(PROPOSED);
    // Once at the daemon's start, and again at each of the two hellos.
    expect(reads).toEqual([root, root, root]);
  });

  it("takes a cap a person sets, tells every client after its `done`, keeps it in `limits.json` for the daemon started next on the run folder, and follows the proposal again once the cap is set to null (scenario 3)", async () => {
    const { daemon: d, runDir, c, both } = await machined();
    c.send({ type: "setCaps", requestId: 1, agents: 3 });
    for (const each of both) expect((await each.message("machine")).machine.agents).toEqual({ ...PROPOSED.agents, set: 3 });
    const done = c.messages.findIndex((m) => m.type === "done" && m.requestId === 1);
    expect(done).toBeGreaterThan(-1);
    expect(done).toBeLessThan(c.messages.findIndex((m) => m.type === "machine"));
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"agents":3}');
    expect(statSync(join(runDir, "limits.json")).mode & 0o777).toBe(0o600);
    // A field that is absent is left as it is.
    c.send({ type: "setCaps", requestId: 2, panes: 12 });
    expect((await c.message("machine", (m) => m.machine.panes.set === 12)).machine).toMatchObject({ agents: { set: 3 }, worktrees: { set: null }, panes: { proposed: 8, set: 12 } });
    await d.close();

    const { machine } = reader();
    const { url: again } = await daemon({ runDir, machine });
    expect((await (await client(again)).message("ready")).machine).toMatchObject({ agents: { proposed: 6, set: 3 }, panes: { proposed: 8, set: 12 } });
  });

  it("follows the proposal again where a person sets a cap to null, and writes the file without it", async () => {
    const { runDir, c, bystander } = await machined();
    c.send({ type: "setCaps", requestId: 1, agents: 3, worktrees: 40 });
    await bystander.message("machine");
    c.send({ type: "setCaps", requestId: 2, agents: null });
    expect((await bystander.message("machine", (m) => m.machine.agents.set === null)).machine).toMatchObject({ agents: { proposed: 6, set: null }, worktrees: { set: 40 } });
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"worktrees":40}');
  });

  it.each([
    ["no whole number", { agents: 2.5 }, "The cap on agents at once is a whole number from 1."],
    ["a number under 1", { worktrees: 0 }, "The cap on worktrees is a whole number from 1."],
    ["a number given as text", { agents: "3" }, "The cap on agents at once is a whole number from 1."],
    ["a cap on panes over 16, beside a value it would take", { agents: 3, panes: 17 }, "The cap on panes side by side is a whole number from 1 to 16."],
    ["a scrollback under 1,000 lines", { scrollback: 999 }, "The scrollback is a whole number from 1,000 to 50,000."],
    ["a scrollback over 50,000 lines", { scrollback: 50_001 }, "The scrollback is a whole number from 1,000 to 50,000."],
  ])("refuses %s with a sentence, and changes, writes and tells nothing", async (_, caps, sentence) => {
    const { runDir, c, both } = await machined();
    c.send({ type: "setCaps", requestId: 7, ...caps });
    expect((await c.message("error", (m) => m.requestId === 7)).message).toBe(sentence);
    c.send({ type: "readMachine" });
    expect((await c.message("machine")).machine).toEqual(PROPOSED);
    for (const each of both) expect(told(each)).toHaveLength(each === c ? 1 : 0);
    expect(existsSync(join(runDir, "limits.json"))).toBe(false);
  });

  it("answers `done`, and tells and writes nothing, where a cap is set to the value it holds", async () => {
    const { runDir, c, bystander } = await machined();
    c.send({ type: "setCaps", requestId: 1, agents: 3 });
    await bystander.message("machine");
    rmSync(join(runDir, "limits.json"));
    c.send({ type: "setCaps", requestId: 2, agents: 3, worktrees: null });
    await c.message("done", (m) => m.requestId === 2);
    bystander.send({ type: "readMachine" });
    expect((await bystander.message("machine", (m) => m.machine.agents.set === 3 && told(bystander).length === 2)).machine.agents.set).toBe(3);
    expect(told(c)).toHaveLength(1);
    expect(existsSync(join(runDir, "limits.json"))).toBe(false);
  });

  it("keeps a cap in memory and stays up where its run folder cannot be written, and says so in its log", async () => {
    const said: unknown[][] = [];
    const error = console.error;
    console.error = (...args: unknown[]) => void said.push(args);
    cleanups.push(() => {
      console.error = error;
    });
    const unwritable = mkdtempSync(join(tmpdir(), "owlery-caps-"));
    cleanups.push(() => rmSync(unwritable, { recursive: true, force: true }));
    const { url, c } = await machined({ runDir: join(unwritable, "removed") });
    c.send({ type: "setCaps", requestId: 1, panes: 2 });
    await c.message("done", (m) => m.requestId === 1);
    expect((await c.message("machine")).machine.panes.set).toBe(2);
    expect((await (await client(url)).message("ready")).machine?.panes.set).toBe(2);
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^the caps on the machine were not written: /)]);
  });

  it("counts a headless session while it works, and tells every client when it starts and when it ends", async () => {
    const { daemon: d, c, both } = await machined({ roleAdapter: fakeAdapter({ delayMs: 200 }) });
    await d.startRoleSession(1, "Which file?", PROOFER);
    await c.message("headless", (m) => m.headless.state === "finished");
    for (const each of both) await each.message("machine", (m) => m.machine.agents.running === 0);
    for (const each of both) expect(told(each).map((m) => m.agents.running)).toEqual([1, 0]);
  });

  it("reads the machine again at a `readMachine`, and sends what it read to the client that asked alone", async () => {
    const { reads, c, bystander } = await machined();
    const before = reads.length;
    c.send({ type: "readMachine" });
    expect((await c.message("machine")).machine).toEqual(PROPOSED);
    expect(reads.length).toBe(before + 1);
    bystander.send({ type: "setCaps", requestId: 3, panes: 2 });
    await bystander.message("machine");
    expect(told(bystander)).toHaveLength(1);
    expect(told(c).map((m) => m.panes.set)).toEqual([null, 2]);
  });

  it("gives as many heavy commands a turn at once as the limit says, the default from the reading and then the value a person sets, which outlives the daemon, and tells every client the queue of heavy commands (scenario E)", async () => {
    const { daemon: d, runDir, c, both, ready } = await machined();
    const worktree = ready.workItems[0]?.worktree ?? "";
    const giver = d.turnGiver();
    const first = await giver.ask({ folder: worktree, name: "test", place: "build", alone: false }).turn;
    const second = giver.ask({ folder: "/elsewhere", name: "install", place: "outside", alone: false });
    expect(second.waits).toBe(true);
    for (const each of both) {
      const queue = (await each.message("machine", (m) => m.machine.heavy.queue.length === 2)).machine.heavy.queue;
      expect(queue.map(({ workItemId, folder, name, place, state }) => ({ workItemId, folder, name, place, state }))).toEqual([
        { workItemId: 1, folder: worktree, name: "test", place: "build", state: "running" },
        { workItemId: null, folder: "/elsewhere", name: "install", place: "outside", state: "waiting" },
      ]);
    }
    // A value over the machine's 12 cores is refused, and nothing changes.
    c.send({ type: "setCaps", requestId: 1, heavyCommands: 13 });
    expect((await c.message("error", (m) => m.requestId === 1)).message).toBe("The limit on heavy commands at once is a whole number from 1 to 12.");
    c.send({ type: "setCaps", requestId: 2, heavyCommands: 2 });
    // The raised limit gives the command that waited its turn at once.
    expect(await second.turn).not.toBeNull();
    expect((await c.message("machine", (m) => m.machine.heavy.set === 2 && m.machine.heavy.queue.every(({ state }) => state === "running"))).machine.heavy.set).toBe(2);
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"heavyCommands":2}');
    first?.end();
    (await second.turn)?.end();
    await d.close();

    // The daemon started next on the run folder gives two turns at once.
    const { machine } = reader();
    const { daemon: again, url } = await daemon({ runDir, machine });
    expect((await (await client(url)).message("ready")).machine?.heavy).toMatchObject({ proposed: 1, set: 2 });
    const next = again.turnGiver();
    const one = await next.ask({ folder: "/a", name: "test", place: "outside", alone: false }).turn;
    const two = next.ask({ folder: "/b", name: "test", place: "outside", alone: false });
    expect(two.waits).toBe(false);
    one?.end();
    (await two.turn)?.end();
    await again.close();

    // A value over the machine's cores, written by hand, is read as none, and the daemon follows the default of 1.
    writeFileSync(join(runDir, "limits.json"), '{"heavyCommands":13}');
    const { daemon: third, url: thirdUrl } = await daemon({ runDir, machine: reader().machine });
    expect((await (await client(thirdUrl)).message("ready")).machine?.heavy).toMatchObject({ proposed: 1, set: null });
    const held = await third.turnGiver().ask({ folder: "/a", name: "test", place: "outside", alone: false }).turn;
    expect(third.turnGiver().ask({ folder: "/b", name: "test", place: "outside", alone: false }).waits).toBe(true);
    held?.end();
  });

  /** A pane's process that prints, at each number it reads, as many `x` and then a `!`, with no line break, so the output a pane's buffer keeps is cut at its count of characters. */
  const PRINTS = { command: "/bin/sh", args: ["-c", "stty -echo; while read n; do head -c \"$n\" /dev/zero | tr '\\0' x; printf '!'; done"], env: {} };
  /** Has the pane print `count` characters and a `!`, and waits until the client has its `!` number `printed`. */
  const print = async (c: Awaited<ReturnType<typeof client>>, id: number, count: number, printed: number): Promise<void> => {
    c.send({ type: "input", id, data: `${String(count)}\r` });
    await c.until(() => (c.messages.reduce((marks, m) => marks + (m.type === "output" && m.id === id ? m.data.split("!").length - 1 : 0), 0) >= printed ? true : undefined), 20_000);
  };
  /** What the daemon replays of a pane to a client that attaches it now. */
  const replayOf = async (c: Awaited<ReturnType<typeof client>>, id: number): Promise<string> => {
    const replays = () => c.messages.filter((m): m is Extract<ServerMessage, { type: "replay" }> => m.type === "replay" && m.id === id);
    const before = replays().length;
    c.send({ type: "attach", id });
    return (await c.until(() => replays()[before], 20_000)).data;
  };

  it("keeps 256 characters of each pane's output for each line of the scrollback, 1,280,000 at its default of 5,000 lines (scenario B1)", async () => {
    const { c } = await machined({ commandFor: () => PRINTS });
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const { id } = (await c.message("started", (m) => m.requestId === 1)).session;
    await print(c, id, 1_500_000, 1);
    const replay = await replayOf(c, id);
    expect(replay.length).toBe(1_280_000);
    expect(replay.endsWith("x!")).toBe(true);
  });

  it("moves the limit of every live pane's buffer when a person sets the scrollback, drops the older output at once where it is smaller, gives a pane started later the same, and keeps the value for the daemon started next (scenario B2)", async () => {
    const { daemon: d, runDir, c, bystander } = await machined({ commandFor: () => PRINTS });
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const { id } = (await c.message("started", (m) => m.requestId === 1)).session;
    await print(c, id, 1_000_000, 1);
    // A smaller scrollback drops what its 256 characters a line do not hold, with nothing printed since.
    c.send({ type: "setCaps", requestId: 2, scrollback: 1000 });
    await bystander.message("machine", (m) => m.machine.scrollback?.set === 1000);
    expect((await replayOf(c, id)).length).toBe(256_000);
    // A larger one keeps more of what is printed afterwards.
    c.send({ type: "setCaps", requestId: 3, scrollback: 20_000 });
    await bystander.message("machine", (m) => m.machine.scrollback?.set === 20_000);
    expect(readFileSync(join(runDir, "limits.json"), "utf8")).toBe('{"scrollback":20000}');
    await print(c, id, 2_000_000, 2);
    expect((await replayOf(c, id)).length).toBe(256_000 + 2_000_001);
    // "Use the default" returns it to 5,000 lines, and the buffer that held more drops its older output.
    c.send({ type: "setCaps", requestId: 4, scrollback: null });
    await bystander.message("machine", (m) => m.machine.scrollback?.set === null && told(bystander).length === 3);
    expect((await replayOf(c, id)).length).toBe(1_280_000);
    c.send({ type: "setCaps", requestId: 5, scrollback: 20_000 });
    await bystander.message("machine", (m) => m.machine.scrollback?.set === 20_000 && told(bystander).length === 4);
    await d.close();

    // The daemon started next on the run folder reads it, and a pane it starts keeps 5,120,000 characters.
    const { url } = await daemon({ runDir, machine: reader().machine, commandFor: () => PRINTS });
    const again = await client(url);
    expect((await again.message("ready")).machine?.scrollback).toEqual({ proposed: 5000, set: 20_000 });
    again.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    const pane = (await again.message("started", (m) => m.requestId === 1)).session.id;
    await print(again, pane, 5_500_000, 1);
    expect((await replayOf(again, pane)).length).toBe(5_120_000);
  });

  it("answers a `readHeavyRuns` with one row for each command of each repository the runs' file holds, to the client that asked alone (scenario I)", async () => {
    const { runDir, c, bystander, ready } = await machined();
    const item = ready.workItems[0];
    const run = { askedAt: 0, beside: false, alone: false, load: 2, exitCode: 0 };
    // The longest run comes first, the most memory and the highest load in different runs, and a folder no work item names is a row of its own for each folder.
    const lines = [
      { ...run, repo: item?.repo, workItemId: 1, folder: item?.worktree, name: "Broad gate", startedAt: 0, endedAt: 180_000, peakMemory: 1024 ** 3, highestLoad: 13.1 },
      { ...run, repo: item?.repo, workItemId: 1, folder: item?.worktree, name: "Broad gate", startedAt: 0, endedAt: 60_000, peakMemory: 2 * 1024 ** 3, highestLoad: 9.5 },
      { ...run, repo: null, workItemId: null, folder: "/Users/someone/scratch", name: "test", startedAt: 0, endedAt: 5_000, peakMemory: null, highestLoad: null, exitCode: null },
      { ...run, repo: null, workItemId: null, folder: "/Users/someone/other", name: "test", startedAt: 0, endedAt: 7_000, peakMemory: null, highestLoad: 4, exitCode: 1 },
    ];
    writeFileSync(join(runDir, "heavy-runs.jsonl"), lines.map((line) => `${JSON.stringify(line)}\n`).join(""));
    c.send({ type: "readHeavyRuns" });
    expect((await c.message("heavyRuns")).runs).toEqual([
      { repo: item?.repo, repoName: item?.repoName, name: "Broad gate", runs: 2, longestMs: 180_000, mostMemory: 2 * 1024 ** 3, highestLoad: 13.1 },
      { repo: null, repoName: "scratch", name: "test", runs: 1, longestMs: 5_000, mostMemory: null, highestLoad: null },
      { repo: null, repoName: "other", name: "test", runs: 1, longestMs: 7_000, mostMemory: null, highestLoad: 4 },
    ]);
    expect(bystander.messages.some((m) => m.type === "heavyRuns")).toBe(false);
  });

  it("tells every client the count of the agents that run when a pane of a kind that reports its state opens and when its process ends, and nothing when a shell opens", async () => {
    const { c, both } = await machined();
    c.send({ ...START, kind: "shell", requestId: 1, workItemId: 1 });
    await c.message("started", (m) => m.requestId === 1);
    c.send({ ...START, kind: "claude", requestId: 2, workItemId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 2)).session;
    for (const each of both) expect((await each.message("machine")).machine.agents.running).toBe(1);
    c.send({ type: "input", id: pane.id, data: "\n" });
    for (const each of both) await each.message("machine", (m) => m.machine.agents.running === 0);
    for (const each of both) expect(told(each).map((m) => m.agents.running)).toEqual([1, 0]);
  });

  it("sends no `machine` in `ready` nor a disk with a plan, takes no cap, reads nothing and writes no file where it is given no reader (scenario 10)", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { runDir } = await runFolderWithWorkItem(made, "Pane work");
    const { url } = await daemon({ runDir, worktreesRoot: made.root });
    const c = await client(url);
    expect("machine" in (await c.message("ready"))).toBe(false);
    c.send({ type: "readMachine" });
    c.send({ type: "setCaps", requestId: 1, agents: 3 });
    expect((await c.message("error", (m) => m.requestId === 1)).message).toBe("This daemon keeps no cap on the machine.");
    expect(told(c)).toEqual([]);
    expect(existsSync(join(runDir, "limits.json"))).toBe(false);
    c.send({ type: "planWorkItem", requestId: 2, repo: made.repo, title: "Next" });
    expect("disk" in (await c.message("workItemPlan", (m) => m.requestId === 2))).toBe(false);
  });

  /** An adapter that answers as the fake does, each event `delayMs` after the one before, and notes the prompt of each run it starts. */
  function noting(delayMs = 0) {
    const fake = fakeAdapter({ delayMs });
    const starts: string[] = [];
    const roleAdapter: RoleAdapter = { ...fake, start: (options, listener) => (starts.push(options.prompt), fake.start(options, listener)) };
    return { roleAdapter, starts };
  }

  /** A daemon whose cap on agents a person set to 1, with a live Claude Code pane that takes that place and ends when a line is typed into it. */
  async function atCap(options: Partial<DaemonOptions> = {}) {
    const made = await machined(options);
    made.c.send({ type: "setCaps", requestId: 900, agents: 1 });
    await made.c.message("done", (m) => m.requestId === 900);
    made.c.send({ ...START, kind: "claude", requestId: 901, workItemId: 1 });
    const pane = (await made.c.message("started", (m) => m.requestId === 901)).session;
    await made.c.message("machine", (m) => m.machine.agents.running === 1);
    return { ...made, pane };
  }

  /** The newest a client was told of a headless session. */
  const newest = (c: { messages: ServerMessage[] }, id: number): HeadlessInfo | undefined => c.messages.flatMap((m) => (m.type === "headless" && m.headless.id === id ? [m.headless] : [])).at(-1);
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it("lists a headless session started while the agents are at the cap as queued, starts no process for it, and tells every client the queue (scenario 4)", async () => {
    const { roleAdapter, starts } = noting();
    const { daemon: d, bystander } = await atCap({ roleAdapter, now: () => 1_000 });
    const headless = await d.startRoleSession(1, "Which file?", PROOFER);
    expect(headless).toMatchObject({ state: "queued", queuedAt: 1_000, startedAt: 1_000, stopped: null });
    expect((await bystander.message("machine", (m) => m.machine.agents.queue.length === 1)).machine.agents).toMatchObject({ running: 1, queue: [headless.id] });
    await pause(100);
    expect(starts).toEqual([]);
    expect(newest(bystander, headless.id)?.state).toBe("queued");
  });

  it("opens a pane a person asks for at the cap, and counts it (scenario 8)", async () => {
    const { c, bystander } = await atCap();
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    expect((await c.message("started", (m) => m.requestId === 1)).session.alive).toBe(true);
    expect((await bystander.message("machine", (m) => m.machine.agents.running === 2)).machine.agents).toMatchObject({ running: 2, set: 1, queue: [] });
  });

  it("starts a queued session when a place frees, with its start's time, and runs its time limit and its entry in the ledger from there (scenarios 5 and 7)", async () => {
    let clock = 1_000;
    const { roleAdapter, starts } = noting(1_000);
    const { daemon: d, c, pane } = await atCap({ roleAdapter, now: () => clock, headlessLimitMs: 400 });
    const headless = await d.startRoleSession(1, "Which file?", PROOFER);
    // Longer than the time limit: a session that waits runs no limit.
    await pause(600);
    expect(newest(c, headless.id)?.state).toBe("queued");
    clock = 5_000;
    c.send({ type: "input", id: pane.id, data: "\n" });
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "working")).headless).toMatchObject({ startedAt: 5_000, queuedAt: 1_000 });
    expect(starts).toEqual(["Which file?"]);
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless.stopped).toBe("limit");
    c.send({ type: "readLedger", requestId: 2, workItemId: 1 });
    expect((await c.message("ledger", (m) => m.requestId === 2)).entries.map(({ startedAt, stopped }) => ({ startedAt, stopped }))).toEqual([{ startedAt: 5_000, stopped: "limit" }]);
  });

  it("starts a queued session where a person raises the cap (scenario 5)", async () => {
    const { roleAdapter, starts } = noting();
    const { daemon: d, c } = await atCap({ roleAdapter });
    const headless = await d.startRoleSession(1, "Which file?", PROOFER);
    c.send({ type: "setCaps", requestId: 2, agents: 2 });
    await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
    expect(starts).toEqual(["Which file?"]);
    expect((await c.message("machine", (m) => m.machine.agents.set === 2)).machine.agents.queue).toEqual([]);
  });

  it("ends a queued session at a stop and at an archive, with no entry in the ledger, and starts none in its place while the agents stay at the cap (scenario 9)", async () => {
    const { roleAdapter, starts } = noting();
    const { daemon: d, c, pane } = await atCap({ roleAdapter });
    const first = await d.startRoleSession(1, "First?", PROOFER);
    const second = await d.startRoleSession(1, "Second?", PROOFER);
    await c.message("machine", (m) => m.machine.agents.queue.length === 2);
    const before = c.messages.length;
    c.send({ type: "stopHeadless", requestId: 3, id: first.id });
    await c.message("done", (m) => m.requestId === 3);
    expect((await c.message("headless", (m) => m.headless.id === first.id && m.headless.state === "failed")).headless).toMatchObject({ stopped: "request", error: "the session was stopped at a request before it finished" });
    const left = await c.until(() => c.messages.slice(before).find((m): m is Extract<ServerMessage, { type: "machine" }> => m.type === "machine"));
    expect(left.machine.agents).toMatchObject({ running: 1, queue: [second.id] });
    await pause(100);
    expect(starts).toEqual([]);
    expect(newest(c, second.id)?.state).toBe("queued");
    // An archive names the queued session among what runs, and ends it before the pane, whose end frees a place.
    c.send({ type: "archiveWorkItem", requestId: 4, id: 1, running: { panes: [], headless: [] } });
    expect((await c.message("error", (m) => m.requestId === 4)).message).toBe("A session started since you looked. Read it again.");
    c.send({ type: "archiveWorkItem", requestId: 5, id: 1, running: { panes: [pane.id], headless: [second.id] } });
    await c.message("done", (m) => m.requestId === 5);
    expect(newest(c, second.id)).toMatchObject({ state: "failed", stopped: "request" });
    expect(starts).toEqual([]);
    c.send({ type: "readLedger", requestId: 6, workItemId: 1 });
    expect((await c.message("ledger", (m) => m.requestId === 6)).entries).toEqual([]);
  });

  it("starts a session while one place under the cap is free, lists it as working with no `queuedAt`, and queues the next once the agents are at the cap (scenario 6)", async () => {
    const { roleAdapter, starts } = noting(1_000);
    const { daemon: d, c } = await machined({ roleAdapter });
    c.send({ type: "setCaps", requestId: 1, agents: 2 });
    await c.message("done", (m) => m.requestId === 1);
    c.send({ ...START, kind: "claude", requestId: 2, workItemId: 1 });
    await c.message("started", (m) => m.requestId === 2);
    await c.message("machine", (m) => m.machine.agents.running === 1);
    const first = await d.startRoleSession(1, "First?", PROOFER);
    expect(first.state).toBe("working");
    expect("queuedAt" in first).toBe(false);
    await c.message("headless", (m) => m.headless.id === first.id);
    expect(c.messages.some((m) => m.type === "headless" && m.headless.id === first.id && m.headless.state === "queued")).toBe(false);
    expect((await d.startRoleSession(1, "Second?", PROOFER)).state).toBe("queued");
    expect(starts).toEqual(["First?"]);
  });

  it("ends a work item's queued session before its working one at an archive, so the place the working one frees starts none of them, and writes the one entry of the run that ran (scenario 9)", async () => {
    const { roleAdapter, starts } = noting(1_000);
    const { daemon: d, c } = await machined({ roleAdapter });
    c.send({ type: "setCaps", requestId: 1, agents: 1 });
    await c.message("done", (m) => m.requestId === 1);
    const first = await d.startRoleSession(1, "First?", PROOFER);
    await c.message("machine", (m) => m.machine.agents.running === 1);
    const second = await d.startRoleSession(1, "Second?", PROOFER);
    expect(second.state).toBe("queued");
    c.send({ type: "archiveWorkItem", requestId: 4, id: 1, running: { panes: [], headless: [first.id, second.id] } });
    await c.message("done", (m) => m.requestId === 4);
    expect(starts).toEqual(["First?"]);
    expect(c.messages.some((m) => m.type === "headless" && m.headless.id === second.id && m.headless.state === "working")).toBe(false);
    expect(newest(c, second.id)).toMatchObject({ state: "failed", stopped: "request" });
    c.send({ type: "readLedger", requestId: 5, workItemId: 1 });
    expect((await c.message("ledger", (m) => m.requestId === 5)).entries).toHaveLength(1);
  });

  it("refuses to remove an account a queued session would run under, naming the session (scenario 9)", async () => {
    const { roleAdapter } = noting();
    const { daemon: d, c } = await atCap({ roleAdapter });
    // The account is named by its folder's last name.
    const holder = mkdtempSync(join(tmpdir(), "owlery-account-"));
    cleanups.push(() => rmSync(holder, { recursive: true, force: true }));
    const folder = join(holder, "Work");
    mkdirSync(folder);
    c.send({ type: "addAccount", requestId: 1, folder });
    await c.message("done", (m) => m.requestId === 1);
    expect(await d.startRoleSession(1, "Which file?", PROOFER, 1)).toMatchObject({ state: "queued", accountId: 1 });
    c.send({ type: "removeAccount", requestId: 3, id: 1 });
    expect((await c.message("error", (m) => m.requestId === 3)).message).toBe(`"Work" is not removed while something runs under it: the proofer's session in "Pane work".`);
  });

  it("reads the memory of a working headless session's own process, as its adapter hands it over", async () => {
    const asked: number[][] = [];
    const fake = fakeAdapter({ delayMs: 400 });
    const roleAdapter: RoleAdapter = { ...fake, start: async (options, listener) => ({ ...(await fake.start(options, listener)), pid: 4242 }) };
    const machine: MachineReader = { read: () => READING, sizeOf: () => Promise.resolve(null), memoryOf: async (pids) => (asked.push([...pids]), new Map(pids.map((pid) => [pid, 700 * 1024]))) };
    const { daemon: d, c } = await machined({ roleAdapter, machine, measureMs: 50 });
    await d.startRoleSession(1, "Which file?", PROOFER);
    expect((await c.message("machine", (m) => m.machine.agents.measured === 1)).machine.agents.measured).toBe(1);
    expect(asked[0]).toEqual([4242]);
  });

  it("starts a queued session where a measure raises the proposal above the agents that run", async () => {
    // 2 GB of memory and 6 performance cores: 1,024 MB at 679 MB an agent proposes 1, and at 100 MB, once five are measured, 6.
    const small: MachineReading = { ...READING, memoryBytes: 2 * 1024 ** 3 };
    const machine: MachineReader = { read: () => small, sizeOf: () => Promise.resolve(null), memoryOf: async (pids) => new Map(pids.map((pid) => [pid, 100 * 1024])) };
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { runDir } = await runFolderWithWorkItem(made, "Pane work");
    writeFileSync(join(runDir, "agent-memory.json"), JSON.stringify([100 * 1024, 100 * 1024, 100 * 1024, 100 * 1024]));
    const { roleAdapter, starts } = noting();
    const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, machine, measureMs: 200, roleAdapter });
    const c = await client(url);
    expect((await c.message("ready")).machine?.agents.proposed).toBe(1);
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    await c.message("started", (m) => m.requestId === 1);
    const headless = await d.startRoleSession(1, "Which file?", PROOFER);
    expect(headless.state).toBe("queued");
    await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
    expect(starts).toEqual(["Which file?"]);
  });

  it("queues nothing where it is given no reader of the machine", async () => {
    const { roleAdapter, starts } = noting();
    const { d, c } = await daemonWithWorkItem({ roleAdapter }).then(async ({ daemon: d, url }) => ({ d, c: await client(url) }));
    await c.message("ready");
    for (const requestId of [1, 2, 3]) c.send({ ...START, kind: "claude", requestId, workItemId: 1 });
    await c.message("started", (m) => m.requestId === 3);
    expect((await d.startRoleSession(1, "Which file?", PROOFER)).state).toBe("working");
    expect(starts).toEqual(["Which file?"]);
  });

  it("reads once a minute the resident memory of each agent's own process while one lives, keeps each agent's highest in `agent-memory.json`, and proposes from it once five are measured (scenario 2, the store)", async () => {
    const asked: number[][] = [];
    const readings = [600, 700, 650];
    const machine: MachineReader = {
      read: () => READING,
      sizeOf: () => Promise.resolve(null),
      memoryOf: async (pids) => {
        asked.push([...pids]);
        const kilobytes = (readings.shift() ?? 650) * 1024;
        return new Map(pids.map((pid) => [pid, kilobytes]));
      },
    };
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { runDir } = await runFolderWithWorkItem(made, "Pane work");
    // Four agents a daemon before this one measured, kept in the run folder.
    writeFileSync(join(runDir, "agent-memory.json"), JSON.stringify([500 * 1024, 520 * 1024, 540 * 1024, 560 * 1024]));
    const { url } = await daemon({ runDir, worktreesRoot: made.root, machine, measureMs: 50, commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }) });
    const c = await client(url);
    expect((await c.message("ready")).machine?.agents).toMatchObject({ measured: 4, perAgentBytes: 679 * 1024 ** 2 });
    await pause(150);
    // No agent lives, so nothing is read.
    expect(asked).toEqual([]);
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 1)).session;
    const measured = await c.message("machine", (m) => m.machine.agents.measured === 5 && m.machine.agents.perAgentBytes === 700 * 1024 ** 2);
    // 18,432 MB, half of 36 GB, holds 26 agents at 700 MB, more than the 6 performance cores.
    expect(measured.machine.agents).toMatchObject({ proposed: 6, byMemory: 26 });
    expect(asked[0]).toHaveLength(1);
    c.send({ type: "input", id: pane.id, data: "\n" });
    await c.message("machine", (m) => m.machine.agents.running === 0);
    const after = asked.length;
    await pause(150);
    expect(asked.length).toBe(after);
    expect(JSON.parse(readFileSync(join(runDir, "agent-memory.json"), "utf8"))).toEqual([500 * 1024, 520 * 1024, 540 * 1024, 560 * 1024, 700 * 1024]);
    expect(statSync(join(runDir, "agent-memory.json")).mode & 0o777).toBe(0o600);
  });

  it("tells the store at each reading which agents live, so it forgets an agent that ended, the last one once none lives", async () => {
    const living = vi.spyOn(AgentMemoryStore.prototype, "keepLiving");
    cleanups.push(() => living.mockRestore());
    const machine: MachineReader = { read: () => READING, sizeOf: () => Promise.resolve(null), memoryOf: async (pids) => new Map(pids.map((pid) => [pid, 700 * 1024])) };
    const { c } = await machined({ machine, measureMs: 50 });
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 1)).session;
    await c.until(() => living.mock.calls.some(([names]) => names.has(`pane-${String(pane.id)}`)) || undefined);
    c.send({ type: "input", id: pane.id, data: "\n" });
    await c.message("machine", (m) => m.machine.agents.running === 0);
    const after = living.mock.calls.length;
    await c.until(() => living.mock.calls.length > after || undefined);
    expect([...(living.mock.calls.at(-1)?.[0] ?? ["none read"])]).toEqual([]);
  });

  /** The size of a worktree a daemon of the case stored: 440 MB, at 1,024 bytes a kilobyte. */
  const MEASURED_KB = 429_688;
  /** The stored work item of a place a case made, measured at `kilobytes` or not at all. */
  const storedAt = (id: number, title: string, place: Awaited<ReturnType<typeof branchedWorktree>>, kilobytes: number | null) => ({ id, title, branch: place.branch, worktree: place.worktree, createdAt: 1, baseCommit: place.baseCommit, baseBranch: place.baseBranch, pinned: false, muted: false, groupId: null, archivedAt: null, worktreeSize: kilobytes === null ? null : { kilobytes, measuredAt: 1 } });
  /** The stored repository of a folder a case made, holding the work items given. */
  const storedIn = (id: number, folder: string, workItems: unknown[]) => ({ id, folder, name: null, icon: null, defaultBase: null, hidden: false, addedAt: 1, groups: [], workItems });

  it("measures a new work item's worktree with one `sizeOf` when its setup's pane exits, keeps the size with the work item, proposes the worktree cap from it, and measures it no more when its setup runs again nor after a restart (scenario 13)", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    writeFileSync(join(made.repo, ".worktreesetup"), "read line; exit 0");
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const sized: string[] = [];
    const machine: MachineReader = { ...reader().machine, sizeOf: (folder) => (sized.push(folder), Promise.resolve(MEASURED_KB)) };
    const setupCommandFor = (command: string, id: number) => ({ command: "/bin/sh", args: ["-c", command], env: { OWLERY_PANE_ID: String(id) } });
    const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, machine, setupCommandFor, now: () => 1234 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Set up", kind: "claude", cols: 80, rows: 24, setupCommand: "read line; exit 0" });
    const { workItem } = await c.message("workItemCreated", (m) => m.requestId === 1);
    await pause(150);
    // The setup still runs, so nothing is measured yet.
    expect(sized).toEqual([]);
    c.send({ type: "input", id: workItem.setup!.paneId!, data: "\n" });
    const measured = await c.message("machine", (m) => m.machine.worktrees.perWorktreeBytes !== null);
    // The 15.1 GB free past the 10 GB kept free holds 34 more worktrees at 440 MB.
    expect(measured.machine.worktrees).toEqual({ proposed: 35, set: null, standing: 1, perWorktreeBytes: MEASURED_KB * 1024, keepFreeBytes: 10_000_000_000 });
    expect(sized).toEqual([workItem.worktree]);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8")).repositories[0].workItems[0].worktreeSize).toEqual({ kilobytes: MEASURED_KB, measuredAt: 1234 });
    // A client is not sent the size with the work item.
    const inbox = c.messages.filter((m) => m.type === "inbox").at(-1) as Extract<ServerMessage, { type: "inbox" }>;
    expect(Object.keys(inbox.workItems[0]!)).not.toContain("worktreeSize");
    // The setup run again measures nothing.
    c.send({ type: "runSetup", requestId: 2, workItemId: workItem.id, cols: 80, rows: 24, setupCommand: "read line; exit 0" });
    const rerun = (await c.message("started", (m) => m.requestId === 2)).session;
    c.send({ type: "input", id: rerun.id, data: "\n" });
    await c.message("inbox", (m) => m.workItems.some((w) => w.setup?.paneId === rerun.id && w.setup.state !== "running"));
    await pause(150);
    expect(sized).toEqual([workItem.worktree]);
    await d.close();
    const again: string[] = [];
    const { url: next } = await daemon({ runDir, worktreesRoot: made.root, machine: { ...machine, sizeOf: (folder) => (again.push(folder), Promise.resolve(1)) } });
    expect((await (await client(next)).message("ready")).machine?.worktrees.perWorktreeBytes).toBe(MEASURED_KB * 1024);
    await pause(150);
    expect(again).toEqual([]);
  });

  it("measures at its start each standing worktree that has no size, one at a time, keeps none where `sizeOf` gives none, and measures at once a new work item whose repository names no setup (scenario 13)", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const first = await branchedWorktree({ folder: made.repo, title: "First", root: made.root });
    const second = await branchedWorktree({ folder: made.repo, title: "Second", root: made.root });
    const kept = await branchedWorktree({ folder: made.repo, title: "Kept", root: made.root });
    writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 4, nextRepositoryId: 2, nextGroupId: 1, repositories: [storedIn(1, made.repo, [storedAt(1, "First", first, null), storedAt(2, "Second", second, null), storedAt(3, "Kept", kept, 100)])] }));
    const asked: { folder: string; answer: (kilobytes: number | null) => void }[] = [];
    const machine: MachineReader = { ...reader().machine, sizeOf: (folder) => new Promise((answer) => asked.push({ folder, answer })) };
    const { url } = await daemon({ runDir, worktreesRoot: made.root, machine });
    const c = await client(url);
    await c.message("ready");
    await pause(100);
    // The second waits for the first, and the one measured before is measured no more.
    expect(asked.map((each) => each.folder)).toEqual([first.worktree]);
    asked[0]!.answer(1000);
    await c.message("machine", (m) => m.machine.worktrees.perWorktreeBytes === 1000 * 1024);
    await pause(50);
    expect(asked.map((each) => each.folder)).toEqual([first.worktree, second.worktree]);
    asked[1]!.answer(null);
    await pause(50);
    const stored = () => JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8")).repositories[0].workItems.map((item: { worktreeSize: unknown }) => item.worktreeSize);
    expect(stored()).toEqual([{ kilobytes: 1000, measuredAt: expect.any(Number) }, null, { kilobytes: 100, measuredAt: 1 }]);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "No setup", kind: "claude", cols: 80, rows: 24, setupCommand: null });
    const { workItem } = await c.message("workItemCreated", (m) => m.requestId === 1);
    expect(workItem.setup).toBeNull();
    await pause(100);
    expect(asked.map((each) => each.folder)).toEqual([first.worktree, second.worktree, workItem.worktree]);
    asked[2]!.answer(3000);
    expect((await c.message("machine", (m) => m.machine.worktrees.perWorktreeBytes === 3000 * 1024)).machine.worktrees.standing).toBe(4);
  });

  it("answers a plan with the free disk it reads then, the 10 GB kept free, the largest worktree measured in the plan's repository, the worktrees that stand and the cap (scenario 11)", async () => {
    const made = temporaryRepository();
    const other = temporaryRepository("other");
    const unmeasured = temporaryRepository("unmeasured");
    cleanups.push(made.remove, other.remove, unmeasured.remove);
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const one = await branchedWorktree({ folder: made.repo, title: "One", root: made.root });
    const two = await branchedWorktree({ folder: made.repo, title: "Two", root: made.root });
    const elsewhere = await branchedWorktree({ folder: other.repo, title: "Elsewhere", root: other.root });
    writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: 4, nextRepositoryId: 3, nextGroupId: 1, repositories: [storedIn(1, made.repo, [storedAt(1, "One", one, 300_000), storedAt(2, "Two", two, MEASURED_KB)]), storedIn(2, other.repo, [storedAt(3, "Elsewhere", elsewhere, 2_000_000)])] }));
    const { machine, reads } = reader();
    const low = { ...READING, disk: { freeBytes: 10_200_000_000, totalBytes: 494_384_795_648 } };
    const { url } = await daemon({ runDir, worktreesRoot: made.root, machine: { ...machine, read: (folder) => (machine.read(folder), low) } });
    const c = await client(url);
    await c.message("ready");
    const before = reads.length;
    c.send({ type: "planWorkItem", requestId: 1, repo: made.repo, title: "Next" });
    // The 0.2 GB past the 10 GB kept free holds no more worktree at the 2 GB of the largest measured anywhere, so the cap is the 3 that stand.
    expect((await c.message("workItemPlan", (m) => m.requestId === 1)).disk).toEqual({ freeBytes: 10_200_000_000, keepFreeBytes: 10_000_000_000, needsBytes: MEASURED_KB * 1024, standing: 3, cap: 3 });
    expect(reads.length).toBe(before + 1);
    c.send({ type: "setCaps", requestId: 2, worktrees: 5 });
    await c.message("done", (m) => m.requestId === 2);
    c.send({ type: "planWorkItem", requestId: 3, repo: unmeasured.repo, title: "Next" });
    expect((await c.message("workItemPlan", (m) => m.requestId === 3)).disk).toEqual({ freeBytes: 10_200_000_000, keepFreeBytes: 10_000_000_000, needsBytes: null, standing: 3, cap: 5 });
  });
});

// Each case's daemon reads a stored pull request through a stand-in for gh, so no case reaches GitHub.
describe("the watch of an open pull request", () => {
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const VIEW = ["pr", "view", PULL_REQUEST_URL, "--json", VIEW_FIELDS];
  const SECOND_URL = "https://github.com/owner/project/pull/2";
  const run = (name: string, status: string, conclusion: string | null = null) => ({ __typename: "CheckRun", name, status, conclusion, detailsUrl: `https://github.com/owner/project/runs/${name}`, workflowName: "seal" });

  /**
   * A daemon whose store holds one work item with an open pull request
   * the stage pushed at the branch's head, a stand-in for gh, a counting
   * holder of the Mac, a read every 100 milliseconds while the checks run
   * and every minute otherwise, and no client.
   */
  async function watched(options: Partial<DaemonOptions> = {}, item: Record<string, unknown> = {}, other: Record<string, unknown> | null = null) {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const runDir = join(made.base, "run");
    mkdirSync(runDir);
    const place = await branchedWorktree({ folder: made.repo, title: "Watched", root: made.root });
    const at = git(place.worktree, "rev-parse", "HEAD").trim();
    const stored: PullRequest = { number: 1, url: PULL_REQUEST_URL, state: "open", head: at, pushed: at, checks: "none", list: [], listCount: 0, readAt: 1, failure: null };
    const plain = { id: 1, title: "Watched", branch: place.branch, worktree: place.worktree, createdAt: 1, baseCommit: place.baseCommit, baseBranch: place.baseBranch ?? null, pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null, pullRequest: stored };
    const workItems: Record<string, unknown>[] = [{ ...plain, ...item }];
    if (other !== null) {
      // A second work item, whose pull request is number 2.
      const second = await branchedWorktree({ folder: made.repo, title: "Watched too", root: made.root });
      workItems.push({ ...plain, id: 2, title: "Watched too", branch: second.branch, worktree: second.worktree, baseCommit: second.baseCommit, baseBranch: second.baseBranch ?? null, pullRequest: { ...stored, number: 2, url: SECOND_URL }, ...other });
    }
    writeFileSync(join(runDir, "repositories.json"), JSON.stringify([{ id: 1, folder: made.repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: 1, groups: [], workItems }]));
    const gh = ghStandIn(cleanups, made.base);
    const seen = { held: 0 };
    const { daemon: d, url } = await daemon({ runDir, worktreesRoot: made.root, gh: gh.gh, gateEnv: { PATH: process.env.PATH ?? "/usr/bin:/bin" }, prPollMs: 100, prRestPollMs: 60_000, now: () => 7, holdAwake: () => (seen.held++, { release: () => undefined }), ...options });
    /** What gh pr view answers for this pull request, with its checks and anything else given. */
    const answer = (rollup: unknown[], more: Record<string, unknown> = {}) => gh.answer("view", { out: JSON.stringify({ number: 1, url: PULL_REQUEST_URL, state: "OPEN", isDraft: false, headRefOid: at, mergedAt: null, statusCheckRollup: rollup, ...more }) });
    return { d, url, gh, seen, at, stored, answer };
  }

  /** The work item's pull request as the newest `ready` or `inbox` a client got lists it. */
  const pullRequestIn = (c: Awaited<ReturnType<typeof client>>): PullRequest | null | undefined => {
    const newest = c.messages.filter((m) => m.type === "ready" || m.type === "inbox").at(-1) as Extract<ServerMessage, { type: "inbox" }> | undefined;
    return newest?.workItems[0]?.pullRequest;
  };

  it("reads the pull request at a client's hello and again while its checks run, with one call of gh and no agent, and holds neither the Mac nor a session for it", async () => {
    const w = await watched();
    w.answer([run("seal", "IN_PROGRESS")]);
    const c = await client(w.url);
    const pending = await c.until(() => (pullRequestIn(c)?.checks === "pending" ? pullRequestIn(c) : undefined));
    expect(pending).toEqual({ ...w.stored, checks: "pending", list: [{ name: "seal", state: "pending", link: "https://github.com/owner/project/runs/seal" }], listCount: 1, readAt: 7 });
    expect(w.gh.calls()[0]).toEqual(VIEW);
    w.answer([run("seal", "COMPLETED", "SUCCESS")]);
    const passed = await c.until(() => (pullRequestIn(c)?.checks === "passed" ? pullRequestIn(c) : undefined));
    expect(passed?.list).toEqual([{ name: "seal", state: "passed", link: "https://github.com/owner/project/runs/seal" }]);
    // Each read is the one call, and none started a session or held the Mac.
    for (const call of w.gh.calls()) expect(call).toEqual(VIEW);
    expect(c.messages.some((m) => m.type === "headless")).toBe(false);
    expect((await c.message("ready")).headless).toEqual([]);
    expect(w.seen.held).toBe(0);
    // The checks passed at the pushed commit, so the next read waits a minute.
    const calls = w.gh.calls().length;
    await pause(500);
    expect(w.gh.calls()).toHaveLength(calls);
    // A second client's hello reads it again at once.
    const second = await client(w.url);
    await second.message("ready");
    await c.until(() => (w.gh.calls().length === calls + 1 ? true : undefined));
  });

  it("reads again soon while GitHub's head is not the commit the stage pushed, though the checks passed", async () => {
    const w = await watched();
    w.answer([run("seal", "COMPLETED", "SUCCESS")], { headRefOid: "e".repeat(40) });
    const c = await client(w.url);
    await c.until(() => (w.gh.calls().length >= 3 ? true : undefined));
    expect(pullRequestIn(c)).toMatchObject({ head: "e".repeat(40), pushed: w.at, checks: "passed" });
  });

  it("lists a failed check with its address, and gives the pull request the failed result", async () => {
    const w = await watched();
    w.answer([run("seal", "COMPLETED", "SUCCESS"), run("build", "COMPLETED", "FAILURE")]);
    const c = await client(w.url);
    const failed = await c.until(() => (pullRequestIn(c)?.checks === "failed" ? pullRequestIn(c) : undefined));
    expect(failed?.list).toEqual([
      { name: "build", state: "failed", link: "https://github.com/owner/project/runs/build" },
      { name: "seal", state: "passed", link: "https://github.com/owner/project/runs/seal" },
    ]);
  });

  it("reads a merged and a closed pull request no more", async () => {
    for (const [state, as] of [["MERGED", "merged"], ["CLOSED", "closed"]] as const) {
      const w = await watched();
      w.answer([run("seal", "IN_PROGRESS")], { state, mergedAt: state === "MERGED" ? "2026-11-23T10:00:00Z" : null });
      const c = await client(w.url);
      await c.until(() => (pullRequestIn(c)?.state === as ? true : undefined));
      await pause(500);
      expect(w.gh.calls(), state).toHaveLength(1);
    }
  });

  it("keeps what the last read gave where gh fails, with one sentence that holds gh's first line, reads again after the longer wait, and clears the sentence at a read that succeeds", async () => {
    const w = await watched({ prRestPollMs: 700 });
    w.gh.answer("view", { err: "\nHTTP 502: Bad Gateway (https://api.github.com/graphql)\nmore\n", exit: 1 });
    const c = await client(w.url);
    const failed = await c.until(() => (pullRequestIn(c)?.failure ? pullRequestIn(c) : undefined));
    expect(failed).toEqual({ ...w.stored, failure: "gh pr view exited with code 1: HTTP 502: Bad Gateway (https://api.github.com/graphql)" });
    // Not after 100 milliseconds, as while checks run.
    await pause(300);
    expect(w.gh.calls()).toHaveLength(1);
    w.answer([run("seal", "IN_PROGRESS")]);
    const read = await c.until(() => (pullRequestIn(c)?.failure === null ? pullRequestIn(c) : undefined));
    expect(read).toMatchObject({ checks: "pending", failure: null, readAt: 7 });
    expect(w.gh.calls()).toHaveLength(2);
    // An answer that does not read is a failed read too.
    w.gh.answer("view", { out: "not json\n" });
    expect(await c.until(() => pullRequestIn(c)?.failure ?? undefined)).toBe("gh pr view printed no pull request Owlery reads");
    // So is an answer whose checks are no list.
    w.answer([run("seal", "IN_PROGRESS")]);
    await c.until(() => (pullRequestIn(c)?.failure === null ? true : undefined));
    w.gh.answer("view", { out: JSON.stringify({ number: 1, url: PULL_REQUEST_URL, state: "OPEN", isDraft: false, headRefOid: w.at, mergedAt: null, statusCheckRollup: null }) });
    expect(await c.until(() => pullRequestIn(c)?.failure ?? undefined)).toBe("gh pr view printed no pull request Owlery reads");
  });

  it("says where no gh stands on the PATH of the login shell, and keeps the pull request as the last read gave it", async () => {
    const w = await watched({ gh: undefined, gateEnv: { PATH: "/usr/bin:/bin" } });
    const c = await client(w.url);
    const failed = await c.until(() => (pullRequestIn(c)?.failure ? pullRequestIn(c) : undefined));
    expect(failed).toEqual({ ...w.stored, failure: "no gh stands on the PATH of the login shell, so Owlery cannot read the pull request; GitHub's CLI is at https://cli.github.com" });
  });

  it("calls gh for no work item while no client is connected, nor once its client left, nor for an archived work item", async () => {
    const w = await watched();
    w.answer([run("seal", "IN_PROGRESS")]);
    await pause(400);
    expect(w.gh.calls()).toHaveLength(0);
    const c = await client(w.url);
    await c.until(() => (w.gh.calls().length >= 2 ? true : undefined));
    c.socket.close();
    await pause(300);
    const calls = w.gh.calls().length;
    await pause(400);
    expect(w.gh.calls()).toHaveLength(calls);
    // Of two work items, the archived one's pull request is not read, and the other's is, in the same turn.
    const archived = await watched({}, { archivedAt: 5 }, {});
    archived.answer([run("seal", "IN_PROGRESS")], { number: 2, url: SECOND_URL });
    const other = await client(archived.url);
    await other.until(() => (archived.gh.calls().length >= 2 ? true : undefined));
    expect(new Set(archived.gh.calls().map((call) => call[2]))).toEqual(new Set([SECOND_URL]));
  });
});

describe("a Claude Code pane and the owl chain", () => {
  /** A stand-in for the person's shell: it writes the arguments it was given, one a line, and then its environment, into a file named for the pane, and ends. No `claude` runs. */
  function standInShell(base: string): { shell: string; given: (pane: number) => Promise<{ args: string[]; env: Record<string, string> }> } {
    const shell = join(base, "shell-stand-in");
    writeFileSync(shell, `#!/bin/sh\n{ printf '%s\\n' "$@"; printf -- '--env--\\n'; env; } > '${base}'/pane-$OWLERY_PANE_ID.partial\nmv '${base}'/pane-$OWLERY_PANE_ID.partial '${base}'/pane-$OWLERY_PANE_ID.txt\n`, { mode: 0o755 });
    const given = async (pane: number) => {
      const file = join(base, `pane-${String(pane)}.txt`);
      const end = Date.now() + 5000;
      while (!existsSync(file)) {
        if (Date.now() > end) throw new Error(`pane ${String(pane)} wrote nothing`);
        await new Promise((r) => setTimeout(r, 20));
      }
      const [args = "", env = ""] = readFileSync(file, "utf8").split("--env--\n");
      return { args: args.split("\n").slice(0, -1), env: Object.fromEntries(env.split("\n").filter((line) => line.includes("=")).map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])) };
    };
    return { shell, given };
  }

  /** The Claude Code config folder a case's daemon reads: `.claude` of a home of the case's own, which holds nothing unless the case writes it. */
  const configOf = (made: { base: string }): string => join(made.base, "home", ".claude");
  const KEY = "agentic@agenticseal";

  /** Writes a config folder whose user settings enable the AgenticSeal plugin and one other, with the plugin installed under the folder, at a path that holds the script its check runs. */
  function withPlugin(made: { base: string }): string {
    const config = configOf(made);
    const installed = join(config, "plugins", "cache", "agenticseal", "agentic", "1.0.0");
    mkdirSync(join(installed, "skills", "code-review", "scripts"), { recursive: true });
    writeFileSync(join(installed, "skills", "code-review", "scripts", "chain_check.py"), "# the check\n");
    writeFileSync(join(config, "settings.json"), `${JSON.stringify({ model: "opus", enabledPlugins: { [KEY]: true, "notes@somewhere": true } }, null, 2)}\n`);
    writeFileSync(join(config, "plugins", "installed_plugins.json"), `${JSON.stringify({ version: 2, plugins: { [KEY]: [{ scope: "user", installPath: installed, version: "1.0.0" }] } })}\n`);
    return config;
  }

  /** A daemon whose panes are launched as the app's daemon launches them (`main.ts`), with the stand-in for the shell, a run folder of the case's own, a stand-in for the chain command's script, and an adapter that answers the config folder of the case's own as the default login's, and a client of it. */
  async function launching(made: { base: string; root: string }, options: Partial<DaemonOptions> = {}) {
    const runDir = join(made.base, "run");
    const script = join(made.base, "chain-stand-in.js");
    writeFileSync(script, "process.stdout.write(JSON.stringify(process.argv.slice(2)));\n");
    const bundleDir = join(made.base, "bundle");
    const stand = standInShell(made.base);
    const settings = writeHookSettings(runDir);
    const chain = writePaneChain(runDir, { node: process.execPath, script, bundleDir });
    const { url } = await daemon({
      runDir,
      worktreesRoot: made.root,
      roleAdapter: fakeAdapter({ defaultLoginFolder: configOf(made) }),
      commandFor: paneCommands({ SHELL: stand.shell }, settings, join(runDir, "hooks.sock"), carriedIn(chain)),
      pluginEnabled: (folder, checkout, configDir) => readPlugins(folder, checkout, configDir).agenticSeal.length > 0,
      ...options,
    });
    const c = await client(url);
    await c.message("ready");
    return { c, runDir, settings, chain, bundleDir, given: stand.given };
  }

  /** Writes a config folder a person hands over at `config`, whose user settings enable the AgenticSeal plugin and one other, with the plugin installed under the folder. */
  function handedWithPlugin(config: string): string {
    const installed = join(config, "plugins", "cache", "agenticseal", "agentic", "1.0.0");
    mkdirSync(join(installed, "skills", "code-review", "scripts"), { recursive: true });
    writeFileSync(join(installed, "skills", "code-review", "scripts", "chain_check.py"), "# the check\n");
    writeFileSync(join(config, "settings.json"), `${JSON.stringify({ enabledPlugins: { [KEY]: true, "notes@handed": true } })}\n`);
    writeFileSync(join(config, "plugins", "installed_plugins.json"), `${JSON.stringify({ version: 2, plugins: { [KEY]: [{ scope: "user", installPath: installed, version: "1.0.0" }] } })}\n`);
    return config;
  }

  /** Each file under the folders with its bytes, and each link with where it points, so a case reads that nothing was added, removed or written. */
  function heldIn(...folders: string[]): unknown[] {
    return folders.flatMap((folder) =>
      (readdirSync(folder, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean; isSymbolicLink(): boolean }[])
        .map((entry) => {
          const path = join(entry.parentPath, entry.name);
          return [path, entry.isSymbolicLink() ? `-> ${readlinkSync(path)}` : entry.isFile() ? readFileSync(path, "base64") : null];
        })
        .sort(),
    );
  }

  it("reads what a Claude Code pane carries in the folder of its account: the person's own under System default, which enables no plugin, a handed folder that enables the plugin, and a folder whose settings and plugins are links into the person's own; launches the handed account's pane with a settings file of its own that holds that folder's keys with the plugin's key false, the others with the shared file, and changes no file of any folder (scenario 16)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "plugins"), { recursive: true });
    writeFileSync(join(own, "settings.json"), `${JSON.stringify({ enabledPlugins: { "notes@own": true } })}\n`);
    writeFileSync(join(own, "plugins", "installed_plugins.json"), '{ "version": 2, "plugins": {} }\n');
    const handed = handedWithPlugin(join(made.base, "Handed"));
    const linked = join(made.base, "Linked");
    mkdirSync(linked);
    symlinkSync(join(own, "settings.json"), join(linked, "settings.json"));
    symlinkSync(join(own, "plugins"), join(linked, "plugins"));
    const before = heldIn(own, handed, linked);
    const { c, runDir, settings, given } = await launching(made);
    c.send({ type: "addAccount", requestId: 1, folder: handed });
    c.send({ type: "addAccount", requestId: 2, folder: linked });
    await c.message("accounts", (m) => m.accounts.length === 3);
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Three logins", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    // The person's answer is the owl chain, so a pane whose folder enables the plugin carries the chain with the plugin kept out.
    c.send({ type: "setRepository", requestId: 4, id: workItem.repoId, paneChain: "owlery" });
    await c.message("done", (m) => m.requestId === 4);
    const launched = async (requestId: number, accountId: number) => {
      c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId, workItemId: workItem.id, accountId });
      const { session } = await c.message("started", (m) => m.requestId === requestId);
      return { id: session.id, command: (await given(session.id)).args[3]! };
    };
    const carried = `--plugin-dir '${join(made.base, "bundle")}' --append-system-prompt-file '${join(runDir, "pane-head.md")}'`;
    const system = await launched(10, 0);
    expect(system.command).toBe(`exec claude --settings '${settings}' ${carried}`);
    const byHanded = await launched(11, 1);
    const file = join(runDir, `claude-pane-${String(byHanded.id)}.json`);
    expect(byHanded.command).toBe(`exec env CLAUDE_CONFIG_DIR='${handed}' claude --settings '${file}' ${carried}`);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ ...hookSettings(), enabledPlugins: { [KEY]: false, "notes@handed": true } });
    const byLinked = await launched(12, 2);
    expect(byLinked.command).toBe(`exec env CLAUDE_CONFIG_DIR='${linked}' claude --settings '${settings}' ${carried}`);
    expect(existsSync(join(runDir, `claude-pane-${String(system.id)}.json`))).toBe(false);
    expect(existsSync(join(runDir, `claude-pane-${String(byLinked.id)}.json`))).toBe(false);
    expect(heldIn(own, handed, linked)).toEqual(before);
  });

  it("sends a repository's chain read in the folder of the account a new pane of it takes, reads it again when the repository's account or the default changes, and launches a pane of a work item set to an account whose folder enables the plugin with nothing of the bundle while no answer is kept (scenario 16)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const handed = handedWithPlugin(join(made.base, "Handed"));
    // The commits are read at the hello and not again within the case, so a chain read anew is read by the request that changed the account.
    const { c, settings, given } = await launching(made, { commitPollMs: 3_600_000 });
    c.send({ type: "addAccount", requestId: 1, folder: handed });
    await c.message("accounts", (m) => m.accounts.length === 2);
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Asked by the repository", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    /** The chain the last inbox sends of the repository, once it says the plugin is enabled or not as `plugin` says. */
    const chainOf = (plugin: boolean) => c.until(() => {
      const chain = c.messages.findLast((m) => m.type === "inbox")?.repositories[0]?.chain;
      return chain?.plugin === plugin ? chain : undefined;
    });
    expect(await chainOf(false)).toEqual({ owl: true, plugin: false, chosen: null });
    c.send({ type: "setRepository", requestId: 3, id: workItem.repoId, accountId: 1 });
    expect(await chainOf(true)).toEqual({ owl: true, plugin: true, chosen: null });
    c.send({ type: "setRepository", requestId: 4, id: workItem.repoId, accountId: null });
    expect(await chainOf(false)).toEqual({ owl: true, plugin: false, chosen: null });
    // The default names the account a repository set to none takes.
    c.send({ type: "setDefaultAccount", requestId: 5, id: 1 });
    expect((await chainOf(true)).plugin).toBe(true);
    c.send({ type: "setDefaultAccount", requestId: 6, id: 0 });
    expect((await chainOf(false)).plugin).toBe(false);
    // A work item set to the handed account in a repository set to none: the window is asked nothing, and the pane carries nothing of the bundle.
    c.send({ type: "setWorkItem", requestId: 7, id: workItem.id, accountId: 1 });
    await c.message("done", (m) => m.requestId === 7);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 8, workItemId: workItem.id });
    const { session } = await c.message("started", (m) => m.requestId === 8);
    const pane = await given(session.id);
    expect(pane.args[3]).toBe(`exec env CLAUDE_CONFIG_DIR='${handed}' claude --settings '${settings}'`);
    expect(pane.env.OWLERY_CHAIN).toBeUndefined();
    expect(c.messages.findLast((m) => m.type === "inbox")?.repositories[0]?.chain).toEqual({ owl: true, plugin: false, chosen: null });
  });

  it("reads under System default the folder the adapter's lookup names, over the one the daemon's own environment names, and the daemon's own while the lookup has given no answer (scenario 16)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const looked = handedWithPlugin(join(made.base, "looked"));
    const daemons = join(made.base, "daemons");
    mkdirSync(daemons);
    writeFileSync(join(daemons, "settings.json"), "{}\n");
    const own = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = daemons;
    cleanups.push(() => {
      if (own === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = own;
    });
    const answered = await launching(made, { roleAdapter: fakeAdapter({ defaultLoginFolder: looked }) });
    answered.c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    expect((await answered.c.message("inbox", (m) => m.repositories.length === 1)).repositories[0]?.chain).toEqual({ owl: true, plugin: true, chosen: null });
    // An adapter with no answer: the folder of the daemon's environment, which enables nothing, and then the one that does.
    const unanswered = await launching(repositoryWith(".github/workflows/owlery-seal.yml"), { roleAdapter: fakeAdapter() });
    unanswered.c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    expect((await unanswered.c.message("inbox", (m) => m.repositories.length === 1)).repositories[0]?.chain.plugin).toBe(false);
    process.env.CLAUDE_CONFIG_DIR = looked;
    unanswered.c.send({ type: "addRepository", requestId: 2, folder: made.repo });
    await unanswered.c.message("done", (m) => m.requestId === 2);
    expect(await unanswered.c.until(() => (unanswered.c.messages.findLast((m) => m.type === "inbox")?.repositories[0]?.chain.plugin === true ? true : undefined))).toBe(true);
  });

  /** A temporary repository whose main checkout holds the workflow at `path`, committed, so a work item's worktree holds it. */
  function repositoryWith(path: string | null, text = "name: a check\n") {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    if (path !== null) {
      mkdirSync(join(made.repo, ".github", "workflows"), { recursive: true });
      writeFileSync(join(made.repo, path), text);
      git(made.repo, "add", "--all");
      git(made.repo, "commit", "--quiet", "-m", "ci: a check");
    }
    return made;
  }
  const PLUGIN_CHECK = 'jobs:\n  hygiene:\n    steps:\n      - run: python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py"\n';

  it("launches a Claude Code pane of a work item whose worktree holds Owlery's workflow with the role bundle, the head of the run folder and a launcher of the chain command that runs, and a shell of the same work item with none of them", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const { c, runDir, settings, chain, bundleDir, given } = await launching(made);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "On the owl chain", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    const pane = await given(session.id);
    expect(pane.args).toEqual(["-l", "-i", "-c", `exec claude --settings '${settings}' --plugin-dir '${bundleDir}' --append-system-prompt-file '${join(runDir, "pane-head.md")}'`]);
    expect(readFileSync(join(runDir, "pane-head.md"), "utf8")).toBe(paneHead());
    expect([pane.env.OWLERY_CHAIN, pane.env.OWLERY_BASE, pane.env.OWLERY_PANE_ID]).toEqual([chain.launcher, "main", String(session.id)]);
    // The launcher the pane's environment names runs the command's script and hands it its arguments.
    expect(JSON.parse(spawnSync(pane.env.OWLERY_CHAIN!, ["owed", "--base", "main"], { encoding: "utf8", cwd: workItem.worktree }).stdout)).toEqual(["owed", "--base", "main"]);
    // A pane that continues carries the same, before the option that continues.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id, continueLatest: true });
    const continued = await given((await c.message("started", (m) => m.requestId === 2)).session.id);
    expect(continued.args[3]).toBe(`${pane.args[3]!} --continue`);
    // A shell of the work item is the person's login shell, with no word of the chain.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 3, workItemId: workItem.id });
    const shell = await given((await c.message("started", (m) => m.requestId === 3)).session.id);
    expect(shell.args).toEqual(["-l"]);
    expect([shell.env.OWLERY_CHAIN, shell.env.OWLERY_BASE]).toEqual([undefined, undefined]);
  });

  it("gives a pane none of the pane variables of a daemon started in an Owlery pane: a pane on the owl chain carries its own, a shell carries none of the chain's, no runner where its daemon wrote none, and its own id and socket, and each keeps the daemon's run folder", async () => {
    // The daemon's own environment, as a daemon started in a pane of another Owlery holds it, until the case ends.
    const outer = { OWLERY_CHAIN: "/outer/owl-chain", OWLERY_BASE: "outer-base", OWLERY_PANE_ID: "99", OWLERY_HOOK_SOCKET: "/outer/hooks.sock", OWLERY_RUN: "/outer/owl-run", OWLERY_RUN_DIR: "/daemon/run" };
    const own = Object.fromEntries(Object.keys(outer).map((name) => [name, process.env[name]]));
    Object.assign(process.env, outer);
    cleanups.push(() => {
      for (const [name, value] of Object.entries(own)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    });
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const { c, runDir, chain, given } = await launching(made);
    const read = (pane: { env: Record<string, string | undefined> }): (string | undefined)[] => [pane.env.OWLERY_CHAIN, pane.env.OWLERY_BASE, pane.env.OWLERY_PANE_ID, pane.env.OWLERY_HOOK_SOCKET, pane.env.OWLERY_RUN, pane.env.OWLERY_RUN_DIR];
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Inside a pane", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    expect(read(await given(session.id))).toEqual([chain.launcher, "main", String(session.id), join(runDir, "hooks.sock"), undefined, "/daemon/run"]);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    const shell = (await c.message("started", (m) => m.requestId === 2)).session;
    expect(read(await given(shell.id))).toEqual([undefined, undefined, String(shell.id), join(runDir, "hooks.sock"), undefined, "/daemon/run"]);
  });

  it.each([
    ["AgenticSeal's check", ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`],
    ["no check", null, ""],
  ])("launches a Claude Code pane of a work item whose worktree holds %s with the settings alone", async (_what, path, text) => {
    const made = repositoryWith(path, text);
    const { c, settings, given } = await launching(made);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "On no chain of Owlery's", kind: "claude", cols: 80, rows: 24 });
    const { session } = await c.message("workItemCreated");
    const pane = await given(session.id);
    expect(pane.args).toEqual(["-l", "-i", "-c", `exec claude --settings '${settings}'`]);
    expect([pane.env.OWLERY_CHAIN, pane.env.OWLERY_BASE]).toEqual([undefined, undefined]);
  });

  it("leaves every file under the person's Claude Code folder with the bytes it held, and adds none, when a pane on the owl chain opens and ends", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const home = join(made.base, "home");
    mkdirSync(join(home, ".claude", "plugins"), { recursive: true });
    writeFileSync(join(home, ".claude", "settings.json"), '{ "enabledPlugins": { "agentic@agenticseal": true } }\n');
    writeFileSync(join(home, ".claude", "plugins", "installed_plugins.json"), '{ "version": 2, "plugins": {} }\n');
    const held = (): unknown[] =>
      (readdirSync(join(home, ".claude"), { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[])
        .map((entry) => [join(entry.parentPath, entry.name), entry.isFile() ? readFileSync(join(entry.parentPath, entry.name), "base64") : null])
        .sort();
    const before = held();
    // The daemon and the pane it launches both read this home, until the case ends.
    const own = process.env.HOME;
    process.env.HOME = home;
    cleanups.push(() => {
      process.env.HOME = own;
    });
    const { c, given } = await launching(made);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Settings stay", kind: "claude", cols: 80, rows: 24 });
    const { session } = await c.message("workItemCreated");
    const pane = await given(session.id);
    expect(pane.env.HOME).toBe(home);
    expect(pane.env.OWLERY_CHAIN).toBeDefined();
    await c.message("exit", (m) => m.id === session.id);
    expect(held()).toEqual(before);
  });

  it("tells a client which chain a repository's Claude Code panes run, launches a pane with nothing of the bundle while the plugin is enabled and no answer is kept, keeps the person's answer on the repository, and launches the next pane by it: under the owl chain with the bundle and a settings file of the pane's own that holds the hooks and the person's enabledPlugins with the plugin's key false, and under the plugin with the settings alone", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    withPlugin(made);
    const { c, runDir, settings, chain, bundleDir, given } = await launching(made);
    c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    // The daemon read the checkout and the person's settings at the addition: both chains would run, and no answer is kept.
    const added = await c.message("inbox", (m) => m.repositories.length === 1);
    expect(added.repositories[0]?.chain).toEqual({ owl: true, plugin: true, chosen: null });
    const id = added.repositories[0]!.id;
    const alone = `exec claude --settings '${settings}'`;
    const carried = (own: string) => `exec claude --settings '${own}' --plugin-dir '${bundleDir}' --append-system-prompt-file '${join(runDir, "pane-head.md")}'`;

    // A pane the daemon launches while the answer is absent carries nothing of the bundle.
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Chosen", kind: "claude", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    const unanswered = await given(session.id);
    expect(unanswered.args[3]).toBe(alone);
    expect(unanswered.env.OWLERY_CHAIN).toBeUndefined();

    /** Sets the answer, waits for the inbox that carries it, opens a Claude Code pane of the work item and gives what it was launched with. */
    const under = async (requestId: number, paneChain: "owlery" | "plugin" | null) => {
      c.send({ type: "setRepository", requestId, id, paneChain });
      await c.message("done", (m) => m.requestId === requestId);
      await c.until(() => (c.messages.findLast((m) => m.type === "inbox")?.repositories[0]?.chain.chosen === paneChain ? true : undefined));
      c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: requestId + 100, workItemId: workItem.id });
      const started = (await c.message("started", (m) => m.requestId === requestId + 100)).session.id;
      return { pane: started, ...(await given(started)) };
    };

    // The owl chain: the bundle, and a settings file of the pane's own in the run folder.
    const owl = await under(3, "owlery");
    const own = join(runDir, `claude-pane-${String(owl.pane)}.json`);
    expect(owl.args[3]).toBe(carried(own));
    expect(owl.env.OWLERY_CHAIN).toBe(chain.launcher);
    expect(JSON.parse(readFileSync(own, "utf8"))).toEqual({ ...hookSettings(), enabledPlugins: { [KEY]: false, "notes@somewhere": true } });
    // The answer outlives the daemon.
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ repositories: [{ id, paneChain: "owlery" }] });
    // The next pane asks nothing of anybody and is launched the same way, with a file of its own.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 50, workItemId: workItem.id, continueLatest: true });
    const next = (await c.message("started", (m) => m.requestId === 50)).session.id;
    expect((await given(next)).args[3]).toBe(`${carried(join(runDir, `claude-pane-${String(next)}.json`))} --continue`);
    // A shell of the work item is asked nothing and carries nothing.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 51, workItemId: workItem.id });
    const shell = await given((await c.message("started", (m) => m.requestId === 51)).session.id);
    expect([shell.args, shell.env.OWLERY_CHAIN]).toEqual([["-l"], undefined]);

    // The AgenticSeal plugin: the pane is Claude Code as it is.
    const plugin = await under(4, "plugin");
    expect(plugin.args[3]).toBe(alone);
    expect(plugin.env.OWLERY_CHAIN).toBeUndefined();
    expect(existsSync(join(runDir, `claude-pane-${String(plugin.pane)}.json`))).toBe(false);
    // The settings change the answer back, and take it away.
    expect((await under(5, "owlery")).env.OWLERY_CHAIN).toBe(chain.launcher);
    expect((await under(6, null)).args[3]).toBe(alone);
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ repositories: [{ id, paneChain: null }] });
    // An answer that is neither chain is refused, and nothing is kept of it.
    c.send({ type: "setRepository", requestId: 7, id, paneChain: "both" });
    expect(await c.message("error", (m) => m.requestId === 7)).toEqual({ type: "error", requestId: 7, message: 'the chain of a repository\'s Claude Code panes is "owlery", "plugin" or null' });
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject({ repositories: [{ id, paneChain: null }] });
  });

  it("reads the person's settings again at each read of the repositories and at each launch, the local file of the main checkout among them, so a client is told once the plugin is turned off there, and a pane of a worktree then carries the owl chain with the settings file every pane shares, whatever answer is kept", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    withPlugin(made);
    const { c, settings, chain, given } = await launching(made, { commitPollMs: 200 });
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Turned off", kind: "claude", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("inbox", (m) => m.repositories[0]?.chain.plugin === true);
    c.send({ type: "setRepository", requestId: 2, id: 1, paneChain: "plugin" });
    await c.message("done", (m) => m.requestId === 2);
    // The person turns the plugin off for this repository, in the local settings file of its main checkout, which no worktree holds a copy of.
    mkdirSync(join(made.repo, ".claude"));
    writeFileSync(join(made.repo, ".claude", "settings.local.json"), `${JSON.stringify({ enabledPlugins: { [KEY]: false } })}\n`);
    expect(existsSync(join(workItem.worktree, ".claude"))).toBe(false);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 3, workItemId: workItem.id });
    const started = (await c.message("started", (m) => m.requestId === 3)).session.id;
    const pane = await given(started);
    expect(pane.args[3]).toContain(`exec claude --settings '${settings}' --plugin-dir `);
    expect(pane.env.OWLERY_CHAIN).toBe(chain.launcher);
    expect((await c.message("inbox", (m) => m.repositories[0]?.chain.plugin === false && m.repositories[0]?.chain.chosen === "plugin")).repositories[0]?.chain).toEqual({ owl: true, plugin: false, chosen: "plugin" });
    // With no pane and no request to carry it, the next read of the repositories alone tells the clients that the plugin is on again.
    await c.message("exit", (m) => m.id === started);
    await c.until(() => (c.messages.at(-1)?.type === "inbox" || c.messages.at(-1)?.type === "exit" ? true : undefined));
    await new Promise((r) => setTimeout(r, 600));
    const quiet = c.messages.length;
    rmSync(join(made.repo, ".claude"), { recursive: true });
    expect((await c.until(() => c.messages.slice(quiet).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox" && m.repositories[0]?.chain.plugin === true))).repositories[0]?.chain).toEqual({ owl: true, plugin: true, chosen: "plugin" });
  });

  it.each(["owlery", "plugin"] as const)("leaves every file under the person's Claude Code folder with the bytes it held, and adds none, when a pane opens and ends under the answer %s with the plugin enabled", async (paneChain) => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const config = withPlugin(made);
    const held = (): unknown[] =>
      (readdirSync(config, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[])
        .map((entry) => [join(entry.parentPath, entry.name), entry.isFile() ? readFileSync(join(entry.parentPath, entry.name), "base64") : null])
        .sort();
    const before = held();
    // The daemon and the pane it launches both read this home, until the case ends.
    const own = process.env.HOME;
    process.env.HOME = join(made.base, "home");
    cleanups.push(() => {
      process.env.HOME = own;
    });
    const { c, runDir, given } = await launching(made);
    c.send({ type: "addRepository", requestId: 1, folder: made.repo });
    await c.message("inbox", (m) => m.repositories[0]?.chain.plugin === true);
    c.send({ type: "setRepository", requestId: 2, id: 1, paneChain });
    await c.message("done", (m) => m.requestId === 2);
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Settings stay", kind: "claude", cols: 80, rows: 24 });
    const { session } = await c.message("workItemCreated");
    const pane = await given(session.id);
    expect(pane.env.HOME).toBe(join(made.base, "home"));
    // Under the owl chain the pane's own settings file stands in Owlery's run folder, and under the plugin none is written.
    expect([pane.env.OWLERY_CHAIN !== undefined, existsSync(join(runDir, `claude-pane-${String(session.id)}.json`))]).toEqual(paneChain === "owlery" ? [true, true] : [false, false]);
    await c.message("exit", (m) => m.id === session.id);
    expect(held()).toEqual(before);
  });

  /** The id of the conversation the recorded session's hook events carry (`fixtures/claude-interrupted-turn.json`). */
  const CONVERSATION = "a99099b6-accd-47d0-853b-547820b31e6d";

  /** A stand-in for the person's shell that stays: once it listens for its end and has written its size, it writes `start` and the command it was given into a file named for the pane, and its process id into another, runs until it is ended, and then writes `end`. No `claude` runs. Its files stand in a folder of their own, removed after the daemon closed, since a process ended at the close still writes. */
  function holdingShell(at: string): { shell: string; launches: (pane: number, count: number) => Promise<string[]>; pid: (pane: number) => number; size: (pane: number) => string } {
    const base = mkdtempSync(join(tmpdir(), "owlery-holding-shell-"));
    cleanups.push(() => rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }));
    const shell = join(at, "holding-shell");
    writeFileSync(shell, `#!/bin/sh\nlog='${base}'/launches-$OWLERY_PANE_ID.txt\nprintf '%s\\n' $$ > '${base}'/pid-$OWLERY_PANE_ID.txt\ntrap 'sleep 0.2; printf "end\\n" >> "$log"; exit 0' HUP TERM\nstty size > '${base}'/size-$OWLERY_PANE_ID.txt\nprintf 'start %s\\n' "$4" >> "$log"\nwhile :; do sleep 0.05; done\n`, { mode: 0o755 });
    const read = (pane: number): string[] => {
      const file = join(base, `launches-${String(pane)}.txt`);
      return existsSync(file) ? readFileSync(file, "utf8").split("\n").slice(0, -1) : [];
    };
    const launches = async (pane: number, count: number) => {
      const end = Date.now() + 5000;
      while (read(pane).length < count) {
        if (Date.now() > end) throw new Error(`pane ${String(pane)} wrote ${String(read(pane).length)} of ${String(count)} lines: ${read(pane).join(" | ")}`);
        await new Promise((r) => setTimeout(r, 20));
      }
      return read(pane);
    };
    return { shell, launches, pid: (pane) => Number(readFileSync(join(base, `pid-${String(pane)}.txt`), "utf8")), size: (pane) => readFileSync(join(base, `size-${String(pane)}.txt`), "utf8").trim() };
  }

  /** A daemon whose panes are launched as `launching` launches them, with the stand-in for the shell that stays, and a client of it. The command of a pane launched under the folder `unstartable` cannot be written, as where its settings file cannot be. */
  async function changing(made: { base: string; root: string }, options: Partial<DaemonOptions> = {}, unstartable?: string) {
    const runDir = join(made.base, "run");
    const script = join(made.base, "chain-stand-in.js");
    writeFileSync(script, "process.stdout.write(JSON.stringify(process.argv.slice(2)));\n");
    const bundleDir = join(made.base, "bundle");
    const hold = holdingShell(made.base);
    const settings = writeHookSettings(runDir);
    const chain = writePaneChain(runDir, { node: process.execPath, script, bundleDir });
    const launch = paneCommands({ SHELL: hold.shell }, settings, join(runDir, "hooks.sock"), carriedIn(chain));
    const { daemon: d, url } = await daemon({
      runDir,
      worktreesRoot: made.root,
      roleAdapter: fakeAdapter({ defaultLoginFolder: configOf(made) }),
      commandFor: (kind, id, start) => {
        if (unstartable !== undefined && start.accountDir === unstartable) throw new Error("the pane's settings file could not be written");
        return launch(kind, id, start);
      },
      pluginEnabled: (folder, checkout, configDir) => readPlugins(folder, checkout, configDir).agenticSeal.length > 0,
      ...options,
    });
    const c = await client(url);
    await c.message("ready");
    const answer = (requestId: number) => c.until(() => c.messages.find((m): m is Extract<ServerMessage, { type: "done" | "error" }> => (m.type === "done" || m.type === "error") && m.requestId === requestId));
    return { d, c, url, runDir, settings, answer, carried: `--plugin-dir '${bundleDir}' --append-system-prompt-file '${join(runDir, "pane-head.md")}'`, launches: hold.launches, pid: hold.pid, size: hold.size };
  }

  /** A config folder at `folder` whose `projects` is a link to `projects`, the conversations it then keeps. */
  function sharing(folder: string, projects: string): string {
    mkdirSync(folder, { recursive: true });
    symlinkSync(projects, join(folder, "projects"));
    return folder;
  }

  it("changes a running Claude Code pane's account: ends its process and waits for its exit, makes the new account's missing links, and starts the CLI on the pane's conversation under the new folder, with the owl chain's options and no --continue, in the same pane, which names the new account, shows nothing of the old process and reads its session log no more; a pane whose events carried no conversation's id starts anew (scenario 8)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "projects"), { recursive: true });
    writeFileSync(join(own, "CLAUDE.md"), "# mine\n");
    const handed = sharing(join(made.base, "Handed"), join(own, "projects"));
    // The made account's sign-in is a process that ends at once with a login no email names, and the folder handed over holds none.
    const logins: AccountLogins = { ...claudeLogins({ locate: () => Promise.reject(new Error("no CLI runs in a case")), envOf: () => ({}), ownFolder: () => own }), signIn: () => Promise.resolve({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }), status: (at) => Promise.resolve({ signedIn: at !== handed, loginEndsAt: null, name: null }) };
    const { d, c, url, runDir, settings, carried, launches, answer, size } = await changing(made, { roleAdapter: fakeAdapter({ defaultLoginFolder: own, logins }) });
    // The folder handed over takes its id once the agent has answered of it, so the made one is asked for after that answer.
    c.send({ type: "addAccount", requestId: 1, folder: handed });
    await answer(1);
    c.send({ type: "addAccount", requestId: 2, cols: 80, rows: 12 });
    await c.message("accounts", (m) => m.accounts.length === 3);
    const madeFolder = join(runDir, "accounts", "2");
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Moved", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "setRepository", requestId: 4, id: workItem.repoId, paneChain: "owlery" });
    await c.message("done", (m) => m.requestId === 4);
    const opened = async (requestId: number) => {
      c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId, workItemId: workItem.id, accountId: 1 });
      return (await c.message("started", (m) => m.requestId === requestId)).session;
    };
    const pane = await opened(5);
    const first = `start exec env CLAUDE_CONFIG_DIR='${handed}' claude --settings '${settings}' ${carried}`;
    expect(await launches(pane.id, 1)).toEqual([first]);
    // The pane works on a turn of a conversation, and its session log is read.
    const log = sessionLog(cleanups);
    writeFileSync(log, lines(0, SECOND_PROMPT));
    d.agentEvent(pane.id, "UserPromptSubmit", { session_id: CONVERSATION, transcript_path: log });
    await c.message("inbox", (m) => m.sessions.some((listed) => listed.id === pane.id && listed.state === "working"));
    rmSync(join(madeFolder, "CLAUDE.md"));
    expect(size(pane.id)).toBe("24 80");
    c.send({ type: "resize", id: pane.id, cols: 100, rows: 30 });
    const from = c.messages.length;
    c.send({ type: "changeAccount", requestId: 6, id: pane.id, accountId: 2 });
    expect(await answer(6)).toEqual({ type: "done", requestId: 6 });
    expect(await launches(pane.id, 3)).toEqual([first, "end", `start exec env CLAUDE_CONFIG_DIR='${madeFolder}' claude --settings '${settings}' ${carried} --resume '${CONVERSATION}'`]);
    expect(readlinkSync(join(madeFolder, "CLAUDE.md"))).toBe(join(own, "CLAUDE.md"));
    // The new process starts at the size the window last gave the pane.
    expect(size(pane.id)).toBe("30 100");
    const inbox = await c.until(() => c.messages.slice(from).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox" && m.sessions.some((listed) => listed.id === pane.id && listed.accountId === 2)));
    expect(inbox.sessions.find((listed) => listed.id === pane.id)).toEqual({ ...pane, accountId: 2, alive: true, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null });
    // The old process's session log is read no more: the interruption it gains now tells nobody, and the pane never ended for any client.
    appendFileSync(log, lines(SECOND_PROMPT, Infinity));
    await new Promise((r) => setTimeout(r, 400));
    expect(c.messages.slice(from).filter((m) => (m.type === "agent" || m.type === "exit") && m.id === pane.id)).toEqual([]);
    expect((await (await client(url)).message("ready")).sessions.find((listed) => listed.id === pane.id)?.state ?? null).toBeNull();
    // An id that is no conversation's is never put on the command line: that pane starts anew under the new account.
    const fresh = await opened(7);
    await launches(fresh.id, 1);
    d.agentEvent(fresh.id, "UserPromptSubmit", { session_id: "x'; rm -rf ~; '" });
    c.send({ type: "changeAccount", requestId: 8, id: fresh.id, accountId: 2 });
    expect(await answer(8)).toEqual({ type: "done", requestId: 8 });
    expect((await launches(fresh.id, 3))[2]).toBe(`start exec env CLAUDE_CONFIG_DIR='${madeFolder}' claude --settings '${settings}' ${carried}`);
  });

  it("starts a changed pane with the settings file a launch under the new account gives: the shared one where the new folder enables no AgenticSeal plugin, and the pane's own, holding the new folder's keys with the plugin's key false, where it does (scenario 8)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const projects = join(made.base, "projects");
    mkdirSync(projects);
    const withIt = handedWithPlugin(sharing(join(made.base, "With"), projects));
    const without = sharing(join(made.base, "Without"), projects);
    const { c, runDir, settings, carried, launches, answer } = await changing(made);
    c.send({ type: "addAccount", requestId: 1, folder: withIt });
    c.send({ type: "addAccount", requestId: 2, folder: without });
    await c.message("accounts", (m) => m.accounts.length === 3);
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Plugins follow", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "setRepository", requestId: 4, id: workItem.repoId, paneChain: "owlery" });
    await c.message("done", (m) => m.requestId === 4);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 5, workItemId: workItem.id, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 5)).session;
    const ownFile = join(runDir, `claude-pane-${String(pane.id)}.json`);
    expect((await launches(pane.id, 1))[0]).toBe(`start exec env CLAUDE_CONFIG_DIR='${withIt}' claude --settings '${ownFile}' ${carried}`);
    c.send({ type: "changeAccount", requestId: 6, id: pane.id, accountId: 2 });
    expect(await answer(6)).toEqual({ type: "done", requestId: 6 });
    expect((await launches(pane.id, 3))[2]).toBe(`start exec env CLAUDE_CONFIG_DIR='${without}' claude --settings '${settings}' ${carried}`);
    // The way back writes the pane's own file again, from the folder it then reads.
    rmSync(ownFile);
    c.send({ type: "changeAccount", requestId: 7, id: pane.id, accountId: 1 });
    expect(await answer(7)).toEqual({ type: "done", requestId: 7 });
    expect((await launches(pane.id, 5))[4]).toBe(`start exec env CLAUDE_CONFIG_DIR='${withIt}' claude --settings '${ownFile}' ${carried}`);
    expect(JSON.parse(readFileSync(ownFile, "utf8"))).toEqual({ ...hookSettings(), enabledPlugins: { [KEY]: false, "notes@handed": true } });
  });

  it("refuses with its reason, and ends nothing, a change of a shell, of a sign-in pane, of a working headless session, to an account whose folder keeps other conversations, to the account the pane runs under, to an account it does not keep, of a pane whose process ended, and a second change of a pane while the first waits (scenario 9)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "projects"), { recursive: true });
    const same = sharing(join(made.base, "Same"), join(own, "projects"));
    const other = join(made.base, "Other");
    mkdirSync(join(other, "projects"), { recursive: true });
    let release = (): void => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    cleanups.push(() => release());
    const logins: AccountLogins = { furnish: () => {}, signIn: () => Promise.resolve({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }), status: () => Promise.resolve({ signedIn: false, loginEndsAt: null, name: null }), signOut: () => Promise.resolve() };
    const { d, c, launches, answer, pid } = await changing(made, { roleAdapter: fakeAdapter({ defaultLoginFolder: own, logins, work: () => held }) });
    c.send({ type: "addAccount", requestId: 1, folder: same });
    c.send({ type: "addAccount", requestId: 2, folder: other });
    await c.message("accounts", (m) => m.accounts.length === 3);
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Refused", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session: shell } = await c.message("workItemCreated");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 4, workItemId: workItem.id, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 4)).session;
    await launches(pane.id, 1);
    const headless = await d.startRoleSession(workItem.id, "Hold", PROOFER);
    c.send({ type: "signIn", requestId: 6, id: 1, cols: 80, rows: 12 });
    const signIn = (await c.message("started", (m) => m.requestId === 6)).session;
    const refused = async (requestId: number, change: { id: number; accountId: number; headless?: true }) => {
      c.send({ type: "changeAccount", requestId, ...change });
      return ((await answer(requestId)) as { message?: string }).message;
    };
    expect(await refused(10, { id: shell.id, accountId: 1 })).toBe("A shell keeps the environment it started with, so its account is not changed. Open a new pane under the other account.");
    expect(await refused(11, { id: signIn.id, accountId: 2 })).toBe("A sign-in pane runs under the account it signs in.");
    expect(await refused(12, { id: headless.id, headless: true, accountId: 2 })).toBe("A headless session keeps the account it started under.");
    expect(await refused(13, { id: pane.id, accountId: 2 })).toBe(`"Same" and "Other" do not keep the same conversations, so the pane's conversation would not be found under "Other".`);
    expect(await refused(14, { id: pane.id, accountId: 1 })).toBe(`The pane runs under "Same" already.`);
    expect(await refused(15, { id: pane.id, accountId: 9 })).toBe("No account 9 is kept.");
    expect(await refused(16, { id: 99, accountId: 0 })).toBe("No pane 99 is open.");
    // Two folders that keep no conversations at all keep none in common either.
    for (const [requestId, name] of [[20, "Bare"], [21, "Bare too"]] as const) {
      mkdirSync(join(made.base, name));
      c.send({ type: "addAccount", requestId, folder: join(made.base, name) });
      await answer(requestId);
    }
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 22, workItemId: workItem.id, accountId: 3 });
    const bare = (await c.message("started", (m) => m.requestId === 22)).session;
    await launches(bare.id, 1);
    expect(await refused(23, { id: bare.id, accountId: 4 })).toBe(`"Bare" and "Bare too" do not keep the same conversations, so the pane's conversation would not be found under "Bare too".`);
    // Nothing was ended: the pane's process runs, the session works, and the shell and the sign-in pane stand.
    expect(await launches(pane.id, 1)).toHaveLength(1);
    const listed = await c.until(() => c.messages.findLast((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox"));
    expect([shell.id, signIn.id, pane.id].map((id) => listed.sessions.find((each) => each.id === id)?.alive)).toEqual([true, true, true]);
    expect(c.messages.findLast((m): m is Extract<ServerMessage, { type: "headless" }> => m.type === "headless" && m.headless.id === headless.id)?.headless.state ?? headless.state).toBe("working");
    // A pane closed while its process ends is not started again.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 24, workItemId: workItem.id, accountId: 1 });
    const closed = (await c.message("started", (m) => m.requestId === 24)).session;
    await launches(closed.id, 1);
    c.send({ type: "changeAccount", requestId: 25, id: closed.id, accountId: 0 });
    c.send({ type: "close", id: closed.id });
    expect(await answer(25)).toEqual({ type: "error", requestId: 25, message: "The pane was closed before its account changed." });
    await new Promise((r) => setTimeout(r, 300));
    expect(await launches(closed.id, 2)).toEqual([expect.stringMatching(/^start /), "end"]);
    // Two changes of one pane sent together: the second is refused, and one process at a time runs the pane.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 26, workItemId: workItem.id, accountId: 1 });
    const twice = (await c.message("started", (m) => m.requestId === 26)).session;
    await launches(twice.id, 1);
    c.send({ type: "changeAccount", requestId: 27, id: twice.id, accountId: 0 });
    c.send({ type: "changeAccount", requestId: 28, id: twice.id, accountId: 0 });
    expect(await answer(28)).toEqual({ type: "error", requestId: 28, message: "The pane's account is being changed already." });
    expect(await answer(27)).toEqual({ type: "done", requestId: 27 });
    await new Promise((r) => setTimeout(r, 300));
    expect((await launches(twice.id, 3)).filter((line) => line.startsWith("start "))).toHaveLength(2);
    // A pane whose process ended has nothing to move.
    process.kill(pid(pane.id), "SIGTERM");
    await c.message("exit", (m) => m.id === pane.id);
    expect(await refused(17, { id: pane.id, accountId: 0 })).toBe("The pane's process has ended, so it has nothing to move to another account.");
    release();
  });

  it("drops on a changed pane what the old process's events left, an interruption and a log that went unread, so the new process's events alone set its state and its log is said again where it is not read; and leaves a pane whose new process cannot start ended, saying why (scenario 8)", async () => {
    const said = logged();
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "projects"), { recursive: true });
    const same = sharing(join(made.base, "Same"), join(own, "projects"));
    const broken = sharing(join(made.base, "Broken"), join(own, "projects"));
    const { d, c, launches, answer } = await changing(made, { sessionLogWaitMs: 100 }, broken);
    c.send({ type: "addAccount", requestId: 1, folder: same });
    c.send({ type: "addAccount", requestId: 2, folder: broken });
    await c.message("accounts", (m) => m.accounts.length === 3);
    c.send({ type: "createWorkItem", requestId: 3, repo: made.repo, title: "Left behind", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 4, workItemId: workItem.id, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 4)).session;
    await launches(pane.id, 1);
    const unread = (path: string) => said.filter((line) => line.startsWith(`the session log of pane ${String(pane.id)} is not read`) && line.includes(path));
    // A log the old process named is never read, and its turn ends interrupted.
    const missing = sessionLog(cleanups);
    d.agentEvent(pane.id, "UserPromptSubmit", { transcript_path: missing });
    await c.until(() => (unread(missing).length === 1 ? true : undefined));
    await interruptToolCall(d, pane.id, sessionLog(cleanups));
    await c.message("inbox", (m) => m.sessions.some((listed) => listed.id === pane.id && listed.state === "waiting"));
    c.send({ type: "changeAccount", requestId: 5, id: pane.id, accountId: 0 });
    expect(await answer(5)).toEqual({ type: "done", requestId: 5 });
    // The new process's tool end leaves it working, as no interruption of its own began its state.
    const changed = c.messages.length;
    d.agentEvent(pane.id, "PostToolUse", { tool_name: "Bash" });
    const after = await c.until(() => c.messages.slice(changed).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox" && (m.sessions.find((listed) => listed.id === pane.id)?.state ?? null) !== null));
    expect(after.sessions.find((listed) => listed.id === pane.id)?.state).toBe("working");
    const again = sessionLog(cleanups);
    d.agentEvent(pane.id, "UserPromptSubmit", { transcript_path: again });
    await c.until(() => (unread(again).length === 1 ? true : undefined));
    // Under a folder whose launch cannot start, the pane stays, ended, and says why.
    const from = c.messages.length;
    c.send({ type: "changeAccount", requestId: 6, id: pane.id, accountId: 2 });
    expect(await answer(6)).toEqual({ type: "error", requestId: 6, message: "the pane's settings file could not be written" });
    const ended = await c.until(() => c.messages.slice(from).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox" && m.sessions.some((listed) => listed.id === pane.id && !listed.alive)));
    expect(ended.sessions.find((listed) => listed.id === pane.id)?.accountId).toBe(2);
    expect(c.messages.slice(from).some((m) => m.type === "output" && m.id === pane.id && m.data.includes(`[the pane could not start under "Broken": the pane's settings file could not be written]`))).toBe(true);
  });

  it("starts no process for a change whose account was removed, whose work item was archived or whose daemon closed while the old process ended: the pane ends as its process did, and one whose account went says why (scenario 9)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "projects"), { recursive: true });
    const same = sharing(join(made.base, "Same"), join(own, "projects"));
    const gone = sharing(join(made.base, "Gone"), join(own, "projects"));
    const { d, c, launches, answer } = await changing(made, { roleAdapter: fakeAdapter({ defaultLoginFolder: own }) });
    c.send({ type: "addAccount", requestId: 1, folder: same });
    c.send({ type: "addAccount", requestId: 2, folder: gone });
    await c.message("accounts", (m) => m.accounts.length === 3);
    const item = async (requestId: number, title: string) => {
      c.send({ type: "createWorkItem", requestId, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 });
      return c.message("workItemCreated", (m) => m.workItem.title === title);
    };
    const opened = async (requestId: number, workItemId: number) => {
      c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId, workItemId, accountId: 1 });
      const pane = (await c.message("started", (m) => m.requestId === requestId)).session;
      await launches(pane.id, 1);
      return pane;
    };
    const ended = [expect.stringMatching(/^start /), "end"];
    // The account the pane changes to is removed while the old process ends: the pane stays ended under its own account and says why.
    const { workItem: kept } = await item(3, "Kept");
    const lost = await opened(4, kept.id);
    const from = c.messages.length;
    c.send({ type: "changeAccount", requestId: 5, id: lost.id, accountId: 2 });
    c.send({ type: "removeAccount", requestId: 6, id: 2 });
    expect(await answer(6)).toEqual({ type: "done", requestId: 6 });
    expect(await answer(5)).toEqual({ type: "error", requestId: 5, message: "No account 2 is kept." });
    const listed = await c.until(() => c.messages.slice(from).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox" && m.sessions.some((each) => each.id === lost.id && !each.alive)));
    expect(listed.sessions.find((each) => each.id === lost.id)?.accountId).toBe(1);
    expect(c.messages.slice(from).some((m) => m.type === "output" && m.id === lost.id && m.data.includes("[the pane could not start: no account 2 is kept]"))).toBe(true);
    // The work item is archived while the old process ends.
    const { workItem: archived, session: shell } = await item(7, "Archived");
    const pane = await opened(8, archived.id);
    c.send({ type: "changeAccount", requestId: 9, id: pane.id, accountId: 0 });
    c.send({ type: "archiveWorkItem", requestId: 10, id: archived.id, running: { panes: [shell.id, pane.id], headless: [] } });
    expect(await answer(9)).toEqual({ type: "error", requestId: 9, message: "The pane was closed before its account changed." });
    expect(await answer(10)).toEqual({ type: "done", requestId: 10 });
    await c.message("exit", (m) => m.id === pane.id);
    // The daemon closes while the old process ends.
    const last = await opened(11, kept.id);
    c.send({ type: "changeAccount", requestId: 12, id: last.id, accountId: 0 });
    await new Promise((r) => setTimeout(r, 50));
    await d.close();
    await new Promise((r) => setTimeout(r, 400));
    expect([await launches(lost.id, 2), await launches(pane.id, 2), await launches(last.id, 2)]).toEqual([ended, ended, ended]);
  });

  it("refuses a change whose pane's process has not ended within the wait, and the pane then ends when its process exits, as any end of it does (scenario 9)", async () => {
    const made = repositoryWith(".github/workflows/owlery-seal.yml");
    const own = configOf(made);
    mkdirSync(join(own, "projects"), { recursive: true });
    const same = sharing(join(made.base, "Same"), join(own, "projects"));
    const { c, launches, answer } = await changing(made, { roleAdapter: fakeAdapter({ defaultLoginFolder: own }), endWaitMs: 50 });
    c.send({ type: "addAccount", requestId: 1, folder: same });
    await c.message("accounts", (m) => m.accounts.length === 2);
    c.send({ type: "createWorkItem", requestId: 2, repo: made.repo, title: "Slow", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 3, workItemId: workItem.id, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 3)).session;
    await launches(pane.id, 1);
    // The stand-in takes 200 ms to answer its hangup, four times the wait.
    c.send({ type: "changeAccount", requestId: 4, id: pane.id, accountId: 0 });
    expect(await answer(4)).toEqual({ type: "error", requestId: 4, message: "The pane's process did not end in time, so its account was not changed. The pane ends once its process exits." });
    await c.message("exit", (m) => m.id === pane.id);
    await new Promise((r) => setTimeout(r, 300));
    expect(await launches(pane.id, 2)).toEqual([expect.stringMatching(/^start /), "end"]);
  });
});
