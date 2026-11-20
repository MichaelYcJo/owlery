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
import { readDiscovery, writeDiscovery } from "../src/daemon/discovery";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { createWorktree } from "../src/daemon/worktrees";
import { generateName } from "../src/shared/names";
import type { HeadlessInfo, ServerMessage } from "../src/shared/protocol";
import { commitFile, git, temporaryClone, temporaryRepository } from "./repositories";

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
 * `git worktree` waits until `release`, and every other command runs at once.
 */
function heldGit(base: string): { release: () => void } {
  const bin = join(base, "held-bin");
  const released = join(base, "git-released");
  const path = process.env.PATH ?? "";
  mkdirSync(bin);
  writeFileSync(join(bin, "git"), `#!/bin/sh\nif [ "$1" = worktree ]; then while [ ! -e '${released}' ]; do sleep 0.02; done; fi\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
  process.env.PATH = `${bin}:${path}`;
  const release = (): void => {
    writeFileSync(released, "");
    process.env.PATH = path;
  };
  cleanups.push(release);
  return { release };
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
    const { url } = await daemon();
    const c = await client(url, null);
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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
    const { url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 7 });
    const started = await c.message("started", (m) => m.requestId === 7);
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === started.session.id && m.data.includes("first")) ? true : undefined));
  });

  it("keeps a session alive when its client leaves, and replays the output the client missed", async () => {
    const { url } = await daemon();
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 1 });
    const { session } = await first.message("started");
    await first.until(() => (first.messages.some((m) => m.type === "output" && m.data.includes("first")) ? true : undefined));
    first.socket.close();

    // "second" is printed while no client is connected.
    await new Promise((r) => setTimeout(r, 500));
    const second = await client(url);
    const ready = await second.message("ready");
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: null, ...NO_STATE }]);
    second.send({ type: "attach", id: session.id });
    const replay = await second.message("replay");
    expect(replay.data).toContain("first");
    expect(replay.data).toContain("second");
  });

  it("sends a reconnecting client each line once: what it missed in the replay, the rest live", async () => {
    // Prints a numbered line every 20 ms, so lines are printed between the client's ready and its attach.
    const { url } = await daemon({
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "i=0; while [ $i -lt 40 ]; do echo line-$i; i=$((i+1)); sleep 0.02; done; sleep 30"], env: {} }),
    });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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
    const { url } = await daemon();
    const opener = await client(url);
    await opener.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    opener.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    await opener.until(() => (opener.messages.some((m) => m.type === "output" && m.data.includes("first")) ? true : undefined));
    expect(bystander.messages.filter((m) => m.type === "output")).toEqual([]);
  });

  it("sends a client that detached no further output of the session while the other client still receives it, and after its next attach a replay of what was printed meanwhile and the output after it", async () => {
    // The pane answers each line it is sent, so the case decides when it prints.
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'while read line; do echo "got-$line."; done'], env: {} }) });
    const stays = await client(url);
    await stays.message("ready");
    stays.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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

  it("ends a session's output with the exit line, on a line of its own: sent to the clients that receive the session, and last in a later replay", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "printf last; exit 3"], env: {} }) });
    const opener = await client(url);
    await opener.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    opener.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    await c.message("exit");
    // A window that shows an exited pane fits its screen and tells the size, as it does for a live one. The pseudo-terminal is closed by then.
    c.send({ type: "resize", id: session.id, cols: 100, rows: 30 });
    c.send({ type: "attach", id: session.id });
    expect((await c.message("replay")).data).toBe("\r\n[process exited with code 3]\r\n");
  });

  it("tells every client when a session ends, and lists it as ended", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    const exit = await c.message("exit");
    expect(exit).toEqual({ type: "exit", id: session.id, exitCode: 3 });
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "shell", alive: false, workItemId: null, ...NO_STATE }]);
  });

  it("gives each session's process the pane's id and the hook socket", async () => {
    const seen: number[] = [];
    const { url } = await daemon({
      commandFor: (_kind, id) => {
        seen.push(id);
        return { command: "/bin/sh", args: ["-c", 'echo "pane=$OWLERY_PANE_ID"; sleep 30'], env: { OWLERY_PANE_ID: String(id) } };
      },
    });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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
    expect(Object.keys(ready.paneKinds[0]!).sort()).toEqual(["kind", "label", "reportsState"]);
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

  it("starts a pane named no work item where it does today, the daemon's folder", async () => {
    const { base, root } = repository();
    const { url } = await daemon({ commandFor: printsItsFolder, worktreesRoot: root, cwd: base });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    expect(session.workItemId).toBeNull();
    await c.until(() => (c.messages.some((m) => m.type === "output" && m.id === session.id && m.data.includes(`cwd=${base}\r`)) ? true : undefined));
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
    // An inbox carries the same lists: a pane's start sends one.
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const inbox = await c.message("inbox");
    expect([inbox.repositories, inbox.workItems, inbox.archived]).toEqual([ready.repositories, ready.workItems, ready.archived]);
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
    expect(JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8"))).toMatchObject([{ id: 1, folder: repo, workItems: [] }]);
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

  it("offers in `ready` the kinds of pane it was given, each with its label and whether it reports state", async () => {
    const paneKinds = [{ kind: "shell" as const, label: "A shell", reportsState: false }];
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
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1 });
    const shell = (await c.message("started", (m) => m.requestId === 1)).session;
    c.send({ ...START, kind: "claude", requestId: 2 });
    const agent = (await c.message("started", (m) => m.requestId === 2)).session;
    d.agentEvent(shell.id, "UserPromptSubmit", {});
    d.agentEvent(agent.id, "UserPromptSubmit", {});
    const inbox = await c.message("inbox", (m) => stateOf(m, agent.id) === "working");
    expect(stateOf(inbox, shell.id)).toBeNull();
  });

  it("lists a session that waits as waiting to a client that connects later", async () => {
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "Notification", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    c.socket.close();
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: null, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null }]);
  });

  it("carries with a session's state the time it began, and the tool or the text the event that began it carried, until the state changes", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemon({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: null, ...NO_STATE });
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
    const { daemon: d, url } = await daemon();
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    const { daemon: d, url } = await daemon({ now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    const { url } = await daemon({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    expect(session).toEqual({ id: session.id, kind: "claude", alive: true, workItemId: null, ...NO_STATE });
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
    const { daemon: d, url } = await daemon({ ...SILENT, silentStartMs: 200 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, hook, {});
    await pause(450);
    expect((await (await client(url)).message("ready")).sessions).toEqual([session]);
    // The one inbox is the pane's start.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null]);
  });

  it("takes the waiting of a silent pane away at its session's start, and gives a prompt after it working with the prompt's time", async () => {
    let clock = 100;
    const { daemon: d, url } = await daemon({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    const { daemon: d, url } = await daemon({ ...SILENT, silentStartMs: 60, now: () => clock });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    clock = 200;
    d.agentEvent(session.id, "PermissionRequest", { tool_name: "Bash" });
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, state: "waiting", stateSince: 100, stateText: null, stateTool: null }]);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, "waiting"]);
  });

  it("keeps a silent pane of a kind that reports no state at none, and sends no inbox for its silence", async () => {
    const { url } = await daemon({ ...SILENT, silentStartMs: 60 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1 });
    const { session } = await c.message("started");
    await pause(300);
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, ...NO_STATE }]);
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null]);
  });

  it("never calls a pane waiting whose process exited before the time passed", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }), silentStartMs: 300 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    await c.message("exit");
    await pause(550);
    expect((await (await client(url)).message("ready")).sessions).toEqual([{ ...session, alive: false }]);
    // One inbox for the pane's start and one for its end.
    expect(inboxes(c).map((m) => stateOf(m, session.id))).toEqual([null, null]);
  });

  it("sends nothing for the silence of a pane a client closed before the time passed", async () => {
    // The pane's shell ignores the signal a close sends, so its end does not come before the time passes.
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; sleep 1"], env: {} }), silentStartMs: 200 });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    const { daemon: d, url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "trap '' HUP; sleep 1"], env: {} }), silentStartMs: 150, now: () => ++read });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
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
    c.send({ ...START, kind: "shell", requestId: 2 });
    await c.message("inbox", (m) => m.sessions.length === 2);
    const order = c.messages.flatMap((m) => (m.type === "workItemCreated" || m.type === "started" || m.type === "inbox" ? [m.type] : []));
    expect(order).toEqual(["workItemCreated", "inbox", "started", "inbox"]);
  });

  it("lists a session that has exited as not alive, with the state it last had, and tells every client", async () => {
    // The pane ends when its input closes or a line arrives, so the case decides when.
    const { daemon: d, url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "read line; exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "claude", requestId: 1 });
    const { session } = await c.message("started");
    d.agentEvent(session.id, "PermissionRequest", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    c.send({ type: "input", id: session.id, data: "go\n" });
    const ended = { id: session.id, kind: "claude", alive: false, workItemId: null, state: "waiting", stateSince: expect.any(Number), stateText: null, stateTool: null };
    for (const each of [c, bystander]) expect((await each.message("inbox", (m) => m.sessions[0]?.alive === false)).sessions).toEqual([ended]);
  });

  it("closes a pane: its process ends, and the session is in no later list", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", 'echo "pid=$$."; sleep 30'], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    const bystander = await client(url);
    await bystander.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1 });
    const kept = (await c.message("started", (m) => m.requestId === 1)).session;
    c.send({ ...START, kind: "shell", requestId: 2 });
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
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 0"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ ...START, kind: "shell", requestId: 1 });
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
    const { url } = await daemon({ runDir, worktreesRoot: made.root, readyWaitMs: 5000 });
    const c = await client(url);
    c.send({ ...START, kind: "shell", requestId: 1 });
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
    const { url } = await daemon({ now: () => clock });
    const one = await client(url);
    await one.message("ready");
    await looked(one);
    expect(await lookNow(url)).toEqual({ at: 100, sessions: [], workItems: [] });
    const two = await client(url);
    await two.message("ready");
    two.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await two.message("started");
    clock = 200;
    await looked(two);
    expect(await lookNow(url)).toEqual({ at: 200, sessions: [session], workItems: [] });
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
    const { url } = await daemon({ idleExitMs: 100, onIdle: () => idle++ });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
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
});
