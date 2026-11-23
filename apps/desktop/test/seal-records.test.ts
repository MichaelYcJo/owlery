// The text of the two records the daemon writes at the end of a chain: the
// broad gate's runs in `trail/gate.md` and the sealer's verdicts in
// `guarantee.md`. The module reads no file, so each case hands it a text. The
// pull request check's reading of the same records is `test/pr-check.test.ts`'s
// and `test/record-blocks.test.ts`'s.
import { describe, expect, it } from "vitest";
import { GATE_FILE, GUARANTEE_FILE, gateText, guaranteeText, readGate, readGuarantee, runHeading, sectionOf, type Parties } from "../src/daemon/seal-records";

const F = "```";
const HEAD = "0123abc0123abc0123abc0123abc0123abc01234";
const BASE = "89abcde89abcde89abcde89abcde89abcde89abc";
const LATER = "fedcba9fedcba9fedcba9fedcba9fedcba9fedcb";
const TARGET = `${HEAD} against main`;

/** A run's section as a sealer answers it: the heading, a table, one verdict block of the lines given, and a line of prose below it. */
const answered = (run: number, ...lines: string[]): string => [`## Run ${String(run)}`, "", "| Claim | Source | Result |", "|---|---|---|", "| The guard stands | `src/a.ts:3` | holds |", "", `${F}seal`, ...lines, F, "", "Nothing else was read.", ""].join("\n");
const SECTION = answered(1, `target: ${TARGET}`, "Verdict: sealed");
const PARTIES: Parties = { builtBy: ["the session", "s-1"], judgedBy: "s-2", model: "owl-large", version: "0.0.2" };

describe("the files of the two records", () => {
  it("names each from the work item's directory", () => {
    expect([GATE_FILE, GUARANTEE_FILE]).toEqual(["trail/gate.md", "guarantee.md"]);
  });
});

describe("the text of a gate record", () => {
  it("opens a first run's record with the work item's heading, then one run block that names the head against the base's commit", () => {
    expect(gateText(null, "1-x", { head: HEAD, base: BASE })).toBe(`# Broad gate: 1-x\n\n${F}seal\nrun: ${HEAD} against ${BASE}\n${F}\n`);
  });

  it("appends a later run below what stands, which it leaves as it is, with one blank line between, whether the text ends with a line end or not", () => {
    const first = gateText(null, "1-x", { head: HEAD, base: BASE });
    const block = `${F}seal\nrun: ${LATER} against ${BASE}\n${F}\n`;
    expect(gateText(first, "1-x", { head: LATER, base: BASE })).toBe(`${first}\n${block}`);
    const prose = "# Broad gate: 1-x\n\nA note a person left.";
    expect(gateText(prose, "1-x", { head: LATER, base: BASE })).toBe(`${prose}\n\n${block}`);
    // The heading is written once: a record that stands keeps its own first line, whatever it is.
    expect(gateText("A record with no heading.\n", "1-x", { head: LATER, base: BASE })).toBe(`A record with no heading.\n\n${block}`);
  });

  it("writes no run whose head or base is no commit's hash", () => {
    expect(() => gateText(null, "1-x", { head: "main", base: BASE })).toThrow("does not read whole as `run: <value>`");
    expect(() => gateText(null, "1-x", { head: HEAD, base: "main" })).toThrow("does not read whole as `run: <value>`");
  });

  it("appends nothing to a record the reader refuses a line of, and names the file and the line", () => {
    const comment = `# Broad gate: 1-x\n\n<!-- a note -->\n\n${F}seal\nrun: ${HEAD} against ${BASE}\n${F}\n`;
    expect(() => gateText(comment, "1-x", { head: LATER, base: BASE })).toThrow("trail/gate.md holds a line Owlery cannot read, line 3: the line begins with `<!--`");
    const verdict = `${F}seal\ntarget: ${TARGET}\nVerdict: sealed\n${F}\n`;
    expect(() => gateText(verdict, "1-x", { head: LATER, base: BASE })).toThrow("trail/gate.md holds a line Owlery cannot read, line 2: `target: ");
    const open = `# Broad gate: 1-x\n\n${F}\nnever closed\n`;
    expect(() => gateText(open, "1-x", { head: LATER, base: BASE })).toThrow("trail/gate.md holds a line Owlery cannot read, line 3: a fence opened here never closes");
  });

  it("appends nothing to a record under whose last lines the reader would not read the run", () => {
    // An HTML block that no blank line ends: the reader places no fence below it, so a run appended there would be read by nobody.
    const html = "# Broad gate: 1-x\n\n<div>\n";
    expect(() => gateText(html, "1-x", { head: HEAD, base: BASE })).toThrow("the run appended to trail/gate.md would not be read, line 5: the walk cannot place this fence line");
  });
});

