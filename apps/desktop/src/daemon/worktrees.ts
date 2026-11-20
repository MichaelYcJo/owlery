// The git side of a work item: its branch and its worktree, a separate folder
// checked out from the same repository. Git runs with execFile and arguments,
// never through a shell, because titles and folders come from the person.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { generateName } from "../shared/names";
import type { Changes, CommitInfo, FileChange } from "../shared/protocol";

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
  /** The repository's top-level folder. */
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

/** The repository's top-level folder, given a folder inside it. A folder outside any git repository is refused. */
async function repositoryOf(folder: string): Promise<string> {
  let repo: string;
  try {
    repo = (await git(folder, ["rev-parse", "--show-toplevel"])).trim();
  } catch {
    throw new Error(`${folder} is not inside a git repository`);
  }
  if (!repo) throw new Error(`${folder} is not inside a git repository`);
  return repo;
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
 * the branch a remote's `HEAD` names, the remote `origin` first and the other
 * remotes in the order of their names; a remote's branch of a candidate name,
 * the remotes in the same order and, within one remote, the names in theirs;
 * the local branch of a candidate name; the local branch the checkout stands
 * on.
 */
async function basesOf(repo: string): Promise<Pick<WorktreePlan, "localBases" | "remoteBases" | "defaultBase">> {
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
  const defaultBase =
    firstIn(ordered.flatMap((name) => heads.get(`${name}/HEAD`) ?? []), remotes) ??
    firstIn(ordered.flatMap((name) => candidates.map((candidate) => `${name}/${candidate}`)), remotes) ??
    firstIn(candidates, locals) ??
    standsOn[0] ??
    null;
  return { localBases, remoteBases, defaultBase };
}

/**
 * What a creation in the folder with this title and name would give, and the
 * repository's bases. Nothing is created. A folder outside any git repository
 * is refused, as a creation in it is.
 */
export async function planWorktree(options: Naming & { folder: string; root: string }): Promise<WorktreePlan> {
  const repo = await repositoryOf(options.folder);
  const [place, bases] = await Promise.all([placeFor(repo, options.root, options), basesOf(repo)]);
  return { ...place, ...bases };
}

/**
 * Cuts the branch `placeFor` names at a base and checks it out in a new
 * worktree under `root`. The base is the one `base` names, read as `baseRef`
 * reads it, or the repository's default base where none is sent. Where the
 * repository has no default base, the branch is cut at the checkout's commit.
 * The new branch has no upstream, whatever its base and the person's
 * `branch.autoSetupMerge`. A folder outside any git repository, and a `base`
 * that is none of the repository's, is refused before anything is created.
 */
export async function createWorktree(options: Naming & { folder: string; root: string; base?: string }): Promise<Worktree> {
  const repo = await repositoryOf(options.folder);
  const baseBranch = options.base ?? (await basesOf(repo)).defaultBase;
  let start = "HEAD";
  if (baseBranch !== null) {
    const ref = await baseRef(repo, baseBranch);
    if (ref === null) throw new Error(`${repo} has no branch ${baseBranch} to start a work item from`);
    start = ref;
  }
  const { branch, worktree } = await placeFor(repo, options.root, options);
  mkdirSync(dirname(worktree), { recursive: true });
  await git(repo, ["worktree", "add", "--quiet", "--no-track", "-b", branch, worktree, start]);
  const baseCommit = (await git(repo, ["rev-parse", "--verify", `refs/heads/${branch}`])).trim();
  return { repo, branch, worktree, baseCommit, baseBranch };
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
