// A work item's chain: the review rounds, the fix passes, the orchestrator's
// judgments, the broad gate and the seal the daemon runs after a `getSeal`.
// Every session runs on the fake adapter, on a temporary repository, the
// gate's command is a stand-in the case names, and no case starts an agent.
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { fakeAdapter } from "../src/daemon/adapters/fake";
import {
  CHAIN_STAGES_KEPT,
  ChainStop,
  PROMPT_DIFF_CHARS,
  ROUNDS_CEILING,
  type RoundStanding,
  UNDECIDED_CEILING,
  type Standing,
  asksOf,
  chainRead,
  convergenceOf,
  convergencePrompt,
  fixPassPrompt,
  fixPassRecord,
  gateBefore,
  isChain,
  passedBefore,
  promptText,
  refusalsText,
  roundPrompt,
  roundBase,
  roundRecordOf,
  routingText,
  rulingPrompt,
  rulingsOf,
  runningSays,
  sealPrompt,
  sealedSays,
  stepOwed,
  stoppedSays,
  undecidedAsk,
  withheldSays,
  type WrittenChain,
} from "../src/daemon/chain";
import { declaredBranch, readDecisionRecord, routingAnswer, withDecision, withQuestion } from "../src/daemon/decision-record";
import { readRoundRecord } from "../src/daemon/round-record";
import type { Verdict } from "../src/daemon/seal-records";
import type { Chain, ChainStage } from "../src/shared/protocol";
import { untilGone } from "./built-app";
import { type Cleanups, NOW, TODAY, askBlock, clean, client, gateRecord, heldGit, closeBlock, closeFinding, commitAll, commitFix, commitsAfterMain, convergenceBlock, fixes, givenFix, givenQuestions, givenRound, givenSeal, guaranteeRecord, head, noted, proofs, roles, roundRecord, rulingBlock, sealSection, sealedBy, standing, status, write } from "./chain-run";
import { git } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

const A = "a".repeat(40);
const B = "b".repeat(40);
const HEAD = "c".repeat(40);
const NAME = "1795388700-sealed-work";
const DIRECTORY = `seal/threads/${NAME}`;
const TRAILER = `Seal-Routing: ${NAME}`;
const HEADING = (round: number): string => `# Review round ${String(round)}: ${NAME}`;

/** A record with a close block under each finding given a verdict. */
function closedRecord(round: number, target: string, findings: Record<number, string | null>, confirms: string[] = []): string {
  let text = roundRecord(HEADING(round), target, Object.keys(findings).map(Number), confirms);
  for (const [finding, verdict] of Object.entries(findings)) {
    const end = `finding ${finding} leaves a sentence with no end.\n`;
    if (verdict !== null) text = text.replace(end, `${end}${closeBlock(verdict)}`);
  }
  return text;
}

/** A round as the order reads it, from a record's text. */
function round(number: number, text: string): RoundStanding {
  const record = readRoundRecord(text);
  expect(record.refusals).toEqual([]);
  return { round: number, target: record.target!, findings: record.findings };
}

const NOTHING: Standing = { rounds: [], openQuestion: false, reversals: [], head: HEAD, base: "main", changed: [], directory: DIRECTORY, gateCommit: null, sinceGate: [], verdicts: [], sealCommit: null };
/** A verdict block as the order reads one. */
function verdict(is: Verdict["is"], commit = A): Verdict {
  return { target: `${commit} against main`, commit, base: "main", is, says: is === "sealed" ? null : "The changelog names a file the tree does not hold.", builtBy: ["the session"], judgedBy: "s-2", model: "fake", rules: "owlery 0.0.2", line: 12, end: 19 };
}

const REVERSAL = { id: 3, decided: "Start from main.", message: "Start from the release branch." };

describe("the step a chain owes", () => {
  it("is round 1, on the branch against its base, where no round record stands", () => {
    expect(stepOwed(NOTHING)).toEqual({ is: "round", round: 1, target: `${HEAD} against main`, from: null });
    expect(stepOwed({ ...NOTHING, base: A })).toEqual({ is: "round", round: 1, target: `${HEAD} against ${A}`, from: null });
    // A reversal is taken in by a fix pass, which answers a record, so it waits for round 1.
    expect(stepOwed({ ...NOTHING, reversals: [REVERSAL] })).toMatchObject({ is: "round", round: 1 });
  });

  it("names round 1's base as the work item's base branch where the round block's target line takes the name, and otherwise as the commit the branch was cut at, or the head where the work item records none", () => {
    for (const taken of ["main", "release/v0.0.2", "feat/41-review_rounds", "기준"]) expect(roundBase(taken, A, HEAD), taken).toBe(taken);
    // Git allows each of these names, and the target line's shape takes none of them.
    for (const refused of ["feat/a+b", "user@fix", "fix#41", "a,b", "wip!", "ends-"]) {
      expect(roundBase(refused, A, HEAD), refused).toBe(A);
      expect(readRoundRecord(roundRecord(HEADING(1), `${HEAD} against ${refused}`)).refusals, refused).not.toEqual([]);
      expect(readRoundRecord(roundRecord(HEADING(1), `${HEAD} against ${roundBase(refused, A, HEAD)}`)).refusals, refused).toEqual([]);
    }
    expect(roundBase(null, A, HEAD)).toBe(A);
    expect(roundBase("feat/a+b", null, HEAD)).toBe(HEAD);
    expect(roundBase(null, null, HEAD)).toBe(HEAD);
  });

  it("is parked where the record holds an open question, whatever else the records say", () => {
    for (const rounds of [[], [round(1, closedRecord(1, `${A} against main`, { 1: null }))], [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}` }))]]) {
      expect(stepOwed({ ...NOTHING, rounds, openQuestion: true, reversals: [REVERSAL] })).toEqual({ is: "parked" });
    }
  });

  it("is a fix pass on the last record where it holds a finding with no close block, with the numbers of the open ones and the reversals that stand", () => {
    const rounds = [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}`, 2: null, 3: null }))];
    expect(stepOwed({ ...NOTHING, rounds })).toEqual({ is: "fix-pass", round: 1, open: [2, 3], reversals: [] });
    expect(stepOwed({ ...NOTHING, rounds, reversals: [REVERSAL] })).toEqual({ is: "fix-pass", round: 1, open: [2, 3], reversals: [REVERSAL] });
    // Only the last record's findings are read: round 1's open finding owes nothing once round 2 stands.
    const later = [round(1, closedRecord(1, `${A} against main`, { 1: null })), round(2, closedRecord(2, `${B}, fixes ${A}..${B}`, { 1: null }))];
    expect(stepOwed({ ...NOTHING, rounds: later })).toEqual({ is: "fix-pass", round: 2, open: [1], reversals: [] });
  });

  it("is a fix pass for the reversals alone where a decision stands reversed and no finding is open", () => {
    const rounds = [round(1, closedRecord(1, `${A} against main`, {}))];
    expect(stepOwed({ ...NOTHING, rounds, reversals: [REVERSAL] })).toEqual({ is: "fix-pass", round: 1, open: [], reversals: [REVERSAL] });
    // A reversal is read before the closed findings: the verifying round then reads the commits of both passes.
    const closed = [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}` }))];
    expect(stepOwed({ ...NOTHING, rounds: closed, reversals: [REVERSAL] })).toMatchObject({ is: "fix-pass", round: 1, open: [] });
  });

  it("is a verifying round on the commits after the last target where the last record holds a fixed or a rejected finding, or a commit after its target changed a path outside the work item's directory", () => {
    const verifying = { is: "round", round: 2, target: `${HEAD}, fixes ${A}..${HEAD}`, from: A };
    expect(stepOwed({ ...NOTHING, rounds: [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}` }))] })).toEqual(verifying);
    expect(stepOwed({ ...NOTHING, rounds: [round(1, closedRecord(1, `${A} against main`, { 1: "rejected" }))] })).toEqual(verifying);
    const none = [round(1, closedRecord(1, `${A} against main`, {}))];
    expect(stepOwed({ ...NOTHING, rounds: none, changed: [`${DIRECTORY}/trail/rounds/round-1.md`, "src/a.ts"] })).toEqual(verifying);
    // A folder whose name opens with the directory's is outside it.
    expect(stepOwed({ ...NOTHING, rounds: none, changed: [`${DIRECTORY}-other/routing.md`] })).toEqual(verifying);
    // The round's number follows the last record's, and its range opens at that record's target as written.
    const second = [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}` })), round(4, closedRecord(4, `${B.slice(0, 7)}, fixes ${A}..${B}`, { 2: "rejected" }))];
    expect(stepOwed({ ...NOTHING, rounds: second })).toEqual({ is: "round", round: 5, target: `${HEAD}, fixes ${B.slice(0, 7)}..${HEAD}`, from: B.slice(0, 7) });
  });

  const SETTLED = [round(1, closedRecord(1, `${A} against main`, { 1: `fixed ${B}` })), round(2, closedRecord(2, `${B}, fixes ${A}..${B}`, {}, ["round-1#1"]))];
  const CLOSING = [`${DIRECTORY}/trail/gate.md`, `${DIRECTORY}/guarantee.md`, `${DIRECTORY}/trail/refusals.md`];

  it("is the broad gate, on the branch's head, where the last record holds no finding to answer, every commit after its target changed the work item's directory alone, and the gate does not hold at the head: no run stands, or a path that is no closing record differs between the gate's commit and the head", () => {
    const gate = { is: "gate", round: 2, head: HEAD };
    expect(stepOwed({ ...NOTHING, rounds: SETTLED })).toEqual(gate);
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, changed: [`${DIRECTORY}/trail/rounds/round-2.md`, `${DIRECTORY}/decisions.md`] })).toEqual(gate);
    // A deferred finding owes the next round nothing.
    expect(stepOwed({ ...NOTHING, rounds: [round(1, closedRecord(1, `${A} against main`, { 1: "deferred #12" }))] })).toEqual({ is: "gate", round: 1, head: HEAD });
    // A run on an earlier commit, and a later commit that changed a source file, which a round has read.
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: ["feature.txt"] })).toEqual(gate);
    // A decision committed after the gate's commit, a round's record, and one path among the closing records that is none.
    for (const path of [`${DIRECTORY}/decisions.md`, `${DIRECTORY}/trail/rounds/round-2.md`, `${DIRECTORY}/routing.md`]) {
      expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: [...CLOSING, path] }), path).toEqual(gate);
    }
    // A closing record is a file of this work item's directory, at its own path.
    for (const path of ["trail/gate.md", "guarantee.md", `${DIRECTORY}-other/trail/gate.md`, `${DIRECTORY}/frame/guarantee.md`, `${DIRECTORY}/trail/gate.md.orig`, `${DIRECTORY}/trail/refusals`, `seal/threads/other/guarantee.md`]) {
      expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: [path] }), path).toEqual(gate);
    }
  });

  it("is the seal, on the gate's commit, where the gate holds at the head and the newest verdict block is no seal of that commit: no verdict stands, the newest reads withheld or undecided, or it seals another commit, and the run is one more than the verdicts that stand", () => {
    const seal = { is: "seal", round: 2, commit: HEAD, run: 1 };
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: HEAD })).toEqual(seal);
    // The seal is on the gate's commit, whatever closing record the head holds after it.
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: CLOSING })).toEqual({ ...seal, commit: A });
    for (const path of CLOSING) expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: [path] }), path).toEqual({ ...seal, commit: A });
    // The directory as the order holds it may end with a slash.
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, directory: `${DIRECTORY}/`, gateCommit: A, sinceGate: CLOSING })).toEqual({ ...seal, commit: A });
    // A verdict that withheld or asked leaves the seal owed, as the next run.
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: CLOSING, verdicts: [verdict("withheld")] })).toEqual({ ...seal, commit: A, run: 2 });
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: CLOSING, verdicts: [verdict("withheld"), verdict("undecided")] })).toEqual({ ...seal, commit: A, run: 3 });
    // A seal of a commit other than the gate's is no seal of this gate.
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: HEAD, verdicts: [verdict("sealed", A)], sealCommit: A })).toEqual({ ...seal, run: 2 });
  });

  it("is sealed at the gate's commit where the gate holds at the head and the newest verdict block seals that commit", () => {
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: CLOSING, verdicts: [verdict("withheld"), verdict("sealed", A)], sealCommit: A })).toEqual({ is: "sealed", round: 2, at: A });
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: HEAD, verdicts: [verdict("sealed", HEAD)], sealCommit: HEAD })).toEqual({ is: "sealed", round: 2, at: HEAD });
  });

  it("is the gate before any seal: a seal that stands is not read where the gate does not hold at the head, so a decision committed after a sealed commit owes the gate again", () => {
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, gateCommit: A, sinceGate: [...CLOSING, `${DIRECTORY}/decisions.md`], verdicts: [verdict("sealed", A)], sealCommit: A })).toEqual({ is: "gate", round: 2, head: HEAD });
    expect(stepOwed({ ...NOTHING, rounds: SETTLED, verdicts: [verdict("sealed", A)], sealCommit: A })).toEqual({ is: "gate", round: 2, head: HEAD });
  });

  it("is what the rounds owe before any gate, whether or not the gate holds: an open question parks, a reversed decision owes its fix pass, and a change outside the work item's directory owes a verifying round", () => {
    for (const gate of [{ gateCommit: null, sinceGate: [] }, { gateCommit: HEAD, sinceGate: [] }, { gateCommit: A, sinceGate: ["feature.txt"] }, { gateCommit: HEAD, sinceGate: [], verdicts: [verdict("sealed", HEAD)], sealCommit: HEAD }]) {
      expect(stepOwed({ ...NOTHING, ...gate, rounds: SETTLED, openQuestion: true })).toEqual({ is: "parked" });
      expect(stepOwed({ ...NOTHING, ...gate, rounds: SETTLED, reversals: [REVERSAL] })).toMatchObject({ is: "fix-pass", round: 2 });
      expect(stepOwed({ ...NOTHING, ...gate, rounds: SETTLED, changed: ["feature.txt"] })).toMatchObject({ is: "round", round: 3 });
      expect(stepOwed({ ...NOTHING, ...gate })).toMatchObject({ is: "round", round: 1 });
    }
  });
});

describe("a round's answer", () => {
  const TARGET = `${A} against main`;
  const given = { round: 1, workItem: NAME, target: TARGET, earlier: [] };
  const refused = (answer: string, more: Partial<Parameters<typeof roundRecordOf>[1]> = {}): string => {
    try {
      roundRecordOf(answer, { ...given, ...more });
    } catch (error) {
      expect(error).toBeInstanceOf(ChainStop);
      return (error as Error).message;
    }
    return "taken";
  };

  it("is taken from its first line that opens the record to its end, unchanged, whatever the answer says before it", () => {
    const record = roundRecord(HEADING(1), TARGET, [1, 2]);
    expect(roundRecordOf(record, given)).toBe(record);
    expect(roundRecordOf(`I read the branch.\n\nThe record follows.\n${record}`, given)).toBe(record);
    // The text is the proofer's: a record with no line end at its end is taken with none.
    expect(roundRecordOf(record.trimEnd(), given)).toBe(record.trimEnd());
  });

  it("is refused where it holds no record, and where the record's heading names another round or another directory", () => {
    expect(refused("I found nothing to say.")).toBe(`its answer holds no round record: no line of it reads \`${HEADING(1)}\``);
    expect(refused(roundRecord(HEADING(2), TARGET))).toBe(`its record is headed \`${HEADING(2)}\`, and the round was given \`${HEADING(1)}\``);
    expect(refused(roundRecord("# Review round 1: another-work-item", TARGET))).toBe(`its record is headed \`# Review round 1: another-work-item\`, and the round was given \`${HEADING(1)}\``);
  });

  it("is refused where the reader refuses a line of it, with the line and the reader's reason", () => {
    const record = roundRecord(HEADING(1), TARGET, [1]).replace("severity: must", "severity: must\nseverity: should");
    expect(refused(record)).toMatch(/^the reader refuses line 13 of its record: .*a second `severity:` line: a finding block holds one$/u);
    expect(refused(`${HEADING(1)}\n\nNo block stands here.\n`)).toMatch(/^the reader refuses its record: no round block: /u);
  });

  it("is refused where its target line is another than the one the prompt gave", () => {
    expect(refused(roundRecord(HEADING(1), `${B} against main`))).toBe(`its record's target line reads \`${B} against main\`, and the round was given \`${TARGET}\``);
    // The commit shortened is another text than the prompt's.
    expect(refused(roundRecord(HEADING(1), `${A.slice(0, 7)} against main`))).toContain("and the round was given");
  });

  it("is refused where a finding of it holds a close block", () => {
    expect(refused(closedRecord(1, TARGET, { 1: null, 2: `fixed ${B}` }))).toBe("its record holds a close block under finding 2, and a round writes none: the fix pass closes a finding");
  });

  it("is refused in a verifying round where it names no line for a fixed or a rejected finding of the record before it, and taken where a confirms, a reopens or a regression line names each", () => {
    const before = round(1, closedRecord(1, TARGET, { 1: `fixed ${B}`, 2: "rejected", 3: "deferred #4" }));
    const target = `${HEAD}, fixes ${A}..${HEAD}`;
    const verifying = { round: 2, target, earlier: [before] };
    expect(refused(roundRecord(HEADING(2), target), verifying)).toBe("its record names no `confirms:`, `reopens:` or `regression:` line for findings 1 and 2 of round 1, which the fix pass closed");
    expect(refused(roundRecord(HEADING(2), target, [], ["round-1#1"]), verifying)).toBe("its record names no `confirms:`, `reopens:` or `regression:` line for finding 2 of round 1, which the fix pass closed");
    // A reference to an earlier round's finding of the same number names nothing of the record before this one.
    const third = { round: 3, target, earlier: [round(1, closedRecord(1, TARGET, { 1: "deferred #4", 2: "deferred #4" })), { ...before, round: 2 }] };
    expect(refused(roundRecord(HEADING(3), target, [], ["round-2#1", "round-1#2"]), third)).toBe("its record names no `confirms:`, `reopens:` or `regression:` line for finding 2 of round 2, which the fix pass closed");
    expect(refused(roundRecord(HEADING(2), target, [], ["round-1#1", "round-1#2"]), verifying)).toBe("taken");
    const reopening = roundRecord(HEADING(2), target, [1, 2], ["round-1#1"]).replace("evidence: read `feature.txt:2`", "evidence: read `feature.txt:2`\nreopens: round-1#2");
    expect(refused(reopening, verifying)).toBe("taken");
    const regressing = roundRecord(HEADING(2), target, [1], ["round-1#2"]).replace("evidence: read `feature.txt:1`", "evidence: read `feature.txt:1`\nregression: round-1#1");
    expect(refused(regressing, verifying)).toBe("taken");
  });
});

describe("a reference a round's answer makes", () => {
  const TARGET = `${A} against main`;
  const refused = (answer: string, given: Parameters<typeof roundRecordOf>[1]): string => {
    try {
      roundRecordOf(answer, given);
    } catch (error) {
      expect(error).toBeInstanceOf(ChainStop);
      return (error as Error).message;
    }
    return "taken";
  };
  const first = round(1, closedRecord(1, TARGET, { 1: `fixed ${B}`, 2: "deferred #4" }));
  const target = `${HEAD}, fixes ${A}..${HEAD}`;
  const verifying = { round: 2, workItem: NAME, target, earlier: [first] };

  it("is refused in the first record, which names no earlier round: on a confirms, a reopens and a regression line alike, with the line", () => {
    const given = { round: 1, workItem: NAME, target: TARGET, earlier: [] };
    expect(refused(roundRecord(HEADING(1), TARGET, [], ["round-1#1"]), given)).toBe("its record names `round-1#1` at line 12, and the first record names no earlier round: what it confirms is prose");
    const reopening = roundRecord(HEADING(1), TARGET, [1]).replace("evidence: read `feature.txt:1`", "evidence: read `feature.txt:1`\nreopens: round-1#1");
    expect(refused(reopening, given)).toBe("its record names `round-1#1` at line 15, and the first record names no earlier round: what it confirms is prose");
    const regressing = roundRecord(HEADING(1), TARGET, [1]).replace("evidence: read `feature.txt:1`", "evidence: read `feature.txt:1`\nregression: round-2");
    expect(refused(regressing, given)).toBe("its record names `round-2` at line 15, and the first record names no earlier round: what it confirms is prose");
  });

  it("is refused where it names a round that is no earlier record of the work item: the round itself, a later one, and a number no record holds", () => {
    expect(refused(roundRecord(HEADING(2), target, [], ["round-1#1", "round-2#1"]), verifying)).toBe("its record names `round-2#1` at line 17, which is not an earlier record of this work item");
    expect(refused(roundRecord(HEADING(2), target, [], ["round-3#2", "round-1#1"]), verifying)).toBe("its record names `round-3#2` at line 12, which is not an earlier record of this work item");
    // Round 2 was never written: the records before round 4 are those of rounds 1 and 3.
    const fourth = { round: 4, workItem: NAME, target, earlier: [first, { ...first, round: 3 }] };
    expect(refused(roundRecord(HEADING(4), target, [], ["round-3#1", "round-2#1"]), fourth)).toBe("its record names `round-2#1` at line 17, which is not an earlier record of this work item");
    expect(refused(roundRecord(HEADING(4), target, [], ["round-3#1", "round-1#2"]), fourth)).toBe("taken");
  });

  it("is refused where the record it names holds no finding of that number, and taken where a regression line names a record alone", () => {
    expect(refused(roundRecord(HEADING(2), target, [], ["round-1#1", "round-1#9"]), verifying)).toBe("its record names `round-1#9` at line 17, and round-1.md holds no finding 9");
    const regressing = roundRecord(HEADING(2), target, [1], ["round-1#1"]).replace("evidence: read `feature.txt:1`", "evidence: read `feature.txt:1`\nregression: round-1");
    expect(refused(regressing, verifying)).toBe("taken");
    expect(refused(regressing.replace("regression: round-1", "regression: round-1#3"), verifying)).toBe("its record names `round-1#3` at line 15, and round-1.md holds no finding 3");
  });
});

describe("the record a fix pass left", () => {
  const committed = roundRecord(HEADING(1), `${A} against main`, [1, 2]);
  const closing = (text: string, finding: number, verdict: string): string => text.replace(`finding ${String(finding)} leaves a sentence with no end.\n`, `finding ${String(finding)} leaves a sentence with no end.\n${closeBlock(verdict)}`);
  const refused = (before: string, after: string): string => {
    try {
      fixPassRecord(before, after);
    } catch (error) {
      expect(error).toBeInstanceOf(ChainStop);
      return (error as Error).message;
    }
    return "held";
  };

  it("holds where it differs from the committed record by close blocks alone, and names each block's finding and the findings still open", () => {
    const one = fixPassRecord(committed, closing(committed, 1, `fixed ${B}`));
    expect(one.closes.map(({ finding, located, close }) => [finding, located, close.verdict, close.commit, close.located])).toEqual([[1, ["feature.txt"], "fixed", B, []]]);
    expect(one.open).toEqual([2]);
    const both = fixPassRecord(committed, closing(closing(committed, 1, `fixed ${B}`), 2, "rejected"));
    expect(both.closes.map(({ finding, close }) => [finding, close.verdict])).toEqual([[1, "fixed"], [2, "rejected"]]);
    expect(both.open).toEqual([]);
    expect(fixPassRecord(committed, committed)).toEqual({ closes: [], open: [1, 2] });
    // A second pass on the record appends under the finding the first left open, and the first pass's block is no part of what it wrote.
    const first = closing(committed, 1, `fixed ${B}`);
    expect(fixPassRecord(first, closing(first, 2, "deferred #7")).closes.map(({ finding }) => finding)).toEqual([2]);
    // A close block's own location stands beside its finding's.
    const elsewhere = committed.replace("finding 2 leaves a sentence with no end.\n", `finding 2 leaves a sentence with no end.\n\n\`\`\`seal\nverdict: fixed ${B}\nlocation: \`docs/greeting.md\`, \`src/greet.ts:4\`\nanswer: The greeting's document said otherwise.\n\`\`\`\n`);
    expect(fixPassRecord(committed, elsewhere).closes.map(({ finding, located, close }) => [finding, located, close.located])).toEqual([[2, ["feature.txt"], ["docs/greeting.md", "src/greet.ts"]]]);
  });

  it("holds whatever blank lines stand around an appended block, and with a block appended at the end of a record that ends with no line end", () => {
    const tight = committed.replace("finding 1 leaves a sentence with no end.\n\n", `finding 1 leaves a sentence with no end.\n\`\`\`seal\nverdict: fixed ${B}\n\`\`\`\n\n`);
    expect(refused(committed, tight)).toBe("held");
    const wide = committed.replace("finding 1 leaves a sentence with no end.\n", `finding 1 leaves a sentence with no end.\n\n\n\`\`\`seal\nverdict: fixed ${B}\n\`\`\`\n\n`);
    expect(refused(committed, wide)).toBe("held");
    const bare = committed.trimEnd();
    expect(refused(bare, `${bare}\n\n\`\`\`seal\nverdict: rejected\nanswer: It holds.\n\`\`\`\n`)).toBe("held");
  });

  it("is refused where the pass changed a line of the proofer's, removed one or added one outside a close block", () => {
    const closed = closing(committed, 1, `fixed ${B}`);
    expect(refused(committed, closed.replace("severity: must", "severity: should"))).toBe("the round record it left differs from the committed one at line 12 by more than a close block");
    expect(refused(committed, closed.replace("Why it matters: finding 2 leaves a sentence with no end.\n", ""))).toMatch(/^the round record it left lacks line \d+ of the committed one$/u);
    expect(refused(committed, `${closed}\nThe finding was wrong from the start.\n`)).toMatch(/^the round record it left differs from the committed one at line \d+ by more than a close block$/u);
    // A blank line added away from every close block is a change of the proofer's text.
    expect(refused(committed, closed.replace("## Findings\n", "## Findings\n\n"))).toBe("the round record it left differs from the committed one at line 9 by more than a close block");
    // A close block the committed record already held is the earlier pass's, and this pass changes none of it.
    expect(refused(closed, closed.replace(`verdict: fixed ${B}`, "verdict: rejected"))).toMatch(/differs from the committed one at line \d+ by more than a close block$/u);
  });

  it("is refused where the reader refuses a line of it", () => {
    expect(refused(committed, committed.replace("finding 1 leaves a sentence with no end.\n", "finding 1 leaves a sentence with no end.\n\n```seal\nverdict: done\n```\n"))).toMatch(/^the reader refuses line 20 of the round record it left: .*a verdict is `fixed <commit>`, `rejected` or `deferred <home>`$/u);
  });
});

