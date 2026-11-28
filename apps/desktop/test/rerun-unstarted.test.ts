// layer: process
// The command `.github/scripts/rerun-unstarted.mjs`, which the workflow
// `.github/workflows/rerun-unstarted.yml` runs when a run of `check` or of
// `package` completes. Each case runs the command as a process, with the
// stand-in `gh` of `fixtures/rerun-unstarted/` first on its PATH. The stand-in
// answers from `fixtures/rerun-unstarted/github.json`, which holds what
// `gh api` returned for the runs and jobs named below on 2026-11-27, cut to the
// fields the command reads, and it notes every call. Each case arranges the
// answers to the calls a wrong decision would make, the rerun among them, so
// such a decision shows as a call the case can see.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const COMMAND = join(__dirname, "..", "..", "..", ".github", "scripts", "rerun-unstarted.mjs");
const STAND_IN = join(__dirname, "fixtures", "rerun-unstarted");
const REPOSITORY = "MichaelYcJo/owlery";

/** What the stand-in `gh` prints and the code it exits with, for one call. */
type Answer = { stdout?: string; stderr?: string; status?: number };

const GITHUB = JSON.parse(readFileSync(join(STAND_IN, "github.json"), "utf8")) as { bodies: Record<string, unknown>; notFound: Answer };

/** GitHub's answer to a read, as `gh api` printed it. */
function body(path: string): Answer {
  const found = GITHUB.bodies[`repos/${REPOSITORY}/${path}`];
  if (found === undefined) throw new Error(`the fixture holds no answer for ${path}`);
  return { stdout: JSON.stringify(found) };
}

/** The arguments of each call the command makes, joined as the stand-in keys its answers. */
const jobsRead = (run: string, attempt: string): string => `api repos/${REPOSITORY}/actions/runs/${run}/attempts/${attempt}/jobs?per_page=100`;
const annotationsRead = (job: number): string => `api repos/${REPOSITORY}/check-runs/${job}/annotations?per_page=100`;
const refRead = (branch: string): string => `api repos/${REPOSITORY}/git/ref/heads/${branch}`;
const rerun = (job: number): string => `api --method POST repos/${REPOSITORY}/actions/jobs/${job}/rerun`;

/** A branch's ref at a commit, in the shape GitHub gave for `release/v0.1.0`. */
function refAt(sha: string): Answer {
  const release = GITHUB.bodies[`repos/${REPOSITORY}/git/ref/heads/release/v0.1.0`] as { object: { sha: string } };
  return { stdout: JSON.stringify({ ...release, object: { ...release.object, sha } }) };
}

/** GitHub accepted the rerun: `gh api` prints nothing for the answer 201. */
const ACCEPTED: Answer = { stdout: "" };

/** The values the workflow hands the command for a run, here those of run 45855610271 attempt 2, a pull request's. */
type Run = { RUN_ID: string; RUN_ATTEMPT: string; RUN_EVENT: string; HEAD_BRANCH: string; HEAD_SHA: string; HEAD_REPOSITORY: string };

const NEVER_STARTED: Run = {
  RUN_ID: "45855610271",
  RUN_ATTEMPT: "2",
  RUN_EVENT: "pull_request",
  HEAD_BRANCH: "feat/213-a-panes-tab-has-no-menu",
  HEAD_SHA: "3da05835fa745f656034aef73b65c0208975487a",
  HEAD_REPOSITORY: REPOSITORY,
};
/** The one job of run 45855610271 attempt 2, which no runner took. */
const NEVER_STARTED_JOB = 140041369486;

/** Every answer the command could ask for at run 45855610271 attempt 2, read at `attempt`, with the branch at `branchAt`. */
function neverStarted(attempt = "2", branchAt: Answer = refAt(NEVER_STARTED.HEAD_SHA)): Record<string, Answer> {
  return {
    [jobsRead(NEVER_STARTED.RUN_ID, attempt)]: body("actions/runs/45855610271/attempts/2/jobs"),
    [annotationsRead(NEVER_STARTED_JOB)]: body(`check-runs/${NEVER_STARTED_JOB}/annotations`),
    [refRead(NEVER_STARTED.HEAD_BRANCH)]: branchAt,
    [rerun(NEVER_STARTED_JOB)]: ACCEPTED,
  };
}

