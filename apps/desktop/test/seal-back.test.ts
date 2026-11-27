// The back of a seal as one function composes it, for the window and for
// the pull request's body alike, from what the committed records say and
// the ledger's entries. It reads no file and no clock, so each case hands it
// the values and reads what it gives.
import { describe, expect, it } from "vitest";
import type { BackFinding, BackRound, LedgerEntry, SealRecord, SealRecords, Usage } from "../src/shared/protocol";
import { composeBack, costText, costWords, spanWords, tokenWords } from "../src/shared/seal-back";

const A = "3f2a9c1".padEnd(40, "a");
const B = "86cb04d".padEnd(40, "b");
const MINUTE = 60_000;

/** A usage of one model, converted where not said otherwise. */
function usage(cost: number | null, converted = true, counts: [number | null, number | null, number | null, number | null] = [100, 20, 300, 40]): Usage {
  const [inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens] = counts;
  return { costUsd: cost, converted, models: [{ model: "owl-1", inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costUsd: cost }] };
}

/** The pair a chain's stage of the kind runs as. */
const PAIRS: Record<string, LedgerEntry["stage"]> = {
  round: { role: "proofer", stage: "round" },
  "fix-pass": { role: "crafter", stage: "fix-pass" },
  judgment: { role: "orchestrator", stage: "judgment" },
  ruling: { role: "orchestrator", stage: "judgment" },
  seal: { role: "inspector", stage: "inspection" },
  gate: { role: null, stage: "gate" },
};

/** An entry of a chain's stage that ran four minutes and a half and cost $0.28 converted, with what else a case gives it. */
function entry(chain: LedgerEntry["chain"], more: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    workItemId: 1,
    repo: "/repos/project",
    branch: "feat/x",
    stage: chain === null ? null : (PAIRS[chain.kind] ?? null),
    chain,
    startedAt: 0,
    endedAt: 4 * MINUTE + 30_000,
    state: "finished",
    stopped: null,
    usage: chain?.kind === "gate" ? null : usage(0.28),
    ...more,
  };
}

/** A finding of the record, fixed in `B` where not said otherwise. */
function finding(number: number, more: Partial<BackFinding> = {}): BackFinding {
  return { number, says: `Symptom ${String(number)}`, severity: "must", places: [{ path: "src/a.ts", lines: "12" }], close: { verdict: "fixed", commit: B, home: null, answer: null }, reopens: null, regression: null, ...more };
}

function round(number: number, findings: BackFinding[] = [], more: Partial<BackRound> = {}): BackRound {
  return { round: number, target: A, findings, confirms: [], unread: 0, ...more };
}

const RECORD: SealRecord = { commit: A, branch: "feat/x", base: "main", item: "1795400730-x", gate: A, rounds: 3, builtBy: ["the session", "s-1"], judgedBy: "s-2", model: "fake", rules: "owlery 0.0.2" };

function records(rounds: BackRound[], more: Partial<SealRecords> = {}): SealRecords {
  return { head: A, record: RECORD, brokenBy: null, rounds, refusals: [], unreadRefusals: 0, ...more };
}

/** What the back says of the costs where the ledger holds no stage of the chain. */
const OUTSIDE_DAEMON = "The stages of this chain ran outside Owlery's daemon, in a pane's session or in another tool, and Owlery read no cost of them.";

