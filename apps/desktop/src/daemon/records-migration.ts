// The move of a repository's work records from the earlier form, the one the
// AgenticSeal plugin wrote under `seal/`, to IADD's under `agentory/`, in one
// commit the person reads first (frame of issue #322, "The migration of a
// connected repository"). This is the one module that holds the earlier
// spellings of the records' forms: the earlier root's names and marker, the
// earlier fence, `guarantee.md`, the earlier verdict's words and keys, and
// the earlier names of the inspection's stage and role in two record cells.
// Every other reader reads `agentory/` alone, and a root in the earlier form is
// read here for two things and no more: that it stands, so the repository's
// row and the chain command can name it, and its `Heavy commands`, so the
// runner of a repository that has not moved keeps its turn on the machine.
//
// The plan is made from the commit the checkout stands at, as a setup's is
// (`records-place.ts#planRecords`), and the move writes nothing it cannot
// finish: every record is read with the earlier grammar first, and a line
// that grammar refuses blocks the plan with its file and its line. The move
// rewrites no commit, so the trailers of the history stay, and it reads and
// writes no pull request body.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { ROUTING_FILE, declaredBranch } from "./decision-record";
import { CLOSE_BLOCK, CONFIRMATION_BLOCK, DECISION_BLOCK, FINDING_BLOCK, type Kind, QUESTION_BLOCK, ROUND_BLOCK, ROUND_RECORD, RUN_BLOCK, type Spec, VERDICT_BLOCK, field, gfmLines, read, walk } from "./record-blocks";
import { MARKER, ROOT, WORKFLOW, git, heavyCommandsIn, rootOf, workflowText } from "./records-place";
import { repositoryFileText } from "./repository-file";
import { OWL_CHAIN } from "./workflow";
import { commitRunner } from "./worktrees";

/** The first line of the `README.md` of a records root in the earlier form, which the AgenticSeal plugin wrote. */
export const EARLIER_MARKER = "# What AgenticSeal maintains in seal/";
/** The names a records root in the earlier form took, in the order the plugin looked for them: its own, then the one it took where a project's own `seal/` stood. */
export const EARLIER_ROOTS = ["seal", "agentic-seal"] as const;
/** The workflow a setup of the earlier form wrote, which posted the check `seal`. */
export const EARLIER_WORKFLOW = ".github/workflows/owlery-seal.yml";
/** The subject of the commit that moves the records. */
export const MIGRATE_SUBJECT = "chore: move the work records and the pull request check to IADD's forms";

/** The opener of a block in the earlier form. */
const EARLIER_OPENER = "```seal";
/** The name the inspection's record bore in the earlier form, and the one it bears. */
const EARLIER_INSPECTION = "guarantee.md";
const INSPECTION = "inspection.md";
/** The heading's opening of the record in the earlier form, and in IADD's. */
const EARLIER_HEADING = "# Guarantee: ";
const HEADING = "# Inspection: ";
/** The name of a round record, as `chain-records.ts` reads one. */
const ROUND = /^round-[1-9][0-9]*\.md$/u;

/**
 * The inspector's verdict as the earlier grammar spelt it: `Verdict: sealed`
 * where it now reads `Verdict: cleared`, `judged-by:` where it now reads
 * `inspected-by:`, and no `workflow:` and no `inspector:` line. Every other
 * key is the verdict's own (`record-blocks.ts#VERDICT_BLOCK`).
 */
const EARLIER_VERDICT: Kind = (() => {
  const keys = new Map<string, Spec>();
  for (const [key, its] of VERDICT_BLOCK.keys) {
    if (key === "workflow:" || key === "inspector:") continue;
    if (key === "Verdict:") {
      const source = its.shape.source.replace("(?:cleared|", "(?:sealed|");
      if (source === its.shape.source) throw new Error("the verdict's shape no longer opens with `cleared`, so the earlier one cannot be read off it");
      keys.set(key, { ...its, shape: new RegExp(source, its.shape.flags), says: its.says.replace("`Verdict: cleared`", "`Verdict: sealed`") });
    } else keys.set(key === "inspected-by:" ? "judged-by:" : key, its);
  }
  return { ...VERDICT_BLOCK, keys };
})();

