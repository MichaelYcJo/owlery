// The release's settle: every work item's `decisions.md` read with the
// daemon's reader, the directories a settle keeps with the rows that keep
// each, the decisions the release made without asking, and `--apply`, which
// runs AgenticSeal's settle and puts back each directory the reading kept.
//
// A directory is kept while its record holds a `reversed` decision, an `open`
// question or a block the reader refuses: a record that cannot be read is not
// a record with nothing open, and a `decisions.md` that stands and cannot be
// opened stops the reading. A notice of the reader is named and keeps
// nothing. The release's work items are the directories the working tree
// holds and the previous release's tag does not.
//
// `readSettle` reads the working tree and asks git three things alone: the
// newest release tag, the directories that tag holds, and the subject of the
// commit that added each directory's `routing.md`. It writes nothing. Only
// `--apply` changes the working tree: AgenticSeal's settle removes, and the
// put-back writes each kept directory from `HEAD`.
import { execFileSync, spawnSync, type SpawnSyncReturns } from "node:child_process";
import { accessSync, constants, readFileSync, readdirSync, statSync } from "node:fs";
import { delimiter, join } from "node:path";
import { RECORD_FILE, readDecisionRecord, type DecisionBlock, type DecisionKind } from "./decision-record";
import { rootOf } from "./records-place";

/** One row of a record that keeps its directory: a reversed decision, an open question, or a refusal of the reader, at its 1-based line. */
export interface KeptRow {
  line: number;
  why: string;
}

/** A directory the settle keeps, relative to the folder, such as `seal/threads/<id>`, with each row that keeps it. */
export interface KeptDirectory {
  directory: string;
  rows: KeptRow[];
}

/** A work item of the release, by its directory's name, with the pull request its `routing.md` came in by and its decisions in the record's order. */
export interface ListedWorkItem {
  id: string;
  pullRequest: number | null;
  decisions: DecisionBlock[];
}

/** What a settle reads of a folder's records. */
export interface SettleReading {
  /** The records root's name, or null where the folder holds none. */
  root: string | null;
  kept: KeptDirectory[];
  notices: { directory: string; line: number; why: string }[];
  /** The ref the release is read from, or null where none is reachable and every work item is the release's. */
  since: string | null;
  release: ListedWorkItem[];
}

/** The kinds of decision in the order the grammar gives them, which is the order the list counts them in. */
const KINDS: DecisionKind[] = ["route", "default", "scope", "answered"];

