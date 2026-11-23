// The pull request stage's parts that read no daemon: the remote the branch
// is pushed to, the base and the title the pull request is opened with, the
// body composed from the records the head commit holds, and the seal
// section replaced in a body a person may have edited. Each case runs on a
// temporary repository, and none reaches a remote.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { OPEN_PULL_REQUEST, pullRequestOwed } from "../src/daemon/chain";
import { BODY_LIMIT, CHECKS_KEPT, SECTION_CLOSE, SECTION_OPEN, bodyRecords, checksOf, openPullRequests, pullRequestBody, pullRequestTitle, pushBranch, pushTarget, withSealSection } from "../src/daemon/github";
import { type Cleanups, bareRemote, commitAll, write } from "./chain-run";
import type { PullRequest } from "../src/shared/protocol";
import { git, runs, temporaryClone, temporaryRepository } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** A temporary repository, removed when the case ends. */
function repository(): { base: string; repo: string } {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  return made;
}

/** The reason a promise was refused with, or the text "fulfilled". */
async function refusal(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return "fulfilled";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe("whether a sealed chain owes the pull request stage", () => {
  const HEAD = "c".repeat(40);
  const stored = (state: PullRequest["state"], pushed = HEAD): PullRequest => ({ number: 3, url: "https://github.com/owner/project/pull/3", state, head: pushed, pushed, checks: "none", list: [], listCount: 0, readAt: 1, failure: null });

  it("owes it where the routing opens the pull request and no pull request is stored, the stored one is closed, or the stored one is open and was pushed at another commit than the head", () => {
    expect(OPEN_PULL_REQUEST).toBe("open the pull request");
    expect(pullRequestOwed(OPEN_PULL_REQUEST, null, HEAD)).toBe(true);
    expect(pullRequestOwed(OPEN_PULL_REQUEST, stored("closed"), HEAD)).toBe(true);
    expect(pullRequestOwed(OPEN_PULL_REQUEST, stored("open", "d".repeat(40)), HEAD)).toBe(true);
  });

  it("owes nothing where the routing stops before the pull request or names no destination, where the stored pull request merged, and where the open one was pushed at the head", () => {
    for (const destination of ["stop before the pull request", null, "Open the pull request"]) expect(pullRequestOwed(destination, null, HEAD), String(destination)).toBe(false);
    expect(pullRequestOwed(OPEN_PULL_REQUEST, stored("merged", "d".repeat(40)), HEAD)).toBe(false);
    expect(pullRequestOwed(OPEN_PULL_REQUEST, stored("open"), HEAD)).toBe(false);
  });
});

describe("a call of gh past its time limit", () => {
  /** A stand-in for gh in the repository's folder that runs the shell's lines given, and the call made of it with a limit of 1.5 seconds, which leaves a busy machine the time to start the shell. */
  const calling = (made: { base: string; repo: string }, lines: string): Promise<unknown> => {
    const gh = join(made.base, "gh");
    writeFileSync(gh, `#!/bin/sh\n${lines}\n`, { mode: 0o755 });
    return openPullRequests({ gh: [gh], env: { PATH: process.env.PATH ?? "/usr/bin:/bin" }, cwd: made.repo, limitMs: 1500 }, "feature");
  };

  it("is ended by a signal to its process group, which reaches what it started, and is killed 2 seconds after the signal where it ignores it", async () => {
    const made = repository();
    const child = join(made.base, "child");
    let began = Date.now();
    expect(await refusal(calling(made, `sleep 30 & echo $! > '${child}'; wait`))).toBe("gh pr list did not end within 1.5 seconds and was stopped");
    // The kill would come 2 seconds after the signal.
    expect(Date.now() - began).toBeLessThan(3200);
    // The shell's own child had the signal too, and is gone.
    const pid = Number(readFileSync(child, "utf8").trim());
    const end = Date.now() + 2000;
    while (runs(pid) && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    expect(runs(pid)).toBe(false);
    began = Date.now();
    expect(await refusal(calling(made, 'trap "" TERM; exec sleep 30'))).toBe("gh pr list did not end within 1.5 seconds and was stopped");
    expect(Date.now() - began).toBeGreaterThanOrEqual(3500);
    expect(Date.now() - began).toBeLessThan(10_000);
  });
});

describe("where the branch goes", () => {
  it("pushes to the remote of a base on a remote and opens against that branch's name there, pushes to the one remote of a clone whose base is local and opens against the local branch's name, and names no base where the work item has none", async () => {
    const clone = temporaryClone();
    cleanups.push(clone.remove);
    expect(await pushTarget(clone.repo, "origin/main")).toEqual({ remote: "origin", base: "main" });
    // The clone's one remote is taken whatever its name, and a local base is named as it is.
    const made = repository();
    bareRemote(made.base, made.repo, "fork");
    expect(await pushTarget(made.repo, "main")).toEqual({ remote: "fork", base: "main" });
    expect(await pushTarget(made.repo, null)).toEqual({ remote: "fork", base: null });
    // A remote's branch whose name holds a slash keeps it after the remote's name.
    git(made.repo, "push", "--quiet", "fork", "main:refs/heads/release/v1");
    git(made.repo, "fetch", "--quiet", "fork");
    expect(await pushTarget(made.repo, "fork/release/v1")).toEqual({ remote: "fork", base: "release/v1" });
  });

  it("takes origin among several remotes where the base is on none of them, and refuses a clone with several remotes and no origin, and a clone with none, saying why", async () => {
    const made = repository();
    expect(await refusal(pushTarget(made.repo, "main"))).toBe("the clone has no remote to push the branch to");
    bareRemote(made.base, made.repo, "upstream");
    bareRemote(made.base, made.repo, "fork");
    expect(await refusal(pushTarget(made.repo, "main"))).toBe("the clone has the remotes fork and upstream, none of them named origin, and the work item's base branch main is on none of them, so Owlery cannot tell which to push to");
    expect(await refusal(pushTarget(made.repo, null))).toBe("the clone has the remotes fork and upstream, none of them named origin, and the work item has no base branch, so Owlery cannot tell which to push to");
    bareRemote(made.base, made.repo, "origin");
    expect(await pushTarget(made.repo, "main")).toEqual({ remote: "origin", base: "main" });
  });

  it("pushes the commit it is given, by its id, and not a commit that landed on the branch after it, and writes the branch's upstream", async () => {
    const made = repository();
    const bare = bareRemote(made.base, made.repo);
    git(made.repo, "switch", "--quiet", "-c", "feat");
    write(made.repo, "a.txt", "a\n");
    const read = commitAll(made.repo, "feat: greet the person");
    // A commit that lands after the stage read the head.
    write(made.repo, "b.txt", "b\n");
    const later = commitAll(made.repo, "feat: a later change");
    await pushBranch({ gh: ["gh"], env: { PATH: process.env.PATH ?? "/usr/bin:/bin" }, cwd: made.repo, limitMs: 20_000 }, "origin", "feat", read);
    expect(git(bare, "rev-parse", "refs/heads/feat").trim()).toBe(read);
    expect(git(made.repo, "rev-parse", "HEAD").trim()).toBe(later);
    expect([git(made.repo, "config", "branch.feat.remote").trim(), git(made.repo, "config", "branch.feat.merge").trim()]).toEqual(["origin", "refs/heads/feat"]);
    // A config git cannot write fails the push's step, though the commit reached the remote.
    git(made.repo, "branch", "--quiet", "feat-2", later);
    writeFileSync(join(made.repo, ".git", "config.lock"), "");
    expect(await refusal(pushBranch({ gh: ["gh"], env: { PATH: process.env.PATH ?? "/usr/bin:/bin" }, cwd: made.repo, limitMs: 20_000 }, "origin", "feat-2", later))).toMatch(/^git config branch\.feat-2\.remote exited with code \d+: /u);
    expect(git(bare, "rev-parse", "refs/heads/feat-2").trim()).toBe(later);
  });

  it("titles the pull request with the work item's title, cut at 256 characters, and with the subject of the oldest commit after the base where the title is empty", async () => {
    const made = repository();
    const base = git(made.repo, "rev-parse", "HEAD").trim();
    write(made.repo, "a.txt", "a\n");
    commitAll(made.repo, "feat: greet the person");
    write(made.repo, "b.txt", "b\n");
    const head = commitAll(made.repo, "fix: end the greeting");
    expect(await pullRequestTitle(made.repo, "Greet the person", base, head)).toBe("Greet the person");
    expect(await pullRequestTitle(made.repo, "", base, head)).toBe("feat: greet the person");
    expect(await pullRequestTitle(made.repo, "   ", base, head)).toBe("feat: greet the person");
    const long = `${"한".repeat(250)}${"x".repeat(20)}`;
    expect(await pullRequestTitle(made.repo, long, base, head)).toBe(`${"한".repeat(250)}${"x".repeat(6)}`);
  });
});

const NAME = "1-x";
const DIRECTORY = `seal/threads/${NAME}`;
const GATE = "a".repeat(40);
const OLDER = "b".repeat(40);
const BASE = "c".repeat(40);

/** A verdict block's lines between its fences, sealing the gate's commit. */
const BLOCK = [`target: ${GATE} against main`, "Verdict: sealed", "built-by: the session, s-1", "judged-by: s-2", "model: fake", "rules: owlery 0.0.2"];

/** The seal section the composer writes for `BLOCK`. */
const SECTION = [SECTION_OPEN, "## Owlery seal", "", `The newest verdict of \`${DIRECTORY}/guarantee.md\`, as this pull request's head commit holds it:`, "", "```seal", ...BLOCK, "```", SECTION_CLOSE].join("\n");

/** A round record with one finding closed by the verdict given, or with none. */
function round(number: number, closed: string | null): string {
  const lines = [`# Review round ${String(number)}: ${NAME}`, "", "```seal", `target: ${GATE} against main`, "```", "", "## Findings", ""];
  if (closed !== null) lines.push("### 1. The greeting misses its full stop.", "", "```seal", "severity: must", "location: `feature.txt:1`", "evidence: read `feature.txt:1`", "```", "", "Why it matters: it reads as cut off.", "", "```seal", `verdict: ${closed}`, "answer: The greeting ends with a full stop.", "```", "");
  return lines.join("\n");
}

/** Commits a work item's records as a sealed chain leaves them, with the changelog's text and the decisions given where each is given, and gives the head. */
function records(made: { repo: string }, parts: { changelog?: string; decisions?: string; guarantee?: string } = {}): string {
  write(made.repo, `${DIRECTORY}/routing.md`, "# Routing\n");
  if (parts.changelog !== undefined) write(made.repo, `${DIRECTORY}/changelog.md`, parts.changelog);
  write(made.repo, `${DIRECTORY}/trail/rounds/round-1.md`, round(1, `fixed ${OLDER.slice(0, 7)}`));
  write(made.repo, `${DIRECTORY}/trail/rounds/round-2.md`, round(2, null));
  write(made.repo, `${DIRECTORY}/trail/gate.md`, [`# Broad gate: ${NAME}`, "", "```seal", `run: ${OLDER} against ${BASE}`, "```", "", "```seal", `run: ${GATE} against ${BASE}`, "```", ""].join("\n"));
  if (parts.decisions !== undefined) write(made.repo, `${DIRECTORY}/decisions.md`, parts.decisions);
  write(made.repo, `${DIRECTORY}/guarantee.md`, parts.guarantee ?? [`# Guarantee: ${NAME}`, "", "## Run 1", "", "```seal", `target: ${OLDER} against main`, "Verdict: withheld reason: The suite failed.", "```", "", "## Run 2", "", "Read the records.", "", "```seal", ...BLOCK, "```", ""].join("\n"));
  return commitAll(made.repo, "chore: record the sealer's verdict");
}

const DECISIONS = [
  `# Decisions and questions: ${NAME}`,
  "",
  "```seal",
  "decision: 1 route",
  "decided: The work item runs through the review chain.",
  "grounds: The routing reads so.",
  "by: orchestrator",
  "state: decided",
  "```",
  "",
  "```seal",
  "decision: 2 default",
  "decided: The base is main.",
  "grounds: The repository names no other.",
  "state: reversed",
  "reversal: Start from the release branch.",
  "```",
  "",
].join("\n");

/** The body's parts below the seal section, as the composer writes them for `records` with a changelog and `DECISIONS`. */
const CHANGED = ["## What changed", "", "- The greeting ends with a full stop."].join("\n");
const ROUNDS = ["## Review rounds", "", `### \`${DIRECTORY}/trail/rounds/round-1.md\``, "", "- Finding 1: The greeting misses its full stop (fixed)", "", `### \`${DIRECTORY}/trail/rounds/round-2.md\``, "", "No finding."].join("\n");
const GATE_PART = ["## Broad gate", "", "```seal", `run: ${GATE} against ${BASE}`, "```"].join("\n");
const DECIDED = ["## Decided without asking", "", "- Decided: The work item runs through the review chain.", "  Grounds: The routing reads so.", "  State: decided", "- Decided: The base is main.", "  Grounds: The repository names no other.", "  State: reversed"].join("\n");

/** The line that stands for a part the limit took, under its heading. */
const held = (heading: string, path: string): string => `${heading}\n\n\`${DIRECTORY}/${path}\` holds this part.`;

describe("the body of a pull request", () => {
  it("opens with the seal section, which copies the newest verdict block of guarantee.md line for line, then holds the changelog, each round record's findings with their closes, the newest run of the broad gate and each decision, in that order, each under its heading", async () => {
    const made = repository();
    const head = records(made, { changelog: "- The greeting ends with a full stop.\n", decisions: DECISIONS });
    const body = pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY));
    expect(body).toBe(`${[SECTION, CHANGED, ROUNDS, GATE_PART, DECIDED].join("\n\n")}\n`);
    expect(body.split(`${SECTION_OPEN}\n`)).toHaveLength(2);
  });

  it("leaves out a part whose record does not stand: no changelog and no record of decisions", async () => {
    const made = repository();
    const head = records(made);
    expect(pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY))).toBe(`${[SECTION, ROUNDS, GATE_PART].join("\n\n")}\n`);
  });

  it("reads the records as the head commit holds them, and not as the worktree holds them", async () => {
    const made = repository();
    const head = records(made, { changelog: "- The greeting ends with a full stop.\n" });
    write(made.repo, `${DIRECTORY}/changelog.md`, "- A line no commit holds.\n");
    write(made.repo, `${DIRECTORY}/decisions.md`, DECISIONS);
    expect(pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY))).toBe(`${[SECTION, CHANGED, ROUNDS, GATE_PART].join("\n\n")}\n`);
  });

  it("lists the round records in the order of their rounds, round 10 after round 2, though git lists its file first", async () => {
    const made = repository();
    records(made);
    write(made.repo, `${DIRECTORY}/trail/rounds/round-10.md`, round(10, null));
    const head = commitAll(made.repo, "chore: record review round 10");
    expect((await bodyRecords(made.repo, head, DIRECTORY)).rounds.map(({ path }) => path.slice(path.lastIndexOf("/") + 1))).toEqual(["round-1.md", "round-2.md", "round-10.md"]);
  });

  it("refuses records whose guarantee holds no verdict block", async () => {
    const made = repository();
    const head = records(made, { guarantee: `# Guarantee: ${NAME}\n\nNo verdict yet.\n` });
    expect(await refusal(bodyRecords(made.repo, head, DIRECTORY))).toBe(`${DIRECTORY}/guarantee.md holds no verdict block at the head commit`);
  });

  it("replaces a part whose text holds a marker line by the line that names its record, whatever the body's length, so the body holds one opening and one closing marker", async () => {
    const made = repository();
    const changelog = ["- The body opens with the seal section:", "", "```", SECTION_OPEN, "## Owlery seal", `  ${SECTION_CLOSE}  `, "```", ""].join("\n");
    const head = records(made, { changelog, decisions: DECISIONS });
    const body = pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY), 1_000_000);
    expect(body).toBe(`${[SECTION, held("## What changed", "changelog.md"), ROUNDS, GATE_PART, DECIDED].join("\n\n")}\n`);
    const lines = body.split("\n").map((line) => line.trim());
    expect([lines.filter((line) => line === SECTION_OPEN).length, lines.filter((line) => line === SECTION_CLOSE).length]).toEqual([1, 1]);
    // A closing marker alone, with white space at its ends, is a marker line too.
    const closing = records(made, { changelog: `- The section ends at:\n\n\t${SECTION_CLOSE} \n` });
    expect(pullRequestBody(await bodyRecords(made.repo, closing, DIRECTORY), 1_000_000)).toBe(`${[SECTION, held("## What changed", "changelog.md"), ROUNDS, GATE_PART, DECIDED].join("\n\n")}\n`);
  });

  it("replaces the parts below the seal section, the last first, by a line that names each part's record, until the body is within the limit, and never cuts the seal section", async () => {
    const made = repository();
    const changelog = `${"- A line of the changelog.\n".repeat(3000)}`;
    const head = records(made, { changelog, decisions: DECISIONS });
    const read = await bodyRecords(made.repo, head, DIRECTORY);
    const whole = pullRequestBody(read, 1_000_000);
    expect(whole.length).toBeGreaterThan(BODY_LIMIT);
    // The changelog alone passes the limit, so every part is replaced, the decisions first and the changelog last.
    const folded = pullRequestBody(read);
    expect(folded).toBe(`${[SECTION, held("## What changed", "changelog.md"), held("## Review rounds", "trail/rounds"), held("## Broad gate", "trail/gate.md"), held("## Decided without asking", "decisions.md")].join("\n\n")}\n`);
    // A limit that takes the decisions alone replaces them and leaves the rest.
    const all = pullRequestBody(read, 1_000_000);
    const fewer = pullRequestBody(read, all.length - 1);
    expect(fewer).toBe(`${[SECTION, `## What changed\n\n${changelog.trimEnd()}`, ROUNDS, GATE_PART, held("## Decided without asking", "decisions.md")].join("\n\n")}\n`);
    expect(fewer.length).toBeLessThanOrEqual(all.length - 1);
    // The length is counted in UTF-16 code units, as GitHub counts a body's characters.
    const wide = pullRequestBody(read, SECTION.length + 1);
    expect(wide.startsWith(`${SECTION}\n`)).toBe(true);
  });
});