/** A record of a work item's directory that holds blocks, by its path below the directory: the kinds the earlier grammar reads it with, and the kinds IADD's does. */
function blockKinds(path: string): { earlier: readonly Kind[]; now: readonly Kind[] } | null {
  if (path === EARLIER_INSPECTION) return { earlier: [EARLIER_VERDICT], now: [VERDICT_BLOCK] };
  if (path === "trail/gate.md") return { earlier: [RUN_BLOCK], now: [RUN_BLOCK] };
  if (path === "decisions.md") return { earlier: [DECISION_BLOCK, QUESTION_BLOCK], now: [DECISION_BLOCK, QUESTION_BLOCK] };
  if (dirname(path) === "trail/rounds" && ROUND.test(basename(path))) return { earlier: ROUND_RECORD, now: [ROUND_BLOCK, FINDING_BLOCK, CLOSE_BLOCK, CONFIRMATION_BLOCK] };
  return null;
}

/** Whether a `README.md` of that text opens with the earlier marker, its line end taken off. Null is a file that does not stand. */
function opensEarlier(text: string | null): boolean {
  return text?.split("\n", 1)[0]?.replace(/\r+$/u, "") === EARLIER_MARKER;
}

/** A file's text, or null where none stands and where `repositoryFileText` refuses what stands, as `records-place.ts` reads a root's `README.md`. */
function textOf(file: string): string | null {
  try {
    return repositoryFileText(file, "followed");
  } catch {
    return null;
  }
}

/** The records root in the earlier form that stands in a working tree: the first of `EARLIER_ROOTS` whose `README.md` opens with the earlier marker, or null where none does. Its records are not read. */
export function earlierRootOf(folder: string): string | null {
  return EARLIER_ROOTS.find((root) => opensEarlier(textOf(join(folder, root, "README.md")))) ?? null;
}

/**
 * The heavy commands a working tree names, with the root they were read
 * from: the records root's (`records-place.ts#readHeavyCommands`), and
 * where no root stands, the one in the earlier form's, whose `config.json`
 * names them under the same key. Nothing else of an earlier root is read.
 */
export function heavyCommandsOf(folder: string): { root: string | null; commands: Record<string, string> } {
  const root = rootOf(folder) ?? earlierRootOf(folder);
  return { root, commands: root === null ? {} : heavyCommandsIn(folder, root) };
}

/**
 * Why a chain cannot run on a worktree's branch while its records stand in
 * the earlier form, as a sentence that names the chain command's `migrate`,
 * or null where they do not. They do where the worktree holds no records
 * root and holds one in the earlier form, and where it holds the records
 * root and a directory under the earlier root's `threads/` whose
 * `routing.md` names the branch: a branch that merged a base that moved
 * keeps its own records where they were. They do too where the directory
 * under the records root's `threads/` whose `routing.md` names the branch
 * holds a `guarantee.md`, or a record the earlier form wrote, as `rewrite`
 * tells one below IADD's root: a merge that took git's proposal of a place
 * under the moved folder (`CONFLICT (file location)`) puts there what the
 * branch added in the earlier form. The
 * sentence says, before the move, that an inspection cleared before it
 * lapses at its commit.
 */
export function earlierRecordsSays(worktree: string, branch: string | null): string | null {
  const migrate =
    "The chain command's `migrate` moves them to IADD's forms in one commit on this branch; run it in the worktree, and commit nothing else with it. An inspection cleared before the move lapses at the move's commit, since the move changes paths outside each work item's closing records, and a work item inspected on the move's commit is cleared.";
  if (rootOf(worktree) === null) {
    const earlier = earlierRootOf(worktree);
    return earlier === null ? null : `The worktree's work records stand in ${earlier}/, in the form the AgenticSeal plugin wrote, which Owlery reads no record of. ${migrate}`;
  }
  if (branch === null) return null;
  for (const root of EARLIER_ROOTS) {
    let names: string[];
    try {
      names = readdirSync(join(worktree, root, "threads")).sort();
    } catch {
      continue;
    }
    const own = names.find((name) => declaredBranch(textOf(join(worktree, root, "threads", name, ROUTING_FILE)) ?? "") === branch);
    if (own !== undefined) return `This work item's records stand in ${root}/threads/${own}/, in the form the AgenticSeal plugin wrote, and the branch's records root is ${ROOT}/. ${migrate}`;
  }
  let held: string[];
  try {
    held = readdirSync(join(worktree, ROOT, "threads")).sort();
  } catch {
    return null;
  }
  const here = held.find((name) => declaredBranch(textOf(join(worktree, ROOT, "threads", name, ROUTING_FILE)) ?? "") === branch);
  if (here === undefined) return null;
  const directory = join(worktree, ROOT, "threads", here);
  let rounds: string[];
  try {
    rounds = readdirSync(join(directory, "trail", "rounds")).filter((name) => ROUND.test(name));
  } catch {
    rounds = [];
  }
  // The records the earlier form wrote in the directory, by their path in it, as `rewrite` tells one below IADD's root; a record IADD's form wrote is not one, whatever fence its prose shows.
  const earlier =
    textOf(join(directory, EARLIER_INSPECTION)) !== null ||
    ["decisions.md", "trail/gate.md", "trail/refusals.md", ...rounds.map((name) => `trail/rounds/${name}`)].some((inside) => {
      const text = textOf(join(directory, inside));
      const after = text === null ? null : rewrite(`threads/${here}/${inside}`, text, true);
      return after !== null && after !== text;
    });
  return earlier ? `This work item's directory ${ROOT}/threads/${here}/ holds records in the form the AgenticSeal plugin wrote, which a merge of a base that moved put there. ${migrate}` : null;
}

