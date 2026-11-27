// The move of a repository's work records from the earlier form, which the
// AgenticSeal plugin wrote under `seal/`, to IADD's under `iadd/`: what the
// plan names, what the one commit holds, how each record is rewritten, what
// blocks the move, and what is read of a root in the earlier form. Each case
// runs in a temporary repository, never in Owlery's own, whose records stay in
// the earlier form until its own move.
import { mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readRefusals } from "../src/daemon/chain";
import { readDecisionRecord } from "../src/daemon/decision-record";
import { readGate, readInspection } from "../src/daemon/inspection-records";
import { EARLIER_MARKER, MIGRATE_SUBJECT, decisionsMoved, earlierRecordsSays, earlierRootOf, heavyCommandsOf, inspectionFromGuarantee, migrateRecords, planMigration, readmeMoved, refusalsMoved } from "../src/daemon/records-migration";
import { MARKER, readRecordsPlace, rootOf, workflowText } from "../src/daemon/records-place";
import { git, temporaryRepository } from "./repositories";

const VERSION = "1.2.3";
const WORKFLOW = ".github/workflows/owlery-inspection.yml";
const EARLIER_WORKFLOW = ".github/workflows/owlery-seal.yml";
const F = "```";
const A = "a".repeat(40);
const B = "b".repeat(40);

/** The `routing.md` of a work item on a branch, as both forms write it. */
function routing(workItem: string, branch: string): string {
  return [`# Routing: ${workItem}`, "", "| Axis | Answer |", "|---|---|", "| Review | through the review chain |", "| Destination | open the pull request |", "| Implementation | the session |", `| Branch | ${branch} |`, ""].join("\n");
}

/** A guarantee as the earlier form wrote it: a run the owl chain sealed, with every line it wrote, and a run a person's hand withheld, with no `rules:` line. */
const GUARANTEE = [
  "# Guarantee: 1-x",
  "",
  "## Run 1",
  "",
  `${F}seal`,
  `target: ${A} against main`,
  "Verdict: withheld reason: the broad gate names no test",
  "```",
  "",
  "## Run 2",
  "",
  `${F}seal`,
  `target: ${A} against main`,
  "Verdict: sealed",
  "built-by: the session, s-1",
  "judged-by: s-2",
  "model: opus",
  "rules: owlery 0.1.0",
  F,
  "",
].join("\n");

/** The same guarantee in IADD's form. */
const INSPECTION = [
  "# Inspection: 1-x",
  "",
  "## Run 1",
  "",
  `${F}iadd`,
  `target: ${A} against main`,
  "Verdict: withheld reason: the broad gate names no test",
  "```",
  "",
  "## Run 2",
  "",
  `${F}iadd`,
  `target: ${A} against main`,
  "Verdict: cleared",
  "built-by: the session, s-1",
  "inspected-by: s-2",
  "model: opus",
  "rules: owlery 0.1.0",
  "workflow: owl-chain",
  "inspector: owl-chain",
  F,
  "",
].join("\n");

const DECISIONS = [
  "# Decisions and questions: 1-x",
  "",
  `${F}seal`,
  "decision: 1 route",
  "decided: No framer.",
  "grounds: The change is small.",
  "by: orchestrator",
  "state: decided",
  F,
  "",
  `${F}seal`,
  "question: 2",
  "asks: Which base?",
  "grounds: No document names it.",
  "by: sealer",
  "state: open",
  F,
  "",
].join("\n");

const REFUSALS = ["# Refused calls: 1-x", "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|", "| seal 2 | sealer | Write | writes a file | no-write |", "| round 1 | proofer | Bash | runs a command | no-write |", ""].join("\n");
const ROUND = ["# Review round 1: 1-x", "", `${F}seal`, `target: ${A} against main`, F, "", "## Findings", "", "## Confirmations", ""].join("\n");
const GATE = ["# Broad gate: 1-x", "", `${F}seal`, `run: ${A} against ${B}`, F, ""].join("\n");
/** A design whose prose shows a block of the earlier form, which is no record the move rewrites. */
const DESIGN = ["# Design: 1-x", "", "A block reads so:", "", `${F}seal`, "Verdict: sealed", F, ""].join("\n");
const README = `${EARLIER_MARKER}\n\nThe plugin keeps its records here.\n`;
const CONFIG = `${JSON.stringify({ "Broad gate": "make check", "Heavy commands": { test: "make test" } }, null, 2)}\n`;

