// The reach to GitHub of the pull request stage and of the watch: the remote
// the sealed branch is pushed to with the person's git, the calls of the
// person's `gh` that list, open, edit and read a pull request, the body
// composed from the records the branch's head commit holds, which opens with
// the seal section and the back of the seal, and the pull request's checks
// read into three states.
// This module reads no stored state and writes none: `Daemon#runPullRequest`
// and `Daemon#readPullRequest` store what it gives, and the daemon arranges
// when the watch reads. Owlery reads and stores no token, and calls `gh` for
// nothing else: it writes no review and merges nothing (docs/architecture.md,
// "Code runs the order, the orchestrator judges").
//
// Every process starts with no shell and no terminal, as the leader of a
// process group of its own, and is ended with that group where it passes its
// time limit, as a broad gate's command is (`gate.ts#startGate`).
import { spawn } from "node:child_process";
import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";
import type { PullRequest, PullRequestCheck } from "../shared/protocol";
import { type Back, type FindingLine, STAGE_COLUMNS, type StageLine, costText } from "../shared/seal-back";
import { ROUNDS_FOLDER, roundFile } from "./chain";
import { readDecisionRecord } from "./decision-record";
import { gfmLines } from "./record-blocks";
import { readGate, readGuarantee } from "./seal-records";
import { GATE_KILL_AFTER_MS } from "./gate";
import { baseRef, fileAt, remoteOf } from "./worktrees";

/** How long one call of `gh`, and the push, may run before the daemon ends it, where the options name no time. */
export const GITHUB_LIMIT_MS = 60_000;

/** How long the watch waits between two reads of an open pull request while its checks run, or while GitHub's head is not the commit the stage pushed, where the options name no time. */
export const PR_POLL_MS = 30_000;

/** How long the watch waits between two reads of any other open pull request, and after a read that failed, where the options name no time. */
export const PR_REST_POLL_MS = 5 * 60_000;

/** How many of a pull request's checks the daemon keeps and sends. */
export const CHECKS_KEPT = 50;

/** How long a pull request's body may be, in UTF-16 code units, as GitHub counts a body's characters. */
export const BODY_LIMIT = 65_536;

/** How many characters of a title a pull request is opened with. */
export const TITLE_LIMIT = 256;

/** The line that opens a body's seal section, alone on its line, as `pr-check/skills/code-review/scripts/chain_check.py#SECTION_OPEN` reads it. */
export const SECTION_OPEN = "<!-- owlery:seal -->";

/** The line that closes a body's seal section, as `chain_check.py#SECTION_CLOSE` reads it. */
export const SECTION_CLOSE = "<!-- /owlery:seal -->";

/** The line that opens the body's section of the back of the seal, below the seal section. No check reads it. */
export const BACK_OPEN = "<!-- owlery:back -->";

/** The line that closes the body's section of the back of the seal. */
export const BACK_CLOSE = "<!-- /owlery:back -->";

/** Every marker line Owlery writes into a body. */
const MARKERS: readonly string[] = [SECTION_OPEN, SECTION_CLOSE, BACK_OPEN, BACK_CLOSE];

/**
 * Which marker a line is, or null: a line is a marker line where it is one
 * of `MARKERS` once the spaces and tabs at its ends are taken off, and no
 * other character is taken off. The daemon and the check
 * (`chain_check.py#marker_of`, which knows the seal's two markers alone)
 * hold this one rule, since the white space JavaScript's `trim` and Python's
 * `str.strip` take off differ. A line is asked after a text is split at
 * GFM's line endings.
 */
export function markerOf(line: string): string | null {
  const bare = line.replace(/^[ \t]+|[ \t]+$/gu, "");
  return MARKERS.includes(bare) ? bare : null;
}

/** The fields a read of a pull request asks `gh pr view` for. */
export const VIEW_FIELDS = "number,url,state,isDraft,headRefOid,mergedAt,statusCheckRollup";

/** How much of what one process prints on each stream is kept. A list of open pull requests carries their bodies. */
const PRINTED_CHARS = 16 * 1024 * 1024;

/** How long after a process's exit its end waits for its streams to close, which a process it started can hold open. */
const STREAMS_GRACE_MS = 300;

