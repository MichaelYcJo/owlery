// The setup a repository names for its new worktrees, in two files at the
// top of its main checkout that the person keeps and Owlery only reads:
// `.worktreeinclude`, patterns in the syntax of `.gitignore` naming the
// ignored paths a new worktree gets from the main checkout, and
// `.worktreesetup`, the command a new worktree runs. Git decides what the
// patterns match, never Owlery's own reading of them, and git runs with
// arguments, never through a shell.
import { spawn } from "node:child_process";
import { cp, lstat, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { WorktreeSetup } from "../shared/protocol";

export const INCLUDE_FILE = ".worktreeinclude";
export const SETUP_FILE = ".worktreesetup";

/** How many entries each list of a setup carries, as each list of a loss does. */
const COPIES_LISTED = 500;

/** Whether a file, and not a folder, stands at the path. */
async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/**
 * What the repository's main checkout names: whether `.worktreeinclude`
 * stands as a file, and the command `.worktreesetup` holds, whole, where it
 * holds more than white space. A folder of either name names nothing. Both
 * are read whether git tracks them or not. A `.worktreesetup` that stands
 * and cannot be read throws.
 */
export async function readSetup(repo: string): Promise<{ include: boolean; command: string | null }> {
  const include = await isFile(join(repo, INCLUDE_FILE));
  let text: string;
  try {
    text = await readFile(join(repo, SETUP_FILE), "utf8");
  } catch (error) {
    const { code } = error as NodeJS.ErrnoException;
    if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") return { include, command: null };
    throw error;
  }
  return { include, command: text.trim() === "" ? null : text };
}

/** Runs git in `cwd` with `input` on its standard input, and gives its exit code and what it printed. */
function gitWith(cwd: string, args: string[], input: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (text: string) => (stdout += text));
    child.stderr.on("data", (text: string) => (stderr += text));
    child.on("error", (error) => resolve({ code: null, stdout, stderr: error.message }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    // A git that exits before it read all of its input closes the pipe, and the write's error is its exit's to tell.
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

/** Git's first line of complaint, or the exit code where it printed none. */
function complaint(command: string, result: { code: number | null; stderr: string }): string {
  return result.stderr.split("\n").find((line) => line.trim() !== "")?.trim() ?? `git ${command} ended with ${String(result.code)}`;
}

/**
 * Copies into `worktree` each path of the main checkout `repo` that a
 * pattern of its `.worktreeinclude` matches and git ignores. The paths are
 * those that `git ls-files --others --ignored --exclude-from` lists with a
 * folder as one path, which `git check-ignore` then confirms git ignores, so
 * a tracked file and an untracked file git does not ignore are never
 * copied. A folder is copied whole, a link as a link with its target as it
 * reads, and a path that already stands in the worktree is neither written
 * over nor listed. A path that fails to copy is listed with its error and
 * the others go on. Where either git command fails, nothing is copied and
 * `failure` says why; nothing is thrown.
 */
export async function copyIncluded(repo: string, worktree: string): Promise<{ copied: string[]; copiedCount: number; failed: { path: string; why: string }[]; failure: string | null }> {
  const none = { copied: [], copiedCount: 0, failed: [] };
  const listed = await gitWith(repo, ["ls-files", "--others", "--ignored", `--exclude-from=${join(repo, INCLUDE_FILE)}`, "--directory", "-z"], "");
  if (listed.code !== 0) return { ...none, failure: complaint("ls-files", listed) };
  // A folder that holds an ignored path is listed too, and git ignores no such folder itself.
  const ignored = await gitWith(repo, ["check-ignore", "--stdin", "-z"], listed.stdout);
  // `check-ignore` exits 1 where it prints nothing: none of the paths is ignored.
  if (ignored.code !== 0 && !(ignored.code === 1 && ignored.stdout === "")) return { ...none, failure: complaint("check-ignore", ignored) };
  const copied: string[] = [];
  const failed: { path: string; why: string }[] = [];
  for (const path of ignored.stdout.split("\0").filter((entry) => entry !== "")) {
    // A folder is listed with a slash at its end, and stands in the worktree without it.
    const target = join(worktree, path.replace(/\/$/, ""));
    try {
      await lstat(target);
      continue;
    } catch {
      // Nothing stands there, so the path is copied.
    }
    try {
      await cp(join(repo, path), target, { recursive: true, verbatimSymlinks: true, force: false, errorOnExist: false });
      copied.push(path);
    } catch (error) {
      failed.push({ path, why: error instanceof Error ? error.message : String(error) });
    }
  }
  return { copied: copied.slice(0, COPIES_LISTED), copiedCount: copied.length, failed: failed.slice(0, COPIES_LISTED), failure: null };
}

/**
 * The setup as it ends: at the exit of its command's process with
 * `exitCode`, or at once where no command stands or none could run, with a
 * null code. It succeeded where the code is 0 or null, no copy failed and
 * nothing gave a `failure`, the one of `end` before the setup's own.
 */
export function endedSetup(setup: WorktreeSetup, end: { exitCode: number | null; failure: string | null }, now: number): WorktreeSetup {
  const failure = end.failure ?? setup.failure;
  const failed = failure !== null || setup.failedCopies.length > 0 || (end.exitCode !== null && end.exitCode !== 0);
  return { ...setup, state: failed ? "failed" : "succeeded", exitCode: end.exitCode, failure, endedAt: now };
}

/**
 * Begins the setup of a worktree of the repository `repo` names: reads the
 * two files, and copies the included paths where `.worktreeinclude` stands.
 * Null where the repository names neither. Where a command stands, the
 * setup is `running` and names no pane yet: the daemon starts the pane. Where
 * none does, it has ended by the copy. A `.worktreesetup` that cannot be
 * read is a setup that failed, and nothing is copied. `now` is read when the
 * setup begins, before the copy, and again where it ends, after it.
 */
export async function beginSetup(repo: string, worktree: string, now: () => number): Promise<WorktreeSetup | null> {
  const begun = { copied: [], copiedCount: 0, failedCopies: [], command: null, paneId: null, state: "running" as const, exitCode: null, failure: null, startedAt: now(), endedAt: null };
  let named: { include: boolean; command: string | null };
  try {
    named = await readSetup(repo);
  } catch (error) {
    return endedSetup(begun, { exitCode: null, failure: `${SETUP_FILE} could not be read: ${error instanceof Error ? error.message : String(error)}` }, now());
  }
  if (!named.include && named.command === null) return null;
  const copy = named.include ? await copyIncluded(repo, worktree) : { copied: [], copiedCount: 0, failed: [], failure: null };
  const setup: WorktreeSetup = { ...begun, copied: copy.copied, copiedCount: copy.copiedCount, failedCopies: copy.failed, command: named.command, failure: copy.failure };
  return named.command === null ? endedSetup(setup, { exitCode: null, failure: null }, now()) : setup;
}

/** The sentence of a setup whose pane the daemon ended, at a close, an archive, a removal or a delete. */
export const PANE_ENDED = "The setup pane ended before its command did.";

/** The sentence of a setup the store read as running at the daemon's start. */
export const DAEMON_STOPPED = "The daemon stopped before the setup command ended.";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

/** Whether a value read from a file is a setup with every field of the protocol's. */
export function isWorktreeSetup(value: unknown): value is WorktreeSetup {
  return (
    isRecord(value) &&
    Array.isArray(value.copied) &&
    value.copied.every((path) => typeof path === "string") &&
    typeof value.copiedCount === "number" &&
    Array.isArray(value.failedCopies) &&
    value.failedCopies.every((entry) => isRecord(entry) && typeof entry.path === "string" && typeof entry.why === "string") &&
    isTextOrNull(value.command) &&
    isNumberOrNull(value.paneId) &&
    (value.state === "running" || value.state === "succeeded" || value.state === "failed") &&
    isNumberOrNull(value.exitCode) &&
    isTextOrNull(value.failure) &&
    typeof value.startedAt === "number" &&
    isNumberOrNull(value.endedAt)
  );
}

/** A copy of a setup with only the protocol's fields, its lists among them. */
export function setupOf(setup: WorktreeSetup): WorktreeSetup {
  const { copied, copiedCount, failedCopies, command, paneId, state, exitCode, failure, startedAt, endedAt } = setup;
  return { copied: [...copied], copiedCount, failedCopies: failedCopies.map(({ path, why }) => ({ path, why })), command, paneId, state, exitCode, failure, startedAt, endedAt };
}
