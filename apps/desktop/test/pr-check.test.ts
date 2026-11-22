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

describe("the pull request check", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
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
   */
  const check = (made: { base: string; repo: string }, state: "ready" | "draft"): { exit: number | null; output: string } => {
    const payload = join(made.base, `${state}.json`);
    writeFileSync(payload, JSON.stringify({ pull_request: { draft: state === "draft", body: "hello" } }));
    const run = spawnSync("python3", ["-B", CHAIN_CHECK, "--baseline", "main"], {
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
