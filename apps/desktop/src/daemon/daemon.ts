import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { type ClientMessage, type PaneKind, type PaneKindInfo, type ServerMessage, type SessionInfo, UNAUTHORIZED, type WorkItem } from "../shared/protocol";
import { agentEventFor } from "./agent-events";
import { agentStateAfter } from "./agent-state";
import { OutputBuffer } from "./buffer";
import { WorkItemList } from "./work-items";
import { createWorktree, newCommits, worktreesRoot } from "./worktrees";

export interface PaneCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface DaemonOptions {
  token: string;
  /** The kinds of pane a client may open, as `ready` offers them. */
  paneKinds: readonly PaneKindInfo[];
  /** The command of a new pane of that kind, given the pane's id. */
  commandFor: (kind: PaneKind, id: number) => PaneCommand;
  /** Where a pane opened without a work item runs. */
  cwd?: string;
  /** Where the list of work items is kept, in `work-items.json`; without it the list is in memory alone. */
  runDir?: string;
  /** Where worktrees are made; `worktreesRoot` of the daemon's environment when absent. */
  worktreesRoot?: string;
  /** The clock a work item's `createdAt` is read from. */
  now?: () => number;
  /** How long the daemon waits between two reads of the work items' new commits. */
  commitPollMs?: number;
  /** How much recent output each session keeps for a client that reconnects. */
  bufferChars?: number;
  /** How long a client has to present the token. */
  helloTimeoutMs?: number;
  /** How long the daemon waits, with no session alive and no client connected, before it asks to exit. */
  idleExitMs?: number;
  onIdle?: () => void;
}

interface Session {
  info: SessionInfo;
  terminal: TerminalSession;
  output: OutputBuffer;
}

/**
 * Owns the terminal sessions and their output, and outlives the window. A
 * client reaches it over WebSocket on the loopback address and is refused
 * unless its first message carries the token.
 */
export class Daemon {
  private readonly sessions = new Map<number, Session>();
  // Each client, with the sessions whose output it receives: the ones it opened or attached.
  private readonly clients = new Map<WebSocket, Set<number>>();
  private server: WebSocketServer | undefined;
  private nextId = 1;
  private idleTimer: NodeJS.Timeout | undefined;
  private readonly workItems: WorkItemList;
  // Creations run one after another, so two of one title never pick the same branch and folder.
  private creating: Promise<void> = Promise.resolve();
  // The new commits last read for each work item, by its id; the list itself does not store them.
  private readonly commitCounts = new Map<number, number | null>();
  private commitTimer: NodeJS.Timeout | undefined;
  private commitsReadAt = 0;
  private readingCommits = false;
  private closed = false;

  constructor(private readonly options: DaemonOptions) {
    this.workItems = new WorkItemList(options.runDir, options.now);
  }

