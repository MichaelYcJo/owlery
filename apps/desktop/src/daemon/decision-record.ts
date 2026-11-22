// A work item's record of the decisions made for it without asking the person
// and of the questions it was parked with: the file `decisions.md` of the
// work item's directory, beside `routing.md`. Each decision and each question
// is one `seal` block, read and built through `record-blocks.ts`, and a line
// outside every block is prose.
//
// This module finds the work item's directory, reads a record, and holds one
// function for each write. A write takes the file's text and returns the new
// text, changes one block, and leaves every other line as it is. It throws
// for a change the states do not allow. `writeRecord` reads the file, applies
// a write and puts the whole file back.
//
// The record holds no clock and nothing of what the person has seen: both are
// the daemon's state.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { DECISION_BLOCK, QUESTION_BLOCK, assemble, field, gfmLines, read, stripped, walk, type Block, type Kind } from "./record-blocks";
import { rootOf } from "./records-place";
import { writeWholeFile } from "./whole-file";

/** The record's file name, in the work item's directory. */
export const RECORD_FILE = "decisions.md";

const KINDS = [DECISION_BLOCK, QUESTION_BLOCK];

export type DecisionKind = "route" | "default" | "scope" | "answered";

/** Where a decision stands. Every state but `decided` holds the person's message. */
export type DecisionState =
  | { is: "decided" }
  | { is: "reversed"; message: string }
  | { is: "applied"; message: string; commit: string }
  | { is: "carried"; message: string; home: string };

/** One decision made for the work item without asking. `line` is the 1-based line of its block's opener. */
export interface DecisionBlock {
  id: number;
  kind: DecisionKind;
  decided: string;
  grounds: string;
  by: string | null;
  state: DecisionState;
  line: number;
}

/** One question the work item is or was parked with. `line` is the 1-based line of its block's opener. */
export interface QuestionBlock {
  id: number;
  asks: string;
  grounds: string;
  by: string | null;
  options: { label: string; implies: string }[];
  default: string | null;
  state: { is: "open" } | { is: "answered"; answer: string };
  line: number;
}

/** What a record holds: its decisions and its questions, each in the file's order, each refusal of the reader at its line, and each thing named as not read. */
export interface DecisionRecord {
  decisions: DecisionBlock[];
  questions: QuestionBlock[];
  refusals: { line: number; why: string }[];
  notices: { line: number; why: string }[];
}

/** What a new decision is written from. */
export interface NewDecision {
  kind: DecisionKind;
  decided: string;
  grounds: string;
  by?: string | null;
}

/** What a new question is written from. */
export interface NewQuestion {
  asks: string;
  grounds: string;
  by?: string | null;
  options?: { label: string; implies: string }[];
  default?: string | null;
}

// ---------------------------------------------------------------------------
// The work item's directory.

/** The answers that make a `routing.md` a declaration, as `pr-check/lib/routing.py` spells them. */
const REVIEW_ANSWERS = ["through the review chain", "straight to the PR"];
const DESTINATION_ANSWERS = ["open the pull request", "stop before the pull request"];

