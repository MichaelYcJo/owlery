// A work item's chain: what the daemon runs from `Daemon#startChain`. This module
// holds what the run decides and says and none of its sessions: the step the
// records owe, each stage's prompt, the reading of each stage's answer, and
// the chain as the store keeps it. `Daemon#runChain` starts the sessions, and
// `stage-records.ts` turns each stage's answer into a committed record, for
// the daemon's chain and for the chain command a pane's session runs
// (`chain-command.ts`), which reads the same order here.
//
// The daemon keeps no position of a chain. Before each stage it reads the
// work item's round records as the branch's head holds them, its record of
// decisions and questions, and the commits after the last round's target,
// and `stepOwed` says from those values alone which stage is next. So a
// chain that failed, was stopped or was cut by the daemon's end starts again
// from the records (docs/architecture.md, "Code runs the order, the
// orchestrator judges").
//
// Once the rounds settle the chain owes the repository's broad gate, which
// is no session: `Daemon#runGate` runs the command, and this module reads
// whether the gate holds at the branch's head. Where it holds the chain owes
// the seal, a sealer's session on the gate's commit (`Daemon#runSeal`), until
// the newest verdict block of the work item's guarantee seals that commit.
// The step `sealed` then owes the pull request stage where the work item's
// routing sends it to a pull request and the pull request the daemon stores
// does not carry the branch's head (`pullRequestOwed`): no step of the order,
// since what GitHub holds is no record. `Daemon#runPullRequest` runs it, and
// commits nothing, so the seal it carries stands.
//
// The order is code and two things are the orchestrator agent's: whether the
// rounds are converging, asked before a fix pass on the record of round 2 or
// a later round (`gateBefore`), and what a stage's question is decided as,
// from the code and the policy, or whether it parks the work item. A sealer's
// `undecided` verdict is such a question.
import { join, relative } from "node:path";
import type { Chain, ChainStage, ChainStageKind, GateRun, PullRequest, RoleStage } from "../shared/protocol";
import { CHAIN_STAGE_KINDS } from "../shared/protocol";
import type { PermissionAction } from "./adapters/adapter";
import { RECORD_FILE, readDecisionRecord } from "./decision-record";
import { ASK_BLOCK, CONVERGENCE_BLOCK, ROUND_BASE, RULING_BLOCK, type Block, type Kind, field, gfmLines, read, stripped } from "./record-blocks";
import { repositoryFileText } from "./repository-file";
import { REFUSAL_RULES, type RefusalRule } from "./role-grants";
import { type Close, type Finding, type Reference, type RoundRecord, type Target, readRoundRecord } from "./round-record";
import { GATE_FILE, GUARANTEE_FILE, type Verdict, readGate, readGuarantee, runHeading } from "./seal-records";
import { baseRef, commitNamed, fileAt, filesAt, holdsCommit, pathsBetween, pathsOfCommit, pathsOfCommits, sharedCommit } from "./worktrees";

/** How many of a chain's stages the daemon keeps with its work item, the newest. A chain of two rounds and one fix pass is three, and each round after them adds two or three. */
export const CHAIN_STAGES_KEPT = 50;

/** How many characters of the reviewed commits' diff a round's prompt carries. A longer diff is cut there, and the prompt says so. */
export const PROMPT_DIFF_CHARS = 200_000;

/** The round a chain stops at where it leaves a finding open, whatever the orchestrator would answer, where the daemon's options name no other. It bounds the usage a chain spends with nobody watching. */
export const ROUNDS_CEILING = 6;

/** For how many `undecided` verdicts of one guarantee the daemon asks the orchestrator for a ruling, where the daemon's options name no other number. The question of each later one parks the work item with no ruling asked. It bounds the gates and the sessions a sealer that keeps asking spends with nobody watching. */
export const UNDECIDED_CEILING = 2;

/** The file of a work item's directory that holds each call a role's rule refused. */
export const REFUSALS_FILE = join("trail", "refusals.md");

/** The folder of a work item's directory that holds its round records. */
export const ROUNDS_FOLDER = join("trail", "rounds");

/**
 * The closing records of a work item's directory: the files a commit after
 * the broad gate's commit may change with the gate still holding. The pull
 * request check holds the same list
 * (`pr-check/skills/code-review/scripts/chain_check.py#CLOSING_RECORDS`).
 */
export const CLOSING_RECORDS: readonly string[] = [GATE_FILE, GUARANTEE_FILE, REFUSALS_FILE];

/** The subject of the commit that records a passed run of the broad gate. */
export const GATE_SUBJECT = "chore: record the broad gate's run";

/** The subject of the commit that records a sealer's verdict. */
export const VERDICT_SUBJECT = "chore: record the sealer's verdict";

/** The subject of the commit that records the orchestrator's ruling on the question of a sealer's `undecided` verdict. */
export const SEAL_RULING_SUBJECT = "chore: record the orchestrator's ruling on the sealer's question";

/** The trailer of the commit that records a fix pass: the id its crafter's session named, which a verdict block then names among the sessions that built the work. */
export const BUILT_BY_TRAILER = "Seal-Built-By";

/** The name of a round's record. */
export function roundFile(round: number): string {
  return `round-${String(round)}.md`;
}

/** The round a file's name gives as `round-<N>.md`, as `pr-check/lib/routing.py#round_number` reads it, or null. */
export function roundNumber(name: string): number | null {
  const [, digits] = /^round-(\d+)\.md$/u.exec(name) ?? [];
  return digits === undefined ? null : Number(digits);
}

/** What stops a chain: a sentence's second half, which says why, with no capital and no full stop. */
export class ChainStop extends Error {}

/** A stage that failed: its message is the chain's whole sentence, which names the stage and says why. */
export class StageStopped extends Error {}

/** What a stage is called in a sentence. The broad gate, the seal and the pull request stage are named without their round: a chain runs each after its rounds. */
export function stageName(kind: ChainStageKind, round: number): string {
  if (kind === "gate") return "The broad gate";
  if (kind === "seal") return "The sealer's session";
  if (kind === "pull-request") return "The pull request stage";
  if (kind === "round") return `Review round ${String(round)}`;
  if (kind === "fix-pass") return `The fix pass of round ${String(round)}`;
  if (kind === "ruling") return `The ruling after round ${String(round)}`;
  return `The judgment after round ${String(round)}`;
}

/** The sentence of a chain a stage stopped: the stage's name, and why. */
export function stoppedSays(kind: ChainStageKind, round: number, why: string): string {
  return `${stageName(kind, round)} failed: ${why.replace(/\.+$/u, "")}.`;
}

/** The sentence of a chain while a stage's session works. */
export function runningSays(kind: ChainStageKind, round: number): string {
  return `${stageName(kind, round)} is running.`;
}

/** The sentence of a chain that is reading the records, before its first stage and between two. */
export const READING_SAYS = "Owlery is reading the work item's records.";

/** The sentence of a chain that waits for the person's answers. */
export const PARKED_SAYS = "The chain waits for the answers to the work item's open questions.";

/** The sentence of a chain that rests at the step `sealed` with no pull request stage owed: the commit the sealer sealed, which the broad gate passed on, and the last round. It says what that run ended with, and stays after a later commit breaks the seal. */
export function sealedSays(round: number, commit: string): string {
  return `The sealer sealed ${commit.slice(0, 7)}, after round ${String(round)}.`;
}

/** The sentence of a chain that rests after the pull request stage opened its pull request. */
export function pullRequestOpenSays(number: number): string {
  return `Pull request #${String(number)} is open.`;
}

/** The sentence of a chain that rests after the pull request stage gave an open pull request the seal of the commit given. */
export function pullRequestCarriesSays(number: number, commit: string): string {
  return `Pull request #${String(number)} carries the seal at ${commit.slice(0, 7)}.`;
}

/** The `Destination` answer of a `routing.md` that sends the work to a pull request, as `pr-check/lib/routing.py#OPEN_PR` spells it. */
export const OPEN_PULL_REQUEST = "open the pull request";

