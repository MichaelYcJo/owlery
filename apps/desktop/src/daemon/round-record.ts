// The daemon's reader of a review round's record: the file
// `trail/rounds/round-<N>.md` of a work item's directory. The pull request
// check reads the same record in Python, on GitHub, where the daemon does not
// run. This module follows `round_read` and `finding_of` of
// `pr-check/skills/code-review/scripts/chain_check.py`, with the headings of
// `pr-check/lib/lines.py`, and `test/round-record.test.ts` hands one set of
// records to both readers and compares what they return. A change to where a
// block may stand is a change to both, with a record for it in that case.
//
// A record's fields stand in `iadd` blocks, which `record-blocks.ts` reads.
// What this module holds is where a block stands: one round block outside
// every finding, one `## Findings` section, a `### <n>. <symptom>` section in
// it for each finding, with one finding block and at most one close block,
// and no two findings of one number. Each refusal's sentence is the check's
// own, word for word.
//
// It reads no file, so a test and the daemon read alike.
import { CLOSE_BLOCK, FINDING_BLOCK, ROUND_BLOCK, ROUND_RECORD, UNCLOSED, UNSURE, COMMENT_LINE, type Block, fenceCloses, fenceOpener, field, gfmLines, read, stripped } from "./record-blocks";

/** A reference to an earlier round's record, and to one of its findings where it names one, at its 1-based line. */
export interface Reference {
  round: number;
  finding: number | null;
  line: number;
}

/** A round block's target: the value as written, the reviewed commit, the base a round that read the branch names, or the range a verifying round names, and the block's `original:` where it holds one. */
export interface Target {
  said: string;
  commit: string;
  base: string | null;
  fixes: { from: string; to: string } | null;
  original: string | null;
  line: number;
}

/** A finding's close block: its verdict, the commit of a `fixed` one, the home of a `deferred` one, the value of its `answer:` line or null where it holds none, the paths its own `location:` names, and the 1-based lines of its opener and its closer. */
export interface Close {
  verdict: "fixed" | "rejected" | "deferred";
  commit: string | null;
  home: string | null;
  answer: string | null;
  located: string[];
  line: number;
  end: number;
}

/** One place a `location:` line names: a path, and the line or the span of lines written after its colon, or null where none is. */
export interface Place {
  path: string;
  lines: string | null;
}

/** One finding: its heading and the heading's number and 1-based line, the value of its `severity:` line, the paths its `location:` names and each place with its lines, its references, and its close, null where it is open. */
export interface Finding {
  number: number;
  heading: string;
  line: number;
  severity: string;
  located: string[];
  places: Place[];
  regression: Reference | null;
  reopens: Reference | null;
  close: Close | null;
}

/**
 * What a round record holds. `target` is null where the record holds no round
 * block the reader returns. `findings` leaves out each finding with a refusal.
 * `held` is the number of every `### <n>. ` heading of the findings section,
 * read or refused, in the file's order. `confirmations` are the `confirms:`
 * lines that name a finding. A refusal at line 0 is of the record whole.
 * Nothing is decided on a notice.
 */
export interface RoundRecord {
  target: Target | null;
  findings: Finding[];
  held: number[];
  confirmations: Reference[];
  refusals: { line: number; why: string }[];
  notices: { line: number; why: string }[];
}

const FINDINGS_HEADING = "## Findings";
const FINDING_LEVEL = 3;
const FINDING_HEADING = /^### (?<number>[1-9][0-9]*)\. .+$/su;
const ROUND_TEMPLATE = "templates/records/sdd-round.md";
const DASH = "—";

const NO_ROUND_BLOCK = `no round block: a round record's fields stand in \`iadd\` blocks, its \`target:\` line in the round block outside every finding, as \`${ROUND_TEMPLATE}\` shows; a record written before then is rewritten into blocks with its verdicts unchanged`;
const SECOND_ROUND = "a second round block: a round record holds one, outside every finding";
const NO_FINDINGS = `no \`${FINDINGS_HEADING}\` section: a round record holds one, with a \`### <n>. <symptom>\` section in it for each finding`;
const TWO_FINDINGS = `a second \`${FINDINGS_HEADING}\` section; a round record holds one`;
const NO_NUMBER = "no number: a finding's heading reads `### <n>. <symptom>`, and a later round names it by that `n`";
const NO_FINDING_BLOCK = `no finding block: under its heading a finding holds one \`iadd\` block opening with \`severity:\`, as \`${ROUND_TEMPLATE}\` shows`;

/** The refusals the block reader makes of a line outside every block. The first two hide every block below their line. */
const HIDING = [UNCLOSED, UNSURE];
const NOT_A_BLOCK_LINE = [COMMENT_LINE, ...HIDING];

