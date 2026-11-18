import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Runs git in a temporary repository, never in Owlery's own. */
export function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
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
  git(repo, "config", "user.name", "Owlery Test");
  git(repo, "config", "user.email", "test@owlery.invalid");
  git(repo, "config", "commit.gpgsign", "false");
  writeFileSync(join(repo, "README.md"), "a repository\n");
  git(repo, "add", "README.md");
  git(repo, "commit", "--quiet", "-m", "first");
  return { base, repo, root: join(base, "worktrees"), remove: () => rmSync(base, { recursive: true, force: true }) };
}
