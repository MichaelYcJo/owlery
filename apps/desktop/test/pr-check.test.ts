// The pull request check: the scripts under `pr-check/` at the top of the
// repository, which the workflow of a connected repository fetches and runs
// on GitHub. Each case runs the check as that workflow does, with `python3`
// in a temporary repository and a pull request's payload in
// `GITHUB_EVENT_PATH`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { planRecords, setUpRecords } from "../src/daemon/records-place";
import { type Cleanups, proofs, roles, standing } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const CHAIN_CHECK = join(PR_CHECK, "skills", "code-review", "scripts", "chain_check.py");

/** The first line of a records root's `README.md`, which the check tells a root by. */
const MARKER = "# What AgenticSeal maintains in seal/";

/** Writes a file in a repository, with the folders above it. */
function write(repo: string, path: string, text: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
}

/** Commits everything in the folder. A commit of a work item names it in the trailer the check reads. */
function commitAll(repo: string, subject: string, workItem?: string): void {
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", subject, ...(workItem === undefined ? [] : ["-m", `Seal-Routing: ${workItem}`]));
}

/** Commits a records root on the checked-out branch: the marked `README.md`, and a `config.json` that names both languages. */
function commitRoot(repo: string): void {
  write(repo, "seal/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  write(repo, "seal/config.json", `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "true" }, null, 2)}\n`);
  commitAll(repo, "chore: add the place for work records");
}

/** The `routing.md` of a work item that goes through the review chain on a branch. */
function routing(workItem: string, branch: string): string {
  return [
    `# Routing: ${workItem}`,
    "",
    "| Axis | Answer |",
    "|---|---|",
    "| Review | through the review chain |",
    "| Destination | open the pull request |",
    "| Planning | the session |",
    "| Implementation | the session |",
    "| Automation | yes |",
    `| Branch | ${branch} |`,
    "",
    "Answered 2026-11-22 by the session, before the first edit.",
    "",
  ].join("\n");
}

/** A `decisions.md` holding a reversed decision and an open question, each as a `seal` block. */
const DECISIONS = [
  "# Decisions and questions: 1-x",
  "",
  "```seal",
  "decision: 1 route",
  "decided: The work item runs through the review chain, with no framer.",
  "grounds: `docs/roadmap.md` *Milestones* row 2 puts every pull request of a work item under the check.",
  "by: orchestrator",
  "state: reversed",
  "reversal: Frame it first: the change reaches the protocol.",
  "```",
  "",
  "```seal",
  "question: 2",
  "asks: May the run push the branch to `origin`?",
  "grounds: No document of the repository grants it, and a session cannot grant itself a push.",
  "by: sealer",
  "option: `yes` The branch is pushed and the pull request opens.",
  "option: `no` The work item stays on this machine.",
  "default: `yes`",
  "state: open",
  "```",
  "",
].join("\n");

// Each run of the check starts Python and its git, which takes seconds while the rest of the suite runs beside it.
describe("the pull request check", { timeout: 30_000 }, () => {
  const cleanups: Cleanups = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  /** A temporary repository with one commit on `main`, removed when the case ends. */
  const repository = (): { base: string; repo: string } => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made;
  };

  /**
   * Runs the check in the repository against `main`, as a pull request that is
   * ready or a draft. The environment is the few names the run needs and no
   * other, and `-B` keeps Python from writing its bytecode into `pr-check/`.
   * `sealing` runs it as the broad gate's step does, before the sealer has
   * written: what only the later stages write is then printed and not failed.
   * With `body` false the payload holds no body, so the check reads none: the
   * pull request's body is a later stage's.
   */
  const check = (made: { base: string; repo: string }, state: "ready" | "draft", sealing = false, body = true): { exit: number | null; output: string } => {
    const payload = join(made.base, `${state}.json`);
    writeFileSync(payload, JSON.stringify({ pull_request: { draft: state === "draft", ...(body ? { body: "hello" } : {}) } }));
    const run = spawnSync("python3", ["-B", CHAIN_CHECK, "--baseline", "main", ...(sealing ? ["--sealing"] : [])], {
      cwd: made.repo,
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: made.base, GITHUB_EVENT_PATH: payload },
    });
    if (run.error) throw run.error;
    return { exit: run.status, output: `${run.stdout}${run.stderr}` };
  };

  /** A repository with the records root on `main`, and a branch `feature` whose `routing.md` declares a work item through the review chain, with no round record. */
  const declared = (): { base: string; repo: string } => {
    const made = repository();
    commitRoot(made.repo);
    git(made.repo, "checkout", "--quiet", "-b", "feature");
    write(made.repo, "seal/threads/1-x/routing.md", routing("1-x", "feature"));
    write(made.repo, "x", "x\n");
    commitAll(made.repo, "feat: x", "1-x");
    return made;
  };

  it("passes a ready pull request that declares no work item, and says that it examined nothing, in a repository with the records root and in one with none", () => {
    const examinedNothing = "this pull request declared neither way, so the review-chain check examined nothing";

    const withRoot = repository();
    commitRoot(withRoot.repo);
    git(withRoot.repo, "checkout", "--quiet", "-b", "outside");
    write(withRoot.repo, "x", "x\n");
    commitAll(withRoot.repo, "an outside contributor's change");
    const rooted = check(withRoot, "ready");
    expect(rooted.output).toContain(examinedNothing);
    expect(rooted.exit).toBe(0);

    const noRoot = repository();
    git(noRoot.repo, "checkout", "--quiet", "-b", "outside");
    write(noRoot.repo, "x", "x\n");
    commitAll(noRoot.repo, "an outside contributor's change");
    const rootless = check(noRoot, "ready");
    expect(rootless.output).toContain(examinedNothing);
    expect(rootless.exit).toBe(0);
  });

  it("fails a ready pull request whose branch declares a work item through the review chain and holds no round record, names its routing.md, and passes the same pull request as a draft", () => {
    const made = declared();
    const ready = check(made, "ready");
    expect(ready.output).toContain("seal/threads/1-x/routing.md:0  declares `through the review chain` and seal/threads/1-x/trail/rounds/ holds no `round-N.md`");
    expect(ready.exit).toBe(1);
    // The root names both languages, so no refusal is about the root's `config.json`.
    expect(ready.output).not.toContain("config.json");
    expect(check(made, "draft").exit).toBe(0);
  });

  it("reads the root a setup of the records place wrote: a branch that declares a work item with no round record fails as a ready pull request, and no refusal names a key of config.json", async () => {
    const made = repository();
    const plan = await planRecords(made.repo, "true", "1.2.3");
    await setUpRecords(made.repo, "true", "1.2.3", plan.stamp);
    expect(existsSync(join(made.repo, "seal", "config.json"))).toBe(true);
    git(made.repo, "checkout", "--quiet", "-b", "feature");
    write(made.repo, "seal/threads/1-x/routing.md", routing("1-x", "feature"));
    write(made.repo, "x", "x\n");
    commitAll(made.repo, "feat: x", "1-x");
    const ready = check(made, "ready");
    // The check tells the written root by its marker, so it judges the branch its `routing.md` names.
    expect(ready.output).toContain("seal/threads/1-x/routing.md:0  declares `through the review chain` and seal/threads/1-x/trail/rounds/ holds no `round-N.md`");
    expect(ready.exit).toBe(1);
    // The written `config.json` names both languages, so the check refuses nothing of it.
    expect(ready.output).not.toContain("config.json");
    expect(ready.output).not.toContain("language");
  });

  it("passes the records a chain of two rounds and one fix pass left, as the broad gate's step runs it on a ready pull request, and fails the same branch before round 2 for the verifying round it owes", async () => {
    // The first start stops after the fix pass: round 2's proofer answers with no record until the case lets it.
    let verifies = false;
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { roleAdapter: roles({ proofer: (given) => (given.round === 2 && !verifies ? "No record." : proofs(given)) }) });
    const a = workItems[0]!;
    const worktree = { base: join(a.worktree, ".."), repo: a.worktree };
    expect(await c.getSeal(a.id, 1)).toBe("done");
    await c.chain(a.id, "stopped");
    const owed = check(worktree, "ready", true);
    expect(owed.output).toContain("a verifying round is owed");
    expect(owed.exit).toBe(1);

    verifies = true;
    expect(await c.getSeal(a.id, 2)).toBe("done");
    await c.chain(a.id, "reviewed");
    const reviewed = check(worktree, "ready", true);
    expect(reviewed.output).not.toContain("a verifying round is owed");
    expect(reviewed.exit, reviewed.output).toBe(0);
    // Without the broad gate's flag the same records fail on what the later stages write, and on nothing of a round.
    const ready = check(worktree, "ready");
    expect(ready.exit).toBe(1);
    expect(ready.output).not.toContain("round-");
  });

  /**
   * The branch `declared` makes, after one round that left no finding: the
   * round's record, committed, and the gate's commit, which is the head that
   * record leaves. Nothing of the gate or the seal is written.
   */
  const reviewed = (): { base: string; repo: string; gate: string } => {
    const made = declared();
    const target = git(made.repo, "rev-parse", "HEAD").trim();
    write(made.repo, "seal/threads/1-x/trail/rounds/round-1.md", ["# Review round 1: 1-x", "", "```seal", `target: ${target} against main`, "```", "", "## Findings", "", "## Confirmations", ""].join("\n"));
    commitAll(made.repo, "chore: record review round 1", "1-x");
    return { ...made, gate: git(made.repo, "rev-parse", "HEAD").trim() };
  };

  /** Commits the gate's record as the daemon writes it: one run block that names the gate's commit against the base's commit. */
  const gated = (made: { repo: string; gate: string }): void => {
    write(made.repo, "seal/threads/1-x/trail/gate.md", ["# Broad gate: 1-x", "", "```seal", `run: ${made.gate} against ${git(made.repo, "rev-parse", "main").trim()}`, "```", ""].join("\n"));
    commitAll(made.repo, "chore: record the broad gate's run", "1-x");
  };

  /** One run's section of a guarantee: its heading, and a verdict block that targets the gate's commit and holds the lines given after its verdict. */
  const section = (run: number, gate: string, ...lines: string[]): string => [`## Run ${String(run)}`, "", "```seal", `target: ${gate} against main`, "Verdict: sealed", ...lines, "```", ""].join("\n");

  /** Commits a guarantee of the sections given, with whatever else the case wrote. */
  const guaranteed = (made: { repo: string }, ...sections: string[]): void => {
    write(made.repo, "seal/threads/1-x/guarantee.md", ["# Guarantee: 1-x", "", sections.join("\n")].join("\n"));
    commitAll(made.repo, "chore: record the sealer's verdict", "1-x");
  };

  const REFUSED_CALLS = ["# Refused calls: 1-x", "", "| Stage | Role | Tool | What the call does | Rule |", "|---|---|---|---|---|", "| seal 1 | sealer | Write | writes a file | no-write |", ""].join("\n");
  const DAEMONS_LINES = ["built-by: the session, s-1", "judged-by: s-2", "model: owl-large", "rules: owlery 0.0.2"];

  it("passes the gate's record and the seal as the daemon writes them: a run block that names the head, then a verdict block with the lines on who built and who judged that targets the same commit, in a commit that also carries trail/refusals.md, and fails where that commit carries another file of the work item", () => {
    const made = reviewed();
    gated(made);
    write(made.repo, "seal/threads/1-x/trail/refusals.md", REFUSED_CALLS);
    guaranteed(made, section(1, made.gate, ...DAEMONS_LINES));
    const sealed = check(made, "ready", false, false);
    expect(sealed.exit, sealed.output).toBe(0);
    expect(sealed.output).not.toContain("guarantee.md");

    // Only the closing records follow the sealed commit: a decision committed after it leaves the guarantee behind the head.
    write(made.repo, "seal/threads/1-x/decisions.md", DECISIONS);
    commitAll(made.repo, "chore: record a decision and a question", "1-x");
    const behind = check(made, "ready", false, false);
    expect(behind.output).toContain("seal/threads/1-x/guarantee.md:0  the guarantee is behind HEAD:");
    expect(behind.output).toContain("touches `seal/threads/1-x/decisions.md`, outside the closing records; the sealer runs again");
    expect(behind.exit).toBe(1);
  });

  it("refuses a verdict block whose judge is one of its builders, at the judged-by line, and reads the newest block alone: a judge that built none of the work passes, and so does a block that names no builder", () => {
    const made = reviewed();
    gated(made);
    guaranteed(made, section(1, made.gate, "built-by: the session, s-1", "judged-by: s-1", "model: owl-large", "rules: owlery 0.0.2"));
    const same = check(made, "ready", false, false);
    // The file's heading, a blank line, the run's heading and a blank line stand above the block, whose fourth line names the judge.
    expect(same.output).toContain(
      "seal/threads/1-x/guarantee.md:9  `judged-by: s-1` names a session that the block's `built-by:` line names too: the session that judges a work item built none of it, so this verdict block is no seal",
    );
    expect(same.exit).toBe(1);

    // The judge is found wherever the line names it, before `the session` too.
    guaranteed(made, section(1, made.gate, "built-by: s-1, the session", "judged-by: s-1"));
    const first = check(made, "ready", false, false);
    expect(first.output).toContain("seal/threads/1-x/guarantee.md:9  `judged-by: s-1` names a session");
    expect(first.exit).toBe(1);

    // A second run by another session: the first block still stands above it, and only the newest is read for its judge.
    guaranteed(made, section(1, made.gate, "built-by: the session, s-1", "judged-by: s-1", "model: owl-large", "rules: owlery 0.0.2"), section(2, made.gate, "built-by: the session, s-1", "judged-by: s-2", "model: owl-large", "rules: owlery 0.0.2"));
    const other = check(made, "ready", false, false);
    expect(other.output).not.toContain("judged-by");
    expect(other.exit, other.output).toBe(0);

    // A block written before the daemon wrote its lines names no builder and no judge, and one that names a judge alone has nothing to compare.
    guaranteed(made, section(1, made.gate), section(2, made.gate, "judged-by: s-1"));
    expect(check(made, "ready", false, false).exit).toBe(0);
    // `the session` is a builder's name and no id: a judge's id that is a part of a builder's is another session.
    guaranteed(made, section(1, made.gate, "built-by: the session, s-10", "judged-by: s-1"));
    expect(check(made, "ready", false, false).exit).toBe(0);
  });

  it("says of a missing gate record, of one with no run, of a missing guarantee and of one with no verdict what Owlery's daemon writes, and names no command and no template of AgenticSeal", () => {
    const made = reviewed();
    const none = check(made, "ready", false, false);
    expect(none.exit).toBe(1);
    expect(none.output).toContain(
      "seal/threads/1-x/trail/gate.md:0  git carries no gate record: once the review rounds settle, Owlery's daemon runs the repository's broad gate on the branch's head and commits this record where the run passes",
    );
    expect(none.output).toContain("seal/threads/1-x/guarantee.md:0  git carries no guarantee file: the sealer's stage of Owlery's daemon writes it once the broad gate has passed on the branch's head");

    write(made.repo, "seal/threads/1-x/trail/gate.md", "# Broad gate: 1-x\n\nThe run passed.\n");
    write(made.repo, "seal/threads/1-x/guarantee.md", "# Guarantee: 1-x\n\nVerdict: sealed\n");
    commitAll(made.repo, "chore: write both records with no block", "1-x");
    const empty = check(made, "ready", false, false);
    expect(empty.exit).toBe(1);
    expect(empty.output).toContain(
      "seal/threads/1-x/trail/gate.md:0  no run block: a passed run of the broad gate stands in a `seal` block holding `run: <tree> against <base commit>`, which Owlery's daemon appends below the text already there",
    );
    expect(empty.output).toContain(
      "seal/threads/1-x/guarantee.md:0  no verdict block: the sealer's verdict stands in a `seal` block holding `target: <sha> against <base>`, the `original:` line where one is owed and `Verdict:`, which the sealer's stage of Owlery's daemon appends below the text already there once the broad gate has passed on the branch's head",
    );
    for (const said of [none.output, empty.output]) for (const word of ["seal gate", "orchestrator", "templates/", "#1198"]) expect(said, word).not.toContain(word);
  });

  it("does not read decisions.md: a reversed decision and an open question in the work item's directory change neither its exit nor its output", () => {
    const made = declared();
    const before = check(made, "ready");
    expect(before.exit).toBe(1);
    write(made.repo, "seal/threads/1-x/decisions.md", DECISIONS);
    commitAll(made.repo, "chore: record a decision and a question", "1-x");
    const after = check(made, "ready");
    expect(after.output).not.toContain("decisions.md");
    expect(after).toEqual(before);
  });
});