/** The text's lines with every fenced block blanked, a fence that never closes to the end, as `pr-check/lib/lines.py#readable` gives them. Only the fence's own rule decides where one opens. */
function readable(text: string): string[] {
  const lines = gfmLines(text);
  const out = [...lines];
  let opener: ReturnType<typeof fenceOpener> = null;
  for (const [index, line] of lines.entries()) {
    if (opener === null) {
      opener = fenceOpener(line);
      if (opener !== null) out[index] = "";
    } else {
      out[index] = "";
      if (fenceCloses(line, opener)) opener = null;
    }
  }
  return out;
}

/** The level of the ATX heading a line is, 1 to 6, or null where it is none, as `pr-check/lib/lines.py#heading_level` reads it. */
function headingLevel(line: string): number | null {
  const indent = /^ */.exec(line)?.[0].length ?? 0;
  if (indent > 3) return null;
  const rest = line.slice(indent);
  const run = /^#*/.exec(rest)?.[0].length ?? 0;
  return run >= 1 && run <= 6 && (rest.length === run || " \t\r\n".includes(rest.charAt(run))) ? run : null;
}

/** The index of the line that ends the section opened at `start`: the first heading of its level or shallower, or the count of the lines. */
function sectionEnd(lines: readonly string[], start: number): number {
  const level = headingLevel(lines[start] ?? "") ?? 1;
  for (let index = start + 1; index < lines.length; index += 1) {
    const found = headingLevel(lines[index] ?? "");
    if (found !== null && found <= level) return index;
  }
  return lines.length;
}

/** The one findings section's spans, each from a finding's heading to the next, or the refusal for a record with no such section or with two. */
function findingSpans(lines: readonly string[]): { spans: [number, number][]; refusal: { line: number; why: string } | null } {
  const starts = [...lines.keys()].filter((index) => headingLevel(lines[index] ?? "") !== null && stripped(lines[index] ?? "") === FINDINGS_HEADING);
  const [start, second] = starts;
  if (start === undefined) return { spans: [], refusal: { line: 0, why: NO_FINDINGS } };
  if (second !== undefined) return { spans: [], refusal: { line: second + 1, why: TWO_FINDINGS } };
  const end = sectionEnd(lines, start);
  const heads: number[] = [];
  for (let index = start + 1; index < end; index += 1) if (headingLevel(lines[index] ?? "") === FINDING_LEVEL) heads.push(index);
  return { spans: heads.map((head, at) => [head, heads[at + 1] ?? end]), refusal: null };
}

/** The digits of the `n` of a heading that reads `### <n>. <symptom>`, or null. Two headings name one finding where the digits are the same. */
function findingNumber(heading: string): string | null {
  return FINDING_HEADING.exec(heading)?.groups?.number ?? null;
}

/** A reference from the named parts of its value's shape. */
function reference(found: NonNullable<ReturnType<typeof field>>): Reference {
  const { round, finding } = found.groups;
  return { round: Number(round), finding: finding === undefined ? null : Number(finding), line: found.line };
}

/** The places a `location:` value names, in order: each backticked item's path to its first colon, which the value's shape keeps out of a path, and what follows the colon, or null where the item holds none. */
function locationPlaces(value: string): Place[] {
  return value.split(", ").map((item) => {
    const [path = "", ...lines] = item.replace(/^`+/, "").replace(/`+$/, "").split(":");
    return { path, lines: lines.length === 0 ? null : lines.join(":") };
  });
}

/** The paths a `location:` value names, in order. */
function locationPaths(value: string): string[] {
  return locationPlaces(value).map(({ path }) => path);
}

function targetOf(block: Block): Target {
  const target = field(block, "target:");
  const said = target?.value ?? "";
  const commit = target?.groups.commit ?? "";
  // The value matched its shape whole, so what follows the commit is one of the two forms.
  const [, base] = /^[0-9a-f]+ against (.*)$/su.exec(said) ?? [];
  const [, from, to] = /^[0-9a-f]+, fixes ([0-9a-f]+)\.\.([0-9a-f]+)$/u.exec(said) ?? [];
  return { said, commit, base: base ?? null, fixes: from === undefined || to === undefined ? null : { from, to }, original: field(block, "original:")?.groups.commit ?? null, line: target?.line ?? block.line };
}

function closeOf(block: Block): Close {
  const verdict = field(block, "verdict:");
  const location = field(block, "location:");
  return {
    verdict: (verdict?.value.split(" ", 1)[0] ?? "") as Close["verdict"],
    commit: verdict?.groups.commit ?? null,
    home: verdict?.groups.home ?? null,
    answer: field(block, "answer:")?.value ?? null,
    located: location === undefined ? [] : locationPaths(location.value),
    line: block.line,
    end: block.end,
  };
}

