// The place for work records in a person's repository, and the pull request
// check beside it: what a repository's main checkout holds of them, what a
// setup would write, and the setup itself, which is the one commit Owlery
// makes in a repository at its connection (docs/architecture.md, "Records
// are committed to the repository"). Git runs with execFile and arguments,
// never through a shell.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
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
/**
 * Names a work item's records bear below its directory, `threads/<work-item-id>/`
 * of the root. They are a sample and no list of every record: a stage writes
 * a phase and a round under other numbers, and a later release may add a
 * record.
 */
const RECORDS = ["routing.md", "frame/design.md", "frame/plan.md", "frame/questions.md", "gaps.md", "changelog.md", "pr.md", "decisions.md", "trail/phases/phase-1.md", "trail/rounds/round-1.md", "trail/gate.md", "guarantee.md"] as const;

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

/** Whether a `README.md` of that text is a records root's: its first line is the marker, its line end taken off, as `pr-check/lib/optin.py` reads it. Null is a file that does not stand. */
function opensWithMarker(text: string | null): boolean {
  return text?.split("\n", 1)[0]?.replace(/\r+$/, "") === MARKER;
}

/** Whether a `hygiene.yml` of that text is AgenticSeal's: it is told by the script it runs, since a project's own workflow may bear its name. Null is a file that does not stand. */
function runsPluginCheck(text: string | null): boolean {
  return text?.includes(PLUGIN_CHECK) === true;
}

/** The root that stands in a working tree: the first of the two names whose `README.md` is a root's. Null where neither is. */
export function rootOf(folder: string): string | null {
  return ROOTS.find((name) => opensWithMarker(textOf(join(folder, name, "README.md")))) ?? null;
}