describe("the pr-check folder", () => {
  const read = (path: string): string => readFileSync(join(PR_CHECK, path), "utf8");

  it("holds every script chain_check.py loads, each at the path the check reaches it by", () => {
    const scripts = [
      ...["sibling", "lines", "blocks", "fields", "gitcmd", "optin", "console", "config", "gate", "routing", "tables", "items", "gaps"].map((name) => `lib/${name}.py`),
      "skills/code-review/scripts/chain_check.py",
      "skills/code-review/scripts/pr_body.py",
      "skills/settle/scripts/rule_changes.py",
      "skills/settle/scripts/passages.py",
      ".github/scripts/rules.py",
      ".github/scripts/close_issues_on_release.py",
    ];
    expect(scripts.filter((script) => !existsSync(join(PR_CHECK, script)))).toEqual([]);
    // The marker the cases above write is the one the taken check tells a records root by.
    expect(read("lib/optin.py")).toContain(`\nMARKER = ${JSON.stringify(MARKER)}\n`);
  });

  it("keeps AgenticSeal's licence text beside the scripts, and its notice names where they started, the release and the licence", () => {
    const licence = read("LICENSE");
    expect(licence.startsWith("MIT License\n")).toBe(true);
    expect(licence).toContain("\nCopyright (c) 2026 AgenticSeal contributors\n");
    expect(licence).toContain("The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.");
    const notice = read("README.md");
    for (const named of ["AgenticSeal", "https://github.com/MichaelYcJo/AgenticSeal", "0.38.4", "MIT License", "`LICENSE`"]) expect(notice, named).toContain(named);
  });
});