/**
 * Whether the step `sealed` owes the pull request stage: the work item's
 * `routing.md` at the branch's head answers `Destination` with
 * `OPEN_PULL_REQUEST`, and the pull request the daemon stores for the work
 * item is none, is `closed`, or is `open` and was last pushed at a commit
 * that is not the branch's head. A `merged` one owes nothing. It reads no
 * record but the answer given, and what GitHub holds is the stored pull
 * request's: `stepOwed` stays a function of the records and git.
 */
export function pullRequestOwed(destination: string | null, stored: PullRequest | null, head: string): boolean {
  if (destination !== OPEN_PULL_REQUEST) return false;
  if (stored === null || stored.state === "closed") return true;
  return stored.state === "open" && stored.pushed !== head;
}

/** The sentence of a chain a sealer's `withheld` verdict stopped: the verdict's reason, as the sealer wrote it, ended with one full stop. */
export function withheldSays(reason: string): string {
  return `The sealer withheld its verdict: ${reason.replace(/\.+$/u, "")}.`;
}

/** The sentence of a chain whose broad gate did not start: why, as a sentence's second half. */
export function gateNotRunSays(why: string): string {
  return `The broad gate did not run: ${why.replace(/\.+$/u, "")}.`;
}

/** The sentence of a chain the orchestrator's judgment stopped. */
export function notConvergingSays(round: number): string {
  return `The orchestrator judged after round ${String(round)} that the review rounds are not converging. The next start runs the fix pass of round ${String(round)} all the same.`;
}

/** The sentence of a chain that stopped at the ceiling of its rounds. */
export function ceilingSays(round: number, ceiling: number): string {
  return `Review round ${String(round)} left a finding open, and a chain stops for the person from round ${String(ceiling)} on. The next start runs the fix pass of round ${String(round)} and one more round.`;
}

/** The sentence of a parked chain that did not go on once its questions were answered: what refused the start, as a sentence of its own. */
export function notResumedSays(why: string): string {
  return `The chain did not go on after the answers. ${why.replace(/^[a-z]/u, (letter) => letter.toUpperCase()).replace(/\.*$/u, "")}.`;
}

/** The sentence of a chain that stopped outside a stage. */
export function chainStoppedSays(why: string): string {
  return `The chain stopped: ${why.replace(/\.+$/u, "")}.`;
}

// ---------------------------------------------------------------------------
// The step owed.

/** One round's record as the order reads it: the round, its target, and its findings. */
export interface RoundStanding {
  round: number;
  target: Target;
  findings: Finding[];
}

/** A decision the person reversed, which a fix pass takes in. */
export interface Reversal {
  id: number;
  decided: string;
  message: string;
}

/** What the order reads: the values `stepOwed` is a function of. */
export interface Standing {
  /** The round records the branch's head holds, the lowest round first. */
  rounds: RoundStanding[];
  /** Whether the work item's record of decisions and questions holds an `open` question. */
  openQuestion: boolean;
  /** The decisions that stand `reversed`, in the record's order. */
  reversals: Reversal[];
  /** The branch's head, whole. */
  head: string;
  /** What round 1's target names the branch against: the base round 1's record names where the head holds that record, and otherwise the base the reader was given (`roundBase`). */
  base: string;
  /** The paths the commits after the last record's target changed, from the worktree's top. */
  changed: string[];
  /** The work item's directory, from the worktree's top. */
  directory: string;
  /** The gate's commit, whole: the commit the newest run block of `trail/gate.md` names, as the branch's head holds the file. Null where the head holds no such file or the file holds no run block, and where the repository holds no commit of that name. */
  gateCommit: string | null;
  /** The paths that differ between the gate's commit and the branch's head, from the worktree's top, and none where `gateCommit` is null. */
  sinceGate: string[];
  /** The verdict blocks of `guarantee.md` as the branch's head holds the file, the oldest first, and none where the head holds no such file. */
  verdicts: Verdict[];
  /** The commit, whole, that the newest of those verdict blocks names where it reads `sealed`. Null where no verdict stands, where the newest reads `withheld` or `undecided`, and where the repository holds no commit of that name. */
  sealCommit: string | null;
}

/**
 * What round 1's target names the branch against: the work item's base
 * branch where the round block's `target:` line takes its name
 * (`record-blocks.ts#ROUND_BASE`), and otherwise the commit the branch was
 * cut at, or the branch's head where the work item records none. A record
 * whose target named a base the line does not take would be refused by the
 * daemon's reader and by the pull request check at every round 1, and a
 * commit is always a word the line takes.
 */
export function roundBase(baseBranch: string | null, baseCommit: string | null, head: string): string {
  return baseBranch !== null && ROUND_BASE.test(baseBranch) ? baseBranch : (baseCommit ?? head);
}

/**
 * The base a chain reads a branch against, in the three forms its stages
 * take it in, and as a branch where it is one.
 */
export interface ChainBase {
  /** What round 1's target and a verdict's name the branch against: a base's name the `target:` line takes, or a commit. */
  named: string;
  /** The base's commit, whole, which a run of the broad gate names and the commits of the base stand at or before. Null where the chain has none. */
  commit: string | null;
  /** What git reads the branch against for round 1's diff and the sealer's: a name that names a commit in the worktree. */
  reads: string;
  /** The base as a branch's name, which a pull request is opened against, or null where the base is no branch. */
  branch: string | null;
}

/**
 * The base round 1's record names, as the commit `head` holds the record in
 * the work item's directory, a folder of the worktree: what follows
 * `against` on its `target:` line. Null where the head holds no such record
 * or the record's round block does not read.
 */
export async function recordedBase(worktree: string, directory: string, head: string): Promise<string | null> {
  const text = await fileAt(worktree, head, join(relative(worktree, directory), ROUNDS_FOLDER, roundFile(1)));
  return text === null ? null : (readRoundRecord(text).target?.base ?? null);
}

/**
 * The base a chain reads the branch against at the commit `head`: the base
 * round 1's record names (`recorded`), where the head holds that record and
 * the name still names a commit, and otherwise `stated`, the base the
 * caller holds, from the work item the daemon stores or from the chain
 * command's option. So a branch that was moved onto another base is read
 * against the base its first round read it against, whatever the work item
 * stores. A base recorded as a branch's name is read from the commit it and
 * the head last shared, and a base recorded as a commit is that commit, so
 * `whyNoBase` refuses a branch that no longer holds it. It is a branch where
 * a base of that name stands (`worktrees.ts#baseRef`).
 */
export async function baseOf(worktree: string, head: string, recorded: string | null, stated: ChainBase): Promise<ChainBase> {
  const commit = recorded === null ? null : await commitNamed(worktree, recorded);
  if (recorded === null || commit === null) return stated;
  const branch = (await baseRef(worktree, recorded)) === null ? null : recorded;
  return { named: recorded, commit: branch === null ? commit : await sharedCommit(worktree, recorded, head), reads: recorded, branch: branch ?? stated.branch };
}

/**
 * Why a chain has no base to read the branch against at the commit `head`,
 * as a sentence, or null where it has one: the base's commit is no ancestor
 * of the head, as after the branch was reset onto another line, or the base
 * and the head share no commit. `how` is the sentence that says how another
 * base is named, which ends the reason. A base with no commit is refused by
 * the stage that needs one.
 */
export async function whyNoBase(worktree: string, head: string, base: ChainBase, how: string): Promise<string | null> {
  if (base.commit !== null && !(await holdsCommit(worktree, head, base.commit))) return `The branch no longer holds ${base.commit.slice(0, 7)}, the commit its chain reads it against, so a round has no base to read the branch against. ${how}`;
  if ((await commitNamed(worktree, base.reads)) !== null && (await sharedCommit(worktree, base.reads, head)) === null) return `The branch and its base ${base.named} share no commit, so a round has no base to read the branch against. ${how}`;
  return null;
}

/** How another base is named for a chain of the daemon whose branch left its stored base, before round 1's record stands: the sentence that ends `whyNoBase`'s reason there. */
export const BASE_NAMED_IN_A_PANE = "Name the base in a Claude Code pane of the work item, with `--base <branch or commit>` on the chain command's `owed` and `round`: round 1's record then names it, and every later start follows that record.";