// ---------------------------------------------------------------------------
// The rewrite of one record. Each function takes the record's text and gives
// it with the earlier spellings rewritten and every other byte as it stood,
// each line's own end among them.

/** The text as its lines and the ends between them: the even entries are the lines, as `record-blocks.ts#gfmLines` gives them, and each odd entry the end that follows the line before it. */
function parts(text: string): string[] {
  return text.split(/(\r\n|\r|\n)/u);
}

/**
 * The text with each block opener of the earlier form, a line that is three
 * backticks and `seal` alone where the walk opens a fence, rewritten as
 * IADD's. With `stray`, each opener of IADD's form the text already holds,
 * which the earlier form read as no block, is written as a fence of no
 * info, so IADD's reader reads it as the earlier one did.
 */
function fencesMoved(text: string, stray: "kept" | "unread" = "kept"): string {
  const all = parts(text);
  for (const [index] of walk(gfmLines(text)).opens) {
    if (all[2 * index] === EARLIER_OPENER) all[2 * index] = "```iadd";
    else if (all[2 * index] === "```iadd" && stray === "unread") all[2 * index] = "```";
  }
  return all.join("");
}

/**
 * A record whose blocks the earlier grammar reads, with its openers moved:
 * the text, and the earlier grammar's reading of it, through IADD's reader
 * of the same lines. Refusals are the earlier grammar's, each at its line of
 * the earlier text.
 */
function readEarlier(text: string, kinds: { earlier: readonly Kind[] }): { moved: string; got: ReturnType<typeof read> } {
  return { moved: fencesMoved(text), got: read(fencesMoved(text, "unread"), kinds.earlier) };
}

/**
 * The inspection's record in IADD's spelling, from `guarantee.md`'s: the
 * first line `# Guarantee: <work item>` reads `# Inspection: <work item>`,
 * each opener is moved, and inside each verdict block `Verdict: sealed`
 * reads `Verdict: cleared`, `judged-by:` reads `inspected-by:`, and a block
 * that holds a `rules:` line, which the owl chain alone wrote, gains
 * `workflow: owl-chain` and `inspector: owl-chain` after it.
 */
export function inspectionFromGuarantee(text: string): string {
  const { moved, got } = readEarlier(text, { earlier: [EARLIER_VERDICT] });
  const all = parts(moved);
  if (all[0]?.startsWith(EARLIER_HEADING)) all[0] = `${HEADING}${all[0].slice(EARLIER_HEADING.length)}`;
  for (const block of got.blocks) {
    const at = (line: number): number => 2 * (line - 1);
    const verdict = field(block, "Verdict:");
    if (verdict?.value === "sealed") all[at(verdict.line)] = "Verdict: cleared";
    const judged = field(block, "judged-by:");
    if (judged !== undefined) all[at(judged.line)] = `inspected-by: ${judged.value}`;
    const rules = field(block, "rules:");
    if (rules !== undefined) {
      const end = all[at(rules.line) + 1] ?? "\n";
      all[at(rules.line)] = `${all[at(rules.line)] ?? ""}${end}workflow: ${OWL_CHAIN}${end}inspector: ${OWL_CHAIN}`;
    }
  }
  return all.join("");
}

