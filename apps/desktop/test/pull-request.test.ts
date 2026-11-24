// The pull request stage's parts that read no daemon: the remote the branch
// is pushed to, the base and the title the pull request is opened with, the
// body composed from the records the head commit holds and the back of the
// seal, and the seal section and the back's section replaced in a body a
// person may have edited. Each case runs on a temporary repository, and none
// reaches a remote.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { OPEN_PULL_REQUEST, pullRequestOwed } from "../src/daemon/chain";
import { BACK_CLOSE, BACK_OPEN, BODY_LIMIT, CHECKS_KEPT, SECTION_CLOSE, SECTION_OPEN, backSection, bodyRecords, checksOf, openPullRequests, pullRequestBody, pullRequestTitle, pushBranch, pushTarget, withBackSection, withSealSection } from "../src/daemon/github";
import { type Cleanups, bareRemote, commitAll, write } from "./chain-run";
import type { BackFinding, ChainStageKind, LedgerEntry, PullRequest, SealRecords } from "../src/shared/protocol";
import { composeBack } from "../src/shared/seal-back";
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
const SECTION = [SECTION_OPEN, "## Seal", "", `The newest verdict of \`${DIRECTORY}/guarantee.md\`. A seal binds the commit it names, and the check \`seal\` says whether it holds at this pull request's head commit:`, "", "```seal", ...BLOCK, "```", SECTION_CLOSE].join("\n");

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

/** One ledger entry of the chain's stage given, that took the minutes given and cost what is given, converted, with one model's tokens, or that reported no usage where the cost is null. */
function entry(kind: ChainStageKind, round: number, minutes: number, cost: number | null, more: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    workItemId: 1,
    repo: "/repo",
    branch: "feat",
    stage: kind === "gate" ? { role: null, stage: "gate" } : null,
    chain: { kind, round },
    startedAt: 0,
    endedAt: minutes * 60_000,
    state: "finished",
    stopped: null,
    usage: cost === null ? null : { costUsd: cost, converted: true, models: [{ model: "fake", inputTokens: 12_300, outputTokens: 2_100, cacheReadTokens: 48_000, cacheWriteTokens: 9_200, costUsd: cost }] },
    ...more,
  };
}

/** The ledger's entries of a chain of two rounds and one fix pass, then the broad gate and the sealer. */
const ENTRIES = [entry("round", 1, 4, 0.28), entry("fix-pass", 1, 6, 0.41), entry("round", 2, 3, 0.19), entry("gate", 2, 2, null), entry("seal", 2, 3, 0.22)];

/** Round 1's finding, closed by a fix. */
const FIXED: BackFinding = { number: 1, says: "The greeting misses its full stop.", severity: "must", places: [{ path: "feature.txt", lines: "1" }], close: { verdict: "fixed", commit: OLDER.slice(0, 7), home: null, answer: "The greeting ends with a full stop." }, reopens: null, regression: null };

/** What the records of a sealed chain of two rounds say for the back of its seal: round 1 left one finding, which a fix pass closed, and round 2 left none. */
const RECORDS: SealRecords = {
  head: GATE,
  record: { commit: GATE, branch: null, base: BASE, item: NAME, gate: GATE, rounds: 2, builtBy: ["the session"], judgedBy: "s-2", model: "fake", rules: "owlery 0.0.2" },
  brokenBy: null,
  rounds: [
    { round: 1, target: GATE, findings: [FIXED], confirms: [], unread: 0 },
    { round: 2, target: GATE, findings: [], confirms: [], unread: 0 },
  ],
  refusals: [],
  unreadRefusals: 0,
};

