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
  /** The local branch the worktree has checked out, or null where it stands detached at its base and has no branch yet. */
  branch: string | null;
  /** True where the creation made the branch, the local branch that tracks a remote's branch the person picked, and false where it made none. */
  ownsBranch: boolean;
  /** The worktree's folder, `<root>/<repo name>/<slug>`. */
  worktree: string;
  /** The commit the work starts from: the base's commit where the worktree stands detached at it, and for a picked branch the commit it shares with the base, or the branch's tip where it shares none or there is no base. */
  baseCommit: string;
  /** The base the work item starts from, a local branch or a remote's, by its name, or null where the repository had no default base and the worktree starts at the checkout's commit. */
  baseBranch: string | null;
}

/** A local branch a worktree of the repository has checked out, the main checkout among them, and that worktree's folder. */
export interface HeldBranch {
  branch: string;
  folder: string;
}

/** What a creation in a repository would give, and the bases a person can choose among. */
export interface WorktreePlan {
  /** The branch Owlery would make for the work item if its first commit or a rename made it now (`branchName`). The creation itself makes none. */
  branch: string;
  worktree: string;
  /** The local branches a creation cannot check out, since a worktree has each checked out. */
  held: HeldBranch[];
  /** The local branches by name: the one the checkout stands on first, then the others, the newest commit first, without a local branch that names another ref, such as an alias `main` of `master`. */
  localBases: string[];
  /** The remotes' branches, named `<remote>/<branch>`, the newest commit first, without a remote's `HEAD` entry and without a name a local branch bears. */
  remoteBases: string[];
  /** The base a creation without one starts from, a name of one of the two lists, or null where the repository has none. */
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
 * The folder a work item gets: `<root>/<repository's folder name>/<name>`.
 * The name is the first of these that is not empty: the slug of the title,
 * the slug of the name sent, a generated name. Where the folder exists, -2,
 * -3 and so on are appended until it does not.
 */
function folderFor(repo: string, root: string, naming: Naming): string {
  const name = slugFor(naming.title) || slugFor(naming.name ?? "") || generateName(naming.random);
  const parent = join(root, basename(repo));
  for (let n = 1; ; n++) {
    const worktree = join(parent, n === 1 ? name : `${name}-${n}`);
    if (!existsSync(worktree)) return worktree;
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
export async function baseRef(repo: string, base: string): Promise<string | null> {
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
export async function remoteOf(repo: string, base: string): Promise<{ remote: string; branch: string } | null> {
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
  // A local branch is read where it stands, and no command that asks a remote runs for it.
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
  const worktree = folderFor(repo, options.root, options);
  const [branch, bases, listed] = await Promise.all([branchName(repo, options.title, worktree), basesOf(repo, options.chosenBase), git(repo, MAIN_CHECKOUT, BRANCH_OUTPUT_BYTES)]);
  return { branch, worktree, held: heldBranches(listed), ...bases };
}

/** Each local branch a worktree has checked out, among what `git worktree list --porcelain` printed, with that worktree's folder. */
function heldBranches(listed: string): HeldBranch[] {
  return listedWorktrees(listed).flatMap(({ branch, folder }) => (branch === null ? [] : [{ branch, folder }]));
}

/** The fetch of a base, or of a remote's branch a person picked, through the daemon's keeper where one is given, and by one fetch of its own otherwise. */
async function fetchFor(repo: string, name: string, ref: string, fetches?: BaseFetches): Promise<void> {
  await (fetches?.fetch(repo, name, { reuse: true }) ?? fetchRef(repo, name, ref, {}));
}

/**
 * The local branch a creation checks out for the branch a person picked,
 * named as a base is (`baseRef`), and the remote's branch it is made to
 * track, or null where it stands already. A local branch is checked out as
 * it stands. A remote's branch is fetched first, as a base is, and is
 * checked out as git's `git worktree add <folder> <name>` checks it out:
 * the local branch of its name where one stands, and otherwise a local
 * branch of that name made to track it. A name that is no branch of the
 * repository is refused, and so is a local branch a worktree has checked
 * out, naming that worktree's folder. Nothing is made.
 */
async function pickedBranch(repo: string, name: string, fetches?: BaseFetches): Promise<{ local: string; tracks: string | null }> {
  const ref = await baseRef(repo, name);
  if (ref === null) throw new Error(`${repo} has no branch ${name} to check out`);
  let local = name;
  let tracks: string | null = null;
  if (ref !== `refs/heads/${name}`) {
    await fetchFor(repo, name, ref, fetches);
    const from = await remoteOf(repo, name);
    if (from === null) throw new Error(`${repo} has no remote for ${name}`);
    local = from.branch;
    if (!(await branchExists(repo, local))) tracks = ref;
  }
  const holder = heldBranches(await git(repo, MAIN_CHECKOUT, BRANCH_OUTPUT_BYTES)).find(({ branch }) => branch === local);
  if (holder !== undefined) throw new Error(`The branch ${local} is checked out in ${holder.folder}, so a new work item cannot check it out.`);
  return { local, tracks };
}

/**
 * Makes a new worktree under `root`, in the folder `folderFor` names, for
 * a work item that starts from a base. The base is the one `base` names,
 * read as `baseRef` reads it, or the repository's default base where none
 * is sent, which is the base a person chose for the repository where it
 * still lists it. Where the repository has no default base, the work starts
 * at the checkout's commit. A remote's branch is fetched first, so the work
 * starts at the commit the remote holds: through `fetches` where the
 * daemon's keeper is given, which joins a fetch under way and reuses a fresh
 * result, and by one fetch of its own otherwise. Where the fetch fails, the
 * work starts at the commit the clone holds, and the creation is not
 * refused. A local branch asks no remote.
 *
 * Where no `branch` is sent, the worktree stands detached at the base, and
 * the repository gains no branch: the work item's branch is made later, at
 * its first commit or a rename (`makeBranch`). Where `branch` names one of
 * the repository's branches, the worktree has it checked out, as
 * `pickedBranch` states, and only a local branch made to track a remote's
 * is Owlery's.
 *
 * A folder that names no repository, as `repositoryOf` reads it, a `base`
 * that is none of the repository's, and a `branch` that `pickedBranch`
 * refuses, are refused before anything is created.
 */
export async function createWorktree(options: Naming & { folder: string; root: string; base?: string; branch?: string; chosenBase?: ChosenBase; fetches?: BaseFetches }): Promise<Worktree> {
  const repo = await repositoryOf(options.folder);
  const baseBranch = options.base ?? (await basesOf(repo, options.chosenBase)).defaultBase;
  let start = "HEAD";
  if (baseBranch !== null) {
    const ref = await baseRef(repo, baseBranch);
    if (ref === null) throw noBase(repo, baseBranch);
    await fetchFor(repo, baseBranch, ref, options.fetches);
    start = ref;
  }
  const picked = options.branch === undefined ? null : await pickedBranch(repo, options.branch, options.fetches);
  const worktree = folderFor(repo, options.root, options);
  mkdirSync(dirname(worktree), { recursive: true });
  if (picked === null) {
    await git(repo, ["worktree", "add", "--quiet", "--detach", worktree, start]);
    const baseCommit = (await git(worktree, ["rev-parse", "--verify", "HEAD"])).trim();
    return { repo, branch: null, ownsBranch: false, worktree, baseCommit, baseBranch };
  }
  const { local, tracks } = picked;
  if (tracks !== null) await git(repo, ["branch", "--quiet", "--track", local, tracks]);
  try {
    // A name a local branch bears is checked out as that branch, never read as another ref.
    await git(repo, ["worktree", "add", "--quiet", worktree, local]);
  } catch (error) {
    // The branch made for this creation goes with it.
    if (tracks !== null) await git(repo, ["branch", "--quiet", "-D", local]).catch(() => "");
    throw error;
  }
  const tip = (await git(repo, ["rev-parse", "--verify", `refs/heads/${local}`])).trim();
  const shared = baseBranch === null ? "" : await git(repo, ["merge-base", start, tip]).then((printed) => printed.trim(), () => "");
  return { repo, branch: local, ownsBranch: tracks !== null, worktree, baseCommit: shared || tip, baseBranch };
}

/** What a rename of a work item's branch would give: the branch, or null where the name names none, and why the rename cannot run, or null where it can. */
export interface RenamePlan {
  branch: string | null;
  blocked: string | null;
}

/** `owlery/<slug>`, with -2, -3 and so on appended while a local branch of the repository other than `own` bears the name. */
async function numberedBranch(repo: string, slug: string, own: string | null): Promise<string> {
  let named = `owlery/${slug}`;
  for (let n = 2; named !== own && (await branchExists(repo, named)); n++) named = `owlery/${slug}-${n}`;
  return named;
}

/**
 * The branch Owlery makes for a work item with no branch yet, read in the
 * repository: `owlery/<slug of the title>`, or `owlery/<slug of the
 * worktree's folder name>` where the title leaves no slug, with -2, -3 and
 * so on appended while a local branch bears the name. Nothing is made.
 */
export async function branchName(repo: string, title: string, folder: string): Promise<string> {
  return numberedBranch(repo, slugFor(title) || slugFor(basename(folder)), null);
}

/**
 * What renaming `branch` after a work item's new name would give, read in the
 * repository. Nothing is renamed. The branch is `owlery/<slug of the name>`,
 * with -2, -3 and so on appended while another local branch bears the name.
 * The rename can run where the name leaves a slug, Owlery made the branch
 * (`owned`), the branch exists, that branch is not the one the name gives,
 * it has no upstream, and no remote of the clone holds a branch of its name:
 * a branch that was pushed without an upstream has none, and its rename
 * would leave the remote's branch under the old name. A branch the person
 * picked, or one the worktree took up by itself, is theirs, and keeps its
 * name. `blocked` says the first of these that does not hold. Nothing is
 * fetched: a remote's branches are read as the clone holds them.
 */
export async function planBranchRename(repo: string, branch: string, title: string, owned: boolean): Promise<RenamePlan> {
  const slug = slugFor(title);
  if (slug === "") return { branch: null, blocked: "The name leaves no letter or digit to name a branch by." };
  // The work item's own branch does not stand in the way of its own name.
  const named = await numberedBranch(repo, slug, branch);
  const blocked = (sentence: string): RenamePlan => ({ branch: named, blocked: sentence });
  if (!owned) return blocked(`The branch ${branch} is not one Owlery made, so it keeps its name.`);
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
 * What the worktree of a work item with no branch yet holds for one: the
 * branch its `HEAD` names, where it names one, which the work item takes up;
 * the commit `HEAD` is detached at, where no local branch, no remote's branch
 * and no tag holds it and it is not `baseCommit`, the commit the worktree was
 * checked out at, which is a commit made in the worktree and the one Owlery
 * makes the branch at; and null where `HEAD` stands at a commit one of those
 * holds, where it stands at `baseCommit` though its base branch was deleted
 * or rewritten since, and where git cannot say.
 */
export async function headStands(worktree: string, baseCommit: string | null): Promise<{ branch: string } | { commit: string } | null> {
  const branch = await branchOfHead(worktree);
  if (branch !== null) return { branch };
  try {
    // `rev-list -1 HEAD` prints HEAD itself where nothing named after `--not` holds it.
    const unheld = (await git(worktree, ["rev-list", "-1", "HEAD", "--not", "--branches", "--remotes", "--tags", "--"])).trim();
    return unheld === "" || unheld === baseCommit ? null : { commit: unheld };
  } catch {
    return null;
  }
}

/**
 * Makes the branch `name` at the commit the worktree's `HEAD` is detached at,
 * and puts the worktree on it, with `git switch --quiet -c` in the worktree:
 * one command, which git refuses where a rebase, a merge, a cherry-pick, a
 * revert or a `git am` is under way, and where a branch bears the name. It
 * throws git's words then, and nothing is made. The worktree's files are
 * untouched. Git's switch reads `HEAD`, makes the branch at it, and points
 * `HEAD` at the branch without checking that `HEAD` still names the commit
 * it read, so a commit made in the worktree in between is left off the
 * branch, its files standing as changes staged on it, as git 2.54 does.
 * `HEAD@{1}`, where `HEAD`'s reflog says it stood before the switch, then
 * names that commit, so the branch is moved on to it where it descends from
 * the commit the branch was made at and the branch still stands there. Where
 * git keeps no reflog of `HEAD`, the branch stays where the switch made it.
 */
export async function makeBranch(worktree: string, name: string): Promise<void> {
  await git(worktree, ["switch", "--quiet", "-c", name]);
  const ref = `refs/heads/${name}`;
  try {
    const [made, before] = (await Promise.all([git(worktree, ["rev-parse", "--verify", ref]), git(worktree, ["rev-parse", "--verify", "HEAD@{1}"])])).map((line) => line.trim());
    if (made === undefined || before === undefined || before === made || !(await holdsCommit(worktree, before, made))) return;
    // The old value is checked, so a commit made on the branch since moves nothing back.
    await git(worktree, ["update-ref", "-m", "owlery: take the commit made while the branch was made", ref, before, made]);
  } catch {
    // The branch stands, and the worktree is on it.
  }
}

/**
 * What a rename of a work item with no branch yet would make, read in the
 * repository and its worktree: the branch `branchName` gives, and why none
 * can be made now, or null where it can. None can where a rebase, a merge, a
 * cherry-pick, a revert or a `git am` is under way in the worktree, and where
 * the worktree's `HEAD` names a branch, which the work item takes up at the
 * next read instead. Where git cannot read the worktree, its words are why.
 * Nothing is made.
 */
export async function planBranchMaking(repo: string, worktree: string, title: string): Promise<RenamePlan> {
  const named = await branchName(repo, title, worktree);
  let under: string | null;
  try {
    under = await underWay(worktree);
  } catch (error) {
    return { branch: named, blocked: error instanceof Error ? error.message : String(error) };
  }
  if (under !== null) return { branch: named, blocked: `The branch cannot be made while ${under} is under way in the worktree.` };
  const taken = await branchOfHead(worktree);
  if (taken !== null) return { branch: named, blocked: `The worktree is on the branch ${taken}, which becomes the work item's at Owlery's next read.` };
  return { branch: named, blocked: null };
}

/**
 * How many commits the branch holds after `baseCommit`, read in the
 * repository: every commit since its base commit, the base's own among
 * them once the base was merged in. Null where git gives no count: the repository, the branch or the
 * commit is gone.
 */
export async function newCommits(repo: string, branch: string, baseCommit: string): Promise<number | null> {
  return commitsAfter(repo, baseCommit, `refs/heads/${branch}`);
}

/** How many commits `tip`, a commit or a ref, holds after `baseCommit`, read in the repository, or null where git gives no count. */
async function commitsAfter(repo: string, baseCommit: string, tip: string): Promise<number | null> {
  try {
    const count = Number.parseInt(await git(repo, ["rev-list", "--count", `${baseCommit}..${tip}`, "--"]), 10);
    return Number.isInteger(count) ? count : null;
  } catch {
    return null;
  }
}

/**
 * What `newCommits` and `branchHead` give of a branch, for a worktree whose
 * work stands on no branch yet: the count after `baseCommit` and the commit,
 * both read at the commit the worktree's `HEAD` stands at. Both null where
 * git cannot read the worktree's `HEAD`: the folder is gone.
 */
export async function headCounts(repo: string, worktree: string, baseCommit: string): Promise<[count: number | null, head: string | null]> {
  let head: string;
  try {
    head = await worktreeHead(worktree);
  } catch {
    return [null, null];
  }
  return [await commitsAfter(repo, baseCommit, head), head];
}

/**
 * How far a work item's branch is from its base, read by one git command:
 * `ahead`, how many commits `head` holds that the base `baseBranch` names does
 * not, and `behind`, how many the base holds that `head` does not. The name is
 * read as `baseRef` reads it, at every call, so the counts against a remote's
 * branch move when a fetch moves that branch, and no remote is asked. A commit
 * the base gained and the work item's branch merged in is counted in neither,
 * and both are none once the base holds `head`. Null where git gives no two
 * counts: the name is neither a local branch nor a remote's any more, or the
 * commit or the repository is gone.
 */
export async function baseDistance(repo: string, baseBranch: string, head: string): Promise<{ ahead: number; behind: number } | null> {
  const base = await baseRef(repo, baseBranch);
  if (base === null) return null;
  try {
    // The symmetric difference counted by side: the base's side first, then the head's.
    const counts = /^(\d+)\t(\d+)\n?$/.exec(await git(repo, ["rev-list", "--left-right", "--count", `${base}...${head}`, "--"]));
    return counts ? { ahead: Number(counts[2]), behind: Number(counts[1]) } : null;
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
 * `branch` is the branch a delete would remove, or null where it removes
 * none: the work item has no branch, or its branch is one Owlery did not
 * make, which stays. The commits are those the branch or the worktree's
 * `HEAD` holds and no other local branch, no remote's branch and no tag
 * holds, so a branch that stays holds its own commits and they are no
 * loss. `--all` is not
 * what they are read against: it takes the worktree's own `HEAD`, which
 * hides every one of them. The worktree's files are read only where git
 * lists a linked worktree at the folder and the folder stands: in any other
 * folder git would answer for whichever repository the folder is inside.
 * The untracked files are listed each by its own path, and the ignored ones
 * with a folder as one name, which takes two reads.
 */
export async function readLoss(repo: string, branch: string | null, worktree: string): Promise<WorkItemLoss> {
  const nothing = { branch: null, worktree: null, commits: [], commitCount: 0, uncommitted: [], uncommittedCount: 0, untracked: [], untrackedCount: 0, ignored: [], ignoredCount: 0, blocked: null };
  let listed: string;
  try {
    listed = await git(repo, MAIN_CHECKOUT, BRANCH_OUTPUT_BYTES);
  } catch {
    return { ...nothing, unreachable: true, stamp: createHash("sha256").update("unreachable").digest("hex") };
  }
  const own = linkedAt(listed, worktree);
  const tip = branch === null ? null : await branchHead(repo, branch);
  const elsewhere = branch === null ? undefined : listedWorktrees(listed).find((known) => known.branch === branch && known.folder !== own?.folder);
  const blocked = elsewhere ? `The branch ${branch} is checked out in ${elsewhere.folder}, so it cannot be deleted.` : own?.locked ? `The worktree ${own.folder} is locked, so git does not remove it.` : null;
  const tips = [...new Set([tip, own?.head ?? null].filter((commit): commit is string => commit !== null))];
  // Every commit is read, so the stamp differs for one the list leaves out. The names of the refs reach git as patterns under their kinds, and a branch's name holds none of a pattern's characters.
  const log = tips.length === 0 ? "" : await git(repo, ["log", "--format=%H%x1f%h%x1f%s", ...tips, "--not", ...(branch === null ? [] : [`--exclude=${branch}`]), "--branches", "--remotes", "--tags", "--"], BRANCH_OUTPUT_BYTES);
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

/** The words `UNDER_WAY` gives for what is under way in a worktree, or null where nothing is. It throws git's words where git cannot say. */
async function underWay(worktree: string): Promise<string | null> {
  // Git prints each marker's path in the worktree's own git folder, a line for each, relative to the worktree where it prints a relative one.
  const markers = await gitIn(worktree, ["rev-parse", ...UNDER_WAY.flatMap(([marker]) => ["--git-path", marker])]);
  if (markers.failed || markers.printed.length !== UNDER_WAY.length) throw new Error(markers.said);
  return UNDER_WAY.find((_, index) => existsSync(resolve(worktree, markers.printed[index] ?? "")))?.[1] ?? null;
}

/** Runs git in a worktree, and gives whether it failed, its words, and the lines it printed. */
function gitIn(worktree: string, args: string[]): Promise<{ failed: boolean; said: string; printed: string[] }> {
  return new Promise((done) => {
    execFile("git", args, { cwd: worktree, encoding: "utf8" }, (error, stdout, stderr) => done({ failed: error !== null, said: `${stderr}${stdout}`.trim() || (error?.message ?? ""), printed: stdout.split("\n").filter((line) => line !== "") }));
  });
}

/** How long, in milliseconds, the `git add` and the `git commit` of one commit of Owlery's may run together before the one under way is ended. */
export const COMMIT_LIMIT_MS = 5 * 60_000;

/** How long, in milliseconds, after the SIGTERM that ends a commit's git its group is sent SIGKILL, where git has not exited by then or the pipe it printed to is still open. */
export const COMMIT_END_GRACE_MS = 2000;

/** How much of what a commit's git printed is kept. */
const COMMIT_PRINTED_CHARS = 64 * 1024;

/** The bounds of one commit: how long its commands may run together, `COMMIT_LIMIT_MS` where none is given, and a signal that ends it. */
export interface CommitBounds {
  limitMs?: number;
  ended?: AbortSignal;
}

/** What one git run under a commit's bounds gave: its exit code, null where a signal ended it or it was not started; what it printed; and why it was ended, or null where it was not. */
export interface BoundedGit {
  code: number | null;
  said: string;
  ended: string | null;
}

/**
 * A runner of the git commands of one commit under its bounds, which
 * starts each git in the folder given and gives what `BoundedGit` states.
 * The limit is counted from the call that makes the runner, so the commands
 * it runs share it.
 *
 * Each git is started as the leader of a process group of its own, with no
 * input, so what the repository runs for it, a hook, a clean filter or a
 * signer, is in that group and reads the end of its input at once. Where the
 * limit passes or `ended` fires while git runs, the group is sent SIGTERM,
 * and `COMMIT_END_GRACE_MS` later SIGKILL where git has not exited or the
 * pipe git printed to is still open. The first signal is never SIGKILL,
 * since a git killed by it in the middle of a commit leaves `index.lock`,
 * and every later git that writes the index fails until a person removes
 * it. The SIGKILL follows, since a hook that ignores SIGTERM outlives git
 * and holds the pipe open. An ended git is over once it has exited and the
 * SIGKILL was sent, since a process that left git's group, such as one in a
 * session of its own, can hold the pipe open past both signals. A git whose
 * turn comes after `ended` fired is not started, and one whose turn comes
 * after the limit is ended as it starts. A git that is not ended is over
 * when the pipe closes, which is when all it printed has arrived.
 */
export function commitRunner(bounds: CommitBounds = {}): (folder: string, args: string[]) => Promise<BoundedGit> {
  const limitMs = bounds.limitMs ?? COMMIT_LIMIT_MS;
  const until = Date.now() + limitMs;
  const { ended } = bounds;
  return (folder, args) =>
    new Promise((resolve) => {
      const overdue = `git ${args[0] ?? ""} did not end in ${String(limitMs / 1000)} seconds and was ended`;
      if (ended?.aborted) {
        resolve({ code: null, said: "", ended: "the commit was ended" });
        return;
      }
      const child = spawn("git", args, { cwd: folder, detached: true, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let why: string | null = null;
      let code: number | null = null;
      let exited = false;
      let killed = false;
      let settled = false;
      let grace: NodeJS.Timeout | undefined;
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (text: string) => {
        if (stdout.length < COMMIT_PRINTED_CHARS) stdout += text;
      });
      child.stderr.on("data", (text: string) => {
        if (stderr.length < COMMIT_PRINTED_CHARS) stderr += text;
      });
      const signal = (name: NodeJS.Signals): void => {
        if (child.pid === undefined) return;
        try {
          // The negative id names the group git leads. While a process of the group runs, the id names no other group.
          process.kill(-child.pid, name);
        } catch {
          // The group is gone already.
        }
      };
      const settle = (): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(grace);
        ended?.removeEventListener("abort", onEnded);
        resolve({ code, said: `${stderr}${stdout}`.trim(), ended: why });
      };
      const end = (reason: string): void => {
        if (settled || why !== null) return;
        why = reason;
        signal("SIGTERM");
        grace = setTimeout(() => {
          killed = true;
          signal("SIGKILL");
          // Git has exited where only what it started holds the pipe, and that may be a process outside the group.
          if (exited) settle();
        }, COMMIT_END_GRACE_MS);
      };
      const timer = setTimeout(() => end(overdue), Math.max(0, until - Date.now()));
      const onEnded = (): void => end("the commit was ended");
      ended?.addEventListener("abort", onEnded, { once: true });
      child.on("error", (error) => {
        stderr = error.message;
        settle();
      });
      child.on("exit", (exitCode) => {
        exited = true;
        code = exitCode;
        if (killed) settle();
      });
      child.on("close", (exitCode) => {
        code ??= exitCode;
        settle();
      });
    });
}

/**
 * Why a file of a worktree cannot now be written and committed on the
 * branch named, or null where it can: a rebase, a merge, a cherry-pick, a
 * revert or a `git am` is under way in the worktree, or the worktree's HEAD
 * is not that branch, a detached HEAD and another branch alike. Where git
 * cannot say, its words are the reason. A change written in the middle of a
 * rebase goes with the rebase where it is aborted and holds its continue
 * while it is not staged, a commit made there is dropped with it, and a
 * commit made on a detached HEAD is on no branch.
 */
export async function whyNoCommit(worktree: string, branch: string): Promise<string | null> {
  let under: string | null;
  try {
    under = await underWay(worktree);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  // A rebase is read first, since HEAD is detached for its length and the reason then names the rebase.
  if (under !== null) return `${under} is under way in the worktree`;
  const head = await gitIn(worktree, ["symbolic-ref", "--quiet", "HEAD"]);
  if (head.failed || head.printed[0] !== `refs/heads/${branch}`) return `the worktree is not on the branch ${branch}`;
  return null;
}

/**
 * Commits the files of a worktree at the paths given, one or more, together
 * and nothing else, on the branch named and on no other: `git add` of those
 * paths, then one `git commit` that names them, with the subject as its
 * first paragraph and the trailers, one or more, as the lines of its second,
 * in the order given. Before the `git add` it throws the reason
 * `whyNoCommit` gives, with nothing staged and nothing committed. Git runs
 * with the person's identity and the repository's hooks, as the setup of the
 * records place commits (`records-place.ts#setUpRecords`): no option skips a
 * hook or a signature, and nothing is pushed.
 * What else is staged stays staged and is not committed, and what else is
 * changed stays changed. The commit holds each path that differs from the
 * branch's newest commit, and where none does, nothing is committed. Where
 * either command fails it throws git's words, a hook's output among them,
 * for a path that names no file as well, and every path is first taken out
 * of the index again, so each file stands written and not staged.
 *
 * The `git add` and the `git commit` run under `bounds`, as `commitRunner`
 * states: together they have `limitMs`, `COMMIT_LIMIT_MS` where none is
 * given, and `ended` ends the one under way, or starts neither where it
 * fired before. A command ended so fails as above, with the sentence that
 * it did not end in the limit and was ended, or that the commit was ended.
 * A `git commit` ended after it made the commit, in a hook that runs after
 * it such as `post-commit`, leaves the index holding each path as the
 * branch's newest commit does, and the commit stands: `commitPaths`
 * returns as after a commit that ended by itself. No `index.lock` is ever
 * removed.
 */
export async function commitPaths(worktree: string, branch: string, paths: readonly [string, ...string[]], subject: string, trailers: readonly [string, ...string[]], bounds: CommitBounds = {}): Promise<void> {
  const run = (args: string[]) => gitIn(worktree, args);
  const why = await whyNoCommit(worktree, branch);
  if (why !== null) throw new Error(why);
  const bounded = commitRunner(bounds);
  const refused = async (said: string): Promise<never> => {
    await run(["reset", "--quiet", "--", ...paths]);
    throw new Error(said);
  };
  // Git exits 0 where the index holds each path as the branch's newest commit does: a commit carried the files as they stand.
  const carried = async (): Promise<boolean> => !(await run(["diff", "--cached", "--quiet", "--", ...paths])).failed;
  const added = await bounded(worktree, ["add", "--", ...paths]);
  if (added.ended !== null) return refused(added.ended);
  if (added.code !== 0) return refused(added.said || "git add failed");
  if (await carried()) return;
  const committed = await bounded(worktree, ["commit", "-m", subject, "-m", trailers.join("\n"), "--", ...paths]);
  if (committed.ended !== null) {
    if (await carried()) return;
    return refused(committed.ended);
  }
  if (committed.code !== 0) return refused(committed.said || "git commit failed");
}

/**
 * The real path of the repository's common git folder, which a commit in any
 * of its worktrees writes. Git prints it with every link on it followed, a
 * worktree's `.git` file that names its folder through a link among them. It
 * throws git's words where git names none.
 */
export async function gitFolderOf(worktree: string): Promise<string> {
  return (await git(worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"])).trim();
}

/** The commit a worktree's HEAD names, whole. It throws git's words where git cannot say. */
export async function worktreeHead(worktree: string): Promise<string> {
  return (await git(worktree, ["rev-parse", "--verify", "HEAD^{commit}"])).trim();
}

/** The commit a name gives in a worktree, whole, or null where it names none: a hash, shortened or whole, a branch or a remote's branch. */
export async function commitNamed(worktree: string, name: string): Promise<string | null> {
  try {
    return (await git(worktree, ["rev-parse", "--verify", "--quiet", `${name}^{commit}`])).trim() || null;
  } catch {
    return null;
  }
}

/** Whether the commit `holder` holds the commit `held`: `held` is `holder` or one of its ancestors. It throws git's words where either names no commit. */
export async function holdsCommit(worktree: string, holder: string, held: string): Promise<boolean> {
  const asked = await gitIn(worktree, ["merge-base", "--is-ancestor", held, holder]);
  if (!asked.failed) return true;
  // Git exits 1 with no word where the commit is no ancestor, and with its words where it could not say.
  if (asked.said !== "" && !asked.said.startsWith("Command failed")) throw new Error(asked.said);
  return false;
}

/** The commit two names last shared, whole: what `git merge-base` prints for them. Null where they share none, and where either names no commit. */
export async function sharedCommit(worktree: string, one: string, other: string): Promise<string | null> {
  const asked = await gitIn(worktree, ["merge-base", one, other]);
  return asked.failed ? null : (asked.printed[0] ?? null);
}

/** The paths git prints between NUL characters, in its order, each once. */
function nulPaths(printed: string): string[] {
  return [...new Set(printed.split("\0").map((path) => path.replace(/^\n+/, "")).filter((path) => path !== ""))];
}

/**
 * The paths of a worktree that hold a change no commit holds, a staged one
 * and one not staged alike, and its untracked files, each by its own path
 * from the worktree's top. A file that was moved is both of its paths. The
 * files git ignores are none. It throws git's words where git cannot say.
 */
export async function uncommittedPaths(worktree: string): Promise<string[]> {
  const printed = await git(worktree, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], BRANCH_OUTPUT_BYTES);
  const paths: string[] = [];
  const entries = printed.split("\0");
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] ?? "";
    if (entry.length < 4) continue;
    paths.push(entry.slice(3));
    // A rename's or a copy's entry is followed by the path it came from.
    if ("RC".includes(entry.charAt(0)) || "RC".includes(entry.charAt(1))) paths.push(entries[++index] ?? "");
  }
  return [...new Set(paths.filter((path) => path !== ""))];
}

/**
 * The paths one commit changed, as the pull request check's `touched` reads
 * them (`pr-check/skills/code-review/scripts/chain_check.py`): against its
 * parent, the first commit's own files, and none for a merge, which the
 * command prints nothing for. It throws git's words where the name is no
 * commit.
 */
export async function pathsOfCommit(worktree: string, commit: string): Promise<string[]> {
  return nulPaths(await git(worktree, ["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", "-z", commit], BRANCH_OUTPUT_BYTES));
}

/** The paths the commits that `to` holds and `from` does not changed, each once, a merge's own changes left out. It throws git's words where either names no commit. */
export async function pathsOfCommits(worktree: string, from: string, to: string): Promise<string[]> {
  return nulPaths(await git(worktree, ["log", "--format=", "--name-only", "-z", `${from}..${to}`], BRANCH_OUTPUT_BYTES));
}

/**
 * The values of one trailer in the commits of `to`'s own line that no name
 * of `outside` holds: the commits `git log --first-parent` walks from `to`,
 * less each commit that a name of `outside` names or holds, the oldest
 * commit's first and each value once. With a work item's base commit and
 * its base branch as `outside`, a commit of the base is none of them,
 * whether a merge, a fast-forward or a rebase put it on the branch, so it
 * adds no other work item's trailer. A commit that only another name holds,
 * a remote's branch that runs ahead of the base named for one, is read
 * where it stands on the line. What git reads as a trailer of that key in a
 * commit's message counts, so a line of a message's first paragraph and a
 * sentence that names the key are none. It throws git's words where a name
 * names no commit.
 */
export async function trailerValues(worktree: string, outside: readonly string[], to: string, key: string): Promise<string[]> {
  const printed = await git(worktree, ["log", "--first-parent", "--reverse", `--format=%(trailers:key=${key},valueonly)`, to, ...outside.map((name) => `^${name}`)], BRANCH_OUTPUT_BYTES);
  return [...new Set(printed.split("\n").map((line) => line.trim()).filter((line) => line !== ""))];
}

/**
 * The oldest commit on `to`'s own line after `from` that changes a path
 * other than those of `excluded`, with its subject: the first commit
 * `git log --first-parent --reverse` prints for `from..to` with one
 * excluding pathspec for each path, from the worktree's top. A merge on that
 * line is named by its merge commit, and its parent's own commits are not
 * walked. Null where no such commit is. It throws git's words where either
 * names no commit.
 */
export async function firstCommitOutside(worktree: string, from: string, to: string, excluded: readonly string[]): Promise<{ commit: string; subject: string } | null> {
  const printed = await git(worktree, ["log", "--first-parent", "--reverse", "--format=%H%x00%s", `${from}..${to}`, "--", ...excluded.map((path) => `:(top,exclude,literal)${path}`)], BRANCH_OUTPUT_BYTES);
  const [line = ""] = printed.split("\n");
  const [commit = "", subject = ""] = line.split("\0");
  return commit === "" ? null : { commit, subject };
}

/**
 * The paths at which the trees of two commits differ, each once: what
 * `git diff --name-only` prints for the two, with a file that was moved as
 * both of its paths. It walks no commit between them, so a merge's own
 * changes are among the paths and a change that a later commit took back is
 * not. It throws git's words where either names no commit.
 */
export async function pathsBetween(worktree: string, from: string, to: string): Promise<string[]> {
  return nulPaths(await git(worktree, ["diff", "--name-only", "--no-renames", "-z", from, to], BRANCH_OUTPUT_BYTES));
}

/**
 * What `to` changed against `from`, as `git diff` prints it: the paths, and
 * the diff's text. With `sinceFork` the diff is from the commit the two last
 * shared, so what `from` gained since is no part of it. It throws git's
 * words where either names no commit.
 */
export async function diffBetween(worktree: string, from: string, to: string, sinceFork: boolean): Promise<{ paths: string[]; text: string }> {
  const range = `${from}${sinceFork ? "..." : ".."}${to}`;
  const [paths, text] = await Promise.all([git(worktree, ["diff", "--name-only", "-z", range], BRANCH_OUTPUT_BYTES), git(worktree, ["diff", range], BRANCH_OUTPUT_BYTES)]);
  return { paths: nulPaths(paths), text };
}

/** The text of the file at a path, from the worktree's top, as a commit holds it, or null where the commit holds no file there. */
export async function fileAt(worktree: string, commit: string, path: string): Promise<string | null> {
  try {
    return await git(worktree, ["show", `${commit}:${path}`], BRANCH_OUTPUT_BYTES);
  } catch {
    return null;
  }
}

/** The files a commit holds directly in a folder, each by its path from the worktree's top, in git's order. None where the commit holds no such folder. It throws git's words where the commit is none. */
export async function filesAt(worktree: string, commit: string, folder: string): Promise<string[]> {
  return nulPaths(await git(worktree, ["ls-tree", "-z", "--name-only", commit, "--", `${folder.replace(/\/+$/u, "")}/`], BRANCH_OUTPUT_BYTES));
}
