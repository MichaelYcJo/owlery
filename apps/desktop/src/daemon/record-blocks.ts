// The daemon's reader and writer of the `seal` blocks a work item's records
// hold their fields in. The pull request check reads the same blocks in
// Python, on GitHub, where the daemon does not run: this module follows the
// grammar of `pr-check/lib/fields.py` and the walk of `pr-check/lib/blocks.py`,
// and `test/record-blocks.test.ts` hands one set of fixtures to both readers
// and compares what they return. A change to the grammar is a change to both,
// with a fixture for it in that case.
//
// A block is a fenced code block outside every other fence, whose opener is
// the line of three backticks and `seal` and nothing else. Each line inside it
// is `<key> <value>`, the key spelt with its colon, or the key alone where its
// shape takes nothing. The first line's key names the block's kind among the
// kinds the caller gives.
//
// This module adds two things to the Python grammar: a key a block may hold
// any number of, and a kind's own check, a rule that spans two keys of the
// kind, run after the block's lines parse. The Python reader has neither, and
// the six kinds it shares with this module use neither: the sealer's verdict,
// the broad gate's run, and the four kinds of a round record.
//
// It reads no file and imports nothing, so a test and the daemon read alike.

/** The one line that opens a block. */
export const OPENER = "```seal";
const FENCE = "```";
const INFO = "seal";
const COMMENT_OPENER = "<!--";
const COMMENT_CLOSER = "-->";

/**
 * The characters Python's `str.strip`, `str.split` and `\s` take as white
 * space. JavaScript's own list differs: it holds U+FEFF, and lacks U+001C to
 * U+001F and U+0085. The Python reader decides a blank line, the first word
 * of a fence's info string and the shape of a value by this list, so this
 * module spells it out and uses neither `trim` nor `\s`.
 */
const SPACE = "\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
/** One character that is no white space, for a value's shape. */
export const NOT_SPACE = `[^${SPACE}]`;
const LEADING_SPACE = new RegExp(`^[${SPACE}]+`, "u");
const TRAILING_SPACE = new RegExp(`[${SPACE}]+$`, "u");
const SPACES = new RegExp(`[${SPACE}]+`, "u");

const leftStripped = (text: string): string => text.replace(LEADING_SPACE, "");
/** The text without the white space at its two ends, as Python's `str.strip` gives it. */
export const stripped = (text: string): string => leftStripped(text).replace(TRAILING_SPACE, "");
/** The text without the spaces and tabs at its two ends, which is all CommonMark counts as blank. */
const withoutBlanks = (text: string): string => text.replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");

// ---------------------------------------------------------------------------
// The walk: which lines stand inside a fenced code block or an HTML comment
// block, and where the walk cannot say. A port of `pr-check/lib/blocks.py#walk`,
// whose docstring holds the reasons for each rule.