/** The back of that seal, and its section as the body writes it. */
const BACK = composeBack(RECORDS, ENTRIES, 0);
const BACK_PART = [
  BACK_OPEN,
  "## The back of the seal",
  "",
  "The review rounds caught 1 defect that was fixed before the seal. Findings by round: 1, 0.",
  "",
  "### Round 1, on `aaaaaaa`",
  "",
  "- 1. The greeting misses its full stop. `feature.txt:1`. must. Fixed in `bbbbbbb`.",
  "",
  "### Round 2, on `aaaaaaa`",
  "",
  "No finding.",
  "",
  "| Stage | Ended | Time | Tokens in / out | Cache read / written | Cost |",
  "|---|---|---|---|---|---|",
  "| Round 1 | | 4 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.28 converted |",
  "| Fix pass on round 1 | | 6 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.41 converted |",
  "| Round 2 | | 3 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.19 converted |",
  "| Broad gate | | 2 min | | | |",
  "| Sealer | | 3 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.22 converted |",
  "",
  "The chain's stages cost $1.10 converted. A converted cost is the usage priced at API prices, and it is not a charge.",
  BACK_CLOSE,
].join("\n");

/** The body's parts below the back's section, as the composer writes them for `records` with a changelog and `DECISIONS`. */
const CHANGED = ["## What changed", "", "- The greeting ends with a full stop."].join("\n");
const GATE_PART = ["## Broad gate", "", "```seal", `run: ${GATE} against ${BASE}`, "```"].join("\n");
const DECIDED = ["## Decided without asking", "", "- Decided: The work item runs through the review chain.", "  Grounds: The routing reads so.", "  State: decided", "- Decided: The base is main.", "  Grounds: The repository names no other.", "  State: reversed"].join("\n");

/** The line that stands for a part the limit took, under its heading. */
const held = (heading: string, path: string): string => `${heading}\n\n\`${DIRECTORY}/${path}\` holds this part.`;

