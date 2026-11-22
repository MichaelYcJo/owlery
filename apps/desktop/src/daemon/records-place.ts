// The place for work records in a person's repository, and the pull request
// check beside it: what a repository's main checkout holds of them, what a
// setup would write, and the setup itself, which is the one commit Owlery
// makes in a repository at its connection (docs/architecture.md, "Records
// are committed to the repository"). Git runs with execFile and arguments,
// never through a shell.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { RecordsPlace, RecordsPlan } from "../shared/protocol";

/** The first line of a records root's `README.md`, which the pull request check tells a root by (`pr-check/lib/optin.py`, `MARKER`). */
export const MARKER = "# What AgenticSeal maintains in seal/";
/** The subject of the commit a setup makes. */
export const SUBJECT = "chore: add the place for work records and the pull request check";
/** The two names a records root takes: the first, and the second where the repository keeps a `seal/` of its own. */
const ROOTS = ["seal", "agentic-seal"] as const;
/** The workflow a setup writes, and the one of AgenticSeal's that is kept in its place where it stands. */
const WORKFLOW = ".github/workflows/owlery-seal.yml";
const PLUGIN_WORKFLOW = ".github/workflows/hygiene.yml";
/** The script AgenticSeal's workflow runs, by its path in the plugin: a `hygiene.yml` that names it is the check. */
const PLUGIN_CHECK = "skills/code-review/scripts/chain_check.py";
/** The modes git gives a file: one it cannot run, and one it can. A link and a submodule have other modes. */
const FILE_MODES = ["100644", "100755"];

/** What a new root's `README.md` holds. Its first line is the marker. */
function readmeText(): string {
  return [
    MARKER,
    "",
    "Owlery keeps the work records of this repository here, and commits them. The first line of this file is the marker the pull request check reads: leave it as it is.",
    "",
    "- `config.json` holds what this repository says about itself. `Broad gate` is the command that must pass on a commit before it is sealed. `Commit and pull request language` and `Record language` name the language of commits and of records.",
    "- `threads/<work-item-id>/` holds one work item's records: how it was routed, its design, its review rounds, the broad gate's run, the verdict, and `decisions.md`, the decisions made for it without asking and the questions it was parked with.",
    "",
    `The check runs on every pull request from \`${WORKFLOW}\`. It judges a pull request whose branch a \`routing.md\` under \`threads/\` names, and passes every other one unjudged.`,
    "",
  ].join("\n");
}

/** What a new root's `config.json` holds: the two languages the check asks for, and the broad gate command. */
function configText(command: string): string {
  return `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": command }, null, 2)}\n`;
}

/**
 * The workflow a setup writes, for a version of Owlery: it fetches the check
 * from Owlery's repository at the tag of that version, and at the release's
 * branch until the tag exists, and runs the check's script under
 * `pr-check/`. The job's name is the check's name on GitHub.
 */
export function workflowText(version: string): string {
  return `# The pull request check of Owlery: a pull request that declares a work item
# carries the records it owes, and a ready one carries a seal at its head.
# A pull request that declares no work item is not judged.
# Owlery wrote this file when the repository was connected. It fetches the
# check from Owlery's repository at the release that wrote it. The line moves
# when a person edits it.

name: seal

on:
  pull_request:
    # A draft made ready and a body edited make no commit, so each is named.
    types: [opened, synchronize, reopened, edited, ready_for_review, converted_to_draft]

concurrency:
  group: \${{ github.workflow }}-\${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  seal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # the check reads the commits since the base branch

      # The release's tag, or the release's branch until the tag exists.
      - name: the check, at Owlery ${version}
        shell: bash
        run: |
          git clone --quiet --depth 1 --branch v${version} \\
            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery" \\
          || git clone --quiet --depth 1 --branch release/v${version} \\
            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery"

      - name: a declared work item carries the records it owes
        shell: bash
        run: |
          python3 "$RUNNER_TEMP/owlery/pr-check/skills/code-review/scripts/chain_check.py" \\
            --baseline "origin/\${{ github.base_ref }}"
`;
}

/** Whether anything stands at a path of the repository, a link that leads nowhere among it. */
function stands(folder: string, path: string): boolean {
  try {
    lstatSync(join(folder, path));
    return true;
  } catch {
    return false;
  }
}

