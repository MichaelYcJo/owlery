// The release's settle, as far as it reads: every work item's `decisions.md`
// read with the daemon's reader, the directories a settle keeps with the rows
// that keep each, and the decisions the release made without asking.
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
// commit that added each directory's `routing.md`. Nothing here writes.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

const USAGE = "usage: settle [--list] [--since <ref>]";

/**
 * The command `pnpm --filter @owlery/desktop run settle`, run in `cwd`, which
 * reads the repository whose top git names there. With no flag it prints each
 * kept directory with its rows, each notice, and then the list, and exits 1
 * where it keeps a directory and 0 where it keeps none. `--list` prints the
 * list alone and exits 0. `--since <ref>` names the previous release. It exits
 * 2 where it cannot read what it was asked to.
 */
export function command(args: readonly string[], cwd: string, print: Printer): number {
  let list = false;
  let since: string | undefined;
  for (let at = 0; at < args.length; at += 1) {
    const arg = args[at];
    if (arg === "--list") list = true;
    else if (arg === "--since" && args[at + 1] !== undefined && !args[at + 1]?.startsWith("--")) {
      since = args[at + 1];
      at += 1;
    } else {
      print.err(`${arg === "--since" ? "--since names no ref" : `settle does not know \`${arg}\``}\n${USAGE}\n`);
      return 2;
    }
  }
  let reading: SettleReading;
  try {
    reading = readSettle(git(cwd, "rev-parse", "--show-toplevel").trim(), since);
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