describe("a stage's prompt", () => {
  it("gives a round its number, the directory, the heading and the target its record carries, the earlier records, the record of decisions where one stands, the changed paths and their diff", () => {
    const prompt = roundPrompt({ round: 3, directory: DIRECTORY, target: `${HEAD}, fixes ${A}..${HEAD}`, earlier: [1, 2], decisions: true, paths: ["src/a.ts", "docs/b.md"], diff: "diff --git a/src/a.ts b/src/a.ts\n" });
    expect(prompt.shown.split("\n")).toEqual([
      `Review round 3 of the work item \`${NAME}\`, in this folder, which is the work item's worktree.`,
      "",
      `- The work item's directory: \`${DIRECTORY}\``,
      `- Your record's heading: \`${HEADING(3)}\``,
      `- Your record's target line: \`target: ${HEAD}, fixes ${A}..${HEAD}\``,
      `- Earlier round records: \`${DIRECTORY}/trail/rounds/round-1.md\`, \`${DIRECTORY}/trail/rounds/round-2.md\``,
      `- The decisions and the answers to hold to: \`${DIRECTORY}/decisions.md\``,
      "",
      `Your answer is the round record, whole, from its heading to its end. Owlery writes it unchanged to \`${DIRECTORY}/trail/rounds/round-3.md\` and commits it. Write no file and run no command: read the files of this folder.`,
      "",
      "The reviewed commits changed these paths:",
      "- `src/a.ts`",
      "- `docs/b.md`",
      "",
    ]);
    expect(prompt.diff).toBe("Their diff:\n\ndiff --git a/src/a.ts b/src/a.ts\n");
    expect(promptText(prompt)).toBe(`${prompt.shown}\n${prompt.diff}`);
    const first = roundPrompt({ round: 1, directory: DIRECTORY, target: `${HEAD} against main`, earlier: [], decisions: false, paths: [], diff: "" });
    expect(first.shown).toContain("- Earlier round records: none, this is the first round\n\nYour answer");
    expect(first.shown).toContain("The reviewed commits changed no path.\n");
    expect(first.shown).not.toContain("decisions.md");
    expect(promptText(first)).toBe(first.shown);
  });

  it("cuts a diff longer than the bound at the bound, and says how much of it the prompt holds", () => {
    const diff = "x".repeat(PROMPT_DIFF_CHARS + 5);
    const prompt = roundPrompt({ round: 1, directory: DIRECTORY, target: `${HEAD} against main`, earlier: [], decisions: false, paths: ["a"], diff });
    expect(prompt.diff).toBe(`Their diff, its first ${String(PROMPT_DIFF_CHARS)} characters of ${String(PROMPT_DIFF_CHARS + 5)}. Read the files for the rest.\n\n${"x".repeat(PROMPT_DIFF_CHARS)}`);
    expect(roundPrompt({ round: 1, directory: DIRECTORY, target: `${HEAD} against main`, earlier: [], decisions: false, paths: ["a"], diff: "x".repeat(PROMPT_DIFF_CHARS) }).diff).toBe(`Their diff:\n\n${"x".repeat(PROMPT_DIFF_CHARS)}`);
  });

  it("gives a fix pass the round record's path, the numbers of its open findings, each reversed decision with the person's message, and the path of the record of decisions", () => {
    const prompt = fixPassPrompt({ round: 2, directory: DIRECTORY, open: [1, 3, 4], reversals: [REVERSAL] });
    expect(prompt.shown.split("\n")).toEqual([
      `The fix pass of review round 2 of the work item \`${NAME}\`, in this folder, which is the work item's worktree.`,
      "",
      `- The round record: \`${DIRECTORY}/trail/rounds/round-2.md\``,
      "- Its open findings: 1, 3 and 4",
      "- The decisions the person reversed, each to take in:",
      '  - decision 3, "Start from main.": the person says "Start from the release branch."',
      `- The decisions and the answers to hold to: \`${DIRECTORY}/decisions.md\``,
      "",
      "Commit each fix yourself. Then append one close block under each finding you answer, and commit no change to the round record: Owlery commits the record after the pass.",
      "",
    ]);
    expect(prompt.diff).toBe("");
    const alone = fixPassPrompt({ round: 1, directory: DIRECTORY, open: [], reversals: [] }).shown;
    expect(alone).toContain("- Its open findings: none\n- The decisions and the answers");
  });
});

describe("what a chain does before a fix pass", () => {
  const stage = (kind: ChainStage["kind"], round: number, state: ChainStage["state"] = "finished"): ChainStage => ({ kind, round, state, failure: null, startedAt: 1, endedAt: 2, headlessId: null, refusals: 0, gate: null });
  const RUN = { judged: false, first: false };

  it("asks no judgment before the fix pass of round 1, and the orchestrator's before the fix pass of round 2 and of each later round below the ceiling", () => {
    expect(ROUNDS_CEILING).toBe(6);
    expect(gateBefore({ round: 1, open: [1] }, [stage("round", 1)], 6, RUN)).toBe("none");
    expect(gateBefore({ round: 1, open: [1] }, [], 6, RUN)).toBe("none");
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 1), stage("fix-pass", 1), stage("round", 2)], 6, RUN)).toBe("judgment");
    expect(gateBefore({ round: 5, open: [1] }, [stage("round", 5)], 6, RUN)).toBe("judgment");
    // A daemon that holds no stage of the chain asks too: nothing says that anybody judged.
    expect(gateBefore({ round: 2, open: [1] }, [], 6, RUN)).toBe("judgment");
  });

  it("asks nothing more once this run's judgment after that round was answered yes, and asks again where the judgment that was answered followed another round", () => {
    const stages = [stage("round", 2), stage("judgment", 2)];
    expect(gateBefore({ round: 2, open: [1] }, stages, 6, { judged: true, first: false })).toBe("none");
    // A judgment the stages hold is no answer to a run that no person started.
    expect(gateBefore({ round: 2, open: [1] }, stages, 6, RUN)).toBe("judgment");
  });

  it("takes a person's start as the answer where the chain's last stage is a judgment after that round that finished, at the start's first step alone", () => {
    const judged = [stage("round", 2), stage("judgment", 2)];
    const first = { judged: false, first: true };
    expect(gateBefore({ round: 2, open: [1] }, judged, 6, first)).toBe("none");
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2), stage("judgment", 2, "failed")], 6, first)).toBe("judgment");
    // A ruling on a stage's questions is no judgment of convergence, whichever of the two the chain's last stage is.
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2), stage("ruling", 2)], 6, first)).toBe("judgment");
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2), stage("judgment", 2), stage("ruling", 2)], 6, first)).toBe("judgment");
    expect(gateBefore({ round: 3, open: [1] }, [stage("round", 2), stage("judgment", 2), stage("fix-pass", 2), stage("round", 3)], 6, first)).toBe("judgment");
    expect(gateBefore({ round: 3, open: [1] }, [stage("judgment", 2)], 6, first)).toBe("judgment");
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2)], 6, first)).toBe("judgment");
    expect(gateBefore({ round: 2, open: [1] }, [], 6, first)).toBe("judgment");
  });

  it("stops at the ceiling and at each round after it with no judgment, whatever this run was answered, and goes on at the first step of a person's start", () => {
    expect(gateBefore({ round: 6, open: [1] }, [stage("round", 6)], 6, RUN)).toBe("ceiling");
    expect(gateBefore({ round: 7, open: [1] }, [stage("round", 7)], 6, RUN)).toBe("ceiling");
    expect(gateBefore({ round: 6, open: [1] }, [stage("round", 6)], 6, { judged: true, first: false })).toBe("ceiling");
    expect(gateBefore({ round: 6, open: [1] }, [stage("round", 6)], 6, { judged: false, first: true })).toBe("none");
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2)], 2, RUN)).toBe("ceiling");
    // A ceiling of 1 stops the chain before its first fix pass.
    expect(gateBefore({ round: 1, open: [1] }, [stage("round", 1)], 1, RUN)).toBe("ceiling");
    expect(gateBefore({ round: 5, open: [1] }, [stage("round", 5)], 6, RUN)).toBe("judgment");
  });

  it("asks nothing and stops nothing before a fix pass on a record that holds no open finding, which takes in a reversal alone", () => {
    expect(gateBefore({ round: 2, open: [] }, [stage("round", 2)], 6, RUN)).toBe("none");
    expect(gateBefore({ round: 6, open: [] }, [stage("round", 6)], 6, RUN)).toBe("none");
  });

  it("asks nothing and stops nothing before a second fix pass on one record, which a fix pass that finished after the round's own stage makes it", () => {
    const asked = [stage("round", 2), stage("judgment", 2), stage("fix-pass", 2), stage("ruling", 2)];
    expect(passedBefore(asked, 2)).toBe(true);
    expect(gateBefore({ round: 2, open: [1] }, asked, 6, RUN)).toBe("none");
    expect(gateBefore({ round: 2, open: [1] }, asked, 2, RUN)).toBe("none");
    // A pass that failed is none, and neither is the pass of an earlier round or of an earlier record of that number.
    expect(passedBefore([stage("round", 2), stage("fix-pass", 2, "failed")], 2)).toBe(false);
    expect(gateBefore({ round: 2, open: [1] }, [stage("round", 2), stage("fix-pass", 2, "failed")], 2, RUN)).toBe("ceiling");
    expect(passedBefore([stage("round", 1), stage("fix-pass", 1), stage("round", 2)], 2)).toBe(false);
    expect(passedBefore([stage("fix-pass", 2), stage("round", 2)], 2)).toBe(false);
    expect(passedBefore([stage("fix-pass", 2), stage("judgment", 3)], 2)).toBe(false);
    expect(passedBefore([], 2)).toBe(false);
  });
});