/** Where the person's `gh` is reached, and how long each call may run. */
export interface GitHubCli {
  /** The command and the first arguments `gh` is started with. */
  gh: readonly [string, ...string[]];
  /** The environment `gh` and the push run with. */
  env: Record<string, string>;
  /** The work item's worktree, where `gh` resolves the repository. */
  cwd: string;
  limitMs: number;
}

/** How a process ended: its code, the signal that ended it, why it did not start, what it printed on each stream, and whether its time limit ended it. */
interface Ended {
  code: number | null;
  signal: string | null;
  error: string | null;
  out: string;
  err: string;
  stopped: boolean;
}

/** Runs one command with its arguments, with no shell and no terminal, and ends its process group where it passes `limitMs`. It never rejects. */
function runProcess(command: string, args: readonly string[], options: { cwd: string; env: Record<string, string>; limitMs: number }): Promise<Ended> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, env: options.env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const printed = { out: "", err: "" };
    for (const [stream, key] of [
      [child.stdout, "out"],
      [child.stderr, "err"],
    ] as const) {
      stream.setEncoding("utf8");
      stream.on("data", (text: string) => {
        if (printed[key].length < PRINTED_CHARS) printed[key] += text;
      });
    }
    let exited = false;
    let settled = false;
    let stopped = false;
    let grace: NodeJS.Timeout | undefined;
    let kill: NodeJS.Timeout | undefined;
    const signal = (name: NodeJS.Signals): void => {
      if (exited || child.pid === undefined) return;
      try {
        // The negative id names the group the process leads.
        process.kill(-child.pid, name);
      } catch {
        // The group is gone already.
      }
    };
    const limit = setTimeout(() => {
      stopped = true;
      signal("SIGTERM");
      kill = setTimeout(() => signal("SIGKILL"), GATE_KILL_AFTER_MS);
    }, options.limitMs);
    const finish = (end: Pick<Ended, "code" | "signal" | "error">): void => {
      if (settled) return;
      settled = true;
      clearTimeout(limit);
      clearTimeout(kill);
      clearTimeout(grace);
      child.stdout.destroy();
      child.stderr.destroy();
      resolve({ ...end, ...printed, stopped });
    };
    child.once("error", (error) => {
      exited = true;
      finish({ code: null, signal: null, error: error.message });
    });
    child.once("exit", (code, name) => {
      exited = true;
      grace = setTimeout(() => finish({ code, signal: name, error: null }), STREAMS_GRACE_MS);
    });
    child.once("close", (code, name) => finish({ code, signal: name, error: null }));
  });
}

/** The first line of a text that is not empty, with the white space at its ends taken off, or null where it holds none. */
function firstLine(text: string): string | null {
  return gfmLines(text).map((line) => line.trim()).find((line) => line !== "") ?? null;
}

/** Why a process did not end well, as the second half of a sentence that names it as `name`, or null where it exited with 0. */
function whyFailed(name: string, ended: Ended, limitMs: number): string | null {
  if (ended.stopped) return `${name} did not end within ${String(limitMs / 1000)} seconds and was stopped`;
  if (ended.error !== null) return `${name} did not start: ${ended.error}`;
  if (ended.signal !== null) return `the signal ${ended.signal} ended ${name}`;
  if (ended.code === 0) return null;
  const line = firstLine(ended.err) ?? firstLine(ended.out);
  return `${name} exited with code ${String(ended.code)}${line === null ? "" : `: ${line}`}`;
}

