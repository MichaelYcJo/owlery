import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { type FakeAsk, fakeAdapter } from "../src/daemon/adapters/fake";
import { agentEventFor } from "../src/daemon/agent-events";
import { OutputBuffer } from "../src/daemon/buffer";
import { Daemon, type DaemonOptions, HEADLESS_KEPT, HEADLESS_LIMIT_MS } from "../src/daemon/daemon";
import { buildOf, readDiscovery, writeDiscovery } from "../src/daemon/discovery";
import type { HoldAwake } from "../src/daemon/keep-awake";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { type DecisionRecord, RECORD_FILE, readDecisionRecord, withApplied, withCarried, withDecision, withReversal } from "../src/daemon/decision-record";
import { MARKER, SUBJECT, workflowText } from "../src/daemon/records-place";
import { readSetup } from "../src/daemon/worktree-setup";
import { createWorktree, readLoss } from "../src/daemon/worktrees";
import { generateName } from "../src/shared/names";
import { type HeadlessInfo, type KeepAwake, type PermissionAsk, ROLE_STAGES, type RoleStage, type ServerMessage, type Usage, type WorkItem, type WorkItemLoss } from "../src/shared/protocol";
import { commitFile, git, runs, temporaryClone, temporaryRepository, unansweringOrigin } from "./repositories";

const TOKEN = "t".repeat(64);
/** A session whose agent has sent no event and whose silent start is not over, whose session just started, or whose kind reports no state. */
const NO_STATE = { state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null };
/** What a branch just cut holds since its base. */
const NOTHING_NEW = { aheadOfBase: 0, behindBase: 0, newCommits: 0, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } };
const SESSION_FIELDS = ["alive", "id", "kind", "state", "stateQuestions", "stateSince", "stateText", "stateTool", "workItemId"];
const WORK_ITEM_FIELDS = ["aheadOfBase", "archivedAt", "baseBranch", "baseCommit", "behindBase", "branch", "chain", "changes", "commits", "createdAt", "decisions", "groupId", "id", "muted", "newCommits", "permissions", "pinned", "questions", "recorded", "repo", "repoId", "repoName", "setup", "title", "unread", "worktree"];
const SETUP_FIELDS = ["command", "copied", "copiedCount", "endedAt", "exitCode", "failedCopies", "failure", "paneId", "startedAt", "state"];
/** What a work item holds of the fields set after its creation, by a person, by its setup or by its chain, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null };
/** What a work item holds of its record of decisions and questions where its worktree holds none. */
const NO_RECORD = { decisions: [], questions: [], unread: [] };
/** What a work item holds of its records of the chain where its worktree holds none of them. */
const NOTHING_RECORDED = { framed: false, rounds: 0, gate: null, verdict: null };
/** What a repository holds of the fields a person sets, before any is set. */
/** What a repository holds of the records place where its checkout holds none. */
const NO_RECORDS = { root: null, check: null, broadGate: null };
const PLAIN = { customName: null, icon: null, defaultBase: null, hidden: false, groups: [], records: NO_RECORDS };
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
 * notes its first argument, waits `seconds`, and runs the real one. The cases'
 * own git goes through it too, until `stop`.
 */