/** What ends `whyNoBase`'s reason where round 1's record names the base the branch left. */
export const BASE_RECORDED = "Round 1's record names that base, and a chain follows the record: bring the branch back onto it.";

/** The stage a chain runs next, or the state it rests in. */
export type Step =
  | { is: "parked" }
  // `from` is the last record's target in a verifying round, and null in round 1.
  | { is: "round"; round: number; target: string; from: string | null }
  // `round` is the record the pass answers, `open` the numbers of its findings with no close block.
  | { is: "fix-pass"; round: number; open: number[]; reversals: Reversal[] }
  // `round` is the last round, and `head` the branch's head, which the command runs on.
  | { is: "gate"; round: number; head: string }
  // `round` is the last round, `commit` the gate's commit, which the verdict names, and `run` the sealer's run: one more than the verdict blocks that stand.
  | { is: "seal"; round: number; commit: string; run: number }
  // `round` is the last round, and `at` the gate's commit, which the newest verdict block seals.
  | { is: "sealed"; round: number; at: string };

/** Whether a path is the folder's own or below it. Both are read from the worktree's top, with `/` between their parts, as git prints them. */
export function inFolder(path: string, folder: string): boolean {
  const top = folder.split("\\").join("/").replace(/\/+$/u, "");
  return path === top || path.startsWith(`${top}/`);
}

/** Whether a path is a closing record of the work item's directory. Both are read from the worktree's top, as `inFolder` reads them. */
export function closingRecord(path: string, directory: string): boolean {
  const top = directory.split("\\").join("/").replace(/\/+$/u, "");
  return CLOSING_RECORDS.some((file) => path === `${top}/${file.split("\\").join("/")}`);
}

/**
 * Whether the broad gate holds at the branch's head: a run stands, and no
 * path but a closing record differs between the gate's commit and the head.
 * The two trees are compared, and no commit between them is walked, so a
 * merge, a decision's commit and an answer's commit after the gate's commit
 * each leave the gate owed again, and a commit that the next one reverts
 * leaves it holding.
 */
export function gateHolds(standing: Pick<Standing, "gateCommit" | "sinceGate" | "directory">): boolean {
  return standing.gateCommit !== null && standing.sinceGate.every((path) => closingRecord(path, standing.directory));
}

/**
 * The step a chain owes, from what the records and git say, and from nothing
 * else: the first of these that holds decides.
 *
 * - The record holds an `open` question: the chain is parked.
 * - No round record stands: round 1, on the branch against its base.
 * - The last record holds a finding with no close block, or a decision
 *   stands `reversed`: a fix pass on that record.
 * - The last record holds a `fixed` or `rejected` finding, or a commit after
 *   its target changed a path outside the work item's directory: a verifying
 *   round, on the commits after that target.
 * - The broad gate does not hold at the branch's head (`gateHolds`): the
 *   gate, on that head.
 * - The newest verdict block of the guarantee is no seal of the gate's
 *   commit: none stands, it reads `withheld` or `undecided`, or it names
 *   another commit. The seal, on the gate's commit.
 * - Otherwise the step is `sealed`, at the gate's commit.
 *
 * So no seal is asked for a commit other than the one the gate passed on,
 * and none while a decision stands `reversed` or a commit is unread.
 */
export function stepOwed(standing: Standing): Step {
  if (standing.openQuestion) return { is: "parked" };
  const last = standing.rounds.at(-1);
  if (last === undefined) return { is: "round", round: 1, target: `${standing.head} against ${standing.base}`, from: null };
  const open = last.findings.filter((finding) => finding.close === null).map((finding) => finding.number);
  if (open.length > 0 || standing.reversals.length > 0) return { is: "fix-pass", round: last.round, open, reversals: standing.reversals };
  const answered = last.findings.some((finding) => finding.close?.verdict === "fixed" || finding.close?.verdict === "rejected");
  const outside = standing.changed.some((path) => !inFolder(path, standing.directory));
  if (answered || outside) return { is: "round", round: last.round + 1, target: `${standing.head}, fixes ${last.target.commit}..${standing.head}`, from: last.target.commit };
  const gate = gateHolds(standing) ? standing.gateCommit : null;
  if (gate === null) return { is: "gate", round: last.round, head: standing.head };
  if (standing.sealCommit !== gate) return { is: "seal", round: last.round, commit: gate, run: standing.verdicts.length + 1 };
  return { is: "sealed", round: last.round, at: gate };
}

/** What a chain does before a fix pass: nothing, the orchestrator's judgment of whether the rounds are converging, or a stop at the ceiling of its rounds. */
export type Gate = "none" | "judgment" | "ceiling";

/** The stages at the end of a chain's that belong to the round's record: every stage after the round's own, where each is a fix pass, a judgment or a ruling of that round. */
function sinceRound(stages: readonly ChainStage[], round: number): ChainStage[] {
  let from = stages.length;
  while (from > 0 && stages[from - 1]?.round === round && stages[from - 1]?.kind !== "round") from -= 1;
  return stages.slice(from);
}

/** Whether a fix pass on the round's record already finished, by the chain's stored stages: the pass now owed is a second one on that record, which follows a question that was decided or answered. */
export function passedBefore(stages: readonly ChainStage[], round: number): boolean {
  return sinceRound(stages, round).some((stage) => stage.kind === "fix-pass" && stage.state === "finished");
}

/**
 * What a chain does before the fix pass on a round's record, from its
 * stored stages and from its run: the first of these that holds decides.
 *
 * - The record holds no open finding: nothing. The pass takes in a reversal
 *   alone, and the round left nothing to converge on.
 * - A fix pass on that record already finished: nothing. The gate was passed
 *   before that pass.
 * - The round is the ceiling or a later one: the chain stops and asks no
 *   judgment, but at the first step of a start a person's word made,
 *   whose start is the answer.
 * - The round is round 1: nothing. No record yet shows whether a fix held.
 * - This run asked the orchestrator after that round and was answered yes:
 *   nothing.
 * - The step is the first of a start a person's word made, and the
 *   chain's last stored stage is a judgment after that round that finished:
 *   nothing. The person read its answer and started the chain again.
 * - Otherwise the orchestrator's judgment.
 *
 * A ruling on a stage's questions is a stage of its own kind, so a chain
 * that stopped between such a ruling and the judgment of convergence it
 * owed is asked for that judgment at the person's next start.
 */
export function gateBefore({ round, open }: { round: number; open: readonly number[] }, stages: readonly ChainStage[], ceiling: number, run: { judged: boolean; first: boolean }): Gate {
  if (open.length === 0 || passedBefore(stages, round)) return "none";
  if (round >= ceiling) return run.first ? "none" : "ceiling";
  if (round < 2 || run.judged) return "none";
  const last = stages.at(-1);
  if (run.first && last?.kind === "judgment" && last.round === round && last.state === "finished") return "none";
  return "judgment";
}

/** A list of numbers as a sentence names them: `2`, `2 and 3`, `2, 3 and 5`. */
function listed(numbers: readonly number[]): string {
  const said = numbers.map(String);
  return said.length < 2 ? said.join("") : `${said.slice(0, -1).join(", ")} and ${said[said.length - 1] ?? ""}`;
}

/** The first refusal of a record the reader made, as the half of a sentence: `<the reader refuses> line 12 of <what>: <why>`, or with no line for a refusal of the record whole. Null where the reader refused nothing. */
function firstRefusal(record: Pick<RoundRecord, "refusals">, what: string): string | null {
  const [refusal] = record.refusals;
  if (refusal === undefined) return null;
  return `the reader refuses ${refusal.line === 0 ? "" : `line ${String(refusal.line)} of `}${what}: ${refusal.why}`;
}