describe("the questions a stage's answer asks", () => {
  const BASE = askBlock({ asks: "Which base does the fix start from?", grounds: "No document names the base of a hotfix.", options: [["main", "The release's fixes are not in it."], ["release", ""]], default: "main" });
  const FREE = askBlock({ asks: "May the pass change the protocol?", grounds: "The frame names no such change." });

  it("are its asks blocks, in its order, each with its grounds, its options and its default, and none where it holds no such block", () => {
    expect(asksOf(`The pass met two questions.\n\n${BASE}\nAnd one more.\n\n${FREE}`)).toEqual([
      { asks: "Which base does the fix start from?", grounds: "No document names the base of a hotfix.", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release", implies: "" }], default: "main" },
      { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", options: [], default: null },
    ]);
    expect(asksOf("The fix pass is done. May it also change the protocol?")).toEqual([]);
    expect(asksOf("")).toEqual([]);
  });

  it("are read past what else an answer holds: a block of another kind, a comment's line and a fence that never closes are no question and stop nothing", () => {
    const answer = `<!-- a note -->\n\nI appended this block:\n\n${closeBlock("rejected")}\n${FREE}\n\`\`\`\nan open fence\n`;
    expect(asksOf(answer).map(({ asks }) => asks)).toEqual(["May the pass change the protocol?"]);
  });

  it("stop the stage where the reader refuses an asks block, with the line and the reader's reason", () => {
    const refused = (text: string): string => {
      try {
        asksOf(text);
      } catch (error) {
        expect(error).toBeInstanceOf(ChainStop);
        return (error as Error).message;
      }
      return "taken";
    };
    expect(refused("Prose.\n\n```seal\nasks: May it?\n```\n")).toBe("the reader refuses line 3 of its answer's question: the question block holds no `grounds:` line, and it holds one");
    expect(refused("```seal\nasks: May it?\ngrounds: None.\noption: `a` One.\noption: `a` Two.\n```\n")).toBe("the reader refuses line 1 of its answer's question: two `option:` lines hold the label `a`: a question block holds each label once");
    expect(refused("```seal\nasks: May it?\ngrounds: None.\noption: `a` One.\ndefault: `b`\n```\n")).toBe("the reader refuses line 1 of its answer's question: `default:` names `b`, and no `option:` line of the block holds that label");
    expect(refused("```seal\nasks:\ngrounds: None.\n```\n")).toContain("the reader refuses line 2 of its answer's question: `asks:` does not read whole");
  });

  it("are a proofer's only above its record: a record that holds an asks block is one the record's reader refuses", () => {
    const record = roundRecord(HEADING(1), `${HEAD} against main`, [1]);
    const given = { round: 1, workItem: NAME, target: `${HEAD} against main`, earlier: [] };
    expect(roundRecordOf(`${FREE}\n${record}`, given)).toBe(record);
    expect(() => roundRecordOf(`${record}\n${FREE}`, given)).toThrow(/^the reader refuses line 20 of its record: .*`asks: May the pass change the protocol\?` opens no `seal` block this record holds/u);
  });
});

describe("the orchestrator's answer", () => {
  const refused = (read: () => unknown): string => {
    try {
      read();
    } catch (error) {
      expect(error).toBeInstanceOf(ChainStop);
      return (error as Error).message;
    }
    return "taken";
  };

  it("is its judgment of convergence where it holds one block that reads yes or no, with its grounds, whatever stands around the block", () => {
    expect(convergenceOf(`I read both records.\n\n${convergenceBlock("yes", "Each round found less.")}\nThat is all.\n`)).toEqual({ converging: true, grounds: "Each round found less." });
    expect(convergenceOf(convergenceBlock("no", "Round 3 reopened round 1's finding."))).toEqual({ converging: false, grounds: "Round 3 reopened round 1's finding." });
  });

  it("is no judgment where it holds no such block or more than one, and where the reader refuses the block", () => {
    expect(refused(() => convergenceOf("The rounds are converging: yes."))).toBe("its answer holds no judgment: no `seal` block of it opens with `converging:`");
    expect(refused(() => convergenceOf(`${convergenceBlock("yes")}\n${convergenceBlock("no")}`))).toBe("its answer holds 2 blocks that open with `converging:`, and a judgment is one");
    expect(refused(() => convergenceOf("```seal\nconverging: maybe\ngrounds: Unsure.\n```\n"))).toBe("the reader refuses line 2 of its judgment: `converging: maybe` does not read whole as `converging: <value>`: it is `yes` or `no`");
    expect(refused(() => convergenceOf("```seal\nconverging: yes\n```\n"))).toBe("the reader refuses line 1 of its judgment: the judgment block holds no `grounds:` line, and it holds one");
  });

  it("is its rulings where it holds one for each question it was given: a decision of its kind with what was decided, or a park, each with its grounds, in the questions' order", () => {
    const answer = `${rulingBlock(2, "park", null, "Only the person can approve a push.")}\nAnd the first:\n\n${rulingBlock(1, "default", "The fix starts from main.", "The question's default, and `docs/roadmap.md` names no other base.")}`;
    expect(rulingsOf(answer, 2)).toEqual([
      { question: 1, is: "default", decided: "The fix starts from main.", grounds: "The question's default, and `docs/roadmap.md` names no other base." },
      { question: 2, is: "park", grounds: "Only the person can approve a push." },
    ]);
    expect(rulingsOf(rulingBlock(1, "scope", "The protocol stays as it is.", "The frame's scope names no such change."), 1).map((ruling) => ruling.is)).toEqual(["scope"]);
    expect(rulingsOf(rulingBlock(1, "answered", "It may.", "Read in the frame."), 1).map((ruling) => ruling.is)).toEqual(["answered"]);
  });

  it("is no ruling where a question has none, where two rule on one, where one rules on a number that is no question's, and where the reader refuses a block", () => {
    const one = rulingBlock(1, "answered", "It may.", "Read in the frame.");
    expect(refused(() => rulingsOf(one, 2))).toBe("its answer holds no ruling on question 2: no `seal` block of it opens with `rules: 2 `");
    expect(refused(() => rulingsOf("I would park both.", 2))).toBe("its answer holds no ruling on questions 1 and 2: no `seal` block of it opens with `rules: 1 `");
    expect(refused(() => rulingsOf(`${one}\n${one}`, 1))).toBe("its answer rules on question 1 twice");
    expect(refused(() => rulingsOf(`${one}\n${rulingBlock(2, "park", null, "A credential.")}`, 1))).toBe("its answer rules on question 2, and it was given one question");
    expect(refused(() => rulingsOf(`${one}\n${rulingBlock(3, "park", null, "A credential.")}`, 2))).toBe("its answer rules on question 3, and it was given 2 questions");
    expect(refused(() => rulingsOf("```seal\nrules: 1 park\ndecided: Wait.\ngrounds: A credential.\n```\n", 1))).toBe("the reader refuses line 1 of its ruling: the ruling block parks its question and holds a `decided:` line: a park decides nothing");
    expect(refused(() => rulingsOf("```seal\nrules: 1 scope\ngrounds: The frame.\n```\n", 1))).toBe("the reader refuses line 1 of its ruling: the ruling block holds no `decided:` line, and every ruling but `park` says what was decided");
    expect(refused(() => rulingsOf("```seal\nrules: 1 route\ndecided: Go on.\ngrounds: The frame.\n```\n", 1))).toContain("the reader refuses line 2 of its ruling: `rules: 1 route` does not read whole");
  });
});

describe("a judgment's prompt", () => {
  it("gives the judgment of convergence its round, the directory, every round record, the record of decisions where one stands, and the block its answer holds", () => {
    const prompt = convergencePrompt({ round: 2, directory: DIRECTORY, rounds: [1, 2], decisions: true });
    expect(prompt.shown.split("\n")).toEqual([
      `The judgment after review round 2 of the work item \`${NAME}\`, in this folder, which is the work item's worktree.`,
      "",
      `- The work item's directory: \`${DIRECTORY}\``,
      `- The round records, the oldest first: \`${DIRECTORY}/trail/rounds/round-1.md\`, \`${DIRECTORY}/trail/rounds/round-2.md\``,
      `- The decisions and the answers to hold to: \`${DIRECTORY}/decisions.md\``,
      "",
      "Round 2 left a finding open, and a fix pass on its record is owed. Judge from the records whether the review rounds are converging. Your answer holds one `seal` block, written so:",
      "",
      "```seal",
      "converging: <yes or no>",
      "grounds: <why, on one line>",
      "```",
      "",
      "Owlery records the answer as a decision made without asking. `yes` starts the fix pass, and `no` stops the chain for the person. Write no file and run no command: read the files of this folder.",
      "",
    ]);
    expect(prompt.diff).toBe("");
    expect(convergencePrompt({ round: 3, directory: DIRECTORY, rounds: [1, 2, 3], decisions: false }).shown).not.toContain("decisions.md");
    expect(givenQuestions(prompt.shown)).toBe(0);
  });

  it("gives the judgment on a stage's questions who asks and in which stage, each question under its number with its grounds, its options and its default, and the block its answer holds for each", () => {
    const asks = [
      { asks: "Which base does the fix start from?", grounds: "No document names the base of a hotfix.", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release", implies: "" }], default: "main" },
      { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", options: [], default: null },
    ];
    const prompt = rulingPrompt({ round: 1, directory: DIRECTORY, by: "crafter", asked: "fix-pass", asks, decisions: true });
    expect(prompt.shown.split("\n")).toEqual([
      `The judgment after review round 1 of the work item \`${NAME}\`, in this folder, which is the work item's worktree.`,
      "",
      `- The work item's directory: \`${DIRECTORY}\``,
      `- The decisions and the answers to hold to: \`${DIRECTORY}/decisions.md\``,
      "- Who asks: the crafter, in the fix pass of round 1",
      "",
      "Its questions:",
      "",
      "1. Which base does the fix start from?",
      "   - Why the crafter cannot answer it: No document names the base of a hotfix.",
      "   - Option `main`: The release's fixes are not in it.",
      "   - Option `release`",
      "   - Its default: `main`",
      "2. May the pass change the protocol?",
      "   - Why the crafter cannot answer it: The frame names no such change.",
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
    ]);
    expect(prompt.diff).toBe("");
    const one = rulingPrompt({ round: 2, directory: DIRECTORY, by: "proofer", asked: "round", asks: asks.slice(1), decisions: false }).shown;
    expect(one).toContain("- Who asks: the proofer, in review round 2\n\nIts question:\n\n1. May the pass");
    expect(one).not.toContain("decisions.md");
    expect([givenQuestions(prompt.shown), givenQuestions(one)]).toEqual([2, 1]);
  });
});

describe("the seal's prompt", () => {
  const given = { run: 2, directory: DIRECTORY, target: `${A} against main`, rounds: [1, 2], decisions: true, frame: true, phases: true, changelog: true, paths: ["feature.txt", `${DIRECTORY}/routing.md`], diff: "diff --git a/feature.txt b/feature.txt\n" };

  it("gives a sealer its run, the directory, the heading and the target line its verdict carries, the routing, every round record, the gate's record, the decisions, the frame, the phase records and the changelog where each stands, that no issue is named, the paths the branch changed and their diff", () => {
    const prompt = sealPrompt(given);
    expect(prompt.shown.split("\n")).toEqual([
      `Run 2 of the sealer on the work item \`${NAME}\`, in this folder, which is the work item's worktree.`,
      "",
      `- The work item's directory: \`${DIRECTORY}\``,
      "- Your section's heading: `## Run 2`",
      `- Your verdict's target line: \`target: ${A} against main\``,
      `- The routing: \`${DIRECTORY}/routing.md\``,
      `- The round records, the oldest first: \`${DIRECTORY}/trail/rounds/round-1.md\`, \`${DIRECTORY}/trail/rounds/round-2.md\``,
      `- The broad gate's record: \`${DIRECTORY}/trail/gate.md\``,
      `- The decisions and the answers to hold to: \`${DIRECTORY}/decisions.md\``,
      `- The frame: \`${DIRECTORY}/frame/\``,
      `- The phase records: \`${DIRECTORY}/trail/phases/\``,
      `- The changelog fragment: \`${DIRECTORY}/changelog.md\``,
      "- The issue: the work item names none, so no issue's text is among what you read",
      "",
      `Your answer is your run's section of the guarantee, whole, from its heading to its end, in the form of \`templates/records/sdd-guarantee.md\`. Its verdict block holds the target line above and one \`Verdict:\` line, and no other line: Owlery adds who built the work and who judged it, appends the section to \`${DIRECTORY}/guarantee.md\` and commits it. Write no file and run no command: read the files of this folder.`,
      "",
      "The branch changed these paths since it left its base:",
      "- `feature.txt`",
      `- \`${DIRECTORY}/routing.md\``,
      "",
    ]);
    expect(prompt.diff).toBe("Their diff:\n\ndiff --git a/feature.txt b/feature.txt\n");
    expect(givenSeal(promptText(prompt))).toEqual({ run: 2, heading: "## Run 2", target: `${A} against main` });
  });

  it("names no record that does not stand, says where the branch changed no path, and cuts a diff longer than the bound at the bound", () => {
    const bare = sealPrompt({ ...given, run: 1, decisions: false, frame: false, phases: false, changelog: false, paths: [], diff: "" });
    for (const absent of ["decisions.md", "/frame/", "/trail/phases/", "changelog.md"]) expect(bare.shown, absent).not.toContain(absent);
    expect(bare.shown).toContain("- Your section's heading: `## Run 1`\n");
    expect(bare.shown).toContain("The branch changed no path since it left its base.\n");
    expect(bare.diff).toBe("");
    const long = sealPrompt({ ...given, diff: "x".repeat(PROMPT_DIFF_CHARS + 5) });
    expect(long.diff).toBe(`Their diff, its first ${String(PROMPT_DIFF_CHARS)} characters of ${String(PROMPT_DIFF_CHARS + 5)}. Read the files for the rest.\n\n${"x".repeat(PROMPT_DIFF_CHARS)}`);
  });

  it("gives the ruling on a sealer's question who asks and in which stage, and the question with the run it stands in and no option", () => {
    const prompt = rulingPrompt({ round: 2, directory: DIRECTORY, by: "sealer", asked: "seal", asks: [undecidedAsk(3, "Does the frame's item 4 cover a renamed branch?")], decisions: false }).shown;
    expect(prompt).toContain("- Who asks: the sealer, in the sealer's session\n\nIts question:\n\n1. Does the frame's item 4 cover a renamed branch?\n   - Why the sealer cannot answer it: The sealer asked it in place of a verdict, in run 3 of guarantee.md.\n\nDecide each question");
    expect(undecidedAsk(3, "Does it?")).toEqual({ asks: "Does it?", grounds: "The sealer asked it in place of a verdict, in run 3 of guarantee.md.", options: [], default: null });
  });
});

describe("the record of the calls a role's rule refused", () => {
  const HEAD_LINES = [`# Refused calls: ${NAME}`, "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|"];

  it("opens with a heading and one table, and holds one row for each call: the stage, the role, the tool, what the call does and the rule", () => {
    const text = refusalsText(null, NAME, { kind: "round", round: 2, role: "proofer", calls: [{ tool: "Write", action: "write", rule: "no-write" }, { tool: "Bash", action: "run", rule: "no-command" }] });
    expect(text.split("\n")).toEqual([...HEAD_LINES, "| round 2 | proofer | Write | writes a file | no-write |", "| round 2 | proofer | Bash | runs a command | no-command |", ""]);
  });

  it("adds the rows of a later stage below the ones the file holds, whether or not the file ends with a line end, and names a fix pass, a judgment and a ruling by their rounds", () => {
    const first = refusalsText(null, NAME, { kind: "fix-pass", round: 1, role: "crafter", calls: [{ tool: "Write", action: "write", rule: "outside-worktree" }] });
    const second = refusalsText(first, NAME, { kind: "judgment", round: 2, role: "orchestrator", calls: [{ tool: "WebFetch", action: "other", rule: "other" }, { tool: "Read", action: "read", rule: "other" }] });
    const rows = ["| fix pass 1 | crafter | Write | writes a file | outside-worktree |", "| judgment 2 | orchestrator | WebFetch | something else | other |", "| judgment 2 | orchestrator | Read | reads a file | other |"];
    expect(second.split("\n")).toEqual([...HEAD_LINES, ...rows, ""]);
    expect(refusalsText(first.trimEnd(), NAME, { kind: "judgment", round: 2, role: "orchestrator", calls: [{ tool: "WebFetch", action: "other", rule: "other" }, { tool: "Read", action: "read", rule: "other" }] })).toBe(second);
    expect(refusalsText(second, NAME, { kind: "ruling", round: 2, role: "orchestrator", calls: [{ tool: "Bash", action: "run", rule: "no-command" }] }).split("\n")).toEqual([...HEAD_LINES, ...rows, "| ruling 2 | orchestrator | Bash | runs a command | no-command |", ""]);
  });

  it("writes a tool's name on one line of one cell, 100 characters of it at most", () => {
    const text = refusalsText(null, NAME, { kind: "round", round: 1, role: "proofer", calls: [{ tool: " mcp|a\nb\t c ", action: "other", rule: "other" }, { tool: "x".repeat(101), action: "other", rule: "other" }] });
    expect(text.split("\n").slice(4)).toEqual(["| round 1 | proofer | mcp/a b c | something else | other |", `| round 1 | proofer | ${"x".repeat(100)} | something else | other |`, ""]);
  });
});

describe("the routing a first start writes", () => {
  it("declares the branch through the review chain, names the session as planner and implementer, and holds no Automation row", () => {
    const text = routingText(NAME, "owlery/sealed-work", "2026-11-23");
    expect(declaredBranch(text)).toBe("owlery/sealed-work");
    expect(text.split("\n")).toEqual([
      `# Routing: ${NAME}`,
      "",
      "| Axis | Answer |",
      "|---|---|",
      "| Review | through the review chain |",
      "| Destination | open the pull request |",
      "| Planning | the session |",
      "| Implementation | the session |",
      "| Branch | owlery/sealed-work |",
      "",
      'Answered 2026-11-23 by Owlery, when the person pressed "Get a seal".',
      "",
      "## Why this way",
      "",
      "The branch was built in the person's own session, and the person asked for a seal on it.",
      "",
    ]);
  });

  it("answers who implemented as the routing's row says it, which a verdict names as a builder: the session of a routing the daemon wrote, another answer as it stands, and none where no such row stands, where the row is written twice, and where a renderer hides it", () => {
    const text = routingText(NAME, "owlery/sealed-work", "2026-11-23");
    expect(routingAnswer(text, "Implementation")).toBe("the session");
    expect(routingAnswer(text.replace("| Implementation | the session |", "| Implementation | crafter |"), "Implementation")).toBe("crafter");
    expect(routingAnswer(text.replace("| Implementation | the session |\n", ""), "Implementation")).toBeNull();
    expect(routingAnswer(text.replace("| Implementation | the session |", "| Implementation | crafter |\n| Implementation | the session |"), "Implementation")).toBeNull();
    expect(routingAnswer(text.replace("| Implementation | the session |", "<!--\n| Implementation | the session |\n-->"), "Implementation")).toBeNull();
    expect(routingAnswer("", "Implementation")).toBeNull();
  });
});

describe("a chain as the store reads it", () => {
  const stage = (more: Partial<ChainStage> = {}): ChainStage => ({ kind: "round", round: 1, state: "finished", failure: null, startedAt: 1, endedAt: 2, headlessId: 4, refusals: 0, gate: null, ...more });
  const GATE: ChainStage = stage({ kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: 0, output: true } });
  const chain = (more: Partial<Chain> = {}): Chain => ({ state: "sealed", says: "The sealer sealed ccccccc, after round 1.", stages: [stage()], since: 5, ...more });

  it("reads a chain that rests as it was stored, with the time it took its state, each stage naming no headless session, and none as none", () => {
    expect(chainRead(chain(), 9)).toEqual(chain({ stages: [stage({ headlessId: null })] }));
    expect(chainRead(null, 9)).toBeNull();
    expect(chainRead(undefined, 9)).toBeNull();
    // Only the fields of a chain, whatever else the file's entry carries.
    expect(chainRead({ ...chain(), extra: 1 } as Chain, 9)).toEqual(chain({ stages: [stage({ headlessId: null })] }));
  });

  it("reads a chain written before a chain kept the time of its state as in that state since its newest stage ended, since that stage started where it did not end, and since 0 where it holds no stage", () => {
    const { since: _since, ...written } = chain({ stages: [stage(), stage({ round: 2, startedAt: 3, endedAt: 4 })] });
    expect(isChain(written)).toBe(true);
    expect(chainRead(written, 9)?.since).toBe(4);
    expect(chainRead({ ...written, stages: [stage({ startedAt: 3, endedAt: null, state: "failed" })] }, 9)?.since).toBe(3);
    expect(chainRead({ ...written, stages: [] }, 9)?.since).toBe(0);
  });

  it("reads a chain stored running as stopped: its sentence says that the daemon ended while the stage ran, and the stage that was working has failed", () => {
    const working = stage({ kind: "fix-pass", round: 2, state: "working", endedAt: null, headlessId: 9 });
    expect(chainRead(chain({ state: "running", says: "The fix pass of round 2 is running.", stages: [stage(), working] }), 9)).toEqual({
      state: "stopped",
      // Stopped since the clock of the daemon that reads it, not since the chain began to run.
      since: 9,
      says: "The daemon ended while the fix pass of round 2 ran.",
      stages: [stage({ headlessId: null }), { ...working, state: "failed", failure: "the daemon ended while the stage ran", headlessId: null }],
    });
    expect(chainRead(chain({ state: "running", says: "Review round 1 is running.", stages: [stage({ state: "working", endedAt: null })] }), 9)?.says).toBe("The daemon ended while review round 1 ran.");
    const gate = stage({ kind: "gate", round: 2, state: "working", endedAt: null, headlessId: null, gate: { command: "true", exitCode: null, output: false } });
    expect(chainRead(chain({ state: "running", says: "The broad gate is running.", stages: [gate] }), 9)).toMatchObject({ says: "The daemon ended while the broad gate ran.", stages: [{ ...gate, state: "failed", failure: "the daemon ended while the stage ran" }] });
    // A chain that was between two stages had none working.
    expect(chainRead(chain({ state: "running", says: "Owlery is reading the work item's records." }), 9)).toMatchObject({ state: "stopped", since: 9, says: "The daemon ended while the chain ran.", stages: [stage({ headlessId: null })] });
  });

  it("reads a stage that a build before the gate stored, which holds no gate field, with no gate's run, and a gate's stage with its run: the command, the exit code and whether output is kept, and nothing else the file's entry carries", () => {
    const { gate: _gate, ...before } = stage();
    const written = { ...chain(), stages: [before, GATE] };
    expect(isChain(written)).toBe(true);
    expect(chainRead(written, 9)?.stages).toEqual([stage({ headlessId: null }), GATE]);
    const more = { ...chain(), stages: [{ ...GATE, gate: { ...GATE.gate, pid: 7 } }] };
    expect(isChain(more)).toBe(true);
    expect(chainRead(more as Chain, 9)?.stages).toEqual([GATE]);
    // A run whose command still runs, and one no process exited of, hold no exit code.
    expect(isChain(chain({ stages: [stage({ kind: "gate", gate: { command: "true", exitCode: null, output: false } })] }))).toBe(true);
    for (const gate of [{}, "true", 0, [], { command: 1, exitCode: 0, output: true }, { command: "true", exitCode: "0", output: true }, { command: "true", exitCode: 0, output: "yes" }, { command: "true", exitCode: 0 }, { command: "true", output: true }, { exitCode: 0, output: true }]) {
      expect(isChain({ ...chain(), stages: [{ ...GATE, gate }] }), JSON.stringify(gate)).toBe(false);
    }
  });

  it("names the broad gate in a chain's sentences, whatever round it follows", () => {
    expect(runningSays("gate", 2)).toBe("The broad gate is running.");
    expect(stoppedSays("gate", 2, "the command exited with code 3")).toBe("The broad gate failed: the command exited with code 3.");
    expect(refusalsText(null, NAME, { kind: "gate", round: 2, role: "sealer", calls: [{ tool: "Bash", action: "run", rule: "no-command" }] }).split("\n")[4]).toBe("| gate 2 | sealer | Bash | runs a command | no-command |");
  });

  it("names the sealer's session in a chain's sentences, whatever round it follows, and says a seal and a withheld verdict", () => {
    expect(runningSays("seal", 2)).toBe("The sealer's session is running.");
    expect(stoppedSays("seal", 2, "its answer holds no section of the guarantee")).toBe("The sealer's session failed: its answer holds no section of the guarantee.");
    expect(sealedSays(2, HEAD)).toBe("The sealer sealed ccccccc, after round 2.");
    expect(withheldSays("The changelog names `gone.ts`, which the tree does not hold.")).toBe("The sealer withheld its verdict: The changelog names `gone.ts`, which the tree does not hold.");
    expect(withheldSays("no reason is given")).toBe("The sealer withheld its verdict: no reason is given.");
    expect(refusalsText(null, NAME, { kind: "seal", round: 2, role: "sealer", calls: [{ tool: "Bash", action: "run", rule: "no-command" }] }).split("\n")[4]).toBe("| seal 2 | sealer | Bash | runs a command | no-command |");
    const seal = stage({ kind: "seal", round: 2, state: "working", endedAt: null, headlessId: 3 });
    expect(chainRead(chain({ state: "running", says: "The sealer's session is running.", stages: [seal] }), 9)).toMatchObject({ state: "stopped", says: "The daemon ended while the sealer's session ran.", stages: [{ ...seal, state: "failed", failure: "the daemon ended while the stage ran", headlessId: null }] });
  });

  it("reads a chain that an earlier build stored as reviewed as no chain, and takes it as a chain of the file, with the commit it settled at or without", () => {
    const reviewed = { ...chain(), state: "reviewed", says: "The review rounds settled at ccccccc, after round 1.", reviewedAt: HEAD };
    expect(isChain(reviewed)).toBe(true);
    expect(chainRead(reviewed as unknown as WrittenChain, 9)).toBeNull();
    const { reviewedAt: _at, ...bare } = reviewed;
    expect(isChain(bare)).toBe(true);
    expect(chainRead(bare as unknown as WrittenChain, 9)).toBeNull();
    // A chain of this build that an earlier build's field rides on is read without it.
    expect(isChain({ ...chain(), reviewedAt: null })).toBe(true);
    expect(chainRead({ ...chain(), reviewedAt: null } as unknown as WrittenChain, 9)).toEqual(chain({ stages: [stage({ headlessId: null })] }));
  });

  it("tells a chain from what is none: a state, a stage's kind or a stage's state the protocol does not list, and a field of another type", () => {
    expect(isChain(chain())).toBe(true);
    expect(isChain(chain({ stages: [] }))).toBe(true);
    // Each kind of stage and each state the protocol lists is a chain's.
    for (const kind of ["round", "fix-pass", "judgment", "ruling", "seal"] as const) expect(isChain(chain({ stages: [stage({ kind })] })), kind).toBe(true);
    for (const state of ["running", "parked", "stopped", "sealed"] as const) expect(isChain(chain({ state })), state).toBe(true);
    for (const wrong of [null, {}, { ...chain(), state: "reviewing" }, { ...chain(), says: 1 }, { ...chain(), reviewedAt: 1 }, { ...chain(), state: "reviewed", reviewedAt: 1 }, { ...chain(), stages: "none" }, { ...chain(), since: "5" }, { ...chain(), since: null }, chain({ stages: [stage({ kind: "audit" as "round" })] }), chain({ stages: [stage({ state: "stopped" as "failed" })] }), chain({ stages: [{ ...stage(), refusals: "0" } as unknown as ChainStage] }), chain({ stages: [{ ...stage(), round: null } as unknown as ChainStage] })]) {
      expect(isChain(wrong), JSON.stringify(wrong)).toBe(false);
    }
  });
});

// Each chain is some tens of git commands and three or more sessions, beside the rest of the suite.
describe("a work item's chain", { timeout: 60_000 }, () => {
  /** A stage as a chain lists one that ended. */
  const ended = (kind: ChainStage["kind"], round: number, headlessId: number, more: Partial<ChainStage> = {}): ChainStage => ({ kind, round, state: "finished", failure: null, startedAt: NOW, endedAt: NOW, headlessId, refusals: 0, gate: null, ...more });
  /** The stage of a broad gate whose command, the stand-in `true`, passed after the round given. */
  const passed = (round: number, more: Partial<ChainStage> = {}): ChainStage => ({ kind: "gate", round, state: "finished", failure: null, startedAt: NOW, endedAt: NOW, headlessId: null, refusals: 0, gate: { command: "true", exitCode: 0, output: false }, ...more });
  const recordAt = (worktree: string, round: number): string => join(worktree, DIRECTORY, "trail", "rounds", `round-${String(round)}.md`);
  const VERDICT_COMMIT = { subject: "chore: record the sealer's verdict", body: TRAILER, paths: [`${DIRECTORY}/guarantee.md`] };

  it("runs two rounds, one fix pass, the broad gate and the seal: the branch holds, in order, the commit of routing.md, of round 1's record, the crafter's fix, the commit of the closed record, of round 2's record, of the broad gate's run on that record's commit and of the sealer's verdict on that same commit, each of the daemon's with the trailer and the fix pass's with its session's id, each record is the proofer's text unchanged, the verdict block holds the sealer's two lines and the daemon's four, the chain is sealed, and a second getSeal starts no stage", async () => {
    const answers: string[] = [];
    const proofer = (given: { round: number; heading: string; target: string }): string => {
      answers.push(proofs(given));
      return `I read the branch.\n\n${answers.at(-1) ?? ""}`;
    };
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer }) });
    const a = workItems[0]!;
    const built = head(a.worktree);
    expect(c.workItem(a.id)?.chain).toBeNull();

    expect(await c.getSeal(a.id, 1)).toBe("done");
    // The answer comes before the inbox that carries the chain.
    const order = c.messages.flatMap((m) => (m.type === "done" || (m.type === "inbox" && m.workItems[0]?.chain != null) ? [m.type] : []));
    expect(order.slice(0, 2)).toEqual(["done", "inbox"]);
    const chain = await c.chain(a.id, "sealed");

    const record = (round: number): string => `${DIRECTORY}/trail/rounds/round-${String(round)}.md`;
    expect(commitsAfterMain(a.worktree)).toEqual([
      { subject: "feat: greet", body: "", paths: ["feature.txt"] },
      { subject: "chore: declare the work item's routing", body: TRAILER, paths: [`${DIRECTORY}/routing.md`] },
      { subject: "chore: record review round 1", body: TRAILER, paths: [record(1)] },
      { subject: "fix: end the greeting", body: "", paths: ["feature.txt"] },
      // The crafter's session named itself `fake-2`, the second session of the case's adapter.
      { subject: "chore: record the fix pass of round 1", body: `${TRAILER}\nSeal-Built-By: fake-2`, paths: [record(1)] },
      { subject: "chore: record review round 2", body: TRAILER, paths: [record(2)] },
      { subject: "chore: record the broad gate's run", body: TRAILER, paths: [`${DIRECTORY}/trail/gate.md`] },
      VERDICT_COMMIT,
    ]);
    expect(git(a.worktree, "log", "-1", "--format=%an <%ae>, %cn <%ce>").trim()).toBe("Owlery Test <test@owlery.invalid>, Owlery Test <test@owlery.invalid>");
    expect(status(a.worktree)).toEqual([]);
    const [routing, first, fix, , second] = git(a.worktree, "log", "--reverse", "--format=%H", `${built}..HEAD`).trim().split("\n") as [string, string, string, string, string];
    expect(git(a.worktree, "show", `${routing}:${DIRECTORY}/routing.md`)).toBe(routingText(NAME, a.branch, TODAY));
    // Round 1 read the commit that holds the routing, against the work item's base, and round 2 the commits after that target.
    expect(answers[0]).toBe(roundRecord(HEADING(1), `${routing} against ${a.baseBranch ?? a.baseCommit}`, [1]));
    expect(git(a.worktree, "show", `${first}:${record(1)}`)).toBe(answers[0]);
    const closed = (answers[0] ?? "").replace("finding 1 leaves a sentence with no end.\n", `finding 1 leaves a sentence with no end.\n${closeBlock(`fixed ${fix}`)}`);
    expect(readFileSync(recordAt(a.worktree, 1), "utf8")).toBe(closed);
    const fixed = git(a.worktree, "rev-parse", `${second}~1`).trim();
    expect(answers[1]).toBe(roundRecord(HEADING(2), `${fixed}, fixes ${routing}..${fixed}`, [], ["round-1#1"]));
    expect(readFileSync(recordAt(a.worktree, 2), "utf8")).toBe(answers[1]);

    // The gate ran on the commit of round 2's record, and the verdict names that same commit: no seal is written for another.
    expect(git(a.worktree, "rev-parse", "HEAD~2").trim()).toBe(second);
    expect(git(a.worktree, "show", `HEAD:${DIRECTORY}/trail/gate.md`)).toBe(gateRecord(NAME, [[second, a.baseCommit ?? ""]]));
    // The sealer wrote the target and the verdict, and the daemon who built, who judged, the model and its version: the routing names the session, the fix pass's session is `fake-2`, and the sealer's is `fake-4`.
    const section = sealSection({ heading: "## Run 1", target: `${second} against ${a.baseBranch ?? a.baseCommit}` });
    expect(git(a.worktree, "show", `HEAD:${DIRECTORY}/guarantee.md`)).toBe(guaranteeRecord(NAME, [sealedBy(section, "the session, fake-2", "fake-4")]));
    const sealed: Chain = { state: "sealed", says: `The sealer sealed ${second.slice(0, 7)}, after round 2.`, since: NOW, stages: [ended("round", 1, 1), ended("fix-pass", 1, 2), ended("round", 2, 3), passed(2), ended("seal", 2, 4)] };
    expect(chain).toEqual(sealed);

    // Nothing is owed, so a second start runs no stage and makes no commit.
    const before = c.messages.length;
    const at = head(a.worktree);
    expect(await c.getSeal(a.id, 2)).toBe("done");
    await c.until(() => (c.messages.slice(before).some((m) => m.type === "inbox" && m.workItems[0]?.chain?.state === "running") ? true : undefined));
    expect(await c.chain(a.id, "sealed")).toEqual(sealed);
    expect(head(a.worktree)).toBe(at);
    expect(c.messages.flatMap((m) => (m.type === "headless" ? [m.headless.id] : [])).every((id) => id <= 4)).toBe(true);
  });

  it("goes on with no client connected: the chain is sealed after the client left, the daemon asks for no exit before it rests and holds the Mac awake from the start to the rest in one hold, and a client that connects later is sent the chain in its ready", async () => {
    let idle = 0;
    const holds: string[] = [];
    const { c, url, workItems } = await standing(cleanups, ["Left alone"], {
      roleAdapter: roles(),
      idleExitMs: 1,
      onIdle: () => {
        idle += 1;
        holds.push("asked to exit");
      },
      holdAwake: () => {
        holds.push("held");
        return { release: () => void holds.push("released") };
      },
    });
    const a = workItems[0]!;
    // A daemon with no client asks to exit at its start, before the case's client connected: what follows is counted from here.
    idle = 0;
    holds.length = 0;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    c.socket.close();
    // No client is connected, so the daemon's own request to exit says when the chain has rested.
    const end = Date.now() + 30_000;
    while (idle === 0) {
      expect(Date.now()).toBeLessThan(end);
      await new Promise((r) => setTimeout(r, 20));
    }
    // One hold from the chain's start to its rest, and no exit asked before it: between two stages no session works, git runs for longer than the idle wait of 1 ms, and the hold and the daemon both stood.
    expect(holds).toEqual(["held", "released", "asked to exit"]);
    const later = await client(url, cleanups);
    const ready = await later.message("ready");
    expect(ready.workItems[0]?.chain).toMatchObject({ state: "sealed", says: `The sealer sealed ${git(a.worktree, "rev-parse", "HEAD~2").trim().slice(0, 7)}, after round 2.` });
    expect(ready.workItems[0]?.chain?.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
  });

  it("ends each stage's process before the next stage starts: every stage's run is stopped and has exited before the next one's start, the broad gate's command has exited before the sealer's start, and the sealer's run has exited before the chain rests", async () => {
    const { adapter, events } = noted(roles());
    // The gate's command notes its own process, and the case reads whether that process still lives when the sealer starts.
    const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-seal-case-")));
    cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
    const notes = join(folder, "noted");
    const order: string[] = [];
    const watching: RoleAdapter = {
      ...adapter,
      start: (options, listener) => {
        if (options.role?.role === "sealer") {
          let lives = true;
          try {
            process.kill(Number(readFileSync(notes, "utf8").trim()), 0);
          } catch {
            lives = false;
          }
          order.push(`the sealer starts, and the gate's process ${lives ? "lives" : "has exited"}`);
        }
        return adapter.start(options, listener);
      },
    };
    const { c, workItems } = await standing(cleanups, ["In order"], { roleAdapter: watching, gate: 'echo $$ > "$NOTED"; sleep 0.2', gateEnv: { PATH: process.env.PATH ?? "/usr/bin:/bin", NOTED: notes } });
    expect(await c.getSeal(workItems[0]!.id, 1)).toBe("done");
    c.until(() => (c.workItem(workItems[0]!.id)?.chain?.state === "sealed" ? true : undefined)).then(() => order.push(`the chain rests, after ${events.at(-1) ?? "nothing"}`), () => undefined);
    await c.chain(workItems[0]!.id, "sealed");
    expect(events).toEqual(["start proofer 1", "stop proofer 1", "exit proofer 1", "start crafter 2", "stop crafter 2", "exit crafter 2", "start proofer 3", "stop proofer 3", "exit proofer 3", "start sealer 4", "stop sealer 4", "exit sealer 4"]);
    await c.until(() => (order.length === 2 ? true : undefined));
    expect(order).toEqual(["the sealer starts, and the gate's process has exited", "the chain rests, after exit sealer 4"]);
  });

  it("lists a stage's session with its prompt and no diff, gives the agent the diff of what the branch changed since it left its base, launches a round as the proofer and a fix pass as the crafter in the worktree, and counts on the stage the calls the role's rule refused", async () => {
    const { adapter, started } = noted(roles({}, { asks: (_prompt, role) => (role?.role === "proofer" ? [{ tool: "Write", action: "write", path: "notes.md", text: "notes.md" }] : []) }));
    const { c, made, workItems } = await standing(cleanups, ["Listed"], { roleAdapter: adapter });
    const a = workItems[0]!;
    // The base gains a commit after the branch was cut, which is no part of what the branch changed.
    write(made.repo, "on-main.txt", "on main\n");
    commitAll(made.repo, "feat: on main");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "sealed");
    expect(started.map(({ cwd, role }) => [cwd, role])).toEqual([[a.worktree, { role: "proofer", stage: "round" }], [a.worktree, { role: "crafter", stage: "fix-pass" }], [a.worktree, { role: "proofer", stage: "round" }], [a.worktree, { role: "sealer", stage: "seal" }]]);
    const sessions = c.messages.flatMap((m) => (m.type === "headless" && m.headless.state === "finished" ? [m.headless] : []));
    expect(sessions.map(({ id, workItemId, role }) => [id, workItemId, role?.role])).toEqual([[1, a.id, "proofer"], [2, a.id, "crafter"], [3, a.id, "proofer"], [4, a.id, "sealer"]]);
    // The agent was given the diff of the reviewed commits, and the listed prompt is the same text up to it.
    expect(started[0]?.prompt).toContain("\nTheir diff:\n\ndiff --git a/feature.txt b/feature.txt\n");
    expect(started[0]?.prompt).toContain("+A greeting\n");
    expect(sessions[0]?.prompt).not.toContain("diff --git");
    expect(started[0]?.prompt).not.toContain("on-main.txt");
    // No record of decisions stands, so no prompt of a round names one.
    expect(started[0]?.prompt).not.toContain("decisions.md");
    expect(started[0]?.prompt.startsWith(`${sessions[0]?.prompt ?? "none"}\nTheir diff:`)).toBe(true);
    expect(sessions[0]?.prompt).toContain("- The work item's directory: `seal/threads/1795388700-listed`\n");
    expect(sessions[0]?.prompt).toContain("The reviewed commits changed these paths:\n- `feature.txt`\n- `seal/threads/1795388700-listed/routing.md`\n");
    // Round 2 is given the commits after round 1's target: the record's two commits and the fix.
    expect(started[2]?.prompt).toContain("+A greeting.\n");
    expect(started[2]?.prompt).toContain("- Earlier round records: `seal/threads/1795388700-listed/trail/rounds/round-1.md`\n");
    expect(started[1]?.prompt).toBe(sessions[1]?.prompt);
    // The proofer's write was refused by its grant in each round, and nothing was written.
    expect(chain.stages.map(({ kind, refusals }) => [kind, refusals])).toEqual([["round", 1], ["fix-pass", 0], ["round", 1], ["gate", 0], ["seal", 0]]);
    expect(existsSync(join(a.worktree, "notes.md"))).toBe(false);
    // The sealer is given the commit the gate passed on, the records to read, and the diff of what the branch changed since it left its base, as round 1 was: nothing the base gained since.
    const gate = git(a.worktree, "rev-parse", "HEAD~2").trim();
    const directory = "seal/threads/1795388700-listed";
    for (const absent of ["decisions.md", "/frame/", "/trail/phases/", "changelog.md"]) expect(sessions[3]?.prompt, absent).not.toContain(absent);
    expect(sessions[3]?.prompt).toContain(`- Your section's heading: \`## Run 1\`\n- Your verdict's target line: \`target: ${gate} against main\`\n- The routing: \`${directory}/routing.md\`\n- The round records, the oldest first: \`${directory}/trail/rounds/round-1.md\`, \`${directory}/trail/rounds/round-2.md\`\n- The broad gate's record: \`${directory}/trail/gate.md\`\n- The issue: `);
    expect(sessions[3]?.prompt).toContain(`The branch changed these paths since it left its base:\n- \`feature.txt\`\n- \`${directory}/routing.md\`\n- \`${directory}/trail/refusals.md\`\n- \`${directory}/trail/rounds/round-1.md\`\n- \`${directory}/trail/rounds/round-2.md\`\n`);
    expect(started[3]?.prompt.startsWith(`${sessions[3]?.prompt ?? "none"}\nTheir diff:\n\ndiff --git a/feature.txt b/feature.txt\n`)).toBe(true);
    expect(started[3]?.prompt).toContain("+A greeting.\n");
    expect(started[3]?.prompt).not.toContain("on-main.txt");
    expect(sessions[3]?.prompt).not.toContain("diff --git");
  });

  it("commits no person's word by itself while the chain runs, between two stages too, and commits the work item's record of decisions with the next stage's record", async () => {
    const stood = await standing(cleanups, ["Decided"], { roleAdapter: roles() });
    const { c, d } = stood;
    const a = stood.workItems[0]!;
    const directory = "seal/threads/1795388700-decided";
    write(a.worktree, `${directory}/routing.md`, routingText("1795388700-decided", a.branch, TODAY));
    commitAll(a.worktree, "chore: declare the routing by hand");
    d.decided(a.id, { kind: "default", says: "Start from main.", grounds: "The default base." });
    expect(status(a.worktree)).toEqual([`?? ${directory}/decisions.md`]);
    const before = commitsAfterMain(a.worktree).length;
    // The chain is held where it reads round 1's diff: it is running, and no session of it works.
    const held = heldGit(cleanups, stood.made.base, '[ "$1" = diff ] && [ "$2" = --name-only ]');
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.until(() => (held.waiting() ? true : undefined));
    expect(c.messages.some((m) => m.type === "headless")).toBe(false);
    c.send({ type: "reverseDecision", requestId: 2, workItemId: a.id, decisionId: 1, message: "Start from the release branch." });
    await c.message("done", (m) => m.requestId === 2);
    await new Promise((r) => setTimeout(r, 300));
    held.release();
    // The reversal stands written, and no commit of its own carried it.
    expect([commitsAfterMain(a.worktree).length, status(a.worktree)]).toEqual([before, [`?? ${directory}/decisions.md`]]);
    // Round 1's commit carries the record of decisions with the round's record, and the fix pass's commit the reversal it took in.
    await c.chain(a.id, "sealed");
    const commits = commitsAfterMain(a.worktree);
    expect(commits.find(({ subject }) => subject === "chore: record review round 1")).toEqual({ subject: "chore: record review round 1", body: "Seal-Routing: 1795388700-decided", paths: [`${directory}/decisions.md`, `${directory}/trail/rounds/round-1.md`] });
    expect(commits.map(({ subject }) => subject)).toEqual(["feat: greet", "chore: declare the routing by hand", "chore: record review round 1", "fix: end the greeting", "chore: record the fix pass of round 1", "chore: record review round 2", "chore: record the broad gate's run", "chore: record the sealer's verdict"]);
    expect(git(a.worktree, "show", `HEAD~5:${directory}/decisions.md`)).toContain("state: reversed\nreversal: Start from the release branch.\n");
    expect(commits.at(-4)?.paths).toEqual([`${directory}/decisions.md`, `${directory}/trail/rounds/round-1.md`]);
    // The verdict's commit holds the guarantee alone, a closing record: the record of decisions was committed before the gate.
    expect(commits.at(-1)?.paths).toEqual([`${directory}/guarantee.md`]);
    // The sealer's prompt names the record of decisions, which stood when it started.
    expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.role?.role === "sealer" ? [m.headless.prompt] : []))[0]).toContain(`- The decisions and the answers to hold to: \`${directory}/decisions.md\`\n`);
    expect(status(a.worktree)).toEqual([]);
    expect(git(a.worktree, "show", `HEAD:${directory}/decisions.md`)).toMatch(/\nstate: applied [0-9a-f]{40}\nreversal: Start from the release branch\.\n/u);
    // The record of decisions stood when round 1 started, so the round's prompt names it.
    expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.role?.role === "proofer" ? [m.headless.prompt] : []))[0]).toContain(`- The decisions and the answers to hold to: \`${directory}/decisions.md\`\n`);
  });

  it("starts no stage where the worktree left the work item's branch between two stages, and none where a second directory came to name the branch", async () => {
    const { adapter, started } = noted(roles());
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = stood.workItems[0]!;
    write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
    commitAll(a.worktree, "chore: declare the routing by hand");
    // Round 1's session has ended, and the chain is held at the commit of its record while the worktree's HEAD is detached.
    const held = heldGit(cleanups, stood.made.base, '[ "$1" = commit ]');
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    await stood.c.until(() => (held.waiting() ? true : undefined));
    git(a.worktree, "checkout", "--quiet", "--detach");
    held.release();
    expect((await stood.c.chain(a.id, "stopped")).says).toBe(`The chain stopped: the worktree is not on the branch ${a.branch}.`);
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer"]);

    // A crafter that commits a second directory naming the branch leaves the work item's own untold.
    const second = await standing(cleanups, ["Sealed work"], {
      roleAdapter: roles({
        crafter: (cwd, prompt) => {
          fixes(cwd, prompt);
          write(cwd, "seal/threads/2-second/routing.md", routingText("2-second", git(cwd, "symbolic-ref", "--short", "HEAD").trim(), TODAY));
          git(cwd, "add", "seal/threads/2-second");
          git(cwd, "commit", "--quiet", "-m", "chore: declare the routing twice");
        },
      }),
    });
    const b = second.workItems[0]!;
    expect(await second.c.getSeal(b.id, 1)).toBe("done");
    const chain = await second.c.chain(b.id, "stopped");
    expect(chain.says).toBe(`The chain stopped: two directories of the worktree's records name the branch ${b.branch}.`);
    expect(chain.stages.map(({ kind, state }) => [kind, state])).toEqual([["round", "finished"], ["fix-pass", "finished"]]);
  });

  it("reads round 1 against the commit the branch was cut at where the work item's base branch is gone", async () => {
    const { adapter, started } = noted(roles());
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = stood.workItems[0]!;
    // The run folder as it stands for a work item cut from a branch that was deleted since, read by a second daemon.
    await stood.d.close();
    writeFileSync(join(stood.runDir, "work-items.json"), JSON.stringify([{ ...a, baseBranch: "gone-branch" }]));
    rmSync(join(stood.runDir, "repositories.json"), { force: true });
    const { url } = await stood.start();
    const c = await client(url, cleanups);
    await c.message("ready");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(givenRound(started[0]?.prompt ?? "").target).toMatch(/^[0-9a-f]{40} against gone-branch$/u);
    expect(started[0]?.prompt).toContain("\nTheir diff:\n\ndiff --git a/feature.txt b/feature.txt\n");
  });

  it("reads round 1 against the commit the branch was cut at where the round block's target line does not take the base branch's name, so the round's record is one the reader takes", async () => {
    const { adapter, started } = noted(roles());
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = stood.workItems[0]!;
    // The run folder as it stands for a work item cut from a branch git allows and the target line's shape does not, read by a second daemon.
    await stood.d.close();
    writeFileSync(join(stood.runDir, "work-items.json"), JSON.stringify([{ ...a, baseBranch: "feat/a+b" }]));
    rmSync(join(stood.runDir, "repositories.json"), { force: true });
    const { url } = await stood.start();
    const c = await client(url, cleanups);
    await c.message("ready");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(a.baseCommit).toMatch(/^[0-9a-f]{40}$/u);
    expect(givenRound(started[0]?.prompt ?? "").target).toMatch(new RegExp(`^[0-9a-f]{40} against ${a.baseCommit ?? "none"}$`, "u"));
  });

  it("starts only once a commit of a person's word that is under way in the worktree has ended, so round 1's target holds a renamed branch's routing", async () => {
    const stood = await standing(cleanups, ["First name"], { roleAdapter: roles() });
    const { c } = stood;
    const a = stood.workItems[0]!;
    write(a.worktree, "seal/threads/1795388700-first-name/routing.md", routingText("1795388700-first-name", a.branch, TODAY));
    commitAll(a.worktree, "chore: declare the routing by hand");
    // The commit of the routing's new row is held, and the start waits for it.
    const held = heldGit(cleanups, stood.made.base, '[ "$1" = commit ]');
    c.send({ type: "renameWorkItem", requestId: 1, id: a.id, title: "Second name", branch: true });
    await c.message("done", (m) => m.requestId === 1);
    c.send({ type: "getSeal", requestId: 2, workItemId: a.id });
    await c.until(() => (held.waiting() ? true : undefined));
    await new Promise((r) => setTimeout(r, 300));
    expect(c.messages.some((m) => (m.type === "done" || m.type === "error") && m.requestId === 2)).toBe(false);
    held.release();
    await c.message("done", (m) => m.requestId === 2);
    await c.chain(a.id, "sealed");
    expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(2, 4)).toEqual(["chore: name the renamed branch in the work item's routing", "chore: record review round 1"]);
    expect(status(a.worktree)).toEqual([]);
  });

  it("starts no stage in a work item that was archived between two stages: the chain stops and says so, with the round's record committed", async () => {
    const { adapter, started } = noted(roles());
    const stood = await standing(cleanups, ["Shelved"], { roleAdapter: adapter });
    const { c } = stood;
    const a = stood.workItems[0]!;
    write(a.worktree, "seal/threads/1795388700-shelved/routing.md", routingText("1795388700-shelved", a.branch, TODAY));
    commitAll(a.worktree, "chore: declare the routing by hand");
    // Round 1's session has ended, and the chain is held at the commit of its record.
    const held = heldGit(cleanups, stood.made.base, '[ "$1" = commit ]');
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.until(() => (held.waiting() ? true : undefined));
    c.send({ type: "archiveWorkItem", requestId: 2, id: a.id, running: { panes: [], headless: [] } });
    await c.message("done", (m) => m.requestId === 2);
    held.release();
    const chain = await c.until(() => {
      const found = c.workItem(a.id)?.chain;
      return found?.state === "stopped" ? found : undefined;
    });
    expect(chain.says).toBe(`The chain stopped: work item ${String(a.id)} is archived, restore it first.`);
    expect(chain.stages.map(({ kind, state }) => [kind, state])).toEqual([["round", "finished"]]);
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer"]);
    expect(commitsAfterMain(a.worktree).at(-1)?.subject).toBe("chore: record review round 1");
  });

  it("stops where the directory a first start would make stands already under another branch's routing, and writes nothing over it", async () => {
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: roles() });
    const a = stood.workItems[0]!;
    const other = routingText(NAME, "owlery/another-branch", TODAY);
    write(a.worktree, `${DIRECTORY}/routing.md`, other);
    const at = commitAll(a.worktree, "chore: declare another branch's routing");
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    expect(await stood.c.chain(a.id, "stopped")).toEqual({ state: "stopped", says: `The chain stopped: ${DIRECTORY} stands already, and its routing names another branch.`, stages: [], since: NOW });
    expect([readFileSync(join(a.worktree, DIRECTORY, "routing.md"), "utf8"), head(a.worktree), status(a.worktree)]).toEqual([other, at, []]);
  });

  describe("a stage that fails or is stopped", () => {
    /** Two work items whose chains run side by side: the first one's round 1 goes as `first` has it, and the second one's chain is the plain one. */
    const beside = async (options: Parameters<typeof standing>[2]) => {
      const stood = await standing(cleanups, ["Stopped here", "Goes on"], options);
      const [a, b] = stood.workItems as [(typeof stood.workItems)[0], (typeof stood.workItems)[0]];
      return { ...stood, a, b };
    };
    const nameOf = (slug: string): string => `1795388700-${slug}`;
    /** Whether the worktree's branch holds a round record, committed or written. */
    const noRecord = (worktree: string, slug: string): void => {
      expect(existsSync(join(worktree, "seal", "threads", nameOf(slug), "trail"))).toBe(false);
      expect(commitsAfterMain(worktree).map(({ subject }) => subject)).toEqual(["feat: greet", "chore: declare the work item's routing"]);
      expect(status(worktree)).toEqual([]);
    };

    it("stops its one chain where a round's session fails: the chain says that round 1 failed and why, no record is written, the other work item's chain is sealed, and a later getSeal runs round 1 again", async () => {
      let failing = true;
      const inner = roles();
      const failed = fakeAdapter({ fail: "result" });
      const { c, a, b } = await beside({ roleAdapter: { ...inner, start: (options, listener) => (failing && options.cwd.endsWith("stopped-here") ? failed.start(options, listener) : inner.start(options, listener)) } });
      expect(await c.getSeal(a.id, 1)).toBe("done");
      expect(await c.getSeal(b.id, 2)).toBe("done");
      const stopped = await c.chain(a.id, "stopped");
      expect(stopped).toEqual({ state: "stopped", says: "Review round 1 failed: the fake adapter was told to fail.", since: NOW, stages: [{ kind: "round", round: 1, state: "failed", failure: "the fake adapter was told to fail", startedAt: NOW, endedAt: NOW, headlessId: stopped.stages[0]?.headlessId, refusals: 0, gate: null }] });
      noRecord(a.worktree, "stopped-here");
      expect((await c.chain(b.id, "sealed")).stages.map(({ state }) => state)).toEqual(["finished", "finished", "finished", "finished", "finished"]);
      failing = false;
      expect(await c.getSeal(a.id, 3)).toBe("done");
      const again = await c.chain(a.id, "sealed");
      // The stages of the first start stay, and the chain went on from the records: round 1 again.
      expect(again.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "failed"], ["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
    });

    it("stops its one chain where a client stops a round's session: the chain names the round and what stopped it, no record is written, and the other work item's chain runs to its end", async () => {
      const slow = roles({}, { delayMs: 150 });
      const quick = roles();
      const { c, a, b } = await beside({ roleAdapter: { ...quick, start: (options, listener) => (options.cwd.endsWith("stopped-here") ? slow : quick).start(options, listener) } });
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const { headless } = await c.message("headless", (m) => m.headless.workItemId === a.id);
      c.send({ type: "stopHeadless", requestId: 2, id: headless.id });
      expect((await c.chain(a.id, "stopped")).says).toBe("Review round 1 failed: the session was stopped at a request before it finished.");
      noRecord(a.worktree, "stopped-here");
      // The other work item's chain was not started, stopped or refused by it.
      expect(await c.getSeal(b.id, 3)).toBe("done");
      await c.chain(b.id, "sealed");
    });

    it("stops the chain where a round's session reaches its time limit", async () => {
      const { c, workItems } = await standing(cleanups, ["Stopped here"], { headlessLimitMs: 60, roleAdapter: roles({}, { delayMs: 300 }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      expect(chain.says).toBe("Review round 1 failed: the session reached its time limit and was stopped.");
      expect(chain.stages.map(({ state, failure }) => [state, failure])).toEqual([["failed", "the session reached its time limit and was stopped"]]);
      noRecord(a.worktree, "stopped-here");
    });

    it("stops the chain where a round's answer holds no record, and where an archive ends the round's session", async () => {
      let answer = "I read the branch and have nothing to add.";
      const { c, workItems } = await standing(cleanups, ["Stopped here"], { roleAdapter: roles({ proofer: () => answer }, { delayMs: 60 }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      expect(chain.says).toBe(`Review round 1 failed: its answer holds no round record: no line of it reads \`# Review round 1: ${nameOf("stopped-here")}\`.`);
      // The session itself finished: it is the stage that failed.
      expect(c.messages.flatMap((m) => (m.type === "headless" && m.headless.id === chain.stages[0]?.headlessId ? [m.headless.state] : [])).at(-1)).toBe("finished");
      noRecord(a.worktree, "stopped-here");

      answer = "still nothing";
      expect(await c.getSeal(a.id, 2)).toBe("done");
      const { headless } = await c.message("headless", (m) => m.headless.id !== chain.stages[0]?.headlessId && m.headless.state === "working");
      c.send({ type: "archiveWorkItem", requestId: 3, id: a.id, running: { panes: [], headless: [headless.id] } });
      await c.message("done", (m) => m.requestId === 3);
      const archived = await c.until(() => {
        const found = c.workItem(a.id);
        return found?.archivedAt != null && found.chain?.state === "stopped" && found.chain.stages.length === 2 ? found.chain : undefined;
      });
      expect(archived.says).toBe("Review round 1 failed: ended when the work item was archived.");
    });
  });

  describe("a start that is refused", () => {
    /** Asserts that the start was refused with the sentence, and that it started no session and wrote and committed nothing. */
    const refusedWith = async (stood: Awaited<ReturnType<typeof standing>>, id: number, says: string | RegExp, before: { status: string[]; head: string }, requestId = 9): Promise<void> => {
      const { c, workItems } = stood;
      const answer = await c.getSeal(id, requestId);
      if (typeof says === "string") expect(answer).toBe(says);
      else expect(answer).toMatch(says);
      const item = workItems.find((each) => each.id === id);
      if (item === undefined || !existsSync(item.worktree)) return;
      expect({ status: status(item.worktree), head: head(item.worktree) }).toEqual(before);
    };
    const stands = (worktree: string) => ({ status: status(worktree), head: head(worktree) });

    it("refuses a work item it does not list, an archived one and one whose folder is gone", async () => {
      const stood = await standing(cleanups, ["Archived", "Gone"]);
      const [a, b] = stood.workItems as [(typeof stood.workItems)[0], (typeof stood.workItems)[0]];
      await refusedWith(stood, 77, "no work item 77", stands(a.worktree), 1);
      stood.c.send({ type: "archiveWorkItem", requestId: 2, id: a.id, running: { panes: [], headless: [] } });
      await stood.c.message("done", (m) => m.requestId === 2);
      await refusedWith(stood, a.id, `work item ${String(a.id)} is archived, restore it first`, stands(a.worktree), 3);
      rmSync(b.worktree, { recursive: true });
      await refusedWith(stood, b.id, `the folder of work item ${String(b.id)} is gone: ${b.worktree}`, { status: [], head: "" }, 4);
      expect(stood.c.messages.some((m) => m.type === "headless")).toBe(false);
    });

    it("refuses a second start while the chain runs, and a start while a headless session of the work item is working or a pane of it says it is working", async () => {
      const stood = await standing(cleanups, ["Busy", "Asked in"], { roleAdapter: roles({}, { delayMs: 200 }) });
      const [a, b] = stood.workItems as [(typeof stood.workItems)[0], (typeof stood.workItems)[0]];
      const { c, d } = stood;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      expect(await c.getSeal(a.id, 2)).toBe(`The chain of work item ${String(a.id)} is already running.`);

      const before = stands(b.worktree);
      c.send({ type: "ask", requestId: 3, workItemId: b.id, prompt: "Still there?" });
      await c.message("asked");
      const working = `A session of work item ${String(b.id)} is working, and a round reads a tree nothing is changing. Get a seal once the session has finished.`;
      await refusedWith(stood, b.id, working, before, 4);
      await c.message("headless", (m) => m.headless.workItemId === b.id && m.headless.state === "finished");
      c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 5, workItemId: b.id });
      const { session } = await c.message("started");
      d.agentEvent(session.id, "UserPromptSubmit", {});
      await c.until(() => (c.messages.some((m) => m.type === "inbox" && m.sessions.some((each) => each.id === session.id && each.state === "working")) ? true : undefined));
      await refusedWith(stood, b.id, working, before, 6);
      // Only the ask's session and the first chain's stages ever started.
      expect(new Set(c.messages.flatMap((m) => (m.type === "headless" && m.headless.workItemId === b.id ? [m.headless.id] : []))).size).toBe(1);
      expect(c.workItem(b.id)?.chain).toBeNull();
    });

    it("refuses a worktree that is not on the work item's branch, and one with a merge under way", async () => {
      const stood = await standing(cleanups, ["Detached"]);
      const a = stood.workItems[0]!;
      git(a.worktree, "checkout", "--quiet", "--detach");
      await refusedWith(stood, a.id, `Owlery cannot commit a record in the worktree now: the worktree is not on the branch ${a.branch}.`, stands(a.worktree), 1);
      git(a.worktree, "checkout", "--quiet", a.branch);
      writeFileSync(join(git(a.worktree, "rev-parse", "--absolute-git-dir").trim(), "MERGE_HEAD"), `${head(a.worktree)}\n`);
      await refusedWith(stood, a.id, "Owlery cannot commit a record in the worktree now: a merge is under way in the worktree.", stands(a.worktree), 2);
    });

    it("refuses a worktree that holds a tracked file with a change no commit holds, or an untracked file, outside the work item's directory, and takes one whose only such file is inside it", async () => {
      const stood = await standing(cleanups, ["Changed"], { roleAdapter: roles() });
      const a = stood.workItems[0]!;
      writeFileSync(join(a.worktree, "feature.txt"), "A greeting, changed\n");
      await refusedWith(stood, a.id, "The worktree holds a change no commit holds, at feature.txt. A round reads a committed tree: commit the change or remove it first.", stands(a.worktree), 1);
      writeFileSync(join(a.worktree, "notes.txt"), "notes\n");
      await refusedWith(stood, a.id, "The worktree holds a change no commit holds, at feature.txt and 1 more. A round reads a committed tree: commit the change or remove it first.", stands(a.worktree), 2);
      git(a.worktree, "checkout", "--quiet", "--", "feature.txt");
      await refusedWith(stood, a.id, "The worktree holds a change no commit holds, at notes.txt. A round reads a committed tree: commit the change or remove it first.", stands(a.worktree), 3);
      rmSync(join(a.worktree, "notes.txt"));
      // With no directory of the work item yet, a file under the records root is outside it too.
      write(a.worktree, "seal/threads/9-other/notes.md", "notes\n");
      await refusedWith(stood, a.id, /^The worktree holds a change no commit holds, at seal\/threads\/9-other\/notes\.md\./u, stands(a.worktree), 4);
      rmSync(join(a.worktree, "seal/threads/9-other"), { recursive: true });
      // Inside the work item's directory a file no commit holds refuses nothing.
      write(a.worktree, "seal/threads/1795388700-changed/routing.md", routingText("1795388700-changed", a.branch, TODAY));
      commitAll(a.worktree, "chore: declare the routing by hand");
      write(a.worktree, "seal/threads/1795388700-changed/notes.md", "notes\n");
      expect(await stood.c.getSeal(a.id, 5)).toBe("done");
      await stood.c.chain(a.id, "sealed");
    });

    it("refuses a worktree with no records root, and one in which two directories name the branch", async () => {
      const bare = await standing(cleanups, ["Rootless"], { root: false });
      const a = bare.workItems[0]!;
      await refusedWith(bare, a.id, "The worktree holds no place for work records, so a round's record has nowhere to stand. Set up the records in the repository, and bring them onto this branch.", stands(a.worktree), 1);

      const stood = await standing(cleanups, ["Twice named"]);
      const b = stood.workItems[0]!;
      write(b.worktree, "seal/threads/1-one/routing.md", routingText("1-one", b.branch, TODAY));
      write(b.worktree, "seal/threads/2-two/routing.md", routingText("2-two", b.branch, TODAY));
      commitAll(b.worktree, "chore: declare the routing twice");
      await refusedWith(stood, b.id, `Two directories of the worktree's records name the branch ${b.branch}: seal/threads/1-one and seal/threads/2-two. Owlery cannot tell which is the work item's.`, stands(b.worktree), 2);
    });

    it("refuses a work item with no base commit, and one whose branch holds no commit after its base", async () => {
      const stood = await standing(cleanups, ["No base", "Nothing new"]);
      const [a, b] = stood.workItems as [(typeof stood.workItems)[0], (typeof stood.workItems)[0]];
      // The run folder as a build before the base commit was recorded wrote it, read by a second daemon.
      await stood.d.close();
      writeFileSync(join(stood.runDir, "work-items.json"), JSON.stringify(stood.workItems.map(({ baseCommit: _baseCommit, ...item }, index) => (index === 0 ? item : { ...item, baseCommit: head(b.worktree) }))));
      rmSync(join(stood.runDir, "repositories.json"), { force: true });
      const { url } = await stood.start();
      const c = await client(url, cleanups);
      await c.message("ready");
      const second = { ...stood, c };
      await refusedWith(second, a.id, "The work item records no commit its branch was cut at, so a round has no base to read the branch against.", stands(a.worktree), 1);
      await refusedWith(second, b.id, "The branch holds no commit after its base, so a round has nothing to read.", stands(b.worktree), 2);
    });

    it("refuses where the adapter does not declare both features of a role, and where the work item's record holds an open question", async () => {
      const lacking = await standing(cleanups, ["No role"], { roleAdapter: fakeAdapter({ features: ["role-tools"] }) });
      const a = lacking.workItems[0]!;
      await refusedWith(lacking, a.id, "the fake adapter cannot launch a role: it does not declare permission-requests", stands(a.worktree), 1);

      const stood = await standing(cleanups, ["Parked"], { roleAdapter: roles() });
      const b = stood.workItems[0]!;
      const directory = "seal/threads/1795388700-parked";
      write(b.worktree, `${directory}/routing.md`, routingText("1795388700-parked", b.branch, TODAY));
      commitAll(b.worktree, "chore: declare the routing by hand");
      stood.d.park(b.id, { by: "crafter", questions: [{ asks: "May the pass change the protocol?", grounds: "The frame names no such change." }] });
      await refusedWith(stood, b.id, "The work item waits for the answers to its open questions. Answer them first.", stands(b.worktree), 2);
      // A record that stands and cannot be read refuses the start with the reader's own reason.
      rmSync(join(b.worktree, directory, "decisions.md"));
      symlinkSync(join(b.worktree, "feature.txt"), join(b.worktree, directory, "decisions.md"));
      await refusedWith(stood, b.id, /decisions\.md is a link, and Owlery reads it only as a file of its own/u, stands(b.worktree), 3);
      expect(stood.c.messages.some((m) => m.type === "headless")).toBe(false);
      expect(stood.c.workItem(b.id)?.chain).toBeNull();
    });
  });

  describe("a chain that starts again from the records", () => {
    /** A work item whose branch holds its routing and round 1's record with finding 1, written by hand as a chain that ran elsewhere left them, and a daemon that holds no chain for it. */
    const withRoundOne = async (options: Parameters<typeof standing>[2], close: boolean) => {
      const stood = await standing(cleanups, ["Sealed work"], options);
      const a = stood.workItems[0]!;
      write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
      const target = commitAll(a.worktree, "chore: declare the work item's routing");
      const record = `${DIRECTORY}/trail/rounds/round-1.md`;
      write(a.worktree, record, roundRecord(HEADING(1), `${target} against main`, [1]));
      commitAll(a.worktree, "chore: record review round 1");
      if (close) {
        closeFinding(a.worktree, record, 1, `fixed ${commitFix(a.worktree)}`);
        commitAll(a.worktree, "chore: record the fix pass of round 1");
      }
      return { ...stood, a, target, record };
    };

    it("starts with a fix pass where the records hold round 1 with an open finding", async () => {
      const { adapter, started } = noted(roles());
      const { c, a, record } = await withRoundOne({ roleAdapter: adapter }, false);
      expect(c.workItem(a.id)?.chain).toBeNull();
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(chain.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
      expect(started[0]?.role).toEqual({ role: "crafter", stage: "fix-pass" });
      expect(givenFix(started[0]?.prompt ?? "")).toEqual({ record, open: [1] });
    });

    it("starts with a verifying round where the records hold a closed round 1 and no round 2: its target is the head, with the range from round 1's target to the head", async () => {
      const { adapter, started } = noted(roles());
      const { c, a, target } = await withRoundOne({ roleAdapter: adapter }, true);
      const at = head(a.worktree);
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(chain.stages.map(({ kind, round }) => [kind, round])).toEqual([["round", 2], ["gate", 2], ["seal", 2]]);
      expect(givenRound(started[0]?.prompt ?? "")).toEqual({ round: 2, heading: HEADING(2), target: `${at}, fixes ${target}..${at}` });
      expect(readRoundRecord(readFileSync(recordAt(a.worktree, 2), "utf8")).target?.said).toBe(`${at}, fixes ${target}..${at}`);
    });

    it("reads a round record as the branch's head holds it: a close block the worktree holds and no commit does leaves the finding open, and the fix pass that follows is held to the committed record, so its commit carries that block", async () => {
      const { adapter, started } = noted(roles({ crafter: () => undefined }));
      const { c, a, record } = await withRoundOne({ roleAdapter: adapter }, false);
      closeFinding(a.worktree, record, 1, "rejected");
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      // Read from the worktree, the finding would stand rejected and a verifying round would be first.
      expect(started.map(({ role }) => role?.role)).toEqual(["crafter", "proofer", "sealer"]);
      expect(chain.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
      expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(-4)).toEqual(["chore: record the fix pass of round 1", "chore: record review round 2", "chore: record the broad gate's run", "chore: record the sealer's verdict"]);
    });

    it("runs the gate and the seal, and no round, where the records hold a round that left nothing open and no commit after it changed a path outside the directory, reads the rounds in the order of their numbers, and stops where a round record the head holds does not read or names a target the repository does not hold", async () => {
      const { adapter, started } = noted(roles());
      const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = stood.workItems[0]!;
      const record = (number: number): string => `${DIRECTORY}/trail/rounds/round-${String(number)}.md`;
      write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
      const target = commitAll(a.worktree, "chore: declare the work item's routing");
      write(a.worktree, record(1), roundRecord(HEADING(1), `${target} against main`));
      const at = commitAll(a.worktree, "chore: record review round 1");
      expect(await stood.c.getSeal(a.id, 1)).toBe("done");
      const first = await stood.c.chain(a.id, "sealed");
      expect(git(a.worktree, "rev-parse", "HEAD~2").trim()).toBe(at);
      expect(first).toEqual({ state: "sealed", says: `The sealer sealed ${at.slice(0, 7)}, after round 1.`, stages: [passed(1), ended("seal", 1, 1)], since: NOW });
      // Round 10 is the last record, though git lists `round-10.md` before `round-2.md`.
      write(a.worktree, record(2), roundRecord(HEADING(2), `${at}, fixes ${target}..${at}`));
      write(a.worktree, record(10), roundRecord(HEADING(10), `${at}, fixes ${target}..${at}`));
      const later = commitAll(a.worktree, "chore: record two more rounds");
      expect(await stood.c.getSeal(a.id, 2)).toBe("done");
      // Two round records follow the gate's commit, so the gate runs again, on the head that holds them, and the seal that stands names another commit than that gate's, so the sealer runs again.
      const second = await stood.c.until(() => {
        const found = stood.c.workItem(a.id)?.chain;
        return found?.state === "sealed" && found.stages.length === 4 ? found : undefined;
      });
      expect(git(a.worktree, "rev-parse", "HEAD~2").trim()).toBe(later);
      expect([second.says, ...second.stages.slice(-2)]).toEqual([`The sealer sealed ${later.slice(0, 7)}, after round 10.`, passed(10), ended("seal", 10, 2)]);
      expect(readFileSync(join(a.worktree, DIRECTORY, "guarantee.md"), "utf8")).toContain(`\n## Run 2\n`);
      write(a.worktree, record(2), `${HEADING(2)}\n\nA record with no block.\n`);
      commitAll(a.worktree, "chore: break round 2's record");
      expect(await stood.c.getSeal(a.id, 3)).toBe("done");
      expect((await stood.c.chain(a.id, "stopped")).says).toMatch(new RegExp(`^The chain stopped: the reader refuses ${DIRECTORY}/trail/rounds/round-2\\.md: no round block: `, "u"));
      // A last record whose target names a commit the repository does not hold stops the chain with the record and the target.
      write(a.worktree, record(2), roundRecord(HEADING(2), `${at}, fixes ${target}..${at}`));
      write(a.worktree, record(10), roundRecord(HEADING(10), `${A}, fixes ${target}..${A}`));
      commitAll(a.worktree, "chore: name a target no commit bears");
      expect(await stood.c.getSeal(a.id, 4)).toBe("done");
      await stood.c.until(() => (stood.c.workItem(a.id)?.chain?.says.includes("names the target") ? true : undefined));
      expect(stood.c.workItem(a.id)?.chain?.says).toBe(`The chain stopped: ${DIRECTORY}/trail/rounds/round-10.md names the target ${A}, and the repository holds no such commit.`);
      // No round and no fix pass ran: each session of the case is a sealer's.
      expect(started.map(({ role }) => role?.role)).toEqual(["sealer", "sealer"]);
    });
  });

  it("reads a chain stored running as stopped at the daemon's start: its sentence says that the daemon ended while the stage ran, and no stage starts", async () => {
    const { adapter, started } = noted(roles({}, { delayMs: 300 }));
    const stood = await standing(cleanups, ["Cut short"], { roleAdapter: adapter });
    const a = stood.workItems[0]!;
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    await stood.c.until(() => (stood.c.workItem(a.id)?.chain?.stages[0]?.state === "working" ? true : undefined));
    // The daemon ends while round 1's session works, and its run folder holds the chain as running.
    await stood.d.close();
    expect((JSON.parse(readFileSync(join(stood.runDir, "repositories.json"), "utf8")) as { repositories: { workItems: { chain: Chain }[] }[] }).repositories[0]?.workItems[0]?.chain).toMatchObject({ state: "running", says: "Review round 1 is running.", stages: [{ state: "working", headlessId: 1 }] });
    const count = started.length;
    const { url } = await stood.start();
    const c = await client(url, cleanups);
    const ready = await c.message("ready");
    expect(ready.workItems[0]?.chain).toEqual({ state: "stopped", says: "The daemon ended while review round 1 ran.", since: NOW, stages: [{ kind: "round", round: 1, state: "failed", failure: "the daemon ended while the stage ran", startedAt: NOW, endedAt: null, headlessId: null, refusals: 0, gate: null }] });
    await new Promise((r) => setTimeout(r, 300));
    expect(started.length).toBe(count);
    expect(ready.headless).toEqual([]);
    expect(commitsAfterMain(a.worktree).map(({ subject }) => subject)).toEqual(["feat: greet", "chore: declare the work item's routing"]);
  });

  describe("a round whose record the check would refuse", () => {
    /** Runs a chain whose proofer answers round 1 as given, and gives the stopped chain's sentence once no record was written or committed. */
    const stoppedWith = async (proofer: (given: { round: number; heading: string; target: string }) => string, crafter?: (cwd: string, prompt: string) => void): Promise<string> => {
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer, crafter }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      const refusedRound = chain.stages.at(-1)?.round ?? 0;
      expect(existsSync(recordAt(a.worktree, refusedRound))).toBe(false);
      expect(commitsAfterMain(a.worktree).some(({ subject }) => subject === `chore: record review round ${String(refusedRound)}`)).toBe(false);
      expect(chain.stages.at(-1)).toMatchObject({ kind: "round", state: "failed" });
      return chain.says;
    };

    it("is not written where its target is another than the prompt's, where the reader refuses a line of it, and where it holds a close block", async () => {
      expect(await stoppedWith(({ heading }) => roundRecord(heading, `${A} against main`))).toMatch(new RegExp(`^Review round 1 failed: its record's target line reads \`${A} against main\`, and the round was given \`[0-9a-f]{40} against main\`\\.$`, "u"));
      expect(await stoppedWith(({ heading, target }) => roundRecord(heading, target, [1]).replace("location: `feature.txt:1`", "location: feature.txt"))).toMatch(/^Review round 1 failed: the reader refuses line 13 of its record: .*a location is one or more of `path`, `path:line` or `path:first-last`, each backticked, joined by `, `\.$/u);
      expect(await stoppedWith(({ heading, target }) => roundRecord(heading, target, [1]).replace("with no end.\n", `with no end.\n${closeBlock("rejected")}`))).toBe("Review round 1 failed: its record holds a close block under finding 1, and a round writes none: the fix pass closes a finding.");
    });

    it("is not written in a verifying round that names no line for the finding the fix pass closed", async () => {
      expect(await stoppedWith((given) => (given.round === 1 ? proofs(given) : roundRecord(given.heading, given.target)))).toBe("Review round 2 failed: its record names no `confirms:`, `reopens:` or `regression:` line for finding 1 of round 1, which the fix pass closed.");
    });

    it("is not written where the first round's record names an earlier round, and where a verifying round's names a finding the record before it does not hold", async () => {
      expect(await stoppedWith(({ heading, target }) => roundRecord(heading, target, [1], ["round-1#1"]))).toBe("Review round 1 failed: its record names `round-1#1` at line 22, and the first record names no earlier round: what it confirms is prose.");
      expect(await stoppedWith((given) => (given.round === 1 ? proofs(given) : roundRecord(given.heading, given.target, [], ["round-1#1", "round-1#2"])))).toBe("Review round 2 failed: its record names `round-1#2` at line 17, and round-1.md holds no finding 2.");
    });

    it("is not written where the worktree's head moved during the round, and where the round left a change outside the work item's directory", async () => {
      const moved = roles({}, { work: (cwd, _prompt, role) => (role?.role === "proofer" ? void commitFix(cwd) : undefined) });
      const first = await standing(cleanups, ["Sealed work"], { roleAdapter: moved });
      expect(await first.c.getSeal(1, 1)).toBe("done");
      expect((await first.c.chain(1, "stopped")).says).toMatch(/^Review round 1 failed: the worktree's head moved during the round, from [0-9a-f]{7} to [0-9a-f]{7}, so the round read another tree than its target\.$/u);
      expect(existsSync(recordAt(first.workItems[0]!.worktree, 1))).toBe(false);

      const left = roles({}, { work: (cwd, _prompt, role) => (role?.role === "proofer" ? writeFileSync(join(cwd, "notes.txt"), "notes\n") : undefined) });
      const second = await standing(cleanups, ["Sealed work"], { roleAdapter: left });
      expect(await second.c.getSeal(1, 1)).toBe("done");
      expect((await second.c.chain(1, "stopped")).says).toBe("Review round 1 failed: the worktree holds a change no commit holds outside the work item's directory, at notes.txt.");
      expect(existsSync(recordAt(second.workItems[0]!.worktree, 1))).toBe(false);
    });
  });

  describe("a fix pass held to its record", () => {
    /** Runs a chain whose crafter does as given, and gives the stopped chain's sentence with the subjects of the commits the pass and the daemon made after round 1's record. */
    const stoppedWith = async (crafter: (cwd: string, prompt: string) => void, proofer?: (given: { round: number; heading: string; target: string }) => string): Promise<{ says: string; after: string[]; worktree: string }> => {
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter, proofer }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      expect(chain.stages.map(({ kind, state }) => [kind, state])).toEqual([["round", "finished"], ["fix-pass", "failed"]]);
      const subjects = commitsAfterMain(a.worktree).map(({ subject }) => subject);
      return { says: chain.says, after: subjects.slice(subjects.indexOf("chore: record review round 1") + 1), worktree: a.worktree };
    };

    it("commits nothing where the crafter edited the proofer's block, and where its fixed names a commit the branch does not hold or one the round's target already held", async () => {
      const edited = await stoppedWith((cwd, prompt) => {
        fixes(cwd, prompt);
        const file = join(cwd, givenFix(prompt).record);
        writeFileSync(file, readFileSync(file, "utf8").replace("severity: must", "severity: should"));
      });
      expect(edited.says).toBe("The fix pass of round 1 failed: the round record it left differs from the committed one at line 12 by more than a close block.");
      expect(edited.after).toEqual(["fix: end the greeting"]);
      // The record stands as the crafter left it, and no commit holds it.
      expect(status(edited.worktree)).toEqual([` M ${DIRECTORY}/trail/rounds/round-1.md`]);

      const unheld = await stoppedWith((cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${A}`));
      expect(unheld.says).toBe(`The fix pass of round 1 failed: finding 1 is closed \`fixed ${A}\`, and the branch holds no such commit.`);
      expect(unheld.after).toEqual([]);

      const early = await stoppedWith((cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${git(cwd, "rev-parse", "HEAD~1").trim()}`));
      expect(early.says).toMatch(/^The fix pass of round 1 failed: finding 1 is closed `fixed [0-9a-f]{40}`, and the round's target already held that commit\.$/u);
      expect(early.after).toEqual([]);
    });

    it("commits nothing where a fixed names a commit that changed no path its finding's location names, and takes one whose close block names a folder the fix went to", async () => {
      /** A commit of the crafter's that changes a file the finding does not name. */
      const elsewhere = (cwd: string): string => {
        write(cwd, "notes/greeting.md", "The greeting ends with a full stop.\n");
        return commitAll(cwd, "docs: note the greeting");
      };
      const untouched = await stoppedWith((cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${elsewhere(cwd)}`));
      expect(untouched.says).toMatch(/^The fix pass of round 1 failed: finding 1 is closed `fixed [0-9a-f]{40}`, and that commit changed no path its `location:` lines name: a fix that went elsewhere names its path on a `location:` line of the close block\.$/u);
      expect(untouched.after).toEqual(["docs: note the greeting"]);
      expect(status(untouched.worktree)).toEqual([` M ${DIRECTORY}/trail/rounds/round-1.md`]);

      // A place is compared as the record writes it, as the check's `under` compares it: one written with a `\` names no path git prints with a `/`.
      const backslashed = await stoppedWith(
        (cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${elsewhere(cwd)}`),
        ({ heading, target }) => roundRecord(heading, target, [1]).replace("location: `feature.txt:1`", "location: `notes\\greeting.md`"),
      );
      expect(backslashed.says).toMatch(/^The fix pass of round 1 failed: finding 1 is closed `fixed [0-9a-f]{40}`, and that commit changed no path its `location:` lines name: a fix that went elsewhere names its path on a `location:` line of the close block\.$/u);
      expect(backslashed.after).toEqual(["docs: note the greeting"]);

      // The folder is written with its trailing `/`, which the comparison drops as the check's does.
      const located = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter: (cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${elsewhere(cwd)}\nlocation: \`notes/\``) }) });
      expect(await located.c.getSeal(1, 1)).toBe("done");
      expect((await located.c.chain(1, "sealed")).stages.map(({ kind, state }) => [kind, state])).toEqual([["round", "finished"], ["fix-pass", "finished"], ["round", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    });

    it("holds the pass to the record as the commit before the pass holds it, and to the round's target: a change of the proofer's text that the worktree held before the pass refuses the record, and a fixed that names a commit made after the round's target and before the pass is taken", async () => {
      const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: roles() });
      const a = stood.workItems[0]!;
      const record = `${DIRECTORY}/trail/rounds/round-1.md`;
      write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
      const target = commitAll(a.worktree, "chore: declare the work item's routing");
      const text = roundRecord(HEADING(1), `${target} against main`, [1]);
      write(a.worktree, record, text);
      commitAll(a.worktree, "chore: record review round 1");
      write(a.worktree, record, text.replace("severity: must", "severity: should"));
      expect(await stood.c.getSeal(a.id, 1)).toBe("done");
      expect((await stood.c.chain(a.id, "stopped")).says).toBe("The fix pass of round 1 failed: the round record it left differs from the committed one at line 12 by more than a close block.");

      // A fix a person committed after round 1's record and before the pass: the pass closes the finding with that commit.
      const taken = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter: (cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${head(cwd)}`) }) });
      const b = taken.workItems[0]!;
      write(b.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, b.branch, TODAY));
      const reviewed = commitAll(b.worktree, "chore: declare the work item's routing");
      write(b.worktree, record, roundRecord(HEADING(1), `${reviewed} against main`, [1]));
      commitAll(b.worktree, "chore: record review round 1");
      const fix = commitFix(b.worktree);
      expect(await taken.c.getSeal(b.id, 1)).toBe("done");
      expect((await taken.c.chain(b.id, "sealed")).stages.map(({ kind, state }) => [kind, state])).toEqual([["fix-pass", "finished"], ["round", "finished"], ["gate", "finished"], ["seal", "finished"]]);
      expect(readFileSync(join(b.worktree, record), "utf8")).toContain(`verdict: fixed ${fix}\n`);
    });

    it("commits nothing where the crafter removed the round record", async () => {
      const removed = await stoppedWith((cwd, prompt) => rmSync(join(cwd, givenFix(prompt).record)));
      expect(removed.says).toBe(`The fix pass of round 1 failed: the round record no longer stands at ${DIRECTORY}/trail/rounds/round-1.md.`);
      expect(removed.after).toEqual([]);
    });

    it("commits nothing where the crafter left a change no commit holds outside the work item's directory", async () => {
      const left = await stoppedWith((cwd, prompt) => {
        fixes(cwd, prompt);
        writeFileSync(join(cwd, "feature.txt"), "A greeting, changed again\n");
      });
      expect(left.says).toBe("The fix pass of round 1 failed: the worktree holds a change no commit holds outside the work item's directory, at feature.txt.");
      expect(left.after).toEqual(["fix: end the greeting"]);
    });

    it("stops the chain where the crafter left a finding open and raised no question: with no close block nothing is committed, and with one of two findings closed the record is committed and the open one named", async () => {
      const none = await stoppedWith(() => undefined);
      expect(none.says).toBe("The fix pass of round 1 failed: it left finding 1 open and raised no question.");
      expect(none.after).toEqual([]);
      expect(status(none.worktree)).toEqual([]);

      const two = (given: { round: number; heading: string; target: string }): string => roundRecord(given.heading, given.target, [1, 2]);
      const one = await stoppedWith((cwd, prompt) => closeFinding(cwd, givenFix(prompt).record, 1, `fixed ${commitFix(cwd)}`), two);
      expect(one.says).toBe("The fix pass of round 1 failed: it left finding 2 open and raised no question.");
      expect(one.after).toEqual(["fix: end the greeting", "chore: record the fix pass of round 1"]);
    });

    it("stops the chain where a second fix pass on one record leaves a finding open too, whatever it asks: the first pass's question was decided, and the second is asked nothing more", async () => {
      const { adapter, started } = noted(roles({ crafter: () => undefined, crafterSays: () => `The pass needs a decision.\n\n${askBlock({ asks: "May the pass change the protocol?", grounds: "The frame names no such change." })}` }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      expect(chain.says).toBe("The fix pass of round 1 failed: it left finding 1 open, as the fix pass before it on this record did.");
      expect(chain.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["ruling", 1, "finished"], ["fix-pass", 1, "failed"]]);
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "orchestrator", "crafter"]);
    });
  });

  describe("the orchestrator's judgments", () => {
    /** A proofer whose round 2 and each later round up to `last` confirms the fix before it and holds a finding of its own, and whose round after `last` confirms and holds none. */
    const findsUntil =
      (last: number) =>
      (given: { round: number; heading: string; target: string }): string =>
        given.round === 1 ? proofs(given) : roundRecord(given.heading, given.target, given.round <= last ? [1] : [], [`round-${String(given.round - 1)}#1`]);
    const DECISIONS = `${DIRECTORY}/decisions.md`;
    const JUDGMENT = (round: number) => ({ subject: `chore: record the orchestrator's judgment after round ${String(round)}`, body: TRAILER, paths: [DECISIONS] });
    const stagesOf = (chain: Chain): [string, number, string][] => chain.stages.map(({ kind, round, state }) => [kind, round, state]);
    const recorded = (worktree: string) => readDecisionRecord(readFileSync(join(worktree, DECISIONS), "utf8"));

    it("asks the orchestrator before the second fix pass and not before the first, records its yes as a route decision by orchestrator in a commit of the record of decisions, and goes on with the fix pass and round 3", async () => {
      const { adapter, started } = noted(roles({ proofer: findsUntil(2), orchestrator: () => convergenceBlock("yes", "Round 2 confirms round 1's fix.") }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(stagesOf(chain)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["judgment", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
      expect(started.map(({ role }) => role)).toEqual([{ role: "proofer", stage: "round" }, { role: "crafter", stage: "fix-pass" }, { role: "proofer", stage: "round" }, { role: "orchestrator", stage: "judgment" }, { role: "crafter", stage: "fix-pass" }, { role: "proofer", stage: "round" }, { role: "sealer", stage: "seal" }]);
      expect(started[3]?.cwd).toBe(a.worktree);
      expect(started[3]?.prompt).toContain(`- The round records, the oldest first: \`${DIRECTORY}/trail/rounds/round-1.md\`, \`${DIRECTORY}/trail/rounds/round-2.md\`\n`);
      expect(recorded(a.worktree)).toMatchObject({
        decisions: [{ id: 1, kind: "route", decided: "The review rounds are converging after round 2, so the fix pass on its record runs.", grounds: "Round 2 confirms round 1's fix.", by: "orchestrator", state: { is: "decided" } }],
        questions: [],
        refusals: [],
      });
      const commits = commitsAfterMain(a.worktree);
      expect(commits.map(({ subject }) => subject)).toEqual([
        "feat: greet",
        "chore: declare the work item's routing",
        "chore: record review round 1",
        "fix: end the greeting",
        "chore: record the fix pass of round 1",
        "chore: record review round 2",
        "chore: record the orchestrator's judgment after round 2",
        "fix: end the greeting",
        "chore: record the fix pass of round 2",
        "chore: record review round 3",
        "chore: record the broad gate's run",
        "chore: record the sealer's verdict",
      ]);
      expect(commits[6]).toEqual(JUDGMENT(2));
      expect(status(a.worktree)).toEqual([]);
      // The work item carries the decision, as every decision made without asking.
      expect(c.workItem(a.id)?.decisions).toMatchObject([{ id: 1, kind: "route", by: "orchestrator", state: "decided" }]);
      // The fix pass and the round after the judgment are given the record of decisions.
      expect(started[4]?.prompt).toContain(`- The decisions and the answers to hold to: \`${DECISIONS}\`\n`);
      expect(started[5]?.prompt).toContain(`- The decisions and the answers to hold to: \`${DECISIONS}\`\n`);
    });

    it("stops the chain at the orchestrator's no, with the decision recorded and committed and a sentence that says the rounds are not converging, and a second getSeal starts the fix pass with no second judgment", async () => {
      const { adapter, started } = noted(roles({ proofer: findsUntil(2), orchestrator: () => convergenceBlock("no", "Round 2 found what round 1's fix broke.") }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const stopped = await c.chain(a.id, "stopped");
      expect(stopped.says).toBe('The orchestrator judged after round 2 that the review rounds are not converging. "Get a seal" runs the fix pass of round 2 all the same.');
      expect(stagesOf(stopped)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["judgment", 2, "finished"]]);
      expect(recorded(a.worktree).decisions).toMatchObject([{ kind: "route", decided: "The review rounds are not converging after round 2, so the chain stops for the person.", grounds: "Round 2 found what round 1's fix broke.", by: "orchestrator" }]);
      expect(commitsAfterMain(a.worktree).at(-1)).toEqual(JUDGMENT(2));
      expect(status(a.worktree)).toEqual([]);
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "proofer", "orchestrator"]);

      expect(await c.getSeal(a.id, 2)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "proofer", "orchestrator", "crafter", "proofer", "sealer"]);
      expect(stagesOf(chain).slice(4)).toEqual([["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
    });

    it("asks the orchestrator again before each later fix pass, and again where its answer to the one before was no judgment: that stage fails with what its answer lacks, and nothing is recorded", async () => {
      let answers = 0;
      const orchestrator = (): string => ((answers += 1) === 1 ? "The rounds look fine to me." : convergenceBlock("yes"));
      const { adapter, started } = noted(roles({ proofer: findsUntil(3), orchestrator }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const stopped = await c.chain(a.id, "stopped");
      expect(stopped.says).toBe("The judgment after round 2 failed: its answer holds no judgment: no `seal` block of it opens with `converging:`.");
      expect(stopped.stages.at(-1)).toMatchObject({ kind: "judgment", round: 2, state: "failed", failure: "its answer holds no judgment: no `seal` block of it opens with `converging:`" });
      expect(existsSync(join(a.worktree, DECISIONS))).toBe(false);
      // The person's start is no answer to a judgment that gave none, so the orchestrator is asked again, and after round 3 once more.
      expect(await c.getSeal(a.id, 2)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(stagesOf(chain).slice(3)).toEqual([["judgment", 2, "failed"], ["judgment", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["judgment", 3, "finished"], ["fix-pass", 3, "finished"], ["round", 4, "finished"], ["gate", 4, "finished"], ["seal", 4, "finished"]]);
      expect(started.map(({ role }) => role?.role).slice(3)).toEqual(["orchestrator", "orchestrator", "crafter", "proofer", "orchestrator", "crafter", "proofer", "sealer"]);
      // The judgment after round 3 is given the record of decisions, which the judgment after round 2 wrote, and the first judgment met none.
      expect(started[7]?.prompt).toContain(`- The decisions and the answers to hold to: \`${DECISIONS}\`\n`);
      expect(started[3]?.prompt).not.toContain("decisions.md");
      expect(recorded(a.worktree).decisions.map(({ id, kind, decided }) => [id, kind, decided])).toEqual([
        [1, "route", "The review rounds are converging after round 2, so the fix pass on its record runs."],
        [2, "route", "The review rounds are converging after round 3, so the fix pass on its record runs."],
      ]);
    });

    it("stops at the ceiling of the rounds with no judgment asked, runs one fix pass and one round more at a person's getSeal, and stops again where that round leaves a finding", async () => {
      const { adapter, started } = noted(roles({ proofer: findsUntil(9) }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter, roundsCeiling: 2 });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const stopped = await c.chain(a.id, "stopped");
      expect(stopped.says).toBe('Review round 2 left a finding open, and a chain stops for the person from round 2 on. "Get a seal" runs the fix pass of round 2 and one more round.');
      expect(stagesOf(stopped)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"]]);
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "proofer"]);
      expect(existsSync(join(a.worktree, DECISIONS))).toBe(false);

      expect(await c.getSeal(a.id, 2)).toBe("done");
      const again = await c.until(() => {
        const chain = c.workItem(a.id)?.chain;
        return chain?.state === "stopped" && chain.stages.length === 5 ? chain : undefined;
      });
      expect(again.says).toBe('Review round 3 left a finding open, and a chain stops for the person from round 2 on. "Get a seal" runs the fix pass of round 3 and one more round.');
      expect(stagesOf(again).slice(3)).toEqual([["fix-pass", 2, "finished"], ["round", 3, "finished"]]);
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "proofer", "crafter", "proofer"]);
    });

    it("has a crafter's two questions ruled on once the pass's record is committed: the one decided is a decision by orchestrator and the one parked an open question by crafter, both committed, the chain is parked and starts no stage, and the person's answer starts the fix pass on the same record", async () => {
      const BASE = { asks: "Which base does the fix start from?", grounds: "No document names the base of a hotfix.", options: [["main", "The release's fixes are not in it."], ["release", "It merges late."]] as [string, string][], default: "main" };
      const PUSH = { asks: "May the pass push the branch?", grounds: "A push needs an approval." };
      let passes = 0;
      const crafter = (cwd: string, prompt: string): void => {
        if ((passes += 1) > 1) fixes(cwd, prompt);
      };
      // The fake reads a session's answer before its work, so the answers are counted apart from the passes.
      let said = 0;
      const crafterSays = (): string => ((said += 1) === 1 ? `The pass met two questions.\n\n${askBlock(BASE)}\n${askBlock(PUSH)}` : "The fix pass is done.");
      const orchestrator = (prompt: string): string => {
        expect(givenQuestions(prompt)).toBe(2);
        return `${rulingBlock(1, "default", "The fix starts from main.", "The question's default.")}\n${rulingBlock(2, "park", null, "Only the person approves a push.")}`;
      };
      const { adapter, started } = noted(roles({ crafter, crafterSays, orchestrator }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const parked = await c.chain(a.id, "parked");
      expect(parked.says).toBe("The chain waits for the answers to the work item's open questions.");
      expect(stagesOf(parked)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["ruling", 1, "finished"]]);
      expect(started[2]?.role).toEqual({ role: "orchestrator", stage: "judgment" });
      expect(started[2]?.prompt).toContain("- Who asks: the crafter, in the fix pass of round 1\n\nIts questions:\n\n1. Which base does the fix start from?\n");
      expect(started[2]?.prompt).toContain("   - Its default: `main`\n2. May the pass push the branch?\n");
      expect(recorded(a.worktree)).toMatchObject({
        decisions: [{ id: 1, kind: "default", decided: "The fix starts from main.", grounds: "The question's default.", by: "orchestrator", state: { is: "decided" } }],
        questions: [{ id: 2, asks: PUSH.asks, grounds: "A push needs an approval. The code and the policy do not decide it: Only the person approves a push.", by: "crafter", options: [], default: null, state: { is: "open" } }],
        refusals: [],
      });
      expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(2)).toEqual(["chore: record review round 1", "chore: record the orchestrator's judgment after round 1"]);
      expect(commitsAfterMain(a.worktree).at(-1)).toEqual(JUDGMENT(1));
      expect(status(a.worktree)).toEqual([]);
      expect(c.workItem(a.id)?.questions).toMatchObject([{ id: 2, asks: PUSH.asks, by: "crafter", answer: null }]);
      // A parked chain starts nothing by itself.
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(started.length).toBe(3);
      expect(c.workItem(a.id)?.chain?.state).toBe("parked");

      c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 2, answer: "It may not." }] });
      const chain = await c.chain(a.id, "sealed");
      expect(stagesOf(chain).slice(3)).toEqual([["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
      expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "crafter", "orchestrator", "crafter", "proofer", "sealer"]);
      expect(started[3]?.prompt).toContain(`- The round record: \`${DIRECTORY}/trail/rounds/round-1.md\`\n- Its open findings: 1\n- The decisions and the answers to hold to: \`${DECISIONS}\`\n`);
      // The person's answer was committed before the chain went on, so the pass read it in a committed record.
      expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(4)).toEqual(["chore: record the person's answers", "fix: end the greeting", "chore: record the fix pass of round 1", "chore: record review round 2", "chore: record the broad gate's run", "chore: record the sealer's verdict"]);
      expect(recorded(a.worktree).questions).toMatchObject([{ id: 2, state: { is: "answered", answer: "It may not." } }]);
    });

    it("has a proofer's question ruled on before the fix pass, from the blocks above its record alone, and asks for the judgment of convergence all the same where the round is round 2: a judgment on a question is none of convergence", async () => {
      const ASKS = askBlock({ asks: "Is the greeting's language in scope?", grounds: "The frame names no language." });
      const proofer = (given: { round: number; heading: string; target: string }): string => (given.round === 2 ? `${ASKS}\n${findsUntil(2)(given)}` : findsUntil(2)(given));
      const orchestrator = (prompt: string): string => (givenQuestions(prompt) === 0 ? convergenceBlock("yes") : rulingBlock(1, "scope", "The greeting stays in English.", "The frame's scope names no other language."));
      const { adapter, started } = noted(roles({ proofer, orchestrator }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(stagesOf(chain)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["ruling", 2, "finished"], ["judgment", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
      expect(started[3]?.prompt).toContain("- Who asks: the proofer, in review round 2\n\nIts question:\n\n1. Is the greeting's language in scope?\n");
      expect(givenQuestions(started[4]?.prompt ?? "1. ")).toBe(0);
      expect(recorded(a.worktree).decisions.map(({ kind, decided, by }) => [kind, decided, by])).toEqual([
        ["scope", "The greeting stays in English.", "orchestrator"],
        ["route", "The review rounds are converging after round 2, so the fix pass on its record runs.", "orchestrator"],
      ]);
      // The record the daemon wrote is the answer from its heading on: the question above it is no part of it.
      expect(readFileSync(recordAt(a.worktree, 2), "utf8").startsWith(`${HEADING(2)}\n`)).toBe(true);
      expect(commitsAfterMain(a.worktree).map(({ subject }) => subject).slice(5, 8)).toEqual(["chore: record review round 2", "chore: record the orchestrator's judgment after round 2", "chore: record the orchestrator's judgment after round 2"]);
    });

    it("fails the stage whose asks block the reader refuses, and the judgment whose answer rules on no question: the chain stops with which, and nothing is parked or decided", async () => {
      const broken = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter: () => undefined, crafterSays: () => "```seal\nasks: May it?\n```\n" }) });
      expect(await broken.c.getSeal(1, 1)).toBe("done");
      expect((await broken.c.chain(1, "stopped")).says).toBe("The fix pass of round 1 failed: the reader refuses line 1 of its answer's question: the question block holds no `grounds:` line, and it holds one.");

      const unruled = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter: () => undefined, crafterSays: () => askBlock({ asks: "May it?", grounds: "No document says." }), orchestrator: () => "It may." }) });
      expect(await unruled.c.getSeal(1, 1)).toBe("done");
      const chain = await unruled.c.chain(1, "stopped");
      expect(chain.says).toBe("The ruling after round 1 failed: its answer holds no ruling on question 1: no `seal` block of it opens with `rules: 1 `.");
      expect(stagesOf(chain)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["ruling", 1, "failed"]]);
      expect(existsSync(join(unruled.workItems[0]!.worktree, DECISIONS))).toBe(false);
    });

    it("goes on from a proofer's parked question as no person's start: the answer starts the chain, and the judgment of convergence that round 2 owes is asked before its fix pass", async () => {
      const ASKS = askBlock({ asks: "May the branch be pushed for the review?", grounds: "A push needs an approval." });
      const proofer = (given: { round: number; heading: string; target: string }): string => (given.round === 2 ? `${ASKS}\n${findsUntil(2)(given)}` : findsUntil(2)(given));
      const orchestrator = (prompt: string): string => (givenQuestions(prompt) === 0 ? convergenceBlock("yes") : rulingBlock(1, "park", null, "Only the person approves a push."));
      const { adapter, started } = noted(roles({ proofer, orchestrator }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const parked = await c.chain(a.id, "parked");
      expect(stagesOf(parked)).toEqual([["round", 1, "finished"], ["fix-pass", 1, "finished"], ["round", 2, "finished"], ["ruling", 2, "finished"]]);
      expect(recorded(a.worktree).questions).toMatchObject([{ id: 1, by: "proofer", state: { is: "open" } }]);
      c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 1, answer: "It may not." }] });
      const chain = await c.chain(a.id, "sealed");
      expect(stagesOf(chain).slice(4)).toEqual([["judgment", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
      expect(started.map(({ role }) => role?.role).slice(3)).toEqual(["orchestrator", "orchestrator", "crafter", "proofer", "sealer"]);
      expect(givenQuestions(started[4]?.prompt ?? "1. ")).toBe(0);
    });

    it("stops a parked chain that cannot go on once its question is answered, with what refuses the start, and a later getSeal starts it: each state the chain takes holds the daemon's time when it took it, whenever its newest stage ended", async () => {
      let clock = NOW;
      let passes = 0;
      const crafter = (cwd: string, prompt: string): void => {
        if ((passes += 1) === 1) return;
        fixes(cwd, prompt);
        // The second pass takes ten minutes, so the chain rests later than it started.
        clock = NOW + 110 * 60_000;
      };
      let said = 0;
      const stood = await standing(cleanups, ["Sealed work"], {
        roleAdapter: roles({ crafter, crafterSays: () => ((said += 1) === 1 ? askBlock({ asks: "May the pass push the branch?", grounds: "A push needs an approval." }) : "Done."), orchestrator: () => rulingBlock(1, "park", null, "Only the person approves a push.") }),
        now: () => clock,
      });
      const a = stood.workItems[0]!;
      expect(await stood.c.getSeal(a.id, 1)).toBe("done");
      expect((await stood.c.chain(a.id, "parked")).since).toBe(NOW);
      // The person answers an hour and a half after the ruling's stage ended.
      clock = NOW + 90 * 60_000;
      // A file no commit holds, outside the work item's directory: a round reads a committed tree.
      write(a.worktree, "loose.txt", "loose\n");
      stood.c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 1, answer: "It may not." }] });
      const stopped = await stood.c.chain(a.id, "stopped");
      expect(stopped.says).toBe("The chain did not go on after the answers. The worktree holds a change no commit holds, at loose.txt. A round reads a committed tree: commit the change or remove it first.");
      expect(stopped.stages.length).toBe(3);
      expect([stopped.stages.at(-1)?.endedAt, stopped.since]).toEqual([NOW, NOW + 90 * 60_000]);
      rmSync(join(a.worktree, "loose.txt"));
      clock = NOW + 100 * 60_000;
      expect(await stood.c.getSeal(a.id, 3)).toBe("done");
      const sealed = await stood.c.chain(a.id, "sealed");
      expect(stagesOf(sealed).slice(3)).toEqual([["fix-pass", 1, "finished"], ["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
      expect(sealed.since).toBe(NOW + 110 * 60_000);
      // While it ran, each start's chain was running since that start: the first, and the person's after the stop.
      const ran = stood.c.messages.flatMap((message) => (message.type === "inbox" ? message.workItems : [])).flatMap((item) => (item.id === a.id && item.chain?.state === "running" ? [item.chain.since] : []));
      expect([...new Set(ran)]).toEqual([NOW, NOW + 100 * 60_000]);
    });

    it("asks for the judgment of convergence at a person's start where round 2's chain stopped after the ruling on its proofer's question: a ruling the chain's last stage holds is no answered judgment of convergence", async () => {
      const ASKS = askBlock({ asks: "May the branch be pushed for the review?", grounds: "A push needs an approval." });
      const proofer = (given: { round: number; heading: string; target: string }): string => (given.round === 2 ? `${ASKS}\n${findsUntil(2)(given)}` : findsUntil(2)(given));
      const orchestrator = (prompt: string): string => (givenQuestions(prompt) === 0 ? convergenceBlock("yes") : rulingBlock(1, "park", null, "Only the person approves a push."));
      const { adapter, started } = noted(roles({ proofer, orchestrator }));
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      expect((await c.chain(a.id, "parked")).stages.length).toBe(4);
      // The answer's start is refused, so the chain stops between the ruling and the judgment of convergence round 2 owes.
      write(a.worktree, "loose.txt", "loose\n");
      c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 1, answer: "It may not." }] });
      expect((await c.chain(a.id, "stopped")).stages.length).toBe(4);
      rmSync(join(a.worktree, "loose.txt"));
      expect(await c.getSeal(a.id, 3)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(started.map(({ role }) => role?.role).slice(4)).toEqual(["orchestrator", "crafter", "proofer", "sealer"]);
      expect(givenQuestions(started[4]?.prompt ?? "1. ")).toBe(0);
      expect(stagesOf(chain).slice(3)).toEqual([["ruling", 2, "finished"], ["judgment", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
    });

    it("takes in a decision the person reversed: a getSeal on a sealed chain starts a fix pass whose prompt holds the decision and the message, the decision reads applied with the head the pass left in the commit after the pass, and a verifying round, the broad gate and a second run of the sealer follow", async () => {
      const { adapter, started } = noted(roles({ proofer: (given) => (given.round < 3 ? proofs(given) : roundRecord(given.heading, given.target)) }));
      const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
      const a = stood.workItems[0]!;
      expect(await stood.c.getSeal(a.id, 1)).toBe("done");
      await stood.c.chain(a.id, "sealed");
      expect(stood.d.decided(a.id, { kind: "default", says: "Start from main.", grounds: "The default base.", by: "orchestrator" })).toMatchObject({ id: 1 });
      stood.c.send({ type: "reverseDecision", requestId: 2, workItemId: a.id, decisionId: 1, message: "Start from the release branch." });
      await stood.c.message("done", (m) => m.requestId === 2);

      expect(await stood.c.getSeal(a.id, 3)).toBe("done");
      const chain = await stood.c.until(() => {
        const found = stood.c.workItem(a.id)?.chain;
        return found?.state === "sealed" && found.stages.length === 9 ? found : undefined;
      });
      expect(stagesOf(chain).slice(3)).toEqual([["gate", 2, "finished"], ["seal", 2, "finished"], ["fix-pass", 2, "finished"], ["round", 3, "finished"], ["gate", 3, "finished"], ["seal", 3, "finished"]]);
      expect(started[4]?.prompt).toContain('- Its open findings: none\n- The decisions the person reversed, each to take in:\n  - decision 1, "Start from main.": the person says "Start from the release branch."\n');
      const commits = commitsAfterMain(a.worktree);
      expect(commits.slice(-6)).toEqual([
        { subject: "chore: record the person's reversal of decision 1", body: TRAILER, paths: [DECISIONS] },
        { subject: "fix: end the greeting", body: "", paths: ["feature.txt"] },
        // The pass's session is the case's fifth, after two proofers, a crafter and a sealer.
        { subject: "chore: record the fix pass of round 2", body: `${TRAILER}\nSeal-Built-By: fake-5`, paths: [DECISIONS] },
        { subject: "chore: record review round 3", body: TRAILER, paths: [`${DIRECTORY}/trail/rounds/round-3.md`] },
        { subject: "chore: record the broad gate's run", body: TRAILER, paths: [`${DIRECTORY}/trail/gate.md`] },
        VERDICT_COMMIT,
      ]);
      // The second verdict names both fix passes' sessions among the builders, in the order of their commits, and the first verdict stands above it unchanged.
      const guarantee = readFileSync(join(a.worktree, DIRECTORY, "guarantee.md"), "utf8");
      expect(guarantee).toContain("\nbuilt-by: the session, fake-2\njudged-by: fake-4\n");
      expect(guarantee).toContain("\n## Run 2\n");
      expect(guarantee).toContain("\nbuilt-by: the session, fake-2, fake-5\njudged-by: fake-7\n");
      const [fix, pass] = git(a.worktree, "log", "--format=%H", "-5").trim().split("\n").reverse() as [string, string, string, string, string];
      expect(git(a.worktree, "show", `${pass}:${DECISIONS}`)).toContain(`state: applied ${fix}\nreversal: Start from the release branch.\n`);
      expect(recorded(a.worktree).decisions).toMatchObject([{ id: 1, state: { is: "applied", commit: fix, message: "Start from the release branch." } }]);
      expect(stood.c.workItem(a.id)?.decisions).toMatchObject([{ id: 1, state: "applied", landed: fix }]);
      expect(status(a.worktree)).toEqual([]);
    });

    it("keeps each call a role's rule refused with its stage and in the work item's records: a proofer's write and its command are both refused, the round counts two, and trail/refusals.md holds a row for each with the tool and the rule and no text of the call, committed with the stage's record", async () => {
      const refusedCalls = (_prompt: string, role?: { role: string }) => {
        if (role?.role === "proofer") return [{ tool: "Write", action: "write" as const, path: "notes.md", text: "notes.md" }, { tool: "Bash", action: "run" as const, path: null, text: "rm -rf build" }];
        return role?.role === "crafter" ? [{ tool: "Write", action: "write" as const, path: "../outside.txt", text: "../outside.txt" }, { tool: "WebFetch", action: "other" as const, path: null, text: '{"url":"https://example.com/owl"}' }] : [];
      };
      let rounds = 0;
      const proofer = (given: { round: number; heading: string; target: string }): string => ((rounds += 1), proofs(given));
      // Only round 1 and the fix pass ask: round 2 asks for nothing.
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer }, { asks: (prompt, role) => (rounds > 0 && role?.role === "proofer" ? [] : refusedCalls(prompt, role)) }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "sealed");
      expect(chain.stages.map(({ kind, refusals }) => [kind, refusals])).toEqual([["round", 2], ["fix-pass", 2], ["round", 0], ["gate", 0], ["seal", 0]]);
      const refusals = `${DIRECTORY}/trail/refusals.md`;
      const head = [`# Refused calls: ${NAME}`, "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|"];
      const rows = ["| round 1 | proofer | Write | writes a file | no-write |", "| round 1 | proofer | Bash | runs a command | no-command |", "| fix pass 1 | crafter | Write | writes a file | outside-worktree |", "| fix pass 1 | crafter | WebFetch | something else | other |"];
      const text = readFileSync(join(a.worktree, refusals), "utf8");
      expect(text.split("\n")).toEqual([...head, ...rows, ""]);
      for (const called of ["notes.md", "rm -rf", "outside.txt", "example.com"]) expect(text, called).not.toContain(called);
      const record = (round: number): string => `${DIRECTORY}/trail/rounds/round-${String(round)}.md`;
      expect(commitsAfterMain(a.worktree).slice(2)).toEqual([
        { subject: "chore: record review round 1", body: TRAILER, paths: [record(1), refusals].sort() },
        { subject: "fix: end the greeting", body: "", paths: ["feature.txt"] },
        { subject: "chore: record the fix pass of round 1", body: `${TRAILER}\nSeal-Built-By: fake-2`, paths: [record(1), refusals].sort() },
        { subject: "chore: record review round 2", body: TRAILER, paths: [record(2)] },
        { subject: "chore: record the broad gate's run", body: TRAILER, paths: [`${DIRECTORY}/trail/gate.md`] },
        // The sealer's session was refused no call, so the verdict's commit carries no row.
        VERDICT_COMMIT,
      ]);
      const [first] = git(a.worktree, "log", "--reverse", "--format=%H", "--", refusals).trim().split("\n");
      expect(git(a.worktree, "show", `${first ?? ""}:${refusals}`).split("\n")).toEqual([...head, ...rows.slice(0, 2), ""]);
      expect(status(a.worktree)).toEqual([]);
      expect(existsSync(join(a.worktree, "notes.md"))).toBe(false);
    });
  });

  it("parks a running chain where the record holds an open question at its next step: no stage starts, and the chain says that it waits for the answers", async () => {
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({}, { delayMs: 80 }) });
    const a = stood.workItems[0]!;
    write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
    commitAll(a.worktree, "chore: declare the work item's routing");
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    await stood.c.until(() => (stood.c.workItem(a.id)?.chain?.stages[0]?.state === "working" ? true : undefined));
    // A question written during round 1 is read once the round's record is committed, before the fix pass its finding owes.
    write(a.worktree, `${DIRECTORY}/decisions.md`, withQuestion(`# Decisions and questions: ${NAME}\n\n`, { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", by: "proofer", options: [], default: null }));
    const chain = await stood.c.chain(a.id, "parked");
    expect(chain).toMatchObject({ state: "parked", says: "The chain waits for the answers to the work item's open questions." });
    expect(chain.stages.map(({ kind, state }) => [kind, state])).toEqual([["round", "finished"]]);
    expect(readRoundRecord(readFileSync(recordAt(a.worktree, 1), "utf8")).findings.map(({ number, close }) => [number, close])).toEqual([[1, null]]);
  });

  it("keeps the newest stages of a chain, as many as the bound: a stage that starts on a chain that holds that many takes the oldest one's place", async () => {
    // Round 3 answers no closed finding, so its record confirms none.
    const stood = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: (given) => (given.round < 3 ? proofs(given) : roundRecord(given.heading, given.target)) }) });
    const a = stood.workItems[0]!;
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    await stood.c.chain(a.id, "sealed");
    await stood.d.close();
    // The run folder as a chain of many starts left it: as many stages as the bound, the oldest numbered 1000.
    const file = join(stood.runDir, "repositories.json");
    const stored = JSON.parse(readFileSync(file, "utf8")) as { repositories: { workItems: { chain: Chain }[] }[] };
    const chain = stored.repositories[0]!.workItems[0]!.chain;
    chain.stages = Array.from({ length: CHAIN_STAGES_KEPT }, (_, index) => ({ ...chain.stages[0]!, round: 1000 + index }));
    writeFileSync(file, JSON.stringify(stored));
    const { url } = await stood.start();
    const c = await client(url, cleanups);
    await c.message("ready");
    // A commit after the last round's target that changes a path outside the directory owes a verifying round.
    commitFix(a.worktree);
    expect(await c.getSeal(a.id, 2)).toBe("done");
    const after = await c.chain(a.id, "sealed");
    expect(after.stages.length).toBe(CHAIN_STAGES_KEPT);
    // The verifying round, the broad gate after it and the seal each took the place of the oldest stage kept.
    expect(after.stages.map(({ kind, round }) => (round < 1000 ? `${kind} ${String(round)}` : round))).toEqual([...Array.from({ length: CHAIN_STAGES_KEPT - 3 }, (_, index) => 1003 + index), "round 3", "gate 3", "seal 3"]);
  });
});

