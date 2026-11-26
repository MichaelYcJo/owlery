// What turns a stage's answer into a committed record of a work item, and
// what a stage is handed before it runs. Two callers share it: the daemon's
// chain (`Daemon#runChain`), whose stages are headless sessions, and the
// chain command (`chain-command.ts`), which a pane's session calls with each
// role's answer. So a record is written under one set of checks whoever ran
// the stage, and the daemon's reader of a seal and the pull request check
// read the same records from both (docs/architecture.md, "Records are
// committed to the repository").
//
// The module runs no session and no command, keeps no stage and no ledger,
// and reads no stored work item: it is given a worktree, the work item's
// directory, the standing the order was read from and the answer. Each
// refusal is thrown as a `ChainStop`, with nothing written, unless the
// function says otherwise.
import { existsSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  type Ask,
  BUILT_BY_TRAILER,
  type ChainBase,
  ChainStop,
  GATE_SUBJECT,
  REFUSALS_FILE,
  ROUNDS_FOLDER,
  type StagePrompt,
  type StageRefusals,
  type Standing,
  type Step,
  VERDICT_SUBJECT,
  asksOf,
  fixPassPrompt,
  fixPassRecord,
  fixedCommitsHeld,
  inFolder,
  refusalsText,
  roundFile,
  roundPrompt,
  roundRecordOf,
  routingText,
  sealPrompt,
} from "./chain";
import { RECORD_FILE, ROUTING_FILE, routingAnswer, withApplied, workItemDirectories, writeRecord } from "./decision-record";
import { THE_SESSION, isSessionId } from "./record-blocks";
import { writeRecordFile } from "./record-writer";
import { readRecordsPlace, rootOf } from "./records-place";
import { repositoryFileText } from "./repository-file";
import { GATE_FILE, GUARANTEE_FILE, type Verdict, gateText, guaranteeText, readGuarantee, sectionOf } from "./seal-records";
import { type CommitBounds, commitPaths, diffBetween, fileAt, holdsCommit, slugFor, trailerValues, uncommittedPaths, worktreeHead } from "./worktrees";

/** Where a work item's records are written: its worktree, the branch the worktree is on, and the work item's directory, a folder of the worktree; and the bounds of each commit made there (`worktrees.ts#commitPaths`), the default limit and no signal where none are given. */
export interface Place {
  worktree: string;
  branch: string;
  directory: string;
  bounds?: CommitBounds;
}

/**
 * Runs what writes or commits in a worktree in its turn. The daemon gives its
 * queue of the worktree's commits, so a record's commit follows every commit
 * of a person's word that was asked for there. The chain command gives none,
 * and the act then runs at once: nothing else of its process commits.
 */
export type InTurn = <T>(act: () => Promise<T>) => Promise<T>;

const AT_ONCE: InTurn = (act) => act();

/**
 * Makes one commit of a chain in a work item's worktree: it runs `write`,
 * appends one row to `trail/refusals.md` for each call the stage's role's
 * rule refused (`chain.ts#refusalsText`), then commits the files given, each
 * a file of the work item's directory, with the work item's record of
 * decisions and its refusals where each stands, together and nothing else
 * (`worktrees.ts#commitPaths`) under the place's bounds, with the subject given, the trailer
 * `Seal-Routing:` that names the directory, and below it each trailer the
 * stage gives. It throws a `ChainStop` with what a write refused, or with
 * git's first words where the commit failed, a hook's refusal among them:
 * the files then stand written and not committed.
 */
export function commitRecords(place: Place, files: readonly [string, ...string[]], subject: string, stage: { write?: () => void; refused?: StageRefusals; trailers?: readonly string[] } = {}, inTurn: InTurn = AT_ONCE): Promise<void> {
  const { worktree, branch, directory, bounds } = place;
  return inTurn(async () => {
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
      await commitPaths(worktree, branch, [first ?? "", ...others], subject, [`Seal-Routing: ${basename(directory)}`, ...(stage.trailers ?? [])], bounds);
    } catch (error) {
      const [said] = (error instanceof Error ? error.message : String(error)).split("\n");
      throw new ChainStop(`${relative(worktree, files[0])} was written and not committed: ${said ?? ""}`);
    }
  });
}

