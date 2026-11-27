// Reruns each job of one completed workflow run attempt that GitHub cancelled
// because no hosted runner took it, and no other job. The workflow
// `.github/workflows/rerun-unstarted.yml` runs it when a run of `check` or of
// `package` completes with a conclusion other than success, and hands it the
// run's values in the environment: RUN_ID, RUN_ATTEMPT, RUN_EVENT,
// HEAD_BRANCH, HEAD_SHA and HEAD_REPOSITORY, beside the runner's
// GITHUB_REPOSITORY and the token in GH_TOKEN.
//
// A job is rerun where all four hold: GitHub cancelled it, it has no step, its
// runner_id is 0, and one of its annotations is NOT_ACQUIRED. A job that a
// newer push cancelled while it was queued has the first three and another
// annotation. No job of an attempt numbered CEILING or more is rerun, nor one
// of a pull request from another repository or whose branch has moved off the
// run's commit, since its rerun would cancel the newer commit's run.
//
// Each decision that ends the command prints one line and exits 0. A call of
// gh that fails, other than the read of a branch that no longer exists, ends
// it at 1 with the call and what gh wrote. Each line also goes to the file
// GITHUB_STEP_SUMMARY names. The command calls gh from the PATH and imports
// nothing outside Node's own modules (apps/desktop/test/rerun-unstarted.test.ts).
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/** GitHub's message on a job no hosted runner took, read from the annotations of such jobs in issue #296. No page of GitHub's documentation read for that issue states it. */
const NOT_ACQUIRED = "The job was not acquired by Runner of type hosted even after multiple attempts";

/** No job of an attempt numbered this or more is rerun, so a run gets at most four reruns from this command. */
const CEILING = 5;

/** A refusal that ends the command at 1, with its line. */
class Refusal extends Error {}

/** Prints a line, and writes it to the run's summary where the runner names one. */
function say(line, stream = process.stdout) {
  stream.write(`${line}\n`);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) appendFileSync(summary, `${line}\n\n`);
}

/** The value of a variable the workflow sets, refused where it is missing or empty. */
function input(name) {
  const value = process.env[name];
  if (value === undefined || value === "") throw new Refusal(`${name} is not set.`);
  return value;
}

/** Runs gh with the arguments, and gives back what it printed and the code it exited with. */
function gh(args) {
  const ran = spawnSync("gh", args, { encoding: "utf8" });
  if (ran.error !== undefined) throw new Refusal(`gh ${args.join(" ")} could not start: ${ran.error.message}`);
  return ran;
}

/** The refusal for a call of gh that exited non-zero. */
function failed(args, ran) {
  return new Refusal(`gh ${args.join(" ")} exited ${ran.status}: ${ran.stderr.trim()}`);
}

/** Reads a path of GitHub's API through gh and gives back the JSON it answered. */
function read(path) {
  const args = ["api", path];
  const ran = gh(args);
  if (ran.status !== 0) throw failed(args, ran);
  return JSON.parse(ran.stdout);
}

/** The commit a branch's head stands at, or null where GitHub answers that the branch does not exist. */
function branchHead(repository, branch) {
  const args = ["api", `repos/${repository}/git/ref/heads/${branch.split("/").map(encodeURIComponent).join("/")}`];
  const ran = gh(args);
  if (ran.status === 0) return JSON.parse(ran.stdout).object.sha;
  let answer;
  try {
    answer = JSON.parse(ran.stdout);
  } catch {
    throw failed(args, ran);
  }
  if (answer?.status === "404") return null;
  throw failed(args, ran);
}

/** A job's name and id, as each line names a job. */
const named = (job) => `job ${job.name} (${job.id})`;

function main() {
  const repository = input("GITHUB_REPOSITORY");
  const run = input("RUN_ID");
  const given = process.env.RUN_ATTEMPT ?? "";
  if (!/^[1-9][0-9]*$/.test(given)) throw new Refusal(`RUN_ATTEMPT is ${JSON.stringify(given)}, which is no attempt's number.`);
  const attempt = Number(given);
  const event = input("RUN_EVENT");
  const where = `attempt ${attempt} of run ${run}`;

  const { jobs } = read(`repos/${repository}/actions/runs/${run}/attempts/${attempt}/jobs?per_page=100`);
  const unplaced = jobs.filter((job) => job.conclusion === "cancelled" && Array.isArray(job.steps) && job.steps.length === 0 && job.runner_id === 0);
  if (unplaced.length === 0) {
    say(`Attempt ${attempt} of run ${run} holds no job that no runner took, so nothing is rerun.`);
    return;
  }

  const neverStarted = [];
  for (const job of unplaced) {
    const messages = read(`repos/${repository}/check-runs/${job.id}/annotations?per_page=100`).map((annotation) => annotation.message);
    if (messages.includes(NOT_ACQUIRED)) {
      neverStarted.push(job);
      continue;
    }
    const listed = messages.length === 0 ? "none" : messages.map((message) => JSON.stringify(message)).join(", ");
    say(`Job ${job.name} (${job.id}) of ${where} was cancelled with no runner and no step, and no annotation says no runner took it, so it is not rerun. Its annotations: ${listed}.`);
  }
  if (neverStarted.length === 0) return;

  if (attempt >= CEILING) {
    say(`Attempt ${attempt} of run ${run} reached the ceiling of ${CEILING} attempts, so ${neverStarted.map(named).join(" and ")} is not rerun.`);
    return;
  }

  // A fork's pull request runs its own workflow files at other events than pull_request too, so the head repository is
  // compared whatever the event. A push or workflow_dispatch run's head repository is this one.
  const from = input("HEAD_REPOSITORY");
  if (from !== repository) {
    say(`Run ${run} is of a pull request from ${from}, not from ${repository}, so nothing is rerun.`);
    return;
  }

  if (event === "pull_request") {
    const branch = input("HEAD_BRANCH");
    const sha = input("HEAD_SHA");
    const head = branchHead(repository, branch);
    if (head !== sha) {
      const stands = head === null ? "no longer exists" : `stands at ${head}`;
      say(`The branch ${branch} ${stands}, and run ${run} ran at ${sha}, so nothing is rerun.`);
      return;
    }
  }

  for (const job of neverStarted) {
    const args = ["api", "--method", "POST", `repos/${repository}/actions/jobs/${job.id}/rerun`];
    const ran = gh(args);
    if (ran.status !== 0) throw failed(args, ran);
    say(`Asked GitHub to rerun ${named(job)}, which no runner took in ${where}.`);
  }
}

try {
  main();
} catch (error) {
  if (!(error instanceof Refusal)) throw error;
  say(error.message, process.stderr);
  process.exit(1);
}