describe("the reader of a gate record", () => {
  it("gives each run in the file's order, the newest last, with its commit, its base and the lines of its block's opener and closer", () => {
    const text = gateText(gateText(null, "1-x", { head: HEAD, base: BASE }), "1-x", { head: LATER, base: BASE });
    expect(readGate(text)).toEqual({
      runs: [
        { commit: HEAD, base: BASE, line: 3, end: 5 },
        { commit: LATER, base: BASE, line: 7, end: 9 },
      ],
      refusals: [],
      notices: [],
    });
    expect(readGate("# Broad gate: 1-x\n")).toEqual({ runs: [], refusals: [], notices: [] });
  });

  it("gives each line the reader refuses, and each fence it names as not read, and no run of a refused block", () => {
    const got = readGate(`${F}seal\nrun: ${HEAD}\n${F}\n\n${F}seal run\nrun: ${HEAD} against ${BASE}\n${F}\n`);
    expect(got.runs).toEqual([]);
    expect(got.refusals.map(({ line }) => line)).toEqual([2]);
    expect(got.notices.map(({ line }) => line)).toEqual([5]);
  });
});

describe("a sealer's section of the guarantee", () => {
  it("names a run's heading", () => {
    expect(runHeading(3)).toBe("## Run 3");
  });

  it("is the answer from its first line that opens a run's section to its end, unchanged, with what the sealer said above it left out", () => {
    expect(sectionOf(`I read the branch.\n\n${SECTION}`, { run: 1, target: TARGET })).toBe(SECTION);
    expect(sectionOf(SECTION, { run: 1, target: TARGET })).toBe(SECTION);
    // A heading whose line ends with a carriage return is the same heading.
    const returned = SECTION.replaceAll("\n", "\r\n");
    expect(sectionOf(returned, { run: 1, target: TARGET })).toBe(returned);
  });

  it("refuses an answer with no heading of a run, and one whose first such heading names another run", () => {
    expect(() => sectionOf(`${F}seal\ntarget: ${TARGET}\nVerdict: sealed\n${F}\n`, { run: 1, target: TARGET })).toThrow("its answer holds no section of the guarantee: no line of it reads `## Run 1`");
    expect(() => sectionOf(SECTION, { run: 2, target: TARGET })).toThrow("its section is headed `## Run 1`, and the run was given `## Run 2`");
    expect(() => sectionOf(SECTION.replace("## Run 1", "## Run 1: the audit"), { run: 1, target: TARGET })).toThrow("its section is headed `## Run 1: the audit`, and the run was given `## Run 1`");
    // The first heading decides: a later one that names the run does not make the answer this run's.
    expect(() => sectionOf(`## Run 2\n\n${SECTION}`, { run: 1, target: TARGET })).toThrow("its section is headed `## Run 2`");
  });

  it("refuses a section with a line the reader refuses, and names the line as the section counts it", () => {
    expect(() => sectionOf(`chat\n${answered(1, `target: ${TARGET}`, "Verdict: maybe")}`, { run: 1, target: TARGET })).toThrow("its section holds a line Owlery cannot read, line 9: `Verdict: maybe` does not read whole as `Verdict: <value>`");
    expect(() => sectionOf(answered(1, `target: ${TARGET}`, "Verdict: sealed", "note: read twice"), { run: 1, target: TARGET })).toThrow("line 10: `note: read twice` is no field of a verdict block");
    expect(() => sectionOf(`## Run 1\n\n${F}seal\nasks: May it push?\ngrounds: None.\n${F}\n`, { run: 1, target: TARGET })).toThrow("line 4: `asks: May it push?` opens no `seal` block this record holds");
    expect(() => sectionOf(`${SECTION}<!-- a note -->\n`, { run: 1, target: TARGET })).toThrow("line 13: the line begins with `<!--`");
  });

  it("refuses a section with no verdict block, and one with two", () => {
    expect(() => sectionOf("## Run 1\n\nVerdict: sealed\n", { run: 1, target: TARGET })).toThrow("its section holds no verdict block, and a run's section holds one");
    const twice = `${SECTION}\n${F}seal\ntarget: ${TARGET}\nVerdict: withheld reason: on second thought\n${F}\n`;
    expect(() => sectionOf(twice, { run: 1, target: TARGET })).toThrow("its section holds 2 verdict blocks, and a run's section holds one");
  });

  it("refuses a verdict whose target line is not the one the run was given", () => {
    expect(() => sectionOf(answered(1, `target: ${LATER} against main`, "Verdict: sealed"), { run: 1, target: TARGET })).toThrow(`its verdict's target line reads \`${LATER} against main\`, and the run was given \`${TARGET}\``);
    // A shortened hash is another text.
    expect(() => sectionOf(answered(1, "target: 0123abc against main", "Verdict: sealed"), { run: 1, target: TARGET })).toThrow("its verdict's target line reads `0123abc against main`");
    expect(() => sectionOf(answered(1, `target: ${HEAD} against release`, "Verdict: sealed"), { run: 1, target: TARGET })).toThrow("its verdict's target line reads");
  });

  it.each(["built-by: the session", "judged-by: s-2", "model: owl-large", "rules: owlery 0.0.2"])("refuses a verdict block that holds a line the daemon writes: %s", (line) => {
    const key = line.slice(0, line.indexOf(":") + 1);
    expect(() => sectionOf(answered(1, `target: ${TARGET}`, "Verdict: sealed", line), { run: 1, target: TARGET })).toThrow(`its verdict block holds a \`${key}\` line, which the daemon writes and a sealer does not`);
  });

  it("takes a withheld verdict and an undecided one as it takes a seal, and a block that names an original", () => {
    for (const verdict of ["Verdict: withheld reason: round 1 says nothing of `src/a.ts`", "Verdict: undecided question: may the branch be pushed?"]) {
      const section = answered(1, `target: ${TARGET}`, verdict);
      expect(sectionOf(section, { run: 1, target: TARGET })).toBe(section);
    }
    const original = answered(1, `target: ${TARGET}`, "original: 89abcde", "Verdict: sealed");
    expect(sectionOf(original, { run: 1, target: TARGET })).toBe(original);
  });
});

