// The git side of a work item: its branch and its worktree, a separate folder
// checked out from the same repository. Git runs with execFile or spawn and
// arguments, never through a shell, because titles and folders come from the
// person.
import { execFile, execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { generateName } from "../shared/names";
import { BASE_FETCH_MS, type BaseFetch, type Changes, type CommitInfo, type FileChange, type WorkItemLoss } from "../shared/protocol";

const SLUG_LENGTH = 40;
/** How many of a branch's commits, and of the files it changed, the daemon lists. */
const COMMITS_LISTED = 20;
const FILES_LISTED = 50;

/** Where worktrees are made: OWLERY_WORKTREES when set, and ~/.owlery/worktrees otherwise. */
export function worktreesRoot(env: NodeJS.ProcessEnv): string {
  return env.OWLERY_WORKTREES || join(homedir(), ".owlery", "worktrees");
}

/**
 * The name a title gives its branch and its folder: lower case, each run of
 * characters outside a-z0-9 one dash, at most 40 characters, no dash at either
 * end, and an empty string where the title leaves nothing.
 */
export function slugFor(title: string): string {
  const trim = (text: string): string => text.replace(/^-+|-+$/g, "");
  return trim(trim(title.toLowerCase().replace(/[^a-z0-9]+/g, "-")).slice(0, SLUG_LENGTH));
}

/**
 * How much of git's output a read of a branch's log or diff, or of the
 * repository's branches, holds. `--numstat` prints a line for every file, and
 * the lists are cut to their length only after the read, so the limit Node
 * gives a child's output, a megabyte, ends the read of a branch that changed
 * some thousands of files, and of a repository that holds as many branches.
 */
const BRANCH_OUTPUT_BYTES = 256 * 1024 * 1024;

function git(cwd: string, args: string[], maxBuffer = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8", maxBuffer }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message));
      else resolve(stdout);
    });
  });
}