/** Throws a `ChainStop` where the worktree holds a change no commit holds, or an untracked file, outside the work item's directory. */
export async function noChangeOutside(worktree: string, directory: string): Promise<void> {
  const inside = relative(worktree, directory);
  const loose = (await uncommittedPaths(worktree)).filter((path) => !inFolder(path, inside));
  if (loose.length > 0) throw new ChainStop(`the worktree holds a change no commit holds outside the work item's directory, at ${loose[0] ?? ""}${loose.length > 1 ? ` and ${String(loose.length - 1)} more` : ""}`);
}

/** Why a broad gate cannot run on the worktree as the head's tree, as the second half of a sentence, or null where it can: the worktree holds a change no commit holds, or an untracked file, outside the work item's directory. */
export async function looseOutside(worktree: string, directory: string): Promise<string | null> {
  try {
    await noChangeOutside(worktree, directory);
    return null;
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    return error.message;
  }
}

/**
 * The work item's directory in a worktree, for a chain: the one whose
 * `routing.md` names the branch. Where none does, it makes one,
 * `<root>/threads/<seconds>-<slug>/`, from the clock given in whole seconds
 * and the slug of the branch's last part, writes its `routing.md`
 * (`chain.ts#routingText`), with the `Automation` row where an answer is
 * given, through the writer of a work item's records and commits that file
 * alone, under the bounds given, so the first round's target holds it. It throws
 * a `ChainStop` where two directories name the branch, where the worktree
 * holds no records root, where the new directory's name is taken, and what
 * the writer and the commit throw. A directory whose routing does not read
 * as naming the branch, as for a branch's name with a `|` in it, is found by
 * no later step, and the chain then stops on the taken name.
 */
export async function declaredDirectory(worktree: string, branch: string, now: number, inTurn: InTurn = AT_ONCE, automation: "yes" | "no" | null = null, bounds: CommitBounds = {}): Promise<string> {
  const directories = workItemDirectories(worktree, branch);
  const [found] = directories;
  if (directories.length > 1) throw new ChainStop(`two directories of the worktree's records name the branch ${branch}`);
  if (found !== undefined) return found;
  const root = rootOf(worktree);
  if (root === null) throw new ChainStop("the worktree holds no place for work records");
  const name = `${String(Math.floor(now / 1000))}-${slugFor(branch.slice(branch.lastIndexOf("/") + 1)) || "work-item"}`;
  const directory = join(worktree, root, "threads", name);
  const file = join(directory, ROUTING_FILE);
  if (existsSync(directory)) throw new ChainStop(`${relative(worktree, directory)} stands already, and its routing names another branch`);
  const at = new Date(now);
  // The day as the person's own clock has it, which is the day the chain first started.
  const text = routingText(name, branch, `${String(at.getFullYear())}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`, automation);
  await commitRecords({ worktree, branch, directory, bounds }, [file], "chore: declare the work item's routing", { write: () => writeRecordFile(worktree, file, text) }, inTurn);
  return directory;
}

// ---------------------------------------------------------------------------
// A review round.

/**
 * A round's prompt (`chain.ts#roundPrompt`): the round's target, the paths
 * the reviewed commits changed and their diff. Round 1 reads the branch from
 * where it left its base, and a verifying round the commits after the last
 * record's target.
 */
export async function roundStage(place: Place, standing: Standing, step: Extract<Step, { is: "round" }>, base: ChainBase): Promise<StagePrompt> {
  const { paths, text } = await diffBetween(place.worktree, step.from ?? base.reads, standing.head, step.from === null);
  return roundPrompt({ round: step.round, worktree: place.worktree, directory: standing.directory, target: step.target, earlier: standing.rounds.map(({ round }) => round), decisions: existsSync(join(place.directory, RECORD_FILE)), paths, diff: text });
}

/**
 * Writes a proofer's answer as its round's record: it takes the record from
 * the answer (`chain.ts#roundRecordOf`), writes it unchanged to
 * `trail/rounds/round-<N>.md` and commits it, where the worktree's head is
 * still the round's target and the worktree holds no change outside the work
 * item's directory. Where one of those does not hold, or the reader refuses
 * the record, nothing is written. It gives the questions the answer asks
 * above its record (`chain.ts#asksOf`), and an `asks:` block the reader
 * refuses is refused here as well.
 */