/** A `decisions.md` in IADD's spelling: each opener moved, and a question's or a decision's `by: sealer` reads `by: inspector`, the role that asks now. */
export function decisionsMoved(text: string): string {
  const { moved, got } = readEarlier(text, { earlier: [DECISION_BLOCK, QUESTION_BLOCK] });
  const all = parts(moved);
  for (const block of got.blocks) {
    const by = field(block, "by:");
    if (by?.value === "sealer") all[2 * (by.line - 1)] = "by: inspector";
  }
  return all.join("");
}

/**
 * A `trail/refusals.md` in IADD's spelling: in each row of five cells, a
 * stage cell `seal <round>` reads `inspection <round>`, and a role cell
 * `sealer` reads `inspector`, each cell's spaces as they stood. Every other
 * line, the heading's rows among them, stands as it was.
 */
export function refusalsMoved(text: string): string {
  const all = parts(text);
  for (let index = 0; index < all.length; index += 2) {
    const line = all[index] ?? "";
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    const cells = line.slice(1, -1).split("|");
    if (cells.length !== 5) continue;
    cells[0] = (cells[0] ?? "").replace(/^(\s*)seal (0|[1-9][0-9]*)(\s*)$/u, "$1inspection $2$3");
    cells[1] = (cells[1] ?? "").replace(/^(\s*)sealer(\s*)$/u, "$1inspector$2");
    all[index] = `|${cells.join("|")}|`;
  }
  return all.join("");
}

/** A root's `README.md` with its first line the marker of IADD's root, and every other line as it stood. */
export function readmeMoved(text: string): string {
  const all = parts(text);
  all[0] = MARKER;
  return all.join("");
}

// ---------------------------------------------------------------------------
// The plan and the move.

/** What the move of a checkout's records from the earlier form would commit, or why it cannot. */
export interface MigrationPlan {
  /** The branch the commit lands on, or null where the checkout stands on none. */
  branch: string | null;
  subject: string;
  /** The root in the earlier form the plan moves from, whole or its `threads/` alone, or null where the commit holds none and the plan rewrites only records below IADD's root. */
  from: string | null;
  /** Each file the plan moves of that root, and each record in the earlier form below IADD's root, by its path in the commit and the path it moves to, the same for a record rewritten where it stands, and whether its text is rewritten, in the commit's order. */
  moves: { from: string; to: string; rewritten: boolean }[];
  /** The files the commit removes without moving: the earlier workflow, where the commit holds it. */
  removes: string[];
  /** The files the commit writes whole: Owlery's workflow for the app's version, where the commit holds none. */
  writes: { path: string; text: string }[];
  /** Why the move cannot be made, as a sentence the window shows as it is, or null. */
  blocked: string | null;
  /** A text that differs wherever the commit, the branch, a move or a file's text differs. A move carries the stamp of the plan the person read. */
  stamp: string;
}

/** The modes git gives a file: one it cannot run, and one it can. */
const FILE_MODES = ["100644", "100755"];

/** The bytes of a file a commit holds, as git stores them. It throws with git's words where git cannot read them. */
function blob(folder: string, commit: string, path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile("git", ["cat-file", "blob", `${commit}:${path}`], { cwd: folder, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.toString("utf8").trim() || `git could not read ${path} of the commit`));
      else resolve(stdout);
    });
  });
}

