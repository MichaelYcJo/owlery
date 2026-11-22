import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { basename, isAbsolute } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { isKeepAwakeChoice } from "../shared/keep-awake";
import { type Changes, type ClientMessage, type CommitInfo, type HeadlessInfo, type KeepAwake, type PaneKind, type PaneKindInfo, type PermissionAsk, type Repository, type Running, type ServerMessage, type SessionInfo, UNAUTHORIZED, type WorkItem, losesWork, roleStageOf } from "../shared/protocol";
import type { RoleAdapter, RoleEvent, RoleFeature, RoleRun } from "./adapters/adapter";
import { agentEventFor, agentSaid } from "./agent-events";
import { agentStateAfter } from "./agent-state";
import { OutputBuffer } from "./buffer";
import { type HoldAwake, KeepAwakeStore, wantsAwake } from "./keep-awake";
import { LastLook } from "./last-look";
import { type Held, RepositoryStore, type StoredRepository } from "./repositories";
import { verdictOn } from "./role-grants";
import { BaseFetches, aheadOf, branchChanges, branchCommits, branchHead, createWorktree, newCommits, planBranchRename, planWorktree, readLoss, removeBranch, removeWorktree, renameBranch, repositoryOf, worktreesRoot } from "./worktrees";

/** How much of a state's text the daemon keeps. */
const STATE_TEXT_CHARS = 2000;

/** The first `STATE_TEXT_CHARS` characters of a text, less a half of a character the cut would leave at its end. */
function cutText(text: string | null): string | null {
  if (text === null || text.length <= STATE_TEXT_CHARS) return text;
  const last = text.charCodeAt(STATE_TEXT_CHARS - 1);
  // A character outside the basic plane is two of a string's, and the first of the two alone is no character.
  return text.slice(0, last >= 0xd800 && last <= 0xdbff ? STATE_TEXT_CHARS - 1 : STATE_TEXT_CHARS);
}

/**
 * Refuses the fields that name a work item, in a creation and in a plan, where
 * they are not the protocol's. An empty title is one of the protocol's. A
 * repository folder that is not absolute, the empty one among them, is
 * refused: git would answer for it from the folder the daemon itself runs in.
 * The path's text alone is read, as a POSIX path.
 */
function checkNaming(message: { repo: unknown; title: unknown; name?: unknown }): void {
  if (typeof message.repo !== "string" || typeof message.title !== "string") throw new Error("a work item needs a repository folder and a title");
  if (!isAbsolute(message.repo)) throw new Error(`the repository folder has to be a whole path from /, and ${JSON.stringify(message.repo)} is not`);
  if (message.name !== undefined && typeof message.name !== "string") throw new Error("a work item's name, where one is sent, is a string");
}

/** How long a pane's silent start lasts where the options name no time. */
const SILENT_START_MS = 10_000;

/**
 * How long the daemon waits for the processes of the panes it ended to exit,
 * where the options name no time. A shell exits well inside it: the case
 * that removes a repository with a running `/bin/sh` pane is answered in
 * less than two seconds, which it asserts. A person who confirmed a dialog
 * waits on the answer, so the wait is no longer than this. The same wait
 * holds for the headless runs that were stopped. Claude Code 2.1.330 run
 * headless exited 389 ms after the signal while it waited for its first
 * message (probed 2026-11-21), and the adapter kills a CLI that has not
 * exited 2 seconds after the signal. Its exit during a turn was not measured.
 */
const END_WAIT_MS = 3000;

/** How long a headless session may work, from its start, before the daemon stops it, where the options name no time. */
export const HEADLESS_LIMIT_MS = 60 * 60_000;

/** How many of the headless sessions that ended the daemon keeps, where the options name no number. */
export const HEADLESS_KEPT = 50;

const isIds = (value: unknown): value is number[] => Array.isArray(value) && value.every((id) => typeof id === "number");
const isRunning = (value: unknown): value is Running => typeof value === "object" && value !== null && isIds((value as Running).panes) && isIds((value as Running).headless);
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
/** What a removal carries where the person chose to delete the repository's work items from disk: the stamp of each one's loss, by the work item's id, and whether the deletes are forced. */
const isDeletion = (value: unknown): value is { stamps: Record<number, unknown>; force: boolean } => {
  const { stamps, force } = (typeof value === "object" && value !== null ? value : {}) as { stamps?: unknown; force?: unknown };
  return typeof stamps === "object" && stamps !== null && typeof force === "boolean";
};

/** How many characters a text holds as a person counts them: an emoji of several code points is one. */
function characters(text: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
}

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
  /** Where the repositories and their work items are kept, in `repositories.json`, the last look, in `last-look.json`, and the choice of when to keep the Mac awake, in `keep-awake.json`; without them all three are in memory alone. */
  runDir?: string;
  /** How the daemon holds the Mac awake. A daemon given none holds nothing, sends no `keepAwake` and takes no choice. */
  holdAwake?: HoldAwake;
  /** Where worktrees are made; `worktreesRoot` of the daemon's environment when absent. */
  worktreesRoot?: string;
  /** The source of randomness a work item nobody named is named from; `Math.random` when absent. */
  random?: () => number;
  /** The clock a work item's `createdAt`, a headless session's `startedAt`, a look's `at`, a session's `stateSince` and the time a fetch of a base ended at are read from. */
  now?: () => number;
  /** How long one fetch of a base may take before the daemon ends it; `BASE_FETCH_MS` when absent. */
  baseFetchMs?: number;
  /** How long the result of a fetch of a remote's branch serves a creation from that branch, read from `now`; `BASE_FRESH_MS` when absent. */
  baseFreshMs?: number;
  /** How long the daemon waits between two reads of the work items' new commits, apart from the read each hello starts. */
  commitPollMs?: number;
  /** How long a hello's answer waits for the read of the work items' new commits. It stays under the second the app gives a daemon to answer (`answers` of src/main/daemon-client.ts). */
  readyWaitMs?: number;
  /** How long a pane of a kind that reports state may send no event after its start before it is listed as waiting; 10 seconds when absent. */
  silentStartMs?: number;
  /** How long the daemon waits for the processes of the panes it ended to exit, and for the headless runs it stopped to end, before it refuses what ended them where a pane's has not; 3 seconds when absent. */
  endWaitMs?: number;
  /** How long a headless session may work, from its start, before the daemon stops it; `HEADLESS_LIMIT_MS` when absent. */
  headlessLimitMs?: number;
  /** How many of the headless sessions that ended the daemon keeps, apart from the ones still working; `HEADLESS_KEPT` when absent. */
  keptHeadless?: number;
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
  /** Settled once the pane's process has exited. */
  exited: Promise<void>;
}

