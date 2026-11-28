import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StoredWorkItem } from "../src/daemon/repositories";
import { branchName, createWorktree, makeBranch, type Worktree } from "../src/daemon/worktrees";

/** Runs git in a temporary repository, never in Owlery's own. */
export function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/** The branch of a work item a case gave one, by a rename, by a commit and a read, or through `branchedWorktree`. It throws for a work item with no branch, so a case never hands git a name that is none. */
export function branchOf(workItem: { branch: string | null }): string {
  if (workItem.branch === null) throw new Error("the work item has no branch");
  return workItem.branch;
}

/** A work item as a case writes it into the store: the fields a creation gives, with its branch and whether Owlery made it as the case says. */
export type StoredPlace = Pick<StoredWorkItem, "id" | "title" | "createdAt" | "worktree" | "baseCommit" | "baseBranch" | "branch" | "ownsBranch">;

/**
 * Writes `repositories.json` in a run folder, before the daemon that reads
 * it: one repository, the folder `repo`, holding the work items given with
 * nothing set on them. A case makes a work item with no branch, or one on a
 * branch Owlery did not make, this way.
 */
export function writeStore(runDir: string, repo: string, workItems: readonly StoredPlace[]): void {
  const items = workItems.map((place): StoredWorkItem => ({ ...place, pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null, pullRequest: null, accountId: null, worktreeSize: null }));
  const repository = { id: 1, folder: repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: 1, groups: [], workItems: items, accountId: null };
  writeFileSync(join(runDir, "repositories.json"), JSON.stringify({ nextWorkItemId: Math.max(0, ...workItems.map(({ id }) => id)) + 1, nextRepositoryId: 2, nextGroupId: 1, repositories: [repository] }), { mode: 0o600 });
}

/**
 * A worktree a creation makes, with no branch picked, then given the branch
 * Owlery makes for it at its first commit or a rename: the name
 * `worktrees.ts#branchName` gives, made by `worktrees.ts#makeBranch`, the
 * function both call, at the base commit. A case whose work item needs a
 * branch from the start, and builds it outside a daemon, makes it this way.
 */
export async function branchedWorktree(options: Parameters<typeof createWorktree>[0]): Promise<Worktree & { branch: string }> {
  const place = await createWorktree(options);
  const branch = await branchName(place.repo, options.title, place.worktree);
  await makeBranch(place.worktree, branch);
  return { ...place, branch, ownsBranch: true };
}

/**
 * Gives the repository the name its commits are made under, and no signing,
 * in its own configuration file, written with no process. The suite's git is
 * given the same in its global configuration (scripts/test-in-electron.mjs),
 * and a case that hands a command an environment of its own still finds them here.
 */
function identify(repo: string): void {
  // The repository is one `git init` or `git clone` made, so its configuration file is `.git/config`.
  appendFileSync(join(repo, ".git", "config"), "[user]\n\tname = Owlery Test\n\temail = test@owlery.invalid\n[commit]\n\tgpgsign = false\n");
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

/** Whether a process of that id runs. */
export function runs(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Makes the clone's `origin` a remote that never answers: its URL names a
 * host that does not exist, and the clone's own `core.sshCommand` is a
 * stand-in that records its process id and sleeps, so no `ssh` starts and
 * nothing reaches the network. `started` gives the id of each stand-in
 * started so far, and `stop` ends by its id each one that still runs.
 */
export function unansweringOrigin(made: { base: string; repo: string }): { started: () => number[]; stop: () => void } {
  const script = join(made.base, "ssh-stand-in");
  const noted = join(made.base, "ssh-stand-in-pids.txt");
  writeFileSync(script, `#!/bin/sh\necho $$ >> '${noted}'\nexec sleep 60\n`, { mode: 0o755 });
  git(made.repo, "remote", "set-url", "origin", "ssh://owlery.invalid/x.git");
  git(made.repo, "config", "core.sshCommand", `'${script}'`);
  const started = (): number[] => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line !== "").map(Number) : []);
  return {
    started,
    stop: () => {
      for (const pid of started()) if (runs(pid)) process.kill(pid, "SIGKILL");
    },
  };
}

/**
 * Makes the clone's `origin` a remote that answers and leaves a process
 * behind, as an `ssh` that keeps a shared connection does: its URL names a
 * host that does not exist, and the clone's own `core.sshCommand` is a
 * stand-in, so no `ssh` starts and nothing reaches the network. The stand-in
 * starts a `sleep` in a session of its own, outside git's process group,
 * which holds the stderr git gave it for a minute, records that process's
 * id, and then serves the folder `served` with git's own `upload-pack`.
 * `started` gives the id of each `sleep` started so far, and `stop` ends by
 * its id each one that still runs.
 */
export function lingeringOrigin(made: { base: string; repo: string }, served: string): { started: () => number[]; stop: () => void } {
  const script = join(made.base, "ssh-lingering-stand-in");
  const noted = join(made.base, "ssh-lingering-pids.txt");
  // The parent records the child's id before the stand-in goes on, so the id is there once the fetch has ended.
  const holder = `$p = fork; if ($p) { open(F, ">>", $ARGV[0]); print F "$p\\n"; close(F); exit 0 } setsid; exec "sleep", "60"`;
  // Git first asks the command, with `-G`, which options it takes, as it asks an `ssh`, and that call is answered and leaves nothing behind.
  writeFileSync(script, `#!/bin/sh\n[ "$1" = -G ] && exit 0\nperl -MPOSIX -e '${holder}' '${noted}' </dev/null >/dev/null\nexec git upload-pack '${served}'\n`, { mode: 0o755 });
  git(made.repo, "remote", "set-url", "origin", "ssh://owlery.invalid/x.git");
  git(made.repo, "config", "core.sshCommand", `'${script}'`);
  const started = (): number[] => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line !== "").map(Number) : []);
  return {
    started,
    stop: () => {
      for (const pid of started()) if (runs(pid)) process.kill(pid, "SIGKILL");
    },
  };
}
