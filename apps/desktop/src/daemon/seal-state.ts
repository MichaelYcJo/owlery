// The seal a work item's branch holds at its head commit: `sealed`, `broken`
// or none, read from git and the committed records alone. The worktree gives
// one thing, the place of the work item's directory, which
// `decision-record.ts#workItemDirectory` finds by the `routing.md` it holds,
// as every reader of the daemon finds it. Every record under that directory
// is then read as the head commit holds it: the guarantee here, and the
// round records, `decisions.md`, `trail/gate.md` and the guarantee again
// through `chain.ts#standingOf`. No stored chain, no pane's output and no
// session's event is read, so an edit, a file git ignores and a record
// written and not committed decide nothing.
//
// Whether a seal holds is the order's own answer (`chain.ts#stepOwed`): it
// holds where the order owes nothing more at the head. This module holds no
// rule of its own on what may follow a seal, and stores nothing; the daemon
// reads it again each time a branch's head moves and when it starts.
import { join, relative } from "node:path";
import type { Seal, WorkItem } from "../shared/protocol";
import { ChainStop, type Step, closingRecord, roundBase, stageName, standingOf, stepOwed } from "./chain";
import { lastVerdict } from "./chain-records";
import { workItemDirectory } from "./decision-record";
import { GUARANTEE_FILE } from "./seal-records";
import { commitNamed, fileAt, holdsCommit, pathsBetween } from "./worktrees";

/** A commit as a sentence shows it: its first seven characters. */
function shown(commit: string): string {
  return commit.slice(0, 7);
}

/** A broken seal of the commit, and why, whole: the daemon cuts the sentence where it sends it. */
function broken(commit: string, why: string): Seal {
  return { state: "broken", commit, why };
}

/** The sentence of a broken seal where no path but a closing record differs from the sealed commit: which step the order owes. */
function owedSays(step: Exclude<Step, { is: "sealed" }>, commit: string): string {
  const after = `after the sealed commit \`${shown(commit)}\``;
  if (step.is === "parked") return `The work item waits for the answers to its open questions ${after}.`;
  return `${stageName(step.is, step.round)} is owed ${after}.`;
}

/**
 * The seal the commit `head` holds for the work item's directory, a folder
 * of the worktree as `standingOf` takes it, read by the first of these that
 * holds:
 *
 * - The head holds no `guarantee.md` in the directory, the reader refuses a
 *   line of it or finds no verdict block, or the newest block reads
 *   `withheld` or `undecided`: no seal, null.
 * - The repository holds no commit of the name the seal gives, or the head
 *   does not hold it: broken, and the sentence says which.
 * - A record the head holds does not read (`standingOf` throws a
 *   `ChainStop`): broken, and the sentence says what the reader refuses.
 * - The order owes nothing at the head (`stepOwed` answers `sealed`):
 *   sealed.
 * - Otherwise broken, and the sentence names the first path that is no
 *   closing record and differs between the sealed commit and the head, or,
 *   where none does, the step the order owes.
 *
 * `base` is what round 1's target names the branch against (`roundBase`).
 * It throws what git throws other than through a `ChainStop`.
 */
export async function sealAt(worktree: string, directory: string, head: string, base: string): Promise<Seal | null> {
  const place = relative(worktree, directory);
  const text = await fileAt(worktree, head, join(place, GUARANTEE_FILE));
  const verdict = text === null ? null : lastVerdict(text);
  if (verdict === null || verdict.is !== "sealed") return null;
  const whole = await commitNamed(worktree, verdict.commit);
  if (whole === null) return broken(verdict.commit, `The repository holds no sealed commit \`${shown(verdict.commit)}\`.`);
  if (!(await holdsCommit(worktree, head, whole))) return broken(whole, `The branch no longer holds the sealed commit \`${shown(whole)}\`.`);
  let step: Step;
  let read: string;
  try {
    const standing = await standingOf(worktree, directory, head, base, "head");
    step = stepOwed(standing);
    read = standing.directory;
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    return broken(whole, `The records at the head do not read: ${error.message.replace(/\.+$/u, "")}.`);
  }
  if (step.is === "sealed") return { state: "sealed", commit: whole, why: null };
  const changed = (await pathsBetween(worktree, whole, head)).find((path) => !closingRecord(path, read));
  return broken(whole, changed === undefined ? owedSays(step, whole) : `\`${changed}\` changed after the sealed commit \`${shown(whole)}\`.`);
}

/**
 * The seal the commit `head` of a work item's branch holds: `sealAt` on the
 * directory of the worktree whose `routing.md` names the branch, and null
 * where the worktree holds no such directory or two.
 */
export async function workItemSeal(item: Pick<WorkItem, "worktree" | "branch" | "baseBranch" | "baseCommit">, head: string): Promise<Seal | null> {
  const directory = workItemDirectory(item.worktree, item.branch);
  if (directory === null) return null;
  return sealAt(item.worktree, directory, head, roundBase(item.baseBranch, item.baseCommit, head));
}