interface HeadlessSession {
  info: HeadlessInfo;
  /** The adapter's run, once it has started. */
  run: RoleRun | undefined;
  /** The wait for the session's time limit. Its end and the daemon's close each cancel it. */
  limit: NodeJS.Timeout | undefined;
  /** The requests the session waits for the person to answer, by the ids its adapter gave them. They live in memory alone, as the session does, and end with it. */
  asks: Map<string, PermissionAsk>;
}

/** The features an adapter declares to launch a role: without the first a role session would hold every tool, and without the second no call of it would be answered by its role's rule. */
const ROLE_FEATURES: readonly RoleFeature[] = ["role-tools", "permission-requests"];

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
  // The ids of the permission requests that wait for the person, counted across every session since the daemon started.
  private nextPermissionId = 1;
  // The ids of the headless sessions that ended, in the order they ended. The first leaves the list where more ended than the daemon keeps.
  private readonly endedHeadless = new Set<number>();
  private idleTimer: NodeJS.Timeout | undefined;
  private readonly store: RepositoryStore;
  private readonly lastLook: LastLook;
  private readonly keepAwake: KeepAwakeStore;
  // The hold that stands now, where one does. The daemon holds one at most.
  private hold: { release(): void } | undefined;
  // The fetches of the bases work items start from: a form's and a creation's of one branch are one fetch.
  private readonly fetches: BaseFetches;
  // What takes or gives up a branch runs one after another: a creation, a rename that renames a branch, and a delete. So two creations of one title never pick the same branch and folder, a rename never takes the branch a creation chose, and a creation never takes the name of a branch a delete is removing. A repository's removal runs among them, so no creation adds a work item to the repository while the removal waits for its sessions to end. A plan and a read of a loss change nothing and do not wait behind them.
  private changing: Promise<void> = Promise.resolve();
  // The new commits last read for each work item, by its id; the list itself does not store them.
  private readonly commitCounts = new Map<number, number | null>();
  // How many commits each work item's branch was last read to hold that its base branch does not, by the work item's id.
  private readonly aheadCounts = new Map<number, number | null>();
  // What was last read of each work item's branch, by the work item's id: the head it was read at, and the commits and the changes read there.
  private readonly branches = new Map<number, { head: string; commits: CommitInfo[] | null; changes: Changes | null }>();
  // The work items whose branch is being renamed, by their ids. What a read of the commits finds under the old name meanwhile is dropped.
  private readonly renaming = new Set<number>();
  // The work items an archive is ending the sessions of, by their ids. Each is archived once the wait for its panes is over, so no pane and no headless session starts in one meanwhile.
  private readonly archiving = new Set<number>();
  // The work items a delete is under way for, by their ids, from its first read of the loss until it has removed them or was refused: one delete's, or every work item of a repository whose removal deletes them. No pane and no headless session starts in one meanwhile, in a folder git is about to remove, and no archive ends its sessions beside the delete.
  private readonly deleting = new Set<number>();
  // What the adapter last said a person should know of its agent, or null where it said nothing or has not answered yet.
  private agentNotice: string | null = null;
  // How many times the adapter was asked for its notice. The answer of the last ask is the one kept.
  private noticeAsks = 0;
  private commitTimer: NodeJS.Timeout | undefined;
  private commitsReadAt = 0;
  // The read of the counts under way, which a hello that arrives meanwhile waits on.
  private readingCommits: Promise<void> | undefined;
  private closed = false;

  constructor(private readonly options: DaemonOptions) {
    this.store = new RepositoryStore(options.runDir, options.now);
    this.lastLook = new LastLook(options.runDir);
    this.fetches = new BaseFetches({ waitMs: options.baseFetchMs, freshMs: options.baseFreshMs, now: options.now });
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
        // Read in the background: the adapter may take seconds to find its agent, and no client waits for it.
        void this.readAgentNotice();
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
    // A run whose adapter is still starting is stopped once it has started, and the close does not wait for it.
    const stops: Promise<void>[] = [];
    for (const session of this.headless.values()) {
      clearTimeout(session.limit);
      if (session.run) stops.push(session.run.stop());
    }
    this.fetches.close();
    this.hold?.release();
    this.hold = undefined;
    for (const client of this.clients.keys()) client.terminate();
    await Promise.all([new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve())), ...stops]);
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
        // A notice that stands is read again as a window connects, so it goes once the person did what it asks. The daemon outlives the app for days, and a notice read once would stay.
        if (this.agentNotice !== null) void this.readAgentNotice();
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
    this.send(socket, { type: "ready", ...this.lists(), paneKinds: [...this.options.paneKinds], headless: this.headlessList(), lastLook: this.lastLook.get(), ...(this.options.holdAwake ? { keepAwake: this.keepAwakeNow() } : {}), agentNotice: this.agentNotice });
    for (const message of early) this.handle(socket, message);
  }

  private handle(socket: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case "start": {
        // A pane runs in a work item's worktree and nowhere else: the daemon has no folder of its own to open one in.
        if (typeof message.workItemId !== "number") {
          this.send(socket, { type: "error", requestId: message.requestId, message: "a pane opens in a work item" });
          return;
        }
        const continueLatest = message.continueLatest === true;
        if (continueLatest && !this.continues(message.kind)) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `a pane of kind ${message.kind} continues no conversation` });
          return;
        }
        const worktree = this.worktreeFor(socket, message.requestId, message.workItemId);
        if (worktree === undefined) return;
        const info = this.startSession(socket, message, worktree, message.workItemId, continueLatest);
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
            const place = await createWorktree({ folder: message.repo, title: message.title, name: message.name, base: message.base, root: this.options.worktreesRoot ?? worktreesRoot(process.env), random: this.options.random, chosenBase: this.chosenBase, fetches: this.fetches });
            // A work item nobody named is called what its branch and its folder are, the number they got among it. The store adds the repository first where it does not keep it, and shows it again where it was hidden.
            const stored = this.store.addWorkItem({ title: message.title.trim() || basename(place.worktree), ...place });
            // The branch was cut at its base commit a moment ago, so it holds nothing new and git is not asked.
            this.commitCounts.set(stored.item.id, 0);
            if (place.baseBranch !== null) this.aheadCounts.set(stored.item.id, 0);
            this.branches.set(stored.item.id, { head: place.baseCommit, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } });
            const workItem = this.workItemOf(stored);
            const session = this.startSession(socket, message, workItem.worktree, workItem.id);
            this.send(socket, { type: "workItemCreated", requestId: message.requestId, workItem, session });
            this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        this.changing = this.changing.then(create);
        return;
      }
      case "planWorkItem": {
        const plan = async (): Promise<void> => {
          try {
            checkNaming(message);
            const planned = await planWorktree({ folder: message.repo, title: message.title, name: message.name, root: this.options.worktreesRoot ?? worktreesRoot(process.env), random: this.options.random, chosenBase: this.chosenBase });
            this.send(socket, { type: "workItemPlan", requestId: message.requestId, ...planned });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A plan is a read, so it is answered while a creation is under way and can name what that creation is about to take.
        void plan();
        return;
      }
      case "fetchBase": {
        const fetch = async (): Promise<void> => {
          try {
            // A folder that is not absolute would have git answer for the folder the daemon itself runs in, and a base that is no string never reaches git.
            if (typeof message.repo !== "string" || !isAbsolute(message.repo)) throw new Error(`the repository folder has to be a whole path from /, and ${JSON.stringify(message.repo)} is not`);
            if (typeof message.base !== "string") throw new Error(`a fetch names a branch, and ${JSON.stringify(message.base)} is none`);
            const fetched = await this.fetches.fetch(await repositoryOf(message.repo), message.base, { reuse: false });
            this.send(socket, { type: "baseFetched", requestId: message.requestId, ...fetched });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A fetch takes no branch and no folder, so it waits behind no creation, and a creation of the same base joins it.
        void fetch();
        return;
      }
      case "addRepository": {
        const add = async (): Promise<void> => {
          try {
            // A folder that is not absolute, the empty one among them, would have git answer for the folder the daemon itself runs in.
            if (typeof message.folder !== "string" || !isAbsolute(message.folder)) throw new Error("a repository is added by a folder inside it");
            const { changed } = this.store.addRepository(await repositoryOf(message.folder));
            // The answer first, so the client that asked knows its request was carried out when the inbox lists the repository.
            this.send(socket, { type: "done", requestId: message.requestId });
            if (changed) this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // The store holds a folder once however many adds of it arrive together, so an add does not wait behind the creations.
        void add();
        return;
      }
      case "setRepository": {
        try {
          const { name, icon, defaultBase, hidden } = message;
          if ((name !== undefined && !isTextOrNull(name)) || (icon !== undefined && !isTextOrNull(icon)) || (defaultBase !== undefined && !isTextOrNull(defaultBase)) || (hidden !== undefined && typeof hidden !== "boolean")) {
            throw new Error("a repository's name, its icon and its base are each a text or null, and whether it is hidden is true or false");
          }
          // An empty name and an empty icon are none: the repository is then named by its folder, and shows no icon.
          const trimmed = (text: string | null | undefined): string | null | undefined => (typeof text === "string" ? text.trim() || null : text);
          const character = trimmed(icon);
          if (typeof character === "string" && characters(character) > 1) throw new Error("An icon is one character.");
          const changed = this.store.setRepository(message.id, { name: trimmed(name), icon: character, defaultBase, hidden });
          if (changed === undefined) throw new Error(`no repository ${String(message.id)}`);
          // The answer first, so the client that asked knows its request was carried out when the inbox carries the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (changed) this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "removeRepository": {
        // How many of the repository's work items this removal deleted from disk before it ended, as it was asked or at a refusal.
        let deleted = 0;
        const remove = async (): Promise<void> => {
          try {
            const { workItems, running, delete: chosen } = message as { workItems: unknown; running: unknown; delete?: unknown };
            if (!isIds(workItems) || !isRunning(running)) throw new Error("a removal names the repository's work items and its running sessions");
            const repository = this.store.repository(message.id);
            if (!repository) throw new Error(`no repository ${String(message.id)}`);
            const items = [...repository.workItems];
            const ids = new Set(items.map((item) => item.id));
            // Every work item that leaves the lists is one the person read by name.
            if ([...ids].some((id) => !workItems.includes(id))) throw new Error("A work item was added since you looked. Read it again.");
            if (chosen === undefined) {
              await this.endSessions(ids, running, "ended when a removal of its repository began", "A session did not end in time, so nothing was removed. Try again.");
              // Nothing on disk is touched: the repository, each worktree's folder and each branch stay.
              this.dropWorkItems(ids);
            } else {
              // Every work item that is deleted is one whose loss the person read, so each has its stamp before the first is touched.
              if (!isDeletion(chosen) || items.some((item) => typeof chosen.stamps[item.id] !== "string")) throw new Error("a removal that deletes names the stamp of each work item's loss, and whether it is forced");
              // No delete begins while an archive is ending the sessions of one of them.
              const archived = items.find((item) => this.archiving.has(item.id));
              if (archived) throw new Error(this.archivingSays(archived.id));
              // Every running session is one the person was told of, before the first delete ends any.
              this.runningTold(ids, running);
              for (const id of ids) this.deleting.add(id);
              try {
                // One after another, each as a delete of its own. The first that is refused or fails ends the removal, and the ones before it are gone.
                for (const item of items) {
                  await this.deleteOne(item.id, chosen.stamps[item.id] as string, chosen.force, running).catch((error: unknown) => {
                    throw new Error(`${item.title}: ${error instanceof Error ? error.message : String(error)}`);
                  });
                  deleted++;
                }
              } finally {
                for (const id of ids) this.deleting.delete(id);
              }
            }
            // The repository's own folder is not touched here, whatever was chosen.
            this.store.removeRepository(repository.id);
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the removal.
            this.send(socket, { type: "done", requestId: message.requestId });
            this.broadcastInbox();
            this.checkIdle();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
            // The work items deleted before the refusal are gone, and every client's lists say so.
            if (deleted > 0) {
              this.broadcastInbox();
              this.checkIdle();
            }
          }
        };
        this.changing = this.changing.then(remove);
        return;
      }
      case "addGroup": {
        try {
          if (typeof message.name !== "string") throw new Error("a group is added to a repository under a name");
          const name = message.name.trim();
          if (name === "") throw new Error("Give the group a name.");
          if (this.store.addGroup(message.repoId, name) === undefined) throw new Error(`no repository ${String(message.repoId)}`);
          // The answer first, so the client that asked knows its request was carried out when the inbox lists the group.
          this.send(socket, { type: "done", requestId: message.requestId });
          this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "setWorkItem": {
        try {
          const { pinned, muted, groupId } = message;
          if ((pinned !== undefined && typeof pinned !== "boolean") || (muted !== undefined && typeof muted !== "boolean")) throw new Error("a work item's pin and its mute are each true or false");
          if (groupId !== undefined && groupId !== null && typeof groupId !== "number") throw new Error("a work item's group is a group's id, or null for none");
          // A work item stands in a group of its own repository, and in no other's.
          const held = this.store.workItem(message.id);
          if (typeof groupId === "number" && held && !held.repository.groups.some((group) => group.id === groupId)) throw new Error(`Group ${String(groupId)} is no group of the work item's repository.`);
          const changed = this.store.setWorkItem(message.id, { pinned, muted, groupId });
          if (changed === undefined) throw new Error(`no work item ${String(message.id)}`);
          // The answer first, so the client that asked knows its request was carried out when the inbox carries the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (changed) this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "planRename": {
        const plan = async (): Promise<void> => {
          try {
            if (typeof message.title !== "string") throw new Error("a rename's plan needs the work item's new name");
            const held = this.store.workItem(message.id);
            if (!held) throw new Error(`no work item ${String(message.id)}`);
            this.send(socket, { type: "renamePlan", requestId: message.requestId, ...(await planBranchRename(held.repository.folder, held.item.branch, message.title)) });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A plan is a read, so it is answered while a creation or a rename is under way.
        void plan();
        return;
      }
      case "renameWorkItem": {
        const rename = async (): Promise<void> => {
          // Whether this rename is the one that holds the work item's reads off. A rename of the name alone holds none, and ends no other rename's hold.
          let holds = false;
          try {
            if (typeof message.title !== "string" || typeof message.branch !== "boolean") throw new Error("a rename needs the work item's new name, and whether its branch is renamed too");
            const title = message.title.trim();
            if (title === "") throw new Error("Give the work item a name.");
            const held = this.store.workItem(message.id);
            if (!held) throw new Error(`no work item ${String(message.id)}`);
            let branch = held.item.branch;
            if (message.branch) {
              // The conditions the person's dialog read are read again here, at the rename, and nothing is changed where one no longer holds or git refuses.
              const plan = await planBranchRename(held.repository.folder, branch, title);
              if (plan.blocked !== null || plan.branch === null) throw new Error(plan.blocked ?? "The name names no branch.");
              this.renaming.add(message.id);
              holds = true;
              await renameBranch(held.repository.folder, branch, plan.branch);
              branch = plan.branch;
            }
            // What was read of the branch is kept by the work item's id, and its head did not move, so the counts and the commits stand.
            const changed = this.store.setWorkItem(message.id, { title, branch });
            this.send(socket, { type: "done", requestId: message.requestId });
            if (changed) this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          } finally {
            if (holds) this.renaming.delete(message.id);
          }
        };
        // A rename that takes a branch waits behind the creations and the other renames. One of the name alone takes none, and runs at once.
        if (message.branch === true) this.changing = this.changing.then(rename);
        else void rename();
        return;
      }
      case "archiveWorkItem": {
        const archive = async (): Promise<void> => {
          try {
            const { id } = message;
            const { running } = message as { running: unknown };
            if (!isRunning(running)) throw new Error("an archive names the work item's running sessions");
            const held = this.store.workItem(id);
            if (!held) throw new Error(`no work item ${String(id)}`);
            // A delete that is under way ends the work item's sessions itself, and an archive beside it would end them a second time under words of its own.
            if (this.deleting.has(id)) throw new Error(`work item ${String(id)} is being deleted`);
            // A work item that is archived, or that another archive is ending the sessions of, is archived by this one no second time.
            if (held.item.archivedAt === null && !this.archiving.has(id)) {
              this.archiving.add(id);
              try {
                // Nothing on disk is touched, so a pane that outlives the wait holds nothing back: the work item is archived, and the pane is listed as exited once its process ends.
                await this.endSessions(new Set([id]), running, "ended when the work item was archived", null);
              } finally {
                this.archiving.delete(id);
              }
              // A removal of its repository can take the work item out of the store while the archive waits.
              if (this.store.setWorkItem(id, { archivedAt: (this.options.now ?? Date.now)() }) === undefined) throw new Error(`no work item ${String(id)}`);
              // The answer first, so the client that asked knows its request was carried out when the inbox carries the archive.
              this.send(socket, { type: "done", requestId: message.requestId });
              this.broadcastInbox();
              return;
            }
            this.send(socket, { type: "done", requestId: message.requestId });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // An archive takes and gives up no branch, so it does not wait behind the creations.
        void archive();
        return;
      }
      case "restoreWorkItem": {
        try {
          const changed = this.store.setWorkItem(message.id, { archivedAt: null });
          if (changed === undefined) throw new Error(`no work item ${String(message.id)}`);
          this.send(socket, { type: "done", requestId: message.requestId });
          if (!changed) return;
          this.broadcastInbox();
          // Git was not read for the work item while it was archived, so its branch is read now, and not at the next read of them all.
          const held = this.store.workItem(message.id);
          if (held) void this.readBranch(held).then((moved) => { if (moved) this.broadcastInbox(); });
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "readLoss": {
        const read = async (): Promise<void> => {
          try {
            const held = this.store.workItem(message.id);
            if (!held) throw new Error(`no work item ${String(message.id)}`);
            this.send(socket, { type: "workItemLoss", requestId: message.requestId, id: held.item.id, loss: await readLoss(held.repository.folder, held.item.branch, held.item.worktree) });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A read of a loss changes nothing, so it is answered while a creation or a delete is under way.
        void read();
        return;
      }
      case "deleteWorkItem": {
        const remove = async (): Promise<void> => {
          try {
            const { id } = message;
            const { stamp, force, running } = message as { stamp: unknown; force: unknown; running: unknown };
            if (typeof stamp !== "string" || typeof force !== "boolean" || !isRunning(running)) throw new Error("a delete names the stamp of the loss the person read, whether it is forced, and the work item's running sessions");
            this.deleting.add(id);
            try {
              await this.deleteOne(id, stamp, force, running);
            } finally {
              this.deleting.delete(id);
            }
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the delete.
            this.send(socket, { type: "done", requestId: message.requestId });
            this.broadcastInbox();
            this.checkIdle();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A delete gives up a branch, so it waits behind the creations, the renames of a branch and the other deletes.
        this.changing = this.changing.then(remove);
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
        // The pair as the protocol lists it, so a session carries the role and the stage and nothing else a client sent with them.
        const role = message.role === undefined ? null : roleStageOf(message.role);
        if (role === undefined) {
          const named = (typeof message.role === "object" && message.role !== null ? message.role : {}) as { role?: unknown; stage?: unknown };
          this.send(socket, { type: "error", requestId: message.requestId, message: `no role ${String(named.role)} at the stage ${String(named.stage)}` });
          return;
        }
        // A role session's tools and its answers are its adapter's to keep, so an adapter that declares less launches none.
        const lacks = role === null ? [] : ROLE_FEATURES.filter((feature) => !this.options.roleAdapter.features.includes(feature));
        if (lacks.length > 0) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `the ${this.options.roleAdapter.name} adapter cannot launch a role: it does not declare ${lacks.join(" and ")}` });
          return;
        }
        const worktree = this.worktreeFor(socket, message.requestId, message.workItemId);
        if (worktree === undefined) return;
        const session: HeadlessSession = {
          info: { id: this.nextHeadlessId++, workItemId: message.workItemId, prompt: message.prompt, state: "working", answer: "", error: null, costUsd: null, startedAt: (this.options.now ?? Date.now)(), errorOutput: "", stopped: null, role },
          run: undefined,
          limit: undefined,
          asks: new Map(),
        };
        session.limit = setTimeout(() => void this.stopHeadless(session, "the session reached its time limit and was stopped", "limit"), this.options.headlessLimitMs ?? HEADLESS_LIMIT_MS);
        this.headless.set(session.info.id, session);
        // The answer first, so the client that asked knows the session as its own when every client is told of it.
        this.send(socket, { type: "asked", requestId: message.requestId, headless: session.info });
        this.headlessChanged(session);
        this.startHeadless(session, worktree);
        return;
      }
      case "stopHeadless": {
        const session = this.headless.get(message.id);
        if (!session) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `no headless session ${String(message.id)}` });
          return;
        }
        // The answer first, so the client that asked knows its request was carried out when every client is told of the session.
        this.send(socket, { type: "done", requestId: message.requestId });
        if (session.info.state === "working") void this.stopHeadless(session, "the session was stopped at a request before it finished", "request");
        return;
      }
      case "answerPermission": {
        if (typeof message.allow !== "boolean") {
          this.send(socket, { type: "error", requestId: message.requestId, message: "an answer to a permission request says whether it allows the call" });
          return;
        }
        for (const session of this.headless.values()) {
          if (session.info.workItemId !== message.workItemId) continue;
          for (const [adapterId, ask] of session.asks) {
            if (ask.id !== message.id) continue;
            session.asks.delete(adapterId);
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the work item without the request.
            this.send(socket, { type: "done", requestId: message.requestId });
            // An allowance is the one call's, and nothing of it is kept: the same call asks again.
            session.run?.answer(adapterId, message.allow ? { allow: true } : { allow: false, reason: "The person refused this call." });
            this.broadcastInbox();
            return;
          }
        }
        this.send(socket, { type: "error", requestId: message.requestId, message: `no permission request ${String(message.id)} waits in this work item` });
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
    const workItem = this.store.workItem(workItemId)?.item;
    if (!workItem) {
      this.send(socket, { type: "error", requestId, message: `no work item ${String(workItemId)}` });
      return undefined;
    }
    // Nothing runs in an archived work item, nor in one an archive is ending the sessions of.
    if (workItem.archivedAt !== null || this.archiving.has(workItem.id)) {
      this.send(socket, { type: "error", requestId, message: `work item ${workItem.id} is archived, restore it first` });
      return undefined;
    }
    // Nor in one a delete is under way for: git is about to remove its folder.
    if (this.deleting.has(workItem.id)) {
      this.send(socket, { type: "error", requestId, message: `work item ${workItem.id} is being deleted` });
      return undefined;
    }
    // A person can remove a worktree's folder by hand, and a process cannot start in it.
    if (!existsSync(workItem.worktree)) {
      this.send(socket, { type: "error", requestId, message: `the folder of work item ${workItem.id} is gone: ${workItem.worktree}` });
      return undefined;
    }
    return workItem.worktree;
  }

  /** The base a person chose for the new work items of the repository a folder names, or null where the daemon keeps no such repository or the person chose none. */
  private readonly chosenBase = (repo: string): string | null => this.store.repositories().find((repository) => repository.folder === repo)?.defaultBase ?? null;

  /** The running sessions of the work items given: the panes whose process is alive, and the headless sessions that are working. */
  private runningIn(workItemIds: ReadonlySet<number>): { panes: Session[]; headless: HeadlessSession[] } {
    return {
      panes: [...this.sessions.values()].filter(({ info }) => info.alive && info.workItemId !== null && workItemIds.has(info.workItemId)),
      headless: [...this.headless.values()].filter(({ info }) => info.state === "working" && workItemIds.has(info.workItemId)),
    };
  }

  /** The running sessions of the work items given, for a request that carries the sessions the person was told of. It refuses where one runs that `told` does not name, and ends none. */
  private runningTold(workItemIds: ReadonlySet<number>, told: Running): { panes: Session[]; headless: HeadlessSession[] } {
    const found = this.runningIn(workItemIds);
    if (found.panes.some(({ info }) => !told.panes.includes(info.id)) || found.headless.some(({ info }) => !told.headless.includes(info.id))) throw new Error("A session started since you looked. Read it again.");
    return found;
  }

  /** What a delete is refused with while an archive is ending the work item's sessions: the two would end them at once, each under words of its own. */
  private archivingSays(id: number): string {
    return `An archive of work item ${String(id)} is ending its sessions. Try again.`;
  }

  /** Takes off the daemon's lists what it holds of the work items given: their panes, the exited among them, their headless sessions, and what was read of each branch. The store is not touched. */
  private dropWorkItems(ids: ReadonlySet<number>): void {
    for (const [id, session] of this.sessions) {
      if (session.info.workItemId === null || !ids.has(session.info.workItemId)) continue;
      clearTimeout(session.silentStart);
      this.sessions.delete(id);
    }
    for (const [id, session] of this.headless) {
      if (!ids.has(session.info.workItemId)) continue;
      this.headless.delete(id);
      this.endedHeadless.delete(id);
    }
    for (const id of ids) {
      this.commitCounts.delete(id);
      this.aheadCounts.delete(id);
      this.branches.delete(id);
    }
  }

  /**
   * Deletes one work item from disk and from the lists, for a request that
   * carries the stamp of the loss the person read, whether they chose to
   * force the delete, and the running sessions they were told of. The caller
   * holds the work item in `deleting` meanwhile. In this order, each step
   * only where the one before it did not refuse or fail:
   *
   * - It refuses while an archive is ending the work item's sessions.
   * - It reads the loss and refuses where its stamp is another than the
   *   one the person read, where the loss is blocked, and where work would
   *   be lost and the delete is not forced. A delete it refuses here ends no
   *   session.
   * - It ends the running sessions, and refuses where one runs that the
   *   person was not told of or a pane's process outlives the wait. A
   *   headless session it stopped says that a delete began, which holds
   *   where the delete is refused after.
   * - It reads the loss once more and refuses in the same ways, so what a
   *   session wrote as it ended is not removed unread.
   * - It has git remove the worktree, with `--force` only for a forced
   *   delete, and then the branch. Where git reads nothing in the
   *   repository's folder, nothing on disk is removed.
   * - It takes the work item, its panes and its headless sessions off the
   *   lists and out of the store.
   */
  private async deleteOne(id: number, stamp: string, force: boolean, told: Running): Promise<void> {
    const held = this.store.workItem(id);
    if (!held) throw new Error(`no work item ${String(id)}`);
    if (this.archiving.has(id)) throw new Error(this.archivingSays(id));
    const { folder } = held.repository;
    const { branch, worktree } = held.item;
    const read = async (): Promise<boolean> => {
      const loss = await readLoss(folder, branch, worktree);
      if (loss.stamp !== stamp) throw new Error("What the delete would remove has changed. Read it again.");
      if (loss.blocked !== null) throw new Error(loss.blocked);
      if (losesWork(loss) && !force) throw new Error("The work item holds work a delete would lose. Check Force delete to delete it anyway.");
      return loss.unreachable;
    };
    await read();
    await this.endSessions(new Set([id]), told, "ended when a delete of its work item began", "A session did not end in time, so nothing was deleted. Try again.");
    if (!(await read())) {
      await removeWorktree(folder, worktree, force);
      await removeBranch(folder, branch);
    }
    this.dropWorkItems(new Set([id]));
    this.store.removeWorkItem(id);
  }

  /**
   * Ends the running sessions of the work items given, for a request that
   * carries the sessions the person was told of. Where a session runs that
   * `told` does not name, it refuses and ends none. Otherwise it kills each
   * pane's process and stops each headless run, which is then `failed` with
   * the error `why` and stopped at a request, and waits until each pane's
   * process has exited and each headless run it stopped has ended. Where a
   * pane's has not within the wait, it refuses with the sentence `late`, and
   * goes on where `late` is null; a headless run that has not ended by then
   * refuses nothing. It refuses where a session started in one of the work
   * items while it waited. The panes stay listed, as exited ones.
   */
  private async endSessions(workItemIds: ReadonlySet<number>, told: Running, why: string, late: string | null): Promise<void> {
    const { panes, headless } = this.runningTold(workItemIds, told);
    const stops = headless.flatMap((session) => this.stopHeadless(session, why, "request") ?? []);
    for (const session of panes) session.terminal.kill();
    let waitTimer: NodeJS.Timeout | undefined;
    const waited = new Promise<void>((resolve) => {
      waitTimer = setTimeout(resolve, this.options.endWaitMs ?? END_WAIT_MS);
    });
    await Promise.race([Promise.all([...panes.map((session) => session.exited), ...stops]), waited]);
    clearTimeout(waitTimer);
    if (late !== null && panes.some(({ info }) => info.alive)) throw new Error(late);
    this.runningTold(workItemIds, told);
  }

  /**
   * Stops a working headless session: it stops its run, and the session is
   * `failed` with the error `why` and says what stopped it. It gives the
   * promise of the run's end, and nothing where the adapter is still
   * starting, whose run is stopped once it has started.
   */
  private stopHeadless(session: HeadlessSession, why: string, stopped: "limit" | "request"): Promise<void> | undefined {
    const stopping = session.run?.stop();
    session.info.state = "failed";
    session.info.error = why;
    session.info.stopped = stopped;
    this.headlessChanged(session);
    return stopping;
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
        // A session that left the list is told to nobody again.
        if (this.headless.get(info.id) !== session) return;
        const printed = info.errorOutput !== event.errorOutput;
        info.errorOutput = event.errorOutput;
        if (info.state === "working") failed(`the session exited with code ${event.exitCode} and gave no result`);
        else if (printed) this.headlessChanged(session);
        return;
      }
      // The result closes the answer: nothing that arrives after it changes the session.
      if (info.state !== "working") return;
      if (event.type === "permission") {
        // The adapter reports no event before its run is held (`RoleAdapter.start`), so the answer has a run to go to.
        const verdict = verdictOn(info.role, event, cwd);
        if (verdict.answer === "allow") session.run?.answer(event.id, { allow: true });
        else if (verdict.answer === "refuse") session.run?.answer(event.id, { allow: false, reason: verdict.reason });
        else {
          // The person's to answer: the call is held, and the request goes out with its work item. The session's limit runs on meanwhile.
          session.asks.set(event.id, { id: this.nextPermissionId++, headlessId: info.id, tool: event.tool, action: event.action, text: event.text, at: (this.options.now ?? Date.now)() });
          this.broadcastInbox();
        }
        return;
      }
      if (event.type === "permission-withdrawn") {
        if (session.asks.delete(event.id)) this.broadcastInbox();
        return;
      }
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
    this.options.roleAdapter.start({ prompt: info.prompt, cwd, ...(info.role ? { role: info.role } : {}) }, onEvent).then(
      (run) => {
        // A daemon that closed while the adapter was starting stopped no run of this session, and neither did what ended the session meanwhile.
        if (this.closed || info.state !== "working") void run.stop();
        else session.run = run;
      },
      (error: unknown) => {
        // A session that ended while its adapter was starting keeps what ended it, and is told to nobody again. One the
        // list no longer holds ended first: the bound drops only ended sessions, and a delete or a removal stops its
        // working ones before it drops them.
        if (info.state !== "working") return;
        failed(error instanceof Error ? error.message : String(error));
      },
    );
  }

  /**
   * Sends every client one headless session whole, after it changed. A
   * session that has just ended no longer waits for its limit, and where more
   * sessions have ended than the daemon keeps, the one that ended first
   * leaves the list and every client is told. A session that is no longer
   * working waits for no answer, so the requests it held end unanswered, and
   * every client is sent the lists without them.
   */
  private headlessChanged(session: HeadlessSession): void {
    this.broadcast({ type: "headless", headless: session.info });
    if (session.info.state !== "working" && session.asks.size > 0) {
      session.asks.clear();
      this.broadcastInbox();
    }
    if (session.info.state !== "working" && !this.endedHeadless.has(session.info.id)) {
      clearTimeout(session.limit);
      this.endedHeadless.add(session.info.id);
      const kept = this.options.keptHeadless ?? HEADLESS_KEPT;
      for (const id of this.endedHeadless) {
        if (this.endedHeadless.size <= kept) break;
        this.endedHeadless.delete(id);
        this.headless.delete(id);
        this.broadcast({ type: "headlessDropped", id });
      }
    }
    this.settleHold();
    this.checkIdle();
  }

  /** Starts a pane's process in `cwd`, and sends its output to the client that asked for it. `continueLatest` is true only for a `start` that asked it of a kind that continues. */
  private startSession(socket: WebSocket, pane: { kind: PaneKind; cols: number; rows: number }, cwd: string, workItemId: number, continueLatest = false): SessionInfo {
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
    let exited = (): void => {};
    const session: Session = {
      info: { id, kind: pane.kind, alive: true, workItemId, state: null, stateSince: null, stateText: null, stateTool: null },
      terminal,
      output: new OutputBuffer(this.options.bufferChars ?? 256 * 1024),
      silentStart: undefined,
      exited: new Promise<void>((resolve) => {
        exited = resolve;
      }),
    };
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
      exited();
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

  /** The work items that are not archived, as an `inbox` and a look list them. */
  private workItemList(): WorkItem[] {
    return this.store.workItems().filter(({ item }) => item.archivedAt === null).map((held) => this.workItemOf(held));
  }

  /** The four lists a `ready` and an `inbox` carry: the sessions, every repository, the work items that are not archived, and the archived ones. */
  private lists(): { sessions: SessionInfo[]; repositories: Repository[]; workItems: WorkItem[]; archived: WorkItem[] } {
    return {
      sessions: this.sessionList(),
      repositories: this.store.repositories().map((repository) => this.repositoryOf(repository)),
      workItems: this.workItemList(),
      archived: this.store.workItems().filter(({ item }) => item.archivedAt !== null).map((held) => this.workItemOf(held)),
    };
  }

  /** A repository as a client is sent it: without its work items, which name it by its id, and with the name a person reads. */
  private repositoryOf({ id, folder, name, icon, defaultBase, hidden, groups }: StoredRepository): Repository {
    return { id, folder, name: name ?? basename(folder), customName: name, icon, defaultBase, hidden, groups: groups.map((group) => ({ ...group })) };
  }

  /** A work item as a client is sent it: with its repository's id, folder and name, with what was last read of its branch, and with the requests of its headless sessions that wait for the person, the oldest first. */
  private workItemOf({ repository, item }: Held): WorkItem {
    const read = this.branches.get(item.id);
    return {
      ...item,
      repoId: repository.id,
      repo: repository.folder,
      repoName: repository.name ?? basename(repository.folder),
      aheadOfBase: this.aheadCounts.get(item.id) ?? null,
      newCommits: this.commitCounts.get(item.id) ?? null,
      commits: read?.commits ?? null,
      changes: read?.changes ?? null,
      permissions: [...this.headless.values()].flatMap((session) => (session.info.workItemId === item.id ? [...session.asks.values()] : [])).sort((a, b) => a.id - b.id),
    };
  }

  /** Sends every client the whole of the four lists, after one of them changed. */
  private broadcastInbox(): void {
    this.broadcast({ type: "inbox", ...this.lists() });
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
   * Reads from git the new commits of each work item that is not archived,
   * and tells every client where a count changed or a branch's head moved.
   * An archived work item keeps what was last read of its branch.
   */
  private async readCommits(): Promise<void> {
    const moved = await Promise.all(
      this.store
        .workItems()
        .filter(({ item }) => item.archivedAt === null)
        .map((held) => this.readBranch(held)),
    );
    if (moved.includes(true)) this.broadcastInbox();
  }

  /**
   * Reads one work item's new commits from git, and answers whether a count
   * changed or its branch's head moved. How far a branch is ahead of its
   * base branch is counted at every read, since the base moves by itself. The
   * commits and the changed files are read only where the head is another
   * commit than the one they were last read at.
   */
  private async readBranch({ repository, item }: Held): Promise<boolean> {
    // A work item from before the base commit was recorded has nothing to count from.
    const { baseCommit, branch } = item;
    if (baseCommit === null) return false;
    let changed = false;
    const repo = repository.folder;
    const [count, head] = await Promise.all([newCommits(repo, branch, baseCommit), branchHead(repo, branch)]);
    // A rename takes the old name away before the store holds the new one, and a read in between finds no branch. It is dropped, and the next read is of the new name.
    if (this.renaming.has(item.id) || item.branch !== branch) return false;
    if (count !== (this.commitCounts.get(item.id) ?? null)) {
      this.commitCounts.set(item.id, count);
      changed = true;
    }
    const ahead = item.baseBranch === null || head === null ? null : await aheadOf(repo, item.baseBranch, head);
    if (ahead !== (this.aheadCounts.get(item.id) ?? null)) {
      this.aheadCounts.set(item.id, ahead);
      changed = true;
    }
    if (head === (this.branches.get(item.id)?.head ?? null)) return changed;
    if (head === null) {
      // The branch is gone, and what was read of it with it.
      this.branches.delete(item.id);
      return true;
    }
    // Read at the commit and not at the branch, so what is kept is what that head holds though the branch moves meanwhile.
    const [commits, changes] = await Promise.all([branchCommits(repo, baseCommit, head), branchChanges(repo, baseCommit, head)]);
    this.branches.set(item.id, { head, commits, changes });
    return true;
  }

  /**
   * Asks the adapter what a person should know of its agent, and tells every
   * client where the answer differs from the one the daemon holds. A client
   * that has not been sent its `ready` yet reads the answer there. Where the
   * adapter was asked again meanwhile, this answer is dropped: the later
   * ask's is the newer reading.
   */
  private async readAgentNotice(): Promise<void> {
    const ask = ++this.noticeAsks;
    const notice = await this.options.roleAdapter.notice();
    if (ask !== this.noticeAsks || notice === this.agentNotice) return;
    this.agentNotice = notice;
    this.broadcast({ type: "agentNotice", notice });
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
