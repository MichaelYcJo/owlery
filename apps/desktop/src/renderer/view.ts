// What the window says and sends, apart from the page that shows it, so the
// cases can read it without a browser. The kinds of pane, with their labels,
// are the daemon's list from `ready`: nothing here names one.
import { KEEP_AWAKE_CHOICES } from "../shared/keep-awake";
import type { DaemonEnd, InstalledApp } from "../shared/ipc";
import { type Account, accountFor, type AgentState, type AskedQuestion, BASE_FETCH_MS, type BaseFetch, type Chain, type ChainChoice, type ChainStage, type ChainStageKind, type Decision, type DecisionKind, type FileChange, type Group, type HeadlessInfo, type HeadlessState, type KeepAwake, type KeepAwakeChoice, type Look, losesWork, type PaneKind, type PaneKindInfo, type PermissionAsk, type PullRequest, type PullRequestCheck, type Question, type LedgerEntry, type Recorded, type RecordsPlace, type RecordsPlan, type Repository, type RepositoryChain, type Running, type Seal, type SealRecords, type SessionInfo, SYSTEM_DEFAULT_ID, type Unread, type WorkItem, type WorkItemLoss } from "../shared/protocol";
import { type Back, composeBack } from "../shared/seal-back";

/**
 * A tab's label among `tabs`, the open panes of its work item in the tabs'
 * order: "Setup" for `setupPane`, the pane the work item's setup record
 * names, and for any other pane its kind, as the daemon labels it, alone
 * where it is the one pane of its kind but the setup pane, and otherwise
 * followed by its place among those panes, from 1. The daemon's id of a pane
 * counts every pane it started, so it is no tab's to show. The work item's
 * title is the view's header's to say.
 */
export function tabLabel(session: SessionInfo, tabs: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], setupPane: number | null = null): string {
  if (session.id === setupPane) return SETUP_HEAD;
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  const name = kind ? kind.label : session.kind;
  const same = tabs.filter((tab) => tab.kind === session.kind && tab.id !== setupPane);
  return same.length > 1 ? `${name} ${same.findIndex((tab) => tab.id === session.id) + 1}` : name;
}

/** The label of the pane a setup runs in, and the head of the section that says the setup. */
export const SETUP_HEAD = "Setup";

/** The words a work item's line carries of its setup, in its second row: "Setting up" while it runs, "Setup failed" where it failed, and nothing where it succeeded or the repository named none. */
export function setupMark(workItem: WorkItem): string {
  const state = workItem.setup?.state;
  return state === "running" ? "Setting up" : state === "failed" ? "Setup failed" : "";
}

/** What the "Setup" section of the preview and a view says of a work item's setup. */
export interface SetupSection {
  /** How the command ended, or that it runs and for how long. */
  says: string;
  /** The command the setup's record holds, without the white space at its ends, which "Run setup again" carries, or nothing where it names none. */
  command: string;
  /** The paths copied from the main checkout, as the daemon listed them. */
  copied: string[];
  /** How many more paths were copied than are listed, as "and 5 more", or nothing. */
  more: string;
  /** The paths that were not copied, each with why. */
  failed: { path: string; why: string }[];
  /** Whether the view offers "Run setup again": while no setup pane's process is alive, which is while the setup does not run. */
  runAgain: boolean;
}

/**
 * The "Setup" section of a work item, or nothing where its repository named
 * no setup or a daemon of an earlier build sent none. Its sentence is the
 * daemon's own where the daemon said why the setup failed, and otherwise
 * says how long the command has run, that no command was named, or the code
 * the command ended with. It names the command the record holds, the one a
 * run again carries.
 */
export function setupSection(workItem: WorkItem, now: number): SetupSection | null {
  const setup = workItem.setup ?? null;
  if (setup === null) return null;
  const running = setup.state === "running";
  const ended = setup.command === null ? "No command runs: .worktreesetup names none." : setup.exitCode === null ? "The command ended." : `The command ended with code ${setup.exitCode}.`;
  const says = running ? `The command has run for ${ageOf(setup.startedAt, now)}.` : (setup.failure ?? ended);
  const more = setup.copiedCount - setup.copied.length;
  return { says, command: setup.command?.trim() ?? "", copied: [...setup.copied], more: more > 0 ? `and ${more} more` : "", failed: setup.failedCopies.map(({ path, why }) => ({ path, why })), runAgain: !running };
}

/** The tooltip of "Run setup again", which runs the command the section names and no other. */
export const RUN_SETUP_SAYS = "Copy what is missing from the main checkout and run the command this section names in a new pane. Where .worktreesetup holds another command now, none runs, and the section names the new one.";

/** The first kind of pane that reports its agent's state: the one the "New work item" form starts on. */
export function agentKind(paneKinds: readonly PaneKindInfo[]): PaneKind | undefined {
  return paneKinds.find((offered) => offered.reportsState)?.kind;
}

/** One choice of the pane bar of a work item's view: the button's text, its tooltip where it has one, and what its press starts. */
export interface PaneChoice {
  kind: PaneKind;
  text: string;
  hint: string | null;
  continueLatest: boolean;
}

/**
 * The choices of a work item's pane bar, in the daemon's order of kinds: each
 * kind's own, and after it, for a kind that declares `continues`, the choice
 * that starts a pane of it on the latest conversation of the worktree. A
 * daemon of an earlier build sends no `continues`, and its kinds get one
 * choice each.
 */
export function paneChoices(paneKinds: readonly PaneKindInfo[]): PaneChoice[] {
  return paneKinds.flatMap(({ kind, label, continues }) => {
    const own: PaneChoice = { kind, text: `+ ${label}`, hint: null, continueLatest: false };
    return continues === true ? [own, { kind, text: `+ ${label} (continue)`, hint: "Start on the latest conversation of this worktree", continueLatest: true }] : [own];
  });
}

/** The work item's panes whose process runs, the most recent first. */
function livePanes(workItem: WorkItem, sessions: readonly SessionInfo[]): SessionInfo[] {
  return sessions.filter((session) => session.workItemId === workItem.id && session.alive).sort((a, b) => b.id - a.id);
}

/** The pane a work item's line reads its state from where the work item is not parked: its most recent live pane of a kind that reports state, or nothing where it has none. */
export function lineSession(workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): SessionInfo | undefined {
  return livePanes(workItem, sessions).find((session) => paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState));
}

export interface InboxLine {
  title: string;
  branch: string;
  /** `waiting` for a work item parked with questions for the person, for one whose headless session waits for the person to allow a call, and for one whose chain stopped, whatever its panes say. `working` for one whose chain is running, where no pane of it waits for the person. Otherwise, where its pane neither works nor waits, the state its pull request or its seal gives (`branchLine`), and otherwise what the work item's agent is doing, or null where no live pane of it says. */
  state: AgentState | null;
  /** How many commits the branch gained, or empty where it gained none or none were read. */
  commits: string;
}

/** The questions of a work item's record, in the order of the file: the ones the daemon sends, or none for a daemon of an earlier build, which sends no such field. */
function questionsOf(workItem: WorkItem): readonly Question[] {
  return (workItem.questions as Question[] | undefined) ?? [];
}

/** The calls a work item's headless sessions wait for the person to allow or refuse, the oldest first: the ones the daemon sends, or none for a daemon of an earlier build, which sends no such field. */
function permissionsOf(workItem: WorkItem): readonly PermissionAsk[] {
  return (workItem.permissions as PermissionAsk[] | undefined) ?? [];
}

/** A work item's chain: the one the daemon sends, null where no chain ran for the work item, and undefined for a daemon of an earlier build, which sends no such field. */
function chainOf(workItem: WorkItem): Chain | null | undefined {
  return workItem.chain as Chain | null | undefined;
}

/**
 * The stage a work item's chain runs now: the newest of its stages, where
 * the chain is running and that stage works, and otherwise null. A chain
 * between two stages runs none, and neither does a chain a daemon that
 * started again reads as stopped, whose newest stage may still say that it
 * works.
 */
function runningStage(workItem: WorkItem): ChainStage | null {
  const chain = chainOf(workItem);
  const newest = chain?.stages.at(-1);
  return chain?.state === "running" && newest?.state === "working" ? newest : null;
}

/** A work item's pull request, as the daemon last read it: the one the daemon sends, or null for a daemon of an earlier build, which sends no such field. */
function pullRequestOf(workItem: WorkItem): PullRequest | null {
  return (workItem.pullRequest as PullRequest | null | undefined) ?? null;
}

/** Whether a work item's pull request merged, which takes its decisions off its line, the summary and the filter of the decisions, as an archive does. */
function mergedWorkItem(workItem: WorkItem): boolean {
  return pullRequestOf(workItem)?.state === "merged";
}

/**
 * The state and the words a pull request gives a line: a merged one and a
 * closed one finish, as "Merged" and "Closed"; an open one works while its
 * checks run, "Checks running", waits where one failed, "Check failed:"
 * with the first failed check's name, and finishes where they passed,
 * "Checks passed", or where it has none, "Pull request open".
 */
function pullRequestSays(pullRequest: PullRequest): { state: AgentState; text: string } {
  if (pullRequest.state !== "open") return { state: "finished", text: pullRequest.state === "merged" ? "Merged" : "Closed" };
  if (pullRequest.checks === "pending") return { state: "working", text: "Checks running" };
  if (pullRequest.checks === "failed") return { state: "waiting", text: `Check failed: ${pullRequest.list.find((check) => check.state === "failed")?.name ?? ""}` };
  return { state: "finished", text: pullRequest.checks === "passed" ? "Checks passed" : "Pull request open" };
}

/**
 * Whether something says more on a work item's line than its seal and its
 * pull request, `pane` being the state of the pane the line reads: the work
 * item is parked with questions, a headless session of it waits for the
 * person to allow a call, its chain runs or stopped, or its pane works or
 * waits. A finished pane and a chain that rests say no more.
 */
function saysMoreThanTheBranch(workItem: WorkItem, pane: AgentState | null): boolean {
  const chain = chainOf(workItem)?.state;
  return parkedWith(workItem) !== null || permissionsOf(workItem).length > 0 || chain === "running" || chain === "stopped" || pane === "working" || pane === "waiting";
}

/**
 * What a work item's pull request gives its line where nothing says more,
 * `pane` being the state of the pane the line reads: the state and the words
 * of `pullRequestSays`. Null where the work item has no pull request, where
 * something says more (`saysMoreThanTheBranch`), and where the seal the
 * branch's head holds is broken and the pull request did not merge: the
 * broken seal then gives the line (`sealLine`), and the check that fails is
 * most often the seal check on the commit that broke it.
 */
function pullRequestLine(workItem: WorkItem, pane: AgentState | null): { state: AgentState; text: string } | null {
  const pullRequest = pullRequestOf(workItem);
  if (pullRequest === null || saysMoreThanTheBranch(workItem, pane)) return null;
  if (pullRequest.state !== "merged" && workItem.seal?.state === "broken") return null;
  return pullRequestSays(pullRequest);
}

/**
 * What the seal the branch's head holds gives a work item's line where
 * nothing says more (`saysMoreThanTheBranch`): a broken seal waits, "Seal
 * broken", since the work item needs a new seal, and a seal that holds
 * finishes, "Sealed". Null for no seal, a seal the daemon has not read, and
 * a daemon of an earlier build, which sends none. It is read after the
 * pull request (`branchLine`).
 */
function sealLine(workItem: WorkItem, pane: AgentState | null): { state: AgentState; text: string } | null {
  const seal = workItem.seal;
  if (!seal || saysMoreThanTheBranch(workItem, pane)) return null;
  return seal.state === "broken" ? { state: "waiting", text: SEAL_BROKEN } : { state: "finished", text: SEALED_LINE };
}

/**
 * What the branch's head gives a work item's line where nothing says more,
 * and which of the two gives it: its pull request's state and words
 * (`pullRequestLine`), and otherwise its seal's (`sealLine`). So a merged
 * pull request says more than a broken seal, a broken seal more than an
 * open or closed pull request, and any pull request more than a seal that
 * holds.
 */
function branchLine(workItem: WorkItem, pane: AgentState | null): { says: "pull-request" | "seal"; state: AgentState; text: string } | null {
  const pulled = pullRequestLine(workItem, pane);
  if (pulled) return { says: "pull-request", ...pulled };
  const sealed = sealLine(workItem, pane);
  return sealed && { says: "seal", ...sealed };
}

/**
 * The questions a work item is parked with, while it is parked: the
 * questions of its record that have no answer, in the order of the file.
 * Null once the person answered every one, for a work item that never was
 * parked, and for a daemon of an earlier build, which sends no such field.
 */
export function parkedWith(workItem: WorkItem): Question[] | null {
  const open = questionsOf(workItem).filter((question) => question.answer === null);
  return open.length > 0 ? open : null;
}

/**
 * One line of the inbox: the work item, its state, and its new commits. A
 * work item parked with questions for the person waits, whatever its panes
 * say, and so does one whose headless session waits for the person to allow
 * a call, and one whose chain stopped, so each stands with the work items
 * that wait for the person. Otherwise the state is that of its most recent
 * live pane of a kind that reports state. An exited pane keeps its last
 * state and is passed over, because nothing will change that state again.
 * A work item whose chain is running is at work whatever that pane says,
 * but where the pane waits for the person: the pane of the session that
 * built the branch stays finished while the rounds run. Where none of
 * these says more and the pane neither works nor waits, the line takes the
 * state its pull request or its seal gives (`branchLine`): a broken seal
 * waits, as the work item needs a new seal.
 */
export function inboxLine(workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): InboxLine {
  const reporting = lineSession(workItem, sessions, paneKinds);
  const count = workItem.newCommits ?? 0;
  const chain = chainOf(workItem)?.state;
  const pane = reporting ? reporting.state : null;
  return {
    title: workItem.title,
    branch: workItem.branch,
    state: parkedWith(workItem) || permissionsOf(workItem).length > 0 || chain === "stopped" ? "waiting" : chain === "running" && pane !== "waiting" ? "working" : (branchLine(workItem, pane)?.state ?? pane),
    commits: count > 0 ? `${count} new ${count === 1 ? "commit" : "commits"}` : "",
  };
}

/**
 * Since when a line's state has lasted, which its age is counted from: for
 * a work item parked with questions, one whose headless session waits for
 * the person to allow a call, and one whose chain stopped, the earliest of
 * the times the daemon first read one of its open questions at, the times
 * its requests arrived at and the time the chain stopped at, all of them
 * the daemon's clock. Otherwise, where the work item's chain runs a stage
 * and the pane the line reads, `session`, does not wait for the person, the
 * time that stage started at. Otherwise the time of that pane's state. Null
 * where none gives one, for a work item whose chain is between two stages
 * and alone says that it works, and for one whose pull request or seal
 * gives the line its state (`branchLine`): its pane's time is that of
 * another state, the daemon reads no time at which the checks began to
 * run, failed or passed, and it stores no state of the seal, so nothing it
 * sends says when the seal was given or broke.
 */
export function lineSince(workItem: WorkItem, session: SessionInfo | undefined): number | null {
  const parked = parkedWith(workItem) ?? [];
  const asks = permissionsOf(workItem);
  const chain = chainOf(workItem);
  if (parked.length === 0 && asks.length === 0 && chain?.state !== "stopped") {
    if (branchLine(workItem, session?.state ?? null)) return null;
    if (chain?.state === "running" && session?.state !== "waiting") {
      const stage = runningStage(workItem);
      if (stage) return stage.startedAt;
      if (session?.state !== "working") return null;
    }
    return session?.stateSince ?? null;
  }
  const stopped = chain?.state === "stopped" ? chain.since : null;
  const times = [...parked.flatMap(({ since }) => (since === null ? [] : [since])), ...asks.map(({ at }) => at), ...(stopped === null ? [] : [stopped])];
  return times.length > 0 ? Math.min(...times) : null;
}

/** A work item as the lists and the sidebar show it: with its line, and the pane whose state the line reads where the work item is not parked. */
export interface Entry {
  workItem: WorkItem;
  line: InboxLine;
  session: SessionInfo | undefined;
}

/** Every work item with its line and that line's pane, in the order the daemon lists them. */
export function workItemEntries(workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): Entry[] {
  return workItems.map((workItem) => ({ workItem, line: inboxLine(workItem, sessions, paneKinds), session: lineSession(workItem, sessions, paneKinds) }));
}

/** The agent states in the order a person must act on them, which is the order of the inbox's sentence and of its groups. */
const STATES_BY_URGENCY: readonly AgentState[] = ["waiting", "working", "finished"];

/** The waiting state's own words, "Needs you", as they follow a count: one work item needs the person, and two need the person. */
function needsYou(count: number): string {
  return count === 1 ? "needs you" : "need you";
}

/** Each agent state as the inbox's sentence says it, after its count: the state's own words, which agree with the count where the state's words are a verb. */
const STATE_IN_SENTENCE: Record<AgentState, (count: number) => string> = { waiting: needsYou, working: () => "working", finished: () => "finished" };

/**
 * The inbox's sentence: how many work items are in each agent state, as in
 * "1 needs you, 2 working". A state no line is in is left out, and the
 * sentence is empty where no line has a state.
 */
export function inboxSummary(lines: readonly InboxLine[]): string {
  return STATES_BY_URGENCY.map((state) => ({ state, count: lines.filter((line) => line.state === state).length }))
    .filter(({ count }) => count > 0)
    .map(({ state, count }) => `${count} ${STATE_IN_SENTENCE[state](count)}`)
    .join(", ");
}

/** A line's state in words: the heading of its group in the inbox, which the preview and a view say as well, with the state's age. */
export function stateHeading(state: AgentState | null): string {
  if (state === null) return "Asleep";
  return { waiting: "Needs you", working: "Working", finished: "Finished" }[state];
}

export interface InboxGroup<Entry> {
  /** The state of every line of the group, or null for the lines with no state. */
  state: AgentState | null;
  heading: string;
  entries: Entry[];
}

/**
 * The inbox's lines in their groups: the states in the order a person must
 * act on them, then the lines with no state. A group no line is in is left
 * out, and inside a group the lines keep the order they were given in.
 */
export function inboxGroups<Entry extends { line: InboxLine }>(entries: readonly Entry[]): InboxGroup<Entry>[] {
  return [...STATES_BY_URGENCY, null]
    .map((state) => ({ state, heading: stateHeading(state), entries: entries.filter((entry) => entry.line.state === state) }))
    .filter((group) => group.entries.length > 0);
}

/**
 * The entries with the pinned work items before the others. The pinned keep
 * their order among themselves, and so do the others. A list puts it over
 * the entries of one of its parts: a repository's in the sidebar, a state's
 * group in the inbox, which `inboxGroups` cuts from entries in this order,
 * and the whole of the history.
 */
export function pinnedFirst<E extends { workItem: WorkItem }>(entries: readonly E[]): E[] {
  return [...entries.filter((entry) => entry.workItem.pinned), ...entries.filter((entry) => !entry.workItem.pinned)];
}

/** The marks a work item's line carries after its title, each with the words a pointer and a screen reader are told: one where it is pinned, and one where its notifications are muted. */
export function lineMarks(workItem: WorkItem): { mark: "pinned" | "muted"; words: string }[] {
  return [...(workItem.pinned ? [{ mark: "pinned" as const, words: "Pinned" }] : []), ...(workItem.muted ? [{ mark: "muted" as const, words: "Notifications muted" }] : [])];
}

/** The decisions made for a work item in place of asking, in the order they were recorded: the ones the daemon sends, or none for a daemon of an earlier build, which sends no such field. */
function decisionsOf(workItem: WorkItem): readonly Decision[] {
  return (workItem.decisions as Decision[] | undefined) ?? [];
}

/** A work item as the look holds it, or nothing where no look is recorded and where the look does not hold the work item. The look is what the person has seen. */
function lookedAt(workItem: WorkItem, look: Look | null): WorkItem | undefined {
  return look?.workItems.find((item) => item.id === workItem.id);
}

