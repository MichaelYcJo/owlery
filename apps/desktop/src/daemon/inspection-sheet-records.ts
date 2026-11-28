// What a work item's committed records say for its inspection sheet, read
// at the branch's head commit: the inspection's record, each round with its
// findings, the commit that lapsed a lapsed inspection, and the refused calls. The
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
import type { BackFinding, BackRound, Inspection, InspectionRecord, BackRecords } from "../shared/protocol";
import { CLOSING_RECORDS, REFUSALS_FILE, ROUNDS_FOLDER, readRefusals, roundNumber } from "./chain";
import { lastRun } from "./chain-records";
import { declaredBranch } from "./decision-record";
import { type Finding, readRoundRecord } from "./round-record";
import { GATE_FILE, INSPECTION_FILE, readInspection } from "./inspection-records";
import { commitNamed, fileAt, filesAt, firstCommitOutside, holdsCommit } from "./worktrees";

/** What a work item holds for the back where its worktree holds no directory of its own, or two: no record and no round, read at the head. */
export function noBackRecords(head: string): BackRecords {
  return { head, record: null, lapsedBy: null, rounds: [], refusals: [], unreadRefusals: 0 };
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
 * The inspection's record, from the newest verdict block of the inspection
 * the head holds where that block clears, or null where it clears nothing, where no
 * inspection stands, and where the reader refuses a line of it. The count of
 * rounds is of the round records the cleared commit holds, and of those the
 * head holds where the repository holds no commit of the name the block
 * gives.
 */
async function recordOf(worktree: string, place: string, head: string, folder: string): Promise<InspectionRecord | null> {
  const text = await fileAt(worktree, head, gitPath(place, INSPECTION_FILE));
  const inspection = text === null ? null : readInspection(text);
  const verdict = inspection === null || inspection.refusals.length > 0 ? undefined : inspection.verdicts.at(-1);
  if (verdict === undefined || verdict.is !== "cleared") return null;
  const cleared = await commitNamed(worktree, verdict.commit);
  const routing = await fileAt(worktree, head, gitPath(place, "routing.md"));
  const gate = await fileAt(worktree, head, gitPath(place, GATE_FILE));
  return {
    commit: verdict.commit,
    branch: routing === null ? null : declaredBranch(routing),
    base: verdict.base,
    item: basename(place),
    gate: gate === null ? null : lastRun(gate),
    rounds: (await roundFiles(worktree, cleared ?? head, folder)).length,
    builtBy: verdict.builtBy,
    inspectedBy: verdict.inspectedBy,
    model: verdict.model,
    rules: verdict.rules,
  };
}

/**
 * The commit that lapsed a lapsed inspection: the oldest commit on the
 * branch's own line after the cleared commit that changes a path that is no
 * closing record of the directory, with its subject. Null where the
 * inspection did not lapse, where the repository holds no commit of the name
 * the inspection gives, where the head does not hold the cleared commit, and
 * where only closing records follow it.
 */
async function lapsedByOf(worktree: string, place: string, head: string, inspection: Inspection | null): Promise<BackRecords["lapsedBy"]> {
  if (inspection?.state !== "lapsed") return null;
  const cleared = await commitNamed(worktree, inspection.commit);
  if (cleared === null || !(await holdsCommit(worktree, head, cleared))) return null;
  return firstCommitOutside(
    worktree,
    cleared,
    head,
    CLOSING_RECORDS.map((file) => gitPath(place, file)),
  );
}

/**
 * What the records of the work item's directory, a folder of the worktree,
 * say at the commit `head` for its inspection sheet, given the inspection
 * the daemon read at that head. It throws what git throws.
 */
export async function backRecords(worktree: string, directory: string, head: string, inspection: Inspection | null): Promise<BackRecords> {
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
    lapsedBy: await lapsedByOf(worktree, place, head, inspection),
    rounds,
    refusals: refused.refusals,
    unreadRefusals: refused.unread,
  };
}
