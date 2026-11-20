import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Runs git in a temporary repository, never in Owlery's own. */
export function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/** Gives the repository the name its commits are made under, and no signing. */
function identify(repo: string): void {
  git(repo, "config", "user.name", "Owlery Test");
  git(repo, "config", "user.email", "test@owlery.invalid");
  git(repo, "config", "commit.gpgsign", "false");
}

/**
 * A temporary folder holding a repository with one commit, and the folder the
 * cases point the worktree root at, so nothing is written under ~/.owlery.
 */
export function temporaryRepository(name = "project"): { base: string; repo: string; root: string; remove: () => void } {
  // The real path, because git and a pane's `pwd -P` both print it.
  const base = realpathSync(mkdtempSync(join(tmpdir(), "owlery-work-items-")));
  const repo = join(base, name);
  mkdirSync(repo);
  git(repo, "init", "--quiet", "--initial-branch=main");
  identify(repo);
  writeFileSync(join(repo, "README.md"), "a repository\n");
  git(repo, "add", "README.md");
  git(repo, "commit", "--quiet", "-m", "first");
  return { base, repo, root: join(base, "worktrees"), remove: () => rmSync(base, { recursive: true, force: true }) };
}

/**
 * A temporary folder holding a repository `origin` with one commit on
 * `branch`, and a clone of it in the folder `project`, whose remote `origin`
 * has that branch as its `HEAD`. A case moves the remote by committing in
 * `origin` and fetching in the clone.
 */
export function temporaryClone(branch = "main"): { base: string; origin: string; repo: string; root: string; remove: () => void } {
  const made = temporaryRepository("origin");
  if (branch !== "main") git(made.repo, "branch", "--quiet", "-m", "main", branch);
  const repo = join(made.base, "project");
  git(made.base, "clone", "--quiet", made.repo, repo);
  identify(repo);
  return { base: made.base, origin: made.repo, repo, root: made.root, remove: made.remove };
}

/**
 * Commits a new file in the folder, on whatever branch it has checked out,
 * and gives the commit. `seconds` is the committer's time, for a case that
 * reads branches in the order of their newest commits: every time a case
 * names is older than the commits made at the clock's own.
 */
export function commitFile(folder: string, file: string, seconds?: number): string {
  writeFileSync(join(folder, file), `${file}\n`);
  git(folder, "add", file);
  const env = seconds === undefined ? process.env : { ...process.env, GIT_COMMITTER_DATE: `@${seconds} +0000` };
  execFileSync("git", ["commit", "--quiet", "-m", `add ${file}`], { cwd: folder, encoding: "utf8", env });
  return git(folder, "rev-parse", "HEAD").trim();
}
