// layer: process
// The daemon's reader of a round record. The pull request check reads the same
// record in Python (`pr-check/skills/code-review/scripts/chain_check.py#round_read`),
// so the first case hands one set of records to both readers and compares what
// they return. The other cases say what the reader gives the daemon's chain
// of a record: its target, its findings and their closes, its references, and
// each line it refuses.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readRoundRecord, type RoundRecord } from "../src/daemon/round-record";

const TOP = join(__dirname, "..", "..", "..");
const CHAIN_CHECK = join(TOP, "pr-check", "skills", "code-review", "scripts", "chain_check.py");
const TEMPLATE = join(__dirname, "..", "role-bundle", "templates", "records", "sdd-round.md");

const F = "```";
/** An `iadd` block from its lines, as the lines of a record. */
const block = (...lines: string[]): string[] => [`${F}iadd`, ...lines, F];
const ROUND = block("target: 0123abc against main");
const FINDING = block("severity: must", "location: `src/a.ts:12`", "evidence: read `src/a.ts:12`");
const CLOSE = block("verdict: fixed 89abcde", "answer: The guard moved above the read.");
/** A record's text from its lines and its blocks. */
const record = (...parts: (string | string[])[]): string => `${parts.flat().join("\n")}\n`;

/** The record of a verifying round: two findings, the first closed with a place of its own, and two confirmations. */
const VERIFYING = record(
  "# Review round 2: 1795388700-review-rounds",
  "",
  block("target: fedcba9, fixes 0123abc..fedcba9", "original: 1234567"),
  "",
  "## Findings",
  "",
  "### 1. The reader takes a record with two round blocks",
  "",
  block("severity: must", "location: `src/a.ts:12`, `src/b.ts:3-9`", "evidence: read `src/a.ts:12`", "regression: round-1#2"),
  "",
  "Why it matters: the check refuses the record.",
  "",
  `${F}ts`,
  "### 9. A heading quoted in the fix",
  "const one = rounds.length === 1;",
  F,
  "",
  block("verdict: fixed 89abcde", "answer: The reader refuses the second block.", "location: `test/a.test.ts`"),
  "",
  "### 2. The close of round 1's first finding does not hold",
  "",
  block("severity: should", "location: `docs/c.md`", "reopens: round-1#1"),
  "",
  "#### A heading below a finding's own",
  "",
  "## Confirmations",
  "",
  block("confirms: round-1#3"),
  "What holds: the writer checks the path, read at `src/w.ts:40`.",
  "",
  block("confirms: none"),
  "",
  "## Not judged",
  "",
  "| What | Location | Who answers |",
  "|---|---|---|",
);

