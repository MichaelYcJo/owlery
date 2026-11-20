import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { basename } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { isKeepAwakeChoice } from "../shared/keep-awake";
import { type Changes, type ClientMessage, type CommitInfo, type HeadlessInfo, type KeepAwake, type PaneKind, type PaneKindInfo, type ServerMessage, type SessionInfo, UNAUTHORIZED, type WorkItem } from "../shared/protocol";
import type { RoleAdapter, RoleEvent, RoleRun } from "./adapters/adapter";
import { agentEventFor, agentSaid } from "./agent-events";
import { agentStateAfter } from "./agent-state";
import { OutputBuffer } from "./buffer";
import { type HoldAwake, KeepAwakeStore, wantsAwake } from "./keep-awake";
import { LastLook } from "./last-look";
import { type StoredWorkItem, WorkItemList } from "./work-items";
import { aheadOf, branchChanges, branchCommits, branchHead, createWorktree, newCommits, planWorktree, worktreesRoot } from "./worktrees";

/** How much of a state's text the daemon keeps. */
const STATE_TEXT_CHARS = 2000;

/** The first `STATE_TEXT_CHARS` characters of a text, less a half of a character the cut would leave at its end. */
function cutText(text: string | null): string | null {
  if (text === null || text.length <= STATE_TEXT_CHARS) return text;
  const last = text.charCodeAt(STATE_TEXT_CHARS - 1);
  // A character outside the basic plane is two of a string's, and the first of the two alone is no character.
  return text.slice(0, last >= 0xd800 && last <= 0xdbff ? STATE_TEXT_CHARS - 1 : STATE_TEXT_CHARS);
}

/** Refuses the fields that name a work item, in a creation and in a plan, where they are not the protocol's. An empty title is one of the protocol's. */
function checkNaming(message: { repo: unknown; title: unknown; name?: unknown }): void {
  if (typeof message.repo !== "string" || typeof message.title !== "string") throw new Error("a work item needs a repository folder and a title");
  if (message.name !== undefined && typeof message.name !== "string") throw new Error("a work item's name, where one is sent, is a string");
}

/** How long a pane's silent start lasts where the options name no time. */
const SILENT_START_MS = 10_000;

export interface PaneCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface DaemonOptions {
  token: string;
  /** The kinds of pane a client may open, as `ready` offers them. */
  paneKinds: readonly PaneKindInfo[];
  /** The command of a new pane of that kind, given the pane's id and whether the pane starts on the latest conversation of its folder. */
  commandFor: (kind: PaneKind, id: number, start: { continueLatest: boolean }) => PaneCommand;
  /** The adapter every headless session is started through. */
  roleAdapter: RoleAdapter;
  /** Where a pane opened without a work item runs. */
  cwd?: string;
  /** Where the list of work items is kept, in `work-items.json`, the last look, in `last-look.json`, and the choice of when to keep the Mac awake, in `keep-awake.json`; without it all three are in memory alone. */
  runDir?: string;
  /** How the daemon holds the Mac awake. A daemon given none holds nothing, sends no `keepAwake` and takes no choice. */
  holdAwake?: HoldAwake;
  /** Where worktrees are made; `worktreesRoot` of the daemon's environment when absent. */
  worktreesRoot?: string;
  /** The source of randomness a work item nobody named is named from; `Math.random` when absent. */
  random?: () => number;
  /** The clock a work item's `createdAt`, a headless session's `startedAt`, a look's `at` and a session's `stateSince` are read from. */
  now?: () => number;
  /** How long the daemon waits between two reads of the work items' new commits, apart from the read each hello starts. */
  commitPollMs?: number;
  /** How long a hello's answer waits for the read of the work items' new commits. It stays under the second the app gives a daemon to answer (`answers` of src/main/daemon-client.ts). */
  readyWaitMs?: number;
  /** How long a pane of a kind that reports state may send no event after its start before it is listed as waiting; 10 seconds when absent. */
  silentStartMs?: number;
  /** How much recent output each session keeps for a client that reconnects. */
  bufferChars?: number;
  /** How long a client has to present the token. */
  helloTimeoutMs?: number;
  /** How long the daemon waits, with no session alive, no headless session working and no client connected, before it asks to exit. */
  idleExitMs?: number;
  onIdle?: () => void;
}