type Ran = { status: number | null; stdout: string; stderr: string; calls: string[]; summary: string };

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/**
 * Runs the command with the run's values and the stand-in's answers. The command's environment holds nothing of the
 * suite's own, so a `GITHUB_STEP_SUMMARY` or a token of the runner that runs the suite never reaches it.
 */
function command(run: Run, answers: Record<string, Answer>, values: Record<string, string> = {}): Ran {
  const folder = mkdtempSync(join(tmpdir(), "owlery-rerun-"));
  folders.push(folder);
  const calls = join(folder, "calls");
  const summary = join(folder, "summary.md");
  writeFileSync(calls, "");
  writeFileSync(summary, "");
  writeFileSync(join(folder, "answers.json"), JSON.stringify(answers));
  const ran = spawnSync(process.execPath, [COMMAND], {
    encoding: "utf8",
    env: {
      PATH: `${STAND_IN}:${process.env.PATH ?? ""}`,
      ELECTRON_RUN_AS_NODE: "1",
      GH_STAND_IN_NODE: process.execPath,
      GH_STAND_IN_CALLS: calls,
      GH_STAND_IN_ANSWERS: join(folder, "answers.json"),
      GITHUB_STEP_SUMMARY: summary,
      GITHUB_REPOSITORY: REPOSITORY,
      GH_TOKEN: "a token the stand-in never reads",
      ...run,
      ...values,
    },
  });
  const called = readFileSync(calls, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => (JSON.parse(line) as string[]).join(" "));
  return { status: ran.status, stdout: ran.stdout, stderr: ran.stderr, calls: called, summary: readFileSync(summary, "utf8") };
}

/** The calls that asked GitHub for a rerun. */
const reruns = (ran: Ran): string[] => ran.calls.filter((call) => call.startsWith("api --method POST"));

describe("a job that never got a runner", () => {
  it("is rerun, once, with a line naming the job and the attempt, where the pull request's branch is still at the run's commit", () => {
    const ran = command(NEVER_STARTED, neverStarted());
    expect(ran.stderr).toBe("");
    expect(ran.status).toBe(0);
    expect(ran.calls).toEqual([jobsRead(NEVER_STARTED.RUN_ID, "2"), annotationsRead(NEVER_STARTED_JOB), refRead(NEVER_STARTED.HEAD_BRANCH), rerun(NEVER_STARTED_JOB)]);
    const line = `Asked GitHub to rerun job check (${NEVER_STARTED_JOB}), which no runner took in attempt 2 of run 45855610271.`;
    expect(ran.stdout).toBe(`${line}\n`);
    expect(ran.summary).toBe(`${line}\n\n`);
  });

  it("is rerun at a push run without a read of the branch, whose name is a tag's", () => {
    const tag = "v0.1.0";
    const ran = command({ ...NEVER_STARTED, RUN_EVENT: "push", HEAD_BRANCH: tag }, { ...neverStarted(), [refRead(tag)]: refAt(NEVER_STARTED.HEAD_SHA) });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([rerun(NEVER_STARTED_JOB)]);
    expect(ran.calls.filter((call) => call.includes("git/ref"))).toEqual([]);
  });

  // Git allows `#` in a branch's name, and a path reads it as the start of a fragment. Only the encoded read is
  // arranged, so a read of `heads/fix/296-a#b` gets no answer from the stand-in and ends the command at 1.
  it("reads the ref of a branch whose name holds a character a path reads otherwise, with that character encoded", () => {
    const ran = command({ ...NEVER_STARTED, HEAD_BRANCH: "fix/296-a#b" }, { ...neverStarted(), [refRead("fix/296-a%23b")]: refAt(NEVER_STARTED.HEAD_SHA) });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([rerun(NEVER_STARTED_JOB)]);
  });
});