describe("the back of a seal, composed", () => {
  it("says that rounds that caught nothing caught nothing, in the head and in the round's part, with the round's stage and the sum of its cost", () => {
    const back = composeBack(records([round(1)]), [entry({ kind: "round", round: 1 })], 0);
    expect(back.head).toEqual(["The review rounds caught nothing."]);
    expect(back.rounds).toEqual([
      {
        round: 1,
        title: "Round 1, on `3f2a9c1`",
        findings: [],
        says: "No finding.",
        unread: null,
        stages: [{ name: "Round 1", ended: null, failed: false, time: "4 min", tokens: { input: "100", output: "20", cacheRead: "300", cacheWritten: "40" }, cost: { amount: "$0.28", converted: true } }],
      },
    ]);
    expect(back.after).toEqual([]);
    expect(back.sums).toEqual(["The chain's stages cost $0.28 converted."]);
    expect(back.outside).toBeNull();
    expect(back.converted).toBe("A converted cost is the usage priced at API prices, and it is not a charge.");
    expect(composeBack(records([]), [], 0).head).toEqual(["No review round is recorded."]);
  });

  it("counts a finding closed, reopened and closed again as one defect caught and fixed, and the findings of each round in order", () => {
    const rounds = [
      round(1, [finding(1)]),
      round(2, [finding(1, { says: "The fix does not hold", reopens: { round: 1, finding: 1 }, places: [{ path: "src/a.ts", lines: "3-9" }, { path: "src/b.ts", lines: null }] })], { target: B }),
      round(3, [], { confirms: [{ round: 2, finding: 1 }] }),
    ];
    const back = composeBack(records(rounds), [], 0);
    expect(back.head).toEqual(["The review rounds caught 1 defect that was fixed before the seal.", "Findings by round: 1, 1, 0."]);
    expect(back.rounds.map(({ title, findings, says }) => ({ title, findings, says }))).toEqual([
      { title: "Round 1, on `3f2a9c1`", findings: [{ number: 1, says: "Symptom 1", severity: "must", places: ["src/a.ts:12"], close: "Fixed in `86cb04d`", open: false, names: null }], says: null },
      { title: "Round 2, on `86cb04d`", findings: [{ number: 1, says: "The fix does not hold", severity: "must", places: ["src/a.ts:3-9", "src/b.ts"], close: "Fixed in `86cb04d`", open: false, names: "It reopens round 1's finding 1." }], says: null },
      { title: "Round 3, on `3f2a9c1`", findings: [], says: "No finding. It confirmed round 2's finding 1." },
    ]);

    // A rejected, a deferred and an open finding are counted apart, and a regression is named.
    const closes = composeBack(
      records([
        round(1, [finding(1), finding(2, { close: { verdict: "rejected", commit: null, home: null, answer: "It holds." } }), finding(3, { close: { verdict: "deferred", commit: null, home: "#141", answer: null } })]),
        round(2, [finding(1, { close: null, regression: { round: 1, finding: null } }), finding(2, { regression: { round: 1, finding: 3 } })], { target: null }),
      ]),
      [],
      0,
    );
    expect(closes.head).toEqual(["The review rounds caught 2 defects that were fixed before the seal.", "1 finding was rejected, 1 was deferred and 1 is open.", "Findings by round: 3, 2."]);
    expect(closes.rounds.map(({ title, findings }) => [title, findings.map(({ close, open, names }) => [close, open, names])])).toEqual([
      [
        "Round 1, on `3f2a9c1`",
        [
          ["Fixed in `86cb04d`", false, null],
          ["Rejected", false, null],
          ["Deferred to `#141`", false, null],
        ],
      ],
      [
        "Round 2",
        [
          ["Open", true, "It is a regression of round 1."],
          ["Fixed in `86cb04d`", false, "It is a regression of round 1's finding 3."],
        ],
      ],
    ]);
  });

  it("never adds a converted cost to a charged one: the sum gives each with its word, and each stage's line its own, its tokens summed over its models", () => {
    const two: Usage = { costUsd: 0.41, converted: false, models: [usage(0.1, false, [100, 20, 300, 40]).models[0]!, usage(0.31, false, [12_200, null, 47_700, 9_160]).models[0]!] };
    const back = composeBack(records([round(1)]), [entry({ kind: "round", round: 1 }), entry({ kind: "fix-pass", round: 1 }, { usage: two })], 0);
    expect(back.rounds[0]?.stages.map(({ name, tokens, cost }) => [name, tokens, cost, costText(cost)])).toEqual([
      ["Round 1", { input: "100", output: "20", cacheRead: "300", cacheWritten: "40" }, { amount: "$0.28", converted: true }, "$0.28 converted"],
      ["Fix pass on round 1", { input: "12,300", output: "20", cacheRead: "48,000", cacheWritten: "9,200" }, { amount: "$0.41", converted: false }, "$0.41"],
    ]);
    expect(back.sums).toEqual(["The chain's stages cost $0.28 converted and $0.41 charged."]);
    // A usage that names no model gives no tokens, and a count no model reported reads `none`.
    const counts = composeBack(records([round(1)]), [entry({ kind: "round", round: 1 }, { usage: { ...usage(0.1), models: [] } }), entry({ kind: "round", round: 1 }, { usage: usage(0.1, true, [null, 5, null, null]) })], 0);
    expect(counts.rounds[0]?.stages.map(({ tokens }) => tokens)).toEqual([null, { input: "none", output: "5", cacheRead: "none", cacheWritten: "none" }]);
    expect(composeBack(records([round(1)]), [entry({ kind: "round", round: 1 }, { usage: usage(0.2, false) })], 0)).toMatchObject({ sums: ["The chain's stages cost $0.20 charged."], converted: null });
  });

  it("says how a stage ended where it did not finish by itself and that it reported no cost, and counts the stages that reported none, the gate apart", () => {
    const entries = [
      entry({ kind: "round", round: 1 }),
      entry({ kind: "fix-pass", round: 1 }, { state: "failed", stopped: "limit", usage: null, endedAt: 72 * MINUTE }),
      entry({ kind: "fix-pass", round: 1 }, { state: "failed", usage: usage(null) }),
      entry({ kind: "gate", round: 1 }, { endedAt: 30_000 }),
    ];
    const back = composeBack(records([round(1, [finding(1, { close: null })])]), entries, 0);
    expect(back.rounds[0]?.stages.slice(1).map(({ name, ended, failed, time, tokens, cost }) => [name, ended, failed, time, tokens, cost, costText(cost)])).toEqual([
      ["Fix pass on round 1", "Stopped at its limit", true, "1 h 12 min", null, "none", "No cost reported"],
      ["Fix pass on round 1", "Failed", true, "4 min", { input: "100", output: "20", cacheRead: "300", cacheWritten: "40" }, "none", "No cost reported"],
    ]);
    expect(back.after.map(({ name, ended, time, tokens, cost }) => [name, ended, time, tokens, cost, costText(cost)])).toEqual([["Broad gate", null, "under 1 min", null, null, ""]]);
    expect(back.sums).toEqual(["The chain's stages cost $0.28 converted.", "2 stages reported no cost."]);
    const ended = (more: Partial<LedgerEntry>) => composeBack(records([]), [entry({ kind: "inspection", round: 1 }, more)], 0).after[0]?.ended;
    expect([ended({ state: "failed", stopped: "request" }), ended({ state: "failed", stopped: "daemon" }), ended({ state: "finished" })]).toEqual(["Stopped", "Stopped with the daemon", null]);
  });

  it("sets no session outside the chain in a round, whatever its pair, and counts them with their cost in one line of their own and in no sum of the chain, which then holds no stage of the ledger", () => {
    const entries = [entry(null, { usage: usage(0.05) }), entry(null, { stage: { role: "proofer", stage: "round" }, usage: usage(0.07) })];
    const back = composeBack(records([round(1)]), entries, 0);
    expect(back.rounds.map(({ stages }) => stages)).toEqual([[]]);
    expect([back.after, back.sums, back.outside]).toEqual([[], [OUTSIDE_DAEMON], "2 sessions asked outside the chain cost $0.12 converted."]);
    expect(composeBack(records([]), [entry(null, { usage: null })], 0).outside).toBe("1 session asked outside the chain reported no cost.");
  });

  it("names a ruling apart from a judgment in its round's part, and sets a ruling that follows the sealer's entry after the sealer's line", () => {
    const entries = [
      entry({ kind: "round", round: 2 }),
      entry({ kind: "judgment", round: 2 }),
      entry({ kind: "ruling", round: 2 }),
      entry({ kind: "gate", round: 2 }),
      entry({ kind: "inspection", round: 2 }),
      entry({ kind: "ruling", round: 2 }),
    ];
    const back = composeBack(records([round(1), round(2)]), entries, 0);
    expect(back.rounds.map(({ stages }) => stages.map(({ name }) => name))).toEqual([[], ["Round 2", "Judgment after round 2", "Ruling after round 2"]]);
    expect(back.after.map(({ name }) => name)).toEqual(["Broad gate", "Sealer", "Ruling after round 2"]);
  });

  it("composes the back of a work item with no seal: no record, the rounds recorded and the stages entered so far, a round entered and not recorded among them, and their sum", () => {
    const back = composeBack(records([round(1, [finding(1)])], { record: null }), [entry({ kind: "round", round: 1 }), entry({ kind: "fix-pass", round: 1 }), entry({ kind: "round", round: 2 }, { state: "failed", usage: usage(0.1) })], 0);
    expect(back.record).toEqual([]);
    expect(back.brokenBy).toBeNull();
    expect(back.head).toEqual(["The review rounds caught 1 defect that was fixed.", "Findings by round: 1."]);
    expect(back.rounds.map(({ title, says, stages }) => [title, says, stages.map(({ name }) => name)])).toEqual([
      ["Round 1, on `3f2a9c1`", null, ["Round 1", "Fix pass on round 1"]],
      ["Round 2", "No record of round 2 is committed.", ["Round 2"]],
    ]);
    expect(back.sums).toEqual(["The chain's stages cost $0.66 converted."]);
  });

  it("says where the costs are where the records hold a round or a verdict and the ledger holds no stage of the chain: the stages ran outside the daemon and Owlery read no cost of them, and says nothing of it where the ledger holds a stage of the chain or the records hold neither", () => {
    expect(composeBack(records([round(1)]), [], 0).sums).toEqual([OUTSIDE_DAEMON]);
    // A verdict with no round, and a round with no verdict.
    expect(composeBack(records([]), [], 0).sums).toEqual([OUTSIDE_DAEMON]);
    expect(composeBack(records([round(1)], { record: null }), [], 0).sums).toEqual([OUTSIDE_DAEMON]);
    // One stage of the chain in the ledger, whatever it reported, and the daemon ran the chain.
    expect(composeBack(records([round(1)]), [entry({ kind: "round", round: 1 })], 0).sums).toEqual(["The chain's stages cost $0.28 converted."]);
    expect(composeBack(records([round(1)]), [entry({ kind: "gate", round: 1 })], 0).sums).toEqual([]);
    expect(composeBack(records([], { record: null }), [], 0).sums).toEqual([]);
  });

  it("gives the seal's record as rows of a label and a value, the commit that broke a broken seal, the refused calls of each stage, and the lines not read", () => {
    const back = composeBack(
      records([round(1), round(2, [], { unread: 3 }), round(3, [], { unread: 1 })], {
        brokenBy: { commit: "e91b0d4".padEnd(40, "e"), subject: "fix: change the greeting" },
        refusals: [
          { kind: "round", round: 1, rule: "no-write" },
          { kind: "round", round: 1, rule: "no-command" },
          { kind: "round", round: 1, rule: "no-write" },
          { kind: "ruling", round: 1, rule: "no-write" },
        ],
        unreadRefusals: 1,
      }),
      [],
      2,
    );
    expect(back.record).toEqual([
      { label: "Tree", value: "`3f2a9c1` on `feat/x`" },
      { label: "Base", value: "`main`" },
      { label: "Item", value: "`1795400730-x`" },
      { label: "Gate", value: "`3f2a9c1`" },
      { label: "Rounds", value: "3" },
      { label: "Built by", value: "the session, s-1" },
      { label: "Judged by", value: "s-2" },
      { label: "Model", value: "fake" },
      { label: "Rules", value: "owlery 0.0.2" },
    ]);
    expect(back.brokenBy).toEqual({ says: "Broken by `e91b0d4`", subject: "fix: change the greeting" });
    expect(back.refused).toEqual(["Round 1 was refused 3 calls: 2 by `no-write` and 1 by `no-command`.", "Ruling after round 1 was refused 1 call: 1 by `no-write`."]);
    expect(back.rounds.map(({ unread }) => unread)).toEqual([null, "3 lines of round 2's record were not read.", "1 line of round 3's record was not read."]);
    expect(back.unread).toEqual(["1 row of the refused calls was not read.", "2 lines of the ledger were not read."]);
    // A record with no branch, no gate and none of the daemon's lines gives no row for each.
    const bare = composeBack(records([], { record: { ...RECORD, branch: null, gate: null, builtBy: [], judgedBy: null, model: null, rules: null } }), [], 1);
    expect([bare.record.map(({ label }) => label), bare.record[0]?.value, bare.unread]).toEqual([["Tree", "Base", "Item", "Rounds"], "`3f2a9c1`", ["1 line of the ledger was not read."]]);
  });

  it("words a cost in dollars with two decimals and under a cent, a count of tokens with a comma at each thousand, and a span in minutes and hours", () => {
    expect([costWords(0.28), costWords(1.1), costWords(0), costWords(0.004), costWords(12.5)]).toEqual(["$0.28", "$1.10", "$0.00", "under $0.01", "$12.50"]);
    expect([tokenWords(0), tokenWords(999), tokenWords(12_300), tokenWords(1_234_567)]).toEqual(["0", "999", "12,300", "1,234,567"]);
    expect([spanWords(59_999), spanWords(MINUTE), spanWords(4 * MINUTE + 59_000), spanWords(60 * MINUTE), spanWords(72 * MINUTE)]).toEqual(["under 1 min", "1 min", "4 min", "1 h", "1 h 12 min"]);
  });
});