/** A file's text, or null where it cannot be read. */
function textOf(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** The root that stands: the first of the two names whose `README.md` opens with the marker, its line end taken off, as `pr-check/lib/optin.py` reads it. Null where neither does. */
export function rootOf(folder: string): string | null {
  return ROOTS.find((name) => textOf(join(folder, name, "README.md"))?.split("\n", 1)[0]?.replace(/\r+$/, "") === MARKER) ?? null;
}

/** The workflow that stands: Owlery's, or AgenticSeal's where Owlery's does not. AgenticSeal's is told by the script it runs, since a project's own workflow may bear its name. Null where neither does. */
function checkOf(folder: string): string | null {
  if (stands(folder, WORKFLOW)) return WORKFLOW;
  return textOf(join(folder, PLUGIN_WORKFLOW))?.includes(PLUGIN_CHECK) === true ? PLUGIN_WORKFLOW : null;
}

/**
 * What the repository's main checkout holds of the records place, read from
 * its working tree, committed or not. Git is not asked, and a folder that
 * holds none of it, or does not stand, gives null three times.
 */
export function readRecordsPlace(folder: string): RecordsPlace {
  const root = rootOf(folder);
  let broadGate: string | null = null;
  if (root !== null) {
    try {
      const config = JSON.parse(textOf(join(folder, root, "config.json")) ?? "null") as unknown;
      const value = typeof config === "object" && config !== null ? (config as Record<string, unknown>)["Broad gate"] : undefined;
      if (typeof value === "string") broadGate = value;
    } catch {
      // A config.json that is no JSON holds no key.
    }
  }
  return { root, check: checkOf(folder), broadGate };
}

/**
 * A command the repository's own `package.json` names as its likely broad
 * gate: its `check` script, or its `test` script where it has no `check`,
 * run by the package manager whose lock file stands at the top, and by npm
 * where none does. Null where the file does not stand, is no JSON, or holds
 * neither script. It is a proposal a person reads and changes, and decides
 * nothing.
 */
export function proposedBroadGate(folder: string): string | null {
  let scripts: unknown;
  try {
    scripts = (JSON.parse(textOf(join(folder, "package.json")) ?? "null") as { scripts?: unknown } | null)?.scripts;
  } catch {
    return null;
  }
  if (typeof scripts !== "object" || scripts === null) return null;
  const script = ["check", "test"].find((name) => typeof (scripts as Record<string, unknown>)[name] === "string");
  if (script === undefined) return null;
  const manager = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
  ].find(([lock = ""]) => stands(folder, lock))?.[1];
  return `${manager ?? "npm"} run ${script}`;
}

/** Runs git in a folder, and gives its exit code with what it printed. It rejects only where git could not be started. */
function git(cwd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && typeof error.code !== "number") reject(error);
      else resolve({ code: error ? (error.code as number) : 0, stdout, stderr });
    });
  });
}

/**
 * What git lists at or below the root's two names and `.github`: each file,
 * link and submodule by its path, with its mode. `args` is the listing, of
 * a commit's tree or of the index, and each prints a mode, more, a tab and
 * the path, with a NUL after each entry. A folder has no entry of its own.
 */
async function listed(folder: string, args: string[]): Promise<Map<string, string>> {
  const list = await git(folder, [...args, "--", ...ROOTS, ".github"]);
  if (list.code !== 0) throw new Error(list.stderr.trim() || "git could not list what it holds of the records place");
  const held = new Map<string, string>();
  for (const entry of list.stdout.split("\0")) {
    const tab = entry.indexOf("\t");
    if (tab !== -1) held.set(entry.slice(tab + 1), entry.slice(0, entry.indexOf(" ")));
  }
  return held;
}

/** The paths among those given that git ignores. Git prints each one, and exits 1 where it ignores none. It throws with git's words where git cannot say. */
async function ignoredAmong(folder: string, paths: readonly string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const ignored = await git(folder, ["check-ignore", "--", ...paths]);
  if (ignored.code !== 0 && ignored.code !== 1) throw new Error(ignored.stderr.trim() || "git could not say whether it ignores the paths of the records place");
  return ignored.stdout.split("\n").filter((path) => path !== "");
}

/** Whether something other than a folder stands at a path of the repository: a file, or a link, which is not followed. */
function standsAsNoFolder(folder: string, path: string): boolean {
  try {
    return !lstatSync(join(folder, path)).isDirectory();
  } catch {
    return false;
  }
}