describe("a job that is not rerun", () => {
  it("a job that ran and failed, beside the check run `seal`, which has no step and no runner", () => {
    const run: Run = {
      ...NEVER_STARTED,
      RUN_ID: "45907578756",
      RUN_ATTEMPT: "1",
      HEAD_BRANCH: "feat/133-a-daemon-of-another-build-stays-on-release",
      HEAD_SHA: "a25cb04a90538f9cf651132937e89f3400e99f1f",
    };
    const ran = command(run, {
      [jobsRead("45907578756", "1")]: body("actions/runs/45907578756/attempts/1/jobs"),
      [annotationsRead(140207911970)]: body("check-runs/140207911970/annotations"),
      [annotationsRead(140207960481)]: body("check-runs/140207960481/annotations"),
      [refRead(run.HEAD_BRANCH)]: refAt(run.HEAD_SHA),
      [rerun(140207911970)]: ACCEPTED,
      [rerun(140207960481)]: ACCEPTED,
    });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([]);
    expect(ran.calls).toEqual([jobsRead("45907578756", "1")]);
    expect(ran.stdout).toBe("Attempt 1 of run 45907578756 holds no job that no runner took, so nothing is rerun.\n");
  });

  it("a job a newer push cancelled while it was queued, with no runner and no step, and the line holds the annotation it read", () => {
    const run: Run = {
      ...NEVER_STARTED,
      RUN_ID: "45650015251",
      RUN_ATTEMPT: "1",
      HEAD_BRANCH: "fix/242-a-click-on-a-sidebar-line-is-lost-when-the-sidebar-redraws",
      HEAD_SHA: "1eb6d803bd66b59ca5707b28b95486bc6de7ea94",
    };
    const ran = command(run, {
      [jobsRead("45650015251", "1")]: body("actions/runs/45650015251/attempts/1/jobs"),
      [annotationsRead(139331652385)]: body("check-runs/139331652385/annotations"),
      [refRead(run.HEAD_BRANCH)]: refAt(run.HEAD_SHA),
      [rerun(139331652385)]: ACCEPTED,
    });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([]);
    expect(ran.stdout).toBe(
      'Job check (139331652385) of attempt 1 of run 45650015251 was cancelled with no runner and no step, and no annotation says no runner took it, so it is not rerun. Its annotations: "Canceling since a higher priority waiting request for check-253 exists".\n',
    );
  });

  // Each of the never-started job's facts in the list of jobs is changed alone, and its annotation still says that no
  // runner took it, so only the fact changed keeps the job from a rerun. The values stand in for a job that ran:
  // attempt 1 of run 45855610271 failed, and runner 1000023252 took attempt 3.
  it.each([
    ["a conclusion other than cancelled", { conclusion: "failure" }],
    ["a step", { steps: [{ name: "Set up job" }] }],
    ["a runner", { runner_id: 1000023252 }],
  ])("a job that GitHub says no runner took, but that has %s", (_, changed) => {
    const listed = JSON.parse(body("actions/runs/45855610271/attempts/2/jobs").stdout ?? "") as { jobs: object[] };
    const ran = command(NEVER_STARTED, {
      ...neverStarted(),
      [jobsRead(NEVER_STARTED.RUN_ID, "2")]: { stdout: JSON.stringify({ jobs: listed.jobs.map((job) => ({ ...job, ...changed })) }) },
    });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([]);
    expect(ran.stdout).toBe("Attempt 2 of run 45855610271 holds no job that no runner took, so nothing is rerun.\n");
  });

  it("a job cancelled while it ran, which has a runner and steps", () => {
    const run: Run = {
      ...NEVER_STARTED,
      RUN_ID: "45134108687",
      RUN_ATTEMPT: "1",
      HEAD_BRANCH: "feat/46-a-work-item-view-shows-no-progress-through-roles",
      HEAD_SHA: "3757b7315cf8d43cd61de6124a6e84e377370fff",
    };
    const ran = command(run, {
      [jobsRead("45134108687", "1")]: body("actions/runs/45134108687/attempts/1/jobs"),
      [annotationsRead(137556298780)]: body("check-runs/137556298780/annotations"),
      [refRead(run.HEAD_BRANCH)]: refAt(run.HEAD_SHA),
      [rerun(137556298780)]: ACCEPTED,
    });
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([]);
    expect(ran.stdout).toBe("Attempt 1 of run 45134108687 holds no job that no runner took, so nothing is rerun.\n");
  });
});