/** The workflow that stands in a working tree: Owlery's, or AgenticSeal's where Owlery's does not. Null where neither does. */
function checkOf(folder: string): string | null {
  if (stands(folder, WORKFLOW)) return WORKFLOW;
  return runsPluginCheck(textOf(join(folder, PLUGIN_WORKFLOW))) ? PLUGIN_WORKFLOW : null;
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

/** Whether a file stands at a path of the repository. A link is not followed, and is none. */
function standsAsFile(folder: string, path: string): boolean {
  try {
    return lstatSync(join(folder, path)).isFile();
  } catch {
    return false;
  }
}

/** The names in a sentence: one, two with "and", or more with commas and "and". */
function named(names: readonly string[]): string {
  return names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

/**
 * Whether the working tree shows something at a path under exactly that
 * name, a link among it, as a reader of the tree finds it: each name is
 * looked up in its folder's listing, so a link or a submodule above the
 * path is read through, and a name that differs only in the case of its
 * letters is another name on every disk.
 */
function shows(folder: string, path: string): boolean {
  let at = folder;
  for (const name of path.split("/")) {
    try {
      if (!readdirSync(at).includes(name)) return false;
    } catch {
      return false;
    }
    at = join(at, name);
  }
  return true;
}

/**
 * What a setup of the records place in a repository would write and commit,
 * with `broadGate` as the command of a new `config.json`. Nothing is
 * written.
 *
 * The plan is made from the commit the checkout stands at and from nothing
 * else, because that is what a clone and the check on GitHub get. A
 * repository with no commit is planned as one that holds nothing. The root
 * that is kept is the first of the two names whose `README.md` the commit
 * holds as a file that opens with the marker, with its `config.json` where
 * the commit holds one. A new root is planned at the first name the commit
 * holds nothing at or below. The workflow that is kept is Owlery's where
 * the commit holds it as a file, or AgenticSeal's `hygiene.yml` where the
 * commit's text of it runs the check, and Owlery's is planned where the
 * commit holds neither.
 *
 * The checkout then has to hold the place as the commit does, since the
 * setup writes into the checkout and the daemon reads the place from it.
 * What is compared is what the plan keeps or writes and what the daemon
 * reads. The plan's files, Owlery's workflow and every path below a new
 * root differ where git's status reports them, changed, removed, staged,
 * untracked or ignored. A kept file also differs where no file stands at
 * its path in the checkout, which status does not report of a sparse
 * checkout, and where its text there, hashed as git would store it, is not
 * the commit's: status reports no change of a path it is told not to look
 * at, by the skip-worktree or the assume-unchanged flag of its index
 * entry. The `README.md` of the other name of the root and a `hygiene.yml`
 * the plan does not keep are the project's own, and the daemon reads one
 * thing of each, whether it opens with the marker and whether it runs the
 * check: such a file differs where the checkout's text or the index's
 * answers that otherwise than the commit's, and no other edit of it does.
 *
 * The plan is `blocked` by the first of these that holds: the commit holds
 * something of the project's own at both names of the root; git ignores a
 * file of the plan; git ignores the folder `threads/` of the root or one of
 * the sample of record paths below it; something other than a folder is at
 * a folder above a path the plan writes, in the checkout, the index or the
 * commit; the disk finds a path the setup needs under the same name in
 * other letters; the commit holds a link, a submodule or a folder at a
 * path the plan writes; the checkout differs from the commit as above, and
 * each such path is named; the plan writes a file and no branch is checked
 * out.
 * The stamp is made of the commit the checkout stands at, the branch and
 * the files, so it is another once a commit lands, the branch changes or
 * the command is another.
 */
export async function planRecords(folder: string, broadGate: string, version: string): Promise<RecordsPlan> {
  const inside = await git(folder, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.code !== 0 || inside.stdout.trim() !== "true") throw new Error(inside.stderr.trim() || `${folder} is no checkout of a repository`);
  const [atHead, onBranch] = await Promise.all([git(folder, ["rev-parse", "--verify", "--quiet", "HEAD"]), git(folder, ["symbolic-ref", "--quiet", "--short", "HEAD"])]);
  const head = atHead.code === 0 ? atHead.stdout.trim() : null;
  const branch = onBranch.code === 0 ? onBranch.stdout.trim() : null;

  const [inCommit, inIndex] = await Promise.all([head === null ? new Map<string, string>() : listed(folder, ["ls-tree", "-r", "-z", head]), listed(folder, ["ls-files", "--cached", "--stage", "-z"])]);
  /** Whether the commit holds a file at the path. A link and a submodule are none. */
  const holdsFile = (path: string): boolean => FILE_MODES.includes(inCommit.get(path) ?? "");
  /** Whether the commit holds anything at the path or below it: a file, a link, a submodule or a folder. */
  const holds = (path: string): boolean => [...inCommit.keys()].some((held) => held === path || held.startsWith(`${path}/`));
  /** The commit's text of a file it holds, as git stores it, or null where it holds no file there. */
  const committed = async (path: string): Promise<string | null> => {
    if (head === null || !holdsFile(path)) return null;
    const blob = await git(folder, ["cat-file", "blob", `${head}:${path}`]);
    if (blob.code !== 0) throw new Error(blob.stderr.trim() || `git could not read ${path} of the commit`);
    return blob.stdout;
  };

  const readmes = ROOTS.map((name) => `${name}/README.md`);
  let kept: string | null = null;
  for (const name of ROOTS) {
    if (kept === null && opensWithMarker(await committed(`${name}/README.md`))) kept = name;
  }
  const root = kept ?? ROOTS.find((name) => !holds(name)) ?? null;
  const check = holdsFile(WORKFLOW) ? WORKFLOW : runsPluginCheck(await committed(PLUGIN_WORKFLOW)) ? PLUGIN_WORKFLOW : null;
  const files: RecordsPlan["files"] = [];
  if (root !== null) {
    files.push({ path: `${root}/README.md`, text: kept === null ? readmeText() : null });
    files.push({ path: `${root}/config.json`, text: holdsFile(`${root}/config.json`) ? null : configText(broadGate.trim()) });
  }
  files.push({ path: check ?? WORKFLOW, text: check === null ? workflowText(version) : null });
  const written = files.filter((file) => file.text !== null).map((file) => file.path);

  const planned = files.map((file) => file.path);

  // The plan's files and Owlery's workflow, as git holds them. Status is asked of them and of everything below a new root, so every entry it prints is one of those.
  const own = [...new Set([...planned, WORKFLOW])];
  const status = await git(folder, ["--no-optional-locks", "status", "--porcelain=v1", "-z", "--no-renames", "--ignored", "--untracked-files=all", "--", ...own, ...(kept === null && root !== null ? [root] : [])]);
  if (status.code !== 0) throw new Error(status.stderr.trim() || "git could not say how the checkout differs from its commit");
  const reported = status.stdout.split("\0").filter((entry) => entry !== "").map((entry) => entry.slice(3));
  const apart = new Set(own.filter((path) => reported.includes(path)));
  // A kept file as the checkout holds it, against the commit's: one at whose path no file stands, which status does not report of a sparse checkout, and one whose text, hashed as git would store it, is another. Status is not the reading of that text: it reports no change of a path whose index entry is flagged skip-worktree or assume-unchanged, whatever the checkout holds.
  const keptFiles = files.filter((file) => file.text === null).map((file) => file.path);
  const standing = keptFiles.filter((path) => standsAsFile(folder, path));
  for (const path of keptFiles) if (!standing.includes(path)) apart.add(path);
  if (standing.length > 0) {
    const [hashed, stored] = await Promise.all([git(folder, ["hash-object", "--", ...standing]), git(folder, ["rev-parse", ...standing.map((path) => `${head ?? ""}:${path}`)])]);
    if (hashed.code !== 0 || stored.code !== 0) throw new Error(`${hashed.stderr}${stored.stderr}`.trim() || "git could not compare the checkout's files of the records place with the commit's");
    const [inCheckout, atCommit] = [hashed.stdout.trim().split("\n"), stored.stdout.trim().split("\n")];
    standing.forEach((path, at) => {
      if (inCheckout[at] !== atCommit[at]) apart.add(path);
    });
  }
  // What the daemon reads of the `README.md` at each name of the root and of `hygiene.yml`: whether it is a root's, and whether it runs the check. Where the plan neither keeps nor writes the file it is the project's own, and this is all that is compared of it. The index's text is read too, since the person's next commit takes it.
  const reads = (path: string): ((text: string | null) => boolean) => (path === PLUGIN_WORKFLOW ? runsPluginCheck : opensWithMarker);
  for (const path of [...readmes, PLUGIN_WORKFLOW]) {
    const atCommit = reads(path)(await committed(path));
    const staged = FILE_MODES.includes(inIndex.get(path) ?? "") ? (await git(folder, ["cat-file", "blob", `:${path}`])).stdout : null;
    if (reads(path)(textOf(join(folder, path))) !== atCommit || reads(path)(staged) !== atCommit) apart.add(path);
  }
  const differing = [...[...new Set([...planned, ...readmes, WORKFLOW, PLUGIN_WORKFLOW])].filter((path) => apart.has(path)), ...reported.filter((path) => !own.includes(path))];

  // The folders above the written paths at which the checkout, the index or the commit holds a file, a link or a submodule.
  const above = new Set<string>();
  for (const path of written) for (let at = dirname(path); at !== "."; at = dirname(at)) above.add(at);
  const notFolders = [...above].filter((at) => standsAsNoFolder(folder, at) || inCommit.has(at) || inIndex.has(at));
  // A written path or a folder above one that the disk finds and the folder's own listing does not name: it stands under other letters, on a disk that takes the two names for one. The highest such name of a path is the one named. On a disk that tells them apart nothing stands there, and none is named.
  const otherLetters = [...above, ...written].filter((at) => stands(folder, at) && !shows(folder, at) && (dirname(at) === "." || shows(folder, dirname(at))));
  // A path the plan writes at which the commit holds a link, a submodule or a folder: the checkout may hold it as the commit does, and the setup still has no place for its file.
  const occupied = written.filter(holds);
  // Where git cannot say whether it ignores a path, behind a link for one, the path is among those that differ or below a folder that is none.
  const ignored = await ignoredAmong(folder, planned).catch(() => []);
  // Where a work item's records go is asked too: a rule over it leaves a root that cannot keep a record, though git ignores none of the root's own files. The paths asked are the folder and RECORDS below a work item's directory, a sample, since the patterns of a `.gitignore` have no end: a rule that names a work item's id or another record is not found.
  const records = root === null ? [] : [`${root}/threads/`, ...RECORDS.map((name) => `${root}/threads/0-work-item/${name}`)];
  const ignoredRecords = await ignoredAmong(folder, records).catch(() => []);
  let blocked: string | null = null;
  if (root === null) {
    blocked = "Both seal/ and agentic-seal/ hold something of this repository's own, so Owlery has no folder to keep work records in.";
  } else if (ignored.length > 0) {
    blocked = `Git ignores ${named(ignored)} in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.`;
  } else if (ignoredRecords.length > 0) {
    blocked = `Git ignores ${ignoredRecords.length} of the ${records.length} paths Owlery asked about where a work item's records go in this repository, ${ignoredRecords[0] ?? ""} among them, so it cannot keep work records in its tree. The paths asked are ${root}/threads/ and a sample of the names a work item's records bear, so a rule that ignores another record is not found here. A repository that cannot keep work records in its tree is out of scope for Owlery.`;
  } else if (notFolders.length > 0) {
    blocked = `The setup needs a folder at ${named(notFolders)}, and something else stands there in this repository. Rename or remove it, and open this again.`;
  } else if (otherLetters.length > 0) {
    blocked = `The setup needs ${named(otherLetters)}, and this disk finds something of the repository there under the same name in other letters, which git and GitHub take for another name. Rename it, and open this again.`;
  } else if (occupied.length > 0) {
    blocked = `The commit this checkout stands at holds something other than a file at ${named(occupied)}, where the setup writes one. Rename it in a commit, and open this again.`;
  } else if (differing.length > 0) {
    blocked = `This checkout does not hold ${named(differing)} as the commit it stands at does. Owlery plans the records place from the commit, which is what a clone and the check on GitHub get. Commit what is named or put it back as the commit has it, widening a sparse checkout that leaves it out, and open this again.`;
  } else if (written.length > 0 && branch === null) {
    blocked = "No branch is checked out in this repository, so the commit has no branch to land on. Check a branch out and open this again.";
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
 * is blocked where the commit or the index holds one of the paths, so the
 * commit replaces no file and its cleanup unstages nothing of the
 * person's. Those paths
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
