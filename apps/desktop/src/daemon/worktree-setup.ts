// The setup a repository names for its new worktrees, in two files at the
// top of its main checkout that the person keeps and Owlery only reads:
// `.worktreeinclude`, patterns in the syntax of `.gitignore` naming the
// ignored paths a new worktree gets from the main checkout, and
// `.worktreesetup`, the command a new worktree runs. Git decides what the
// patterns match, never Owlery's own reading of them, and git runs with
// arguments, never through a shell.
import { spawn } from "node:child_process";
import { constants as files } from "node:fs";
import { copyFile, cp, link, lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rename, rm, rmdir, stat, symlink, writeFile } from "node:fs/promises";
import { constants } from "node:os";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
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

/** The program that clones a path: `cp -c` clones each file on APFS, so the copy writes almost nothing to the disk. */
export const CLONE = "/bin/cp";

/** Whether `program`, run as `cp -c -R -P`, cloned `source` to `target`: false where it exited with another code than 0 or could not start. */
function cloned(program: string, source: string, target: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(program, ["-c", "-R", "-P", source, target], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

/** Why a path is not copied where a link of the worktree leads the folder it would be written in out of the worktree. */
export const LEADS_OUT = "a link in the worktree leads its folder out of the worktree";

/**
 * Whether the nearest folder of `target` that stands lies inside `root` once
 * each link is read: a link the worktree's branch tracks can lead a path out
 * of the worktree, and a write follows it. A folder that stands and cannot
 * be read through, as a link to nothing, leads nowhere a write may go.
 * `root` is a real path.
 */
async function staysInside(root: string, target: string): Promise<boolean> {
  for (let folder = dirname(target); ; folder = dirname(folder)) {
    try {
      const inside = relative(root, await realpath(folder));
      return inside === "" || (inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside));
    } catch {
      if ((await lstat(folder).then(() => true, () => false)) || dirname(folder) === folder) return false;
    }
  }
}

/** Why a path is not copied where it came to stand in the worktree while it was copied, as by a command in the person's pane: the copy is not moved over it. */
export const APPEARED = "it came to stand in the worktree during the copy, and was left as it is";

/** The errors with which a move refuses a target that stands. */
const STANDS = new Set(["EEXIST", "ENOTEMPTY", "ENOTDIR", "EISDIR"]);

/** The errors with which a volume refuses to make any hard link, as exFAT refuses one with `ENOTSUP`. */
const NO_HARD_LINK = new Set(["ENOTSUP", "EXDEV", "EPERM"]);

/**
 * Moves the copy at `stage` to `target`, and throws `APPEARED` where
 * anything stands at `target`, with no write over it: a folder by `rename`,
 * which refuses a file and a folder that is not empty, a link by making it
 * again, and anything else by a hard link, or, where the volume makes no
 * hard link, by a copy that refuses a target that stands. Each of these
 * refuses whatever stands, except that `rename` takes the place of an empty
 * folder.
 */
async function place(stage: string, target: string): Promise<void> {
  const kind = await lstat(stage);
  try {
    if (kind.isDirectory()) await rename(stage, target);
    // A hard link of a link is, on macOS, a hard link of the file it names.
    else if (kind.isSymbolicLink()) await symlink(await readlink(stage), target);
    else
      await link(stage, target).catch((error: NodeJS.ErrnoException) => {
        if (!NO_HARD_LINK.has(error.code ?? "")) throw error;
        return copyFile(stage, target, files.COPYFILE_EXCL);
      });
  } catch (error) {
    throw STANDS.has((error as NodeJS.ErrnoException).code ?? "") ? new Error(APPEARED) : error;
  }
}

/** The start of the name of the folder `copyPath` writes a copy in, and the whole name, which `mkdtemp` ends with six letters or digits. */
const STAGING = ".owlery-copy-";
const STAGING_NAME = /^\.owlery-copy-[A-Za-z0-9]{6}$/;

/** What the `.gitignore` of a staging folder holds, so git sees nothing in the folder. */
const UNSEEN = "*\n";

/**
 * Removes from `folder` each staging folder a copy left, as where the daemon
 * stopped during the copy and `copyPath` never removed its own: a folder of
 * the staging folder's name that is empty or holds the `.gitignore`
 * `copyPath` writes. Nothing else in `folder` is touched, and a `folder`
 * that does not stand holds none.
 */
async function removeLeftCopies(folder: string): Promise<void> {
  const names = await readdir(folder).catch(() => [] as string[]);
  for (const name of names) {
    if (!STAGING_NAME.test(name)) continue;
    const left = join(folder, name);
    // A copy stopped before it wrote the `.gitignore` left the folder empty.
    if (await rmdir(left).then(() => true, () => false)) continue;
    if ((await readFile(join(left, ".gitignore"), "utf8").catch(() => null)) === UNSEEN) await rm(left, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Copies `source` to `target` through a folder of its own beside the
 * target, so nothing stands at the target until the copy is whole: clones it
 * with `clone` run as `cp -c -R -P`, copies it with Node's copy in place of
 * what a failed clone left, then `place`s it. Git sees nothing in that
 * folder, which holds a `.gitignore` of `*` and the copy one folder further
 * down, so a command in the person's pane neither lists nor adds the copy
 * before it stands in its place, nor a folder a stopped daemon left. The
 * folder goes in every case, with whatever a failed copy left in it.
 */
async function copyPath(clone: string, source: string, target: string): Promise<void> {
  const staging = await mkdtemp(join(dirname(target), STAGING));
  try {
    // The repository's patterns may be anchored at its top, which this folder may stand below, so the folder says itself what git ignores in it.
    await writeFile(join(staging, ".gitignore"), UNSEEN);
    // One folder further down, so an included path named `.gitignore` is not that file.
    const stage = join(staging, "copy", basename(target));
    await mkdir(dirname(stage));
    if (!(await cloned(clone, source, stage))) {
      await rm(stage, { recursive: true, force: true });
      await cp(source, stage, { recursive: true, verbatimSymlinks: true, force: false, errorOnExist: false });
    }
    await place(stage, target);
  } finally {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Copies into `worktree` each path of the main checkout `repo` that a
 * pattern of its `.worktreeinclude` matches and git ignores. The paths are
 * those that `git ls-files --others --ignored --exclude-from` lists with a
 * folder as one path, which `git check-ignore` then confirms git ignores, so
 * a tracked file and an untracked file git does not ignore are never
 * copied. A folder is copied whole, a link as a link with its target as it
 * reads, and a path that already stands in the worktree is neither written
 * over nor listed. A path whose folder a link of the worktree leads out of
 * it is listed as not copied, and nothing is written there. In each other
 * path's folder, whether the path stands or not, a staging folder a stopped
 * copy left is removed (`removeLeftCopies`). The folders the worktree lacks
 * above a path are made, then the path is cloned beside its place with
 * `clone` run as `cp -c -R -P`, which copies the bytes itself where no clone
 * can be made, as on a volume that is not APFS or across volumes. Where that
 * process fails, as on a file it cannot read, or cannot start, Node's copy
 * writes the path there instead. The copy then moves into its place whole.
 * A path that came to stand in the
 * worktree meanwhile is left as it is and listed as not copied. A path that
 * fails to copy is listed with its error, nothing of it is left in the
 * worktree, the folders made for it among them, and the others go on. Where
 * either git command fails, nothing is copied and `failure` says why;
 * nothing is thrown.
 */
export async function copyIncluded(repo: string, worktree: string, clone = CLONE): Promise<{ copied: string[]; copiedCount: number; failed: { path: string; why: string }[]; failure: string | null }> {
  const none = { copied: [], copiedCount: 0, failed: [] };
  const listed = await gitWith(repo, ["ls-files", "--others", "--ignored", `--exclude-from=${join(repo, INCLUDE_FILE)}`, "--directory", "-z"], "");
  if (listed.code !== 0) return { ...none, failure: complaint("ls-files", listed) };
  // A folder that holds an ignored path is listed too, and git ignores no such folder itself.
  const ignored = await gitWith(repo, ["check-ignore", "--stdin", "-z"], listed.stdout);
  // `check-ignore` exits 1 where it prints nothing: none of the paths is ignored.
  if (ignored.code !== 0 && !(ignored.code === 1 && ignored.stdout === "")) return { ...none, failure: complaint("check-ignore", ignored) };
  let root: string;
  try {
    // macOS reaches its temporary folders through a link, so the worktree is compared by its real path.
    root = await realpath(worktree);
  } catch (error) {
    return { ...none, failure: `the worktree could not be read: ${error instanceof Error ? error.message : String(error)}` };
  }
  const copied: string[] = [];
  const failed: { path: string; why: string }[] = [];
  const swept = new Set<string>();
  for (const path of ignored.stdout.split("\0").filter((entry) => entry !== "")) {
    // A folder is listed with a slash at its end, and stands in the worktree without it. `cp` given a folder with the slash would copy what it holds.
    const source = join(repo, path.replace(/\/$/, ""));
    const target = join(worktree, path.replace(/\/$/, ""));
    // Before any read or write of the target, each of which follows the links above it.
    if (!(await staysInside(root, target))) {
      failed.push({ path, why: LEADS_OUT });
      continue;
    }
    // A copy into this folder that a stopped daemon left goes, whatever has come to stand at the path since.
    if (!swept.has(dirname(target))) {
      swept.add(dirname(target));
      await removeLeftCopies(dirname(target));
    }
    try {
      await lstat(target);
      continue;
    } catch {
      // Nothing stands there, so the path is copied.
    }
    let made: string | undefined;
    try {
      // `cp` makes none of the folders above its target, which the check above holds inside the worktree.
      made = await mkdir(dirname(target), { recursive: true });
      await copyPath(clone, source, target);
      copied.push(path);
    } catch (error) {
      failed.push({ path, why: error instanceof Error ? error.message : String(error) });
      // The folders made for the path go with it, each where nothing else came to stand in it, so a run again finds the path missing.
      for (let folder = dirname(target); made !== undefined && folder.startsWith(made); folder = dirname(folder)) {
        if (!(await rmdir(folder).then(() => true, () => false))) break;
      }
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

/** The sentence of a setup whose `.worktreesetup` held another command than the one shown before the press, or one where none was shown, or none where one was: no command ran. */
export const COMMAND_CHANGED = ".worktreesetup changed after the setup was shown, so no command ran.";

/**
 * Begins the setup of a worktree of the repository `repo` names: reads the
 * two files, and copies the included paths where `.worktreeinclude` stands.
 * Null where the repository names neither. Where a command stands and it is
 * `shown`, the text the person was shown before the press, whole, the setup
 * is `running` and names no pane yet: the daemon starts the pane. Where none
 * does, it has ended by the copy. Where the command the file holds is not
 * the one shown, the setup has ended by the copy too, failed with
 * `COMMAND_CHANGED`, and names the command the file holds, so the next
 * showing names it. A `.worktreesetup` that cannot be read is a setup that
 * failed, and nothing is copied. `now` is read when the setup begins, before
 * the copy, and again where it ends, after it.
 */
export async function beginSetup(repo: string, worktree: string, now: () => number, shown: string | null): Promise<WorktreeSetup | null> {
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
  // The command runs with the person's rights, so only as they were shown it.
  if (named.command !== shown) return endedSetup(setup, { exitCode: null, failure: COMMAND_CHANGED }, now());
  return named.command === null ? endedSetup(setup, { exitCode: null, failure: null }, now()) : setup;
}

/** The sentence of a setup whose pane the daemon ended, at a close, an archive, a removal or a delete. */
export const PANE_ENDED = "The setup pane ended before its command did.";

/** The sentence of a setup the store read as running at the daemon's start. */
export const DAEMON_STOPPED = "The daemon stopped before the setup command ended.";

/** The sentence of a setup whose command's process a signal ended, by the signal's name where the system names it, as "SIGTERM". */
export function signalEnded(signal: number): string {
  const name = Object.entries(constants.signals).find(([, number]) => number === signal)?.[0];
  return `The setup command was ended by ${name ?? `signal ${signal}`}.`;
}

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