/**
 * What the order reads of a work item, in its worktree: each round record of
 * the directory as the commit `head` holds it, the record of decisions and
 * questions where `decisionsAt` says, the base, which is the one round 1's
 * record names where the head holds that record and `base` otherwise, the
 * paths the commits after the last
 * record's target changed, the gate's commit with the paths that differ
 * between it and the head, from the gate's record as the commit `head`
 * holds it, and the verdicts of the guarantee as that commit holds it. A
 * round record that only the worktree holds is not read: a round reads a
 * committed tree, and the next round reads what a commit holds. The record
 * of decisions is read as the worktree holds it, committed or not, where
 * `decisionsAt` is `worktree`, which is how a chain's run reads it, and as
 * the commit `head` holds it where it is `head`, which is how the seal at
 * the head is read (`seal-state.ts`). It throws a `ChainStop` where a
 * round record the head holds does not read whole or names no target,
 * where its target names no commit, and where the reader refuses a line of
 * the gate's record or of the guarantee, with the file and the line, and what
 * `repository-file.ts#repositoryFileText` throws where the record of
 * decisions stands in the worktree and cannot be read.
 */
export async function standingOf(worktree: string, directory: string, head: string, base: string, decisionsAt: "worktree" | "head"): Promise<Standing> {
  const from = (path: string): string => relative(worktree, path);
  const folder = join(from(directory), ROUNDS_FOLDER);
  const numbered = (await filesAt(worktree, head, folder)).flatMap((path) => {
    const round = roundNumber(path.slice(path.lastIndexOf("/") + 1));
    return round === null ? [] : [{ round, path }];
  });
  numbered.sort((a, b) => a.round - b.round);
  const rounds: RoundStanding[] = [];
  for (const { round, path } of numbered) {
    const record = readRoundRecord((await fileAt(worktree, head, path)) ?? "");
    const refused = firstRefusal(record, path);
    if (refused !== null) throw new ChainStop(refused);
    if (record.target === null) throw new ChainStop(`${path} holds no round block`);
    rounds.push({ round, target: record.target, findings: record.findings });
  }
  const text = decisionsAt === "head" ? await fileAt(worktree, head, join(from(directory), RECORD_FILE)) : repositoryFileText(join(directory, RECORD_FILE));
  const decisions = text === null ? null : readDecisionRecord(text);
  const last = rounds.at(-1);
  let changed: string[] = [];
  if (last !== undefined) {
    if ((await commitNamed(worktree, last.target.commit)) === null) throw new ChainStop(`${join(folder, roundFile(last.round))} names the target ${last.target.commit}, and the repository holds no such commit`);
    changed = await pathsOfCommits(worktree, last.target.commit, head);
  }
  const gateFile = join(from(directory), GATE_FILE);
  const gate = readGate((await fileAt(worktree, head, gateFile)) ?? "");
  const unread = firstRefusal(gate, gateFile);
  if (unread !== null) throw new ChainStop(unread);
  const newest = gate.runs.at(-1);
  // A run that names a commit the repository does not hold is no run of this branch, and the gate is owed.
  const gateCommit = newest === undefined ? null : await commitNamed(worktree, newest.commit);
  const guaranteeFile = join(from(directory), GUARANTEE_FILE);
  const guarantee = readGuarantee((await fileAt(worktree, head, guaranteeFile)) ?? "");
  const unreadVerdict = firstRefusal(guarantee, guaranteeFile);
  if (unreadVerdict !== null) throw new ChainStop(unreadVerdict);
  const verdict = guarantee.verdicts.at(-1);
  return {
    rounds,
    openQuestion: decisions?.questions.some((question) => question.state.is === "open") ?? false,
    reversals: (decisions?.decisions ?? []).flatMap(({ id, decided, state }) => (state.is === "reversed" ? [{ id, decided, message: state.message }] : [])),
    head,
    // The base follows the records: once round 1's record stands, the base it names is the chain's, whatever the caller holds.
    base: rounds.find(({ round }) => round === 1)?.target.base ?? base,
    changed,
    directory: from(directory),
    gateCommit,
    sinceGate: gateCommit === null ? [] : await pathsBetween(worktree, gateCommit, head),
    verdicts: guarantee.verdicts,
    sealCommit: verdict?.is === "sealed" ? await commitNamed(worktree, verdict.commit) : null,
  };
}

// ---------------------------------------------------------------------------
// The routing a first start writes.

/**
 * The `routing.md` of a directory the daemon makes at the first start of a
 * work item's chain: the branch was built in the person's own session, so the
 * planner and the implementer are `the session`, and the work goes through
 * the review chain to a pull request. It holds the `Automation` row with
 * the answer given, which the chain command's `start` takes from a pane's
 * session, and no such row where none is given: nothing the daemon reads
 * says whether a run stops for a question, and the pull request check reads
 * the file as a declaration without the row.
 */
export function routingText(workItem: string, branch: string, date: string, automation: "yes" | "no" | null = null): string {
  return [
    `# Routing: ${workItem}`,
    "",
    "| Axis | Answer |",
    "|---|---|",
    "| Review | through the review chain |",
    `| Destination | ${OPEN_PULL_REQUEST} |`,
    "| Planning | the session |",
    "| Implementation | the session |",
    ...(automation === null ? [] : [`| Automation | ${automation} |`]),
    `| Branch | ${branch} |`,
    "",
    `Answered ${date} by Owlery, at the first start of the work item's chain.`,
    "",
    "## Why this way",
    "",
    `The branch was built in the person's own session, and its chain was started for a seal on it.${automation === null ? "" : " The session that started the chain gave the answer on \`Automation\`."}`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// The prompts.

/** A stage's prompt: what a window shows of it, and what the agent is given after that. */
export interface StagePrompt {
  shown: string;
  /** The reviewed commits' diff, which follows `shown` in what the agent is given. Empty where the stage is given none. */
  diff: string;
}

/** The whole of what a stage's agent is given. */
export function promptText(prompt: StagePrompt): string {
  return prompt.diff === "" ? prompt.shown : `${prompt.shown}\n${prompt.diff}`;
}

/** A diff as a stage's prompt carries it below what a window shows: under a line that says it is theirs, cut at `PROMPT_DIFF_CHARS` characters with a line that says how much of it stands, and nothing for an empty one. */
function diffGiven(diff: string): string {
  if (diff === "") return "";
  const head = diff.length > PROMPT_DIFF_CHARS ? `Their diff, its first ${String(PROMPT_DIFF_CHARS)} characters of ${String(diff.length)}. Read the files for the rest.` : "Their diff:";
  return `${head}\n\n${diff.slice(0, PROMPT_DIFF_CHARS)}`;
}

/** The heading a round's record opens with. */
export function roundHeading(round: number, workItem: string): string {
  return `# Review round ${String(round)}: ${workItem}`;
}

/**
 * A round's prompt: the round's number, the work item's directory, the
 * heading and the `target:` line its record carries, the paths of the
 * earlier round records, the path of the record of decisions where one
 * stands, the paths the reviewed commits changed, and their diff, cut at
 * `PROMPT_DIFF_CHARS` characters with a line that says so. Every path is
 * from the worktree's top, which is the session's folder.
 */
export function roundPrompt(given: { round: number; directory: string; target: string; earlier: readonly number[]; decisions: boolean; paths: readonly string[]; diff: string }): StagePrompt {
  const workItem = given.directory.slice(given.directory.lastIndexOf("/") + 1);
  const rounds = `${given.directory}/trail/rounds`;
  const shown = [
    `Review round ${String(given.round)} of the work item \`${workItem}\`, in this folder, which is the work item's worktree.`,
    "",
    `- The work item's directory: \`${given.directory}\``,
    `- Your record's heading: \`${roundHeading(given.round, workItem)}\``,
    `- Your record's target line: \`target: ${given.target}\``,
    given.earlier.length === 0 ? "- Earlier round records: none, this is the first round" : `- Earlier round records: ${given.earlier.map((round) => `\`${rounds}/${roundFile(round)}\``).join(", ")}`,
    ...(given.decisions ? [`- The decisions and the answers to hold to: \`${given.directory}/${RECORD_FILE}\``] : []),
    "",
    `Your answer is the round record, whole, from its heading to its end. Owlery writes it unchanged to \`${rounds}/${roundFile(given.round)}\` and commits it. Write no file and run no command: read the files of this folder.`,
    "",
    given.paths.length === 0 ? "The reviewed commits changed no path." : "The reviewed commits changed these paths:",
    ...given.paths.map((path) => `- \`${path}\``),
    "",
  ].join("\n");
  return { shown, diff: diffGiven(given.diff) };
}