/** A list's names as a sentence joins them: `a`, `a and b`, `a, b and c`. */
function joined(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

/** The file of a command's name in the first folder of a `PATH` that holds it as a file the user may run, or null where none does. */
export function findOnPath(name: string, path: string | undefined): string | null {
  for (const folder of (path ?? "").split(":")) {
    if (folder === "") continue;
    const file = join(folder, name);
    try {
      accessSync(file, constants.X_OK);
      if (statSync(file).isFile()) return file;
    } catch {
      // Not here.
    }
  }
  return null;
}

/** The environment `gh` runs with: the one given, with no prompt and no colour. */
export function ghEnvironment(env: Record<string, string>): Record<string, string> {
  return { ...env, GH_PROMPT_DISABLED: "1", NO_COLOR: "1" };
}

// ---------------------------------------------------------------------------
// Where the branch goes.

/**
 * The remote a work item's branch is pushed to, and the base its pull
 * request is opened against, as GitHub names a branch. Where the base branch
 * names a remote's branch, as a base is read (`worktrees.ts#baseRef`), the
 * remote is that branch's and the base is its name there. Otherwise the base
 * is the local branch's name, or null where the work item has no base
 * branch, and the remote is the clone's one remote, or `origin` among
 * several. It throws, with the second half of a sentence, where none of
 * those names a remote.
 */
export async function pushTarget(worktree: string, baseBranch: string | null): Promise<{ remote: string; base: string | null }> {
  if (baseBranch !== null && (await baseRef(worktree, baseBranch)) !== `refs/heads/${baseBranch}`) {
    const from = await remoteOf(worktree, baseBranch);
    if (from !== null) return { remote: from.remote, base: from.branch };
  }
  const names = (await gitOut(worktree, ["remote"])).split("\n").filter((name) => name !== "").sort();
  const [only] = names;
  if (names.length === 1 && only !== undefined) return { remote: only, base: baseBranch };
  if (names.includes("origin")) return { remote: "origin", base: baseBranch };
  if (names.length === 0) throw new Error("the clone has no remote to push the branch to");
  const base = baseBranch === null ? "the work item has no base branch" : `the work item's base branch ${baseBranch} is on none of them`;
  throw new Error(`the clone has the remotes ${joined(names)}, none of them named origin, and ${base}, so Owlery cannot tell which to push to`);
}

/** What git prints for the arguments in a folder, or the empty text where it fails. */
async function gitOut(cwd: string, args: readonly string[]): Promise<string> {
  const ended = await runProcess("git", args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } as Record<string, string>, limitMs: GITHUB_LIMIT_MS });
  return ended.code === 0 ? ended.out : "";
}

/**
 * The title a work item's pull request is opened with: the work item's
 * title, and where that is empty, the subject of the oldest commit the
 * branch holds after its base commit, cut at `TITLE_LIMIT` characters.
 */
export async function pullRequestTitle(worktree: string, title: string, baseCommit: string | null, head: string): Promise<string> {
  let chosen = title.trim();
  if (chosen === "" && baseCommit !== null) chosen = firstLine(await gitOut(worktree, ["log", "--reverse", "--format=%s", `${baseCommit}..${head}`])) ?? "";
  return Array.from(chosen).slice(0, TITLE_LIMIT).join("");
}

/**
 * Pushes the commit given to the branch on the remote with the person's git,
 * from the worktree: `git push <remote> <commit>:refs/heads/<branch>`, with
 * no force, with `GIT_TERMINAL_PROMPT=0` so a push that would ask for a
 * credential fails, and with the repository's own push hooks. The commit is
 * named by its id, so a commit that lands on the branch after the stage read
 * its head is not pushed. The remote's branch is then written as the local
 * branch's upstream with `git config`, which a push that names a commit does
 * not set. It throws, with the second half of a sentence, where the push or
 * a `git config` did not end well: for a refused push, the sentence holds
 * git's first line that is not its `To <address>` line, which names the
 * remote and not why it refused.
 */
export async function pushBranch(cli: GitHubCli, remote: string, branch: string, commit: string): Promise<void> {
  const ended = await runProcess("git", ["push", remote, `${commit}:refs/heads/${branch}`], { cwd: cli.cwd, env: { ...cli.env, GIT_TERMINAL_PROMPT: "0" }, limitMs: cli.limitMs });
  const why = whyFailed(`git push to ${remote}`, ended, cli.limitMs);
  if (why !== null) {
    const said = gfmLines(ended.err).filter((line) => !/^To /u.test(line.trim()));
    const line = ended.code === null ? null : firstLine(said.join("\n"));
    throw new Error(line === null ? why : `git push to ${remote} failed: ${line}`);
  }
  for (const [key, value] of [
    [`branch.${branch}.remote`, remote],
    [`branch.${branch}.merge`, `refs/heads/${branch}`],
  ] as const) {
    const failed = whyFailed(`git config ${key}`, await runProcess("git", ["config", key, value], { cwd: cli.cwd, env: cli.env, limitMs: cli.limitMs }), cli.limitMs);
    if (failed !== null) throw new Error(failed);
  }
}

