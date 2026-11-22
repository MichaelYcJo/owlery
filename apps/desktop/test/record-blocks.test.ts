// The daemon's reader and writer of a `seal` block. The pull request check
// reads the same blocks in Python (`pr-check/lib/fields.py`), so the first
// case hands one set of fixtures to both readers and compares what they
// return, and the second does the same for the four kinds of a round record.
// The other cases read the count this module adds and what `assemble` builds.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DECISION_BLOCK, QUESTION_BLOCK, ROUND_RECORD, RUN_BLOCK, VERDICT_BLOCK, assemble, field, read, type BlocksRead } from "../src/daemon/record-blocks";

const PR_CHECK_LIB = join(__dirname, "..", "..", "..", "pr-check", "lib");

const F = "```";
const VERDICT = [`${F}seal`, "target: 0123abc against main", "Verdict: sealed", F, ""].join("\n");
const RUN = [`${F}seal`, "run: 0123abc against 89abcde", F, ""].join("\n");

/**
 * Each fixture with what both readers return of it: how many blocks, and the
 * lines of the refusals and of the notices. The first ten are the shapes
 * scenario 18 of the design names.
 */
const FIXTURES: { name: string; text: string; blocks: number; refusals: number[]; notices: number[] }[] = [
  { name: "a block alone", text: `# Guarantee\n\n${VERDICT}\nProse below it.\n`, blocks: 1, refusals: [], notices: [] },
  { name: "a block inside another fence", text: `${F}${F}\n${VERDICT}${F}${F}\n`, blocks: 0, refusals: [], notices: [] },
  { name: "a fence that never closes", text: `${F}seal\ntarget: 0123abc against main\nVerdict: sealed\n`, blocks: 0, refusals: [1], notices: [] },
  { name: "a line that begins with an HTML comment", text: `<!-- a note -->\n\n${RUN}`, blocks: 1, refusals: [1], notices: [] },
  { name: "an indented fence", text: `    ${F}seal\n    run: 0123abc against 89abcde\n    ${F}\n`, blocks: 0, refusals: [1, 3], notices: [] },
  { name: "an opener with a word after seal", text: `${F}seal verdict\ntarget: 0123abc against main\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [], notices: [1] },
  { name: "a blank line inside a block", text: `${F}seal\ntarget: 0123abc against main\n\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "a line that is no field", text: `${F}seal\ntarget: 0123abc against main\nVerdict: sealed\nnote: read twice\n${F}\n`, blocks: 0, refusals: [4], notices: [] },
  { name: "a key twice", text: `${F}seal\ntarget: 0123abc against main\ntarget: 0123abd against main\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "a block that lacks a key", text: `prose\n\n${F}seal\ntarget: 0123abc against main\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "an empty block", text: `${F}seal\n${F}\n`, blocks: 0, refusals: [1], notices: [] },
  { name: "a first line that opens no kind given", text: `${F}seal\nseverity: P1\n${F}\n`, blocks: 0, refusals: [2], notices: [] },
  { name: "a value of another shape", text: `${F}seal\ntarget: 0123abc\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [2], notices: [] },
  { name: "a key alone where its shape takes a value", text: `${F}seal\nrun:\n${F}\n`, blocks: 0, refusals: [2], notices: [] },
  {
    name: "a run block and a verdict block with its original, each line ended by a carriage return and a line feed",
    text: [`${F}seal`, "run: 0123abc against 89abcde", F, "", `${F}seal`, "target: 0123abc against release/v1", "original: 89abcde", "Verdict: sealed", F, ""].join("\r\n"),
    blocks: 2,
    refusals: [],
    notices: [],
  },
  {
    name: "a withheld verdict and an undecided one",
    text: `${F}seal\ntarget: 0123abc against main\nVerdict: withheld reason: the gate did not run\n${F}\n\n${F}seal\ntarget: 0123abc against main\nVerdict: undecided question: may it push?\n${F}\n`,
    blocks: 2,
    refusals: [],
    notices: [],
  },
  { name: "a fence of tildes named seal", text: `~~~seal\nrun: 0123abc against 89abcde\n~~~\n`, blocks: 0, refusals: [], notices: [1] },
  { name: "the opener in capitals", text: `${F}SEAL\nrun: 0123abc against 89abcde\n${F}\n`, blocks: 0, refusals: [], notices: [1] },
  { name: "the opener with a long s", text: `${F}ſeal\nrun: 0123abc against 89abcde\n${F}\n`, blocks: 0, refusals: [], notices: [1] },
  { name: "a fence in a list item", text: `- ${F}seal\n  run: 0123abc against 89abcde\n  ${F}\n`, blocks: 0, refusals: [1, 3], notices: [] },
  { name: "a fence after a list number of another script", text: `١. ${F}seal\nrun: 0123abc against 89abcde\n${F}\n`, blocks: 0, refusals: [1, 3], notices: [] },
  { name: "a block below an HTML block", text: `<div>\n\n${RUN}`, blocks: 0, refusals: [3, 5], notices: [] },
  { name: "a comment line inside another fence", text: `${F}\n<!-- quoted -->\n${F}\n\n${RUN}`, blocks: 1, refusals: [], notices: [] },
  { name: "a block below a fence that never closes", text: `~~~\n\n${RUN}`, blocks: 1, refusals: [1], notices: [] },
  { name: "a reason that opens with a next-line character", text: `${F}seal\ntarget: 0123abc against main\nVerdict: withheld reason: \u0085late\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "a line of a unit separator alone inside a block", text: `${F}seal\ntarget: 0123abc against main\n\u001f\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "a closing fence followed by a no-break space", text: `${F}seal\nrun: 0123abc against 89abcde\n${F} \n`, blocks: 0, refusals: [1, 3], notices: [] },
  { name: "a key with no space after its colon", text: `${F}seal\ntarget: 0123abc against main\nVerdict:sealed\n${F}\n`, blocks: 0, refusals: [3], notices: [] },
  { name: "a fence of backticks whose info string holds a backtick", text: `${F}seal \`verdict\`\ntarget: 0123abc against main\nVerdict: sealed\n${F}\n`, blocks: 0, refusals: [4], notices: [] },
  { name: "a block inside an HTML comment block", text: `<!--\n${RUN}-->\n`, blocks: 0, refusals: [1], notices: [] },
  // A fence run whose info string holds a backtick opens no fence, so the walk reads the line as a paragraph's and says where it is not sure of it.
  { name: "a fence run on the line after a comment left open", text: `prose <!-- open\n${F}a\`b\n`, blocks: 0, refusals: [2], notices: [] },
  { name: "a fence run on the line after a tag left open", text: `prose <span\n${F}a\`b\n`, blocks: 0, refusals: [2], notices: [] },
  { name: "a fence run after a comment left open and a blank line", text: `prose <!-- open\n\n${F}a\`b\n`, blocks: 0, refusals: [], notices: [] },
  { name: "a fence run after a comment left open and closed on the next line", text: `prose <!-- open\nclosed --> here\n${F}a\`b\n`, blocks: 0, refusals: [], notices: [] },
  { name: "a fence run after a tag left open and a comment's closer", text: `prose <span\nmore -->\n${F}a\`b\n`, blocks: 0, refusals: [3], notices: [] },
];

