// What a work item's records say of its chain, as the daemon reads them in
// the work item's directory: whether the frame stands, how many rounds are
// recorded, the gate's last run and the inspector's last verdict.
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { NOTHING_RECORDED, lastRun, lastVerdict, readChainRecords } from "../src/daemon/chain-records";

const FENCE = "```";
const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
const run = (tree: string, base = C): string => `${FENCE}iadd\nrun: ${tree} against ${base}\n${FENCE}\n`;
const verdict = (commit: string, says: string): string => `${FENCE}iadd\ntarget: ${commit} against release/v0.0.2\nVerdict: ${says}\n${FENCE}\n`;

describe("what a work item's records say of its chain", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });
  const folder = (): string => {
    const made = realpathSync(mkdtempSync(join(tmpdir(), "owlery-chain-records-")));
    cleanups.push(() => rmSync(made, { recursive: true, force: true }));
    return made;
  };
  /** A file of the directory, the folders above it made. */
  const put = (directory: string, path: string, text: string): void => {
    mkdirSync(join(directory, path, ".."), { recursive: true });
    writeFileSync(join(directory, path), text);
  };

  it("takes the last run block of a gate record, and of an inspection the last verdict block with its word, the commit it names and its reason or question", () => {
    expect(lastRun(`# Gate\n\n${run(A)}\nThe second run.\n\n${run(B)}`)).toBe(B);
    expect(lastVerdict(`# Inspection\n\n${verdict(A, "withheld reason: The suite failed.")}\n${verdict(B, "cleared")}`)).toEqual({ is: "cleared", commit: B, says: null });
    expect(lastVerdict(verdict("abc1234", "withheld reason: The suite failed at `view.test.ts`."))).toEqual({ is: "withheld", commit: "abc1234", says: "The suite failed at `view.test.ts`." });
    expect(lastVerdict(`${verdict(A, "cleared")}\n${verdict(B, "undecided question: May the release wait?")}`)).toEqual({ is: "undecided", commit: B, says: "May the release wait?" });
  });

  it("gives no run and no verdict for a text that holds no block of its kind, and for one whose reader refuses a block, wherever the refused block stands", () => {
    expect([lastRun(""), lastRun("# Gate\n\nNo run yet.\n"), lastRun(verdict(A, "cleared"))]).toEqual([null, null, null]);
    expect([lastVerdict(""), lastVerdict(run(A))]).toEqual([null, null]);
    // A verdict the grammar does not hold, and a run whose base is no commit.
    const refusedVerdict = verdict(B, "sealed, mostly");
    const refusedRun = `${FENCE}iadd\nrun: ${B} against main\n${FENCE}\n`;
    expect([lastVerdict(refusedVerdict), lastVerdict(`${verdict(A, "cleared")}\n${refusedVerdict}`), lastVerdict(`${refusedVerdict}\n${verdict(A, "cleared")}`)]).toEqual([null, null, null]);
    expect([lastRun(refusedRun), lastRun(`${run(A)}\n${refusedRun}`), lastRun(`${refusedRun}\n${run(A)}`)]).toEqual([null, null, null]);
    // A fence named as not read decides nothing: the block after it is read.
    expect(lastRun(`${FENCE}iadd x\nrun: ${B} against ${C}\n${FENCE}\n\n${run(A)}`)).toBe(A);
  });

  it("reads a work item's directory, committed or not: the frame stands where `frame/design.md` is a plain file, each plain file of `trail/rounds` named `round-<N>.md` is a round, and the gate's and the inspection's last blocks", () => {
    const directory = folder();
    expect(readChainRecords(directory)).toEqual(NOTHING_RECORDED);
    put(directory, "frame/design.md", "# Design\n");
    for (const n of [1, 2, 10]) put(directory, `trail/rounds/round-${n}.md`, `# Round ${n}\n`);
    put(directory, "trail/gate.md", `${run(A)}\n${run(B)}`);
    put(directory, "inspection.md", `${verdict(A, "withheld reason: The suite failed.")}\n${verdict(B, "cleared")}`);
    expect(readChainRecords(directory)).toEqual({ framed: true, rounds: 3, gate: B, verdict: { is: "cleared", commit: B, says: null } });
    expect(NOTHING_RECORDED).toEqual({ framed: false, rounds: 0, gate: null, verdict: null });
    expect(readChainRecords(null)).toEqual(NOTHING_RECORDED);
  });

  it("gives nothing for a record it cannot read: a frame, a gate record or an inspection that is a link or no plain file, a `trail/rounds` that is a link or no folder, and a file of the rounds whose name has a leading zero or another ending, that is a link or that is a folder", () => {
    const outside = folder();
    put(outside, "design.md", "# Design\n");
    put(outside, "gate.md", run(A));
    put(outside, "inspection.md", verdict(A, "cleared"));
    put(outside, "rounds/round-1.md", "# Round 1\n");
    const linked = folder();
    mkdirSync(join(linked, "frame"));
    mkdirSync(join(linked, "trail"));
    symlinkSync(join(outside, "design.md"), join(linked, "frame", "design.md"));
    symlinkSync(join(outside, "gate.md"), join(linked, "trail", "gate.md"));
    symlinkSync(join(outside, "inspection.md"), join(linked, "inspection.md"));
    symlinkSync(join(outside, "rounds"), join(linked, "trail", "rounds"));
    expect(readChainRecords(linked)).toEqual(NOTHING_RECORDED);

    const odd = folder();
    mkdirSync(join(odd, "frame", "design.md"), { recursive: true });
    mkdirSync(join(odd, "inspection.md"));
    put(odd, "trail/rounds/round-01.md", "# Round 1\n");
    put(odd, "trail/rounds/round-2.txt", "# Round 2\n");
    put(odd, "trail/rounds/round-0.md", "# Round 0\n");
    put(odd, "trail/rounds/round-.md", "# Round\n");
    mkdirSync(join(odd, "trail", "rounds", "round-3.md"));
    symlinkSync(join(outside, "rounds", "round-1.md"), join(odd, "trail", "rounds", "round-4.md"));
    put(odd, "trail/gate.md", `${FENCE}iadd\nrun: ${A}\n${FENCE}\n`);
    expect(readChainRecords(odd)).toEqual(NOTHING_RECORDED);

    const file = folder();
    put(file, "trail/rounds", "not a folder\n");
    expect(readChainRecords(file).rounds).toBe(0);
  });
});