// ---------------------------------------------------------------------------
// The calls of `gh`.

/** Runs `gh pr <call>` with the arguments, and gives what it printed. It throws, with the second half of a sentence, where the call did not end well. */
async function pr(cli: GitHubCli, call: "list" | "create" | "edit" | "view", args: readonly string[]): Promise<string> {
  const [command, ...first] = cli.gh;
  const ended = await runProcess(command, [...first, "pr", call, ...args], { cwd: cli.cwd, env: cli.env, limitMs: cli.limitMs });
  const why = whyFailed(`gh pr ${call}`, ended, cli.limitMs);
  if (why !== null) throw new Error(why);
  return ended.out;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** A value of JSON, or undefined where the text is none. */
function json(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** An open pull request of the branch, as `gh pr list` gives it. */
export interface Listed {
  number: number;
  url: string;
  head: string;
  body: string;
}

/** The open pull requests whose head is the branch, through `gh pr list`. It throws where the call fails or its answer does not read. */
export async function openPullRequests(cli: GitHubCli, branch: string): Promise<Listed[]> {
  const value = json(await pr(cli, "list", ["--head", branch, "--state", "open", "--json", "number,url,headRefOid,body"]));
  if (!Array.isArray(value)) throw new Error("gh pr list printed no list Owlery reads");
  return value.map((entry): Listed => {
    if (!isRecord(entry) || typeof entry.number !== "number" || typeof entry.url !== "string") throw new Error("gh pr list printed a pull request with no number or no address");
    return { number: entry.number, url: entry.url, head: typeof entry.headRefOid === "string" ? entry.headRefOid : "", body: typeof entry.body === "string" ? entry.body : "" };
  });
}

/** Opens a pull request of the branch, ready and not a draft, with the title, the body's file and the base where one is given, through `gh pr create`, and gives the address `gh` printed. */
export async function createPullRequest(cli: GitHubCli, given: { branch: string; base: string | null; title: string; bodyFile: string }): Promise<string> {
  const printed = await pr(cli, "create", ["--head", given.branch, "--title", given.title, "--body-file", given.bodyFile, ...(given.base === null ? [] : ["--base", given.base])]);
  const address = [...printed.matchAll(/https?:\/\/\S+/gu)].at(-1)?.[0];
  if (address === undefined) throw new Error("gh pr create printed no address of a pull request");
  return address;
}

/** Sends a pull request the body in the file, through `gh pr edit`. Its title and everything else stay as they are. */
export async function editPullRequest(cli: GitHubCli, url: string, bodyFile: string): Promise<void> {
  await pr(cli, "edit", [url, "--body-file", bodyFile]);
}

/** What `gh pr view` gives of a pull request that the stage and the watch store: its number, its address, its state, its head and its checks. */
export type Viewed = Pick<PullRequest, "number" | "url" | "state" | "head" | "checks" | "list" | "listCount">;

const STATES: Record<string, PullRequest["state"]> = { OPEN: "open", MERGED: "merged", CLOSED: "closed" };

/** Reads a pull request by its address, through `gh pr view`. It throws where the call fails or its answer does not read, a `statusCheckRollup` that is no list among it. */
export async function viewPullRequest(cli: GitHubCli, url: string): Promise<Viewed> {
  const value = json(await pr(cli, "view", [url, "--json", VIEW_FIELDS]));
  const state = isRecord(value) && typeof value.state === "string" ? STATES[value.state] : undefined;
  if (!isRecord(value) || typeof value.number !== "number" || typeof value.url !== "string" || typeof value.headRefOid !== "string" || state === undefined || !Array.isArray(value.statusCheckRollup)) throw new Error("gh pr view printed no pull request Owlery reads");
  return { number: value.number, url: value.url, state, head: value.headRefOid, ...checksOf(value.statusCheckRollup) };
}

/** The conclusions of a completed check run that pass it. */
const PASSING_CONCLUSIONS: ReadonlySet<unknown> = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);

/** The states of a status context that is still pending. */
const PENDING_CONTEXTS: ReadonlySet<unknown> = new Set(["PENDING", "EXPECTED"]);

/** A text value, or null where the value is none. */
const textOr = (value: unknown): string | null => (typeof value === "string" ? value : null);

/**
 * One entry of a `statusCheckRollup` as a check, `place` being its place in
 * the list from 1. A `CheckRun` is named by its `name` and links to its
 * `detailsUrl`; it is pending until its `status` is `COMPLETED`, then passed
 * for the conclusions `SUCCESS`, `NEUTRAL` and `SKIPPED`, and failed for
 * every other. A `StatusContext` is named by its `context` and links to its
 * `targetUrl`; it is pending for the state `PENDING` or `EXPECTED`, passed
 * for `SUCCESS`, and failed for every other. An entry that is neither, or
 * lacks its name or its status or state, is a failed check named by its
 * place, with no link.
 */
function checkOf(entry: unknown, place: number): PullRequestCheck {
  if (isRecord(entry) && entry.__typename === "CheckRun" && typeof entry.name === "string" && typeof entry.status === "string") {
    return { name: entry.name, state: entry.status !== "COMPLETED" ? "pending" : PASSING_CONCLUSIONS.has(entry.conclusion) ? "passed" : "failed", link: textOr(entry.detailsUrl) };
  }
  if (isRecord(entry) && entry.__typename === "StatusContext" && typeof entry.context === "string" && typeof entry.state === "string") {
    return { name: entry.context, state: PENDING_CONTEXTS.has(entry.state) ? "pending" : entry.state === "SUCCESS" ? "passed" : "failed", link: textOr(entry.targetUrl) };
  }
  return { name: `Check ${String(place)}`, state: "failed", link: null };
}

/** The order the kept checks are listed in: the failed ones first, so the first the line names is among the kept, then the pending ones. */
const LISTED_FIRST: Record<PullRequestCheck["state"], number> = { failed: 0, pending: 1, passed: 2 };

/**
 * A pull request's checks, as `gh pr view` gives them in its
 * `statusCheckRollup`: each entry read by `checkOf`, the result `none`
 * where the list is empty, `failed` where one check failed, `pending` where
 * none failed and one is pending, and `passed` otherwise. `CHECKS_KEPT` of
 * them are kept, the failed ones first and the pending ones next, each kind
 * in the order GitHub lists them, with the count of them all.
 */
export function checksOf(rollup: readonly unknown[]): Pick<PullRequest, "checks" | "list" | "listCount"> {
  const all = rollup.map((entry, index) => checkOf(entry, index + 1));
  const has = (state: PullRequestCheck["state"]): boolean => all.some((check) => check.state === state);
  const checks = all.length === 0 ? "none" : has("failed") ? "failed" : has("pending") ? "pending" : "passed";
  const list = all.map((check, index) => ({ check, index })).sort((a, b) => LISTED_FIRST[a.check.state] - LISTED_FIRST[b.check.state] || a.index - b.index);
  return { checks, list: list.slice(0, CHECKS_KEPT).map(({ check }) => check), listCount: all.length };
}

// ---------------------------------------------------------------------------
// The body.

/** What a pull request's body is composed from, read at the branch's head: each part null or empty where its record does not stand. */
export interface BodyRecords {
  /** The work item's directory, from the repository's top. */
  directory: string;
  /** The newest verdict block of `guarantee.md`, from its opening fence to its closing fence, as the record holds it. */
  block: string[];
  changelog: string | null;
  /** The newest run block of `trail/gate.md`, from fence to fence. */
  gate: string[] | null;
  /** Each decision of `decisions.md`: what was decided, its grounds and its state. */
  decisions: { decided: string; grounds: string; state: string }[];
}

/** A path under the work item's directory, from the repository's top, with `/` between its parts. */
function under(directory: string, path: string): string {
  return `${directory.replace(/\/+$/u, "")}/${path}`;
}

/**
 * Reads what a pull request's body is composed from, at the commit given,
 * through the daemon's own readers. `directory` is the work item's directory
 * from the worktree's top. It throws where `guarantee.md` holds no verdict
 * block there. The back of the seal is composed apart
 * (`../shared/seal-back#composeBack`), since it reads the ledger too.
 */
export async function bodyRecords(worktree: string, head: string, directory: string): Promise<BodyRecords> {
  const at = (path: string): Promise<string | null> => fileAt(worktree, head, under(directory, path));
  const guarantee = (await at("guarantee.md")) ?? "";
  const verdict = readGuarantee(guarantee).verdicts.at(-1);
  if (verdict === undefined) throw new Error(`${under(directory, "guarantee.md")} holds no verdict block at the head commit`);
  const gateText = (await at("trail/gate.md")) ?? "";
  const run = readGate(gateText).runs.at(-1);
  const decisionText = await at("decisions.md");
  return {
    directory,
    block: gfmLines(guarantee).slice(verdict.line - 1, verdict.end),
    changelog: await at("changelog.md"),
    gate: run === undefined ? null : gfmLines(gateText).slice(run.line - 1, run.end),
    decisions: decisionText === null ? [] : readDecisionRecord(decisionText).decisions.map(({ decided, grounds, state }) => ({ decided, grounds, state: state.is })),
  };
}

/**
 * The seal section of a body: the two marker lines around a heading, the
 * sentence that names the record and says that the seal binds the commit it
 * names, and the newest verdict block as the record holds it. The sentence
 * stays true after a later push breaks the seal, since the check `Owlery
 * seal` says whether the seal holds at the head, and no stage rewrites the
 * body until a new seal is given.
 */
export function sealSection(records: Pick<BodyRecords, "directory" | "block">): string {
  return [SECTION_OPEN, "## Owlery seal", "", `The newest verdict of \`${under(records.directory, "guarantee.md")}\`. A seal binds the commit it names, and the check \`Owlery seal\` says whether it holds at this pull request's head commit:`, "", ...records.block, SECTION_CLOSE].join("\n");
}

/** One finding's line of a round's list: its number, its symptom as a sentence, each place in code, its severity, its close, and the earlier finding or round it names. */
function findingText(line: FindingLine): string {
  const says = /[.!?]$/u.test(line.says) ? line.says : `${line.says}.`;
  const places = line.places.length === 0 ? "" : ` ${line.places.map((place) => `\`${place}\``).join(", ")}.`;
  return `- ${String(line.number)}. ${says}${places} ${line.severity}. ${line.close}.${line.names === null ? "" : ` ${line.names}`}`;
}

/** One row of a Markdown table, an empty cell written as one space. */
function tableRow(cells: readonly string[]): string {
  return `|${cells.map((cell) => (cell === "" ? " " : ` ${cell} `)).join("|")}|`;
}

/** One stage's row of the back's table, under `STAGE_COLUMNS`. */
function stageRow(line: StageLine): string {
  const { tokens } = line;
  return tableRow([line.name, line.ended ?? "", line.time, tokens === null ? "" : `${tokens.input} / ${tokens.output}`, tokens === null ? "" : `${tokens.cacheRead} / ${tokens.cacheWritten}`, costText(line.cost)]);
}

/** How many rounds of the back hold findings, which are the rounds whose list can give way at the limit. */
function listedRounds(back: Back): number {
  return back.rounds.filter((round) => round.findings.length > 0).length;
}

/**
 * The back's section of a body, as Markdown between its two marker lines:
 * the head's sentences, each round under its title with one line for each
 * finding, the sentence of a round with none and the lines of its record not
 * read, one table of every stage that ran, the rounds' stages first, then the
 * sums with the sentence on a converted cost, the sessions outside the
 * chain, the refused calls and the lines not read. It holds no seal and no
 * seal's record, which the seal section above it carries. The last `held`
 * rounds that hold findings have their list given way to one line that
 * names the round's record. Every line it writes opens with `#`, `-` or `|`,
 * or is a sentence of the composition's own, so none is a marker line.
 */
