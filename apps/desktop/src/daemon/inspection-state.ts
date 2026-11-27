// The inspection a work item's branch holds at its head commit: `cleared`,
// `lapsed` or none, read from git and the committed records alone. The worktree gives one thing, the place of the work item's directory, which
// `decision-record.ts#workItemDirectory` finds by the `routing.md` it holds,
// as every reader of the daemon finds it. Every record under that directory
// is then read as the head commit holds it: the inspection here, and the
// round records, `decisions.md`, `trail/gate.md` and the inspection again
// through `chain.ts#standingOf`. No stored chain, no pane's output and no
// session's event is read, so an edit, a file git ignores and a record
// written and not committed decide nothing. The same reading says what the
// readers refuse of those records (`refusedAt`), which the plan that moves a
// repository's check names.
//
// Whether an inspection holds is the order's own answer (`chain.ts#stepOwed`):
// it holds where the order owes nothing more at the head. This module holds no
// rule of its own on what may follow an inspection, and stores nothing; the daemon
// reads it again each time a branch's head moves and when it starts.
import { join, relative } from "node:path";
import type { Inspection, WorkItem } from "../shared/protocol";
import { ChainStop, type Step, closingRecord, roundBase, stageName, standingOf, stepOwed } from "./chain";
import { lastVerdict } from "./chain-records";
import { workItemDirectory } from "./decision-record";
import { INSPECTION_FILE } from "./inspection-records";
import { commitNamed, fileAt, holdsCommit, pathsBetween } from "./worktrees";

/** A commit as a sentence shows it: its first seven characters. */
function shown(commit: string): string {
  return commit.slice(0, 7);
}

/** A lapsed inspection of the commit, and why, whole: the daemon cuts the sentence where it sends it. */
function lapsed(commit: string, why: string): Inspection {
  return { state: "lapsed", commit, why };
}

/** The sentence of a lapsed inspection where no path but a closing record differs from the cleared commit: which step the order owes. */
function owedSays(step: Exclude<Step, { is: "cleared" }>, commit: string): string {
  const after = `after the cleared commit \`${shown(commit)}\``;
  if (step.is === "parked") return `The work item waits for the answers to its open questions ${after}.`;
  return `${stageName(step.is, step.round)} is owed ${after}.`;
}

/**
 * The inspection the commit `head` holds for the work item's directory, a folder
 * of the worktree as `standingOf` takes it, read by the first of these that
 * holds:
 *
 * - The head holds no `inspection.md` in the directory, the reader refuses a
 *   line of it or finds no verdict block, or the newest block reads
 *   `withheld` or `undecided`: no inspection, null.
 * - The repository holds no commit of the name the inspection gives, or the head
 *   does not hold it: lapsed, and the sentence says which.
 * - A record the head holds does not read (`standingOf` throws a
 *   `ChainStop`): lapsed, and the sentence says what the reader refuses.
 * - The order owes nothing at the head (`stepOwed` answers `cleared`):
 *   cleared.
 * - Otherwise lapsed, and the sentence names the first path that is no
 *   closing record and differs between the cleared commit and the head, or,
 *   where none does, the step the order owes.
 *
 * `base` is what round 1's target names the branch against (`roundBase`).
 * It throws what git throws other than through a `ChainStop`.
 */
export async function inspectionAt(worktree: string, directory: string, head: string, base: string): Promise<Inspection | null> {
  const place = relative(worktree, directory);
  const text = await fileAt(worktree, head, join(place, INSPECTION_FILE));
  const verdict = text === null ? null : lastVerdict(text);
  if (verdict === null || verdict.is !== "cleared") return null;
  const whole = await commitNamed(worktree, verdict.commit);
  if (whole === null) return lapsed(verdict.commit, `The repository holds no cleared commit \`${shown(verdict.commit)}\`.`);
  if (!(await holdsCommit(worktree, head, whole))) return lapsed(whole, `The branch no longer holds the cleared commit \`${shown(whole)}\`.`);
  let step: Step;
  let read: string;
  try {
    const standing = await standingOf(worktree, directory, head, base, "head");
    step = stepOwed(standing);
    read = standing.directory;
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    return lapsed(whole, `The records at the head do not read: ${error.message.replace(/\.+$/u, "")}.`);
  }
  if (step.is === "cleared") return { state: "cleared", commit: whole, why: null };
  const changed = (await pathsBetween(worktree, whole, head)).find((path) => !closingRecord(path, read));
  return lapsed(whole, changed === undefined ? owedSays(step, whole) : `\`${changed}\` changed after the cleared commit \`${shown(whole)}\`.`);
}

/**
 * The inspection the commit `head` of a work item's branch holds: `inspectionAt` on the
 * directory of the worktree whose `routing.md` names the branch, and null
 * where the worktree holds no such directory or two, and for a work item
 * with no branch yet, whose directory no routing names.
 */
export async function workItemInspection(item: Pick<WorkItem, "worktree" | "branch" | "baseBranch" | "baseCommit">, head: string): Promise<Inspection | null> {
  const directory = workItemDirectory(item.worktree, item.branch);
  if (directory === null) return null;
  return inspectionAt(item.worktree, directory, head, roundBase(item.baseBranch, item.baseCommit, head));
}

/**
 * What the readers refuse of a work item's records as the commit `head` of
 * its branch holds them, found as `workItemInspection` finds them: the sentence
 * of the `ChainStop` that `standingOf` throws, and null where it throws
 * none and where the worktree holds no directory the routing of the branch
 * names. The readers are those of the round records, the broad gate's run
 * and the inspection, which cases hold to the pull request check's answers,
 * and none of the check's other arms. It throws what git throws other than
 * through a `ChainStop`.
 */
export async function refusedAt(item: Pick<WorkItem, "worktree" | "branch" | "baseBranch" | "baseCommit">, head: string): Promise<string | null> {
  const directory = workItemDirectory(item.worktree, item.branch);
  if (directory === null) return null;
  try {
    await standingOf(item.worktree, directory, head, roundBase(item.baseBranch, item.baseCommit, head), "head");
    return null;
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    return error.message;
  }
}
