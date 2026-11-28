// The text of the two records the daemon writes at the end of a chain: the
// broad gate's runs in `trail/gate.md` and the inspector's verdicts in
// `inspection.md`. The module reads no file, so each case hands it a text. The
// pull request check's reading of the same records is `test/pr-check.test.ts`'s
// and `test/record-blocks.test.ts`'s.
import { describe, expect, it } from "vitest";
import { GATE_FILE, INSPECTION_FILE, gateText, inspectionText, readGate, readInspection, runHeading, sectionOf, type Parties } from "../src/daemon/inspection-records";

const F = "```";
const HEAD = "0123abc0123abc0123abc0123abc0123abc01234";
const BASE = "89abcde89abcde89abcde89abcde89abcde89abc";
const LATER = "fedcba9fedcba9fedcba9fedcba9fedcba9fedcb";
const TARGET = `${HEAD} against main`;

/** A run's section as an inspector answers it: the heading, a table, one verdict block of the lines given, and a line of prose below it. */
const answered = (run: number, ...lines: string[]): string => [`## Run ${String(run)}`, "", "| Claim | Source | Result |", "|---|---|---|", "| The guard stands | `src/a.ts:3` | holds |", "", `${F}iadd`, ...lines, F, "", "Nothing else was read.", ""].join("\n");
const SECTION = answered(1, `target: ${TARGET}`, "Verdict: cleared");
const PARTIES: Parties = { builtBy: ["the session", "s-1"], inspectedBy: "s-2", model: "owl-large", version: "0.0.2" };

describe("the files of the two records", () => {
  it("names each from the work item's directory", () => {
    expect([GATE_FILE, INSPECTION_FILE]).toEqual(["trail/gate.md", "inspection.md"]);
  });
});

describe("the text of a gate record", () => {
  it("opens a first run's record with the work item's heading, then one run block that names the head against the base's commit", () => {
    expect(gateText(null, "1-x", { head: HEAD, base: BASE })).toBe(`# Broad gate: 1-x\n\n${F}iadd\nrun: ${HEAD} against ${BASE}\n${F}\n`);
  });

  it("appends a later run below what stands, which it leaves as it is, with one blank line between, whether the text ends with a line end or not", () => {
    const first = gateText(null, "1-x", { head: HEAD, base: BASE });
    const block = `${F}iadd\nrun: ${LATER} against ${BASE}\n${F}\n`;
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
    const comment = `# Broad gate: 1-x\n\n<!-- a note -->\n\n${F}iadd\nrun: ${HEAD} against ${BASE}\n${F}\n`;
    expect(() => gateText(comment, "1-x", { head: LATER, base: BASE })).toThrow("trail/gate.md holds a line Owlery cannot read, line 3: the line begins with `<!--`");
    const verdict = `${F}iadd\ntarget: ${TARGET}\nVerdict: cleared\n${F}\n`;
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
    const got = readGate(`${F}iadd\nrun: ${HEAD}\n${F}\n\n${F}iadd run\nrun: ${HEAD} against ${BASE}\n${F}\n`);
    expect(got.runs).toEqual([]);
    expect(got.refusals.map(({ line }) => line)).toEqual([2]);
    expect(got.notices.map(({ line }) => line)).toEqual([5]);
  });
});