describe("the body of a pull request", () => {
  it("opens with the seal section, which copies the newest verdict block of guarantee.md line for line, then holds the back of the seal between its markers, the changelog, the newest run of the broad gate and each decision, in that order, each under its heading", async () => {
    const made = repository();
    const head = records(made, { changelog: "- The greeting ends with a full stop.\n", decisions: DECISIONS });
    const body = pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY), BACK);
    expect(body).toBe(`${[SECTION, BACK_PART, CHANGED, GATE_PART, DECIDED].join("\n\n")}\n`);
    expect(body.split(`${SECTION_OPEN}\n`)).toHaveLength(2);
  });

  it("leaves out a part whose record does not stand: no changelog and no record of decisions", async () => {
    const made = repository();
    const head = records(made);
    expect(pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY), BACK)).toBe(`${[SECTION, BACK_PART, GATE_PART].join("\n\n")}\n`);
  });

  it("reads the records as the head commit holds them, and not as the worktree holds them", async () => {
    const made = repository();
    const head = records(made, { changelog: "- The greeting ends with a full stop.\n" });
    write(made.repo, `${DIRECTORY}/changelog.md`, "- A line no commit holds.\n");
    write(made.repo, `${DIRECTORY}/decisions.md`, DECISIONS);
    expect(pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY), BACK)).toBe(`${[SECTION, BACK_PART, CHANGED, GATE_PART].join("\n\n")}\n`);
  });

  it("refuses records whose guarantee holds no verdict block", async () => {
    const made = repository();
    const head = records(made, { guarantee: `# Guarantee: ${NAME}\n\nNo verdict yet.\n` });
    expect(await refusal(bodyRecords(made.repo, head, DIRECTORY))).toBe(`${DIRECTORY}/guarantee.md holds no verdict block at the head commit`);
  });

  it("replaces a part whose text holds a marker line of the seal section or of the back's by the line that names its record, whatever the body's length, so the body holds each marker once", async () => {
    const made = repository();
    const changelog = ["- The body opens with the seal section:", "", "```", SECTION_OPEN, "## Seal", `  ${SECTION_CLOSE}  `, "```", ""].join("\n");
    const head = records(made, { changelog, decisions: DECISIONS });
    const body = pullRequestBody(await bodyRecords(made.repo, head, DIRECTORY), BACK, 1_000_000);
    expect(body).toBe(`${[SECTION, BACK_PART, held("## What changed", "changelog.md"), GATE_PART, DECIDED].join("\n\n")}\n`);
    const lines = body.split("\n").map((line) => line.trim());
    expect([SECTION_OPEN, SECTION_CLOSE, BACK_OPEN, BACK_CLOSE].map((marker) => lines.filter((line) => line === marker).length)).toEqual([1, 1, 1, 1]);
    // A marker alone with a tab and a space at its ends is a marker line too, of either section.
    for (const marker of [SECTION_CLOSE, BACK_OPEN]) {
      const closing = records(made, { changelog: `- The section ends at:\n\n\t${marker} \n` });
      expect(pullRequestBody(await bodyRecords(made.repo, closing, DIRECTORY), BACK, 1_000_000), marker).toBe(`${[SECTION, BACK_PART, held("## What changed", "changelog.md"), GATE_PART, DECIDED].join("\n\n")}\n`);
    }
    // A marker after any other character is no marker line, for the daemon as for the check, so the part is copied whole and the body holds one section of each. U+0085 is white space to Python's `str.strip` and U+FEFF to JavaScript's `trim`, and the rule takes off neither.
    for (const other of ["\u0085", "﻿"]) {
      for (const marker of [SECTION_CLOSE, BACK_CLOSE]) {
        const kept = records(made, { changelog: `- The section ends at:\n\n${other}${marker}\n` });
        expect(pullRequestBody(await bodyRecords(made.repo, kept, DIRECTORY), BACK, 1_000_000), `U+${other.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")} ${marker}`).toBe(`${[SECTION, BACK_PART, `## What changed\n\n- The section ends at:\n\n${other}${marker}`, GATE_PART, DECIDED].join("\n\n")}\n`);
      }
    }
  });

  it("replaces the parts below the back's section, the last first, by a line that names each part's record, until the body is within the limit, and never cuts the seal section", async () => {
    const made = repository();
    const changelog = `${"- A line of the changelog.\n".repeat(3000)}`;
    const head = records(made, { changelog, decisions: DECISIONS });
    const read = await bodyRecords(made.repo, head, DIRECTORY);
    const whole = pullRequestBody(read, BACK, 1_000_000);
    expect(whole.length).toBeGreaterThan(BODY_LIMIT);
    // The changelog alone passes the limit, so every part is replaced, the decisions first and the changelog last, and the back stands whole.
    const folded = pullRequestBody(read, BACK);
    expect(folded).toBe(`${[SECTION, BACK_PART, held("## What changed", "changelog.md"), held("## Broad gate", "trail/gate.md"), held("## Decided without asking", "decisions.md")].join("\n\n")}\n`);
    // A limit that takes the decisions alone replaces them and leaves the rest.
    const fewer = pullRequestBody(read, BACK, whole.length - 1);
    expect(fewer).toBe(`${[SECTION, BACK_PART, `## What changed\n\n${changelog.trimEnd()}`, GATE_PART, held("## Decided without asking", "decisions.md")].join("\n\n")}\n`);
    expect(fewer.length).toBeLessThanOrEqual(whole.length - 1);
    // The length is counted in UTF-16 code units, as GitHub counts a body's characters.
    const wide = pullRequestBody(read, BACK, SECTION.length + 1);
    expect(wide.startsWith(`${SECTION}\n\n${BACK_OPEN}\n`)).toBe(true);
  });

  it("lets each round's list of findings give way to a line that names its record, the last round first, once every part below the back gave way, and keeps the table of the stages and the sums whole", async () => {
    const made = repository();
    const head = records(made, { changelog: "- The greeting ends with a full stop.\n", decisions: DECISIONS });
    const read = await bodyRecords(made.repo, head, DIRECTORY);
    // Round 1's finding and round 3's each pass the limit alone, and round 2 found nothing.
    const long: BackFinding = { ...FIXED, says: `${"A long symptom. ".repeat(4200)}The end.` };
    const rounds = [{ ...RECORDS.rounds[0]!, findings: [long] }, RECORDS.rounds[1]!, { round: 3, target: GATE, findings: [long], confirms: [], unread: 0 }];
    const back = composeBack({ ...RECORDS, rounds }, ENTRIES, 0);
    const whole = backSection(back, DIRECTORY);
    const parts = [held("## What changed", "changelog.md"), held("## Broad gate", "trail/gate.md"), held("## Decided without asking", "decisions.md")];
    /** The back's text with the round's list of findings given way to the line that names its record. */
    const given = (text: string, round: number): string => {
      const listed = `### Round ${String(round)}, on \`aaaaaaa\`\n\n- 1. ${long.says} \`feature.txt:1\`. must. Fixed in \`bbbbbbb\`.\n\n`;
      expect(text).toContain(listed);
      return text.replace(listed, `### Round ${String(round)}, on \`aaaaaaa\`\n\n\`${DIRECTORY}/trail/rounds/round-${String(round)}.md\` holds this round's findings.\n\n`);
    };
    // Every part below the back gives way first, then round 3's list, then round 1's.
    const both = `${[SECTION, given(given(whole, 3), 1), ...parts].join("\n\n")}\n`;
    expect(pullRequestBody(read, back)).toBe(both);
    expect(both.length).toBeLessThanOrEqual(BODY_LIMIT);
    // A limit that the body with round 3's list given way meets keeps round 1's list.
    const third = `${[SECTION, given(whole, 3), ...parts].join("\n\n")}\n`;
    expect(third.length).toBeGreaterThan(BODY_LIMIT);
    expect(pullRequestBody(read, back, third.length)).toBe(third);
    // The table of the stages and the sums stand whole in each.
    for (const text of [both, third]) expect(text).toContain(BACK_PART.slice(BACK_PART.indexOf("| Stage |")));
  });
});