export function backSection(back: Back, directory: string, held = 0): string {
  const listed = back.rounds.filter((round) => round.findings.length > 0);
  const given = new Set(listed.slice(Math.max(0, listed.length - held)).map((round) => round.round));
  const blocks = [`${BACK_OPEN}\n## The back of the seal`, back.head.join(" ")];
  for (const round of back.rounds) {
    blocks.push(`### ${round.title}`);
    if (given.has(round.round)) blocks.push(`\`${under(directory, `${ROUNDS_FOLDER}/${roundFile(round.round)}`)}\` holds this round's findings.`);
    else if (round.findings.length > 0) blocks.push(round.findings.map(findingText).join("\n"));
    if (round.says !== null) blocks.push(round.says);
    if (round.unread !== null) blocks.push(round.unread);
  }
  const stages = [...back.rounds.flatMap((round) => round.stages), ...back.after];
  if (stages.length > 0) blocks.push([tableRow(STAGE_COLUMNS), `|${STAGE_COLUMNS.map(() => "---").join("|")}|`, ...stages.map(stageRow)].join("\n"));
  const sums = [...back.sums, ...(back.converted === null ? [] : [back.converted])];
  if (sums.length > 0) blocks.push(sums.join(" "));
  if (back.outside !== null) blocks.push(back.outside);
  if (back.refused.length > 0) blocks.push(back.refused.map((line) => `- ${line}`).join("\n"));
  if (back.unread.length > 0) blocks.push(back.unread.join(" "));
  return `${blocks.join("\n\n")}\n${BACK_CLOSE}`;
}

