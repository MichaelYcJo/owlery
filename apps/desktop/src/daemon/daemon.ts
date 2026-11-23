import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { basename, isAbsolute, join, relative } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { isKeepAwakeChoice } from "../shared/keep-awake";
import { type Chain, type ChainStage, type ChainStageKind, type Changes, type ClientMessage, type CommitInfo, type Decision, type DecisionKind, type HeadlessInfo, type KeepAwake, type PaneKind, type PaneKindInfo, type PermissionAsk, type Question, type RecordsPlace, type Repository, type RoleStage, type Running, type ServerMessage, type SessionInfo, UNAUTHORIZED, type Unread, type WorkItem, type WorktreeSetup, losesWork, roleStageOf } from "../shared/protocol";
import type { RoleAdapter, RoleEvent, RoleFeature, RoleRun } from "./adapters/adapter";
import { agentEventFor, agentSaid } from "./agent-events";
import { agentStateAfter } from "./agent-state";
import { OutputBuffer } from "./buffer";
import {
  type Ask,
  CHAIN_STAGES_KEPT,
  ChainStop,
  ORCHESTRATOR,
  PARKED_SAYS,
  READING_SAYS,
  REFUSALS_FILE,
  ROUNDS_CEILING,
  ROUNDS_FOLDER,
  type RefusedCall,
  type StagePrompt,
  type StageRefusals,
  StageStopped,
  type Standing,
  type Step,
  asksOf,
  ceilingSays,
  chainStoppedSays,
  convergenceDecided,
  convergenceOf,
  convergencePrompt,
  fixPassPrompt,
  fixPassRecord,
  fixedCommitsHeld,
  gateBefore,
  inFolder,
  leftOpen,
  leftOpenAgain,
  notConvergingSays,
  notResumedSays,
  parkedGrounds,
  passedBefore,
  promptText,
  refusalsText,
  reviewedSays,
  roundFile,
  roundPrompt,
  roundRecordOf,
  routingText,
  rulingPrompt,
  rulingsOf,
  runningSays,
  standingOf,
  stepOwed,
  stoppedSays,
} from "./chain";
import { RECORD_FILE, ROUTING_FILE, type DecisionRecord, readDecisionRecord, withAnswer, withApplied, withBranch, withDecision, withQuestion, withReversal, workItemDirectories, workItemDirectory, writeRecord } from "./decision-record";
import { setupPaneCommand } from "./hooks";
import { type HoldAwake, KeepAwakeStore, wantsAwake } from "./keep-awake";
import { LastLook } from "./last-look";
import { RecordTimes } from "./record-times";
import { planRecords, readRecordsPlace, rootOf, setUpRecords } from "./records-place";
import { type Held, RepositoryStore, type StoredRepository } from "./repositories";
import { writeRecordFile } from "./record-writer";
import { repositoryFileText } from "./repository-file";
import { verdictOn } from "./role-grants";
import { INCLUDE_FILE, PANE_ENDED, SETUP_FILE, beginSetup, endedSetup, readSetup, signalEnded } from "./worktree-setup";
import { BaseFetches, baseDistance, branchChanges, branchCommits, branchHead, commitNamed, commitPaths, createWorktree, diffBetween, fileAt, newCommits, planBranchRename, planWorktree, readLoss, removeBranch, removeWorktree, renameBranch, repositoryOf, slugFor, uncommittedPaths, whyNoCommit, worktreeHead, worktreesRoot } from "./worktrees";

/** How much of a state's text the daemon keeps, and of each text it writes into a work item's record. */
const STATE_TEXT_CHARS = 2000;

/** The first `STATE_TEXT_CHARS` characters of a text, less a half of a character the cut would leave at its end. */
function cutText<T extends string | null>(text: T): T | string {
  if (text === null || text.length <= STATE_TEXT_CHARS) return text;
  const last = text.charCodeAt(STATE_TEXT_CHARS - 1);
  // A character outside the basic plane is two of a string's, and the first of the two alone is no character.
  return text.slice(0, last >= 0xd800 && last <= 0xdbff ? STATE_TEXT_CHARS - 1 : STATE_TEXT_CHARS);
}

/** The setup command a creation or a run again carries, the one its client showed the person: none where it carries no text, so no command runs that nobody was shown. */
function shownCommand(message: { setupCommand?: unknown }): string | null {
  return typeof message.setupCommand === "string" ? message.setupCommand : null;
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

/** The kinds of a decision. */
const DECISION_KINDS: readonly DecisionKind[] = ["route", "default", "scope", "answered"];

/** What the daemon holds of one read of a work item's record, as a client is sent it. */
interface RecordRead {
  decisions: Decision[];
  questions: Question[];
  unread: Unread[];
}

/** What a work item holds of its record where its worktree holds none. */
const NO_RECORD: RecordRead = { decisions: [], questions: [], unread: [] };

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
  /** The command of a setup pane, given the command a repository's `.worktreesetup` holds and the pane's id; `setupPaneCommand` of the daemon's environment when absent. */
  setupCommandFor?: (command: string, id: number) => PaneCommand;
  /** The adapter every headless session is started through. */
  roleAdapter: RoleAdapter;
  /** Where the repositories and their work items are kept, in `repositories.json`, the last look, in `last-look.json`, the choice of when to keep the Mac awake, in `keep-awake.json`, and the times the daemon first read each block of a work item's record at, in `record-times.json`; without it all four are in memory alone. */
  runDir?: string;
  /** How the daemon holds the Mac awake. A daemon given none holds nothing, sends no `keepAwake` and takes no choice. */
  holdAwake?: HoldAwake;
  /** The version of Owlery this daemon is, which the workflow a setup of the records place writes fetches the check at. A daemon given none plans and sets up no records place. */
  version?: string;
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
  /** The round a chain stops at where it leaves a finding open, whatever the orchestrator would answer; `ROUNDS_CEILING` of `chain.ts` when absent. */
  roundsCeiling?: number;
  /** How much recent output each session keeps for a client that reconnects. */
  bufferChars?: number;
  /** How long a client has to present the token. */
  helloTimeoutMs?: number;
  /** How long the daemon waits, with no session alive, no headless session working, no chain running and no client connected, before it asks to exit. */
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
  /** Whether the daemon ended the pane's process, at a close, an archive, a removal or a delete. */
  ended: boolean;
}

interface HeadlessSession {
  info: HeadlessInfo;
  /** What the session's agent is given: `info.prompt`, and for a stage of a chain the diff after it. */
  prompt: string;
  /** The adapter's run, once it has started. */
  run: RoleRun | undefined;
  /** Settled once the adapter has started the run or refused to: the run, or nothing where none started. It never rejects. */
  started: Promise<RoleRun | undefined>;
  /** Settled once the session is no longer working. */
  ended: Promise<void>;
  /** Settles `ended`. */
  end: () => void;
  /** The calls of the session its role's rule refused, in their order: each one's tool, what it does and the rule's name. */
  refusals: RefusedCall[];
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
  // When the daemon first read each block of each work item's record in its state. The record holds no clock.
  private readonly times: RecordTimes;
  // What was last read of each work item's record of decisions and questions, by the work item's id, as a client is sent it. The record is the store: this is what the last read found, and nothing is written from it.
  private readonly recordsRead = new Map<number, RecordRead>();
  // The hold that stands now, where one does. The daemon holds one at most.
  private hold: { release(): void } | undefined;
  // The fetches of the bases work items start from: a form's and a creation's of one branch are one fetch.
  private readonly fetches: BaseFetches;
  // What takes or gives up a branch runs one after another: a creation, a rename that renames a branch, and a delete. So two creations of one title never pick the same branch and folder, a rename never takes the branch a creation chose, and a creation never takes the name of a branch a delete is removing. A repository's removal runs among them, so no creation adds a work item to the repository while the removal waits for its sessions to end. A plan and a read of a loss change nothing and do not wait behind them.
  private changing: Promise<void> = Promise.resolve();
  // The new commits last read for each work item, by its id; the list itself does not store them.
  private readonly commitCounts = new Map<number, number | null>();
  // How far each work item's branch was last read to be from its base branch, by the work item's id: the commits it holds that the base does not, and the commits the base holds that it does not.
  private readonly aheadCounts = new Map<number, { ahead: number; behind: number } | null>();
  // The last commit of a person's word that was asked for in each worktree, by the worktree: it ends once every one before it has, so two commits of one worktree never run git at once.
  private readonly wordCommits = new Map<string, Promise<void>>();
  // The last word of a person that was taken for each worktree, by the worktree: it ends once git has said where the worktree stands and the word is written or refused, after every one before it, so the words of one worktree are written in the order they came.
  private readonly words = new Map<string, Promise<void>>();
  // What was last read of each work item's branch, by the work item's id: the head it was read at, and the commits and the changes read there.
  private readonly branches = new Map<number, { head: string; commits: CommitInfo[] | null; changes: Changes | null }>();
  /** What each repository's main checkout held of the records place when it was last read, by the repository's id. */
  private readonly records = new Map<number, RecordsPlace>();
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
  // The work items whose chain is running, by their ids, each with the promise of its run's end. A chain is here from its start until it rests, between two stages too, when no session of it works.
  private readonly chains = new Map<number, Promise<void>>();
  // Settled once the daemon closes, so a chain that waits for a stage's session waits no longer.
  private closing: () => void = () => {};
  private readonly closes = new Promise<void>((resolve) => {
    this.closing = resolve;
  });
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
    this.times = new RecordTimes(options.runDir);
    // No pass reads an archived work item, so its record is read here, at the daemon's start, and at its archive.
    for (const held of this.store.workItems()) if (held.item.archivedAt !== null) this.readRecord(held);
    this.flushTimes();
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
   * state began and what the event that began it said, the questions it asks
   * the person among it. An event that asks a question leaves the session
   * waiting. An event that leaves the state as it was changes none of them.
   * Any event ends the pane's silent start, an event the daemon maps to no
   * neutral one among them.
   */
  agentEvent(paneId: number, hookName: string, payload: Record<string, unknown>): void {
    const session = this.sessions.get(paneId);
    clearTimeout(session?.silentStart);
    const event = agentEventFor(hookName);
    if (!event) return;
    const tool = typeof payload.tool_name === "string" ? payload.tool_name : null;
    this.broadcast({ type: "agent", id: paneId, event, tool, at: Date.now() });
    if (!session || !this.reportsState(session.info.kind)) return;
    const said = agentSaid(hookName, payload);
    const state = agentStateAfter(event, said.questions !== null);
    if (state === session.info.state) return;
    session.info.state = state;
    session.info.stateSince = state === null ? null : (this.options.now ?? Date.now)();
    session.info.stateText = cutText(said.text);
    session.info.stateTool = said.tool;
    session.info.stateQuestions = said.questions && said.questions.map(({ asks, options, multiple }) => ({ asks: cutText(asks), options: options.map(({ label, implies }) => ({ label: cutText(label), implies: cutText(implies) })), multiple }));
    this.broadcastInbox();
  }