/** Writes a file in a repository, with the folders above it. */
function write(repo: string, path: string, text: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
}

function commitAll(repo: string, subject: string): void {
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", subject);
}

const head = (repo: string): string => git(repo, "rev-parse", "HEAD").trim();
const status = (repo: string): string => git(repo, "status", "--porcelain=v1", "--untracked-files=all");

describe("the move of the records from the earlier form", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });

  /** A repository whose `main` holds a root in the earlier form at `root`, with one work item's records, and the earlier workflow, committed. */
  const earlier = (root = "seal"): string => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const { repo } = made;
    write(repo, `${root}/README.md`, README);
    write(repo, `${root}/config.json`, CONFIG);
    write(repo, `${root}/threads/1-x/routing.md`, routing("1-x", "feature"));
    write(repo, `${root}/threads/1-x/frame/design.md`, DESIGN);
    write(repo, `${root}/threads/1-x/trail/rounds/round-1.md`, ROUND);
    write(repo, `${root}/threads/1-x/trail/gate.md`, GATE);
    write(repo, `${root}/threads/1-x/trail/refusals.md`, REFUSALS);
    write(repo, `${root}/threads/1-x/guarantee.md`, GUARANTEE);
    write(repo, `${root}/threads/1-x/decisions.md`, DECISIONS);
    write(repo, EARLIER_WORKFLOW, "name: seal\n");
    commitAll(repo, "chore: the plugin's records");
    return repo;
  };

  it("names a root in the earlier form by its marker, at either name, and reads none where IADD's root or no marker stands", () => {
    const repo = earlier();
    expect([earlierRootOf(repo), rootOf(repo), readRecordsPlace(repo).root]).toEqual(["seal", null, null]);
    expect(earlierRootOf(earlier("agentic-seal"))).toBe("agentic-seal");
    write(repo, "seal/README.md", "# A project's own seal/\n");
    expect(earlierRootOf(repo)).toBeNull();
  });

  it("plans one commit that moves each file of the earlier root to iadd/, the guarantee to inspection.md, removes the earlier workflow and writes Owlery's, and writes nothing", async () => {
    const repo = earlier();
    const before = [head(repo), status(repo)];
    const plan = await planMigration(repo, VERSION);
    expect([plan.branch, plan.subject, plan.from, plan.blocked]).toEqual(["main", MIGRATE_SUBJECT, "seal", null]);
    expect(plan.subject).toBe("chore: move the work records and the pull request check to IADD's forms");
    expect(plan.moves).toEqual([
      { from: "seal/README.md", to: "iadd/README.md", rewritten: true },
      { from: "seal/config.json", to: "iadd/config.json", rewritten: false },
      { from: "seal/threads/1-x/decisions.md", to: "iadd/threads/1-x/decisions.md", rewritten: true },
      { from: "seal/threads/1-x/frame/design.md", to: "iadd/threads/1-x/frame/design.md", rewritten: false },
      { from: "seal/threads/1-x/guarantee.md", to: "iadd/threads/1-x/inspection.md", rewritten: true },
      { from: "seal/threads/1-x/routing.md", to: "iadd/threads/1-x/routing.md", rewritten: false },
      { from: "seal/threads/1-x/trail/gate.md", to: "iadd/threads/1-x/trail/gate.md", rewritten: true },
      { from: "seal/threads/1-x/trail/refusals.md", to: "iadd/threads/1-x/trail/refusals.md", rewritten: true },
      { from: "seal/threads/1-x/trail/rounds/round-1.md", to: "iadd/threads/1-x/trail/rounds/round-1.md", rewritten: true },
    ]);
    expect(plan.removes).toEqual([EARLIER_WORKFLOW]);
    expect(plan.writes).toEqual([{ path: WORKFLOW, text: workflowText(VERSION) }]);
    expect(plan.stamp).toMatch(/^[0-9a-f]{64}$/u);
    expect([head(repo), status(repo)]).toEqual(before);
  });

  it("makes the one commit the plan names: the root at iadd/ in IADD's forms, which Owlery's readers read, Owlery's workflow, and nothing of seal/ or of the earlier workflow, with every other line as it stood", async () => {
    const repo = earlier();
    const was = head(repo);
    const plan = await planMigration(repo, VERSION);
    await migrateRecords(repo, VERSION, plan.stamp);
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(was);
    expect(git(repo, "log", "-1", "--format=%s").trim()).toBe(MIGRATE_SUBJECT);
    expect(status(repo)).toBe("");
    expect(git(repo, "ls-tree", "-r", "--name-only", "HEAD").trim().split("\n")).toEqual([
      WORKFLOW,
      "README.md",
      "iadd/README.md",
      "iadd/config.json",
      "iadd/threads/1-x/decisions.md",
      "iadd/threads/1-x/frame/design.md",
      "iadd/threads/1-x/inspection.md",
      "iadd/threads/1-x/routing.md",
      "iadd/threads/1-x/trail/gate.md",
      "iadd/threads/1-x/trail/refusals.md",
      "iadd/threads/1-x/trail/rounds/round-1.md",
    ]);
    const text = (path: string): string => readFileSync(join(repo, path), "utf8");
    expect(text("iadd/README.md")).toBe(`${MARKER}\n\nThe plugin keeps its records here.\n`);
    expect([text("iadd/config.json"), text("iadd/threads/1-x/routing.md"), text("iadd/threads/1-x/frame/design.md")]).toEqual([CONFIG, routing("1-x", "feature"), DESIGN]);
    expect(text("iadd/threads/1-x/inspection.md")).toBe(INSPECTION);
    expect(text("iadd/threads/1-x/trail/gate.md")).toBe(GATE.replace(`${F}seal`, `${F}iadd`));
    expect(text("iadd/threads/1-x/trail/rounds/round-1.md")).toBe(ROUND.replace(`${F}seal`, `${F}iadd`));
    expect(text(WORKFLOW)).toBe(workflowText(VERSION));
    // Owlery's readers read every record the move wrote.
    expect(readRecordsPlace(repo)).toEqual({ root: "iadd", check: WORKFLOW, broadGate: "make check", olderCheck: null });
    expect(earlierRootOf(repo)).toBeNull();
    const inspection = readInspection(text("iadd/threads/1-x/inspection.md"));
    expect(inspection.refusals).toEqual([]);
    expect(inspection.verdicts.map((verdict) => [verdict.is, verdict.inspectedBy, verdict.workflow, verdict.inspector])).toEqual([
      ["withheld", null, null, null],
      ["cleared", "s-2", "owl-chain", "owl-chain"],
    ]);
    expect(readGate(text("iadd/threads/1-x/trail/gate.md")).runs.map((run) => run.commit)).toEqual([A]);
    const decisions = readDecisionRecord(text("iadd/threads/1-x/decisions.md"));
    expect([decisions.refusals, decisions.decisions.map((decision) => decision.by), decisions.questions.map((question) => question.by)]).toEqual([[], ["orchestrator"], ["inspector"]]);
    expect(readRefusals(text("iadd/threads/1-x/trail/refusals.md"))).toEqual({ refusals: [{ kind: "inspection", round: 2, rule: "no-write" }, { kind: "round", round: 1, rule: "no-write" }], unread: 0 });
    expect(heavyCommandsOf(repo)).toEqual({ root: "iadd", commands: { test: "make test" } });
  });

  it("rewrites the inspection's record, the decisions and the refused calls, and moves an opener of the earlier form alone where it opens a fence, keeping each line's own end", () => {
    expect(inspectionFromGuarantee(GUARANTEE)).toBe(INSPECTION);
    // A file of Windows keeps its carriage returns, the two lines it gains among them.
    expect(inspectionFromGuarantee(GUARANTEE.replaceAll("\n", "\r\n"))).toBe(INSPECTION.replaceAll("\n", "\r\n"));
    expect(decisionsMoved(DECISIONS)).toBe(DECISIONS.replaceAll(`${F}seal`, `${F}iadd`).replace("by: sealer", "by: inspector"));
    expect(refusalsMoved(REFUSALS)).toBe(REFUSALS.replace("| seal 2 | sealer |", "| inspection 2 | inspector |"));
    // A cell of another width keeps its spaces, a row of other cells is not read, and a word that is not the whole cell stays.
    expect(refusalsMoved("|  seal 12  |sealer| x | y | z |\n| seal 1 | sealer |\n| sealed 1 | the sealer | x | y | z |\n")).toBe("|  inspection 12  |inspector| x | y | z |\n| seal 1 | sealer |\n| sealed 1 | the sealer | x | y | z |\n");
    expect(readmeMoved(README)).toBe(`${MARKER}\n\nThe plugin keeps its records here.\n`);
    // An opener inside another fence, and a fence with more after `seal`, are no block of the earlier form and stay.
    const nested = ["# Guarantee: 1-x", "", "````md", `${F}seal`, "Verdict: sealed", F, "````", "", `${F}seal decision`, "x", F, ""].join("\n");
    expect(inspectionFromGuarantee(nested)).toBe(nested.replace("# Guarantee: ", "# Inspection: "));
  });

  it("blocks the plan and commits nothing where the earlier grammar refuses a line of a record, naming the file and the line, or where a record would read otherwise in IADD's form", async () => {
    const repo = earlier();
    write(repo, "seal/threads/1-x/guarantee.md", GUARANTEE.replace("judged-by: s-2", "judged-by: s-2, s-3"));
    write(repo, "seal/threads/1-x/decisions.md", DECISIONS.replace("state: open", "state: shut"));
    commitAll(repo, "chore: two lines the reader refuses");
    const before = [head(repo), status(repo)];
    const plan = await planMigration(repo, VERSION);
    expect(plan.blocked).toMatch(/^The earlier form's reader refuses 2 lines of these records, so Owlery cannot move them as they mean: /u);
    expect(plan.blocked).toContain("`seal/threads/1-x/decisions.md:16`: ");
    expect(plan.blocked).toContain("`seal/threads/1-x/guarantee.md:16`: `judged-by: s-2, s-3` does not read whole as `judged-by: <value>`");
    expect(plan.blocked).toContain("Fix each line named in a commit, and open this again.");
    await expect(migrateRecords(repo, VERSION, plan.stamp)).rejects.toThrow(plan.blocked ?? "");
    expect([head(repo), status(repo)]).toEqual(before);
    // A fence the earlier form read as no block, and IADD's form reads as one, would change what the record says.
    const fenced = earlier();
    write(fenced, "seal/threads/1-x/trail/gate.md", `${GATE}\n${F}iadd\nrun: ${B} against ${A}\n${F}\n`);
    commitAll(fenced, "chore: a fence of IADD's in an earlier record");
    expect((await planMigration(fenced, VERSION)).blocked).toContain("`seal/threads/1-x/trail/gate.md`: its blocks would read otherwise in IADD's form than in the earlier one, since a fence the earlier form read as no block would open one");
  });

  it("blocks the plan where iadd/ holds something of the project's own, where the checkout differs from the commit at a path the move reads, where something other than a file stands below the root, and where no branch is checked out, and refuses a move whose stamp is another's", async () => {
    const own = earlier();
    write(own, "iadd/notes.md", "# Our notes\n");
    commitAll(own, "docs: our notes");
    expect((await planMigration(own, VERSION)).blocked).toBe("iadd/ holds something of this repository's own, so Owlery has no folder to move the work records to. Rename that folder in a commit, and open this again.");

    const edited = earlier();
    write(edited, "seal/threads/1-x/decisions.md", `${DECISIONS}\nmore\n`);
    write(edited, "seal/threads/2-y/routing.md", routing("2-y", "other"));
    expect((await planMigration(edited, VERSION)).blocked).toBe(
      "This checkout does not hold seal/threads/1-x/decisions.md and seal/threads/2-y/routing.md as the commit it stands at does. Owlery moves the records as the commit holds them: commit what is named or put it back as the commit has it, and open this again.",
    );

    const linked = earlier();
    symlinkSync("routing.md", join(linked, "seal/threads/1-x/link.md"));
    commitAll(linked, "chore: a link below the root");
    expect((await planMigration(linked, VERSION)).blocked).toBe("The commit this checkout stands at holds something other than a file at seal/threads/1-x/link.md, and the move moves files alone. Rename or remove it in a commit, and open this again.");

    const ignoring = earlier();
    write(ignoring, ".gitignore", "iadd/threads/\n");
    commitAll(ignoring, "chore: ignore a folder");
    expect((await planMigration(ignoring, VERSION)).blocked).toMatch(/^Git ignores iadd\/threads\/1-x\/decisions\.md, .+ and iadd\/threads\/1-x\/trail\/rounds\/round-1\.md in this repository, so the move cannot commit them\. A repository that cannot keep work records in its tree is out of scope for Owlery\.$/u);

    const folded = earlier();
    write(folded, `${WORKFLOW}/notes.md`, "# A folder at the workflow's path\n");
    commitAll(folded, "chore: a folder at the workflow's path");
    expect((await planMigration(folded, VERSION)).blocked).toBe(`The commit this checkout stands at holds something other than a file at ${WORKFLOW}, where the check's workflow stands. Rename it in a commit, and open this again.`);

    const detached = earlier();
    git(detached, "checkout", "--quiet", "--detach");
    const unbranched = await planMigration(detached, VERSION);
    expect(unbranched.blocked).toBe("No branch is checked out here, so the commit has no branch to land on. Check a branch out and open this again.");

    const repo = earlier();
    const plan = await planMigration(repo, VERSION);
    write(repo, "seal/threads/1-x/frame/plan.md", "# Plan\n");
    commitAll(repo, "docs: a plan");
    const before = [head(repo), status(repo)];
    await expect(migrateRecords(repo, VERSION, plan.stamp)).rejects.toThrow("The repository changed since the plan was read. Read the plan again.");
    expect([head(repo), status(repo)]).toEqual(before);
    // A repository with no root in the earlier form has nothing to move.
    const made = temporaryRepository();
    cleanups.push(made.remove);
    expect((await planMigration(made.repo, VERSION)).blocked).toBe("The commit this checkout stands at holds no work records in the form the AgenticSeal plugin wrote, so there is nothing to move.");
  });

  it("undoes the move where the repository's hook refuses the commit: the earlier root and workflow stand as the commit holds them, nothing of iadd/ is left, and the error holds the hook's words", async () => {
    const repo = earlier();
    writeFileSync(join(repo, ".git", "hooks", "pre-commit"), "#!/bin/sh\necho 'the hook refuses the move' >&2\nexit 1\n", { mode: 0o755 });
    const before = [head(repo), status(repo)];
    const plan = await planMigration(repo, VERSION);
    await expect(migrateRecords(repo, VERSION, plan.stamp)).rejects.toThrow("the hook refuses the move");
    expect([head(repo), status(repo)]).toEqual(before);
    expect(readdirSync(repo).sort()).toEqual([".git", ".github", "README.md", "seal"]);
    expect(readFileSync(join(repo, "seal/threads/1-x/guarantee.md"), "utf8")).toBe(GUARANTEE);
  });

  it("moves what a branch kept under the earlier root once it merged a base that moved, beside IADD's root, writes no workflow where Owlery's stands, and names the work item's own directory until then", async () => {
    const repo = earlier();
    git(repo, "checkout", "--quiet", "-b", "feature");
    write(repo, "seal/threads/1-x/trail/rounds/round-2.md", ROUND.replace("round 1", "round 2"));
    commitAll(repo, "chore: record review round 2");
    // The base moves its records, and the branch merges it: what the branch added stays under seal/.
    git(repo, "checkout", "--quiet", "main");
    const moved = await planMigration(repo, VERSION);
    await migrateRecords(repo, VERSION, moved.stamp);
    git(repo, "checkout", "--quiet", "feature");
    // Git's default reads the base's move as a rename of the folder and stops at a file the branch added inside it, proposing iadd/ for it; the person who keeps it where the branch put it leaves it under seal/, as this merge does.
    git(repo, "-c", "merge.directoryRenames=false", "merge", "--quiet", "--no-edit", "main");
    expect(git(repo, "ls-tree", "-r", "--name-only", "HEAD", "--", "seal").trim()).toBe("seal/threads/1-x/trail/rounds/round-2.md");
    expect([rootOf(repo), earlierRootOf(repo)]).toEqual(["iadd", null]);
    expect(earlierRecordsSays(repo, "feature")).toBeNull();
    // Its own directory names the branch where its routing stands under the earlier root.
    write(repo, "seal/threads/1-x/routing.md", routing("1-x", "feature"));
    commitAll(repo, "chore: the routing stays where the branch kept it");
    expect(earlierRecordsSays(repo, "feature")).toBe(
      "This work item's records stand in seal/threads/1-x/, in the form the AgenticSeal plugin wrote, and the branch's records root is iadd/. The chain command's `migrate` moves them to IADD's forms in one commit on this branch; run it in the worktree, and commit nothing else with it. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared.",
    );
    expect(earlierRecordsSays(repo, "other")).toBeNull();
    const plan = await planMigration(repo, VERSION);
    expect([plan.from, plan.blocked, plan.removes, plan.writes]).toEqual(["seal", "The commit this checkout stands at holds iadd/threads/1-x/routing.md already, where the move puts a file of seal/. Rename or remove it in a commit, and open this again.", [], []]);
    git(repo, "rm", "--quiet", "iadd/threads/1-x/routing.md");
    commitAll(repo, "chore: one routing of the work item");
    const kept = await planMigration(repo, VERSION);
    expect([kept.blocked, kept.moves.map((move) => move.to)]).toEqual([null, ["iadd/threads/1-x/routing.md", "iadd/threads/1-x/trail/rounds/round-2.md"]]);
    await migrateRecords(repo, VERSION, kept.stamp);
    expect(git(repo, "ls-tree", "-r", "--name-only", "HEAD", "--", "seal").trim()).toBe("");
    expect(readFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), "utf8")).toBe(ROUND.replace("round 1", "round 2").replace(`${F}seal`, `${F}iadd`));
    expect(earlierRecordsSays(repo, "feature")).toBeNull();
  });

  it("moves the threads/ a branch kept under agentic-seal/ beside a project's own seal/, whether or not that seal/ holds a README.md of its own, and leaves the project's seal/ and every other file of agentic-seal/ as they stood", async () => {
    for (const own of [{ "seal/notes.txt": "Our notes.\n" }, { "seal/README.md": "# Our seal\n", "seal/notes.txt": "Our notes.\n" }]) {
      const repo = earlier("agentic-seal");
      for (const [path, text] of Object.entries(own)) write(repo, path, text);
      commitAll(repo, "docs: the project's own seal/");
      git(repo, "checkout", "--quiet", "-b", "feature");
      write(repo, "agentic-seal/threads/2-y/routing.md", routing("2-y", "feature"));
      write(repo, "agentic-seal/threads/2-y/trail/rounds/round-1.md", ROUND);
      commitAll(repo, "chore: the branch's work item");
      git(repo, "checkout", "--quiet", "main");
      const base = await planMigration(repo, VERSION);
      expect([base.from, base.blocked]).toEqual(["agentic-seal", null]);
      await migrateRecords(repo, VERSION, base.stamp);
      git(repo, "checkout", "--quiet", "feature");
      git(repo, "-c", "merge.directoryRenames=false", "merge", "--quiet", "--no-edit", "main");
      // A file the branch kept of the earlier root outside its threads/, and one the checkout holds untracked there, are no part of what the branch moves.
      write(repo, "agentic-seal/config.json", CONFIG);
      commitAll(repo, "chore: the config the branch kept");
      write(repo, "agentic-seal/local.txt", "untracked\n");
      expect(earlierRecordsSays(repo, "feature")).toMatch(/^This work item's records stand in agentic-seal\/threads\/2-y\//u);
      const plan = await planMigration(repo, VERSION);
      expect([plan.from, plan.blocked, plan.moves, plan.removes, plan.writes]).toEqual([
        "agentic-seal",
        null,
        [
          { from: "agentic-seal/threads/2-y/routing.md", to: "iadd/threads/2-y/routing.md", rewritten: false },
          { from: "agentic-seal/threads/2-y/trail/rounds/round-1.md", to: "iadd/threads/2-y/trail/rounds/round-1.md", rewritten: true },
        ],
        [],
        [],
      ]);
      await migrateRecords(repo, VERSION, plan.stamp);
      expect(git(repo, "show", "--name-status", "--no-renames", "--format=", "HEAD").trim().split("\n").sort()).toEqual([
        "A\tiadd/threads/2-y/routing.md",
        "A\tiadd/threads/2-y/trail/rounds/round-1.md",
        "D\tagentic-seal/threads/2-y/routing.md",
        "D\tagentic-seal/threads/2-y/trail/rounds/round-1.md",
      ]);
      expect(git(repo, "ls-tree", "-r", "--name-only", "HEAD", "--", "seal", "agentic-seal").trim().split("\n")).toEqual(["agentic-seal/config.json", ...Object.keys(own).sort()]);
      expect(Object.entries(own).map(([path]) => readFileSync(join(repo, path), "utf8"))).toEqual(Object.values(own));
      expect(status(repo)).toBe("?? agentic-seal/local.txt\n");
      expect(earlierRecordsSays(repo, "feature")).toBeNull();
    }
  });

  it("rewrites in place, under IADD's root, the records a branch added in the earlier form where its merge of a base that moved took git's proposal of their place, moves a guarantee there to inspection.md, puts them back where the commit is refused, and names the work item's own directory until then", async () => {
    const repo = earlier();
    git(repo, "rm", "--quiet", "seal/threads/1-x/guarantee.md");
    commitAll(repo, "chore: no inspection yet");
    git(repo, "checkout", "--quiet", "-b", "feature");
    const round2 = ROUND.replace("round 1", "round 2");
    write(repo, "seal/threads/1-x/trail/rounds/round-2.md", round2);
    write(repo, "seal/threads/1-x/guarantee.md", GUARANTEE);
    commitAll(repo, "chore: record review round 2 and the inspection");
    git(repo, "checkout", "--quiet", "main");
    const base = await planMigration(repo, VERSION);
    await migrateRecords(repo, VERSION, base.stamp);
    git(repo, "checkout", "--quiet", "feature");
    // Git reads the base's move as a rename of the folder, and a file the branch added inside it stops the merge with `CONFLICT (file location)` and git's proposal of its place under iadd/, which this merge takes.
    git(repo, "-c", "merge.directoryRenames=true", "merge", "--quiet", "--no-edit", "main");
    expect(git(repo, "ls-tree", "-r", "--name-only", "HEAD", "--", "seal", "iadd/threads/1-x/guarantee.md", "iadd/threads/1-x/trail/rounds").trim().split("\n")).toEqual([
      "iadd/threads/1-x/guarantee.md",
      "iadd/threads/1-x/trail/rounds/round-1.md",
      "iadd/threads/1-x/trail/rounds/round-2.md",
    ]);
    expect([rootOf(repo), earlierRootOf(repo)]).toEqual(["iadd", null]);
    expect(earlierRecordsSays(repo, "feature")).toBe(
      "This work item's directory iadd/threads/1-x/ holds records in the form the AgenticSeal plugin wrote, which a merge of a base that moved put there. The chain command's `migrate` moves them to IADD's forms in one commit on this branch; run it in the worktree, and commit nothing else with it. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared.",
    );
    expect(earlierRecordsSays(repo, "other")).toBeNull();
    // The guarantee alone names the directory, with the round written in IADD's form for a moment.
    writeFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), round2.replace(`${F}seal`, `${F}iadd`));
    expect(earlierRecordsSays(repo, "feature")).toMatch(/^This work item's directory iadd\/threads\/1-x\/ holds records in the form the AgenticSeal plugin wrote/u);
    writeFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), round2);
    const plan = await planMigration(repo, VERSION);
    // The base's round, which IADD's form already holds, is not part of the move.
    expect([plan.from, plan.blocked, plan.moves, plan.removes, plan.writes]).toEqual([
      null,
      null,
      [
        { from: "iadd/threads/1-x/guarantee.md", to: "iadd/threads/1-x/inspection.md", rewritten: true },
        { from: "iadd/threads/1-x/trail/rounds/round-2.md", to: "iadd/threads/1-x/trail/rounds/round-2.md", rewritten: true },
      ],
      [],
      [],
    ]);
    // A hook that refuses the commit leaves the branch's records as the commit holds them.
    writeFileSync(join(repo, ".git", "hooks", "pre-commit"), "#!/bin/sh\necho 'the hook refuses the move' >&2\nexit 1\n", { mode: 0o755 });
    const before = [head(repo), status(repo)];
    await expect(migrateRecords(repo, VERSION, plan.stamp)).rejects.toThrow("the hook refuses the move");
    expect([head(repo), status(repo)]).toEqual(before);
    expect([readFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), "utf8"), readFileSync(join(repo, "iadd/threads/1-x/guarantee.md"), "utf8")]).toEqual([round2, GUARANTEE]);
    rmSync(join(repo, ".git", "hooks", "pre-commit"));
    await migrateRecords(repo, VERSION, plan.stamp);
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(before[0]);
    expect(status(repo)).toBe("");
    expect(git(repo, "show", "--name-status", "--no-renames", "--format=", "HEAD").trim().split("\n").sort()).toEqual(["A\tiadd/threads/1-x/inspection.md", "D\tiadd/threads/1-x/guarantee.md", "M\tiadd/threads/1-x/trail/rounds/round-2.md"]);
    expect(readFileSync(join(repo, "iadd/threads/1-x/inspection.md"), "utf8")).toBe(INSPECTION);
    expect(readFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), "utf8")).toBe(round2.replace(`${F}seal`, `${F}iadd`));
    expect(readInspection(readFileSync(join(repo, "iadd/threads/1-x/inspection.md"), "utf8")).verdicts.map((verdict) => verdict.is)).toEqual(["withheld", "cleared"]);
    expect(earlierRecordsSays(repo, "feature")).toBeNull();
    expect((await planMigration(repo, VERSION)).blocked).toBe("The commit this checkout stands at holds no work records in the form the AgenticSeal plugin wrote, so there is nothing to move.");
  });

  it("rewrites where it stands a round the branch added in the earlier form under IADD's root, with nothing to remove, and names the directory by that round alone", async () => {
    const repo = earlier();
    git(repo, "checkout", "--quiet", "-b", "feature");
    const round2 = ROUND.replace("round 1", "round 2");
    write(repo, "seal/threads/1-x/trail/rounds/round-2.md", round2);
    commitAll(repo, "chore: record review round 2");
    git(repo, "checkout", "--quiet", "main");
    const base = await planMigration(repo, VERSION);
    await migrateRecords(repo, VERSION, base.stamp);
    git(repo, "checkout", "--quiet", "feature");
    git(repo, "-c", "merge.directoryRenames=true", "merge", "--quiet", "--no-edit", "main");
    expect(earlierRecordsSays(repo, "feature")).toMatch(/^This work item's directory iadd\/threads\/1-x\/ holds records in the form the AgenticSeal plugin wrote/u);
    const plan = await planMigration(repo, VERSION);
    expect([plan.blocked, plan.moves, plan.removes]).toEqual([null, [{ from: "iadd/threads/1-x/trail/rounds/round-2.md", to: "iadd/threads/1-x/trail/rounds/round-2.md", rewritten: true }], []]);
    await migrateRecords(repo, VERSION, plan.stamp);
    expect(status(repo)).toBe("");
    expect(git(repo, "show", "--name-status", "--format=", "HEAD").trim()).toBe("M\tiadd/threads/1-x/trail/rounds/round-2.md");
    expect(readFileSync(join(repo, "iadd/threads/1-x/trail/rounds/round-2.md"), "utf8")).toBe(round2.replace(`${F}seal`, `${F}iadd`));
    expect(earlierRecordsSays(repo, "feature")).toBeNull();
  });

  it("reads a round IADD's form wrote under IADD's root as IADD's, though its prose shows a fence of the earlier form: the chain is not refused and the plan has nothing to move", async () => {
    const repo = earlier();
    const base = await planMigration(repo, VERSION);
    await migrateRecords(repo, VERSION, base.stamp);
    git(repo, "checkout", "--quiet", "-b", "feature");
    const shown = ["# Review round 2: 1-x", "", `${F}iadd`, `target: ${A} against main`, F, "", "A round of the earlier form opened so:", "", `${F}seal`, `target: ${A} against main`, F, "", "## Findings", "", "## Confirmations", ""].join("\n");
    write(repo, "iadd/threads/1-x/trail/rounds/round-2.md", shown);
    commitAll(repo, "chore: record review round 2");
    expect(earlierRecordsSays(repo, "feature")).toBeNull();
    const plan = await planMigration(repo, VERSION);
    expect([plan.blocked, plan.moves]).toEqual(["The commit this checkout stands at holds no work records in the form the AgenticSeal plugin wrote, so there is nothing to move.", []]);
  });

  it("names a worktree whose records stand in an earlier root alone, and reads the heavy commands of that root's config.json and nothing else of it", () => {
    const repo = earlier();
    expect(earlierRecordsSays(repo, "main")).toBe(
      "The worktree's work records stand in seal/, in the form the AgenticSeal plugin wrote, which Owlery reads no record of. The chain command's `migrate` moves them to IADD's forms in one commit on this branch; run it in the worktree, and commit nothing else with it. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared.",
    );
    expect(heavyCommandsOf(repo)).toEqual({ root: "seal", commands: { test: "make test" } });
    expect(readRecordsPlace(repo).broadGate).toBeNull();
    const made = temporaryRepository();
    cleanups.push(made.remove);
    expect([earlierRecordsSays(made.repo, "main"), heavyCommandsOf(made.repo)]).toEqual([null, { root: null, commands: {} }]);
  });
});
