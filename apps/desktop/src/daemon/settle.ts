// The release's settle: every work item's `decisions.md` read with the
// daemon's reader, the directories a settle keeps with the rows that keep
// each, and the decisions the release made without asking. It removes no
// directory and runs no other tool.
//
// A directory is kept while its record holds a `reversed` decision, an `open`
// question or a block the reader refuses: a record that cannot be read is not
// a record with nothing open, and a `decisions.md` that stands and cannot be
// opened stops the reading. So does a link where a work item's directory
// stands, a `decisions.md` or a `threads/` that links to nothing, and a
// directory or a `decisions.md` that `HEAD` holds as a link where the working
// tree lacks the record: a record may stand behind each, so none is read as
// nothing. A notice of the reader is
// named and keeps nothing. The release's work items are the directories the
// working tree holds and the previous release's tag does not.
//
// `readSettle` reads the working tree and asks git four things alone: the
// newest release tag, the directories that tag holds, the subject of the
// commit that added each directory's `routing.md`, and each record `HEAD`
// holds that the working tree lacks. It writes nothing.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { RECORD_FILE, readDecisionRecord, type DecisionBlock, type DecisionKind } from "./decision-record";
import { rootOf } from "./records-place";

/** One row of a record that keeps its directory: a reversed decision, an open question, or a refusal of the reader, at its 1-based line. */
export interface KeptRow {
  line: number;
  why: string;
}

/** A directory the settle keeps, relative to the folder, such as `iadd/threads/<id>`, with each row that keeps it. */
export interface KeptDirectory {
  directory: string;
  rows: KeptRow[];
}

