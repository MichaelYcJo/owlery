import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { fakeAdapter } from "../src/daemon/adapters/fake";
import { agentEventFor } from "../src/daemon/agent-events";
import { OutputBuffer } from "../src/daemon/buffer";
import { Daemon, type DaemonOptions } from "../src/daemon/daemon";
import { buildOf, readDiscovery, writeDiscovery } from "../src/daemon/discovery";
import type { HoldAwake } from "../src/daemon/keep-awake";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { createWorktree, readLoss } from "../src/daemon/worktrees";
import { generateName } from "../src/shared/names";
import type { HeadlessInfo, KeepAwake, ServerMessage, WorkItemLoss } from "../src/shared/protocol";
import { commitFile, git, runs, temporaryClone, temporaryRepository, unansweringOrigin } from "./repositories";

const TOKEN = "t".repeat(64);
/** A session whose agent has sent no event and whose silent start is not over, whose session just started, or whose kind reports no state. */
const NO_STATE = { state: null, stateSince: null, stateText: null, stateTool: null };
/** What a branch just cut holds since its base. */
const NOTHING_NEW = { aheadOfBase: 0, newCommits: 0, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } };
const SESSION_FIELDS = ["alive", "id", "kind", "state", "stateSince", "stateText", "stateTool", "workItemId"];
const WORK_ITEM_FIELDS = ["aheadOfBase", "archivedAt", "baseBranch", "baseCommit", "branch", "changes", "commits", "createdAt", "groupId", "id", "muted", "newCommits", "pinned", "repo", "repoId", "repoName", "title", "worktree"];
/** What a work item holds of the fields a person sets, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null };
/** What a repository holds of the fields a person sets, before any is set. */
const PLAIN = { customName: null, icon: null, defaultBase: null, hidden: false, groups: [] };
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
    // Prints a numbered line every 20 ms, so lines are printed between the client's ready and its attach.
    const { url } = await daemonWithWorkItem({
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "i=0; while [ $i -lt 40 ]; do echo line-$i; i=$((i+1)); sleep 0.02; done; sleep 30"], env: {} }),
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
    expect(created.workItem).toEqual({ id: 1, title: "Fix the login bug", repoId: 1, repo, repoName: "project", ...UNSET, branch: "owlery/fix-the-login-bug", worktree, createdAt: 1234, baseCommit, baseBranch: "main", ...NOTHING_NEW });
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
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Keys", kind: "shell", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated");
    expect(Object.keys(created).sort()).toEqual(["requestId", "session", "type", "workItem"]);
    expect(Object.keys(created.workItem).sort()).toEqual(WORK_ITEM_FIELDS);
    expect(Object.keys(created.session).sort()).toEqual(SESSION_FIELDS);
    expect(Object.keys(created.workItem.changes!).sort()).toEqual(["added", "files", "list", "removed"]);
    // A commit, so that the lists carry one and a changed file.
    writeFileSync(join(created.workItem.worktree, "one.txt"), "one\n");
    git(created.workItem.worktree, "add", "one.txt");
    git(created.workItem.worktree, "commit", "--quiet", "-m", "add one");
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.commits?.length === 1);
    // A look, so that `ready` carries one; the `attach` after it is answered once the daemon has handled both.
    c.send({ type: "looked" });
    c.send({ type: "attach", id: created.session.id });
    await c.message("replay");
    const ready = await (await client(url)).message("ready");
    expect(Object.keys(ready).sort()).toEqual(["archived", "headless", "lastLook", "paneKinds", "repositories", "sessions", "type", "workItems"]);
    expect(Object.keys(ready.repositories[0]!).sort()).toEqual(["customName", "defaultBase", "folder", "groups", "hidden", "icon", "id", "name"]);
    expect(Object.keys(ready.lastLook!).sort()).toEqual(["at", "sessions", "workItems"]);
    expect(Object.keys(ready.paneKinds[0]!).sort()).toEqual(["continues", "kind", "label", "reportsState"]);
    expect(Object.keys(inbox).sort()).toEqual(["archived", "repositories", "sessions", "type", "workItems"]);
    for (const lists of [inbox, ready, ready.lastLook!]) {
      expect(Object.keys(lists.sessions[0]!).sort()).toEqual(SESSION_FIELDS);
      const workItem = lists.workItems[0]!;
      expect(Object.keys(workItem).sort()).toEqual(WORK_ITEM_FIELDS);
      expect(Object.keys(workItem.commits![0]!).sort()).toEqual(["added", "at", "hash", "removed", "subject"]);
      expect(Object.keys(workItem.changes!).sort()).toEqual(["added", "files", "list", "removed"]);
      expect(Object.keys(workItem.changes!.list[0]!).sort()).toEqual(["added", "path", "removed"]);
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
      return [workItem.baseBranch, workItem.baseCommit, workItem.aheadOfBase];
    };
    expect(await create(1, "feature")).toEqual(["feature", feature, 0]);
    expect(await create(2, "origin/remote-only")).toEqual(["origin/remote-only", remoteOnly, 0]);
    expect(await create(3, "origin/shadow")).toEqual(["origin/shadow", feature, 0]);
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
    expect(planned).toEqual({ type: "workItemPlan", requestId: 2, branch: "owlery/fix-the-login-bug-2", worktree: join(root, "project", "fix-the-login-bug-2"), localBases: ["main", "owlery/fix-the-login-bug"], remoteBases: [], defaultBase: "main" });
    expect(Object.keys(planned).sort()).toEqual(["branch", "defaultBase", "localBases", "remoteBases", "requestId", "type", "worktree"]);
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
      { id: 4, folder: "/r/docs", name: "docs", customName: null, icon: "D", defaultBase: "origin/main", hidden: true, groups: [{ id: 3, name: "Later" }] },
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
    const roleAdapter: RoleAdapter = { name: slow.name, features: slow.features, start: async (options, listener) => { const run = await (options.prompt === "Quick?" ? quick : slow).start(options, listener); return { stop: () => { stopped++; run.stop(); } }; } };
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
    const roleAdapter: RoleAdapter = { name: inner.name, features: inner.features, start: async (options, listener) => { await new Promise((r) => setTimeout(r, 300)); const run = await inner.start(options, listener); return { stop: () => { stopped++; run.stop(); } }; } };
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
    expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.state === "failed" ? [m.headless.error] : []))).toEqual(["ended when a removal of its repository began"]);
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
    const roleAdapter: RoleAdapter = { name: slow.name, features: slow.features, start: async (options, listener) => { const run = await (options.prompt === "Quick?" ? quick : slow).start(options, listener); return { stop: () => { stopped++; run.stop(); } }; } };
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
    const failed = { ...headless, state: "failed", error: "ended when the work item was archived" };
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
    expect([still.workItems.map((w) => w.id), still.sessions.map((s) => [s.id, s.alive]), still.headless]).toEqual([[workItem.id], [[session.id, false]], [{ ...headless, state: "failed", error: "ended when a delete of its work item began" }]]);
    // The loss the person reads next names the file, and a delete with its stamp needs the force.
    const next = await lossOf(c, workItem.id);
    expect(next.untracked).toEqual(["late.txt"]);
    c.send({ type: "deleteWorkItem", requestId: 3, id: workItem.id, stamp: next.stamp, force: false, running: NONE_RUNNING });
    expect(await c.message("error", (m) => m.requestId === 3)).toEqual({ type: "error", requestId: 3, message: UNFORCED });
    c.send({ type: "deleteWorkItem", requestId: 4, id: workItem.id, stamp: next.stamp, force: true, running: NONE_RUNNING });
    await c.message("done", (m) => m.requestId === 4);
    expect([existsSync(workItem.worktree), (await (await client(url)).message("ready")).headless]).toEqual([false, []]);
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
    expect(last.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "finished", stateSince: expect.any(Number), stateText: null, stateTool: null }]);
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
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: 1, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null }]);
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
    const ended = { id: session.id, kind: "claude", alive: false, workItemId: 1, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null };
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
    /** Waits until the daemon has read the counts three more times. A read runs `rev-list` twice: for the commits since the cut, and for the commits ahead of the base branch. */
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

  it("tells every client how far a work item's branch is ahead of its base branch: not by the commits the base gained and the branch merged in, and by none once the base holds the branch", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect([workItem.baseBranch, workItem.aheadOfBase]).toEqual(["main", 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.aheadOfBase, m.workItems[0]?.newCommits];
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m).join() === "1,1");
    commit(repo, "on-main.txt");
    git(workItem.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    // Three commits since the cut: the branch's own, the base's and the merge. The base holds its own.
    await c.message("inbox", (m) => counts(m).join() === "2,3");
    git(repo, "merge", "--quiet", "--ff-only", workItem.branch);
    // The branch's head and its count stay, and the inbox is for the base that moved.
    await c.message("inbox", (m) => counts(m).join() === "0,3");
  });

  it("tells every client how far a work item's branch is ahead of a remote's branch: by its own commit, by none once a fetch brought that commit to the remote's branch, and by no count once a fetch pruned it", async () => {
    const { repo, origin, root } = clone();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Ahead of the remote", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await c.message("workItemCreated");
    expect([workItem.baseBranch, workItem.aheadOfBase]).toEqual(["origin/main", 0]);
    const counts = (m: Inbox) => [m.workItems[0]?.baseBranch, m.workItems[0]?.aheadOfBase, m.workItems[0]?.newCommits].join();
    commit(workItem.worktree, "own.txt");
    await c.message("inbox", (m) => counts(m) === "origin/main,1,1");
    git(origin, "pull", "--quiet", "--ff-only", repo, workItem.branch);
    git(repo, "fetch", "--quiet", "origin");
    await c.message("inbox", (m) => counts(m) === "origin/main,0,1");
    git(origin, "checkout", "--quiet", "-b", "renamed");
    git(origin, "branch", "--quiet", "-D", "main");
    git(repo, "fetch", "--quiet", "--prune", "origin");
    await c.message("inbox", (m) => counts(m) === "origin/main,,1");
  });

  it("gives a work item cut from no branch, and one whose base branch is gone, no count of commits ahead", async () => {
    const { repo, root } = repository();
    git(repo, "checkout", "--quiet", "--detach");
    // No local branch and no remote: the repository has no default base.
    git(repo, "branch", "--quiet", "-D", "main");
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "From a commit", kind: "shell", cols: 80, rows: 24 });
    const detached = (await c.message("workItemCreated", (m) => m.requestId === 1)).workItem;
    expect([detached.baseBranch, detached.aheadOfBase]).toEqual([null, null]);
    git(repo, "checkout", "--quiet", "-b", "feature");
    c.send({ type: "createWorkItem", requestId: 2, repo, title: "From a feature", kind: "shell", cols: 80, rows: 24 });
    const cut = (await c.message("workItemCreated", (m) => m.requestId === 2)).workItem;
    expect([cut.baseBranch, cut.aheadOfBase]).toEqual(["feature", 0]);
    commit(detached.worktree, "one.txt");
    git(repo, "checkout", "--quiet", "--detach");
    git(repo, "branch", "--quiet", "-D", "feature");
    const inbox = await c.message("inbox", (m) => m.workItems[1]?.aheadOfBase === null && m.workItems[0]?.newCommits === 1);
    expect(inbox.workItems.map((w) => [w.baseBranch, w.aheadOfBase, w.newCommits])).toEqual([[null, null, 1], ["feature", null, 0]]);
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
    expect(gone.workItems).toEqual([{ ...workItem, aheadOfBase: null, newCommits: null, commits: null, changes: null }]);
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
    const { url } = await daemonWithWorkItem({ runDir, worktreesRoot: made.root, readyWaitMs: 5000 });
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
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working", stateSince: 1234, stateText: null, stateTool: null }], workItems: [workItem] });
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "waiting", stateSince: 1234, stateText: null, stateTool: "Bash" }]);
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
    expect(await lookNow(url)).toEqual({ at: 1234, sessions: [], workItems: [{ ...workItem, repoId: 1, repoName: "project", ...UNSET, aheadOfBase: 1, newCommits: 1, commits: [expect.objectContaining({ subject: "one" })], changes: { files: 0, added: 0, removed: 0, list: [] } }] });
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
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working", stateSince: 1234, stateText: null, stateTool: null }], workItems: [workItem] });
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
    const seen = { started: [] as { prompt: string; cwd: string }[], stopped: 0 };
    const adapter: RoleAdapter = {
      name: inner.name,
      features: inner.features,
      start: async (options, listener) => {
        seen.started.push(options);
        const run = await inner.start(options, listener);
        return {
          stop: () => {
            seen.stopped++;
            run.stop();
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
    const working = { id: 1, workItemId: workItem.id, prompt: "Which owl?", state: "working", answer: "", error: null, costUsd: null, startedAt: 1234 };
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

  it("carries the cost the adapter reports, takes the result's text as the whole answer, and nothing after it", async () => {
    const roleAdapter: RoleAdapter = {
      name: "priced",
      features: [],
      start: (_options, listener) => {
        setTimeout(() => {
          listener({ type: "text", text: "Let me look. " });
          listener({ type: "text", text: "An owl." });
          listener({ type: "result", text: "An owl.", isError: false, costUsd: 0.25 });
          listener({ type: "text", text: " And more." });
          listener({ type: "exit", exitCode: 0 });
        }, 0);
        return Promise.resolve({ stop: () => {} });
      },
    };
    const { c, workItem } = await withWorkItem({ roleAdapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const { headless } = await c.message("headless", (m) => m.headless.state === "finished");
    expect(headless).toMatchObject({ answer: "An owl.", costUsd: 0.25, error: null });
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
      expect(headless).toMatchObject({ id: 1, state: "failed", answer: "", error: "the fake adapter was told not to start", costUsd: null });
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
    expect(headless).toEqual({ id: 1, workItemId: workItem.id, prompt: "Remembered?", state: "finished", answer: 'You asked: "Remembered?"', error: null, costUsd: null, startedAt: 1234 });
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

  it("carries only the fields the protocol names, the adapter's name not among them", async () => {
    const { c, url, workItem } = await withWorkItem();
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "Q" });
    const asked = await c.message("asked");
    const changed = await c.message("headless", (m) => m.headless.state === "finished");
    const ready = await (await client(url)).message("ready");
    const fields = ["answer", "costUsd", "error", "id", "prompt", "startedAt", "state", "workItemId"];
    expect(Object.keys(asked).sort()).toEqual(["headless", "requestId", "type"]);
    expect(Object.keys(changed).sort()).toEqual(["headless", "type"]);
    for (const info of [asked.headless, changed.headless, ready.headless[0]!]) expect(Object.keys(info).sort()).toEqual(fields);
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

  it("stops every run still going when the daemon closes", async () => {
    const { adapter, seen } = watched(fakeAdapter({ delayMs: 5000 }));
    const { daemon: d, c, workItem } = await withWorkItem({ roleAdapter: adapter });
    c.send({ type: "ask", requestId: 1, workItemId: workItem.id, prompt: "One" });
    c.send({ type: "ask", requestId: 2, workItemId: workItem.id, prompt: "Two" });
    await c.message("asked", (m) => m.requestId === 2);
    await pause(20);
    expect(seen.stopped).toBe(0);
    await d.close();
    expect(seen.stopped).toBe(2);
  });

  it("stops a run that starts only after the daemon closed", async () => {
    const inner = fakeAdapter({ delayMs: 5000 });
    let stopped = 0;
    const roleAdapter: RoleAdapter = {
      name: "slow",
      features: [],
      start: async (options, listener) => {
        await pause(150);
        const run = await inner.start(options, listener);
        return {
          stop: () => {
            stopped++;
            run.stop();
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
    expect(Object.keys(await c.message("ready")).sort()).toEqual(["archived", "headless", "lastLook", "paneKinds", "repositories", "sessions", "type", "workItems"]);
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