export async function recordRound(place: Place, standing: Standing, step: Extract<Step, { is: "round" }>, answer: string, refused?: StageRefusals, inTurn: InTurn = AT_ONCE): Promise<Ask[]> {
  const { worktree, directory } = place;
  const file = join(directory, ROUNDS_FOLDER, roundFile(step.round));
  const record = roundRecordOf(answer, { round: step.round, workItem: basename(directory), target: step.target, earlier: standing.rounds });
  // The record's reader refused a record that holds an `asks:` block, so each question stands above the record's heading.
  const asks = asksOf(answer);
  const head = await worktreeHead(worktree);
  if (head !== standing.head) throw new ChainStop(`the worktree's head moved during the round, from ${standing.head.slice(0, 7)} to ${head.slice(0, 7)}, so the round read another tree than its target`);
  await noChangeOutside(worktree, directory);
  await commitRecords(place, [file], `chore: record review round ${String(step.round)}`, { write: () => writeRecordFile(worktree, file, record), refused }, inTurn);
  return asks;
}

// ---------------------------------------------------------------------------
// A fix pass.

/** A fix pass's prompt (`chain.ts#fixPassPrompt`), and the round record as the commit the order was read at holds it, which the pass's record is read against. */
export async function fixPassStage(place: Place, standing: Standing, step: Extract<Step, { is: "fix-pass" }>): Promise<{ prompt: StagePrompt; committed: string }> {
  const file = join(place.directory, ROUNDS_FOLDER, roundFile(step.round));
  const committed = (await fileAt(place.worktree, standing.head, relative(place.worktree, file))) ?? "";
  return { prompt: fixPassPrompt({ round: step.round, worktree: place.worktree, directory: standing.directory, open: step.open, reversals: step.reversals }), committed };
}

/**
 * Commits the round record a fix pass left: the record is read in the
 * worktree and committed where it differs from `committed`, the one
 * committed before the pass, by close blocks alone, the reader refuses no
 * line, each `fixed <commit>` names a commit the branch's head holds and the
 * round's target does not, which changed a path its finding's `location:`
 * or its close block's names, and the worktree holds no change outside the
 * work item's directory. Where one does not hold, nothing is committed. The
 * record's commit carries each decision the step gave as reversed, written
 * `applied` with the branch's head after the pass, and the trailer
 * `Seal-Built-By:` with `builtBy`, where that is an id a verdict block can
 * name (`record-blocks.ts#isSessionId`): a later seal reads the sessions
 * that built the work from that trailer. `applied` runs once the reversals
 * are written, before the commit. It gives the questions the answer asks
 * (`chain.ts#asksOf`) and the numbers of the findings the pass left open,
 * which the caller decides on: the record is committed either way.
 */
export async function recordFixPass(
  place: Place,
  standing: Standing,
  step: Extract<Step, { is: "fix-pass" }>,
  given: { committed: string; answer: string; builtBy: string | null; refused?: StageRefusals; applied?: () => void },
  inTurn: InTurn = AT_ONCE,
): Promise<{ asks: Ask[]; open: number[] }> {
  const { worktree, directory } = place;
  const file = join(directory, ROUNDS_FOLDER, roundFile(step.round));
  const target = standing.rounds.at(-1)?.target.commit ?? standing.head;
  const asks = asksOf(given.answer);
  const head = await worktreeHead(worktree);
  await noChangeOutside(worktree, directory);
  const left = repositoryFileText(file);
  if (left === null) throw new ChainStop(`the round record no longer stands at ${relative(worktree, file)}`);
  const { closes, open } = fixPassRecord(given.committed, left);
  await fixedCommitsHeld(worktree, closes, head, target);
  // Each reversal the pass was given is taken in at the head the pass left, which the next round reads.
  const write = (): void => {
    if (step.reversals.length === 0) return;
    writeRecord(worktree, directory, (text) => step.reversals.reduce((next, reversal) => withApplied(next, reversal.id, head), text));
    given.applied?.();
  };
  const trailers = given.builtBy !== null && isSessionId(given.builtBy) ? [`${BUILT_BY_TRAILER}: ${given.builtBy}`] : [];
  await commitRecords(place, [file], `chore: record the fix pass of round ${String(step.round)}`, { write, refused: given.refused, trailers }, inTurn);
  return { asks, open };
}

