// A work item's record of the decisions made for it without asking and of the
// questions it was parked with: `decisions.md` of its directory. The cases
// read a record, write each change of one, and find a work item's directory
// by its branch, in temporary repositories and never in Owlery's own.
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  RECORD_FILE,
  readDecisionRecord,
  withAnswer,
  withApplied,
  withCarried,
  withDecision,
  withQuestion,
  withReversal,
  workItemDirectory,
  writeRecord,
} from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { git, temporaryRepository } from "./repositories";

const PR_CHECK_LIB = join(__dirname, "..", "..", "..", "pr-check", "lib");
const DOCS = join(__dirname, "..", "..", "..", "docs");

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

    it("creates the record with its head where none stands, and returns the record as read back", () => {
      const path = directory();
      const record = writeRecord(path, (text) =>
        withDecision(text, { kind: "route", decided: "The work item runs through the review chain, with no framer.", grounds: "`docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.", by: "orchestrator" }),
      );
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(`${HEAD}${ROUTE.trimEnd()}\n`);
      expect(record.decisions.map((decision) => [decision.id, decision.state.is])).toEqual([[1, "decided"]]);
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("applies several changes as one write of the whole file", () => {
      const path = directory();
      writeFileSync(join(path, RECORD_FILE), RECORD);
      const record = writeRecord(path, (text) => withAnswer(withReversal(text, 1, "No."), 2, "yes"));
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(withAnswer(withReversal(RECORD, 1, "No."), 2, "yes"));
      expect(record).toEqual(readDecisionRecord(readFileSync(join(path, RECORD_FILE), "utf8")));
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("writes a reversed decision and an open question so that the search the policy document gives a settle prints each, and prints nothing once each is closed, in a record whose lines end with a carriage return too", () => {
      const command = "git grep -n -E '^state: (reversed|open)[[:space:]]*$' -- '*/threads/*/decisions.md'";
      for (const edition of ["architecture.md", "architecture.ko.md"]) expect(readFileSync(join(DOCS, edition), "utf8"), edition).toContain(command);
      const path = directory();
      const repo = join(path, "..", "..", "..");
      /** What the document's command prints in the repository, with its exit code: git exits 1 where no line matches. */
      const search = (): { exit: number | null; printed: string[] } => {
        git(repo, "add", "--all");
        const run = spawnSync("git", ["grep", "-n", "-E", "^state: (reversed|open)[[:space:]]*$", "--", "*/threads/*/decisions.md"], { cwd: repo, encoding: "utf8" });
        return { exit: run.status, printed: run.stdout.split("\n").filter((line) => line !== "") };
      };

      writeRecord(path, (text) => withQuestion(withReversal(withDecision(text, { kind: "scope", decided: "No push.", grounds: "None asked." }), 1, "Push it."), { asks: "Go on?", grounds: "None stands." }));
      expect(search()).toEqual({ exit: 0, printed: ["seal/threads/1-x/decisions.md:9:state: reversed", "seal/threads/1-x/decisions.md:17:state: open"] });

      const closed = (text: string): string => withAnswer(withApplied(text, 1, "0123abc"), 2, "yes");
      const open = readFileSync(join(path, RECORD_FILE), "utf8");
      writeRecord(path, closed);
      expect(search()).toEqual({ exit: 1, printed: [] });

      // The same record as a checkout of Windows holds it: git's `$` stands before the line feed, so the pattern takes the carriage return as white space.
      writeFileSync(join(path, RECORD_FILE), open.replaceAll("\n", "\r\n"));
      expect(search()).toEqual({ exit: 0, printed: ["seal/threads/1-x/decisions.md:9:state: reversed\r", "seal/threads/1-x/decisions.md:17:state: open\r"] });
      writeRecord(path, closed);
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toContain("state: applied 0123abc\r\n");
      expect(search()).toEqual({ exit: 1, printed: [] });
    });

    it("throws where a record stands and cannot be read, and leaves the file as it is", () => {
      const path = directory();
      const file = join(path, RECORD_FILE);
      writeFileSync(file, `${RECORD}A line of the person's own.\n`);
      chmodSync(file, 0o000);
      cleanups.push(() => chmodSync(file, 0o600));
      expect(() => writeRecord(path, (text) => withDecision(text, { kind: "scope", decided: "No push.", grounds: "None asked." }))).toThrow("EACCES");
      chmodSync(file, 0o600);
      expect(readFileSync(file, "utf8")).toBe(`${RECORD}A line of the person's own.\n`);
      expect(readdirSync(path)).toEqual([RECORD_FILE]);
    });

    it("leaves the file as it is where the change throws, and creates none", () => {
      const path = directory();
      expect(() => writeRecord(path, (text) => withReversal(text, 1, "No."))).toThrow("the record holds no decision 1");
      expect(existsSync(join(path, RECORD_FILE))).toBe(false);
      writeFileSync(join(path, RECORD_FILE), RECORD);
      expect(() => writeRecord(path, (text) => withAnswer(withReversal(text, 1, "No."), 6, "Another."))).toThrow("question 6 is answered");
      expect(readFileSync(join(path, RECORD_FILE), "utf8")).toBe(RECORD);
    });
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

  it("is none in a folder with no records root, in one whose `seal/` is the project's own, and for no branch", { timeout: 30_000 }, () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    expect(workItemDirectory(made.repo, "feature")).toBeNull();
    write(made.repo, "seal/README.md", "# The seal colony\n");
    write(made.repo, "seal/threads/2-b/routing.md", declares("feature"));
    expect(workItemDirectory(made.repo, "feature")).toBeNull();
    expect(checkFinds(made.repo, "feature")).toBeNull();

    const rooted = worktree({ "2-b/routing.md": declares("") });
    expect(workItemDirectory(rooted, "")).toBeNull();
  });
});