/** A pull request's number at the end of a commit's subject, as a squash merge writes it. */
const PULL_REQUEST = /\(#([1-9][0-9]*)\)$/;

/** What git prints for those arguments in the folder. Throws where git exits other than 0, with what git said. */
function git(folder: string, ...args: string[]): string {
  try {
    return execFileSync("git", ["-C", folder, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const said = String((error as { stderr?: unknown }).stderr ?? "").trim();
    throw new Error(`git ${args.join(" ")} failed${said === "" ? "" : `: ${said}`}`);
  }
}

/** The names of the directories under the folder, in order, or none where it does not stand. */
function directoriesIn(folder: string): string[] {
  try {
    return readdirSync(folder, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** The record's text, or null where no file stands at its path. A record that stands and cannot be read throws, naming it. */
function recordText(folder: string, path: string): string | null {
  try {
    return readFileSync(join(folder, path), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw new Error(`${path} cannot be read: ${code ?? String(error)}`);
  }
}

/** The newest release tag reachable from `HEAD`, or null where none is. */
function newestTag(folder: string): string | null {
  try {
    return git(folder, "describe", "--tags", "--abbrev=0", "--match", "v[0-9]*").trim() || null;
  } catch {
    return null;
  }
}

/** The pull request the commit that added the file came in by, or null where its subject names none or no commit added it. */
function pullRequestOf(folder: string, path: string): number | null {
  const subject = git(folder, "log", "-1", "--diff-filter=A", "--format=%s", "--", path).trim();
  const number = PULL_REQUEST.exec(subject)?.[1];
  return number === undefined ? null : Number(number);
}

/**
 * What a settle reads of the folder's records: each directory under
 * `<root>/threads/` in the working tree, committed or not, read with the
 * daemon's reader. `since` names the previous release, by default the newest
 * tag reachable from `HEAD`. Throws where git cannot read `since`, and where a
 * record stands and cannot be read.
 */
export function readSettle(folder: string, since?: string): SettleReading {
  const root = rootOf(folder);
  if (root === null) return { root, kept: [], notices: [], since: since ?? null, release: [] };
  const threads = `${root}/threads`;
  const from = since ?? newestTag(folder);
  const before = new Set(from === null ? [] : git(folder, "ls-tree", "-z", "--name-only", from, `${threads}/`).split("\0").filter((path) => path !== ""));

  const kept: KeptDirectory[] = [];
  const notices: SettleReading["notices"] = [];
  const release: ListedWorkItem[] = [];
  for (const id of directoriesIn(join(folder, threads))) {
    const directory = `${threads}/${id}`;
    const text = recordText(folder, `${directory}/${RECORD_FILE}`);
    const got = readDecisionRecord(text ?? "");
    const rows: KeptRow[] = [];
    for (const decision of got.decisions) {
      if (decision.state.is === "reversed") rows.push({ line: decision.line, why: `decision ${decision.id} is reversed; decided: ${decision.decided}; reversal: ${decision.state.message}` });
    }
    for (const question of got.questions) {
      if (question.state.is === "open") rows.push({ line: question.line, why: `question ${question.id} is open; asks: ${question.asks}` });
    }
    for (const refusal of got.refusals) rows.push({ line: refusal.line, why: `the reader refuses the line: ${refusal.why}` });
    rows.sort((a, b) => a.line - b.line);
    if (rows.length > 0) kept.push({ directory, rows });
    for (const notice of got.notices) notices.push({ directory, ...notice });
    if (!before.has(directory)) release.push({ id, pullRequest: pullRequestOf(folder, `${directory}/routing.md`), decisions: got.decisions });
  }
  return { root, kept, notices, since: from, release };
}

const counted = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** A decision's state as the list gives it: its word, with the person's message where it holds one. */
function stateOf(decision: DecisionBlock): string {
  const state = decision.state;
  if (state.is === "decided") return "`decided`";
  const word = state.is === "applied" ? `applied ${state.commit}` : state.is === "carried" ? `carried ${state.home}` : "reversed";
  return `\`${word}\`: ${state.message}`;
}

/**
 * The release's decisions made without asking, as Markdown for the release's
 * pull request and its note: one line per kind that occurs, counting its
 * decisions and those the person reversed, then each work item that holds a
 * decision, in the order of the directories' names.
 */
export function listMarkdown(reading: SettleReading): string {
  const items = reading.release.filter((item) => item.decisions.length > 0);
  if (items.length === 0) return "No decision was made without asking in this release.\n";
  const all = items.flatMap((item) => item.decisions);
  const lines: string[] = [];
  for (const kind of KINDS) {
    const of = all.filter((decision) => decision.kind === kind);
    if (of.length === 0) continue;
    lines.push(`- \`${kind}\`: ${counted(of.length, "decision")}, ${of.filter((decision) => decision.state.is !== "decided").length} reversed by the person`);
  }
  for (const item of items) {
    lines.push("", `### ${item.id}${item.pullRequest === null ? "" : ` (#${item.pullRequest})`}`, "");
    for (const decision of item.decisions) {
      lines.push(`- Decision ${decision.id}, \`${decision.kind}\`: ${decision.decided}`, `  - Grounds: ${decision.grounds}`);
      if (decision.by !== null) lines.push(`  - By: ${decision.by}`);
      lines.push(`  - State: ${stateOf(decision)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

/** Where the command prints. */
export interface Printer {
  out: (text: string) => void;
  err: (text: string) => void;
}

const USAGE = "usage: settle [--list | --apply [--released-at <ref>]] [--since <ref>]";

/** The kept directory's heading line and each row that keeps it, as the command prints them. */
function keptLines(heading: string, kept: KeptDirectory): string {
  return [heading, ...kept.rows.map((row) => `  ${kept.directory}/${RECORD_FILE}:${row.line}: ${row.why}`)].map((line) => `${line}\n`).join("");
}

/** The file named `name` in the first folder of the path that holds one the process can run, or null where none does. */
function onPath(name: string): string | null {
  for (const folder of (process.env.PATH ?? "").split(delimiter)) {
    if (folder === "") continue;
    const file = join(folder, name);
    try {
      if (!statSync(file).isFile()) continue;
      accessSync(file, constants.X_OK);
      return file;
    } catch {
      continue;
    }
  }
  return null;
}

/** Whether the directory in the working tree differs from `HEAD`, a file `HEAD` does not hold among it, whatever `status.showUntrackedFiles` the repository sets. */
const differs = (top: string, directory: string): boolean => git(top, "status", "--porcelain", "--untracked-files=all", "--", `${directory}/`) !== "";

/** The exit AgenticSeal's settle gave, read as 0 or 1 where it gave one of them and as 2 for anything else, with what went wrong named. */
function exitOf(ran: SpawnSyncReturns<string>, print: Printer): number {
  if (ran.error !== undefined) {
    print.err(`settle: seal settle --apply did not run: ${ran.error.message}\n`);
    return 2;
  }
  if (ran.status === null) {
    print.err(`settle: seal settle --apply ended on ${ran.signal ?? "a signal"} with no exit code\n`);
    return 2;
  }
  return ran.status === 0 || ran.status === 1 ? ran.status : 2;
}

/**
 * `--apply`: runs AgenticSeal's `seal settle --apply` in the repository's
 * top and puts back from `HEAD` each directory the reading kept. It refuses
 * before anything runs where a kept directory differs from `HEAD`, which the
 * put-back would lose, and where no `seal` on the path can be run. It puts
 * nothing back where `HEAD` moved while the settle ran, and names each kept
 * directory it could not put back and goes on. It exits 2 where it refused or
 * did not put one back, and otherwise with the worse of its own reading and
 * the settle's exit: 2, then 1, then 0.
 */
function apply(top: string, reading: SettleReading, releasedAt: string | undefined, print: Printer): number {
  const refusals = reading.kept.filter((kept) => differs(top, kept.directory)).map((kept) => `${kept.directory}/ differs from HEAD, and a kept directory is put back from HEAD: commit or undo its changes first`);
  const seal = onPath("seal");
  if (seal === null) refusals.push("`seal` is not found on the path, so AgenticSeal's settle cannot run");
  if (seal === null || refusals.length > 0) {
    print.err(`${refusals.map((refusal) => `settle: ${refusal}\n`).join("")}settle: --apply ran nothing.\n`);
    return 2;
  }
  for (const notice of reading.notices) print.out(`notice ${notice.directory}/${RECORD_FILE}:${notice.line}: ${notice.why}\n`);

  const head = git(top, "rev-parse", "HEAD").trim();
  const ran = spawnSync(seal, ["settle", "--apply", ...(releasedAt === undefined ? [] : ["--released-at", releasedAt])], { cwd: top, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (ran.stdout) print.out(ran.stdout);
  if (ran.stderr) print.err(ran.stderr);
  const theirs = exitOf(ran, print);

  let now: string;
  try {
    now = git(top, "rev-parse", "HEAD").trim();
  } catch {
    now = "a commit git cannot read";
  }
  if (now !== head) {
    for (const kept of reading.kept) print.err(keptLines(`settle: not put back ${kept.directory}/: HEAD moved from ${head} to ${now} while seal settle --apply ran`, kept));
    print.out("Put back no directory.\n");
    return 2;
  }
  let put = 0;
  let unput = 0;
  for (const kept of reading.kept) {
    try {
      if (!differs(top, kept.directory)) continue;
      git(top, "checkout", "HEAD", "--", `${kept.directory}/`);
    } catch (error) {
      unput += 1;
      print.err(keptLines(`settle: not put back ${kept.directory}/: ${(error as Error).message}`, kept));
      continue;
    }
    put += 1;
    print.out(keptLines(`put back ${kept.directory}/`, kept));
  }
  print.out(`Put back ${put === 0 ? "no directory" : `${put} ${put === 1 ? "directory" : "directories"}`}.\n`);
  return unput > 0 ? 2 : Math.max(theirs, reading.kept.length === 0 ? 0 : 1);
}

/**
 * The command `pnpm --filter @owlery/desktop run settle`, run in `cwd`, which
 * reads the repository whose top git names there. With no flag it prints each
 * kept directory with its rows, each notice, and then the list, and exits 1
 * where it keeps a directory and 0 where it keeps none. `--list` prints the
 * list alone and exits 0. `--since <ref>` names the previous release.
 * `--apply` runs AgenticSeal's settle, with `--released-at <ref>` where one is
 * given, and puts back each directory the reading kept. It exits 2 where it
 * cannot read or do what it was asked to.
 */
export function command(args: readonly string[], cwd: string, print: Printer): number {
  let list = false;
  let applying = false;
  let since: string | undefined;
  let releasedAt: string | undefined;
  let wrong: string | null = null;
  for (let at = 0; at < args.length && wrong === null; at += 1) {
    const arg = args[at];
    const next = args[at + 1];
    const ref = next !== undefined && !next.startsWith("--") ? next : undefined;
    if (arg === "--list") list = true;
    else if (arg === "--apply") applying = true;
    else if ((arg === "--since" || arg === "--released-at") && ref === undefined) wrong = `${arg} names no ref`;
    else if (arg === "--since") {
      since = ref;
      at += 1;
    } else if (arg === "--released-at") {
      releasedAt = ref;
      at += 1;
    } else wrong = `settle does not know \`${arg}\``;
  }
  if (wrong === null && list && applying) wrong = "--list and --apply do not run together";
  if (wrong === null && releasedAt !== undefined && !applying) wrong = "--released-at is read with --apply alone";
  if (wrong !== null) {
    print.err(`${wrong}\n${USAGE}\n`);
    return 2;
  }
  let reading: SettleReading;
  try {
    const top = git(cwd, "rev-parse", "--show-toplevel").trim();
    reading = readSettle(top, since);
    if (applying) return apply(top, reading, releasedAt, print);
  } catch (error) {
    print.err(`settle: ${(error as Error).message}\n`);
    return 2;
  }
  if (list) {
    print.out(listMarkdown(reading));
    return 0;
  }
  const lines: string[] = [];
  if (reading.root === null) lines.push("The repository holds no records root.");
  for (const kept of reading.kept) {
    lines.push(`kept ${kept.directory}/`);
    for (const row of kept.rows) lines.push(`  ${kept.directory}/${RECORD_FILE}:${row.line}: ${row.why}`);
  }
  for (const notice of reading.notices) lines.push(`notice ${notice.directory}/${RECORD_FILE}:${notice.line}: ${notice.why}`);
  const count = reading.kept.length;
  lines.push(count === 0 ? "Kept no directory." : `Kept ${count} ${count === 1 ? "directory" : "directories"} with an open row.`);
  lines.push("", reading.since === null ? "The release's work items are every work item: no release tag is reachable from HEAD." : `The release's work items are those added since ${reading.since}.`, "");
  print.out(`${lines.join("\n")}\n${listMarkdown(reading)}`);
  return reading.kept.length === 0 ? 0 : 1;
}