/** A fence's delimiter line: up to three spaces, a run of three or more backticks or tildes, then the info string. */
const FENCE_LINE = /^ {0,3}(?<run>`{3,}|~{3,})(?<info>.*)$/su;
/** A container's marker run in front of a line: indentation, a block quote's `>`, a list item's bullet or number. */
const CONTAINER = /^(?:[ \t]*(?:>|(?:[-+*]|\p{Nd}{1,9}[.)])(?=[ \t]|$)))*[ \t]*/u;
/** What a line that starts a block the walk does not follow looks like, once the container run is taken off. */
const BLOCK_LOOKING = /^(?:`{3,}|~{3,}|<)/u;
/** Another kind of HTML block, at the top level. */
const OTHER_HTML = /^<[A-Za-z/?!]/u;
/** A fence run at the start of what follows a line's container run. */
const FENCE_RUN = /^(?:`{3,}|~{3,})/u;
/** Inline raw HTML other than a comment, by its opener: CDATA, a processing instruction, a declaration, or a tag. */
const INLINE_HTML = /<(?:(!\[CDATA\[)|(\?)|(![A-Za-z])|\/?[A-Za-z])/gu;
/** A tag's end: the first `>` outside a quoted attribute value. */
const TAG_END = /(?:[^>"']|"[^"]*"|'[^']*')*>/suy;

export type Fence = { character: string; length: number };

/** The text's lines as GFM ends them, at LF, CR or CRLF and nowhere else, with no empty line after the last line end. */
export function gfmLines(text: string): string[] {
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** The run and the info string of a fence's delimiter line, or null for any other line. */
function fenceLine(line: string): { run: string; info: string } | null {
  const [, run, info] = FENCE_LINE.exec(line) ?? [];
  return run === undefined || info === undefined ? null : { run, info };
}

/** The fence a line opens, or null. A run of backticks whose info string holds a backtick opens none. */
export function fenceOpener(line: string): Fence | null {
  const found = fenceLine(line);
  if (found === null) return null;
  if (found.run.startsWith("`") && found.info.includes("`")) return null;
  return { character: found.run.charAt(0), length: found.run.length };
}

/** Whether a line closes the fence that opener opened. */
export function fenceCloses(line: string, opener: Fence): boolean {
  const found = fenceLine(line);
  return found !== null && found.run.charAt(0) === opener.character && found.run.length >= opener.length && stripped(found.info) === "";
}

/** Whether the text after the line's fence run is white space CommonMark does not count: anything but spaces and tabs. */
function notSpacesAfterTheRun(line: string): boolean {
  const info = fenceLine(line)?.info ?? "";
  return stripped(info) === "" && withoutBlanks(info) !== "";
}

/** The container run in front of a line, which may be empty. */
function containerOf(line: string): string {
  return CONTAINER.exec(line)?.[0] ?? "";
}

/** How far the line's leading spaces and tabs reach, a tab to the next multiple of four. */
function columns(line: string): number {
  let width = 0;
  for (const character of line) {
    if (character === " ") width += 1;
    else if (character === "\t") width += 4 - (width % 4);
    else break;
  }
  return width;
}

/** Whether the text ends inside an inline comment that began in it. */
function leavesOpen(text: string): boolean {
  const at = text.lastIndexOf(COMMENT_OPENER);
  return at !== -1 && !text.slice(at + 2).includes(COMMENT_CLOSER);
}

/** Whether the text ends inside inline raw HTML other than a comment that began in it. Every opener is asked. */
function leavesHtmlOpen(text: string): boolean {
  for (const found of text.matchAll(INLINE_HTML)) {
    const after = found.index + found[0].length;
    const [, cdata, instruction, declaration] = found;
    if (cdata !== undefined || instruction !== undefined || declaration !== undefined) {
      const closer = cdata !== undefined ? "]]>" : instruction !== undefined ? "?>" : ">";
      if (text.indexOf(closer, after) === -1) return true;
    } else {
      TAG_END.lastIndex = after;
      if (TAG_END.exec(text) === null) return true;
    }
  }
  return false;
}

/** What the walk found, one entry per line. */
export interface Walk {
  /** What the walk says each line is. */
  kinds: ("live" | "fence" | "comment")[];
  /** True where the walk does not know. */
  uncertain: boolean[];
  /** The index of every fence opener that never closes, which the walk read as an ordinary line. */
  unclosed: number[];
  /** The info string of every fence the walk paired, by its opener's index. */
  opens: Map<number, string>;
}

/** The walk over the lines of a markdown text, each without its line end. */
export function walk(lines: readonly string[]): Walk {
  const count = lines.length;
  const kinds: Walk["kinds"] = new Array(count).fill("live");
  const uncertain: boolean[] = new Array(count).fill(false);
  const unclosed: number[] = [];
  const opens = new Map<number, string>();

  let allFrom: number | null = null;
  let liveFrom: number | null = null;
  // `pending`: the paragraph this line continues was left inside inline raw
  // HTML. `sticky`: what left it open is not a comment, so only a blank line
  // or a block the walk follows ends it.
  let pending = false;
  let sticky = false;
  let indented = false;
  let index = 0;
  while (index < count) {
    const line = lines[index] ?? "";
    const prefix = containerOf(line);
    const rest = line.slice(prefix.length);
    if ((prefix !== "" && BLOCK_LOOKING.test(rest)) || (prefix === "" && OTHER_HTML.test(rest) && !rest.startsWith(COMMENT_OPENER))) {
      allFrom = index;
      break;
    }
    if (prefix === "") {
      const opener = fenceOpener(line);
      if (opener !== null) {
        let end = -1;
        for (let below = index + 1; below < count; below += 1) {
          if (fenceCloses(lines[below] ?? "", opener)) {
            end = below;
            break;
          }
        }
        if (end !== -1 && notSpacesAfterTheRun(lines[end] ?? "")) {
          // Which block such a line closes is not certain, so nothing below the opener is claimed.
          allFrom = index;
          break;
        }
        if (end !== -1) {
          kinds.fill("fence", index, end + 1);
          opens.set(index, fenceLine(line)?.info ?? "");
          pending = false;
          indented = false;
          index = end + 1;
          continue;
        }
        unclosed.push(index);
        liveFrom ??= index;
      } else if (line.startsWith(COMMENT_OPENER)) {
        let end = -1;
        for (let below = index; below < count; below += 1) {
          if (lines[below]?.includes(COMMENT_CLOSER)) {
            end = below;
            break;
          }
        }
        if (end !== -1) {
          kinds.fill("comment", index, end + 1);
          pending = false;
          indented = false;
          index = end + 1;
          continue;
        }
        liveFrom ??= index;
      }
    }
    if (withoutBlanks(line) === "") {
      // A blank line between two indented lines is no surer than they are.
      pending = false;
      uncertain[index] = indented;
    } else {
      if (pending) {
        uncertain[index] = true;
        sticky = sticky || leavesHtmlOpen(line);
        if (line.includes(COMMENT_CLOSER) && !sticky) pending = leavesOpen(line.slice(line.indexOf(COMMENT_CLOSER) + COMMENT_CLOSER.length));
      } else if (leavesOpen(line) || leavesHtmlOpen(line)) {
        pending = true;
        sticky = leavesHtmlOpen(line);
      }
      // A line behind a container's marker, or indented four columns or more, may be an indented code block.
      indented = withoutBlanks(prefix) !== "" || columns(line) >= 4;
      if (indented) uncertain[index] = true;
    }
    index += 1;
  }

  if (allFrom !== null) {
    for (let below = allFrom; below < count; below += 1) {
      kinds[below] = "live";
      uncertain[below] = true;
    }
  }
  if (liveFrom !== null) {
    for (let below = liveFrom; below < count; below += 1) {
      if (kinds[below] === "live") uncertain[below] = true;
    }
  }
  return { kinds, uncertain, unclosed, opens };
}

// ---------------------------------------------------------------------------
// The kinds.

/** How many lines of a key a block holds. `any number` is the count this module adds to the Python grammar. */
export type Count = "one" | "at most one" | "any number";

/** One key of a kind: the shape its value matches whole, how many a block holds, and what a refusal of its value says. */
export interface Spec {
  shape: RegExp;
  many: Count;
  says: string;
}

/** A block's kind: its name, its keys in order, the first of which opens it, and its own check. */
export interface Kind {
  name: string;
  keys: ReadonlyMap<string, Spec>;
  /** The key a block of this kind opens with. */
  opener: string;
  /** The pairs of keys a block holds one of at most, as the Python reader's `one_of` holds them. The second of a pair is refused at its line. */
  oneOf: readonly (readonly [string, string])[];
  /** A rule that spans two keys of the kind: the refusal's sentence, or null where the block holds it. It runs after every line parsed. */
  check: ((block: Block) => string | null) | null;
}

/** One line of a block: the value after its key, its 1-based line, and the named parts of the value's shape. */
export interface Field {
  value: string;
  line: number;
  groups: Record<string, string | undefined>;
}

/** One block whose every line parsed: `line` is its opener's and `end` its closer's, each 1-based. */
export interface Block {
  kind: Kind;
  line: number;
  end: number;
  /** Each key's lines in the file's order. A key of count one, or of at most one, holds one. */
  fields: Map<string, Field[]>;
}

/** A refusal at its 1-based line. `block` is the opener's line of the block it refused, or null for a refusal outside every block. */
export interface Refusal {
  line: number;
  why: string;
  block: number | null;
}

/** A notice at its 1-based line: something named as not read, on which nothing is decided. */
export interface Notice {
  line: number;
  why: string;
}

export interface BlocksRead {
  blocks: Block[];
  refusals: Refusal[];
  notices: Notice[];
}

function spec(shape: string, many: Count, says: string): Spec {
  return { shape: new RegExp(`^(?:${shape})$`, "su"), many, says };
}

function kind(name: string, keys: [string, Spec][], check: Kind["check"] = null, oneOf: Kind["oneOf"] = []): Kind {
  return { name, keys: new Map(keys), opener: keys[0]?.[0] ?? "", oneOf, check };
}

/** The first line of a key in a block, or undefined where the block holds none. */
export function field(block: Block, key: string): Field | undefined {
  return block.fields.get(key)?.[0];
}

const COMMIT = "[0-9a-f]{7,40}";
/** Text that opens with a character that is no white space. */
const TEXT = `${NOT_SPACE}.*`;
/** A block's id. At most 15 digits, so that it is a whole number JavaScript holds exactly. */
const ID = "[1-9][0-9]{0,14}";
const ID_SAYS = "a whole number from 1 with no leading zero and at most 15 digits";
/** An option's label: between two backticks, holding no backtick. */
const LABEL = "`(?<label>[^`]+)`";

const TEXT_SAYS = "it is text after the key, opening with a character that is no white space";

/** A character Python's `\\w` takes: a letter or a number of any script, or the underscore. JavaScript's own `\\w` takes those of ASCII alone. */
const WORD = "[\\p{L}\\p{N}_]";
/** One place a finding or a close names: a path between two backticks, with a line or a span of lines after a colon where it names one. */
const PLACE = `\`[^\`${SPACE}:/#][^\`${SPACE}:#]*(?::[0-9]+(?:-[0-9]+)?)?\``;
const PLACES = `${PLACE}(?:, ${PLACE})*`;
const PLACES_SAYS = "a location is one or more of `path`, `path:line` or `path:first-last`, each backticked, joined by `, `";
const ORIGINAL_SPEC = spec(`(?<commit>${COMMIT})`, "at most one", "it names the migration config's baseline commit, as 7 to 40 hex digits");

/** A round's one block, as `pr-check/lib/fields.py#ROUND_BLOCK` spells it. */
export const ROUND_BLOCK = kind("round", [
  [
    "target:",
    spec(`(?<commit>${COMMIT})(?: against [\\p{L}\\p{N}_./-]*${WORD}|, fixes ${COMMIT}\\.\\.${COMMIT})`, "one", "it names the reviewed commit as `<sha> against <base>`, or `<sha>, fixes <a>..<b>` for a verifying round"),
  ],
  ["original:", ORIGINAL_SPEC],
]);

/** A finding's block, as `pr-check/lib/fields.py#FINDING_BLOCK` spells it. */
export const FINDING_BLOCK = kind(
  "finding",
  [
    ["severity:", spec(".*", "one", "a severity is words after the key")],
    ["location:", spec(PLACES, "one", PLACES_SAYS)],
    ["evidence:", spec(".*", "at most one", "evidence is words after the key")],
    ["regression:", spec("round-(?<round>[1-9][0-9]*)(?:#(?<finding>[1-9][0-9]*))?", "at most one", "a reference is `round-<N>#<n>` or `round-<N>`")],
    ["reopens:", spec("round-(?<round>[1-9][0-9]*)#(?<finding>[1-9][0-9]*)", "at most one", "a reopened close is a finding's, so the reference is `round-<N>#<n>`")],
  ],
  null,
  [["regression:", "reopens:"]],
);

/** A finding's close block, as `pr-check/lib/fields.py#CLOSE_BLOCK` spells it. A finding with none is open. */
export const CLOSE_BLOCK = kind("close", [
  ["verdict:", spec(`rejected|fixed (?<commit>${COMMIT})|deferred (?<home>${NOT_SPACE}(?:.*${NOT_SPACE})?)`, "one", "a verdict is `fixed <commit>`, `rejected` or `deferred <home>`")],
  ["answer:", spec(".*", "at most one", "an answer is prose after the key")],
  ["location:", spec(PLACES, "at most one", PLACES_SAYS)],
]);

/** A confirmation's block, as `pr-check/lib/fields.py#CONFIRMATION_BLOCK` spells it. `none` reads for a record of an earlier release's template. */
export const CONFIRMATION_BLOCK = kind("confirmation", [["confirms:", spec("none|round-(?<round>[1-9][0-9]*)#(?<finding>[1-9][0-9]*)", "one", "it is `round-<N>#<n>`, the earlier finding it confirms")]]);

/** The kinds a round record holds, as `pr-check/lib/fields.py#ROUND_RECORD` lists them. */
export const ROUND_RECORD: readonly Kind[] = [ROUND_BLOCK, FINDING_BLOCK, CLOSE_BLOCK, CONFIRMATION_BLOCK];

/** The sealer's verdict, as `pr-check/lib/fields.py#VERDICT_BLOCK` spells it. */
export const VERDICT_BLOCK = kind("verdict", [
  ["target:", spec(`(?<commit>${COMMIT}) against (?<base>${NOT_SPACE}+)`, "one", "it names the audited commit as `<sha> against <base>`, each one word")],
  ["original:", ORIGINAL_SPEC],
  [
    "Verdict:",
    spec(
      `sealed|withheld reason: ${NOT_SPACE}.*|undecided question: ${NOT_SPACE}.*`,
      "one",
      "the verdict reads `Verdict: sealed`, `Verdict: withheld reason: <reason>` or `Verdict: undecided question: <question>`, written exactly so",
    ),
  ],
]);

/** The broad gate's run, as `pr-check/lib/fields.py#RUN_BLOCK` spells it. */
export const RUN_BLOCK = kind("run", [["run:", spec(`(?<commit>${COMMIT}) against (?<base>${COMMIT})`, "one", "a run is `<tree> against <base commit>`, each a commit's SHA")]]);

/** A decision made for a work item without asking the person. */
export const DECISION_BLOCK = kind(
  "decision",
  [
    [
      "decision:",
      spec(`(?<id>${ID}) (?<kind>route|default|scope|answered)`, "one", `it is \`<id> <kind>\`: the id ${ID_SAYS}, the kind one of \`route\`, \`default\`, \`scope\` and \`answered\``),
    ],
    ["decided:", spec(TEXT, "one", TEXT_SAYS)],
    ["grounds:", spec(TEXT, "one", TEXT_SAYS)],
    ["by:", spec(TEXT, "at most one", TEXT_SAYS)],
    [
      "state:",
      spec(
        `decided|reversed|applied (?<commit>${COMMIT})|carried (?<home>${NOT_SPACE}(?:.*${NOT_SPACE})?)`,
        "one",
        "a decision's state is `decided`, `reversed`, `applied <commit>` with 7 to 40 hex digits, or `carried <home>`",
      ),
    ],
    ["reversal:", spec(TEXT, "at most one", TEXT_SAYS)],
  ],
  (block) => {
    const state = /^[a-z]*/.exec(field(block, "state:")?.value ?? "")?.[0] ?? "";
    const reversal = field(block, "reversal:");
    if (state === "decided" && reversal !== undefined) return "the decision block holds a `reversal:` line and its state is `decided`: a decision that stands as made holds none";
    if (state !== "decided" && reversal === undefined) return `the decision block's state is \`${state}\` and it holds no \`reversal:\` line: a decision that is not \`decided\` holds the person's message`;
    return null;
  },
);

const OPTION_SPEC = spec(`${LABEL}(?: (?<implies>${TEXT}))?`, "any number", "an option is its label between two backticks, holding no backtick, then optionally a space and what the option implies");
const DEFAULT_SPEC = spec(LABEL, "at most one", "a default is an option's label between two backticks");

/** What is wrong with a block's `option:` and `default:` lines, or null: each label stands once, and the default names one of them. */
function brokenOptions(block: Block): string | null {
  const labels = (block.fields.get("option:") ?? []).map((option) => option.groups.label ?? "");
  const twice = labels.find((label, at) => labels.indexOf(label) !== at);
  if (twice !== undefined) return `two \`option:\` lines hold the label \`${twice}\`: a ${block.kind.name} block holds each label once`;
  const fallback = field(block, "default:")?.groups.label;
  if (fallback !== undefined && !labels.includes(fallback)) return `\`default:\` names \`${fallback}\`, and no \`option:\` line of the block holds that label`;
  return null;
}

/** A question a work item is parked with. */
export const QUESTION_BLOCK = kind(
  "question",
  [
    ["question:", spec(`(?<id>${ID})`, "one", `it is the id, ${ID_SAYS}`)],
    ["asks:", spec(TEXT, "one", TEXT_SAYS)],
    ["grounds:", spec(TEXT, "one", TEXT_SAYS)],
    ["by:", spec(TEXT, "at most one", TEXT_SAYS)],
    ["option:", OPTION_SPEC],
    ["default:", DEFAULT_SPEC],
    ["state:", spec("open|answered", "one", "a question's state is `open` or `answered`")],
    ["answer:", spec(TEXT, "at most one", TEXT_SAYS)],
  ],
  (block) => {
    const state = field(block, "state:")?.value;
    const answer = field(block, "answer:");
    if (state === "answered" && answer === undefined) return "the question block's state is `answered` and it holds no `answer:` line";
    if (state !== "answered" && answer !== undefined) return "the question block holds an `answer:` line and its state is `open`: an open question holds none";
    return brokenOptions(block);
  },
);

// The kinds a stage's answer holds. Each is read in an answer and written to
// no record, so the pull request check spells none of them.

/** A question a stage of a chain asks in its answer: the daemon has it decided from the code and the policy, or parks the work item with it. */
export const ASK_BLOCK = kind(
  "question",
  [
    ["asks:", spec(TEXT, "one", TEXT_SAYS)],
    ["grounds:", spec(TEXT, "one", TEXT_SAYS)],
    ["option:", OPTION_SPEC],
    ["default:", DEFAULT_SPEC],
  ],
  brokenOptions,
);

/** The orchestrator's judgment of whether a work item's review rounds are converging. */
export const CONVERGENCE_BLOCK = kind("judgment", [
  ["converging:", spec("(?<converging>yes|no)", "one", "it is `yes` or `no`")],
  ["grounds:", spec(TEXT, "one", TEXT_SAYS)],
]);

/** The orchestrator's ruling on one question of a stage: a decision of one of three kinds, or a park. */
export const RULING_BLOCK = kind(
  "ruling",
  [
    ["rules:", spec(`(?<question>${ID}) (?<ruling>default|scope|answered|park)`, "one", `it is \`<question> <ruling>\`: the question's number, ${ID_SAYS}, and one of \`default\`, \`scope\`, \`answered\` and \`park\``)],
    ["decided:", spec(TEXT, "at most one", TEXT_SAYS)],
    ["grounds:", spec(TEXT, "one", TEXT_SAYS)],
  ],
  (block) => {
    const parks = field(block, "rules:")?.groups.ruling === "park";
    const decided = field(block, "decided:");
    if (parks && decided !== undefined) return "the ruling block parks its question and holds a `decided:` line: a park decides nothing";
    if (!parks && decided === undefined) return "the ruling block holds no `decided:` line, and every ruling but `park` says what was decided";
    return null;
  },
);

// ---------------------------------------------------------------------------
// What each refusal and notice says. The sentences shared with the Python
// reader are its own, word for word, and the fixtures compare them.

export const UNCLOSED = "a fence opened here never closes, so every line after it is hidden from the reader";
export const COMMENT_LINE = "the line begins with `<!--`, and a record carries no HTML comment: the check reads one as text, so delete the comment";
export const UNSURE =
  "the walk cannot place this fence line: a line above it opens an HTML block, or a fence stands in a list item, a block quote or an indent, so no `seal` block from there on is read; write each fence at the start of its line";
const LINE_BREAK = "a value holds a line break, and a block's line holds one field";

function listed(words: string[], last = "and"): string {
  const quoted = words.map((word) => `\`${word}\``);
  if (quoted.length < 2) return quoted.join("");
  return `${quoted.slice(0, -1).join(", ")} ${last} ${quoted[quoted.length - 1]}`;
}

/** The key of `keys` the line is written with, or undefined. */
function keyOf(line: string, keys: Iterable<string>): string | undefined {
  for (const key of keys) if (line === key || line.startsWith(`${key} `)) return key;
  return undefined;
}

/** The block whose opener is at index `first` and closer at `last`, or the refusal at its first refused line. */
function blockAt(lines: readonly string[], first: number, last: number, kinds: readonly Kind[]): Block | Refusal {
  const refused = (line: number, why: string): Refusal => ({ line, why, block: first + 1 });
  const openers = listed(
    kinds.map((each) => each.opener),
    "or",
  );
  if (last === first + 1) return refused(first + 1, `an empty \`seal\` block: its first line opens with ${openers}`);
  const head = lines[first + 1] ?? "";
  const found = kinds.find((each) => keyOf(head, [each.opener]) !== undefined);
  if (found === undefined) return refused(first + 2, `\`${head}\` opens no \`seal\` block this record holds: a block's first line opens with ${openers}`);
  const fields = new Map<string, Field[]>();
  for (let index = first + 1; index < last; index += 1) {
    const line = lines[index] ?? "";
    const number = index + 1;
    if (stripped(line) === "") return refused(number, "a blank line inside a `seal` block: its lines are fields, one after another, and the block is not read past it");
    const key = keyOf(line, found.keys.keys());
    const its = key === undefined ? undefined : found.keys.get(key);
    if (key === undefined || its === undefined) return refused(number, `\`${line}\` is no field of a ${found.name} block, which takes ${listed([...found.keys.keys()])}, each written \`<key>: <value>\``);
    if (fields.has(key) && its.many !== "any number") return refused(number, `a second \`${key}\` line: a ${found.name} block holds one`);
    for (const pair of found.oneOf) {
      const other = pair.find((each) => each !== key && fields.has(each));
      if (pair.includes(key) && other !== undefined) return refused(number, `\`${key}\` beside \`${other}\`: a ${found.name} block holds one of the two`);
    }
    const value = line.slice(key.length + 1);
    const match = its.shape.exec(value);
    if (match === null) return refused(number, `\`${line}\` does not read whole as \`${key} <value>\`: ${its.says}`);
    fields.set(key, [...(fields.get(key) ?? []), { value, line: number, groups: { ...match.groups } }]);
  }
  for (const [key, its] of found.keys) {
    if (its.many === "one" && !fields.has(key)) return refused(first + 1, `the ${found.name} block holds no \`${key}\` line, and it holds one`);
  }
  const block: Block = { kind: found, line: first + 1, end: last + 1, fields };
  const broken = found.check?.(block) ?? null;
  return broken === null ? block : refused(first + 1, broken);
}

/**
 * Every block of the text whose lines all parse as one of the kinds, in the
 * file's order, with each refusal in line order and each notice. A refused
 * block is not returned, and nothing is decided on a notice.
 */
export function read(text: string, kinds: readonly Kind[]): BlocksRead {
  const lines = gfmLines(text);
  const walked = walk(lines);
  const blocks: Block[] = [];
  const refusals: Refusal[] = [];
  const notices: Notice[] = [];
  const inside = new Set<number>();
  for (const first of [...walked.opens.keys()].sort((a, b) => a - b)) {
    let last = first + 1;
    while (last + 1 < lines.length && walked.kinds[last + 1] === "fence" && !walked.opens.has(last + 1)) last += 1;
    for (let index = first; index <= last; index += 1) inside.add(index);
    if (lines[first] === OPENER) {
      const got = blockAt(lines, first, last, kinds);
      if ("why" in got) refusals.push(got);
      else blocks.push(got);
      continue;
    }
    // Python folds the case of the word, which also turns a long s into an s. Upper case and back does the same for the four letters of `seal`.
    const word = stripped(walked.opens.get(first) ?? "").split(SPACES)[0] ?? "";
    if (word.toUpperCase().toLowerCase() === INFO) {
      notices.push({
        line: first + 1,
        why: `not read: \`${lines[first]}\` opens a fence like a \`seal\` block and is not one, so its lines are no fields; a \`seal\` block opens with three backticks and \`seal\` alone on the line`,
      });
    }
  }
  const unclosed = new Set(walked.unclosed);
  for (const index of walked.unclosed) refusals.push({ line: index + 1, why: UNCLOSED, block: null });
  for (const [index, line] of lines.entries()) {
    if (inside.has(index) || unclosed.has(index)) continue;
    if (leftStripped(line).startsWith(COMMENT_OPENER)) refusals.push({ line: index + 1, why: COMMENT_LINE, block: null });
    else if (walked.uncertain[index] && FENCE_RUN.test(line.slice(containerOf(line).length))) refusals.push({ line: index + 1, why: UNSURE, block: null });
  }
  refusals.sort((a, b) => a.line - b.line || (a.why < b.why ? -1 : a.why > b.why ? 1 : 0));
  return { blocks, refusals, notices };
}

/**
 * The text of the block holding the pairs, each a key and its value in
 * order, as a record of those kinds reads it: the opener, one line a pair, the
 * closer, each ended by a line feed. Throws the first refusal's sentence where
 * the reader would refuse the block, and for a value that holds a line break,
 * which the reader would read as a line of its own.
 */
export function assemble(pairs: readonly (readonly [string, string])[], kinds: readonly Kind[]): string {
  const body = pairs.map(([key, value]) => (value === "" ? key : `${key} ${value}`));
  const text = `${[OPENER, ...body, FENCE].join("\n")}\n`;
  const got = read(text, kinds);
  const [refused] = got.refusals;
  if (refused !== undefined) throw new Error(refused.why);
  if (got.blocks.length !== 1 || got.blocks[0]?.end !== pairs.length + 2 || got.notices.length > 0) throw new Error(LINE_BREAK);
  return text;
}