// ---------------------------------------------------------------------------
// The broad gate.

/**
 * The broad gate's command for a run at the head the order was read at: the
 * `Broad gate` key of the records root's `config.json` in the worktree, with
 * that head and the commit the run's record names as its base. It throws an
 * `Error` whose message is the second half of a sentence, with nothing
 * started, where the worktree's head is no longer that head, where the
 * worktree holds a change outside the work item's directory, where the key
 * holds no command, and where the chain has no base commit. So the command
 * the caller then runs is the one the head commit holds, and the tree it
 * runs on is that commit's.
 */
export async function gateOwed(place: Place, standing: Standing, base: ChainBase): Promise<{ command: string; head: string; base: string }> {
  const { worktree, directory } = place;
  const head = await worktreeHead(worktree);
  if (head !== standing.head) throw new Error(`the worktree's head moved from ${standing.head.slice(0, 7)} to ${head.slice(0, 7)} while Owlery read the records`);
  const loose = await looseOutside(worktree, directory);
  if (loose !== null) throw new Error(loose);
  const command = readRecordsPlace(worktree).broadGate ?? "";
  if (command.trim() === "") throw new Error(`the worktree's config.json names no command under "Broad gate"`);
  if (base.commit === null) throw new Error("the work item records no commit its branch was cut at, so the run's record has no base to name");
  return { command, head, base: base.commit };
}

/**
 * Records a run of the broad gate that exited with 0: where the head and the
 * tree stand as they stood before the run, it appends one run block,
 * `run: <head> against <base commit>`, to `trail/gate.md` as the head holds
 * the file (`seal-records.ts#gateText`), below the sentence of an earlier
 * run that failed while the machine was over its load where `earlier` gives
 * one, and commits it. It throws a
 * `ChainStop`, with nothing committed, where the head moved during the run
 * and where the command left a change outside the work item's directory.
 */
export async function recordGate(place: Place, run: { head: string; base: string; earlier?: string | null }, inTurn: InTurn = AT_ONCE): Promise<void> {
  const { worktree, directory } = place;
  const file = join(directory, GATE_FILE);
  const after = await worktreeHead(worktree);
  if (after !== run.head) throw new ChainStop(`the worktree's head moved during the run, from ${run.head.slice(0, 7)} to ${after.slice(0, 7)}, so the command did not run on one commit`);
  const left = await looseOutside(worktree, directory);
  if (left !== null) throw new ChainStop(`after the run ${left}`);
  // The record's text is built on the file as the head holds it, so no line the worktree alone holds is committed with the run.
  const stood = await fileAt(worktree, run.head, relative(worktree, file));
  await commitRecords(place, [file], GATE_SUBJECT, { write: () => writeRecordFile(worktree, file, gateText(stood, basename(directory), run, run.earlier ?? null)) }, inTurn);
}

// ---------------------------------------------------------------------------
// The seal.

/**
 * The seal's prompt (`chain.ts#sealPrompt`) and the `target:` line its
 * verdict carries, `<gate's commit> against <base>`. The paths and the diff
 * are what changed since the commit the newest verdict block seals, where it
 * is a seal and an ancestor of the gate's commit, which a later commit
 * broke, and otherwise since the branch left its base, as round 1 reads it.
 */
export async function sealStage(place: Place, standing: Standing, step: Extract<Step, { is: "seal" }>, base: ChainBase): Promise<{ prompt: StagePrompt; target: string }> {
  const { worktree, directory } = place;
  const target = `${step.commit} against ${standing.base}`;
  // A seal a later commit broke, which the newest verdict block names, hands the sealer the part that changed since its commit: the newest block's run is the one before this.
  const sealed = standing.sealCommit;
  const earlier = sealed !== null && (await holdsCommit(worktree, step.commit, sealed)) ? { run: step.run - 1, commit: sealed } : null;
  const { paths, text: diff } = earlier === null ? await diffBetween(worktree, base.reads, step.commit, true) : await diffBetween(worktree, earlier.commit, step.commit, false);
  const stands = (...path: string[]): boolean => existsSync(join(directory, ...path));
  const prompt = sealPrompt({ run: step.run, worktree, directory: standing.directory, target, rounds: standing.rounds.map(({ round }) => round), decisions: stands(RECORD_FILE), frame: stands("frame"), phases: stands("trail", "phases"), changelog: stands("changelog.md"), earlier, paths, diff });
  return { prompt, target };
}

