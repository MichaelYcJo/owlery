// The text of the two records a chain ends with: the broad gate's runs in
// `trail/gate.md` and the inspector's verdicts in `inspection.md` of a work
// item's directory. This module gives each file's text with one run more,
// reads an inspector's answer for its run's section, and reads the blocks both
// files hold. The pull request check reads the same files in Python
// (`pr-check/skills/code-review/scripts/chain_check.py#broad_gate` and
// `#inspection`), and `record-blocks.ts` holds the grammar the two share.
//
// An inspector writes the two lines of a verdict block it can judge,
// `target:` and `Verdict:`. Owlery's code writes the six it holds exactly, in
// the daemon's chain and in the chain command a pane's session runs
// (`stage-records.ts#recordVerdict`): who built the work, who inspected it,
// the inspecting model, the version of the rules, and the workflow and the
// inspector module that produced the inspection, which this version names
// as the Owl Chain's (`OWL_CHAIN`). No
// earlier run's section is edited, so the grounds of an earlier verdict stay
// beside its block (docs/architecture.md, "Records are committed to the
// repository").
//
// It reads no file and writes none: the chain reads through
// `repository-file.ts` and writes through `record-writer.ts`. Each refusal is
// thrown as an `Error` whose message is the second half of a sentence, with
// no capital and no full stop, as a `ChainStop`'s is.
import { join } from "node:path";
import { BUILDERS_JOIN, RUN_BLOCK, VERDICT_BLOCK, assemble, builders, field, read, type Block, type Notice } from "./record-blocks";

/** The file of a work item's directory that holds the broad gate's passed runs. */
export const GATE_FILE = join("trail", "gate.md");

/** The file of a work item's directory that holds the inspector's verdicts. */
export const INSPECTION_FILE = "inspection.md";

/** The keys of a verdict block that Owlery writes, the daemon in its own chain and the chain command in a pane, in the order they are written. An inspector's block holds none. */
const DAEMONS_KEYS = ["built-by:", "inspected-by:", "model:", "rules:", "workflow:", "inspector:"] as const;

/** The name of the Owl Chain as a workflow and as an inspector module, which a verdict block's `workflow:` and `inspector:` lines name. The pull request check titles a block of this workflow by it (`pr-check/skills/code-review/scripts/chain_check.py#OWL_CHAIN`). */
export const OWL_CHAIN = "owl-chain";

/** A line the reader refuses, at its 1-based line. */
export interface RefusedLine {
  line: number;
  why: string;
}

/** One passed run of the broad gate: the commit it ran on, the base's commit, and the 1-based lines of its block's opener and closer. */
export interface Run {
  commit: string;
  base: string;
  line: number;
  end: number;
}

/** What a gate record holds: its runs in the file's order, the newest last, and each line the reader refuses. Nothing is decided on a notice. */
export interface GateRecord {
  runs: Run[];
  refusals: RefusedLine[];
  notices: Notice[];
}

/**
 * One verdict block of an inspection: the `target:` value as written, the
 * audited commit and its base, the verdict's word with the reason of a
 * `withheld` or the question of an `undecided`, each session that built the
 * work, the session that inspected it, the inspecting model, the rules, the
 * workflow and the inspector module that produced it, and the
 * 1-based lines of the block's opener and closer. A block written before the
 * daemon wrote its lines holds no builder and null for the other five.
 */
export interface Verdict {
  target: string;
  commit: string;
  base: string;
  is: "cleared" | "withheld" | "undecided";
  says: string | null;
  builtBy: string[];
  inspectedBy: string | null;
  model: string | null;
  rules: string | null;
  workflow: string | null;
  inspector: string | null;
  line: number;
  end: number;
}

/** What an inspection holds: its verdicts in the file's order, the newest last, and each line the reader refuses. Nothing is decided on a notice. */
export interface InspectionFile {
  verdicts: Verdict[];
  refusals: RefusedLine[];
  notices: Notice[];
}

/** Who built a work item and who inspected it, as the daemon holds them: each building session's name, the inspecting session's id, the model its adapter reported, and the version the daemon was given. */
export interface Parties {
  builtBy: readonly string[];
  inspectedBy: string;
  model: string;
  version: string;
}

/** Reads a gate record's text. */
export function readGate(text: string): GateRecord {
  const got = read(text, [RUN_BLOCK]);
  return {
    runs: got.blocks.map((block) => {
      const run = field(block, "run:");
      return { commit: run?.groups.commit ?? "", base: run?.groups.base ?? "", line: block.line, end: block.end };
    }),
    refusals: got.refusals.map(({ line, why }) => ({ line, why })),
    notices: got.notices,
  };
}