/** A block of a round record's kinds, from its lines. */
const sealed = (...lines: string[]): string => [`${F}seal`, ...lines, F, ""].join("\n");

/**
 * Each fixture of a round record's four kinds with what both readers return
 * of it, as `FIXTURES` gives it for the verdict kind and the run kind.
 */
const ROUND_FIXTURES: { name: string; text: string; blocks: number; refusals: number[]; notices: number[] }[] = [
  { name: "a round block that names a base", text: sealed("target: 0123abc against release/v0.0.2"), blocks: 1, refusals: [], notices: [] },
  { name: "a round block of a verifying round, with its original", text: sealed("target: 0123abc, fixes 89abcde..0123abc", "original: 89abcde"), blocks: 1, refusals: [], notices: [] },
  { name: "a target with neither a base nor a range", text: sealed("target: 0123abc"), blocks: 0, refusals: [2], notices: [] },
  { name: "a target whose base ends with a dot", text: sealed("target: 0123abc against main."), blocks: 0, refusals: [2], notices: [] },
  { name: "a target whose base is spelt in letters of another script", text: sealed("target: 0123abc against 기준"), blocks: 1, refusals: [], notices: [] },
  { name: "a target whose base ends with a combining mark, which is no letter", text: sealed("target: 0123abc against main\u0301"), blocks: 0, refusals: [2], notices: [] },
  { name: "a target whose range names one commit", text: sealed("target: 0123abc, fixes 89abcde"), blocks: 0, refusals: [2], notices: [] },
  {
    name: "a finding block with every key but a reopening",
    text: sealed("severity: must", "location: `src/a.ts:12`, `src/b.ts:3-9`, `docs/c.md`", "evidence: read `src/a.ts:12`", "regression: round-1#2"),
    blocks: 1,
    refusals: [],
    notices: [],
  },
  { name: "a finding block whose severity and evidence hold no word, and a regression that names a round alone", text: sealed("severity:", "location: `a.ts`", "evidence:", "regression: round-2"), blocks: 1, refusals: [], notices: [] },
  { name: "a finding block that reopens a finding", text: sealed("severity: should", "location: `a.ts:1`", "reopens: round-1#1"), blocks: 1, refusals: [], notices: [] },
  { name: "a reopening that names a round alone", text: sealed("severity: should", "location: `a.ts:1`", "reopens: round-1"), blocks: 0, refusals: [4], notices: [] },
  { name: "a regression beside a reopening", text: sealed("severity: must", "location: `a.ts:1`", "regression: round-1#1", "reopens: round-1#1"), blocks: 0, refusals: [5], notices: [] },
  { name: "a reopening beside a regression, the second of another shape", text: sealed("severity: must", "location: `a.ts:1`", "reopens: round-1#1", "regression: nothing"), blocks: 0, refusals: [5], notices: [] },
  { name: "a finding block with no location", text: sealed("severity: must", "evidence: read it"), blocks: 0, refusals: [1], notices: [] },
  { name: "a location with no backticks", text: sealed("severity: must", "location: src/a.ts:12"), blocks: 0, refusals: [3], notices: [] },
  { name: "a location that opens with a slash", text: sealed("severity: must", "location: `/src/a.ts`"), blocks: 0, refusals: [3], notices: [] },
  { name: "a location that holds a no-break space", text: sealed("severity: must", "location: `src/a\u00a0b.ts`"), blocks: 0, refusals: [3], notices: [] },
  { name: "two locations joined by a comma alone", text: sealed("severity: must", "location: `a.ts`,`b.ts`"), blocks: 0, refusals: [3], notices: [] },
  { name: "a round numbered from zero", text: sealed("severity: must", "location: `a.ts`", "regression: round-0#1"), blocks: 0, refusals: [4], notices: [] },
  { name: "a close block that reads fixed, with its answer and a location", text: sealed("verdict: fixed 0123abc", "answer: The guard moved above the read.", "location: `src/c.ts`"), blocks: 1, refusals: [], notices: [] },
  { name: "a close block that reads rejected, and one deferred to an issue", text: `${sealed("verdict: rejected", "answer:")}\n${sealed("verdict: deferred #42")}`, blocks: 2, refusals: [], notices: [] },
  { name: "a deferral whose home is several words", text: sealed("verdict: deferred the frame, at its next fold"), blocks: 1, refusals: [], notices: [] },
  { name: "a deferral with no home", text: sealed("verdict: deferred"), blocks: 0, refusals: [2], notices: [] },
  { name: "a deferral whose home ends with a no-break space", text: sealed("verdict: deferred #42\u00a0"), blocks: 0, refusals: [2], notices: [] },
  { name: "a verdict that reads open", text: sealed("verdict: open"), blocks: 0, refusals: [2], notices: [] },
  { name: "a fixed verdict with no commit, and one whose commit is six digits", text: `${sealed("verdict: fixed")}\n${sealed("verdict: fixed 0123ab")}`, blocks: 0, refusals: [2, 6], notices: [] },
  { name: "a confirmation, and one of an earlier release that names none", text: `${sealed("confirms: round-1#2")}\n${sealed("confirms: none")}`, blocks: 2, refusals: [], notices: [] },
  { name: "a confirmation that names a round alone", text: sealed("confirms: round-1"), blocks: 0, refusals: [2], notices: [] },
  { name: "a verdict block of a guarantee, which a round record holds no kind for", text: VERDICT, blocks: 0, refusals: [3], notices: [] },
];