/**
 * Writes a sealer's answer as its run's section of the guarantee: it takes
 * the section from the answer (`seal-records.ts#sectionOf`), puts Owlery's
 * own lines into the section's verdict block, appends the section to
 * `guarantee.md` as the head holds the file (`seal-records.ts#guaranteeText`)
 * and commits it, with the rows of the calls the sealer's rule refused,
 * where each of these holds: the answer's first line that opens a run's
 * section is this run's heading, the reader refuses no line of the section,
 * it holds one verdict block, whose `target:` line is the one given and
 * which holds none of Owlery's lines; a judging session and its model are
 * named, and the judging session is not `the session`, which names a
 * builder; one session or more is named as
 * having built the work, and the judging session is none of them; and the
 * worktree's head is the one the step was read at, so the gate still holds
 * there, with no change outside the work item's directory. Where one does
 * not hold, nothing is written.
 *
 * The sessions that built the work are `the session` where the
 * `Implementation` row of the `routing.md` the head holds reads so, then the
 * id of each fix pass's session, read from the trailer `Seal-Built-By:` of
 * the commits on the gate's commit's own line that neither the base's commit
 * nor the base the branch left holds, so of none of the base's commits,
 * whether a merge, a fast-forward or a rebase put it on the branch.
 *
 * `before` is handed the verdict the section will stand as, before the
 * commit: the daemon parks an `undecided` verdict's question there, and what
 * it throws stops the write. It gives that verdict.
 */
export async function recordVerdict(
  place: Place,
  standing: Standing,
  step: Extract<Step, { is: "seal" }>,
  base: ChainBase,
  given: { answer: string; target: string; judgedBy: string | null; model: string | null; version: string; refused?: StageRefusals; before?: (verdict: Verdict) => void },
  inTurn: InTurn = AT_ONCE,
): Promise<Verdict> {
  const { worktree, directory } = place;
  const file = join(directory, GUARANTEE_FILE);
  let section: string;
  try {
    section = sectionOf(given.answer, { run: step.run, target: given.target });
  } catch (error) {
    throw new ChainStop(error instanceof Error ? error.message : String(error));
  }
  if (given.judgedBy === null) throw new ChainStop("its session named no id of its own, and a verdict names the session that judged");
  if (given.judgedBy === THE_SESSION) throw new ChainStop(`the judging session is named \`${THE_SESSION}\`, which names the session that built the work, and a session that built gives no verdict`);
  if (given.model === null) throw new ChainStop("its session named no model, and a verdict names the model that judged");
  const head = await worktreeHead(worktree);
  if (head !== standing.head) throw new ChainStop(`the worktree's head moved during the seal, from ${standing.head.slice(0, 7)} to ${head.slice(0, 7)}, so the broad gate no longer holds at the head the sealer read`);
  await noChangeOutside(worktree, directory);
  const routing = await fileAt(worktree, head, relative(worktree, join(directory, ROUTING_FILE)));
  const passes = base.commit === null ? [] : (await trailerValues(worktree, [base.commit, base.reads], step.commit, BUILT_BY_TRAILER)).filter(isSessionId);
  const builtBy = [...(routingAnswer(routing ?? "", "Implementation") === THE_SESSION ? [THE_SESSION] : []), ...passes];
  const stood = await fileAt(worktree, head, relative(worktree, file));
  let written: string;
  try {
    written = guaranteeText(stood, basename(directory), section, { builtBy, judgedBy: given.judgedBy, model: given.model, version: given.version });
  } catch (error) {
    throw new ChainStop(error instanceof Error ? error.message : String(error));
  }
  const newest = readGuarantee(written).verdicts.at(-1);
  if (newest === undefined) throw new ChainStop("the section appended to the guarantee holds no verdict");
  given.before?.(newest);
  await commitRecords(place, [file], VERDICT_SUBJECT, { write: () => writeRecordFile(worktree, file, written), refused: given.refused }, inTurn);
  return newest;
}