function verdictOf(block: Block): Verdict {
  const target = field(block, "target:");
  const said = field(block, "Verdict:")?.value ?? "";
  const reason = /^withheld reason: (.*)$/su.exec(said)?.[1];
  const question = /^undecided question: (.*)$/su.exec(said)?.[1];
  return {
    target: target?.value ?? "",
    commit: target?.groups.commit ?? "",
    base: target?.groups.base ?? "",
    is: reason !== undefined ? "withheld" : question !== undefined ? "undecided" : "cleared",
    says: reason ?? question ?? null,
    builtBy: builders(block),
    inspectedBy: field(block, "inspected-by:")?.value ?? null,
    model: field(block, "model:")?.value ?? null,
    rules: field(block, "rules:")?.value ?? null,
    workflow: field(block, "workflow:")?.value ?? null,
    inspector: field(block, "inspector:")?.value ?? null,
    line: block.line,
    end: block.end,
  };
}

/** Reads an inspection's text. */
export function readInspection(text: string): InspectionFile {
  const got = read(text, [VERDICT_BLOCK]);
  return { verdicts: got.blocks.map(verdictOf), refusals: got.refusals.map(({ line, why }) => ({ line, why })), notices: got.notices };
}

/** The first refusal as the end of a sentence that opens with `what`, or null where the reader refused nothing. */
function refusedAt(refusals: readonly RefusedLine[], what: string): string | null {
  const [first] = refusals;
  return first === undefined ? null : `${what}, line ${String(first.line)}: ${first.why}`;
}

/** The text that stands, ended with a line end where it had none, and one blank line after it. */
function above(stood: string): string {
  return `${stood}${stood.endsWith("\n") ? "" : "\n"}\n`;
}

/**
 * The text of a work item's `trail/gate.md` with one run more: the heading
 * `# Broad gate: <work item>` where no record stands, then what stands,
 * unchanged, then the sentence of an earlier run where one is given
 * (`chain.ts#earlierRunSays`), and below them one run block that names the
 * head the gate passed on against the base's commit. `before` is the file
 * as it stands, or null.
 * It throws, saying which, where the reader refuses a line of what stands,
 * where the head or the base is no commit's hash, and where the reader would
 * not read the run below what stands.
 */
export function gateText(before: string | null, workItem: string, run: { head: string; base: string }, earlier: string | null = null): string {
  const refused = refusedAt(before === null ? [] : readGate(before).refusals, `${GATE_FILE} holds a line Owlery cannot read`);
  if (refused !== null) throw new Error(refused);
  const text = `${above(before ?? `# Broad gate: ${workItem}\n`)}${earlier === null ? "" : above(earlier)}${assemble([["run:", `${run.head} against ${run.base}`]], [RUN_BLOCK])}`;
  // Below a line that leaves the reader unsure, the run's own fences are refused, and a run nobody reads is not written.
  const unread = refusedAt(readGate(text).refusals, `the run appended to ${GATE_FILE} would not be read`);
  if (unread !== null) throw new Error(unread);
  return text;
}

/** The heading a run's section of an inspection opens with. */
export function runHeading(run: number): string {
  return `## Run ${String(run)}`;
}

/** The one verdict block of a run's section, which holds none of the six lines Owlery writes: the daemon in its own chain, and the chain command in a pane. It throws, saying which, where the reader refuses a line, and where the section holds no such block, two, or one with a line Owlery writes. */
function inspectorsBlock(section: string): Block {
  const got = read(section, [VERDICT_BLOCK]);
  const refused = refusedAt(got.refusals, "its section holds a line Owlery cannot read");
  if (refused !== null) throw new Error(refused);
  const [block] = got.blocks;
  if (block === undefined || got.blocks.length > 1) throw new Error(`its section holds ${block === undefined ? "no verdict block" : `${String(got.blocks.length)} verdict blocks`}, and a run's section holds one`);
  const written = DAEMONS_KEYS.find((key) => field(block, key) !== undefined);
  if (written !== undefined) throw new Error(`its verdict block holds a \`${written}\` line, which Owlery writes and an inspector does not`);
  return block;
}