/** Each record both readers are handed. */
const FIXTURES: { name: string; text: string }[] = [
  { name: "a verifying round's record", text: VERIFYING },
  { name: "the same record, each line ended by a carriage return and a line feed", text: VERIFYING.replaceAll("\n", "\r\n") },
  { name: "a record with no finding", text: record("# Review round 1: 1-x", "", ROUND, "", "## Findings", "") },
  { name: "an empty text", text: "" },
  { name: "a record with no round block and nothing else refused", text: record("## Findings", "", "### 1. A symptom", "", FINDING) },
  { name: "a record with no round block and a line refused", text: record("<!-- a note -->", "## Findings", "", "### 1. A symptom", "", FINDING) },
  { name: "a second round block", text: record(ROUND, "", ROUND, "", "## Findings") },
  { name: "a round block inside a finding", text: record("## Findings", "", "### 1. A symptom", "", ROUND, "", FINDING) },
  { name: "a round block inside a finding beside one outside", text: record(ROUND, "## Findings", "", "### 1. A symptom", "", FINDING, ROUND) },
  { name: "a confirmation inside a finding", text: record(ROUND, "## Findings", "", "### 1. A symptom", "", FINDING, block("confirms: round-1#1")) },
  { name: "a finding block and a close block outside every finding", text: record(ROUND, FINDING, "## Findings", "", "## Confirmations", CLOSE) },
  { name: "a finding block above the first finding's heading", text: record(ROUND, "## Findings", FINDING, "### 1. A symptom", FINDING) },
  { name: "no findings section", text: record(ROUND, "", "## Confirmations") },
  { name: "two findings sections", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "## Findings", "### 2. Another", FINDING) },
  { name: "a findings section inside a fence", text: record(ROUND, F, "## Findings", F) },
  { name: "a findings heading with spaces before and after it", text: record(ROUND, "   ## Findings  ", "### 1. A symptom", FINDING) },
  { name: "a findings heading four spaces in", text: record(ROUND, "    ## Findings", "### 1. A symptom", FINDING) },
  { name: "a findings heading after a tab", text: record(ROUND, "\t## Findings") },
  { name: "a findings heading of another level", text: record(ROUND, "### Findings", "#### 1. A symptom", FINDING) },
  { name: "a heading with no space after its run", text: record(ROUND, "##Findings") },
  { name: "a findings section a heading of the first level ends", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "# Another title", "### 2. Below the section", "prose") },
  { name: "a finding's heading with no number", text: record(ROUND, "## Findings", "### The reader is wrong", FINDING, "### 2. Numbered", FINDING) },
  { name: "a finding's heading numbered from zero, one with no space after the dot, and one with no symptom", text: record(ROUND, "## Findings", "### 01. Zero first", FINDING, "### 2.No space", FINDING, "### 3. ", FINDING) },
  { name: "two findings of one number", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "### 1. The same number", FINDING, CLOSE) },
  { name: "a finding with no finding block", text: record(ROUND, "## Findings", "### 1. A symptom", "", "Why it matters: it does.") },
  { name: "a finding that holds a close block alone", text: record(ROUND, "## Findings", "### 1. A symptom", CLOSE) },
  { name: "a second finding block in one finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, FINDING) },
  { name: "a second close block in one finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, CLOSE, block("verdict: rejected")) },
  { name: "a second finding block and a second close block in one finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, CLOSE, CLOSE, FINDING) },
  { name: "a close block the block reader refuses, in a finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, block("verdict: open"), "### 2. Another", FINDING) },
  { name: "a finding block the block reader refuses, outside every finding", text: record(ROUND, block("severity: must"), "## Findings") },
  { name: "a comment line inside a finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "<!-- a note -->", "### 2. Another", FINDING) },
  { name: "a fence that never closes, inside a finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "~~~", "### 2. Hidden", FINDING) },
  { name: "a fence that never closes, above a finding's own block", text: record(ROUND, "## Findings", "### 1. A symptom", "~~~", FINDING) },
  { name: "a fence in a list item, inside a finding", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, `- ${F}iadd`, "  verdict: rejected", `  ${F}`, "### 2. Below it", FINDING) },
  { name: "a fence like an inspection block and not one, in a finding", text: record(ROUND, "## Findings", "### 1. A symptom", `${F}iadd finding`, "severity: must", F) },
  { name: "a finding heading inside a fence of tildes", text: record(ROUND, "## Findings", "### 1. A symptom", FINDING, "~~~", "### 2. Quoted", "~~~", CLOSE) },
  { name: "a close deferred to an issue, one rejected, and a regression that names a round alone", text: record(ROUND, "## Findings", "### 3. A symptom", FINDING, block("verdict: deferred #42"), "### 7. Another", block("severity: should", "location: `a.ts`", "regression: round-2"), block("verdict: rejected", "answer:")) },
  { name: "a confirmation above the findings section and one below it", text: record(block("confirms: round-1#1"), ROUND, "## Findings", "## Confirmations", block("confirms: round-3#12")) },
  { name: "a round block below the findings section's end", text: record("## Findings", "### 1. A symptom", FINDING, "## Probes", ROUND) },
];

/** What a reader returned of one record, in the one shape both readers are compared in. */
interface Compared {
  errors: [number, string][];
  target: string | null;
  findings: {
    number: number;
    heading: string;
    line: number;
    headingLine: number;
    verdict: [string, string | null];
    paths: string[];
    located: string[];
    regression: [number, number | null, number] | null;
    reopens: [number, number | null, number] | null;
  }[];
  held: number[];
  confirms: [number, number, number | null][];
}

/** The check's answer for each record, from `round_read`. `-B` keeps Python from writing its bytecode into `pr-check/`. */
function pythonRead(texts: string[]): Compared[] {
  const script = [
    "import importlib.util, json, sys",
    "spec = importlib.util.spec_from_file_location('chain_check', sys.argv[1])",
    "cc = importlib.util.module_from_spec(spec)",
    "sys.modules['chain_check'] = cc",
    "spec.loader.exec_module(cc)",
    "named = lambda found, line: None if found is None else [found[0], found[1], line]",
    "out = []",
    "for text in json.loads(sys.stdin.buffer.read().decode('utf-8')):",
    "    got = cc.round_read(cc.SHARED_READER, text, 'r')",
    "    out.append({",
    "        'errors': [[line, why] for _rel, line, why in got.errors],",
    "        'target': got.round.fields[cc.FIELDS.TARGET].match['commit'] if got.round else None,",
    "        'findings': [{'number': f.number, 'heading': f.heading, 'line': f.line, 'headingLine': f.heading_line, 'verdict': list(f.verdict), 'paths': f.paths, 'located': f.located,",
    "                      'regression': named(f.regression, f.regression_line), 'reopens': named(f.reopens, f.reopens_line)} for f in got.findings],",
    "        'held': sorted(got.held),",
    "        'confirms': [[line, n, m] for line, (n, m) in got.confirms],",
    "    })",
    "json.dump(out, sys.stdout)",
  ].join("\n");
  const run = spawnSync("python3", ["-B", "-c", script, CHAIN_CHECK], {
    input: JSON.stringify(texts),
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`python3 exited ${run.status}: ${run.stderr}`);
  return JSON.parse(run.stdout) as Compared[];
}

/** This module's answer in the shape the check's is compared in. The check gives a finding the line of its close's `verdict:`, which is the line below the close block's opener, or the line of its heading where it has no close. */
function compared(got: RoundRecord): Compared {
  return {
    errors: got.refusals.map(({ line, why }) => [line, why]),
    target: got.target?.commit ?? null,
    findings: got.findings.map((finding) => ({
      number: finding.number,
      heading: finding.heading,
      line: finding.close === null ? finding.line : finding.close.line + 1,
      headingLine: finding.line,
      verdict: finding.close === null ? ["open", null] : [finding.close.verdict, finding.close.commit ?? finding.close.home],
      paths: [...finding.located, ...(finding.close?.located ?? [])],
      located: finding.located,
      regression: finding.regression === null ? null : [finding.regression.round, finding.regression.finding, finding.regression.line],
      reopens: finding.reopens === null ? null : [finding.reopens.round, finding.reopens.finding, finding.reopens.line],
    })),
    held: [...got.held].sort((a, b) => a - b),
    confirms: got.confirmations.map(({ round, finding, line }) => [line, round, finding]),
  };
}

describe("the reader of a round record", () => {
  // The case starts Python, which takes seconds while the rest of the suite runs beside it.
  it("returns the refusals, the target, the findings and the references the pull request check's reader returns, for every fixture", { timeout: 30_000 }, () => {
    const python = pythonRead(FIXTURES.map((fixture) => fixture.text));
    expect(python).toHaveLength(FIXTURES.length);
    for (const [index, fixture] of FIXTURES.entries()) expect(compared(readRoundRecord(fixture.text)), fixture.name).toEqual(python[index]);
  });

  it("reads the role bundle's template of a round record, filled in, with no line refused: its target, its one finding with the regression it names and its close, and its one confirmation", () => {
    const template = readFileSync(TEMPLATE, "utf8");
    const filled = template.replace(/<[^>\n]+>/g, "filled");
    expect(filled).not.toBe(template);
    const got = readRoundRecord(filled);
    expect(got.refusals).toEqual([]);
    expect(got.notices).toEqual([]);
    expect(got.target).toEqual({ said: "1a2b3c4 against main", commit: "1a2b3c4", base: "main", fixes: null, original: null, line: 4 });
    expect(got.findings).toEqual([
      {
        number: 1,
        heading: "### 1. filled",
        line: 9,
        severity: "must",
        located: ["path"],
        places: [{ path: "path", lines: "12" }],
        regression: { round: 1, finding: 1, line: 15 },
        reopens: null,
        close: { verdict: "fixed", commit: "1a2b3c4", home: null, answer: "filled", located: [], line: 24, end: 27 },
      },
    ]);
    expect(got.held).toEqual([1]);
    expect(got.confirmations).toEqual([{ round: 1, finding: 2, line: 32 }]);
  });

  it("gives a verifying round's target its range and its original, each finding its close where it has one, and each reference the line it stands at", () => {
    const got = readRoundRecord(VERIFYING);
    expect(got.refusals).toEqual([]);
    expect(got.target).toEqual({ said: "fedcba9, fixes 0123abc..fedcba9", commit: "fedcba9", base: null, fixes: { from: "0123abc", to: "fedcba9" }, original: "1234567", line: 4 });
    expect(got.findings.map(({ number, located, regression, reopens, close }) => ({ number, located, regression, reopens, close }))).toEqual([
      { number: 1, located: ["src/a.ts", "src/b.ts"], regression: { round: 1, finding: 2, line: 16 }, reopens: null, close: { verdict: "fixed", commit: "89abcde", home: null, answer: "The reader refuses the second block.", located: ["test/a.test.ts"], line: 26, end: 30 } },
      { number: 2, located: ["docs/c.md"], regression: null, reopens: { round: 1, finding: 1, line: 37 }, close: null },
    ]);
    // A heading quoted in a fence opens no finding, and a confirmation that names none is no reference.
    expect(got.held).toEqual([1, 2]);
    expect(got.confirmations).toEqual([{ round: 1, finding: 3, line: 45 }]);
  });

  it("gives each finding its severity and each place of its location with the line or the span of lines its record writes after the colon, or null, and each close its answer, or null where it holds none", () => {
    const got = readRoundRecord(
      record(
        ROUND,
        "## Findings",
        "### 1. A symptom",
        block("severity: must", "location: `src/a.ts:12`, `src/b.ts:3-9`, `src/c.ts`"),
        block("verdict: fixed 89abcde", "answer: The guard moved above the read."),
        "### 2. Another",
        block("severity: nit, for a person", "location: `docs/d.md`"),
        block("verdict: rejected"),
        "### 3. A third",
        block("severity: should", "location: `e.ts:7`"),
      ),
    );
    expect(got.refusals).toEqual([]);
    expect(got.findings.map(({ number, severity, places, located, close }) => ({ number, severity, places, located, answer: close === null ? undefined : close.answer }))).toEqual([
      {
        number: 1,
        severity: "must",
        places: [
          { path: "src/a.ts", lines: "12" },
          { path: "src/b.ts", lines: "3-9" },
          { path: "src/c.ts", lines: null },
        ],
        located: ["src/a.ts", "src/b.ts", "src/c.ts"],
        answer: "The guard moved above the read.",
      },
      { number: 2, severity: "nit, for a person", places: [{ path: "docs/d.md", lines: null }], located: ["docs/d.md"], answer: null },
      { number: 3, severity: "should", places: [{ path: "e.ts", lines: "7" }], located: ["e.ts"], answer: undefined },
    ]);
  });

  it("gives a rejected close and a deferred one, and a regression that names a round alone", () => {
    const got = readRoundRecord(record(ROUND, "## Findings", "### 3. A symptom", FINDING, block("verdict: deferred the frame, at its next fold"), "### 7. Another", block("severity: should", "location: `a.ts`", "regression: round-2"), block("verdict: rejected", "answer:")));
    expect(got.refusals).toEqual([]);
    expect(got.findings.map(({ number, regression, close }) => [number, regression, close?.verdict, close?.commit, close?.home])).toEqual([
      [3, null, "deferred", null, "the frame, at its next fold"],
      [7, { round: 2, finding: null, line: 18 }, "rejected", null, null],
    ]);
  });

  it("names a line of a block that is no field of its kind at its line, led by its finding's heading, and returns the findings around that finding", () => {
    const got = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", FINDING, block("verdict: fixed 89abcde", "note: read twice"), "### 2. Another", FINDING));
    expect(got.refusals).toEqual([{ line: 13, why: "### 1. A symptom — `note: read twice` is no field of a close block, which takes `verdict:`, `answer:` and `location:`, each written `<key>: <value>`" }]);
    expect(got.findings.map(({ number }) => number)).toEqual([2]);
    expect(got.held).toEqual([1, 2]);
  });

  it("refuses a record with no round block at no line, a second round block at its opener, and a round block or a confirmation that stands inside a finding", () => {
    expect(readRoundRecord(record("## Findings", "### 1. A symptom", FINDING))).toMatchObject({ target: null, findings: [], refusals: [{ line: 0, why: expect.stringContaining("no round block") }] });
    expect(readRoundRecord(record(ROUND, ROUND, "## Findings")).refusals).toEqual([{ line: 4, why: "a second round block: a round record holds one, outside every finding" }]);
    const inside = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", FINDING, ROUND, block("confirms: round-1#1")));
    expect(inside.refusals).toEqual([
      { line: 11, why: "### 1. A symptom — a round block inside a finding: it stands outside every finding" },
      { line: 14, why: "### 1. A symptom — a confirmation block inside a finding: it stands outside every finding" },
    ]);
    expect([inside.findings, inside.confirmations]).toEqual([[], []]);
  });

  it("refuses a record with no `## Findings` heading and one with two, and a finding block or a close block outside every finding", () => {
    expect(readRoundRecord(record(ROUND, "## Confirmations")).refusals).toEqual([{ line: 0, why: "no `## Findings` section: a round record holds one, with a `### <n>. <symptom>` section in it for each finding" }]);
    const twice = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", FINDING, "## Findings"));
    // With two such sections the record has no finding's section, so the block of the first is outside every finding too.
    expect(twice.refusals).toEqual([
      { line: 6, why: "a finding block outside every finding: it stands in its finding's `### <n>. <symptom>` section of `## Findings`" },
      { line: 11, why: "a second `## Findings` section; a round record holds one" },
    ]);
    expect(twice.findings).toEqual([]);
    expect(readRoundRecord(record(ROUND, FINDING, "## Findings", "## Confirmations", CLOSE)).refusals.map(({ line, why }) => [line, why.slice(0, 40)])).toEqual([
      [4, "a finding block outside every finding: i"],
      [11, "a close block outside every finding: it "],
    ]);
  });

  it("refuses a finding with no finding block at its heading, and a second finding block and a second close block at their openers", () => {
    const none = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", CLOSE));
    expect(none.refusals).toEqual([{ line: 5, why: "### 1. A symptom — no finding block: under its heading a finding holds one `iadd` block opening with `severity:`, as `templates/records/sdd-round.md` shows" }]);
    expect(none.findings).toEqual([]);
    const twice = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", FINDING, CLOSE, FINDING, CLOSE));
    expect(twice.refusals).toEqual([
      { line: 15, why: "### 1. A symptom — a second finding block: a finding holds one" },
      { line: 20, why: "### 1. A symptom — a second close block: a finding holds one" },
    ]);
    expect(twice.findings).toEqual([]);
  });

  it("refuses a finding's heading that holds no number, and the second of two findings of one number, each at its heading, and reads the first", () => {
    const got = readRoundRecord(record(ROUND, "## Findings", "### The reader is wrong", FINDING, "### 4. A symptom", FINDING, "### 4. The same number", FINDING));
    expect(got.refusals).toEqual([
      { line: 5, why: "### The reader is wrong — no number: a finding's heading reads `### <n>. <symptom>`, and a later round names it by that `n`" },
      { line: 17, why: "### 4. The same number — a second finding numbered 4: a later round's `round-<N>#4` would name both" },
    ]);
    expect(got.findings.map(({ number, line }) => [number, line])).toEqual([[4, 11]]);
    expect(got.held).toEqual([4]);
  });

  it("reads no block below a fence that never closes, and refuses the fence alone", () => {
    const got = readRoundRecord(record(ROUND, "## Findings", "### 1. A symptom", FINDING, "~~~", "### 2. Hidden", FINDING));
    expect(got.refusals).toEqual([{ line: 11, why: "a fence opened here never closes, so every line after it is hidden from the reader" }]);
    expect(got.findings.map(({ number }) => number)).toEqual([1]);
    expect(got.held).toEqual([1]);
  });
});