describe("the text of a guarantee", () => {
  const DAEMONS = "built-by: the session, s-1\njudged-by: s-2\nmodel: owl-large\nrules: owlery 0.0.2\n";
  /** The section with the daemon's lines before its block's closing fence. */
  const written = (section: string, lines = DAEMONS): string => section.replace(`\n${F}\n\nNothing else`, `\n${lines}${F}\n\nNothing else`);

  it("opens a first run's guarantee with the work item's heading, then the section, changed in its verdict block alone: the daemon's four lines stand before the closing fence", () => {
    const text = guaranteeText(null, "1-x", SECTION, PARTIES);
    expect(text).toBe(`# Guarantee: 1-x\n\n${written(SECTION)}`);
    expect(text).toContain(`${F}seal\ntarget: ${TARGET}\nVerdict: sealed\nbuilt-by: the session, s-1\njudged-by: s-2\nmodel: owl-large\nrules: owlery 0.0.2\n${F}\n`);
  });

  it("appends a later run's section below the earlier ones, each of which it leaves as it is", () => {
    const first = guaranteeText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: withheld reason: round 1 says nothing of `src/a.ts`"), PARTIES);
    const second = answered(2, `target: ${TARGET}`, "Verdict: sealed");
    const text = guaranteeText(first, "1-x", second, { ...PARTIES, judgedBy: "s-3" });
    expect(text).toBe(`${first}\n${written(second, DAEMONS.replace("s-2", "s-3"))}`);
    const unended = first.replace(/\n$/u, "");
    expect(guaranteeText(unended, "1-x", second, PARTIES)).toBe(`${unended}\n\n${written(second)}`);
  });

  it("ends a section that ends with no line end, and keeps the line ends a section came with", () => {
    const unended = SECTION.replace(/\n$/u, "");
    expect(guaranteeText(null, "1-x", unended, PARTIES)).toBe(`# Guarantee: 1-x\n\n${written(SECTION)}`);
    const returned = `## Run 1\r\n\r\n${F}seal\r\ntarget: ${TARGET}\r\nVerdict: sealed\r\n${F}\r\n`;
    expect(guaranteeText(null, "1-x", returned, PARTIES)).toBe(`# Guarantee: 1-x\n\n## Run 1\r\n\r\n${F}seal\r\ntarget: ${TARGET}\r\nVerdict: sealed\r\n${DAEMONS}${F}\r\n`);
    // A carriage return alone ends a line too, as the reader counts lines.
    const alone = `## Run 1\r\r${F}seal\rtarget: ${TARGET}\rVerdict: sealed\r${F}\r`;
    expect(guaranteeText(null, "1-x", alone, PARTIES)).toBe(`# Guarantee: 1-x\n\n## Run 1\r\r${F}seal\rtarget: ${TARGET}\rVerdict: sealed\r${DAEMONS}${F}\r`);
  });

  it("names one builder alone, and each builder in the order given", () => {
    expect(guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["the session"] })).toContain("\nbuilt-by: the session\njudged-by: s-2\n");
    expect(guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-9", "the session", "s-1"] })).toContain("\nbuilt-by: s-9, the session, s-1\n");
  });

  it("writes no verdict where the judging session is one of the sessions that built the work, whatever the verdict reads", () => {
    for (const verdict of ["Verdict: sealed", "Verdict: withheld reason: nothing holds", "Verdict: undecided question: may it?"]) {
      expect(() => guaranteeText(null, "1-x", answered(1, `target: ${TARGET}`, verdict), { ...PARTIES, judgedBy: "s-1" })).toThrow("the judging session, s-1, is one of the sessions that built the work, and a session that built gives no verdict");
    }
  });

  it("writes no verdict where no session is named as having built the work", () => {
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: [] })).toThrow("no session is named as having built the work, and a verdict names one or more");
  });

  it("writes no verdict whose lines would not read back as the parties given: a name that holds a comma or white space, a model of no word, a version of two words", () => {
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-1, s-2"] })).toThrow("the building sessions do not read back as they were given: `s-1, s-2`");
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["a session"] })).toThrow("`built-by: a session` does not read whole as `built-by: <value>`");
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, judgedBy: "s 2" })).toThrow("`judged-by: s 2` does not read whole as `judged-by: <value>`");
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, model: "" })).toThrow("`model: ` does not read whole as `model: <value>`");
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, model: "owl\nrules: owlery 9" })).toThrow("a second `rules:` line");
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, version: "0.0.2 beta" })).toThrow("`rules: owlery 0.0.2 beta` does not read whole as `rules: <value>`");
    // A value that ends with a carriage return reads back without it, as another value, and the reader refuses no line of it.
    expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-1\r"] })).toThrow("the building sessions do not read back as they were given");
    for (const parties of [{ judgedBy: "s-2\r" }, { model: "owl-large\r" }, { version: "0.0.2\r" }]) {
      expect(() => guaranteeText(null, "1-x", SECTION, { ...PARTIES, ...parties }), JSON.stringify(parties)).toThrow("the judging session, its model or the rules do not read back as they were given");
    }
  });

  it("appends nothing to a guarantee the reader refuses a line of, and names the file and the line", () => {
    const stood = `# Guarantee: 1-x\n\n${F}seal\ntarget: ${TARGET}\nVerdict: perhaps\n${F}\n`;
    expect(() => guaranteeText(stood, "1-x", SECTION, PARTIES)).toThrow("guarantee.md holds a line Owlery cannot read, line 5: `Verdict: perhaps` does not read whole");
  });

  it("appends nothing to a guarantee under whose last lines the reader would not read the verdict", () => {
    expect(() => guaranteeText("# Guarantee: 1-x\n\n<div>\n", "1-x", SECTION, PARTIES)).toThrow("the section appended to guarantee.md would not be read, line 11: the walk cannot place this fence line");
  });

  it("holds a section to what `sectionOf` holds an answer to: one verdict block, with none of the daemon's lines", () => {
    expect(() => guaranteeText(null, "1-x", "## Run 1\n\nNo block.\n", PARTIES)).toThrow("its section holds no verdict block, and a run's section holds one");
    expect(() => guaranteeText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: sealed", "judged-by: s-2"), PARTIES)).toThrow("its verdict block holds a `judged-by:` line");
  });
});