describe("the back of the seal in a pull request's body", () => {
  it("writes the head's sentences, each round's findings with their places and closes, a round's lines not read, one table of the stages, the sums, the sessions outside the chain, the refused calls and the lines not read, between its two markers", () => {
    const open: BackFinding = { number: 2, says: "The farewell is missing", severity: "should", places: [{ path: "feature.txt", lines: "2-3" }, { path: "other.txt", lines: null }], close: null, reopens: null, regression: { round: 1, finding: 1 } };
    const records: SealRecords = { ...RECORDS, rounds: [{ ...RECORDS.rounds[0]!, findings: [FIXED, open], unread: 2 }, { ...RECORDS.rounds[1]!, confirms: [{ round: 1, finding: 1 }] }], refusals: [{ kind: "round", round: 1, rule: "no-write" }, { kind: "round", round: 1, rule: "no-write" }, { kind: "seal", round: 2, rule: "no-command" }], unreadRefusals: 1 };
    const entries = [entry("round", 1, 4, 0.28), entry("fix-pass", 1, 75, null, { state: "failed", stopped: "limit" }), entry("round", 2, 3, 0.19, { usage: { costUsd: 0.19, converted: false, models: [] } }), entry("gate", 2, 0, null), entry("seal", 2, 3, 0.22), { ...entry("round", 1, 1, 0.05), chain: null }];
    expect(backSection(composeBack(records, entries, 1), DIRECTORY)).toBe(
      [
        BACK_OPEN,
        "## The back of the seal",
        "",
        "The review rounds caught 1 defect that was fixed before the seal. 1 finding is open. Findings by round: 2, 0.",
        "",
        "### Round 1, on `aaaaaaa`",
        "",
        "- 1. The greeting misses its full stop. `feature.txt:1`. must. Fixed in `bbbbbbb`.",
        "- 2. The farewell is missing. `feature.txt:2-3`, `other.txt`. should. Open. It is a regression of round 1's finding 1.",
        "",
        "2 lines of round 1's record were not read.",
        "",
        "### Round 2, on `aaaaaaa`",
        "",
        "No finding. It confirmed round 1's finding 1.",
        "",
        "| Stage | Ended | Time | Tokens in / out | Cache read / written | Cost |",
        "|---|---|---|---|---|---|",
        "| Round 1 | | 4 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.28 converted |",
        "| Fix pass on round 1 | Stopped at its limit | 1 h 15 min | | | No cost reported |",
        "| Round 2 | | 3 min | | | $0.19 |",
        "| Broad gate | | under 1 min | | | |",
        "| Sealer | | 3 min | 12,300 / 2,100 | 48,000 / 9,200 | $0.22 converted |",
        "",
        "The chain's stages cost $0.50 converted and $0.19 charged. 1 stage reported no cost. A converted cost is the usage priced at API prices, and it is not a charge.",
        "",
        "1 session asked outside the chain cost $0.05 converted.",
        "",
        "- Round 1 was refused 2 calls: 2 by `no-write`.",
        "- Sealer was refused 1 call: 1 by `no-command`.",
        "",
        "1 row of the refused calls was not read. 1 line of the ledger was not read.",
        BACK_CLOSE,
      ].join("\n"),
    );
  });

  it("writes where the costs are, and no table of the stages, where the records hold rounds and a verdict and the ledger holds no stage of the chain", () => {
    const section = backSection(composeBack(RECORDS, [], 0), DIRECTORY);
    expect(section).toContain("\n\nThe stages of this chain ran outside Owlery's daemon, in a pane's session or in another tool, and Owlery read no cost of them.\n");
    expect(section).not.toContain("| Stage |");
    expect(BACK_PART).not.toContain("ran outside Owlery's daemon");
  });

  it("says that no review round is recorded and holds no table where the records hold no round and the ledger no entry", () => {
    expect(backSection(composeBack({ ...RECORDS, record: null, rounds: [] }, [], 0), DIRECTORY)).toBe([BACK_OPEN, "## The back of the seal", "", "No review round is recorded.", BACK_CLOSE].join("\n"));
  });
});