/** A work item of the release, by its directory's name, with the pull request its `routing.md` came in by and its decisions in the record's order. */
export interface ListedWorkItem {
  id: string;
  pullRequest: number | null;
  decisions: DecisionBlock[];
  /** Each block of its record the reader refuses, at its 1-based line with the reader's reason, which the list names and cannot list. */
  refused: KeptRow[];
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

/** Throws, naming the path, where what stands there is a link that leads to nothing; returns where nothing stands there at all. */
function nothingStands(folder: string, path: string): void {
  try {
    lstatSync(join(folder, path));
  } catch {
    return;
  }
  throw new Error(`${path} cannot be read: it is a link to nothing`);
}

/**
 * The names of the directories under `threads` in the folder, in order, or
 * none where nothing stands there. A link there, or a `threads` that links to
 * nothing, stops the reading, naming it: a work item's record may stand behind
 * it, so it is not read as nothing.
 */
function directoriesIn(folder: string, threads: string): string[] {
  let entries;
  try {
    entries = readdirSync(join(folder, threads), { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    nothingStands(folder, threads);
    return [];
  }
  const link = entries.find((entry) => entry.isSymbolicLink());
  if (link !== undefined) throw new Error(`${threads}/${link.name} is a link, and the settle reads a work item's directory only where one stands`);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** The record's text, or null where nothing stands at its path. A record that stands and cannot be read throws, naming it, and so does a link to nothing. */
function recordText(folder: string, path: string): string | null {
  try {
    return readFileSync(join(folder, path), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      nothingStands(folder, path);
      return null;
    }
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

/** What `HEAD` holds under `threads`: each work item's record, by its directory's name, as the object git names, and the name of each entry `HEAD` holds there as a link. */
function headOf(folder: string, threads: string): { records: Map<string, string>; links: Set<string> } {
  const records = new Map<string, string>();
  const links = new Set<string>();
  for (const entry of git(folder, "ls-tree", "-r", "-z", "HEAD", "--", `${threads}/`).split("\0")) {
    const match = /^([0-7]{6}) [a-z]+ ([0-9a-f]+)\t(.*)$/s.exec(entry);
    if (match === null) continue;
    const [, mode, object, path] = match as unknown as [string, string, string, string];
    const [id, file, ...deeper] = path.slice(threads.length + 1).split("/");
    if (id === undefined) continue;
    if (file === undefined && mode === "120000") links.add(id);
    if (file !== RECORD_FILE || deeper.length > 0) continue;
    if (mode === "120000") links.add(`${id}/${RECORD_FILE}`);
    else records.set(id, object);
  }
  return { records, links };
}

/** Each row of the record that keeps its directory, in the record's order. */
function rowsOf(got: ReturnType<typeof readDecisionRecord>): KeptRow[] {
  const rows: KeptRow[] = [];
  for (const decision of got.decisions) {
    if (decision.state.is === "reversed") rows.push({ line: decision.line, why: `decision ${decision.id} is reversed; decided: ${decision.decided}; reversal: ${decision.state.message}` });
  }
  for (const question of got.questions) {
    if (question.state.is === "open") rows.push({ line: question.line, why: `question ${question.id} is open; asks: ${question.asks}` });
  }
  for (const refusal of got.refusals) rows.push({ line: refusal.line, why: `the reader refuses the line: ${refusal.why}` });
  return rows.sort((a, b) => a.line - b.line);
}

/**
 * What a settle reads of the folder's records: each directory under
 * `<root>/threads/` in the working tree, committed or not, read with the
 * daemon's reader. Where the working tree lacks a record that `HEAD` holds,
 * as a settle that removed a directory and was stopped before its commit
 * leaves it, the record `HEAD`
 * holds decides whether the directory is kept, and nothing else. `since` names
 * the previous release, by default the newest tag reachable from `HEAD`.
 * Throws where git cannot read `since` or `HEAD`, and where a record stands
 * and cannot be read.
 */
export function readSettle(folder: string, since?: string): SettleReading {
  const root = rootOf(folder);
  if (root === null) return { root, kept: [], notices: [], since: since ?? null, release: [] };
  const threads = `${root}/threads`;
  const from = since ?? newestTag(folder);
  const before = new Set(from === null ? [] : git(folder, "ls-tree", "-z", "--name-only", from, `${threads}/`).split("\0").filter((path) => path !== ""));
  const head = headOf(folder, threads);
  const standing = directoriesIn(folder, threads);

  const kept: KeptDirectory[] = [];
  const notices: SettleReading["notices"] = [];
  const release: ListedWorkItem[] = [];
  /** The rows the record `HEAD` holds for a directory whose record the working tree lacks. */
  const rowsAtHead = (id: string): KeptRow[] => {
    for (const link of [id, `${id}/${RECORD_FILE}`]) {
      if (head.links.has(link)) throw new Error(`${threads}/${link} is a link in HEAD, and the settle reads a record only where one stands`);
    }
    const object = head.records.get(id);
    return object === undefined ? [] : rowsOf(readDecisionRecord(git(folder, "cat-file", "blob", object)));
  };
  for (const id of standing) {
    const directory = `${threads}/${id}`;
    const text = recordText(folder, `${directory}/${RECORD_FILE}`);
    const got = readDecisionRecord(text ?? "");
    const rows = text === null ? rowsAtHead(id) : rowsOf(got);
    if (rows.length > 0) kept.push({ directory, rows });
    for (const notice of got.notices) notices.push({ directory, ...notice });
    if (!before.has(directory)) {
      const refused = got.refusals.map((refusal) => ({ line: refusal.line, why: `the reader refuses the line: ${refusal.why}` }));
      release.push({ id, pullRequest: pullRequestOf(folder, `${directory}/routing.md`), decisions: got.decisions, refused });
    }
  }
  for (const id of new Set([...head.records.keys(), ...[...head.links].map((link) => link.split("/")[0] ?? link)])) {
    if (standing.includes(id)) continue;
    const rows = rowsAtHead(id);
    if (rows.length > 0) kept.push({ directory: `${threads}/${id}`, rows });
  }
  kept.sort((a, b) => (a.directory < b.directory ? -1 : a.directory > b.directory ? 1 : 0));
  return { root, kept, notices, since: from, release };
}

const counted = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Each block of the release's records the reader refuses, as `<record>:<line>` with the reader's reason, in the order of the directories and the lines. */
function refusedIn(reading: SettleReading): { at: string; why: string }[] {
  return reading.release.flatMap((item) => item.refused.map((row) => ({ at: `${reading.root}/threads/${item.id}/${RECORD_FILE}:${row.line}`, why: row.why })));
}

/** A run of backticks to the next run of the same length, as the Markdown specifications read a code span, or one character they read as markup. */
const MARKUP = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)|[\\`*_[\]<>&~|#]/g;

/** A record's value as Markdown that shows what the record holds: its code spans as they stand, and each other markup character escaped with a backslash. */
function literal(value: string): string {
  return value.replace(MARKUP, (match: string, ticks: string | undefined) => (ticks === undefined ? `\\${match}` : match));
}

/** The text as one Markdown code span, its fence a run of backticks longer than any it holds, padded with a space where it opens or ends with one. */
function code(text: string): string {
  const fence = "`".repeat(Math.max(0, ...[...text.matchAll(/`+/g)].map((run) => run[0].length)) + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

/** A decision's state as the list gives it: its word, with the person's message where it holds one. */
function stateOf(decision: DecisionBlock): string {
  const state = decision.state;
  if (state.is === "decided") return "`decided`";
  const word = state.is === "applied" ? `applied ${state.commit}` : state.is === "carried" ? `carried ${state.home}` : "reversed";
  return `${code(word)}: ${literal(state.message)}`;
}

/**
 * The release's decisions made without asking, as Markdown for the release's
 * pull request and its note: one line per kind that occurs, counting its
 * decisions and those the person reversed, and a line counting and naming
 * each block of the release the reader refuses, which the list cannot list;
 * then each work item that holds a decision, in the order of the directories'
 * names.
 */
export function listMarkdown(reading: SettleReading): string {
  const items = reading.release.filter((item) => item.decisions.length > 0);
  const refused = refusedIn(reading);
  if (items.length === 0 && refused.length === 0) return "No decision was made without asking in this release.\n";
  const all = items.flatMap((item) => item.decisions);
  const lines: string[] = [];
  for (const kind of KINDS) {
    const of = all.filter((decision) => decision.kind === kind);
    if (of.length === 0) continue;
    lines.push(`- \`${kind}\`: ${counted(of.length, "decision")}, ${of.filter((decision) => decision.state.is !== "decided").length} reversed by the person`);
  }
  if (refused.length > 0) lines.push(`- Not listed: ${counted(refused.length, "block")} the reader cannot read (${refused.map((block) => code(block.at)).join(", ")})`);
  for (const item of items) {
    lines.push("", `### ${literal(item.id)}${item.pullRequest === null ? "" : ` (#${item.pullRequest})`}`, "");
    for (const decision of item.decisions) {
      lines.push(`- Decision ${decision.id}, \`${decision.kind}\`: ${literal(decision.decided)}`, `  - Grounds: ${literal(decision.grounds)}`);
      if (decision.by !== null) lines.push(`  - By: ${literal(decision.by)}`);
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
 * list alone, names on the error stream each block of the release the reader
 * refuses, and exits 1 where it names one and 0 otherwise. `--since <ref>`
 * names the previous release. A flag it does not know, `--apply` among them,
 * is refused with its usage. It exits 2 where it cannot read or do what it
 * was asked to.
 */
export function command(args: readonly string[], cwd: string, print: Printer): number {
  let list = false;
  let since: string | undefined;
  let wrong: string | null = null;
  for (let at = 0; at < args.length && wrong === null; at += 1) {
    const arg = args[at];
    const next = args[at + 1];
    const ref = next !== undefined && !next.startsWith("--") ? next : undefined;
    if (arg === "--list") list = true;
    else if (arg === "--since" && ref === undefined) wrong = `${arg} names no ref`;
    else if (arg === "--since") {
      since = ref;
      at += 1;
    } else wrong = `settle does not know \`${arg}\``;
  }
  if (wrong !== null) {
    print.err(`${wrong}\n${USAGE}\n`);
    return 2;
  }
  let reading: SettleReading;
  try {
    reading = readSettle(git(cwd, "rev-parse", "--show-toplevel").trim(), since);
  } catch (error) {
    print.err(`settle: ${(error as Error).message}\n`);
    return 2;
  }
  if (list) {
    const refused = refusedIn(reading);
    for (const block of refused) print.err(`settle: not listed ${block.at}: ${block.why}\n`);
    print.out(listMarkdown(reading));
    return refused.length === 0 ? 0 : 1;
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
