// What a work item's records say of its chain, as the daemon reads them in
// the work item's directory of its worktree, committed or not: whether the
// frame stands, how many rounds are recorded, the commit of the gate's last
// run and the sealer's last verdict. The window draws the approval line from
// these facts and the work item's questions; no hook and no session is read.
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
// gate record's arm). Of the blocks the last is the newest. No round record
// is parsed: a round is a file's name.
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Recorded } from "../shared/protocol";
import { RUN_BLOCK, VERDICT_BLOCK, field, read, type Block, type Kind } from "./record-blocks";
import { repositoryFileText } from "./repository-file";

/** What a work item holds of its records where its worktree holds no directory of its own, or the directory holds none of them. */
export const NOTHING_RECORDED: Recorded = { framed: false, rounds: 0, gate: null, verdict: null };

/** The name of a round record: `round-`, a whole number from 1 with no leading zero, and `.md`. */
const ROUND = /^round-[1-9][0-9]*\.md$/;

/** The last block of the kind the text holds, or null where it holds none and where the reader refuses a line of it. A fence named as not read decides nothing. */
function lastBlock(text: string, kind: Kind): Block | null {
  const got = read(text, [kind]);
  if (got.refusals.length > 0) return null;
  return got.blocks.at(-1) ?? null;
}

/** The commit the last run block of a gate record names, or null. */
export function lastRun(text: string): string | null {
  const block = lastBlock(text, RUN_BLOCK);
  return block === null ? null : (field(block, "run:")?.groups.commit ?? null);
}

/** The last verdict block of a guarantee, or null: the verdict's word, the commit its `target:` names, and the reason of a `withheld` or the question of an `undecided`. */
export function lastVerdict(text: string): Recorded["verdict"] {
  const block = lastBlock(text, VERDICT_BLOCK);
  if (block === null) return null;
  const commit = field(block, "target:")?.groups.commit ?? "";
  const said = field(block, "Verdict:")?.value ?? "";
  const reason = /^withheld reason: (.*)$/su.exec(said)?.[1];
  if (reason !== undefined) return { is: "withheld", commit, says: reason };
  const question = /^undecided question: (.*)$/su.exec(said)?.[1];
  if (question !== undefined) return { is: "undecided", commit, says: question };
  return { is: "sealed", commit, says: null };
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