/** What a round record's text holds. A finding with a refusal is not returned: its refusal names it at its line, and the findings around it are returned. */
export function readRoundRecord(text: string): RoundRecord {
  const lines = readable(text);
  const got = read(text, ROUND_RECORD);
  const { spans, refusal } = findingSpans(lines);
  const headings = spans.map(([first]) => stripped(lines[first] ?? ""));
  const numbers = headings.map(findingNumber);
  const held = [...new Set(numbers.filter((number) => number !== null))].map(Number);

  /** The index of the span holding a 1-based line, below the span's heading, or -1. */
  const spanOf = (line: number): number => spans.findIndex(([first, stop]) => first < line - 1 && line - 1 < stop);
  const led = (at: number, why: string): string => `${headings[at] ?? ""} ${DASH} ${why}`;

  const refusals: { line: number; why: string }[] = [];
  const spoilt = new Set<number>();
  for (const { line, why } of got.refusals) {
    const at = spanOf(line);
    if (at !== -1 && !NOT_A_BLOCK_LINE.includes(why)) {
      spoilt.add(at);
      refusals.push({ line, why: led(at, why) });
    } else refusals.push({ line, why });
  }
  // Below a fence that never closes, which a renderer runs to the end of the file, or one the walk could not place, no block is read.
  const blind = got.refusals.find(({ why }) => HIDING.includes(why))?.line ?? null;
  const inside = spans.map((): Block[] => []);
  const rounds: Block[] = [];
  const confirmations: Reference[] = [];
  for (const block of got.blocks) {
    if (blind !== null && block.line > blind) continue;
    const at = spanOf(block.line);
    const inFinding = block.kind === FINDING_BLOCK || block.kind === CLOSE_BLOCK;
    if (at === -1 && inFinding) refusals.push({ line: block.line, why: `a ${block.kind.name} block outside every finding: it stands in its finding's \`### <n>. <symptom>\` section of \`${FINDINGS_HEADING}\`` });
    else if (at !== -1 && !inFinding) {
      spoilt.add(at);
      refusals.push({ line: block.line, why: led(at, `a ${block.kind.name} block inside a finding: it stands outside every finding`) });
    } else if (at !== -1) inside[at]?.push(block);
    else if (block.kind === ROUND_BLOCK) rounds.push(block);
    else {
      const confirms = field(block, "confirms:");
      if (confirms?.groups.round !== undefined) confirmations.push(reference(confirms));
    }
  }
  const [round] = rounds;
  // A record of an older shape, or one written past the template: it is refused with this sentence alone and read no further.
  if (round === undefined && refusals.length === 0) return { target: null, findings: [], held, confirmations: [], refusals: [{ line: 0, why: NO_ROUND_BLOCK }], notices: got.notices };
  for (const extra of rounds.slice(1)) refusals.push({ line: extra.line, why: SECOND_ROUND });
  if (refusal !== null) refusals.push(refusal);

  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const [at, [first, stop]] of spans.entries()) {
    const number = numbers[at] ?? null;
    if (number === null || seen.has(number)) {
      refusals.push({ line: first + 1, why: led(at, number === null ? NO_NUMBER : `a second finding numbered ${number}: a later round's \`round-<N>#${number}\` would name both`) });
      continue;
    }
    seen.add(number);
    if (spoilt.has(at)) continue;
    const blocks = inside[at] ?? [];
    const [finding, ...moreFindings] = blocks.filter((block) => block.kind === FINDING_BLOCK);
    const [close, ...moreCloses] = blocks.filter((block) => block.kind === CLOSE_BLOCK);
    const wrong = [...moreFindings, ...moreCloses].map((block) => ({ line: block.line, why: led(at, `a second ${block.kind.name} block: a finding holds one`) }));
    if (finding === undefined) wrong.push({ line: first + 1, why: led(at, NO_FINDING_BLOCK) });
    wrong.sort((a, b) => a.line - b.line);
    // What a finding lacks below the line that hides its blocks is not refused again.
    if (blind === null || blind > stop) refusals.push(...wrong);
    if (finding === undefined || wrong.length > 0) continue;
    const regression = field(finding, "regression:");
    const reopens = field(finding, "reopens:");
    const places = locationPlaces(field(finding, "location:")?.value ?? "");
    findings.push({
      number: Number(number),
      heading: headings[at] ?? "",
      line: first + 1,
      severity: field(finding, "severity:")?.value ?? "",
      located: places.map(({ path }) => path),
      places,
      regression: regression === undefined ? null : reference(regression),
      reopens: reopens === undefined ? null : reference(reopens),
      close: close === undefined ? null : closeOf(close),
    });
  }
  refusals.sort((a, b) => a.line - b.line);
  return { target: round === undefined ? null : targetOf(round), findings, held, confirmations, refusals, notices: got.notices };
}