describe("an inspector's section of the inspection", () => {
  it("names a run's heading", () => {
    expect(runHeading(3)).toBe("## Run 3");
  });

  it("is the answer from its first line that opens a run's section to its end, unchanged, with what the inspector said above it left out", () => {
    expect(sectionOf(`I read the branch.\n\n${SECTION}`, { run: 1, target: TARGET })).toBe(SECTION);
    expect(sectionOf(SECTION, { run: 1, target: TARGET })).toBe(SECTION);
    // A heading whose line ends with a carriage return is the same heading.
    const returned = SECTION.replaceAll("\n", "\r\n");
    expect(sectionOf(returned, { run: 1, target: TARGET })).toBe(returned);
  });

  it("refuses an answer with no heading of a run, and one whose first such heading names another run", () => {
    expect(() => sectionOf(`${F}iadd\ntarget: ${TARGET}\nVerdict: cleared\n${F}\n`, { run: 1, target: TARGET })).toThrow("its answer holds no section of the inspection: no line of it reads `## Run 1`");
    expect(() => sectionOf(SECTION, { run: 2, target: TARGET })).toThrow("its section is headed `## Run 1`, and the run was given `## Run 2`");
    expect(() => sectionOf(SECTION.replace("## Run 1", "## Run 1: the audit"), { run: 1, target: TARGET })).toThrow("its section is headed `## Run 1: the audit`, and the run was given `## Run 1`");
    // The first heading decides: a later one that names the run does not make the answer this run's.
    expect(() => sectionOf(`## Run 2\n\n${SECTION}`, { run: 1, target: TARGET })).toThrow("its section is headed `## Run 2`");
  });

  it("refuses a section with a line the reader refuses, and names the line as the section counts it", () => {
    expect(() => sectionOf(`chat\n${answered(1, `target: ${TARGET}`, "Verdict: maybe")}`, { run: 1, target: TARGET })).toThrow("its section holds a line Owlery cannot read, line 9: `Verdict: maybe` does not read whole as `Verdict: <value>`");
    expect(() => sectionOf(answered(1, `target: ${TARGET}`, "Verdict: cleared", "note: read twice"), { run: 1, target: TARGET })).toThrow("line 10: `note: read twice` is no field of a verdict block");
    expect(() => sectionOf(`## Run 1\n\n${F}iadd\nasks: May it push?\ngrounds: None.\n${F}\n`, { run: 1, target: TARGET })).toThrow("line 4: `asks: May it push?` opens no `iadd` block this record holds");
    expect(() => sectionOf(`${SECTION}<!-- a note -->\n`, { run: 1, target: TARGET })).toThrow("line 13: the line begins with `<!--`");
  });

  it("refuses a section with no verdict block, and one with two", () => {
    expect(() => sectionOf("## Run 1\n\nVerdict: cleared\n", { run: 1, target: TARGET })).toThrow("its section holds no verdict block, and a run's section holds one");
    const twice = `${SECTION}\n${F}iadd\ntarget: ${TARGET}\nVerdict: withheld reason: on second thought\n${F}\n`;
    expect(() => sectionOf(twice, { run: 1, target: TARGET })).toThrow("its section holds 2 verdict blocks, and a run's section holds one");
  });

  it("refuses a verdict whose target line is not the one the run was given", () => {
    expect(() => sectionOf(answered(1, `target: ${LATER} against main`, "Verdict: cleared"), { run: 1, target: TARGET })).toThrow(`its verdict's target line reads \`${LATER} against main\`, and the run was given \`${TARGET}\``);
    // A shortened hash is another text.
    expect(() => sectionOf(answered(1, "target: 0123abc against main", "Verdict: cleared"), { run: 1, target: TARGET })).toThrow("its verdict's target line reads `0123abc against main`");
    expect(() => sectionOf(answered(1, `target: ${HEAD} against release`, "Verdict: cleared"), { run: 1, target: TARGET })).toThrow("its verdict's target line reads");
  });

  it.each(["built-by: the session", "inspected-by: s-2", "model: owl-large", "rules: owlery 0.0.2", "workflow: owl-chain", "inspector: owl-chain"])("refuses a verdict block that holds a line Owlery writes: %s", (line) => {
    const key = line.slice(0, line.indexOf(":") + 1);
    expect(() => sectionOf(answered(1, `target: ${TARGET}`, "Verdict: cleared", line), { run: 1, target: TARGET })).toThrow(`its verdict block holds a \`${key}\` line, which Owlery writes and an inspector does not`);
  });

  it("takes a withheld verdict and an undecided one as it takes a cleared one, and a block that names an original", () => {
    for (const verdict of ["Verdict: withheld reason: round 1 says nothing of `src/a.ts`", "Verdict: undecided question: may the branch be pushed?"]) {
      const section = answered(1, `target: ${TARGET}`, verdict);
      expect(sectionOf(section, { run: 1, target: TARGET })).toBe(section);
    }
    const original = answered(1, `target: ${TARGET}`, "original: 89abcde", "Verdict: cleared");
    expect(sectionOf(original, { run: 1, target: TARGET })).toBe(original);
  });
});

