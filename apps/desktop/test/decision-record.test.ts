// A work item's record of the decisions made for it without asking and of the
// questions it was parked with: `decisions.md` of its directory. The cases
// read a record, write each change of one, find a work item's directory by
// its branch, and name a renamed branch in its `routing.md`, in temporary
// repositories and never in Owlery's own.
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  RECORD_FILE,
  owedWords,
  readDecisionRecord,
  withAnswer,
  withApplied,
  withBranch,
  withCarried,
  withDecision,
  withQuestion,
  withReversal,
  workItemDirectories,
  workItemDirectory,
  writeRecord,
} from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { REPOSITORY_FILE_BYTES } from "../src/daemon/repository-file";
import { git, temporaryRepository } from "./repositories";

const PR_CHECK_LIB = join(__dirname, "..", "..", "..", "pr-check", "lib");

const F = "```";
/** A `seal` block of those lines, with the blank line that follows a block. */
const block = (...lines: string[]): string => [`${F}seal`, ...lines, F, "", ""].join("\n");

const HEAD = [
  "# Decisions and questions: 1-x",
  "",
  "Each `seal` block below is one decision made for this work item without asking the person, or one question it was parked with. A line outside a block is prose.",
  "",
  "",
].join("\n");

const ROUTE = block(
  "decision: 1 route",
  "decided: The work item runs through the review chain, with no framer.",
  "grounds: `docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.",
  "by: orchestrator",
  "state: decided",
);
const PUSH = block(
  "question: 2",
  "asks: May the run push the branch to `origin`?",
  "grounds: No document of the repository grants it, and a session cannot grant itself a push.",
  "by: sealer",
  "option: `yes` The branch is pushed and the pull request opens.",
  "option: `no` The work item stays on this machine.",
  "default: `yes`",
  "state: open",
);
const SCOPE = block(
  "decision: 3 scope",
  "decided: The dialog asks for no record language.",
  "grounds: `frame/questions.md` Q2 takes English for both.",
  "state: reversed",
  "reversal: Ask it: the team writes Korean.",
);
const DEFAULT = block(
  "decision: 4 default",
  "decided: The check is called `seal`.",
  "grounds: `frame/questions.md` Q1 names it as the default.",
  "by: orchestrator",
  "state: applied 0123abc",
  "reversal: Call it `owlery-seal`.",
);
const ANSWERED = block(
  "decision: 5 answered",
  "decided: The setup pushes nothing.",
  "grounds: `src/daemon/worktrees.ts` holds no push.",
  "state: carried issue #131",
  "reversal: Push where the branch tracks a remote.",
);
const TOKEN = block("question: 6", "asks: Which token signs the release?", "grounds: No file of the repository holds one.", "state: answered", "answer: The one in the keychain item `owlery-release`.");
const RECORD = `${HEAD}${ROUTE}Prose between two blocks.\n\n${PUSH}${SCOPE}${DEFAULT}${ANSWERED}${TOKEN}`;

/** The 1-based line of the first line of the text that is exactly this one. */
const lineOf = (text: string, line: string): number => text.split("\n").indexOf(line) + 1;
/** The 1-based line of the opener of the block whose first line is this one. */
const openerOf = (text: string, first: string): number => lineOf(text, first) - 1;