/** A file's text, or null where it cannot be read. */
function textOf(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/**
 * The branch a `routing.md` declares, or null where the text is no
 * declaration, as `pr-check/lib/routing.py#parse` reads it: the rows of two
 * cells or more that a renderer shows, a label written twice holding no value,
 * and a declaration only where `Review` and `Destination` each hold an answer
 * the check knows and `Branch` holds a name.
 */
function declaredBranch(text: string): string | null {
  const lines = gfmLines(text);
  const walked = walk(lines);
  const rows = new Map<string, string[]>();
  for (const [index, raw] of lines.entries()) {
    // A line the walk is sure a renderer hides is no row. Where it is not sure, it calls the line live, and the row is read.
    if (walked.kinds[index] !== "live") continue;
    const line = stripped(raw);
    if (!line.startsWith("|")) continue;
    const [label, value] = line
      .replace(/^\|+/, "")
      .replace(/\|+$/, "")
      .split("|")
      .map((cell) => stripped(cell));
    if (label === undefined || value === undefined || /^[:\- ]*$/.test(label)) continue;
    rows.set(label, [...(rows.get(label) ?? []), value]);
  }
  const one = (label: string): string => {
    const values = rows.get(label) ?? [];
    return values.length === 1 ? (values[0] ?? "") : "";
  };
  if (!REVIEW_ANSWERS.includes(one("Review")) || !DESTINATION_ANSWERS.includes(one("Destination"))) return null;
  return one("Branch") || null;
}

/**
 * The work item's directory in a worktree: the one under `<root>/threads/`
 * whose `routing.md` names the branch in its `Branch` row. Null where none
 * does, where more than one does, and where the worktree holds no records
 * root, which is how the pull request check reads it
 * (`pr-check/lib/routing.py#item_dir`). It reads the working tree, committed
 * or not.
 */
export function workItemDirectory(worktree: string, branch: string): string | null {
  const root = rootOf(worktree);
  if (root === null) return null;
  const threads = join(worktree, root, "threads");
  let names: string[];
  try {
    names = readdirSync(threads);
  } catch {
    return null;
  }
  const naming = names.filter((name) => {
    const text = textOf(join(threads, name, "routing.md"));
    return text !== null && declaredBranch(text) === branch;
  });
  const [only] = naming;
  return naming.length === 1 && only !== undefined ? join(threads, only) : null;
}

// ---------------------------------------------------------------------------
// The reader.

/** The id a decision block or a question block holds. */
function idOf(block: Block): number {
  return Number(field(block, block.kind.opener)?.groups.id);
}

/** The record's blocks as the block reader returns them, without each block whose id a block above it holds, which is refused at its opener. */
function blocksOf(text: string): { blocks: Block[]; refusals: { line: number; why: string; block: number | null }[]; notices: { line: number; why: string }[] } {
  const got = read(text, KINDS);
  const seen = new Set<number>();
  const blocks: Block[] = [];
  const refusals = [...got.refusals];
  for (const block of got.blocks) {
    const id = idOf(block);
    if (seen.has(id)) refusals.push({ line: block.line, why: `a block above holds the id ${id}: an id is given once over the record, so this block is not read`, block: block.line });
    else {
      seen.add(id);
      blocks.push(block);
    }
  }
  refusals.sort((a, b) => a.line - b.line);
  return { blocks, refusals, notices: got.notices };
}

function decisionOf(block: Block): DecisionBlock {
  const value = (key: string): string => field(block, key)?.value ?? "";
  const state = field(block, "state:");
  const word = /^[a-z]*/.exec(state?.value ?? "")?.[0];
  const message = value("reversal:");
  return {
    id: idOf(block),
    kind: field(block, "decision:")?.groups.kind as DecisionKind,
    decided: value("decided:"),
    grounds: value("grounds:"),
    by: field(block, "by:")?.value ?? null,
    state:
      word === "reversed"
        ? { is: "reversed", message }
        : word === "applied"
          ? { is: "applied", message, commit: state?.groups.commit ?? "" }
          : word === "carried"
            ? { is: "carried", message, home: state?.groups.home ?? "" }
            : { is: "decided" },
    line: block.line,
  };
}

function questionOf(block: Block): QuestionBlock {
  const value = (key: string): string => field(block, key)?.value ?? "";
  const answer = field(block, "answer:");
  return {
    id: idOf(block),
    asks: value("asks:"),
    grounds: value("grounds:"),
    by: field(block, "by:")?.value ?? null,
    options: (block.fields.get("option:") ?? []).map((option) => ({ label: option.groups.label ?? "", implies: option.groups.implies ?? "" })),
    default: field(block, "default:")?.groups.label ?? null,
    state: answer === undefined ? { is: "open" } : { is: "answered", answer: answer.value },
    line: block.line,
  };
}

/**
 * What the text of a `decisions.md` holds. A block the reader refuses is not
 * returned: its refusal names it at its line, and the blocks around it are
 * returned. Nothing is decided on a notice.
 */
export function readDecisionRecord(text: string): DecisionRecord {
  const got = blocksOf(text);
  return {
    decisions: got.blocks.filter((block) => block.kind === DECISION_BLOCK).map(decisionOf),
    questions: got.blocks.filter((block) => block.kind === QUESTION_BLOCK).map(questionOf),
    refusals: got.refusals.map(({ line, why }) => ({ line, why })),
    notices: got.notices,
  };
}

// ---------------------------------------------------------------------------
// The writes.

/** The text's lines, each with its own line end. */
const LINES_WITH_ENDS = /[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/g;
const LINE_END = /\r\n|\r|\n/;

/** A value as a block's line holds it: the white space at its two ends taken off, and each run of line breaks inside it written as one space. */
function oneLine(value: string): string {
  return value.trim().replace(/(?:\r\n|\r|\n)+/g, " ");
}

/** The lines `assemble` builds between the opener and the closer. */
function body(pairs: [string, string][]): string[] {
  return assemble(pairs, KINDS).split("\n").slice(1, -2);
}

/** The id a new block takes: one above the highest id any block of the text holds, a block the reader refused among them where its first line names one. */
function nextId(text: string): number {
  const got = blocksOf(text);
  const lines = gfmLines(text);
  const ids = got.blocks.map(idOf);
  for (const refusal of got.refusals) {
    if (refusal.block === null) continue;
    const named = /^(?:decision|question): ([1-9][0-9]{0,14})(?: |$)/.exec(lines[refusal.block] ?? "")?.[1];
    if (named !== undefined) ids.push(Number(named));
  }
  return Math.max(0, ...ids) + 1;
}

/** The text with a new block of those pairs at its end, after a blank line. Throws where the record would not read the block there. */
function appended(text: string, id: number, pairs: [string, string][]): string {
  const end = LINE_END.exec(text)?.[0] ?? "\n";
  let next = text;
  if (next !== "" && !/[\r\n]$/.test(next)) next += end;
  const last = gfmLines(next).at(-1);
  if (last !== undefined && stripped(last) !== "") next += end;
  next += assemble(pairs, KINDS).replaceAll("\n", end);
  const got = blocksOf(next);
  if (!got.blocks.some((block) => idOf(block) === id)) {
    const why = got.refusals.at(-1)?.why ?? "a fence above it holds it";
    throw new Error(`the record cannot take a new block: ${why}`);
  }
  return next;
}

/** The text with the lines between the block's opener and its closer replaced by those pairs. The opener, the closer and every line outside the block stay as they are. */
function rewritten(text: string, block: Block, pairs: [string, string][]): string {
  const lines = text.match(LINES_WITH_ENDS) ?? [];
  const end = LINE_END.exec(lines[block.line - 1] ?? "")?.[0] ?? "\n";
  return [...lines.slice(0, block.line), ...body(pairs).map((line) => `${line}${end}`), ...lines.slice(block.end - 1)].join("");
}

/** The block's lines as pairs, in the file's order, with the `state:` line replaced by the new state and the lines given placed directly after it. */
function moved(block: Block, state: string, after: [string, string][] = []): [string, string][] {
  const fields = [...block.fields].flatMap(([key, held]) => held.map((each) => ({ key, ...each }))).sort((a, b) => a.line - b.line);
  return fields.flatMap(({ key, value }): [string, string][] => (key === "state:" ? [[key, state], ...after] : [[key, value]]));
}

/** The block of that kind and id, or a throw where the record holds none the reader returns. */
function found(text: string, kind: Kind, id: number): Block {
  const block = blocksOf(text).blocks.find((each) => each.kind === kind && idOf(each) === id);
  if (block === undefined) throw new Error(`the record holds no ${kind.name} ${id}`);
  return block;
}

/** The text with a new decision at its end, written `decided`. */
export function withDecision(text: string, decision: NewDecision): string {
  const id = nextId(text);
  const by = decision.by ?? null;
  return appended(text, id, [
    ["decision:", `${id} ${decision.kind}`],
    ["decided:", oneLine(decision.decided)],
    ["grounds:", oneLine(decision.grounds)],
    ...(by === null ? [] : ([["by:", oneLine(by)]] as [string, string][])),
    ["state:", "decided"],
  ]);
}

/** The text with a new question at its end, written `open`. */
export function withQuestion(text: string, question: NewQuestion): string {
  const id = nextId(text);
  const by = question.by ?? null;
  const fallback = question.default ?? null;
  return appended(text, id, [
    ["question:", `${id}`],
    ["asks:", oneLine(question.asks)],
    ["grounds:", oneLine(question.grounds)],
    ...(by === null ? [] : ([["by:", oneLine(by)]] as [string, string][])),
    ...(question.options ?? []).map(({ label, implies }): [string, string] => ["option:", `\`${oneLine(label)}\`${oneLine(implies) === "" ? "" : ` ${oneLine(implies)}`}`]),
    ...(fallback === null ? [] : ([["default:", `\`${oneLine(fallback)}\``]] as [string, string][])),
    ["state:", "open"],
  ]);
}

/** The text with the person's reversal of a decision that stands `decided`: the state becomes `reversed`, and the message follows it. */
export function withReversal(text: string, id: number, message: string): string {
  const block = found(text, DECISION_BLOCK, id);
  const state = decisionOf(block).state.is;
  if (state !== "decided") throw new Error(`decision ${id} is ${state}, and only a decision that stands decided is reversed`);
  return rewritten(text, block, moved(block, "reversed", [["reversal:", oneLine(message)]]));
}

/** The text with a `reversed` decision written `applied`, naming the commit that took the reversal in. */
export function withApplied(text: string, id: number, commit: string): string {
  const block = found(text, DECISION_BLOCK, id);
  const state = decisionOf(block).state.is;
  if (state !== "reversed") throw new Error(`decision ${id} is ${state}, and only a reversed decision is written applied`);
  return rewritten(text, block, moved(block, `applied ${oneLine(commit)}`));
}

/** The text with a `reversed` decision written `carried`, naming the issue or the work item the reversal went to. */
export function withCarried(text: string, id: number, home: string): string {
  const block = found(text, DECISION_BLOCK, id);
  const state = decisionOf(block).state.is;
  if (state !== "reversed") throw new Error(`decision ${id} is ${state}, and only a reversed decision is written carried`);
  return rewritten(text, block, moved(block, `carried ${oneLine(home)}`));
}

/** The text with the person's answer to an `open` question: the state becomes `answered`, and the answer follows it. */
export function withAnswer(text: string, id: number, answer: string): string {
  const block = found(text, QUESTION_BLOCK, id);
  if (questionOf(block).state.is !== "open") throw new Error(`question ${id} is answered, and only an open question is answered`);
  return rewritten(text, block, moved(block, "answered", [["answer:", oneLine(answer)]]));
}

/** What a record the module creates opens with. */
function head(workItem: string): string {
  return [
    `# Decisions and questions: ${workItem}`,
    "",
    "Each `seal` block below is one decision made for this work item without asking the person, or one question it was parked with. A line outside a block is prose.",
    "",
  ].join("\n");
}

/**
 * Reads the record of the work item's directory, applies the change and puts
 * the whole file back, then returns the record as it now reads. Where no
 * record stands, the change is given the head of a new one. A change that
 * throws leaves the file as it is, and creates none.
 */
export function writeRecord(directory: string, change: (text: string) => string): DecisionRecord {
  const file = join(directory, RECORD_FILE);
  const before = textOf(file);
  const after = change(before ?? head(basename(directory)));
  if (after !== before) writeWholeFile(file, after);
  return readDecisionRecord(after);
}