async function branchExists(repo: string, branch: string): Promise<boolean> {
  try {
    await git(repo, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

export interface Worktree {
  /** The top-level folder of the repository's main checkout. */
  repo: string;
  branch: string;
  /** The worktree's folder, `<root>/<repo name>/<slug>`. */
  worktree: string;
  /** The commit the branch was cut at. */
  baseCommit: string;
  /** The base the branch was cut at, a local branch or a remote's, by its name, or null where the repository had no default base and the branch was cut at the checkout's commit. */
  baseBranch: string | null;
}

/** What a creation in a repository would give, and the bases a person can choose among. */
export interface WorktreePlan {
  branch: string;
  worktree: string;
  /** The local branches by name: the one the checkout stands on first, then the others, the newest commit first, without a local branch that names another ref, such as an alias `main` of `master`. */
  localBases: string[];
  /** The remotes' branches, named `<remote>/<branch>`, the newest commit first, without a remote's `HEAD` entry and without a name a local branch bears. */
  remoteBases: string[];
  /** The base a creation without one is cut at, a name of one of the two lists, or null where the repository has none. */
  defaultBase: string | null;
}

/** What names a work item: its title, the name its client made for it, and the source of randomness a name is drawn from where neither leaves a slug. */
interface Naming {
  title: string;
  name?: string;
  random?: () => number;
}

/** The base a person chose for a repository's new work items, given the repository's top-level folder, or null where they chose none. */
type ChosenBase = (repo: string) => string | null;

/**
 * What git prints of a folder, a line each: the top-level folder of the
 * checkout the folder is in, that checkout's git directory, and the
 * repository's common git directory. It fails outside a checkout, inside a
 * git directory among them. Precondition: git 2.31 or later, the first with
 * `--path-format`.
 */
const WHERE = ["rev-parse", "--path-format=absolute", "--show-toplevel", "--git-dir", "--git-common-dir"];

/**
 * The top-level folder of the main checkout, where `WHERE` printed one git
 * directory twice: the folder is then in the main checkout, and git names
 * that checkout's folder wherever its git directory stands. Null in a
 * linked worktree, whose git directory is not the common one.
 */
function checkoutOf(where: string): string | null {
  const [top = "", gitDir = "", common = ""] = where.trim().split("\n");
  return top !== "" && gitDir !== "" && gitDir === common ? top : null;
}

/** What git lists of a repository's worktrees. The first is the main checkout's top-level folder where the git directory is that folder's `.git`, the git directory itself where it stands elsewhere, and a bare repository's folder, marked `bare`. */
const MAIN_CHECKOUT = ["worktree", "list", "--porcelain"];

/** The first worktree among what `git worktree list --porcelain` printed, which `MAIN_CHECKOUT` says what it is, and whether git marked it `bare`. Null where git printed none. */
export function mainCheckout(listed: string): { folder: string; bare: boolean } | null {
  // The first block ends at the first empty line, and its first line is `worktree` and the folder.
  const [first = "", ...rest] = (listed.split("\n\n")[0] ?? "").split("\n");
  if (!first.startsWith("worktree ")) return null;
  return { folder: first.slice("worktree ".length), bare: rest.includes("bare") };
}

/**
 * The main checkout of a folder that `WHERE` named no checkout for, a linked
 * worktree's among them, from the first worktree git lists. Refused where
 * git lists none, where the first is bare, and where it is a git directory
 * that stands apart from its checkout, a submodule's or one made with
 * `--separate-git-dir`: no `.git` stands at its top, and git names no
 * checkout for it.
 */
function mainOf(folder: string, main: { folder: string; bare: boolean } | null): string {
  if (main === null) throw new Error(`${folder} is not inside a git repository`);
  if (main.bare) throw new Error(`${folder} belongs to a bare repository, which has no checkout to keep`);
  if (!existsSync(join(main.folder, ".git"))) throw new Error(`${folder} is a worktree of a repository whose main checkout git does not name`);
  return main.folder;
}

/**
 * The repository a folder is inside: the top-level folder of its main
 * checkout. Where the folder is in the main checkout, that is the
 * checkout's own top-level folder, though its git directory stands
 * elsewhere, as a submodule's does. Where it is in a linked worktree, it is
 * the first worktree git lists, so the folder names the repository the
 * worktree belongs to, and never a repository of its own. A folder outside
 * any git repository is refused, and so is one whose repository has a bare
 * main checkout, which has no folder to keep, and a linked worktree whose
 * main checkout git does not name (`mainOf`).
 */
export async function repositoryOf(folder: string): Promise<string> {
  let checkout: string | null = null;
  try {
    checkout = checkoutOf(await git(folder, WHERE));
  } catch {
    // No checkout holds the folder: a bare repository's folder, or one outside any repository. The list below says which.
  }
  if (checkout !== null) return checkout;
  let main: { folder: string; bare: boolean } | null;
  try {
    main = mainCheckout(await git(folder, MAIN_CHECKOUT));
  } catch {
    main = null;
  }
  return mainOf(folder, main);
}

/**
 * How long the daemon's start waits on git for one folder of
 * `work-items.json`. A folder git does not answer for in that time is one it
 * cannot read. The app gives a daemon it started ten seconds to answer
 * (`ensureDaemon` of src/main/daemon-client.ts), and this read stands before
 * the daemon listens, so the wait for one folder is a fifth of that.
 */
const START_READ_MS = 2000;

/**
 * The repository a folder is inside, as `repositoryOf` reads it, read
 * without a turn of the event loop: the daemon's store reads each folder of
 * `work-items.json` this way at its start, before the daemon listens. Null
 * where `repositoryOf` refuses the folder and where git does not answer
 * within `START_READ_MS` for the folder, over the two commands a folder
 * outside a main checkout takes.
 */
export function repositoryOfSync(folder: string): string | null {
  const until = Date.now() + START_READ_MS;
  const read = (args: string[]): string => execFileSync("git", args, { cwd: folder, encoding: "utf8", timeout: Math.max(1, until - Date.now()), stdio: ["ignore", "pipe", "ignore"] });
  let checkout: string | null = null;
  try {
    checkout = checkoutOf(read(WHERE));
  } catch {
    // As in `repositoryOf`.
  }
  if (checkout !== null) return checkout;
  try {
    return mainOf(folder, mainCheckout(read(MAIN_CHECKOUT)));
  } catch {
    return null;
  }
}

/**
 * The branch and the folder a work item gets: `owlery/<name>` and
 * `<root>/<repository's folder name>/<name>`. The name is the first of these
 * that is not empty: the slug of the title, the slug of the name sent, a
 * generated name. Where the branch or the folder exists, -2, -3 and so on are
 * appended to both until neither does.
 */
async function placeFor(repo: string, root: string, naming: Naming): Promise<{ branch: string; worktree: string }> {
  const name = slugFor(naming.title) || slugFor(naming.name ?? "") || generateName(naming.random);
  const parent = join(root, basename(repo));
  for (let n = 1; ; n++) {
    const numbered = n === 1 ? name : `${name}-${n}`;
    const branch = `owlery/${numbered}`;
    const worktree = join(parent, numbered);
    if (!existsSync(worktree) && !(await branchExists(repo, branch))) return { branch, worktree };
  }
}

/** The name of the branch HEAD is on in the folder, or null where it is on none. */
async function branchOfHead(folder: string): Promise<string | null> {
  try {
    const ref = (await git(folder, ["symbolic-ref", "--quiet", "HEAD"])).trim();
    return ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : null;
  } catch {
    return null;
  }
}

/**
 * The ref a base's name is read as: the local branch of that name where one
 * exists, and the remote's branch of that name otherwise. Null where the name
 * is neither, a remote's `HEAD` entry and a local branch that names another
 * ref among them, and where the repository is gone. Git is given the name
 * only inside a full ref.
 */
async function baseRef(repo: string, base: string): Promise<string | null> {
  const local = `refs/heads/${base}`;
  const remote = `refs/remotes/${base}`;
  let refs: string;
  try {
    // A pattern also matches the refs under it, as `feat` matches `feat/login`, so each line's ref is compared whole.
    refs = await git(repo, ["for-each-ref", "--format=%(refname) %(symref)", local, remote], BRANCH_OUTPUT_BYTES);
  } catch {
    return null;
  }
  const lines = refs.split("\n");
  if (lines.includes(`${local} `)) return local;
  // A ref that names another, as a remote's `HEAD` does, has that ref after its own name on its line, so neither comparison holds for one.
  return lines.includes(`${remote} `) ? remote : null;
}

/** How long, in milliseconds, the result of a fetch of a remote's branch serves a creation from that branch, where the keeper of the fetches is given no other time. */
export const BASE_FRESH_MS = 60_000;

/** How much of what a fetch printed is kept, of which the first line is said. */
const FETCH_PRINTED_CHARS = 64 * 1024;

/** How long, in milliseconds, a fetch waits after git has exited for the pipe to deliver what git printed, where the pipe has not closed by then. */
const FETCH_PRINTED_GRACE_MS = 300;

/**
 * Asks one remote for one branch and writes the one ref the clone keeps that
 * branch under, `refs/remotes/<remote>/<branch>`: no tag, no `FETCH_HEAD`, no
 * submodule, and no other ref whatever refspecs the remote's configuration
 * holds, since `--refmap=` leaves the one refspec given here. Git runs with
 * `GIT_TERMINAL_PROMPT=0`, so it asks nothing on a terminal. It gives null
 * where git exited with 0, and otherwise why the ref is as it was: the first
 * line git printed that is not empty, or that the remote did not answer where
 * `waitMs` passed first, or that the fetch was ended where `ended` fired
 * first.
 *
 * Git is started as the leader of a process group of its own, and a fetch
 * that is given up is ended by a signal to that group, so the transport git
 * started for it, such as an `ssh`, ends with it. A limit on git's process
 * alone would leave that one running.
 *
 * A fetch is over once git has exited, whether or not the pipe git printed to
 * has closed. A process git's transport left behind, such as the background
 * process an `ssh` keeps for a shared connection, can hold that pipe open for
 * as long as it runs, in a session of its own that no signal to git's group
 * reaches. So the result is read from git's exit code, `FETCH_PRINTED_GRACE_MS`
 * after the exit where the pipe is still open then, and a fetch whose git has
 * exited is not given up and its group is not signalled.
 */
function askRemote(repo: string, remote: string, branch: string, waitMs: number, ended?: AbortSignal): Promise<string | null> {
  return new Promise((resolve) => {
    if (ended?.aborted) {
      resolve(`the fetch from ${remote} was ended`);
      return;
    }
    const args = ["fetch", "--quiet", "--no-tags", "--no-recurse-submodules", "--no-auto-maintenance", "--no-write-fetch-head", "--refmap=", remote, `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`];
    const child = spawn("git", args, { cwd: repo, detached: true, stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
    let printed = "";
    let givenUp: string | null = null;
    let exited = false;
    let grace: NodeJS.Timeout | undefined;
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (text: string) => {
      if (printed.length < FETCH_PRINTED_CHARS) printed += text;
    });
    const giveUp = (why: string): void => {
      // Once git has exited its group may be gone, and the group's id may name another's processes.
      if (exited || givenUp !== null || child.pid === undefined) return;
      givenUp = why;
      try {
        // The negative id names the group git leads.
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // The group is gone already.
      }
    };
    const timer = setTimeout(() => giveUp(`${remote} did not answer in ${String(waitMs / 1000)} seconds`), waitMs);
    const onEnded = (): void => giveUp(`the fetch from ${remote} was ended`);
    ended?.addEventListener("abort", onEnded, { once: true });
    const settle = (failure: string | null): void => {
      clearTimeout(timer);
      clearTimeout(grace);
      ended?.removeEventListener("abort", onEnded);
      resolve(failure);
    };
    /** Ends a fetch that was not given up, by git's exit code and what git printed. */
    const settleExit = (code: number | null): void => {
      const line = printed.split("\n").find((text) => text.trim() !== "");
      settle(code === 0 ? null : (line?.trim() ?? `git fetch ended with ${String(code)}`));
    };
    child.on("error", (error) => settle(error.message));
    // A fetch is over once git has exited, since what git started may hold the pipe open after it. One given up ends at
    // the exit. One that was not ends when the pipe closes, which is when all git printed has arrived, or after the
    // grace where the pipe is still open then.
    child.on("exit", (code) => {
      exited = true;
      if (givenUp !== null) settle(givenUp);
      else grace = setTimeout(() => settleExit(code), FETCH_PRINTED_GRACE_MS);
    });
    child.on("close", (code) => {
      if (givenUp === null) settleExit(code);
    });
  });
}

/**
 * The remote a remote's branch belongs to, and the branch's name there: the
 * remote is the one of `git remote` whose name, followed by a slash, opens
 * the base's name, the longest such name where several do. Null where no
 * remote's name opens it.
 */
async function remoteOf(repo: string, base: string): Promise<{ remote: string; branch: string } | null> {
  const names = await git(repo, ["remote"]).then((printed) => printed.split("\n"), () => []);
  const remote = names.filter((name) => name !== "" && base.startsWith(`${name}/`)).sort((a, b) => b.length - a.length)[0];
  return remote === undefined ? null : { remote, branch: base.slice(remote.length + 1) };
}

/** When the clone's ref last moved, in milliseconds, as the newest entry of its reflog says, or null where the reflog holds none. */
async function lastMoved(repo: string, ref: string): Promise<number | null> {
  const entry = await git(repo, ["log", "-g", "-1", "--date=unix", "--format=%gd", ref]).catch(() => "");
  const seconds = /@\{(\d+)\}\s*$/.exec(entry)?.[1];
  return seconds === undefined ? null : Number(seconds) * 1000;
}

const noBase = (repo: string, base: string): Error => new Error(`${repo} has no branch ${base} to start a work item from`);

/** The fetch of a base that `baseRef` read as `ref`, as `fetchBase` states it. */
async function fetchRef(repo: string, base: string, ref: string, options: { waitMs?: number; ended?: AbortSignal }): Promise<BaseFetch> {
  const commit = async (): Promise<string> => (await git(repo, ["rev-parse", "--verify", ref])).trim();
  // A local branch is cut where it stands, and no command that asks a remote runs for it.
  if (ref === `refs/heads/${base}`) return { base, commit: await commit(), fetch: "none", failure: null, since: null };
  const from = await remoteOf(repo, base);
  const failure = from === null ? `the clone has no remote for ${base}` : await askRemote(repo, from.remote, from.branch, options.waitMs ?? BASE_FETCH_MS, options.ended);
  if (failure === null) return { base, commit: await commit(), fetch: "fetched", failure: null, since: null };
  return { base, commit: await commit(), fetch: "kept", failure, since: await lastMoved(repo, ref) };
}

/**
 * Fetches a base of the repository, read as `baseRef` reads it, and gives
 * what `BaseFetch` states. A remote's branch is asked of its remote, as
 * `askRemote` and `remoteOf` state, for `waitMs` at most, `BASE_FETCH_MS`
 * where none is given, and until `ended` fires. A fetch that fails, one given
 * up among them, leaves the clone's ref as it was and is no error: the result
 * is `kept`. A local branch asks no remote. A base that is none of the
 * repository's is refused.
 */
export async function fetchBase(repo: string, base: string, options: { waitMs?: number; ended?: AbortSignal } = {}): Promise<BaseFetch> {
  const ref = await baseRef(repo, base);
  if (ref === null) throw noBase(repo, base);
  return fetchRef(repo, base, ref, options);
}

/**
 * The daemon's fetches of bases, by the repository and the ref: the ones
 * under way, and each branch's last result with the time it ended at, read
 * from `now`. `waitMs` bounds each fetch, as in `fetchBase`, and `freshMs`,
 * `BASE_FRESH_MS` where none is given, is how long a result serves a creation.
 */
export class BaseFetches {
  private readonly underWay = new Map<string, Promise<BaseFetch>>();
  private readonly last = new Map<string, { result: BaseFetch; at: number }>();
  private readonly closing = new AbortController();

  constructor(private readonly options: { waitMs?: number; freshMs?: number; now?: () => number } = {}) {}

  /**
   * The fetch of a base, as `fetchBase` gives it. It joins a fetch of the same
   * branch that is under way and starts no second one. With `reuse`, which a
   * creation asks with, it gives the result of a fetch of that branch that
   * ended less than `freshMs` ago and asks the remote otherwise. Without it,
   * it asks the remote whatever ended before.
   */
  async fetch(repo: string, base: string, { reuse }: { reuse: boolean }): Promise<BaseFetch> {
    const ref = await baseRef(repo, base);
    if (ref === null) throw noBase(repo, base);
    const key = `${repo}\n${ref}`;
    const joined = this.underWay.get(key);
    if (joined !== undefined) return joined;
    const now = this.options.now ?? Date.now;
    const last = this.last.get(key);
    if (reuse && last !== undefined && now() - last.at < (this.options.freshMs ?? BASE_FRESH_MS)) return last.result;
    const fetching = fetchRef(repo, base, ref, { waitMs: this.options.waitMs, ended: this.closing.signal })
      .then((result) => {
        this.last.set(key, { result, at: now() });
        return result;
      })
      .finally(() => this.underWay.delete(key));
    this.underWay.set(key, fetching);
    return fetching;
  }

  /** Ends every fetch under way, as a fetch given up is ended, and every fetch asked for afterwards before it starts. */
  close(): void {
    this.closing.abort();
  }
}

/** The first of the names that is in the set, or undefined where none is. */
function firstIn(names: string[], held: Set<string>): string | undefined {
  return names.find((name) => held.has(name));
}

/**
 * The repository's bases, as `WorktreePlan` orders them, and its default
 * base. All of it is read from the refs and the configuration of the person's
 * clone: nothing is fetched and no remote is asked.
 *
 * With the candidate names `init.defaultBranch`'s value, `main` and `master`,
 * in that order, the default base is the first of these that the lists hold:
 * the base `chosenBase` gives for the repository, which a person chose in
 * its settings; the branch a remote's `HEAD` names, the remote `origin` first and the other
 * remotes in the order of their names; a remote's branch of a candidate name,
 * the remotes in the same order and, within one remote, the names in theirs;
 * the local branch of a candidate name; the local branch the checkout stands
 * on.
 */
async function basesOf(repo: string, chosenBase?: ChosenBase): Promise<Pick<WorktreePlan, "localBases" | "remoteBases" | "defaultBase">> {
  const [refs, checkout, configured, remoteNames] = await Promise.all([
    git(repo, ["for-each-ref", "--sort=-committerdate", "--format=%(refname) %(symref)", "refs/heads", "refs/remotes"], BRANCH_OUTPUT_BYTES),
    branchOfHead(repo),
    git(repo, ["config", "--get", "init.defaultBranch"]).then((value) => value.trim(), () => ""),
    git(repo, ["remote"]).then((names) => names.split("\n").filter((name) => name !== ""), () => []),
  ]);
  const local: string[] = [];
  const remote: string[] = [];
  // What each remote's `HEAD` names, by the entry's own name, such as `origin/HEAD`.
  const heads = new Map<string, string>();
  for (const line of refs.split("\n")) {
    const [ref = "", symref = ""] = line.split(" ");
    if (ref.startsWith("refs/heads/")) {
      // A local branch that names another ref, as an alias `main` of `master` does, is no base: `baseRef` reads a base's name as a branch of its own, and the alias's target stands in the list.
      if (symref === "") local.push(ref.slice("refs/heads/".length));
    } else if (!ref.startsWith("refs/remotes/")) continue;
    else if (symref === "") remote.push(ref.slice("refs/remotes/".length));
    else if (symref.startsWith("refs/remotes/")) heads.set(ref.slice("refs/remotes/".length), symref.slice("refs/remotes/".length));
  }
  const locals = new Set(local);
  // A base's name is read as the local branch first, so a remote's branch of a local branch's name cannot be named.
  const remoteBases = remote.filter((name) => !locals.has(name));
  const remotes = new Set(remoteBases);
  // The branch the checkout stands on is no local base before its first commit.
  const standsOn = checkout !== null && locals.has(checkout) ? [checkout] : [];
  const localBases = [...standsOn, ...local.filter((name) => name !== checkout)];
  const candidates = [configured, "main", "master"].filter((name) => name !== "");
  const ordered = [...remoteNames.filter((name) => name === "origin"), ...remoteNames.filter((name) => name !== "origin").sort()];
  const chosen = chosenBase?.(repo) ?? null;
  const defaultBase =
    (chosen !== null && (locals.has(chosen) || remotes.has(chosen)) ? chosen : undefined) ??
    firstIn(ordered.flatMap((name) => heads.get(`${name}/HEAD`) ?? []), remotes) ??
    firstIn(ordered.flatMap((name) => candidates.map((candidate) => `${name}/${candidate}`)), remotes) ??
    firstIn(candidates, locals) ??
    standsOn[0] ??
    null;
  return { localBases, remoteBases, defaultBase };
}

/**
 * What a creation in the folder with this title and name would give, and the
 * repository's bases. Nothing is created. A folder that names no repository
 * is refused, as a creation in it is.
 */
export async function planWorktree(options: Naming & { folder: string; root: string; chosenBase?: ChosenBase }): Promise<WorktreePlan> {
  const repo = await repositoryOf(options.folder);
  const [place, bases] = await Promise.all([placeFor(repo, options.root, options), basesOf(repo, options.chosenBase)]);
  return { ...place, ...bases };
}

/**
 * Cuts the branch `placeFor` names at a base and checks it out in a new
 * worktree under `root`. The base is the one `base` names, read as `baseRef`
 * reads it, or the repository's default base where none is sent, which is
 * the base a person chose for the repository where it still lists it. Where the
 * repository has no default base, the branch is cut at the checkout's commit.
 * A remote's branch is fetched before the cut, so the branch starts at the
 * commit the remote holds: through `fetches` where the daemon's keeper is
 * given, which joins a fetch under way and reuses a fresh result, and by one
 * fetch of its own otherwise. Where the fetch fails, the branch is cut at the
 * commit the clone holds, and the creation is not refused. A local branch
 * asks no remote.
 * The new branch has no upstream, whatever its base and the person's
 * `branch.autoSetupMerge`. A folder that names no repository, as
 * `repositoryOf` reads it, and a `base` that is none of the repository's, is
 * refused before anything is created.
 */
export async function createWorktree(options: Naming & { folder: string; root: string; base?: string; chosenBase?: ChosenBase; fetches?: BaseFetches }): Promise<Worktree> {
  const repo = await repositoryOf(options.folder);
  const baseBranch = options.base ?? (await basesOf(repo, options.chosenBase)).defaultBase;
  let start = "HEAD";
  if (baseBranch !== null) {
    const ref = await baseRef(repo, baseBranch);
    if (ref === null) throw noBase(repo, baseBranch);
    await (options.fetches?.fetch(repo, baseBranch, { reuse: true }) ?? fetchRef(repo, baseBranch, ref, {}));
    start = ref;
  }
  const { branch, worktree } = await placeFor(repo, options.root, options);
  mkdirSync(dirname(worktree), { recursive: true });
  await git(repo, ["worktree", "add", "--quiet", "--no-track", "-b", branch, worktree, start]);
  const baseCommit = (await git(repo, ["rev-parse", "--verify", `refs/heads/${branch}`])).trim();
  return { repo, branch, worktree, baseCommit, baseBranch };
}

/** What a rename of a work item's branch would give: the branch, or null where the name names none, and why the rename cannot run, or null where it can. */
export interface RenamePlan {
  branch: string | null;
  blocked: string | null;
}

/**
 * What renaming `branch` after a work item's new name would give, read in the
 * repository. Nothing is renamed. The branch is `owlery/<slug of the name>`,
 * with -2, -3 and so on appended while another local branch bears the name.
 * The rename can run where the name leaves a slug, the branch exists, that
 * branch is not the one the name gives, it has no upstream, and no remote of
 * the clone holds a branch of its name: a branch that was pushed without an
 * upstream has none, and its rename would leave the remote's branch under the
 * old name. `blocked` says the first of these that does not hold. Nothing is
 * fetched: a remote's branches are read as the clone holds them.
 */
export async function planBranchRename(repo: string, branch: string, title: string): Promise<RenamePlan> {
  const slug = slugFor(title);
  if (slug === "") return { branch: null, blocked: "The name leaves no letter or digit to name a branch by." };
  let named = `owlery/${slug}`;
  // The work item's own branch does not stand in the way of its own name.
  for (let n = 2; named !== branch && (await branchExists(repo, named)); n++) named = `owlery/${slug}-${n}`;
  const blocked = (sentence: string): RenamePlan => ({ branch: named, blocked: sentence });
  const local = `refs/heads/${branch}`;
  let refs: string[];
  let remotes: string[];
  try {
    // A pattern also matches the refs under it, so each line's ref is compared whole.
    refs = (await git(repo, ["for-each-ref", "--format=%(refname) %(upstream:short)", local])).split("\n");
    remotes = (await git(repo, ["remote"])).split("\n").filter((name) => name !== "");
  } catch {
    return blocked(`The branch ${branch} is gone.`);
  }
  const own = refs.find((line) => line.startsWith(`${local} `));
  if (own === undefined) return blocked(`The branch ${branch} is gone.`);
  if (named === branch) return blocked(`The branch is already ${branch}.`);
  const upstream = own.slice(local.length + 1);
  if (upstream !== "") return blocked(`The branch ${branch} has an upstream, ${upstream}, so it keeps its name.`);
  if (remotes.length > 0) {
    // With no pattern git would list every ref, so it is asked only where the clone has a remote.
    const held = (await git(repo, ["for-each-ref", "--format=%(refname)", ...remotes.map((remote) => `refs/remotes/${remote}/${branch}`)], BRANCH_OUTPUT_BYTES)).split("\n");
    const holder = remotes.find((remote) => held.includes(`refs/remotes/${remote}/${branch}`));
    if (holder !== undefined) return blocked(`The remote ${holder} holds a branch ${branch}, so the branch keeps its name.`);
  }
  return { branch: named, blocked: null };
}

/**
 * Renames a local branch in the repository, with `git branch -m`. A worktree
 * that has the branch checked out then stands on the new name, and its folder
 * is untouched. Git refuses a name another branch bears, and its sentence is
 * the error.
 */
export async function renameBranch(repo: string, from: string, to: string): Promise<void> {
  await git(repo, ["branch", "-m", from, to]);
}

/**
 * How many commits the branch holds after `baseCommit`, read in the
 * repository: every commit since the branch was cut, the base's own among
 * them once the base was merged in. Null where git gives no count: the repository, the branch or the
 * commit is gone.
 */
export async function newCommits(repo: string, branch: string, baseCommit: string): Promise<number | null> {
  try {
    const count = Number.parseInt(await git(repo, ["rev-list", "--count", `${baseCommit}..refs/heads/${branch}`, "--"]), 10);
    return Number.isInteger(count) ? count : null;
  } catch {
    return null;
  }
}

/**
 * How many commits `head` holds that the base `baseBranch` names does not: how
 * far a work item's branch is ahead of its base. The name is read as `baseRef`
 * reads it, at every call, so the count against a remote's branch moves when a
 * fetch moves that branch. A commit the base gained and the work item's branch
 * merged in is not counted, and the count is none once the base holds `head`.
 * Null where git gives no count: the name is neither a local branch nor a
 * remote's any more, or the commit or the repository is gone.
 */
export async function aheadOf(repo: string, baseBranch: string, head: string): Promise<number | null> {
  const base = await baseRef(repo, baseBranch);
  if (base === null) return null;
  try {
    const count = Number.parseInt(await git(repo, ["rev-list", "--count", `${base}..${head}`, "--"]), 10);
    return Number.isInteger(count) ? count : null;
  } catch {
    return null;
  }
}

/** The commit the branch points at, read in the repository, or null where the branch or the repository is gone. */
export async function branchHead(repo: string, branch: string): Promise<string | null> {
  try {
    return (await git(repo, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`])).trim();
  } catch {
    return null;
  }
}

/** One line of git's `--numstat`: the lines added and removed, each null where git prints a dash, and what follows them. */
function numstat(line: string): { added: number | null; removed: number | null; rest: string } | undefined {
  const found = /^(\d+|-)\t(\d+|-)\t/.exec(line);
  if (!found) return undefined;
  const count = (text: string | undefined): number | null => (text === undefined || text === "-" ? null : Number(text));
  return { added: count(found[1]), removed: count(found[2]), rest: line.slice(found[0].length) };
}

/**
 * The commits `head` holds after `baseCommit`, newest first, 20 at most. A
 * commit's lines are summed over the files git counts lines of, with a moved
 * file counted as one removed and one added, as `branchChanges` counts it,
 * and a merge's lines are its difference from its first parent.
 * Null where git gives no log: the repository or a commit is gone.
 */
export async function branchCommits(repo: string, baseCommit: string, head: string): Promise<CommitInfo[] | null> {
  let log: string;
  try {
    // Each commit opens with a NUL, so a commit's first line is told from the counts under it, and from whatever git prints before a commit.
    // A merge is compared with its first parent, the branch before it: git's log prints no counts for a merge otherwise. The option is git 2.31's.
    log = await git(repo, ["log", "--no-renames", "--numstat", "--diff-merges=first-parent", `--max-count=${COMMITS_LISTED}`, "--format=%x00%h%x1f%ct%x1f%s", `${baseCommit}..${head}`, "--"], BRANCH_OUTPUT_BYTES);
  } catch {
    return null;
  }
  return log
    .split("\0")
    .slice(1)
    .map((entry) => {
      const [first = "", ...lines] = entry.split("\n");
      const [hash = "", seconds = "", ...subject] = first.split("\x1f");
      const files = lines.flatMap((line) => numstat(line) ?? []);
      const counted = files.filter((file) => file.added !== null && file.removed !== null);
      const uncounted = files.length > 0 && counted.length === 0;
      return {
        hash,
        subject: subject.join("\x1f"),
        at: Number(seconds) * 1000,
        added: uncounted ? null : counted.reduce((sum, file) => sum + (file.added ?? 0), 0),
        removed: uncounted ? null : counted.reduce((sum, file) => sum + (file.removed ?? 0), 0),
      };
    });
}

/**
 * The files `head` changed since `baseCommit`: how many, the sums of the
 * lines git counts, and the first 50 by path. A moved file is one removed and
 * one added, so every entry is one path. Null where git gives no diff: the
 * repository or a commit is gone.
 */
export async function branchChanges(repo: string, baseCommit: string, head: string): Promise<Changes | null> {
  let diff: string;
  try {
    // NUL ends each file, so a path is as it is on disk, with no quoting.
    diff = await git(repo, ["diff", "--no-renames", "--numstat", "-z", baseCommit, head, "--"], BRANCH_OUTPUT_BYTES);
  } catch {
    return null;
  }
  const files: FileChange[] = diff.split("\0").flatMap((entry) => {
    const file = numstat(entry);
    return file ? [{ path: file.rest, added: file.added, removed: file.removed }] : [];
  });
  return {
    files: files.length,
    added: files.reduce((sum, file) => sum + (file.added ?? 0), 0),
    removed: files.reduce((sum, file) => sum + (file.removed ?? 0), 0),
    list: files.slice(0, FILES_LISTED),
  };
}

/** How many entries each list of a loss carries. */
const LOSS_LISTED = 500;

/** One worktree as `git worktree list --porcelain` prints it: its folder, the commit its `HEAD` is at, the local branch it has checked out, or null where it has none, and whether it is locked. */
interface ListedWorktree {
  folder: string;
  head: string | null;
  branch: string | null;
  locked: boolean;
}

/** Every worktree `git worktree list --porcelain` printed, the first of them the main checkout or the git directory (`MAIN_CHECKOUT`), and the others the linked worktrees. */
function listedWorktrees(listed: string): ListedWorktree[] {
  return listed.split("\n\n").flatMap((block) => {
    const lines = block.split("\n");
    const value = (key: string): string | null => lines.find((line) => line.startsWith(`${key} `))?.slice(key.length + 1) ?? null;
    const folder = value("worktree");
    if (folder === null) return [];
    const ref = value("branch");
    return [{ folder, head: value("HEAD"), branch: ref !== null && ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : null, locked: lines.some((line) => line === "locked" || line.startsWith("locked ")) }];
  });
}

/** A folder's path with every link in it followed, so two spellings of one folder compare equal. A folder that is gone is spelt by its parent's path, and one whose parent is gone too as it was given. */
function placeOf(folder: string): string {
  try {
    return realpathSync(folder);
  } catch {
    try {
      return join(realpathSync(dirname(folder)), basename(folder));
    } catch {
      return folder;
    }
  }
}

/** The linked worktree git lists at a folder, or undefined where it lists none there. The main checkout is none, whatever folder is asked for. */
function linkedAt(listed: string, folder: string): ListedWorktree | undefined {
  const place = placeOf(folder);
  return listedWorktrees(listed)
    .slice(1)
    .find((known) => placeOf(known.folder) === place);
}

/** The first `LOSS_LISTED` of the entries, and how many there are. */
function cut<T>(entries: T[]): { listed: T[]; count: number } {
  return { listed: entries.slice(0, LOSS_LISTED), count: entries.length };
}

/**
 * What deleting a work item would remove, read in its repository and in its
 * worktree. Nothing is removed, nothing is fetched, and a remote's branches
 * are read as the clone holds them.
 *
 * The commits are those the branch or the worktree's `HEAD` holds and no
 * other local branch, no remote's branch and no tag holds. `--all` is not
 * what they are read against: it takes the worktree's own `HEAD`, which
 * hides every one of them. The worktree's files are read only where git
 * lists a linked worktree at the folder and the folder stands: in any other
 * folder git would answer for whichever repository the folder is inside.
 * The untracked files are listed each by its own path, and the ignored ones
 * with a folder as one name, which takes two reads.
 */
export async function readLoss(repo: string, branch: string, worktree: string): Promise<WorkItemLoss> {
  const nothing = { branch: null, worktree: null, commits: [], commitCount: 0, uncommitted: [], uncommittedCount: 0, untracked: [], untrackedCount: 0, ignored: [], ignoredCount: 0, blocked: null };
  let listed: string;
  try {
    listed = await git(repo, MAIN_CHECKOUT, BRANCH_OUTPUT_BYTES);
  } catch {
    return { ...nothing, unreachable: true, stamp: createHash("sha256").update("unreachable").digest("hex") };
  }
  const own = linkedAt(listed, worktree);
  const tip = await branchHead(repo, branch);
  const elsewhere = listedWorktrees(listed).find((known) => known.branch === branch && known.folder !== own?.folder);
  const blocked = elsewhere ? `The branch ${branch} is checked out in ${elsewhere.folder}, so it cannot be deleted.` : own?.locked ? `The worktree ${own.folder} is locked, so git does not remove it.` : null;
  const tips = [...new Set([tip, own?.head ?? null].filter((commit): commit is string => commit !== null))];
  // Every commit is read, so the stamp differs for one the list leaves out. The names of the refs reach git as patterns under their kinds, and a branch's name holds none of a pattern's characters.
  const log = tips.length === 0 ? "" : await git(repo, ["log", "--format=%H%x1f%h%x1f%s", ...tips, "--not", `--exclude=${branch}`, "--branches", "--remotes", "--tags", "--"], BRANCH_OUTPUT_BYTES);
  let status = "";
  let others = "";
  if (own !== undefined && existsSync(own.folder)) {
    // NUL ends each path, so a path is as it is on disk. A moved file is two entries, each with one path.
    status = await git(own.folder, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames"], BRANCH_OUTPUT_BYTES);
    others = await git(own.folder, ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"], BRANCH_OUTPUT_BYTES);
  }
  const entries = status.split("\0").filter((entry) => entry.length > 3);
  const commits = cut(log.split("\n").filter((line) => line !== "").map((line) => { const [, hash = "", ...subject] = line.split("\x1f"); return { hash, subject: subject.join("\x1f") }; }));
  const uncommitted = cut(entries.filter((entry) => !entry.startsWith("?? ")).map((entry) => entry.slice(3)));
  const untracked = cut(entries.filter((entry) => entry.startsWith("?? ")).map((entry) => entry.slice(3)));
  const ignored = cut(others.split("\0").filter((path) => path !== ""));
  const held = { branch: tip === null ? null : branch, worktree: own?.folder ?? null, blocked, unreachable: false };
  return {
    ...held,
    commits: commits.listed,
    commitCount: commits.count,
    uncommitted: uncommitted.listed,
    uncommittedCount: uncommitted.count,
    untracked: untracked.listed,
    untrackedCount: untracked.count,
    ignored: ignored.listed,
    ignoredCount: ignored.count,
    stamp: createHash("sha256").update(JSON.stringify([held, log, status, others])).digest("hex"),
  };
}

/**
 * Removes the linked worktree git lists at a folder, with `git worktree
 * remove`, and with `--force` only where `force` is true: without it git
 * itself refuses a worktree that holds a changed or an untracked file, and
 * its sentence is the error. The ignored files go with the folder either
 * way. Where git lists no linked worktree at the folder, the main checkout's
 * folder among them, nothing is removed: no file is ever removed but through
 * that one command.
 */
export async function removeWorktree(repo: string, worktree: string, force: boolean): Promise<void> {
  const own = linkedAt(await git(repo, MAIN_CHECKOUT, BRANCH_OUTPUT_BYTES), worktree);
  if (own === undefined) return;
  await git(repo, ["worktree", "remove", ...(force ? ["--force"] : []), own.folder]);
}

/** Removes a local branch of the repository, with `git branch -D`, where it exists. No ref of a remote is named to git, and nothing is pushed. */
export async function removeBranch(repo: string, branch: string): Promise<void> {
  if (!(await branchExists(repo, branch))) return;
  await git(repo, ["branch", "-D", "--", branch]);
}

/** What git keeps in a worktree's git folder while each of these is under way there, with the words a refusal names it by. */
const UNDER_WAY: [marker: string, words: string][] = [
  ["rebase-merge", "a rebase"],
  ["rebase-apply", "a rebase or a `git am`"],
  ["MERGE_HEAD", "a merge"],
  ["CHERRY_PICK_HEAD", "a cherry-pick"],
  ["REVERT_HEAD", "a revert"],
];

/** Runs git in a worktree, and gives whether it failed, its words, and the lines it printed. */
function gitIn(worktree: string, args: string[]): Promise<{ failed: boolean; said: string; printed: string[] }> {
  return new Promise((done) => {
    execFile("git", args, { cwd: worktree, encoding: "utf8" }, (error, stdout, stderr) => done({ failed: error !== null, said: `${stderr}${stdout}`.trim() || (error?.message ?? ""), printed: stdout.split("\n").filter((line) => line !== "") }));
  });
}

/**
 * Why one file of a worktree cannot now be written and committed on the
 * branch named, or null where it can: a rebase, a merge, a cherry-pick, a
 * revert or a `git am` is under way in the worktree, or the worktree's HEAD
 * is not that branch, a detached HEAD and another branch alike. Where git
 * cannot say, its words are the reason. A change written in the middle of a
 * rebase goes with the rebase where it is aborted and holds its continue
 * while it is not staged, a commit made there is dropped with it, and a
 * commit made on a detached HEAD is on no branch.
 */
export async function whyNoCommit(worktree: string, branch: string): Promise<string | null> {
  // Git prints each marker's path in the worktree's own git folder, a line for each, relative to the worktree where it prints a relative one.
  const markers = await gitIn(worktree, ["rev-parse", ...UNDER_WAY.flatMap(([marker]) => ["--git-path", marker])]);
  if (markers.failed || markers.printed.length !== UNDER_WAY.length) return markers.said;
  const under = UNDER_WAY.find((_, index) => existsSync(resolve(worktree, markers.printed[index] ?? "")));
  // A rebase is read first, since HEAD is detached for its length and the reason then names the rebase.
  if (under !== undefined) return `${under[1]} is under way in the worktree`;
  const head = await gitIn(worktree, ["symbolic-ref", "--quiet", "HEAD"]);
  if (head.failed || head.printed[0] !== `refs/heads/${branch}`) return `the worktree is not on the branch ${branch}`;
  return null;
}

/**
 * Commits one file of a worktree and nothing else, on the branch named and
 * on no other: `git add` of that path, then a `git commit` that names that
 * path, with the subject and the trailer as its two paragraphs. Before the
 * `git add` it throws the reason `whyNoCommit` gives, with nothing staged
 * and nothing committed. Git runs
 * with the person's identity and the repository's hooks, as the setup of the
 * records place commits (`records-place.ts#setUpRecords`): no option skips a
 * hook or a signature, and nothing is pushed.
 * What else is staged stays staged and is not committed, and what else is
 * changed stays changed. Where the newest commit already holds the file as
 * it stands, nothing is committed. Where either command fails it throws
 * git's words, a hook's output among them, and the path is first taken out
 * of the index again, so the file stands written and not staged.
 */
export async function commitAlone(worktree: string, branch: string, path: string, subject: string, trailer: string): Promise<void> {
  const run = (args: string[]) => gitIn(worktree, args);
  const why = await whyNoCommit(worktree, branch);
  if (why !== null) throw new Error(why);
  const refused = async (said: string): Promise<never> => {
    await run(["reset", "--quiet", "--", path]);
    throw new Error(said);
  };
  const added = await run(["add", "--", path]);
  if (added.failed) return refused(added.said);
  // Git exits 0 where the index holds the path as the branch's newest commit does: an earlier commit carried the file as it stands.
  if (!(await run(["diff", "--cached", "--quiet", "--", path])).failed) return;
  const committed = await run(["commit", "-m", subject, "-m", trailer, "--", path]);
  if (committed.failed) return refused(committed.said);
}