interface Session {
  info: SessionInfo;
  terminal: TerminalSession;
  output: OutputBuffer;
  /** The wait for the first event of a pane whose kind reports state. That event, the pane's end and the daemon's close each cancel it. */
  silentStart: NodeJS.Timeout | undefined;
}

interface HeadlessSession {
  info: HeadlessInfo;
  /** The adapter's run, once it has started. */
  run: RoleRun | undefined;
}

/**
 * Owns the terminal sessions and their output, and the headless sessions and
 * their answers, and outlives the window. A
 * client reaches it over WebSocket on the loopback address and is refused
 * unless its first message carries the token.
 */
export class Daemon {
  private readonly sessions = new Map<number, Session>();
  // Each client, with the sessions whose output it receives: the ones it opened or attached and has not detached since.
  private readonly clients = new Map<WebSocket, Set<number>>();
  // The clients that said hello and were not yet sent `ready`. Nothing is sent to one before its `ready`, which carries the lists whole.
  private readonly greeting = new Set<WebSocket>();
  private server: WebSocketServer | undefined;
  private nextId = 1;
  // The headless sessions, by an id counted apart from the panes'. They live in memory alone.
  private readonly headless = new Map<number, HeadlessSession>();
  private nextHeadlessId = 1;
  private idleTimer: NodeJS.Timeout | undefined;
  private readonly workItems: WorkItemList;
  private readonly lastLook: LastLook;
  private readonly keepAwake: KeepAwakeStore;
  // The hold that stands now, where one does. The daemon holds one at most.
  private hold: { release(): void } | undefined;
  // Creations run one after another, so two of one title never pick the same branch and folder. A plan creates nothing and does not wait behind them.
  private creating: Promise<void> = Promise.resolve();
  // The new commits last read for each work item, by its id; the list itself does not store them.
  private readonly commitCounts = new Map<number, number | null>();
  // How many commits each work item's branch was last read to hold that its base branch does not, by the work item's id.
  private readonly aheadCounts = new Map<number, number | null>();
  // What was last read of each work item's branch, by the work item's id: the head it was read at, and the commits and the changes read there.
  private readonly branches = new Map<number, { head: string; commits: CommitInfo[] | null; changes: Changes | null }>();
  private commitTimer: NodeJS.Timeout | undefined;
  private commitsReadAt = 0;
  // The read of the counts under way, which a hello that arrives meanwhile waits on.
  private readingCommits: Promise<void> | undefined;
  private closed = false;

  constructor(private readonly options: DaemonOptions) {
    this.workItems = new WorkItemList(options.runDir, options.now);
    this.lastLook = new LastLook(options.runDir);
    this.keepAwake = new KeepAwakeStore(options.runDir);
  }