/**
 * A fix pass's prompt: the path of the round record, the numbers of its open
 * findings, the decisions the person reversed with the person's message for
 * each, and the path of the record of decisions.
 */
export function fixPassPrompt(given: { round: number; directory: string; open: readonly number[]; reversals: readonly Reversal[] }): StagePrompt {
  const workItem = given.directory.slice(given.directory.lastIndexOf("/") + 1);
  const shown = [
    `The fix pass of review round ${String(given.round)} of the work item \`${workItem}\`, in this folder, which is the work item's worktree.`,
    "",
    `- The round record: \`${given.directory}/trail/rounds/${roundFile(given.round)}\``,
    `- Its open findings: ${given.open.length === 0 ? "none" : listed(given.open)}`,
    ...(given.reversals.length === 0 ? [] : ["- The decisions the person reversed, each to take in:", ...given.reversals.map((reversal) => `  - decision ${String(reversal.id)}, ${JSON.stringify(reversal.decided)}: the person says ${JSON.stringify(reversal.message)}`)]),
    `- The decisions and the answers to hold to: \`${given.directory}/${RECORD_FILE}\``,
    "",
    "Commit each fix yourself. Then append one close block under each finding you answer, and commit no change to the round record: Owlery commits the record after the pass.",
    "",
  ].join("\n");
  return { shown, diff: "" };
}

/** The role and the stage the sealer is launched as. */
export const SEALER: RoleStage = { role: "sealer", stage: "seal" };

/**
 * The seal's prompt: the sealer's run, the work item's directory, the
 * heading its section opens with and the `target:` line its verdict
 * carries, the paths of the routing, of every round record and of the
 * gate's record, the paths of the record of decisions, of the frame, of the
 * phase records and of the changelog fragment where each stands, that the
 * work item names no issue, the paths the branch changed, and their diff,
 * cut at `PROMPT_DIFF_CHARS` characters with a line that says so. Every
 * path is from the worktree's top, which is the session's folder.
 *
 * `earlier` is the seal a later commit broke, where the run follows one: its
 * run and its sealed commit, which the prompt names. The paths and the diff
 * are then what changed since that commit, and otherwise since the branch
 * left its base. The target line is the caller's either way, so the verdict
 * still names the gate's commit against the base.
 */
export function sealPrompt(given: { run: number; directory: string; target: string; rounds: readonly number[]; decisions: boolean; frame: boolean; phases: boolean; changelog: boolean; earlier: { run: number; commit: string } | null; paths: readonly string[]; diff: string }): StagePrompt {
  const workItem = given.directory.slice(given.directory.lastIndexOf("/") + 1);
  const since = given.earlier === null ? "since it left its base" : `since the commit run ${String(given.earlier.run)} sealed`;
  const shown = [
    `Run ${String(given.run)} of the sealer on the work item \`${workItem}\`, in this folder, which is the work item's worktree.`,
    "",
    `- The work item's directory: \`${given.directory}\``,
    `- Your section's heading: \`${runHeading(given.run)}\``,
    `- Your verdict's target line: \`target: ${given.target}\``,
    `- The routing: \`${given.directory}/routing.md\``,
    `- The round records, the oldest first: ${given.rounds.map((round) => `\`${given.directory}/trail/rounds/${roundFile(round)}\``).join(", ")}`,
    `- The broad gate's record: \`${given.directory}/trail/gate.md\``,
    ...(given.decisions ? [`- The decisions and the answers to hold to: \`${given.directory}/${RECORD_FILE}\``] : []),
    ...(given.frame ? [`- The frame: \`${given.directory}/frame/\``] : []),
    ...(given.phases ? [`- The phase records: \`${given.directory}/trail/phases/\``] : []),
    ...(given.changelog ? [`- The changelog fragment: \`${given.directory}/changelog.md\``] : []),
    "- The issue: the work item names none, so no issue's text is among what you read",
    ...(given.earlier === null ? [] : [`- The seal this run follows: run ${String(given.earlier.run)} of \`${given.directory}/${GUARANTEE_FILE}\` sealed \`${given.earlier.commit}\`, and a commit after it broke that seal`]),
    "",
    `Your answer is your run's section of the guarantee, whole, from its heading to its end, in the form of \`templates/records/sdd-guarantee.md\`. Its verdict block holds the target line above and one \`Verdict:\` line, and no other line: Owlery adds who built the work and who judged it, appends the section to \`${given.directory}/${GUARANTEE_FILE}\` and commits it. Write no file and run no command: read the files of this folder.`,
    "",
    given.paths.length === 0 ? `The branch changed no path ${since}.` : `The branch changed these paths ${since}:`,
    ...given.paths.map((path) => `- \`${path}\``),
    "",
  ].join("\n");
  return { shown, diff: diffGiven(given.diff) };
}

/** The role and the stage the orchestrator is launched as. */
export const ORCHESTRATOR: RoleStage = { role: "orchestrator", stage: "judgment" };

/**
 * The prompt of the judgment of convergence after a round: the round, the
 * work item's directory, the path of every round record, the path of the
 * record of decisions where one stands, and the form of the answer.
 */
export function convergencePrompt(given: { round: number; directory: string; rounds: readonly number[]; decisions: boolean }): StagePrompt {
  const workItem = given.directory.slice(given.directory.lastIndexOf("/") + 1);
  const shown = [
    `The judgment after review round ${String(given.round)} of the work item \`${workItem}\`, in this folder, which is the work item's worktree.`,
    "",
    `- The work item's directory: \`${given.directory}\``,
    `- The round records, the oldest first: ${given.rounds.map((round) => `\`${given.directory}/trail/rounds/${roundFile(round)}\``).join(", ")}`,
    ...(given.decisions ? [`- The decisions and the answers to hold to: \`${given.directory}/${RECORD_FILE}\``] : []),
    "",
    `Round ${String(given.round)} left a finding open, and a fix pass on its record is owed. Judge from the records whether the review rounds are converging. Your answer holds one \`seal\` block, written so:`,
    "",
    "```seal",
    "converging: <yes or no>",
    "grounds: <why, on one line>",
    "```",
    "",
    "Owlery records the answer as a decision made without asking. `yes` starts the fix pass, and `no` stops the chain for the person. Write no file and run no command: read the files of this folder.",
    "",
  ].join("\n");
  return { shown, diff: "" };
}

/**
 * The prompt of the judgment on the questions a stage asked: the round, the
 * work item's directory, the path of the record of decisions where one
 * stands, who asks and in which stage, each question under its number with
 * its grounds, its options and its default, and the form of the answer.
 */
export function rulingPrompt(given: { round: number; directory: string; by: string; asked: ChainStageKind; asks: readonly Ask[]; decisions: boolean }): StagePrompt {
  const workItem = given.directory.slice(given.directory.lastIndexOf("/") + 1);
  const stage = stageName(given.asked, given.round).replace(/^[A-Z]/u, (letter) => letter.toLowerCase());
  const shown = [
    `The judgment after review round ${String(given.round)} of the work item \`${workItem}\`, in this folder, which is the work item's worktree.`,
    "",
    `- The work item's directory: \`${given.directory}\``,
    ...(given.decisions ? [`- The decisions and the answers to hold to: \`${given.directory}/${RECORD_FILE}\``] : []),
    `- Who asks: the ${given.by}, in ${stage}`,
    "",
    given.asks.length === 1 ? "Its question:" : "Its questions:",
    "",
    ...given.asks.flatMap((ask, index) => [
      `${String(index + 1)}. ${ask.asks}`,
      `   - Why the ${given.by} cannot answer it: ${ask.grounds}`,
      ...ask.options.map((option) => `   - Option \`${option.label}\`${option.implies === "" ? "" : `: ${option.implies}`}`),
      ...(ask.default === null ? [] : [`   - Its default: \`${ask.default}\``]),
    ]),
    "",
    "Decide each question from the code and the policy, and park only one they cannot answer. Your answer holds one `seal` block for each question, written so:",
    "",
    "```seal",
    "rules: <the question's number> <default, scope, answered or park>",
    "decided: <what was decided, on one line; a park holds no such line>",
    "grounds: <why, on one line>",
    "```",
    "",
    "Owlery records each decision as one made without asking, and parks the work item with each question you park. Write no file and run no command: read the files of this folder.",
    "",
  ].join("\n");
  return { shown, diff: "" };
}