describe("the seal section and the back's section of a body a person may have edited", () => {
  const OLD = [SECTION_OPEN, "## Seal", "", "```seal", `target: ${OLDER} against main`, "Verdict: sealed", "```", SECTION_CLOSE];
  const OLD_BACK = [BACK_OPEN, "## The back of the seal", "", "The review rounds caught nothing. Findings by round: 0.", BACK_CLOSE];
  /** The reason a replacing of the back's section was refused with, or the text "replaced". */
  const backRefused = (body: string): string => {
    try {
      withBackSection(body, BACK, DIRECTORY);
      return "replaced";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };

  it("replaces the back's section from its opening marker to its closing marker and changes no other line, with the lines ended as the body ends them, and puts it after the seal section where the body holds none", () => {
    for (const end of ["\n", "\r\n"]) {
      const above = ["A person's line above.", "", ...SECTION.split("\n"), ""];
      const below = ["", "A person's line below.", ""];
      const expected = [...above, ...BACK_PART.split("\n"), ...below].join(end);
      expect(withBackSection([...above, ...OLD_BACK, ...below].join(end), BACK, DIRECTORY)).toBe(expected);
      // No back's section: it stands after the seal section, a blank line on each side, whether or not one follows the seal section.
      expect(withBackSection([...above.slice(0, -1), ...below].join(end), BACK, DIRECTORY)).toBe(expected);
      expect(withBackSection([...above.slice(0, -1), ...below.slice(1)].join(end), BACK, DIRECTORY)).toBe(expected);
      expect(withBackSection([...above.slice(0, -1)].join(end), BACK, DIRECTORY)).toBe([...above, ...BACK_PART.split("\n"), ""].join(end));
    }
    // A marker line is one of the two markers with spaces and tabs at its ends, and with no other character there.
    expect(withBackSection(`${SECTION}\n\n  ${BACK_OPEN} \nold\n${BACK_CLOSE}\t\nbelow`, BACK, DIRECTORY)).toBe(`${SECTION}\n\n${BACK_PART}\nbelow`);
    expect(withBackSection(`${SECTION}\n\n\u0085${BACK_OPEN}\nold\n﻿${BACK_CLOSE}\n`, BACK, DIRECTORY)).toBe(`${SECTION}\n\n${BACK_PART}\n\n\u0085${BACK_OPEN}\nold\n﻿${BACK_CLOSE}\n`);
    // A body with no seal section takes the back's section before its first line.
    expect(withBackSection("A person's body.\n", BACK, DIRECTORY)).toBe(`${BACK_PART}\n\nA person's body.\n`);
  });

  it("refuses a body with two opening markers of the back, with two closing ones, with an opening marker and no closing one after it, and with a closing marker alone, saying which", () => {
    expect(backRefused([...OLD, ...OLD_BACK, ...OLD_BACK].join("\n"))).toBe(`the body holds 2 \`${BACK_OPEN}\` lines, and Owlery replaces one section of the back of the seal`);
    expect(backRefused([BACK_OPEN, "x", BACK_CLOSE, BACK_CLOSE].join("\n"))).toBe(`the body holds 2 \`${BACK_CLOSE}\` lines, and Owlery replaces one section of the back of the seal`);
    expect(backRefused([BACK_OPEN, "x"].join("\n"))).toBe(`the body holds no \`${BACK_CLOSE}\` line after its \`${BACK_OPEN}\` line, so Owlery cannot tell where its section of the back of the seal ends`);
    expect(backRefused([BACK_CLOSE, "x", BACK_OPEN].join("\n"))).toBe(`the body holds no \`${BACK_CLOSE}\` line after its \`${BACK_OPEN}\` line, so Owlery cannot tell where its section of the back of the seal ends`);
    expect(backRefused(["x", BACK_CLOSE].join("\n"))).toBe(`the body holds no \`${BACK_CLOSE}\` line after its \`${BACK_OPEN}\` line, so Owlery cannot tell where its section of the back of the seal ends`);
  });

  it("lets the back's findings give way, the last round first, where the body with its new back would pass the limit, and cuts no line a person wrote", () => {
    const long: BackFinding = { ...FIXED, says: `${"A long symptom. ".repeat(4200)}The end.` };
    const back = composeBack({ ...RECORDS, rounds: [{ ...RECORDS.rounds[0]!, findings: [long] }, RECORDS.rounds[1]!] }, ENTRIES, 0);
    const mine = `${"A line a person wrote. ".repeat(100)}\n`;
    const replaced = withBackSection(`${SECTION}\n\n${OLD_BACK.join("\n")}\n\n${mine}`, back, DIRECTORY);
    const listed = `- 1. ${long.says} \`feature.txt:1\`. must. Fixed in \`bbbbbbb\`.`;
    expect(replaced).toBe(`${SECTION}\n\n${backSection(back, DIRECTORY).replace(listed, `\`${DIRECTORY}/trail/rounds/round-1.md\` holds this round's findings.`)}\n\n${mine}`);
    expect(replaced.length).toBeLessThanOrEqual(BODY_LIMIT);
    // Within the limit, the findings stand.
    expect(withBackSection(`${SECTION}\n\n${OLD_BACK.join("\n")}\n\n${mine}`, back, DIRECTORY, 1_000_000)).toBe(`${SECTION}\n\n${backSection(back, DIRECTORY)}\n\n${mine}`);
  });

  it("replaces the lines from the opening marker to the closing marker and changes no other line, with the lines ended as the body ends them", () => {
    for (const end of ["\n", "\r\n"]) {
      const body = ["A person's line above.", "", ...OLD, "", "A person's line below, with `<!-- a comment -->` in it.", ""].join(end);
      expect(withSealSection(body, SECTION)).toBe(["A person's line above.", "", ...SECTION.split("\n"), "", "A person's line below, with `<!-- a comment -->` in it.", ""].join(end));
    }
    // A marker line is one of the two markers with spaces and tabs at its ends, and with no other character there.
    expect(withSealSection(`  ${SECTION_OPEN} \nold\n${SECTION_CLOSE}\t\nbelow`, SECTION)).toBe(`${SECTION}\nbelow`);
    expect(withSealSection(`\u0085${SECTION_OPEN}\nold\n\ufeff${SECTION_CLOSE}\n`, SECTION)).toBe(`${SECTION}\n\n\u0085${SECTION_OPEN}\nold\n\ufeff${SECTION_CLOSE}\n`);
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