// Each gate is a stand-in command the case names, never a repository's own check.
describe("the broad gate of a work item's chain", { timeout: 60_000 }, () => {
  const ended = (round: number, headlessId: number | null | undefined): ChainStage => ({ kind: "round", round, state: "finished", failure: null, startedAt: NOW, endedAt: NOW, headlessId: headlessId ?? null, refusals: 0, gate: null });
  /** The stage of a broad gate after round 1: one whose command, `true`, passed, with what a case names of another. */
  const gateStage = (more: Partial<ChainStage> = {}): ChainStage => ({ kind: "gate", round: 1, state: "finished", failure: null, startedAt: NOW, endedAt: NOW, headlessId: null, refusals: 0, gate: { command: "true", exitCode: 0, output: false }, ...more });
  const GATE_PATH = `${DIRECTORY}/trail/gate.md`;
  const GATE_COMMIT = { subject: "chore: record the broad gate's run", body: TRAILER, paths: [GATE_PATH] };
  const SEAL_COMMIT = { subject: "chore: record the sealer's verdict", body: TRAILER, paths: [`${DIRECTORY}/guarantee.md`] };
  /** The stage of the seal after round 1, whose sealer's session the daemon numbered as given. */
  const sealStage = (headlessId: number): ChainStage => ({ ...ended(1, headlessId), kind: "seal" });
  /** The subjects of the commits a chain makes up to round 1's record, after the branch's own. */
  const TO_ROUND_1 = ["feat: greet", "chore: declare the work item's routing", "chore: record review round 1"];
  const subjects = (worktree: string): string[] => commitsAfterMain(worktree).map(({ subject }) => subject);
  const kinds = (chain: Chain): [string, string][] => chain.stages.map(({ kind, state }) => [kind, state]);
  type Client = Awaited<ReturnType<typeof client>>;

  /** A folder outside every worktree, which a stand-in command writes into. */
  function outside(): string {
    const made = realpathSync(mkdtempSync(join(tmpdir(), "owlery-gate-case-")));
    cleanups.push(() => rmSync(made, { recursive: true, force: true }));
    return made;
  }
  const env = (more: Record<string, string> = {}): Record<string, string> => ({ PATH: process.env.PATH ?? "/usr/bin:/bin", ...more });
  /** A command that starts a child and waits, and writes both process ids into the folder `$OUT`. */
  const SLEEPS = 'sleep 30 & echo $! > "$OUT/child"; echo $$ > "$OUT/shell"; wait';
  /** The ids of the shell and the child a waiting command wrote, once both stand. */
  async function pidsIn(out: string): Promise<number[]> {
    const end = Date.now() + 10_000;
    const read = (name: string): string => (existsSync(join(out, name)) ? readFileSync(join(out, name), "utf8") : "");
    while (!(read("child").includes("\n") && read("shell").includes("\n"))) {
      if (Date.now() > end) throw new Error("the command wrote no process id");
      await new Promise((r) => setTimeout(r, 20));
    }
    return [Number(read("child")), Number(read("shell"))];
  }
  /** The work item's entries of the ledger whose stage is the gate. */
  async function gateEntries(c: Client, id: number, requestId: number): Promise<unknown> {
    const answer = await c.asked({ type: "readLedger", requestId, workItemId: id });
    return answer.type === "ledger" ? answer.entries.filter((entry) => entry.stage?.role === null) : answer;
  }
  /** What a `readGateOutput` is answered with: the text and whether it is cut, or the error's sentence. */
  async function output(c: Client, id: number, requestId: number): Promise<unknown> {
    const answer = await c.asked({ type: "readGateOutput", requestId, workItemId: id });
    return answer.type === "gateOutput" ? { text: answer.text, cut: answer.cut } : answer.type === "error" ? answer.message : answer.type;
  }
  /** The chain's newest stage once it is a gate whose command runs. */
  const gateRuns = (c: Client, id: number): Promise<ChainStage> =>
    c.until(() => {
      const stage = c.workItem(id)?.chain?.stages.at(-1);
      return stage?.kind === "gate" && stage.state === "working" ? stage : undefined;
    });
  /** Starts the chain again and gives it once it rests in the state, read from the messages after the start alone. */
  async function again(c: Client, id: number, requestId: number, state: Chain["state"]): Promise<Chain> {
    c.messages.length = 0;
    expect(await c.getSeal(id, requestId)).toBe("done");
    return c.chain(id, state);
  }

  it("runs the repository's command once the rounds settle and commits a passed run: the record names the head the command ran on against the work item's base commit, the sealer then seals that commit, the run has one entry of the ledger with no usage beside one for each session, a second getSeal starts no stage, a later commit of the work item's directory that is no closing record owes the gate and the seal again and no round, and a later change of a source file owes a round, then the gate and the seal", async () => {
    const { c, made, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    const base = a.baseCommit ?? "";
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "sealed");
    const commits = commitsAfterMain(a.worktree);
    expect(commits.slice(2)).toEqual([{ subject: "chore: record review round 1", body: TRAILER, paths: [`${DIRECTORY}/trail/rounds/round-1.md`] }, GATE_COMMIT, SEAL_COMMIT]);
    const [, , read = ""] = git(a.worktree, "log", "-3", "--format=%H").trim().split("\n");
    // The command ran on the commit of round 1's record, which was the head, and the run's record is the next commit.
    expect(git(a.worktree, "show", `HEAD:${GATE_PATH}`)).toBe(gateRecord(NAME, [[read, base]]));
    expect(readFileSync(join(a.worktree, GATE_PATH), "utf8")).toBe(gateRecord(NAME, [[read, base]]));
    expect(status(a.worktree)).toEqual([]);
    expect(chain).toEqual({ state: "sealed", says: `The sealer sealed ${read.slice(0, 7)}, after round 1.`, since: NOW, stages: [ended(1, 1), gateStage(), sealStage(2)] });
    // The ledger holds one entry for each stage: the proofer's session, the gate, and the sealer's session, which no call of the seal's own made.
    const ledger = await c.asked({ type: "readLedger", requestId: 20, workItemId: a.id });
    expect(ledger.type === "ledger" ? ledger.entries.map(({ stage, state }) => [stage, state]) : ledger).toEqual([[{ role: "proofer", stage: "round" }, "finished"], [{ role: null, stage: "gate" }, "finished"], [{ role: "sealer", stage: "seal" }, "finished"]]);
    expect(await gateEntries(c, a.id, 2)).toEqual([{ workItemId: a.id, repo: made.repo, branch: a.branch, stage: { role: null, stage: "gate" }, startedAt: NOW, endedAt: NOW, state: "finished", stopped: null, usage: null }]);
    // `true` printed nothing, so nothing is kept.
    expect(await output(c, a.id, 3)).toBe("Owlery keeps no output of a broad gate of work item 1.");

    // The gate holds at the head, where only the closing records follow its commit, and the seal names that commit.
    expect((await again(c, a.id, 4, "sealed")).stages).toEqual(chain.stages);
    expect(commitsAfterMain(a.worktree)).toEqual(commits);
    // A commit that the next one takes back leaves the tree the gate passed on: the two trees are compared, and no commit between them is walked.
    write(a.worktree, `${DIRECTORY}/scratch.md`, "A note the person takes back.\n");
    commitAll(a.worktree, "docs: note the work");
    rmSync(join(a.worktree, DIRECTORY, "scratch.md"));
    commitAll(a.worktree, "docs: take the note back");
    expect((await again(c, a.id, 41, "sealed")).stages).toEqual(chain.stages);
    expect(subjects(a.worktree).slice(-2)).toEqual(["docs: note the work", "docs: take the note back"]);

    write(a.worktree, `${DIRECTORY}/notes.md`, "A note of the person's.\n");
    const noted = commitAll(a.worktree, "docs: note the work");
    expect(kinds(await again(c, a.id, 5, "sealed"))).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    expect(git(a.worktree, "show", `HEAD:${GATE_PATH}`)).toBe(gateRecord(NAME, [[read, base], [noted, base]]));

    write(a.worktree, "feature.txt", "Another greeting\n");
    commitAll(a.worktree, "feat: greet again");
    const third = await again(c, a.id, 6, "sealed");
    expect(third.stages.slice(5).map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 2, "finished"], ["gate", 2, "finished"], ["seal", 2, "finished"]]);
    const second = git(a.worktree, "rev-parse", "HEAD~2").trim();
    expect(git(a.worktree, "show", `HEAD:${GATE_PATH}`)).toBe(gateRecord(NAME, [[read, base], [noted, base], [second, base]]));
    expect(commitsAfterMain(a.worktree).slice(-3)).toEqual([{ subject: "chore: record review round 2", body: TRAILER, paths: [`${DIRECTORY}/trail/rounds/round-2.md`] }, GATE_COMMIT, SEAL_COMMIT]);
    // Each seal names the commit its gate passed on, and the three sections stand in the order of their runs.
    expect([...readFileSync(join(a.worktree, DIRECTORY, "guarantee.md"), "utf8").matchAll(/^(?:## Run \d+|target: [0-9a-f]{40})/gmu)].map(([line]) => line)).toEqual(["## Run 1", `target: ${read}`, "## Run 2", `target: ${noted}`, "## Run 3", `target: ${second}`]);
    expect(await gateEntries(c, a.id, 7)).toHaveLength(3);
  });

  it("stops the chain where the command exits with another code: no record is written and nothing is committed, the chain's sentence says the code, the gate's stage has failed, what the command printed is kept in the run folder for the user alone and a daemon started later on that folder answers it too, the other work item's chain goes on, and a later getSeal runs the gate again and no round", async () => {
    const gate = 'echo "one case failed"; if [ -e passes ]; then exit 0; fi; exit 3';
    const stood = await standing(cleanups, ["Sealed work", "Other work"], { gate, roleAdapter: roles({ proofer: clean }) });
    const { c } = stood;
    const [a, b] = stood.workItems as [(typeof stood.workItems)[number], (typeof stood.workItems)[number]];
    write(b.worktree, "passes", "");
    commitAll(b.worktree, "test: let the gate pass");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    expect(await c.getSeal(b.id, 2)).toBe("done");
    const stopped = await c.chain(a.id, "stopped");
    const failed = gateStage({ state: "failed", failure: "the command exited with code 3", gate: { command: gate, exitCode: 3, output: true } });
    expect(stopped).toEqual({ state: "stopped", says: "The broad gate failed: the command exited with code 3.", since: NOW, stages: [ended(1, stopped.stages[0]?.headlessId), failed] });
    expect(existsSync(join(a.worktree, GATE_PATH))).toBe(false);
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    expect(status(a.worktree)).toEqual([]);
    expect(await output(c, a.id, 3)).toEqual({ text: "one case failed\n", cut: false });
    expect(await gateEntries(c, a.id, 4)).toMatchObject([{ stage: { role: null, stage: "gate" }, state: "failed", stopped: null, usage: null }]);
    const file = join(stood.runDir, "gate-output", `${String(a.id)}.txt`);
    expect([readFileSync(file, "utf8"), statSync(file).mode & 0o777, statSync(join(stood.runDir, "gate-output")).mode & 0o777]).toEqual(["one case failed\n", 0o600, 0o700]);

    expect(kinds(await c.chain(b.id, "sealed"))).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    expect(await output(c, b.id, 5)).toEqual({ text: "one case failed\n", cut: false });

    expect(kinds(await again(c, a.id, 6, "stopped"))).toEqual([["round", "finished"], ["gate", "failed"], ["gate", "failed"]]);
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    expect(await output(c, 99, 7)).toBe("no work item 99");

    const later = await client((await stood.start()).url, cleanups);
    await later.message("ready");
    expect(await output(later, a.id, 8)).toEqual({ text: "one case failed\n", cut: false });
  });

  it("ends the command at a client's stopGate: the shell and the process it started have exited, the chain stops with what ended the run, nothing is committed, the run's entry of the ledger says a request stopped it, and a stopGate where no gate runs is refused", async () => {
    const out = outside();
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate: SLEEPS, gateEnv: env({ OUT: out }), roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect((await c.asked({ type: "stopGate", requestId: 9, workItemId: a.id })) as unknown).toEqual({ type: "error", requestId: 9, message: "No broad gate of work item 1 is running." });
    expect(await c.getSeal(a.id, 1)).toBe("done");
    expect(await gateRuns(c, a.id)).toEqual(gateStage({ state: "working", endedAt: null, gate: { command: SLEEPS, exitCode: null, output: false } }));
    expect(c.workItem(a.id)?.chain).toMatchObject({ state: "running", says: "The broad gate is running." });
    const pids = await pidsIn(out);
    expect(await output(c, a.id, 2)).toBe("Owlery keeps no output of a broad gate of work item 1.");
    expect((await c.asked({ type: "stopGate", requestId: 3, workItemId: a.id })).type).toBe("done");
    const chain = await c.chain(a.id, "stopped");
    expect(chain.says).toBe("The broad gate failed: the command was stopped at a request before it ended.");
    expect(chain.stages.at(-1)).toEqual(gateStage({ state: "failed", failure: "the command was stopped at a request before it ended", gate: { command: SLEEPS, exitCode: null, output: false } }));
    expect(await untilGone(pids, 5_000)).toEqual([]);
    expect(existsSync(join(a.worktree, GATE_PATH))).toBe(false);
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    expect(await gateEntries(c, a.id, 4)).toMatchObject([{ state: "failed", stopped: "request", usage: null }]);
    expect((await c.asked({ type: "stopGate", requestId: 5, workItemId: a.id })).type).toBe("error");
    expect((await c.asked({ type: "stopGate", requestId: 6, workItemId: "1" as unknown as number })).type).toBe("error");
  });

  it("ends the command at its time limit, and records no run of a command that was stopped whatever it exited with: one that takes the signal and exits with 0 has failed", async () => {
    const out = outside();
    const gate = `trap 'exit 0' TERM; ${SLEEPS}`;
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate, gateEnv: env({ OUT: out }), gateLimitMs: 1_000, roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const [, shell = 0] = await pidsIn(out);
    const chain = await c.chain(a.id, "stopped");
    expect(chain.says).toBe("The broad gate failed: the command reached its time limit and was stopped.");
    expect(chain.stages.at(-1)).toEqual(gateStage({ state: "failed", failure: "the command reached its time limit and was stopped", gate: { command: gate, exitCode: 0, output: false } }));
    expect(await untilGone([shell], 5_000)).toEqual([]);
    expect(existsSync(join(a.worktree, GATE_PATH))).toBe(false);
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    expect(await gateEntries(c, a.id, 2)).toMatchObject([{ state: "failed", stopped: "limit" }]);
  });

  it("keeps what first stopped a command as what ended it: a stopGate that arrives after the time limit, while the command that ignores the signal is still being ended, changes neither the chain's sentence nor the run's entry of the ledger", async () => {
    const out = outside();
    const gate = `trap '' TERM; ${SLEEPS}`;
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate, gateEnv: env({ OUT: out }), gateLimitMs: 300, roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const pids = await pidsIn(out);
    // The limit has passed, and the daemon kills the command's group two seconds after it.
    await new Promise((r) => setTimeout(r, 700));
    expect((await c.asked({ type: "stopGate", requestId: 2, workItemId: a.id })).type).toBe("done");
    const chain = await c.chain(a.id, "stopped");
    expect(chain.says).toBe("The broad gate failed: the command reached its time limit and was stopped.");
    expect(chain.stages.at(-1)).toMatchObject({ kind: "gate", state: "failed", gate: { exitCode: null } });
    expect(await gateEntries(c, a.id, 3)).toMatchObject([{ state: "failed", stopped: "limit" }]);
    expect(await untilGone(pids, 5_000)).toEqual([]);
  });

  it("writes no record where the tree moved under a command that exited with 0: one that edited a tracked file, one that left an untracked file, and one during which a commit landed on the branch, each with a sentence that names the path or the two commits", async () => {
    const moved = async (gate: string): Promise<{ worktree: string; chain: Chain }> => {
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate, roleAdapter: roles({ proofer: clean }) });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1)).toBe("done");
      const chain = await c.chain(a.id, "stopped");
      expect(chain.stages.at(-1)).toMatchObject({ kind: "gate", state: "failed", gate: { command: gate, exitCode: 0 } });
      expect(existsSync(join(a.worktree, GATE_PATH))).toBe(false);
      expect(git(a.worktree, "ls-tree", "-r", "--name-only", "HEAD").split("\n")).not.toContain(GATE_PATH);
      return { worktree: a.worktree, chain };
    };
    const outsideIt = "The broad gate failed: after the run the worktree holds a change no commit holds outside the work item's directory, at";
    const edited = await moved('echo "A parting" >> feature.txt');
    expect(edited.chain.says).toBe(`${outsideIt} feature.txt.`);
    expect(subjects(edited.worktree)).toEqual(TO_ROUND_1);
    expect((await moved("touch left-behind.txt")).chain.says).toBe(`${outsideIt} left-behind.txt.`);
    const landed = await moved('git commit --quiet --allow-empty -m "chore: land during the gate"');
    const [after = "", before = ""] = git(landed.worktree, "log", "-2", "--format=%h").trim().split("\n");
    expect(landed.chain.says).toBe(`The broad gate failed: the worktree's head moved during the run, from ${before} to ${after}, so the command did not run on one commit.`);
    expect(subjects(landed.worktree)).toEqual([...TO_ROUND_1, "chore: land during the gate"]);
  });

  it("refuses a start where the worktree's config.json names no command under the key, an empty one or one of white space alone: the answer names the key, no session starts and nothing is written", async () => {
    for (const gate of [null, "", " \t"]) {
      const { adapter, started } = noted(roles());
      const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate, roleAdapter: adapter });
      const a = workItems[0]!;
      expect(await c.getSeal(a.id, 1), JSON.stringify(gate)).toBe('seal/config.json of the worktree names no command under "Broad gate", so no broad gate can run on this branch and no seal can be given. Name the repository\'s check there, and commit it.');
      expect(started).toEqual([]);
      expect(c.workItem(a.id)?.chain).toBeNull();
      expect(subjects(a.worktree)).toEqual(["feat: greet"]);
      expect(status(a.worktree)).toEqual([]);
    }
  });

  it("starts no command where the key lost its command on the branch since the start: the chain stops before the gate, and says so", async () => {
    const crafter = (cwd: string, prompt: string): void => {
      fixes(cwd, prompt);
      write(cwd, "seal/config.json", "{}\n");
      git(cwd, "add", "seal/config.json");
      git(cwd, "commit", "--quiet", "-m", "chore: name no gate");
    };
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ crafter }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "stopped");
    expect(chain.says).toBe('The broad gate did not run: the worktree\'s config.json names no command under "Broad gate".');
    expect(kinds(chain)).toEqual([["round", "finished"], ["fix-pass", "finished"], ["round", "finished"]]);
    expect(existsSync(join(a.worktree, GATE_PATH))).toBe(false);
  });

  it("starts no command where the head moved, or a change came to stand outside the work item's directory, while the records were read: the chain says which, and the command did not run", async () => {
    const unstarted = async (move: (worktree: string) => void): Promise<{ worktree: string; says: string }> => {
      const out = outside();
      const stood = await standing(cleanups, ["Sealed work"], { gate: 'echo ran >> "$OUT/runs"; exit 1', gateEnv: env({ OUT: out }), roleAdapter: roles({ proofer: clean }) });
      const a = stood.workItems[0]!;
      expect(await stood.c.getSeal(a.id, 1)).toBe("done");
      await stood.c.chain(a.id, "stopped");
      // The read of the gate's record at the head is held, and the worktree moves before the gate starts.
      const held = heldGit(cleanups, stood.made.base, 'case "$*" in *trail/gate.md*) true ;; *) false ;; esac');
      stood.c.messages.length = 0;
      expect(await stood.c.getSeal(a.id, 2)).toBe("done");
      await stood.c.until(() => (held.waiting() ? true : undefined));
      move(a.worktree);
      held.release();
      const chain = await stood.c.chain(a.id, "stopped");
      expect(kinds(chain)).toEqual([["round", "finished"], ["gate", "failed"]]);
      expect(readFileSync(join(out, "runs"), "utf8")).toBe("ran\n");
      return { worktree: a.worktree, says: chain.says };
    };
    const landed = await unstarted((worktree) => void git(worktree, "commit", "--quiet", "--allow-empty", "-m", "chore: land while the records are read"));
    const [after = "", before = ""] = git(landed.worktree, "log", "-2", "--format=%h").trim().split("\n");
    expect(landed.says).toBe(`The broad gate did not run: the worktree's head moved from ${before} to ${after} while Owlery read the records.`);
    const loose = await unstarted((worktree) => write(worktree, "loose.txt", "left by a person\n"));
    expect(loose.says).toBe("The broad gate did not run: the worktree holds a change no commit holds outside the work item's directory, at loose.txt.");
  });

  it("counts no run but its own, and keeps what the newest run printed in place of the run before: a run block the worktree holds and no commit does leaves the gate owed, the record the daemon commits is built on the file as the head holds it, and a run that printed nothing leaves no output kept", async () => {
    const out = outside();
    // The first run prints and fails, the second prints and passes, and the third passes and prints nothing.
    const gate = 'n=$(cat "$OUT/n" 2>/dev/null || echo 0); echo $((n + 1)) > "$OUT/n"; [ "$n" -ge 2 ] || echo "run $((n + 1))"; [ "$n" -ge 1 ]';
    const { c, runDir, workItems } = await standing(cleanups, ["Sealed work"], { gate, gateEnv: env({ OUT: out }), roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    const base = a.baseCommit ?? "";
    expect(await c.getSeal(a.id, 1)).toBe("done");
    expect((await c.chain(a.id, "stopped")).says).toBe("The broad gate failed: the command exited with code 1.");
    expect(await output(c, a.id, 2)).toEqual({ text: "run 1\n", cut: false });
    const at = head(a.worktree);
    write(a.worktree, GATE_PATH, `${gateRecord(NAME, [[at, base]])}\nA run the person wrote by hand.\n`);
    expect(kinds(await again(c, a.id, 3, "sealed"))).toEqual([["round", "finished"], ["gate", "failed"], ["gate", "finished"], ["seal", "finished"]]);
    expect(git(a.worktree, "show", `HEAD:${GATE_PATH}`)).toBe(gateRecord(NAME, [[at, base]]));
    expect(readFileSync(join(a.worktree, GATE_PATH), "utf8")).toBe(gateRecord(NAME, [[at, base]]));
    expect(await output(c, a.id, 4)).toEqual({ text: "run 2\n", cut: false });
    write(a.worktree, `${DIRECTORY}/notes.md`, "A note of the person's.\n");
    commitAll(a.worktree, "docs: note the work");
    expect((await again(c, a.id, 5, "sealed")).stages.at(-2)).toMatchObject({ kind: "gate", state: "finished", gate: { exitCode: 0, output: false } });
    expect(await output(c, a.id, 6)).toBe("Owlery keeps no output of a broad gate of work item 1.");
    expect(existsSync(join(runDir, "gate-output", `${String(a.id)}.txt`))).toBe(false);
  });

  it("says which signal ended a command that no stop ended, and records no run of it", async () => {
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate: "kill -KILL $$", roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "stopped");
    expect(chain.says).toBe("The broad gate failed: the signal SIGKILL ended the command.");
    expect(chain.stages.at(-1)).toEqual(gateStage({ state: "failed", failure: "the signal SIGKILL ended the command", gate: { command: "kill -KILL $$", exitCode: null, output: false } }));
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    expect(await gateEntries(c, a.id, 2)).toMatchObject([{ state: "failed", stopped: null }]);
  });

  it("keeps the last characters of a longer output, as many as its bound, and says that the text is cut", async () => {
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate: "printf abcdefghijklmno; exit 1", gateOutputChars: 8, roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "stopped");
    expect(await output(c, a.id, 2)).toEqual({ text: "hijklmno", cut: true });
  });

  it("stops where the reader refuses a line of the gate's record the head holds, with the file and the line, and leaves the file as it is, and runs the gate again where the newest run names a commit the repository does not hold", async () => {
    const { adapter, started } = noted(roles({ proofer: clean }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    const base = a.baseCommit ?? "";
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    const file = join(a.worktree, GATE_PATH);
    const unread = `${readFileSync(file, "utf8")}\n<!-- a note of the person's -->\n`;
    writeFileSync(file, unread);
    commitAll(a.worktree, "docs: note the gate");
    const stopped = await again(c, a.id, 2, "stopped");
    expect(stopped.says).toMatch(new RegExp(`^The chain stopped: the reader refuses line 7 of ${DIRECTORY}/trail/gate\\.md: the line begins with \`<!--\``, "u"));
    expect(kinds(stopped)).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    // The first start's proofer and its sealer, and no session since.
    expect(started).toHaveLength(2);
    expect(readFileSync(file, "utf8")).toBe(unread);
    expect(status(a.worktree)).toEqual([]);

    writeFileSync(file, gateRecord(NAME, [["f".repeat(40), base]]));
    const rewritten = commitAll(a.worktree, "docs: name a run no commit bears");
    expect(kinds(await again(c, a.id, 3, "sealed")).slice(-2)).toEqual([["gate", "finished"], ["seal", "finished"]]);
    expect(git(a.worktree, "show", `HEAD:${GATE_PATH}`)).toBe(gateRecord(NAME, [["f".repeat(40), base], [rewritten, base]]));
    // No round ran again: the one session more is the sealer's, on the commit the new run names.
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "sealer", "sealer"]);
  });

  it("ends a running command where the daemon closes: the close does not wait for the command's own end, the shell and the process it started have exited, nothing is committed or kept, the run's entry of the ledger says the daemon stopped it, and the next daemon reads the chain as stopped while the broad gate ran", async () => {
    const out = outside();
    const stood = await standing(cleanups, ["Sealed work"], { gate: SLEEPS, gateEnv: env({ OUT: out }), roleAdapter: roles({ proofer: clean }) });
    const a = stood.workItems[0]!;
    expect(await stood.c.getSeal(a.id, 1)).toBe("done");
    await gateRuns(stood.c, a.id);
    const pids = await pidsIn(out);
    const before = Date.now();
    await stood.d.close();
    expect(Date.now() - before).toBeLessThan(5_000);
    expect(await untilGone(pids, 5_000)).toEqual([]);
    expect((JSON.parse(readFileSync(join(stood.runDir, "repositories.json"), "utf8")) as { repositories: { workItems: { chain: Chain }[] }[] }).repositories[0]?.workItems[0]?.chain).toMatchObject({ state: "running", says: "The broad gate is running.", stages: [{ kind: "round" }, { kind: "gate", state: "working" }] });
    const entries = readFileSync(join(stood.runDir, "ledger.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { stage: unknown; state: string; stopped: string | null });
    expect(entries.at(-1)).toMatchObject({ stage: { role: null, stage: "gate" }, state: "failed", stopped: "daemon" });
    expect(existsSync(join(stood.runDir, "gate-output"))).toBe(false);
    expect(subjects(a.worktree)).toEqual(TO_ROUND_1);
    const later = await client((await stood.start()).url, cleanups);
    expect((await later.message("ready")).workItems[0]?.chain).toMatchObject({ state: "stopped", says: "The daemon ended while the broad gate ran.", stages: [{ kind: "round" }, { kind: "gate", state: "failed", failure: "the daemon ended while the stage ran", gate: { command: SLEEPS, exitCode: null, output: false } }] });
  });

  it("ends a running command where the work item is archived, with what ended it in the chain's sentence, and removes what a work item's gate printed where the work item is deleted", async () => {
    const out = outside();
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate: SLEEPS, gateEnv: env({ OUT: out }), roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await gateRuns(c, a.id);
    const pids = await pidsIn(out);
    expect((await c.asked({ type: "archiveWorkItem", requestId: 2, id: a.id, running: { panes: [], headless: [] } })).type).toBe("done");
    expect((await c.chain(a.id, "stopped")).says).toBe("The broad gate failed: the command was ended when the work item was archived.");
    expect(await untilGone(pids, 5_000)).toEqual([]);

    const failing = await standing(cleanups, ["Sealed work"], { gate: "echo kept; exit 1", roleAdapter: roles({ proofer: clean }) });
    const b = failing.workItems[0]!;
    expect(await failing.c.getSeal(b.id, 1)).toBe("done");
    await failing.c.chain(b.id, "stopped");
    const file = join(failing.runDir, "gate-output", `${String(b.id)}.txt`);
    expect(readFileSync(file, "utf8")).toBe("kept\n");
    const loss = await failing.c.asked({ type: "readLoss", requestId: 2, id: b.id });
    expect(loss.type).toBe("workItemLoss");
    const stamp = loss.type === "workItemLoss" ? loss.loss.stamp : "";
    expect((await failing.c.asked({ type: "deleteWorkItem", requestId: 3, id: b.id, stamp, force: true, running: { panes: [], headless: [] } })).type).toBe("done");
    expect(existsSync(file)).toBe(false);
  });
});