function watchedGit(base: string, seconds = 0): { calls: (command: string) => number; stop: () => void } {
  const bin = join(base, "bin");
  const noted = join(base, "git-calls.txt");
  const path = process.env.PATH ?? "";
  mkdirSync(bin);
  writeFileSync(join(bin, "git"), `#!/bin/sh\necho "$1" >> '${noted}'\nsleep ${seconds}\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
  process.env.PATH = `${bin}:${path}`;
  const stop = (): void => {
    process.env.PATH = path;
  };
  cleanups.push(stop);
  return {
    calls: (command) => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line === command).length : 0),
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

/** A run folder that lists one work item, made before the daemon that reads it, whose branch holds one new commit. */
async function runFolderWithWorkItem(made: { repo: string; root: string; base: string }, title: string) {
  const runDir = join(made.base, "run");
  mkdirSync(runDir);
  const place = await createWorktree({ folder: made.repo, title, root: made.root });
  git(place.worktree, "commit", "--quiet", "--allow-empty", "-m", "one");
  const workItem = { id: 1, title, createdAt: 1, ...place };
  writeFileSync(join(runDir, "work-items.json"), JSON.stringify([workItem]));
  return { runDir, workItem };
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
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: 1, ...NO_STATE }]);
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
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "shell", alive: false, workItemId: 1, ...NO_STATE }]);
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

  it("creates a work item and opens a pane whose process runs in its worktree", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ commandFor: printsItsFolder, worktreesRoot: root, now: () => 1234 });
    const c = await client(url);
    expect((await c.message("ready")).workItems).toEqual([]);
    c.send({ type: "createWorkItem", requestId: 3, repo, title: "Fix the login bug", kind: "claude", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated", (m) => m.requestId === 3);
    const worktree = join(root, "project", "fix-the-login-bug");
    const baseCommit = git(repo, "rev-parse", "HEAD").trim();
    // The repository's HEAD is on `main`, and its folder is named `project`.
    expect(created.workItem).toEqual({ id: 1, title: "Fix the login bug", repoId: 1, repo, repoName: "project", ...UNSET, ...NO_RECORD, recorded: NOTHING_RECORDED, branch: "owlery/fix-the-login-bug", worktree, createdAt: 1234, baseCommit, baseBranch: "main", ...NOTHING_NEW, permissions: [] });
    expect(created.session).toEqual({ id: created.session.id, kind: "claude", alive: true, workItemId: 1, ...NO_STATE });
    expect(git(repo, "worktree", "list", "--porcelain")).toContain(`worktree ${worktree}\n`);
    expect(git(worktree, "branch", "--show-current").trim()).toBe("owlery/fix-the-login-bug");
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
    // Two decisions, one of them reversed, a park with a question that names options, and a block the reader refuses, so that the lists carry a decision, a question, an option and an unread line.
    const directory = withDirectory(created.workItem);
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
    expect(Object.keys(ready).sort()).toEqual(["agentNotice", "archived", "headless", "lastLook", "paneKinds", "repositories", "sessions", "type", "workItems"]);
    expect(Object.keys(ready.repositories[0]!).sort()).toEqual(["customName", "defaultBase", "folder", "groups", "hidden", "icon", "id", "name", "records"]);
    expect(Object.keys(ready.repositories[0]!.records).sort()).toEqual(["broadGate", "check", "root"]);
    expect(Object.keys(ready.lastLook!).sort()).toEqual(["at", "sessions", "workItems"]);
    expect(Object.keys(ready.paneKinds[0]!).sort()).toEqual(["continues", "kind", "label", "reportsState"]);
    expect(Object.keys(inbox).sort()).toEqual(["archived", "repositories", "sessions", "type", "workItems"]);
    for (const lists of [inbox, ready, ready.lastLook!]) {
      expect(Object.keys(lists.sessions[0]!).sort()).toEqual(SESSION_FIELDS);
      const workItem = lists.workItems[0]!;
      // The look keeps nothing of what the records say of the chain.
      expect(Object.keys(workItem).sort()).toEqual(lists === ready.lastLook ? WORK_ITEM_FIELDS.filter((key) => key !== "recorded") : WORK_ITEM_FIELDS);
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

  it("gives a second work item of the same title a branch and a folder ending in -2, though both are asked at once", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Fix the login bug", kind: "shell", cols: 80, rows: 24 });
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Fix the login bug", kind: "shell", cols: 80, rows: 24 });
    const first = await c.message("workItemCreated", (m) => m.requestId === 1);
    const second = await c.message("workItemCreated", (m) => m.requestId === 2);
    expect(first.workItem).toMatchObject({ id: 1, branch: "owlery/fix-the-login-bug", worktree: join(root, "project", "fix-the-login-bug") });
    expect(second.workItem).toMatchObject({ id: 2, branch: "owlery/fix-the-login-bug-2", worktree: join(root, "project", "fix-the-login-bug-2") });
  });

  it("names a work item nobody named with one generated name, as its title, its branch and its folder, and stores a typed title without the white space at its ends", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, random: () => 0.5 });
    const name = generateName(() => 0.5);
    const c = await client(url);
    await c.message("ready");
    const create = async (requestId: number, fields: object) => {
      c.send({ type: "createWorkItem", requestId, repo, kind: "shell", cols: 80, rows: 24, ...fields });
      return (await c.message("workItemCreated", (m) => m.requestId === requestId)).workItem;
    };
    expect(await create(1, { title: "" })).toMatchObject({ title: name, branch: `owlery/${name}`, worktree: join(root, "project", name) });
    expect(git(repo, "for-each-ref", "--format=%(refname)", "refs/heads/owlery").trim()).toBe(`refs/heads/owlery/${name}`);
    expect(git(repo, "worktree", "list", "--porcelain")).toContain(`worktree ${join(root, "project", name)}\n`);
    // The same draw again: the title carries the number the branch and the folder got.
    expect(await create(2, { title: " \t" })).toMatchObject({ title: `${name}-2`, branch: `owlery/${name}-2`, worktree: join(root, "project", `${name}-2`) });
    // A title that leaves no slug is the work item's title as typed, and the name sent names its branch.
    expect(await create(3, { title: " 로그인 버그 ", name: "amber-heron" })).toMatchObject({ title: "로그인 버그", branch: "owlery/amber-heron" });
    expect(await create(4, { title: " Fix the login bug ", name: "amber-heron" })).toMatchObject({ title: "Fix the login bug", branch: "owlery/fix-the-login-bug" });
    // An empty title with a name sent is called by that name.
    expect(await create(5, { title: "", name: "quiet-otter" })).toMatchObject({ title: "quiet-otter", branch: "owlery/quiet-otter" });
  });

  it("cuts a work item at the base its creation names: a local branch, a remote's branch no local branch bears, and the local branch where both bear the name, each without an upstream", async () => {
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
    git(repo, "config", "branch.autoSetupMerge", "always");
    const first = git(repo, "rev-parse", "refs/remotes/origin/shadow").trim();
    expect(new Set([first, feature, remoteOnly]).size).toBe(3);
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    const create = async (requestId: number, base: string) => {
      c.send({ type: "createWorkItem", requestId, repo, title: `From ${requestId}`, base, kind: "shell", cols: 80, rows: 24 });
      const { workItem } = await c.message("workItemCreated", (m) => m.requestId === requestId);
      expect(git(repo, "for-each-ref", "--format=%(upstream)", `refs/heads/${workItem.branch}`).trim()).toBe("");
      expect(git(repo, "rev-parse", `refs/heads/${workItem.branch}`).trim()).toBe(workItem.baseCommit);
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
    // A work item's own branch is a local branch, and a base as any other.
    const planned = await plan(2, { title: "Fix the login bug" });
    expect(planned).toEqual({ type: "workItemPlan", requestId: 2, branch: "owlery/fix-the-login-bug-2", worktree: join(root, "project", "fix-the-login-bug-2"), localBases: ["main", "owlery/fix-the-login-bug"], remoteBases: [], defaultBase: "main", setupCommand: null, includes: false });
    expect(Object.keys(planned).sort()).toEqual(["branch", "defaultBase", "includes", "localBases", "remoteBases", "requestId", "setupCommand", "type", "worktree"]);
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
    expect(session).toEqual({ id: session.id, kind: "shell", alive: true, workItemId: workItem.id, ...NO_STATE });
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
      ["shell", first.id, { continueLatest: false }],
      ["claude", session.id, { continueLatest: true }],
    ]);
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, ...NO_STATE });
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(`cwd=${workItem.worktree}\r`)) ? true : undefined));
    // A continued session is listed and told as any pane of its kind is.
    d.agentEvent(session.id, "UserPromptSubmit", {});
    await c.message("inbox", (m) => m.sessions.find((s) => s.id === session.id)?.state === "working");
  });

  it("asks the command of a pane to continue nothing where the start does not ask it", async () => {
    const asked: unknown[][] = [];
    const { url } = await daemonWithWorkItem({
      commandFor: (...given) => {
        asked.push(given);
        return printsItsFolder();
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(asked).toEqual([["claude", session.id, { continueLatest: false }]]);
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
      { id: 4, folder: "/r/docs", name: "docs", customName: null, icon: "D", defaultBase: "origin/main", hidden: true, groups: [{ id: 3, name: "Later" }], records: NO_RECORDS },
    ]);
    expect(ready.workItems.map((w) => [w.id, w.repoId, w.repo, w.repoName, w.pinned, w.muted, w.groupId, w.archivedAt])).toEqual([
      [1, 1, "/r/project", "The project", false, false, null, null],
      [3, 4, "/r/docs", "docs", true, true, 3, null],
    ]);
    expect(ready.archived.map((w) => [w.id, w.repoId, w.repo, w.repoName, w.archivedAt])).toEqual([[2, 1, "/r/project", "The project", 50]]);
    expect(Object.keys(ready.archived[0]!).sort()).toEqual(WORK_ITEM_FIELDS);
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
    const { url } = await daemon({ worktreesRoot: root, roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("exit");
    c.send({ type: "ask", requestId: 20, workItemId: workItem.id, prompt: "Quick?" });
    await c.message("headless", (m) => m.headless.state === "finished");
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 2);
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
    const { url } = await daemon({ worktreesRoot: root, roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await c.message("exit");
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked");
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
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Nothing to lose", kind: "shell", cols: 80, rows: 24 });
    const clean = await c.message("workItemCreated", (m) => m.requestId === 1);
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "Holds a file", kind: "shell", cols: 80, rows: 24 });
    const held = await c.message("workItemCreated", (m) => m.requestId === 2);
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
    expect(inbox.repositories[0]?.records).toEqual({ root: "seal", check: WORKFLOW, broadGate: "pnpm test" });
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
    expect((await c.message("inbox")).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: null });
    writeFileSync(join(made.repo, "seal", "config.json"), JSON.stringify({ "Broad gate": "make check" }));
    expect((await c.message("inbox", (m) => m.repositories[0]?.records.broadGate !== null)).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: "make check" });
    // A client that connects later is told the same in its `ready`.
    expect((await (await client(url)).message("ready")).repositories[0]?.records).toEqual({ root: "seal", check: null, broadGate: "make check" });
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
    expect((await c.message("inbox")).repositories[0]?.records).toEqual({ root: "agentic-seal", check: null, broadGate: null });
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

  /** A daemon on a run folder of the repository's temporary folder, a client of it, and a work item the client created. */
  async function withWorkItem(made: { repo: string; root: string; base: string }, options: Partial<DaemonOptions> = {}) {
    const title = "First name";
    const runDir = join(made.base, "run");
    mkdirSync(runDir, { recursive: true });
    const { url } = await daemon({ runDir, worktreesRoot: made.root, commandFor: silent, ...options });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 100, repo: made.repo, title, kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated", (m) => m.requestId === 100);
    await c.message("inbox", (m) => m.workItems.length === 1);
    c.messages.length = 0;
    return { c, url, runDir, workItem, session };
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
    git(made.repo, "push", "--quiet", "origin", workItem.branch);
    c.send({ type: "renameWorkItem", requestId: 1, id: workItem.id, title: "Second name", branch: true });
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: "The remote origin holds a branch owlery/first-name, so the branch keeps its name." });
    git(made.repo, "branch", "--quiet", `--set-upstream-to=origin/${workItem.branch}`, workItem.branch);
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
    git(made.repo, "push", "--quiet", "origin", workItem.branch);
    c.send({ type: "planRename", requestId: 4, id: workItem.id, title: "Second name" });
    expect(await c.message("renamePlan", (m) => m.requestId === 4)).toEqual({ type: "renamePlan", requestId: 4, branch: "owlery/second-name-2", blocked: "The remote origin holds a branch owlery/first-name, so the branch keeps its name." });
    c.send({ type: "planRename", requestId: 5, id: 9, title: "Second name" });
    expect(await c.message("error", (m) => m.requestId === 5)).toEqual({ type: "error", requestId: 5, message: "no work item 9" });
    c.send({ type: "planRename", requestId: 6, id: workItem.id, title: 7 });
    expect((await c.message("error", (m) => m.requestId === 6)).message).toBe("a rename's plan needs the work item's new name");
    expect(c.messages.map((m) => m.type)).toEqual(["renamePlan", "renamePlan", "renamePlan", "renamePlan", "error", "error"]);
    expect((await (await client(url)).message("ready")).workItems).toMatchObject([{ title: "First name", branch: "owlery/first-name" }]);
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
    git(made.repo, "branch", "-M", workItem.branch, "owlery/elsewhere");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(c.messages).toEqual([{ type: "done", requestId: 2 }]);
    c.messages.length = 0;
    git(made.repo, "branch", "-M", "owlery/elsewhere", workItem.branch);
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
    const made = repository();
    const { c, workItem } = await withWorkItem(made);
    const held = heldGit(made.base);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Taken name", kind: "shell", cols: 80, rows: 24 });
    c.send({ type: "renameWorkItem", requestId: 2, id: workItem.id, title: "Taken name", branch: true });
    // The creation chose its branch and waits in `git worktree add`. A plan is a read, and does not wait behind it.
    c.send({ type: "planRename", requestId: 3, id: workItem.id, title: "Meanwhile" });
    await c.message("renamePlan", (m) => m.requestId === 3);
    expect(c.messages.map((m) => m.type)).toEqual(["renamePlan"]);
    held.release();
    expect((await c.message("workItemCreated", (m) => m.requestId === 1)).workItem.branch).toBe("owlery/taken-name");
    await c.message("done", (m) => m.requestId === 2);
    expect((await c.message("inbox", (m) => m.workItems.some((w) => w.id === workItem.id && w.title === "Taken name"))).workItems.map((w) => w.branch).sort()).toEqual(["owlery/taken-name", "owlery/taken-name-2"]);
    expect(git(made.repo, "branch", "--list", "owlery/*").trim().split("\n").map((line) => line.trim())).toEqual(["+ owlery/taken-name", "+ owlery/taken-name-2"]);
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
    const { c, url, runDir, workItem, session } = await withWorkItem(made, { now: () => 77, commandFor: () => ({ command: "/bin/sh", args: ["-c", "echo printed before the archive; sleep 30"], env: {} }) });
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
    c.send({ type: "ask", requestId: 4, workItemId: workItem.id, prompt: "Which file?" });
    expect(await c.message("error", (m) => m.requestId === 4)).toEqual({ type: "error", requestId: 4, message: ARCHIVED });
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
    const { c, url, workItem } = await withWorkItem(made, { roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Quick?" });
    const finished = (await c.message("headless", (m) => m.headless.state === "finished")).headless;
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 2);
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
    const { c, url, runDir, workItem, session } = await withWorkItem(made, { roleAdapter: fakeAdapter() });
    writeFileSync(join(workItem.worktree, ".gitignore"), ".env\n");
    git(workItem.worktree, "add", ".gitignore");
    git(workItem.worktree, "commit", "--quiet", "-m", "ignore the environment");
    git(made.repo, "branch", "keeps", workItem.branch);
    writeFileSync(join(workItem.worktree, ".env"), "SECRET=1\n");
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Quick?" });
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
    const { c, url, workItem, session } = await withWorkItem(made, { roleAdapter: slow, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap 'echo late > late.txt; exit 0' HUP; echo ready; sleep 30 & wait"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("ready")) ? true : undefined));
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 1);
    const loss = await lossOf(c, workItem.id);
    expect([loss.untrackedCount, loss.commitCount]).toEqual([0, 0]);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [session.id], headless: [headless.id] } });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: CHANGED });
    expect([readFileSync(join(workItem.worktree, "late.txt"), "utf8"), git(made.repo, "branch", "--list", workItem.branch).trim()]).toEqual(["late\n", `+ ${workItem.branch}`]);
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
    const { c, url, workItem } = await withWorkItem(made, { roleAdapter, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 1);
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
    const { c, url, workItem } = await withWorkItem(made, { roleAdapter, endWaitMs: 300, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    await allExited(url);
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 1);
    const loss = await lossOf(c, workItem.id);
    c.send({ type: "deleteWorkItem", requestId: 2, id: workItem.id, stamp: loss.stamp, force: false, running: { panes: [], headless: [headless.id] } });
    await c.message("done", (m) => m.requestId === 2);
    expect(existsSync(workItem.worktree)).toBe(false);
  });

  it("refuses a delete where a pane's process has not exited within the wait, and removes nothing; starts no pane and no headless session in the work item, and archives it at no request, while the delete is under way; and starts one again after", async () => {
    const made = repository();
    // The pane's process ignores the signal that ends it, says so, and exits by itself after a moment.
    const { c, url, workItem, session } = await withWorkItem(made, { endWaitMs: 400, commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; echo deaf; sleep 1.5"], env: {} }) });
    c.send({ type: "attach", id: session.id });
    await c.until(() => (c.messages.some((m) => (m.type === "output" || m.type === "replay") && m.id === session.id && m.data.includes("deaf")) ? true : undefined));
    const loss = await lossOf(c, workItem.id);
    const told = { panes: [session.id], headless: [] };
    c.send({ type: "deleteWorkItem", requestId: 1, id: workItem.id, stamp: loss.stamp, force: false, running: told });
    // The requests arrive once the delete waits: messages sent together are read in one turn, before the delete's first read.
    await new Promise((r) => setTimeout(r, 150));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 1)).toBe(false);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 2, workItemId: workItem.id });
    c.send({ type: "ask", requestId: 3, workItemId: workItem.id, prompt: "Which file?" });
    c.send({ type: "archiveWorkItem", requestId: 4, id: workItem.id, running: told });
    const answer = (requestId: number) => c.until(() => c.messages.find((m) => (m.type === "started" || m.type === "asked" || m.type === "done" || m.type === "error") && m.requestId === requestId));
    const DELETING = `work item ${workItem.id} is being deleted`;
    expect([await answer(2), await answer(3), await answer(4)]).toEqual([2, 3, 4].map((requestId) => ({ type: "error", requestId, message: DELETING })));
    expect(await answer(1)).toEqual({ type: "error", requestId: 1, message: "A session did not end in time, so nothing was deleted. Try again." });
    const still = await (await client(url)).message("ready");
    expect([still.workItems.map((w) => w.id), still.archived, existsSync(join(workItem.worktree, "README.md")), git(made.repo, "branch", "--list", workItem.branch).trim()]).toEqual([[workItem.id], [], true, `+ ${workItem.branch}`]);
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
    expect([inbox.archived.map((w) => w.id), existsSync(join(workItem.worktree, "README.md")), git(made.repo, "branch", "--list", workItem.branch).trim()]).toEqual([[workItem.id], true, `+ ${workItem.branch}`]);
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
    expect([still.workItems.map((w) => w.id), readFileSync(join(workItem.worktree, "arrived.txt"), "utf8"), git(made.repo, "branch", "--list", workItem.branch).trim()]).toEqual([[workItem.id], "after the last read\n", `+ ${workItem.branch}`]);
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

  it("runs a delete after a creation that is under way, so the two never take and give up one branch at once", async () => {
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
    expect(git(made.repo, "branch", "--list", "owlery/*").trim()).toBe("+ owlery/under-way");
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
    expect(last.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "finished", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null }]);
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
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: 1, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null }]);
  });

  it("carries with a session's state the time it began, and the tool or the text the event that began it carried, until the state changes", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemonWithWorkItem({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1, workItemId: 1 });
    const { session } = await c.message("started");
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: 1, ...NO_STATE });
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
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: 1, ...NO_STATE });
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
    const ended = { id: session.id, kind: "claude", alive: false, workItemId: 1, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null, stateQuestions: null };
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

  it("shows a commit made in a work item's worktree as one new commit, with its hash, its subject, its time, its lines and the file it changed, and no agent state for its shell pane", async () => {
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
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    expect(inbox.workItems).toEqual([{ ...workItem, aheadOfBase: 1, newCommits: 1, commits: [one], changes: { files: 1, added: 1, removed: 0, list: [{ path: "one.txt", added: 1, removed: 0 }] } }]);
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
    const { workItem } = await c.message("workItemCreated");
    const watched = watchedGit(base);
    /** Waits until the daemon has read the counts three more times. A read runs `rev-list` twice: for the commits since the cut, and for the commits ahead of the base branch and behind it. */
    const threeReads = async (): Promise<void> => {
      const reads = watched.calls("rev-list");
      await c.until(() => (watched.calls("rev-list") >= reads + 6 ? true : undefined));
    };
    // The branch was just cut, and its head is where the creation left it.
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
    // One for the creation, one for the commit and one for the amended one.
    expect(inboxes(c).map((m) => m.workItems[0]?.commits?.[0]?.subject)).toEqual([undefined, "add one.txt", "add one, said better"]);
  });

  it("tells every client how far a work item's branch is ahead of its base branch and how far behind it: behind by a commit the base gained while the branch's head stayed, not ahead by the commits the base gained and the branch merged in, and by none either way once the base holds the branch", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect([workItem.baseBranch, workItem.aheadOfBase, workItem.behindBase]).toEqual(["main", 0, 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.aheadOfBase, m.workItems[0]?.behindBase, m.workItems[0]?.newCommits];
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m).join() === "1,0,1");
    const head = git(workItem.worktree, "rev-parse", "HEAD").trim();
    commit(repo, "on-main.txt");
    // The branch's head and its counts since the cut stay, and the inbox is for the base that moved.
    const behind = await c.message("inbox", (m) => counts(m).join() === "1,1,1");
    expect(git(workItem.worktree, "rev-parse", "HEAD").trim()).toBe(head);
    expect(behind.workItems[0]?.commits?.map((each) => each.subject)).toEqual(["add own.txt"]);
    git(workItem.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    // Three commits since the cut: the branch's own, the base's and the merge. The base holds its own.
    await c.message("inbox", (m) => counts(m).join() === "2,0,3");
    git(repo, "merge", "--quiet", "--ff-only", workItem.branch);
    // The branch's head and its count stay, and the inbox is for the base that moved.
    await c.message("inbox", (m) => counts(m).join() === "0,0,3");
  });

  it("tells every client how far a work item's branch is ahead of a remote's branch: by its own commit, by none once a fetch brought that commit to the remote's branch, and by no count once a fetch pruned it", async () => {
    const { repo, origin, root } = clone();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead of the remote", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect([workItem.baseBranch, workItem.aheadOfBase, workItem.behindBase]).toEqual(["origin/main", 0, 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.baseBranch, m.workItems[0]?.aheadOfBase, m.workItems[0]?.behindBase, m.workItems[0]?.newCommits].join();
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m) === "origin/main,1,0,1");
    git(origin, "pull", "--quiet", "--ff-only", repo, workItem.branch);
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
    const { workItem } = await c.message("workItemCreated");
    commit(workItem.worktree, "one.txt");
    await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 1);
    git(repo, "worktree", "remove", "--force", workItem.worktree);
    git(repo, "branch", "--quiet", "-D", workItem.branch);
    const gone = await c.message("inbox", (m) => m.workItems[0]?.newCommits === null);
    expect(gone.workItems).toEqual([{ ...workItem, aheadOfBase: null, behindBase: null, newCommits: null, commits: null, changes: null }]);
  });

  it("sends no inbox while the counts stay as they were", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Quiet", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    await pause(200);
    commit(workItem.worktree, "one.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    // One for the creation and one for the commit, over ten intervals and more.
    expect(inboxes(c).map((m) => m.workItems[0]?.newCommits)).toEqual([0, 1]);
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
    const { workItem } = await first.message("workItemCreated");
    commit(workItem.worktree, "one.txt");
    await pause(300);
    // The creation's inbox alone: the interval is not over, so nothing read the commit.
    expect(inboxes(first).map((m) => m.workItems[0]?.newCommits)).toEqual([0]);
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

  it("gives a work item from before the base commit was recorded no count, beside one that has it", async () => {
    const { repo, root, base } = repository();
    const runDir = join(base, "run");
    mkdirSync(runDir);
    const before = await createWorktree({ folder: repo, title: "Before", root });
    const after = await createWorktree({ folder: repo, title: "After", root });
    commit(before.worktree, "before.txt");
    commit(after.worktree, "after.txt");
    const { baseCommit: _none, ...old } = before;
    writeFileSync(join(runDir, "work-items.json"), JSON.stringify([{ id: 1, title: "Before", createdAt: 1, ...old }, { id: 2, title: "After", createdAt: 2, ...after }]));
    const { url } = await daemon({ runDir, worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    expect((await c.message("ready")).workItems.map((w) => [w.baseCommit, w.newCommits, w.commits?.length ?? null, w.changes?.files ?? null])).toEqual([[null, null, null, null], [after.baseCommit, 1, 1, 1]]);
    commit(after.worktree, "again.txt");
    const inbox = await c.message("inbox", (m) => m.workItems[1]?.newCommits === 2);
    expect(inbox.workItems[0]).toMatchObject({ id: 1, baseCommit: null, newCommits: null, commits: null, changes: null });
  });
});

// A pane that prints nothing, so a client's messages are the daemon's answers and its lists alone.
const silent = () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} });

/** A daemon on a run folder of a temporary repository, a client of it, and a work item the client created under each title, each with the shell pane its creation opened. */
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
    created.push(await c.message("workItemCreated", (m) => m.requestId === 100 + index));
  }
  await c.message("inbox", (m) => m.workItems.length === titles.length);
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
function withDirectory(workItem: { worktree: string; branch: string }, name = "1-item"): string {
  const directory = join(workItem.worktree, "seal", "threads", name);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(workItem.worktree, "seal", "README.md"), `${MARKER}\n`);
  writeFileSync(join(directory, "routing.md"), `| Axis | Answer |\n|---|---|\n| Review | through the review chain |\n| Destination | open the pull request |\n| Branch | ${workItem.branch} |\n`);
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
    c.send({ type: "ask", requestId: 1, workItemId: b.id, prompt: "Still there?" });
    const { headless } = await c.message("asked");
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
    // A record whose first block has the id and the state of the stray entry: its time is this daemon's, not the entry's.
    const directory = withDirectory(next);
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

  it("parks one work item with its questions as open blocks and tells every client, and holds nothing else: the other work item holds none and its headless session finishes, a pane starts in each of the two, an `ask` in the parked one is taken, a third work item is created, and a second park of the parked one adds its question", async () => {
    const { d, url, c, made, workItems, sessions } = await withWorkItems(["Parked", "Goes on"], { now: () => 1234, roleAdapter: fakeAdapter({ delayMs: 150 }) });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    const other = await client(url);
    await other.message("ready");
    c.send({ type: "ask", requestId: 1, workItemId: b.id, prompt: "Still there?" });
    const { headless } = await c.message("asked");
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
    c.send({ type: "ask", requestId: 4, workItemId: a.id, prompt: "And in the parked one?" });
    expect((await c.message("asked", (m) => m.requestId === 4)).headless).toMatchObject({ workItemId: a.id, state: "working" });
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
    const { c, workItems } = await withWorkItems(["First name"], { roleAdapter: fakeAdapter({ delayMs: 250 }) });
    const a = workItems[0]!;
    const directory = withDirectory(a, "1795388700-renamed");
    git(a.worktree, "add", "--all");
    git(a.worktree, "commit", "--quiet", "-m", "chore: add the records and declare the routing");
    const stood = readFileSync(join(directory, "routing.md"), "utf8");
    const chainOf = (): WorkItem["chain"] | undefined => c.messages.flatMap((m) => (m.type === "inbox" ? m.workItems : [])).at(-1)?.chain;

    c.send({ type: "getSeal", requestId: 1, workItemId: a.id });
    await c.message("done", (m) => m.requestId === 1);
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
    git(a.worktree, "checkout", "--quiet", a.branch);
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
    expect(await c.message("error", (m) => m.requestId === 1)).toEqual({ type: "error", requestId: 1, message: refusal(says(a.branch)) });
    c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 2, answer: "Yes, push." }] });
    expect(await c.message("error", (m) => m.requestId === 2)).toEqual({ type: "error", requestId: 2, message: refusal(says(a.branch)) });
    await settled(c);
    // The third is the refusal `settled` waits for.
    expect(c.messages.slice(before).map((m) => m.type)).toEqual(["error", "error", "error"]);
    await d.close();
    expect(said).toEqual([]);
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

  it("leaves the record written and not committed while a headless session of the work item is working, and while a pane of it is: the other work item's word is committed meanwhile, and the first commit made once nothing works carries what was left", async () => {
    // A pane of the kind that reports its state ends by itself after a second and a half, and every other pane stays.
    const commandFor = (kind: string) => (kind === "claude" ? { command: "/bin/sh", args: ["-c", "sleep 1.5"], env: {} } : silent());
    const { d, c, workItems } = await withWorkItems(["Worked in", "Quiet"], { roleAdapter: fakeAdapter({ delayMs: 400 }), commandFor });
    const [a, b] = workItems as [(typeof workItems)[0], (typeof workItems)[0]];
    const directory = withDirectory(a);
    withDirectory(b);
    for (const says of ["One.", "Two.", "Three."]) d.decided(a.id, { ...DEFAULT, says });
    for (const says of ["One.", "Two."]) d.decided(b.id, { ...DEFAULT, says });
    const reverse = async (requestId: number, workItemId: number, decisionId: number): Promise<void> => {
      c.send({ type: "reverseDecision", requestId, workItemId, decisionId, message: `Not ${String(decisionId)}.` });
      await c.message("done", (m) => m.requestId === requestId);
    };

    // A headless session works in the first work item, and none in the second.
    c.send({ type: "ask", requestId: 1, workItemId: a.id, prompt: "Quick?" });
    await c.message("asked", (m) => m.requestId === 1);
    await reverse(2, a.id, 1);
    await reverse(3, b.id, 1);
    await c.until(() => (commitsIn(b.worktree) === 2 ? true : undefined), 3000);
    expect(newest(b.worktree).subject).toBe("chore: record the person's reversal of decision 1");
    await c.message("headless", (m) => m.headless.state === "finished");
    expect(commitsIn(a.worktree)).toBe(1);
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "Not 1." });

    // A pane of the first work item says it is working.
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 4, workItemId: a.id });
    const { session } = await c.message("started", (m) => m.requestId === 4);
    d.agentEvent(session.id, "UserPromptSubmit", {});
    await reverse(5, a.id, 2);
    await reverse(6, b.id, 2);
    await c.until(() => (commitsIn(b.worktree) === 3 ? true : undefined), 3000);
    expect(commitsIn(a.worktree)).toBe(1);
    // The pane's process ends while the pane still says it is working, and a pane that is not alive holds no commit. The commits of one worktree run one after another, so this one is made after the daemon left the second reversal.
    await c.message("exit", (m) => m.id === session.id);
    await reverse(7, a.id, 3);
    await d.close();
    expect(commitsIn(a.worktree)).toBe(2);
    expect(newest(a.worktree).subject).toBe("chore: record the person's reversal of decision 3");
    const committed = readDecisionRecord(git(a.worktree, "show", "HEAD:seal/threads/1-item/decisions.md"));
    expect(committed.decisions.map(({ state }) => state)).toEqual([1, 2, 3].map((id) => ({ is: "reversed", message: `Not ${String(id)}.` })));
    expect(recordIn(directory)).toEqual(committed);
  });

  it("makes the commits of one worktree one after another, each of the file as it stands at its turn: two reversals written while a commit is under way wait for it, the first of them is committed with the second's word in it, the second's turn commits nothing, and the log holds nothing", async () => {
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
    expect(git(a.worktree, "log", "--format=%s").trim().split("\n")).toEqual(["chore: record the person's reversal of decision 2", "chore: record the person's reversal of decision 1", "first"]);
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

  it("answers `done` and keeps the record written where the commit fails: a `pre-commit` hook that exits 1 leaves the branch with no new commit and the record not staged, and the log holds git's words, the hook's among them", async () => {
    const { c, made: repository, workItems } = await withWorkItems(["Hooked"]);
    const a = workItems[0]!;
    const directory = withDirectory(a);
    // A worktree runs the hooks of its repository.
    writeFileSync(join(repository.repo, ".git", "hooks", "pre-commit"), "#!/bin/sh\necho 'the hook says no' >&2\nexit 1\n", { mode: 0o755 });
    const said = logged();
    writeFileSync(join(directory, RECORD_FILE), withDecision("", { kind: "default", decided: DEFAULT.says, grounds: DEFAULT.grounds }));
    const stood = status(a.worktree);
    c.send({ type: "reverseDecision", requestId: 1, workItemId: a.id, decisionId: 1, message: "No." });
    expect(await c.message("done", (m) => m.requestId === 1)).toEqual({ type: "done", requestId: 1 });
    await c.until(() => (said.length > 0 ? true : undefined), 3000);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^the person's word was not committed: /);
    expect(said[0]).toContain("the hook says no");
    expect(commitsIn(a.worktree)).toBe(1);
    expect(recordIn(directory)?.decisions[0]?.state).toEqual({ is: "reversed", message: "No." });
    expect(status(a.worktree)).toEqual(stood);
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
  /** A work item as the look keeps it: without what its records say of the chain, which the look does not keep. */
  const asLooked = ({ recorded: _recorded, ...kept }: WorkItem): WorkItem => kept;

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
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "waiting", stateSince: 1234, stateText: null, stateTool: "Bash", stateQuestions: null }]);
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
    expect(await lookNow(url)).toEqual({ at: 200, sessions: [session], workItems: [expect.objectContaining({ id: 1 })] });
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
    // The look holds the work item as it is sent, the commit read at the hello among it.
    expect(await lookNow(url)).toEqual({ at: 1234, sessions: [], workItems: [{ ...workItem, repoId: 1, repoName: "project", ...UNSET, ...NO_RECORD, permissions: [], aheadOfBase: 1, behindBase: 0, newCommits: 1, commits: [expect.objectContaining({ subject: "one" })], changes: { files: 0, added: 0, removed: 0, list: [] } }] });
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

  it("runs an asked prompt against the fake adapter: every client sees it working, its text as it grows, then finished with the whole answer", async () => {
    const { clients, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ pieces: () => ["A barn ", "owl."] }) }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    one.send({ type: "ask", requestId: 5, workItemId: workItem.id, prompt: "Which owl?" });
    const working = { id: 1, workItemId: workItem.id, prompt: "Which owl?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: null };
    expect(await one.message("asked")).toEqual({ type: "asked", requestId: 5, headless: working });
    for (const c of [one, two]) {
      await c.message("headless", (m) => m.headless.state === "finished");
      expect(told(c)).toEqual([working, { ...working, answer: "A barn " }, { ...working, answer: "A barn owl." }, { ...working, state: "finished", answer: "A barn owl." }]);
    }
    expect(two.messages.some((m) => m.type === "asked")).toBe(false);
  });

  it("answers the client that asked before it tells every client of the session", async () => {
    const { c, workItem } = await withWorkItem();
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    await c.message("headless", (m) => m.headless.state === "finished");
    const order = c.messages.flatMap((m) => (m.type === "asked" || m.type === "headless" ? [m.type] : []));
    expect(order.slice(0, 2)).toEqual(["asked", "headless"]);
  });

  it("starts the session in the work item's worktree, with the prompt as it was asked", async () => {
    const { adapter, seen } = watched();
    const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Where am I?" });
    await c.message("headless", (m) => m.headless.state === "finished");
    expect(seen.started).toEqual([{ prompt: "Where am I?", cwd: workItem.worktree }]);
  });

  it("launches a role: an ask with a pair the protocol lists starts the session as that role, and `asked`, every `headless` and a later `ready` carry the pair and the answer names it", async () => {
    const { adapter, seen } = watched();
    const { clients, url, workItem } = await withWorkItem({ roleAdapter: adapter }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    const role = { role: "proofer", stage: "round" } as const;
    one.send({ type: "ask", requestId: 5, workItemId: workItem.id, prompt: "Which owl?", role });
    expect((await one.message("asked")).headless).toEqual({ id: 1, workItemId: workItem.id, prompt: "Which owl?", state: "working", answer: "", error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role });
    for (const c of [one, two]) {
      const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
      expect(headless.answer).toBe('As the proofer at the stage round, you asked: "Which owl?"');
      expect(told(c).map((h) => h.role)).toEqual([role, role, role]);
    }
    expect(seen.started).toEqual([{ prompt: "Which owl?", cwd: workItem.worktree, role }]);
    expect((await (await client(url)).message("ready")).headless.map((h) => h.role)).toEqual([role]);
  });

  it("launches each pair the protocol lists, and keeps of the pair the role and the stage alone", async () => {
    const { adapter, seen } = watched();
    const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
    expect(ROLE_STAGES).toEqual([
      { role: "proofer", stage: "round" },
      { role: "crafter", stage: "fix-pass" },
      { role: "sealer", stage: "seal" },
      { role: "orchestrator", stage: "judgment" },
    ]);
    for (const [index, pair] of ROLE_STAGES.entries()) {
      c.send({ type: "ask", requestId: index + 1, workItemId: workItem.id, prompt: "Q", role: { ...pair, more: "not kept" } });
      expect((await c.message("asked", (m) => m.requestId === index + 1)).headless.role).toEqual(pair);
    }
    expect(seen.started.map((started) => started.role)).toEqual([...ROLE_STAGES]);
  });

  it("refuses an ask whose role and stage are no pair the protocol lists, saying which, and starts nothing", async () => {
    const { adapter, seen } = watched();
    const { c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
    const refused = async (requestId: number, role: unknown) => {
      c.send({ type: "ask", requestId, workItemId: workItem.id, prompt: "Q", role });
      return (await c.message("error", (m) => m.requestId === requestId)).message;
    };
    expect(await refused(1, { role: "proofer", stage: "seal" })).toBe("no role proofer at the stage seal");
    expect(await refused(2, { role: "framer", stage: "round" })).toBe("no role framer at the stage round");
    expect(await refused(3, { role: "sealer" })).toBe("no role sealer at the stage undefined");
    expect(await refused(4, "proofer")).toBe("no role undefined at the stage undefined");
    expect(await refused(5, null)).toBe("no role undefined at the stage undefined");
    expect(seen.started).toEqual([]);
    expect(c.messages.some((m) => m.type === "asked" || m.type === "headless")).toBe(false);
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
  });

  it("starts a session with no role where the ask names none: its role is null, and the adapter is given none", async () => {
    const { adapter, seen } = watched();
    const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    expect(headless.role).toBeNull();
    expect(headless.answer).toBe('You asked: "Q"');
    expect(seen.started).toEqual([{ prompt: "Q", cwd: workItem.worktree }]);
  });

  it("holds a role session to its limit and to a client's stop as any other", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 60_000 }));
    const { c, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 150 });
    const role = { role: "sealer", stage: "seal" } as const;
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q", role });
    const limited = (await c.message("headless", (m) => m.headless.id === 1 && m.headless.state === "failed")).headless;
    expect([limited.stopped, limited.error, limited.role]).toEqual(["limit", "the session reached its time limit and was stopped", role]);
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Q", role });
    const { headless } = await c.message("asked", (m) => m.requestId === 2);
    c.send({ type: "stopHeadless", requestId: 3, id: headless.id });
    const stopped = (await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless;
    expect([stopped.stopped, stopped.role]).toEqual(["request", role]);
    expect(seen.stopped).toBe(2);
  });

  it("carries the usage the adapter reports, takes the result's text as the whole answer, and nothing after it", async () => {
    const usage: Usage = { costUsd: 0.25, converted: false, models: [{ model: "owl-1", inputTokens: 10, outputTokens: 20, cacheReadTokens: null, cacheWriteTokens: 0, costUsd: 0.25 }] };
    const roleAdapter: RoleAdapter = {
      name: "priced",
      features: [],
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
    const { c, workItem } = await withWorkItem({ roleAdapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    expect(headless).toMatchObject({ answer: "An owl.", usage, error: null });
    // The result closes the answer: the text that arrives after it changes nothing.
    await pause(100);
    expect(told(c).map((h) => h.answer)).toEqual(["", "Let me look. ", "Let me look. An owl.", "An owl."]);
  });

  it("says a session failed, with the adapter's message, where the adapter does not start", async () => {
    const { clients, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "start" }) }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    one.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    expect((await one.message("asked")).headless.state).toBe("working");
    for (const c of [one, two]) {
      const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
      expect(headless).toMatchObject({ id: 1, state: "failed", answer: "", error: "the fake adapter was told not to start", usage: null });
    }
  });

  it("says a session failed, with the result's text, where the result is an error", async () => {
    const { c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "result" }) });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect(headless).toMatchObject({ state: "failed", answer: "", error: "the fake adapter was told to fail" });
    // The exit that follows the result changes nothing, and is told to nobody.
    await pause(100);
    expect(told(c).map((h) => h.state)).toEqual(["working", "failed"]);
  });

  it("says a session failed, with the exit code, where the process exits without a result", async () => {
    const { c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "exit" }) });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect(headless).toMatchObject({ state: "failed", answer: "", error: "the session exited with code 1 and gave no result" });
  });

  it("tells nobody of the exit that follows a result", async () => {
    const { c, workItem } = await withWorkItem();
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    await c.message("headless", (m) => m.headless.state === "finished");
    await pause(100);
    expect(told(c).map((h) => h.state)).toEqual(["working", "working", "finished"]);
  });

  it("lists a finished session, with its answer, to a client that connects later", async () => {
    const { c, url, workItem } = await withWorkItem();
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Remembered?" });
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    c.socket.close();
    const later = await client(url);
    expect((await later.message("ready")).headless).toEqual([headless]);
    expect(headless).toEqual({ id: 1, workItemId: workItem.id, prompt: "Remembered?", state: "finished", answer: 'You asked: "Remembered?"', error: null, usage: null, startedAt: 1234, errorOutput: "", stopped: null, role: null });
  });

  it("lists no headless session where none was asked, and counts them apart from the panes", async () => {
    const { c, url, workItem } = await withWorkItem();
    // The work item's pane already holds the pane id 1.
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "One" });
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Two" });
    expect((await c.message("asked", (m) => m.requestId === 1)).headless.id).toBe(1);
    expect((await c.message("asked", (m) => m.requestId === 2)).headless.id).toBe(2);
    await c.message("headless", (m) => m.headless.id === 2 && m.headless.state === "finished");
    expect((await (await client(url)).message("ready")).headless.map((h) => [h.id, h.prompt, h.state])).toEqual([[1, "One", "finished"], [2, "Two", "finished"]]);
  });

  it("carries only the fields the protocol names, the adapter's name not among them, and a usage only with its mark", async () => {
    const usage: Usage = { costUsd: 0.5, converted: true, models: [{ model: "owl-1", inputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4, costUsd: 0.5 }] };
    const { c, url, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ usage: () => usage }) });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const asked = await c.message("asked");
    const changed = await c.message("headless", (m) => m.headless.state === "finished");
    const ready = await (await client(url)).message("ready");
    const fields = ["answer", "error", "errorOutput", "id", "prompt", "role", "startedAt", "state", "stopped", "usage", "workItemId"];
    expect(Object.keys(asked).sort()).toEqual(["headless", "requestId", "type"]);
    expect(Object.keys(changed).sort()).toEqual(["headless", "type"]);
    for (const info of [asked.headless, ...told(c), ready.headless[0]!]) expect(Object.keys(info).sort()).toEqual(fields);
    // The cost travels with whether it is a value converted at API prices, and nothing else of the agent's travels beside it.
    for (const info of [changed.headless, ready.headless[0]!]) {
      expect(info.usage).toEqual(usage);
      expect(Object.keys(info.usage!).sort()).toEqual(["converted", "costUsd", "models"]);
      expect(Object.keys(info.usage!.models[0]!).sort()).toEqual(["cacheReadTokens", "cacheWriteTokens", "costUsd", "inputTokens", "model", "outputTokens"]);
    }
    expect(JSON.stringify([asked, changed, ready.headless])).not.toContain("fake");
  });

  it("answers an ask it cannot start with an error, and starts nothing", async () => {
    const { adapter, seen } = watched();
    const { c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
    const refused = async (requestId: number, fields: object) => {
      c.send({ type: "ask", requestId, ...fields });
      return (await c.message("error", (m) => m.requestId === requestId)).message;
    };
    expect(await refused(1, { workItemId: 42, prompt: "Q" })).toBe("no work item 42");
    expect(await refused(2, { prompt: "Q" })).toBe("asking needs a work item and a prompt");
    expect(await refused(3, { workItemId: workItem.id, prompt: " \n" })).toBe("asking needs a work item and a prompt");
    expect(await refused(4, { workItemId: workItem.id, prompt: 7 })).toBe("asking needs a work item and a prompt");
    rmSync(workItem.worktree, { recursive: true, force: true });
    expect(await refused(5, { workItemId: workItem.id, prompt: "Q" })).toBe(`the folder of work item ${workItem.id} is gone: ${workItem.worktree}`);
    expect(seen.started).toEqual([]);
    expect(c.messages.some((m) => m.type === "asked" || m.type === "headless")).toBe(false);
    expect((await (await client(url)).message("ready")).headless).toEqual([]);
  });

  it("stops every run still going when the daemon closes, and none of them again at its limit", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 5000 }));
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 300 });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "One" });
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Two" });
    await c.message("asked", (m) => m.requestId === 2);
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
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    await c.message("asked");
    await pause(20);
    await d.close();
    expect(ended).toBe(1);
  });

  it("stops a run that starts only after the daemon closed", async () => {
    const inner = fakeAdapter({ delayMs: 5000 });
    let stopped = 0;
    const roleAdapter: RoleAdapter = {
      name: "slow",
      features: [],
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
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    await c.message("asked");
    await d.close();
    expect(stopped).toBe(0);
    await pause(300);
    expect(stopped).toBe(1);
  });

  /** An adapter that answers the prompt "Quick?" at once and any other after a minute, and counts the runs it stopped. */
  function quickOrSlow() {
    const slow = fakeAdapter({ delayMs: 60_000 });
    const quick = fakeAdapter();
    return watched({ name: "fake", features: [], notice: quick.notice, start: (options, listener) => (options.prompt === "Quick?" ? quick : slow).start(options, listener) });
  }

  it("carries what the agent's process printed on its error stream: every client sees the failed session with it, and `ready` lists it so", async () => {
    const printed = "error: unknown option '--no-such-option'\n";
    const { clients, url, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "exit", errorOutput: printed }) }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    one.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await one.message("asked");
    const failed = { ...headless, state: "failed", error: "the session exited with code 1 and gave no result", errorOutput: printed };
    for (const c of [one, two]) expect((await c.message("headless", (m) => m.headless.state === "failed")).headless).toEqual(failed);
    expect((await (await client(url)).message("ready")).headless).toEqual([failed]);
  });

  it("writes into a session that ended the error output its exit carries, and tells every client only where it changed", async () => {
    const { c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ fail: "result", errorOutput: "a trace" }) });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
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
    const { c, workItem } = await withWorkItem({ roleAdapter: adapter, headlessLimitMs: 200, idleExitMs: 100, onIdle: () => idle++, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("asked");
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
      features: [],
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
    const { c, workItem } = await withWorkItem({ roleAdapter, headlessLimitMs: 200 });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Quick?" });
    const quick = (await c.message("headless", (m) => m.headless.state === "finished")).headless;
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Slow to start?" });
    const { headless } = await c.message("asked", (m) => m.requestId === 2);
    expect((await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless).toMatchObject({ stopped: "limit" });
    expect(stopped).toBe(0);
    await c.until(() => (stopped === 1 ? true : undefined));
    await pause(300);
    expect(stopped).toBe(1);
    expect(told(c).filter((h) => h.id === quick.id).map((h) => h.state)).toEqual(["working", "working", "finished"]);
  });

  it("stops a working session at a client's request: it answers `done`, and every client sees the session failed with the request's error and saying a request stopped it; a session that ended is left as it is, and an id it does not list is refused", async () => {
    const { adapter, seen } = quickOrSlow();
    const { clients, url, workItem } = await withWorkItem({ roleAdapter: adapter }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    one.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Quick?" });
    const finished = (await one.message("headless", (m) => m.headless.state === "finished")).headless;
    one.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Which file?" });
    const { headless } = await one.message("asked", (m) => m.requestId === 2);
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
      features: [],
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
    const { clients, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 2 }, 2);
    const [one, two] = clients as [(typeof clients)[0], (typeof clients)[0]];
    const dropped = (c: { messages: ServerMessage[] }) => c.messages.flatMap((m) => (m.type === "headlessDropped" ? [m.id] : []));
    const ask = async (requestId: number, prompt: string) => {
      one.send({ type: "ask", requestId, workItemId: workItem.id, prompt });
      return (await one.message("asked", (m) => m.requestId === requestId)).headless.id;
    };
    const finishedOne = (id: number) => one.message("headless", (m) => m.headless.id === id && m.headless.state === "finished");
    const slow = await ask(1, "Slow?");
    for (const [requestId, prompt] of [[2, "A"], [3, "B"]] as const) await finishedOne(await ask(requestId, prompt));
    await pause(50);
    expect(dropped(one)).toEqual([]);
    const fourth = await ask(4, "C");
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
    const { c, url, workItem } = await withWorkItem({ keptHeadless: 1, commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    // The pane ends at once, so the removal names no running session.
    await c.message("exit");
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    await c.message("headless", (m) => m.headless.state === "finished");
    c.send({ type: "removeRepository", requestId: 2, id: 1, workItems: [workItem.id], running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 2);
    const other = temporaryRepository();
    cleanups.push(other.remove);
    c.send({ type: "createWorkItem", requestId: 3, repo: other.repo, title: "Asked next", kind: "shell", cols: 80, rows: 24 });
    const next = (await c.message("workItemCreated", (m) => m.requestId === 3)).workItem;
    c.send({ type: "ask", requestId: 4, workItemId: next.id, prompt: "Q" });
    const { headless } = await c.message("asked", (m) => m.requestId === 4);
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
      features: [],
      notice: () => Promise.resolve(null),
      start: async (options, listener) => {
        if (options.prompt !== "First?") return quick.start(options, listener);
        setTimeout(() => listener({ type: "result", text: "first", isError: false, usage: null }), 0);
        exitFirst = () => listener({ type: "exit", exitCode: 0, errorOutput: "late" });
        return { stop: () => Promise.resolve(), answer: () => {} };
      },
    };
    const { c, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 1 });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "First?" });
    await c.message("headless", (m) => m.headless.state === "finished");
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Second?" });
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
      features: [],
      notice: () => Promise.resolve(null),
      start: (options, listener) =>
        options.prompt !== "Slow?" ? quick.start(options, listener) : new Promise((_, reject) => rejects.push(() => reject(new Error("the login shell found no CLI")))),
    };
    const { c, url, workItem } = await withWorkItem({ roleAdapter, keptHeadless: 1 });
    const ask = async (requestId: number, prompt: string) => {
      c.send({ type: "ask", requestId, workItemId: workItem.id, prompt });
      return (await c.message("asked", (m) => m.requestId === requestId)).headless.id;
    };
    const stop = async (requestId: number, id: number) => {
      c.send({ type: "stopHeadless", requestId, id });
      await c.message("done", (m) => m.requestId === requestId);
    };
    const listed = async () => (await (await client(url)).message("ready")).headless.map((h) => [h.id, h.error, h.stopped]);
    // What the daemon told of headless sessions after the client's `before`th message. The work item's pane prints meanwhile.
    const toldSince = (before: number) => c.messages.slice(before).filter((m) => m.type === "headless" || m.type === "headlessDropped");
    // A session stopped while its adapter starts, and still listed.
    const first = await ask(1, "Slow?");
    await stop(2, first);
    let before = c.messages.length;
    rejects[0]!();
    await pause(100);
    expect(toldSince(before)).toEqual([]);
    expect(await listed()).toEqual([[first, "the session was stopped at a request before it finished", "request"]]);
    // A session stopped while its adapter starts, then dropped by the bound once a later session ended.
    const second = await ask(3, "Slow?");
    await stop(4, second);
    const third = await ask(5, "Quick?");
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
    const ENTRY_FIELDS = ["branch", "endedAt", "repo", "stage", "startedAt", "state", "stopped", "usage", "workItemId"];
    const PROOFER = { role: "proofer", stage: "round" } as const;

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

    /** Asks a prompt and waits until the session has ended. */
    async function asked(c: Client, workItemId: number, prompt: string, role?: RoleStage): Promise<HeadlessInfo> {
      const requestId = nextRequest++;
      c.send({ type: "ask", requestId, workItemId, prompt, ...(role ? { role } : {}) });
      const { headless } = await c.message("asked", (m) => m.requestId === requestId);
      return (await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state !== "working")).headless;
    }

    it("keeps one entry for each session that ends, with a role and without: its work item, its repository and branch, its stage, its two times, how it ended and the usage its result reported", async () => {
      let clock = 1000;
      // The clock moves on while each turn runs, so a session's end is read after its start.
      const usage = (prompt: string): Usage => {
        clock += 500;
        return prompt === "Which owl?" ? USAGE : { ...USAGE, costUsd: 0.5 };
      };
      const { c, workItem } = await withWorkItem({ now: () => clock, roleAdapter: fakeAdapter({ usage }) });
      clock = 1500;
      await asked(c, workItem.id, "Which owl?", PROOFER);
      clock = 3000;
      await asked(c, workItem.id, "And you?");
      const answer = await ledgerOf(c, workItem.id);
      const kept = { workItemId: workItem.id, repo: workItem.repo, branch: workItem.branch, state: "finished", stopped: null };
      expect(answer).toEqual({
        type: "ledger",
        requestId: answer.requestId,
        workItemId: workItem.id,
        entries: [
          { ...kept, stage: PROOFER, startedAt: 1500, endedAt: 2000, usage: USAGE },
          { ...kept, stage: null, startedAt: 3000, endedAt: 3500, usage: { ...USAGE, costUsd: 0.5 } },
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
      await asked(c, workItem.id, "Which owl?", PROOFER);
      const kept = { workItemId: 1, repo: workItem.repo, branch: workItem.branch, stage: PROOFER, startedAt: 1234, endedAt: 1234, state: "finished", stopped: null, usage: USAGE };
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
      const { c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ delayMs: 60_000, usage: () => USAGE }), headlessLimitMs: 150 });
      expect((await asked(c, workItem.id, "Q", PROOFER)).stopped).toBe("limit");
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ entries: [{ stage: PROOFER, state: "failed", stopped: "limit", usage: null }], unread: 0 });
    });

    it("enters a session a request stopped with no usage", async () => {
      const { c, workItem } = await withWorkItem({ roleAdapter: fakeAdapter({ delayMs: 60_000, usage: () => USAGE }) });
      c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
      const { headless } = await c.message("asked");
      c.send({ type: "stopHeadless", requestId: 2, id: headless.id });
      await c.message("headless", (m) => m.headless.state === "failed");
      expect(await ledgerOf(c, workItem.id)).toMatchObject({ entries: [{ stage: null, state: "failed", stopped: "request", usage: null }], unread: 0 });
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
      const { daemon: first, c, workItem } = await withWorkItem({ runDir, roleAdapter, now: () => clock });
      c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q", role: PROOFER });
      await c.message("asked");
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
        features: [],
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
      const { c, workItem } = await withWorkItem({ roleAdapter });
      for (const prompt of ["Error?", "Exited?", "Rejected?"]) expect((await asked(c, workItem.id, prompt)).state).toBe("failed");
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
      const { c, workItem } = await withWorkItem({ runDir });
      const { session } = await c.message("workItemCreated");
      await asked(c, workItem.id, "Q");
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
      const { c, workItem } = await withWorkItem();
      const { session } = await c.message("workItemCreated");
      await asked(c, workItem.id, "Q");
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
    type Inbox = Extract<ServerMessage, { type: "inbox" }>;
    type Client = Awaited<ReturnType<typeof client>>;
    const SHELL: FakeAsk = { tool: "Bash", action: "run", path: null, text: "printf x >> README.md" };
    const CRAFTER = { role: "crafter", stage: "fix-pass" } as const;
    /** The requests an `inbox` carries on a work item. */
    const asksIn = (m: Inbox, workItemId: number): PermissionAsk[] | undefined => m.workItems.find((item) => item.id === workItemId)?.permissions;
    /** Every request every `inbox` and `ready` the client received carried, on any work item. */
    const everAsked = (c: Client): PermissionAsk[] => c.messages.flatMap((m) => (m.type === "inbox" || m.type === "ready" ? [...m.workItems, ...m.archived].flatMap((item) => item.permissions) : []));
    /** A fake adapter whose sessions raise the requests the case sets afterwards, once it knows its work item's folder. */
    function asking(options: Parameters<typeof fakeAdapter>[0] = {}) {
      const held = { asks: [] as FakeAsk[] };
      return { held, adapter: fakeAdapter({ ...options, asks: () => held.asks }) };
    }
    /** Asks one session and gives the lines its answer holds once it finished: what the daemon answered each request with, then the fake's own text. */
    async function answersOf(c: Client, workItemId: number, role?: RoleStage): Promise<string[]> {
      c.send({ type: "ask", requestId: 50, workItemId, prompt: "Q", ...(role ? { role } : {}) });
      const { headless } = await c.message("asked", (m) => m.requestId === 50);
      const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
      return finished.headless.answer.split("\n").slice(0, -1);
    }
    const OUTSIDE = (role: string, path: string) => `Owlery lets the ${role} write only inside the work item's worktree, and ${path} is outside it. Do not work around it: say in your report which step needed the write.`;
    const NO_WRITE = (role: string) => `Owlery gives the ${role} no call that writes a file. Do not work around it: say in your report which step needed the write.`;
    const NO_COMMAND = (role: string) => `Owlery gives the ${role} no command that asks for permission. Do not work around it: say in your report which step needed the command.`;
    const NO_CALL = (role: string) => `Owlery's rule for the ${role} does not allow this call. Do not work around it: say in your report which step needed it.`;

    it("answers a crafter's request by its grant: a write inside the worktree and a command are allowed, a write anywhere else and every other call are refused with the reason, and nothing waits for the person", async () => {
      const { held, adapter } = asking();
      const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
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
      expect(await answersOf(c, workItem.id, CRAFTER)).toEqual([
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
      expect(everAsked(c)).toEqual([]);
    });

    it.each([
      ["proofer", { role: "proofer", stage: "round" }],
      ["sealer", { role: "sealer", stage: "seal" }],
      ["orchestrator", { role: "orchestrator", stage: "judgment" }],
    ] as const)("refuses every request of a %s, a write inside the worktree and a command among them, with a reason that names the role and says to name the step in the report, and nothing waits for the person", async (name, role) => {
      const { held, adapter } = asking();
      const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
      held.asks = [{ tool: "Edit", action: "write", path: join(workItem.worktree, "README.md"), text: "README.md" }, SHELL, { tool: "Read", action: "read", path: "/etc/hosts", text: "/etc/hosts" }, { tool: "WebFetch", action: "other", path: null, text: "{}" }];
      const answers = await answersOf(c, workItem.id, role);
      expect(answers).toEqual([`refused: Edit: ${NO_WRITE(name)}`, `refused: Bash: ${NO_COMMAND(name)}`, `refused: Read: ${NO_CALL(name)}`, `refused: WebFetch: ${NO_CALL(name)}`]);
      for (const answer of answers) expect(answer).toMatch(/Do not work around it: say in your report which step needed /);
      expect(everAsked(c)).toEqual([]);
    });

    /** A daemon whose one client asked a session with no role that raises one request, once the request waits. */
    async function waiting(options: Partial<DaemonOptions> = {}, asks: FakeAsk[] = [SHELL]) {
      const { held, adapter } = asking();
      held.asks = asks;
      const made = await withWorkItem({ roleAdapter: adapter, ...options }, 2);
      const { c, workItem } = made;
      c.send({ type: "ask", requestId: 60, workItemId: workItem.id, prompt: "Q" });
      const { headless } = await c.message("asked", (m) => m.requestId === 60);
      const inbox = await c.message("inbox", (m) => asksIn(m, workItem.id)?.length === asks.filter((ask) => !ask.withdraw).length);
      return { ...made, held, headless, asked: asksIn(inbox, workItem.id)! };
    }
    /** Waits for an `inbox` that arrives after the client's `since`th message and carries no request on the work item. */
    const cleared = (c: Client, since: number, workItemId: number) => c.until(() => c.messages.slice(since).find((m) => m.type === "inbox" && asksIn(m, workItemId)?.length === 0));

    it("keeps a request of a session with no role for the person: every client's `inbox` carries it on its work item with the session's id, the session stays working, and a client that connects later is given it", async () => {
      const { clients, c, url, workItem, headless, asked } = await waiting();
      expect(asked).toEqual([{ id: 1, headlessId: headless.id, tool: "Bash", action: "run", text: "printf x >> README.md", at: 1234 }]);
      // Another work item of the repository holds none of it.
      c.send({ type: "createWorkItem", requestId: 64, repo: workItem.repo, title: "Beside it", kind: "shell", cols: 80, rows: 24 });
      const beside = (await c.message("workItemCreated", (m) => m.requestId === 64)).workItem;
      expect(beside.permissions).toEqual([]);
      await clients[1]!.message("inbox", (m) => asksIn(m, workItem.id)?.length === 1);
      await pause(100);
      expect(told(clients[0]!).map((h) => h.state)).toEqual(["working"]);
      const later = await (await client(url)).message("ready");
      expect(later.workItems.map((item) => [item.id, item.permissions])).toEqual([[workItem.id, asked], [beside.id, []]]);
      expect(later.headless.map((h) => h.state)).toEqual(["working"]);
      // The request names no adapter and no path of the adapter's event.
      expect(Object.keys(asked[0]!).sort()).toEqual(["action", "at", "headlessId", "id", "text", "tool"]);
    });

    it("allows the call at a person's allowance: the daemon answers `done` before the `inbox` that carries the work item with no request, and the session goes on with the call allowed", async () => {
      const { clients, c, workItem, headless, asked } = await waiting();
      const other = clients[1]!;
      await other.message("inbox", (m) => asksIn(m, workItem.id)?.length === 1);
      const [before, otherBefore] = [c.messages.length, other.messages.length];
      c.send({ type: "answerPermission", requestId: 61, workItemId: workItem.id, id: asked[0]!.id, allow: true });
      const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
      expect(finished.headless.answer).toBe('allowed: Bash\nYou asked: "Q"');
      const after = c.messages.slice(before).filter((m) => m.type === "done" || m.type === "inbox");
      expect(after[0]).toEqual({ type: "done", requestId: 61 });
      expect(asksIn(after[1] as Inbox, workItem.id)).toEqual([]);
      // Every client is told, and only the one that answered is told `done`.
      await cleared(other, otherBefore, workItem.id);
      expect(other.messages.some((m) => m.type === "done")).toBe(false);
    });

    it("refuses the call at a person's refusal, with the sentence that says the person refused it", async () => {
      const { c, workItem, headless, asked } = await waiting();
      const before = c.messages.length;
      c.send({ type: "answerPermission", requestId: 61, workItemId: workItem.id, id: asked[0]!.id, allow: false });
      const finished = await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "finished");
      expect(finished.headless.answer).toBe('refused: Bash: The person refused this call.\nYou asked: "Q"');
      const after = c.messages.slice(before).filter((m) => m.type === "done" || m.type === "inbox");
      expect(after[0]).toEqual({ type: "done", requestId: 61 });
      expect(asksIn(after[1] as Inbox, workItem.id)).toEqual([]);
    });

    it("lists the requests of a work item the oldest first, each under an id of the daemon's own, and an allowance covers the one call it names: the same call of the same session waits on", async () => {
      // Two sessions of the work item raise the same two requests each, under the adapter's same ids, a moment apart: the first of each, then the second of each.
      const { held, adapter } = asking({ delayMs: 150 });
      held.asks = [SHELL, SHELL];
      const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
      c.send({ type: "ask", requestId: 60, workItemId: workItem.id, prompt: "Q" });
      c.send({ type: "ask", requestId: 62, workItemId: workItem.id, prompt: "Q" });
      const headless = (await c.message("asked", (m) => m.requestId === 60)).headless;
      const second = (await c.message("asked", (m) => m.requestId === 62)).headless;
      const four = asksIn(await c.message("inbox", (m) => asksIn(m, workItem.id)?.length === 4), workItem.id)!;
      expect(four.map((ask) => [ask.id, ask.headlessId, ask.text])).toEqual([[1, headless.id, SHELL.text], [2, second.id, SHELL.text], [3, headless.id, SHELL.text], [4, second.id, SHELL.text]]);
      c.send({ type: "answerPermission", requestId: 63, workItemId: workItem.id, id: 1, allow: true });
      const before = c.messages.length;
      await c.message("done", (m) => m.requestId === 63);
      const three = asksIn(await c.until(() => c.messages.slice(before).find((m): m is Inbox => m.type === "inbox" && asksIn(m, workItem.id)?.length === 3)), workItem.id)!;
      expect(three.map((ask) => ask.id)).toEqual([2, 3, 4]);
      await pause(400);
      // The session took the one allowance and still works, waiting on the same call's second request.
      expect(told(c).filter((h) => h.id === headless.id).map((h) => [h.state, h.answer])).toEqual([["working", ""], ["working", "allowed: Bash\n"]]);
    });

    it("answers an `answerPermission` for a request it does not hold with an error, and changes no list: an id no session waits on, a request of another work item, one already answered, and an answer that neither allows nor refuses", async () => {
      const { c, url, workItem, asked } = await waiting({}, [SHELL, SHELL]);
      const refusedWith = async (requestId: number, fields: object) => {
        c.send({ type: "answerPermission", requestId, ...fields });
        return (await c.message("error", (m) => m.requestId === requestId)).message;
      };
      expect(await refusedWith(70, { workItemId: workItem.id, id: 99, allow: true })).toBe("no permission request 99 waits in this work item");
      expect(await refusedWith(71, { workItemId: workItem.id + 1, id: asked[0]!.id, allow: true })).toBe(`no permission request ${asked[0]!.id} waits in this work item`);
      expect(await refusedWith(72, { workItemId: workItem.id, id: asked[0]!.id })).toBe("an answer to a permission request says whether it allows the call");
      expect(await refusedWith(73, { workItemId: workItem.id, id: asked[0]!.id, allow: "yes" })).toBe("an answer to a permission request says whether it allows the call");
      expect((await (await client(url)).message("ready")).workItems.find((item) => item.id === workItem.id)?.permissions).toEqual(asked);
      c.send({ type: "answerPermission", requestId: 74, workItemId: workItem.id, id: asked[0]!.id, allow: false });
      await c.message("done", (m) => m.requestId === 74);
      await c.message("inbox", (m) => asksIn(m, workItem.id)?.length === 1);
      const before = c.messages.length;
      expect(await refusedWith(75, { workItemId: workItem.id, id: asked[0]!.id, allow: true })).toBe(`no permission request ${asked[0]!.id} waits in this work item`);
      await pause(100);
      // The work item's pane prints meanwhile.
      expect(c.messages.slice(before).flatMap((m) => (m.type === "output" ? [] : [m.type]))).toEqual(["error"]);
      expect((await (await client(url)).message("ready")).workItems.find((item) => item.id === workItem.id)?.permissions).toEqual([asked[1]]);
    });

    it("ends a request unanswered where a client stops its session: an `inbox` carries the work item with no request, and a later answer is an error", async () => {
      const { c, workItem, headless, asked } = await waiting();
      const before = c.messages.length;
      c.send({ type: "stopHeadless", requestId: 80, id: headless.id });
      await cleared(c, before, workItem.id);
      c.send({ type: "answerPermission", requestId: 81, workItemId: workItem.id, id: asked[0]!.id, allow: true });
      expect((await c.message("error", (m) => m.requestId === 81)).message).toBe(`no permission request ${asked[0]!.id} waits in this work item`);
    });

    it("ends a request unanswered where its session reaches its limit, which counts from the session's start whether or not it waits", async () => {
      const { c, workItem, headless } = await waiting({ headlessLimitMs: 400 });
      const before = c.messages.length;
      const failed = (await c.message("headless", (m) => m.headless.id === headless.id && m.headless.state === "failed")).headless;
      expect([failed.stopped, failed.error]).toEqual(["limit", "the session reached its time limit and was stopped"]);
      await cleared(c, before, workItem.id);
    });

    it("ends a request unanswered where its session's process exits, and where its turn ends with a result", async () => {
      for (const last of ["exit", "result"] as const) {
        let end = (): void => {};
        // A session that asks once, and ends when the case says so with no answer given.
        const roleAdapter: RoleAdapter = {
          name: "fake",
          features: [],
          notice: () => Promise.resolve(null),
          start: (_options, listener) => {
            setTimeout(() => listener({ type: "permission", id: "r1", tool: "Bash", action: "run", path: null, text: "ls" }), 0);
            end = () => listener(last === "exit" ? { type: "exit", exitCode: 3, errorOutput: "" } : { type: "result", text: "done", isError: false, usage: null });
            return Promise.resolve({ stop: () => Promise.resolve(), answer: () => {} });
          },
        };
        const { c, workItem } = await withWorkItem({ roleAdapter });
        c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
        await c.message("inbox", (m) => asksIn(m, workItem.id)?.length === 1);
        const before = c.messages.length;
        end();
        await cleared(c, before, workItem.id);
        const ended = c.messages.slice(before).flatMap((m) => (m.type === "headless" ? [m.headless.state] : []));
        expect(ended, last).toEqual([last === "exit" ? "failed" : "finished"]);
      }
    });

    it("ends a request unanswered where its work item is archived: the archived work item holds none", async () => {
      const { c, url, workItem, headless } = await waiting({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
      await c.message("exit");
      c.send({ type: "archiveWorkItem", requestId: 90, id: workItem.id, running: { panes: [], headless: [headless.id] } });
      await c.message("done", (m) => m.requestId === 90);
      const ready = await (await client(url)).message("ready");
      expect(ready.archived.map((item) => [item.id, item.permissions])).toEqual([[workItem.id, []]]);
      expect(ready.headless.map((h) => [h.state, h.stopped])).toEqual([["failed", "request"]]);
    });

    it("takes a request its session withdrew off the list: an `inbox` carries the work item with no request, the session goes on, and a later answer is an error", async () => {
      const { held, adapter } = asking({ delayMs: 150 });
      held.asks = [{ ...SHELL, withdraw: true }];
      const { c, workItem } = await withWorkItem({ roleAdapter: adapter });
      c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
      const held1 = asksIn(await c.message("inbox", (m) => asksIn(m, workItem.id)?.length === 1), workItem.id)!;
      const before = c.messages.length;
      await cleared(c, before, workItem.id);
      // The withdrawal took it off, and not the session's end: the session still works.
      expect(told(c).map((h) => h.state)).not.toContain("finished");
      c.send({ type: "answerPermission", requestId: 2, workItemId: workItem.id, id: held1[0]!.id, allow: true });
      expect((await c.message("error", (m) => m.requestId === 2)).message).toBe(`no permission request ${held1[0]!.id} waits in this work item`);
      expect((await c.message("headless", (m) => m.headless.state === "finished")).headless.answer).toBe('You asked: "Q"');
    });

    it("starts a role session only through an adapter that declares both features: it answers the ask with an error that names the adapter and what it lacks, starts nothing, and starts a session with no role all the same", async () => {
      for (const [features, lacks] of [
        [["role-tools"], "permission-requests"],
        [["permission-requests"], "role-tools"],
        [[], "role-tools and permission-requests"],
      ] as const) {
        const { adapter, seen } = watched(fakeAdapter({ features }));
        const { c, url, workItem } = await withWorkItem({ roleAdapter: adapter });
        c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q", role: { role: "proofer", stage: "round" } });
        expect(await c.message("error", (m) => m.requestId === 1), lacks).toEqual({ type: "error", requestId: 1, message: `the fake adapter cannot launch a role: it does not declare ${lacks}` });
        expect(seen.started).toEqual([]);
        expect((await (await client(url)).message("ready")).headless).toEqual([]);
        c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Q" });
        expect((await c.message("headless", (m) => m.headless.state === "finished")).headless.role).toBeNull();
        expect(seen.started).toEqual([{ prompt: "Q", cwd: workItem.worktree }]);
      }
    });

    it("holds in a look the requests that waited when a client sent `looked`, and gives them to a client that connects afterwards though the request was answered since", async () => {
      const { c, url, workItem, asked } = await waiting();
      c.send({ type: "looked" });
      // `looked` has no answer: the refusal of the start sent after it arrives once the daemon has handled both.
      c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 95, workItemId: 999 });
      await c.message("error", (m) => m.requestId === 95);
      c.send({ type: "answerPermission", requestId: 96, workItemId: workItem.id, id: asked[0]!.id, allow: true });
      await c.message("done", (m) => m.requestId === 96);
      const ready = await (await client(url)).message("ready");
      expect(ready.lastLook?.workItems.find((item) => item.id === workItem.id)?.permissions).toEqual(asked);
      expect(ready.workItems.find((item) => item.id === workItem.id)?.permissions).toEqual([]);
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
    const { url } = await daemon({ worktreesRoot: made.root, roleAdapter: fakeAdapter({ notice: NOTICE }) });
    const c = await client(url);
    expect((await c.message("ready")).agentNotice).toBe(NOTICE);
    c.send({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Which owl?" });
    const { headless } = await c.message("headless", (m) => m.headless.state !== "working");
    expect([headless.state, headless.answer]).toEqual(["finished", 'You asked: "Which owl?"']);
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
    const { url } = await daemon({
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
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Q" });
    await c.message("asked");
    c.socket.close();
    // The text arrives 300 ms after the ask and the result 300 ms after that.
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

  /** A holder that starts no process: it counts the holds asked of it and those released, and `lose` ends the last hold as a child that ended by itself does. */
  function holder() {
    const seen = { held: 0, released: 0, lose: (): void => undefined };
    const holdAwake: HoldAwake = (lost) => {
      seen.held++;
      seen.lose = lost;
      return { release: () => void seen.released++ };
    };
    return { holdAwake, seen };
  }

  /** A run folder of the case's own, removed after it. */
  function runFolder(): string {
    const dir = mkdtempSync(join(tmpdir(), "owlery-keep-awake-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    return dir;
  }

  /** A daemon given a counting holder, with two clients, and panes whose process ends when a line arrives. */
  async function held(options: Partial<DaemonOptions> = {}) {
    const { holdAwake, seen } = holder();
    const { daemon: d, url } = await daemonWithWorkItem({ holdAwake, commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }), ...options });
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

  it.each(["asks a permission", "exits", "is closed"] as const)("keeps the hold while one of two panes still works, and releases it once when the other %s, telling every client", async (end) => {
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
    const { c, both, seen } = await held({ worktreesRoot: made.root, roleAdapter: fakeAdapter({ ...adapter, delayMs: 100 }) });
    c.send({ type: "createWorkItem", requestId: 100, repo: made.repo, title: "Asked in", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect(seen.held).toBe(0);
    c.send({ type: "ask", requestId: 101, workItemId: workItem.id, prompt: "Which owl?" });
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
    expect(Object.keys(await c.message("ready")).sort()).toEqual(["agentNotice", "archived", "headless", "lastLook", "paneKinds", "repositories", "sessions", "type", "workItems"]);
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
