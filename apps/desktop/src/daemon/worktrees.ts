// The git side of a work item: its branch and its worktree, a separate folder
// checked out from the same repository. Git runs with execFile and arguments,
// never through a shell, because titles and folders come from the person.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
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
 * end. A title that leaves nothing is `work-item`.
 */
export function slugFor(title: string): string {
  const trim = (text: string): string => text.replace(/^-+|-+$/g, "");
  const slug = trim(trim(title.toLowerCase().replace(/[^a-z0-9]+/g, "-")).slice(0, SLUG_LENGTH));
  return slug || "work-item";
}

function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
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
  /** The branch the repository's HEAD was on when the branch was cut, or null where it was on none. */
  baseBranch: string | null;
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
 * Cuts the branch `owlery/<slug>` at the repository's HEAD and checks it out
 * in a new worktree under `root`. Where the branch or the folder exists, -2,
 * -3 and so on are appended to both until neither does. A folder outside any
 * git repository is refused before anything is created.
 */
export async function createWorktree(options: { folder: string; title: string; root: string }): Promise<Worktree> {
  let repo: string;
  try {
    repo = (await git(options.folder, ["rev-parse", "--show-toplevel"])).trim();
  } catch {
    throw new Error(`${options.folder} is not inside a git repository`);
  }
  if (!repo) throw new Error(`${options.folder} is not inside a git repository`);
  const slug = slugFor(options.title);
  const parent = join(options.root, basename(repo));
  for (let n = 1; ; n++) {
    const name = n === 1 ? slug : `${slug}-${n}`;
    const branch = `owlery/${name}`;
    const worktree = join(parent, name);
    if (existsSync(worktree) || (await branchExists(repo, branch))) continue;
    mkdirSync(dirname(worktree), { recursive: true });
    const baseBranch = await branchOfHead(repo);
    await git(repo, ["worktree", "add", "--quiet", "-b", branch, worktree, "HEAD"]);
    const baseCommit = (await git(repo, ["rev-parse", "--verify", `refs/heads/${branch}`])).trim();
    return { repo, branch, worktree, baseCommit, baseBranch };
  }
}

/**
 * How many commits the branch holds after `baseCommit`, read in the
 * repository. Null where git gives no count: the repository, the branch or the
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
 * file counted as one removed and one added, as `branchChanges` counts it.
 * Null where git gives no log: the repository or a commit is gone.
 */
export async function branchCommits(repo: string, baseCommit: string, head: string): Promise<CommitInfo[] | null> {
  let log: string;
  try {
    // Each commit opens with a NUL, so a commit's first line is told from the counts under it, and from whatever git prints before a commit.
    log = await git(repo, ["log", "--no-renames", "--numstat", `--max-count=${COMMITS_LISTED}`, "--format=%x00%h%x1f%ct%x1f%s", `${baseCommit}..${head}`, "--"]);
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
    diff = await git(repo, ["diff", "--no-renames", "--numstat", "-z", baseCommit, head, "--"]);
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