// Each chain is a round, a gate's command and one sealer's session or more, beside the rest of the suite.
describe("the seal of a work item's chain", { timeout: 60_000 }, () => {
  const GUARANTEE = `${DIRECTORY}/guarantee.md`;
  const DECISIONS = `${DIRECTORY}/decisions.md`;
  const SEAL_COMMIT = { subject: "chore: record the sealer's verdict", body: TRAILER, paths: [GUARANTEE] };
  const subjects = (worktree: string): string[] => commitsAfterMain(worktree).map(({ subject }) => subject);
  const stagesOf = (chain: Chain): [string, string][] => chain.stages.map(({ kind, state }) => [kind, state]);
  type Client = Awaited<ReturnType<typeof client>>;
  type Given = { run: number; heading: string; target: string };
  /** Starts the chain again and gives it once it rests in the state, read from the messages after the start alone. */
  async function again(c: Client, id: number, requestId: number, state: Chain["state"]): Promise<Chain> {
    c.messages.length = 0;
    expect(await c.getSeal(id, requestId)).toBe("done");
    return c.chain(id, state);
  }
  /** The guarantee as the branch's head holds it, or null where it holds none. */
  const guaranteeAt = (worktree: string): string | null => (git(worktree, "ls-tree", "-r", "--name-only", "HEAD").split("\n").includes(GUARANTEE) ? git(worktree, "show", `HEAD:${GUARANTEE}`) : null);

  it("stops the chain where the sealer withholds: the guarantee is committed with the sealer's block and the daemon's lines, the chain's sentence holds the reason, no stage follows, and a getSeal on the same head runs a second sealer whose section stands below the first, which is unchanged", async () => {
    const REASON = "the changelog names `gone.ts`, which the tree does not hold";
    let withholds = true;
    const { adapter, started } = noted(roles({ proofer: clean, sealer: (given) => sealSection(given, withholds ? `withheld reason: ${REASON}` : "sealed") }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const stopped = await c.chain(a.id, "stopped");
    // The seal's stage finished: the daemon wrote and committed the verdict, and the verdict stops the chain.
    expect([stopped.says, stagesOf(stopped)]).toEqual([`The sealer withheld its verdict: ${REASON}.`, [["round", "finished"], ["gate", "finished"], ["seal", "finished"]]]);
    const gate = git(a.worktree, "rev-parse", "HEAD~2").trim();
    const first = sealedBy(sealSection({ heading: "## Run 1", target: `${gate} against main` }, `withheld reason: ${REASON}`), "the session", "fake-2");
    expect(guaranteeAt(a.worktree)).toBe(guaranteeRecord(NAME, [first]));
    expect(commitsAfterMain(a.worktree).at(-1)).toEqual(SEAL_COMMIT);
    expect(status(a.worktree)).toEqual([]);
    // Nothing starts by itself after the verdict.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "sealer"]);

    // The person's start is the word for another run: the head is the same, so no round and no gate run.
    withholds = false;
    const sealed = await again(c, a.id, 2, "sealed");
    expect(stagesOf(sealed)).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"], ["seal", "finished"]]);
    expect(sealed.says).toBe(`The sealer sealed ${gate.slice(0, 7)}, after round 1.`);
    expect(givenSeal(started[2]?.prompt ?? "")).toEqual({ run: 2, heading: "## Run 2", target: `${gate} against main` });
    const second = sealedBy(sealSection({ heading: "## Run 2", target: `${gate} against main` }), "the session", "fake-3");
    expect(guaranteeAt(a.worktree)).toBe(guaranteeRecord(NAME, [first, second]));
    expect(subjects(a.worktree).slice(-3)).toEqual(["chore: record the broad gate's run", "chore: record the sealer's verdict", "chore: record the sealer's verdict"]);
  });

  it("writes no verdict where the judging session built the work: a sealer whose session names the id of the fix pass's session is given no verdict block and no commit, whatever its verdict reads, the chain says so, and a sealer of another id is named beside the builders", async () => {
    let judge = "s-1";
    const session = (_prompt: string, role?: { role: string }): { id: string; model: string | null } => ({ id: role?.role === "crafter" ? "s-1" : role?.role === "sealer" ? judge : "p-1", model: "owl-large" });
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({}, { session }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const stopped = await c.chain(a.id, "stopped");
    expect(stopped.says).toBe("The sealer's session failed: the judging session, s-1, is one of the sessions that built the work, and a session that built gives no verdict.");
    expect(stopped.stages.at(-1)).toMatchObject({ kind: "seal", round: 2, state: "failed", failure: "the judging session, s-1, is one of the sessions that built the work, and a session that built gives no verdict" });
    expect(guaranteeAt(a.worktree)).toBeNull();
    expect(existsSync(join(a.worktree, GUARANTEE))).toBe(false);
    expect(subjects(a.worktree).at(-1)).toBe("chore: record the broad gate's run");
    expect(commitsAfterMain(a.worktree).find(({ subject }) => subject === "chore: record the fix pass of round 1")?.body).toBe(`${TRAILER}\nSeal-Built-By: s-1`);
    expect(status(a.worktree)).toEqual([]);

    judge = "s-2";
    await again(c, a.id, 2, "sealed");
    expect(guaranteeAt(a.worktree)).toContain("\nVerdict: sealed\nbuilt-by: the session, s-1\njudged-by: s-2\nmodel: owl-large\nrules: owlery 0.0.2\n```\n");
  });

  it("writes no verdict of an answer it cannot take, and says which: a target other than the prompt's, two verdict blocks, a line the daemon writes, a line the reader refuses, no section, and a section of another run", async () => {
    let answer: (given: Given) => string = (given) => sealSection(given);
    const { adapter, started } = noted(roles({ proofer: clean, sealer: (given) => answer(given) }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    const block = (target: string, ...more: string[]): string => ["```seal", `target: ${target}`, "Verdict: sealed", ...more, "```", ""].join("\n");
    const refused: [(given: Given) => string, string][] = [
      [(given) => sealSection({ ...given, target: `${A} against main` }), `its verdict's target line reads \`${A} against main\`, and the run was given \``],
      [(given) => `${sealSection(given)}\n${block(given.target)}`, "its section holds 2 verdict blocks, and a run's section holds one"],
      [(given) => `${given.heading}\n\n${block(given.target, "judged-by: s-9")}`, "its verdict block holds a `judged-by:` line, which the daemon writes and a sealer does not"],
      [(given) => `${given.heading}\n\n${block(given.target, "gate: passed")}`, "its section holds a line Owlery cannot read, line 6: "],
      [() => "I read the branch, and it holds.", "its answer holds no section of the guarantee: no line of it reads `## Run 1`"],
      [(given) => sealSection({ ...given, heading: "## Run 2" }), "its section is headed `## Run 2`, and the run was given `## Run 1`"],
    ];
    let request = 0;
    for (const [says, why] of refused) {
      answer = says;
      const stopped = await again(c, a.id, (request += 1), "stopped");
      expect(stopped.says, why).toContain(`The sealer's session failed: ${why}`);
      expect(stopped.stages.at(-1), why).toMatchObject({ kind: "seal", round: 1, state: "failed" });
      expect([guaranteeAt(a.worktree), existsSync(join(a.worktree, GUARANTEE)), subjects(a.worktree).at(-1), status(a.worktree)], why).toEqual([null, false, "chore: record the broad gate's run", []]);
    }
    // Each start after the first ran the seal alone, on the gate's commit, as run 1: no verdict stands.
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer", ...refused.map(() => "sealer")]);
    expect(started.slice(1).map(({ prompt }) => givenSeal(prompt).run)).toEqual(refused.map(() => 1));
    // A sealer's block may hold the `original:` line, which both grammars take and no line of the daemon's is.
    answer = (given) => `${given.heading}\n\n${["```seal", `target: ${given.target}`, `original: ${B}`, "Verdict: sealed", "```", ""].join("\n")}`;
    await again(c, a.id, (request += 1), "sealed");
    expect(guaranteeAt(a.worktree)).toContain(`\noriginal: ${B}\nVerdict: sealed\nbuilt-by: the session\n`);
  });

  it("writes no verdict where the daemon cannot name who judged or under which rules, or who built: a session that named no id, one that named no model, a daemon given no version, and a routing whose implementer is a crafter on a branch no fix pass's commit names", async () => {
    // The session's own name is the adapter's to report, and one adapter of the case reports none for a sealer.
    const inner = roles({ proofer: clean }, { session: (_prompt, role) => ({ id: `${role?.role ?? "none"}-1`, model: role?.role === "sealer" ? null : "owl-large" }) });
    const unnamed: RoleAdapter = { ...inner, start: (options, listener) => inner.start(options, (event) => (event.type === "session" && options.role?.role === "sealer" ? undefined : listener(event))) };
    const cases: [Partial<NonNullable<Parameters<typeof standing>[2]>>, string, ((worktree: string, branch: string) => void)?][] = [
      [{ roleAdapter: unnamed }, "its session named no id of its own, and a verdict names the session that judged"],
      [{ roleAdapter: inner }, "its session named no model, and a verdict names the model that judged"],
      [{ roleAdapter: roles({ proofer: clean }), version: undefined }, "this daemon was given no version of Owlery, and a verdict names the version of the rules it was judged under"],
      [
        { roleAdapter: roles({ proofer: clean }) },
        "no session is named as having built the work, and a verdict names one or more",
        (worktree, branch) => {
          write(worktree, `${DIRECTORY}/routing.md`, routingText(NAME, branch, TODAY).replace("| Implementation | the session |", "| Implementation | crafter |"));
          commitAll(worktree, "chore: declare the work item's routing");
        },
      ],
    ];
    for (const [options, why, prepare] of cases) {
      const { c, workItems } = await standing(cleanups, ["Sealed work"], options);
      const a = workItems[0]!;
      prepare?.(a.worktree, a.branch);
      expect(await c.getSeal(a.id, 1)).toBe("done");
      expect((await c.chain(a.id, "stopped")).says, why).toBe(`The sealer's session failed: ${why}.`);
      expect([guaranteeAt(a.worktree), existsSync(join(a.worktree, GUARANTEE)), subjects(a.worktree).at(-1), status(a.worktree)], why).toEqual([null, false, "chore: record the broad gate's run", []]);
    }
  });

  it("writes no verdict where the tree moved under the sealer: a commit that landed on the branch during the seal, and a file the sealer's session left outside the work item's directory, each with a sentence that names the two commits or the path", async () => {
    const landed = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }, { work: (cwd, _prompt, role) => (role?.role === "sealer" ? void commitFix(cwd) : undefined) }) });
    const a = landed.workItems[0]!;
    expect(await landed.c.getSeal(a.id, 1)).toBe("done");
    const moved = await landed.c.chain(a.id, "stopped");
    const [after = "", before = ""] = git(a.worktree, "log", "-2", "--format=%h").trim().split("\n");
    expect(moved.says).toBe(`The sealer's session failed: the worktree's head moved during the seal, from ${before} to ${after}, so the broad gate no longer holds at the head the sealer read.`);
    expect([guaranteeAt(a.worktree), existsSync(join(a.worktree, GUARANTEE))]).toEqual([null, false]);

    const left = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }, { work: (cwd, _prompt, role) => (role?.role === "sealer" ? write(cwd, "notes.txt", "a note\n") : undefined) }) });
    const b = left.workItems[0]!;
    expect(await left.c.getSeal(b.id, 1)).toBe("done");
    expect((await left.c.chain(b.id, "stopped")).says).toBe("The sealer's session failed: the worktree holds a change no commit holds outside the work item's directory, at notes.txt.");
    expect([guaranteeAt(b.worktree), existsSync(join(b.worktree, GUARANTEE)), subjects(b.worktree).at(-1)]).toEqual([null, false, "chore: record the broad gate's run"]);
  });

  it("refuses a sealer's write and its command by the sealer's grant: the seal's stage counts two refused calls, trail/refusals.md holds a row for each in the commit that carries the guarantee, and nothing is written or run", async () => {
    const asks = (_prompt: string, role?: { role: string }) => (role?.role === "sealer" ? [{ tool: "Write", action: "write" as const, path: "notes.md", text: "notes.md" }, { tool: "Bash", action: "run" as const, path: null, text: "pnpm -r run check" }] : []);
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }, { asks }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "sealed");
    expect(chain.stages.map(({ kind, refusals }) => [kind, refusals])).toEqual([["round", 0], ["gate", 0], ["seal", 2]]);
    const refusals = `${DIRECTORY}/trail/refusals.md`;
    expect(git(a.worktree, "show", `HEAD:${refusals}`).split("\n")).toEqual([`# Refused calls: ${NAME}`, "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|", "| seal 1 | sealer | Write | writes a file | no-write |", "| seal 1 | sealer | Bash | runs a command | no-command |", ""]);
    expect(commitsAfterMain(a.worktree).at(-1)).toEqual({ ...SEAL_COMMIT, paths: [GUARANTEE, refusals] });
    expect(existsSync(join(a.worktree, "notes.md"))).toBe(false);
    expect(status(a.worktree)).toEqual([]);
    // Both files of the verdict's commit are closing records, so the gate holds at the head and nothing more is owed.
    expect(stagesOf(await again(c, a.id, 2, "sealed"))).toEqual(stagesOf(chain));
  });

  it("has the question of an undecided verdict ruled on by the orchestrator: the guarantee and then the decision are committed, the gate runs again on the head that holds the decision, and the second sealer's prompt names the record of decisions", async () => {
    const QUESTION = "Does the frame's item 4 cover a renamed branch?";
    const sealer = (given: Given): string => sealSection(given, given.run === 1 ? `undecided question: ${QUESTION}` : "sealed");
    const orchestrator = (prompt: string): string => {
      expect(givenQuestions(prompt)).toBe(1);
      return rulingBlock(1, "answered", "Item 4 covers a renamed branch.", "Read in `frame/design.md`.");
    };
    const { adapter, started } = noted(roles({ proofer: clean, sealer, orchestrator }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "sealed");
    expect(chain.stages.map(({ kind, round, state }) => [kind, round, state])).toEqual([["round", 1, "finished"], ["gate", 1, "finished"], ["seal", 1, "finished"], ["ruling", 1, "finished"], ["gate", 1, "finished"], ["seal", 1, "finished"]]);
    expect(started.map(({ role }) => role)).toEqual([{ role: "proofer", stage: "round" }, { role: "sealer", stage: "seal" }, { role: "orchestrator", stage: "judgment" }, { role: "sealer", stage: "seal" }]);
    expect(started[2]?.prompt).toContain(`- Who asks: the sealer, in the sealer's session\n\nIts question:\n\n1. ${QUESTION}\n   - Why the sealer cannot answer it: The sealer asked it in place of a verdict, in run 1 of guarantee.md.\n`);
    expect(commitsAfterMain(a.worktree).slice(3)).toEqual([
      { subject: "chore: record the broad gate's run", body: TRAILER, paths: [`${DIRECTORY}/trail/gate.md`] },
      SEAL_COMMIT,
      { subject: "chore: record the orchestrator's ruling on the sealer's question", body: TRAILER, paths: [DECISIONS] },
      { subject: "chore: record the broad gate's run", body: TRAILER, paths: [`${DIRECTORY}/trail/gate.md`] },
      SEAL_COMMIT,
    ]);
    expect(readDecisionRecord(readFileSync(join(a.worktree, DECISIONS), "utf8"))).toMatchObject({ decisions: [{ id: 1, kind: "answered", decided: "Item 4 covers a renamed branch.", grounds: "Read in `frame/design.md`.", by: "orchestrator", state: { is: "decided" } }], questions: [] });
    // The second gate ran on the commit that holds the decision, and the second verdict names that commit.
    const ruled = git(a.worktree, "rev-parse", "HEAD~2").trim();
    expect(givenSeal(started[3]?.prompt ?? "")).toEqual({ run: 2, heading: "## Run 2", target: `${ruled} against main` });
    expect(started[1]?.prompt).not.toContain("decisions.md");
    expect(started[3]?.prompt).toContain(`- The decisions and the answers to hold to: \`${DECISIONS}\`\n`);
    const guarantee = guaranteeAt(a.worktree) ?? "";
    expect(guarantee).toContain(`\nVerdict: undecided question: ${QUESTION}\nbuilt-by: the session\njudged-by: fake-2\n`);
    expect(guarantee).toContain(`\n## Run 2\n`);
    expect(guarantee).toContain(`\ntarget: ${ruled} against main\nVerdict: sealed\nbuilt-by: the session\njudged-by: fake-4\n`);
  });

  it("parks the work item where the orchestrator cannot decide a sealer's question: the record holds one open question by sealer, the chain is parked, and the person's answer runs the gate and then the seal", async () => {
    const QUESTION = "May the run push the branch to `origin`?";
    const sealer = (given: Given): string => sealSection(given, given.run === 1 ? `undecided question: ${QUESTION}` : "sealed");
    const { adapter, started } = noted(roles({ proofer: clean, sealer, orchestrator: () => rulingBlock(1, "park", null, "Only the person approves a push.") }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const parked = await c.chain(a.id, "parked");
    expect([parked.says, stagesOf(parked)]).toEqual(["The chain waits for the answers to the work item's open questions.", [["round", "finished"], ["gate", "finished"], ["seal", "finished"], ["ruling", "finished"]]]);
    expect(readDecisionRecord(readFileSync(join(a.worktree, DECISIONS), "utf8"))).toMatchObject({
      decisions: [],
      questions: [{ id: 1, asks: QUESTION, grounds: "The sealer asked it in place of a verdict, in run 1 of guarantee.md. The code and the policy do not decide it: Only the person approves a push.", by: "sealer", options: [], default: null, state: { is: "open" } }],
    });
    expect(subjects(a.worktree).slice(-2)).toEqual(["chore: record the sealer's verdict", "chore: record the orchestrator's ruling on the sealer's question"]);
    expect(status(a.worktree)).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(started).toHaveLength(3);

    c.send({ type: "answerQuestions", requestId: 2, workItemId: a.id, answers: [{ questionId: 1, answer: "It may not." }] });
    const chain = await c.chain(a.id, "sealed");
    expect(stagesOf(chain).slice(4)).toEqual([["gate", "finished"], ["seal", "finished"]]);
    expect(subjects(a.worktree).slice(-3)).toEqual(["chore: record the person's answers", "chore: record the broad gate's run", "chore: record the sealer's verdict"]);
    // The gate ran on the commit of the answer, which the second verdict names.
    const answered = git(a.worktree, "rev-parse", "HEAD~2").trim();
    expect(git(a.worktree, "log", "-1", "--format=%s", answered).trim()).toBe("chore: record the person's answers");
    expect(givenSeal(started[3]?.prompt ?? "")).toEqual({ run: 2, heading: "## Run 2", target: `${answered} against main` });
  });

  it("asks no ruling past the ceiling of undecided verdicts, and counts the undecided ones alone: a verdict that withheld is none of them, and where the guarantee holds as many undecided verdicts as the ceiling, the next one's question parks the work item in the commit that carries the verdict, with no orchestrator started", async () => {
    const sealer = (given: Given): string => sealSection(given, given.run === 1 ? "withheld reason: the changelog is missing" : `undecided question: Does run ${String(given.run)} read the frame as the build does?`);
    const { adapter, started } = noted(roles({ proofer: clean, sealer }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter, undecidedCeiling: 1 });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "stopped");
    const parked = await again(c, a.id, 2, "parked");
    // The withheld verdict stopped the chain. The first question after it was ruled on, which owed the gate and the seal again, and the second parked with no ruling.
    expect(stagesOf(parked)).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"], ["seal", "finished"], ["ruling", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "sealer", "sealer", "orchestrator", "sealer"]);
    expect(commitsAfterMain(a.worktree).at(-1)).toEqual({ ...SEAL_COMMIT, paths: [DECISIONS, GUARANTEE] });
    expect(readDecisionRecord(readFileSync(join(a.worktree, DECISIONS), "utf8"))).toMatchObject({
      decisions: [{ id: 1, kind: "answered", by: "orchestrator" }],
      questions: [{ id: 2, asks: "Does run 3 read the frame as the build does?", grounds: "The sealer asked it in place of a verdict, in run 3 of guarantee.md. The guarantee already holds one verdict that asked, and Owlery asks the orchestrator for a ruling on no more than that.", by: "sealer", state: { is: "open" } }],
    });
    expect(status(a.worktree)).toEqual([]);
  });

  it("counts no verdict but one a commit holds, and builds the guarantee on the file as the head holds it: a seal the worktree holds and no commit does leaves the seal owed, and is not committed with the daemon's section", async () => {
    let withholds = true;
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean, sealer: (given) => sealSection(given, withholds ? "withheld reason: the changelog is missing" : "sealed") }) });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "stopped");
    const committed = guaranteeAt(a.worktree) ?? "";
    const target = `${git(a.worktree, "rev-parse", "HEAD~2").trim()} against main`;
    // A seal of the gate's commit that the person wrote by hand, in the worktree alone.
    writeFileSync(join(a.worktree, GUARANTEE), `${committed}\n${sealedBy(sealSection({ heading: "## Run 2", target }), "the session", "by-hand")}`);
    withholds = false;
    const sealed = await again(c, a.id, 2, "sealed");
    expect(stagesOf(sealed)).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"], ["seal", "finished"]]);
    const now = guaranteeAt(a.worktree);
    expect(now).toBe(`${committed}\n${sealedBy(sealSection({ heading: "## Run 2", target }), "the session", "fake-3")}`);
    expect([readFileSync(join(a.worktree, GUARANTEE), "utf8"), status(a.worktree)]).toEqual([now, []]);
  });

  it("asks a ruling for the first two undecided verdicts of a guarantee where the daemon's options name no ceiling, and parks the third's question with none", async () => {
    const sealer = (given: Given): string => sealSection(given, `undecided question: Does run ${String(given.run)} read the frame as the build does?`);
    const { adapter, started } = noted(roles({ proofer: clean, sealer }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    expect(UNDECIDED_CEILING).toBe(2);
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "parked");
    expect(started.map(({ role }) => role?.role)).toEqual(["proofer", "sealer", "orchestrator", "sealer", "orchestrator", "sealer"]);
    expect(readDecisionRecord(readFileSync(join(a.worktree, DECISIONS), "utf8")).questions).toMatchObject([{ asks: "Does run 3 read the frame as the build does?", grounds: "The sealer asked it in place of a verdict, in run 3 of guarantee.md. The guarantee already holds 2 verdicts that asked, and Owlery asks the orchestrator for a ruling on no more than that.", by: "sealer" }]);
  });

  it("names no session a verdict block cannot name, and gives the sealer the frame, the phase records and the changelog where the directory holds them: a fix pass whose session named an id of two words is recorded with the routing's trailer alone, a trailer written by hand with such a value is passed over, and one with an id is taken", async () => {
    const session = (_prompt: string, role?: { role: string }): { id: string; model: string | null } => ({ id: role?.role === "crafter" ? "two words" : `${role?.role ?? "none"}-1`, model: "owl-large" });
    const { adapter, started } = noted(roles({}, { session }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
    write(a.worktree, `${DIRECTORY}/frame/design.md`, "# Design\n");
    write(a.worktree, `${DIRECTORY}/trail/phases/phase-1.md`, "# Phase 1\n");
    write(a.worktree, `${DIRECTORY}/changelog.md`, "- A greeting.\n");
    git(a.worktree, "add", "--all");
    git(a.worktree, "commit", "--quiet", "-m", "chore: declare the work item's routing", "-m", "Seal-Built-By: s-7\nSeal-Built-By: by hand, twice");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(commitsAfterMain(a.worktree).find(({ subject }) => subject === "chore: record the fix pass of round 1")?.body).toBe(TRAILER);
    expect(guaranteeAt(a.worktree)).toContain("\nVerdict: sealed\nbuilt-by: the session, s-7\njudged-by: sealer-1\nmodel: owl-large\n");
    expect(started.at(-1)?.prompt).toContain(`- The broad gate's record: \`${DIRECTORY}/trail/gate.md\`\n- The frame: \`${DIRECTORY}/frame/\`\n- The phase records: \`${DIRECTORY}/trail/phases/\`\n- The changelog fragment: \`${DIRECTORY}/changelog.md\`\n- The issue: `);
  });

  it("names no session of another work item whose fix pass's commit a rebase onto the base put on the branch's own line", async () => {
    const { made, c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({}) });
    const a = workItems[0]!;
    write(made.repo, "other.txt", "Another work item\n");
    git(made.repo, "add", "other.txt");
    git(made.repo, "commit", "--quiet", "-m", "fix: another work item's fix pass", "-m", "Seal-Routing: 1795388600-other-work\nSeal-Built-By: s-other");
    git(a.worktree, "rebase", "--quiet", "main");
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(guaranteeAt(a.worktree)).toContain("\nVerdict: sealed\nbuilt-by: the session, fake-2\njudged-by: ");
  });

  it("stops where the reader refuses a line of the guarantee the head holds, with the file and the line, and leaves the file as it is", async () => {
    const { adapter, started } = noted(roles({ proofer: clean }));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: adapter });
    const a = workItems[0]!;
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    const file = join(a.worktree, GUARANTEE);
    const unread = `${readFileSync(file, "utf8")}\n<!-- a note of the person's -->\n`;
    writeFileSync(file, unread);
    commitAll(a.worktree, "docs: note the guarantee");
    const stopped = await again(c, a.id, 2, "stopped");
    expect(stopped.says).toMatch(new RegExp(`^The chain stopped: the reader refuses line \\d+ of ${DIRECTORY}/guarantee\\.md: the line begins with \`<!--\``, "u"));
    expect(stagesOf(stopped)).toEqual([["round", "finished"], ["gate", "finished"], ["seal", "finished"]]);
    expect(started).toHaveLength(2);
    expect([readFileSync(file, "utf8"), git(a.worktree, "show", `HEAD:${GUARANTEE}`), status(a.worktree)]).toEqual([unread, unread, []]);
  });

  it("reads a chain an earlier build stored as reviewed as no chain: the daemon lists every repository and every work item of the file, and a getSeal runs the step the records owe", async () => {
    const { adapter, started } = noted(roles({ proofer: clean }));
    const stood = await standing(cleanups, ["Sealed work", "Other work"], { roleAdapter: adapter });
    const [a, b] = stood.workItems as [(typeof stood.workItems)[number], (typeof stood.workItems)[number]];
    // The records of a branch whose chain an earlier build rested: one round and the gate's run, and no guarantee.
    write(a.worktree, `${DIRECTORY}/routing.md`, routingText(NAME, a.branch, TODAY));
    const target = commitAll(a.worktree, "chore: declare the work item's routing");
    write(a.worktree, `${DIRECTORY}/trail/rounds/round-1.md`, roundRecord(HEADING(1), `${target} against main`));
    const read = commitAll(a.worktree, "chore: record review round 1");
    write(a.worktree, `${DIRECTORY}/trail/gate.md`, gateRecord(NAME, [[read, a.baseCommit ?? ""]]));
    const gated = commitAll(a.worktree, "chore: record the broad gate's run");
    // A change of a work item has the store write its file, which the case then gives the chain of the earlier build.
    expect((await stood.c.asked({ type: "setWorkItem", requestId: 9, id: b.id, pinned: true })).type).toBe("done");
    await stood.d.close();
    const file = join(stood.runDir, "repositories.json");
    const stored = JSON.parse(readFileSync(file, "utf8")) as { repositories: { workItems: { id: number; chain?: unknown }[] }[] };
    const item = stored.repositories[0]?.workItems.find(({ id }) => id === a.id);
    expect(item).toBeDefined();
    Object.assign(item ?? {}, { chain: { state: "reviewed", says: `The review rounds settled at ${gated.slice(0, 7)}, after round 1.`, reviewedAt: gated, since: 3, stages: [{ kind: "round", round: 1, state: "finished", failure: null, startedAt: 1, endedAt: 2, headlessId: 1, refusals: 0 }] } });
    writeFileSync(file, JSON.stringify(stored));
    const c = await client((await stood.start()).url, cleanups);
    const ready = await c.message("ready");
    expect([ready.repositories.length, ready.workItems.map(({ id, chain }) => [id, chain])]).toEqual([1, [[a.id, null], [b.id, null]]]);
    // The records owe the seal alone: the gate holds at the head, and no verdict stands.
    expect(await c.getSeal(a.id, 1)).toBe("done");
    const chain = await c.chain(a.id, "sealed");
    expect([chain.says, stagesOf(chain)]).toEqual([`The sealer sealed ${read.slice(0, 7)}, after round 1.`, [["seal", "finished"]]]);
    expect(started.map(({ role }) => role?.role)).toEqual(["sealer"]);
  });

  it("sends the seal its stages committed once the chain rests, with no wait of one interval of the read of the branches", async () => {
    // One read of the branches at the hello, and the next a minute later, three times the case's wait.
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: clean }), commitPollMs: 60_000 });
    const a = workItems[0]!;
    expect(c.workItem(a.id)?.seal).toBeNull();
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "sealed");
    expect(subjects(a.worktree).slice(-2)).toEqual(["chore: record the broad gate's run", "chore: record the sealer's verdict"]);
    const gate = git(a.worktree, "rev-parse", "HEAD~2").trim();
    expect(await c.until(() => c.workItem(a.id)?.seal ?? undefined)).toEqual({ state: "sealed", commit: gate, why: null });
  });
});