  listen(port: number): Promise<number> {
    const server = new WebSocketServer({ host: "127.0.0.1", port });
    this.server = server;
    server.on("connection", (socket) => this.accept(socket));
    return new Promise((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", () => {
        // A daemon whose choice is `always` holds from its start.
        this.settleHold();
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
   * and keeps the state it leaves the pane's session in, with the time the
   * state began and what the event that began it said. An event that leaves
   * the state as it was changes none of them. Any event ends the pane's
   * silent start, an event the daemon maps to no neutral one among them.
   */
  agentEvent(paneId: number, hookName: string, payload: Record<string, unknown>): void {
    const session = this.sessions.get(paneId);
    clearTimeout(session?.silentStart);
    const event = agentEventFor(hookName);
    if (!event) return;
    const tool = typeof payload.tool_name === "string" ? payload.tool_name : null;
    this.broadcast({ type: "agent", id: paneId, event, tool, at: Date.now() });
    if (!session || !this.reportsState(session.info.kind)) return;
    const state = agentStateAfter(event);
    if (state === session.info.state) return;
    const said = agentSaid(hookName, payload);
    session.info.state = state;
    session.info.stateSince = state === null ? null : (this.options.now ?? Date.now)();
    session.info.stateText = cutText(said.text);
    session.info.stateTool = said.tool;
    this.broadcastInbox();
  }

  async close(): Promise<void> {
    this.closed = true;
    clearTimeout(this.commitTimer);
    clearTimeout(this.idleTimer);
    for (const session of this.sessions.values()) {
      clearTimeout(session.silentStart);
      if (session.info.alive) session.terminal.kill();
    }
    for (const session of this.headless.values()) session.run?.stop();
    this.hold?.release();
    this.hold = undefined;
    for (const client of this.clients.keys()) client.terminate();
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  private accept(socket: WebSocket): void {
    let authorized = false;
    // What the client sent between its hello and its `ready`, in the order it arrived.
    const early: ClientMessage[] = [];
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
        this.greeting.add(socket);
        this.checkIdle();
        void this.greet(socket, early);
        return;
      }
      if (this.greeting.has(socket)) early.push(message);
      else this.handle(socket, message);
    });
    socket.on("close", () => {
      clearTimeout(helloTimer);
      this.clients.delete(socket);
      this.greeting.delete(socket);
      this.checkIdle();
    });
    socket.on("error", () => socket.terminate());
  }

  /**
   * Answers a hello. The counts of new commits are read from git first, so
   * `ready` carries the commits that landed while no client was connected and
   * a daemon that just started sends counts. Where the read takes longer than
   * the wait, `ready` carries the counts the daemon holds and the read's
   * result follows in an inbox. What the client sent meanwhile is handled
   * after its `ready`.
   */
  private async greet(socket: WebSocket, early: ClientMessage[]): Promise<void> {
    let waitTimer: NodeJS.Timeout | undefined;
    const waited = new Promise<void>((resolve) => {
      waitTimer = setTimeout(resolve, this.options.readyWaitMs ?? 500);
    });
    await Promise.race([this.readCommitsNow(), waited]);
    clearTimeout(waitTimer);
    // The client left, or the daemon closed, while the counts were read.
    if (!this.greeting.delete(socket)) return;
    this.send(socket, { type: "ready", sessions: this.sessionList(), workItems: this.workItemList(), paneKinds: [...this.options.paneKinds], headless: this.headlessList(), lastLook: this.lastLook.get(), ...(this.options.holdAwake ? { keepAwake: this.keepAwakeNow() } : {}) });
    for (const message of early) this.handle(socket, message);
  }

  private handle(socket: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case "start": {
        const continueLatest = message.continueLatest === true;
        if (continueLatest && !this.continues(message.kind)) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `a pane of kind ${message.kind} continues no conversation` });
          return;
        }
        let cwd = this.options.cwd ?? process.cwd();
        if (message.workItemId !== undefined) {
          const worktree = this.worktreeFor(socket, message.requestId, message.workItemId);
          if (worktree === undefined) return;
          cwd = worktree;
        }
        const info = this.startSession(socket, message, cwd, message.workItemId ?? null, continueLatest);
        // The answer first, so the client that asked knows the pane as its own when the inbox lists it.
        this.send(socket, { type: "started", requestId: message.requestId, session: info });
        this.broadcastInbox();
        return;
      }
      case "createWorkItem": {
        const create = async (): Promise<void> => {
          try {
            checkNaming(message);
            // A base that is no string never reaches git, and one that is reaches it only as a ref the repository holds.
            if (message.base !== undefined && typeof message.base !== "string") throw new Error(`a work item starts from a branch's name, and ${JSON.stringify(message.base)} is none`);
            const place = await createWorktree({ folder: message.repo, title: message.title, name: message.name, base: message.base, root: this.options.worktreesRoot ?? worktreesRoot(process.env), random: this.options.random });
            // A work item nobody named is called what its branch and its folder are, the number they got among it.
            const stored = this.workItems.add({ title: message.title.trim() || basename(place.worktree), ...place });
            // The branch was cut at its base commit a moment ago, so it holds nothing new and git is not asked.
            this.commitCounts.set(stored.id, 0);
            if (place.baseBranch !== null) this.aheadCounts.set(stored.id, 0);
            this.branches.set(stored.id, { head: place.baseCommit, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } });
            const workItem = this.workItemOf(stored);
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
      case "planWorkItem": {
        const plan = async (): Promise<void> => {
          try {
            checkNaming(message);
            const planned = await planWorktree({ folder: message.repo, title: message.title, name: message.name, root: this.options.worktreesRoot ?? worktreesRoot(process.env), random: this.options.random });
            this.send(socket, { type: "workItemPlan", requestId: message.requestId, ...planned });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A plan is a read, so it is answered while a creation is under way and can name what that creation is about to take.
        void plan();
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
      case "detach":
        // The session, its process and its kept output stay as they are, and the next `attach` replays what the client missed.
        this.clients.get(socket)?.delete(message.id);
        return;
      case "forget":
        // A person cleared or reset the pane in a window. Without this the next replay would draw again what they cleared. A clear asks with `keepModes` that the modes the pane's program set are kept, and the next replay then opens with them. A reset does not ask, and the next replay sets no mode.
        this.sessions.get(message.id)?.output.clear(message.keepModes === true);
        return;
      case "close": {
        const session = this.sessions.get(message.id);
        if (!session) return;
        // Off the lists first, so the process's end is told to nobody as a session's.
        this.sessions.delete(message.id);
        clearTimeout(session.silentStart);
        if (session.info.alive) session.terminal.kill();
        this.broadcastInbox();
        this.checkIdle();
        return;
      }
      case "ask": {
        // A headless session runs in a work item's worktree and nowhere else: in the
        // daemon's own folder it would read whatever instructions that folder holds.
        if (typeof message.workItemId !== "number" || typeof message.prompt !== "string" || message.prompt.trim() === "") {
          this.send(socket, { type: "error", requestId: message.requestId, message: "asking needs a work item and a prompt" });
          return;
        }
        const worktree = this.worktreeFor(socket, message.requestId, message.workItemId);
        if (worktree === undefined) return;
        const session: HeadlessSession = {
          info: { id: this.nextHeadlessId++, workItemId: message.workItemId, prompt: message.prompt, state: "working", answer: "", error: null, costUsd: null, startedAt: (this.options.now ?? Date.now)() },
          run: undefined,
        };
        this.headless.set(session.info.id, session);
        // The answer first, so the client that asked knows the session as its own when every client is told of it.
        this.send(socket, { type: "asked", requestId: message.requestId, headless: session.info });
        this.headlessChanged(session);
        this.startHeadless(session, worktree);
        return;
      }
      case "looked": {
        // No client is told: the look reaches a client in its `ready`, and an inbox sent here would redraw every window as one loses focus.
        try {
          this.lastLook.record((this.options.now ?? Date.now)(), this.sessionList(), this.workItemList());
        } catch (error) {
          // The message has no answer to carry an error, and the look is held in memory whether or not it was written.
          console.error(`the last look was not written: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }
      case "setKeepAwake": {
        // A daemon that can hold nothing takes no choice, and a choice that already stands changes nothing.
        if (!this.options.holdAwake || !isKeepAwakeChoice(message.choice) || message.choice === this.keepAwake.get()) return;
        try {
          this.keepAwake.set(message.choice);
        } catch (error) {
          // The message has no answer to carry an error, and the choice is held in memory whether or not it was written.
          console.error(`the choice of when to keep the Mac awake was not written: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Where the choice moved the hold, the message that says so carries the choice too.
        if (!this.settleHold()) this.broadcastKeepAwake();
        return;
      }
      case "input":
        this.sessions.get(message.id)?.terminal.write(message.data);
        return;
      case "resize": {
        const session = this.sessions.get(message.id);
        // A window fits the screen it shows an exited pane on. The pseudo-terminal of a process that exited is closed, and a size set on it throws.
        if (session?.info.alive) session.terminal.resize(message.cols, message.rows);
        return;
      }
      default:
        return;
    }
  }

  /** The worktree of the work item a request names; where it has none to run in, the request is answered with an error. */
  private worktreeFor(socket: WebSocket, requestId: number, workItemId: number): string | undefined {
    const workItem = this.workItems.get(workItemId);
    if (!workItem) {
      this.send(socket, { type: "error", requestId, message: `no work item ${String(workItemId)}` });
      return undefined;
    }
    // A person can remove a worktree's folder by hand, and a process cannot start in it.
    if (!existsSync(workItem.worktree)) {
      this.send(socket, { type: "error", requestId, message: `the folder of work item ${workItem.id} is gone: ${workItem.worktree}` });
      return undefined;
    }
    return workItem.worktree;
  }

  /** Starts a headless session's run through the adapter, and keeps what its events say of it. */
  private startHeadless(session: HeadlessSession, cwd: string): void {
    const { info } = session;
    const failed = (message: string): void => {
      info.state = "failed";
      info.error = message;
      this.headlessChanged(session);
    };
    const onEvent = (event: RoleEvent): void => {
      if (event.type === "exit") {
        if (info.state === "working") failed(`the session exited with code ${event.exitCode} and gave no result`);
        return;
      }
      // The result closes the answer: nothing that arrives after it changes the session.
      if (info.state !== "working") return;
      if (event.type === "text") {
        info.answer += event.text;
        this.headlessChanged(session);
        return;
      }
      info.costUsd = event.costUsd;
      if (event.isError) {
        failed(event.text || "the session ended with an error");
        return;
      }
      info.state = "finished";
      info.answer = event.text;
      this.headlessChanged(session);
    };
    this.options.roleAdapter.start({ prompt: info.prompt, cwd }, onEvent).then(
      (run) => {
        // A daemon that closed while the adapter was starting stopped no run of this session.
        if (this.closed) run.stop();
        else session.run = run;
      },
      (error: unknown) => failed(error instanceof Error ? error.message : String(error)),
    );
  }

  /** Sends every client one headless session whole, after it changed. */
  private headlessChanged(session: HeadlessSession): void {
    this.broadcast({ type: "headless", headless: session.info });
    this.settleHold();
    this.checkIdle();
  }

  /** Starts a pane's process in `cwd`, and sends its output to the client that asked for it. `continueLatest` is true only for a `start` that asked it of a kind that continues. */
  private startSession(socket: WebSocket, pane: { kind: PaneKind; cols: number; rows: number }, cwd: string, workItemId: number | null, continueLatest = false): SessionInfo {
    const id = this.nextId++;
    const { command, args, env } = this.options.commandFor(pane.kind, id, { continueLatest });
    const terminal = TerminalSession.spawn({
      command,
      args,
      cwd,
      cols: pane.cols,
      rows: pane.rows,
      env: { ...process.env, ...env },
    });
    const session: Session = { info: { id, kind: pane.kind, alive: true, workItemId, state: null, stateSince: null, stateText: null, stateTool: null }, terminal, output: new OutputBuffer(this.options.bufferChars ?? 256 * 1024), silentStart: undefined };
    this.sessions.set(id, session);
    if (this.reportsState(pane.kind)) session.silentStart = setTimeout(() => this.silentStartOver(session), this.options.silentStartMs ?? SILENT_START_MS);
    // What the session prints is kept for a replay and sent to the clients that receive the session.
    const print = (data: string): void => {
      session.output.append(data);
      this.sendOutput(id, data);
    };
    terminal.onData(print);
    terminal.onExit((exitCode) => {
      session.info.alive = false;
      clearTimeout(session.silentStart);
      // A closed pane is on no list, and its end is no client's news.
      if (this.sessions.get(id) === session) {
        // The exit line is the session's last output, so a replay of an exited session ends with it and no client writes one of its own.
        print(`\r\n[process exited with code ${exitCode}]\r\n`);
        this.broadcast({ type: "exit", id, exitCode });
        this.broadcastInbox();
      }
      this.checkIdle();
    });
    this.clients.get(socket)?.add(id);
    this.checkIdle();
    return session.info;
  }

  /**
   * Lists as waiting a pane that sent no event in the time after its start. A
   * CLI asks its first questions before its session starts and sends no event
   * while it asks, so the missing event is what says the pane waits. No event
   * said anything, so the state keeps no text and no tool. The timer that
   * calls this is cancelled by the pane's first event, its end and its close,
   * so the pane is alive, listed and silent here.
   */
  private silentStartOver(session: Session): void {
    session.info.state = "waiting";
    session.info.stateSince = (this.options.now ?? Date.now)();
    this.broadcastInbox();
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

  private continues(kind: PaneKind): boolean {
    return this.options.paneKinds.some((offered) => offered.kind === kind && offered.continues);
  }

  private sessionList(): SessionInfo[] {
    return [...this.sessions.values()].map((s) => s.info);
  }

  private headlessList(): HeadlessInfo[] {
    return [...this.headless.values()].map((s) => s.info);
  }

  private workItemList(): WorkItem[] {
    return this.workItems.all().map((item) => this.workItemOf(item));
  }

  /** A work item as a client is sent it: with its repository's name, and with what was last read of its branch. */
  private workItemOf(item: StoredWorkItem): WorkItem {
    const read = this.branches.get(item.id);
    return { ...item, repoName: basename(item.repo), aheadOfBase: this.aheadCounts.get(item.id) ?? null, newCommits: this.commitCounts.get(item.id) ?? null, commits: read?.commits ?? null, changes: read?.changes ?? null };
  }

  /** Sends every client the whole of both lists, after either changed. */
  private broadcastInbox(): void {
    this.broadcast({ type: "inbox", sessions: this.sessionList(), workItems: this.workItemList() });
    // Every change of a pane's `alive` or `state` ends here.
    this.settleHold();
  }

  private keepAwakeNow(): KeepAwake {
    return { choice: this.keepAwake.get(), held: this.hold !== undefined };
  }

  private broadcastKeepAwake(): void {
    this.broadcast({ type: "keepAwake", keepAwake: this.keepAwakeNow() });
  }

  /**
   * Starts the hold where the daemon wants the Mac awake and holds nothing,
   * and releases it where it holds and no longer wants to, and then tells
   * every client; it answers whether it did either. A hold that ends by
   * itself is told to every client too, and the next call that still wants
   * the Mac awake starts another. A daemon that closed, or was given no
   * holder, holds nothing.
   */
  private settleHold(): boolean {
    const { holdAwake } = this.options;
    if (!holdAwake) return false;
    const wanted = !this.closed && wantsAwake(this.keepAwake.get(), this.sessionList(), this.headlessList());
    if (wanted === (this.hold !== undefined)) return false;
    if (this.hold) {
      this.hold.release();
      this.hold = undefined;
    } else {
      let over = false;
      let standing: { release(): void } | undefined;
      const hold = holdAwake(() => {
        over = true;
        // A hold lost before the holder returned never stood, and one the daemon released is no longer the daemon's.
        if (standing === undefined || this.hold !== standing) return;
        this.hold = undefined;
        this.broadcastKeepAwake();
      });
      // No client is told of a hold that never stood.
      if (over) return false;
      standing = hold;
      this.hold = hold;
    }
    this.broadcastKeepAwake();
    return true;
  }

  /**
   * Arranges the next read of the work items' new commits, an interval after
   * the last one where none is arranged yet. The reads follow one another
   * while a client is connected, and the hello of the next client to connect
   * starts them again.
   */
  private scheduleCommitRead(): void {
    if (this.closed || this.commitTimer !== undefined || this.readingCommits) return;
    const interval = this.options.commitPollMs ?? 3000;
    const wait = Math.max(0, this.commitsReadAt + interval - Date.now());
    this.commitTimer = setTimeout(() => {
      this.commitTimer = undefined;
      // Nobody reads the counts while no client is connected.
      if (this.clients.size === 0) return;
      void this.readCommitsNow();
    }, wait);
  }

  /** Reads the counts now, or gives the read under way: one read runs at a time. */
  private readCommitsNow(): Promise<void> {
    if (this.readingCommits) return this.readingCommits;
    this.commitsReadAt = Date.now();
    const reading = this.readCommits().finally(() => {
      this.readingCommits = undefined;
      this.scheduleCommitRead();
    });
    this.readingCommits = reading;
    return reading;
  }

  /**
   * Reads each work item's new commits from git, and tells every client where
   * a count changed or a branch's head moved. How far a branch is ahead of its
   * base branch is counted at every read, since the base moves by itself. The
   * commits and the changed files are read only where the head is another
   * commit than the one they were last read at.
   */
  private async readCommits(): Promise<void> {
    let changed = false;
    await Promise.all(
      this.workItems.all().map(async (item) => {
        // A work item from before the base commit was recorded has nothing to count from.
        const { baseCommit } = item;
        if (baseCommit === null) return;
        const [count, head] = await Promise.all([newCommits(item.repo, item.branch, baseCommit), branchHead(item.repo, item.branch)]);
        if (count !== (this.commitCounts.get(item.id) ?? null)) {
          this.commitCounts.set(item.id, count);
          changed = true;
        }
        const ahead = item.baseBranch === null || head === null ? null : await aheadOf(item.repo, item.baseBranch, head);
        if (ahead !== (this.aheadCounts.get(item.id) ?? null)) {
          this.aheadCounts.set(item.id, ahead);
          changed = true;
        }
        if (head === (this.branches.get(item.id)?.head ?? null)) return;
        changed = true;
        if (head === null) {
          // The branch is gone, and what was read of it with it.
          this.branches.delete(item.id);
          return;
        }
        // Read at the commit and not at the branch, so what is kept is what that head holds though the branch moves meanwhile.
        const [commits, changes] = await Promise.all([branchCommits(item.repo, baseCommit, head), branchChanges(item.repo, baseCommit, head)]);
        this.branches.set(item.id, { head, commits, changes });
      }),
    );
    if (changed) this.broadcastInbox();
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    socket.send(JSON.stringify(message));
  }

  private broadcast(message: ServerMessage): void {
    const text = JSON.stringify(message);
    for (const client of this.clients.keys()) if (!this.greeting.has(client)) client.send(text);
  }

  private sendOutput(id: number, data: string): void {
    const text = JSON.stringify({ type: "output", id, data } satisfies ServerMessage);
    for (const [client, sessions] of this.clients) if (sessions.has(id)) client.send(text);
  }

  private checkIdle(): void {
    clearTimeout(this.idleTimer);
    const busy = this.clients.size > 0 || [...this.sessions.values()].some((s) => s.info.alive) || [...this.headless.values()].some((s) => s.info.state === "working");
    if (busy || !this.options.onIdle) return;
    this.idleTimer = setTimeout(() => this.options.onIdle?.(), this.options.idleExitMs ?? 60_000);
  }
}