/**
 * The mark a work item's line carries for the decisions made for it in place
 * of asking: how many the person has not seen, and how many reversals wait
 * for a stage, as in "2 decisions without asking, 1 reversed". A decision
 * the person has not seen is one that stands as made, its state `decided`,
 * and that the look does not hold for the work item, told by its id; where
 * no look is recorded the person has seen none. A reversal waits while its
 * decision's state is `reversed`, whatever the look holds. A decision that
 * is `applied` or `carried` is in neither count. Nothing where both counts
 * are zero, and nothing for a work item whose pull request merged, whose
 * view still lists every decision. No decision changes the line's state or
 * its group.
 */
export function decisionMark(workItem: WorkItem, look: Look | null): string {
  if (mergedWorkItem(workItem)) return "";
  const before = lookedAt(workItem, look);
  const seen = new Set(before ? decisionsOf(before).map((decision) => decision.id) : []);
  const unseen = decisionsOf(workItem).filter((decision) => decision.state === "decided" && !seen.has(decision.id)).length;
  const reversed = decisionsOf(workItem).filter((decision) => decision.state === "reversed").length;
  return [unseen === 0 ? "" : `${unseen} ${unseen === 1 ? "decision" : "decisions"} without asking`, reversed === 0 ? "" : `${reversed} reversed`].filter((words) => words !== "").join(", ");
}

/** The head the preview and a work item's view list the decisions under. */
export const DECISIONS_HEAD = "Decided without asking";

/** Each kind of decision as its line says it. */
const DECISION_KIND: Record<DecisionKind, string> = { route: "Route", default: "Default taken", scope: "Scope chosen", answered: "Answered from the tree" };

export interface DecisionLine {
  id: number;
  /** The decision's kind in words. */
  kind: string;
  /** What was decided. */
  says: string;
  /** Why, after "Grounds: ". */
  grounds: string;
  /** Who decided, after "Decided by ", or empty where the record does not say. */
  by: string;
  /** How long the decision has been in its state, in the words of an age: since the daemon first read it as made, or as reversed, applied or carried. Empty where the daemon sent no time. */
  age: string;
  /** For a decision that no longer stands as made: that a person reversed it, that a commit took the reversal in or that it was carried to another home, and the message the person gave. Null while it stands. A work item's view offers "Reverse" on a line that stands. */
  reversed: { head: string; message: string } | null;
}

/** The lines of the decisions made for a work item in place of asking, every one of them, whatever its state, the last of the record first. */
export function decisionLines(workItem: WorkItem, now: number): DecisionLine[] {
  return [...decisionsOf(workItem)].reverse().map(({ id, kind, says, grounds, by, state, reversal, landed, since }) => ({
    id,
    kind: DECISION_KIND[kind] ?? kind,
    says,
    grounds: `Grounds: ${grounds}`,
    by: by ? `Decided by ${by}` : "",
    age: since === null ? "" : ageOf(since, now),
    reversed: state === "decided" ? null : { head: state === "applied" ? `Applied in ${landed ?? ""}` : state === "carried" ? `Carried to ${landed ?? ""}` : "Reversed", message: reversal ?? "" },
  }));
}

/**
 * What the preview and a work item's view say, under the list of the
 * decisions, of each block and line of the work item's record that the
 * daemon's reader did not read: its line in `decisions.md` and the reader's
 * reason, in the order the daemon sends them. Nothing was decided on such a
 * line, and no decision and no question was read from it. None for a daemon
 * of an earlier build, which sends no such field.
 */
export function unreadLines(workItem: WorkItem): string[] {
  return ((workItem.unread as Unread[] | undefined) ?? []).map(({ line, why }) => `Line ${line} of decisions.md was not read: ${why}`);
}

/** The heading of the approval line's section in the preview and in a view's right column. */
export const APPROVAL_HEAD = "Approval line";

/** The four roles of the approval line, in its order. */
const ROLES = ["framer", "crafter", "proofer", "sealer"] as const;
export type Role = (typeof ROLES)[number];

/** Each role as a person reads its name: with one capital. */
const ROLE_NAME: Record<Role, string> = { framer: "Framer", crafter: "Crafter", proofer: "Proofer", sealer: "Sealer" };

/** One place of the approval line: a role, how far it came, and its words. */
export interface ApprovalPlace {
  role: Role;
  /** The role's name, with one capital. */
  name: string;
  /** The class of the marks that gives the place its shape and its colour: `no-agent` for a place not started. */
  state: "waiting" | "working" | "finished" | "failed" | "no-agent";
  /** Two words at most, under the name. */
  note: string;
  /** What the mark says after the role's name and a colon, before an age. */
  label: string;
  /** The time the mark's age counts from, or null where its words carry no age. */
  since: number | null;
  /** The line of text this place puts under the places, the role's name, a colon and the text, or null where it has none. Plain text, never markup. */
  under: string | null;
}

/** The words of the broad gate where the window names it: on the gate's line under "Ask", on the approval line, and on a line of the inbox while the gate runs. */
export const GATE_HEAD = "Broad gate";

/**
 * Each kind of stage a chain runs: the stage in short, as a line of the
 * inbox names it while it runs, who runs it and what it is, and the place
 * it marks on the approval line, with the note under the role's name and
 * the mark's words while it works. The orchestrator's two kinds belong to
 * none of the four roles and mark no place, and neither does the pull
 * request stage, which the daemon runs after the seal. The broad gate is no role's
 * session, so its words name no role, and it marks the sealer's place,
 * since the seal rests on it. `failed` is what the place says where the
 * stage failed, for a kind whose failure is no failure of its role: a
 * broad gate that failed leaves the sealer's place waiting for the person.
 * Every other kind's place then reads "Failed", with the failed mark. It
 * holds one row for each of `CHAIN_STAGE_KINDS`, so a kind added to the
 * protocol without its row here does not compile.
 */
const STAGES: Record<ChainStageKind, { short: (round: number) => string; marks: { role: Role; note: (round: number) => string; label: (round: number) => string; failed?: Pick<ApprovalPlace, "state" | "note" | "label"> } | null }> = {
  round: { short: (round) => `Proofer, round ${round}`, marks: { role: "proofer", note: (round) => `Round ${round}`, label: (round) => `Round ${round}` } },
  "fix-pass": { short: () => "Crafter, fix pass", marks: { role: "crafter", note: () => "Fix pass", label: (round) => `Fix pass on round ${round}` } },
  judgment: { short: () => "Orchestrator, judgment", marks: null },
  ruling: { short: () => "Orchestrator, ruling", marks: null },
  gate: { short: () => GATE_HEAD, marks: { role: "sealer", note: () => GATE_HEAD, label: () => GATE_HEAD, failed: { state: "waiting", note: "Gate failed", label: "Gate failed" } } },
  seal: { short: () => "Sealer, verdict", marks: { role: "sealer", note: () => "Judging", label: () => "Judging" } },
  "pull-request": { short: () => "Pull request", marks: null },
};

/** A commit as a place's words show it: its first seven characters. */
function shortCommit(commit: string): string {
  return commit.slice(0, 7);
}

/** What a broken seal is called, in two words: on the sealer's place, in a notification, in a line's second row and at the head of the seal's place. */
const SEAL_BROKEN = "Seal broken";

/** What a seal that holds says in the second row of a line that holds no pull request. */
const SEALED_LINE = "Sealed";

/**
 * The seal's place for a work item's seal, which the daemon read from the
 * branch's head commit: the state its drawing takes, `none`, `sealed` or
 * `broken`, the words it says to a pointer and to a screen reader, which
 * the preview and the head of the view's foot also show beside it, and
 * `why`, the seal's sentence that the line under that head says where the
 * seal is broken, and empty otherwise. No seal, a seal the daemon has not
 * read and a daemon of an earlier build, which sends none, all say "No
 * seal yet". A sealed commit is shown in short.
 */
export function sealShown(seal: Seal | null | undefined): { state: "none" | Seal["state"]; words: string; why: string } {
  if (!seal) return { state: "none", words: "No seal yet", why: "" };
  const commit = shortCommit(seal.commit);
  return seal.state === "broken" ? { state: seal.state, words: `${SEAL_BROKEN}, sealed at ${commit}`, why: seal.why ?? "" } : { state: seal.state, words: `Sealed at ${commit}`, why: "" };
}

/** The label of the back's tab, which stands before the panes' tabs of a work item's view. */
export const BACK_TAB = "Back of the seal";

/** What the back's place says until the records and the ledger have both answered. */
export const BACK_READING = "Reading the records.";

/**
 * Whether the strip of a work item's view holds the back's tab: where the
 * work item's seal is a seal, sealed or broken, where its records count a
 * round, or where the daemon sent its chain. A null seal and one the daemon
 * sent none of, as before it read the branch, hold no seal alike.
 */
export function hasBack(workItem: WorkItem): boolean {
  return Boolean(workItem.seal) || (workItem.recorded?.rounds ?? 0) > 0 || workItem.chain !== null;
}

/**
 * Whether a work item's view, entered now, opens to the back: where it is
 * entered with no pane and the work item's seal, in the lists the window
 * holds at the call, is a seal, sealed or broken. A view entered with a
 * pane, as from a session's notification, opens to that pane. The tab in
 * front is decided here and by a person's press, and by no later list.
 */
export function opensToBack(workItem: WorkItem | undefined, pane: number | undefined): boolean {
  return pane === undefined && Boolean(workItem?.seal);
}

/**
 * What the back was asked at: the work item's seal, its records' counts and
 * its chain, as one key. The window asks again where a later list gives
 * another key, and a seal the daemon sent none of differs from a null one,
 * which says the daemon read the branch and found no seal.
 */
export function backKey(workItem: WorkItem): string {
  return JSON.stringify({ seal: workItem.seal === undefined ? "not read" : workItem.seal, recorded: workItem.recorded ?? null, chain: workItem.chain });
}

/**
 * The parts of a text of the back, in order: the words between two
 * backticks are code, which the window draws in the fixed-width face. A
 * backtick with no partner after it stands as written.
 */
export function codeParts(text: string): { text: string; code: boolean }[] {
  const parts: { text: string; code: boolean }[] = [];
  let rest = text;
  for (;;) {
    const open = rest.indexOf("`");
    const close = open === -1 ? -1 : rest.indexOf("`", open + 1);
    if (close === -1) break;
    if (open > 0) parts.push({ text: rest.slice(0, open), code: false });
    parts.push({ text: rest.slice(open + 1, close), code: true });
    rest = rest.slice(close + 1);
  }
  if (rest !== "") parts.push({ text: rest, code: false });
  return parts;
}

/**
 * What the back's place shows: the back composed from the records and the
 * ledger once both have answered (../shared/seal-back, `composeBack`), the
 * daemon's refusal where either was refused, and `BACK_READING` until then.
 */
export function backShown(answers: { records: SealRecords | null; ledger: { entries: readonly LedgerEntry[]; unread: number } | null; refusal: string | null }): Back | string {
  if (answers.refusal !== null) return answers.refusal;
  if (answers.records === null || answers.ledger === null) return BACK_READING;
  return composeBack(answers.records, answers.ledger.entries, answers.ledger.unread);
}

/** A count with its noun, one or many. */
function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * A failed stage's failure as the window says it under the places. The
 * daemon writes it as a clause with no capital and no full stop, which its
 * own sentence of the chain wraps, and a CLI's own error can be any text.
 * The first word gains a capital where it is letters alone, with or without
 * marks that end it before a space or the text's end, so a path, a file's
 * name, an address and a number stand as written, and the text gains a full
 * stop where it ends with none.
 */
function asSentence(failure: string): string {
  const text = failure.trim();
  if (text === "") return text;
  const opened = /^\p{Ll}\p{L}*[,:;.!?]*(?=\s|$)/u.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  return /[.?!]$/u.test(opened) ? opened : `${opened}.`;
}

/** A place's state and words, before its name and its line of text are added. */
type Reached = Pick<ApprovalPlace, "state" | "note" | "label" | "since"> & { text: string | null };

const NOT_STARTED: Reached = { state: "no-agent", note: "Not started", label: "Not started", since: null, text: null };

/** How far a role came by what the work item's records say, for the crafter by the branch's commits, and for the sealer by the seal the branch's head holds before the verdict the worktree holds. */
function byRecords(role: Role, workItem: WorkItem, recorded: Recorded): Reached {
  switch (role) {
    case "framer":
      return recorded.framed ? { state: "finished", note: "Framed", label: "Framed", since: null, text: null } : NOT_STARTED;
    case "crafter": {
      const commits = workItem.newCommits ?? 0;
      if (commits < 1) return NOT_STARTED;
      const note = counted(commits, "commit", "commits");
      return { state: "finished", note, label: note, since: null, text: null };
    }
    case "proofer": {
      if (recorded.rounds < 1) return NOT_STARTED;
      const note = counted(recorded.rounds, "round", "rounds");
      return { state: "finished", note, label: note, since: null, text: null };
    }
    case "sealer": {
      // Whether a seal holds is the seal the branch's head holds, and a verdict that seals in the worktree alone is no verdict.
      const seal = workItem.seal ?? null;
      if (seal !== null) return { ...(seal.state === "broken" ? { state: "waiting", note: SEAL_BROKEN } : { state: "finished", note: "Sealed" }), label: sealShown(seal).words, since: null, text: seal.why };
      const verdict = recorded.verdict;
      if (verdict === null || verdict.is === "sealed") return recorded.gate === null ? NOT_STARTED : { state: "no-agent", note: "Gate passed", label: `Gate passed at ${shortCommit(recorded.gate)}`, since: null, text: null };
      const { state, note } = ({ withheld: { state: "failed", note: "Withheld" }, undecided: { state: "waiting", note: "Undecided" } } as const)[verdict.is];
      return { state, note, label: `${note} at ${shortCommit(verdict.commit)}`, since: null, text: verdict.says };
    }
  }
}

/**
 * How far a role came by the newest stage of the work item's chain, or null
 * where that stage says nothing of the role: it is of another role's kind
 * or of the orchestrator's, it finished, or no chain ran. The role's place
 * failed where the stage failed, with the stage's failure as a sentence for
 * its text, and works where the chain runs the stage, with the stage's
 * start as the time its age counts from. A broad gate that failed is no
 * failure of the sealer: its place then waits, and reads "Gate failed".
 */
function byChain(role: Role, workItem: WorkItem): Reached | null {
  const newest = chainOf(workItem)?.stages.at(-1);
  const marks = newest === undefined ? null : STAGES[newest.kind].marks;
  if (newest === undefined || marks === null || marks.role !== role) return null;
  if (newest.state === "failed") return { ...(marks.failed ?? { state: "failed", note: "Failed", label: `${marks.label(newest.round)} failed` }), since: null, text: newest.failure === null ? null : asSentence(newest.failure) };
  if (runningStage(workItem) === newest) return { state: "working", note: marks.note(newest.round), label: marks.label(newest.round), since: newest.startedAt, text: null };
  return null;
}

/**
 * The four places of a work item's approval line, framer, crafter, proofer
 * and sealer in that order, or null for a work item that carries no
 * `recorded`: one a daemon of an earlier build sent, or one of the look. A
 * place's state is the first of these that holds. It waits where an open
 * question of the work item names its role, exactly, as the asker, with
 * that question's text under the line. It works where the work item's chain
 * runs a stage of its role, and it failed where the chain's newest stage is
 * of its role and failed, with the stage's failure under the line. The
 * broad gate and the seal are the sealer's place's: it works while either
 * runs, and waits, with "Gate failed", where the newest stage is a broad
 * gate that failed. Otherwise the records say how far it came, and for the
 * sealer the seal the branch's head holds: finished where it holds, and
 * waiting, with "Seal broken" and the seal's sentence under the line, where
 * a later commit broke it. It reads the work item alone, so no pane's
 * state, no hook and no session changes it.
 */
export function approvalPlaces(workItem: WorkItem): ApprovalPlace[] | null {
  const recorded = workItem.recorded;
  if (recorded === undefined) return null;
  const open = parkedWith(workItem) ?? [];
  return ROLES.map((role) => {
    const asked = open.find(({ by }) => by === role);
    const reached: Reached = asked ? { state: "waiting", note: "Needs you", label: "Needs you", since: asked.since, text: asked.asks } : (byChain(role, workItem) ?? byRecords(role, workItem, recorded));
    const name = ROLE_NAME[role];
    const { text, ...shown } = reached;
    return { role, name, ...shown, under: text === null ? null : `${name}: ${text}` };
  });
}

/** What a place's mark says to a pointer and to a screen reader: the role's name, a colon, and its words, with the age where it has one, as in "Proofer: Needs you, 12 min". */
export function placeWords(place: ApprovalPlace, now: number): string {
  const age = ageOf(place.since, now);
  return `${place.name}: ${place.label}${age ? `, ${age}` : ""}`;
}

export interface QuestionLine {
  /** The question's id, which its answer names it by. */
  id: number;
  asks: string;
  /** While the work item is parked, who asks, after "Asked by ", or empty where the record does not say. Empty once the questions are answered. */
  by: string;
  /** While the work item is parked, why the question is the person's, after "Grounds: ". Empty once the questions are answered. */
  grounds: string;
  /** While the work item is parked, the answers the asker names, each with what it implies and, for the question's default, the mark "Default". None once the questions are answered. */
  options: { label: string; implies: string; mark: string }[];
  /** The option chosen as the section is drawn: the question's default, or null where it has none and once the questions are answered. */
  chosen: number | null;
  /** The person's answer, or null while the question is open. */
  answer: string | null;
}

export interface AskedSection {
  /** "Waiting for your answer" while the work item is parked, and "Answered" afterwards. */
  head: string;
  /** For how long the questions have waited, as in "Asked 12 min ago", or have been answered, as in "Answered 3 min ago". Empty where the daemon sent no time. */
  age: string;
  /** Whether the section takes answers. */
  parked: boolean;
  /** What tells one drawing of the section from the next: it differs between two work items, two sets of questions of one, and a park and its answer. A view draws the section again only where it differs, so a field the person types in is not drawn over. */
  key: string;
  questions: QuestionLine[];
}

/**
 * The section of a work item's view that holds the questions it is parked
 * with and takes the person's answers, or after the answer lists each
 * question with its answer. While a question of the record is open, the
 * section holds the open questions and no other, whatever the look holds.
 * After the answer it holds each answered question until the look holds
 * that question as answered for the work item: `look` is the look the
 * window holds, and while it holds none every answered question is listed.
 * Null once the look holds each as answered, for a work item whose record
 * holds no question, and for a daemon of an earlier build, which sends
 * none.
 */
export function askedSection(workItem: WorkItem, now: number, look: Look | null): AskedSection | null {
  const open = parkedWith(workItem);
  const before = lookedAt(workItem, look);
  const seen = new Set(before ? questionsOf(before).flatMap(({ id, answer }) => (answer === null ? [] : [id])) : []);
  const shown = open ?? questionsOf(workItem).filter(({ id }) => !seen.has(id));
  if (shown.length === 0) return null;
  const parked = open !== null;
  const times = shown.flatMap(({ since }) => (since === null ? [] : [since]));
  // The questions have waited since the first of them was read, and have all been answered since the last of them was.
  const age = times.length === 0 ? "" : `${parked ? "Asked" : "Answered"} ${ageOf(parked ? Math.min(...times) : Math.max(...times), now)} ago`;
  return {
    head: parked ? "Waiting for your answer" : "Answered",
    age,
    parked,
    key: `${workItem.id}:${parked ? "open" : "answered"}:${shown.map(({ id }) => id).join(",")}`,
    questions: shown.map(({ id, asks, grounds, by, options, default: taken, answer }) => {
      // A default that names no option of its question chooses none.
      const fallback = options.findIndex(({ label }) => label === taken);
      return {
        id,
        asks,
        by: parked && by ? `Asked by ${by}` : "",
        grounds: parked ? `Grounds: ${grounds}` : "",
        options: parked ? options.map(({ label, implies }) => ({ label, implies, mark: label === taken ? "Default" : "" })) : [],
        chosen: parked && fallback >= 0 ? fallback : null,
        answer,
      };
    }),
  };
}