  /**
   * Writes a decision made for a work item in place of asking the person into
   * the work item's record, as a block that stands `decided`, and sends every
   * client the lists, in which the work item holds it. The daemon's own code
   * calls it, as it calls `agentEvent`: no client's message records a
   * decision. It returns the decision as read back from the record, with its
   * id and the daemon's time. It holds nothing: it changes no session and no
   * other work item, starts and stops nothing, and commits nothing. What was
   * decided, its grounds and who decided are written without the white space
   * at their ends, 2000 characters of each at most. It returns nothing,
   * writes nothing and sends nothing for a work item the daemon does not
   * keep, one whose worktree holds no directory of its own, a kind that is
   * none of `DecisionKind`, what was decided or grounds that are empty or no
   * text, who decided that is empty or no text, and where the record's
   * writer throws, which the log then says.
   */
  decided(workItemId: number, decision: { kind: DecisionKind; says: string; grounds: string; by?: string | null }): Decision | undefined {
    const { kind, says, grounds, by = null } = (typeof decision === "object" && decision !== null ? decision : {}) as { kind?: unknown; says?: unknown; grounds?: unknown; by?: unknown };
    const held = this.store.workItem(workItemId);
    if (!held || !DECISION_KINDS.includes(kind as DecisionKind) || typeof says !== "string" || typeof grounds !== "string" || (by !== null && typeof by !== "string")) return undefined;
    const kept = { kind: kind as DecisionKind, decided: cutText(says.trim()), grounds: cutText(grounds.trim()), by: by === null ? null : cutText(by.trim()) };
    if (kept.decided === "" || kept.grounds === "" || kept.by === "") return undefined;
    const written = this.writtenRecord(held, (text) => withDecision(text, kept));
    const id = written?.decisions.at(-1)?.id;
    if (id === undefined) return undefined;
    this.broadcastInbox();
    return this.recordsRead.get(workItemId)?.decisions.find((each) => each.id === id);
  }

  /**
   * Parks a work item: writes each question for the person into the work
   * item's record as an `open` block, all in one write of the file, and
   * sends every client the lists, in which the work item holds them. The
   * daemon's own code calls it, as it calls `decided`: no client's message
   * parks a work item. It returns the questions as read back from the
   * record, each with its id and the daemon's time. It holds nothing but
   * that one work item's wait for the person: it starts nothing, stops
   * nothing and refuses nothing in any work item, the parked one among them,
   * whose panes and whose `ask` are served as before, and it commits
   * nothing. A park of a work item that is already parked adds its
   * questions. Who asks and each text of a question are written without the
   * white space at their ends, 2000 characters of each at most. It returns
   * nothing, writes nothing and sends nothing for a work item the daemon
   * does not keep, an archived one, one whose worktree holds no directory of
   * its own, a call with no question, a question whose text or grounds are
   * empty or no text, two options of one question with one label, a default
   * that names no option of its question, an option whose label is empty or
   * whose label or implication is no text, an asker that is empty or no
   * text, and where the record's writer throws, which the log then says.
   */
  park(workItemId: number, asking: { by?: string | null; questions: { asks: string; grounds: string; options?: { label: string; implies: string }[]; default?: string | null }[] }): Question[] | undefined {
    const held = this.store.workItem(workItemId);
    if (!held || held.item.archivedAt !== null) return undefined;
    const { by = null, questions } = (typeof asking === "object" && asking !== null ? asking : {}) as { by?: unknown; questions?: unknown };
    if ((by !== null && typeof by !== "string") || !Array.isArray(questions) || questions.length === 0) return undefined;
    const asker = by === null ? null : cutText(by.trim());
    if (asker === "") return undefined;
    const kept: { asks: string; grounds: string; by: string | null; options: { label: string; implies: string }[]; default: string | null }[] = [];
    for (const question of questions as unknown[]) {
      const { asks, grounds, options = [], default: taken = null } = (typeof question === "object" && question !== null ? question : {}) as { asks?: unknown; grounds?: unknown; options?: unknown; default?: unknown };
      if (typeof asks !== "string" || typeof grounds !== "string" || !Array.isArray(options) || (taken !== null && typeof taken !== "string")) return undefined;
      const one = { asks: cutText(asks.trim()), grounds: cutText(grounds.trim()), by: asker, options: [] as { label: string; implies: string }[], default: taken === null ? null : cutText(taken.trim()) };
      if (one.asks === "" || one.grounds === "") return undefined;
      for (const option of options as unknown[]) {
        const { label, implies } = (typeof option === "object" && option !== null ? option : {}) as { label?: unknown; implies?: unknown };
        if (typeof label !== "string" || typeof implies !== "string" || label.trim() === "") return undefined;
        const named = cutText(label.trim());
        // An answer is an option's label, so two options of one label would leave the record unable to say which was chosen.
        if (one.options.some((each) => each.label === named)) return undefined;
        one.options.push({ label: named, implies: cutText(implies.trim()) });
      }
      if (one.default !== null && !one.options.some((each) => each.label === one.default)) return undefined;
      kept.push(one);
    }
    const written = this.writtenRecord(held, (text) => kept.reduce(withQuestion, text));
    if (written === undefined) return undefined;
    const ids = new Set(written.questions.slice(-kept.length).map((each) => each.id));
    this.broadcastInbox();
    return this.recordsRead.get(workItemId)?.questions.filter((each) => ids.has(each.id));
  }

