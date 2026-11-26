// What a work item's records say of its chain, as the daemon reads them in
// the work item's directory of its worktree, committed or not: whether the
// frame stands, how many rounds are recorded, the commit of the gate's last
// run and the sealer's last verdict. The window draws the approval line from
// these facts, the work item's questions, its chain and the stage a pane's
// session runs through the chain command (`WorkItem.paneStage`); no hook and
// no session is read.
//
// The two files read are input the daemon did not write, so each is read
// through `repository-file.ts#repositoryFileText`, which refuses a link, what
// is no plain file and a file over its bound. The frame and the rounds are
// not read, only looked at: a link and what is no plain file count for none
// of them, and a `trail/rounds` that is a link or no folder holds no round.
// As `repositoryFileText` does, a folder above the last part of a path is
// followed where it is a link.
//
// A record whose reader refuses a line gives nothing, wherever the line
// stands, as the pull request check reads it
// (`pr-check/skills/code-review/scripts/chain_check.py#guarantee` and its
// gate record's arm). Of the blocks the last is the newest. The two records
// are parsed in `seal-records.ts`, which the chain reads them with too, so
// each block has one parser. No round record is parsed: a round is a file's
// name.
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Recorded } from "../shared/protocol";
import { repositoryFileText } from "./repository-file";
import { readGate, readGuarantee } from "./seal-records";

/** What a work item holds of its records where its worktree holds no directory of its own, or the directory holds none of them. */
export const NOTHING_RECORDED: Recorded = { framed: false, rounds: 0, gate: null, verdict: null };

/** The name of a round record: `round-`, a whole number from 1 with no leading zero, and `.md`. */
const ROUND = /^round-[1-9][0-9]*\.md$/;

/** The commit the newest run of a gate record names, as `seal-records.ts#readGate` reads the record, or null where it holds no run and where the reader refuses a line of it. A fence named as not read decides nothing. */
export function lastRun(text: string): string | null {
  const { runs, refusals } = readGate(text);
  return refusals.length > 0 ? null : (runs.at(-1)?.commit ?? null);
}

/** The newest verdict of a guarantee, as `seal-records.ts#readGuarantee` reads the record, or null where it holds none and where the reader refuses a line of it: the verdict's word, the commit its `target:` names, and the reason of a `withheld` or the question of an `undecided`. */
export function lastVerdict(text: string): Recorded["verdict"] {
  const { verdicts, refusals } = readGuarantee(text);
  const newest = refusals.length > 0 ? undefined : verdicts.at(-1);
  return newest === undefined ? null : { is: newest.is, commit: newest.commit, says: newest.says };
}

/** Whether a plain file stands at the path: a link and what is no plain file are none. */
function plainFile(path: string): boolean {
  try {
    return lstatSync(path).isFile();
  } catch {
    return false;
  }
}

/** A file's text, or null where none stands and where `repositoryFileText` refuses what stands. */
function textOf(path: string): string | null {
  try {
    return repositoryFileText(path);
  } catch {
    return null;
  }
}

/** How many round records a `trail/rounds` folder holds, or 0 where it is a link or no folder. */
function roundsIn(folder: string): number {
  try {
    if (!lstatSync(folder).isDirectory()) return 0;
    return readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile() && ROUND.test(entry.name)).length;
  } catch {
    return 0;
  }
}

/** What the records of a work item's directory say of its chain. A directory of null, which is a worktree's that holds none of its own, says nothing. */
export function readChainRecords(directory: string | null): Recorded {
  if (directory === null) return NOTHING_RECORDED;
  const gate = textOf(join(directory, "trail", "gate.md"));
  const guarantee = textOf(join(directory, "guarantee.md"));
  return {
    framed: plainFile(join(directory, "frame", "design.md")),
    rounds: roundsIn(join(directory, "trail", "rounds")),
    gate: gate === null ? null : lastRun(gate),
    verdict: guarantee === null ? null : lastVerdict(guarantee),
  };
}
