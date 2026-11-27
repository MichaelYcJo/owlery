// What a work item's committed records say for the back of its seal, read
// at the branch's head commit: the seal's record, each round with its
// findings, the commit that broke a broken seal, and the refused calls. The
// worktree gives one thing, the place of the work item's directory, which
// `decision-record.ts#workItemDirectory` finds, as `inspection-state.ts` finds it.
// Every record under that directory is then read as the head commit holds
// it, through the readers that stand: `round-record.ts#readRoundRecord`,
// `inspection-records.ts#readInspection` and `#readGate`, and
// `chain.ts#readRefusals`. A record written and not committed says nothing,
// so the back says what the committed records say
// (docs/architecture.md, "State lives in three places").
//
// It stores nothing, and gives each string whole: the daemon cuts them where
// it sends them.
import { basename, join, relative } from "node:path";
import type { BackFinding, BackRound, Seal, SealRecord, SealRecords } from "../shared/protocol";
import { CLOSING_RECORDS, REFUSALS_FILE, ROUNDS_FOLDER, readRefusals, roundNumber } from "./chain";
import { lastRun } from "./chain-records";
import { declaredBranch } from "./decision-record";
import { type Finding, readRoundRecord } from "./round-record";
import { GATE_FILE, INSPECTION_FILE, readInspection } from "./inspection-records";
import { commitNamed, fileAt, filesAt, firstCommitOutside, holdsCommit } from "./worktrees";

/** What a work item holds for the back where its worktree holds no directory of its own, or two: no record and no round, read at the head. */
export function noSealRecords(head: string): SealRecords {
  return { head, record: null, brokenBy: null, rounds: [], refusals: [], unreadRefusals: 0 };
}

/** A path of git's, from the worktree's top, with `/` between its parts. */
function gitPath(...parts: string[]): string {
  return join(...parts).split("\\").join("/");
}

/** The round records a commit holds in the folder, the lowest round first, each by its round and its path. */
async function roundFiles(worktree: string, commit: string, folder: string): Promise<{ round: number; path: string }[]> {
  const numbered = (await filesAt(worktree, commit, folder)).flatMap((path) => {
    const round = roundNumber(path.slice(path.lastIndexOf("/") + 1));
    return round === null ? [] : [{ round, path }];
  });
  return numbered.sort((a, b) => a.round - b.round);
}

/** A finding as the back holds it: the words of its heading after its number. */
function backFinding(finding: Finding): BackFinding {
  const { close, reopens, regression } = finding;
  return {
    number: finding.number,
    says: finding.heading.replace(/^### [0-9]+\. /u, ""),
    severity: finding.severity,
    places: finding.places,
    close: close === null ? null : { verdict: close.verdict, commit: close.commit, home: close.home, answer: close.answer },
    reopens: reopens === null || reopens.finding === null ? null : { round: reopens.round, finding: reopens.finding },
    regression: regression === null ? null : { round: regression.round, finding: regression.finding },
  };
}

/**
 * The seal's record, from the newest verdict block of the guarantee the head
 * holds where that block is a seal, or null where it is no seal, where no
 * guarantee stands, and where the reader refuses a line of it. The count of
 * rounds is of the round records the sealed commit holds, and of those the
 * head holds where the repository holds no commit of the name the block
 * gives.
 */
async function recordOf(worktree: string, place: string, head: string, folder: string): Promise<SealRecord | null> {
  const text = await fileAt(worktree, head, gitPath(place, INSPECTION_FILE));
  const inspection = text === null ? null : readInspection(text);
  const verdict = inspection === null || inspection.refusals.length > 0 ? undefined : inspection.verdicts.at(-1);
  if (verdict === undefined || verdict.is !== "cleared") return null;
  const sealed = await commitNamed(worktree, verdict.commit);
  const routing = await fileAt(worktree, head, gitPath(place, "routing.md"));
  const gate = await fileAt(worktree, head, gitPath(place, GATE_FILE));
  return {
    commit: verdict.commit,
    branch: routing === null ? null : declaredBranch(routing),
    base: verdict.base,
    item: basename(place),
    gate: gate === null ? null : lastRun(gate),
    rounds: (await roundFiles(worktree, sealed ?? head, folder)).length,
    builtBy: verdict.builtBy,
    judgedBy: verdict.inspectedBy,
    model: verdict.model,
    rules: verdict.rules,
  };
}

/**
 * The commit that broke a broken seal: the oldest commit on the branch's
 * own line after the sealed commit that changes a path that is no closing
 * record of the directory, with its subject. Null where the seal is not
 * broken, where the repository holds no commit of the name the seal gives,
 * where the head does not hold the sealed commit, and where only closing
 * records follow it.
 */
async function brokenByOf(worktree: string, place: string, head: string, seal: Seal | null): Promise<SealRecords["brokenBy"]> {
  if (seal?.state !== "broken") return null;
  const sealed = await commitNamed(worktree, seal.commit);
  if (sealed === null || !(await holdsCommit(worktree, head, sealed))) return null;
  return firstCommitOutside(
    worktree,
    sealed,
    head,
    CLOSING_RECORDS.map((file) => gitPath(place, file)),
  );
}

/**
 * What the records of the work item's directory, a folder of the worktree,
 * say at the commit `head` for the back of its seal, given the seal the
 * daemon read at that head. It throws what git throws.
 */
export async function sealRecords(worktree: string, directory: string, head: string, seal: Seal | null): Promise<SealRecords> {
  const place = relative(worktree, directory);
  const folder = gitPath(place, ROUNDS_FOLDER);
  const rounds: BackRound[] = [];
  for (const { round, path } of await roundFiles(worktree, head, folder)) {
    const record = readRoundRecord((await fileAt(worktree, head, path)) ?? "");
    rounds.push({
      round,
      target: record.target?.commit ?? null,
      findings: record.findings.map(backFinding),
      confirms: record.confirmations.flatMap(({ round: earlier, finding }) => (finding === null ? [] : [{ round: earlier, finding }])),
      unread: record.refusals.length,
    });
  }
  const refusalsText = await fileAt(worktree, head, gitPath(place, REFUSALS_FILE));
  const refused = refusalsText === null ? { refusals: [], unread: 0 } : readRefusals(refusalsText);
  return {
    head,
    record: await recordOf(worktree, place, head, folder),
    brokenBy: await brokenByOf(worktree, place, head, seal),
    rounds,
    refusals: refused.refusals,
    unreadRefusals: refused.unread,
  };
}