// ---------------------------------------------------------------------------
// The reading of a stage's answer.

/** A question a stage asks in its answer. */
export interface Ask {
  asks: string;
  grounds: string;
  options: { label: string; implies: string }[];
  default: string | null;
}

/** The question of a sealer's `undecided` verdict as a stage's question: the verdict's question, grounds that name the run of the guarantee it stands in, and no option. */
export function undecidedAsk(run: number, question: string): Ask {
  return { asks: question, grounds: `The sealer asked it in place of a verdict, in run ${String(run)} of ${GUARANTEE_FILE}.`, options: [], default: null };
}

/** The question of a sealer's `undecided` verdict that parks the work item with no ruling asked: its grounds also say that the guarantee already holds as many such verdicts as the daemon asks a ruling for. */
export function undecidedParked(ask: Ask, ceiling: number): Ask {
  return { ...ask, grounds: `${ask.grounds} The guarantee already holds ${ceiling === 1 ? "one verdict" : `${String(ceiling)} verdicts`} that asked, and Owlery asks the orchestrator for a ruling on no more than that.` };
}

/** The orchestrator's ruling on one question: a decision of its kind, or a park. `question` is the question's number in the prompt, from 1. */
export type Ruling = { question: number; is: "default" | "scope" | "answered"; decided: string; grounds: string } | { question: number; is: "park"; grounds: string };

/**
 * The blocks of one kind an answer holds, in its order. An answer is prose
 * around its blocks, so what the reader says of the rest of it is not read:
 * another `seal` block, a comment's line, a fence it cannot place. It throws
 * a `ChainStop` where the reader refuses a block that opens as this kind
 * does, with the line and the reader's reason.
 */
function blocksOf(answer: string, kind: Kind, what: string): Block[] {
  const got = read(answer, [kind]);
  const lines = gfmLines(answer);
  const refused = got.refusals.find(({ block }) => {
    const head = block === null ? "" : (lines[block] ?? "");
    return head === kind.opener || head.startsWith(`${kind.opener} `);
  });
  if (refused !== undefined) throw new ChainStop(`the reader refuses line ${String(refused.line)} of ${what}: ${refused.why}`);
  return got.blocks;
}

/**
 * The questions a stage's answer asks, each an `asks:` block, in the
 * answer's order. A question written in prose is none: it stays in the
 * answer, which the work item's view shows. A proofer's stand above its
 * record's heading: the record's reader refuses a record that holds one
 * (`roundRecordOf`). It throws a `ChainStop` where the reader refuses an
 * `asks:` block.
 */
export function asksOf(answer: string): Ask[] {
  return blocksOf(answer, ASK_BLOCK, "its answer's question").map((block) => ({
    asks: field(block, "asks:")?.value ?? "",
    grounds: field(block, "grounds:")?.value ?? "",
    options: (block.fields.get("option:") ?? []).map((option) => ({ label: option.groups.label ?? "", implies: option.groups.implies ?? "" })),
    default: field(block, "default:")?.groups.label ?? null,
  }));
}

/**
 * The orchestrator's judgment of whether the rounds are converging, from
 * its answer's one `converging:` block. It throws a `ChainStop` where the
 * reader refuses such a block, and where the answer holds none or more than
 * one.
 */
export function convergenceOf(answer: string): { converging: boolean; grounds: string } {
  const blocks = blocksOf(answer, CONVERGENCE_BLOCK, "its judgment");
  const [block] = blocks;
  if (block === undefined) throw new ChainStop("its answer holds no judgment: no `seal` block of it opens with `converging:`");
  if (blocks.length > 1) throw new ChainStop(`its answer holds ${String(blocks.length)} blocks that open with \`converging:\`, and a judgment is one`);
  return { converging: field(block, "converging:")?.value === "yes", grounds: field(block, "grounds:")?.value ?? "" };
}

/**
 * The orchestrator's rulings on the questions it was given, numbered from 1
 * to `questions`, in the questions' order. It throws a `ChainStop` where the
 * reader refuses a `rules:` block, where a ruling names a number that is no
 * question's, where two name one question, and where a question has none.
 */
export function rulingsOf(answer: string, questions: number): Ruling[] {
  const rulings = new Map<number, Ruling>();
  for (const block of blocksOf(answer, RULING_BLOCK, "its ruling")) {
    const { question: digits = "", ruling = "" } = field(block, "rules:")?.groups ?? {};
    const question = Number(digits);
    if (question > questions) throw new ChainStop(`its answer rules on question ${digits}, and it was given ${questions === 1 ? "one question" : `${String(questions)} questions`}`);
    if (rulings.has(question)) throw new ChainStop(`its answer rules on question ${digits} twice`);
    const grounds = field(block, "grounds:")?.value ?? "";
    rulings.set(question, ruling === "park" ? { question, is: "park", grounds } : { question, is: ruling as "default" | "scope" | "answered", decided: field(block, "decided:")?.value ?? "", grounds });
  }
  const asked = Array.from({ length: questions }, (_, index) => index + 1);
  const unruled = asked.filter((question) => !rulings.has(question));
  if (unruled.length > 0) throw new ChainStop(`its answer holds no ruling on ${unruled.length === 1 ? "question" : "questions"} ${listed(unruled)}: no \`seal\` block of it opens with \`rules: ${String(unruled[0] ?? 0)} \``);
  return asked.flatMap((question) => rulings.get(question) ?? []);
}

/** What the daemon records of the judgment of convergence, as a decision's text. */
export function convergenceDecided(round: number, converging: boolean): string {
  return converging ? `The review rounds are converging after round ${String(round)}, so the fix pass on its record runs.` : `The review rounds are not converging after round ${String(round)}, so the chain stops for the person.`;
}

/** The grounds of a question the orchestrator parked: the asking stage's own, then why the code and the policy do not answer it. */
export function parkedGrounds(ask: Ask, ruling: Extract<Ruling, { is: "park" }>): string {
  return `${ask.grounds} The code and the policy do not decide it: ${ruling.grounds}`;
}

// ---------------------------------------------------------------------------
// The calls a role's rule refused.

/** One call of a stage's session that its role's rule refused: the tool's name, what the call does and the rule's name, and nothing of the call's text. */
export interface RefusedCall {
  tool: string;
  action: PermissionAction;
  rule: RefusalRule;
}

/** The refused calls of one stage, with the stage and its role. */
export interface StageRefusals {
  kind: ChainStageKind;
  round: number;
  role: string;
  calls: readonly RefusedCall[];
}

/** A kind of a stage as a row of the refusals names it: `fix pass` for `fix-pass`, and the kind's own word for every other. */
function kindCell(kind: ChainStageKind): string {
  return kind === "fix-pass" ? "fix pass" : kind;
}

/** A stage as a row of the refusals names it: `round 2`, `fix pass 1`, `judgment 2`, `ruling 2`, `seal 2`. */
function stageCell(kind: ChainStageKind, round: number): string {
  return `${kindCell(kind)} ${String(round)}`;
}

/** The stage a row's cell names, as `stageCell` writes it, or null where it names none. */
function cellStage(cell: string): { kind: ChainStageKind; round: number } | null {
  const [, word, digits] = /^(.+) (0|[1-9][0-9]*)$/u.exec(cell) ?? [];
  const kind = CHAIN_STAGE_KINDS.find((each) => kindCell(each) === word);
  return kind === undefined || digits === undefined ? null : { kind, round: Number(digits) };
}

/** The heading row and the delimiter row of the table `refusalsText` writes. */
const REFUSALS_HEAD = ["| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|"];

/** What a call does, as a row of the refusals says it. */
const CALL_DOES: Record<PermissionAction, string> = { read: "reads a file", write: "writes a file", run: "runs a command", other: "something else" };

/** A tool's name as a table's cell holds it: on one line, with no `|` that would end the cell, and 100 characters of it at most. The name is the agent's own word for its tool. */
function toolCell(tool: string): string {
  return [...tool.replace(/\s+/gu, " ").replaceAll("|", "/").trim()].slice(0, 100).join("");
}