  /**
   * Applies a change to the record of a work item's directory, through the
   * record's writer, and reads the record again for the lists. It gives the
   * record as the writer read it back, or nothing where the work item's
   * worktree holds no directory of its own or the writer throws, which the
   * log then says: the file is then as it stood.
   */
  private writtenRecord(held: Held, change: (text: string) => string): DecisionRecord | undefined {
    const directory = workItemDirectory(held.item.worktree, held.item.branch);
    if (directory === null) return undefined;
    let written: DecisionRecord;
    try {
      written = writeRecord(held.item.worktree, directory, change);
    } catch (error) {
      console.error(`the record was not written: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
    this.readRecord(held);
    this.flushTimes();
    return written;
  }

  /**
   * Reads a work item's record of decisions and questions from its worktree,
   * committed or not, and answers whether it reads otherwise than at the last
   * read. A work item whose worktree holds no directory of its own, or whose
   * directory holds no record, has no decision and no question. A block the
   * reader refuses and a fence it names as not read are no decision and no
   * question: each is kept as an unread line with the reader's reason, and
   * nothing is decided on it. A record that stands and cannot be read is one
   * unread line that says why: a record that is a link, one that is no plain
   * file and one over `REPOSITORY_FILE_BYTES` among them, as
   * `repositoryFileText` refuses each. Each block's time is the daemon's own,
   * from the store of the times.
   */
  private readRecord({ item }: Held): boolean {
    const directory = workItemDirectory(item.worktree, item.branch);
    let record: Pick<DecisionRecord, "decisions" | "questions" | "refusals" | "notices"> = { decisions: [], questions: [], refusals: [], notices: [] };
    if (directory !== null) {
      try {
        const text = repositoryFileText(join(directory, RECORD_FILE));
        if (text !== null) record = readDecisionRecord(text);
      } catch (error) {
        record = { ...record, refusals: [{ line: 1, why: `the record cannot be read: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
    const since = this.times.since(item.id, [...record.decisions, ...record.questions].map(({ id, state }) => ({ id, state: state.is })), (this.options.now ?? Date.now)());
    const read: RecordRead = {
      decisions: record.decisions.map(({ id, kind, decided, grounds, by, state }) => ({
        id,
        kind,
        says: decided,
        grounds,
        by,
        state: state.is,
        reversal: state.is === "decided" ? null : state.message,
        landed: state.is === "applied" ? state.commit : state.is === "carried" ? state.home : null,
        since: since.get(id) ?? null,
      })),
      questions: record.questions.map(({ id, asks, grounds, by, options, default: taken, state }) => ({ id, asks, grounds, by, options: options.map(({ label, implies }) => ({ label, implies })), default: taken, answer: state.is === "answered" ? state.answer : null, since: since.get(id) ?? null })),
      unread: [...record.refusals, ...record.notices].map(({ line, why }) => ({ line, why })).sort((a, b) => a.line - b.line),
    };
    const before = this.recordsRead.get(item.id);
    this.recordsRead.set(item.id, read);
    return JSON.stringify(read) !== JSON.stringify(before ?? NO_RECORD);
  }

  /** Writes the times of the records where a read or a drop changed them. The store holds a change in memory before it writes it, so where the write throws the log says so, and the daemon goes on with what it holds. */
  private flushTimes(): void {
    try {
      this.times.flush();
    } catch (error) {
      console.error(`the times of the records were not written: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    this.closing();
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
    // A person's word whose worktree git is still reading is waited for, and then its commit and every other under way, so the close leaves no git at work in a worktree.
    const words = Promise.all(this.words.values()).then(() => Promise.all(this.wordCommits.values()));
    // A chain's run ends at its next step once the daemon has closed, and its stored chain stays `running`, which the next daemon reads as stopped.
    await Promise.all([new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve())), ...stops, words, ...this.chains.values()]);
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
            // The included paths are copied before the work item is listed, so no pane of it starts before they stand. The command runs only as the form showed it.
            const setup = await beginSetup(place.repo, place.worktree, this.options.now ?? Date.now, shownCommand(message));
            // A work item nobody named is called what its branch and its folder are, the number they got among it. The store adds the repository first where it does not keep it, and shows it again where it was hidden.
            const stored = this.store.addWorkItem({ title: message.title.trim() || basename(place.worktree), ...place });
            // The times of the records are keyed by a work item's id, which `repositories.json` gives. Where that file was lost or read as no repository, its ids begin again, so what the store holds under the id given now was an earlier work item's. It is dropped here, as the id is given, and not at the daemon's start, so a start that misreads `repositories.json` loses nothing that file still holds.
            this.times.drop([stored.item.id]);
            this.flushTimes();
            // A creation is also how a repository is added, so the inbox below says what it holds of the records place.
            this.readRecords(stored.repository);
            // The branch was cut at its base commit a moment ago, so it holds nothing new and git is not asked.
            this.commitCounts.set(stored.item.id, 0);
            if (place.baseBranch !== null) this.aheadCounts.set(stored.item.id, { ahead: 0, behind: 0 });
            this.branches.set(stored.item.id, { head: place.baseCommit, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] } });
            // The setup pane starts first, and the answer carries the pane the creation named.
            this.startSetup(socket, message, stored.item.id, place.worktree, setup);
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
            // The files are read from the main checkout, as a creation reads them. One that cannot be read names nothing here, and a creation says why.
            const named = await repositoryOf(message.repo).then(readSetup).catch(() => ({ include: false, command: null }));
            this.send(socket, { type: "workItemPlan", requestId: message.requestId, ...planned, setupCommand: named.command, includes: named.include });
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
            const { repository, changed } = this.store.addRepository(await repositoryOf(message.folder));
            // Read at the addition, so the inbox that lists the repository says what it holds of the records place.
            const read = this.readRecords(repository);
            // The answer first, so the client that asked knows its request was carried out when the inbox lists the repository.
            this.send(socket, { type: "done", requestId: message.requestId });
            if (changed || read) this.broadcastInbox();
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
            this.records.delete(repository.id);
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
      case "planRecords": {
        const plan = async (): Promise<void> => {
          try {
            const repository = this.store.repository(message.id);
            if (!repository) throw new Error(`no repository ${String(message.id)}`);
            if (typeof message.broadGate !== "string") throw new Error("a plan of the records place names the broad gate command, which may be empty");
            this.send(socket, { type: "recordsPlan", requestId: message.requestId, id: repository.id, plan: await planRecords(repository.folder, message.broadGate, this.version()) });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A plan writes nothing, so it is answered while a creation or a delete is under way.
        void plan();
        return;
      }
      case "setUpRecords": {
        const setUp = async (): Promise<void> => {
          try {
            const repository = this.store.repository(message.id);
            if (!repository) throw new Error(`no repository ${String(message.id)}`);
            const { broadGate, stamp } = message as { broadGate: unknown; stamp: unknown };
            if (typeof broadGate !== "string" || typeof stamp !== "string") throw new Error("a setup of the records place names the broad gate command and the stamp of the plan the person read");
            await setUpRecords(repository.folder, broadGate, this.version(), stamp);
            const read = this.readRecords(repository);
            // The answer first, so the client that asked knows its request was carried out when the inbox carries what the repository holds now.
            this.send(socket, { type: "done", requestId: message.requestId });
            if (read) this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A setup commits in the main checkout, so it waits behind the creations, the renames of a branch and the deletes.
        this.changing = this.changing.then(setUp);
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
      case "reverseDecision": {
        const reverse = async (): Promise<void> => {
          try {
            const { workItemId, decisionId, message: typed } = message as { workItemId: unknown; decisionId: unknown; message: unknown };
            if (typeof workItemId !== "number" || typeof decisionId !== "number" || typeof typed !== "string") throw new Error("a reversal names a work item, a decision of it and a message");
            const said = cutText(typed.trim());
            if (said === "") throw new Error("Say why the decision is reversed.");
            // The writer refuses an id the record holds no decision of and a decision that does not stand `decided`, in its own words.
            await this.personWrote(workItemId, `chore: record the person's reversal of decision ${String(decisionId)}`, (text) => withReversal(text, decisionId, said));
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the reversal.
            this.send(socket, { type: "done", requestId: message.requestId });
            this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // Git says where the worktree stands before the word is written, so the answer comes after this call has returned.
        void reverse();
        return;
      }
      case "answerQuestions": {
        const answer = async (): Promise<void> => {
          try {
            const { workItemId, answers } = message as { workItemId: unknown; answers: unknown };
            const given = Array.isArray(answers) ? (answers as unknown[]).map((answer) => (typeof answer === "object" && answer !== null ? answer : {}) as { questionId?: unknown; answer?: unknown }) : undefined;
            if (typeof workItemId !== "number" || !given || !given.every((answer) => typeof answer.questionId === "number" && typeof answer.answer === "string")) throw new Error("an answer names a work item and gives an answer to each of its open questions");
            await this.personWrote(workItemId, "chore: record the person's answers", (text) => {
              // The open questions are read from the text the write is applied to, so the answers are held against the record as it stands at the write.
              const open = readDecisionRecord(text).questions.filter((question) => question.state.is === "open");
              if (open.length === 0) throw new Error(`Work item ${String(workItemId)} waits for no answer.`);
              const said = new Map<number, string>();
              for (const { questionId, answer } of given as { questionId: number; answer: string }[]) {
                if (!open.some((question) => question.id === questionId)) throw new Error(`Work item ${String(workItemId)} holds no open question ${String(questionId)}.`);
                if (said.has(questionId)) throw new Error(`Question ${String(questionId)} is answered twice.`);
                said.set(questionId, cutText(answer.trim()));
                if (said.get(questionId) === "") throw new Error(`Give an answer to question ${String(questionId)}.`);
              }
              const left = open.find((question) => !said.has(question.id));
              if (left) throw new Error(`Question ${String(left.id)} has no answer.`);
              return [...said].reduce((next, [questionId, answer]) => withAnswer(next, questionId, answer), text);
            });
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the answers.
            this.send(socket, { type: "done", requestId: message.requestId });
            this.broadcastInbox();
            // The answers left the record with no open question, so a chain they parked runs the step it owes. Its start waits where a `getSeal`'s does.
            if (this.store.workItem(workItemId)?.item.chain?.state === "parked") this.changing = this.changing.then(() => this.resumeChain(workItemId));
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // As a reversal is: the answer comes after git has said where the worktree stands.
        void answer();
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
            // The work item's directory, where the rename wrote the new branch into its routing.
            let routed: string | null = null;
            if (message.branch) {
              // A chain finds the work item's directory by the branch its routing names, at each stage.
              if (this.chains.has(message.id)) throw new Error("The work item's chain is running, and it finds the work item's records by the branch's name. Rename the branch once the chain rests.");
              // The conditions the person's dialog read are read again here, at the rename, and nothing is changed where one no longer holds or git refuses.
              const plan = await planBranchRename(held.repository.folder, branch, title);
              if (plan.blocked !== null || plan.branch === null) throw new Error(plan.blocked ?? "The name names no branch.");
              this.renaming.add(message.id);
              holds = true;
              await renameBranch(held.repository.folder, branch, plan.branch);
              // The work item's directory is found by the branch its routing names, so the row follows the branch while the reads are still held off.
              routed = this.routeRenamed(held.item.worktree, branch, plan.branch);
              branch = plan.branch;
            }
            // What was read of the branch is kept by the work item's id, and its head did not move, so the counts and the commits stand.
            const changed = this.store.setWorkItem(message.id, { title, branch });
            if (routed !== null) this.commitWord(held, routed, "chore: name the renamed branch in the work item's routing", ROUTING_FILE);
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
              // No pass reads an archived work item, so its record is read here, as it stands at the archive.
              this.readRecord(held);
              this.flushTimes();
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
          // Neither git nor the record was read for the work item while it was archived, so its record is read now, and its branch, and not at the next read of them all.
          const held = this.store.workItem(message.id);
          if (held) {
            this.readRecord(held);
            this.flushTimes();
          }
          this.broadcastInbox();
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
      case "runSetup": {
        const run = async (): Promise<void> => {
          try {
            const { workItemId } = message;
            if (typeof workItemId !== "number" || typeof message.cols !== "number" || typeof message.rows !== "number") throw new Error("a run of the setup names a work item and the size of its pane");
            // Nothing runs in a work item the daemon does not list, nor in an archived one, nor in one being deleted.
            if (this.worktreeFor(socket, message.requestId, workItemId) === undefined) return;
            const held = this.store.workItem(workItemId);
            if (!held) throw new Error(`no work item ${String(workItemId)}`);
            const earlier = held.item.setup;
            if (earlier?.state === "running") throw new Error(`The setup of work item ${String(workItemId)} is still running.`);
            const setup = await beginSetup(held.repository.folder, held.item.worktree, this.options.now ?? Date.now, shownCommand(message));
            if (setup === null) throw new Error(`${held.repository.folder} names no setup: it holds neither ${INCLUDE_FILE} nor ${SETUP_FILE}.`);
            // An archive or a delete may have begun during the copy, and no pane starts in either.
            if (this.worktreeFor(socket, message.requestId, workItemId) === undefined) return;
            // The earlier setup pane, which has exited, leaves the lists, and the record names the new one.
            const before = earlier?.paneId ?? null;
            if (before !== null && this.sessions.get(before)?.info.alive === false) this.sessions.delete(before);
            const recorded = this.startSetup(socket, message, workItemId, held.item.worktree, setup);
            const pane = recorded?.paneId === null || recorded?.paneId === undefined ? undefined : this.sessions.get(recorded.paneId);
            // The answer first, so the client that asked knows the pane as its own when the inbox lists it.
            this.send(socket, pane ? { type: "started", requestId: message.requestId, session: pane.info } : { type: "done", requestId: message.requestId });
            this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // It copies into a worktree, so it waits behind the creations and the deletes, and no delete removes the folder meanwhile.
        this.changing = this.changing.then(run);
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
        session.ended = true;
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
        // The answer first, so the client that asked knows the session as its own when every client is told of it.
        this.beginHeadless(message.workItemId, { shown: message.prompt, given: message.prompt }, role, worktree, (headless) => this.send(socket, { type: "asked", requestId: message.requestId, headless }));
        return;
      }
      case "getSeal": {
        const start = async (): Promise<void> => {
          try {
            const { workItemId } = message as { workItemId: unknown };
            if (typeof workItemId !== "number") throw new Error("a seal is asked for a work item");
            // Nothing runs in a work item the daemon does not list, nor in an archived one, nor in one being deleted.
            const worktree = this.worktreeFor(socket, message.requestId, workItemId);
            if (worktree === undefined) return;
            await this.beginChain(workItemId, worktree, true);
            // The answer first, so the client that asked knows its request was carried out when the inbox carries the chain.
            this.send(socket, { type: "done", requestId: message.requestId });
            this.broadcastInbox();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        // A chain commits in the worktree and finds its records by the branch's name, so its start waits behind the creations, the renames of a branch and the deletes. The chain itself does not hold them back.
        this.changing = this.changing.then(start);
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

  /** Why nothing starts in a work item now, a pane, a headless session and a stage of a chain alike, or null where one can. */
  private whyNoRun(workItemId: number): string | null {
    const workItem = this.store.workItem(workItemId)?.item;
    if (!workItem) return `no work item ${String(workItemId)}`;
    // Nothing runs in an archived work item, nor in one an archive is ending the sessions of.
    if (workItem.archivedAt !== null || this.archiving.has(workItem.id)) return `work item ${workItem.id} is archived, restore it first`;
    // Nor in one a delete is under way for: git is about to remove its folder.
    if (this.deleting.has(workItem.id)) return `work item ${workItem.id} is being deleted`;
    // A person can remove a worktree's folder by hand, and a process cannot start in it.
    if (!existsSync(workItem.worktree)) return `the folder of work item ${workItem.id} is gone: ${workItem.worktree}`;
    return null;
  }

  /** The worktree of the work item a request names; where it has none to run in (`whyNoRun`), the request is answered with an error. */
  private worktreeFor(socket: WebSocket, requestId: number, workItemId: number): string | undefined {
    const why = this.whyNoRun(workItemId);
    if (why !== null) {
      this.send(socket, { type: "error", requestId, message: why });
      return undefined;
    }
    return this.store.workItem(workItemId)?.item.worktree;
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

  /** Takes off the daemon's lists what it holds of the work items given: their panes, the exited among them, their headless sessions, what was read of each branch and of each record, and the times of each record's blocks, which leave `record-times.json` with them. A delete and a repository's removal call it. The record itself goes with the worktree. What the times hold under an id that is given to a new work item is dropped where the id is given, in the `createWorkItem` case. The store of the repositories is not touched. */
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
      this.recordsRead.delete(id);
    }
    this.times.drop(ids);
    this.flushTimes();
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
    for (const session of panes) {
      session.ended = true;
      session.terminal.kill();
    }
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
        else if (verdict.answer === "refuse") {
          session.refusals.push({ tool: event.tool, action: event.action, rule: verdict.rule });
          session.run?.answer(event.id, { allow: false, reason: verdict.reason });
        } else {
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
    session.started = this.options.roleAdapter.start({ prompt: session.prompt, cwd, ...(info.role ? { role: info.role } : {}) }, onEvent).then(
      (run) => {
        // A daemon that closed while the adapter was starting stopped no run of this session, and neither did what ended the session meanwhile.
        if (this.closed || info.state !== "working") void run.stop();
        else session.run = run;
        return run;
      },
      (error: unknown) => {
        // A session that ended while its adapter was starting keeps what ended it, and is told to nobody again. One the
        // list no longer holds ended first: the bound drops only ended sessions, and a delete or a removal stops its
        // working ones before it drops them.
        if (info.state === "working") failed(error instanceof Error ? error.message : String(error));
        return undefined;
      },
    );
  }

  /**
   * Begins a headless session in a work item's worktree: lists it, starts
   * its time limit, tells every client of it and starts its run through the
   * adapter. An `ask` and a stage of a chain both begin here, so the limit,
   * the stop, the bound of the ended sessions and the answers by the role's
   * grant are one for both. `prompt.given` is what the agent is given and
   * `prompt.shown` what the session lists as its prompt. `first` is called
   * with the session before any client is told of it, for the answer to the
   * client that asked.
   */
  private beginHeadless(workItemId: number, prompt: { shown: string; given: string }, role: RoleStage | null, worktree: string, first?: (info: HeadlessInfo) => void): HeadlessSession {
    let end = (): void => {};
    const ended = new Promise<void>((resolve) => {
      end = resolve;
    });
    const session: HeadlessSession = {
      info: { id: this.nextHeadlessId++, workItemId, prompt: prompt.shown, state: "working", answer: "", error: null, costUsd: null, startedAt: (this.options.now ?? Date.now)(), errorOutput: "", stopped: null, role },
      prompt: prompt.given,
      run: undefined,
      started: Promise.resolve(undefined),
      ended,
      end,
      refusals: [],
      limit: undefined,
      asks: new Map(),
    };
    session.limit = setTimeout(() => void this.stopHeadless(session, "the session reached its time limit and was stopped", "limit"), this.options.headlessLimitMs ?? HEADLESS_LIMIT_MS);
    this.headless.set(session.info.id, session);
    first?.(session.info);
    this.headlessChanged(session);
    this.startHeadless(session, worktree);
    return session;
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
      session.end();
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

  /** Starts a pane's process in `cwd`, and sends its output to the client that asked for it. `continueLatest` is true only for a `start` that asked it of a kind that continues. `commandOf` gives the command of a pane that runs another than its kind's, as a setup pane does. */
  private startSession(socket: WebSocket, pane: { kind: PaneKind; cols: number; rows: number }, cwd: string, workItemId: number, continueLatest = false, commandOf?: (id: number) => PaneCommand): SessionInfo {
    const id = this.nextId++;
    const { command, args, env } = commandOf ? commandOf(id) : this.options.commandFor(pane.kind, id, { continueLatest });
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
      info: { id, kind: pane.kind, alive: true, workItemId, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null },
      terminal,
      output: new OutputBuffer(this.options.bufferChars ?? 256 * 1024),
      silentStart: undefined,
      exited: new Promise<void>((resolve) => {
        exited = resolve;
      }),
      ended: false,
    };
    this.sessions.set(id, session);
    if (this.reportsState(pane.kind)) session.silentStart = setTimeout(() => this.silentStartOver(session), this.options.silentStartMs ?? SILENT_START_MS);
    // What the session prints is kept for a replay and sent to the clients that receive the session.
    const print = (data: string): void => {
      session.output.append(data);
      this.sendOutput(id, data);
    };
    terminal.onData(print);
    terminal.onExit((exitCode, signal) => {
      session.info.alive = false;
      // A setup ends with its pane's process, whether or not the pane is still listed.
      const setupEnded = this.setupExited(workItemId, id, exitCode, signal, session.ended);
      exited();
      clearTimeout(session.silentStart);
      // A closed pane is on no list, and its end is no client's news.
      if (this.sessions.get(id) === session) {
        // The exit line is the session's last output, so a replay of an exited session ends with it and no client writes one of its own.
        print(`\r\n[process exited with code ${exitCode}]\r\n`);
        this.broadcast({ type: "exit", id, exitCode });
        this.broadcastInbox();
      } else if (setupEnded) this.broadcastInbox();
      this.checkIdle();
    });
    this.clients.get(socket)?.add(id);
    this.checkIdle();
    return session.info;
  }

  /**
   * Starts the pane of a setup that runs a command, in the work item's
   * worktree, of the kind `shell` and at the size the request gives, with the
   * command `setupCommandFor` gives, and records the setup with its pane.
   * The client that asked receives the pane's output. Where the pane cannot
   * start, the setup has failed and says why. A setup that has ended already,
   * by its copy or because its command was not the one shown, and none at
   * all, are recorded as they are.
   */
  private startSetup(socket: WebSocket, size: { cols: number; rows: number }, workItemId: number, cwd: string, setup: WorktreeSetup | null): WorktreeSetup | null {
    let recorded = setup;
    const { command } = setup ?? { command: null };
    if (setup?.state === "running" && command !== null) {
      const commandFor = this.options.setupCommandFor ?? ((text: string, id: number) => setupPaneCommand(process.env, text, id));
      try {
        const info = this.startSession(socket, { kind: "shell", cols: size.cols, rows: size.rows }, cwd, workItemId, false, (id) => commandFor(command, id));
        recorded = { ...setup, paneId: info.id };
      } catch (error) {
        recorded = endedSetup(setup, { exitCode: null, failure: `The setup pane could not start: ${error instanceof Error ? error.message : String(error)}` }, (this.options.now ?? Date.now)());
      }
    }
    this.store.setWorkItem(workItemId, { setup: recorded });
    return recorded;
  }

  /**
   * Ends the setup of a work item at the exit of its pane's process, where
   * the setup runs and names that pane, whether or not the pane is still
   * listed: it failed where the daemon ended the pane, and where a signal
   * ended its process, whose exit code then reads 0. A daemon that is
   * closing records nothing, so the next daemon reads the setup as one it
   * stopped. It answers whether it ended one. The store holds the end
   * whether or not its file was written: a pane's exit has no request to
   * answer with the error.
   */
  private setupExited(workItemId: number, paneId: number, exitCode: number, signal: number, ended: boolean): boolean {
    if (this.closed) return false;
    const setup = this.store.workItem(workItemId)?.item.setup;
    if (!setup || setup.state !== "running" || setup.paneId !== paneId) return false;
    try {
      this.store.setWorkItem(workItemId, { setup: endedSetup(setup, { exitCode, failure: ended ? PANE_ENDED : signal !== 0 ? signalEnded(signal) : null }, (this.options.now ?? Date.now)()) });
    } catch (error) {
      console.error(`the end of a setup was not written: ${error instanceof Error ? error.message : String(error)}`);
    }
    return true;
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
    return { id, folder, name: name ?? basename(folder), customName: name, icon, defaultBase, hidden, groups: groups.map((group) => ({ ...group })), records: this.records.get(id) ?? { root: null, check: null, broadGate: null } };
  }

  /** Reads what a repository's main checkout holds of the records place, from its working tree, and answers whether it is another than was last read. */
  private readRecords({ id, folder }: StoredRepository): boolean {
    const read = readRecordsPlace(folder);
    const known = this.records.get(id) ?? { root: null, check: null, broadGate: null };
    this.records.set(id, read);
    return read.root !== known.root || read.check !== known.check || read.broadGate !== known.broadGate;
  }

  /** The version the workflow of a setup fetches the check at. A daemon given none refuses the plan and the setup. */
  private version(): string {
    if (this.options.version === undefined) throw new Error("This build of Owlery names no version, so it cannot write the workflow of the pull request check.");
    return this.options.version;
  }

  /** A work item as a client is sent it: with its repository's id, folder and name, with what was last read of its branch, and with what was last read of its record: its decisions, its questions and what the reader did not read; and with the requests of its headless sessions that wait for the person, the oldest first. */
  private workItemOf({ repository, item }: Held): WorkItem {
    const read = this.branches.get(item.id);
    return {
      ...item,
      repoId: repository.id,
      repo: repository.folder,
      repoName: repository.name ?? basename(repository.folder),
      aheadOfBase: this.aheadCounts.get(item.id)?.ahead ?? null,
      behindBase: this.aheadCounts.get(item.id)?.behind ?? null,
      newCommits: this.commitCounts.get(item.id) ?? null,
      commits: read?.commits ?? null,
      changes: read?.changes ?? null,
      permissions: [...this.headless.values()].flatMap((session) => (session.info.workItemId === item.id ? [...session.asks.values()] : [])).sort((a, b) => a.id - b.id),
      ...(this.recordsRead.get(item.id) ?? NO_RECORD),
    };
  }

  /**
   * Writes a person's word, a reversal or their answers, into the record of
   * a work item, through the record's writer, reads the record again for
   * the lists, and has the record committed under the subject given
   * (`commitWord`). It first asks git where the worktree stands
   * (`worktrees.ts#whyNoCommit`), and the words of one worktree are read and
   * written one after another, in the order they came. It throws, with the
   * file as it stood and no commit, for a work item the daemon does not
   * keep, for a worktree that is not on the work item's branch or has a
   * rebase, a merge, a cherry-pick, a revert or a `git am` under way, for a
   * worktree that holds no directory of the work item, and whatever the
   * change or the writer throws. A word written into a worktree in the
   * middle of a rebase would be lost where the rebase is aborted, and would
   * hold its continue as a change not staged, so it is refused before it is
   * written and the person sends it again.
   */
  private personWrote(workItemId: number, subject: string, change: (text: string) => string): Promise<void> {
    const asked = this.store.workItem(workItemId);
    if (!asked) throw new Error(`no work item ${String(workItemId)}`);
    const { worktree, branch } = asked.item;
    const write = async (): Promise<void> => {
      const why = await whyNoCommit(worktree, branch);
      if (why !== null) throw new Error(`Nothing was written: ${why}. Send it again once the worktree is on its branch and nothing is under way in it.`);
      // The work item is read again: git answered in a later turn of the daemon's thread than the one that took the message.
      const held = this.store.workItem(workItemId);
      if (!held) throw new Error(`no work item ${String(workItemId)}`);
      const directory = workItemDirectory(held.item.worktree, held.item.branch);
      if (directory === null) throw new Error(`Work item ${String(workItemId)} has no record of decisions.`);
      writeRecord(held.item.worktree, directory, change);
      this.readRecord(held);
      this.flushTimes();
      this.commitWord(held, directory, subject);
    };
    const written = (this.words.get(worktree) ?? Promise.resolve()).then(write);
    // The next word of the worktree waits for this one whether it was written or refused.
    this.words.set(
      worktree,
      written.catch(() => undefined),
    );
    return written;
  }

  /**
   * Writes a renamed branch's new name into the `Branch` row of the work
   * item's `routing.md`, through the writer of a work item's records, and
   * gives the work item's directory: the one whose routing named the branch's
   * old name. It gives null, with nothing written, where no one directory's
   * routing named it, and where the row cannot be rewritten or the writer
   * refuses the path, which the log then says. The branch is then renamed
   * all the same, and the work item's records are found again once a person
   * writes the row.
   */
  private routeRenamed(worktree: string, from: string, to: string): string | null {
    const directory = workItemDirectory(worktree, from);
    if (directory === null) return null;
    try {
      const file = join(directory, ROUTING_FILE);
      const text = repositoryFileText(file);
      if (text === null) return null;
      writeRecordFile(worktree, file, withBranch(text, to));
      return directory;
    } catch (error) {
      console.error(`the renamed branch was not written into the work item's routing: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Commits one file of a work item's directory, its record unless another
   * is named, and that file alone, on the work item's
   * branch in its worktree, after a person's word was written into it, or
   * after a rename of the branch wrote the new name into `routing.md`: with
   * the subject given and the trailer `Seal-Routing:` that names the work
   * item's directory, which the pull request check reads. It returns at
   * once, and the commit is made after every earlier one of the same
   * worktree has ended. `personWrote` refused the word where the worktree
   * was off the work item's branch or in the middle of an operation, so the
   * commit meets either only where it arose after the write: nothing is
   * then staged and nothing is committed, the file stands written, and the
   * log says which (`worktrees.ts#commitPaths`). Where a live pane of the work item says it is working, a
   * headless session of it is working or its chain is running, when the commit's turn comes, nothing is
   * committed: the file stands written, and the session's own commit, the
   * next commit made here or the chain's next stage's commit carries it. A commit carries the file as it stands
   * when its turn comes, so where an earlier one carried a later word too,
   * the later word's turn commits nothing. A commit that fails leaves the file
   * written and says git's words in the log. `Daemon#decided` and
   * `Daemon#park` do not come here: the stage that calls them commits the
   * record with its own commit.
   */
  private commitWord(held: Held, directory: string, subject: string, file: string = RECORD_FILE): void {
    const { id, worktree, branch } = held.item;
    const commit = async (): Promise<void> => {
      // A running chain is at work in the worktree between two stages too, and its next stage's commit carries the record.
      const working = this.chains.has(id) || this.works(id);
      if (working) return;
      try {
        await commitPaths(worktree, branch, [relative(worktree, join(directory, file))], subject, `Seal-Routing: ${basename(directory)}`);
      } catch (error) {
        console.error(`${file === RECORD_FILE ? "the person's word" : "the renamed branch's routing"} was not committed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    this.wordCommits.set(worktree, (this.wordCommits.get(worktree) ?? Promise.resolve()).then(commit));
  }

  /** Whether a live pane of the work item says it is working, or a headless session of it is working. */
  private works(workItemId: number): boolean {
    return [...this.sessions.values()].some(({ info }) => info.alive && info.workItemId === workItemId && info.state === "working") || [...this.headless.values()].some(({ info }) => info.workItemId === workItemId && info.state === "working");
  }

  /**
   * Runs what writes or commits in a worktree after every commit of a
   * person's word that was asked for there, and before every later one, so
   * two commits of one worktree never run git at once. It gives what the act
   * gives, and throws what it throws.
   */
  private inWorktree<T>(worktree: string, act: () => Promise<T>): Promise<T> {
    const done = (this.wordCommits.get(worktree) ?? Promise.resolve()).then(act);
    this.wordCommits.set(
      worktree,
      done.then(
        () => undefined,
        () => undefined,
      ),
    );
    return done;
  }

  /**
   * Starts a work item's chain in its worktree, where `whyNoChain` gives no
   * reason against it, and throws that reason, with nothing started, where
   * it gives one. A person's word that is being written or committed in the
   * worktree lands first, so the first round's target holds it. The chain is
   * stored `running` with the stages of the starts before this one, which
   * say what ran, and its run begins in a later turn of the daemon's thread,
   * after the caller has answered. `byPerson` says that a person's `getSeal`
   * made the start, which a chain stopped by the orchestrator's judgment or
   * at the ceiling of its rounds takes as the answer (`chain.ts#gateBefore`).
   */
  private async beginChain(workItemId: number, worktree: string, byPerson: boolean): Promise<void> {
    await this.words.get(worktree);
    await this.wordCommits.get(worktree);
    const why = await this.whyNoChain(workItemId);
    if (why !== null) throw new Error(why);
    const held = this.store.workItem(workItemId);
    if (!held) throw new Error(`no work item ${String(workItemId)}`);
    this.store.setWorkItem(workItemId, { chain: { state: "running", says: READING_SAYS, reviewedAt: null, stages: held.item.chain?.stages ?? [] } });
    this.chains.set(workItemId, Promise.resolve().then(() => this.runChain(workItemId, byPerson)));
  }

  /**
   * Starts a parked chain again once the person's answers left the work
   * item's record with no open question: the chain runs the step its records
   * owe. Where nothing can start in the work item, or the start is refused
   * as a `getSeal`'s would be, the chain is `stopped` with a sentence that
   * says why, and a later `getSeal` starts it. A chain that is no longer
   * parked is left as it is.
   */
  private async resumeChain(workItemId: number): Promise<void> {
    const parked = this.store.workItem(workItemId)?.item;
    if (parked?.chain?.state !== "parked") return;
    try {
      const gone = this.whyNoRun(workItemId);
      if (gone !== null) throw new Error(gone);
      await this.beginChain(workItemId, parked.worktree, false);
      this.broadcastInbox();
    } catch (error) {
      const chain = this.store.workItem(workItemId)?.item.chain;
      if (chain) this.chainSet(workItemId, { ...chain, state: "stopped", says: notResumedSays(error instanceof Error ? error.message : String(error)) });
    }
  }

  /**
   * Why a chain cannot start for a work item `worktreeFor` gave a worktree
   * of, as a sentence a window shows as it is, or null where it can. The
   * first of these that holds is the reason: a chain of the work item is
   * running; a session of it is working; the worktree cannot take a commit
   * (`worktrees.ts#whyNoCommit`); it holds no records root; two directories
   * of its records name the branch; it holds a change no commit holds, or an
   * untracked file, outside the work item's directory, and anywhere where
   * the work item has no directory yet; the work item records no base
   * commit; its branch holds no commit after it; the adapter cannot launch a
   * role; the work item's record holds an open question. It throws where
   * the record stands and cannot be read (`repository-file.ts#repositoryFileText`).
   * It writes nothing and starts nothing.
   */
  private async whyNoChain(workItemId: number): Promise<string | null> {
    const held = this.store.workItem(workItemId);
    if (!held) return `no work item ${String(workItemId)}`;
    const { worktree, branch, baseCommit } = held.item;
    if (this.chains.has(workItemId)) return `The chain of work item ${String(workItemId)} is already running.`;
    if (this.works(workItemId)) return `A session of work item ${String(workItemId)} is working, and a round reads a tree nothing is changing. Get a seal once the session has finished.`;
    const why = await whyNoCommit(worktree, branch);
    if (why !== null) return `Owlery cannot commit a record in the worktree now: ${why}.`;
    if (rootOf(worktree) === null) return "The worktree holds no place for work records, so a round's record has nowhere to stand. Set up the records in the repository, and bring them onto this branch.";
    const directories = workItemDirectories(worktree, branch);
    if (directories.length > 1) return `Two directories of the worktree's records name the branch ${branch}: ${directories.map((directory) => relative(worktree, directory)).join(" and ")}. Owlery cannot tell which is the work item's.`;
    const [directory] = directories;
    const inside = directory === undefined ? null : relative(worktree, directory);
    const loose = (await uncommittedPaths(worktree)).filter((path) => inside === null || !inFolder(path, inside));
    if (loose.length > 0) return `The worktree holds a change no commit holds, at ${loose[0] ?? ""}${loose.length > 1 ? ` and ${String(loose.length - 1)} more` : ""}. A round reads a committed tree: commit the change or remove it first.`;
    if (baseCommit === null) return "The work item records no commit its branch was cut at, so a round has no base to read the branch against.";
    const ahead = await newCommits(held.repository.folder, branch, baseCommit);
    if (ahead === null) return "Git could not count the commits the branch holds after its base.";
    if (ahead === 0) return "The branch holds no commit after its base, so a round has nothing to read.";
    const lacks = ROLE_FEATURES.filter((feature) => !this.options.roleAdapter.features.includes(feature));
    if (lacks.length > 0) return `the ${this.options.roleAdapter.name} adapter cannot launch a role: it does not declare ${lacks.join(" and ")}`;
    const record = directory === undefined ? null : repositoryFileText(join(directory, RECORD_FILE));
    if (record !== null && readDecisionRecord(record).questions.some((question) => question.state.is === "open")) return "The work item waits for the answers to its open questions. Answer them first.";
    return null;
  }

  /** Stores a work item's chain and sends every client the lists that carry it. The store holds the chain whether or not its file was written, and the log then says so. */
  private chainSet(workItemId: number, chain: Chain): void {
    try {
      if (this.store.setWorkItem(workItemId, { chain }) === undefined) return;
    } catch (error) {
      console.error(`the chain of work item ${String(workItemId)} was not written: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.broadcastInbox();
  }

  /**
   * Runs a work item's chain from where its records stand until it rests:
   * before each stage it reads the step the records owe (`chain.ts#stepOwed`)
   * and runs that stage, and it rests `parked` or `reviewed` where the
   * records owe none. Before a fix pass it reads what the chain owes first
   * (`chain.ts#gateBefore`): the orchestrator's judgment of whether the
   * rounds are converging, whose `no` stops the chain, or a stop at the
   * ceiling of its rounds. A stage whose answer asks questions is followed
   * by the orchestrator's judgment on them, which decides each or parks the
   * work item. Whatever stops a stage, and whatever the reads between
   * two stages throw, leaves the chain `stopped` with a sentence that says
   * why, and nothing of another work item is started, stopped or refused. A
   * daemon that closes ends the run at its next step and stores nothing, so
   * the chain stays stored `running`, which the next daemon reads as stopped.
   * `byPerson` says that a person's `getSeal` started the run.
   */
  private async runChain(workItemId: number, byPerson: boolean): Promise<void> {
    const rest = (state: Chain["state"], says: string, reviewedAt: string | null = null): void => {
      const chain = this.store.workItem(workItemId)?.item.chain;
      if (chain) this.chainSet(workItemId, { ...chain, state, says, reviewedAt });
    };
    const ceiling = this.options.roundsCeiling ?? ROUNDS_CEILING;
    // Whether the step is the first of a start a person made, and the round this run's judgment of convergence was answered yes after.
    let first = byPerson;
    let judged: number | null = null;
    try {
      for (;;) {
        if (this.closed) return;
        // No stage starts where no pane and no headless session would: the work item was archived, is being deleted or lost its folder since the last stage.
        const gone = this.whyNoRun(workItemId);
        if (gone !== null) throw new ChainStop(gone);
        const held = this.store.workItem(workItemId);
        if (!held) return;
        const { worktree, branch, baseBranch, baseCommit } = held.item;
        const why = await whyNoCommit(worktree, branch);
        if (why !== null) throw new ChainStop(why);
        const directory = await this.chainDirectory(held);
        const head = await worktreeHead(worktree);
        const standing = await standingOf(worktree, directory, head, baseBranch ?? baseCommit ?? head);
        if (this.closed) return;
        const step = stepOwed(standing);
        if (step.is === "parked") return rest("parked", PARKED_SAYS);
        if (step.is === "reviewed") return rest("reviewed", reviewedSays(step.round, step.at), step.at);
        if (step.is === "round") {
          const asks = await this.runRound(held, directory, standing, step);
          if (asks.length > 0) await this.runRuling(held, directory, standing.directory, "round", step.round, "proofer", asks);
        } else {
          const stages = this.store.workItem(workItemId)?.item.chain?.stages ?? [];
          const gate = gateBefore(step, stages, ceiling, { judged: judged === step.round, first });
          if (gate === "ceiling") return rest("stopped", ceilingSays(step.round, ceiling));
          if (gate === "judgment") {
            if (!(await this.runConvergence(held, directory, standing, step.round))) return rest("stopped", notConvergingSays(step.round));
            // The judgment's commit moved the branch's head, so the fix pass starts from the records as they now stand.
            judged = step.round;
          } else {
            const asks = await this.runFixPass(held, directory, standing, step, passedBefore(stages, step.round));
            if (asks.length > 0) await this.runRuling(held, directory, standing.directory, "fix-pass", step.round, "crafter", asks);
          }
        }
        first = false;
      }
    } catch (error) {
      if (this.closed) return;
      const said = error instanceof Error ? error.message : String(error);
      rest("stopped", error instanceof StageStopped ? said : chainStoppedSays(said));
    } finally {
      this.chains.delete(workItemId);
      if (!this.closed) {
        this.settleHold();
        this.checkIdle();
      }
    }
  }

  /**
   * The work item's directory in its worktree, for a chain: the one whose
   * `routing.md` names the branch. Where none does, it makes one,
   * `<root>/threads/<seconds>-<slug>/`, from the daemon's clock in whole
   * seconds and the slug of the branch's last part, writes its `routing.md`
   * (`chain.ts#routingText`) through the writer of a work item's records and
   * commits that file alone, so the first round's target holds it. It throws
   * a `ChainStop` where two directories name the branch, where the worktree
   * holds no records root, where the new directory's name is taken, and
   * what the writer and the commit throw. A directory whose routing does not
   * read as naming the branch, as for a branch's name with a `|` in it, is
   * found by no later step, and the chain then stops on the taken name.
   */
  private async chainDirectory({ item }: Held): Promise<string> {
    const { worktree, branch } = item;
    const directories = workItemDirectories(worktree, branch);
    const [found] = directories;
    if (directories.length > 1) throw new ChainStop(`two directories of the worktree's records name the branch ${branch}`);
    if (found !== undefined) return found;
    const root = rootOf(worktree);
    if (root === null) throw new ChainStop("the worktree holds no place for work records");
    const now = (this.options.now ?? Date.now)();
    const name = `${String(Math.floor(now / 1000))}-${slugFor(branch.slice(branch.lastIndexOf("/") + 1)) || "work-item"}`;
    const directory = join(worktree, root, "threads", name);
    const file = join(directory, ROUTING_FILE);
    if (existsSync(directory)) throw new ChainStop(`${relative(worktree, directory)} stands already, and its routing names another branch`);
    const at = new Date(now);
    // The day as the person's own clock has it, which is the day they pressed the button.
    const text = routingText(name, branch, `${String(at.getFullYear())}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`);
    await this.chainCommit(item, directory, [file], "chore: declare the work item's routing", { write: () => writeRecordFile(worktree, file, text) });
    return directory;
  }

  /**
   * Makes one commit of a chain in a work item's worktree, after every
   * commit that was asked for there before it: it runs `write`, appends
   * one row to `trail/refusals.md` for each call the stage's role's rule
   * refused (`chain.ts#refusalsText`), then commits the files given, each a
   * file of the work item's directory, with the work item's record of
   * decisions and its refusals where each stands, together and nothing else
   * (`worktrees.ts#commitPaths`), with the subject given and the trailer
   * `Seal-Routing:` that names the directory. It throws a `ChainStop` with
   * what a write refused, or with git's first words where the commit
   * failed, a hook's refusal among them: the files then stand written and
   * not committed.
   */
  private chainCommit(item: Held["item"], directory: string, files: readonly [string, ...string[]], subject: string, stage: { write?: () => void; refused?: StageRefusals } = {}): Promise<void> {
    const { worktree, branch } = item;
    return this.inWorktree(worktree, async () => {
      const record = join(directory, RECORD_FILE);
      const refusals = join(directory, REFUSALS_FILE);
      try {
        stage.write?.();
        if (stage.refused !== undefined && stage.refused.calls.length > 0) writeRecordFile(worktree, refusals, refusalsText(repositoryFileText(refusals), basename(directory), stage.refused));
      } catch (error) {
        throw new ChainStop(error instanceof Error ? error.message : String(error));
      }
      const [first, ...others] = [...new Set([...files, ...[record, refusals].filter((file) => existsSync(file))])].map((file) => relative(worktree, file));
      try {
        await commitPaths(worktree, branch, [first ?? "", ...others], subject, `Seal-Routing: ${basename(directory)}`);
      } catch (error) {
        const [said] = (error instanceof Error ? error.message : String(error)).split("\n");
        throw new ChainStop(`${relative(worktree, files[0])} was written and not committed: ${said ?? ""}`);
      }
    });
  }

  /** Throws a `ChainStop` where the worktree holds a change no commit holds, or an untracked file, outside the work item's directory. */
  private async noChangeOutside(worktree: string, directory: string): Promise<void> {
    const inside = relative(worktree, directory);
    const loose = (await uncommittedPaths(worktree)).filter((path) => !inFolder(path, inside));
    if (loose.length > 0) throw new ChainStop(`the worktree holds a change no commit holds outside the work item's directory, at ${loose[0] ?? ""}${loose.length > 1 ? ` and ${String(loose.length - 1)} more` : ""}`);
  }

  /**
   * Runs one stage of a chain: a headless session launched as the role, in
   * the work item's worktree, listed with the chain as its newest stage.
   * When the session is no longer working, the stage's run is stopped and
   * its process has exited before anything else of the chain happens in the
   * worktree. `after` is then given a finished session's answer and the
   * calls its role's rule refused, takes and commits what the stage left,
   * and what it gives is what this gives. The stage is `finished` where it
   * did, and `failed`, with why, where the session failed or was stopped or
   * `after` threw; a failed stage throws a `StageStopped` with the chain's
   * sentence, and its refused calls are counted on the stage and written to
   * no record. A daemon that closed meanwhile throws too, and stores
   * nothing.
   */
  private async runStage<T>(workItemId: number, kind: ChainStageKind, round: number, role: RoleStage, worktree: string, prompt: StagePrompt, after: (answer: string, refused: StageRefusals) => Promise<T>): Promise<T> {
    const before = this.store.workItem(workItemId)?.item.chain;
    if (!before) throw new ChainStop("the daemon no longer keeps the work item");
    const session = this.beginHeadless(workItemId, { shown: prompt.shown, given: promptText(prompt) }, role, worktree);
    const working: ChainStage = { kind, round, state: "working", failure: null, startedAt: session.info.startedAt, endedAt: null, headlessId: session.info.id, refusals: 0 };
    this.chainSet(workItemId, { ...before, says: runningSays(kind, round), stages: [...before.stages, working].slice(-CHAIN_STAGES_KEPT) });
    await Promise.race([session.ended, this.closes]);
    // The stage's process is ended before the next stage starts, and before the daemon reads or commits what the stage left.
    await (await session.started)?.stop();
    if (this.closed) throw new ChainStop("the daemon closed");
    let failure: string | null = null;
    let left: { gave: T } | undefined;
    if (session.info.state !== "finished") failure = session.info.error ?? "the session failed";
    else {
      try {
        left = { gave: await after(session.info.answer, { kind, round, role: role.role, calls: session.refusals }) };
      } catch (error) {
        if (this.closed) throw error;
        failure = (error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "");
      }
    }
    const ended: ChainStage = { ...working, state: failure === null ? "finished" : "failed", failure, endedAt: (this.options.now ?? Date.now)(), refusals: session.refusals.length };
    const chain = this.store.workItem(workItemId)?.item.chain;
    if (chain) this.chainSet(workItemId, { ...chain, stages: chain.stages.map((stage) => (stage === working ? ended : stage)) });
    if (left === undefined) throw new StageStopped(stoppedSays(kind, round, failure ?? "the session failed"));
    return left.gave;
  }

  /**
   * Runs a review round: a fresh proofer session whose prompt carries the
   * round's target, the paths the reviewed commits changed and their diff
   * (`chain.ts#roundPrompt`). Its answer is its round record: the daemon
   * takes it from the answer (`chain.ts#roundRecordOf`), writes it unchanged
   * to `trail/rounds/round-<N>.md` and commits it, where the worktree's head
   * is still the round's target and the worktree holds no change outside the
   * work item's directory. Where one of those does not hold, no record is
   * written and the stage fails with a sentence that says which. It gives
   * the questions the answer asks above its record (`chain.ts#asksOf`), and
   * an `asks:` block the reader refuses fails the stage as well.
   */
  private async runRound({ item }: Held, directory: string, standing: Standing, step: Extract<Step, { is: "round" }>): Promise<Ask[]> {
    const { worktree } = item;
    // Round 1 reads the branch from where it left its base, and a verifying round the commits after the last target.
    const base = step.from === null ? ((item.baseBranch !== null && (await commitNamed(worktree, item.baseBranch)) !== null ? item.baseBranch : item.baseCommit) ?? standing.head) : step.from;
    const { paths, text } = await diffBetween(worktree, base, standing.head, step.from === null);
    const prompt = roundPrompt({ round: step.round, directory: standing.directory, target: step.target, earlier: standing.rounds.map(({ round }) => round), decisions: existsSync(join(directory, RECORD_FILE)), paths, diff: text });
    const file = join(directory, ROUNDS_FOLDER, roundFile(step.round));
    return this.runStage(item.id, "round", step.round, { role: "proofer", stage: "round" }, worktree, prompt, async (answer, refused) => {
      const record = roundRecordOf(answer, { round: step.round, workItem: basename(directory), target: step.target, before: step.from === null ? null : (standing.rounds.at(-1) ?? null) });
      // The record's reader refused a record that holds an `asks:` block, so each question stands above the record's heading.
      const asks = asksOf(answer);
      const head = await worktreeHead(worktree);
      if (head !== standing.head) throw new ChainStop(`the worktree's head moved during the round, from ${standing.head.slice(0, 7)} to ${head.slice(0, 7)}, so the round read another tree than its target`);
      await this.noChangeOutside(worktree, directory);
      await this.chainCommit(item, directory, [file], `chore: record review round ${String(step.round)}`, { write: () => writeRecordFile(worktree, file, record), refused });
      return asks;
    });
  }

  /**
   * Runs a fix pass: a crafter session whose prompt names the round record,
   * its open findings and the decisions the person reversed
   * (`chain.ts#fixPassPrompt`). The crafter commits its fixes and appends
   * the close blocks, and the daemon then reads the record in the worktree
   * and commits it, where it differs from the one committed before the pass
   * by close blocks alone, the reader refuses no line, each `fixed <commit>`
   * names a commit the branch's head holds and the round's target does not,
   * and the worktree holds no change outside the work item's directory.
   * Where one does not hold, nothing is committed. The record's commit
   * carries each decision the prompt gave as reversed, written `applied`
   * with the branch's head after the pass. It gives the questions the
   * answer asks (`chain.ts#asksOf`). A pass that leaves a finding open and
   * asks nothing fails after the record's commit, and so does a second pass
   * on one record (`second`) that leaves one open, whatever it asks.
   */
  private async runFixPass(held: Held, directory: string, standing: Standing, step: Extract<Step, { is: "fix-pass" }>, second: boolean): Promise<Ask[]> {
    const { item } = held;
    const { worktree } = item;
    const file = join(directory, ROUNDS_FOLDER, roundFile(step.round));
    const target = standing.rounds.at(-1)?.target.commit ?? standing.head;
    const committed = (await fileAt(worktree, standing.head, relative(worktree, file))) ?? "";
    const prompt = fixPassPrompt({ round: step.round, directory: standing.directory, open: step.open, reversals: step.reversals });
    return this.runStage(item.id, "fix-pass", step.round, { role: "crafter", stage: "fix-pass" }, worktree, prompt, async (answer, refused) => {
      const asks = asksOf(answer);
      const head = await worktreeHead(worktree);
      await this.noChangeOutside(worktree, directory);
      const left = repositoryFileText(file);
      if (left === null) throw new ChainStop(`the round record no longer stands at ${relative(worktree, file)}`);
      const { closes, open } = fixPassRecord(committed, left);
      await fixedCommitsHeld(worktree, closes, head, target);
      // Each reversal the pass was given is taken in at the head the pass left, which the next round reads.
      const applied = (): void => {
        if (step.reversals.length === 0) return;
        writeRecord(worktree, directory, (text) => step.reversals.reduce((next, reversal) => withApplied(next, reversal.id, head), text));
        this.readRecord(held);
        this.flushTimes();
      };
      await this.chainCommit(item, directory, [file], `chore: record the fix pass of round ${String(step.round)}`, { write: applied, refused });
      if (open.length > 0 && second) throw new ChainStop(leftOpenAgain(open));
      if (open.length > 0 && asks.length === 0) throw new ChainStop(leftOpen(open));
      return asks;
    });
  }

  /**
   * Asks the orchestrator whether the rounds are converging, after a round
   * of 2 or later that left a finding open (`chain.ts#convergencePrompt`).
   * Its answer's one `converging:` block is the judgment: the daemon
   * records it as a decision of the kind `route` made by `orchestrator`
   * (`Daemon#decided`), commits the record of decisions, and gives whether
   * the answer was yes. An answer that holds no such block, or more than
   * one, fails the stage, and nothing is recorded.
   */
  private async runConvergence({ item }: Held, directory: string, standing: Standing, round: number): Promise<boolean> {
    const record = join(directory, RECORD_FILE);
    const prompt = convergencePrompt({ round, directory: standing.directory, rounds: standing.rounds.map((each) => each.round), decisions: existsSync(record) });
    return this.runStage(item.id, "judgment", round, ORCHESTRATOR, item.worktree, prompt, async (answer, refused) => {
      const { converging, grounds } = convergenceOf(answer);
      if (this.decided(item.id, { kind: "route", says: convergenceDecided(round, converging), grounds, by: ORCHESTRATOR.role }) === undefined) throw new ChainStop("its judgment was not written into the work item's record of decisions");
      await this.chainCommit(item, directory, [record], `chore: record the orchestrator's judgment after round ${String(round)}`, { refused });
      return converging;
    });
  }

  /**
   * Asks the orchestrator to rule on the questions a stage's answer asked
   * (`chain.ts#rulingPrompt`), after that stage's record is committed. Its
   * answer holds one `rules:` block for each question: the daemon records
   * each decision with `Daemon#decided`, as made by `orchestrator`, parks
   * the work item with the questions the orchestrator parked, in one
   * `Daemon#park` with the asking role as who asks, and commits the record
   * of decisions. An answer that does not rule on each question once fails
   * the stage, and nothing is recorded.
   */
  private async runRuling({ item }: Held, directory: string, inside: string, asked: "round" | "fix-pass", round: number, by: "proofer" | "crafter", asks: Ask[]): Promise<void> {
    const record = join(directory, RECORD_FILE);
    const prompt = rulingPrompt({ round, directory: inside, by, asked, asks, decisions: existsSync(record) });
    await this.runStage(item.id, "judgment", round, ORCHESTRATOR, item.worktree, prompt, async (answer, refused) => {
      const rulings = rulingsOf(answer, asks.length);
      const unwritten = new ChainStop("its rulings were not written into the work item's record of decisions");
      const parked: { asks: string; grounds: string; options: { label: string; implies: string }[]; default: string | null }[] = [];
      for (const [index, ruling] of rulings.entries()) {
        const ask = asks[index];
        if (ask === undefined) continue;
        if (ruling.is === "park") parked.push({ ...ask, grounds: parkedGrounds(ask, ruling) });
        else if (this.decided(item.id, { kind: ruling.is, says: ruling.decided, grounds: ruling.grounds, by: ORCHESTRATOR.role }) === undefined) throw unwritten;
      }
      if (parked.length > 0 && this.park(item.id, { by, questions: parked }) === undefined) throw unwritten;
      await this.chainCommit(item, directory, [record], `chore: record the orchestrator's judgment after round ${String(round)}`, { refused });
    });
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
    const wanted = !this.closed && wantsAwake(this.keepAwake.get(), this.sessionList(), this.headlessList(), this.chains.size > 0);
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
   * from its worktree its record of decisions and questions, and from each
   * repository's working tree what it holds of the records place, and tells
   * every client where a count changed, a branch's head moved, a record
   * reads otherwise or a repository's records place is another. An archived
   * work item keeps what was last read of its branch and of its record. The
   * records are read first and without a wait, so a `ready` that goes out
   * before git has answered still carries them.
   */
  private async readCommits(): Promise<void> {
    const open = this.store.workItems().filter(({ item }) => item.archivedAt === null);
    // Every record is read, so `some` is not what gathers the answers: it would stop at the first that changed.
    const recorded = open.map((held) => this.readRecord(held));
    this.flushTimes();
    const moved = [...recorded, ...(await Promise.all(open.map((held) => this.readBranch(held))))];
    // Every repository is read, so `some` is not what gathers the answers: it would stop at the first that changed.
    const placed = this.store.repositories().map((repository) => this.readRecords(repository));
    if (moved.includes(true) || placed.includes(true)) this.broadcastInbox();
  }

  /**
   * Reads one work item's new commits from git, and answers whether a count
   * changed or its branch's head moved. How far a branch is ahead of its
   * base branch and behind it is counted at every read, since the base moves
   * by itself, and a base that moved while the head stayed is a change. The
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
    const distance = item.baseBranch === null || head === null ? null : await baseDistance(repo, item.baseBranch, head);
    const known = this.aheadCounts.get(item.id) ?? null;
    if (distance?.ahead !== known?.ahead || distance?.behind !== known?.behind) {
      this.aheadCounts.set(item.id, distance);
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
    // A running chain keeps the daemon between two stages too, when no session of it works.
    const busy = this.clients.size > 0 || [...this.sessions.values()].some((s) => s.info.alive) || [...this.headless.values()].some((s) => s.info.state === "working") || this.chains.size > 0;
    if (busy || !this.options.onIdle) return;
    this.idleTimer = setTimeout(() => this.options.onIdle?.(), this.options.idleExitMs ?? 60_000);
  }
}