/**
 * The answers an `answerQuestions` carries, one for each question of the
 * section: for the question at each place, `choices` holds the index of the
 * option the person chose, "other" where they chose to give another answer,
 * or null where they chose nothing, and `typed` the words in its field for
 * another answer. An option gives its label, "other" the words as typed,
 * and nothing chosen, or a choice that names no option, an empty answer,
 * which the daemon refuses with the question's number.
 */
export function answersFor(questions: readonly Pick<QuestionLine, "id" | "options">[], choices: readonly (number | "other" | null)[], typed: readonly string[]): { questionId: number; answer: string }[] {
  return questions.map(({ id, options }, place) => {
    const choice = choices[place] ?? null;
    return { questionId: id, answer: choice === "other" ? (typed[place] ?? "") : choice === null ? "" : (options[choice]?.label ?? "") };
  });
}

/**
 * The notifications for the work items that were parked since the window's
 * lists were `before`: one for each of `workItems` that is parked now and
 * that `before`, the work items and the archived ones the window held, did
 * not hold as parked. It is titled with the work item's title. None is
 * given for a work item whose notifications are muted, nor for `inFront`,
 * the work item whose view is in front of a focused window. An archived
 * work item is not among `workItems`, so none is given for one.
 */
export function parkNotifications(before: readonly WorkItem[], workItems: readonly WorkItem[], inFront: number | undefined): { workItemId: number; title: string; body: string }[] {
  const held = new Set(before.filter((workItem) => parkedWith(workItem)).map((workItem) => workItem.id));
  return workItems.filter((workItem) => parkedWith(workItem) && !held.has(workItem.id) && !workItem.muted && workItem.id !== inFront).map((workItem) => ({ workItemId: workItem.id, title: workItem.title, body: "Waiting for your answer" }));
}

/**
 * The notifications for the calls headless sessions began to wait on since
 * the window's lists were `before`: one for each request of `workItems`
 * whose id none of `before`, the work items and the archived ones the
 * window held, held. It is titled with the work item's title and says what
 * a waiting pane's notification says. None is given for a work item whose
 * notifications are muted, nor for `inFront`, the work item whose view is
 * in front of a focused window. An archived work item is not among
 * `workItems`, so none is given for one.
 */
export function permissionNotifications(before: readonly WorkItem[], workItems: readonly WorkItem[], inFront: number | undefined): { workItemId: number; title: string; body: string }[] {
  const held = new Set(before.flatMap((workItem) => permissionsOf(workItem).map(({ id }) => id)));
  return workItems
    .filter((workItem) => !workItem.muted && workItem.id !== inFront)
    .flatMap((workItem) => permissionsOf(workItem).flatMap(({ id }) => (held.has(id) ? [] : [{ workItemId: workItem.id, title: workItem.title, body: stateHeading("waiting") }])));
}

/**
 * The notifications for the chains that stopped since the window's lists
 * were `before`: one for each of `workItems` whose chain is stopped now and
 * that `before`, the work items and the archived ones the window held, did
 * not hold with a stopped chain. It is titled with the work item's title
 * and says what a waiting pane's notification says. None is given for a
 * work item whose notifications are muted, nor for `inFront`, the work item
 * whose view is in front of a focused window. An archived work item is not
 * among `workItems`, so none is given for one.
 */
export function chainNotifications(before: readonly WorkItem[], workItems: readonly WorkItem[], inFront: number | undefined): { workItemId: number; title: string; body: string }[] {
  const held = new Set(before.filter((workItem) => chainOf(workItem)?.state === "stopped").map((workItem) => workItem.id));
  return workItems
    .filter((workItem) => chainOf(workItem)?.state === "stopped" && !held.has(workItem.id) && !workItem.muted && workItem.id !== inFront)
    .map((workItem) => ({ workItemId: workItem.id, title: workItem.title, body: stateHeading("waiting") }));
}

/**
 * The notifications for the seals that broke since the window's lists were
 * `before`: one for each of `workItems` whose seal is broken now and that
 * `before`, the work items and the archived ones the window held, held with
 * a seal that holds. It is titled with the work item's title and says "Seal
 * broken". A seal the window first holds broken, as at its start, raises
 * none, since nothing the window held says when it broke. None is given for
 * a work item whose notifications are muted, nor for `inFront`, the work
 * item whose view is in front of a focused window.
 */
export function sealNotifications(before: readonly WorkItem[], workItems: readonly WorkItem[], inFront: number | undefined): { workItemId: number; title: string; body: string }[] {
  const held = new Set(before.filter((workItem) => workItem.seal?.state === "sealed").map((workItem) => workItem.id));
  return workItems
    .filter((workItem) => workItem.seal?.state === "broken" && held.has(workItem.id) && !workItem.muted && workItem.id !== inFront)
    .map((workItem) => ({ workItemId: workItem.id, title: workItem.title, body: SEAL_BROKEN }));
}

/**
 * The notifications for the work items whose pull request made their lines
 * begin to wait or finish since the window's lists were `before`: one for
 * each of `workItems` whose line takes its state from its pull request
 * (`pullRequestLine`, with the pane of `sessions` the line reads), where
 * that state is waiting or finished and is not the state the work item's
 * pull request gave in `before`, the work items and the archived ones the
 * window held. A pull request that opens is one that finishes. It is titled
 * with the work item's title and says what a pane's notification says.
 * None is given while the seal the branch's head holds is broken, since the
 * seal gives the line then and raised its own notification when it broke
 * (`sealNotifications`). None is given for a work item whose notifications are muted, nor for
 * `inFront`, the work item whose view is in front of a focused window. An
 * archived work item is not among `workItems`, so none is given for one.
 */
export function pullRequestNotifications(before: readonly WorkItem[], workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], inFront: number | undefined): { workItemId: number; title: string; body: string }[] {
  return workItems
    .filter((workItem) => !workItem.muted && workItem.id !== inFront)
    .flatMap((workItem) => {
      const line = pullRequestLine(workItem, lineSession(workItem, sessions, paneKinds)?.state ?? null);
      if (line === null || line.state === "working") return [];
      const earlier = before.find((item) => item.id === workItem.id);
      const was = earlier ? pullRequestOf(earlier) : null;
      return was !== null && pullRequestSays(was).state === line.state ? [] : [{ workItemId: workItem.id, title: workItem.title, body: stateHeading(line.state) }];
    });
}

/** The name of a work item's repository: the one the daemon sends, or the last part of the repository's folder for a daemon of an earlier build, which sends none. */
export function repoNameOf(workItem: WorkItem): string {
  return (workItem.repoName as string | undefined) ?? workItem.repo.split("/").filter(Boolean).at(-1) ?? workItem.repo;
}

/**
 * What the status line says of the daemon in place of its state: that the
 * daemon is of another build than the one the app would start, with the
 * menu's entry that replaces it, or nothing. `otherBuild` is the main
 * process's answer (src/shared/ipc.ts, `DaemonConnection`), the sentence's
 * one source.
 */
export function daemonNotice(otherBuild: boolean): string {
  return otherBuild ? `Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.` : "";
}

/**
 * What the status line says in place of the daemon's state, or nothing: the
 * window's own notice first, then what there is to say of the daemon
 * (`daemonNotice`), then what the daemon's adapter said of its agent, such as
 * that the installed one is older than the oldest version checked. `agent`
 * is null where the adapter said nothing.
 */
export function statusNotice(own: string, daemon: string, agent: string | null): string {
  return own || daemon || agent || "";
}

/**
 * The repositories and the archived work items of a `ready` or an `inbox`.
 * A daemon of a build before the repositories sends neither list and
 * answers none of the messages that came with them: the window then holds
 * no repository. Such a daemon wrote no build into its `daemon.json`
 * either, so the main process answers that it is of another build, and
 * `daemonNotice` gives the sentence for it.
 */
export function daemonLists(message: { repositories?: Repository[]; archived?: WorkItem[] }): { repositories: Repository[]; archived: WorkItem[] } {
  if (message.repositories === undefined) return { repositories: [], archived: [] };
  return { repositories: message.repositories, archived: message.archived ?? [] };
}

export interface SidebarRepository {
  id: number;
  /** The repository's folder, which tells two repositories of one name apart. */
  repo: string;
  name: string;
  /** The one character the sidebar shows before the name, or null where a person set none. */
  icon: string | null;
  /** How many work items are listed under it, in its groups and out of them: those the search and the filter leave. */
  count: number;
  /** Its work items that stand in no group of its own, each with the places of its title that match what is typed. */
  entries: (Entry & { marks: [number, number][] })[];
  /** Its groups, in the order they were made, each with the work items that stand in it. */
  groups: { id: number; name: string; entries: SidebarRepository["entries"] }[];
}

/**
 * The sidebar's repositories: each repository the daemon keeps that is not
 * hidden, in the daemon's order, with the work items that name it by its id
 * and that the search and the filter leave. Its ungrouped work items come
 * first, and then each of its groups with its own, in the order the groups
 * were made, a group with no work item among them. In each of those lists
 * the pinned ones stand first, and each part is in the order given. A work
 * item whose group its repository does not hold is among the ungrouped. A
 * repository with no work item is listed. While a search is typed or a
 * state is chosen, a repository none of whose work items is left is not,
 * and neither is a group none of whose work items is left. The window makes
 * up no repository: a work item whose repository the daemon did not send is
 * under none.
 */
export function sidebarTree(repositories: readonly Repository[], workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], query = "", state: StateFilter = "all"): SidebarRepository[] {
  const left = matchWorkItems(workItemEntries(workItems, sessions, paneKinds), query, state);
  const narrowing = query !== "" || state !== "all";
  return repositories
    .filter((repository) => !repository.hidden)
    .map((repository) => {
      const own = left.filter((entry) => entry.workItem.repoId === repository.id);
      const listed = (entries: typeof own) => pinnedFirst(entries).map((entry) => ({ ...entry, marks: markRanges(entry.line.title, query) }));
      const groups = repository.groups.map(({ id, name }) => ({ id, name, entries: listed(own.filter((entry) => entry.workItem.groupId === id)) })).filter((group) => !narrowing || group.entries.length > 0);
      const entries = listed(own.filter((entry) => !repository.groups.some((group) => group.id === entry.workItem.groupId)));
      return { id: repository.id, repo: repository.folder, name: repository.name, icon: repository.icon, count: own.length, entries, groups };
    })
    .filter((repository) => !narrowing || repository.count > 0);
}

/** The repositories the sidebar does not list, in the daemon's order, and what the button under the sidebar's repositories says of them: how many they are, or nothing where none is hidden. */
export function hiddenRepositories(repositories: readonly Repository[]): { says: string; hidden: Repository[] } {
  const hidden = repositories.filter((repository) => repository.hidden);
  return { says: hidden.length === 0 ? "" : hidden.length === 1 ? "1 hidden repository" : `${hidden.length} hidden repositories`, hidden };
}

/** What a repository's removal takes off Owlery's lists and ends, as its dialog names it: the work items, each by its title, and the running sessions, each by a line of words and, in `running`, by its id. */
export interface Removal {
  workItems: { id: number; title: string; archived: boolean }[];
  sessions: string[];
  running: Running;
}

/**
 * What removing a repository takes with it: every work item the repository
 * holds, the archived after the others, and every running session of one of
 * them. A pane runs while its process is alive, and is named by its tab's
 * label and its work item. A headless session runs while it is working, and
 * is named by its prompt. `running` is what the removal sends the daemon, so
 * the daemon ends the sessions the person was told of and no other.
 */
export function removalOf(repository: Repository, workItems: readonly WorkItem[], archived: readonly WorkItem[], sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): Removal {
  const held = [...workItems, ...archived].filter((workItem) => workItem.repoId === repository.id);
  const running = held.map((workItem) => ({ workItem, ...runningIn(workItem, sessions, headless, paneKinds) }));
  const panes = running.flatMap(({ workItem, panes }) => panes.map(({ id, label }) => ({ id, says: `${label} in ${workItem.title}` })));
  const asked = running.flatMap(({ workItem, asked }) => asked.map(({ id, prompt }) => ({ id, says: `Asked in ${workItem.title}: ${prompt}` })));
  return {
    workItems: held.map((workItem) => ({ id: workItem.id, title: workItem.title, archived: workItem.archivedAt !== null })),
    sessions: [...panes, ...asked].map(({ says }) => says),
    running: { panes: panes.map(({ id }) => id), headless: asked.map(({ id }) => id) },
  };
}

/** The running sessions of one work item: its panes whose process is alive, each with its tab's label, and its headless sessions that are working, each with its prompt. */
function runningIn(workItem: WorkItem, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): { panes: { id: number; label: string }[]; asked: { id: number; prompt: string }[] } {
  const tabs = paneTabs(workItem, sessions);
  return {
    panes: tabs.filter((tab) => tab.alive).map((tab) => ({ id: tab.id, label: tabLabel(tab, tabs, paneKinds, workItem.setup?.paneId ?? null) })),
    asked: headless.filter((session) => session.workItemId === workItem.id && session.state === "working").map(({ id, prompt }) => ({ id, prompt })),
  };
}

/**
 * What archiving a work item ends: each of its running sessions, as the
 * dialog before the archive names it, a pane by its tab's label and a
 * headless session by its prompt. `running` is what the archive sends the
 * daemon, so the daemon ends the sessions the person was told of and no
 * other. Where it names none, the archive asks nothing first.
 */
export function archivalOf(workItem: WorkItem, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): { sessions: string[]; running: Running } {
  const { panes, asked } = runningIn(workItem, sessions, headless, paneKinds);
  return {
    sessions: [...panes.map(({ label }) => label), ...asked.map(({ prompt }) => `Asked: ${prompt}`)],
    running: { panes: panes.map(({ id }) => id), headless: asked.map(({ id }) => id) },
  };
}

/** The words of the dialog that asks before the daemon ends, for a restart or for a complete quit: its head, what ends and what stays, and the button that ends it. */
export function daemonEnding(chosen: DaemonEnd): { head: string; says: string; button: string } {
  if (chosen === "restart") {
    return {
      head: "Restart the daemon",
      says: "A restart ends every running session and starts Owlery's background process again, from this build. The panes' tabs and the answers to what was asked go with the old process. Work items, their folders and their branches stay as they are.",
      button: "Restart",
    };
  }
  return {
    head: "Quit Owlery completely",
    says: "This ends every running session, stops Owlery's background process and quits Owlery. The panes' tabs and the answers to what was asked go with the process. Work items, their folders and their branches stay as they are.",
    button: "Quit",
  };
}

/**
 * Every running session the window holds, as the dialog that asks before
 * the daemon ends names it: each live pane, then each working headless
 * session. A session of a work item the window lists, archived or not,
 * reads as a repository's removal names it (`removalOf`). A live pane of no
 * listed work item reads as its kind's label alone, after the others, and a
 * working headless session of none by its prompt alone. The daemon's end
 * carries no list: it ends what runs at that moment.
 */
export function runningSessions(workItems: readonly WorkItem[], archived: readonly WorkItem[], sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], paneKinds: readonly PaneKindInfo[]): string[] {
  const listed = [...workItems, ...archived];
  const running = listed.map((workItem) => ({ workItem, ...runningIn(workItem, sessions, headless, paneKinds) }));
  const known = new Set(listed.map((workItem) => workItem.id));
  return [
    ...running.flatMap(({ workItem, panes }) => panes.map(({ label }) => `${label} in ${workItem.title}`)),
    ...sessions.filter((session) => session.alive && (session.workItemId === null || !known.has(session.workItemId))).map((session) => tabLabel(session, [session], paneKinds)),
    ...running.flatMap(({ workItem, asked }) => asked.map(({ prompt }) => `Asked in ${workItem.title}: ${prompt}`)),
    ...headless.filter((session) => session.state === "working" && !known.has(session.workItemId)).map(({ prompt }) => `Asked: ${prompt}`),
  ];
}

/** One kind of thing a loss names, as a dialog draws it: its heading, a line for each entry the loss carries, and how many more there are where the list is cut, or nothing. */
export interface LossSection {
  caption: string;
  lines: string[];
  more: string;
}

/**
 * What a dialog names of a loss, a section for each kind the loss holds
 * something of, in this order: the branch and the folder a delete removes;
 * the commits nothing else holds, each by its hash and its subject; the
 * tracked files with a change that is not committed; the untracked files;
 * and the ignored files and folders, which a removal of the folder takes
 * with it.
 */
export function lossSections(loss: WorkItemLoss): LossSection[] {
  const section = (caption: string, lines: string[], count: number): LossSection[] => (lines.length === 0 ? [] : [{ caption, lines, more: count > lines.length ? `and ${count - lines.length} more` : "" }]);
  const removed = [...(loss.branch === null ? [] : [`The branch ${loss.branch}`]), ...(loss.worktree === null ? [] : [`The folder ${loss.worktree}`])];
  return [
    ...section("Removed from disk", removed, removed.length),
    ...section("Commits no other branch, no remote and no tag holds", loss.commits.map(({ hash, subject }) => `${hash} ${subject}`), loss.commitCount),
    ...section("Files with changes that are not committed", loss.uncommitted, loss.uncommittedCount),
    ...section("Untracked files", loss.untracked, loss.untrackedCount),
    ...section("Ignored files and folders, which go with the folder", loss.ignored, loss.ignoredCount),
  ];
}

/** What the delete dialog says before its lists, of the loss the daemon answered with, or of none while the answer is awaited: why the delete cannot run, that work would be lost, that the folder stays where git reads nothing in the repository's folder, or what the delete removes. */
export function deleteSays(loss: WorkItemLoss | null): string {
  if (loss === null) return "Reading what a delete would remove.";
  if (loss.blocked !== null) return loss.blocked;
  if (loss.unreachable) return "Git reads nothing in the repository's folder. A delete takes the work item off Owlery's lists, and its folder stays on disk.";
  if (losesWork(loss)) return "A delete would lose the work named below. It runs only with Force delete checked.";
  return "A delete removes the work item's worktree and its local branch, and takes the work item off Owlery's lists.";
}

/**
 * The delete dialog's two controls, for the loss the daemon answered with,
 * or for none while the answer is awaited, and for whether "Force delete"
 * is checked. The checkbox is shown where the delete would lose work. The
 * "Delete" button is off until the loss has arrived, while the delete is
 * blocked, and while work would be lost and the checkbox is not checked.
 */
export function deleteChoice(loss: WorkItemLoss | null, force: boolean): { forceShown: boolean; enabled: boolean } {
  if (loss === null) return { forceShown: false, enabled: false };
  const loses = losesWork(loss);
  return { forceShown: loses, enabled: loss.blocked === null && (!loses || force) };
}

/**
 * The controls of a repository's removal dialog and what it says, for how
 * many work items the repository holds, for its two choices, "Also delete
 * the work items' worktrees and local branches" and "Also move the
 * repository's folder to the Trash", for the loss of each work item as far
 * as the daemon has answered, and for whether "Force delete" is checked.
 *
 * The first choice is shown where the repository holds a work item. The
 * Trash's choice can be taken where it holds none or the first is taken: a
 * linked worktree of a repository that moved to the Trash no longer works.
 * Where the work items are deleted, "Force delete" is shown where one of
 * them would lose work, and "Remove" is off until every loss has arrived,
 * while one is blocked, and while one would lose work and the checkbox is
 * not checked.
 */