/**
 * The text of a work item's `trail/refusals.md` with one row more for each
 * call given, in their order: a heading and one table of the columns
 * `Stage`, `Role`, `Tool`, `What the call does` and `Rule`. `before` is the
 * file as it stands, or null where none does. No row holds the call's text,
 * a path or a command.
 */
export function refusalsText(before: string | null, workItem: string, refused: StageRefusals): string {
  const head = [`# Refused calls: ${workItem}`, "", ...REFUSALS_HEAD, ""].join("\n");
  const stood = before ?? head;
  const rows = refused.calls.map((call) => `| ${stageCell(refused.kind, refused.round)} | ${refused.role} | ${toolCell(call.tool)} | ${CALL_DOES[call.action]} | ${call.rule} |\n`);
  return `${stood}${stood.endsWith("\n") ? "" : "\n"}${rows.join("")}`;
}

/**
 * The refused calls a work item's `trail/refusals.md` holds, as
 * `refusalsText` writes them: each row's stage, the kind and the round its
 * cell names as `stageCell` writes it, and its rule's name, in the file's
 * order, and how many rows were not read. A line that opens with `|` and is
 * neither the heading row nor the delimiter row is a row. A row that does not hold the five cells, whose stage is none
 * `stageCell` writes, or whose rule is none of `REFUSAL_RULES`, is counted as
 * not read and gives nothing.
 */
export function readRefusals(text: string): { refusals: { kind: ChainStageKind; round: number; rule: RefusalRule }[]; unread: number } {
  const refusals: { kind: ChainStageKind; round: number; rule: RefusalRule }[] = [];
  let unread = 0;
  for (const line of text.split("\n").map((each) => each.replace(/\r$/u, ""))) {
    if (!line.startsWith("|") || REFUSALS_HEAD.includes(line)) continue;
    const cells = line.endsWith("|") ? line.slice(1, -1).split("|").map((cell) => cell.trim()) : [];
    const [cell = "", , , , rule = ""] = cells;
    const stage = cellStage(cell);
    const known = REFUSAL_RULES.find((each) => each === rule);
    if (cells.length !== 5 || stage === null || known === undefined) unread += 1;
    else refusals.push({ ...stage, rule: known });
  }
  return { refusals, unread };
}

/** Every reference a record makes to an earlier record: its `confirms:` lines, and each finding's `reopens:` and `regression:` lines, in the record's order. */
function references(record: RoundRecord): Reference[] {
  return [...record.confirmations, ...record.findings.flatMap((finding) => [finding.reopens, finding.regression].filter((reference) => reference !== null))].sort((a, b) => a.line - b.line);
}

/**
 * The round record a proofer's answer holds: the answer from its first line
 * that opens with `# Review round ` to its end, unchanged. It throws a
 * `ChainStop`, which says which, where the answer holds no such line, where
 * that heading names another round or another directory, where the reader
 * refuses a line, where the `target:` line is not the one the prompt gave,
 * where a finding holds a close block, where a `confirms:`, a `reopens:` or
 * a `regression:` line names anything in the first record, a round that is
 * no earlier record of the work item, or a finding the record it names
 * does not hold, and, in a verifying round, where a `fixed` or `rejected`
 * finding of the record before it is named by no such line. `earlier` are
 * the records the branch's head holds, the lowest round first, each read
 * whole (`standingOf`), so its findings are every finding it holds. The
 * rules on a reference are `channel`'s of
 * `pr-check/skills/code-review/scripts/chain_check.py`.
 */
export function roundRecordOf(answer: string, given: { round: number; workItem: string; target: string; earlier: readonly RoundStanding[] }): string {
  const heading = roundHeading(given.round, given.workItem);
  const lines = answer.split("\n");
  const at = lines.findIndex((line) => line.startsWith("# Review round "));
  if (at === -1) throw new ChainStop(`its answer holds no round record: no line of it reads \`${heading}\``);
  const headed = (lines[at] ?? "").replace(/\r$/u, "");
  if (headed !== heading) throw new ChainStop(`its record is headed \`${headed}\`, and the round was given \`${heading}\``);
  const text = lines.slice(at).join("\n");
  const record = readRoundRecord(text);
  const refused = firstRefusal(record, "its record");
  if (refused !== null) throw new ChainStop(refused);
  if (record.target?.said !== given.target) throw new ChainStop(`its record's target line reads \`${record.target?.said ?? ""}\`, and the round was given \`${given.target}\``);
  const closed = record.findings.find((finding) => finding.close !== null);
  if (closed !== undefined) throw new ChainStop(`its record holds a close block under finding ${String(closed.number)}, and a round writes none: the fix pass closes a finding`);
  const named = references(record);
  for (const reference of named) {
    const said = `its record names \`round-${String(reference.round)}${reference.finding === null ? "" : `#${String(reference.finding)}`}\` at line ${String(reference.line)}`;
    if (given.earlier.length === 0) throw new ChainStop(`${said}, and the first record names no earlier round: what it confirms is prose`);
    const holder = given.earlier.find((each) => each.round === reference.round);
    if (holder === undefined) throw new ChainStop(`${said}, which is not an earlier record of this work item`);
    if (reference.finding !== null && !holder.findings.some((finding) => finding.number === reference.finding)) throw new ChainStop(`${said}, and ${roundFile(reference.round)} holds no finding ${String(reference.finding)}`);
  }
  const before = given.earlier.at(-1);
  if (before !== undefined) {
    const unnamed = before.findings.filter((finding) => (finding.close?.verdict === "fixed" || finding.close?.verdict === "rejected") && !named.some((reference) => reference.round === before.round && reference.finding === finding.number)).map((finding) => finding.number);
    if (unnamed.length > 0) {
      throw new ChainStop(`its record names no \`confirms:\`, \`reopens:\` or \`regression:\` line for ${unnamed.length === 1 ? "finding" : "findings"} ${listed(unnamed)} of round ${String(before.round)}, which the fix pass closed`);
    }
  }
  return text;
}

/** The lines of `after` that are blank and stand directly above or below one of the blocks, with no other line between. */
function padding(lines: readonly string[], blocks: readonly Close[]): Set<number> {
  const found = new Set<number>();
  for (const block of blocks) {
    for (let index = block.line - 2; index >= 0 && stripped(lines[index] ?? "") === ""; index -= 1) found.add(index);
    for (let index = block.end; index < lines.length && stripped(lines[index] ?? "") === ""; index += 1) found.add(index);
  }
  return found;
}

/** A close block a fix pass appended: its finding's number, the paths the finding's own `location:` names, and the block. */
export interface ClosedFinding {
  finding: number;
  located: string[];
  close: Close;
}

/**
 * What a fix pass left of a round record, read against the record as it was
 * committed before the pass: the close blocks the pass appended, each with
 * its finding's number and places, and the numbers of the findings still open. It
 * throws a `ChainStop` where the record differs from the committed one by
 * more than close blocks, each under a finding that was open, and the blank
 * lines around them, and where the reader refuses a line.
 */
export function fixPassRecord(before: string, after: string): { closes: ClosedFinding[]; open: number[] } {
  const was = readRoundRecord(before);
  const now = readRoundRecord(after);
  const refused = firstRefusal(now, "the round record it left");
  if (refused !== null) throw new ChainStop(refused);
  const wasOpen = new Set(was.findings.filter((finding) => finding.close === null).map((finding) => finding.number));
  const closes = now.findings.flatMap((finding) => (finding.close !== null && wasOpen.has(finding.number) ? [{ finding: finding.number, located: finding.located, close: finding.close }] : []));
  const committed = gfmLines(before);
  const left = gfmLines(after);
  const appended = new Set<number>();
  for (const { close } of closes) for (let index = close.line - 1; index < close.end; index += 1) appended.add(index);
  const around = padding(left, closes.map(({ close }) => close));
  let next = 0;
  for (const [index, line] of left.entries()) {
    if (appended.has(index)) continue;
    if (next < committed.length && committed[next] === line) next += 1;
    else if (!around.has(index)) throw new ChainStop(`the round record it left differs from the committed one at line ${String(index + 1)} by more than a close block`);
  }
  if (next < committed.length) throw new ChainStop(`the round record it left lacks line ${String(next + 1)} of the committed one`);
  return { closes, open: now.findings.filter((finding) => finding.close === null).map((finding) => finding.number) };
}