describe("a never-started job that is not rerun", () => {
  it("at attempt 5, the ceiling, where attempt 4 is rerun", () => {
    const fifth = command({ ...NEVER_STARTED, RUN_ATTEMPT: "5" }, neverStarted("5"));
    expect(fifth.status).toBe(0);
    expect(reruns(fifth)).toEqual([]);
    expect(fifth.stdout).toBe(`Attempt 5 of run 45855610271 reached the ceiling of 5 attempts, so job check (${NEVER_STARTED_JOB}) is not rerun.\n`);
    const fourth = command({ ...NEVER_STARTED, RUN_ATTEMPT: "4" }, neverStarted("4"));
    expect(fourth.status).toBe(0);
    expect(reruns(fourth)).toEqual([rerun(NEVER_STARTED_JOB)]);
  });

  it("of a pull request whose branch moved to another commit, or no longer exists, and the line names both", () => {
    const moved = command(NEVER_STARTED, neverStarted("2", refAt("e7737b7e28dc230dccaf711f75685e74611abecd")));
    expect(moved.status).toBe(0);
    expect(reruns(moved)).toEqual([]);
    expect(moved.stdout).toBe(
      `The branch ${NEVER_STARTED.HEAD_BRANCH} stands at e7737b7e28dc230dccaf711f75685e74611abecd, and run 45855610271 ran at ${NEVER_STARTED.HEAD_SHA}, so nothing is rerun.\n`,
    );
    const gone = command(NEVER_STARTED, neverStarted("2", GITHUB.notFound));
    expect(gone.status).toBe(0);
    expect(reruns(gone)).toEqual([]);
    expect(gone.stdout).toBe(`The branch ${NEVER_STARTED.HEAD_BRANCH} no longer exists, and run 45855610271 ran at ${NEVER_STARTED.HEAD_SHA}, so nothing is rerun.\n`);
  });

  // A fork's pull request runs the workflow files of its own merge commit at `pull_request_review` as well as at
  // `pull_request`, so a fork can name a workflow `check` that runs at another event than `pull_request`.
  it.each(["pull_request", "pull_request_review"])("of a pull request from another repository, at a %s run, without a read of its branch", (event) => {
    const ran = command({ ...NEVER_STARTED, RUN_EVENT: event, HEAD_REPOSITORY: "someone/owlery" }, neverStarted());
    expect(ran.status).toBe(0);
    expect(reruns(ran)).toEqual([]);
    expect(ran.calls.filter((call) => call.includes("git/ref"))).toEqual([]);
    expect(ran.stdout).toBe(`Run 45855610271 is of a pull request from someone/owlery, not from ${REPOSITORY}, so nothing is rerun.\n`);
  });
});

describe("a refusal", () => {
  it("of the rerun ends the command non-zero, with the call and what gh wrote", () => {
    const refused: Answer = { stdout: '{"message":"Resource not accessible by integration","status":"403"}', stderr: "gh: Resource not accessible by integration (HTTP 403)\n", status: 1 };
    const ran = command(NEVER_STARTED, { ...neverStarted(), [rerun(NEVER_STARTED_JOB)]: refused });
    expect(ran.status).toBe(1);
    const line = `gh ${rerun(NEVER_STARTED_JOB)} exited 1: gh: Resource not accessible by integration (HTTP 403)`;
    expect(ran.stderr).toBe(`${line}\n`);
    expect(ran.summary).toBe(`${line}\n\n`);
  });

  it("of the read of the jobs ends the command non-zero, with the call and what gh wrote", () => {
    const ran = command(NEVER_STARTED, { ...neverStarted(), [jobsRead(NEVER_STARTED.RUN_ID, "2")]: { stderr: "gh: Bad credentials (HTTP 401)\n", status: 1 } });
    expect(ran.status).toBe(1);
    expect(reruns(ran)).toEqual([]);
    expect(ran.stderr).toBe(`gh ${jobsRead(NEVER_STARTED.RUN_ID, "2")} exited 1: gh: Bad credentials (HTTP 401)\n`);
  });

  it("of an attempt that is no number ends the command non-zero before any call", () => {
    const ran = command({ ...NEVER_STARTED, RUN_ATTEMPT: "" }, neverStarted());
    expect(ran.status).toBe(1);
    expect(ran.calls).toEqual([]);
    expect(ran.stderr).toBe('RUN_ATTEMPT is "", which is no attempt\'s number.\n');
  });

  it("of a value of the run that is empty ends the command non-zero before any call, and names it", () => {
    const ran = command({ ...NEVER_STARTED, RUN_ID: "" }, neverStarted());
    expect(ran.status).toBe(1);
    expect(ran.calls).toEqual([]);
    expect(ran.stderr).toBe("RUN_ID is not set.\n");
  });
});