describe("the reader of a guarantee", () => {
  it("gives every verdict block in the file's order, the newest last: the target as written, its commit and its base, the verdict's word with the reason or the question, who built and who judged, the model and the rules, and the lines of the block", () => {
    const first = guaranteeText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: withheld reason: round 1 says nothing of `src/a.ts`"), PARTIES);
    const second = guaranteeText(first, "1-x", answered(2, `target: ${TARGET}`, "Verdict: undecided question: may the branch be pushed?"), { ...PARTIES, builtBy: ["the session"], judgedBy: "s-3" });
    const third = guaranteeText(second, "1-x", answered(3, `target: ${LATER} against release/v1`, "Verdict: sealed"), { ...PARTIES, judgedBy: "s-4", model: "owl small", version: "0.0.3" });
    const got = readGuarantee(third);
    expect([got.refusals, got.notices]).toEqual([[], []]);
    expect(got.verdicts).toEqual([
      { target: TARGET, commit: HEAD, base: "main", is: "withheld", says: "round 1 says nothing of `src/a.ts`", builtBy: ["the session", "s-1"], judgedBy: "s-2", model: "owl-large", rules: "owlery 0.0.2", line: 9, end: 16 },
      { target: TARGET, commit: HEAD, base: "main", is: "undecided", says: "may the branch be pushed?", builtBy: ["the session"], judgedBy: "s-3", model: "owl-large", rules: "owlery 0.0.2", line: 26, end: 33 },
      { target: `${LATER} against release/v1`, commit: LATER, base: "release/v1", is: "sealed", says: null, builtBy: ["the session", "s-1"], judgedBy: "s-4", model: "owl small", rules: "owlery 0.0.3", line: 43, end: 50 },
    ]);
  });

  it("gives a block written before the daemon wrote its lines with no builder, no judge, no model and no rules", () => {
    expect(readGuarantee(`${F}seal\ntarget: 0123abc against main\nVerdict: sealed\n${F}\n`).verdicts).toEqual([
      { target: "0123abc against main", commit: "0123abc", base: "main", is: "sealed", says: null, builtBy: [], judgedBy: null, model: null, rules: null, line: 1, end: 4 },
    ]);
  });

  it("gives each line the reader refuses and no verdict of a refused block, and a guarantee with no block as no verdict", () => {
    const got = readGuarantee(`${F}seal\ntarget: 0123abc against main\nVerdict: sealed\n${F}\n\n${F}seal\ntarget: 0123abc against main\nVerdict: sealed\njudged-by: s-1\njudged-by: s-2\n${F}\n`);
    expect(got.verdicts.map((verdict) => verdict.line)).toEqual([1]);
    expect(got.refusals).toEqual([{ line: 10, why: "a second `judged-by:` line: a verdict block holds one" }]);
    expect(readGuarantee("# Guarantee: 1-x\n")).toEqual({ verdicts: [], refusals: [], notices: [] });
  });
});
