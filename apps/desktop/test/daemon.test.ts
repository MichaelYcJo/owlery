import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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
import type { HeadlessInfo, ServerMessage } from "../src/shared/protocol";
import { git, temporaryRepository } from "./repositories";

const TOKEN = "t".repeat(64);
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
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: null, state: null }]);
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

  it("tells every client when a session ends, and lists it as ended", async () => {
    const { url } = await daemon({ commandFor: () => ({ command: "/bin/sh", args: ["-c", "exit 3"], env: {} }) });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "start", kind: "shell", cols: 80, rows: 24, requestId: 1 });
    const { session } = await c.message("started");
    const exit = await c.message("exit");
    expect(exit).toEqual({ type: "exit", id: session.id, exitCode: 3 });
    const later = await client(url);
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "shell", alive: false, workItemId: null, state: null }]);
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
    expect(created.workItem).toEqual({ id: 1, title: "Fix the login bug", repo, branch: "owlery/fix-the-login-bug", worktree, createdAt: 1234, baseCommit, newCommits: 0 });
    expect(created.session).toEqual({ id: created.session.id, kind: "claude", alive: true, workItemId: 1, state: null });
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
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Keys", kind: "shell", cols: 80, rows: 24 });
    const created = await c.message("workItemCreated");
    expect(Object.keys(created).sort()).toEqual(["requestId", "session", "type", "workItem"]);
    expect(Object.keys(created.workItem).sort()).toEqual(["baseCommit", "branch", "createdAt", "id", "newCommits", "repo", "title", "worktree"]);
    expect(Object.keys(created.session).sort()).toEqual(["alive", "id", "kind", "state", "workItemId"]);
    // A look, so that `ready` carries one; the `attach` after it is answered once the daemon has handled both.
    c.send({ type: "looked" });
    c.send({ type: "attach", id: created.session.id });
    await c.message("replay");
    const ready = await (await client(url)).message("ready");
    expect(Object.keys(ready).sort()).toEqual(["headless", "lastLook", "paneKinds", "sessions", "type", "workItems"]);
    expect(Object.keys(ready.lastLook!).sort()).toEqual(["at", "sessions", "workItems"]);
    expect(Object.keys(ready.lastLook!.workItems[0]!).sort()).toEqual(["baseCommit", "branch", "createdAt", "id", "newCommits", "repo", "title", "worktree"]);
    expect(Object.keys(ready.lastLook!.sessions[0]!).sort()).toEqual(["alive", "id", "kind", "state", "workItemId"]);
    expect(Object.keys(ready.paneKinds[0]!).sort()).toEqual(["kind", "label", "reportsState"]);
    const inbox = await c.message("inbox");
    expect(Object.keys(inbox).sort()).toEqual(["sessions", "type", "workItems"]);
    expect(Object.keys(inbox.workItems[0]!).sort()).toEqual(["baseCommit", "branch", "createdAt", "id", "newCommits", "repo", "title", "worktree"]);
    expect(Object.keys(inbox.sessions[0]!).sort()).toEqual(["alive", "id", "kind", "state", "workItemId"]);
    expect(Object.keys(ready.workItems[0]!).sort()).toEqual(["baseCommit", "branch", "createdAt", "id", "newCommits", "repo", "title", "worktree"]);
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

  it("answers a creation whose fields are not the protocol's with an error, and stays up", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 4, repo, title: 7, kind: "shell", cols: 80, rows: 24 });
    expect(await c.message("error")).toEqual({ type: "error", requestId: 4, message: "a work item needs a repository folder and a title" });
    expect(existsSync(root)).toBe(false);
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
    await first.close();
    expect(statSync(join(runDir, "work-items.json")).mode & 0o777).toBe(0o600);

    const { url } = await daemon({ runDir, worktreesRoot: root });
    const ready = await (await client(url)).message("ready");
    // The count is read again by the daemon that starts, so `ready` carries none yet.
    expect(ready.workItems).toEqual([{ ...workItem, newCommits: null }]);
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
    expect(session).toEqual({ id: session.id, kind: "shell", alive: true, workItemId: workItem.id, state: null });
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
    expect(last.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "finished" }]);
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
    expect((await later.message("ready")).sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: null, state: "waiting" }]);
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
    const ended = { id: session.id, kind: "claude", alive: false, workItemId: null, state: "waiting" };
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
    // The pane is gone from the lists, so nothing says later that it ended.
    await pause(200);
    expect(c.messages.filter((m) => m.type === "exit")).toEqual([]);
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

  it("shows a commit made in a work item's worktree as one new commit, and no agent state for its shell pane", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 40 });
    const c = await client(url);
    await c.message("ready");
    c.send({ type: "createWorkItem", requestId: 1, repo, title: "Committed to", kind: "shell", cols: 80, rows: 24 });
    const { workItem, session } = await c.message("workItemCreated");
    expect(workItem.newCommits).toBe(0);
    commit(workItem.worktree, "one.txt");
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
    expect(inbox.workItems).toEqual([{ ...workItem, newCommits: 1 }]);
    expect(inbox.sessions).toEqual([{ ...session, state: null }]);
    commit(workItem.worktree, "two.txt");
    await c.message("inbox", (m) => m.workItems[0]?.newCommits === 2);
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

  it("reads the counts only while a client is connected, and again once one connects", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 20 });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "createWorkItem", requestId: 1, repo, title: "Unwatched", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await first.message("workItemCreated");
    first.socket.close();
    await pause(100);
    commit(workItem.worktree, "one.txt");
    await pause(200);
    const second = await client(url);
    // Nothing read the branch while nobody was connected, so `ready` carries the count last read.
    expect((await second.message("ready")).workItems[0]?.newCommits).toBe(0);
    await second.message("inbox", (m) => m.workItems[0]?.newCommits === 1);
  });

  it("reads the counts at most once per interval, however often clients come and go", async () => {
    const { repo, root } = repository();
    const { url } = await daemon({ worktreesRoot: root, commitPollMs: 60_000 });
    const first = await client(url);
    await first.message("ready");
    first.send({ type: "createWorkItem", requestId: 1, repo, title: "Read once", kind: "shell", cols: 80, rows: 24 });
    const { workItem } = await first.message("workItemCreated");
    first.socket.close();
    await pause(100);
    commit(workItem.worktree, "one.txt");
    const second = await client(url);
    await second.message("ready");
    await pause(300);
    expect(inboxes(second)).toEqual([]);
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
    expect((await c.message("ready")).workItems.map((w) => [w.baseCommit, w.newCommits])).toEqual([[null, null], [after.baseCommit, null]]);
    const inbox = await c.message("inbox", (m) => m.workItems[1]?.newCommits === 1);
    expect(inbox.workItems[0]).toMatchObject({ id: 1, baseCommit: null, newCommits: null });
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
    d.agentEvent(session.id, "PermissionRequest", {});
    await c.message("inbox", (m) => stateOf(m, session.id) === "waiting");
    const ready = await (await client(url)).message("ready");
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working" }], workItems: [workItem] });
    expect(ready.sessions).toEqual([{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "waiting" }]);
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
    expect(ready.lastLook).toEqual({ at: 1234, sessions: [{ id: session.id, kind: "claude", alive: true, workItemId: workItem.id, state: "working" }], workItems: [workItem] });
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
  it("keeps the most recent output up to its size", () => {
    const buffer = new OutputBuffer(10);
    buffer.append("abcdef");
    buffer.append("ghijkl");
    expect(buffer.text()).toBe("cdefghijkl");
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

  it("reads nothing where no daemon has written", () => {
    const dir = mkdtempSync(join(tmpdir(), "owlery-discovery-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    expect(readDiscovery(dir)).toBeUndefined();
  });
});