/**
 * A new pull request's body: the seal section, the back's section
 * (`backSection`), then, each under its own heading and each only where its
 * record stands, the changelog whole, the newest run of the broad gate and
 * each decision made without asking. Where the body would pass `limit`
 * UTF-16 code units, the parts below the back's section are replaced, the
 * last first, by a line under the part's heading that names its record, and
 * then each round's list of findings gives way, the last round first, until
 * the body fits. The back's table of the stages and its sums stay, since no
 * committed record holds a cost. A part whose text holds a marker line
 * (`markerOf`) of either section is replaced so whatever the body's length,
 * since neither the replacing of a section nor the check reads a fence when
 * it counts marker lines: the body holds each marker once. The seal section
 * is never cut.
 */
export function pullRequestBody(records: BodyRecords, back: Back, limit = BODY_LIMIT): string {
  const held = (heading: string, path: string): string => `${heading}\n\n\`${under(records.directory, path)}\` holds this part.`;
  const parts: { whole: string; held: string }[] = [];
  if (records.changelog !== null) parts.push({ whole: `## What changed\n\n${records.changelog.trimEnd()}`, held: held("## What changed", "changelog.md") });
  if (records.gate !== null) parts.push({ whole: `## Broad gate\n\n${records.gate.join("\n")}`, held: held("## Broad gate", "trail/gate.md") });
  if (records.decisions.length > 0) {
    const listed = records.decisions.map(({ decided, grounds, state }) => `- Decided: ${decided}\n  Grounds: ${grounds}\n  State: ${state}`);
    parts.push({ whole: `## Decided without asking\n\n${listed.join("\n")}`, held: held("## Decided without asking", "decisions.md") });
  }
  const marked = (text: string): boolean => gfmLines(text).some((line) => markerOf(line) !== null);
  const texts = parts.map(({ whole, held: line }) => (marked(whole) ? line : whole));
  let given = 0;
  const body = (): string => `${[sealSection(records), backSection(back, records.directory, given), ...texts].join("\n\n")}\n`;
  for (let index = parts.length - 1; index >= 0 && body().length > limit; index -= 1) texts[index] = parts[index]?.held ?? "";
  while (given < listedRounds(back) && body().length > limit) given += 1;
  return body();
}

