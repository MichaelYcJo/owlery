// The git side of a work item: its branch and its worktree, a separate folder
// checked out from the same repository. Git runs with execFile and arguments,
// never through a shell, because titles and folders come from the person.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const SLUG_LENGTH = 40;

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
    await git(repo, ["worktree", "add", "--quiet", "-b", branch, worktree, "HEAD"]);
    const baseCommit = (await git(repo, ["rev-parse", "--verify", `refs/heads/${branch}`])).trim();
    return { repo, branch, worktree, baseCommit };
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