/**
 * The run's section an inspector's answer holds: the answer from its first line
 * that opens with `## Run ` to its end, unchanged. It throws, saying which,
 * where the answer holds no such line, where that heading is not this run's,
 * where the reader refuses a line of the section, where the section holds no
 * verdict block or more than one, where the block's `target:` line is not
 * the one the prompt gave, and where the block holds a line the daemon
 * writes. The first heading decides, as a round record's does
 * (`chain.ts#roundRecordOf`): a section taken from a later heading would
 * leave another run's heading out of the record it was written under.
 */
export function sectionOf(answer: string, given: { run: number; target: string }): string {
  const heading = runHeading(given.run);
  const lines = answer.split("\n");
  const at = lines.findIndex((line) => line.startsWith("## Run "));
  if (at === -1) throw new Error(`its answer holds no section of the inspection: no line of it reads \`${heading}\``);
  const headed = (lines[at] ?? "").replace(/\r$/u, "");
  if (headed !== heading) throw new Error(`its section is headed \`${headed}\`, and the run was given \`${heading}\``);
  const section = lines.slice(at).join("\n");
  const target = field(inspectorsBlock(section), "target:")?.value ?? "";
  if (target !== given.target) throw new Error(`its verdict's target line reads \`${target}\`, and the run was given \`${given.target}\``);
  return section;
}

/** Where a 1-based line of a text begins, as GFM ends a line: at LF, CR or CRLF. */
function lineStart(text: string, line: number): number {
  const ends = /\r\n|\r|\n/gu;
  let at = 0;
  for (let passed = 1; passed < line; passed += 1) {
    if (ends.exec(text) === null) return text.length;
    at = ends.lastIndex;
  }
  return at;
}

/**
 * The text of a work item's `inspection.md` with one run's section more: the
 * heading `# Inspection: <work item>` where no inspection stands, then what
 * stands, unchanged, and below it the section, changed in its verdict block
 * alone, where the daemon's six lines stand before the closing fence.
 * `before` is the file as it stands, or null, and `section` is what
 * `sectionOf` gave. It throws, saying which, where the reader refuses a line
 * of what stands; where no session is named as having built the work; where
 * the inspecting session is one of them, whatever the verdict reads; where the
 * section does not hold its one block; where the reader would not read the
 * section below what stands; and where the block it reads back does not
 * name the parties as given, as a name that holds a comma or a line end
 * does not.
 */
export function inspectionText(before: string | null, workItem: string, section: string, parties: Parties): string {
  const stood = readInspection(before ?? "");
  const refused = refusedAt(stood.refusals, `${INSPECTION_FILE} holds a line Owlery cannot read`);
  if (refused !== null) throw new Error(refused);
  if (parties.builtBy.length === 0) throw new Error("no session is named as having built the work, and a verdict names one or more");
  if (parties.builtBy.includes(parties.inspectedBy)) throw new Error(`the inspecting session, ${parties.inspectedBy}, is one of the sessions that built the work, and a session that built gives no verdict`);
  const block = inspectorsBlock(section);
  const lines = [`built-by: ${parties.builtBy.join(BUILDERS_JOIN)}`, `inspected-by: ${parties.inspectedBy}`, `model: ${parties.model}`, `rules: owlery ${parties.version}`, `workflow: ${OWL_CHAIN}`, `inspector: ${OWL_CHAIN}`];
  const closer = lineStart(section, block.end);
  const ended = `${section}${/[\r\n]$/u.test(section) ? "" : "\n"}`;
  const text = `${above(before ?? `# Inspection: ${workItem}\n`)}${ended.slice(0, closer)}${lines.map((line) => `${line}\n`).join("")}${ended.slice(closer)}`;
  const got = readInspection(text);
  const unread = refusedAt(got.refusals, `the section appended to ${INSPECTION_FILE} would not be read`);
  if (unread !== null) throw new Error(unread);
  const newest = got.verdicts.at(-1);
  if (newest === undefined || got.verdicts.length !== stood.verdicts.length + 1) throw new Error(`the section appended to ${INSPECTION_FILE} would not be read as its newest verdict`);
  if (JSON.stringify(newest.builtBy) !== JSON.stringify(parties.builtBy)) {
    throw new Error(`the building sessions do not read back as they were given: \`${parties.builtBy.join("`, `")}\``);
  }
  if (newest.inspectedBy !== parties.inspectedBy || newest.model !== parties.model || newest.rules !== `owlery ${parties.version}` || newest.workflow !== OWL_CHAIN || newest.inspector !== OWL_CHAIN) throw new Error("the inspecting session, its model, the rules, the workflow or the inspector module do not read back as they were given");
  return text;
}