describe("the reader of a work item's record", () => {
  it("returns a decision in each state and a question in each state, each with its fields and the line of its opener", () => {
    const record = readDecisionRecord(RECORD);
    expect(record.refusals).toEqual([]);
    expect(record.notices).toEqual([]);
    expect(record.decisions).toEqual([
      {
        id: 1,
        kind: "route",
        decided: "The work item runs through the review chain, with no framer.",
        grounds: "`docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.",
        by: "orchestrator",
        state: { is: "decided" },
        line: openerOf(RECORD, "decision: 1 route"),
      },
      {
        id: 3,
        kind: "scope",
        decided: "The dialog asks for no record language.",
        grounds: "`frame/questions.md` Q2 takes English for both.",
        by: null,
        state: { is: "reversed", message: "Ask it: the team writes Korean." },
        line: openerOf(RECORD, "decision: 3 scope"),
      },
      {
        id: 4,
        kind: "default",
        decided: "The check is called `seal`.",
        grounds: "`frame/questions.md` Q1 names it as the default.",
        by: "orchestrator",
        state: { is: "applied", message: "Call it `owlery-seal`.", commit: "0123abc" },
        line: openerOf(RECORD, "decision: 4 default"),
      },
      {
        id: 5,
        kind: "answered",
        decided: "The setup pushes nothing.",
        grounds: "`src/daemon/worktrees.ts` holds no push.",
        by: null,
        state: { is: "carried", message: "Push where the branch tracks a remote.", home: "issue #131" },
        line: openerOf(RECORD, "decision: 5 answered"),
      },
    ]);
    expect(record.questions).toEqual([
      {
        id: 2,
        asks: "May the run push the branch to `origin`?",
        grounds: "No document of the repository grants it, and a session cannot grant itself a push.",
        by: "sealer",
        options: [
          { label: "yes", implies: "The branch is pushed and the pull request opens." },
          { label: "no", implies: "The work item stays on this machine." },
        ],
        default: "yes",
        state: { is: "open" },
        line: openerOf(RECORD, "question: 2"),
      },
      {
        id: 6,
        asks: "Which token signs the release?",
        grounds: "No file of the repository holds one.",
        by: null,
        options: [],
        default: null,
        state: { is: "answered", answer: "The one in the keychain item `owlery-release`." },
        line: openerOf(RECORD, "question: 6"),
      },
    ]);
  });

  it("returns nothing for a text with no block, and an option with nothing after its label as one that implies nothing", () => {
    expect(readDecisionRecord("")).toEqual({ decisions: [], questions: [], refusals: [], notices: [] });
    expect(readDecisionRecord(HEAD)).toEqual({ decisions: [], questions: [], refusals: [], notices: [] });
    const bare = readDecisionRecord(block("question: 1", "asks: Go on?", "grounds: None stands.", "option: `yes`", "state: open"));
    expect(bare.questions.map((question) => question.options)).toEqual([[{ label: "yes", implies: "" }]]);
  });

  /** Each block the reader refuses at its opener, with a word of the refusal's sentence. */
  const REFUSED: { name: string; lines: string[]; says: string }[] = [
    { name: "a decision whose id a block above holds", lines: ["decision: 1 scope", "decided: Again.", "grounds: None.", "state: decided"], says: "a block above holds the id 1" },
    { name: "a question whose id a decision above holds", lines: ["question: 1", "asks: Again?", "grounds: None.", "state: open"], says: "a block above holds the id 1" },
    { name: "a reversal on a decided block", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: decided", "reversal: No."], says: "holds a `reversal:` line and its state is `decided`" },
    { name: "a reversed block with no reversal", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: reversed"], says: "state is `reversed` and it holds no `reversal:` line" },
    { name: "an applied block with no reversal", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: applied 0123abc"], says: "state is `applied` and it holds no `reversal:` line" },
    { name: "a default that names no option", lines: ["question: 7", "asks: X?", "grounds: Y.", "option: `yes`", "default: `no`", "state: open"], says: "`default:` names `no`" },
    { name: "a default where the block holds no option", lines: ["question: 7", "asks: X?", "grounds: Y.", "default: `no`", "state: open"], says: "`default:` names `no`" },
    { name: "an answered block with no answer", lines: ["question: 7", "asks: X?", "grounds: Y.", "state: answered"], says: "state is `answered` and it holds no `answer:` line" },
    { name: "an answer on an open block", lines: ["question: 7", "asks: X?", "grounds: Y.", "state: open", "answer: Yes."], says: "holds an `answer:` line and its state is `open`" },
    { name: "two options of one label", lines: ["question: 7", "asks: X?", "grounds: Y.", "option: `yes` One.", "option: `yes` Two.", "state: open"], says: "two `option:` lines hold the label `yes`" },
  ];

  it.each(REFUSED)("refuses $name at its opener, does not return it, and returns the blocks around it", ({ lines, says }) => {
    const text = `${HEAD}${ROUTE}${block(...lines)}${TOKEN}`;
    const record = readDecisionRecord(text);
    expect(record.decisions.map((decision) => decision.id)).toEqual([1]);
    expect(record.questions.map((question) => question.id)).toEqual([6]);
    expect(record.refusals).toEqual([{ line: openerOf(text, lines[0] ?? ""), why: expect.stringContaining(says) }]);
  });

  /** Each line the reader refuses inside a block, at the line itself. */
  const REFUSED_LINES: { name: string; lines: string[]; at: string; says: string }[] = [
    { name: "an id with a leading zero", lines: ["decision: 07 scope", "decided: X.", "grounds: Y.", "state: decided"], at: "decision: 07 scope", says: "no leading zero" },
    { name: "an id of 0", lines: ["question: 0", "asks: X?", "grounds: Y.", "state: open"], at: "question: 0", says: "no leading zero" },
    { name: "an id of more than 15 digits", lines: ["question: 1234567890123456", "asks: X?", "grounds: Y.", "state: open"], at: "question: 1234567890123456", says: "at most 15 digits" },
    { name: "a kind of decision the record does not hold", lines: ["decision: 7 guess", "decided: X.", "grounds: Y.", "state: decided"], at: "decision: 7 guess", says: "`route`, `default`, `scope` and `answered`" },
    { name: "a state the decision kind does not hold", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: open"], at: "state: open", says: "a decision's state is" },
    { name: "an applied state with no commit", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: applied", "reversal: No."], at: "state: applied", says: "a decision's state is" },
    { name: "a carried state whose home ends with a space", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: carried #1 ", "reversal: No."], at: "state: carried #1 ", says: "a decision's state is" },
    { name: "a state the question kind does not hold", lines: ["question: 7", "asks: X?", "grounds: Y.", "state: decided"], at: "state: decided", says: "a question's state is" },
    { name: "a value that opens with a space", lines: ["decision: 7 scope", "decided:  X.", "grounds: Y.", "state: decided"], at: "decided:  X.", says: "opening with a character that is no white space" },
    { name: "an option whose label stands between no backticks", lines: ["question: 7", "asks: X?", "grounds: Y.", "option: yes", "state: open"], at: "option: yes", says: "its label between two backticks" },
    { name: "a default with words after its label", lines: ["question: 7", "asks: X?", "grounds: Y.", "option: `yes`", "default: `yes` always", "state: open"], at: "default: `yes` always", says: "a default is an option's label" },
    { name: "a second state", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: decided", "state: reversed"], at: "state: reversed", says: "a second `state:` line" },
    { name: "a line of another kind's key", lines: ["decision: 7 scope", "decided: X.", "grounds: Y.", "asks: Z?", "state: decided"], at: "asks: Z?", says: "is no field of a decision block" },
  ];

  it.each(REFUSED_LINES)("refuses a block for $name, at that line, and returns the blocks around it", ({ lines, at, says }) => {
    const text = `${HEAD}${ROUTE}${block(...lines)}${TOKEN}`;
    const record = readDecisionRecord(text);
    expect(record.decisions.map((decision) => decision.id)).toEqual([1]);
    expect(record.questions.map((question) => question.id)).toEqual([6]);
    expect(record.refusals).toEqual([{ line: openerOf(text, lines[0] ?? "") + 1 + lines.indexOf(at), why: expect.stringContaining(says) }]);
  });

  it("refuses a block that lacks a key it holds one of, at its opener", () => {
    for (const missing of ["decided:", "grounds:", "state:"]) {
      const lines = ["decision: 7 scope", "decided: X.", "grounds: Y.", "state: decided"].filter((line) => !line.startsWith(missing));
      const text = `${ROUTE}${block(...lines)}`;
      expect(readDecisionRecord(text).refusals, missing).toEqual([{ line: openerOf(text, "decision: 7 scope"), why: `the decision block holds no \`${missing}\` line, and it holds one` }]);
    }
  });

  it("keeps the first of two blocks of one id, and refuses a third of that id too", () => {
    const again = block("decision: 1 scope", "decided: Again.", "grounds: None.", "state: decided");
    const record = readDecisionRecord(`${ROUTE}${again}${again}${block("decision: 2 scope", "not a field")}`);
    expect(record.decisions.map((decision) => [decision.id, decision.kind])).toEqual([[1, "route"]]);
    expect(record.refusals.map((refusal) => refusal.line)).toEqual([9, 16, 25]);
  });

  it("names as not read a fence that looks like a block and is not one, and decides nothing on it", () => {
    const text = `${ROUTE}${F}seal decision\ndecision: 9 scope\n${F}\n`;
    const record = readDecisionRecord(text);
    expect(record.decisions.map((decision) => decision.id)).toEqual([1]);
    expect(record.refusals).toEqual([]);
    expect(record.notices).toEqual([{ line: 9, why: expect.stringContaining("not read") }]);
  });
});

describe("the writer of a work item's record", () => {
  /** The lines of `after` that are not lines of `before`, and the lines of `before` that are not lines of `after`. */
  const changed = (before: string, after: string): { added: string[]; removed: string[] } => {
    const was = before.split("\n");
    const is = after.split("\n");
    return { added: is.filter((line) => !was.includes(line)), removed: was.filter((line) => !is.includes(line)) };
  };

  it("adds a decision as a block after a blank line, with the id one above the highest, and changes no line above it", () => {
    const first = withDecision(HEAD.trimEnd() + "\n", { kind: "route", decided: "The work item runs through the review chain, with no framer.", grounds: "`docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.", by: "orchestrator" });
    expect(first).toBe(`${HEAD}${ROUTE.trimEnd()}\n`);

    const next = withDecision(RECORD, { kind: "scope", decided: "No push.", grounds: "None asked." });
    expect(next.startsWith(RECORD)).toBe(true);
    expect(next.slice(RECORD.length)).toBe(block("decision: 7 scope", "decided: No push.", "grounds: None asked.", "state: decided").trimEnd() + "\n");
    expect(readDecisionRecord(next).decisions.at(-1)).toMatchObject({ id: 7, kind: "scope", by: null, state: { is: "decided" } });
  });

  it("adds a question with its options and its default, open", () => {
    const next = withQuestion(`${HEAD}${ROUTE}`, {
      asks: "May the run push the branch to `origin`?",
      grounds: "No document of the repository grants it, and a session cannot grant itself a push.",
      by: "sealer",
      options: [
        { label: "yes", implies: "The branch is pushed and the pull request opens." },
        { label: "no", implies: "The work item stays on this machine." },
      ],
      default: "yes",
    });
    expect(next).toBe(`${HEAD}${ROUTE}${PUSH.trimEnd()}\n`);

    const bare = withQuestion("", { asks: "Go on?", grounds: "None stands.", options: [{ label: "yes", implies: "" }] });
    expect(bare).toBe(block("question: 1", "asks: Go on?", "grounds: None stands.", "option: `yes`", "state: open").trimEnd() + "\n");
  });

  it("gives a new block an id above one a refused block names, so that a block repaired later holds its id alone", () => {
    const text = `${ROUTE}${block("decision: 12 scope", "decided: X.")}`;
    expect(readDecisionRecord(text).decisions.map((decision) => decision.id)).toEqual([1]);
    const next = withDecision(text, { kind: "scope", decided: "Y.", grounds: "Z." });
    expect(readDecisionRecord(next).decisions.map((decision) => decision.id)).toEqual([1, 13]);
  });

  it("reverses a decided decision: the state's line changes, the message follows it, and every other line is the same", () => {
    const next = withReversal(RECORD, 1, "Frame it first: the change reaches the protocol.");
    // `state: reversed` stands in another block of the record already, so the lines are also read at their place.
    expect(changed(RECORD, next)).toEqual({ added: ["reversal: Frame it first: the change reaches the protocol."], removed: ["state: decided"] });
    const lines = next.split("\n");
    expect(lines).toHaveLength(RECORD.split("\n").length + 1);
    expect(lines.slice(lines.indexOf("by: orchestrator"), lines.indexOf("by: orchestrator") + 4)).toEqual(["by: orchestrator", "state: reversed", "reversal: Frame it first: the change reaches the protocol.", F]);
    expect(readDecisionRecord(next).decisions[0]?.state).toEqual({ is: "reversed", message: "Frame it first: the change reaches the protocol." });
    expect(readDecisionRecord(next).refusals).toEqual([]);
  });

  it("writes applied with its commit, and carried with its home, over a reversed decision, and keeps the message", () => {
    const applied = withApplied(RECORD, 3, "89abcde");
    expect(changed(RECORD, applied)).toEqual({ added: ["state: applied 89abcde"], removed: ["state: reversed"] });
    expect(applied.split("\n")).toHaveLength(RECORD.split("\n").length);
    expect(readDecisionRecord(applied).decisions[1]?.state).toEqual({ is: "applied", message: "Ask it: the team writes Korean.", commit: "89abcde" });

    const carried = withCarried(RECORD, 3, "issue #140");
    expect(changed(RECORD, carried)).toEqual({ added: ["state: carried issue #140"], removed: ["state: reversed"] });
    expect(readDecisionRecord(carried).decisions[1]?.state).toEqual({ is: "carried", message: "Ask it: the team writes Korean.", home: "issue #140" });
  });

  it("answers an open question: the state's line changes, the answer follows it, and every other line is the same", () => {
    const next = withAnswer(RECORD, 2, "no");
    expect(changed(RECORD, next)).toEqual({ added: ["answer: no"], removed: ["state: open"] });
    const lines = next.split("\n");
    expect(lines).toHaveLength(RECORD.split("\n").length + 1);
    expect(lines.slice(lines.indexOf("default: `yes`"), lines.indexOf("default: `yes`") + 4)).toEqual(["default: `yes`", "state: answered", "answer: no", F]);
    expect(readDecisionRecord(next).questions[0]?.state).toEqual({ is: "answered", answer: "no" });
  });

  it("throws for a change the states do not allow, and for an id that names no block of that kind", () => {
    expect(() => withReversal(RECORD, 3, "Again.")).toThrow("decision 3 is reversed, and only a decision that stands decided is reversed");
    expect(() => withReversal(RECORD, 4, "Again.")).toThrow("decision 4 is applied");
    expect(() => withReversal(RECORD, 5, "Again.")).toThrow("decision 5 is carried");
    expect(() => withReversal(RECORD, 2, "No.")).toThrow("the record holds no decision 2");
    expect(() => withReversal(RECORD, 99, "No.")).toThrow("the record holds no decision 99");
    expect(() => withAnswer(RECORD, 6, "Another.")).toThrow("question 6 is answered, and only an open question is answered");
    expect(() => withAnswer(RECORD, 1, "yes")).toThrow("the record holds no question 1");
    expect(() => withApplied(RECORD, 1, "0123abc")).toThrow("decision 1 is decided, and only a reversed decision is written applied");
    expect(() => withApplied(RECORD, 4, "0123abc")).toThrow("decision 4 is applied");
    expect(() => withCarried(RECORD, 1, "issue #1")).toThrow("decision 1 is decided, and only a reversed decision is written carried");
    expect(() => withCarried(RECORD, 5, "issue #1")).toThrow("decision 5 is carried");
  });

  it("throws for a value the block's grammar refuses", () => {
    expect(() => withApplied(RECORD, 3, "the last commit")).toThrow("a decision's state is");
    expect(() => withCarried(RECORD, 3, "  ")).toThrow("a decision's state is");
    expect(() => withReversal(RECORD, 1, " \n ")).toThrow("does not read whole as `reversal: <value>`");
    expect(() => withAnswer(RECORD, 2, "")).toThrow("does not read whole as `answer: <value>`");
    expect(() => withDecision(RECORD, { kind: "scope", decided: "", grounds: "Y." })).toThrow("does not read whole as `decided: <value>`");
    expect(() => withQuestion(RECORD, { asks: "X?", grounds: "Y.", options: [{ label: "a`b", implies: "" }] })).toThrow("its label between two backticks");
    expect(() => withQuestion(RECORD, { asks: "X?", grounds: "Y.", options: [{ label: "", implies: "Nothing." }] })).toThrow("its label between two backticks");
    expect(() => withQuestion(RECORD, { asks: "X?", grounds: "Y.", options: [{ label: "yes", implies: "" }], default: "no" })).toThrow("`default:` names `no`");
  });

  it("writes a value of several lines as one line, each run of line breaks as one space, with the white space at its two ends taken off", () => {
    const next = withReversal(RECORD, 1, "  Frame it first:\nthe change\r\n\r\nreaches the protocol.\n");
    expect(next.split("\n")).toContain("reversal: Frame it first: the change reaches the protocol.");
    expect(readDecisionRecord(next).refusals).toEqual([]);

    const injected = withAnswer(RECORD, 2, `no\n${F}\n\n${F}seal\ndecision: 50 route`);
    expect(readDecisionRecord(injected).refusals).toEqual([]);
    expect(readDecisionRecord(injected).decisions.map((decision) => decision.id)).toEqual([1, 3, 4, 5]);
    expect(readDecisionRecord(injected).questions[0]?.state).toEqual({ is: "answered", answer: `no ${F} ${F}seal decision: 50 route` });
  });

  it("writes to one block of a record another block of which the reader refuses, and leaves the refused block's lines as they are", () => {
    const refused = block("decision: 9 scope", "decided: X.", "state: decided", "not a field");
    const text = `${ROUTE}${refused}${PUSH}`;
    const next = withAnswer(withReversal(text, 1, "No."), 2, "yes");
    expect(next).toContain(refused);
    const record = readDecisionRecord(next);
    expect(record.decisions.map((decision) => decision.state.is)).toEqual(["reversed"]);
    expect(record.questions.map((question) => question.state.is)).toEqual(["answered"]);
    expect(record.refusals).toHaveLength(1);
  });

  it("keeps the line ends of a record whose lines end with a carriage return and a line feed, and a last line with no line end", () => {
    const windows = `${ROUTE}${PUSH}`.replaceAll("\n", "\r\n");
    const next = withQuestion(withReversal(windows, 1, "No."), { asks: "X?", grounds: "Y." });
    expect(next.replaceAll("\r\n", "")).not.toMatch(/[\r\n]/);
    expect(readDecisionRecord(next).refusals).toEqual([]);
    expect(readDecisionRecord(next).questions.map((question) => question.id)).toEqual([2, 3]);

    const open = ROUTE.trimEnd();
    expect(withReversal(open, 1, "No.").endsWith(`reversal: No.\n${F}`)).toBe(true);
    expect(withDecision(open, { kind: "scope", decided: "X.", grounds: "Y." })).toBe(`${open}\n\n${block("decision: 2 scope", "decided: X.", "grounds: Y.", "state: decided").trimEnd()}\n`);
  });

  it("throws where the record would not read the new block, and names why", () => {
    expect(() => withDecision(`${ROUTE}${F}\nan example that never closes\n`, { kind: "scope", decided: "X.", grounds: "Y." })).toThrow("the record cannot take a new block");
  });

  describe("on disk", () => {
    const cleanups: (() => void)[] = [];
    afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    });
    const directory = (): string => {
      const made = temporaryRepository();
      cleanups.push(made.remove);
      const path = join(made.repo, "seal", "threads", "1-x");
      mkdirSync(path, { recursive: true });
      return path;
    };
    /** The worktree of a directory `directory` made: three folders above it. */
    const worktreeOf = (path: string): string => join(path, "..", "..", "..");

    it("creates the record with its head where none stands, and returns the record as read back", () => {
      const path = directory();
      const record = writeRecord(worktreeOf(path), path, (text) =>
        withDecision(text, { kind: "route", decided: "The work item runs through the review chain, with no framer.", grounds: "`docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.", by: "orchestrator" }),
      );
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(`${HEAD}${ROUTE.trimEnd()}\n`);
      expect(record.decisions.map((decision) => [decision.id, decision.state.is])).toEqual([[1, "decided"]]);
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("applies several changes as one write of the whole file", () => {
      const path = directory();
      writeFileSync(join(path, RECORD_FILE), RECORD);
      const record = writeRecord(worktreeOf(path), path, (text) => withAnswer(withReversal(text, 1, "No."), 2, "yes"));
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(withAnswer(withReversal(RECORD, 1, "No."), 2, "yes"));
      expect(record).toEqual(readDecisionRecord(readFileSync(join(path, RECORD_FILE), "utf8")));
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("throws where a record stands and cannot be read, and leaves the file as it is", () => {
      const path = directory();
      const file = join(path, RECORD_FILE);
      writeFileSync(file, `${RECORD}A line of the person's own.\n`);
      chmodSync(file, 0o000);
      cleanups.push(() => chmodSync(file, 0o600));
      expect(() => writeRecord(worktreeOf(path), path, (text) => withDecision(text, { kind: "scope", decided: "No push.", grounds: "None asked." }))).toThrow("EACCES");
      chmodSync(file, 0o600);
      expect(readFileSync(file, "utf8")).toBe(`${RECORD}A line of the person's own.\n`);
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("throws where the record is a link, to a file outside the directory and to nothing alike, and leaves the link a link and what it leads to as it was", () => {
      const path = directory();
      const file = join(path, RECORD_FILE);
      const outside = join(path, "..", "outside.md");
      const decide = (text: string): string => withDecision(text, { kind: "scope", decided: "No push.", grounds: "None asked." });
      writeFileSync(outside, RECORD);
      symlinkSync(outside, file);
      expect(() => writeRecord(worktreeOf(path), path, decide)).toThrow("decisions.md is a link, and Owlery reads it only as a file of its own");
      expect([lstatSync(file).isSymbolicLink(), readFileSync(outside, "utf8")]).toEqual([true, RECORD]);
      // A link that leads nowhere is not a record that does not stand: a new record's head is not written over it.
      const nowhere = directory();
      symlinkSync(join(nowhere, "..", "no-such-file"), join(nowhere, RECORD_FILE));
      expect(() => writeRecord(worktreeOf(nowhere), nowhere, decide)).toThrow("decisions.md is a link");
      expect([lstatSync(join(nowhere, RECORD_FILE)).isSymbolicLink(), readdirSync(nowhere)]).toEqual([true, [RECORD_FILE]]);
    });

    it("leaves the file as it is where the change throws, and creates none", () => {
      const path = directory();
      expect(() => writeRecord(worktreeOf(path), path, (text) => withReversal(text, 1, "No."))).toThrow("the record holds no decision 1");
      expect(existsSync(join(path, RECORD_FILE))).toBe(false);
      writeFileSync(join(path, RECORD_FILE), RECORD);
      expect(() => writeRecord(worktreeOf(path), path, (text) => withAnswer(withReversal(text, 1, "No."), 6, "Another."))).toThrow("question 6 is answered");
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(RECORD);
    });
  });
});

describe("the person's words no commit holds", () => {
  it("gives a decision the written record holds `reversed` and the committed one holds `decided`", () => {
    const committed = `${HEAD}${ROUTE}${PUSH}`;
    expect(owedWords(committed, withReversal(committed, 1, "No."))).toEqual({ reversed: [1], answered: [] });
  });

  it("gives a question the written record holds `answered` and the committed one holds `open`", () => {
    const committed = `${HEAD}${ROUTE}${PUSH}`;
    expect(owedWords(committed, withAnswer(committed, 2, "`yes`"))).toEqual({ reversed: [], answered: [2] });
  });

  it("gives nothing for a reversal and an answer the committed record holds in the same state, though its message differs", () => {
    const committed = `${HEAD}${SCOPE}${TOKEN}`;
    const written = committed.replace("reversal: Ask it: the team writes Korean.", "reversal: Ask it.").replace("answer: The one in the keychain item `owlery-release`.", "answer: Another.");
    expect(owedWords(committed, written)).toEqual({ reversed: [], answered: [] });
  });

  it("gives every `reversed` decision and every `answered` question, in the order of the file, where no commit holds the record, and no decision that stands `applied` or `carried`", () => {
    expect(owedWords(null, RECORD)).toEqual({ reversed: [3], answered: [6] });
    expect(owedWords(null, `${HEAD}${TOKEN}${SCOPE}`)).toEqual({ reversed: [3], answered: [6] });
  });

  it("gives nothing for a record whose decisions stand `decided`, `applied` or `carried` and whose questions stand `open`, though no commit holds it", () => {
    expect(owedWords(null, `${HEAD}${ROUTE}${PUSH}${DEFAULT}${ANSWERED}`)).toEqual({ reversed: [], answered: [] });
  });
});

describe("a work item's directory", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });

  function write(folder: string, path: string, text: string): void {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }

  /** A `routing.md` of those rows. */
  const routing = (rows: [string, string][]): string => ["# Routing", "", "| Axis | Answer |", "|---|---|", ...rows.map(([axis, answer]) => `| ${axis} | ${answer} |`), ""].join("\n");
  const declares = (branch: string): string =>
    routing([
      ["Review", "through the review chain"],
      ["Destination", "open the pull request"],
      ["Branch", branch],
    ]);

  /** A temporary repository holding a records root of that name and those files under its `threads/`. */
  const worktree = (files: Record<string, string>, root = "seal"): string => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    write(made.repo, `${root}/README.md`, `${MARKER}\n`);
    for (const [path, text] of Object.entries(files)) write(made.repo, `${root}/threads/${path}`, text);
    return made.repo;
  };

  /** The directory the pull request check finds for the branch, or null: `pr-check/lib/routing.py#item_dir`. */
  const checkFinds = (folder: string, branch: string): string | null => {
    const script = ["import sys", "sys.path.insert(0, sys.argv[1])", "import routing", "sys.stdout.write(routing.item_dir(sys.argv[2], sys.argv[3]))"].join("\n");
    const run = spawnSync("python3", ["-B", "-c", script, PR_CHECK_LIB, folder, branch], { encoding: "utf8", env: { PATH: process.env.PATH ?? "/usr/bin:/bin" } });
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error(`python3 exited ${run.status}: ${run.stderr}`);
    return run.stdout === "" ? null : run.stdout;
  };

  /** Each tree, with the directory under `threads/` that is the work item's on the branch `feature`, or null. */
  const TREES: { name: string; files: Record<string, string>; root?: string; found: string | null }[] = [
    { name: "two directories, one of which names the branch", files: { "1-a/routing.md": declares("other"), "2-b/routing.md": declares("feature") }, found: "2-b" },
    { name: "two directories that name the branch", files: { "1-a/routing.md": declares("feature"), "2-b/routing.md": declares("feature") }, found: null },
    { name: "no directory that names the branch", files: { "1-a/routing.md": declares("other"), "2-b/decisions.md": "feature\n" }, found: null },
    { name: "no directory at all", files: {}, found: null },
    { name: "a root named agentic-seal", files: { "2-b/routing.md": declares("feature") }, root: "agentic-seal", found: "2-b" },
    { name: "a branch named in a row inside a fence", files: { "2-b/routing.md": `${F}\n${declares("feature")}${F}\n` }, found: null },
    { name: "a branch named in a row inside an HTML comment", files: { "2-b/routing.md": `<!--\n${declares("feature")}-->\n` }, found: null },
    { name: "a routing whose review is no answer the check knows", files: { "2-b/routing.md": routing([["Review", "none"], ["Destination", "open the pull request"], ["Branch", "feature"]]) }, found: null },
    { name: "a routing with no destination", files: { "2-b/routing.md": routing([["Review", "straight to the PR"], ["Branch", "feature"]]) }, found: null },
    { name: "a routing that names two branches", files: { "2-b/routing.md": routing([["Review", "straight to the PR"], ["Destination", "stop before the pull request"], ["Branch", "feature"], ["Branch", "other"]]) }, found: null },
    { name: "a routing that goes straight to the pull request and stops before it", files: { "2-b/routing.md": routing([["Review", "straight to the PR"], ["Destination", "stop before the pull request"], ["Branch", "feature"]]) }, found: "2-b" },
  ];

  // Each case starts Python, which takes seconds while the rest of the suite runs beside it.
  it.each(TREES)("is found by its branch as the pull request check finds it: $name", { timeout: 30_000 }, ({ files, root = "seal", found }) => {
    const folder = worktree(files, root);
    const expected = found === null ? null : join(folder, root, "threads", found);
    expect(workItemDirectory(folder, "feature")).toBe(expected);
    expect(checkFinds(folder, "feature")).toBe(expected);
  });

  it("is none where the `routing.md` that names the branch is a link, or holds more than the daemon reads of a file: the daemon reads neither, though the pull request check reads both", () => {
    const linked = worktree({ "elsewhere.md": declares("feature") });
    mkdirSync(join(linked, "seal", "threads", "2-b"));
    symlinkSync("../elsewhere.md", join(linked, "seal", "threads", "2-b", "routing.md"));
    expect(workItemDirectory(linked, "feature")).toBeNull();
    const large = worktree({ "2-b/routing.md": `${declares("feature")}${"a".repeat(REPOSITORY_FILE_BYTES)}\n` });
    expect(workItemDirectory(large, "feature")).toBeNull();
    // The same tree with a `routing.md` of its own, of a size that is read.
    expect(workItemDirectory(worktree({ "2-b/routing.md": declares("feature") }), "feature")).not.toBeNull();
  });

  it("is none in a folder with no records root, in one whose `seal/` is the project's own, and for no branch: an empty name, and a work item with no branch yet, for which a routing whose `Branch` row the reader refuses names none", { timeout: 30_000 }, () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    expect(workItemDirectory(made.repo, "feature")).toBeNull();
    write(made.repo, "seal/README.md", "# The seal colony\n");
    write(made.repo, "seal/threads/2-b/routing.md", declares("feature"));
    expect(workItemDirectory(made.repo, "feature")).toBeNull();
    expect(checkFinds(made.repo, "feature")).toBeNull();

    const rooted = worktree({ "2-b/routing.md": declares("") });
    expect(workItemDirectory(rooted, "")).toBeNull();
    // The reader gives no branch for a routing with no `Branch` row, and none for one whose review it does not know.
    const unnamed = worktree({ "2-b/routing.md": routing([["Review", "straight to the PR"], ["Destination", "open the pull request"]]), "3-c/routing.md": routing([["Review", "none"], ["Destination", "open the pull request"], ["Branch", "feature"]]) });
    expect([workItemDirectories(unnamed, null), workItemDirectory(unnamed, null), workItemDirectory(rooted, null)]).toEqual([[], null, null]);
  });

  it("is found by a renamed branch once the `Branch` row names it: the row's name alone is rewritten, with the cell's own spaces, the cells after it, each line's end and every other line as they were, and the pull request check finds the directory by the new name", { timeout: 30_000 }, () => {
    expect(withBranch(declares("feature"), "owlery/second-name")).toBe(declares("owlery/second-name"));
    const padded = ["# Routing: 2-b", "", "|Axis|Answer|", "|---|---|", "  || Review | straight to the PR", "| Destination | stop before the pull request |", "| Automation | yes |", "|Branch|   feature\t| built on feature |", "", "The branch feature was cut on | Branch | feature |.", ""];
    const renamed = padded.map((line) => (line.startsWith("|Branch|") ? "|Branch|   owlery/second-name\t| built on feature |" : line));
    expect(withBranch(padded.join("\r\n"), "owlery/second-name")).toBe(renamed.join("\r\n"));
    // A row that ends with its name, in a file whose last line has no end.
    expect(withBranch(declares("feature").trimEnd().replace(/ \|$/, ""), "second")).toBe(declares("second").trimEnd().replace(/ \|$/, ""));

    const folder = worktree({ "2-b/routing.md": withBranch(padded.join("\n"), "owlery/second-name") });
    const expected = join(folder, "seal", "threads", "2-b");
    expect([workItemDirectory(folder, "feature"), workItemDirectory(folder, "owlery/second-name"), checkFinds(folder, "owlery/second-name")]).toEqual([null, expected, expected]);
  });

  it("is not renamed in a routing that declares no branch, and not to a name the row cannot hold", () => {
    expect(() => withBranch(routing([["Review", "none"], ["Destination", "open the pull request"], ["Branch", "feature"]]), "second")).toThrow("the routing declares no branch");
    expect(() => withBranch(`${F}\n${declares("feature")}${F}\n`, "second")).toThrow("the routing declares no branch");
    expect(() => withBranch(routing([["Review", "straight to the PR"], ["Destination", "open the pull request"], ["Branch", "feature"], ["Branch", "other"]]), "second")).toThrow("the routing declares no branch");
    expect(() => withBranch(declares("feature"), "a|b")).toThrow("the routing's `Branch` row cannot name the branch a|b");
    expect(() => withBranch(declares("feature"), "second ")).toThrow("the routing's `Branch` row cannot name the branch second ");
    expect(() => withBranch(declares("feature"), "")).toThrow("the routing's `Branch` row cannot name the branch ");
  });
});