export function removalChoice(workItems: number, deletes: boolean, trash: boolean, losses: readonly (WorkItemLoss | undefined)[], force: boolean): { deleteShown: boolean; trashEnabled: boolean; forceShown: boolean; enabled: boolean; says: string } {
  const trashEnabled = workItems === 0 || deletes;
  const trashes = trash && trashEnabled;
  const loses = deletes && losses.some((loss) => loss !== undefined && losesWork(loss));
  const lists = workItems === 0 ? "Owlery will no longer list the repository." : "Owlery will no longer list the repository or its work items.";
  const says = deletes
    ? trashes
      ? `${lists} Each work item's worktree and local branch are deleted, as named below, and the repository's folder then moves to the Trash, whole. Nothing on a remote is removed.`
      : `${lists} Each work item's worktree and local branch are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.`
    : trashes
      ? `${lists} Its folder moves to the Trash, whole, and nothing in it is erased.`
      : "Owlery will no longer list the repository or its work items. Nothing on disk is removed: the repository's folder, each worktree's folder and each branch stay where they are.";
  return {
    deleteShown: workItems > 0,
    trashEnabled,
    forceShown: loses,
    enabled: !deletes || (losses.every((loss) => loss !== undefined && loss.blocked === null) && (!loses || force)),
    says,
  };
}

/** What a removal that deletes its work items sends beside what it names: the stamp of each work item's loss as the dialog showed it, by the work item's id, and whether the person checked "Force delete". */
export function deletionOf(workItemIds: readonly number[], losses: ReadonlyMap<number, WorkItemLoss>, force: boolean): { stamps: Record<number, string>; force: boolean } {
  const stamps: Record<number, string> = {};
  for (const id of workItemIds) {
    const loss = losses.get(id);
    if (loss !== undefined) stamps[id] = loss.stamp;
  }
  return { stamps, force };
}

/** A repository's archived work items as its archived screen lists them: the one archived last first, and two archived at one time in the order given. */
export function archivedIn(repositoryId: number, archived: readonly WorkItem[]): WorkItem[] {
  return archived.filter((workItem) => workItem.repoId === repositoryId).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
}

/** The head of the screen that lists a repository's archived work items. */
export function archivedHead(repositoryName: string): string {
  return `Archived in ${repositoryName}`;
}

/**
 * The history screen's lines: the work items whose agent finished, the
 * pinned ones first, and among the pinned and among the others the one that
 * finished last first. Two that finished at one time keep the order given,
 * and one whose time the daemon did not send stands last.
 */
export function historyLines<E extends { workItem: WorkItem; line: InboxLine; session: SessionInfo | undefined }>(entries: readonly E[]): E[] {
  const since = (entry: E) => entry.session?.stateSince ?? Number.NEGATIVE_INFINITY;
  return pinnedFirst(entries.filter((entry) => entry.line.state === "finished").sort((a, b) => (since(a) === since(b) ? 0 : since(b) > since(a) ? 1 : -1)));
}

/**
 * The places in `text` where what is typed stands, in any case of letters:
 * each a start and an end, in order, and none over another. Nothing where
 * nothing is typed.
 */
export function markRanges(text: string, query: string): [number, number][] {
  const ranges: [number, number][] = [];
  if (query === "") return ranges;
  const typed = query.toLowerCase();
  for (let at = 0; at + query.length <= text.length; ) {
    if (text.slice(at, at + query.length).toLowerCase() === typed) {
      ranges.push([at, at + query.length]);
      at += query.length;
    } else {
      at += 1;
    }
  }
  return ranges;
}

/** What the filter shows: every state, one agent state, the work items with no state, or the work items with a decision made without asking that the person may still act on. */
export type StateFilter = "all" | AgentState | "none" | "decided";

/** The filter's choices: "All", the heading of each of the inbox's groups, in their order, and last the head the decisions are listed under. */
export function filterChoices(): { value: StateFilter; label: string }[] {
  return [{ value: "all", label: "All" }, ...[...STATES_BY_URGENCY, null].map((state) => ({ value: state ?? ("none" as const), label: stateHeading(state) })), { value: "decided", label: DECISIONS_HEAD }];
}

/**
 * The work items a search and a filter leave, in the order given: those
 * whose title, branch or repository's name holds what is typed, and whose
 * line is in the state chosen. Where the decisions are chosen, the filter
 * leaves the work items that hold a decision whose state is `decided` or
 * `reversed`, whatever their lines' states: one the person may reverse, or
 * a reversal no stage has taken in. A work item whose pull request merged
 * is not among them.
 */
export function matchWorkItems<E extends { workItem: WorkItem; line: InboxLine }>(entries: readonly E[], query: string, state: StateFilter): E[] {
  return entries.filter(({ workItem, line }) => {
    if (state === "decided") {
      if (mergedWorkItem(workItem) || !decisionsOf(workItem).some((decision) => decision.state === "decided" || decision.state === "reversed")) return false;
    } else if (state !== "all" && (line.state ?? "none") !== state) return false;
    return query === "" || [workItem.title, workItem.branch, repoNameOf(workItem)].some((text) => markRanges(text, query).length > 0);
  });
}

/** How many work items a search leaves, of how many, as the search field says it. */
export function matchCount(matched: number, total: number): string {
  return `${matched} of ${total}`;
}

/** The same in words, as the head of a list says it. */
export function matchSentence(matched: number, total: number, query: string): string {
  return `${matchCount(matched, total)} ${total === 1 ? "work item matches" : "work items match"} "${query}" in title, branch or repository`;
}

/**
 * What a list says in place of its lines, `total` being the screen's work
 * items and `shown` the ones a search and a filter leave: nothing where it
 * has a line.
 */
export function emptyList(screen: "inbox" | "history" | "archived", total: number, shown: number): string {
  if (shown > 0) return "";
  if (total > 0) return "No work item matches.";
  return { inbox: "No work items yet.", history: "Nothing has finished yet.", archived: "No work item of this repository is archived." }[screen];
}

/** What changed of a work item's seal since the look: a seal was given, or a seal broke. */
export type SealSince = "given" | "broke";

export interface Change {
  workItem: WorkItem;
  /** The work item's line as the lists now give it. */
  line: InboxLine;
  /** The pane whose state that line reads where the work item is not parked. The age the summary's line says is counted as `lineSince` gives it. */
  session: SessionInfo | undefined;
  /** What changed, opening with the seal where it was given or broke since the look, and with the present state otherwise. */
  sentence: string;
  /** How many decisions made without asking the work item holds that the look does not hold for it. */
  decided: number;
  /** Whether its seal was given or broke since the look (`sealSinceLook`), or null where neither. */
  sealSince: SealSince | null;
}

/** Each agent state as a change's sentence opens with it. */
const STATE_IN_CHANGE: Record<AgentState, string> = { waiting: "Needs you.", working: "Is working.", finished: "Finished." };

/** How many decisions were made without asking, as a change's sentence and the summary's sentence end with it. */
function madeWithoutAsking(decided: number): string {
  return `${decided} ${decided === 1 ? "decision" : "decisions"} made without asking.`;
}

/**
 * What changed of a work item's seal between the look, `before` being the
 * look's copy of the work item or undefined where the look does not hold it,
 * and the present work item. A seal was given where the present seal holds
 * and the look did not hold the work item `sealed` at the same commit, and
 * it broke where the present seal is broken and the look did not hold the
 * work item `broken` at the same commit. A work item the look does not hold
 * counts its seal as since the look. Null where neither: where the present
 * work item has no seal, where either side carries no `seal`, which says
 * the daemon had read no branch for it, as just after it started, or that a
 * build before the look kept the seal wrote the look, and where the seal
 * broke on a work item whose pull request merged, since the merged pull
 * request says more than a broken seal on the line (`branchLine`).
 */
export function sealSinceLook(before: WorkItem | undefined, workItem: WorkItem): SealSince | null {
  const seal = workItem.seal;
  if (!seal || (before && before.seal === undefined)) return null;
  const then = before?.seal ?? null;
  if (then !== null && then.state === seal.state && then.commit === seal.commit) return null;
  if (seal.state === "broken" && mergedWorkItem(workItem)) return null;
  return seal.state === "sealed" ? "given" : "broke";
}

/**
 * The words a change's sentence opens with where its seal was given or
 * broke: the sealed commit in short and how many review rounds the work
 * item's directory holds, the count left out where the daemon sent none or
 * it is 0, or "Seal broken." and the seal's own sentence as the daemon sent
 * it.
 */
function sealSaid(workItem: WorkItem, since: SealSince): string {
  const seal = workItem.seal as Seal;
  if (since === "broke") return seal.why ? `${SEAL_BROKEN}. ${seal.why}` : `${SEAL_BROKEN}.`;
  const rounds = workItem.recorded?.rounds ?? 0;
  return rounds > 0 ? `Sealed at ${shortCommit(seal.commit)} after ${counted(rounds, "review round", "review rounds")}.` : `Sealed at ${shortCommit(seal.commit)}.`;
}

/**
 * One work item's change against the look, worked out whether or not
 * anything differs, and whether anything does: its line differs in the state
 * or in the count of new commits from its line in the look, it holds a
 * decision made without asking that the look does not hold for it, its seal
 * was given or broke since the look (`sealSinceLook`), or the look does not
 * hold it. A park and its answer both change the line's state. A decision
 * is told from the look's by its id, so one the look holds adds nothing,
 * reversed since or not, and a look written before the decisions holds none.
 * A change's sentence opens with the seal where it was given or broke, and
 * with the present state otherwise, and ends with how many such decisions
 * the work item holds; a work item whose pull request merged holds none.
 * A count the daemon gave on one side alone says nothing of a change. Each
 * side is read through `inboxLine` with its own sessions, and no session of
 * one is matched to a session of the other: a session's id starts again with
 * the daemon, and a work item's id does not. Where one side carries no
 * `seal`, as a look written by a build before the look kept the seal
 * reading, or a work item the daemon has read no branch for since it
 * started, that side is read with the other side's seal where the two
 * states are compared; the change's line is the present one as it stands.
 * A side that keeps a seal reading, a null among them, is read with its own.
 */
function changeOf(look: Look, workItem: WorkItem, sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): { change: Change; differs: boolean } {
  const line = inboxLine(workItem, sessions, paneKinds);
  const before = look.workItems.find((item) => item.id === workItem.id);
  const sealSince = sealSinceLook(before, workItem);
  const said = [sealSince ? sealSaid(workItem, sealSince) : line.state === null ? "No agent is running." : STATE_IN_CHANGE[line.state]];
  const looked = new Set(before ? decisionsOf(before).map((decision) => decision.id) : []);
  // A merge takes the work item's decisions off the summary, as an archive does.
  const decided = mergedWorkItem(workItem) ? 0 : decisionsOf(workItem).filter((decision) => !looked.has(decision.id)).length;
  let differs = true;
  if (!before) {
    said.push("New since you were last here.");
  } else {
    const rise = before.newCommits === null || workItem.newCommits === null ? 0 : workItem.newCommits - before.newCommits;
    const held = before.seal === undefined ? { ...before, seal: workItem.seal } : before;
    const present = workItem.seal === undefined ? { ...workItem, seal: before.seal } : workItem;
    differs = sealSince !== null || rise !== 0 || decided !== 0 || inboxLine(held, look.sessions, paneKinds).state !== inboxLine(present, sessions, paneKinds).state;
    if (rise > 0) said.push(`${rise} new ${rise === 1 ? "commit" : "commits"} since you were last here.`);
  }
  if (decided > 0) said.push(madeWithoutAsking(decided));
  return { change: { workItem, line, session: lineSession(workItem, sessions, paneKinds), sentence: said.join(" "), decided, sealSince }, differs };
}

/**
 * Changes in the order the summary lists them: the work items whose seal was
 * given since the look, then the ones whose seal broke, each in the order
 * given, which is the daemon's, then the others in the order of the inbox's
 * groups.
 */
function summaryOrder(changes: readonly Change[]): Change[] {
  return [...changes.filter((change) => change.sealSince === "given"), ...changes.filter((change) => change.sealSince === "broke"), ...inboxGroups(changes.filter((change) => change.sealSince === null)).flatMap((group) => group.entries)];
}

/**
 * The work items that changed since the person last looked (`changeOf`), in
 * the order the summary lists them (`summaryOrder`).
 */
export function changesSince(look: Look, workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): Change[] {
  return summaryOrder(workItems.map((workItem) => changeOf(look, workItem, sessions, paneKinds)).filter(({ differs }) => differs).map(({ change }) => change));
}

/**
 * The changes of the work items whose ids `ids` names, worked out against
 * the look from the present lists, in the order the summary lists them. A
 * work item of the set whose line nothing differs from the look any more is
 * kept, and its sentence says its state alone; one the lists no longer hold,
 * as after an archive, has no change, and a work item the set does not name
 * has none either.
 */
export function changesOf(look: Look, ids: readonly number[], workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): Change[] {
  return summaryOrder(workItems.filter((workItem) => ids.includes(workItem.id)).map((workItem) => changeOf(look, workItem, sessions, paneKinds).change));
}

/**
 * The work items the summary lists, worked out at a load: `ids`, the work
 * items that changed since the look, and `unread`, the ones the load's lists
 * carried without a seal reading, which may still join (`changedSetAfter`).
 */
export interface ChangedSet {
  ids: number[];
  unread: number[];
}

/** The changed set of a load, from the look and the lists the load carried. */
export function changedSet(look: Look, workItems: readonly WorkItem[], sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[]): ChangedSet {
  return { ids: changesSince(look, workItems, sessions, paneKinds).map((change) => change.workItem.id), unread: workItems.filter((workItem) => workItem.seal === undefined).map((workItem) => workItem.id) };
}

/**
 * The changed set after new lists: each work item the load carried without a
 * seal reading and these lists carry with one leaves `unread`, and joins
 * `ids` where its seal was given or broke since the look (`sealSinceLook`).
 * So a seal the daemon read after the load joins once, and no other change
 * after the load joins. A work item these lists do not hold, or carry still
 * without a reading, stays in `unread`.
 */
export function changedSetAfter(look: Look, set: ChangedSet, workItems: readonly WorkItem[]): ChangedSet {
  const read = workItems.filter((workItem) => set.unread.includes(workItem.id) && workItem.seal !== undefined);
  const joins = read.filter((workItem) => !set.ids.includes(workItem.id) && sealSinceLook(look.workItems.find((item) => item.id === workItem.id), workItem) !== null);
  return { ids: [...set.ids, ...joins.map((workItem) => workItem.id)], unread: set.unread.filter((id) => !read.some((workItem) => workItem.id === id)) };
}

/** The seals counted in the summary's sentence, before the states: "2 sealed", "1 seal broken". */
function sealsCounted(changes: readonly { sealSince: SealSince | null }[]): string[] {
  const given = changes.filter((change) => change.sealSince === "given").length;
  const broke = changes.filter((change) => change.sealSince === "broke").length;
  return [...(given > 0 ? [`${given} sealed`] : []), ...(broke > 0 ? [`${counted(broke, "seal", "seals")} broken`] : [])];
}

/**
 * The summary screen's sentence: the changed work items whose seal was given
 * since the look counted as sealed and the ones whose seal broke as broken
 * seals, then the others by their present state, as the inbox's sentence
 * counts every work item, so each is counted once; or how many changed where
 * none of them has a seal so counted or a state. The decisions made without
 * asking since the look are counted apart: where the changed work items hold
 * any, their sum follows after a full stop.
 */
export function summarySentence(changes: readonly { line: InboxLine; decided: number; sealSince: SealSince | null }[]): string {
  const parts = [...sealsCounted(changes), inboxSummary(changes.filter((change) => change.sealSince === null).map((change) => change.line))].filter((part) => part !== "");
  const said = parts.join(", ") || `${changes.length} work ${changes.length === 1 ? "item" : "items"} changed`;
  const decided = changes.reduce((sum, change) => sum + change.decided, 0);
  return decided > 0 ? `${said}. ${madeWithoutAsking(decided)}` : said;
}

/**
 * What stands in the place of the summary's sentence: the sentence where a
 * work item changed, and otherwise why the screen holds no line.
 */
export function summaryHead(hasLook: boolean, changes: readonly { line: InboxLine; decided: number; sealSince: SealSince | null }[]): string {
  if (!hasLook) return "No earlier look is recorded.";
  return changes.length > 0 ? summarySentence(changes) : "Nothing changed since you were last here.";
}

/** What the sidebar's bell says to a pointer and to a screen reader: how many work items need the person, in the waiting state's own words, and that a press shows them alone. */
export function bellSays(waiting: number): string {
  return waiting > 0 ? `${waiting} ${needsYou(waiting)}. Show them alone.` : "Show the work items that need you alone.";
}

/** How many work items changed, as the sidebar says it beside "Summary": nothing where none did. */
export function summaryCount(changed: number): string {
  return changed > 0 ? `${changed} new` : "";
}

export interface SummaryControls {
  /** The control Enter presses: it opens the view of a work item, or the inbox. */
  main: { label: string; opens: number | "inbox" };
  second: { label: string; opens: "inbox" } | null;
  hint: string;
}

/** Whether a line that waits waits on the person's answer: an open question, a call to allow, or a pane that waits, `session` being the pane the line reads. */
function waitsOnAnAnswer(workItem: WorkItem, session: SessionInfo | undefined): boolean {
  return parkedWith(workItem) !== null || permissionsOf(workItem).length > 0 || session?.state === "waiting";
}

/**
 * The summary screen's controls. Where a changed work item waits, the main
 * one opens a line and the inbox stands beside it: the first line, in the
 * order given, whose work item waits on an open question, a call to allow
 * or a pane that waits, as "Answer the first question", and where none
 * does, the first that waits for another reason, as a broken seal, a stopped
 * chain or a failed check, as "Open the first that needs you". The hint
 * names the line Enter opens, which may stand after a line that waits for
 * another reason. Otherwise the inbox is the main control and the only one.
 */
export function summaryControls(changes: readonly { workItem: WorkItem; line: InboxLine; session: SessionInfo | undefined }[]): SummaryControls {
  const inbox = { label: "Open the inbox", opens: "inbox" as const };
  const waiting = changes.filter((change) => change.line.state === "waiting");
  const answers = waiting.find((change) => waitsOnAnAnswer(change.workItem, change.session));
  const waits = answers ?? waiting[0];
  if (!waits) return { main: inbox, second: null, hint: "Enter opens it." };
  return answers
    ? { main: { label: "Answer the first question", opens: waits.workItem.id }, second: inbox, hint: "Enter opens the first question." }
    : { main: { label: "Open the first that needs you", opens: waits.workItem.id }, second: inbox, hint: "Enter opens the first that needs you." };
}

/** The status line where the window has nothing else to say: that the daemon runs, how many agents do, an agent being a live pane of a kind that reports its state, and that the daemon keeps the Mac awake where `keepsAwake` says its hold stands. */
export function daemonStatus(sessions: readonly SessionInfo[], paneKinds: readonly PaneKindInfo[], keepsAwake: boolean): string {
  const agents = sessions.filter((session) => session.alive && paneKinds.some((offered) => offered.kind === session.kind && offered.reportsState)).length;
  return `Daemon running, ${agents === 0 ? "no agent" : agents === 1 ? "1 agent" : `${agents} agents`}${keepsAwake ? ", keeping the Mac awake" : ""}`;
}

/**
 * What the control that chooses when the Mac is kept awake shows: the
 * daemon's choice, and the words that name it to a pointer. Nothing against
 * a daemon that sent no `keepAwake`, one of an earlier build or one that can
 * hold nothing, and the control is then hidden.
 */
export function keepAwakeControl(keepAwake: KeepAwake | null): { choice: KeepAwakeChoice; title: string } | null {
  if (!keepAwake) return null;
  return { choice: keepAwake.choice, title: `Keep awake: ${KEEP_AWAKE_CHOICES.find(({ value }) => value === keepAwake.choice)?.label ?? keepAwake.choice}` };
}

