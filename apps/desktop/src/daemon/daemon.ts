import { timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { TerminalSession } from "./pty";
import { isKeepAwakeChoice } from "../shared/keep-awake";
import { type Account, type AccountRefresh, accountFor, type Cap, type Chain, type ChainChoice, type ChainStage, type ChainStageKind, type Changes, type ClientMessage, type CommitInfo, type Decision, type DecisionKind, type GateRun, type HeadlessInfo, type KeepAwake, type LedgerEntry, losesWork, type Machine, type MachineReading, PANE_NAME_CHARS, type PaneKind, type PaneKindInfo, type PaneStage, type PlanDisk, type PullRequest, type Question, type Recorded, type RecordsPlace, type Repository, type RoleStage, type Running, type Seal, type SealRecords, type ServerMessage, type SessionInfo, SYSTEM_DEFAULT_ID, SYSTEM_DEFAULT_NAME, TAB_COLOURS, type TabColour, UNAUTHORIZED, type Unread, type Usage, type WordOwed, type WorkItem, type WorktreeSetup } from "../shared/protocol";
import { composeBack } from "../shared/seal-back";
import type { AccountLogins, LoginStatus, RoleAdapter, RoleEvent, RoleFeature, RoleRun } from "./adapters/adapter";
import { agentEventFor, agentSaid, isInterruptionEntry } from "./agent-events";
import { agentStateAfter } from "./agent-state";
import { OutputBuffer } from "./buffer";
import { NOTHING_RECORDED, readChainRecords } from "./chain-records";
import {
  type Ask,
  BASE_NAMED_IN_A_PANE,
  BASE_RECORDED,
  type ChainBase,
  CHAIN_STAGES_KEPT,
  ChainStop,
  GATE_AGAIN_SAYS,
  GATE_STOPPED_BEFORE_START,
  GATE_WAITS_SAYS,
  OPEN_PULL_REQUEST,
  ORCHESTRATOR,
  PARKED_SAYS,
  READING_SAYS,
  ROUNDS_CEILING,
  SEALER,
  SEAL_RULING_SUBJECT,
  UNDECIDED_CEILING,
  type RefusedCall,
  type StagePrompt,
  type StageRefusals,
  StageStopped,
  type Standing,
  type Step,
  baseOf,
  ceilingSays,
  chainStoppedSays,
  convergenceDecided,
  convergenceOf,
  convergencePrompt,
  earlierRunSays,
  endedWith,
  gateBefore,
  gateNotRunSays,
  inFolder,
  leftOpen,
  leftOpenAgain,
  notConvergingSays,
  notResumedSays,
  parkedGrounds,
  passedBefore,
  promptText,
  pullRequestCarriesSays,
  pullRequestOpenSays,
  pullRequestOwed,
  recordedBase,
  roundBase,
  rulingPrompt,
  rulingsOf,
  runningSays,
  sealedSays,
  standingOf,
  stepOwed,
  stoppedSays,
  twiceFailedWhy,
  undecidedAsk,
  undecidedParked,
  whyNoBase,
  withheldSays,
} from "./chain";
import { RECORD_FILE, ROUTING_FILE, type DecisionRecord, holdsWords, type OwedWords, owedWords, readDecisionRecord, routingAnswer, withAnswer, withBranch, withDecision, withQuestion, withReversal, workItemDirectories, workItemDirectory, writeRecord } from "./decision-record";
import { GATE_LIMIT_MS, GATE_OUTPUT_CHARS, GATE_OUTPUT_FOLDER, type GateProcess, gateEnvironment, loginPath, outputCut, startGate } from "./gate";
import { GITHUB_LIMIT_MS, type GitHubCli, PR_POLL_MS, PR_REST_POLL_MS, bodyRecords, createPullRequest, editPullRequest, findOnPath, ghEnvironment, openPullRequests, pullRequestBody, pullRequestTitle, pushBranch, pushTarget, sealSection, viewPullRequest, withBackSection, withSealSection } from "./github";
import { setupPaneCommand, withoutPaneVariables } from "./hooks";
import { type HoldAwake, KeepAwakeStore, type WakeDisplay, wantsAwake } from "./keep-awake";
import { LastLook } from "./last-look";
import { addHeavyRun, heavyRan, readHeavyRuns, watchMemory } from "./heavy-runs";
import { BROAD_GATE_NAME, LOAD_EVERY_MS, MachineTurns, NO_READING_LIMIT } from "./machine-turns";
import { type GivenTurn, type HeavyRunTaken, type StageLine, type TurnGiver, turnGiver } from "./turn-socket";
import { placesFree, type QueueRank, queueOrder } from "./agent-queue";
import { AgentMemoryStore, CAPS, LimitsStore, type MachineReader } from "./machine";
import { agentsProposal, capRefusal, CHARS_PER_LINE, heavyProposal, KEEP_FREE_BYTES, panesProposal, SCROLLBACK_DEFAULT, worktreesProposal } from "../shared/machine";
import { AccountStore, type StoredAccount } from "./accounts";
import { Ledger } from "./ledger";
import { RecordTimes } from "./record-times";
import { onOwlChain, planRecords, readRecordsPlace, rootOf, setUpRecords } from "./records-place";
import { type Held, RepositoryStore, setAsideNotice, type StoredRepository, type StoredWorkItem } from "./repositories";
import { writeRecordFile } from "./record-writer";
import { SessionLogWatch } from "./session-log";
import { type InTurn, type Place, commitRecords, declaredDirectory, fixPassStage, gateOwed, recordFixPass, recordGate, recordRound, recordVerdict, roundStage, sealStage } from "./stage-records";
import { repositoryFileText } from "./repository-file";
import { verdictOn } from "./role-grants";
import type { Verdict } from "./seal-records";
import { noSealRecords, sealRecords } from "./seal-back-records";
import { workItemSeal } from "./seal-state";
import type { StopCounts } from "./stop-record";
import { writeWholeFile } from "./whole-file";
import { INCLUDE_FILE, PANE_ENDED, SETUP_FILE, beginSetup, endedSetup, readSetup, signalEnded } from "./worktree-setup";
import { BaseFetches, baseDistance, branchChanges, branchCommits, branchHead, branchName, type CommitBounds, commitNamed, commitPaths, createWorktree, fileAt, headCounts, headStands, makeBranch, newCommits, planBranchMaking, planBranchRename, planWorktree, readLoss, removeBranch, removeWorktree, renameBranch, repositoryOf, uncommittedPaths, whyNoCommit, worktreeHead, worktreesRoot } from "./worktrees";

/** How much of a state's text the daemon keeps, of each text it writes into a work item's record, and of a broken seal's sentence it sends. */
const STATE_TEXT_CHARS = 2000;

/** The text of a session's state where the person interrupted its turn. */
const INTERRUPTED_TEXT = "The turn was interrupted, and the agent waits for what to do next.";

/** Why a chain does not start on a work item with no branch yet, and why one stops where it meets one: a chain's records are committed on the work item's branch. */
const NO_BRANCH_FOR_CHAIN = "The work item has no branch yet. Owlery makes one at the first commit in its worktree, or when it is renamed.";

/** Why a person's word, a reversal or an answer, is refused for a work item with no branch yet: it is committed on the work item's branch, and no routing names a directory of one. */
const NO_BRANCH_TO_WRITE = "Nothing was written: the work item has no branch yet.";

/** The branch a delete of the work item removes: its branch where Owlery made it, and none where it has none or its branch is one Owlery did not make, which stays. */
function removedBranch(item: Pick<StoredWorkItem, "branch" | "ownsBranch">): string | null {
  return item.ownsBranch ? item.branch : null;
}

/** The branch a chain's stage commits on. It throws a `ChainStop` with `NO_BRANCH_FOR_CHAIN` where the work item has none, which stops the chain. */
function chainBranch(item: Pick<StoredWorkItem, "branch">): string {
  if (item.branch === null) throw new ChainStop(NO_BRANCH_FOR_CHAIN);
  return item.branch;
}

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

/** How long a refresh of an account's usage may run, from its start, before the daemon stops it, where the options name no time. */
export const REFRESH_LIMIT_MS = 60_000;

/** What the session of a refresh is given: a prompt that asks for nothing, since only the limit values its stream hands over are read. */
export const REFRESH_PROMPT = "Reply with the single word OK.";

/** How many of the headless sessions that ended the daemon keeps, where the options name no number. */
export const HEADLESS_KEPT = 50;

/** How long the daemon's close waits for the commits under way in the worktrees before it ends each one that still runs, where the options name no time. */
export const COMMIT_CLOSE_WAIT_MS = 3000;

/** How often the pass over the person's words that no commit holds turns while a work item owes one, where the options name no time. */
export const WORD_PASS_MS = 3000;

/** How long after a failed try to commit a word of the person's the daemon tries again, where the options name no time. Each further failure doubles the wait, to `WORD_RETRY_MAX_MS` at most. */
export const WORD_RETRY_MS = 60_000;

/** The longest wait between two tries to commit a word of the person's. */
export const WORD_RETRY_MAX_MS = 60 * 60_000;

/** The subject of the commit of the person's words a record owes: one reversal alone names its decision, answers alone are the answers, and anything else is the person's word. */
function wordSubject({ reversed, answered }: OwedWords): string {
  const [only] = reversed;
  if (answered.length === 0 && reversed.length === 1 && only !== undefined) return `chore: record the person's reversal of decision ${String(only)}`;
  if (reversed.length === 0) return "chore: record the person's answers";
  return "chore: record the person's word";
}

/** Why a commit failed, as the second half of a sentence: the first line that is not empty of what it said, cut at `STATE_TEXT_CHARS`, without the periods and the colon at its end. */
function failedWhy(said: string): string {
  const line = said.split("\n").map((each) => each.trim()).find((each) => each !== "") ?? "git said nothing";
  return cutText(line).replace(/[.:]+$/u, "");
}

/** A folder's real path, or the path as given where it does not stand. */
function realPathOf(folder: string): string {
  try {
    return realpathSync(folder);
  } catch {
    return folder;
  }
}

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

/** What the daemon holds of one read of a work item's record and of its records of the chain, as a client is sent it. */
interface RecordRead {
  decisions: Decision[];
  questions: Question[];
  unread: Unread[];
  recorded: Recorded;
}

/** What the daemon last read of the person's words in a work item's record that no commit holds: the record's text and the branch's head it asked git at, and what was owed there. */
interface OwedRead {
  text: string;
  head: string | null;
  words: OwedWords;
}

/** The failed tries to commit a work item's owed words: how many failed one after another, what the last said, as the log holds it and as the lists carry it, when the next is due, by the daemon's clock, and the record's text and the branch's head the last one was made at. */
interface WordTries {
  failures: number;
  said: string;
  why: string;
  due: number;
  text: string;
  head: string | null;
}

/** What the records say for the back of a seal as a client is sent it: each string cut at `STATE_TEXT_CHARS`. */
function sealRecordsOf(records: SealRecords): SealRecords {
  const { record, brokenBy } = records;
  return {
    head: records.head,
    record: record === null ? null : { ...record, commit: cutText(record.commit), branch: cutText(record.branch), base: cutText(record.base), item: cutText(record.item), gate: cutText(record.gate), builtBy: record.builtBy.map(cutText), judgedBy: cutText(record.judgedBy), model: cutText(record.model), rules: cutText(record.rules) },
    brokenBy: brokenBy === null ? null : { commit: brokenBy.commit, subject: cutText(brokenBy.subject) },
    rounds: records.rounds.map((round) => ({
      ...round,
      findings: round.findings.map((finding) => ({
        ...finding,
        says: cutText(finding.says),
        severity: cutText(finding.severity),
        places: finding.places.map(({ path, lines }) => ({ path: cutText(path), lines: cutText(lines) })),
        close: finding.close === null ? null : { ...finding.close, home: cutText(finding.close.home), answer: cutText(finding.close.answer) },
      })),
    })),
    refusals: records.refusals,
    unreadRefusals: records.unreadRefusals,
  };
}

/** What the records say of the chain as a client is sent it: a verdict's reason or question cut at `STATE_TEXT_CHARS`. */
function recordedOf(recorded: Recorded): Recorded {
  const { verdict } = recorded;
  return verdict === null ? recorded : { ...recorded, verdict: { ...verdict, says: cutText(verdict.says) } };
}

/** What a work item holds of its records where its worktree holds none. */
const NO_RECORD: RecordRead = { decisions: [], questions: [], unread: [], recorded: NOTHING_RECORDED };

export interface PaneCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

/** What a pane's command is made from, beside its kind and its id: whether the pane starts on the latest conversation of its folder, the folder it opens in, which is its work item's worktree, the base the work item's chain reads the branch against, as round 1's target would name it (`chain.ts#roundBase`), or null where the work item records none, the main checkout of the work item's repository, the chain the person chose for that repository's Claude Code panes, or null where they gave no answer, the config folder of the pane's account, or null where the account has none, as System default has none, and the config folder the pane's agent reads: the account's, or under System default the default login's as the adapter last found it, and null while it has found none. */
export interface PaneStart {
  continueLatest: boolean;
  folder: string;
  base: string | null;
  checkout: string;
  chosen: ChainChoice | null;
  accountDir: string | null;
  configDir: string | null;
  /** The id of the conversation a pane resumes, given only where a pane's account is changed and its hook events carried one. */
  resume?: string;
}

export interface DaemonOptions {
  token: string;
  /** The kinds of pane a client may open, as `ready` offers them. */
  paneKinds: readonly PaneKindInfo[];
  /** The command of a new pane of that kind, given the pane's id and what its start holds. */
  commandFor: (kind: PaneKind, id: number, start: PaneStart) => PaneCommand;
  /** The command of a setup pane, given the command a repository's `.worktreesetup` holds and the pane's id; `setupPaneCommand` of the daemon's environment when absent. */
  setupCommandFor?: (command: string, id: number) => PaneCommand;
  /** Whether Claude Code enables the AgenticSeal plugin for a session in a folder of a repository, given the folder, the repository's main checkout and the config folder the session reads, which is null while the adapter has found no default login's folder. A daemon given none reads no settings of the person's, and tells a client that no repository has the plugin enabled. */
  pluginEnabled?: (folder: string, checkout: string, configDir: string | null) => boolean;
  /** The adapter every headless session is started through. */
  roleAdapter: RoleAdapter;
  /** Where the repositories and their work items are kept, in `repositories.json`, the accounts, in `accounts.json`, the last look, in `last-look.json`, the choice of when to keep the Mac awake, in `keep-awake.json`, the caps a person set on the machine, in `limits.json`, the times the daemon first read each block of a work item's record at, in `record-times.json`, the cost ledger, in `ledger.jsonl`, what each work item's newest broad gate printed, in `gate-output/`, and what each heavy command took, in `heavy-runs.jsonl`; without it the first eight are in memory alone, and no heavy command's run is kept. */
  runDir?: string;
  /** The load average of the last minute, read at each call, or null where none is read. A daemon given none reads no load, and reads no broad gate's run as over the machine's load by its load. */
  load?: () => number | null;
  /** The machine's cores, which a load is compared with. A daemon given none reads no run as over the machine's load by its load, and a second run waits for no load. */
  cores?: number;
  /** How long a second run of a broad gate waits, at most, for the load to come to the cores or under, and how often it reads the load meanwhile; `CALM_WAIT_MS` and `LOAD_EVERY_MS` of `machine-turns.ts` when absent. */
  calm?: { waitMs: number; pollMs: number };
  /** How often the daemon reads the load while a heavy command holds or waits for a turn; `LOAD_EVERY_MS` when absent. */
  loadEveryMs?: number;
  /** How the daemon holds the Mac awake. A daemon given none holds nothing, sends no `keepAwake` and takes no choice. */
  holdAwake?: HoldAwake;
  /** How the daemon turns the display on at a heavy command's start, under every choice but `never`. A daemon given none wakes nothing. */
  wakeDisplay?: WakeDisplay;
  /** How the daemon reads the machine it runs on. A daemon given none keeps no cap, sends no `machine` and takes no `setCaps`. */
  machine?: MachineReader;
  /** The version of Owlery this daemon is, which the workflow a setup of the records place writes fetches the check at, and which a verdict block names as the version of the rules. A daemon given none plans and sets up no records place, and writes no verdict. */
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
  /** How long each commit the daemon makes may run before it is ended; `COMMIT_LIMIT_MS` of `worktrees.ts` when absent. */
  commitLimitMs?: number;
  /** How long the daemon's close waits for the commits under way before it ends them; `COMMIT_CLOSE_WAIT_MS` when absent. */
  commitCloseWaitMs?: number;
  /** How often the pass over the person's words that no commit holds turns; `WORD_PASS_MS` when absent. */
  wordPassMs?: number;
  /** How long after the first failed try to commit a word of the person's the daemon tries again; `WORD_RETRY_MS` when absent. */
  wordRetryMs?: number;
  /** How long a hello's answer waits for the read of the work items' new commits. It stays under the second the app gives a daemon to answer (`answers` of src/main/daemon-client.ts). */
  readyWaitMs?: number;
  /** How long the answer to a `readLists` waits, from the start of the reads it asked for, for the reads of the open pull requests; 5 seconds when absent. A pull request read later reaches every client in the watch's own inbox. */
  listsWaitMs?: number;
  /** How long a pane of a kind that reports state may send no event after its start before it is listed as waiting; 10 seconds when absent. */
  silentStartMs?: number;
  /** How long the watch of a working pane's session log waits for a log that does not stand yet; `SESSION_LOG_WAIT_MS` of `session-log.ts` when absent. */
  sessionLogWaitMs?: number;
  /** How long the daemon waits for the processes of the panes it ended to exit, and for the headless runs it stopped to end, before it refuses what ended them where a pane's has not; 3 seconds when absent. */
  endWaitMs?: number;
  /** How long a headless session may work, from its start, before the daemon stops it; `HEADLESS_LIMIT_MS` when absent. A session that waits for the machine runs no limit until it starts. */
  headlessLimitMs?: number;
  /** How often the daemon reads the resident memory of the agents while one lives, where it was given a reader of the machine; `MEASURE_MS` when absent. */
  measureMs?: number;
  /** How long a refresh of an account's usage may run, from its start, before the daemon stops it; `REFRESH_LIMIT_MS` when absent. */
  refreshLimitMs?: number;
  /** How many of the headless sessions that ended the daemon keeps, apart from the ones still working; `HEADLESS_KEPT` when absent. */
  keptHeadless?: number;
  /** The round a chain stops at where it leaves a finding open, whatever the orchestrator would answer; `ROUNDS_CEILING` of `chain.ts` when absent. */
  roundsCeiling?: number;
  /** For how many `undecided` verdicts of one guarantee the daemon asks the orchestrator for a ruling before it parks the next one's question with no ruling asked; `UNDECIDED_CEILING` of `chain.ts` when absent. */
  undecidedCeiling?: number;
  /** How long a broad gate's command may run, from its start, before the daemon ends it; `GATE_LIMIT_MS` of `gate.ts` when absent. */
  gateLimitMs?: number;
  /** The environment a broad gate's command runs with. When absent, it is a pane's without the variables that say a terminal stands and without the variables of the pane the daemon was started from (`hooks.ts#PANE_VARIABLES`), with the `PATH` the person's interactive login shell prints, which the daemon asks that shell for once (`gate.ts#gateEnvironment`). */
  gateEnv?: Record<string, string>;
  /** How many of the last characters a broad gate's command printed the daemon keeps; `GATE_OUTPUT_CHARS` of `gate.ts` when absent. */
  gateOutputChars?: number;
  /** The command and the first arguments the person's `gh` is started with. When absent, it is the `gh` the `PATH` of the broad gate's environment holds, which is the person's login shell's where `gateEnv` is absent. */
  gh?: readonly [string, ...string[]];
  /** How long one call of `gh`, and the push of a branch, may run before the daemon ends it; `GITHUB_LIMIT_MS` of `github.ts` when absent. */
  githubLimitMs?: number;
  /** How long the watch waits between two reads of an open pull request while its checks run, or while GitHub's head is not the commit the stage pushed; `PR_POLL_MS` of `github.ts` when absent. */
  prPollMs?: number;
  /** How long the watch waits between two reads of any other open pull request, and after a read that failed; `PR_REST_POLL_MS` of `github.ts` when absent. */
  prRestPollMs?: number;
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
  /** The watch of the session log a working pane's latest event named, where the pane's agent writes an interruption no hook tells. Its state's leaving `working`, the pane's end, its close and the daemon's close each end it. */
  log: SessionLogWatch | undefined;
  /** Whether the daemon's log has said that the pane's session log is not read: it says so once a pane. */
  logUnread: boolean;
  /** Whether the session's state began where the person interrupted its turn. */
  interrupted: boolean;
  /** Settled once the pane's latest process has exited. */
  exited: Promise<void>;
  /** Whether the daemon ended the pane's process, at a close, an archive, a removal or a delete. */
  ended: boolean;
  /** The folder the pane's process runs in, and the size a client last gave it, with which a process that takes its place starts. */
  cwd: string;
  size: { cols: number; rows: number };
  /** The id of the latest conversation the pane's hook events carried, where it is a UUID, which a change of the pane's account resumes. */
  conversation: string | undefined;
  /** Whether the daemon is ending the pane's process for a change of its account, so its end is no end of the pane. */
  replacing: boolean;
}

/** The form of a conversation's id, which alone is put on a command line. */
const CONVERSATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface HeadlessSession {
  info: HeadlessInfo;
  /** The role the session was launched as, which `info.role` carries to the clients, and whose grant answers each request of the session. */
  role: RoleStage;
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
  /** The session's own id and its model, as its adapter reported them, and null until it does and for a session whose agent names no id. They stay in the daemon: no message carries either. */
  named: { id: string; model: string | null } | null;
  /** The wait for the session's time limit. Its end and the daemon's close each cancel it. */
  limit: NodeJS.Timeout | undefined;
  /** The top-level folder of the repository's main checkout and the work item's branch, null where it had none yet, as the store held them when the session began, which the session's entry of the ledger names. */
  repo: string;
  branch: string | null;
  /** The kind and the round of the chain's stage the session was started for, or null for a session no chain started (`startRoleSession`), which its entry of the ledger names. */
  chain: LedgerEntry["chain"];
  /** The account the session was launched under, by its id and its name as they stood at its start, which its entry of the ledger names, or null for a session launched under none, through an adapter that declares no accounts. */
  account: { id: number; name: string } | null;
  /** Whether the session's entry is in the ledger, or the session gets none: one whose adapter rejected its start, and one that ended while it waited for the machine, so that nothing ran. A session gets one entry at most. */
  entered: boolean;
}

/** How often the daemon reads the resident memory of the agents while one lives. */
const MEASURE_MS = 60_000;

/** A headless session that waits for a place under the cap on agents: what it waits as, the order it joined in, and what starts it. */
interface QueuedSession {
  rank: QueueRank;
  joined: number;
  start: () => void;
}

/** A broad gate that asked for its turn on the machine: its process once the command started, what ends its ask before then, the wait for its time limit, and what stopped it before it ended by itself, once something did, with the second half of the sentence that says so. */
interface RunningGate {
  process: GateProcess | undefined;
  asking: AbortController;
  limit: NodeJS.Timeout | undefined;
  stopped: { by: "limit" | "request" | "daemon"; why: string } | null;
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
  // The last refresh of each account's usage since the daemon started, by the account's id, and what stops each one that runs.
  private readonly refreshes = new Map<number, AccountRefresh>();
  private readonly refreshStops = new Map<number, () => Promise<void>>();
  private nextHeadlessId = 1;
  // The ids of the headless sessions that ended, in the order they ended. The first leaves the list where more ended than the daemon keeps.
  private readonly endedHeadless = new Set<number>();
  private idleTimer: NodeJS.Timeout | undefined;
  private readonly store: RepositoryStore;
  // The logins of the person's agent and the default one.
  private readonly accounts: AccountStore;
  // The client that asked for each add whose sign-in pane runs, by the id its folder takes, which is told how the add ended.
  private readonly adds = new Map<number, WebSocket>();
  private readonly lastLook: LastLook;
  private readonly keepAwake: KeepAwakeStore;
  // The caps a person set on the machine, what the daemon last read of the machine, where it was given a reader, and the count of the agents that run as every client was last told it.
  private readonly limits: LimitsStore;
  private reading: MachineReading | undefined;
  private agentsTold = agentsKey(0, []);
  // The headless sessions that wait for a place under the cap on agents, by their ids, how many have joined the queue in the daemon's life, which orders two that joined in one millisecond, and whether the queue is being drained, so a start the drain makes drains nothing again.
  private readonly queued = new Map<number, QueuedSession>();
  private queueJoins = 0;
  private draining = false;
  // The work items whose chain started a stage in its run, which a later stage of the run waits for the machine as.
  private readonly chainStaged = new Set<number>();
  // What the daemon measured of the agents' memory, where it was given a reader, and the timer of its readings.
  private readonly memory: AgentMemoryStore | undefined;
  private measureTimer: NodeJS.Timeout | undefined;
  /** The measures of worktrees, one at a time: each waits for the one before it. */
  private measuring: Promise<void> = Promise.resolve();
  // When the daemon first read each block of each work item's record in its state. The record holds no clock.
  private readonly times: RecordTimes;
  // The cost ledger: one entry for each headless session that ended and for each run of a broad gate that ended. Between two reads it holds in memory only the entries whose append failed.
  private readonly ledger: Ledger;
  // What was last read of each work item's record of decisions and questions, by the work item's id, as a client is sent it. The record is the store: this is what the last read found, and nothing is written from it.
  private readonly recordsRead = new Map<number, RecordRead>();
  // The stage a pane's session runs in each work item, by the work item's id, as the chain command told it on the turn socket, with the pane that told it (`stageTold`). It lives in memory alone, since a pane's process lives as long as the daemon that started it.
  private readonly paneStages = new Map<number, { paneId: number; kind: Exclude<PaneStage["kind"], "gate">; round: number; since: number }>();
  // The hold that stands now, where one does. The daemon holds one at most.
  private hold: { release(): void } | undefined;
  // Whether the hold that stands holds the display too.
  private holdsDisplay = false;
  // The fetches of the bases work items start from: a form's and a creation's of one branch are one fetch.
  private readonly fetches: BaseFetches;
  // What takes or gives up a folder or a branch runs one after another: a creation, which takes a folder and checks out the branch a person picked, or makes the local branch of a remote's branch they picked, a rename that renames or makes a branch, the branch a read gives a work item with no branch yet (`branchUp`), and a delete. So two creations of one title never pick the same folder, two creations never check out one branch, a rename never takes the name of the branch a creation makes, a rename and a read never both make a work item's branch, and a creation never checks out a branch a delete is removing. A repository's removal runs among them, so no creation adds a work item to the repository while the removal waits for its sessions to end. A plan and a read of a loss change nothing and do not wait behind them.
  private changing: Promise<void> = Promise.resolve();
  // The new commits last read for each work item, by its id; the list itself does not store them.
  private readonly commitCounts = new Map<number, number | null>();
  // How far each work item's branch was last read to be from its base branch, by the work item's id: the commits it holds that the base does not, and the commits the base holds that it does not.
  private readonly aheadCounts = new Map<number, { ahead: number; behind: number } | null>();
  // The last commit of a person's word that was asked for in each worktree, by the worktree: it ends once every one before it has, so two commits of one worktree never run git at once.
  private readonly wordCommits = new Map<string, Promise<void>>();
  // The last word of a person that was taken for each worktree, by the worktree: it ends once git has said where the worktree stands and the word is written or refused, after every one before it, so the words of one worktree are written in the order they came.
  private readonly words = new Map<string, Promise<void>>();
  // Fired once the daemon's close has waited for the commits under way: every commit the daemon makes takes it, so one still running is ended, and one whose turn comes later starts nothing.
  private readonly ending = new AbortController();
  // What was last read of each work item's words of the person that no commit holds, by its id (`readOwed`). The tree is the store: this is what the last read found, and a daemon that starts reads it again.
  private readonly owed = new Map<number, OwedRead>();
  // The failed tries to commit each work item's owed words, by its id, while the words are owed.
  private readonly wordTries = new Map<number, WordTries>();
  // The work items whose owed words a turn of the pass found waiting for a session, by their ids: the first turn that finds the session ended tries them.
  private readonly wordHeld = new Set<number>();
  // The work items a try to commit their owed words is queued for and has not begun, and those it runs for, by their ids.
  private readonly wordQueued = new Set<number>();
  private readonly wordRunning = new Set<number>();
  // The pass over the owed words, which runs while a work item that is not archived owes one.
  private wordTimer: NodeJS.Timeout | undefined;
  // What was last read of each work item's branch, by the work item's id: the head it was read at, and the commits, the changes and the seal read there.
  private readonly branches = new Map<number, { head: string; commits: CommitInfo[] | null; changes: Changes | null; seal: Seal | null }>();
  /** What each repository's main checkout held of the records place when it was last read, by the repository's id. */
  private readonly records = new Map<number, RecordsPlace>();
  /** Which chain each repository's Claude Code panes would run, as `readRecords` last read it, by the repository's id. */
  private readonly paneChains = new Map<number, { owl: boolean; plugin: boolean }>();
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
  // What the store did with a `repositories.json` it could not read at the daemon's start, as the sentence a person reads, or null where it read its file or found none. It does not change while the daemon runs.
  private readonly storeNotice: string | null;
  // The work items whose chain is running, by their ids, each with the promise of its run's end. A chain is here from its start until it rests, between two stages too, when no session of it works.
  private readonly chains = new Map<number, Promise<void>>();
  // The broad gates that asked for their turn on the machine and have not ended, by their work items' ids: those that wait and those whose command runs. A work item's chain runs one stage at a time, so it holds one at most.
  private readonly gates = new Map<number, RunningGate>();
  // The turns on the machine, which every broad gate asks for before its command starts. The queue lives in memory alone.
  private readonly turns: MachineTurns;
  private readonly giver: TurnGiver;
  private loadReads: NodeJS.Timeout | undefined;
  // The `PATH` of the person's interactive login shell, asked of that shell once in the daemon's life, at the first broad gate: null where the shell printed none.
  private gatePath: Promise<string | null> | undefined;
  // What each work item's newest broad gate printed, by the work item's id, where the daemon was given no run folder to keep it in.
  private readonly gateOutputs = new Map<number, string>();
  // Settled once the daemon closes, so a chain that waits for a stage's session waits no longer.
  private closing: () => void = () => {};
  private readonly closes = new Promise<void>((resolve) => {
    this.closing = resolve;
  });
  private commitTimer: NodeJS.Timeout | undefined;
  private commitsReadAt = 0;
  // The read of the counts under way, which a hello that arrives meanwhile waits on, and after whose end a `readLists` that arrives meanwhile reads again.
  private readingCommits: Promise<void> | undefined;
  // When the watch next reads each work item's open pull request, by the work item's id, on the system's clock. A pull request with no time here is read at the watch's next turn.
  private readonly pullRequestDue = new Map<number, number>();
  // How many times `readOutside` made every watched pull request due at once. A read that began before the latest of them leaves its pull request due.
  private pullRequestAsks = 0;
  // What waits on the watch: each settles once the turn that starts after it was added has ended, which is the turn that reads what `readOutside` made due.
  private readonly turnWaits: (() => void)[] = [];
  private watchTimer: NodeJS.Timeout | undefined;
  // The watch's reads under way: one turn of reads runs at a time.
  private watching: Promise<void> | undefined;
  private closed = false;

  constructor(private readonly options: DaemonOptions) {
    this.store = new RepositoryStore(options.runDir, options.now);
    const setAside = this.store.setAside();
    this.storeNotice = setAside === null ? null : setAsideNotice(setAside);
    this.accounts = new AccountStore(options.runDir);
    // A setting that names an account the daemon keeps none of, as one whose account left the file, is cleared, so the
    // next one above is taken and an account added later under that id takes no setting it was never given.
    for (const repository of this.store.repositories()) if (repository.accountId !== null && !this.accounts.holds(repository.accountId)) this.store.setRepository(repository.id, { accountId: null });
    for (const { item } of this.store.workItems()) if (item.accountId !== null && !this.accounts.holds(item.accountId)) this.store.setWorkItem(item.id, { accountId: null });
    this.lastLook = new LastLook(options.runDir);
    this.fetches = new BaseFetches({ waitMs: options.baseFetchMs, freshMs: options.baseFreshMs, now: options.now });
    this.keepAwake = new KeepAwakeStore(options.runDir);
    this.limits = new LimitsStore(options.runDir);
    this.memory = options.machine ? new AgentMemoryStore(options.runDir) : undefined;
    // The timer reads nothing while no agent lives (`measureAgents`), and holds no process open by itself.
    if (this.memory) this.measureTimer = setInterval(() => void this.measureAgents(), options.measureMs ?? MEASURE_MS).unref();
    this.readMachineNow();
    // A worktree that stood before the daemon measured worktrees, or whose measure gave none, is measured once now.
    for (const { item } of this.store.workItems()) if (item.worktreeSize === null) this.measureWorktree(item.id);
    this.times = new RecordTimes(options.runDir);
    this.ledger = new Ledger(options.runDir);
    // A change of the queue changes what a work item's `machineWait` says, and the queue of heavy commands the machine lists.
    this.turns = new MachineTurns({ limit: this.heavyLimit(), now: options.now, load: options.load });
    this.turns.watch(() => {
      if (this.closed) return;
      this.readLoadWhileAsked();
      this.broadcastInbox();
      this.broadcastMachine();
    });
    this.giver = turnGiver(this.turns, { cores: options.cores ?? null, load: options.load ?? (() => null), calm: options.calm, now: options.now, folderOf: (folder) => this.worktreeNamed(folder), kept: (run) => this.keepHeavyRun(run), started: () => this.keepAwake.get() !== "never" && this.options.wakeDisplay?.() });
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
        // No pane outlives a daemon, so a folder whose first sign-in had not ended when the last one stopped is decided now.
        for (const { id } of this.accounts.adding()) void this.endAdd(id);
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
   * neutral one among them. An event that leaves the session working starts
   * the watch of the session log its `transcript_path` names, where no watch
   * of that log reads, and every other ends the watch.
   */
  agentEvent(paneId: number, hookName: string, payload: Record<string, unknown>): void {
    const session = this.sessions.get(paneId);
    clearTimeout(session?.silentStart);
    // The conversation a change of the pane's account resumes, from any event that names one.
    if (session && typeof payload.session_id === "string" && CONVERSATION_ID.test(payload.session_id)) session.conversation = payload.session_id;
    const event = agentEventFor(hookName, payload);
    if (!event) return;
    const tool = typeof payload.tool_name === "string" ? payload.tool_name : null;
    this.broadcast({ type: "agent", id: paneId, event, tool, at: Date.now() });
    if (!session || !this.reportsState(session.info.kind)) return;
    const said = agentSaid(hookName, payload);
    const state = agentStateAfter(event, said.questions !== null, session.interrupted);
    if (state === "working") this.followLog(session, payload.transcript_path);
    else this.endLog(session);
    if (state === session.info.state) return;
    session.interrupted = false;
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
   * from the store of the times. Beside the record it reads, in the same
   * directory, what the work item's records say of its chain
   * (`chain-records.ts`), with a verdict's reason or question cut at
   * `STATE_TEXT_CHARS`; a work item with no directory of its own says
   * nothing of it.
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
      recorded: recordedOf(readChainRecords(directory)),
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

  /**
   * Closes the daemon: it ends its timers, its panes, its headless runs,
   * its broad gates and its clients, and resolves once each has ended. It
   * waits `commitCloseWaitMs` for the person's words being written and for
   * the commits under way in the worktrees, then ends each commit that still
   * runs (`commitBounds`), with its files left written, and waits for it to
   * end. A commit whose turn comes after that starts nothing, and a word it
   * left is found in the tree by the next daemon.
   */
  async close(): Promise<void> {
    this.closed = true;
    this.closing();
    clearInterval(this.loadReads);
    clearTimeout(this.commitTimer);
    clearInterval(this.wordTimer);
    clearTimeout(this.watchTimer);
    clearTimeout(this.idleTimer);
    clearInterval(this.measureTimer);
    this.queued.clear();
    for (const session of this.sessions.values()) {
      clearTimeout(session.silentStart);
      this.endLog(session);
      if (session.info.alive) session.terminal.kill();
    }
    // A run whose adapter is still starting is stopped once it has started, and the close does not wait for it.
    const stops: Promise<void>[] = [];
    for (const session of this.headless.values()) {
      clearTimeout(session.limit);
      // The close changes no session's state, and a session still working is entered as the daemon's stop, before its run's end can say anything else.
      if (session.info.state === "working") this.enter(session, "failed", "daemon");
      if (session.run) stops.push(session.run.stop());
    }
    for (const stop of this.refreshStops.values()) stops.push(stop());
    this.refreshStops.clear();
    // A broad gate's command is ended as a stage's session is: its chain's run waits for the command's process, and the close waits for that run.
    for (const id of this.gates.keys()) {
      const stopping = this.stopGate(id, "daemon", "the daemon closed");
      if (stopping !== undefined) stops.push(stopping);
    }
    this.fetches.close();
    this.hold?.release();
    this.hold = undefined;
    for (const client of this.clients.keys()) client.terminate();
    // A person's word whose worktree git is still reading is waited for, and then its commit and every other under way, so the close leaves no git at work in a worktree.
    const words = Promise.all(this.words.values()).then(() => Promise.all(this.wordCommits.values()));
    // A commit that does not end within the wait is ended, with its files left written, and a commit whose turn comes after it starts nothing.
    let waitTimer: NodeJS.Timeout | undefined;
    await Promise.race([words, new Promise<void>((resolve) => (waitTimer = setTimeout(resolve, this.options.commitCloseWaitMs ?? COMMIT_CLOSE_WAIT_MS)))]);
    clearTimeout(waitTimer);
    this.ending.abort();
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
        void this.greet(socket, early, this.readOutside().commits);
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
   * Reads again what the daemon holds from outside: the one list a client's
   * hello and a `readLists` both read, so a press reads what a window that
   * connects reads. It reads the adapter's notice where one stands, makes
   * every watched pull request due now, and reads git (`readCommitsNow`). It
   * gives that read of git, and what settles once the watch's turn that
   * reads those pull requests has ended, at once where the watch reads none.
   */
  private readOutside(): { commits: Promise<void>; pullRequests: Promise<void> } {
    // A notice that stands is read again as a window connects and at a `readLists`, so it goes once the person did what it asks. The daemon outlives the app for days, and a notice read once would stay.
    if (this.agentNotice !== null) void this.readAgentNotice();
    // Each open pull request is read again at a hello and at a `readLists`, which is when a person looks.
    this.pullRequestDue.clear();
    this.pullRequestAsks++;
    const pullRequests = new Promise<void>((resolve) => this.turnWaits.push(resolve));
    this.scheduleWatch();
    return { commits: this.readCommitsNow(), pullRequests };
  }

  /**
   * Answers a hello. The counts of new commits are read from git first
   * (`commits`, which `readOutside` started), so `ready` carries the commits
   * that landed while no client was connected and a daemon that just started
   * sends counts. Where the read takes longer than the wait, `ready` carries
   * the counts the daemon holds and the read's result follows in an inbox.
   * What the client sent meanwhile is handled after its `ready`.
   */
  private async greet(socket: WebSocket, early: ClientMessage[], commits: Promise<void>): Promise<void> {
    let waitTimer: NodeJS.Timeout | undefined;
    const waited = new Promise<void>((resolve) => {
      waitTimer = setTimeout(resolve, this.options.readyWaitMs ?? 500);
    });
    await Promise.race([commits, waited]);
    clearTimeout(waitTimer);
    // The client left, or the daemon closed, while the counts were read.
    if (!this.greeting.delete(socket)) return;
    // A client that connects reads the load and the free disk as they are now.
    this.readMachineNow();
    const machine = this.machineNow();
    this.send(socket, { type: "ready", ...this.lists(), paneKinds: [...this.options.paneKinds], headless: this.headlessList(), lastLook: this.lastLook.get(), ...(this.options.holdAwake ? { keepAwake: this.keepAwakeNow() } : {}), agentNotice: this.agentNotice, ...(this.storeNotice === null ? {} : { storeNotice: this.storeNotice }), ...this.accountsMessage(), ...(machine ? { machine } : {}), answersUnknown: true });
    for (const message of early) this.handle(socket, message);
  }

  /**
   * Answers a `readLists`: reads again what a hello reads (`readOutside`),
   * once the read of git under way has ended, since that read began before
   * the message arrived. Once git has been read and the watch's reads of the
   * pull requests have ended, or `listsWaitMs` has passed since they were
   * asked for, the client that asked is sent the four lists in an `inbox`,
   * whether or not anything changed, and then `done`. Where a read throws, it
   * is sent an `error` with the read's sentence and no `inbox`. A client that
   * left meanwhile is sent nothing.
   */
  private async answerReadLists(socket: WebSocket, requestId: number): Promise<void> {
    let waitTimer: NodeJS.Timeout | undefined;
    try {
      // What a read under way throws is not this request's to say: the read that follows reads the same, and says why.
      await this.readingCommits?.catch(() => undefined);
      const { commits, pullRequests } = this.readOutside();
      const waited = new Promise<void>((resolve) => {
        waitTimer = setTimeout(resolve, this.options.listsWaitMs ?? 5000);
      });
      await Promise.all([commits, Promise.race([pullRequests, waited])]);
    } catch (error) {
      if (!this.closed && this.clients.has(socket)) this.send(socket, { type: "error", requestId, message: `The work items were not read again: ${(error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "")}.` });
      return;
    } finally {
      clearTimeout(waitTimer);
    }
    if (this.closed || !this.clients.has(socket)) return;
    this.send(socket, { type: "inbox", ...this.lists() });
    this.send(socket, { type: "done", requestId });
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
        let own: number | null;
        try {
          // The pane's own account, where it names one, System default among them.
          own = this.accountSetting(message.accountId) ?? null;
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          return;
        }
        const worktree = this.worktreeFor(socket, message.requestId, message.workItemId);
        if (worktree === undefined) return;
        const info = this.startSession(socket, message, worktree, message.workItemId, continueLatest, own);
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
            // So does a branch to check out.
            if (message.branch !== undefined && typeof message.branch !== "string") throw new Error(`a work item checks out a branch by its name, and ${JSON.stringify(message.branch)} is none`);
            const place = await createWorktree({ folder: message.repo, title: message.title, name: message.name, base: message.base, branch: message.branch, root: this.options.worktreesRoot ?? worktreesRoot(process.env), random: this.options.random, chosenBase: this.chosenBase, fetches: this.fetches });
            // The included paths are copied before the work item is listed, so no pane of it starts before they stand. The command runs only as the form showed it.
            const setup = await beginSetup(place.repo, place.worktree, this.options.now ?? Date.now, shownCommand(message));
            // A work item nobody named is called what its folder is, the number it got among it. The store adds the repository first where it does not keep it, and shows it again where it was hidden.
            const stored = this.store.addWorkItem({ title: message.title.trim() || basename(place.worktree), ...place });
            // The times of the records are keyed by a work item's id, which `repositories.json` gives. Where that file was lost, or was refused and stated no counts, its ids begin again, so what the store holds under the id given now was an earlier work item's. It is dropped here, as the id is given, and not at the daemon's start. A refused file that states its counts keeps them (`repositories.ts#RepositoryStore`), so no id given after it is one of that file's.
            this.times.drop([stored.item.id]);
            this.flushTimes();
            // What an earlier work item's broad gate printed is kept under its id too, and is none of this one's.
            this.dropGateOutput(stored.item.id);
            // A creation is also how a repository is added, so the inbox below says what it holds of the records place.
            this.readRecords(stored.repository);
            if (place.branch === null) {
              // The worktree was checked out at its base commit a moment ago, so it holds nothing new and git is not asked.
              this.commitCounts.set(stored.item.id, 0);
              if (place.baseBranch !== null) this.aheadCounts.set(stored.item.id, { ahead: 0, behind: 0 });
              this.branches.set(stored.item.id, { head: place.baseCommit, commits: [], changes: { files: 0, added: 0, removed: 0, list: [] }, seal: null });
            } else {
              // A branch the person picked holds whatever commits it holds, so git is asked, for its seal too.
              await this.readBranch(stored);
            }
            // The setup pane starts first, and the answer carries the pane the creation named. A worktree whose setup runs no pane is measured now, and one whose setup runs at that pane's exit.
            if (this.startSetup(socket, message, stored.item.id, place.worktree, setup)?.state !== "running") this.measureWorktree(stored.item.id);
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
            const repo = await repositoryOf(message.repo).catch(() => null);
            const named = repo === null ? { include: false, command: null } : await readSetup(repo).catch(() => ({ include: false, command: null }));
            const disk = this.planDisk(repo);
            this.send(socket, { type: "workItemPlan", requestId: message.requestId, ...planned, setupCommand: named.command, includes: named.include, ...(disk === undefined ? {} : { disk }) });
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
          const { name, icon, defaultBase, hidden, paneChain } = message;
          if ((name !== undefined && !isTextOrNull(name)) || (icon !== undefined && !isTextOrNull(icon)) || (defaultBase !== undefined && !isTextOrNull(defaultBase)) || (hidden !== undefined && typeof hidden !== "boolean")) {
            throw new Error("a repository's name, its icon and its base are each a text or null, and whether it is hidden is true or false");
          }
          if (paneChain !== undefined && paneChain !== null && paneChain !== "owlery" && paneChain !== "plugin") throw new Error('the chain of a repository\'s Claude Code panes is "owlery", "plugin" or null');
          // An empty name and an empty icon are none: the repository is then named by its folder, and shows no icon.
          const trimmed = (text: string | null | undefined): string | null | undefined => (typeof text === "string" ? text.trim() || null : text);
          const character = trimmed(icon);
          if (typeof character === "string" && characters(character) > 1) throw new Error("An icon is one character.");
          const accountId = this.accountSetting(message.accountId);
          const was = this.store.repository(message.id)?.accountId;
          const changed = this.store.setRepository(message.id, { name: trimmed(name), icon: character, defaultBase, hidden, paneChain, accountId });
          if (changed === undefined) throw new Error(`no repository ${String(message.id)}`);
          // The repository's chain is read in the folder of its account, so another account reads it again.
          const stored = this.store.repository(message.id);
          const read = stored !== undefined && stored.accountId !== was && this.readRecords(stored);
          // The answer first, so the client that asked knows its request was carried out when the inbox carries the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (changed || read) this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "addAccount": {
        void this.addAccount(socket, message);
        return;
      }
      case "setDefaultAccount": {
        try {
          const { id } = message as { id: unknown };
          if (typeof id !== "number") throw new Error("The default account is named by its id.");
          const changed = this.accounts.setDefault(id);
          // A repository set to no account takes the default, so its chain is read again in the new default's folder. Every repository is read, so `some` is not what gathers the answers.
          const read = changed ? this.store.repositories().filter((repository) => repository.accountId === null).map((repository) => this.readRecords(repository)) : [];
          // The answer first, so the client that asked knows its request was carried out when the accounts carry the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (changed) this.broadcastAccounts();
          if (read.includes(true)) this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "renameAccount": {
        try {
          const { id, name } = message as { id: unknown; name: unknown };
          if (typeof id !== "number" || typeof name !== "string") throw new Error("An account is renamed by its id and a name.");
          // The store refuses an empty name, System default and an id it keeps no account under, in its own words.
          const changed = this.accounts.rename(id, name);
          // The answer first, so the client that asked knows its request was carried out when the accounts carry the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (changed) this.broadcastAccounts();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      case "removeAccount": {
        void this.removeAccount(socket, message);
        return;
      }
      case "signIn": {
        void this.signIn(socket, message);
        return;
      }
      case "changeAccount": {
        void this.changeAccount(socket, message);
        return;
      }
      case "refreshUsage": {
        void this.refreshUsage(socket, message);
        return;
      }
      case "readSignIn": {
        const read = async (): Promise<void> => {
          try {
            const { id } = message as { id: unknown };
            if (typeof id !== "number") throw new Error("An account is named by its id.");
            const changed = await this.readLogin(this.loginsOf(id).account);
            // The answer first, so the client that asked knows its request was carried out when the accounts carry the change.
            this.send(socket, { type: "done", requestId: message.requestId });
            if (changed) this.broadcastAccounts();
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        void read();
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
            this.paneChains.delete(repository.id);
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
            await setUpRecords(repository.folder, broadGate, this.version(), stamp, this.options.commitLimitMs);
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
          const accountId = this.accountSetting(message.accountId);
          const changed = this.store.setWorkItem(message.id, { pinned, muted, groupId, accountId });
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
            await this.personWrote(workItemId, (text) => withReversal(text, decisionId, said));
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
            await this.personWrote(workItemId, (text) => {
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
            // The answers left the record with no open question, so a chain they parked runs the step it owes. Its start waits where `startChain`'s does.
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
            const { branch, ownsBranch, worktree } = held.item;
            // A work item with no branch yet is planned the branch a rename makes.
            this.send(socket, { type: "renamePlan", requestId: message.requestId, ...(branch === null ? await planBranchMaking(held.repository.folder, worktree, message.title) : await planBranchRename(held.repository.folder, branch, message.title, ownsBranch)) });
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
            let { branch, ownsBranch } = held.item;
            // The work item's directory, where the rename wrote the new branch into its routing.
            let routed: string | null = null;
            if (message.branch) {
              // A chain finds the work item's directory by the branch its routing names, at each stage.
              if (this.chains.has(message.id)) throw new Error("The work item's chain is running, and it finds the work item's records by the branch's name. Rename the branch once the chain rests.");
              // The conditions the person's dialog read are read again here, at the rename, and nothing is changed where one no longer holds or git refuses.
              if (branch === null) {
                // A work item with no branch yet gets its branch, at the commit its worktree's HEAD stands at, committed or not. No routing names a work item with no branch, so none is rewritten.
                const plan = await planBranchMaking(held.repository.folder, held.item.worktree, title);
                if (plan.blocked !== null || plan.branch === null) throw new Error(plan.blocked ?? "The name names no branch.");
                await makeBranch(held.item.worktree, plan.branch);
                branch = plan.branch;
                ownsBranch = true;
              } else {
                const plan = await planBranchRename(held.repository.folder, branch, title, ownsBranch);
                if (plan.blocked !== null || plan.branch === null) throw new Error(plan.blocked ?? "The name names no branch.");
                this.renaming.add(message.id);
                holds = true;
                await renameBranch(held.repository.folder, branch, plan.branch);
                // The work item's directory is found by the branch its routing names, so the row follows the branch while the reads are still held off.
                routed = this.routeRenamed(held.item.worktree, branch, plan.branch);
                branch = plan.branch;
              }
            }
            // What was read of the branch is kept by the work item's id, and its head did not move, so the counts and the commits stand.
            const changed = this.store.setWorkItem(message.id, { title, branch, ownsBranch });
            if (routed !== null) this.commitWord(held, routed, "chore: name the renamed branch in the work item's routing");
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
            this.send(socket, { type: "workItemLoss", requestId: message.requestId, id: held.item.id, loss: await readLoss(held.repository.folder, removedBranch(held.item), held.item.worktree) });
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
        this.closePane(session);
        return;
      }
      case "setPane": {
        try {
          const { id, name, colour } = message as { id: unknown; name?: unknown; colour?: unknown };
          const session = typeof id === "number" ? this.sessions.get(id) : undefined;
          if (!session) throw new Error(`No pane ${String(id)} is open.`);
          if (session.info.workItemId === null) throw new Error("A sign-in pane has no tab to name or colour.");
          if (name !== undefined && name !== null && typeof name !== "string") throw new Error("A pane's name is a text, or null for none.");
          const given = typeof name === "string" ? name.trim() : name;
          if (typeof given === "string" && given.length > PANE_NAME_CHARS) throw new Error(`A pane's name is ${String(PANE_NAME_CHARS)} characters at most.`);
          if (colour !== undefined && colour !== null && !(TAB_COLOURS as readonly unknown[]).includes(colour)) throw new Error(`A tab's colour is ${TAB_COLOURS.slice(0, -1).join(", ")} or ${String(TAB_COLOURS.at(-1))}, or null for none.`);
          // Nothing is set before every field has been read, so a refusal sets nothing of the message.
          const before = { name: session.info.name ?? null, colour: session.info.colour ?? null };
          if (given !== undefined) session.info.name = given === "" || given === null ? null : given;
          if (colour !== undefined) session.info.colour = colour as TabColour | null;
          // The answer first, so the client that asked knows its request was carried out when the inbox carries the change.
          this.send(socket, { type: "done", requestId: message.requestId });
          if (session.info.name !== before.name || session.info.colour !== before.colour) this.broadcastInbox();
        } catch (error) {
          this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
        }
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
        if (session.info.state === "working" || session.info.state === "queued") void this.stopHeadless(session, "the session was stopped at a request before it finished", "request");
        return;
      }
      case "stopGate": {
        const { workItemId } = message as { workItemId: unknown };
        if (typeof workItemId !== "number" || !this.gates.has(workItemId)) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `No broad gate of work item ${String(workItemId)} is running.` });
          return;
        }
        // The answer first, so the client that asked knows its request was carried out when the inbox carries the stopped chain.
        this.send(socket, { type: "done", requestId: message.requestId });
        void this.stopGate(workItemId, "request", "the command was stopped at a request before it ended");
        return;
      }
      case "readGateOutput": {
        const held = this.store.workItem(message.workItemId);
        if (!held) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `no work item ${String(message.workItemId)}` });
          return;
        }
        const text = this.gateOutput(held.item.id);
        if (text === null) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `Owlery keeps no output of a broad gate of work item ${String(held.item.id)}.` });
          return;
        }
        this.send(socket, { type: "gateOutput", requestId: message.requestId, workItemId: held.item.id, text, cut: outputCut(text, this.options.gateOutputChars ?? GATE_OUTPUT_CHARS) });
        return;
      }
      case "readLedger": {
        const held = this.store.workItem(message.workItemId);
        if (!held) {
          this.send(socket, { type: "error", requestId: message.requestId, message: `no work item ${String(message.workItemId)}` });
          return;
        }
        // From the work item's creation on, so the entries of an earlier work item that had its id, before `repositories.json` was lost or was refused stating no counts, are not read as its own.
        const { entries, unread } = this.ledger.read(held.item.id, held.item.createdAt);
        this.send(socket, { type: "ledger", requestId: message.requestId, workItemId: held.item.id, entries, unread });
        return;
      }
      case "readSealRecords": {
        const answer = async (): Promise<void> => {
          try {
            const held = this.store.workItem(message.workItemId);
            if (!held) throw new Error(`no work item ${String(message.workItemId)}`);
            const { item } = held;
            // A work item with no branch yet is read at its worktree's `HEAD`, and no routing names its directory, so it holds no records of a seal.
            const head = item.branch === null ? await worktreeHead(item.worktree).catch(() => null) : await branchHead(held.repository.folder, item.branch);
            if (head === null) throw new Error(item.branch === null ? `Owlery cannot read the head of the worktree ${item.worktree}.` : `Owlery cannot read the head of the branch ${item.branch}.`);
            const directory = workItemDirectory(item.worktree, item.branch);
            // The seal the records are read with is the one the head holds, read again, so the commit that broke it is named for that head.
            const records = directory === null ? noSealRecords(head) : await sealRecords(item.worktree, directory, head, await workItemSeal(item, head));
            this.send(socket, { type: "sealRecords", requestId: message.requestId, workItemId: item.id, records: sealRecordsOf(records) });
          } catch (error) {
            this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
          }
        };
        void answer();
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
      case "setCaps": {
        if (!this.options.machine) {
          this.send(socket, { type: "error", requestId: message.requestId, message: "This daemon keeps no cap on the machine." });
          return;
        }
        // Every value is read before any is taken, so a refusal changes nothing.
        const changes: Partial<Record<Cap, number | null>> = {};
        const before = this.limits.get();
        for (const cap of CAPS) {
          const value: unknown = message[cap];
          if (value === undefined) continue;
          const refusal = value === null ? null : capRefusal(cap, value, this.reading?.cores);
          if (refusal !== null) {
            this.send(socket, { type: "error", requestId: message.requestId, message: refusal });
            return;
          }
          if (value !== before[cap]) changes[cap] = value as number | null;
        }
        if (Object.keys(changes).length > 0) {
          try {
            this.limits.set(changes);
          } catch (error) {
            // The caps are held in memory whether or not they were written.
            console.error(`the caps on the machine were not written: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        this.send(socket, { type: "done", requestId: message.requestId });
        if (Object.keys(changes).length > 0) {
          // A changed scrollback moves the size of every pane's buffer, and a smaller one drops the older output at once.
          if (changes.scrollback !== undefined) for (const session of this.sessions.values()) session.output.setLimit(this.outputLimit());
          // A cap that rose starts the sessions that waited for it first, so the machine every client is told holds them as running.
          this.drainQueue();
          // A changed limit on heavy commands gives the next turns at once where it rose, and the keeper's watcher then tells every client the machine.
          if (changes.heavyCommands !== undefined) this.turns.setLimit(this.heavyLimit());
          else this.broadcastMachine();
        }
        return;
      }
      case "readHeavyRuns": {
        if (!this.options.machine) return;
        const runs = this.options.runDir === undefined ? [] : readHeavyRuns(this.options.runDir);
        this.send(socket, { type: "heavyRuns", runs: heavyRan(runs, (repo, folder) => this.repositoryName(repo, folder)) });
        return;
      }
      case "readMachine": {
        this.readMachineNow();
        const machine = this.machineNow();
        if (machine) this.send(socket, { type: "machine", machine });
        return;
      }
      case "readLists":
        void this.answerReadLists(socket, message.requestId);
        return;
      case "input":
        this.sessions.get(message.id)?.terminal.write(message.data);
        return;
      case "resize": {
        const session = this.sessions.get(message.id);
        // A window fits the screen it shows an exited pane on. The pseudo-terminal of a process that exited is closed, and a size set on it throws.
        if (session?.info.alive) session.terminal.resize(message.cols, message.rows);
        if (session && typeof message.cols === "number" && typeof message.rows === "number") session.size = { cols: message.cols, rows: message.rows };
        return;
      }
      default: {
        // A window of a later build sends requests this daemon does not know. It is refused at once, through the path every refusal takes, so nothing in the window waits for it, and `unknown` lets the window say that a restart of the daemon brings the request in. A message of such a type with no numeric `requestId` names nothing to answer, and is dropped.
        const { type, requestId } = message as { type?: unknown; requestId?: unknown };
        if (typeof requestId === "number") this.send(socket, { type: "error", requestId, unknown: true, message: `This daemon does not know the request "${String(type)}".` });
        return;
      }
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

  /** The account a request sets, as it named it: nothing where it named none, null for none, or the id of an account the daemon keeps. It throws, with a sentence, for any other value and for an id the daemon keeps no account under. */
  private accountSetting(value: unknown): number | null | undefined {
    if (value === undefined || value === null) return value;
    if (typeof value !== "number") throw new Error("An account is named by its id, or null for none.");
    if (!this.accounts.holds(value)) throw new Error(`No account ${String(value)} is kept.`);
    return value;
  }

  /**
   * The config folders a launch under an account is given: the account's
   * own, or null for an account with none, as System default has none, or
   * where no account is named; and the folder the agent then reads, which is
   * the account's, or the default login's as the adapter last found it, and
   * null while it has found none.
   */
  private foldersOf(accountId: number | null): { accountDir: string | null; configDir: string | null } {
    const accountDir = accountId === null ? null : (this.accounts.account(accountId)?.folder ?? null);
    return { accountDir, configDir: accountDir ?? this.options.roleAdapter.defaultLoginFolder?.() ?? null };
  }

  /** The account of an id and the adapter's part of accounts, for a request that signs the account in or reads its login. It throws, with a sentence, for System default, an id the daemon keeps no account under, and an adapter that signs no account in. */
  private loginsOf(id: number): { account: StoredAccount; logins: AccountLogins } {
    if (id === SYSTEM_DEFAULT_ID) throw new Error(`${SYSTEM_DEFAULT_NAME} is signed in with the agent in a terminal of your own.`);
    const account = this.accounts.account(id);
    if (account === undefined) throw new Error(`No account ${String(id)} is kept.`);
    const { logins } = this.options.roleAdapter;
    if (logins === undefined) throw new Error("This agent signs no account in here.");
    return { account, logins };
  }

  /** Asks the adapter's agent whether a login stands in an account's folder, keeps its word, and answers whether the word is another than the store held. It rejects, with the agent's sentence, where the agent could not say, and with the store's where the account was removed while the agent answered. */
  private async readLogin(account: StoredAccount): Promise<boolean> {
    const { logins } = this.loginsOf(account.id);
    const status = await logins.status(account.folder);
    return this.accounts.setLogin(account.id, status);
  }

  /** What runs under an account now, each as a person reads it: a live pane, its sign-in pane among them, a headless session that works or waits for the machine, by its role, and a refresh of its usage. */
  private runningUnder(id: number): string[] {
    const titleOf = (workItemId: number | null): string => (workItemId === null ? "" : (this.store.workItem(workItemId)?.item.title ?? ""));
    const panes = [...this.sessions.values()]
      .filter(({ info }) => info.alive && info.accountId === id)
      .map(({ info }) => (info.signsIn === id ? "its sign-in pane" : `the ${this.options.paneKinds.find((offered) => offered.kind === info.kind)?.label ?? info.kind} pane in "${titleOf(info.workItemId)}"`));
    const headless = [...this.headless.values()].filter(({ info }) => (info.state === "working" || info.state === "queued") && info.accountId === id).map(({ info, role }) => `the ${role.role}'s session in "${titleOf(info.workItemId)}"`);
    return [...panes, ...headless, ...(this.refreshes.get(id)?.state === "running" ? ["a refresh of its usage"] : [])];
  }

  /**
   * Adds an account at a request, and no name is typed. A folder the person
   * hands over is checked by the store, then the adapter's agent is asked
   * whether a login stands in it, and the account takes the login's name, or
   * the folder's last name where the agent names none, could not say or
   * signs no account in. With no folder, the daemon makes `accounts/<id>`,
   * gives it the person's names and starts its sign-in pane at once, and the
   * folder is no account until that pane's process ends (`endAdd`). Where the
   * adapter signs no account in, nothing is made, and where the sign-in
   * cannot start, the folder made is removed with its id and nothing is kept.
   */
  private async addAccount(socket: WebSocket, message: Extract<ClientMessage, { type: "addAccount" }>): Promise<void> {
    try {
      const { folder, cols, rows } = message as { folder?: unknown; cols?: unknown; rows?: unknown };
      const shape = "An account is added with the absolute path of its folder where the person hands one over, and otherwise with the size of its sign-in pane.";
      const adapter = this.options.roleAdapter;
      const { logins } = adapter;
      if (folder !== undefined) {
        if (typeof folder !== "string") throw new Error(shape);
        // The store refuses any folder but one that stands and is no account's yet, in its own words, before the agent is asked of it.
        const path = this.accounts.handedPath(folder);
        const login = logins === undefined ? undefined : await logins.status(path).catch(() => undefined);
        this.accounts.addHanded(login?.name ?? (basename(path) || path), path, adapter.name, login ?? { signedIn: null, loginEndsAt: null });
        // The answer first, so the client that asked knows its request was carried out when the accounts carry the change.
        this.send(socket, { type: "done", requestId: message.requestId });
        this.broadcastAccounts();
        return;
      }
      if (typeof cols !== "number" || typeof rows !== "number") throw new Error(shape);
      if (logins === undefined) throw new Error("This agent signs no account in here, so Owlery makes no folder for one. Use an existing folder.");
      const made = this.accounts.beginMade();
      let info: SessionInfo;
      try {
        // The folder is given the person's own names now, where the adapter knows them, and again before each launch under it.
        logins.furnish(made.folder);
        const command = await logins.signIn(made.folder);
        info = this.startSession(socket, { kind: "shell", cols, rows }, made.folder, null, false, null, () => command, made.id);
      } catch (error) {
        this.accounts.dropMade(made.id);
        throw error;
      }
      this.adds.set(made.id, socket);
      // The answer first, so the client that asked knows the pane as its own when the inbox lists it.
      this.send(socket, { type: "started", requestId: message.requestId, session: info });
      this.broadcastInbox();
    } catch (error) {
      this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Decides, on the adapter's agent's word, what a folder the daemon made
   * becomes once its first sign-in ended: the pane's process exited, or the
   * daemon started and found its id under `adding`. Where a login stands the
   * folder is kept as an account named by the login's name, or `Account
   * <id>` where the agent names none, and its sign-in pane is closed. Where
   * none stands the folder is removed with everything in it and no account
   * is kept, and an ended pane stays listed so what it printed can be read.
   * Where the agent could not say, the folder is kept as `Account <id>` with
   * its sign-in not read, since nothing is removed on a guess. The client
   * that asked for the add is told how it ended, after the accounts that
   * carry the account. A daemon that closed meanwhile decides nothing, and
   * its next start reads the id again.
   */
  private async endAdd(id: number, pane?: Session): Promise<void> {
    const { logins, name: adapter } = this.options.roleAdapter;
    const folder = this.accounts.adding().find((noted) => noted.id === id)?.folder;
    if (folder === undefined) return;
    let login: LoginStatus | Error;
    try {
      if (logins === undefined) throw new Error("This agent signs no account in here.");
      login = await logins.status(folder);
    } catch (error) {
      login = error instanceof Error ? error : new Error(String(error));
    }
    if (this.closed) return;
    const asker = this.adds.get(id);
    this.adds.delete(id);
    const fallback = `Account ${String(id)}`;
    let accountId: number | null = null;
    let says: string | null = null;
    try {
      if (login instanceof Error) {
        const kept = this.accounts.keepMade(id, fallback, adapter, { signedIn: null, loginEndsAt: null });
        accountId = kept.id;
        says = `Claude Code did not say whether the sign-in left a login, so the account is kept as "${kept.name}". Check its sign-in from its row. ${login.message}`;
      } else if (login.signedIn) {
        const kept = this.accounts.keepMade(id, login.name ?? fallback, adapter, login);
        accountId = kept.id;
        if (login.name === null) says = `Claude Code named no email for the login, so the account is kept as "${kept.name}". Rename it from its row.`;
      } else {
        this.accounts.dropMade(id);
        says = "The sign-in ended with no login, so no account was added.";
      }
    } catch (error) {
      console.error(`the add of folder ${String(id)} was not decided: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (accountId !== null) this.broadcastAccounts();
    if (asker !== undefined && this.clients.has(asker)) this.send(asker, { type: "addEnded", id: pane?.info.id ?? id, accountId, says });
    // The pane has nothing more to show once its login stands.
    if (pane !== undefined && !(login instanceof Error) && login.signedIn && this.sessions.get(pane.info.id) === pane) this.closePane(pane);
  }

  /**
   * Removes an account at a request: refused while anything runs under it,
   * then, for a folder the daemon made, the folder is signed out through the
   * adapter's agent and removed, and every setting that named the account is
   * cleared. The repositories whose account that changes have their chain
   * read again, as a change of their setting has. Something that started
   * under the account while its folder was signed out refuses the removal,
   * and the account stays, signed out.
   */
  private async removeAccount(socket: WebSocket, message: Extract<ClientMessage, { type: "removeAccount" }>): Promise<void> {
    try {
      const { id } = message as { id: unknown };
      if (typeof id !== "number") throw new Error("An account is named by its id.");
      if (id === SYSTEM_DEFAULT_ID) throw new Error(`${SYSTEM_DEFAULT_NAME} is never removed.`);
      const account = this.accounts.account(id);
      if (account === undefined) throw new Error(`No account ${String(id)} is kept.`);
      const refused = (running: string[]): Error => new Error(`"${account.name}" is not removed while something runs under it: ${running.join("; ")}.`);
      if (this.runningUnder(id).length > 0) throw refused(this.runningUnder(id));
      if (account.made) {
        const { logins } = this.options.roleAdapter;
        // A folder the daemon made was signed in through the adapter, and is signed out the same way before it goes, so no login of it is left behind.
        if (logins === undefined) throw new Error("This agent signs no account out here, so the account's folder stays.");
        await logins.signOut(account.folder);
        if (this.runningUnder(id).length > 0) throw refused(this.runningUnder(id));
        if (this.accounts.account(id) !== account) throw new Error(`No account ${String(id)} is kept.`);
      }
      const defaultChanged = this.accounts.remove(id);
      const cleared = this.store.repositories().filter((repository) => repository.accountId === id);
      for (const repository of cleared) this.store.setRepository(repository.id, { accountId: null });
      for (const { item } of this.store.workItems()) if (item.accountId === id) this.store.setWorkItem(item.id, { accountId: null });
      // A repository set to no account takes the default, so where the default was this account those are read again too.
      for (const repository of this.store.repositories()) if (cleared.some((was) => was.id === repository.id) || (defaultChanged && repository.accountId === null)) this.readRecords(repository);
      // The answer first, so the client that asked knows its request was carried out when the accounts and the lists carry the change.
      this.send(socket, { type: "done", requestId: message.requestId });
      this.broadcastAccounts();
      this.broadcastInbox();
    } catch (error) {
      this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
    }
  }

  /** Starts an account's sign-in pane at a request, in the account's folder and under it, and answers with `started`. */
  private async signIn(socket: WebSocket, message: Extract<ClientMessage, { type: "signIn" }>): Promise<void> {
    try {
      const { id, cols, rows } = message as { id: unknown; cols: unknown; rows: unknown };
      if (typeof id !== "number" || typeof cols !== "number" || typeof rows !== "number") throw new Error("A sign-in is asked for an account's id, with the size of its pane.");
      const { account, logins } = this.loginsOf(id);
      if ([...this.sessions.values()].some(({ info }) => info.alive && info.signsIn === id)) throw new Error(`A sign-in of "${account.name}" is open already.`);
      const command = await logins.signIn(account.folder);
      if (this.accounts.account(id) !== account) throw new Error(`No account ${String(id)} is kept.`);
      const info = this.startSession(socket, { kind: "shell", cols, rows }, account.folder, null, false, null, () => command, id);
      // The answer first, so the client that asked knows the pane as its own when the inbox lists it.
      this.send(socket, { type: "started", requestId: message.requestId, session: info });
      this.broadcastInbox();
    } catch (error) {
      this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
    }
  }

  /** An account's name, System default's among them, or its id where the daemon keeps none under it. */
  private accountNamed(id: number): string {
    return id === SYSTEM_DEFAULT_ID ? SYSTEM_DEFAULT_NAME : (this.accounts.account(id)?.name ?? String(id));
  }

  /**
   * Changes the account of a pane whose process runs, at a request: the
   * daemon gives the new account's folder the names it lacks, ends the
   * pane's process and waits for its exit, and starts the agent in the same
   * pane under the new account, on the conversation the pane's hook events
   * last named, as a new pane of the work item would be launched now. The
   * pane keeps its id, its tab and what it printed, and nothing the old
   * process's events left. It is refused, with its reason and nothing
   * ended, for a headless session, a sign-in pane, a pane whose kind
   * resumes no conversation, as a shell's, a pane that runs under no account
   * or whose process ended, an account the daemon does not keep or the one
   * the pane runs under, where the two accounts' folders do not keep
   * the same conversations, in which the new one would not find the pane's,
   * and while a change of the pane waits already. It starts nothing where
   * the old process has not exited within the wait an archive takes, which
   * then ends the pane when it exits, and where the pane was closed, its
   * work item archived or removed, the daemon closed or the new account
   * removed while the old process ended.
   */
  private async changeAccount(socket: WebSocket, message: Extract<ClientMessage, { type: "changeAccount" }>): Promise<void> {
    try {
      const { id, accountId, headless } = message as { id: unknown; accountId: unknown; headless?: unknown };
      if (typeof id !== "number" || typeof accountId !== "number") throw new Error("A change of account names the pane and the account.");
      if (headless === true) throw new Error("A headless session keeps the account it started under.");
      const session = this.sessions.get(id);
      if (!session) throw new Error(`No pane ${String(id)} is open.`);
      const { info } = session;
      if ((info.signsIn ?? null) !== null) throw new Error("A sign-in pane runs under the account it signs in.");
      if (this.options.paneKinds.find((offered) => offered.kind === info.kind)?.continues !== true) throw new Error("A shell keeps the environment it started with, so its account is not changed. Open a new pane under the other account.");
      const from = info.accountId ?? null;
      const held = info.workItemId === null ? undefined : this.store.workItem(info.workItemId);
      if (from === null || held === undefined) throw new Error("The pane runs under no account.");
      if (!info.alive) throw new Error("The pane's process has ended, so it has nothing to move to another account.");
      // One change at a time: a second change while the first waits would start a second process on the conversation.
      if (session.replacing) throw new Error("The pane's account is being changed already.");
      const to = this.accountSetting(accountId) as number;
      if (to === from) throw new Error(`The pane runs under "${this.accountNamed(to)}" already.`);
      // The new folder is given the person's names first, its link to the conversations among them.
      this.furnish(to);
      const kept = this.conversationsOf(from);
      if (kept === null || kept !== this.conversationsOf(to)) throw new Error(`"${this.accountNamed(from)}" and "${this.accountNamed(to)}" do not keep the same conversations, so the pane's conversation would not be found under "${this.accountNamed(to)}".`);
      session.replacing = true;
      session.terminal.kill();
      // The wait is bounded as an archive's is, so a process that ignores its hangup leaves no request unanswered.
      let waitTimer: NodeJS.Timeout | undefined;
      const exitedInTime = await Promise.race([session.exited.then(() => true), new Promise<boolean>((resolve) => (waitTimer = setTimeout(() => resolve(false), this.options.endWaitMs ?? END_WAIT_MS)))]);
      clearTimeout(waitTimer);
      session.replacing = false;
      // The process ends the pane when it exits, as any end of it does.
      if (!exitedInTime) throw new Error("The pane's process did not end in time, so its account was not changed. The pane ends once its process exits.");
      // What ended the pane while its process ended: its close, an archive or a removal of its work item, whose end its exit reported, or the daemon's close.
      if (this.closed || session.ended || this.sessions.get(id) !== session) throw new Error("The pane was closed before its account changed.");
      if (!this.accounts.holds(to)) {
        // The account was removed while the process ended: the pane stays ended under its own account and says why.
        this.standsEnded(session, `\r\n[the pane could not start: no account ${String(to)} is kept]\r\n`);
        throw new Error(`No account ${String(to)} is kept.`);
      }
      // Nothing of the old process stays on the pane: its state, its interruption and a log it could not read.
      Object.assign(info, { accountId: to, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null });
      session.interrupted = false;
      session.logUnread = false;
      const { repository } = held;
      try {
        const launch = this.options.commandFor(info.kind, id, { continueLatest: false, folder: session.cwd, base: this.paneBase(held.item.id), checkout: repository.folder, chosen: repository.paneChain ?? null, ...this.foldersOf(to), ...(session.conversation === undefined ? {} : { resume: session.conversation }) });
        session.terminal = this.spawnPane(launch, session.cwd, session.size);
      } catch (error) {
        this.standsEnded(session, `\r\n[the pane could not start under "${this.accountNamed(to)}": ${error instanceof Error ? error.message : String(error)}]\r\n`);
        throw error;
      }
      info.alive = true;
      this.watchProcess(session);
      // The answer first, so the client that asked knows the change was carried out when the inbox names the new account.
      this.send(socket, { type: "done", requestId: message.requestId });
      this.broadcastInbox();
    } catch (error) {
      this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
    }
  }

  /** Leaves a pane whose process ended for a change of its account ended, with the sentence `said` of why in what it printed, and tells every client. */
  private standsEnded(session: Session, said: string): void {
    session.output.append(said);
    this.sendOutput(session.info.id, said);
    this.broadcastInbox();
    this.checkIdle();
  }

  /** Closes a listed pane, at a client's request or once an add's sign-in kept its account: it leaves the lists, its process is ended where it runs, and every client is told. */
  private closePane(session: Session): void {
    // Off the lists first, so the process's end is told to nobody as a session's.
    this.sessions.delete(session.info.id);
    clearTimeout(session.silentStart);
    this.endLog(session);
    session.ended = true;
    if (session.info.alive) session.terminal.kill();
    this.dropStageOf(session.info.id);
    this.broadcastInbox();
    this.checkIdle();
  }

  /** Gives the folder of an account the daemon made the person's names it lacks, through the adapter, before a launch under it: nothing for System default, for no account, for a folder handed over and for an adapter that declares no accounts or signs none in. */
  private furnish(accountId: number | null): void {
    const account = accountId === null ? undefined : this.accounts.account(accountId);
    if (account?.made && this.options.roleAdapter.features.includes("accounts")) this.options.roleAdapter.logins?.furnish(account.folder);
  }

  /** Sends every client the accounts and the default one, after either changed. */
  private broadcastAccounts(): void {
    this.broadcast({ type: "accounts", ...this.accountsMessage() });
  }

  /** Where the agent keeps the conversations of an account's config folder, as the adapter reads it now, or null where it keeps none there and where the account has no folder, as System default before the adapter found one. */
  private conversationsOf(accountId: number): string | null {
    const { configDir } = this.foldersOf(accountId);
    return configDir === null ? null : (this.options.roleAdapter.conversationsOf?.(configDir) ?? null);
  }

  /** The accounts as a message carries them: each with its refresh and where it keeps its conversations, read now, the default one, and whether the adapter refreshes usage. */
  private accountsMessage(): { accounts: Account[]; defaultAccountId: number; refreshesUsage: boolean } {
    return { accounts: this.accounts.listed((id) => this.refreshes.get(id) ?? null).map((account) => ({ ...account, conversations: this.conversationsOf(account.id) })), defaultAccountId: this.accounts.defaultId(), refreshesUsage: this.options.roleAdapter.features.includes("limit-refresh") };
  }

  /**
   * Refreshes an account's usage at a request, the person's press: refused
   * while something runs under the account, which hands over its values
   * itself, and while a refresh of it runs. Otherwise the daemon starts one
   * session through the adapter under the account, as a headless session of
   * it would be launched but with no role and as a refresh, in the empty
   * folder of its run folder, so no repository's file is read. It keeps the
   * limit values the session hands over, and ends the session at its result
   * or after `REFRESH_LIMIT_MS`. The refresh is no headless session of a
   * work item, so it is listed with its account and gets no entry in the
   * ledger.
   */
  private async refreshUsage(socket: WebSocket, message: Extract<ClientMessage, { type: "refreshUsage" }>): Promise<void> {
    const now = this.options.now ?? Date.now;
    let id: number;
    let cwd: string;
    const adapter = this.options.roleAdapter;
    try {
      const { id: named } = message as { id: unknown };
      if (typeof named !== "number") throw new Error("A refresh of usage names the account.");
      id = named;
      if (!this.accounts.holds(id)) throw new Error(`No account ${String(id)} is kept.`);
      if (!adapter.features.includes("limit-refresh")) throw new Error(`The ${adapter.name} adapter does not refresh an account's usage.`);
      // Only an adapter that launches a session under an account's folder reads that account's usage; another reads its default login's.
      if (id !== SYSTEM_DEFAULT_ID && !adapter.features.includes("accounts")) throw new Error(`The ${adapter.name} adapter launches no session under an account's folder, so it refreshes the usage of ${SYSTEM_DEFAULT_NAME} alone.`);
      if (this.refreshes.get(id)?.state === "running") throw new Error(`The usage of "${this.accountNamed(id)}" is being refreshed already.`);
      const running = this.runningUnder(id);
      if (running.length > 0) throw new Error(`The usage of "${this.accountNamed(id)}" is not refreshed while something runs under it, which hands over its values itself: ${running.join("; ")}.`);
      cwd = this.accounts.refreshFolder();
    } catch (error) {
      this.send(socket, { type: "error", requestId: message.requestId, message: error instanceof Error ? error.message : String(error) });
      return;
    }
    const account = this.accounts.account(id);
    const accountDir = account !== undefined && adapter.features.includes("accounts") ? account.folder : undefined;
    this.furnish(id);
    this.refreshes.set(id, { state: "running", startedAt: now() });
    // The answer first, so the client that asked knows its request was carried out when the accounts carry the refresh.
    this.send(socket, { type: "done", requestId: message.requestId });
    this.broadcastAccounts();
    let handed = 0;
    let usage: Usage | null = null;
    let run: RoleRun | undefined;
    let ended = false;
    const stopRun = (): Promise<void> => run?.stop() ?? Promise.resolve();
    const end = (error: string | null): void => {
      if (ended) return;
      ended = true;
      clearTimeout(limit);
      this.refreshStops.delete(id);
      void stopRun();
      if (this.closed) return;
      // No account is removed while its refresh runs (`runningUnder`), so the account still stands.
      this.refreshes.set(id, { state: "ended", at: now(), handed, usage, error });
      this.broadcastAccounts();
    };
    const limit = setTimeout(() => end("The refresh gave no result within a minute and was stopped."), this.options.refreshLimitMs ?? REFRESH_LIMIT_MS);
    this.refreshStops.set(id, () => {
      ended = true;
      clearTimeout(limit);
      return stopRun();
    });
    const onEvent = (event: RoleEvent): void => {
      if (ended) return;
      if (event.type === "limit") {
        handed += 1;
        this.accounts.setLimit(id, event, now());
      } else if (event.type === "permission") run?.answer(event.id, { allow: false, reason: "A refresh of usage holds no tool." });
      else if (event.type === "result") {
        usage = event.usage;
        end(event.isError ? event.text || "The refresh's session ended with an error." : null);
      } else if (event.type === "exit") end(`The refresh's session exited with code ${String(event.exitCode)} and gave no result.`);
    };
    try {
      run = await adapter.start({ prompt: REFRESH_PROMPT, cwd, refresh: true, ...(accountDir === undefined ? {} : { accountDir }) }, onEvent);
      // A refresh that ended while the adapter was starting, at its limit or at the daemon's close, stopped no run.
      if (ended) void run.stop();
    } catch (error) {
      end(error instanceof Error ? error.message : String(error));
    }
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

  /** The running sessions of the work items given: the panes whose process is alive, and the headless sessions that are working or wait for the machine. */
  private runningIn(workItemIds: ReadonlySet<number>): { panes: Session[]; headless: HeadlessSession[] } {
    return {
      panes: [...this.sessions.values()].filter(({ info }) => info.alive && info.workItemId !== null && workItemIds.has(info.workItemId)),
      headless: [...this.headless.values()].filter(({ info }) => (info.state === "working" || info.state === "queued") && workItemIds.has(info.workItemId)),
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

  /** Takes off the daemon's lists what it holds of the work items given: their panes, the exited among them, their headless sessions, what was read of each branch and of each record, what each one's newest broad gate printed, with its file of the run folder, and the times of each record's blocks, which leave `record-times.json` with them. A delete and a repository's removal call it. The record itself goes with the worktree. The ledger keeps their entries: it is published after its work items are merged and deleted (docs/roadmap.md, "Done criteria"). What the times hold under an id that is given to a new work item is dropped where the id is given, in the `createWorkItem` case. The store of the repositories is not touched. */
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
      this.dropGateOutput(id);
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
   *   delete, and then the branch where Owlery made it (`removedBranch`): a
   *   work item with no branch removes none, and a branch Owlery did not
   *   make stays. Where git reads nothing in the
   *   repository's folder, nothing on disk is removed.
   * - It takes the work item, its panes and its headless sessions off the
   *   lists and out of the store.
   */
  private async deleteOne(id: number, stamp: string, force: boolean, told: Running): Promise<void> {
    const held = this.store.workItem(id);
    if (!held) throw new Error(`no work item ${String(id)}`);
    if (this.archiving.has(id)) throw new Error(this.archivingSays(id));
    const { folder } = held.repository;
    const { worktree } = held.item;
    const branch = removedBranch(held.item);
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
      if (branch !== null) await removeBranch(folder, branch);
    }
    this.dropWorkItems(new Set([id]));
    this.store.removeWorkItem(id);
  }

  /**
   * Ends the running sessions of the work items given, for a request that
   * carries the sessions the person was told of. Where a session runs that
   * `told` does not name, it refuses and ends none. Otherwise it kills each
   * pane's process and stops each headless session, those that wait for the
   * machine first, so a place one that works frees starts none of them, and
   * each is then `failed` with
   * the error `why` and stopped at a request, ends the command of a broad
   * gate that runs for one of them, whose stage then fails with `why`, and
   * waits until each pane's process has exited and each headless run and
   * each command it stopped has ended. Where a
   * pane's has not within the wait, it refuses with the sentence `late`, and
   * goes on where `late` is null; a headless run that has not ended by then
   * refuses nothing. It refuses where a session started in one of the work
   * items while it waited. The panes stay listed, as exited ones. The stage
   * a pane it ends told is dropped as the pane ends, since an ended pane runs
   * no stage (`stageTold`), and the lists that say so are sent then, before
   * the wait, so a pane whose process outlives the wait holds none.
   */
  private async endSessions(workItemIds: ReadonlySet<number>, told: Running, why: string, late: string | null): Promise<void> {
    const { panes, headless } = this.runningTold(workItemIds, told);
    // The queued sessions leave the queue first, so a place a working one frees never goes to a session this end is about to stop.
    const ordered = [...headless].sort((a, b) => Number(b.info.state === "queued") - Number(a.info.state === "queued"));
    const stops = ordered.flatMap((session) => this.stopHeadless(session, why, "request") ?? []);
    // A broad gate is no session the person was told of by its id: it is the chain's, and it ends with the work item's sessions.
    for (const id of workItemIds) {
      const stopping = this.stopGate(id, "request", `the command was ${why}`);
      if (stopping !== undefined) stops.push(stopping);
    }
    let dropped = false;
    for (const session of panes) {
      session.ended = true;
      session.terminal.kill();
      dropped = this.dropStageOf(session.info.id) || dropped;
    }
    if (dropped) this.broadcastInbox();
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
   * Stops a headless session that works or waits for the machine: it stops its run, and the session is
   * `failed` with the error `why` and says what stopped it. It gives the
   * promise of the run's end, and nothing where the adapter is still
   * starting, whose run is stopped once it has started. A session that
   * waits for the machine leaves the queue with no run to stop, and gets no
   * entry in the ledger, since nothing ran.
   */
  private stopHeadless(session: HeadlessSession, why: string, stopped: "limit" | "request"): Promise<void> | undefined {
    if (session.info.state === "queued") session.entered = true;
    const stopping = session.run?.stop();
    session.info.state = "failed";
    session.info.error = why;
    session.info.stopped = stopped;
    this.headlessChanged(session);
    return stopping;
  }

  /** Starts a headless session's run through the adapter, under the account's folder where one is given, and keeps what its events say of it. */
  private startHeadless(session: HeadlessSession, cwd: string, accountDir: string | undefined): void {
    const { info } = session;
    const failed = (message: string): void => {
      info.state = "failed";
      info.error = message;
      this.headlessChanged(session);
    };
    const onEvent = (event: RoleEvent): void => {
      // What a session says of its account's limit is kept whenever it says it, so an account that runs sessions shows its values with no refresh.
      if (event.type === "limit") {
        // A session launched under none ran under the default login, whose values these are.
        if (this.accounts.setLimit(session.account?.id ?? SYSTEM_DEFAULT_ID, event, (this.options.now ?? Date.now)())) this.broadcastAccounts();
        return;
      }
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
      if (event.type === "session") {
        session.named = { id: event.id, model: event.model };
        return;
      }
      if (event.type === "permission") {
        // The adapter reports no event before its run is held (`RoleAdapter.start`), so the answer has a run to go to.
        const verdict = verdictOn(session.role, event, cwd);
        if (verdict.answer === "allow") session.run?.answer(event.id, { allow: true });
        else {
          session.refusals.push({ tool: event.tool, action: event.action, rule: verdict.rule });
          session.run?.answer(event.id, { allow: false, reason: verdict.reason });
        }
        return;
      }
      // Each request was answered by the grant as it arrived, so its withdrawal leaves nothing to take back.
      if (event.type === "permission-withdrawn") return;
      if (event.type === "text") {
        info.answer += event.text;
        this.headlessChanged(session);
        return;
      }
      info.usage = event.usage;
      if (event.isError) {
        failed(event.text || "the session ended with an error");
        return;
      }
      info.state = "finished";
      info.answer = event.text;
      this.headlessChanged(session);
    };
    session.started = this.options.roleAdapter.start({ prompt: session.prompt, cwd, role: session.role, ...(accountDir === undefined ? {} : { accountDir }) }, onEvent).then(
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
        if (info.state === "working") {
          // Nothing ran, so the session gets no entry in the ledger.
          session.entered = true;
          failed(error instanceof Error ? error.message : String(error));
        }
        return undefined;
      },
    );
  }

  /**
   * Begins a headless session in a work item's worktree: lists it, starts
   * its time limit, tells every client of it and starts its run through the
   * adapter. A stage of a chain and `startRoleSession` both begin here, so
   * the limit, the stop, the bound of the ended sessions and the answers by
   * the role's grant are one for both. `prompt.given` is what the agent is
   * given and `prompt.shown` what the session lists as its prompt. Where the
   * daemon keeps a cap on agents and the agents that run are at it or over
   * it, the session is listed `queued` as `rank`, with no limit and no run,
   * and `started` is called with it once a place frees and it starts
   * (`drainQueue`): its limit and its `startedAt` count from there. The
   * session keeps the repository's folder and the branch as the store holds
   * them now, and `chain`, the kind and the round of the chain's stage it
   * begins for or null for one no chain begins, which its entry of the
   * ledger names. It runs under the account `accountFor` gives now
   * from `own`, the session's own account or null where it names none, the
   * work item's, the repository's and the default, and the adapter is given
   * that account's folder where it has one. Through an adapter that does not
   * declare `accounts` it runs under none: it is given no folder, carries no
   * account and names none in its entry, and its limit values are kept as
   * System default's.
   */
  private beginHeadless({ item, repository }: Held, prompt: { shown: string; given: string }, role: RoleStage, chain: LedgerEntry["chain"], worktree: string, own: number | null, rank: QueueRank, started?: (info: HeadlessInfo) => void): HeadlessSession {
    let end = (): void => {};
    const ended = new Promise<void>((resolve) => {
      end = resolve;
    });
    // Through an adapter that declares no accounts a session runs under the agent's default login whatever setting is nearest, so it is launched under none.
    const accountId = this.options.roleAdapter.features.includes("accounts") ? accountFor(own, item, repository, this.accounts.defaultId()) : null;
    // Undefined for System default, which has no folder, and for none.
    const account = accountId === null ? undefined : this.accounts.account(accountId);
    const accountDir = account?.folder;
    this.furnish(accountId);
    const session: HeadlessSession = {
      info: { id: this.nextHeadlessId++, workItemId: item.id, prompt: prompt.shown, state: "working", answer: "", error: null, usage: null, startedAt: (this.options.now ?? Date.now)(), errorOutput: "", stopped: null, role, accountId },
      role,
      prompt: prompt.given,
      run: undefined,
      started: Promise.resolve(undefined),
      ended,
      end,
      refusals: [],
      named: null,
      limit: undefined,
      repo: repository.folder,
      branch: item.branch,
      chain,
      account: accountId === null ? null : { id: accountId, name: account?.name ?? SYSTEM_DEFAULT_NAME },
      entered: false,
    };
    const start = (): void => {
      session.limit = setTimeout(() => void this.stopHeadless(session, "the session reached its time limit and was stopped", "limit"), this.options.headlessLimitMs ?? HEADLESS_LIMIT_MS);
      this.startHeadless(session, worktree, accountDir);
    };
    const cap = this.agentsCap();
    // The count is read before the session is listed: it is listed as working, and would count itself.
    const full = cap !== null && this.agentsRunning() >= cap;
    this.headless.set(session.info.id, session);
    if (full) {
      session.info.state = "queued";
      session.info.queuedAt = session.info.startedAt;
      this.queued.set(session.info.id, {
        rank,
        joined: this.queueJoins++,
        start: () => {
          session.info.state = "working";
          session.info.startedAt = (this.options.now ?? Date.now)();
          start();
          this.headlessChanged(session);
          started?.(session.info);
        },
      });
      this.headlessChanged(session);
      return session;
    }
    this.headlessChanged(session);
    start();
    return session;
  }

  /**
   * Sends every client one headless session whole, after it changed. A
   * session that has just ended no longer waits for its limit and gets its
   * entry in the ledger, and where more sessions have ended than the daemon
   * keeps, the one that ended first leaves the list and every client is
   * told. A session that waits for the machine has not ended. The count and
   * the queue are told after it.
   */
  private headlessChanged(session: HeadlessSession): void {
    this.broadcast({ type: "headless", headless: session.info });
    // A session that works or waits for the machine has not ended.
    const { state } = session.info;
    const ended = state === "finished" || state === "failed";
    if (ended && !this.endedHeadless.has(session.info.id)) {
      this.queued.delete(session.info.id);
      clearTimeout(session.limit);
      this.enter(session, state, session.info.stopped);
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
    this.agentsCounted();
    this.checkIdle();
  }

  /**
   * Adds a session's entry to the ledger, once: how it ended, what stopped it,
   * the daemon's clock now, and the usage its result reported, which is null
   * for a session that ended with no result.
   */
  private enter(session: HeadlessSession, state: LedgerEntry["state"], stopped: LedgerEntry["stopped"]): void {
    if (session.entered) return;
    session.entered = true;
    const { info } = session;
    this.ledger.add({ workItemId: info.workItemId, repo: session.repo, branch: session.branch, stage: info.role, chain: session.chain, startedAt: info.startedAt, endedAt: (this.options.now ?? Date.now)(), state, stopped, usage: info.usage, account: session.account });
  }

  /**
   * The base a pane's environment names for the chain command: what round
   * 1's target would name for the work item (`chain.ts#roundBase`), which is
   * its base branch where the target line takes the name, and otherwise the
   * commit its work starts from (`baseCommit`). Null where the work item records neither: a launch
   * reads no head, and the chain command then asks for `--base`.
   */
  private paneBase(workItemId: number): string | null {
    const item = this.store.workItem(workItemId)?.item;
    return item === undefined ? null : roundBase(item.baseBranch, item.baseCommit, "") || null;
  }

  /**
   * Starts a pane's process in `cwd`, and sends its output to the client that
   * asked for it. `continueLatest` is true only for a `start` that asked it of
   * a kind that continues. A pane of a kind that declares `accounts` runs
   * under the account `accountFor` gives now from `own`, the pane's own
   * account or null where it names none, the work item's, the repository's
   * and the default, and its start names that account's folder. `commandOf`
   * gives the command of a pane that runs another than its kind's, as a setup
   * pane does, which runs under no account. A sign-in pane, `signsIn`, runs
   * the command `commandOf` gives under the account it signs in, in no work
   * item, and at its process's end the daemon reads the account's login. A
   * launch under an account whose folder the daemon made gives that folder
   * the person's names it lacks first.
   */
  private startSession(socket: WebSocket, pane: { kind: PaneKind; cols: number; rows: number }, cwd: string, workItemId: number | null, continueLatest = false, own: number | null = null, commandOf?: (id: number) => PaneCommand, signsIn: number | null = null): SessionInfo {
    const id = this.nextId++;
    const held = workItemId === null ? undefined : this.store.workItem(workItemId);
    const repository = held?.repository;
    const accountId = signsIn ?? (commandOf || !held || !this.options.paneKinds.some((offered) => offered.kind === pane.kind && offered.accounts === true) ? null : accountFor(own, held.item, held.repository, this.accounts.defaultId()));
    this.furnish(accountId);
    const launch = commandOf ? commandOf(id) : workItemId === null ? undefined : this.options.commandFor(pane.kind, id, { continueLatest, folder: cwd, base: this.paneBase(workItemId), checkout: repository?.folder ?? cwd, chosen: repository?.paneChain ?? null, ...this.foldersOf(accountId) });
    // Only a pane that runs a command of its own opens in no work item.
    if (launch === undefined) throw new Error("a pane opens in a work item");
    const size = { cols: pane.cols, rows: pane.rows };
    const session: Session = {
      info: { id, kind: pane.kind, alive: true, workItemId, accountId, signsIn, state: null, stateSince: null, stateText: null, stateTool: null, stateQuestions: null, name: null, colour: null },
      terminal: this.spawnPane(launch, cwd, size, signsIn === null),
      output: new OutputBuffer(this.outputLimit()),
      silentStart: undefined,
      log: undefined,
      logUnread: false,
      interrupted: false,
      exited: Promise.resolve(),
      ended: false,
      cwd,
      size,
      conversation: undefined,
      replacing: false,
    };
    this.sessions.set(id, session);
    this.watchProcess(session);
    this.clients.get(socket)?.add(id);
    this.checkIdle();
    return session.info;
  }

  /** Starts a pane's process with its command in its folder at its size, in the daemon's environment without the variables of a pane it was started from (`hooks.ts#PANE_VARIABLES`) and with the command's own over it, or, where it does not `inherit`, in the command's own alone. */
  private spawnPane({ command, args, env }: PaneCommand, cwd: string, size: { cols: number; rows: number }, inherit = true): TerminalSession {
    // A sign-in pane runs in the cleared environment its command names, as `auth status` and `auth logout` do; the terminal adds its own names.
    return TerminalSession.spawn({ command, args, cwd, cols: size.cols, rows: size.rows, env: inherit ? { ...withoutPaneVariables(process.env), ...env } : env });
  }

  /**
   * Follows the pane's latest process: what it prints is kept for a replay
   * and sent to the clients that receive the pane, and its end is the pane's
   * end, which every client is told of. A process the daemon ended for a
   * change of the pane's account ends nothing of the pane: the next process
   * takes its place.
   */
  private watchProcess(session: Session): void {
    const { terminal } = session;
    const { id, workItemId } = session.info;
    const signsIn = session.info.signsIn ?? null;
    let exited = (): void => {};
    session.exited = new Promise<void>((resolve) => {
      exited = resolve;
    });
    if (this.reportsState(session.info.kind)) session.silentStart = setTimeout(() => this.silentStartOver(session), this.options.silentStartMs ?? SILENT_START_MS);
    const print = (data: string): void => {
      session.output.append(data);
      this.sendOutput(id, data);
    };
    terminal.onData(print);
    terminal.onExit((exitCode, signal) => {
      session.info.alive = false;
      // The session that told a stage is gone with its process; the lists that follow the exit carry the drop.
      this.dropStageOf(id);
      // A change of the account waits on this exit, unless the pane's close, an archive or a removal ended the pane meanwhile: then the exit is the pane's end.
      if (session.replacing && !session.ended) {
        clearTimeout(session.silentStart);
        this.endLog(session);
        exited();
        return;
      }
      // A setup ends with its pane's process, whether or not the pane is still listed.
      const setupEnded = workItemId !== null && this.setupExited(workItemId, id, exitCode, signal, session.ended);
      // A sign-in ended, however it went, so the account's login is read again, or an add's folder is decided. A daemon that is closing reads nothing.
      if (signsIn !== null && !this.closed) {
        const account = this.accounts.account(signsIn);
        if (account !== undefined)
          void this.readLogin(account).then(
            (changed) => {
              if (changed) this.broadcastAccounts();
            },
            (error: unknown) => console.error(`the login of account ${String(signsIn)} was not read: ${error instanceof Error ? error.message : String(error)}`),
          );
        else void this.endAdd(signsIn, session);
      }
      exited();
      clearTimeout(session.silentStart);
      this.endLog(session);
      // A closed pane is on no list, and its end is no client's news.
      if (this.sessions.get(id) === session) {
        // The exit line is the session's last output, so a replay of an exited session ends with it and no client writes one of its own.
        print(`\r\n[process exited with code ${exitCode}]\r\n`);
        this.broadcast({ type: "exit", id, exitCode });
        this.broadcastInbox();
      } else if (setupEnded) this.broadcastInbox();
      this.checkIdle();
    });
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
        const info = this.startSession(socket, { kind: "shell", cols: size.cols, rows: size.rows }, cwd, workItemId, false, null, (id) => commandFor(command, id));
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
    this.measureWorktree(workItemId);
    return true;
  }

  /**
   * Measures a work item's worktree with the reader's `sizeOf`, after the
   * measures asked before it, where the daemon was given a reader and the
   * work item has no size, and keeps the size with the work item and tells
   * every client the machine. A measure that gives none keeps none, and the
   * next daemon measures the worktree again. A daemon that closed measures
   * and keeps nothing. The store holds the size whether or not its file was
   * written: a measure has no request to answer with the error.
   */
  private measureWorktree(workItemId: number): void {
    const { machine } = this.options;
    if (!machine) return;
    this.measuring = this.measuring
      .then(async () => {
        const held = this.store.workItem(workItemId);
        if (this.closed || !held || held.item.worktreeSize !== null) return;
        const kilobytes = await machine.sizeOf(held.item.worktree);
        if (this.closed || kilobytes === null) return;
        try {
          this.store.setWorkItem(workItemId, { worktreeSize: { kilobytes, measuredAt: (this.options.now ?? Date.now)() } });
        } catch (error) {
          console.error(`the size of a worktree was not written: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.broadcastMachine();
      })
      .catch((error: unknown) => console.error(`a worktree was not measured: ${error instanceof Error ? error.message : String(error)}`));
  }

  /** The largest worktree measured, in bytes, of the repository whose main checkout is `folder`, or of every repository where none is named; null where none is measured. */
  private largestWorktree(folder?: string): number | null {
    const sizes = this.store.workItems().flatMap(({ repository, item }) => (item.worktreeSize === null || (folder !== undefined && repository.folder !== folder) ? [] : [item.worktreeSize.kilobytes * 1024]));
    return sizes.length === 0 ? null : Math.max(...sizes);
  }

  /** What a plan in the repository whose main checkout is `repo` carries of the room its worktree would take, with the disk read anew; none where the daemon was given no reader or read no disk. */
  private planDisk(repo: string | null): PlanDisk | undefined {
    this.readMachineNow();
    const machine = this.machineNow();
    if (!machine?.reading.disk) return undefined;
    const { standing, set, proposed } = machine.worktrees;
    return { freeBytes: machine.reading.disk.freeBytes, keepFreeBytes: KEEP_FREE_BYTES, needsBytes: repo === null ? null : this.largestWorktree(repo), standing, cap: set ?? proposed };
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

  /**
   * Watches the session log at `path` for a working pane, where no watch of
   * that log reads: a watch of another log ends first. A path that is no
   * text starts nothing, and leaves the watch that reads as it is. Each line
   * the log gains is read for the entry of an interrupted turn, and nothing
   * else of it is kept or sent.
   */
  private followLog(session: Session, path: unknown): void {
    if (typeof path !== "string") return;
    if (session.log?.open && session.log.path === path) return;
    session.log?.end();
    session.log = new SessionLogWatch(
      path,
      (line) => {
        if (isInterruptionEntry(line)) this.interruptedTurn(session);
      },
      (error) => {
        if (session.logUnread) return;
        session.logUnread = true;
        console.error(`the session log of pane ${String(session.info.id)} is not read, so its state is what its hook events say: ${error.message}`);
      },
      this.options.sessionLogWaitMs,
    );
  }

  private endLog(session: Session): void {
    session.log?.end();
    session.log = undefined;
  }

  /**
   * Lists as waiting a working pane whose session log gained the entry of an
   * interrupted turn, with the interruption's text and no tool, and tells
   * every client of the interruption as of an agent's event. The watch ends
   * with the working state, so the pane is working here.
   */
  private interruptedTurn(session: Session): void {
    this.endLog(session);
    this.broadcast({ type: "agent", id: session.info.id, event: "interrupted", tool: null, at: Date.now() });
    session.interrupted = true;
    session.info.state = agentStateAfter("interrupted");
    session.info.stateSince = (this.options.now ?? Date.now)();
    session.info.stateText = INTERRUPTED_TEXT;
    session.info.stateTool = null;
    session.info.stateQuestions = null;
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

  /** What the line of the daemon's stop counts (./stop-record): the panes alive, and the agents working, a pane alive whose state is `working` and a headless session that is. A stop reads it before it closes the daemon, which ends the panes. */
  stopCounts(): StopCounts {
    const panes = [...this.sessions.values()].filter((session) => session.info.alive);
    const headless = [...this.headless.values()].filter((session) => session.info.state === "working");
    return { panesAlive: panes.length, agentsWorking: panes.filter((session) => session.info.state === "working").length + headless.length };
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
  private repositoryOf({ id, folder, name, icon, defaultBase, hidden, paneChain, groups, accountId }: StoredRepository): Repository {
    return { id, folder, name: name ?? basename(folder), customName: name, icon, defaultBase, hidden, groups: groups.map((group) => ({ ...group })), records: this.records.get(id) ?? { root: null, check: null, broadGate: null }, chain: { ...(this.paneChains.get(id) ?? { owl: false, plugin: false }), chosen: paneChain }, accountId };
  }

  /**
   * Reads what a repository's main checkout holds of the records place, from
   * its working tree, and which chain its Claude Code panes would run there:
   * whether the checkout is on the owl chain, and whether Claude Code enables
   * the AgenticSeal plugin for it under the config folder of the account a
   * new pane of the repository takes where neither the pane nor its work
   * item names one. It answers whether any of it is another than was last
   * read.
   */
  private readRecords(repository: StoredRepository): boolean {
    const { id, folder } = repository;
    const read = readRecordsPlace(folder);
    const known = this.records.get(id) ?? { root: null, check: null, broadGate: null };
    this.records.set(id, read);
    // Read under the account a new pane of the repository takes where neither the pane nor its work item names one.
    const { configDir } = this.foldersOf(accountFor(null, { accountId: null }, repository, this.accounts.defaultId()));
    const chain = { owl: onOwlChain(folder), plugin: this.options.pluginEnabled?.(folder, folder, configDir) ?? false };
    const chained = this.paneChains.get(id) ?? { owl: false, plugin: false };
    this.paneChains.set(id, chain);
    return read.root !== known.root || read.check !== known.check || read.broadGate !== known.broadGate || chain.owl !== chained.owl || chain.plugin !== chained.plugin;
  }

  /** The version the workflow of a setup fetches the check at. A daemon given none refuses the plan and the setup. */
  private version(): string {
    if (this.options.version === undefined) throw new Error("This build of Owlery names no version, so it cannot write the workflow of the pull request check.");
    return this.options.version;
  }

  /**
   * What gives turns to the commands that ask on the turn socket
   * (`turn-socket.ts`), and to the daemon's own broad gate: the keeper's
   * giver, which asks the keeper with the folder named as the work item
   * whose worktree it is names it. git names a worktree's top by its real
   * path, and the daemon names a work item's worktree as it was given,
   * which may run through a link, so the work item finds the wait of its
   * worktree (`workItemOf`) whichever name the command asked with.
   */
  turnGiver(): TurnGiver {
    return this.giver;
  }

  /**
   * Reads the load every `loadEveryMs` while a heavy command holds or waits
   * for a turn, so the highest load of each turn is kept, and stops at the
   * end of the last: a daemon reads the load only while one runs or waits.
   * A daemon given no reading of the load reads nothing.
   */
  private readLoadWhileAsked(): void {
    const asked = this.turns.queue().length > 0;
    if (asked && this.loadReads === undefined && this.options.load !== undefined) {
      this.loadReads = setInterval(() => this.turns.sample(), this.options.loadEveryMs ?? LOAD_EVERY_MS);
      this.loadReads.unref();
    } else if (!asked && this.loadReads !== undefined) {
      clearInterval(this.loadReads);
      this.loadReads = undefined;
    }
  }

  /** Keeps a run's line in the runs' file of the run folder, with the repository and the work item whose worktree the folder is. */
  private keepHeavyRun(run: HeavyRunTaken): void {
    const held = this.store.workItems().find(({ item }) => item.worktree === run.folder);
    addHeavyRun(this.options.runDir, { repo: held?.repository.folder ?? null, workItemId: held?.item.id ?? null, ...run });
  }

  /** The folder as the work item whose worktree it is names it, or as given where it is no work item's worktree. Two names are one folder where their real paths are one. */
  private worktreeNamed(folder: string): string {
    const real = realPathOf(folder);
    return this.store.workItems().find(({ item }) => realPathOf(item.worktree) === real)?.item.worktree ?? folder;
  }

  /** A work item as a client is sent it: with its repository's id, folder and name, with what was last read of its branch, the seal its head holds among it, and with what was last read of its record: its decisions, its questions and what the reader did not read, and of its records of the chain; with the requests of its headless sessions that wait for the person, the oldest first; and with the heavy command of its worktree that waits for a turn on the machine. Where the daemon holds no reading of its branch, as before its first read after the daemon starts, it carries no `seal`, so a null says that the head holds none. */
  private workItemOf({ repository, item }: Held): WorkItem {
    const read = this.branches.get(item.id);
    // The size of its worktree is the daemon's, which a plan carries as what the repository's next worktree needs.
    const { worktreeSize: _size, ...shown } = item;
    return {
      ...shown,
      repoId: repository.id,
      repo: repository.folder,
      repoName: repository.name ?? basename(repository.folder),
      aheadOfBase: this.aheadCounts.get(item.id)?.ahead ?? null,
      behindBase: this.aheadCounts.get(item.id)?.behind ?? null,
      newCommits: this.commitCounts.get(item.id) ?? null,
      commits: read?.commits ?? null,
      changes: read?.changes ?? null,
      ...(read === undefined ? {} : { seal: read.seal }),
      ...(this.recordsRead.get(item.id) ?? NO_RECORD),
      machineWait: this.turns.waitOf(item.worktree),
      wordOwed: this.wordOwedOf(item),
      paneStage: this.paneStageOf(item),
    };
  }

  /**
   * The stage a pane's session runs in the work item, as the lists carry it
   * (`WorkItem.paneStage`): a broad gate where the keeper lists an ask of the
   * place `gate` in its worktree, holding a turn or waiting, from that ask's
   * time and of the rounds its records hold; otherwise the stage a pane of it
   * told (`stageTold`); otherwise null.
   */
  private paneStageOf(item: Held["item"]): PaneStage | null {
    const gate = this.turns.queue().find(({ folder, place }) => place === "gate" && folder === item.worktree);
    if (gate !== undefined) return { kind: "gate", round: (this.recordsRead.get(item.id) ?? NO_RECORD).recorded.rounds, since: gate.since };
    const held = this.paneStages.get(item.id);
    return held === undefined ? null : { kind: held.kind, round: held.round, since: held.since };
  }

  /**
   * Takes a line the chain command told on the turn socket
   * (`turn-socket.ts#StageLine`), for the work item that is not archived
   * whose worktree the folder is, by its real path, and does nothing for a
   * folder that is no such work item's. A `stage` line is held only where its
   * pane is listed, alive, in that work item, and not ended by the daemon at
   * an archive or a removal (`endSessions`, which drops the stage a pane it
   * ends told), and replaces the stage held
   * before, keeping that one's time where the kind and the round are the
   * same. A `stage-ended` line drops the work item's stage, whichever pane
   * told it, and reads the work item's records again first, so the lists do
   * not carry a reading older than the record just committed. Every client
   * is sent the lists where anything changed.
   */
  stageTold(line: StageLine): void {
    if (this.closed) return;
    const real = realPathOf(line.folder);
    const held = this.store.workItems().find(({ item }) => item.archivedAt === null && realPathOf(item.worktree) === real);
    if (held === undefined) return;
    const { id } = held.item;
    if (line.is === "stage-ended") {
      const dropped = this.paneStages.delete(id);
      const read = this.readRecord(held);
      this.flushTimes();
      if (dropped || read) this.broadcastInbox();
      return;
    }
    const pane = this.sessions.get(line.pane);
    if (pane === undefined || !pane.info.alive || pane.ended || pane.info.workItemId !== id) return;
    const was = this.paneStages.get(id);
    const same = was !== undefined && was.kind === line.kind && was.round === line.round;
    this.paneStages.set(id, { paneId: line.pane, kind: line.kind, round: line.round, since: same ? was.since : (this.options.now ?? Date.now)() });
    if (!same) this.broadcastInbox();
  }

  /** Drops the stage the pane told, where one stands, and says whether one stood. The caller sends the lists. */
  private dropStageOf(paneId: number): boolean {
    let dropped = false;
    for (const [workItemId, stage] of this.paneStages) if (stage.paneId === paneId) dropped = this.paneStages.delete(workItemId) || dropped;
    return dropped;
  }

  /**
   * Writes a person's word, a reversal or their answers, into the record of
   * a work item, through the record's writer, reads the record again for
   * the lists, and has the words the record owes committed (`tryWord`),
   * under a subject made from what is owed. It first asks git where the worktree stands
   * (`worktrees.ts#whyNoCommit`), and the words of one worktree are read and
   * written one after another, in the order they came. It throws, with the
   * file as it stood and no commit, for a work item the daemon does not
   * keep, for one with no branch yet (`NO_BRANCH_TO_WRITE`), for a worktree
   * that is not on the work item's branch or has a rebase, a merge, a
   * cherry-pick, a revert or a `git am` under way, for a
   * worktree that holds no directory of the work item, and whatever the
   * change or the writer throws. A word written into a worktree in the
   * middle of a rebase would be lost where the rebase is aborted, and would
   * hold its continue as a change not staged, so it is refused before it is
   * written and the person sends it again.
   */
  private personWrote(workItemId: number, change: (text: string) => string): Promise<void> {
    const asked = this.store.workItem(workItemId);
    if (!asked) throw new Error(`no work item ${String(workItemId)}`);
    const { worktree, branch } = asked.item;
    const write = async (): Promise<void> => {
      if (branch === null) throw new Error(NO_BRANCH_TO_WRITE);
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
      // A word written while a try is under way has a turn of its own after it.
      this.tryWord(held, true);
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
   * Commits the `routing.md` of a work item's directory, and that file
   * alone, on the work item's branch in its worktree, after a rename of the
   * branch wrote the new name into it: with the subject given and the
   * trailer `Seal-Routing:` that names the work item's directory, which the
   * pull request check reads, under the daemon's bounds of a commit
   * (`commitBounds`). It returns at once, and the commit is made after every
   * earlier one of the same worktree has ended. Where a live pane of the
   * work item says it is working, a headless session of it is working or
   * its chain is running, when the commit's turn comes, nothing is
   * committed: the file stands written, and only a commit a session makes
   * of it carries it, since no stage's commit and no commit of a person's
   * word holds `routing.md`. A commit that fails or is ended leaves the
   * file written and says git's words in the log, and nothing tries it
   * again.
   */
  private commitWord(held: Held, directory: string, subject: string): void {
    const { id, worktree, branch } = held.item;
    const commit = async (): Promise<void> => {
      // A running chain is at work in the worktree between two stages too, so nothing is committed while it runs.
      const working = this.chains.has(id) || this.works(id);
      // No routing names a directory of a work item with no branch, so a rename that makes its branch writes no routing to commit.
      if (working || branch === null) return;
      try {
        await commitPaths(worktree, branch, [relative(worktree, join(directory, ROUTING_FILE))], subject, [`Seal-Routing: ${basename(directory)}`], this.commitBounds());
      } catch (error) {
        console.error(`the renamed branch's routing was not committed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    this.wordCommits.set(worktree, (this.wordCommits.get(worktree) ?? Promise.resolve()).then(commit));
  }

  /** The bounds of every commit the daemon makes: the limit its options name, and the signal its close fires. */
  private commitBounds(): CommitBounds {
    return { limitMs: this.options.commitLimitMs, ended: this.ending.signal };
  }

  /**
   * Reads which words of the person's the work item's record in its
   * worktree holds that the record at the worktree's HEAD does not
   * (`decision-record.ts#owedWords`), keeps the reading, and gives it where
   * a word is owed, or null where none is. Git is asked only where the
   * record holds a decision that stands `reversed` or a question that
   * stands `answered`, and, unless `fresh`, only where the record's text or
   * the branch's head, as the daemon last read it, is another than when it
   * last asked. Where nothing is owed, the failed tries of the work item
   * are forgotten. A record that cannot be read owes nothing, as a work item
   * with no directory of its own does. It arms or stops the pass over the
   * owed words (`armWordPass`).
   */
  private async readOwed(held: Held, fresh: boolean): Promise<OwedRead | null> {
    const { item } = held;
    const directory = workItemDirectory(item.worktree, item.branch);
    const text = this.recordText(held);
    let read: OwedRead | undefined;
    if (directory !== null && text !== null && holdsWords(readDecisionRecord(text))) {
      const head = this.branches.get(item.id)?.head ?? null;
      read = this.owed.get(item.id);
      if (fresh || read?.text !== text || read.head !== head) {
        const committed = await fileAt(item.worktree, "HEAD", relative(item.worktree, join(directory, RECORD_FILE)));
        read = { text, head, words: owedWords(committed, text) };
        this.owed.set(item.id, read);
      }
    } else {
      this.owed.delete(item.id);
    }
    const owes = read !== undefined && read.words.reversed.length + read.words.answered.length > 0;
    if (!owes) {
      this.wordTries.delete(item.id);
      this.wordHeld.delete(item.id);
    }
    this.armWordPass();
    return owes ? (read ?? null) : null;
  }

  /**
   * Reads at the read of the records what the work item's record owes
   * (`readOwed`), which arms the pass over the owed words: a word written
   * while no daemon ran, or in a pane, is tried at the pass's next turn. It
   * answers whether `wordOwed` changed.
   */
  private async readOwedAt(held: Held): Promise<boolean> {
    const { id } = held.item;
    const before = JSON.stringify(this.wordOwedOf(held.item));
    await this.readOwed(held, false);
    const now = this.store.workItem(id);
    return now !== undefined && JSON.stringify(this.wordOwedOf(now.item)) !== before;
  }

  /** Whether the daemon last read a word of the person's in the work item's record that no commit holds. */
  private owesWord(workItemId: number): boolean {
    const read = this.owed.get(workItemId);
    return read !== undefined && read.words.reversed.length + read.words.answered.length > 0;
  }

  /** What the commit of the work item's owed words waits for, as the lists carry it (`WorkItem.wordOwed`): a session where its chain runs or a session of it works, the last failed try's reason where one failed, and null where nothing is owed, where it is archived, and before the first try has failed. */
  private wordOwedOf(item: Held["item"]): WordOwed | null {
    if (item.archivedAt !== null || !this.owesWord(item.id)) return null;
    if (this.chains.has(item.id)) return { waits: "session", why: "the work item's chain is running" };
    if (this.works(item.id)) return { waits: "session", why: "a session of the work item is working" };
    const tried = this.wordTries.get(item.id);
    return tried === undefined ? null : { waits: "retry", why: tried.why };
  }

  /**
   * Has the work item's owed words committed in the worktree's turn, after
   * every commit asked for there before (`commitOwed`). A try that is queued
   * and has not begun takes the place of another. One under way does too,
   * unless `again`, which a word just written gives, so its own turn comes
   * after the try that did not see it.
   */
  private tryWord({ item }: Held, again = false): void {
    const { id, worktree } = item;
    if (this.wordQueued.has(id) || (!again && this.wordRunning.has(id))) return;
    this.wordQueued.add(id);
    const attempt = async (): Promise<void> => {
      this.wordQueued.delete(id);
      // A try whose turn comes after the close's wait commits nothing.
      if (this.ending.signal.aborted) return;
      this.wordRunning.add(id);
      try {
        await this.commitOwed(id);
      } catch (error) {
        console.error(`the person's word was not committed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        this.wordRunning.delete(id);
      }
    };
    this.wordCommits.set(worktree, (this.wordCommits.get(worktree) ?? Promise.resolve()).then(attempt));
  }

  /**
   * Commits the person's words a work item's record owes, in the
   * worktree's turn: it reads what is owed (`readOwed`), and does nothing
   * where nothing is. Where the work item's chain is running, or a live pane
   * or a headless session of it is working, it commits nothing, and the
   * words wait for a session. Otherwise it commits the record alone
   * (`worktrees.ts#commitPaths`) under the daemon's bounds, with the trailer
   * `Seal-Routing:` that names the work item's directory and a subject made
   * from what is owed (`wordSubject`). Where the commit fails, or its limit
   * ends it, the file stands written, the next try is due `wordRetryMs`
   * after the failure, twice that after the next one, and so on to
   * `WORD_RETRY_MAX_MS`, and the log says why where the reason is another
   * than the last failed try's. A commit the close ended is no failure, and
   * the try ends there: the file stands written, the log says nothing, and
   * the next daemon finds the word in the tree. After any other try it reads what is owed again,
   * and every client is sent the lists where `wordOwed` changed. A work item
   * nothing runs in (`whyNoRun`) is not tried. `Daemon#decided` and
   * `Daemon#park` write no word of the person's: the stage that calls them
   * commits the record with its own commit.
   */
  private async commitOwed(workItemId: number): Promise<void> {
    const held = this.store.workItem(workItemId);
    if (!held || held.item.archivedAt !== null || this.whyNoRun(workItemId) !== null) return;
    const before = JSON.stringify(this.wordOwedOf(held.item));
    const told = (): void => {
      const now = this.store.workItem(workItemId);
      if (!this.closed && now && JSON.stringify(this.wordOwedOf(now.item)) !== before) this.broadcastInbox();
    };
    const read = await this.readOwed(held, true);
    const { worktree, branch } = held.item;
    const directory = workItemDirectory(worktree, branch);
    // A work item with no branch yet has no directory of its own (`workItemDirectory`), so it owes no word and nothing is committed for it.
    if (read === null || directory === null || branch === null) return told();
    // A running chain is at work in the worktree between two stages too, and its next stage's commit carries the record.
    if (this.chains.has(workItemId) || this.works(workItemId)) {
      this.wordHeld.add(workItemId);
      return told();
    }
    try {
      await commitPaths(worktree, branch, [relative(worktree, join(directory, RECORD_FILE))], wordSubject(read.words), [`Seal-Routing: ${basename(directory)}`], this.commitBounds());
      this.wordTries.delete(workItemId);
    } catch (error) {
      // The close ended it, and the next daemon finds the word in the tree.
      if (this.ending.signal.aborted) return;
      const said = error instanceof Error ? error.message : String(error);
      const tried = this.wordTries.get(workItemId);
      if (said !== tried?.said) console.error(`the person's word was not committed: ${said}`);
      const failures = (tried?.failures ?? 0) + 1;
      const wait = Math.min((this.options.wordRetryMs ?? WORD_RETRY_MS) * 2 ** (failures - 1), WORD_RETRY_MAX_MS);
      this.wordTries.set(workItemId, { failures, said, why: failedWhy(said), due: Date.now() + wait, text: read.text, head: this.branches.get(workItemId)?.head ?? null });
    }
    await this.readOwed(held, true);
    told();
  }

  /** Arranges the pass over the owed words where a work item that is not archived owes one, and stops it where none does or the daemon closed. The pass holds no process open by itself. */
  private armWordPass(): void {
    const owes = !this.closed && this.store.workItems().some(({ item }) => item.archivedAt === null && this.owesWord(item.id));
    if (owes && this.wordTimer === undefined) {
      this.wordTimer = setInterval(() => this.passWords(), this.options.wordPassMs ?? WORD_PASS_MS);
      this.wordTimer.unref();
    } else if (!owes && this.wordTimer !== undefined) {
      clearInterval(this.wordTimer);
      this.wordTimer = undefined;
    }
  }

  /**
   * One turn of the pass over the owed words. It runs no git itself. For
   * each work item that is not archived, owes a word and has something to
   * run in (`whyNoRun`), and whose try is neither queued nor under way, it
   * has the words tried (`tryWord`) where no chain of it runs and no
   * session of it works, and where no try has failed, the turn before found
   * them waiting for a session, the wait after the last failure is over, or
   * the record's text or the branch's head is another than at that failure.
   */
  private passWords(): void {
    if (this.closed) return;
    const now = Date.now();
    for (const held of this.store.workItems()) {
      const { id } = held.item;
      if (held.item.archivedAt !== null || !this.owesWord(id) || this.whyNoRun(id) !== null || this.wordQueued.has(id) || this.wordRunning.has(id)) continue;
      if (this.chains.has(id) || this.works(id)) {
        this.wordHeld.add(id);
        continue;
      }
      const released = this.wordHeld.delete(id);
      const tried = this.wordTries.get(id);
      if (tried === undefined || released || now >= tried.due || this.recordText(held) !== tried.text || (this.branches.get(id)?.head ?? null) !== tried.head) this.tryWord(held);
    }
    this.armWordPass();
  }

  /** The text of the work item's record in its worktree, or null where it has no directory of its own, no record, or one that cannot be read. */
  private recordText({ item }: Held): string | null {
    const directory = workItemDirectory(item.worktree, item.branch);
    try {
      return directory === null ? null : repositoryFileText(join(directory, RECORD_FILE));
    } catch {
      return null;
    }
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
   * Starts a headless session of `role` that answers `prompt` in a work
   * item's worktree, outside any chain, and resolves with a copy of the
   * session as every client is first told of it. No client message starts
   * a session: a stage of a chain starts its own (`runStage`), and the cases
   * hold the daemon and call this, as they call `startChain`. It rejects with a sentence,
   * and starts nothing, for a work item nothing runs in (`whyNoRun`), an
   * empty prompt, an account the daemon keeps none under, and an adapter
   * that cannot launch a role. `accountId` is the session's own account, as
   * `accountSetting` reads it; without it the session takes the account
   * `accountFor` gives. Where the cap on agents is reached the session waits
   * at the queue's last rank, behind every stage of a chain that runs.
   */
  async startRoleSession(workItemId: number, prompt: string, role: RoleStage, accountId?: number | null): Promise<HeadlessInfo> {
    // The sentences the `ask` message was refused with, before release 0.0.5, in the order it read them.
    if (prompt.trim() === "") throw new Error("asking needs a work item and a prompt");
    // A role session's tools and its answers are its adapter's to keep, so an adapter that declares less launches none.
    const lacks = ROLE_FEATURES.filter((feature) => !this.options.roleAdapter.features.includes(feature));
    if (lacks.length > 0) throw new Error(`the ${this.options.roleAdapter.name} adapter cannot launch a role: it does not declare ${lacks.join(" and ")}`);
    // The session's own account, where it names one, System default among them.
    const own = this.accountSetting(accountId) ?? null;
    // A headless session runs in a work item's worktree and nowhere else: in the daemon's own folder it would read whatever instructions that folder holds.
    const gone = this.whyNoRun(workItemId);
    if (gone !== null) throw new Error(gone);
    const held = this.store.workItem(workItemId);
    if (!held) throw new Error(`no work item ${String(workItemId)}`);
    return { ...this.beginHeadless(held, { shown: prompt, given: prompt }, role, null, held.item.worktree, own, "first-stage").info };
  }

  /**
   * Starts a work item's chain, and resolves once it has started and every
   * client was sent the lists that carry it. No client message starts a
   * chain: the daemon's own code calls this. It rejects with a sentence that
   * says why, with nothing started and nothing written, for a work item
   * nothing runs in (`whyNoRun`) and where `whyNoChain` gives a reason. A
   * chain commits in the worktree and finds its records by the branch's
   * name, so its start waits behind the creations, the renames of a branch
   * and the deletes, and the chain itself does not hold them back.
   * `byPerson` says that a person's word made the start (`beginChain`).
   */
  startChain(workItemId: number, byPerson: boolean): Promise<void> {
    const started = this.changing.then(async () => {
      // Nothing runs in a work item the daemon does not list, nor in an archived one, nor in one being deleted.
      const gone = this.whyNoRun(workItemId);
      if (gone !== null) throw new Error(gone);
      const held = this.store.workItem(workItemId);
      if (!held) throw new Error(`no work item ${String(workItemId)}`);
      await this.beginChain(workItemId, held.item.worktree, byPerson);
      this.broadcastInbox();
    });
    // A start that was refused holds back nothing that waits behind it.
    this.changing = started.catch(() => undefined);
    return started;
  }

  /**
   * Starts a work item's chain in its worktree, where `whyNoChain` gives no
   * reason against it, and throws that reason, with nothing started, where
   * it gives one. A person's word that is being written or committed in the
   * worktree lands first, so the first round's target holds it. The chain is
   * stored `running` with the stages of the starts before this one, which
   * say what ran, and its run begins in a later turn of the daemon's thread,
   * after the caller has answered. `byPerson` says that a person's word
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
    this.store.setWorkItem(workItemId, { chain: { state: "running", says: READING_SAYS, stages: held.item.chain?.stages ?? [], since: (this.options.now ?? Date.now)() } });
    this.chains.set(workItemId, Promise.resolve().then(() => this.runChain(workItemId, byPerson)));
  }

  /**
   * Starts a parked chain again once the person's answers left the work
   * item's record with no open question: the chain runs the step its records
   * owe. Where nothing can start in the work item, or the start is refused
   * as any start is (`whyNoChain`), the chain is `stopped` with a sentence
   * that says why, and a later start runs it. A chain that is no longer
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
      if (chain) this.chainSet(workItemId, { ...chain, state: "stopped", says: notResumedSays(error instanceof Error ? error.message : String(error)), since: (this.options.now ?? Date.now)() });
    }
  }

  /**
   * Why a chain cannot start for a work item something can run in
   * (`whyNoRun`), as a sentence a window shows as it is, or null where it can. The
   * first of these that holds is the reason: a chain of the work item is
   * running; a session of it is working; the work item has no branch yet
   * (`NO_BRANCH_FOR_CHAIN`); the worktree cannot take a commit
   * (`worktrees.ts#whyNoCommit`); it holds no records root; the `Broad gate`
   * key of its `config.json` holds no command, so no gate could pass and a
   * round would be spent for nothing; two directories
   * of its records name the branch; it holds a change no commit holds, or an
   * untracked file, outside the work item's directory, and anywhere where
   * the work item has no directory yet; the branch left the base its chain
   * reads it against (`chain.ts#whyNoBase`), which is the base round 1's
   * record names where one stands and the work item's stored base
   * otherwise; the chain has no base commit; its branch holds no commit
   * after it; the adapter cannot launch a
   * role; the work item's record holds an open question. It throws where
   * the record stands and cannot be read (`repository-file.ts#repositoryFileText`).
   * It writes nothing and starts nothing.
   */
  private async whyNoChain(workItemId: number): Promise<string | null> {
    const held = this.store.workItem(workItemId);
    if (!held) return `no work item ${String(workItemId)}`;
    const { worktree, branch } = held.item;
    if (this.chains.has(workItemId)) return `The chain of work item ${String(workItemId)} is already running.`;
    if (this.works(workItemId)) return `A session of work item ${String(workItemId)} is working, and a round reads a tree nothing is changing. Its chain can start once the session has finished.`;
    if (branch === null) return NO_BRANCH_FOR_CHAIN;
    const why = await whyNoCommit(worktree, branch);
    if (why !== null) return `Owlery cannot commit a record in the worktree now: ${why}.`;
    const root = rootOf(worktree);
    if (root === null) return "The worktree holds no place for work records, so a round's record has nowhere to stand. Set up the records in the repository, and bring them onto this branch.";
    if ((readRecordsPlace(worktree).broadGate ?? "").trim() === "") return `${root}/config.json of the worktree names no command under "Broad gate", so no broad gate can run on this branch and no seal can be given. Name the repository's check there, and commit it.`;
    const directories = workItemDirectories(worktree, branch);
    if (directories.length > 1) return `Two directories of the worktree's records name the branch ${branch}: ${directories.map((directory) => relative(worktree, directory)).join(" and ")}. Owlery cannot tell which is the work item's.`;
    const [directory] = directories;
    const inside = directory === undefined ? null : relative(worktree, directory);
    const loose = (await uncommittedPaths(worktree)).filter((path) => inside === null || !inFolder(path, inside));
    if (loose.length > 0) return `The worktree holds a change no commit holds, at ${loose[0] ?? ""}${loose.length > 1 ? ` and ${String(loose.length - 1)} more` : ""}. A round reads a committed tree: commit the change or remove it first.`;
    const head = await worktreeHead(worktree);
    const recorded = directory === undefined ? null : await recordedBase(worktree, directory, head);
    const base = await this.chainBase(held.item, directory ?? null, head);
    const left = await whyNoBase(worktree, head, base, recorded === null ? BASE_NAMED_IN_A_PANE : BASE_RECORDED);
    if (left !== null) return left;
    if (base.commit === null) return "The work item records no commit its branch was cut at, so a round has no base to read the branch against.";
    const ahead = await newCommits(held.repository.folder, branch, base.commit);
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
   * and runs that stage, the broad gate (`runGate`) and the seal (`runSeal`)
   * among them. It rests `parked` where the records hold an open question,
   * and `rested` where they owe no stage, the step `sealed`. Before it rests
   * `rested` it runs the pull request stage where that is owed
   * (`runPullRequest`), and rests with that stage's sentence once it ended
   * well. No state of the chain says whether a seal holds: `WorkItem.seal`
   * does, read from the branch's head. A sealer's `withheld` verdict stops
   * the chain with its reason.
   * Before a fix pass it reads what the chain owes first
   * (`chain.ts#gateBefore`): the orchestrator's judgment of whether the
   * rounds are converging, whose `no` stops the chain, or a stop at the
   * ceiling of its rounds. A stage whose answer asks questions is followed
   * by the orchestrator's judgment on them, which decides each or parks the
   * work item. Whatever stops a stage, and whatever the reads between
   * two stages throw, leaves the chain `stopped` with a sentence that says
   * why, and nothing of another work item is started, stopped or refused. A
   * daemon that closes ends the run at its next step and stores nothing, so
   * the chain stays stored `running`, which the next daemon reads as stopped.
   * A chain that rests or stops asks for the read of its branch
   * (`readBranchNow`), so the seal its stages committed reaches the window
   * without a wait of one interval.
   * `byPerson` says that a person's word started the run.
   */
  private async runChain(workItemId: number, byPerson: boolean): Promise<void> {
    const rest = (state: Chain["state"], says: string): void => {
      const chain = this.store.workItem(workItemId)?.item.chain;
      // The chain rests in a state it was not in while it ran, from now on.
      if (chain) this.chainSet(workItemId, { ...chain, state, says, since: (this.options.now ?? Date.now)() });
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
        const { worktree } = held.item;
        const why = await whyNoCommit(worktree, chainBranch(held.item));
        if (why !== null) throw new ChainStop(why);
        const directory = await this.chainDirectory(held);
        const head = await worktreeHead(worktree);
        // The base follows the records: round 1's record names it once it stands, and the work item's stored base before that.
        const base = await this.chainBase(held.item, directory, head);
        const standing = await standingOf(worktree, directory, head, base.named, "worktree");
        if (this.closed) return;
        const step = stepOwed(standing);
        if (step.is === "parked") return rest("parked", PARKED_SAYS);
        // The step `sealed` owes the pull request stage where the routing sends the work to one and the stored pull request does not carry the head.
        if (step.is === "sealed") return rest("rested", (await this.runPullRequest(held, directory, standing, step, base)) ?? sealedSays(step.round, step.at));
        if (step.is === "gate") await this.runGate(held, directory, standing, step.round, base);
        else if (step.is === "seal") {
          const withheld = await this.runSeal(held, directory, standing, step, base);
          if (withheld !== null) return rest("stopped", withheldSays(withheld));
        } else if (step.is === "round") {
          const asks = await this.runRound(held, directory, standing, step, base);
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
      this.chainStaged.delete(workItemId);
      if (!this.closed) {
        this.settleHold();
        this.checkIdle();
        this.readBranchNow(workItemId);
        // The watch passes over a work item while its chain runs.
        this.scheduleWatch();
      }
    }
  }

  /** The work item's directory in its worktree, for a chain, made and committed with its `routing.md` where none names the branch (`stage-records.ts#declaredDirectory`), from the daemon's clock and in the worktree's turn. */
  private chainDirectory({ item }: Held): Promise<string> {
    const { worktree } = item;
    return declaredDirectory(worktree, chainBranch(item), (this.options.now ?? Date.now)(), (act) => this.inWorktree(worktree, act), null, this.commitBounds());
  }

  /** Makes one commit of a chain in a work item's worktree (`stage-records.ts#commitRecords`), after every commit that was asked for there before it. */
  private chainCommit(item: Held["item"], directory: string, files: readonly [string, ...string[]], subject: string, stage: { write?: () => void; refused?: StageRefusals; trailers?: readonly string[] } = {}): Promise<void> {
    return commitRecords(this.placeOf(item, directory), files, subject, stage, this.turnOf(item));
  }

  /** Where a work item's records are written, as the module of a stage's records takes it. */
  private placeOf(item: Held["item"], directory: string): Place {
    return { worktree: item.worktree, branch: chainBranch(item), directory, bounds: this.commitBounds() };
  }

  /** The turn of a work item's worktree, which a record's commit takes: after every commit of a person's word that was asked for there (`inWorktree`). */
  private turnOf(item: Held["item"]): InTurn {
    return (act) => this.inWorktree(item.worktree, act);
  }

  /**
   * The base a work item's chain reads its branch against at the head given
   * (`chain.ts#baseOf`): the one round 1's record names, where the head
   * holds that record in the work item's directory, and otherwise the one
   * the work item stores, which git reads as the base branch where that
   * names a commit and as the commit the work starts from (`baseCommit`)
   * where it does not. `directory` is null for a work item with no directory yet.
   */
  private async chainBase(item: Held["item"], directory: string | null, head: string): Promise<ChainBase> {
    const { worktree, baseBranch, baseCommit } = item;
    const reads = (baseBranch !== null && (await commitNamed(worktree, baseBranch)) !== null ? baseBranch : baseCommit) ?? head;
    return baseOf(worktree, head, directory === null ? null : await recordedBase(worktree, directory, head), { named: roundBase(baseBranch, baseCommit, head), commit: baseCommit, reads, branch: baseBranch });
  }

  /**
   * Runs one stage of a chain: a headless session launched as the role, in
   * the work item's worktree, listed with the chain as its newest stage.
   * When the session is no longer working, the stage's run is stopped and
   * its process has exited before anything else of the chain happens in the
   * worktree. `after` is then given a finished session's answer, the
   * calls its role's rule refused, and the id and the model the session
   * named as its own, or null where it named none, takes and commits what the stage left,
   * and what it gives is what this gives. The stage is `finished` where it
   * did, and `failed`, with why, where the session failed or was stopped or
   * `after` threw; a failed stage throws a `StageStopped` with the chain's
   * sentence, and its refused calls are counted on the stage and written to
   * no record. A daemon that closed meanwhile throws too, and stores
   * nothing.
   */
  private async runStage<T>(workItemId: number, kind: ChainStageKind, round: number, role: RoleStage, worktree: string, prompt: StagePrompt, after: (answer: string, refused: StageRefusals, named: HeadlessSession["named"]) => Promise<T>): Promise<T> {
    const held = this.store.workItem(workItemId);
    const before = held?.item.chain;
    if (!held || !before) throw new ChainStop("the daemon no longer keeps the work item");
    // A chain's first stage waits for the machine after a stage of a chain that already ran one in its run.
    const rank: QueueRank = this.chainStaged.has(workItemId) ? "running-chain" : "first-stage";
    this.chainStaged.add(workItemId);
    // The stage as the chain lists it. Where the session waited for the machine, its start replaces the stage with one whose `startedAt` is the start's.
    let working!: ChainStage;
    const session = this.beginHeadless(held, { shown: prompt.shown, given: promptText(prompt) }, role, { kind, round }, worktree, null, rank, (info) => {
      const chain = this.store.workItem(workItemId)?.item.chain;
      const was = working;
      working = { ...was, startedAt: info.startedAt };
      if (chain) this.chainSet(workItemId, { ...chain, stages: chain.stages.map((stage) => (stage === was ? working : stage)) });
    });
    working = { kind, round, state: "working", failure: null, startedAt: session.info.startedAt, endedAt: null, headlessId: session.info.id, refusals: 0, gate: null };
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
        left = { gave: await after(session.info.answer, { kind, round, role: role.role, calls: session.refusals }, session.named) };
      } catch (error) {
        if (this.closed) throw error;
        failure = (error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "");
      }
    }
    const listed = working;
    const ended: ChainStage = { ...listed, state: failure === null ? "finished" : "failed", failure, endedAt: (this.options.now ?? Date.now)(), refusals: session.refusals.length };
    const chain = this.store.workItem(workItemId)?.item.chain;
    if (chain) this.chainSet(workItemId, { ...chain, stages: chain.stages.map((stage) => (stage === listed ? ended : stage)) });
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
  private async runRound({ item }: Held, directory: string, standing: Standing, step: Extract<Step, { is: "round" }>, base: ChainBase): Promise<Ask[]> {
    const place = this.placeOf(item, directory);
    const prompt = await roundStage(place, standing, step, base);
    return this.runStage(item.id, "round", step.round, { role: "proofer", stage: "round" }, item.worktree, prompt, (answer, refused) => recordRound(place, standing, step, answer, refused, this.turnOf(item)));
  }

  /**
   * Runs a fix pass: a crafter session whose prompt names the round record,
   * its open findings and the decisions the person reversed
   * (`chain.ts#fixPassPrompt`). The crafter commits its fixes and appends
   * the close blocks, and the daemon then reads the record in the worktree
   * and commits it, where it differs from the one committed before the pass
   * by close blocks alone, the reader refuses no line, each `fixed <commit>`
   * names a commit the branch's head holds and the round's target does not,
   * which changed a path its finding's `location:` or its close block's names,
   * and the worktree holds no change outside the work item's directory.
   * Where one does not hold, nothing is committed. The record's commit
   * carries each decision the prompt gave as reversed, written `applied`
   * with the branch's head after the pass, and the trailer `Seal-Built-By:`
   * with the id the crafter's session named, where it named one that a
   * verdict block can name (`record-blocks.ts#isSessionId`): a later seal
   * reads the sessions that built the work from that trailer. It gives the
   * questions the answer asks (`chain.ts#asksOf`). A pass that leaves a finding open and
   * asks nothing fails after the record's commit, and so does a second pass
   * on one record (`second`) that leaves one open, whatever it asks.
   */
  private async runFixPass(held: Held, directory: string, standing: Standing, step: Extract<Step, { is: "fix-pass" }>, second: boolean): Promise<Ask[]> {
    const { item } = held;
    const place = this.placeOf(item, directory);
    const { prompt, committed } = await fixPassStage(place, standing, step);
    return this.runStage(item.id, "fix-pass", step.round, { role: "crafter", stage: "fix-pass" }, item.worktree, prompt, async (answer, refused, named) => {
      // The reversals the pass took in are read into the daemon's own copy of the record once they are written.
      const applied = (): void => {
        this.readRecord(held);
        this.flushTimes();
      };
      const { asks, open } = await recordFixPass(place, standing, step, { committed, answer, builtBy: named?.id ?? null, refused, applied }, this.turnOf(item));
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
    const prompt = convergencePrompt({ round, worktree: item.worktree, directory: standing.directory, rounds: standing.rounds.map((each) => each.round), decisions: existsSync(record) });
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
   * of decisions, with the subject given, and the subject of a judgment
   * after the round where none is. The question of a sealer's `undecided`
   * verdict is ruled on here as a round's and a fix pass's are. An answer that does not rule on each question once fails
   * the stage, and nothing is recorded. The stage is stored as a `ruling`,
   * so `chain.ts#gateBefore` reads a stored `judgment` as the judgment of
   * convergence alone.
   */
  private async runRuling({ item }: Held, directory: string, inside: string, asked: "round" | "fix-pass" | "seal", round: number, by: "proofer" | "crafter" | "sealer", asks: Ask[], subject = `chore: record the orchestrator's judgment after round ${String(round)}`): Promise<void> {
    const record = join(directory, RECORD_FILE);
    const prompt = rulingPrompt({ round, worktree: item.worktree, directory: inside, by, asked, asks, decisions: existsSync(record) });
    await this.runStage(item.id, "ruling", round, ORCHESTRATOR, item.worktree, prompt, async (answer, refused) => {
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
      await this.chainCommit(item, directory, [record], subject, { refused });
    });
  }

  /**
   * Runs the seal: a fresh sealer session that resumes no conversation, in
   * the work item's worktree, whose prompt names its run, the `target:`
   * line its verdict carries, `<gate's commit> against <base>`, the records
   * to read, and the paths the branch changed with their diff
   * (`chain.ts#sealPrompt`): since the commit the newest verdict block
   * seals, where it is a seal and an ancestor of the gate's commit, which a
   * later commit broke, and otherwise since the branch left its base. Its
   * answer is its run's section of the guarantee. The daemon takes the
   * section from the answer (`seal-records.ts#sectionOf`), puts its own lines into the section's
   * verdict block, appends the section to `guarantee.md` as the head holds
   * the file (`seal-records.ts#guaranteeText`) and commits it, with the
   * rows of the calls the sealer's rule refused, and with the work item's
   * record of decisions where a word of the person's changed it during the
   * seal, which leaves the gate owed again, where each of these holds:
   * the answer's first line that opens a run's section is this run's
   * heading, the reader refuses no line of the section, it holds one
   * verdict block, whose `target:` line is the prompt's and which holds
   * none of the daemon's lines; the session named its id and a model; the
   * daemon was given its version; one session or more is named as having
   * built the work, and the judging session is none of them; and the
   * worktree's head is the one the step was read at, so the gate still
   * holds there, with no change outside the work item's directory. Where
   * one does not hold, nothing is written, and the stage fails with a
   * sentence that says which.
   *
   * The sessions that built the work are `the session` where the
   * `Implementation` row of the `routing.md` the head holds reads so, then
   * the id of each fix pass's session, read from the trailer
   * `Seal-Built-By:` of the commits on the gate's commit's own line that
   * neither the work item's base commit nor the base the branch left holds,
   * so of none of the base's commits, whether a merge,
   * a fast-forward or a rebase put it on the branch.
   *
   * The verdict decides what follows. `sealed`: nothing here, and the order
   * then reads the step `sealed`. `withheld`: it gives the reason, which
   * stops the chain. `undecided`: the question is a stage's question, and
   * the orchestrator is asked for a ruling on it (`runRuling`), for the
   * first verdicts of the guarantee that read `undecided`, as many as the
   * ceiling; the question of a later one parks the work item with no ruling
   * asked, in the commit that carries the verdict. It gives null for every
   * verdict but `withheld`.
   */
  private async runSeal(held: Held, directory: string, standing: Standing, step: Extract<Step, { is: "seal" }>, base: ChainBase): Promise<string | null> {
    const { item } = held;
    const place = this.placeOf(item, directory);
    const { prompt, target } = await sealStage(place, standing, step, base);
    // Whether this run's `undecided` verdict is one the orchestrator rules on, or one past the ceiling.
    const ceiling = this.options.undecidedCeiling ?? UNDECIDED_CEILING;
    const ruled = standing.verdicts.filter((verdict) => verdict.is === "undecided").length < ceiling;
    const verdict = await this.runStage(item.id, "seal", step.round, SEALER, item.worktree, prompt, async (answer, refused, named) => {
      const version = this.options.version;
      if (version === undefined) throw new ChainStop("this daemon was given no version of Owlery, and a verdict names the version of the rules it was judged under");
      // The question of an `undecided` verdict past the ceiling parks the work item in the commit that carries the verdict.
      const before = (newest: Verdict): void => {
        if (newest.is === "undecided" && !ruled && this.park(item.id, { by: SEALER.role, questions: [undecidedParked(undecidedAsk(step.run, newest.says ?? ""), ceiling)] }) === undefined) throw new ChainStop("its question was not written into the work item's record of decisions");
      };
      return recordVerdict(place, standing, step, base, { answer, target, judgedBy: named?.id ?? null, model: named?.model ?? null, version, refused, before }, this.turnOf(item));
    });
    if (verdict.is === "undecided" && ruled) await this.runRuling(held, directory, standing.directory, "seal", step.round, "sealer", [undecidedAsk(step.run, verdict.says ?? "")], SEAL_RULING_SUBJECT);
    return verdict.is === "withheld" ? (verdict.says ?? "") : null;
  }

  /**
   * Runs the broad gate of a work item's chain: the command the `Broad
   * gate` key of the records root's `config.json` holds in the worktree,
   * handed whole to `/bin/sh -c` there with no terminal (`gate.ts#startGate`),
   * listed with the chain as its newest stage. It is no session, so it
   * starts through no adapter and answers no permission request.
   *
   * Before the command starts, the worktree's head is the one the order was
   * read at and the worktree holds no change outside the work item's
   * directory, so the command the daemon then reads is the one the head
   * commit holds and the tree it runs on is that commit's. Where one of
   * those does not hold, where the key holds no command and where the work
   * item records no base commit, nothing starts and the chain stops with a
   * sentence that says so.
   *
   * The gate then asks for its turn on the machine (`machine-turns.ts`), in
   * the place of a broad gate, and its command starts once the turn is
   * given. Where the turn does not come at once, the gate is listed with the
   * chain as its newest stage, one that waits (`GateRun.waits`), the chain's
   * sentence says so, and once the turn comes the head and the tree are read
   * as above again, so the command still runs on the commit the order was
   * read at. A stop that arrives before the command starts ends the ask,
   * starts no command and enters no run in the ledger, and the stage fails.
   * The turn ends once the command's process has exited, and the run's line
   * is kept in the runs' file (`heavy-runs.ts`), with the peak memory of
   * the command's process and its descendants.
   *
   * A run whose command exited with a code other than 0, or was ended by a
   * signal the daemon did not send, while the machine was over its load
   * (`machine-turns.ts#overLoad`: another heavy command held a turn during
   * any part of it, or the load the daemon read at its start was above the
   * cores) runs once more, as a stage of its own. That second run asks to
   * run alone, so it waits until no other heavy command runs and, for
   * `CALM_WAIT_MS` at most, until the load is at the cores or under, and the
   * chain's sentence says so while it waits. Where it passes, its record
   * carries the sentence of the earlier run above its run block
   * (`chain.ts#earlierRunSays`); where it fails, whatever the load, the
   * chain's sentence names both runs (`chain.ts#twiceFailedWhy`).
   *
   * Only the exit of the daemon's own process counts. Where the command
   * exits with 0, and the head and the tree then stand as they stood, the
   * daemon appends one run block, `run: <head> against <base commit>`, to
   * `trail/gate.md` as the head holds the file (`seal-records.ts#gateText`)
   * and commits it. Every other end fails the stage and commits nothing: an
   * exit with another code, a signal, the time limit, a `stopGate`, an end
   * of the work item's sessions, a head that moved, and a change the
   * command left outside the work item's directory. What an earlier run of
   * the work item printed is removed before the command starts, and what
   * this one printed is kept once it has ended, whichever of those ends it
   * was. The run has one entry in the ledger, with no usage. A failed stage
   * throws a `StageStopped` with the chain's sentence. A daemon that closed
   * meanwhile has ended the command: it enters the run as stopped by the
   * daemon, keeps nothing the command printed and stores nothing of the
   * chain, so the stage stays stored as working with no output.
   */
  private async runGate(held: Held, directory: string, standing: Standing, round: number, base: ChainBase): Promise<void> {
    const first = await this.gateRun(held, directory, standing, round, base, null);
    if (first === null) return;
    if (first.again === null) throw new StageStopped(stoppedSays("gate", round, first.failure));
    const second = await this.gateRun(held, directory, standing, round, base, first.again);
    if (second !== null) throw new StageStopped(stoppedSays("gate", round, twiceFailedWhy(first.failure, second.failure)));
  }

  /**
   * One run of the broad gate, as `runGate` states it, listed as a stage of
   * its own with an entry of its own in the ledger and a line of its own in
   * the runs' file. It gives null where the run passed and was recorded, and
   * otherwise why it failed, with the sentence of the earlier run where it is
   * a first run whose command ended with a code or a signal while the machine
   * was over its load, so it runs once more. A second run, given that
   * sentence, asks to run alone, and its record carries the sentence.
   */
  private async gateRun(held: Held, directory: string, standing: Standing, round: number, base: ChainBase, earlier: string | null): Promise<{ failure: string; again: string | null } | null> {
    const { item, repository } = held;
    const { worktree } = item;
    const now = this.options.now ?? Date.now;
    const place = this.placeOf(item, directory);
    let owed: { command: string; head: string; base: string };
    try {
      owed = await gateOwed(place, standing, base);
    } catch (error) {
      throw new StageStopped(gateNotRunSays(error instanceof Error ? error.message : String(error)));
    }
    const env = await this.commandEnvironment();
    // Nothing starts in a daemon that closed or in a work item that was archived, is being deleted or lost its folder while the shell was asked.
    if (this.closed) throw new ChainStop("the daemon closed");
    const gone = this.whyNoRun(item.id);
    if (gone !== null) throw new ChainStop(gone);
    const before = this.store.workItem(item.id)?.item.chain;
    if (!before) throw new ChainStop("the daemon no longer keeps the work item");
    // The gate is held from its ask on, so a stop that arrives while it waits for its turn finds it and ends the ask.
    const gate: RunningGate = { process: undefined, asking: new AbortController(), limit: undefined, stopped: null };
    this.gates.set(item.id, gate);
    let turn: GivenTurn | null = null;
    try {
      const asked = this.giver.ask({ folder: worktree, name: BROAD_GATE_NAME, place: "gate", alone: earlier !== null, gone: gate.asking.signal });
      const listed: ChainStage | undefined = asked.waits ? { kind: "gate", round, state: "working", failure: null, startedAt: now(), endedAt: null, headlessId: null, refusals: 0, gate: { command: cutText(owed.command), exitCode: null, output: false, waits: true } } : undefined;
      if (listed !== undefined) this.chainSet(item.id, { ...before, says: earlier === null ? GATE_WAITS_SAYS : GATE_AGAIN_SAYS, stages: [...before.stages, listed].slice(-CHAIN_STAGES_KEPT) });
      /** Fails the stage that waited, which no command ran for, with why. */
      const unstarted = (failure: string): void => {
        const chain = this.store.workItem(item.id)?.item.chain;
        if (chain && listed !== undefined) this.chainSet(item.id, { ...chain, stages: chain.stages.map((stage) => (stage === listed ? { ...listed, state: "failed", failure, endedAt: now(), gate: { command: cutText(owed.command), exitCode: null, output: false } } : stage)) });
      };
      // Read through a call, since a stop sets it while the gate waits.
      const stopped = (): boolean => gate.stopped !== null;
      turn = await asked.turn;
      if (listed !== undefined && turn !== null && !stopped()) {
        try {
          owed = await gateOwed(place, standing, base);
        } catch (error) {
          const why = error instanceof Error ? error.message : String(error);
          if (this.closed) throw new ChainStop("the daemon closed");
          unstarted(why.replace(/\.+$/u, ""));
          throw new StageStopped(gateNotRunSays(why));
        }
      }
      if (this.closed) throw new ChainStop("the daemon closed");
      if (turn === null || stopped()) {
        unstarted(GATE_STOPPED_BEFORE_START);
        throw new StageStopped(stoppedSays("gate", round, GATE_STOPPED_BEFORE_START));
      }
      const { command } = owed;
      const listing = this.store.workItem(item.id)?.item.chain;
      if (!listing) throw new ChainStop("the daemon no longer keeps the work item");
      this.dropGateOutput(item.id);
      const startedAt = now();
      const started = startGate({ command, cwd: worktree, env, outputChars: this.options.gateOutputChars });
      const memory = watchMemory(started.pid);
      gate.process = started;
      gate.limit = setTimeout(() => void this.stopGate(item.id, "limit", "the command reached its time limit and was stopped"), this.options.gateLimitMs ?? GATE_LIMIT_MS);
      const run: GateRun = { command: cutText(command), exitCode: null, output: false };
      const working: ChainStage = { kind: "gate", round, state: "working", failure: null, startedAt, endedAt: null, headlessId: null, refusals: 0, gate: run };
      // The stage that waited becomes the one that runs, and a gate whose turn came at once is listed as it starts.
      this.chainSet(item.id, { ...listing, says: runningSays("gate", round), stages: listed === undefined ? [...listing.stages, working].slice(-CHAIN_STAGES_KEPT) : listing.stages.map((stage) => (stage === listed ? working : stage)) });
      // The command's process has exited before anything else of the chain happens in the worktree.
      const end = await started.ended;
      const ran = this.giver.ran(asked, turn, { exitCode: end.exitCode, peakMemory: memory.stop() });
      clearTimeout(gate.limit);
      this.gates.delete(item.id);
      const endedAt = now();
      const enter = (state: LedgerEntry["state"], stopped: LedgerEntry["stopped"]): void => this.ledger.add({ workItemId: item.id, repo: repository.folder, branch: item.branch, stage: { role: null, stage: "gate" }, chain: { kind: "gate", round }, startedAt, endedAt, state, stopped, usage: null, account: null });
      if (this.closed) {
        enter("failed", "daemon");
        throw new ChainStop("the daemon closed");
      }
      const output = this.keepGateOutput(item.id, end.output);
      let failure: string | null = null;
      // A first run that ended with a code or a signal while the machine was over its load runs once more, named by this sentence.
      const ended = earlier === null && ran.over ? endedWith(end, gate.stopped !== null) : null;
      const again = ended === null ? null : earlierRunSays({ commit: owed.head, ended, load: turn.load, cores: this.options.cores ?? null, beside: ran.beside });
      // A command that was stopped did not pass, whatever it exited with: one that takes the signal can exit with 0.
      if (gate.stopped !== null) failure = gate.stopped.why;
      else if (end.error !== null) failure = `the command did not start: ${end.error}`;
      else if (end.signal !== null) failure = `the signal ${end.signal} ended the command`;
      else if (end.exitCode !== 0) failure = `the command exited with code ${String(end.exitCode)}`;
      else {
        try {
          await recordGate(place, { head: owed.head, base: owed.base, earlier }, this.turnOf(item));
        } catch (error) {
          if (this.closed) throw error;
          failure = (error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "");
        }
      }
      const done: ChainStage = { ...working, state: failure === null ? "finished" : "failed", failure, endedAt, gate: { ...run, exitCode: end.exitCode, output } };
      enter(done.state === "finished" ? "finished" : "failed", gate.stopped?.by ?? null);
      const chain = this.store.workItem(item.id)?.item.chain;
      if (chain) this.chainSet(item.id, { ...chain, stages: chain.stages.map((stage) => (stage === working ? done : stage)) });
      return failure === null ? null : { failure, again };
    } finally {
      turn?.end();
      if (this.gates.get(item.id) === gate) this.gates.delete(item.id);
    }
  }

  /**
   * Runs the pull request stage at the step `sealed` where it is owed
   * (`chain.ts#pullRequestOwed`): the `Destination` row of the work item's
   * `routing.md` at the branch's head, and the pull request the daemon
   * stores, decide it. Where no stage is owed it gives the sentence of the
   * open pull request that already carries the head, and null where the
   * routing sends the work to none or the stored one is not open; otherwise
   * it gives the chain's sentence once the stage ended well. It is no session, so it
   * starts through no adapter, and it is listed with the chain as its newest
   * stage, in the form of `runGate`.
   *
   * The stage reads the records the head commit holds (`github.ts#bodyRecords`),
   * composes the back of the seal from what those records say for it and the
   * ledger's entries of the work item as they stand then, as `readSealRecords`
   * and `readLedger` give them to the window (`../shared/seal-back`), pushes
   * that head commit, by its id, to the branch on the remote
   * `github.ts#pushTarget` names with the person's git and writes the
   * branch's upstream, then asks the person's `gh` for the branch's open pull
   * requests. Where it lists one, the stage replaces that body's seal section
   * and its back's section, putting the back's after the seal section where
   * the body holds none, and sends the body with `gh pr edit`; where it lists
   * none, it opens one with `gh pr create`, ready, with the work item's
   * title, its base and the body `github.ts#pullRequestBody` composes. It then reads the pull request
   * with `gh pr view` and stores it with the work item. `gh` is the
   * `DaemonOptions` one, or the one on the `PATH` of the broad gate's
   * environment, and runs with that environment, no prompt and no colour.
   * The body's file stands in the run folder, or in the system's temporary
   * folder for a daemon given none, and is removed when the stage ends. The
   * stage commits nothing and writes no file in the worktree, since a commit
   * after the sealed one that is no closing record would break the seal.
   *
   * The stage fails where no `gh` is found, where the worktree's head moved
   * after the records were read, where no remote can be told
   * (`github.ts#pushTarget`), where `guarantee.md` holds no verdict block at
   * the head, where the push, the writing of the upstream or a call of `gh` fails or passes its time
   * limit, where an answer of `gh` does not read, where `gh` lists more than
   * one open pull request of the branch, and where the body it lists holds
   * the markers of either section otherwise than once each. It then throws a `StageStopped`
   * with the chain's sentence, and the stored pull request is as it was. A
   * daemon that closed meanwhile stores nothing.
   */
  private async runPullRequest(held: Held, directory: string, standing: Standing, step: Extract<Step, { is: "sealed" }>, base: ChainBase): Promise<string | null> {
    const { item } = held;
    const { worktree, title } = item;
    const branch = chainBranch(item);
    const routing = await fileAt(worktree, standing.head, relative(worktree, join(directory, ROUTING_FILE)));
    const destination = routingAnswer(routing ?? "", "Destination");
    if (!pullRequestOwed(destination, item.pullRequest, standing.head)) {
      // An open pull request that already carries the head: the chain says that it is open.
      return destination === OPEN_PULL_REQUEST && item.pullRequest?.state === "open" ? pullRequestOpenSays(item.pullRequest.number) : null;
    }
    const env = await this.commandEnvironment();
    // Nothing starts in a daemon that closed or in a work item that was archived, is being deleted or lost its folder while the shell was asked.
    if (this.closed) throw new ChainStop("the daemon closed");
    const gone = this.whyNoRun(item.id);
    if (gone !== null) throw new ChainStop(gone);
    const before = this.store.workItem(item.id)?.item.chain;
    if (!before) throw new ChainStop("the daemon no longer keeps the work item");
    const now = this.options.now ?? Date.now;
    const working: ChainStage = { kind: "pull-request", round: step.round, state: "working", failure: null, startedAt: now(), endedAt: null, headlessId: null, refusals: 0, gate: null };
    this.chainSet(item.id, { ...before, says: runningSays("pull-request", step.round), stages: [...before.stages, working].slice(-CHAIN_STAGES_KEPT) });
    let body: { file: string; remove: () => void } | undefined;
    let failure: string | null = null;
    let says = "";
    try {
      const cli = this.githubCli(env, worktree, "open");
      const head = await worktreeHead(worktree);
      if (head !== standing.head) throw new Error(`the worktree's head moved from ${standing.head.slice(0, 7)} to ${head.slice(0, 7)} while Owlery read the records`);
      const target = await pushTarget(worktree, base.branch);
      const records = await bodyRecords(worktree, head, relative(worktree, directory));
      // The stage runs at a seal that holds at the head, so no commit broke it, and the reader is handed no seal: the body names no breaking commit.
      const { entries, unread } = this.ledger.read(item.id, item.createdAt);
      const back = composeBack(await sealRecords(worktree, directory, head, null), entries, unread);
      const named = await pullRequestTitle(worktree, title, base.commit, head);
      await pushBranch(cli, target.remote, branch, head);
      const listed = await openPullRequests(cli, branch);
      if (listed.length > 1) throw new Error(`the branch has the open pull requests ${listed.map(({ number }) => `#${String(number)}`).join(", ")}, and Owlery opens or updates one`);
      body = this.pullRequestBodyFile(item.id);
      const [open] = listed;
      let url: string;
      if (open === undefined) {
        writeFileSync(body.file, pullRequestBody(records, back), { mode: 0o600 });
        url = await createPullRequest(cli, { branch, base: target.base, title: named, bodyFile: body.file });
      } else {
        let text: string;
        try {
          text = withBackSection(withSealSection(open.body, sealSection(records)), back, records.directory);
        } catch (error) {
          throw new Error((error instanceof Error ? error.message : String(error)).replace(/^the body/u, `the body of pull request #${String(open.number)}`));
        }
        writeFileSync(body.file, text, { mode: 0o600 });
        await editPullRequest(cli, open.url, body.file);
        url = open.url;
      }
      const viewed = await viewPullRequest(cli, url);
      const pullRequest: PullRequest = { ...viewed, pushed: head, readAt: now(), failure: null };
      if (this.closed) throw new ChainStop("the daemon closed");
      this.store.setWorkItem(item.id, { pullRequest });
      // GitHub lists the checks a push starts some seconds after it, so the watch reads the pull request again after the shorter wait, whatever this read gave.
      this.pullRequestDue.set(item.id, Date.now() + (this.options.prPollMs ?? PR_POLL_MS));
      says = open === undefined ? pullRequestOpenSays(viewed.number) : pullRequestCarriesSays(viewed.number, step.at);
    } catch (error) {
      if (this.closed) throw new ChainStop("the daemon closed");
      failure = (error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "");
    } finally {
      body?.remove();
    }
    const ended: ChainStage = { ...working, state: failure === null ? "finished" : "failed", failure, endedAt: now() };
    const chain = this.store.workItem(item.id)?.item.chain;
    if (chain) this.chainSet(item.id, { ...chain, stages: chain.stages.map((stage) => (stage === working ? ended : stage)) });
    if (failure !== null) throw new StageStopped(stoppedSays("pull-request", step.round, failure));
    return says;
  }

  /** The environment a broad gate's command, the person's `gh` and the push run with: the `gateEnv` option, or a pane's with the `PATH` of the person's interactive login shell, which is asked once in the daemon's life (`gate.ts#gateEnvironment`). */
  private async commandEnvironment(): Promise<Record<string, string>> {
    return this.options.gateEnv ?? gateEnvironment(process.env, await (this.gatePath ??= loginPath(process.env)));
  }

  /** The person's `gh` in a worktree, run with the environment given: the `gh` option, or the first `gh` on that environment's `PATH`. It throws, with the second half of a sentence that says what Owlery cannot do without it, where none stands there. */
  private githubCli(env: Record<string, string>, worktree: string, does: "open" | "read"): GitHubCli {
    const found = this.options.gh ?? findOnPath("gh", env.PATH);
    if (found === null) throw new Error(`no gh stands on the PATH of the login shell, so Owlery cannot ${does} the pull request; GitHub's CLI is at https://cli.github.com`);
    return { gh: typeof found === "string" ? [found] : found, env: ghEnvironment(env), cwd: worktree, limitMs: this.options.githubLimitMs ?? GITHUB_LIMIT_MS };
  }

  /** The file a pull request's body is written to for `gh`, readable by the user alone, with what removes it: in the run folder, or in a folder of its own in the system's temporary folder for a daemon given no run folder. */
  private pullRequestBodyFile(workItemId: number): { file: string; remove: () => void } {
    const { runDir } = this.options;
    if (runDir !== undefined) {
      const file = join(runDir, `pull-request-${String(workItemId)}.md`);
      return { file, remove: () => rmSync(file, { force: true }) };
    }
    const folder = mkdtempSync(join(tmpdir(), "owlery-pull-request-"));
    return { file: join(folder, "body.md"), remove: () => rmSync(folder, { recursive: true, force: true }) };
  }

  /**
   * Ends the command of the broad gate that runs for a work item: it
   * signals the command's process group and kills it where the command has
   * not exited after the wait (`gate.ts#startGate`). The gate's stage then
   * fails with `why`, the first one given where two stops arrive, and its
   * entry of the ledger says what stopped it. A gate whose command has not
   * started yet, as one that waits for its turn on the machine, has its ask
   * ended, and its stage fails with `GATE_STOPPED_BEFORE_START`. It gives
   * the promise of the command's end, at once where no command started, and
   * nothing where no gate of the work item asked for its turn.
   */
  private stopGate(workItemId: number, by: "limit" | "request" | "daemon", why: string): Promise<void> | undefined {
    const gate = this.gates.get(workItemId);
    if (gate === undefined) return undefined;
    gate.stopped ??= { by, why };
    if (gate.process === undefined) {
      gate.asking.abort();
      return Promise.resolve();
    }
    return gate.process.stop();
  }

  /** The file of the run folder that holds what a work item's newest broad gate printed, or nothing for a daemon given no run folder. */
  private gateOutputFile(workItemId: number): string | undefined {
    return this.options.runDir === undefined ? undefined : join(this.options.runDir, GATE_OUTPUT_FOLDER, `${String(workItemId)}.txt`);
  }

  /**
   * Keeps what a work item's broad gate printed, and gives whether a text
   * is kept: in its file of the run folder, readable by the user alone and
   * written whole, so a reader after the daemon's end finds it, and in
   * memory for a daemon given no run folder. A command that printed nothing
   * leaves nothing kept. A write that fails is logged, and nothing is kept.
   */
  private keepGateOutput(workItemId: number, text: string): boolean {
    if (text === "") return false;
    const file = this.gateOutputFile(workItemId);
    if (file === undefined) {
      this.gateOutputs.set(workItemId, text);
      return true;
    }
    try {
      mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
      writeWholeFile(file, text);
      return true;
    } catch (error) {
      console.error(`the output of the broad gate of work item ${String(workItemId)} was not written: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Removes what is kept of a work item's broad gate: before its next run starts, and where the work item leaves the lists or its id is given to a new one. */
  private dropGateOutput(workItemId: number): void {
    this.gateOutputs.delete(workItemId);
    const file = this.gateOutputFile(workItemId);
    if (file === undefined) return;
    try {
      rmSync(file, { force: true });
    } catch (error) {
      console.error(`the output of the broad gate of work item ${String(workItemId)} was not removed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** What is kept of a work item's newest broad gate, or null where nothing is. */
  private gateOutput(workItemId: number): string | null {
    const file = this.gateOutputFile(workItemId);
    if (file === undefined) return this.gateOutputs.get(workItemId) ?? null;
    try {
      return readFileSync(file, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error(`the output of the broad gate of work item ${String(workItemId)} was not read: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /** Sends every client the whole of the four lists, after one of them changed. */
  private broadcastInbox(): void {
    this.broadcast({ type: "inbox", ...this.lists() });
    // Every change of a pane's `alive` or `state` ends here.
    this.settleHold();
    this.agentsCounted();
  }

  private keepAwakeNow(): KeepAwake {
    return { choice: this.keepAwake.get(), held: this.hold !== undefined };
  }

  private broadcastKeepAwake(): void {
    this.broadcast({ type: "keepAwake", keepAwake: this.keepAwakeNow() });
  }

  /** Reads the machine, the disk of the worktrees' folder among it, where the daemon was given a reader. */
  private readMachineNow(): void {
    this.reading = this.options.machine?.read(this.options.worktreesRoot ?? worktreesRoot(process.env));
  }

  /** The agents that run: the live panes of a kind that reports its state, and the headless sessions that are working. */
  private agentsRunning(): number {
    const reports = (kind: string): boolean => this.options.paneKinds.some((offered) => offered.kind === kind && offered.reportsState);
    return [...this.sessions.values()].filter(({ info }) => info.alive && reports(info.kind)).length + [...this.headless.values()].filter(({ info }) => info.state === "working").length;
  }

  /** The measures of the agents' memory the proposal reads, in bytes. */
  private measuredBytes(): number[] {
    return (this.memory?.kilobytes() ?? []).map((kilobytes) => kilobytes * 1024);
  }

  /** The cap on agents: the one a person set, or else its proposal, and none where the daemon was given no reader. */
  private agentsCap(): number | null {
    const reading = this.reading;
    if (reading === undefined) return null;
    return this.limits.get().agents ?? agentsProposal(reading, this.measuredBytes()).proposed;
  }

  /** The limit on heavy commands that hold a turn at once: the one a person set, where it is no more than the cores, or else its proposal, and `NO_READING_LIMIT` where the daemon was given no reader. */
  private heavyLimit(): number {
    const reading = this.reading;
    if (reading === undefined) return NO_READING_LIMIT;
    return this.heavySet(reading) ?? heavyProposal(reading).proposed;
  }

  /** The limit on heavy commands a person set, or null where none is set or it is over the machine's cores, which reads as none. */
  private heavySet(reading: MachineReading): number | null {
    const set = this.limits.get().heavyCommands;
    return set !== null && set <= reading.cores ? set : null;
  }

  /** The name a repository's folder is shown by, its own or the last part of its folder, and the last part of the folder a heavy command ran in where no repository is named. */
  private repositoryName(repo: string | null, folder: string): string {
    const repository = repo === null ? undefined : this.store.repositories().find((stored) => stored.folder === repo);
    return repository?.name ?? basename(repo ?? folder);
  }

  /** The ids of the sessions that wait for the machine, in the order they start (`agent-queue.ts#queueOrder`). */
  private queueNow(): number[] {
    return queueOrder([...this.queued].map(([id, { rank, joined }]) => ({ id, rank, joined })));
  }

  /** Starts the sessions that wait for the machine, the first in the queue first, while the agents that run leave a place under the cap. A start drains nothing again. */
  private drainQueue(): void {
    const cap = this.agentsCap();
    if (this.draining || cap === null || this.closed) return;
    this.draining = true;
    try {
      for (;;) {
        const [next] = this.queueNow();
        const waiting = next === undefined ? undefined : this.queued.get(next);
        if (next === undefined || waiting === undefined || placesFree(this.agentsRunning(), cap) === 0) break;
        this.queued.delete(next);
        waiting.start();
      }
    } finally {
      this.draining = false;
    }
  }

  /**
   * Reads the resident memory of each agent's own process, with one call of
   * the reader for all of them: a live pane of a kind that reports its
   * state, by its process, and a working headless session whose adapter
   * handed over its process. The store forgets every agent that no longer
   * lives. Where no agent lives it reads nothing. The store keeps each agent's highest. Where
   * the measures changed, every client is told the machine, and a proposal
   * that rose starts the sessions that waited for it.
   */
  private async measureAgents(): Promise<void> {
    const reader = this.options.machine;
    const memory = this.memory;
    if (!reader || !memory) return;
    const reports = (kind: string): boolean => this.options.paneKinds.some((offered) => offered.kind === kind && offered.reportsState);
    const agents = new Map<number, string>();
    for (const { info, terminal } of this.sessions.values()) if (info.alive && reports(info.kind)) agents.set(terminal.pid, `pane-${String(info.id)}`);
    for (const { info, run } of this.headless.values()) if (info.state === "working" && run?.pid !== undefined) agents.set(run.pid, `headless-${String(info.id)}`);
    // The agents that no longer live are forgotten before the early return, so the last one is forgotten once none lives.
    memory.keepLiving(new Set(agents.values()));
    if (agents.size === 0) return;
    let read: Map<number, number>;
    try {
      read = await reader.memoryOf([...agents.keys()]);
    } catch (error) {
      console.error(`the agents' memory was not read: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (this.closed) return;
    let changed = false;
    for (const [pid, kilobytes] of read) {
      const agent = agents.get(pid);
      if (agent === undefined || kilobytes <= 0) continue;
      try {
        if (memory.note(agent, kilobytes)) changed = true;
      } catch (error) {
        // The measure is held in memory whether or not it was written.
        changed = true;
        console.error(`the agents' memory was not written: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (!changed) return;
    this.broadcastMachine();
    this.agentsCounted();
  }

  /**
   * The machine as the daemon last read it, with each cap's proposal and the
   * value a person set, or nothing where the daemon was given no reader. A
   * worktree stands for each work item the daemon keeps, the archived among
   * them, whose folder an archive leaves in place.
   */
  private machineNow(): Machine | undefined {
    const reading = this.reading;
    if (reading === undefined) return undefined;
    const set = this.limits.get();
    const standing = this.store.workItems().length;
    const perWorktreeBytes = this.largestWorktree();
    return {
      reading,
      agents: { ...agentsProposal(reading, this.measuredBytes()), set: set.agents, running: this.agentsRunning(), queue: this.queueNow() },
      worktrees: { proposed: worktreesProposal(reading, standing, perWorktreeBytes), set: set.worktrees, standing, perWorktreeBytes, keepFreeBytes: KEEP_FREE_BYTES },
      panes: { proposed: panesProposal(reading), set: set.panes },
      heavy: { ...heavyProposal(reading), set: this.heavySet(reading), queue: this.turns.queue().map(({ folder, name, place, state, since }) => ({ workItemId: this.store.workItems().find(({ item }) => item.worktree === folder)?.item.id ?? null, folder, name, place, state, since })) },
      scrollback: { proposed: SCROLLBACK_DEFAULT, set: set.scrollback },
    };
  }

  /** The characters each pane's buffer keeps: `CHARS_PER_LINE` for each line of the scrollback a person set, or of its default. A daemon given no reader of the machine keeps the default. */
  private outputLimit(): number {
    return CHARS_PER_LINE * (this.limits.get().scrollback ?? SCROLLBACK_DEFAULT);
  }

  private broadcastMachine(): void {
    const machine = this.machineNow();
    if (!machine) return;
    this.agentsTold = agentsKey(machine.agents.running, machine.agents.queue);
    this.broadcast({ type: "machine", machine });
  }

  /**
   * After the agents that run or wait may have changed: starts the sessions
   * the cap now has a place for, and tells every client the machine where the count of the agents that
   * run, or the queue, is not the one they were last told.
   */
  private agentsCounted(): void {
    if (this.reading === undefined) return;
    this.drainQueue();
    if (agentsKey(this.agentsRunning(), this.queueNow()) !== this.agentsTold) this.broadcastMachine();
  }

  /**
   * Starts the hold where the daemon wants the Mac awake and holds nothing,
   * and releases it where it holds and no longer wants to, and then tells
   * every client; it answers whether it did either. A hold that ends by
   * itself is told to every client too, and the next call that still wants
   * the Mac awake starts another. While a heavy command holds a turn the
   * hold holds the display too: a hold that stands is replaced by one that
   * holds the display, or by one that does not once the last heavy command
   * has ended, and the clients are told nothing of that, since the Mac
   * stays held. A daemon that closed, or was given no holder, holds nothing.
   */
  private settleHold(): boolean {
    const { holdAwake } = this.options;
    if (!holdAwake) return false;
    const choice = this.keepAwake.get();
    const heavy = this.turns.queue().some((queued) => queued.state === "running");
    const wanted = !this.closed && wantsAwake(choice, this.sessionList(), this.headlessList(), this.chains.size > 0, heavy);
    // A held Mac holds its display too while a heavy command holds a turn: a case that waits on what a page draws fails on a display that sleeps.
    const display = wanted && heavy;
    const held = this.hold !== undefined;
    if (wanted === held && (!wanted || display === this.holdsDisplay)) return false;
    if (this.hold) {
      this.hold.release();
      this.hold = undefined;
    }
    if (wanted) {
      let over = false;
      let standing: { release(): void } | undefined;
      const hold = holdAwake(() => {
        over = true;
        // A hold lost before the holder returned never stood, and one the daemon released is no longer the daemon's.
        if (standing === undefined || this.hold !== standing) return;
        this.hold = undefined;
        this.broadcastKeepAwake();
      }, display);
      // No client is told of a hold that never stood.
      if (over) {
        if (held) this.broadcastKeepAwake();
        return held;
      }
      standing = hold;
      this.hold = hold;
      this.holdsDisplay = display;
    }
    if (held === (this.hold !== undefined)) return false;
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

  /**
   * Arranges the watch's next turn, at the earliest time one of the watched
   * pull requests is due (`watched`), in place of the turn arranged before,
   * where no turn is under way. The turns follow one another while a client
   * is connected: a turn that comes while none is reads nothing and arranges
   * no other, and the hello of the next client to connect starts them again.
   * A daemon that closed arranges none, and nothing the watch does holds the
   * daemon or the Mac. What waits for the next turn (`turnWaits`) is settled
   * once that turn has ended, and at once where no pull request is watched.
   */
  private scheduleWatch(): void {
    if (this.closed || this.watching) return;
    clearTimeout(this.watchTimer);
    this.watchTimer = undefined;
    const watched = this.watched();
    if (watched.length === 0) {
      for (const end of this.turnWaits.splice(0)) end();
      return;
    }
    const next = Math.min(...watched.map(({ item }) => this.pullRequestDue.get(item.id) ?? 0));
    this.watchTimer = setTimeout(() => {
      this.watchTimer = undefined;
      // Nobody is told what the watch reads while no client is connected.
      if (this.clients.size === 0 || this.closed) return;
      const waits = this.turnWaits.splice(0);
      const due = this.watched().filter(({ item }) => (this.pullRequestDue.get(item.id) ?? 0) <= Date.now());
      const turn = Promise.all(due.map((held) => this.readPullRequest(held))).then((changed) => {
        if (changed.includes(true)) this.broadcastInbox();
      });
      this.watching = turn.finally(() => {
        this.watching = undefined;
        for (const end of waits) end();
        this.scheduleWatch();
      });
    }, Math.max(0, next - Date.now()));
  }

  /** The work items whose pull request the watch reads: each that is not archived, whose stored pull request is open, and whose chain does not run, since its pull request stage stores a newer one. */
  private watched(): Held[] {
    return this.store.workItems().filter(({ item }) => item.archivedAt === null && item.pullRequest?.state === "open" && !this.chains.has(item.id));
  }

  /**
   * Reads a work item's open pull request again from GitHub, with one call
   * of the person's `gh` (`github.ts#viewPullRequest`), and stores what it
   * gives with the commit the stage pushed. The next read is due after
   * `prPollMs` while the checks are pending or GitHub's head is not the
   * pushed commit, and after `prRestPollMs` otherwise. Where the call fails
   * or its answer does not read, the stored pull request keeps what the
   * last read gave, its `failure` holds the sentence that says why, and the
   * next read is due after `prRestPollMs`. Where `readOutside` made every
   * pull request due while `gh` was asked, the next read stays due now. A
   * work item that left the watch while `gh` was asked, or whose pull
   * request the stage replaced, keeps what it holds. It answers whether the
   * stored pull request changed in more than the time of its read.
   */
  private async readPullRequest({ item }: Held): Promise<boolean> {
    const before = item.pullRequest;
    if (before === null) return false;
    const asks = this.pullRequestAsks;
    const now = this.options.now ?? Date.now;
    let read: PullRequest;
    let wait: number;
    try {
      const viewed = await viewPullRequest(this.githubCli(await this.commandEnvironment(), item.worktree, "read"), before.url);
      read = { ...before, ...viewed, readAt: now(), failure: null };
      wait = read.checks === "pending" || read.head !== read.pushed ? (this.options.prPollMs ?? PR_POLL_MS) : (this.options.prRestPollMs ?? PR_REST_POLL_MS);
    } catch (error) {
      read = { ...before, failure: (error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "") };
      wait = this.options.prRestPollMs ?? PR_REST_POLL_MS;
    }
    if (this.closed || !this.watched().some((held) => held.item.id === item.id && held.item.pullRequest === before)) return false;
    // A hello or a `readLists` that came while gh was asked made the pull request due after this read began, so it stays due.
    if (asks === this.pullRequestAsks) this.pullRequestDue.set(item.id, Date.now() + wait);
    this.store.setWorkItem(item.id, { pullRequest: read });
    return JSON.stringify({ ...read, readAt: 0 }) !== JSON.stringify({ ...before, readAt: 0 });
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
   * from its worktree its record of decisions and questions and what its
   * records say of its chain, and from each
   * repository's working tree what it holds of the records place, then
   * which words of the person's each record owes (`readOwedAt`), and tells
   * every client where a count changed, a branch's head moved, a record
   * reads otherwise, a repository's records place is another or what a
   * work item's owed words wait for changed. An archived
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
    const owing = await Promise.all(open.map((held) => this.readOwedAt(held)));
    if (moved.includes(true) || placed.includes(true) || owing.includes(true)) this.broadcastInbox();
  }

  /**
   * Reads one work item's new commits from git, and answers whether a count
   * changed or its branch's head moved. How far a branch is ahead of its
   * base branch and behind it is counted at every read, since the base moves
   * by itself, and a base that moved while the head stayed is a change. The
   * commits, the changed files and the seal the head holds
   * (`seal-state.ts#workItemSeal`) are read only where the head is another
   * commit than the one they were last read at, and so once for each branch
   * after the daemon starts. The seal is kept in memory alone, and the copy a
   * look keeps of the lists is never read for it: a daemon that starts reads
   * it again from git. A work item with no branch yet is read at the commit
   * its worktree's `HEAD` stands at, as its branch's head would be, and its
   * head holds no seal, since no routing names its directory. Where that
   * `HEAD` names a branch or holds a commit made in the worktree, the work
   * item is then given its branch (`branchUp`).
   */
  private async readBranch({ repository, item }: Held): Promise<boolean> {
    // A work item from before the base commit was recorded has nothing to count from.
    const { baseCommit, branch } = item;
    if (baseCommit === null) return false;
    let changed = false;
    const repo = repository.folder;
    // A work item with no branch yet is read at its worktree's `HEAD`, which is where its work is.
    const [count, head] = branch === null ? await headCounts(repo, item.worktree, baseCommit) : await Promise.all([newCommits(repo, branch, baseCommit), branchHead(repo, branch)]);
    // A rename takes the old name away before the store holds the new one, and a read in between finds no branch. It is dropped, and the next read is of the new name.
    if (this.renaming.has(item.id) || item.branch !== branch) return false;
    // A `HEAD` at the base commit can still name a branch the worktree took up, so `headStands` is asked there too.
    if (branch === null && head !== null && (await headStands(item.worktree, baseCommit)) !== null) this.branchUp(item.id);
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
    const [commits, changes, seal] = await Promise.all([branchCommits(repo, baseCommit, head), branchChanges(repo, baseCommit, head), this.sealAt(item, head)]);
    this.branches.set(item.id, { head, commits, changes, seal });
    return true;
  }

  /**
   * Gives a work item with no branch yet the branch its worktree holds for
   * one (`worktrees.ts#headStands`), on `this.changing`, behind the
   * creations, the renames of a branch and the deletes, so a rename and a
   * read never both make one: the branch the worktree's `HEAD` names, taken
   * up as one Owlery did not make, and otherwise a branch Owlery makes at the
   * commit made there (`worktrees.ts#makeBranch`), named from the work item's
   * title as `worktrees.ts#branchName` names it, with the worktree then on
   * it. What the worktree holds is read again in that turn, and nothing is
   * done where the daemon has closed, or the work item is gone, is archived,
   * since git is read for no archived work item, or has a branch by then, as
   * a rename that waited ahead of the turn gives it.
   * Where git refuses, for a rebase under way or any other reason, nothing
   * is stored, the log says why, and the next read tries again. Every client
   * is told of the branch.
   */
  private branchUp(workItemId: number): void {
    const up = async (): Promise<void> => {
      try {
        const held = this.store.workItem(workItemId);
        if (this.closed || !held || held.item.archivedAt !== null || held.item.branch !== null) return;
        const { worktree, title } = held.item;
        const stands = await headStands(worktree, held.item.baseCommit);
        if (stands === null) return;
        const taken = "branch" in stands;
        const branch = taken ? stands.branch : await branchName(held.repository.folder, title, worktree);
        if (!taken) await makeBranch(worktree, branch);
        if (this.store.setWorkItem(workItemId, { branch, ownsBranch: !taken })) this.broadcastInbox();
      } catch (error) {
        console.error(`the branch of work item ${String(workItemId)} was not made: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    this.changing = this.changing.then(up);
  }

  /** The seal a head of the work item's branch holds, its sentence cut at `STATE_TEXT_CHARS`, since a sentence that quotes a line the reader refuses can be long. Null where it holds none and where git could not say, which the log then says. */
  private async sealAt(item: Held["item"], head: string): Promise<Seal | null> {
    try {
      const seal = await workItemSeal(item, head);
      return seal?.why ? { ...seal, why: cutText(seal.why) } : seal;
    } catch (error) {
      console.error(`the seal of work item ${String(item.id)} was not read: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Reads the work item's branch now, after the read of every branch that is
   * under way, and tells every client where it moved: a chain that rested or
   * stopped has committed the records of its stages, and the seal they hold
   * is read without a wait of one interval. A read that began before the
   * chain's last commit ends first, so it does not put an earlier head's
   * reading back over this one.
   */
  private readBranchNow(workItemId: number): void {
    const under = this.readingCommits ?? Promise.resolve();
    void under.then(async () => {
      const held = this.store.workItem(workItemId);
      if (this.closed || !held || held.item.archivedAt !== null) return;
      if (await this.readBranch(held)) this.broadcastInbox();
    });
  }

  /**
   * Asks the adapter what a person should know of its agent, and tells every
   * client where the answer differs from the one the daemon holds. A client
   * that has not been sent its `ready` yet reads the answer there. Where the
   * adapter was asked again meanwhile, this answer is dropped: the later
   * ask's is the newer reading. The notice waits on the adapter's lookup,
   * which finds System default's folder, so where that changed where
   * System default keeps its conversations, every client is sent the
   * accounts again.
   */
  private async readAgentNotice(): Promise<void> {
    const ask = ++this.noticeAsks;
    const before = this.conversationsOf(SYSTEM_DEFAULT_ID);
    const notice = await this.options.roleAdapter.notice();
    // A window told no place for System default before the lookup answered is told it now.
    if (this.conversationsOf(SYSTEM_DEFAULT_ID) !== before) this.broadcastAccounts();
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

/** What every client was last told of the agents: how many run, and the queue in its order. */
function agentsKey(running: number, queue: readonly number[]): string {
  return `${String(running)}|${queue.join(",")}`;
}