describe("the text of an inspection", () => {
  const DAEMONS = "built-by: the session, s-1\ninspected-by: s-2\nmodel: owl-large\nrules: owlery 0.0.2\nworkflow: owl-chain\ninspector: owl-chain\n";
  /** The section with the daemon's lines before its block's closing fence. */
  const written = (section: string, lines = DAEMONS): string => section.replace(`\n${F}\n\nNothing else`, `\n${lines}${F}\n\nNothing else`);

  it("opens a first run's inspection with the work item's heading, then the section, changed in its verdict block alone: the daemon's six lines stand before the closing fence, the last two naming the Owl Chain as the workflow and the inspector module that produced the inspection", () => {
    const text = inspectionText(null, "1-x", SECTION, PARTIES);
    expect(text).toBe(`# Inspection: 1-x\n\n${written(SECTION)}`);
    expect(text).toContain(`${F}iadd\ntarget: ${TARGET}\nVerdict: cleared\nbuilt-by: the session, s-1\ninspected-by: s-2\nmodel: owl-large\nrules: owlery 0.0.2\nworkflow: owl-chain\ninspector: owl-chain\n${F}\n`);
  });

  it("appends a later run's section below the earlier ones, each of which it leaves as it is", () => {
    const first = inspectionText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: withheld reason: round 1 says nothing of `src/a.ts`"), PARTIES);
    const second = answered(2, `target: ${TARGET}`, "Verdict: cleared");
    const text = inspectionText(first, "1-x", second, { ...PARTIES, inspectedBy: "s-3" });
    expect(text).toBe(`${first}\n${written(second, DAEMONS.replace("s-2", "s-3"))}`);
    const unended = first.replace(/\n$/u, "");
    expect(inspectionText(unended, "1-x", second, PARTIES)).toBe(`${unended}\n\n${written(second)}`);
  });

  it("ends a section that ends with no line end, and keeps the line ends a section came with", () => {
    const unended = SECTION.replace(/\n$/u, "");
    expect(inspectionText(null, "1-x", unended, PARTIES)).toBe(`# Inspection: 1-x\n\n${written(SECTION)}`);
    const returned = `## Run 1\r\n\r\n${F}iadd\r\ntarget: ${TARGET}\r\nVerdict: cleared\r\n${F}\r\n`;
    expect(inspectionText(null, "1-x", returned, PARTIES)).toBe(`# Inspection: 1-x\n\n## Run 1\r\n\r\n${F}iadd\r\ntarget: ${TARGET}\r\nVerdict: cleared\r\n${DAEMONS}${F}\r\n`);
    // A carriage return alone ends a line too, as the reader counts lines.
    const alone = `## Run 1\r\r${F}iadd\rtarget: ${TARGET}\rVerdict: cleared\r${F}\r`;
    expect(inspectionText(null, "1-x", alone, PARTIES)).toBe(`# Inspection: 1-x\n\n## Run 1\r\r${F}iadd\rtarget: ${TARGET}\rVerdict: cleared\r${DAEMONS}${F}\r`);
  });

  it("names one builder alone, and each builder in the order given", () => {
    expect(inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["the session"] })).toContain("\nbuilt-by: the session\ninspected-by: s-2\n");
    expect(inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-9", "the session", "s-1"] })).toContain("\nbuilt-by: s-9, the session, s-1\n");
  });

  it("writes no verdict where the inspecting session is one of the sessions that built the work, whatever the verdict reads", () => {
    for (const verdict of ["Verdict: cleared", "Verdict: withheld reason: nothing holds", "Verdict: undecided question: may it?"]) {
      expect(() => inspectionText(null, "1-x", answered(1, `target: ${TARGET}`, verdict), { ...PARTIES, inspectedBy: "s-1" })).toThrow("the inspecting session, s-1, is one of the sessions that built the work, and a session that built gives no verdict");
    }
  });

  it("writes no verdict where no session is named as having built the work", () => {
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: [] })).toThrow("no session is named as having built the work, and a verdict names one or more");
  });

  it("writes no verdict whose lines would not read back as the parties given: a name that holds a comma or white space, a model of no word, a version of two words", () => {
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-1, s-2"] })).toThrow("the building sessions do not read back as they were given: `s-1, s-2`");
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["a session"] })).toThrow("`built-by: a session` does not read whole as `built-by: <value>`");
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, inspectedBy: "s 2" })).toThrow("`inspected-by: s 2` does not read whole as `inspected-by: <value>`");
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, model: "" })).toThrow("`model: ` does not read whole as `model: <value>`");
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, model: "owl\nrules: owlery 9" })).toThrow("a second `rules:` line");
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, version: "0.0.2 beta" })).toThrow("`rules: owlery 0.0.2 beta` does not read whole as `rules: <value>`");
    // A value that ends with a carriage return reads back without it, as another value, and the reader refuses no line of it.
    expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, builtBy: ["s-1\r"] })).toThrow("the building sessions do not read back as they were given");
    for (const parties of [{ inspectedBy: "s-2\r" }, { model: "owl-large\r" }, { version: "0.0.2\r" }]) {
      expect(() => inspectionText(null, "1-x", SECTION, { ...PARTIES, ...parties }), JSON.stringify(parties)).toThrow("the inspecting session, its model, the rules, the workflow or the inspector module do not read back as they were given");
    }
  });

  it("appends nothing to an inspection the reader refuses a line of, and names the file and the line", () => {
    const stood = `# Inspection: 1-x\n\n${F}iadd\ntarget: ${TARGET}\nVerdict: perhaps\n${F}\n`;
    expect(() => inspectionText(stood, "1-x", SECTION, PARTIES)).toThrow("inspection.md holds a line Owlery cannot read, line 5: `Verdict: perhaps` does not read whole");
  });

  it("appends nothing to an inspection under whose last lines the reader would not read the verdict", () => {
    expect(() => inspectionText("# Inspection: 1-x\n\n<div>\n", "1-x", SECTION, PARTIES)).toThrow("the section appended to inspection.md would not be read, line 11: the walk cannot place this fence line");
  });

  it("holds a section to what `sectionOf` holds an answer to: one verdict block, with none of the daemon's lines", () => {
    expect(() => inspectionText(null, "1-x", "## Run 1\n\nNo block.\n", PARTIES)).toThrow("its section holds no verdict block, and a run's section holds one");
    expect(() => inspectionText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: cleared", "inspected-by: s-2"), PARTIES)).toThrow("its verdict block holds a `inspected-by:` line");
  });
});