/** A section Owlery writes into a body: its two marker lines, and how a refusal names it. */
interface Section {
  open: string;
  close: string;
  named: string;
}

const SEAL: Section = { open: SECTION_OPEN, close: SECTION_CLOSE, named: "seal section" };
const BACK: Section = { open: BACK_OPEN, close: BACK_CLOSE, named: "section of the back of the seal" };

/**
 * A body with one of its sections replaced: the lines from the section's
 * opening marker to its closing marker, each read as `markerOf` reads a line,
 * give way to the section, and no other line changes. The section's lines end
 * as the body's first line does. Where the body holds neither marker, the
 * section is put after the line `after` names, with a blank line on each
 * side, or before the body's first line where `after` names none. It throws,
 * with the second half of a sentence, where the body holds more than one
 * opening or closing marker of the section, or no closing marker after its
 * opening one.
 */
function withSection(body: string, section: string, which: Section, after: string | null): string {
  const pieces = body.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/gu) ?? [];
  const ending = (piece: string): string => /(?:\r\n|\r|\n)$/u.exec(piece)?.[0] ?? "";
  const eol = pieces.map(ending).find((end) => end !== "") ?? "\n";
  const text = section.split("\n").join(eol);
  const markers = pieces.map((piece) => markerOf(piece.replace(/(?:\r\n|\r|\n)$/u, "")));
  const opens = markers.flatMap((marker, index) => (marker === which.open ? [index] : []));
  const closes = markers.flatMap((marker, index) => (marker === which.close ? [index] : []));
  if (opens.length === 0 && closes.length === 0) {
    const at = after === null ? -1 : markers.indexOf(after);
    if (at === -1) return body === "" ? `${text}${eol}` : `${text}${eol}${eol}${body}`;
    const before = `${pieces.slice(0, at + 1).join("")}${ending(pieces[at] ?? "") === "" ? eol : ""}`;
    const rest = pieces.slice(at + 1).join("");
    const blank = rest === "" || pieces[at + 1] === ending(pieces[at + 1] ?? "");
    return `${before}${eol}${text}${eol}${blank ? "" : eol}${rest}`;
  }
  for (const [marker, found] of [
    [which.open, opens],
    [which.close, closes],
  ] as const) {
    if (found.length > 1) throw new Error(`the body holds ${String(found.length)} \`${marker}\` lines, and Owlery replaces one ${which.named}`);
  }
  const [open] = opens;
  const [close] = closes;
  if (open === undefined || close === undefined || close < open) throw new Error(`the body holds no \`${which.close}\` line after its \`${which.open}\` line, so Owlery cannot tell where its ${which.named} ends`);
  return [...pieces.slice(0, open), `${text}${ending(pieces[close] ?? "")}`, ...pieces.slice(close + 1)].join("");
}