/** What the status line tells once `taken` is taken back: nothing where it still told `taken`, and any other notice as it stands. */
export function noticeWithout(notice: string, taken: string): string {
  return notice === taken ? "" : notice;
}

/**
 * How long ago a time is, `at` and `now` being times in milliseconds: in
 * minutes under an hour, in hours and minutes under a day, and in days from
 * then on. Nothing where there is no time, as for a pane with no state and
 * for a daemon of an earlier build, which sends none.
 */
export function ageOf(at: number | null | undefined, now: number): string {
  if (at == null) return "";
  const minutes = Math.floor((now - at) / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "less than a minute";
  if (hours < 1) return `${minutes} min`;
  if (days < 1) return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** When the person was last here, in the words of an age. */
export function lastHere(at: number, now: number): string {
  return `You were last here ${ageOf(at, now)} ago.`;
}

/** A state in its heading's words and how long it has lasted, as in "Needs you, 12 min": the state alone where it has no time. */
export function stateWithAge(state: AgentState | null, since: number | null | undefined, now: number): string {
  const age = ageOf(since, now);
  return age ? `${stateHeading(state)}, ${age}` : stateHeading(state);
}

/** What an agent that waits for the person to allow a call of a tool asks, in the window's words: "Asks to use Bash". */
function asksToUse(tool: string): string {
  return `Asks to use ${tool}`;
}

/** What a pane's state carried, as a person reads it: its text, or for a pane that waits with a tool's name and no text, which tool it asks for. */
function saidBy(session: SessionInfo | undefined): string | null {
  if (!session || session.state === null) return null;
  if (session.stateText) return session.stateText;
  return session.state === "waiting" && session.stateTool ? asksToUse(session.stateTool) : null;
}

/** The questions a pane's agent asks the person, as the event that began its state carried them: none where that event asked none, and against a daemon of a build before them, which sends no such field. */
function askedBy(session: SessionInfo | undefined): AskedQuestion[] {
  return session?.stateQuestions ?? [];
}

/** How many more questions there are than the one a line says, as in " (and 2 more questions)", or nothing where there are none. */
function moreQuestions(more: number): string {
  return more > 0 ? ` (and ${more} more ${more === 1 ? "question" : "questions"})` : "";
}

/**
 * What the agent of a work item's line says, under its head: the label of
 * the pane's kind and "asks" while the agent waits, "said" otherwise.
 * `waiting` says that the agent waits for the person, which the card of its
 * words shows by its edge. `questions` are the questions the agent asks the
 * person in its pane, each with its choices, which the card lists in place
 * of the text, and none where it asks none. Nothing where the state carried
 * neither a text nor, for a pane that waits, a tool's name.
 */
export function stateSays(session: SessionInfo | undefined, paneKinds: readonly PaneKindInfo[]): { head: string; text: string; waiting: boolean; questions: AskedQuestion[] } | null {
  const text = saidBy(session);
  if (!session || text === null) return null;
  const kind = paneKinds.find((offered) => offered.kind === session.kind);
  const waiting = session.state === "waiting";
  return { head: `${kind ? kind.label : session.kind} ${waiting ? "asks" : "said"}`, text, waiting, questions: askedBy(session) };
}

/** What the card says under a question an agent asks that takes more than one choice, and nothing under one that takes one. */
export function choiceNote(question: AskedQuestion): string {
  return question.multiple ? "More than one may be chosen." : "";
}

/**
 * The text of a line's second row, and which of the nine it is: for a work
 * item parked with questions the first question, followed by how many more
 * it waits on, as in " (and 2 more questions)"; otherwise, where a headless
 * session of the work item waits for the person to allow a call, the oldest
 * request as the tool it asks to use and its text, followed by how many
 * more wait, as in " (and 1 more)"; otherwise, where the work item's chain
 * stopped, the chain's sentence, which says the stage and why, as the
 * daemon wrote it; otherwise, where the chain runs a stage and the line's
 * pane does not wait for the person, the stage in short, who runs it and
 * what it is, as in "Proofer, round 2" and "Sealer, verdict", and "Broad
 * gate" for the broad gate, which no role runs; otherwise, where the agent
 * asks the person a question in its pane, the first question and the
 * labels of its choices, followed by how many more questions it asks, as
 * in "Which
 * library formats the dates? date-fns · dayjs (and 1 more question)";
 * otherwise, where the work item's pull request or its seal gives the line
 * its state, their words (`branchLine`), as in "Checks running", "Check
 * failed: build", "Seal broken" and "Sealed"; otherwise what the agent's
 * state carried, otherwise the newest commit's
 * subject, otherwise the branch. While a search is typed it is the branch,
 * where the letters that match are marked.
 */
export function lineText(workItem: WorkItem, session: SessionInfo | undefined, searching: boolean): { says: "question" | "permission" | "chain" | "stage" | "state" | "pull-request" | "seal" | "commit" | "branch"; text: string } {
  const open = searching ? null : parkedWith(workItem);
  if (open) return { says: "question", text: `${open[0]?.asks ?? ""}${moreQuestions(open.length - 1)}` };
  const asks = searching ? [] : permissionsOf(workItem);
  const oldest = asks[0];
  if (oldest) return { says: "permission", text: `${asksToUse(oldest.tool)}: ${oldest.text}${asks.length > 1 ? ` (and ${asks.length - 1} more)` : ""}` };
  const chain = searching ? null : chainOf(workItem);
  if (chain?.state === "stopped") return { says: "chain", text: chain.says };
  const stage = searching || session?.state === "waiting" ? null : runningStage(workItem);
  if (stage) return { says: "stage", text: STAGES[stage.kind].short(stage.round) };
  const asked = searching ? [] : askedBy(session);
  const first = asked[0];
  if (first) return { says: "state", text: `${first.asks}${first.options.length > 0 ? ` ${first.options.map(({ label }) => label).join(" · ")}` : ""}${moreQuestions(asked.length - 1)}` };
  const branched = searching ? null : branchLine(workItem, session?.state ?? null);
  if (branched) return { says: branched.says, text: branched.text };
  const said = searching ? null : saidBy(session);
  if (said !== null) return { says: "state", text: said };
  const newest = searching ? undefined : workItem.commits?.[0];
  return newest ? { says: "commit", text: newest.subject } : { says: "branch", text: workItem.branch };
}

/**
 * How many commits a work item's branch gained since the person last looked:
 * its count now less its count in the look, and all of them for a work item
 * the look does not hold. None where no look is recorded, and where the
 * daemon gave no count on either side.
 */
export function gainedSince(workItem: WorkItem, look: Look | null): number {
  if (!look || workItem.newCommits === null) return 0;
  const before = look.workItems.find((item) => item.id === workItem.id);
  if (!before) return workItem.newCommits;
  return before.newCommits === null ? 0 : Math.max(0, workItem.newCommits - before.newCommits);
}

/** A line's badge: the commits its branch gained since the look, as in "3 new", or nothing where it gained none. */
export function lineBadge(workItem: WorkItem, look: Look | null): string {
  const gained = gainedSince(workItem, look);
  return gained > 0 ? `${gained} new` : "";
}

/**
 * How far a work item's branch is ahead of its base and behind it: as the
 * preview's sentence, "6 commits ahead of main, 2 behind", and as the base's
 * fact in a view, "main · 6 ahead · 2 behind". Ahead counts the commits the
 * base branch does not hold, and behind the commits the base holds that the
 * branch does not. Where no base branch is recorded it is left out with
 * behind, and the count is of the commits since the branch was cut. A count
 * is left out where the daemon read none, and behind is left out where a
 * daemon of an earlier build sent no such field.
 */
export function ahead(workItem: WorkItem): { sentence: string; fact: string } {
  const base = workItem.baseBranch ?? null;
  const count = (base === null ? workItem.newCommits : workItem.aheadOfBase) ?? null;
  const behind = base === null ? null : (workItem.behindBase ?? null);
  const sentence = count === null ? "" : `${count} ${count === 1 ? "commit" : "commits"} ahead${base === null ? "" : ` of ${base}`}${behind === null ? "" : `, ${behind} behind`}`;
  const fact = [base, count === null ? null : `${count} ahead`, behind === null ? null : `${behind} behind`].filter((part) => part !== null).join(" · ");
  return { sentence, fact: fact || "Not recorded" };
}

/** The lines added and removed, as in "+12 \u22123", or nothing where git counted none, as for a binary file. */
export function lineCounts(added: number | null, removed: number | null): string {
  return added === null || removed === null ? "" : `+${added} \u2212${removed}`;
}

/** How many more of something there are than are listed, or what to say of none listed at all; nothing where every one is listed. */
function listFoot(listed: number, total: number | null, one: string, many: string, none: string): string {
  if (listed === 0 && !total) return none;
  const more = (total ?? listed) - listed;
  return more > 0 ? `${more} more ${more === 1 ? one : many}` : "";
}

export interface CommitLine {
  hash: string;
  subject: string;
  /** The lines the commit added and removed. */
  counts: string;
  age: string;
  /** Whether the branch gained the commit since the person last looked. */
  gained: boolean;
}

/**
 * A work item's commits as the preview and a view list them, newest first:
 * the first `gained` of them are the ones the branch gained since the look.
 * The foot says how many more the branch holds than the daemon sent, or that
 * it holds none. Nothing where the daemon read no commits.
 */
export function commitLines(workItem: WorkItem, gained: number, now: number): { lines: CommitLine[]; foot: string } | null {
  const commits = workItem.commits ?? null;
  if (commits === null) return null;
  return {
    lines: commits.map((commit, at) => ({ hash: commit.hash, subject: commit.subject, counts: lineCounts(commit.added, commit.removed), age: ageOf(commit.at, now), gained: at < gained })),
    foot: listFoot(commits.length, workItem.newCommits, "commit", "commits", "No commit yet."),
  };
}

/**
 * The files a work item's branch changed, each with its lines, under the
 * count of all of them and the sums of their lines. The foot says how many
 * more there are than the daemon sent, or that there is none. Nothing where
 * the daemon read no changes.
 */
export function fileLines(workItem: WorkItem): { sum: string; lines: { path: string; counts: string }[]; foot: string } | null {
  const changes = workItem.changes ?? null;
  if (changes === null) return null;
  return {
    sum: changes.files === 0 ? "" : `${changes.files} ${changes.files === 1 ? "file" : "files"}, ${lineCounts(changes.added, changes.removed)}`,
    lines: changes.list.map((file: FileChange) => ({ path: file.path, counts: lineCounts(file.added, file.removed) })),
    foot: listFoot(changes.list.length, changes.files, "file", "files", "No file changed yet."),
  };
}

/** The facts of a view's right column, in their order: the agent, which is the label of the kind of the pane the state is read from, when the work item was started, its base and its worktree. */
export function viewFacts(entry: Entry, paneKinds: readonly PaneKindInfo[], now: number, account = ""): { label: string; value: string }[] {
  const kind = paneKinds.find((offered) => offered.kind === entry.session?.kind);
  return [
    { label: "Agent", value: kind ? kind.label : "None" },
    ...(account === "" ? [] : [{ label: "Account", value: account }]),
    { label: "Started", value: `${ageOf(entry.workItem.createdAt, now)} ago` },
    { label: "Base", value: ahead(entry.workItem).fact },
    { label: "Worktree", value: entry.workItem.worktree },
  ];
}

/** What a work item's view shows of its pull request, under the seal's place. */
export interface PullRequestFacts {
  /** The pull request's number, as in "Pull request #12", which opens `url`. */
  head: string;
  url: string;
  /** Its state: "Open", "Merged" or "Closed". */
  state: string;
  /** The result of its checks: "Checks running", "Checks passed", "1 check failed" or "No checks". */
  checks: string;
  /** Each check the daemon kept, in its order, the failed ones first: its name, the mark of its state, the state's word, and the address its row opens, or null. */
  rows: { name: string; mark: HeadlessState; words: string; link: string | null }[];
  /** How many more checks GitHub listed than the daemon kept, or nothing. */
  foot: string;
  /** Why the last read failed, where it did, or nothing. */
  failure: string;
}

const PULL_REQUEST_STATE: Record<PullRequest["state"], string> = { open: "Open", merged: "Merged", closed: "Closed" };
const CHECK_SAYS: Record<PullRequestCheck["state"], { mark: HeadlessState; words: string }> = { pending: { mark: "working", words: "Running" }, passed: { mark: "finished", words: "Passed" }, failed: { mark: "failed", words: "Failed" } };

/**
 * The facts of a work item's pull request as its view lists them, as GitHub
 * last answered the daemon: the number with its address, the state, the
 * result of the checks and each check's row. A read that failed keeps the
 * facts of the read before it, and its sentence stands under the rows. Null
 * for a work item without a pull request.
 */
export function pullRequestFacts(workItem: WorkItem): PullRequestFacts | null {
  const pullRequest = pullRequestOf(workItem);
  if (pullRequest === null) return null;
  const failed = pullRequest.list.filter((check) => check.state === "failed").length;
  const checks = { none: "No checks", pending: "Checks running", passed: "Checks passed", failed: `${counted(failed, "check", "checks")} failed` }[pullRequest.checks];
  const failure = pullRequest.failure === null ? "" : `The last read failed, so the facts above are from the read before it: ${pullRequest.failure}`;
  return {
    head: `Pull request #${String(pullRequest.number)}`,
    url: pullRequest.url,
    state: PULL_REQUEST_STATE[pullRequest.state],
    checks,
    rows: pullRequest.list.map((check) => ({ name: check.name, ...CHECK_SAYS[check.state], link: check.link })),
    foot: listFoot(pullRequest.list.length, pullRequest.listCount, "check", "checks", ""),
    failure: failure === "" || /[.?!]$/u.test(failure) ? failure : `${failure}.`,
  };
}

/** The keys a list says under its preview: the two that move through it, the one that opens the selected line's menu, and the one that opens the "New work item" form, with the Control key where the keyboard has no Command key. */
export function keyHints(screen: "inbox" | "history" | "archived", mac: boolean): string[] {
  return [`J K move through the ${screen === "archived" ? "archived work items" : screen}`, "M opens the menu", `${mac ? "\u2318N" : "Ctrl N"} opens a new work item`];
}

/**
 * The work item whose line is selected, `ids` being the work items in the
 * order their lines are displayed: the one that was `selected` while it is
 * listed, and otherwise the first line's. Nothing where the inbox has no line.
 */
export function selectedLine(ids: readonly number[], selected: number | undefined): number | undefined {
  return selected !== undefined && ids.includes(selected) ? selected : ids[0];
}

/** The work item selected after a key moved the selection one line, which stops at each end of the list. */
export function moveSelection(ids: readonly number[], selected: number | undefined, key: "next" | "previous"): number | undefined {
  const from = selectedLine(ids, selected);
  if (from === undefined) return undefined;
  const at = ids.indexOf(from) + (key === "next" ? 1 : -1);
  return ids[Math.min(Math.max(at, 0), ids.length - 1)];
}

/**
 * What a key does on a screen that holds a list, the inbox screen, the
 * history screen or the archived screen, or null where the window leaves it
 * alone. What `open` does there is the window's to say. J and K are read
 * by their place on the keyboard, so they act under any input source. No key
 * is read while a screen the window does not name as one is in front, a
 * dialog is open, a menu is open (a repository's, a work item's or a
 * pane's), the focus is in a field or a modifier key is held. Enter on a
 * control is that control's own press.
 */
export function inboxKey(
  key: { code: string; modified: boolean },
  where: { inboxInFront: boolean; dialogOpen: boolean; menuOpen: boolean; inField: boolean; onControl: boolean },
): "next" | "previous" | "open" | null {
  if (!where.inboxInFront || where.dialogOpen || where.menuOpen || where.inField || key.modified) return null;
  if (key.code === "KeyJ") return "next";
  if (key.code === "KeyK") return "previous";
  if (key.code === "Enter" && !where.onControl) return "open";
  return null;
}

/**
 * What a key pressed with the Command key does on every screen, or null
 * where the window leaves it alone: K puts the focus in the search field,
 * N opens the "New work item" form, and W closes the pane in front. The
 * Control key stands for the Command key where the keyboard has none. The
 * key is read by its place on the keyboard, and not while a dialog is open,
 * a menu is open or another modifier key is held as well. The application
 * menu binds none of these keys, since a menu takes its key before the page
 * sees it (src/main/menu.ts).
 */
export function commandKey(key: { code: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }, where: { mac: boolean; dialogOpen: boolean; menuOpen: boolean }): "search" | "new" | "closePane" | null {
  const command = where.mac ? key.meta && !key.ctrl : key.ctrl && !key.meta;
  if (!command || key.alt || key.shift || where.dialogOpen || where.menuOpen) return null;
  if (key.code === "KeyK") return "search";
  if (key.code === "KeyN") return "new";
  return key.code === "KeyW" ? "closePane" : null;
}

/**
 * Whether a pane's close asks the person first: its session is working, so
 * the close would end an agent in the middle of a turn. A session works
 * where its process runs and its state is `working`. A kind that reports no
 * state never asks, and the function reads no kind (docs/architecture.md,
 * "Rules that keep it portable").
 */
export function closeAsks(session: SessionInfo): boolean {
  return session.alive && session.state === "working";
}

/**
 * The text a pane is handed for the files dropped on it, `paths` being each
 * file's path in the order of the drop, empty for a file that is on no
 * disk. Each path is written as a shell reads one word: a backslash stands
 * before every ASCII character that is not a letter, a digit or one of
 * `/ . _ - + = : , @ %`, and a character outside ASCII is written as it is.
 * The paths are joined by one space, and one space follows the last, so the
 * person types on after it. A file with no path is left out, and so is a
 * path that holds a control character, which a terminal would read as a
 * key. Where no path is left the text is empty.
 */
export function droppedText(paths: readonly string[]): string {
  return paths
    .filter((path) => path !== "" && !/[\u0000-\u001f\u007f]/.test(path))
    .map((path) => `${path.replace(/[ -~]/g, (character) => (/[A-Za-z0-9/._\-+=:,@%]/.test(character) ? character : `\\${character}`))} `)
    .join("");
}

/** What a key of a pane that the window reads does: it sends a line feed, or one of the three bytes a shell reads as an editing key. */
export type PaneKeyAct = "lineFeed" | "lineStart" | "lineEnd" | "deleteToLineStart";

/** The byte the pane's process is handed for each: a line feed, and Control+A, Control+E and Control+U. A shell reads the first two as the line's start and its end. bash reads Control+U as a deletion of what stands before the cursor, and zsh as a deletion of the whole line. */
export const PANE_KEY_BYTES: Record<PaneKeyAct, string> = { lineFeed: "\n", lineStart: "\u0001", lineEnd: "\u0005", deleteToLineStart: "\u0015" };

/**
 * What a key pressed in a pane does in place of what the terminal would
 * send for it, or null where the terminal reads the key itself. Enter with
 * the Shift key and no other modifier is the key that sends a line feed,
 * which a program such as Claude Code reads as a line break where Enter
 * submits. On a Mac keyboard, `mac`, three keys with the Command key and no
 * other modifier are the editing keys of macOS: the left arrow goes to the
 * line's start, the right arrow to its end, and Backspace sends Control+U,
 * which deletes what stands before the cursor in bash and the whole line in
 * zsh. On a keyboard without the Command key the three stay the
 * terminal's. During a composition every key is the terminal's: the event
 * says so, or its key code is 229, the code of a key the input source took.
 * The application menu binds none of these keys (src/main/menu.ts).
 */
export function paneKey(key: { key: string; shift: boolean; ctrl: boolean; alt: boolean; meta: boolean; isComposing: boolean; keyCode: number }, mac: boolean): PaneKeyAct | null {
  if (key.isComposing || key.keyCode === 229) return null;
  if (key.key === "Enter") return key.shift && !key.ctrl && !key.alt && !key.meta ? "lineFeed" : null;
  if (!mac || !key.meta || key.shift || key.ctrl || key.alt) return null;
  if (key.key === "ArrowLeft") return "lineStart";
  if (key.key === "ArrowRight") return "lineEnd";
  return key.key === "Backspace" ? "deleteToLineStart" : null;
}

/** What an item of a pane's menu does. */
export type PaneMenuAct = "copy" | "paste" | "selectAll" | "clear" | "reset" | "close";

/** An item of a pane's menu: its words, the keys that do the same, empty where no key of the window does, what it does, and whether it can be pressed. */
export interface PaneMenuItem {
  text: string;
  keys: string;
  act: PaneMenuAct;
  enabled: boolean;
}

/**
 * The items of a pane's menu, in their order, with null where a rule stands
 * between two groups. On a Mac keyboard "Copy", "Paste" and "Close Pane"
 * show the keys that do the same, and no other item shows one, since no key
 * of the window does what it does. On another keyboard no item shows a key.
 * "Copy" can be pressed only where the terminal holds a `selection`.
 */
export function paneMenu(mac: boolean, selection: boolean): (PaneMenuItem | null)[] {
  const item = (text: string, act: PaneMenuAct, keys = "", enabled = true): PaneMenuItem => ({ text, keys: mac ? keys : "", act, enabled });
  return [item("Copy", "copy", "\u2318C", selection), item("Paste", "paste", "\u2318V"), item("Select All", "selectAll"), null, item("Clear Screen", "clear"), item("Reset Terminal", "reset"), null, item("Close Pane", "close", "\u2318W")];
}

/** A text of a pane's line that may name a path, with where it stands in the line's text: from `start` to before `end`. */
export interface PathCandidate {
  text: string;
  start: number;
  end: number;
}

/**
 * The texts of a line a pane printed that may each name a path, for the
 * main process to say what stands there (src/main/paths.ts). A candidate is
 * a run of characters between spaces that holds a slash and not `://`, the
 * mark of an address, which the link add-on finds. Around it are cut the
 * quotes and the brackets a sentence puts there, the punctuation that
 * closes one, and a line number with its column, written as `:12` or
 * `:12:5`. A run that names nothing but its slashes, dots and tildes is no
 * candidate: `//` opens a comment on every other line of a program, and
 * would read as the root folder. A bare name is none either, since `docs`
 * is a word of a sentence and a folder of most worktrees.
 */
export function pathCandidates(line: string): PathCandidate[] {
  const found: PathCandidate[] = [];
  for (const run of line.matchAll(/\S+/g)) {
    if (run[0].includes("://")) continue;
    let start = /^["'`([{<]*/.exec(run[0])?.[0].length ?? 0;
    let text = run[0].slice(start);
    // A path that ends in the folder above keeps its dots.
    while (/["'`)\]}>.,;:!?]$/.test(text) && !/\/\.\.?$/.test(text)) text = text.slice(0, -1);
    text = text.replace(/:\d+(?::\d+)?$/, "");
    if (!text.includes("/") || /^[/.~]*$/.test(text)) continue;
    start += run.index;
    found.push({ text, start, end: start + text.length });
  }
  return found;
}

/** What a link of a pane leads to: an address of the web, the worktree of another work item the window lists, or any other path a file or a folder stands at. */
export type LinkTarget = { kind: "web"; address: string } | { kind: "workItem"; path: string; workItemId: number } | { kind: "path"; path: string };

/** What a person does with a link: open its address in the browser, put its work item's view in front, show its path in Finder, or copy the address or the path. */
export type LinkAct = "browser" | "workItem" | "finder" | "copy";

/** The target of a link the terminal found as an address: a web address, as the URL's parser writes it, where it is an `http` or `https` one, and none otherwise. The main process opens no other address (src/main/links.ts). */
export function webTarget(address: string): LinkTarget | null {
  if (!URL.canParse(address)) return null;
  const url = new URL(address);
  return url.protocol === "http:" || url.protocol === "https:" ? { kind: "web", address: url.href } : null;
}

/**
 * The target of a path the main process found a file or a folder at, whole:
 * the worktree of a work item the window lists, where it is one, and
 * another path otherwise. The worktree of the work item whose view is on
 * screen, `viewing`, is another path, since a click that opened the view
 * already on screen would do nothing.
 */
export function pathTarget(path: string, workItems: readonly WorkItem[], viewing: number | undefined): LinkTarget {
  const workItem = workItems.find((listed) => listed.worktree === path && listed.id !== viewing);
  return workItem ? { kind: "workItem", path, workItemId: workItem.id } : { kind: "path", path };
}

// What a person can do with a link of each kind of target, in the order the card's rows stand in, and the click that does it: one with the key held, one with the key and the Shift key held, or none. `linkClick` and `linkCard` both read it, so a row never names a click that does something else.
const LINK_ROWS: Record<LinkTarget["kind"], readonly { text: string; act: LinkAct; click: "key" | "shiftKey" | null }[]> = {
  web: [
    { text: "Open in browser", act: "browser", click: "key" },
    { text: "Copy link", act: "copy", click: null },
  ],
  workItem: [
    { text: "Open work item", act: "workItem", click: "key" },
    { text: "Open in Finder", act: "finder", click: "shiftKey" },
  ],
  path: [
    { text: "Show in Finder", act: "finder", click: "key" },
    { text: "Copy path", act: "copy", click: null },
  ],
};

/**
 * What a click on a link in a pane does, from the kind of its target and
 * the keys held, or null where the click stays the terminal's, which
 * selects text with it. The key is the Command key, and the Control key
 * where the keyboard has none: on a Mac the Control key with a click is the
 * secondary click. With the Shift key held as well the click does what the
 * target's rows give that click, and what the click with the key alone does
 * where they give it nothing.
 */
export function linkClick(kind: LinkTarget["kind"], click: { meta: boolean; ctrl: boolean; shift: boolean }, mac: boolean): LinkAct | null {
  if (!(mac ? click.meta : click.ctrl)) return null;
  const rows = LINK_ROWS[kind];
  const row = (click.shift ? rows.find((listed) => listed.click === "shiftKey") : undefined) ?? rows.find((listed) => listed.click === "key");
  return row ? row.act : null;
}

/** A link's card: the whole target on its first line, and a row for each thing a person can do with it, with the keys that do it, empty where no click does. */
export interface LinkCard {
  title: string;
  rows: { text: string; keys: string; act: LinkAct }[];
}

/** How long, in milliseconds, the pointer rests on a link before its card shows, and how long the card stays once the pointer is on neither the link nor the card, which is the time the pointer has to go from one to the other. */
export const CARD_SHOW_MS = 300;
export const CARD_LEAVE_MS = 200;

/** The card of a link: its target whole, the address or the path, and its rows, each with the click that does what it names, as `linkClick` answers that click on a keyboard that is a Mac's or is not. A row that copies names no click. */
export function linkCard(target: LinkTarget, mac: boolean): LinkCard {
  const keys = { key: mac ? "\u2318 Click" : "Ctrl Click", shiftKey: mac ? "\u21e7 \u2318 Click" : "Shift Ctrl Click" };
  return {
    title: target.kind === "web" ? target.address : target.path,
    rows: LINK_ROWS[target.kind].map(({ text, act, click }) => ({ text, keys: click === null ? "" : keys[click], act })),
  };
}

/**
 * Whether a link's card stays at a key pressed in the pane, from the key
 * event's `key`. It stays at a modifier key pressed by itself, the Command,
 * Shift, Control or Option key: the card's rows name clicks made with those
 * keys held, so a person who reads one holds the key and then clicks. Any
 * other key takes the card away, with or without a modifier key held.
 */
export function cardStaysAt(key: string): boolean {
  return key === "Meta" || key === "Shift" || key === "Control" || key === "Alt";
}

/**
 * Whether a key opens a menu: M alone, read by its place on the keyboard, or
 * F10 with the Shift key. On macOS no key raises the event a press of the
 * right button raises, so the window reads the key itself. `modified` says
 * that the Command, the Control or the Option key is held. The key is not
 * read in a field, a terminal's among them, while a dialog is open or while
 * a menu is open.
 */
export function menuKey(key: { code: string; shift: boolean; modified: boolean }, where: { dialogOpen: boolean; menuOpen: boolean; inField: boolean }): boolean {
  if (where.dialogOpen || where.menuOpen || where.inField || key.modified) return false;
  return key.shift ? key.code === "F10" : key.code === "KeyM";
}

/**
 * What the menu's key opens a menu for: the work item of the line the
 * keyboard is on, or the repository of the row it is on, and where it is on
 * neither, the work item of the `selected` line of the list in front.
 * Nothing where no list is in front or the list has no line.
 */
export function menuTarget(on: { workItem?: number; repository?: number }, selected: number | undefined): { workItem: number } | { repository: number } | null {
  if (on.workItem !== undefined) return { workItem: on.workItem };
  if (on.repository !== undefined) return { repository: on.repository };
  return selected === undefined ? null : { workItem: selected };
}

/**
 * What the press of a menu's item does. On a work item's menu: opens the
 * rename dialog, sets the work item's pin, its mute or the group it stands
 * in, where `groupId` null is none, archives it, opens
 * the dialog of its delete, or, on an archived one's, restores it. On a
 * repository's: opens its settings, its
 * icon's dialog or its removal's, hides it, opens the screen of its archived
 * work items, or, for `group`, opens the dialog of a new group. On both:
 * writes a text to the clipboard, or, from an item of the "Open in" submenu,
 * opens a folder in Finder, where `app` is null, or in an installed app.
 */
export type MenuAction =
  | { do: "rename" | "account" | "archive" | "restore" | "delete"; id: number }
  | { do: "open"; folder: string; app: string | null }
  | { do: "copy"; text: string }
  | { do: "set"; id: number; pinned?: boolean; muted?: boolean; groupId?: number | null }
  | { do: "settings" | "icon" | "records" | "archived" | "group" | "hide" | "remove"; id: number };

/** One item of a menu or of a submenu, which a press acts on: its words, the sentence a pointer over it is told, what its press does, and whether a rule stands above it, where another part of the menu begins. */
export interface MenuItem {
  label: string;
  /** What a press does, in other words than the label's. */
  description: string;
  action: MenuAction;
  divides: boolean;
}

/** An entry of a menu that opens a submenu beside it and does nothing else: its words, the sentence a pointer over it is told, the items of its submenu, and whether a rule stands above it. An item of a submenu opens no submenu, so a menu has one level under it. */
export interface Submenu {
  label: string;
  /** What the submenu lists, in other words than the label's. */
  description: string;
  opens: readonly MenuItem[];
  divides: boolean;
}

/** One entry of a menu: an item a press acts on, or one that opens a submenu. */
export type MenuEntry = MenuItem | Submenu;

/**
 * Where a submenu stands, as the left and top of its box: its left edge at
 * the right edge of the `menu` that opens it, and its top edge at `top`, the
 * top edge of the item it opens from. Where its right edge would pass the
 * window's, `within`, its right edge stands at the menu's left edge. Where
 * neither side has room for its `size`, it is moved inside the window and
 * covers part of the menu. Where its bottom edge would pass the window's, it
 * is moved up, and never above the window's top or left of its left edge.
 */
export function submenuPlace(menu: { left: number; right: number }, top: number, size: { width: number; height: number }, within: { width: number; height: number }): { left: number; top: number } {
  const beside = menu.right + size.width <= within.width ? menu.right : menu.left - size.width >= 0 ? menu.left - size.width : Math.min(menu.right, within.width - size.width);
  return { left: Math.max(0, beside), top: Math.max(0, Math.min(top, within.height - size.height)) };
}

/** The "Open in" entry of a menu, with `whose` naming the folder in its descriptions. Its submenu lists Finder, then each of `apps` in the order they arrive, which is the editors before the terminals. Where no app is installed, or the main process has not answered yet, the submenu holds Finder alone. */
function openEntries(folder: string, whose: string, apps: readonly InstalledApp[]): Submenu {
  return {
    label: "Open in",
    description: `Choose where ${whose} folder opens: Finder, or an editor or a terminal installed on this Mac.`,
    opens: [
      { label: "Finder", description: `Show ${whose} folder in a Finder window.`, action: { do: "open", folder, app: null }, divides: false },
      ...apps.map(({ name, kind }) => ({ label: name, description: `Start ${name}, ${kind === "editor" ? "an editor" : "a terminal"}, on ${whose} folder.`, action: { do: "open" as const, folder, app: name }, divides: false })),
    ],
    divides: true,
  };
}

/**
 * A work item's menu, in its order: Rename; "Open in", whose submenu lists
 * Finder and each installed editor and terminal; Copy path and Copy branch
 * name; "Account…", after Rename, where `accounts` says the window offers a
 * choice of account (`offersAccounts`); Pin or Unpin, and Mute notifications or Unmute notifications; "Move
 * to" for each of `groups`, the groups of its repository, but the one it
 * stands in, and "Move out of" that one; Archive and Delete. The menu of an
 * archived work item holds Restore, "Open in", the two copies and Delete.
 * The folder that is opened and copied is the work item's worktree.
 */
export function workItemMenu(workItem: WorkItem, apps: readonly InstalledApp[], groups: readonly Group[], accounts = false): MenuEntry[] {
  const { id, worktree: folder } = workItem;
  const open = openEntries(folder, "the work item's", apps);
  const copies: MenuItem[] = [
    { label: "Copy path", description: "Put the worktree folder's whole path on the clipboard.", action: { do: "copy", text: folder }, divides: true },
    { label: "Copy branch name", description: `Put ${workItem.branch} on the clipboard.`, action: { do: "copy", text: workItem.branch }, divides: false },
  ];
  const remove = (divides: boolean): MenuItem => ({ label: "Delete", description: "Remove the work item's worktree and its local branch from disk, after a dialog names what would be lost. Nothing on a remote is removed.", action: { do: "delete", id }, divides });
  const own = groups.find((group) => group.id === workItem.groupId);
  const moves: MenuItem[] = [
    ...groups.filter((group) => group !== own).map((group) => ({ label: `Move to ${group.name}`, description: `List the work item under the heading ${group.name} of its repository in the sidebar.`, action: { do: "set" as const, id, groupId: group.id }, divides: false })),
    ...(own ? [{ label: `Move out of ${own.name}`, description: "List the work item among its repository's ungrouped work items again.", action: { do: "set" as const, id, groupId: null }, divides: false }] : []),
  ].map((entry, at) => ({ ...entry, divides: at === 0 }));
  if (workItem.archivedAt !== null) return [{ label: "Restore", description: "Put the work item back among the repository's work items, with the panes it had.", action: { do: "restore", id }, divides: false }, open, ...copies, remove(true)];
  return [
    { label: "Rename", description: "Give the work item another name, and its branch too where the branch was never pushed.", action: { do: "rename", id }, divides: false },
    ...(accounts ? [{ label: "Account…", description: "Choose the account the work item's new sessions run under.", action: { do: "account" as const, id }, divides: false }] : []),
    open,
    ...copies,
    workItem.pinned
      ? { label: "Unpin", description: "Let the work item stand among the others of its list again.", action: { do: "set", id, pinned: false }, divides: true }
      : { label: "Pin", description: "Keep the work item at the top of its list.", action: { do: "set", id, pinned: true }, divides: true },
    workItem.muted
      ? { label: "Unmute notifications", description: "Let this work item's sessions notify you again.", action: { do: "set", id, muted: false }, divides: false }
      : { label: "Mute notifications", description: "Raise no notification for this work item's sessions. Its line still shows its state.", action: { do: "set", id, muted: true }, divides: false },
    ...moves,
    { label: "Archive", description: "Take the work item off the lists and end its sessions. Its folder and its branch stay on disk, and a restore brings it back.", action: { do: "archive", id }, divides: true },
    remove(false),
  ];
}

/**
 * A repository's menu, in its order: Settings, Change icon and "Records and
 * check…", which a repository of a daemon of an earlier build, one that
 * sends no `records`, does not have; Show archived work items and New group;
 * "Open in", whose submenu lists Finder and each installed editor and
 * terminal; Copy path; Hide from sidebar and Remove. The folder that is
 * opened and copied is the repository's.
 */
export function repositoryMenu(repository: Repository, apps: readonly InstalledApp[]): MenuEntry[] {
  const { id, folder } = repository;
  const records: MenuItem[] = recordsOf(repository) === null ? [] : [{ label: "Records and check…", description: "See the place for work records and the pull request check of this repository, and set them up where it lacks one.", action: { do: "records", id }, divides: false }];
  return [
    { label: "Settings", description: "Change the name the sidebar shows and the branch new work items start from.", action: { do: "settings", id }, divides: false },
    { label: "Change icon", description: "Choose one character to show before the repository's name.", action: { do: "icon", id }, divides: false },
    ...records,
    { label: "Show archived work items", description: "List the work items of this repository that were archived.", action: { do: "archived", id }, divides: true },
    { label: "New group", description: "Make a heading to gather some of this repository's work items under.", action: { do: "group", id }, divides: false },
    openEntries(folder, "the repository's", apps),
    { label: "Copy path", description: "Put the repository folder's whole path on the clipboard.", action: { do: "copy", text: folder }, divides: true },
    { label: "Hide from sidebar", description: "Take the repository out of the sidebar. Its work items stay in the inbox.", action: { do: "hide", id }, divides: true },
    { label: "Remove", description: "Take the repository and its work items off Owlery's lists. Nothing on disk is removed unless you choose it in the dialog.", action: { do: "remove", id }, divides: false },
  ];
}

/** What a repository holds of the records place, or null for a repository of a daemon of an earlier build, which sends none: the window then offers no setup for it. */
export function recordsOf(repository: Repository): RecordsPlace | null {
  return (repository as { records?: RecordsPlace }).records ?? null;
}

/** Whether a repository lacks a part of the records place a setup would write: its root or its check's workflow. A registration of such a repository opens the dialog of the records place. */
export function lacksRecords(repository: Repository): boolean {
  const records = recordsOf(repository);
  return records !== null && (records.root === null || records.check === null);
}

/**
 * The repository a registration of `folder` was answered for, given the
 * repositories the window held when the answer arrived and the ones it holds
 * now: the one the lists gained, and where they gained none, the repository
 * whose folder is the one typed. None otherwise: a folder inside a
 * repository names it only to the daemon, which may read another
 * repository there than the one the lists hold above it.
 */
export function registered(folder: string, before: readonly Repository[], now: readonly Repository[]): Repository | undefined {
  const gained = now.filter((repository) => !before.some((known) => known.id === repository.id));
  if (gained.length === 1) return gained[0];
  const typed = folder.replace(/\/+$/, "");
  return now.find((repository) => repository.folder === typed);
}

/** What the daemon answered a plan of the records place with: the plan, or the error it refused the plan with. */
export type RecordsPlanned = RecordsPlan | { error: string };

/** The words of the dialog of the records place, and the state of its field and of its buttons. */
export interface RecordsWords {
  head: string;
  /** What Owlery does in the repository and what is out of scope, said whatever the plan holds. */
  scope: string;
  /** The branch and the subject of the commit a setup makes, or empty where it makes none. */
  commit: string;
  /** Why the setup cannot run, or the daemon's refusal of the plan, or empty. */
  blocked: string;
  /** Each file of a plan that writes one: a file the setup writes with its whole text, and a file that stands with the sentence that it is kept. */
  files: { path: string; text: string | null; says: string }[];
  /** For a repository that holds every part: its root, its workflow and its broad gate command. */
  holds: string[];
  /** The field of the broad gate command: off where `config.json` stands, with the key's value. */
  gate: { shown: boolean; enabled: boolean; label: string; value: string; says: string };
  /** Of the workflow the plan names: how an administrator makes the seal check required, where it is Owlery's, or that AgenticSeal's posts no such check. Empty until a plan names one. */
  required: string;
  submit: { shown: boolean; enabled: boolean; label: string };
  cancel: string;
}

/** What the dialog of the records place says of the seal check a workflow posts, by the workflow's path: Owlery's posts `Owlery seal`, which an administrator makes required on GitHub, and AgenticSeal's `hygiene.yml` posts none. Nothing for no workflow. */
function requiredCheck(workflow: string | null): string {
  const unchanged = "Owlery changes no setting of the repository on GitHub.";
  if (workflow?.endsWith("/hygiene.yml")) return `AgenticSeal's \`hygiene.yml\` posts no \`Owlery seal\` check, so GitHub offers none to require. ${unchanged}`;
  if (workflow === null) return "";
  return `The workflow posts its verdict as the check \`Owlery seal\` on each pull request's head commit. To hold a pull request until it is sealed, an administrator of the repository requires \`Owlery seal\` on GitHub, in the repository's rules for the base branch, under the rule that requires status checks to pass. A pull request from a fork gets no \`Owlery seal\` check, so a required one holds it until an administrator lets it through. ${unchanged}`;
}

/**
 * What the dialog of the records place says of a repository, given the plan
 * the daemon answered with, or null until it answers, the command the field
 * holds, and the command the plan was asked for. The scope's sentence
 * stands before anything is written, whatever the plan holds. A plan that
 * writes a file is shown whole, and the button that commits is on only
 * where the plan is of the command the field holds, is not blocked, and
 * writes no `config.json` with an empty command. A plan that writes none
 * and is not blocked is a repository that holds every part: the dialog
 * shows what it holds, and no button to commit. One that writes none and is
 * blocked is shown as a plan that writes a file is, with the refusal: the
 * repository has no folder for a root, git ignores where a work item's
 * records go below its root, something other than a folder stands there,
 * or its checkout does not hold a file of the place as its commit does.
 * Whichever the plan, the dialog says of the workflow it names, written or
 * kept, how an administrator makes the seal check required on GitHub, or
 * that AgenticSeal's `hygiene.yml` posts no such check.
 */
export function recordsDialog(repository: Repository, plan: RecordsPlanned | null, command: string, plannedFor: string | null): RecordsWords {
  const head = `Records and check: ${repository.name}`;
  const scope = "Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery.";
  const label = "Broad gate command";
  const off = { shown: true, enabled: false, label: "Set up and commit" };
  const unplanned = { head, scope, commit: "", files: [], holds: [], gate: { shown: false, enabled: false, label, value: "", says: "" }, required: "", cancel: "Not now" };
  if (plan === null) return { ...unplanned, blocked: "", submit: off };
  if ("error" in plan) return { ...unplanned, blocked: plan.error, submit: off };
  const held = recordsOf(repository);
  const config = plan.files.find((file) => file.path.endsWith("/config.json"));
  const required = requiredCheck(plan.files.find((file) => file.path.startsWith(".github/workflows/"))?.path ?? null);
  // The key's place and its value, as the daemon last read them.
  const kept = config === undefined ? "" : held?.broadGate == null ? `No \`Broad gate\` key in \`${config.path}\`.` : `Kept in \`${config.path}\`, under \`Broad gate\`.`;
  if (plan.blocked === null && plan.files.every((file) => file.text === null)) {
    const [readme, , workflow] = plan.files;
    const gate = config === undefined || held?.broadGate == null ? kept : `Broad gate: \`${held.broadGate}\`, kept in \`${config.path}\` under \`Broad gate\``;
    return {
      ...unplanned,
      blocked: "",
      required,
      holds: [`Records: \`${readme?.path.replace(/README\.md$/, "") ?? ""}\``, `Check: \`${workflow?.path ?? ""}\``, gate],
      submit: { ...off, shown: false },
      cancel: "Close",
    };
  }
  const writesConfig = config !== undefined && config.text !== null;
  const proposed = writesConfig && plan.proposedBroadGate !== null && command === plan.proposedBroadGate;
  return {
    head,
    scope,
    commit: plan.blocked === null && plan.branch !== null ? `This makes one commit on \`${plan.branch}\`: \`${plan.subject}\`. Nothing is pushed.` : "",
    blocked: plan.blocked ?? "",
    files: plan.files.map((file) => ({ ...file, says: file.text === null ? `\`${file.path}\` stands and is kept.` : "" })),
    holds: [],
    gate: {
      shown: config !== undefined,
      enabled: writesConfig,
      label,
      value: writesConfig ? command : (held?.broadGate ?? ""),
      says: writesConfig ? `Kept in \`${config.path}\`, under \`Broad gate\`.${proposed ? " Owlery read this command from the repository's `package.json`: change it where the repository's whole check is another." : ""}` : kept,
    },
    required,
    submit: { ...off, enabled: plan.blocked === null && plannedFor === command && (!writesConfig || command.trim() !== "") },
    cancel: "Not now",
  };
}

/** What a pointer over the "+" button at the sidebar's top is told: it creates a work item, and its form is where a repository is registered alone. */
export const NEW_WORK_ITEM_SAYS = "Create a work item: a new branch and worktree in a repository. The form can also register a repository alone.";
/** What a pointer over the form's choice "Register the repository only" is told. */
export const REGISTER_ONLY_SAYS = "Add the repository to the sidebar without creating a work item, a branch or a worktree.";

/** The two icon buttons of a repository's row: the name of each, which a screen reader is told, and what a pointer over it is told that a press does. */
export function rowButtons(repositoryName: string): Record<"add" | "menu", { name: string; says: string }> {
  return {
    add: { name: `New work item in ${repositoryName}`, says: `Create a work item in ${repositoryName}: a new branch and worktree.` },
    menu: { name: `Menu of ${repositoryName}`, says: `Open the menu of ${repositoryName}: its settings, its icon, hiding it and removing it.` },
  };
}

/** What the daemon answered a rename's plan with: what a `renamePlan` carries, or the error it refused the plan with. */
export type RenamePlanned = { branch: string | null; blocked: string | null } | { error: string };

/**
 * The rename dialog's choice "Rename the branch too", given the plan the
 * dialog holds for the name typed, or null until the daemon has answered:
 * whether it can be taken, and what the dialog says under it, the branch the
 * rename gives or why the branch keeps its name.
 */
export function renameChoice(plan: RenamePlanned | null): { enabled: boolean; says: string } {
  if (plan === null) return { enabled: false, says: "" };
  if ("error" in plan) return { enabled: false, says: plan.error };
  if (plan.blocked !== null || plan.branch === null) return { enabled: false, says: plan.blocked ?? "" };
  return { enabled: true, says: `The branch becomes ${plan.branch}.` };
}

/**
 * The tabs of a work item's view: its panes as the daemon lists them, whether
 * their process runs or has exited, in the order of their ids. An exited
 * pane keeps its tab until it is closed, and the daemon keeps its last output.
 */
export function paneTabs(workItem: WorkItem, sessions: readonly SessionInfo[]): SessionInfo[] {
  return sessions.filter((session) => session.workItemId === workItem.id).sort((a, b) => a.id - b.id);
}

/**
 * The pane in front when a view shows `tabs`: the one that was `last` in
 * front in that view where it is still a tab, and otherwise the live pane
 * with the highest id, or the tab with the highest id where none is alive.
 * Nothing where there is no tab.
 */
export function paneInFront(tabs: readonly SessionInfo[], last: number | undefined): number | undefined {
  if (tabs.some((tab) => tab.id === last)) return last;
  const recent = [...tabs].sort((a, b) => b.id - a.id);
  return (recent.find((tab) => tab.alive) ?? recent[0])?.id;
}

/** The most panes a work item's view shows at once: fixed here at the count the four-terminal reference scene is measured at, until #32 makes it a default read from the person's machine (docs/architecture.md, Memory design). */
export const STAGE_PANES = 4;

/**
 * The panes on the stage of a view that shows `tabs`, in the tabs' order,
 * and the one of them in front, which has the keyboard. `recent` is the panes
 * that were in front in that view, the most recent first. The view's stage
 * order is the panes of `recent` that are still tabs, in that order, and
 * then the tabs that are not in `recent`, which were never in front, the
 * highest id first. The pane in front is `paneInFront`'s for the first of
 * `recent`. Where "Side by side" is not pressed, it is alone on the stage.
 * Where it is pressed, the stage holds up to `STAGE_PANES` panes: the one in
 * front, then the panes of the stage order. A pressed tab is the first of
 * `recent`, so it takes the place of the shown pane last in the stage order.
 * A closed pane that `recentKept` left first takes no place: the stage holds
 * the first `STAGE_PANES` panes of the stage order, and the pane in front is
 * `paneInFront`'s among them. Where fewer than `STAGE_PANES` of the tabs
 * were in front, tabs never in front are among them, and one of those can
 * be the pane in front.
 */
export function stageOf(tabs: readonly SessionInfo[], recent: readonly number[], sideBySide: boolean): { front: number | undefined; shown: number[] } {
  const ids = tabs.map((tab) => tab.id);
  const never = ids.filter((id) => !recent.includes(id)).sort((a, b) => b - a);
  // A set keeps each pane at the first place it is named.
  const byRecency = [...new Set([...recent.filter((id) => ids.includes(id)), ...never])];
  const closedFirst = sideBySide && recent.length > 0 && !ids.includes(recent[0] as number);
  const candidates = closedFirst ? tabs.filter((tab) => byRecency.slice(0, STAGE_PANES).includes(tab.id)) : tabs;
  const front = paneInFront(candidates, recent[0]);
  if (front === undefined) return { front, shown: [] };
  if (!sideBySide) return { front, shown: [front] };
  const top = [...new Set([front, ...byRecency])].slice(0, STAGE_PANES);
  return { front, shown: ids.filter((id) => top.includes(id)) };
}

/**
 * The panes that were in front in a view, the most recent first, once the
 * daemon lists only `listed`. A pane it no longer lists leaves, except the
 * first one: that one stays as the pane last in front, so `paneInFront`
 * finds it is no tab and gives the live pane with the highest id, which
 * `stageOf` takes from the first `STAGE_PANES` panes of its stage order
 * where "Side by side" is pressed, tabs never in front among them where
 * fewer of the tabs were in front, or the one of those panes with the
 * highest id where none of them runs. Were it taken out, the pane in front
 * before it would come in front, an exited one included.
 */
export function recentKept(recent: readonly number[], listed: ReadonlySet<number>): number[] {
  return recent.filter((pane, place) => place === 0 || listed.has(pane));
}

/** Whether the window tells a pane's process the size of the pane's screen: only where the daemon lists the pane with its process running. The pseudo-terminal of a process that exited is closed, and a daemon built before it ignored such a size failed on it. */
export function tellsSize(sessions: readonly SessionInfo[], pane: number): boolean {
  return sessions.some((session) => session.id === pane && session.alive);
}

/** A screen of the pool, by its place there, and a pane. */
export interface ScreenAndPane {
  screen: number;
  pane: number;
}

/**
 * What the pool of terminal screens does when the stage shows `stage`,
 * `holds` being the pane each screen holds now, or nothing for a free one. A
 * pane that stays on the stage keeps its screen. The screen of a pane that
 * left is given back, `back`. A pane that comes on takes the first free
 * screen, one given back here among them, and only where none is free a new
 * one, whose place is one past the pool's end, `taken`. `holds` is the pool
 * after both.
 */
export function screenMoves(holds: readonly (number | undefined)[], stage: readonly number[]): { holds: (number | undefined)[]; back: ScreenAndPane[]; taken: ScreenAndPane[] } {
  const after = holds.map((pane) => (pane !== undefined && stage.includes(pane) ? pane : undefined));
  const back = holds.flatMap((pane, screen) => (pane !== undefined && after[screen] === undefined ? [{ screen, pane }] : []));
  const taken: ScreenAndPane[] = [];
  for (const pane of stage) {
    if (after.includes(pane)) continue;
    const free = after.indexOf(undefined);
    const screen = free === -1 ? after.length : free;
    after[screen] = pane;
    taken.push({ screen, pane });
  }
  return { holds: after, back, taken };
}

/**
 * What the window does with a `replay` or an `output` of a pane, `awaited`
 * being the replays it asked for with an `attach` and has not received: the
 * count after the message, and whether the message is written into the
 * pane's screen. The last replay asked for is written and no other, since it
 * holds what the earlier ones held. Output before it is dropped, since the
 * replay holds that too.
 */
export function replayStep(awaited: number, kind: "replay" | "output"): { awaited: number; write: boolean } {
  if (kind === "output") return { awaited, write: awaited === 0 };
  return { awaited: Math.max(0, awaited - 1), write: awaited === 1 };
}

/** What a screen's turns need of its terminal: a piece it is handed is drawn later, in the order the pieces were handed, and `drawn` runs once the terminal has drawn that piece. */
export interface TerminalWrites {
  write(data: string, drawn?: () => void): void;
}

/** Whose a terminal screen is: the pane on it, and the pane that what its terminal hands the window goes to. */
export interface ScreenTurns {
  /** The pane on the screen, or nothing while the screen is free. */
  readonly pane: number | undefined;
  /** Puts `pane` on the screen. */
  take(pane: number): void;
  /** Takes the screen back from the pane on it, and empties the terminal after what it has still to draw. */
  giveBack(): void;
  /** Hands the terminal what the pane on the screen printed. Where `answered` is false, nothing is sent until the terminal has drawn it. */
  write(data: string, answered: boolean): void;
  /** The pane that what the terminal hands the window now goes to, or nothing where it is sent to nobody. */
  receiver(): number | undefined;
}

/**
 * The turns of the panes on one terminal screen, kept in the order of the
 * terminal's writes. A terminal hands the window what a person types and
 * what it answers a program's question with through one path. A person's
 * keys arrive at once. An answer arrives when the terminal draws the
 * question, which can be after the screen passed to another pane. So nothing
 * is sent until the terminal has drawn everything it was handed before the
 * pane on the screen took it, and what a person types in that span is not
 * sent either. Nothing is sent while the terminal draws a piece written
 * with `answered` false, and nothing from a free screen.
 */
export function screenTurns(term: TerminalWrites): ScreenTurns {
  let pane: number | undefined;
  // The turns the screen has had, and the turn whose output the terminal has reached.
  let turn = 0;
  let reached = 0;
  // The pieces the terminal is drawing whose answers are not sent.
  let muted = 0;
  return {
    get pane() {
      return pane;
    },
    take(next) {
      pane = next;
      turn += 1;
      const taken = turn;
      // An empty piece is drawn in its place among the others, so its callback runs once the terminal has drawn everything handed to it before this turn.
      term.write("", () => {
        reached = taken;
      });
    },
    giveBack() {
      pane = undefined;
      // The reset is handed to the terminal as output is, so what it has still to draw of the pane that leaves is drawn before the reset and not into the next pane's screen.
      term.write("\u001bc");
    },
    write(data, answered) {
      if (answered) {
        term.write(data);
        return;
      }
      muted += 1;
      term.write(data, () => {
        muted -= 1;
      });
    },
    receiver: () => (reached === turn && muted === 0 ? pane : undefined),
  };
}

/**
 * The notification for a session whose state was `previous`, or null where
 * none is shown: one is shown when the state becomes waiting or finished, and
 * never where `inFront` holds: the pane is on the stage of a focused window,
 * so the person is looking at it, whether or not it has the keyboard. None
 * is shown for a session of a work item whose notifications are muted, nor
 * for one of an `archived` work item, which `workItems` does not hold.
 */
export function notificationFor(
  previous: AgentState | null,
  session: SessionInfo,
  inFront: boolean,
  workItems: readonly WorkItem[],
  paneKinds: readonly PaneKindInfo[],
  archived: readonly WorkItem[] = [],
): { title: string; body: string } | null {
  if (session.state === previous || inFront) return null;
  if (session.state !== "waiting" && session.state !== "finished") return null;
  const workItem = workItems.find((item) => item.id === session.workItemId);
  if (workItem?.muted || archived.some((item) => item.id === session.workItemId)) return null;
  return {
    title: workItem ? workItem.title : tabLabel(session, [session], paneKinds),
    body: session.state === "waiting" ? stateHeading("waiting") : stateHeading("finished"),
  };
}

/**
 * What a click on a session's notification opens, as the window's lists stand
 * at the click, or null where it opens no view: the session's work item,
 * where the list still holds it, with the session's pane in front where the
 * daemon still lists that pane, and with no pane named where it is closed. A
 * session without a work item opens nothing.
 */
export function notificationOpens(session: Pick<SessionInfo, "id" | "workItemId">, workItems: readonly WorkItem[], sessions: readonly SessionInfo[]): { workItemId: number; pane: number | null } | null {
  const workItem = workItems.find((item) => item.id === session.workItemId);
  if (!workItem) return null;
  return { workItemId: workItem.id, pane: sessions.some((listed) => listed.id === session.id) ? session.id : null };
}

/**
 * What the "New work item" form sends of its fields, in a creation and in a
 * plan, or why it sends nothing. `name` is the name the window generated for
 * this opening of the form, and the title may be empty: the daemon then names
 * the work item by `name`. `base` is the menu's choice, and null where the
 * menu holds none or the request is a plan. An empty folder is refused here,
 * in the form's own words. The daemon refuses every folder that is not
 * absolute, since it would run git with one in the daemon's own folder.
 */
export function workItemFields(repo: string, title: string, name: string, base: string | null): { repo: string; title: string; name: string; base?: string } | { error: string } {
  const fields = { repo: repo.trim(), title: title.trim(), name };
  if (!fields.repo) return { error: "Choose the repository folder." };
  return base === null ? fields : { ...fields, base };
}

/** The folder the form registers a repository by, where "Register the repository only" is chosen: the repository field's text without the spaces around it. An empty one is refused here, in the words a creation's is. */
export function registerFields(repo: string): { folder: string } | { error: string } {
  const folder = repo.trim();
  return folder ? { folder } : { error: "Choose the repository folder." };
}

/** What the daemon answered a plan with: what a `workItemPlan` carries, or the error it refused the plan with. */
export type PlanAnswered = { branch: string; worktree: string; localBases: string[]; remoteBases: string[]; defaultBase: string | null; setupCommand: string | null; includes: boolean } | { error: string };

/**
 * What the "New work item" form holds of its latest plan: the daemon's
 * answer, and `repo`, the repository field's text the plan was asked for,
 * without the spaces around it.
 */
export type FormPlan = { repo: string } & PlanAnswered;

/**
 * Which of the form's plans a message from the daemon answers, by its request
 * id: the `latest` one, which the form shows, an `earlier` one, which it does
 * not, or none, `other`. `asked` holds the ids of the plans not yet answered.
 */
export function planAnswer(latest: number | undefined, asked: ReadonlySet<number>, requestId: number): "latest" | "earlier" | "other" {
  if (!asked.has(requestId)) return "other";
  return requestId === latest ? "latest" : "earlier";
}

/** The plan the form holds, where it was asked for the text the repository field holds now. */
function planOf(plan: FormPlan | null, repo: string): FormPlan | null {
  return plan !== null && plan.repo === repo.trim() ? plan : null;
}

/**
 * What the form shows under the name: the branch and the folder the work item
 * will get, and the setup its repository names, before the person creates
 * it: the copy where `.worktreeinclude` stands, and the command
 * `.worktreesetup` holds. Where the daemon refused the plan, `failed`, its
 * message stands in the branch's place. Nothing where the form holds no
 * answer for the repository field's text.
 */
export function planLine(plan: FormPlan | null, repo: string): { branch: string; worktree: string; setup: string; failed: boolean } {
  const shown = planOf(plan, repo);
  if (shown === null) return { branch: "", worktree: "", setup: "", failed: false };
  if ("error" in shown) return { branch: shown.error, worktree: "", setup: "", failed: true };
  const setup = [shown.includes ? "Copies the ignored files .worktreeinclude names from the main checkout." : null, shown.setupCommand === null ? null : `Then runs: ${shown.setupCommand.trim()}`].filter((sentence) => sentence !== null).join(" ");
  return { branch: shown.branch, worktree: shown.worktree, setup, failed: false };
}

/** What the form says where Create is pressed before it shows the plan of the repository field's text. */
export const PLAN_AWAITED = "Wait until the form shows what this folder's work item gets, its setup among it.";

/**
 * The setup command the form shows for the repository field's text, whole,
 * which a creation carries so the daemon runs no other: the plan's, or none
 * where the daemon refused the plan. Nothing while the form holds no answer
 * for the field's text, as after a key in it and before the plan answers,
 * and the form then creates nothing.
 */
export function shownSetup(plan: FormPlan | null, repo: string): { setupCommand: string | null } | null {
  const shown = planOf(plan, repo);
  if (shown === null) return null;
  return { setupCommand: "error" in shown ? null : shown.setupCommand };
}

/** A base a person chose in the form's menu, and the repository field's text it was chosen under. */
export interface BaseChoice {
  repo: string;
  base: string;
}

/**
 * The form's menu of the branches a work item can start from: the default
 * base `first`, then the `local` branches and the `remote` ones without it,
 * and the `value` chosen. The value is the person's choice while the
 * repository field's text is the one it was made under and the plan lists it,
 * and otherwise the default base, or the first base listed where the
 * repository has none. The menu holds nothing, and its value is null, where
 * the form holds no answer for the repository field's text or the answer
 * lists no base.
 */
export function baseMenu(plan: FormPlan | null, choice: BaseChoice | null, repo: string): { first: string | null; local: string[]; remote: string[]; value: string | null } {
  const shown = planOf(plan, repo);
  if (shown === null || "error" in shown) return { first: null, local: [], remote: [], value: null };
  const first = shown.defaultBase;
  const local = shown.localBases.filter((base) => base !== first);
  const remote = shown.remoteBases.filter((base) => base !== first);
  const listed = [...(first === null ? [] : [first]), ...local, ...remote];
  const kept = choice !== null && choice.repo === shown.repo && listed.includes(choice.base) ? choice.base : null;
  return { first, local, remote, value: kept ?? listed[0] ?? null };
}

/**
 * What the "New work item" form holds of the fetch of one base it asked the
 * daemon for: `awaited` until an answer comes, then what a `baseFetched`
 * carries, or the error the daemon refused the request with.
 */
export type BaseAnswer = "awaited" | BaseFetch | { error: string };

/** How long, in milliseconds, the form says that it fetches a base with no answer: the daemon's own limit for a fetch and two seconds more. A daemon of an earlier build never answers. */
export const BASE_ANSWER_MS = BASE_FETCH_MS + 2_000;

/** The name the form keeps the fetch of a base under: the repository field's text without the spaces around it, and the base. No branch's name holds a line break. */
export function baseKey(repo: string, base: string): string {
  return `${repo.trim()}\n${base}`;
}

/**
 * Whether the form asks the daemon to fetch `base`, the value its menu
 * holds: where the plan it holds for the repository field's text lists the
 * base among the remotes' branches and not among the local ones, which the
 * daemon reads first, and `asked`, the keys of the bases asked for since the
 * form opened, does not hold it. Never under `only`, the choice "Register
 * the repository only", which starts no work item.
 */
export function asksFetch(plan: FormPlan | null, base: string | null, repo: string, only: boolean, asked: { has(key: string): boolean }): boolean {
  const shown = planOf(plan, repo);
  if (only || base === null || shown === null || "error" in shown) return false;
  return shown.remoteBases.includes(base) && !shown.localBases.includes(base) && !asked.has(baseKey(repo, base));
}

/**
 * What the form says under its menu "Starts from" of `base`, the menu's
 * value, from what it holds of that base's fetch: that the branch is being
 * fetched, the commit the remote's branch is at, or why it could not be
 * fetched, the commit it starts at and how long the clone has held that
 * commit, which is not how long ago the clone last fetched. A refusal is said
 * in its own words. Nothing for a local base, for a base no fetch was asked
 * of or answered for, and with no base in the menu.
 */
export function baseSays(base: string | null, answer: BaseAnswer | null | undefined, now: number): string {
  if (base === null || answer == null) return "";
  if (answer === "awaited") return `Fetching ${base}…`;
  if ("error" in answer) return answer.error;
  const commit = answer.commit.slice(0, 7);
  if (answer.fetch === "fetched") return `Fetched: ${base} is at ${commit}.`;
  if (answer.fetch === "none") return "";
  const held = answer.since === null ? "" : `, which the clone has held for ${ageOf(answer.since, now)}`;
  return `${base} could not be fetched (${String(answer.failure)}). It starts as last fetched, at ${commit}${held}.`;
}

/** What the window's status line says once a creation is answered whose base's fetch was answered after the person pressed Create: `baseSays`'s sentence of a branch that could not be fetched, and nothing of any other answer. */
export function lateSays(base: string, answer: BaseAnswer | null, now: number): string {
  return answer !== null && answer !== "awaited" && "fetch" in answer && answer.fetch === "kept" ? baseSays(base, answer, now) : "";
}

/** What the form holds of a base's fetch once `BASE_ANSWER_MS` has passed since it asked: nothing where no answer came, and the answer where one did. */
export function unanswered(answer: BaseAnswer | null): BaseAnswer | null {
  return answer === "awaited" ? null : answer;
}

/**
 * The settings dialog's menu of the bases a repository's new work items can
 * start from: the `local` branches and the `remote` ones, whole, as the plan
 * the dialog asked for lists them, and the `value` chosen, the base the
 * repository has, or an empty string for the first choice, the repository's
 * default branch. A base the repository has and the plan does not list
 * stands among the local ones, so the menu shows the choice the daemon
 * keeps. It stands alone until the daemon answers, and where it refuses.
 */
export function settingsBases(plan: PlanAnswered | null, chosen: string | null): { local: string[]; remote: string[]; value: string } {
  const listed = plan !== null && !("error" in plan) ? { local: plan.localBases, remote: plan.remoteBases } : { local: [], remote: [] };
  const known = chosen === null || listed.local.includes(chosen) || listed.remote.includes(chosen);
  return { local: known ? [...listed.local] : [...listed.local, chosen], remote: [...listed.remote], value: chosen ?? "" };
}

/**
 * What the settings dialog sends for a repository: the name where it is
 * another than the one a person gave, null for an empty one, and the base
 * where the menu's value is another than the repository's, null for the
 * first choice, the chain of its Claude Code panes where the menu's
 * value is another than the answer kept, null for no answer, and the
 * account where the menu's value, an account's id, is another than the one
 * set on the repository, null for the first choice, which leaves it to the
 * default. A field that did not change is left out, and an object with
 * none is nothing to send.
 */
export function settingsFields(repository: Repository, name: string, base: string, chain: string = paneChainOf(repository)?.chosen ?? "", account: string = String(repository.accountId ?? "")): { name?: string | null; defaultBase?: string | null; paneChain?: ChainChoice | null; accountId?: number | null } {
  const named = name.trim() || null;
  const chosen = base || null;
  const runs = chain === "owlery" || chain === "plugin" ? chain : null;
  const set = account === "" ? null : Number(account);
  return {
    ...(named === repository.customName ? {} : { name: named }),
    ...(chosen === repository.defaultBase ? {} : { defaultBase: chosen }),
    ...(runs === (paneChainOf(repository)?.chosen ?? null) ? {} : { paneChain: runs }),
    ...(set === (repository.accountId ?? null) ? {} : { accountId: set }),
  };
}

/** The accounts a daemon keeps and the id of the default one, as the window holds them. */
export interface HeldAccounts {
  accounts: Account[];
  defaultId: number;
}

/** The accounts and the default a `ready` or an `accounts` message carries, or null for a daemon of an earlier build, which sends neither: the window then shows no account control and no account's name. */
export function heldAccounts(message: { accounts?: Account[]; defaultAccountId?: number }): HeldAccounts | null {
  if (message.accounts === undefined || message.defaultAccountId === undefined) return null;
  return { accounts: [...message.accounts], defaultId: message.defaultAccountId };
}

/** Whether the window offers a choice of account: only where the daemon keeps an account beside System default, since with System default alone there is nothing to choose. */
export function offersAccounts(held: HeldAccounts | null): boolean {
  return held !== null && held.accounts.some((account) => account.id !== SYSTEM_DEFAULT_ID);
}

/** The name of the account of `id`, or nothing where the window holds no account of it. */
export function accountName(held: HeldAccounts, id: number): string {
  return held.accounts.find((account) => account.id === id)?.name ?? "";
}

/** The account a repository gives its work items: the one set on it, else the default. */
function repositoryAccount(repository: Repository | undefined, held: HeldAccounts): number {
  return repository?.accountId ?? held.defaultId;
}

/**
 * The name a line of the inbox shows of a work item's account: the work
 * item's own where it differs from the one its repository gives, else the
 * first live pane's or working headless session's of the work item whose
 * account differs from it, and nothing where every one is the repository's,
 * or where the window holds no accounts.
 */
export function lineAccount(workItem: WorkItem, repository: Repository | undefined, sessions: readonly SessionInfo[], headless: readonly HeadlessInfo[], held: HeldAccounts | null): string {
  if (held === null) return "";
  const given = repositoryAccount(repository, held);
  const differs = (id: number | null | undefined): id is number => id !== null && id !== undefined && id !== given;
  if (differs(workItem.accountId)) return accountName(held, workItem.accountId);
  const running = [
    ...sessions.filter((session) => session.alive && session.workItemId === workItem.id).map((session) => session.accountId),
    ...headless.filter((session) => session.state === "working" && session.workItemId === workItem.id).map((session) => session.accountId),
  ].find(differs);
  return running === undefined ? "" : accountName(held, running);
}

/** The name a work item's view shows of the account its sessions take where they name none of their own (`accountFor`): its own, else its repository's, else the default. Nothing where the window holds no accounts. */
export function viewAccount(workItem: WorkItem, repository: Repository | undefined, held: HeldAccounts | null): string {
  if (held === null) return "";
  return accountName(held, accountFor(null, workItem, { accountId: repositoryAccount(repository, held) }, held.defaultId));
}

/** The name a pane's tab shows of the pane's account: the account it was launched under where that differs from the one its work item gives, and nothing for a pane launched under none, under the work item's, or where the window holds no accounts. */
export function tabAccount(session: SessionInfo, workItem: WorkItem, repository: Repository | undefined, held: HeldAccounts | null): string {
  if (held === null || session.accountId === null || session.accountId === undefined) return "";
  const given = accountFor(null, workItem, { accountId: repositoryAccount(repository, held) }, held.defaultId);
  return session.accountId === given ? "" : accountName(held, session.accountId);
}

/** One row of the Accounts dialog: the account's id and name, its folder in words, whether it is the default, and whether it keeps its name, as System default does. */
export interface AccountRow {
  id: number;
  name: string;
  folder: string;
  isDefault: boolean;
  fixed: boolean;
}

/** The rows of the Accounts dialog, in the daemon's order, System default first. */
export function accountRows(held: HeldAccounts | null): AccountRow[] {
  if (held === null) return [];
  return held.accounts.map((account) => ({ id: account.id, name: account.name, folder: account.folder ?? "The folder your login shell gives Claude Code", isDefault: account.id === held.defaultId, fixed: account.id === SYSTEM_DEFAULT_ID }));
}

/** The choices of a menu of accounts: a first one, of the value "", that leaves the account to the setting above, named `first` with the account `gives` it gives, then each account by its id, in the daemon's order. */
export function accountChoices(held: HeldAccounts, first: string, gives: number): { value: string; label: string }[] {
  return [{ value: "", label: `${first} (${accountName(held, gives)})` }, ...held.accounts.map((account) => ({ value: String(account.id), label: account.name }))];
}

/** Which chain a repository's Claude Code panes run, or null for a repository of a daemon of an earlier build, which sends none: the window then asks no choice for it. */
export function paneChainOf(repository: Repository | undefined): RepositoryChain | null {
  return (repository as { chain?: RepositoryChain } | undefined)?.chain ?? null;
}

/**
 * Whether the window asks which chain runs before it opens a pane of `kind`
 * in a repository: for a Claude Code pane of a repository on the owl chain
 * whose Claude Code enables the AgenticSeal plugin, while the person gave no
 * answer. One chain seals a repository, and the daemon launches such a pane
 * with nothing of the owl chain until an answer is kept. A shell is asked
 * nothing, and neither is a repository the window does not hold.
 */
export function asksChain(repository: Repository | undefined, kind: PaneKind): boolean {
  const chain = paneChainOf(repository);
  return kind === "claude" && chain !== null && chain.owl && chain.plugin && chain.chosen === null;
}

/** The menu's choices of a chain, by the value the menu holds for each: the empty value is no answer, which has the window ask at the next Claude Code pane. */
export const CHAIN_CHOICES: readonly { value: "" | ChainChoice; label: string }[] = [
  { value: "", label: "Ask at the next Claude Code pane" },
  { value: "owlery", label: "The owl chain" },
  { value: "plugin", label: "The AgenticSeal plugin" },
];

/**
 * The chain's field of a repository's settings: whether the dialog shows
 * it, and the value its menu holds. It is shown where the choice is read,
 * which is a repository on the owl chain whose Claude Code enables the
 * AgenticSeal plugin, and where an answer is kept, so an answer a person
 * gave can be seen and changed though the plugin is off now.
 */
export function settingsChain(repository: Repository): { shown: boolean; value: "" | ChainChoice } {
  const chain = paneChainOf(repository);
  return { shown: chain !== null && ((chain.owl && chain.plugin) || chain.chosen !== null), value: chain?.chosen ?? "" };
}

/**
 * Whether the "Ask" button of a work item's view can be pressed, and its
 * title: where it asks, or why it cannot. The daemon refuses a prompt of
 * white space.
 */
export function askButton(prompt: string, workItem: WorkItem): { enabled: boolean; title: string } {
  if (!prompt.trim()) return { enabled: false, title: "Type what to ask." };
  return { enabled: true, title: `Ask in ${workItem.title}` };
}

/**
 * The sentence of a work item's chain, which stands at its view's foot under
 * the seal's words: where the chain of the daemon stands. It is empty where
 * no chain ran for the work item, and for a daemon of an earlier build,
 * which sends no chain. Nothing in the window starts a chain, so the foot
 * holds nothing to press.
 */
export function chainSays(workItem: WorkItem): string {
  return chainOf(workItem)?.says ?? "";
}

/** The headless sessions the window holds, with one the daemon just sent: in place of the one of the same id, or after the others. */
export function withHeadless(held: readonly HeadlessInfo[], changed: HeadlessInfo): HeadlessInfo[] {
  return held.some((info) => info.id === changed.id) ? held.map((info) => (info.id === changed.id ? changed : info)) : [...held, changed];
}

/** The headless sessions the window holds, without the one the daemon took off its list. */
export function withoutHeadless(held: readonly HeadlessInfo[], id: number): HeadlessInfo[] {
  return held.filter((info) => info.id !== id);
}

export interface HeadlessLine {
  id: number;
  prompt: string;
  state: HeadlessState;
  /** The mark the line is drawn with: the session's state, or `waiting` while the session waits for the person to allow a call. */
  mark: HeadlessState | "waiting";
  /** The state in words beside the mark: the state's own word, or "Needs you" while the session waits for the person to allow a call. */
  words: string;
  /** The answer as far as it has arrived, or the error of a session that failed. */
  text: string;
  /** What the agent's process of a failed session printed on its error stream, shown under the error with its line breaks kept, and empty for a session that did not fail. */
  errorOutput: string;
  /** Whether the line offers "Stop": a session that is working can be stopped, and one that ended cannot. */
  stop: boolean;
  /** The calls the session waits for the person to allow or refuse, the oldest first: each with its id, which an answer names, the head that names the tool it asks to use, and what a person reads of the call. */
  asks: { id: number; head: string; text: string }[];
}

/** The lines of one work item's headless sessions, the most recent first, so the one just asked sits under the field, each with the calls it waits for the person to allow or refuse. */
export function headlessLines(held: readonly HeadlessInfo[], workItem: WorkItem): HeadlessLine[] {
  const waiting = permissionsOf(workItem);
  return held
    .filter((info) => info.workItemId === workItem.id)
    .sort((a, b) => b.id - a.id)
    .map((info): HeadlessLine => {
      const asks = waiting.filter(({ headlessId }) => headlessId === info.id).map(({ id, tool, text }) => ({ id, head: asksToUse(tool), text }));
      return {
        id: info.id,
        prompt: info.prompt,
        state: info.state,
        mark: asks.length > 0 ? "waiting" : info.state,
        words: asks.length > 0 ? stateHeading("waiting") : info.state,
        text: info.state === "failed" ? (info.error ?? "") : info.answer,
        errorOutput: info.state === "failed" ? info.errorOutput : "",
        stop: info.state === "working",
        asks,
      };
    });
}

/** The words of the button on the broad gate's line that shows what the gate's command printed. */
export const GATE_OUTPUT_SHOWS = "Show output";

/** What a `readGateOutput` answered, as the window holds it: the work item, the start of the run whose line asked, by the daemon's clock, the text, and whether the daemon kept the end of the output alone. */
export interface GateOutput {
  workItemId: number;
  startedAt: number;
  text: string;
  cut: boolean;
}

/** The line of a work item's newest broad gate under "Ask", drawn in the form of a headless session's line. */
export interface GateLine {
  /** When the run started, by the daemon's clock, which tells one run of a work item's gate from the next. */
  startedAt: number;
  /** The command the gate ran, as the stage holds it. */
  command: string;
  /** The mark the line is drawn with. */
  state: HeadlessState;
  /** The state in words beside the mark, as a headless session's line says its state. */
  words: string;
  /** Why the gate failed, as a sentence, and empty for a gate that did not fail and for one the daemon gave no reason. */
  text: string;
  /** Whether the line offers "Stop": the chain runs the gate's command now. */
  stop: boolean;
  /** Whether the line offers "Show output": the run has ended and the daemon kept what its command printed. */
  output: boolean;
  /** What the command printed, as the window last read it for this run, with a note where the daemon kept the end alone, and null where the window read none for this run. Plain text, never markup. */
  printed: { text: string; note: string } | null;
}

/**
 * The line of a work item's newest broad gate, or null where its chain
 * holds none: no chain ran, a daemon of an earlier build sent no chain, or
 * no stage of the chain holds a gate's run. The line's state is the
 * stage's, with the failure as a sentence where it failed. A stage that
 * says it works in a chain that does not run it now is drawn failed, with
 * no "Stop": no command of it runs. `read` is what the window last read of
 * a gate's output, or null, and it stands under the line only where it was
 * read of this run of this work item's gate.
 */
export function gateLine(workItem: WorkItem, read: GateOutput | null): GateLine | null {
  // A stage of another kind holds no run, and neither does a stage a build before the gate stored.
  const stage = chainOf(workItem)?.stages.findLast((held) => (held.gate ?? null) !== null);
  const run = stage?.gate;
  if (!stage || !run) return null;
  const state: HeadlessState = stage.state === "working" && runningStage(workItem) !== stage ? "failed" : stage.state;
  const shown = read !== null && read.workItemId === workItem.id && read.startedAt === stage.startedAt;
  return {
    startedAt: stage.startedAt,
    command: run.command,
    state,
    words: state,
    text: stage.failure === null ? "" : asSentence(stage.failure),
    stop: state === "working",
    output: run.output,
    printed: shown ? { text: read.text, note: read.cut ? "Owlery kept the end of the output alone." : "" } : null,
  };
}

/** What tells one drawing of a work item's "Ask" section from the next: it differs where the broad gate's line, a session's line or a request of it differs, and between two work items. The section is drawn again only where it differs, so a button the keyboard is on stays through every `inbox` that changes nothing the section shows. */
export function headlessKey(workItemId: number, lines: readonly HeadlessLine[], gate: GateLine | null = null): string {
  return JSON.stringify([workItemId, lines, gate]);
}