describe("the reader of an inspection", () => {
  it("gives every verdict block in the file's order, the newest last: the target as written, its commit and its base, the verdict's word with the reason or the question, who built and who inspected, the model, the rules, the workflow and the inspector module, and the lines of the block", () => {
    const first = inspectionText(null, "1-x", answered(1, `target: ${TARGET}`, "Verdict: withheld reason: round 1 says nothing of `src/a.ts`"), PARTIES);
    const second = inspectionText(first, "1-x", answered(2, `target: ${TARGET}`, "Verdict: undecided question: may the branch be pushed?"), { ...PARTIES, builtBy: ["the session"], inspectedBy: "s-3" });
    const third = inspectionText(second, "1-x", answered(3, `target: ${LATER} against release/v1`, "Verdict: cleared"), { ...PARTIES, inspectedBy: "s-4", model: "owl small", version: "0.0.3" });
    const got = readInspection(third);
    expect([got.refusals, got.notices]).toEqual([[], []]);
    expect(got.verdicts).toEqual([
      { target: TARGET, commit: HEAD, base: "main", is: "withheld", says: "round 1 says nothing of `src/a.ts`", builtBy: ["the session", "s-1"], inspectedBy: "s-2", model: "owl-large", rules: "owlery 0.0.2", workflow: "owl-chain", inspector: "owl-chain", line: 9, end: 18 },
      { target: TARGET, commit: HEAD, base: "main", is: "undecided", says: "may the branch be pushed?", builtBy: ["the session"], inspectedBy: "s-3", model: "owl-large", rules: "owlery 0.0.2", workflow: "owl-chain", inspector: "owl-chain", line: 28, end: 37 },
      { target: `${LATER} against release/v1`, commit: LATER, base: "release/v1", is: "cleared", says: null, builtBy: ["the session", "s-1"], inspectedBy: "s-4", model: "owl small", rules: "owlery 0.0.3", workflow: "owl-chain", inspector: "owl-chain", line: 47, end: 56 },
    ]);
  });

  it("gives a block written before the daemon wrote its lines with no builder, no inspector, no model, no rules, no workflow and no inspector module", () => {
    expect(readInspection(`${F}iadd\ntarget: 0123abc against main\nVerdict: cleared\n${F}\n`).verdicts).toEqual([
      { target: "0123abc against main", commit: "0123abc", base: "main", is: "cleared", says: null, builtBy: [], inspectedBy: null, model: null, rules: null, workflow: null, inspector: null, line: 1, end: 4 },
    ]);
  });

  it("gives each line the reader refuses and no verdict of a refused block, and an inspection with no block as no verdict", () => {
    const got = readInspection(`${F}iadd\ntarget: 0123abc against main\nVerdict: cleared\n${F}\n\n${F}iadd\ntarget: 0123abc against main\nVerdict: cleared\ninspected-by: s-1\ninspected-by: s-2\n${F}\n`);
    expect(got.verdicts.map((verdict) => verdict.line)).toEqual([1]);
    expect(got.refusals).toEqual([{ line: 10, why: "a second `inspected-by:` line: a verdict block holds one" }]);
    expect(readInspection("# Inspection: 1-x\n")).toEqual({ verdicts: [], refusals: [], notices: [] });
  });
});