/**
 * Whether a path a commit changed is a place a `location:` line names, or
 * lies under it, as `under` of
 * `pr-check/skills/code-review/scripts/chain_check.py` reads the two: the
 * place as the record writes it, its trailing `/` dropped. A place written
 * with a `\` names no path git prints with a `/`.
 */
function underPlace(path: string, place: string): boolean {
  const stem = place.replace(/\/+$/u, "");
  return path === stem || path.startsWith(`${stem}/`);
}

/**
 * Holds each `fixed <commit>` a fix pass wrote to the branch: the commit is
 * one the branch's head holds and the round's target does not, so it is a
 * commit of the pass or of an earlier one, which the next round reads, and
 * it changed a path the finding's `location:` or the close block's names,
 * or a path under one, as `verdict_problems` of
 * `pr-check/skills/code-review/scripts/chain_check.py` asks. It throws a
 * `ChainStop` that names the first finding whose commit does not hold.
 */
export async function fixedCommitsHeld(worktree: string, closes: readonly ClosedFinding[], head: string, target: string): Promise<void> {
  for (const { finding, located, close } of closes) {
    // Only a `fixed` verdict names a commit.
    if (close.commit === null) continue;
    const commit = await commitNamed(worktree, close.commit);
    if (commit === null || !(await holdsCommit(worktree, head, commit))) throw new ChainStop(`finding ${String(finding)} is closed \`fixed ${close.commit}\`, and the branch holds no such commit`);
    if (await holdsCommit(worktree, target, commit)) throw new ChainStop(`finding ${String(finding)} is closed \`fixed ${close.commit}\`, and the round's target already held that commit`);
    const places = [...located, ...close.located];
    const changed = await pathsOfCommit(worktree, commit);
    if (!changed.some((path) => places.some((place) => underPlace(path, place)))) {
      throw new ChainStop(`finding ${String(finding)} is closed \`fixed ${close.commit}\`, and that commit changed no path its \`location:\` lines name: a fix that went elsewhere names its path on a \`location:\` line of the close block`);
    }
  }
}

/** What a fix pass that leaves findings open is stopped with. */
export function leftOpen(open: readonly number[]): string {
  return `it left ${open.length === 1 ? "finding" : "findings"} ${listed(open)} open and raised no question`;
}

/** What a second fix pass on one record that leaves findings open is stopped with, whatever it asks: the pass before it left them open too, and its question was decided or answered. */
export function leftOpenAgain(open: readonly number[]): string {
  return `it left ${open.length === 1 ? "finding" : "findings"} ${listed(open)} open, as the fix pass before it on this record did`;
}

// ---------------------------------------------------------------------------
// The chain as the store keeps it.

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

function isGateRun(value: unknown): value is GateRun {
  return isRecord(value) && typeof value.command === "string" && isNumberOrNull(value.exitCode) && typeof value.output === "boolean";
}

/** A stage as a file holds one: one written before a chain ran a broad gate has no `gate`. */
type WrittenStage = Omit<ChainStage, "gate"> & { gate?: GateRun | null };

function isChainStage(value: unknown): value is WrittenStage {
  return (
    isRecord(value) &&
    CHAIN_STAGE_KINDS.includes(value.kind as ChainStageKind) &&
    typeof value.round === "number" &&
    ["working", "finished", "failed"].includes(value.state as string) &&
    isTextOrNull(value.failure) &&
    typeof value.startedAt === "number" &&
    isNumberOrNull(value.endedAt) &&
    isNumberOrNull(value.headlessId) &&
    typeof value.refusals === "number" &&
    (value.gate === undefined || value.gate === null || isGateRun(value.gate))
  );
}

/**
 * A chain as a file holds one: one written before a chain kept the time of
 * its state has no `since`, and its stages are as a file holds them. A build
 * before the seal rested a chain `reviewed` once its broad gate held, with
 * the head it rested at as `reviewedAt`, and wrote that field, null, on
 * every other chain. An earlier build of this release rested a chain
 * `sealed` where it now rests `rested`.
 */
export type WrittenChain = Omit<Chain, "since" | "stages" | "state"> & { state: Chain["state"] | "sealed" | "reviewed"; reviewedAt?: string | null; since?: number; stages: WrittenStage[] };

/** The states a chain's file may hold: this build's, and `sealed` and `reviewed`, which earlier builds wrote. */
const WRITTEN_STATES: readonly string[] = ["running", "parked", "stopped", "rested", "sealed", "reviewed"];

/**
 * Whether a value is a chain as the store writes one, or as an earlier
 * build wrote one: before a chain kept the time of its state, and before
 * the seal. A chain that this guard refused would fail the guard of its
 * whole file, and the store would then hold no repository.
 */
export function isChain(value: unknown): value is WrittenChain {
  return (
    isRecord(value) &&
    WRITTEN_STATES.includes(value.state as string) &&
    typeof value.says === "string" &&
    (value.reviewedAt === undefined || isTextOrNull(value.reviewedAt)) &&
    Array.isArray(value.stages) &&
    value.stages.every(isChainStage) &&
    (value.since === undefined || typeof value.since === "number")
  );
}

/**
 * Only the fields of a chain, each stage a copy, with no run of a broad
 * gate where it was written with none. A chain written with no `since`
 * takes the end of its newest stage, the start of that stage where it did
 * not end, and 0 where it holds no stage. A chain an earlier build stored
 * `reviewed` or `sealed` is no chain of this build, and is read as none.
 * `reviewed` said that nothing was owed, and a seal now is. `sealed` said
 * that the branch was sealed, and stayed so after a later commit broke the
 * seal, which `WorkItem.seal` now says from the branch's head. The next
 * start reads the step owed from the records.
 */
export function chainOf(chain: WrittenChain): Chain | null {
  if (chain.state === "reviewed" || chain.state === "sealed") return null;
  const newest = chain.stages.at(-1);
  return {
    state: chain.state,
    says: chain.says,
    stages: chain.stages.map(({ kind, round, state, failure, startedAt, endedAt, headlessId, refusals, gate }) => ({ kind, round, state, failure, startedAt, endedAt, headlessId, refusals, gate: gate ? { command: gate.command, exitCode: gate.exitCode, output: gate.output } : null })),
    since: chain.since ?? newest?.endedAt ?? newest?.startedAt ?? 0,
  };
}

/** Why a stage that was working when the daemon ended failed. */
export const DAEMON_ENDED = "the daemon ended while the stage ran";

/**
 * A chain as the store reads it at the daemon's start: only the fields of a
 * chain, each stage naming no headless session, since the next daemon gives
 * that session's id to another. A chain an earlier build stored `reviewed`
 * or `sealed` is read as none (`chainOf`). A chain stored `running` is read as
 * `stopped`: its stage's session ended with the daemon that started it, and
 * nothing starts a stage but a start of the chain. Its sentence says that the daemon
 * ended while the stage ran, the stage that was working is `failed`, and
 * the chain is stopped since `now`, the clock of the daemon that reads it:
 * nothing holds when the daemon before it ended.
 */
export function chainRead(chain: WrittenChain | null | undefined, now: number): Chain | null {
  const copy = chain === undefined || chain === null ? null : chainOf(chain);
  if (copy === null) return null;
  const stages = copy.stages.map((stage): ChainStage => ({ ...stage, headlessId: null }));
  const read: Chain = { ...copy, stages };
  if (read.state !== "running") return read;
  const working = stages.find((stage) => stage.state === "working");
  if (working !== undefined) Object.assign(working, { state: "failed", failure: DAEMON_ENDED });
  return { ...read, state: "stopped", since: now, says: working === undefined ? "The daemon ended while the chain ran." : `The daemon ended while ${stageName(working.kind, working.round).replace(/^[A-Z]/u, (letter) => letter.toLowerCase())} ran.` };
}