/** The names in a sentence: one, two with "and", or more with commas and "and". */
function named(names: readonly string[]): string {
  return names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

/**
 * The path a file of the earlier root moves to, by its path below that
 * root: the same path below `agentory/`, but for a work item's `guarantee.md`,
 * which moves to its `inspection.md`.
 */
function movedPath(below: string): string {
  const [threads, id, name, ...rest] = below.split("/");
  const renamed = threads === "threads" && id !== undefined && name === EARLIER_INSPECTION && rest.length === 0 ? `threads/${id}/${INSPECTION}` : below;
  return `${ROOT}/${renamed}`;
}

/**
 * The text a file of the earlier root moves with, by its path below that
 * root, or null for a file that moves as it stands. With `stray`, the file
 * stands below IADD's root, where a record of blocks was written in the
 * earlier form only where IADD's grammar reads none of its blocks. A record
 * of IADD's form that shows a fence of info `seal` in its prose reads its own
 * blocks in IADD's grammar, so it gives null and stays as it is. One that
 * holds no block IADD's grammar reads is read with the earlier grammar, which
 * names each line it refuses, as an earlier root's record is.
 */
function rewrite(below: string, text: string, stray = false): string | null {
  if (below === "README.md") return readmeMoved(text);
  const [threads, id, ...rest] = below.split("/");
  if (threads !== "threads" || id === undefined || rest.length === 0) return null;
  const inside = rest.join("/");
  if (inside === EARLIER_INSPECTION) return inspectionFromGuarantee(text);
  if (inside === "trail/refusals.md") return refusalsMoved(text);
  const kinds = blockKinds(inside);
  if (kinds === null) return null;
  if (stray && read(text, kinds.now).blocks.length > 0) return null;
  return inside === "decisions.md" ? decisionsMoved(text) : fencesMoved(text);
}

/**
 * What the records of a checkout would move with, from the commit it stands
 * at, and why the move cannot be made. Nothing is written.
 *
 * The root moved is the first of `EARLIER_ROOTS` whose `README.md` the
 * commit holds with the earlier marker, the whole root, or, where the commit
 * holds IADD's root, the first under whose `threads/` it holds a file, of
 * which the plan moves that `threads/` alone: what a branch kept of the
 * earlier root after it merged a base that moved. Each file the commit holds
 * below what the plan moves goes to the same path below `agentory/`, a work
 * item's `guarantee.md` to its `inspection.md`. Where the commit holds IADD's
 * root, each file of a work item's directory below it that is a
 * `guarantee.md` moves to that directory's `inspection.md`, and each record
 * there the earlier form wrote, as `rewrite` tells one below IADD's root, is
 * rewritten where it stands: a merge
 * that took git's proposal of a place under the moved folder (`CONFLICT
 * (file location)`) put there what a branch added in the earlier form. Every
 * other file below IADD's root is IADD's form already and stays out of the
 * plan. A record that holds blocks
 * moves with its openers as `iadd` ones, and `guarantee.md`,
 * `decisions.md`, `trail/refusals.md` and the root's `README.md` with the
 * lines `inspectionFromGuarantee`, `decisionsMoved`, `refusalsMoved` and
 * `readmeMoved` rewrite. Every other file moves as it stands. The commit
 * removes `EARLIER_WORKFLOW` where it holds that file, and writes Owlery's
 * workflow for `version` where it holds none.
 *
 * The plan is blocked by the first of these that holds: the commit holds no
 * root in the earlier form and no record of that form below IADD's root; it
 * holds something other than a file below that
 * root; it holds a whole root in the earlier form and something at `agentory/`;
 * it holds something at a path a file moves to; it holds something other
 * than a file at Owlery's workflow; the earlier grammar refuses a line of a
 * record, which is named with its file and its line, as is a record that
 * would read otherwise in IADD's grammar than in the earlier one; the
 * checkout differs from the commit at a path the move reads or writes, as
 * git's status reports it, each path named; git ignores a path the move
 * writes; no branch is checked out. It throws with git's words where git
 * cannot read the commit.
 */
export async function planMigration(folder: string, version: string): Promise<MigrationPlan> {
  return (await planned(folder, version)).plan;
}

/** The plan `planMigration` gives, with the bytes or the text each file the plan moves goes with, by its path in the commit. */
async function planned(folder: string, version: string): Promise<{ plan: MigrationPlan; texts: Map<string, string | Buffer> }> {
  const inside = await git(folder, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.code !== 0 || inside.stdout.trim() !== "true") throw new Error(inside.stderr.trim() || `${folder} is no checkout of a repository`);
  const [atHead, onBranch] = await Promise.all([git(folder, ["rev-parse", "--verify", "--quiet", "HEAD"]), git(folder, ["symbolic-ref", "--quiet", "--short", "HEAD"])]);
  const head = atHead.code === 0 ? atHead.stdout.trim() : null;
  const branch = onBranch.code === 0 ? onBranch.stdout.trim() : null;
  const texts = new Map<string, string | Buffer>();
  const plan = (from: string | null, moves: MigrationPlan["moves"], removes: string[], writes: MigrationPlan["writes"], blocked: string | null): { plan: MigrationPlan; texts: Map<string, string | Buffer> } => ({
    plan: {
      branch,
      subject: MIGRATE_SUBJECT,
      from,
      moves,
      removes,
      writes,
      blocked,
      // The text each file moves with is in the stamp, so a record edited and committed again between the plan and the move is refused.
      stamp: createHash("sha256")
        .update(JSON.stringify([head, branch, from, moves, removes, writes]))
        .update(JSON.stringify([...texts].map(([path, text]) => [path, typeof text === "string" ? text : text.toString("base64")])))
        .digest("hex"),
    },
    texts,
  });
  const none = "The commit this checkout stands at holds no work records in the form the AgenticSeal plugin wrote, so there is nothing to move.";
  if (head === null) return plan(null, [], [], [], none);

  const tree = await git(folder, ["ls-tree", "-r", "-z", head, "--", ...EARLIER_ROOTS, ROOT, ".github"]);
  if (tree.code !== 0) throw new Error(tree.stderr.trim() || "git could not list the commit's records");
  const inCommit = new Map<string, string>();
  for (const entry of tree.stdout.split("\0")) {
    const tab = entry.indexOf("\t");
    if (tab !== -1) inCommit.set(entry.slice(tab + 1), entry.slice(0, entry.indexOf(" ")));
  }
  const holdsFile = (path: string): boolean => FILE_MODES.includes(inCommit.get(path) ?? "");
  const holds = (path: string): boolean => [...inCommit.keys()].some((held) => held === path || held.startsWith(`${path}/`));
  const textAt = async (path: string): Promise<string | null> => (holdsFile(path) ? (await blob(folder, head, path)).toString("utf8") : null);

  const whole = await (async () => {
    for (const root of EARLIER_ROOTS) if (opensEarlier(await textAt(`${root}/README.md`))) return root;
    return null;
  })();
  const rooted = whole === null && (await textAt(`${ROOT}/README.md`))?.split("\n", 1)[0]?.replace(/\r+$/u, "") === MARKER;
  // A branch keeps the earlier root's `threads/` alone, as `earlierRecordsSays` reads it, and a project's own `seal/` beside IADD's root is no part of it.
  const keptByBranch = rooted ? (EARLIER_ROOTS.find((root) => [...inCommit.keys()].some((held) => held.startsWith(`${root}/threads/`))) ?? null) : null;
  const from = whole ?? keptByBranch;
  // What the move takes: the whole earlier root, or the `threads/` a branch kept of it.
  const moving = from === null ? null : whole === null ? `${from}/threads` : from;
  // Below IADD's root, each file of a work item's directory is read too: a merge that took git's proposal of a place under the moved folder put there what the branch added in the earlier form.
  const strayed = rooted ? [...inCommit.keys()].filter((path) => path.startsWith(`${ROOT}/threads/`) && holdsFile(path)) : [];

  const below = moving === null ? [] : [...inCommit.keys()].filter((path) => path.startsWith(`${moving}/`));
  const moves: MigrationPlan["moves"] = [];
  const refused: string[] = [];
  const candidates = new Set([...below, ...strayed]);
  for (const path of [...inCommit.keys()].filter((path) => candidates.has(path))) {
    if (!holdsFile(path)) continue;
    const stray = from === null || !path.startsWith(`${from}/`);
    const rest = path.slice((stray ? ROOT : from).length + 1);
    const bytes = await blob(folder, head, path);
    const before = bytes.toString("utf8");
    const after = rewrite(rest, before, stray);
    // A file below IADD's root moves only where it is a work item's `guarantee.md` or a record the earlier form wrote, which `rewrite` tells there; the rest is IADD's form already.
    if (stray && movedPath(rest) === path && (after === null || after === before)) continue;
    // Each record that holds blocks is read with the earlier grammar, and what it moves with in IADD's, which reads as many blocks at the same lines.
    const [threads, id, ...within] = rest.split("/");
    const kinds = threads === "threads" && id !== undefined ? blockKinds(within.join("/")) : null;
    if (kinds !== null) {
      const earlier = readEarlier(before, kinds).got;
      for (const refusal of earlier.refusals) refused.push(`\`${path}:${String(refusal.line)}\`: ${refusal.why.replaceAll("`iadd`", "`seal`")}`);
      const now = read(after ?? before, kinds.now);
      const same = now.refusals.length === 0 && now.blocks.length === earlier.blocks.length && now.blocks.every((block, at) => block.line === earlier.blocks[at]?.line);
      if (earlier.refusals.length === 0 && !same) refused.push(`\`${path}\`: its blocks would read otherwise in IADD's form than in the earlier one, ${now.refusals[0] === undefined ? "since a fence the earlier form read as no block would open one" : `at line ${String(now.refusals[0].line)}: ${now.refusals[0].why}`}`);
    }
    moves.push({ from: path, to: movedPath(rest), rewritten: after !== null && after !== before });
    texts.set(path, after === null ? bytes : after);
  }
  if (from === null && moves.length === 0) return plan(null, [], [], [], none);
  const removes = holdsFile(EARLIER_WORKFLOW) ? [EARLIER_WORKFLOW] : [];
  const writes = holds(WORKFLOW) ? [] : [{ path: WORKFLOW, text: workflowText(version) }];
  const written = [...moves.map((move) => move.to), ...writes.map((write) => write.path)];

  const odd = below.filter((path) => !holdsFile(path));
  // A record rewritten where it stands takes no other path.
  const taken = moves.filter((move) => move.to !== move.from && holds(move.to)).map((move) => move.to);
  let blocked: string | null = null;
  if (odd.length > 0) blocked = `The commit this checkout stands at holds something other than a file at ${named(odd)}, and the move moves files alone. Rename or remove it in a commit, and open this again.`;
  else if (whole !== null && holds(ROOT)) blocked = `${ROOT}/ holds something of this repository's own, so Owlery has no folder to move the work records to. Rename that folder in a commit, and open this again.`;
  else if (taken.length > 0) blocked = `The commit this checkout stands at holds ${named(taken)} already, where the move puts ${from === null ? "a record in the earlier form" : `a file of ${from}/`}. Rename or remove it in a commit, and open this again.`;
  else if (holds(WORKFLOW) && !holdsFile(WORKFLOW)) blocked = `The commit this checkout stands at holds something other than a file at ${WORKFLOW}, where the check's workflow stands. Rename it in a commit, and open this again.`;
  else if (refused.length > 0) blocked = `The earlier form's reader refuses ${refused.length === 1 ? "a line" : `${String(refused.length)} lines`} of these records, so Owlery cannot move them as they mean: ${refused.join("; ")}. Fix each line named in a commit, and open this again.`;
  if (blocked !== null) return plan(from, moves, removes, writes, blocked);

  const status = await git(folder, ["--no-optional-locks", "status", "--porcelain=v1", "-z", "--no-renames", "--untracked-files=all", "--", ...(moving === null ? [] : [moving]), ROOT, EARLIER_WORKFLOW, WORKFLOW]);
  if (status.code !== 0) throw new Error(status.stderr.trim() || "git could not say how the checkout differs from its commit");
  const differing = [...new Set(status.stdout.split("\0").filter((entry) => entry !== "").map((entry) => entry.slice(3)))];
  const ignored = await git(folder, ["check-ignore", "--no-index", "--", ...written]);
  if (ignored.code !== 0 && ignored.code !== 1) throw new Error(ignored.stderr.trim() || "git could not say whether it ignores the paths the move writes");
  const ignoredPaths = ignored.stdout.split("\n").filter((path) => path !== "");
  if (differing.length > 0) blocked = `This checkout does not hold ${named(differing)} as the commit it stands at does. Owlery moves the records as the commit holds them: commit what is named or put it back as the commit has it, and open this again.`;
  else if (ignoredPaths.length > 0) blocked = `Git ignores ${named(ignoredPaths)} in this repository, so the move cannot commit ${ignoredPaths.length === 1 ? "it" : "them"}. A repository that cannot keep work records in its tree is out of scope for Owlery.`;
  else if (branch === null) blocked = "No branch is checked out here, so the commit has no branch to land on. Check a branch out and open this again.";
  return plan(from, moves, removes, writes, blocked);
}

/**
 * Moves a checkout's records from the earlier form, after the person read
 * the plan: the plan is made again, and the move is refused where its stamp
 * is not `stamp` and where it is blocked. Each file moves to its path with
 * the text the plan gives it and its mode, each created where nothing
 * stands, but a record below IADD's root that the plan rewrites where it
 * stands, which is written over; each file the plan moves to another path
 * and the earlier workflow is removed from the index and the checkout.
 * Those paths alone are staged and committed, on the branch the checkout
 * stands on, with the person's git identity and
 * the repository's hooks, under `limitMs` as
 * `records-place.ts#setUpRecords` runs its commit, and nothing is pushed.
 * Where a write or the commit fails, those paths are unstaged, the files
 * and folders this call made are removed, the removed files and the records
 * written over are put back as the commit holds them, and the error holds
 * git's words.
 */
export async function migrateRecords(folder: string, version: string, stamp: string, limitMs?: number): Promise<void> {
  const { plan, texts } = await planned(folder, version);
  if (plan.stamp !== stamp) throw new Error("The repository changed since the plan was read. Read the plan again.");
  if (plan.blocked !== null) throw new Error(plan.blocked);
  const head = (await git(folder, ["rev-parse", "HEAD"])).stdout.trim();
  const modes = new Map<string, string>();
  const tree = await git(folder, ["ls-tree", "-r", "-z", head, "--", ...(plan.from === null ? [] : [plan.from]), ROOT]);
  for (const entry of tree.stdout.split("\0")) {
    const tab = entry.indexOf("\t");
    if (tab !== -1) modes.set(entry.slice(tab + 1), entry.slice(0, entry.indexOf(" ")));
  }
  const madeFiles: string[] = [];
  const madeFolders: string[] = [];
  const overwritten: string[] = [];
  const written = [...plan.moves.map((move) => move.to), ...plan.writes.map((write) => write.path)];
  // Each file the plan moves to another path is removed where it stood: each file of the earlier root it moves, and a `guarantee.md` below IADD's root. Nothing else of the earlier root's folder is touched.
  const removed = [...plan.moves.filter((move) => move.to !== move.from).map((move) => move.from), ...plan.removes];
  const write = (path: string, content: string | Buffer, mode: string, over = false): void => {
    if (over) {
      // The plan found the record in the checkout as the commit holds it, so the commit's is what is put back.
      writeFileSync(join(folder, path), content);
      overwritten.push(path);
      return;
    }
    const missing: string[] = [];
    for (let above = dirname(path); above !== "." && !standsAt(join(folder, above)); above = dirname(above)) missing.unshift(above);
    for (const made of missing) {
      mkdirSync(join(folder, made));
      madeFolders.push(made);
    }
    // `wx` refuses a path at which something stands, so nothing of the person's is written over.
    writeFileSync(join(folder, path), content, { flag: "wx" });
    madeFiles.push(path);
    if (mode === "100755") chmodSync(join(folder, path), 0o755);
  };
  let staged = false;
  try {
    for (const move of plan.moves) write(move.to, texts.get(move.from) ?? "", modes.get(move.from) ?? "100644", move.to === move.from);
    for (const each of plan.writes) write(each.path, each.text, "100644");
    staged = true;
    if (removed.length > 0) {
      const removal = await git(folder, ["rm", "-r", "--quiet", "--", ...removed]);
      if (removal.code !== 0) throw new Error(removal.stderr.trim() || "git rm failed");
    }
    const bounded = commitRunner({ limitMs });
    const added = await bounded(folder, ["add", "--", ...written]);
    if (added.ended !== null) throw new Error(added.ended);
    if (added.code !== 0) throw new Error(added.said || "git add failed");
    const committed = await bounded(folder, ["commit", "-m", plan.subject, "--", ...written, ...removed]);
    if (committed.ended !== null) {
      // A commit ended in a hook that runs after it, such as `post-commit`, was made: the index then holds each path as the commit does.
      if ((await git(folder, ["diff", "--cached", "--quiet", "--", ...written, ...removed])).code !== 0) throw new Error(committed.ended);
    } else if (committed.code !== 0) throw new Error(committed.said || "git commit failed");
  } catch (error) {
    if (staged) {
      await git(folder, ["reset", "--quiet", "--", ...written, ...removed]).catch(() => undefined);
    }
    // The plan found each removed file and each record written over as the commit holds it, so the commit's is what is put back.
    const back = [...(staged ? removed : []), ...overwritten];
    if (back.length > 0) await git(folder, ["checkout", head, "--", ...back]).catch(() => undefined);
    for (const path of madeFiles) rmSync(join(folder, path), { force: true });
    for (const made of madeFolders.reverse()) {
      try {
        // Only an empty folder goes: one that gained a file meanwhile stays.
        rmdirSync(join(folder, made));
      } catch {
        // The refusal of the move is what the person is told.
      }
    }
    throw error;
  }
}

/** Whether anything stands at a path, a link that leads nowhere among it. */
function standsAt(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}