describe("the seal section of a body a person may have edited", () => {
  const OLD = [SECTION_OPEN, "## Owlery seal", "", "```seal", `target: ${OLDER} against main`, "Verdict: sealed", "```", SECTION_CLOSE];

  it("replaces the lines from the opening marker to the closing marker and changes no other line, with the lines ended as the body ends them", () => {
    for (const end of ["\n", "\r\n"]) {
      const body = ["A person's line above.", "", ...OLD, "", "A person's line below, with `<!-- a comment -->` in it.", ""].join(end);
      expect(withSealSection(body, SECTION)).toBe(["A person's line above.", "", ...SECTION.split("\n"), "", "A person's line below, with `<!-- a comment -->` in it.", ""].join(end));
    }
    // A marker is read with the white space at its ends.
    expect(withSealSection(`  ${SECTION_OPEN} \nold\n${SECTION_CLOSE}\t\nbelow`, SECTION)).toBe(`${SECTION}\nbelow`);
  });

  it("puts the section before the body's first line where the body holds no marker line, and is the section alone for an empty body", () => {
    expect(withSealSection("A person's body.\n", SECTION)).toBe(`${SECTION}\n\nA person's body.\n`);
    expect(withSealSection("", SECTION)).toBe(`${SECTION}\n`);
  });

  it("refuses a body with two opening markers, with two closing markers, with an opening marker and no closing one after it, and with a closing marker alone, saying which", () => {
    const refused = (body: string): string => {
      try {
        withSealSection(body, SECTION);
        return "replaced";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    expect(refused([...OLD, ...OLD].join("\n"))).toBe(`the body holds 2 \`${SECTION_OPEN}\` lines, and Owlery replaces one seal section`);
    expect(refused([SECTION_OPEN, "x", SECTION_CLOSE, SECTION_CLOSE].join("\n"))).toBe(`the body holds 2 \`${SECTION_CLOSE}\` lines, and Owlery replaces one seal section`);
    expect(refused([SECTION_OPEN, "x"].join("\n"))).toBe(`the body holds no \`${SECTION_CLOSE}\` line after its \`${SECTION_OPEN}\` line, so Owlery cannot tell where its seal section ends`);
    expect(refused([SECTION_CLOSE, "x", SECTION_OPEN].join("\n"))).toBe(`the body holds no \`${SECTION_CLOSE}\` line after its \`${SECTION_OPEN}\` line, so Owlery cannot tell where its seal section ends`);
    expect(refused(["x", SECTION_CLOSE].join("\n"))).toBe(`the body holds no \`${SECTION_CLOSE}\` line after its \`${SECTION_OPEN}\` line, so Owlery cannot tell where its seal section ends`);
  });
});

describe("the checks of a pull request, as gh pr view's statusCheckRollup gives them", () => {
  const run = (name: string, status: string, conclusion: string | null = null) => ({ __typename: "CheckRun", name, status, conclusion, detailsUrl: `https://github.com/owner/project/runs/${name}`, workflowName: "seal" });
  const context = (name: string, state: string) => ({ __typename: "StatusContext", context: name, state, targetUrl: `https://ci.example/${name}` });

  it("reads a check run as pending until it completes, then passed for success, neutral and skipped, and failed for every other conclusion", () => {
    for (const status of ["QUEUED", "IN_PROGRESS", "WAITING", "PENDING", "REQUESTED"]) expect(checksOf([run("build", status)]).list, status).toEqual([{ name: "build", state: "pending", link: "https://github.com/owner/project/runs/build" }]);
    for (const conclusion of ["SUCCESS", "NEUTRAL", "SKIPPED"]) expect(checksOf([run("build", "COMPLETED", conclusion)]).list[0]?.state, conclusion).toBe("passed");
    for (const conclusion of ["FAILURE", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE", "STALE", null]) expect(checksOf([run("build", "COMPLETED", conclusion)]).list[0]?.state, String(conclusion)).toBe("failed");
  });

  it("reads a status context as pending for pending and expected, passed for success, and failed for every other state, named by its context", () => {
    for (const state of ["PENDING", "EXPECTED"]) expect(checksOf([context("ci/lint", state)]).list, state).toEqual([{ name: "ci/lint", state: "pending", link: "https://ci.example/ci/lint" }]);
    expect(checksOf([context("ci/lint", "SUCCESS")]).list[0]?.state).toBe("passed");
    for (const state of ["FAILURE", "ERROR", "SOMETHING_NEW"]) expect(checksOf([context("ci/lint", state)]).list[0]?.state, state).toBe("failed");
  });

  it("gives the pull request no check for an empty list, failed where one check failed, pending where none failed and one is pending, and passed otherwise", () => {
    expect(checksOf([])).toEqual({ checks: "none", list: [], listCount: 0 });
    expect(checksOf([run("a", "COMPLETED", "SUCCESS"), context("b", "SUCCESS")]).checks).toBe("passed");
    expect(checksOf([run("a", "COMPLETED", "SUCCESS"), run("b", "IN_PROGRESS")]).checks).toBe("pending");
    expect(checksOf([run("a", "IN_PROGRESS"), context("b", "FAILURE"), run("c", "COMPLETED", "SUCCESS")]).checks).toBe("failed");
  });

  it("keeps an entry it cannot read as a failed check named by its place in the list, with no link, and reads the others", () => {
    const read = checksOf([run("build", "COMPLETED", "SUCCESS"), "a line", null, { __typename: "CheckRun", status: "COMPLETED", conclusion: "SUCCESS" }, { __typename: "StatusContext", context: "ci/x" }, { __typename: "Something", name: "x" }]);
    expect(read.list).toEqual([
      { name: "Check 2", state: "failed", link: null },
      { name: "Check 3", state: "failed", link: null },
      { name: "Check 4", state: "failed", link: null },
      { name: "Check 5", state: "failed", link: null },
      { name: "Check 6", state: "failed", link: null },
      { name: "build", state: "passed", link: "https://github.com/owner/project/runs/build" },
    ]);
    expect(read.checks).toBe("failed");
    // A link that is not text is none.
    expect(checksOf([{ ...run("build", "COMPLETED", "SUCCESS"), detailsUrl: 3 }]).list).toEqual([{ name: "build", state: "passed", link: null }]);
  });

  it(`keeps ${String(CHECKS_KEPT)} checks at most and counts them all, the failed ones first and the pending ones next, each kind in the order GitHub lists them`, () => {
    expect(CHECKS_KEPT).toBe(50);
    const rollup = [...Array.from({ length: 60 }, (_, index) => run(`passed-${String(index)}`, "COMPLETED", "SUCCESS")), run("pending-1", "IN_PROGRESS"), context("failed-1", "FAILURE"), run("failed-2", "COMPLETED", "FAILURE")];
    const read = checksOf(rollup);
    expect(read.listCount).toBe(63);
    expect(read.list).toHaveLength(50);
    expect(read.list.slice(0, 4).map(({ name }) => name)).toEqual(["failed-1", "failed-2", "pending-1", "passed-0"]);
    expect(read.list.at(-1)?.name).toBe("passed-46");
  });
});