/**
 * A body with its seal section replaced (`withSection`). Where the body holds
 * no marker line of the seal, the section is put before its first line.
 */
export function withSealSection(body: string, section: string): string {
  return withSection(body, section, SEAL, null);
}

/**
 * A body with its back's section replaced by the back given
 * (`withSection`), as the daemon rewrites it at each seal sent to an open
 * pull request. Where the body holds no marker line of the back, the section
 * is put after the seal section, or before the body's first line where it
 * holds no seal section. Where the body would pass `limit` UTF-16 code units,
 * each round's list of findings gives way, the last round first, as in a new
 * body, and no line outside the section changes.
 */
export function withBackSection(body: string, back: Back, directory: string, limit = BODY_LIMIT): string {
  let given = 0;
  let text = withSection(body, backSection(back, directory, given), BACK, SECTION_CLOSE);
  while (given < listedRounds(back) && text.length > limit) {
    given += 1;
    text = withSection(body, backSection(back, directory, given), BACK, SECTION_CLOSE);
  }
  return text;
}

// ---------------------------------------------------------------------------
// The pull request as the store keeps it.

function isCheck(value: unknown): value is PullRequestCheck {
  return isRecord(value) && typeof value.name === "string" && ["pending", "passed", "failed"].includes(value.state as string) && (value.link === null || typeof value.link === "string");
}

/** Whether a value is a pull request as the store writes one. */
export function isPullRequest(value: unknown): value is PullRequest {
  return (
    isRecord(value) &&
    typeof value.number === "number" &&
    typeof value.url === "string" &&
    ["open", "merged", "closed"].includes(value.state as string) &&
    typeof value.head === "string" &&
    typeof value.pushed === "string" &&
    ["none", "pending", "passed", "failed"].includes(value.checks as string) &&
    Array.isArray(value.list) &&
    value.list.every(isCheck) &&
    typeof value.listCount === "number" &&
    typeof value.readAt === "number" &&
    (value.failure === null || typeof value.failure === "string")
  );
}

/** Only the fields of a pull request, each check a copy. */
export function pullRequestOf(value: PullRequest): PullRequest {
  const { number, url, state, head, pushed, checks, list, listCount, readAt, failure } = value;
  return { number, url, state, head, pushed, checks, list: list.map(({ name, state: checked, link }) => ({ name, state: checked, link })), listCount, readAt, failure };
}