  listen(port: number): Promise<number> {
    const server = new WebSocketServer({ host: "127.0.0.1", port });
    this.server = server;
    server.on("connection", (socket) => this.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", () => {
        this.checkIdle();
        resolve((server.address() as AddressInfo).port);
      });
    });
  }

  address(): string | undefined {
    return (this.server?.address() as AddressInfo | undefined)?.address;
  }

  /**
   * Delivers an agent's event for a pane to every client, as a neutral event,
   * and keeps the state it leaves the pane's session in.
   */
  agentEvent(paneId: number, hookName: string, payload: Record<string, unknown>): void {
    const event = agentEventFor(hookName);
    if (!event) return;
    const tool = typeof payload.tool_name === "string" ? payload.tool_name : null;
    this.broadcast({ type: "agent", id: paneId, event, tool, at: Date.now() });
    const session = this.sessions.get(paneId);
    if (!session || !this.reportsState(session.info.kind)) return;
    const state = agentStateAfter(event);
    if (state === session.info.state) return;
    session.info.state = state;
    this.broadcastInbox();
  }

  async close(): Promise<void> {
    this.closed = true;
    clearTimeout(this.commitTimer);
    clearTimeout(this.idleTimer);
    for (const session of this.sessions.values()) if (session.info.alive) session.terminal.kill();
    for (const client of this.clients.keys()) client.terminate();
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  private accept(socket: WebSocket): void {
    let authorized = false;
    const helloTimer = setTimeout(() => socket.close(UNAUTHORIZED, "unauthorized"), this.options.helloTimeoutMs ?? 2000);
    socket.on("message", (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(String(raw)) as ClientMessage;
      } catch {
        socket.close(UNAUTHORIZED, "unauthorized");
        return;
      }
      if (!authorized) {
        clearTimeout(helloTimer);
        if (message.type !== "hello" || !this.tokenMatches(message.token)) {
          socket.close(UNAUTHORIZED, "unauthorized");
          return;
        }
        authorized = true;
        this.clients.set(socket, new Set());
        this.checkIdle();
        this.send(socket, { type: "ready", sessions: this.sessionList(), workItems: this.workItemList(), paneKinds: [...this.options.paneKinds] });
        this.scheduleCommitRead();
        return;
      }
      this.handle(socket, message);
    });
    socket.on("close", () => {
      clearTimeout(helloTimer);
      this.clients.delete(socket);
      this.checkIdle();
    });
    socket.on("error", () => socket.terminate());
  }

  private handle(socket: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case "start": {
        let cwd = this.options.cwd ?? process.cwd();
        if (message.workItemId !== undefined) {
          const workItem = this.workItems.get(message.workItemId);
          if (!workItem) {
            this.send(socket, { type: "error", requestId: message.requestId, message: `no work item ${String(message.workItemId)}` });
            return;
          }
          // A person can remove a worktree's folder by hand, and a process cannot start in it.
          if (!existsSync(workItem.worktree)) {
            this.send(socket, { type: "error", requestId: message.requestId, message: `the folder of work item ${workItem.id} is gone: ${workItem.worktree}` });
            return;
          }
          cwd = workItem.worktree;
        }
        const info = this.startSession(socket, message, cwd, message.workItemId ?? null);
        // The answer first, so the client that asked knows the pane as its own when the inbox lists it.
        this.send(socket, { type: "started", requestId: message.requestId, session: info });
        this.broadcastInbox();
        return;
      }
      case "createWorkItem": {
        const create = async (): Promise<void> => {
          try {
            if (typeof message.repo !== "string" || typeof message.title !== "string") throw new Error("a work item needs a repository folder and a title");
            const place = await createWorktree({ folder: message.repo, title: message.title, root: this.options.worktreesRoot ?? worktreesRoot(process.env) });
            const stored = this.workItems.add({ title: message.title, ...place });
            // The branch was cut at its base commit a moment ago.
            this.commitCounts.set(stored.id, 0);
            const workItem: WorkItem = { ...stored, newCommits: 0 };
            const session = this.startSession(socket, message, workItem.worktree, workItem.id);
            this.send(socket, { type: "workItemCreated", requestId: message.requestId, workItem, session });
            this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        this.creating = this.creating.then(create);
        return;
      }
      case "attach": {
        const session = this.sessions.get(message.id);
        if (!session) return;
        // The replay holds everything printed before this point and live output follows it,
        // so the client draws each line once.
        this.send(socket, { type: "replay", id: message.id, data: session.output.text() });
        this.clients.get(socket)?.add(message.id);
        return;
      }
      case "close": {
        const session = this.sessions.get(message.id);
        if (!session) return;
        // Off the lists first, so the process's end is told to nobody as a session's.
        this.sessions.delete(message.id);
        if (session.info.alive) session.terminal.kill();
        this.broadcastInbox();
        this.checkIdle();
        return;
      }
      case "input":
        this.sessions.get(message.id)?.terminal.write(message.data);
        return;
      case "resize":
        this.sessions.get(message.id)?.terminal.resize(message.cols, message.rows);
        return;
      default:
        return;
    }
  }

  /** Starts a pane's process in `cwd`, and sends its output to the client that asked for it. */
  private startSession(socket: WebSocket, pane: { kind: PaneKind; cols: number; rows: number }, cwd: string, workItemId: number | null): SessionInfo {
    const id = this.nextId++;
    const { command, args, env } = this.options.commandFor(pane.kind, id);
    const terminal = TerminalSession.spawn({
      command,
      args,
      cwd,
      cols: pane.cols,
      rows: pane.rows,
      env: { ...process.env, ...env },
    });
    const session: Session = { info: { id, kind: pane.kind, alive: true, workItemId, state: null }, terminal, output: new OutputBuffer(this.options.bufferChars ?? 256 * 1024) };
    this.sessions.set(id, session);
    terminal.onData((data) => {
      session.output.append(data);
      this.sendOutput(id, data);
    });
    terminal.onExit((exitCode) => {
      session.info.alive = false;
      // A closed pane is on no list, and its end is no client's news.
      if (this.sessions.get(id) === session) {
        this.broadcast({ type: "exit", id, exitCode });
        this.broadcastInbox();
      }
      this.checkIdle();
    });
    this.clients.get(socket)?.add(id);
    this.checkIdle();
    return session.info;
  }

  private tokenMatches(token: unknown): boolean {
    if (typeof token !== "string") return false;
    const given = Buffer.from(token);
    const expected = Buffer.from(this.options.token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  private reportsState(kind: PaneKind): boolean {
    return this.options.paneKinds.some((offered) => offered.kind === kind && offered.reportsState);
  }

  private sessionList(): SessionInfo[] {
    return [...this.sessions.values()].map((s) => s.info);
  }

  private workItemList(): WorkItem[] {
    return this.workItems.all().map((item) => ({ ...item, newCommits: this.commitCounts.get(item.id) ?? null }));
  }

  /** Sends every client the whole of both lists, after either changed. */
  private broadcastInbox(): void {
    this.broadcast({ type: "inbox", sessions: this.sessionList(), workItems: this.workItemList() });
  }

  /**
   * Arranges the next read of the work items' new commits, at once where the
   * last one is an interval old. The reads follow one another while a client
   * is connected, and the next client to connect starts them again.
   */
  private scheduleCommitRead(): void {
    if (this.closed || this.commitTimer !== undefined || this.readingCommits) return;
    const interval = this.options.commitPollMs ?? 3000;
    const wait = Math.max(0, this.commitsReadAt + interval - Date.now());
    this.commitTimer = setTimeout(() => {
      this.commitTimer = undefined;
      // Nobody reads the counts while no client is connected.
      if (this.clients.size === 0) return;
      this.commitsReadAt = Date.now();
      this.readingCommits = true;
      void this.readCommits().finally(() => {
        this.readingCommits = false;
        this.scheduleCommitRead();
      });
    }, wait);
  }

  /** Reads each work item's new commits from git, and tells every client where a count changed. */
  private async readCommits(): Promise<void> {
    let changed = false;
    await Promise.all(
      this.workItems.all().map(async (item) => {
        // A work item from before the base commit was recorded has nothing to count from.
        if (item.baseCommit === null) return;
        const count = await newCommits(item.repo, item.branch, item.baseCommit);
        if (count === (this.commitCounts.get(item.id) ?? null)) return;
        this.commitCounts.set(item.id, count);
        changed = true;
      }),
    );
    if (changed && !this.closed) this.broadcastInbox();
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    socket.send(JSON.stringify(message));
  }

  private broadcast(message: ServerMessage): void {
    const text = JSON.stringify(message);
    for (const client of this.clients.keys()) client.send(text);
  }

  private sendOutput(id: number, data: string): void {
    const text = JSON.stringify({ type: "output", id, data } satisfies ServerMessage);
    for (const [client, sessions] of this.clients) if (sessions.has(id)) client.send(text);
  }

  private checkIdle(): void {
    clearTimeout(this.idleTimer);
    const busy = this.clients.size > 0 || [...this.sessions.values()].some((s) => s.info.alive);
    if (busy || !this.options.onIdle) return;
    this.idleTimer = setTimeout(() => this.options.onIdle?.(), this.options.idleExitMs ?? 60_000);
  }
}