/** What a reader returned, in the one shape both readers are compared in. */
interface Compared {
  blocks: { kind: string; line: number; end: number; fields: Record<string, { value: string; line: number; groups: Record<string, string | null> }> }[];
  refusals: [number, string][];
  notices: [number, string][];
}

/** The Python reader's answer for each text, for the kinds its module holds under that name. `-B` keeps Python from writing its bytecode into `pr-check/`. */
function pythonRead(texts: string[], kinds: "GUARANTEE + fields.GATE" | "ROUND_RECORD"): Compared[] {
  const script = [
    "import json, sys",
    "sys.path.insert(0, sys.argv[1])",
    "import fields",
    "out = []",
    "for text in json.loads(sys.stdin.buffer.read().decode('utf-8')):",
    `    got = fields.read(text, fields.${kinds})`,
    "    out.append({",
    "        'blocks': [{'kind': b.kind.name, 'line': b.line, 'end': b.end, 'fields': {k: {'value': f.value, 'line': f.line, 'groups': f.match.groupdict()} for k, f in b.fields.items()}} for b in got.blocks],",
    "        'refusals': [list(r) for r in got.refusals],",
    "        'notices': [list(n) for n in got.notices],",
    "    })",
    "json.dump(out, sys.stdout)",
  ].join("\n");
  const run = spawnSync("python3", ["-B", "-c", script, PR_CHECK_LIB], {
    input: JSON.stringify(texts),
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`python3 exited ${run.status}: ${run.stderr}`);
  return JSON.parse(run.stdout) as Compared[];
}

/** This module's answer in the shape the Python reader's is compared in. Neither compared kind holds a key of any number, so each key's first field is its only one. */
function compared(got: BlocksRead): Compared {
  return {
    blocks: got.blocks.map((block) => ({
      kind: block.kind.name,
      line: block.line,
      end: block.end,
      fields: Object.fromEntries(
        [...block.fields].flatMap(([key, [first]]) =>
          first === undefined ? [] : [[key, { value: first.value, line: first.line, groups: Object.fromEntries(Object.entries(first.groups).map(([name, value]) => [name, value ?? null])) }]],
        ),
      ),
    })),
    refusals: got.refusals.map(({ line, why }) => [line, why]),
    notices: got.notices.map(({ line, why }) => [line, why]),
  };
}

describe("the reader of a seal block", () => {
  // The case starts Python, which takes seconds while the rest of the suite runs beside it.
  it("returns the blocks, the refusals and the notices the pull request check's reader returns, for every fixture", { timeout: 30_000 }, () => {
    const python = pythonRead(
      FIXTURES.map((fixture) => fixture.text),
      "GUARANTEE + fields.GATE",
    );
    for (const [index, fixture] of FIXTURES.entries()) {
      const own = compared(read(fixture.text, [VERDICT_BLOCK, RUN_BLOCK]));
      expect(own, fixture.name).toEqual(python[index]);
      expect({ blocks: own.blocks.length, refusals: own.refusals.map(([line]) => line), notices: own.notices.map(([line]) => line) }, fixture.name).toEqual({
        blocks: fixture.blocks,
        refusals: fixture.refusals,
        notices: fixture.notices,
      });
    }
  });

  it("returns, for the four kinds of a round record, the blocks, the refusals and the notices the pull request check's reader returns, for every fixture", { timeout: 30_000 }, () => {
    const python = pythonRead(
      ROUND_FIXTURES.map((fixture) => fixture.text),
      "ROUND_RECORD",
    );
    for (const [index, fixture] of ROUND_FIXTURES.entries()) {
      const own = compared(read(fixture.text, ROUND_RECORD));
      expect(own, fixture.name).toEqual(python[index]);
      expect({ blocks: own.blocks.length, refusals: own.refusals.map(([line]) => line), notices: own.notices.map(([line]) => line) }, fixture.name).toEqual({
        blocks: fixture.blocks,
        refusals: fixture.refusals,
        notices: fixture.notices,
      });
    }
  });

  it("returns a verdict's commit and base, and a run's two commits, as named parts of the value", () => {
    const got = read(`${VERDICT}\n${RUN}`, [VERDICT_BLOCK, RUN_BLOCK]);
    expect(got.blocks.map((block) => block.kind.name)).toEqual(["verdict", "run"]);
    expect(got.blocks.map((block) => field(block, block.kind.opener)?.groups)).toEqual([
      { commit: "0123abc", base: "main" },
      { commit: "0123abc", base: "89abcde" },
    ]);
  });

  it("reads a block only for the kinds it is given", () => {
    const got = read(RUN, [VERDICT_BLOCK]);
    expect(got.blocks).toEqual([]);
    expect(got.refusals.map(({ line }) => line)).toEqual([2]);
  });

  it("returns every line of a key a block may hold any number of, in the file's order, and refuses a second line of any other key", () => {
    const question = [
      `${F}seal`,
      "question: 2",
      "asks: May the run push the branch to `origin`?",
      "grounds: No document of the repository grants it.",
      "option: `yes` The branch is pushed.",
      "option: `no` The work item stays on this machine.",
      "option: `later`",
      "default: `yes`",
      "state: open",
      F,
      "",
    ];
    const got = read(question.join("\n"), [DECISION_BLOCK, QUESTION_BLOCK]);
    expect(got.refusals).toEqual([]);
    expect(got.blocks[0]?.fields.get("option:")?.map((field) => [field.line, field.groups.label, field.groups.implies])).toEqual([
      [5, "yes", "The branch is pushed."],
      [6, "no", "The work item stays on this machine."],
      [7, "later", undefined],
    ]);

    const twice = read([...question.slice(0, 8), "default: `no`", ...question.slice(8)].join("\n"), [DECISION_BLOCK, QUESTION_BLOCK]);
    expect(twice.blocks).toEqual([]);
    expect(twice.refusals).toEqual([{ line: 9, why: "a second `default:` line: a question block holds one", block: 1 }]);
  });

  it("says of a refusal which block it refused, by the line of the block's opener, and of a refusal outside every block that it refused none", () => {
    const got = read(`<!-- a note -->\n\n${F}seal\nrun: 0123abc\n${F}\n`, [RUN_BLOCK]);
    expect(got.refusals.map(({ line, block }) => [line, block])).toEqual([
      [1, null],
      [4, 3],
    ]);
  });
});

describe("the writer of a seal block", () => {
  it("builds the text the reader reads back as one block of those pairs", () => {
    const text = assemble(
      [
        ["target:", "0123abc against main"],
        ["Verdict:", "sealed"],
      ],
      [VERDICT_BLOCK],
    );
    expect(text).toBe(VERDICT);
  });

  it("throws the reader's refusal for pairs the reader would refuse", () => {
    expect(() => assemble([["target:", "0123abc against main"]], [VERDICT_BLOCK])).toThrow("the verdict block holds no `Verdict:` line, and it holds one");
    expect(() => assemble([["run:", "0123abc"]], [RUN_BLOCK])).toThrow("does not read whole as `run: <value>`");
    expect(() => assemble([], [RUN_BLOCK])).toThrow("an empty `seal` block");
  });

  it("throws for a value that holds a line break, which the reader would read as another line of the block", () => {
    expect(() =>
      assemble(
        [
          ["decision:", "1 route"],
          ["decided:", "It goes through the chain.\ngrounds: none given"],
          ["state:", "decided"],
        ],
        [DECISION_BLOCK],
      ),
    ).toThrow("a value holds a line break");
  });
});