/** The names in a sentence: one, two with "and", or more with commas and "and". */
function named(names: readonly string[]): string {
  return names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

/**
 * What a setup of the records place in a repository would write and commit,
 * with `broadGate` as the command of a new `config.json`. Nothing is
 * written.
 *
 * The root that stands is kept with its `README.md`, and its `config.json`
 * where it has one. A new root is planned at `seal`, or at `agentic-seal`
 * where `seal` is taken: something stands there, or git holds a file below
 * it, staged or committed, that the checkout does not show. The workflow is
 * planned only where neither Owlery's nor AgenticSeal's stands.
 *
 * What stands is asked of the checkout, and git is asked whether it holds
 * the same, because a clone and the check on GitHub get what is committed.
 * The plan is `blocked` by the first of these that holds: both names of the
 * root are taken; git ignores a file the plan keeps; the commit the
 * checkout stands at holds no file at the path of one the plan keeps, which
 * may write nothing; git holds, staged or committed, a path the plan
 * writes; something other than a folder is at a folder above a path it
 * writes, in the checkout, the index or the commit; no branch is checked
 * out; git ignores a path it writes.
 * The stamp is made of the commit the checkout stands at, the branch and
 * the files, so it is another once a commit lands, the branch changes, a
 * file of the place appears or the command is another.
 */
export async function planRecords(folder: string, broadGate: string, version: string): Promise<RecordsPlan> {
  const inside = await git(folder, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.code !== 0 || inside.stdout.trim() !== "true") throw new Error(inside.stderr.trim() || `${folder} is no checkout of a repository`);
  const [atHead, onBranch] = await Promise.all([git(folder, ["rev-parse", "--verify", "--quiet", "HEAD"]), git(folder, ["symbolic-ref", "--quiet", "--short", "HEAD"])]);
  const head = atHead.code === 0 ? atHead.stdout.trim() : null;
  const branch = onBranch.code === 0 ? onBranch.stdout.trim() : null;

  const [inCommit, inIndex] = await Promise.all([head === null ? new Map<string, string>() : listed(folder, ["ls-tree", "-r", "-z", head]), listed(folder, ["ls-files", "--cached", "--stage", "-z"])]);
  /** Whether git holds the path or something below it, staged or committed. */
  const gitHolds = (path: string): boolean => [...inCommit.keys(), ...inIndex.keys()].some((held) => held === path || held.startsWith(`${path}/`));

  const kept = rootOf(folder);
  const root = kept ?? ROOTS.find((name) => !stands(folder, name) && !gitHolds(name)) ?? null;
  const check = checkOf(folder);
  const files: RecordsPlan["files"] = [];
  if (root !== null) {
    files.push({ path: `${root}/README.md`, text: kept === null ? readmeText() : null });
    files.push({ path: `${root}/config.json`, text: stands(folder, `${root}/config.json`) ? null : configText(broadGate.trim()) });
  }
  files.push({ path: check ?? WORKFLOW, text: check === null ? workflowText(version) : null });

  const written = files.filter((file) => file.text !== null).map((file) => file.path);
  // A file is kept only where the commit holds it as a file: one that stands untracked, staged alone, behind a link or inside a submodule is missing from every clone, and the check on GitHub then finds no root.
  const unheld = files.filter((file) => file.text === null && !FILE_MODES.includes(inCommit.get(file.path) ?? "")).map((file) => file.path);
  // Where git cannot say whether it ignores one of them, behind a link for one, the file is named as not committed.
  const unheldIgnored = await ignoredAmong(folder, unheld).catch(() => []);
  // A path the setup writes that git holds is the person's: a file staged or committed that the checkout no longer shows, or a removal staged. The commit would replace it, and the cleanup of a commit that fails would unstage it.
  const known = written.filter(gitHolds);
  // The folders above the written paths at which the checkout, the index or the commit holds a file, a link or a submodule.
  const above = new Set<string>();
  for (const path of written) for (let at = dirname(path); at !== "."; at = dirname(at)) above.add(at);
  const notFolders = [...above].filter((at) => standsAsNoFolder(folder, at) || inCommit.has(at) || inIndex.has(at));
  const ignores = (paths: readonly string[]): string => `Git ignores ${named(paths)} in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.`;
  let blocked: string | null = null;
  if (root === null) {
    blocked = "Both seal/ and agentic-seal/ hold something of this repository's own, so Owlery has no folder to keep work records in.";
  } else if (unheldIgnored.length > 0) {
    blocked = ignores(unheldIgnored);
  } else if (unheld.length > 0) {
    blocked = `This checkout holds ${named(unheld)}, and the commit it stands at does not, so a clone of the repository would lack it. Commit or remove what is named, and open this again.`;
  } else if (known.length > 0) {
    blocked = `Git holds ${named(known)}, staged or committed, and this checkout does not, so the setup would replace it. Restore what is named or unstage it, or commit its removal, and open this again.`;
  } else if (notFolders.length > 0) {
    blocked = `The setup needs a folder at ${named(notFolders)}, and something else stands there in this repository. Rename or remove it, and open this again.`;
  } else if (written.length > 0 && branch === null) {
    blocked = "No branch is checked out in this repository, so the commit has no branch to land on. Check a branch out and open this again.";
  } else {
    const ignored = await ignoredAmong(folder, written);
    if (ignored.length > 0) blocked = ignores(ignored);
  }
  const writesConfig = files.some((file) => file.path.endsWith("/config.json") && file.text !== null);
  return { branch, subject: SUBJECT, files, blocked, proposedBroadGate: writesConfig ? proposedBroadGate(folder) : null, stamp: createHash("sha256").update(JSON.stringify([head, branch, files])).digest("hex") };
}

/**
 * Sets up the records place of a repository, after the person read its
 * plan: the plan is made again, and the setup is refused where its stamp is
 * not `stamp`, where it is `blocked`, and where it writes a `config.json`
 * and the command is empty. A plan that writes no file changes nothing and
 * makes no commit.
 *
 * Each file is created only where nothing stands at its path, and the plan
 * is blocked where git holds one of the paths, so the commit replaces no
 * file and its cleanup unstages nothing of the person's. Those paths
 * alone are staged and those paths alone are committed, on the branch the
 * checkout stands on, with the person's git identity and the repository's
 * hooks: no option skips a hook or a signature, and nothing is pushed. What
 * else is staged stays staged. Where a write or the commit fails, those
 * paths are unstaged, the files and the folders this call created are
 * removed, and the error holds git's words, a hook's output among them.
 */
export async function setUpRecords(folder: string, broadGate: string, version: string, stamp: string): Promise<void> {
  const plan = await planRecords(folder, broadGate, version);
  if (plan.stamp !== stamp) throw new Error("The repository changed since the plan was read. Read the plan again.");
  if (plan.blocked !== null) throw new Error(plan.blocked);
  const writes = plan.files.filter((file): file is { path: string; text: string } => file.text !== null);
  if (writes.length === 0) return;
  if (broadGate.trim() === "" && writes.some((file) => file.path.endsWith("/config.json"))) throw new Error("The broad gate command is empty. Type the command that must pass before a commit is sealed.");
  const paths = writes.map((file) => file.path);
  const madeFiles: string[] = [];
  const madeFolders: string[] = [];
  let staged = false;
  try {
    for (const { path, text } of writes) {
      // The folders above the file that do not stand yet, the highest first, so a failure removes them and no other.
      const missing: string[] = [];
      for (let above = dirname(path); above !== "." && !stands(folder, above); above = dirname(above)) missing.unshift(above);
      for (const made of missing) {
        mkdirSync(join(folder, made));
        madeFolders.push(made);
      }
      // `wx` refuses a path at which something stands, so nothing of the person's is written over.
      writeFileSync(join(folder, path), text, { flag: "wx" });
      madeFiles.push(path);
    }
    staged = true;
    const added = await git(folder, ["add", "--", ...paths]);
    if (added.code !== 0) throw new Error(added.stderr.trim() || "git add failed");
    const committed = await git(folder, ["commit", "-m", plan.subject, "--", ...paths]);
    if (committed.code !== 0) throw new Error(`${committed.stderr}${committed.stdout}`.trim() || "git commit failed");
  } catch (error) {
    // A checkout with no commit has no state to reset a path to, so the paths leave the index by name.
    if (staged) await git(folder, (await git(folder, ["rev-parse", "--verify", "--quiet", "HEAD"])).code === 0 ? ["reset", "--quiet", "--", ...paths] : ["rm", "--cached", "--quiet", "--ignore-unmatch", "--", ...paths]).catch(() => undefined);
    for (const path of madeFiles) rmSync(join(folder, path), { force: true });
    for (const made of madeFolders.reverse()) {
      try {
        // Only an empty folder goes: one that gained a file meanwhile stays.
        rmdirSync(join(folder, made));
      } catch {
        // The refusal of the setup is what the person is told.
      }
    }
    throw error;
  }
}
